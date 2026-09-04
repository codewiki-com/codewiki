---
title: async-std Async Runtime Framework
description: A comprehensive guide to async-std, Rust's async runtime library that provides asynchronous versions of std library components with a familiar API.
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
origin: old/src/content/docs/rust/async-std.en.md
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

## Concept Explanation

async-std is an asynchronous runtime for Rust that mirrors the standard library's API while providing async/await support. It was designed to make async programming in Rust feel as natural as synchronous programming by offering async versions of familiar std types like `File`, `TcpStream`, and `Mutex`.

The library serves as an alternative to tokio, focusing on simplicity and a gentle learning curve. It provides:

- Async I/O primitives (files, networking, timers)
- Task spawning and scheduling
- Synchronization primitives (Mutex, RwLock, channels)
- Stream processing utilities
- A work-stealing task scheduler

async-std follows Rust's philosophy of zero-cost abstractions, meaning you only pay for what you use, and the async overhead is minimal when properly optimized.

## Core Principles

### The async-std Runtime Model

async-std uses a multi-threaded work-stealing scheduler by default. When you call `async_std::task::block_on()` or spawn tasks, the runtime manages their execution across a thread pool.

```rust
use async_std::task;

fn main() {
    task::block_on(async {
        println!("Hello from async-std!");
    });
}
```

### Futures and Task Execution

In async-std, futures are lazy - they don't execute until polled. The runtime polls futures to completion, handling the complex state machine under the hood.

```rust
use async_std::task;
use std::time::Duration;

async fn delayed_greeting(name: &str, delay: u64) -> String {
    task::sleep(Duration::from_secs(delay)).await;
    format!("Hello, {}!", name)
}

fn main() {
    task::block_on(async {
        let greeting = delayed_greeting("World", 1).await;
        println!("{}", greeting);
    });
}
```

### Cooperative Scheduling

async-std uses cooperative scheduling, meaning tasks voluntarily yield control at await points. Long-running synchronous code can block the executor, so it's important to use async versions of blocking operations.

## Key Concepts

### 1. Task Spawning

Tasks are the basic unit of concurrent execution in async-std.

```rust
use async_std::task;

async fn compute(id: u32) -> u32 {
    task::sleep(std::time::Duration::from_millis(100)).await;
    id * 2
}

fn main() {
    task::block_on(async {
        // Spawn concurrent tasks
        let handle1 = task::spawn(compute(1));
        let handle2 = task::spawn(compute(2));
        let handle3 = task::spawn(compute(3));

        // Await results
        let results = (handle1.await, handle2.await, handle3.await);
        println!("Results: {:?}", results); // (2, 4, 6)
    });
}
```

### 2. Async I/O

async-std provides async versions of standard I/O operations.

```rust
use async_std::fs::File;
use async_std::io::{ReadExt, WriteExt};
use async_std::prelude::*;

async fn file_operations() -> std::io::Result<()> {
    // Write to file
    let mut file = File::create("example.txt").await?;
    file.write_all(b"Hello, async-std!").await?;

    // Read from file
    let mut file = File::open("example.txt").await?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).await?;
    println!("File contents: {}", contents);

    Ok(())
}
```

### 3. Networking

TCP and UDP networking with async operations.

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
    println!("Server listening on port 8080");

    while let Ok((stream, addr)) = listener.accept().await {
        println!("New connection from {}", addr);
        task::spawn(handle_client(stream));
    }
    Ok(())
}
```

### 4. Synchronization Primitives

async-std provides async-aware synchronization types.

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

    println!("Counter: {}", *counter.lock().await);
}
```

### 5. Channels

async-std provides bounded and unbounded channels for communication.

```rust
use async_std::channel;
use async_std::task;

async fn channel_example() {
    let (sender, receiver) = channel::bounded::<i32>(10);

    // Producer
    let producer = task::spawn(async move {
        for i in 0..5 {
            sender.send(i).await.unwrap();
            println!("Sent: {}", i);
        }
    });

    // Consumer
    let consumer = task::spawn(async move {
        while let Ok(value) = receiver.recv().await {
            println!("Received: {}", value);
        }
    });

    producer.await;
    consumer.await;
}
```

## Code Examples

### Example 1: Concurrent HTTP Requests

```rust
use async_std::task;
use std::time::Instant;

// Simulated HTTP request
async fn fetch_url(url: &str) -> Result<String, String> {
    task::sleep(std::time::Duration::from_millis(100)).await;
    Ok(format!("Response from {}", url))
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

    println!("Fetched {} URLs in {:?}", results.len(), start.elapsed());
    for result in results {
        println!("  {:?}", result);
    }
}

fn main() {
    task::block_on(fetch_all_concurrent());
}
```

### Example 2: Timeout Handling

```rust
use async_std::task;
use async_std::future::timeout;
use std::time::Duration;

async fn slow_operation() -> &'static str {
    task::sleep(Duration::from_secs(5)).await;
    "Operation completed"
}

async fn with_timeout() {
    match timeout(Duration::from_secs(2), slow_operation()).await {
        Ok(result) => println!("Success: {}", result),
        Err(_) => println!("Operation timed out"),
    }
}

fn main() {
    task::block_on(with_timeout());
}
```

### Example 3: Stream Processing

```rust
use async_std::prelude::*;
use async_std::stream;
use async_std::task;
use std::time::Duration;

async fn stream_example() {
    // Create an interval stream
    let mut interval = stream::interval(Duration::from_millis(100));
    let mut count = 0;

    while let Some(_) = interval.next().await {
        count += 1;
        println!("Tick {}", count);
        if count >= 5 {
            break;
        }
    }

    // Process a stream with map and filter
    let numbers = stream::from_iter(1..=10);
    let sum: i32 = numbers
        .filter(|n| futures::future::ready(n % 2 == 0))
        .map(|n| n * 2)
        .fold(0, |acc, n| futures::future::ready(acc + n))
        .await;

    println!("Sum of doubled even numbers: {}", sum);
}

fn main() {
    task::block_on(stream_example());
}
```

### Example 4: TCP Echo Server with Connection Pooling

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
            println!("Accepted connection from {}", addr);
            let server = Arc::clone(&server);
            task::spawn(async move {
                if let Err(e) = handle_connection(stream, server).await {
                    eprintln!("Connection error: {}", e);
                }
            });
        } else {
            println!("Rejected connection from {} (limit reached)", addr);
        }
    }

    Ok(())
}
```

## Best Practices

### 1. Use the Prelude for Convenience

```rust
// Import common traits and types
use async_std::prelude::*;

// Now you can use extension methods directly
async fn example() {
    let mut file = async_std::fs::File::open("test.txt").await.unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).await.unwrap();
}
```

### 2. Prefer spawn_blocking for CPU-bound Work

```rust
use async_std::task;

async fn cpu_intensive() {
    // Don't block the async runtime with CPU-bound work
    let result = task::spawn_blocking(|| {
        // Heavy computation
        (0..1000000).sum::<u64>()
    })
    .await;

    println!("Result: {}", result);
}
```

### 3. Use Structured Concurrency

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

    // Wait for all tasks to complete
    let results: Vec<_> = join_all(tasks).await;
    println!("Results: {:?}", results);
}
```

### 4. Handle Errors Gracefully

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
            eprintln!("Failed to read config: {}", e);
            String::from("default_config")
        }
    }
}
```

### 5. Use Timeouts for External Operations

```rust
use async_std::future::timeout;
use async_std::net::TcpStream;
use std::time::Duration;

async fn connect_with_timeout(addr: &str) -> std::io::Result<TcpStream> {
    timeout(Duration::from_secs(5), TcpStream::connect(addr))
        .await
        .map_err(|_| std::io::Error::new(
            std::io::ErrorKind::TimedOut,
            "Connection timed out"
        ))?
}
```

## Common Pitfalls

### 1. Blocking the Runtime

```rust
use async_std::task;

// BAD: Blocks the async runtime
async fn bad_example() {
    std::thread::sleep(std::time::Duration::from_secs(1)); // Blocks!
    println!("Done");
}

// GOOD: Use async sleep
async fn good_example() {
    task::sleep(std::time::Duration::from_secs(1)).await;
    println!("Done");
}

// GOOD: Use spawn_blocking for necessary blocking operations
async fn blocking_io() {
    task::spawn_blocking(|| {
        std::fs::read_to_string("large_file.txt")
    })
    .await
    .unwrap();
}
```

### 2. Forgetting to Await

```rust
use async_std::task;

async fn example() {
    // BAD: Future is created but never executed
    let _ = task::sleep(std::time::Duration::from_secs(1));

    // GOOD: Await the future
    task::sleep(std::time::Duration::from_secs(1)).await;
}
```

### 3. Holding Locks Across Await Points

```rust
use async_std::sync::Mutex;
use async_std::task;

// BAD: Lock held across await
async fn bad_lock_usage(mutex: &Mutex<i32>) {
    let mut guard = mutex.lock().await;
    task::sleep(std::time::Duration::from_secs(1)).await; // Lock held!
    *guard += 1;
}

// GOOD: Minimize lock scope
async fn good_lock_usage(mutex: &Mutex<i32>) {
    {
        let mut guard = mutex.lock().await;
        *guard += 1;
    } // Lock released here
    task::sleep(std::time::Duration::from_secs(1)).await;
}
```

### 4. Not Handling Task Panics

```rust
use async_std::task;

async fn may_panic() {
    panic!("Oops!");
}

async fn handle_panics() {
    let handle = task::spawn(may_panic());

    // The panic will propagate when awaiting
    match std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        task::block_on(async { handle.await })
    })) {
        Ok(_) => println!("Task completed"),
        Err(_) => println!("Task panicked"),
    }
}
```

### 5. Unbounded Channel Growth

```rust
use async_std::channel;
use async_std::task;

// BAD: Unbounded channel can grow indefinitely
async fn unbounded_danger() {
    let (sender, receiver) = channel::unbounded::<i32>();
    // If consumer is slow, memory usage grows unbounded
}

// GOOD: Use bounded channels with backpressure
async fn bounded_safe() {
    let (sender, receiver) = channel::bounded::<i32>(100);
    // Sender will block when buffer is full
}
```

## Performance Considerations

### 1. Task Granularity

Spawning too many fine-grained tasks can hurt performance due to scheduling overhead.

```rust
use async_std::task;

// BAD: Too many small tasks
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

// GOOD: Batch processing
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

### 2. Buffer Sizes

Choose appropriate buffer sizes for I/O operations.

```rust
use async_std::fs::File;
use async_std::io::{BufReader, BufWriter, ReadExt, WriteExt};

async fn buffered_io() -> std::io::Result<()> {
    // Use buffered I/O for better performance
    let file = File::open("large_file.txt").await?;
    let mut reader = BufReader::with_capacity(64 * 1024, file); // 64KB buffer

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

### 3. Channel Selection

```rust
use async_std::channel;

// For high-throughput scenarios, bounded channels provide backpressure
async fn high_throughput() {
    // Small buffer for low-latency
    let (tx, rx) = channel::bounded::<Message>(16);

    // Larger buffer for throughput
    let (tx, rx) = channel::bounded::<Message>(1024);
}

struct Message {
    data: Vec<u8>,
}
```

### 4. Avoiding Unnecessary Allocations

```rust
use async_std::io::{ReadExt, WriteExt};
use async_std::net::TcpStream;

// BAD: Allocates new buffer each time
async fn allocating_read(stream: &mut TcpStream) -> std::io::Result<Vec<u8>> {
    let mut buffer = vec![0u8; 1024];
    let n = stream.read(&mut buffer).await?;
    buffer.truncate(n);
    Ok(buffer)
}

// GOOD: Reuse buffer
async fn reusing_read(stream: &mut TcpStream, buffer: &mut Vec<u8>) -> std::io::Result<usize> {
    buffer.clear();
    buffer.resize(1024, 0);
    stream.read(buffer).await
}
```

## Real-World Scenarios

### Scenario 1: Web Scraper

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

        // Check if already visited
        {
            let mut visited = self.visited.lock().await;
            if visited.contains(&url) {
                return vec![];
            }
            visited.insert(url.clone());
        }

        // Simulate fetching page
        task::sleep(std::time::Duration::from_millis(50)).await;
        println!("Scraping: {} (depth: {})", url, depth);

        // Simulate extracting links
        let links: Vec<String> = (0..3)
            .map(|i| format!("{}/page{}", url, i))
            .collect();

        // Recursively scrape linked pages
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

### Scenario 2: Rate-Limited API Client

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

        // Token bucket refiller
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

        // Simulate HTTP request
        task::sleep(Duration::from_millis(50)).await;
        Ok(format!("Response from {}{}", self.base_url, endpoint))
    }
}
```

### Scenario 3: Async Task Queue

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
            println!("Processing task {}", i);
            task::sleep(std::time::Duration::from_millis(100)).await;
            println!("Completed task {}", i);
        }).await;
    }

    // Wait for tasks to complete
    task::sleep(std::time::Duration::from_secs(2)).await;
}
```

## Interview Key Points

### Q1: How does async-std differ from tokio?

**Answer:** Both are async runtimes for Rust, but they have different design philosophies:

- **API Design:** async-std mirrors the std library API, making it easier to learn. tokio has its own API design.
- **Features:** tokio has more features like `select!` macro and tracing integration built-in.
- **Ecosystem:** tokio has a larger ecosystem and is more widely used in production.
- **Performance:** Both are highly performant; benchmarks vary by use case.
- **Compatibility:** They use different reactor implementations and aren't directly interoperable.

### Q2: Explain the difference between `task::spawn` and `task::spawn_blocking`.

**Answer:**
- `task::spawn` creates an async task that runs on the async executor. It's suitable for I/O-bound work.
- `task::spawn_blocking` runs a closure on a dedicated thread pool for blocking operations. Use it for CPU-bound work or synchronous I/O that can't be made async.

```rust
// Async task for I/O
task::spawn(async { /* async I/O operations */ });

// Blocking task for CPU-bound work
task::spawn_blocking(|| { /* synchronous computation */ });
```

### Q3: What is the purpose of `async_std::prelude::*`?

**Answer:** The prelude module re-exports commonly used traits and types, particularly the extension traits that provide async methods on standard types. Importing it gives you access to methods like `read_to_string()`, `write_all()`, and stream combinators without importing each trait individually.

### Q4: How do you handle cancellation in async-std?

**Answer:** async-std doesn't have built-in cancellation tokens, but you can implement cancellation patterns:

```rust
use async_std::channel;
use async_std::task;
use futures::future::{select, Either};
use std::pin::pin;

async fn cancellable_task(cancel: channel::Receiver<()>) {
    let work = async {
        // Long-running work
        task::sleep(std::time::Duration::from_secs(10)).await;
    };

    let cancel = async {
        let _ = cancel.recv().await;
    };

    let work = pin!(work);
    let cancel = pin!(cancel);

    match select(work, cancel).await {
        Either::Left(_) => println!("Work completed"),
        Either::Right(_) => println!("Cancelled"),
    }
}
```

### Q5: When should you use bounded vs unbounded channels?

**Answer:**
- **Bounded channels:** Provide backpressure, preventing memory exhaustion. Use when producers might outpace consumers.
- **Unbounded channels:** No backpressure, can grow indefinitely. Use only when you're certain the consumer can keep up or the channel is short-lived.

## Further Reading

- [async-std Official Documentation](https://docs.rs/async-std)
- [async-std Book](https://book.async.rs/)
- [Asynchronous Programming in Rust](https://rust-lang.github.io/async-book/)
- [Futures Crate Documentation](https://docs.rs/futures)
- [Comparing Async Runtimes in Rust](https://www.reddit.com/r/rust/comments/lg0a7b/tokio_vs_asyncstd/)
- [async-std GitHub Repository](https://github.com/async-rs/async-std)
