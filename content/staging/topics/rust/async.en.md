---
title: Rust Async Programming
description: "Master Rust async: async/await, Future, Tokio runtime"
track: rust
section: concurrency-async
difficulty: advanced
tags:
  - Rust
  - async
  - await
  - Tokio
status: imported
origin: old/src/content/docs/rust/async.en.md
divergence: 0.299
issues: []
legacy:
  category: Rust
  subcategory: Async Programming
  order: 4
  lastUpdated: 2026-01-07
---

Asynchronous programming in Rust enables writing concurrent code that can handle thousands of tasks efficiently without the overhead of traditional threads. We'll cover the fundamentals of async/await, the Future trait, async runtimes, and common patterns.

## Understanding Async Fundamentals

Asynchronous programming allows your program to work on multiple tasks concurrently without creating multiple threads. When an async task encounters a blocking operation (like I/O), it can yield control to other tasks instead of blocking the entire thread.

### Key Concepts

- **Future**: A value that may not be available yet
- **Executor**: Runs async tasks and polls futures
- **Waker**: Notifies the executor when a future is ready to make progress
- **Async/Await**: Syntax for writing asynchronous code in a synchronous style

### Why Async?

```rust
// Synchronous code - blocks the thread
fn fetch_data_sync(url: &str) -> String {
    // This blocks until the request completes
    reqwest::blocking::get(url)
        .unwrap()
        .text()
        .unwrap()
}

// Asynchronous code - doesn't block
async fn fetch_data_async(url: &str) -> Result<String, reqwest::Error> {
    // This yields control while waiting
    reqwest::get(url)
        .await?
        .text()
        .await
}
```

## The Future Trait

The `Future` trait is the foundation of async Rust. A future represents a computation that may not have completed yet.

### Future Definition

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}

pub enum Poll<T> {
    Ready(T),    // The future has completed
    Pending,     // The future is not ready yet
}
```

### Implementing a Custom Future

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::{Duration, Instant};

struct Delay {
    when: Instant,
}

impl Future for Delay {
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        if Instant::now() >= self.when {
            Poll::Ready(())
        } else {
            // Wake up when ready
            let waker = cx.waker().clone();
            let when = self.when;

            std::thread::spawn(move || {
                let now = Instant::now();
                if now < when {
                    std::thread::sleep(when - now);
                }
                waker.wake();
            });

            Poll::Pending
        }
    }
}

// Usage
async fn use_delay() {
    let delay = Delay {
        when: Instant::now() + Duration::from_secs(2),
    };
    delay.await;
    println!("2 seconds have passed");
}
```

### Understanding Pin

`Pin` ensures that a value won't be moved in memory. This is crucial for self-referential futures.

```rust
use std::pin::Pin;

// Pin prevents moving
fn example(mut pinned: Pin<&mut SomeType>) {
    // Can't move out of a Pin
    // let moved = *pinned; // ERROR

    // Can only access through Pin API
    pinned.as_mut().some_method();
}
```

## Async/Await Syntax

The `async`/`await` keywords provide ergonomic syntax for working with futures.

### Async Functions

```rust
// Async function
async fn say_hello() -> String {
    "Hello, async world!".to_string()
}

// Equivalent to returning a Future
fn say_hello_desugared() -> impl Future<Output = String> {
    async {
        "Hello, async world!".to_string()
    }
}
```

### Async Blocks

```rust
async fn example() {
    // Async block
    let future = async {
        println!("This is async");
        42
    };

    let result = future.await;
    println!("Result: {}", result);
}
```

### Awaiting Multiple Futures

```rust
use tokio::time::{sleep, Duration};

async fn concurrent_operations() {
    let task1 = async {
        sleep(Duration::from_secs(1)).await;
        "Task 1 complete"
    };

    let task2 = async {
        sleep(Duration::from_secs(2)).await;
        "Task 2 complete"
    };

    // Sequential - takes 3 seconds
    let result1 = task1.await;
    let result2 = task2.await;

    // Concurrent - takes 2 seconds
    let (result1, result2) = tokio::join!(
        async {
            sleep(Duration::from_secs(1)).await;
            "Task 1 complete"
        },
        async {
            sleep(Duration::from_secs(2)).await;
            "Task 2 complete"
        }
    );

    println!("{}, {}", result1, result2);
}
```

## Tokio Runtime

Tokio is the most popular async runtime for Rust, providing an executor, I/O primitives, and utilities.

### Setting Up Tokio

```toml
# Cargo.toml
[dependencies]
tokio = { version = "1.36", features = ["full"] }
```

### Basic Runtime Usage

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    println!("Starting async program");

    sleep(Duration::from_secs(1)).await;

    println!("One second has passed");
}

// The #[tokio::main] macro expands to:
fn main() {
    let runtime = tokio::runtime::Runtime::new().unwrap();
    runtime.block_on(async {
        println!("Starting async program");
        sleep(Duration::from_secs(1)).await;
        println!("One second has passed");
    });
}
```

### Task Spawning

```rust
use tokio::task;

#[tokio::main]
async fn main() {
    let handle1 = task::spawn(async {
        println!("Task 1 running");
        42
    });

    let handle2 = task::spawn(async {
        println!("Task 2 running");
        "hello"
    });

    // Wait for tasks to complete
    let result1 = handle1.await.unwrap();
    let result2 = handle2.await.unwrap();

    println!("Results: {}, {}", result1, result2);
}
```

### Async I/O with Tokio

```rust
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

async fn file_operations() -> std::io::Result<()> {
    // Write to file
    let mut file = File::create("output.txt").await?;
    file.write_all(b"Hello, async I/O!").await?;

    // Read from file
    let mut file = File::open("output.txt").await?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).await?;

    println!("File contents: {}", contents);
    Ok(())
}
```

### Networking with Tokio

```rust
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

async fn tcp_server() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Server listening on port 8080");

    loop {
        let (socket, addr) = listener.accept().await?;
        println!("New connection from: {}", addr);

        // Spawn a task for each connection
        tokio::spawn(async move {
            handle_client(socket).await.unwrap();
        });
    }
}

async fn handle_client(mut socket: TcpStream) -> std::io::Result<()> {
    let mut buffer = [0; 1024];

    loop {
        let n = socket.read(&mut buffer).await?;

        if n == 0 {
            return Ok(());
        }

        // Echo back
        socket.write_all(&buffer[0..n]).await?;
    }
}
```

### Configuring Runtime

```rust
use tokio::runtime::{Builder, Runtime};

fn create_custom_runtime() -> Runtime {
    Builder::new_multi_thread()
        .worker_threads(4)
        .thread_name("my-async-worker")
        .enable_all()
        .build()
        .unwrap()
}

fn main() {
    let runtime = create_custom_runtime();

    runtime.block_on(async {
        // Your async code here
    });
}
```

## Async Patterns

### Select - Racing Futures

```rust
use tokio::time::{sleep, Duration};

async fn select_example() {
    let task1 = async {
        sleep(Duration::from_secs(1)).await;
        "Task 1"
    };

    let task2 = async {
        sleep(Duration::from_secs(2)).await;
        "Task 2"
    };

    // Wait for the first to complete
    tokio::select! {
        result = task1 => println!("First: {}", result),
        result = task2 => println!("First: {}", result),
    }
}
```

### Timeout Pattern

```rust
use tokio::time::{timeout, Duration};

async fn with_timeout() {
    let operation = async {
        sleep(Duration::from_secs(5)).await;
        "Done"
    };

    match timeout(Duration::from_secs(2), operation).await {
        Ok(result) => println!("Completed: {}", result),
        Err(_) => println!("Timeout!"),
    }
}
```

### Cancellation

```rust
use tokio::sync::oneshot;
use tokio::time::{sleep, Duration};

async fn cancellable_task() {
    let (tx, rx) = oneshot::channel();

    let task = tokio::spawn(async move {
        tokio::select! {
            _ = sleep(Duration::from_secs(10)) => {
                println!("Task completed");
            }
            _ = rx => {
                println!("Task cancelled");
            }
        }
    });

    // Cancel after 2 seconds
    sleep(Duration::from_secs(2)).await;
    let _ = tx.send(());

    task.await.unwrap();
}
```

### Concurrent Requests with Semaphore

```rust
use tokio::sync::Semaphore;
use std::sync::Arc;

async fn limited_concurrency() {
    let semaphore = Arc::new(Semaphore::new(3)); // Max 3 concurrent tasks
    let mut handles = vec![];

    for i in 0..10 {
        let permit = semaphore.clone().acquire_owned().await.unwrap();

        let handle = tokio::spawn(async move {
            println!("Task {} started", i);
            sleep(Duration::from_secs(1)).await;
            println!("Task {} completed", i);
            drop(permit); // Release permit
        });

        handles.push(handle);
    }

    // Wait for all tasks
    for handle in handles {
        handle.await.unwrap();
    }
}
```

### Retry Pattern

```rust
use tokio::time::{sleep, Duration};

async fn retry_with_backoff<F, T, E>(
    mut operation: F,
    max_retries: u32,
) -> Result<T, E>
where
    F: FnMut() -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<T, E>>>>,
{
    let mut retries = 0;

    loop {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) if retries >= max_retries => return Err(e),
            Err(_) => {
                retries += 1;
                let delay = Duration::from_millis(100 * 2_u64.pow(retries));
                sleep(delay).await;
            }
        }
    }
}

// Usage
async fn example_retry() {
    let result = retry_with_backoff(
        || Box::pin(async { fetch_data().await }),
        3,
    ).await;
}
```

### Channel Communication

```rust
use tokio::sync::mpsc;

async fn producer_consumer() {
    let (tx, mut rx) = mpsc::channel(32);

    // Producer
    tokio::spawn(async move {
        for i in 0..10 {
            tx.send(i).await.unwrap();
            sleep(Duration::from_millis(100)).await;
        }
    });

    // Consumer
    while let Some(value) = rx.recv().await {
        println!("Received: {}", value);
    }
}
```

## Streams

Streams are asynchronous iterators, similar to how `Future` is an async version of a value.

### Stream Trait

```rust
use futures::stream::Stream;
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Stream {
    type Item;

    fn poll_next(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>
    ) -> Poll<Option<Self::Item>>;
}
```

### Using Streams

```rust
use futures::stream::{self, StreamExt};

async fn stream_example() {
    let mut stream = stream::iter(vec![1, 2, 3, 4, 5]);

    while let Some(value) = stream.next().await {
        println!("Got: {}", value);
    }
}
```

### Creating Custom Streams

```rust
use futures::stream::Stream;
use std::pin::Pin;
use std::task::{Context, Poll};

struct Counter {
    count: u32,
    max: u32,
}

impl Stream for Counter {
    type Item = u32;

    fn poll_next(
        mut self: Pin<&mut Self>,
        _cx: &mut Context<'_>
    ) -> Poll<Option<Self::Item>> {
        if self.count < self.max {
            let current = self.count;
            self.count += 1;
            Poll::Ready(Some(current))
        } else {
            Poll::Ready(None)
        }
    }
}

// Usage
async fn use_counter() {
    let counter = Counter { count: 0, max: 5 };
    futures::pin_mut!(counter);

    while let Some(value) = counter.next().await {
        println!("Count: {}", value);
    }
}
```

### Stream Combinators

```rust
use futures::stream::{self, StreamExt};

async fn stream_combinators() {
    let stream = stream::iter(1..=10);

    // Map
    let doubled = stream.map(|x| x * 2);

    // Filter
    let evens = doubled.filter(|x| async move { x % 2 == 0 });

    // Take
    let first_five = evens.take(5);

    // Collect
    let results: Vec<_> = first_five.collect().await;
    println!("Results: {:?}", results);
}
```

### Async Stream Generation

```rust
use async_stream::stream;
use futures::stream::StreamExt;

fn number_stream() -> impl Stream<Item = u32> {
    stream! {
        for i in 0..10 {
            sleep(Duration::from_millis(100)).await;
            yield i;
        }
    }
}

async fn consume_stream() {
    let mut stream = number_stream();

    while let Some(num) = stream.next().await {
        println!("Number: {}", num);
    }
}
```

### Broadcasting with Streams

```rust
use tokio::sync::broadcast;
use futures::stream::StreamExt;

async fn broadcast_example() {
    let (tx, mut rx1) = broadcast::channel(16);
    let mut rx2 = tx.subscribe();

    // Producer
    tokio::spawn(async move {
        for i in 0..5 {
            tx.send(i).unwrap();
            sleep(Duration::from_millis(100)).await;
        }
    });

    // Consumer 1
    tokio::spawn(async move {
        while let Ok(value) = rx1.recv().await {
            println!("Receiver 1 got: {}", value);
        }
    });

    // Consumer 2
    tokio::spawn(async move {
        while let Ok(value) = rx2.recv().await {
            println!("Receiver 2 got: {}", value);
        }
    });

    sleep(Duration::from_secs(1)).await;
}
```

## Error Handling

### Result Propagation

```rust
use tokio::fs::File;
use tokio::io::{self, AsyncReadExt};

async fn read_file(path: &str) -> io::Result<String> {
    let mut file = File::open(path).await?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).await?;
    Ok(contents)
}

async fn process_files() -> io::Result<()> {
    let content1 = read_file("file1.txt").await?;
    let content2 = read_file("file2.txt").await?;

    println!("Read {} and {} bytes", content1.len(), content2.len());
    Ok(())
}
```

### Custom Error Types

```rust
use thiserror::Error;

#[derive(Error, Debug)]
enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Network error: {0}")]
    Network(String),

    #[error("Timeout occurred")]
    Timeout,
}

async fn operation() -> Result<String, AppError> {
    let data = fetch_data().await
        .map_err(|e| AppError::Network(e.to_string()))?;

    Ok(data)
}
```

### Handling Multiple Errors

```rust
use futures::future::try_join_all;

async fn parallel_operations() -> Result<Vec<String>, AppError> {
    let operations = vec![
        fetch_data("url1"),
        fetch_data("url2"),
        fetch_data("url3"),
    ];

    // Fails if any operation fails
    try_join_all(operations).await
}
```

## Best Practices

### Avoid Blocking in Async Code

```rust
// BAD: Blocks the async runtime
async fn bad_example() {
    std::thread::sleep(Duration::from_secs(1)); // DON'T DO THIS
}

// GOOD: Use async sleep
async fn good_example() {
    tokio::time::sleep(Duration::from_secs(1)).await;
}
```

### Use spawn_blocking for CPU-Intensive Work

```rust
async fn cpu_intensive_work() {
    let result = tokio::task::spawn_blocking(|| {
        // Heavy computation
        (0..1_000_000).sum::<u64>()
    }).await.unwrap();

    println!("Result: {}", result);
}
```

### Proper Error Handling

```rust
async fn robust_operation() {
    match risky_operation().await {
        Ok(result) => println!("Success: {}", result),
        Err(e) => {
            eprintln!("Error: {}", e);
            // Handle or propagate error appropriately
        }
    }
}
```

### Use Structured Concurrency

```rust
use tokio::task::JoinSet;

async fn structured_tasks() {
    let mut set = JoinSet::new();

    for i in 0..10 {
        set.spawn(async move {
            // Task work
            i * 2
        });
    }

    // Wait for all tasks
    while let Some(result) = set.join_next().await {
        match result {
            Ok(value) => println!("Task completed: {}", value),
            Err(e) => eprintln!("Task failed: {}", e),
        }
    }
}
```

### Resource Cleanup

```rust
use tokio::sync::Mutex;
use std::sync::Arc;

async fn resource_management() {
    let resource = Arc::new(Mutex::new(Resource::new()));

    {
        let guard = resource.lock().await;
        // Use resource
    } // Lock automatically released
}
```

### Avoid Excessive Task Spawning

```rust
// BAD: Spawning too many tasks
async fn bad_pattern() {
    for i in 0..1_000_000 {
        tokio::spawn(async move {
            println!("{}", i);
        });
    }
}

// GOOD: Use concurrency limits
async fn good_pattern() {
    use futures::stream::{self, StreamExt};

    stream::iter(0..1_000_000)
        .for_each_concurrent(100, |i| async move {
            println!("{}", i);
        })
        .await;
}
```

### Graceful Shutdown

```rust
use tokio::signal;
use tokio::sync::broadcast;

async fn graceful_shutdown() {
    let (shutdown_tx, mut shutdown_rx) = broadcast::channel(1);

    // Spawn worker tasks
    let worker = tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = shutdown_rx.recv() => {
                    println!("Shutting down worker");
                    break;
                }
                _ = do_work() => {}
            }
        }
    });

    // Wait for shutdown signal
    signal::ctrl_c().await.unwrap();
    println!("Received shutdown signal");

    // Broadcast shutdown
    let _ = shutdown_tx.send(());

    // Wait for workers to finish
    worker.await.unwrap();
}
```

## Complete Example: Async HTTP Server

```rust
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use std::sync::Arc;
use tokio::sync::Semaphore;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    let semaphore = Arc::new(Semaphore::new(100)); // Max 100 concurrent connections

    println!("Server running on http://127.0.0.1:8080");

    loop {
        let (mut socket, addr) = listener.accept().await?;
        let permit = semaphore.clone().acquire_owned().await.unwrap();

        tokio::spawn(async move {
            let _permit = permit; // Hold permit for duration of task

            let mut buffer = [0; 1024];

            match socket.read(&mut buffer).await {
                Ok(n) if n > 0 => {
                    let response = "HTTP/1.1 200 OK\r\n\
                                   Content-Type: text/plain\r\n\
                                   Content-Length: 13\r\n\
                                   \r\n\
                                   Hello, World!";

                    if let Err(e) = socket.write_all(response.as_bytes()).await {
                        eprintln!("Failed to write to socket: {}", e);
                    }
                }
                Ok(_) => println!("Connection closed by {}", addr),
                Err(e) => eprintln!("Failed to read from socket: {}", e),
            }
        });
    }
}
```

## Conclusion

Rust's async programming model provides powerful tools for building efficient, concurrent applications. Key takeaways:

- **Futures** are the foundation of async Rust
- **Async/await** provides ergonomic syntax for asynchronous code
- **Tokio** is a robust runtime with excellent I/O primitives
- **Streams** enable processing sequences of async values
- **Proper patterns** like timeout, retry, and cancellation improve reliability
- **Best practices** ensure performant and maintainable async code

By mastering these concepts, you can build high-performance, scalable applications that efficiently handle I/O-bound workloads.

## Additional Resources

- [Tokio Documentation](https://tokio.rs/)
- [Async Book](https://rust-lang.github.io/async-book/)
- [Futures Crate](https://docs.rs/futures/)
- [async-std](https://async.rs/)
