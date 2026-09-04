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
origin: old/src/content/docs/rust/channels.en.md
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

Rust embraces the concurrency philosophy of "share memory by communicating, rather than communicate by sharing memory." Channels are the core tool for implementing this concept, providing a type-safe, ownership-friendly way for inter-thread communication. This article will deeply explore the `mpsc` channel in Rust's standard library as well as the more powerful `crossbeam` channel.

## Concept Explanation

### What is Message Passing?

Message passing is a concurrent programming model where threads or tasks coordinate work by sending and receiving messages, rather than directly sharing memory. This model originates from the ideas of CSP (Communicating Sequential Processes) and the Actor model.

In Rust, channels are the primary vehicle for message passing:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // Create a channel, obtaining the sender and receiver ends
    let (sender, receiver) = mpsc::channel();

    // Send a message in a new thread
    thread::spawn(move || {
        sender.send("Hello from another thread!").unwrap();
    });

    // Receive the message in the main thread
    let message = receiver.recv().unwrap();
    println!("Received: {}", message);
}
```

### Why Use Message Passing?

1. **Avoid data races**: Ownership of messages transfers during sending, naturally avoiding concurrent access issues
2. **Decoupling**: Senders and receivers only interact through messages, reducing dependencies between modules
3. **Easy to reason about**: Code logic is clearer, and data flow direction is explicit
4. **Fits with the ownership system**: Rust's ownership mechanism combines perfectly with message passing

### The Meaning of mpsc

`mpsc` stands for **Multiple Producer, Single Consumer**. This means:

- There can be multiple senders (`Sender`) sending messages to the same channel
- There is only one receiver (`Receiver`) receiving messages from the channel

```rust
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel::<i32>();

    // tx: Sender<i32> - can be cloned, supports multiple producers
    // rx: Receiver<i32> - cannot be cloned, only one consumer

    let tx2 = tx.clone();  // Create a second sender
    // let rx2 = rx.clone(); // Compile error! Receiver cannot be cloned
}
```

---

## Core Principles

### Internal Structure of Channels

The standard library's `mpsc` channel internally uses two different implementations:

1. **Unbounded channel**: Based on a lock-free queue implementation, send operations never block
2. **Bounded channel**: Created using `sync_channel`, sending blocks when the buffer is full

```rust
use std::sync::mpsc;

fn main() {
    // Unbounded channel - internally uses a lock-free queue
    let (tx_unbounded, rx_unbounded) = mpsc::channel::<i32>();

    // Bounded channel - capacity of 5
    let (tx_bounded, rx_bounded) = mpsc::sync_channel::<i32>(5);
}
```

### How Sender Works

`Sender<T>` is the sending end of the channel, with the following characteristics:

- Implements the `Clone` trait, allowing multiple senders to be created
- Implements the `Send` trait, can be safely passed across threads
- Transfers ownership of the value when sending

```rust
use std::sync::mpsc::{self, Sender};
use std::thread;

fn producer(tx: Sender<String>, id: usize) {
    for i in 0..3 {
        let msg = format!("Message {} from producer {}", i, id);
        tx.send(msg).unwrap();
        // Ownership of msg has been transferred, cannot be used here
    }
}

fn main() {
    let (tx, rx) = mpsc::channel();

    // Clone the sender for multiple producers
    for id in 0..3 {
        let tx_clone = tx.clone();
        thread::spawn(move || producer(tx_clone, id));
    }

    // Drop the original sender to ensure the channel closes properly
    drop(tx);

    // Receive all messages
    for msg in rx {
        println!("{}", msg);
    }
}
```

### How Receiver Works

`Receiver<T>` is the receiving end of the channel:

- Does not implement `Clone`, ensuring single-consumer semantics
- Implements `IntoIterator`, can be iterated with a for loop
- When all senders are dropped, iteration automatically ends

```rust
use std::sync::mpsc::{self, Receiver};

fn consumer(rx: Receiver<i32>) {
    // Method 1: Blocking receive
    match rx.recv() {
        Ok(val) => println!("Received: {}", val),
        Err(_) => println!("Channel closed"),
    }

    // Method 2: Non-blocking try receive
    match rx.try_recv() {
        Ok(val) => println!("Received: {}", val),
        Err(mpsc::TryRecvError::Empty) => println!("No message yet"),
        Err(mpsc::TryRecvError::Disconnected) => println!("Channel closed"),
    }

    // Method 3: Iterator pattern
    for val in rx {
        println!("Received: {}", val);
    }
}
```

### Ownership Transfer Semantics

The core of message passing is ownership transfer. When calling `send()`, ownership of the value transfers from the sender to inside the channel, then transfers to the receiver during `recv()`:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    let data = vec![1, 2, 3, 4, 5];

    thread::spawn(move || {
        tx.send(data).unwrap();
        // Cannot use data here, ownership has been transferred
        // println!("{:?}", data); // Compile error!
    });

    let received = rx.recv().unwrap();
    println!("Received: {:?}", received);  // [1, 2, 3, 4, 5]
}
```

---

## Key Points

### Channel Types

| Channel Type | Creation Method | Characteristics |
|---------|---------|------|
| Async Channel | `mpsc::channel()` | Unbounded, sending never blocks |
| Sync Channel | `mpsc::sync_channel(n)` | Bounded, blocks when buffer is full |

### Sender Methods

| Method | Description |
|-----|------|
| `send(value)` | Send a message, transfers ownership |
| `clone()` | Clone the sender, creates a new producer |

### Receiver Methods

| Method | Description |
|-----|------|
| `recv()` | Block waiting for a message |
| `try_recv()` | Non-blocking attempt to receive |
| `recv_timeout(duration)` | Blocking receive with timeout |
| `iter()` | Get a blocking iterator |
| `try_iter()` | Get a non-blocking iterator |

### Error Types

| Error | Meaning |
|-----|------|
| `SendError<T>` | Receiver has been dropped, cannot send |
| `RecvError` | All senders have been dropped, channel closed |
| `TryRecvError::Empty` | Channel is empty (non-blocking receive) |
| `TryRecvError::Disconnected` | Channel has disconnected |
| `RecvTimeoutError::Timeout` | Timeout |
| `RecvTimeoutError::Disconnected` | Channel has disconnected |

---

## Code Examples

### Basic Channel Usage

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // Create an async channel
    let (tx, rx) = mpsc::channel();

    // Producer thread
    thread::spawn(move || {
        let messages = vec!["Message 1", "Message 2", "Message 3"];
        for msg in messages {
            println!("Sending: {}", msg);
            tx.send(msg).unwrap();
        }
        println!("Producer finished");
    });

    // Consumer (main thread)
    for received in rx {
        println!("Received: {}", received);
    }
    println!("Reception complete");
}
```

### Multiple Producer Pattern

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();
    let mut handles = vec![];

    // Create 4 producers
    for id in 0..4 {
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            for i in 0..3 {
                let msg = format!("Producer {}: Message {}", id, i);
                tx.send(msg).unwrap();
                thread::sleep(Duration::from_millis(10 * id as u64));
            }
        });
        handles.push(handle);
    }

    // Drop the original sender
    drop(tx);

    // Receive all messages
    let mut count = 0;
    for msg in rx {
        count += 1;
        println!("[{}] {}", count, msg);
    }

    // Wait for all producers to complete
    for handle in handles {
        handle.join().unwrap();
    }

    println!("Total messages received: {}", count);
}
```

### Sync Channel (Bounded Channel)

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    // Create a sync channel with capacity of 2
    let (tx, rx) = mpsc::sync_channel(2);

    // Producer thread
    let producer = thread::spawn(move || {
        for i in 0..5 {
            println!("[Producer] Attempting to send {}...", i);
            tx.send(i).unwrap();
            println!("[Producer] Sent {}", i);
        }
    });

    // Consumer starts with delay to observe blocking effect
    thread::sleep(Duration::from_secs(1));

    println!("\n[Consumer] Starting to receive...\n");
    for val in rx {
        println!("[Consumer] Received: {}", val);
        thread::sleep(Duration::from_millis(200));
    }

    producer.join().unwrap();
}
```

### Non-blocking Receive

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    // Send message with delay
    thread::spawn(move || {
        thread::sleep(Duration::from_secs(2));
        tx.send("Delayed message").unwrap();
    });

    // Polling mode
    loop {
        match rx.try_recv() {
            Ok(msg) => {
                println!("Received: {}", msg);
                break;
            }
            Err(mpsc::TryRecvError::Empty) => {
                println!("Waiting...");
                thread::sleep(Duration::from_millis(500));
            }
            Err(mpsc::TryRecvError::Disconnected) => {
                println!("Channel closed");
                break;
            }
        }
    }
}
```

### Receive with Timeout

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel::<&str>();

    // Scenario 1: Message arrives before timeout
    let tx1 = tx.clone();
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(500));
        let _ = tx1.send("Fast response");
    });

    match rx.recv_timeout(Duration::from_secs(1)) {
        Ok(msg) => println!("Scenario 1 - Received: {}", msg),
        Err(e) => println!("Scenario 1 - Error: {:?}", e),
    }

    // Scenario 2: Timeout
    match rx.recv_timeout(Duration::from_millis(100)) {
        Ok(msg) => println!("Scenario 2 - Received: {}", msg),
        Err(mpsc::RecvTimeoutError::Timeout) => println!("Scenario 2 - Timeout!"),
        Err(mpsc::RecvTimeoutError::Disconnected) => println!("Scenario 2 - Channel disconnected"),
    }

    // Scenario 3: Channel closed
    drop(tx);
    match rx.recv_timeout(Duration::from_secs(1)) {
        Ok(msg) => println!("Scenario 3 - Received: {}", msg),
        Err(mpsc::RecvTimeoutError::Timeout) => println!("Scenario 3 - Timeout"),
        Err(mpsc::RecvTimeoutError::Disconnected) => println!("Scenario 3 - Channel disconnected"),
    }
}
```

### Structured Message Passing

```rust
use std::sync::mpsc;
use std::thread;

// Define message types
#[derive(Debug)]
enum Message {
    Task { id: u32, payload: String },
    Status { worker_id: u32, completed: u32 },
    Shutdown,
}

fn main() {
    let (tx, rx) = mpsc::channel();

    // Start worker thread
    let tx_worker = tx.clone();
    let worker = thread::spawn(move || {
        for i in 0..5 {
            tx_worker.send(Message::Task {
                id: i,
                payload: format!("Task data {}", i),
            }).unwrap();
        }
        tx_worker.send(Message::Status {
            worker_id: 1,
            completed: 5,
        }).unwrap();
        tx_worker.send(Message::Shutdown).unwrap();
    });

    drop(tx);

    // Process messages
    for msg in rx {
        match msg {
            Message::Task { id, payload } => {
                println!("Processing task {}: {}", id, payload);
            }
            Message::Status { worker_id, completed } => {
                println!("Worker {} completed {} tasks", worker_id, completed);
            }
            Message::Shutdown => {
                println!("Received shutdown signal");
                break;
            }
        }
    }

    worker.join().unwrap();
}
```

---

## Crossbeam Channels

The standard library's `mpsc` channel has limited functionality. `crossbeam-channel` provides more powerful features:

- **Multiple consumers**: Supports MPMC (Multiple Producer Multiple Consumer)
- **select macro**: Wait on multiple channels simultaneously
- **Better performance**: Optimized lock-free implementation
- **Richer API**: More channel operation methods

### Adding Dependency

```toml
[dependencies]
crossbeam-channel = "0.5"
```

### Basic Usage

```rust
use crossbeam_channel::{unbounded, bounded};
use std::thread;

fn main() {
    // Unbounded channel
    let (tx, rx) = unbounded();

    // Bounded channel
    let (tx_bounded, rx_bounded) = bounded(10);

    thread::spawn(move || {
        tx.send("Hello").unwrap();
        tx.send("World").unwrap();
    });

    println!("{}", rx.recv().unwrap());
    println!("{}", rx.recv().unwrap());
}
```

### Multiple Consumer Pattern (MPMC)

One of crossbeam's biggest advantages is support for multiple consumers:

```rust
use crossbeam_channel::unbounded;
use std::thread;

fn main() {
    let (tx, rx) = unbounded();
    let mut handles = vec![];

    // Create multiple producers
    for i in 0..3 {
        let tx = tx.clone();
        handles.push(thread::spawn(move || {
            for j in 0..5 {
                tx.send(format!("Producer {}: Message {}", i, j)).unwrap();
            }
        }));
    }

    // Create multiple consumers (this is not possible with standard library!)
    for i in 0..2 {
        let rx = rx.clone();  // crossbeam's Receiver can be cloned
        handles.push(thread::spawn(move || {
            while let Ok(msg) = rx.recv() {
                println!("[Consumer {}] {}", i, msg);
            }
        }));
    }

    drop(tx);  // Close the sender

    for handle in handles {
        handle.join().unwrap();
    }
}
```

### select! Macro - Wait on Multiple Channels Simultaneously

```rust
use crossbeam_channel::{unbounded, select, after, never, tick};
use std::time::Duration;
use std::thread;

fn main() {
    let (tx1, rx1) = unbounded();
    let (tx2, rx2) = unbounded();

    // Producer 1: Slow sending
    thread::spawn(move || {
        for i in 0..3 {
            thread::sleep(Duration::from_millis(500));
            tx1.send(format!("Channel 1: {}", i)).unwrap();
        }
    });

    // Producer 2: Fast sending
    thread::spawn(move || {
        for i in 0..5 {
            thread::sleep(Duration::from_millis(200));
            tx2.send(format!("Channel 2: {}", i)).unwrap();
        }
    });

    // Use select! to wait on multiple channels simultaneously
    let timeout = after(Duration::from_secs(2));

    loop {
        select! {
            recv(rx1) -> msg => {
                match msg {
                    Ok(m) => println!("[RX1] {}", m),
                    Err(_) => println!("[RX1] Channel closed"),
                }
            }
            recv(rx2) -> msg => {
                match msg {
                    Ok(m) => println!("[RX2] {}", m),
                    Err(_) => println!("[RX2] Channel closed"),
                }
            }
            recv(timeout) -> _ => {
                println!("Timeout, exiting");
                break;
            }
        }
    }
}
```

### Timers and Timeouts

Crossbeam provides convenient timer channels:

```rust
use crossbeam_channel::{unbounded, after, tick, select};
use std::time::Duration;

fn main() {
    let (tx, rx) = unbounded();

    // Timer: Sends a signal after specified time
    let timeout = after(Duration::from_secs(5));

    // Periodic timer: Sends signals at regular intervals
    let ticker = tick(Duration::from_secs(1));

    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_secs(3));
        tx.send("Message arrived").unwrap();
    });

    loop {
        select! {
            recv(rx) -> msg => {
                println!("Received: {:?}", msg);
            }
            recv(ticker) -> _ => {
                println!("Tick...");
            }
            recv(timeout) -> _ => {
                println!("Timeout!");
                break;
            }
        }
    }
}
```

### Zero-Capacity Channel (Rendezvous Channel)

Zero-capacity channels implement synchronous handshaking:

```rust
use crossbeam_channel::bounded;
use std::thread;

fn main() {
    // Zero-capacity channel: Sender must wait for receiver
    let (tx, rx) = bounded(0);

    let sender = thread::spawn(move || {
        println!("[Sender] Preparing to send...");
        tx.send("Synchronous message").unwrap();
        println!("[Sender] Send complete (receiver has received)");
    });

    thread::sleep(std::time::Duration::from_secs(1));

    println!("[Receiver] Preparing to receive...");
    let msg = rx.recv().unwrap();
    println!("[Receiver] Received: {}", msg);

    sender.join().unwrap();
}
```

### Channel Iterators

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

    // Blocking iterator
    for val in rx.iter() {
        println!("Received: {}", val);
    }

    // Non-blocking iterator
    let (tx2, rx2) = unbounded();
    tx2.send(1).unwrap();
    tx2.send(2).unwrap();

    for val in rx2.try_iter() {
        println!("Immediately received: {}", val);
    }
}
```

---

## Best Practices

### Drop Senders Promptly

Ensure all senders are dropped so that the receiver's iteration can end properly:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    // Clone senders
    let tx1 = tx.clone();
    let tx2 = tx.clone();

    thread::spawn(move || {
        tx1.send("from tx1").unwrap();
    });

    thread::spawn(move || {
        tx2.send("from tx2").unwrap();
    });

    // Important: Drop the original sender!
    drop(tx);

    // Now the iterator will end properly after receiving all messages
    for msg in rx {
        println!("{}", msg);
    }
}
```

### Use Structured Message Types

Define clear message enums instead of sending raw data:

```rust
use std::sync::mpsc;

// Good practice: Use enums to define message types
enum Command {
    Process { id: u64, data: Vec<u8> },
    Pause,
    Resume,
    Shutdown,
}

// Avoid: Sending raw data directly
// let (tx, rx) = mpsc::channel::<(u64, Vec<u8>, bool, bool)>();  // Unclear

fn main() {
    let (tx, rx) = mpsc::channel::<Command>();

    tx.send(Command::Process { id: 1, data: vec![1, 2, 3] }).unwrap();
    tx.send(Command::Shutdown).unwrap();
}
```

### Handle Send Failures

When the receiver is dropped, sending will fail:

```rust
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();

    // Drop the receiver
    drop(rx);

    // Send fails, but data can be recovered
    match tx.send("important data".to_string()) {
        Ok(_) => println!("Send successful"),
        Err(e) => {
            // e.0 contains the data that couldn't be sent
            println!("Send failed, data: {}", e.0);
        }
    }
}
```

### Choose the Right Channel Type

| Scenario | Recommended Channel |
|------|---------|
| Simple producer-consumer | `mpsc::channel()` |
| Need backpressure control | `mpsc::sync_channel(n)` |
| Multiple consumers | `crossbeam_channel` |
| Need select | `crossbeam_channel` |
| High performance requirements | `crossbeam_channel` |
| Async programming | `tokio::sync::mpsc` |

### Avoid Creating Channels in Loops

```rust
use std::sync::mpsc;
use std::thread;

// Bad practice
fn bad_pattern() {
    for i in 0..100 {
        let (tx, rx) = mpsc::channel();  // Creates new channel each iteration
        thread::spawn(move || {
            tx.send(i).unwrap();
        });
        println!("{}", rx.recv().unwrap());
    }
}

// Good practice
fn good_pattern() {
    let (tx, rx) = mpsc::channel();  // Create only once

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

## Common Pitfalls

### Forgetting to Drop Sender Causing Deadlock

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    let tx_clone = tx.clone();
    thread::spawn(move || {
        tx_clone.send("message").unwrap();
    });

    // Error: Forgot drop(tx)
    // The loop below will wait forever because tx still exists

    // Correct approach:
    drop(tx);

    for msg in rx {
        println!("{}", msg);
    }
}
```

### Sending After Channel Closed

```rust
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();

    drop(rx);  // Receiver has been dropped

    // This will panic (if using unwrap)
    // tx.send("data").unwrap();

    // Correct approach: Handle the error
    if tx.send("data").is_err() {
        println!("Receiver has closed, cannot send");
    }
}
```

### Sync Channel Deadlock

```rust
use std::sync::mpsc;

fn main() {
    // Zero-capacity sync channel
    let (tx, rx) = mpsc::sync_channel(0);

    // Error: Sending and receiving zero-capacity channel in the same thread
    // tx.send("data").unwrap();  // Will block forever!
    // let _ = rx.recv();

    // Correct approach: Operate in different threads
    std::thread::spawn(move || {
        tx.send("data").unwrap();
    });

    println!("{}", rx.recv().unwrap());
}
```

### Message Order Assumptions

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    // With multiple senders, message order is not deterministic
    for i in 0..10 {
        let tx = tx.clone();
        thread::spawn(move || {
            tx.send(i).unwrap();
        });
    }

    drop(tx);

    // Don't assume the order received is 0, 1, 2, ...
    // Order depends on thread scheduling
    for val in rx {
        println!("{}", val);  // Order may be random
    }
}
```

### Large Messages

```rust
use std::sync::mpsc;

// Avoid sending large data structures
fn avoid_large_messages() {
    let (tx, rx) = mpsc::channel::<Vec<u8>>();

    // Bad: Sending copies of large data
    let large_data = vec![0u8; 100_000_000];
    // tx.send(large_data).unwrap();  // Copies 100MB of data

    // Good: Send Box or Arc
    use std::sync::Arc;
    let (tx_arc, rx_arc) = mpsc::channel::<Arc<Vec<u8>>>();
    let large_data = Arc::new(vec![0u8; 100_000_000]);
    tx_arc.send(large_data).unwrap();  // Only copies the Arc (a few bytes)
}
```

---

## Performance Considerations

### Channel Type Selection

| Type | Throughput | Memory Usage | Use Case |
|------|--------|----------|---------|
| Unbounded Channel | High | Can grow indefinitely | Producer speed <= Consumer speed |
| Bounded Channel | Medium | Controllable | Need backpressure, prevent memory overflow |
| crossbeam | Highest | Optimized | High performance requirements |

### Batch Sending

Reduce channel operations to improve performance:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel::<Vec<i32>>();

    // Good: Batch sending
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
        println!("Received batch, size: {}", batch.len());
    }
}
```

### Avoid Frequent Sender Cloning

```rust
use std::sync::mpsc;
use std::thread;
use std::sync::Arc;

fn main() {
    let (tx, rx) = mpsc::channel();

    // Using Arc<Mutex<Sender>> can avoid cloning in some scenarios
    // But usually cloning Sender directly is simpler and performant enough

    // Standard practice: One clone per thread
    for i in 0..4 {
        let tx = tx.clone();  // Lightweight operation
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

### crossbeam vs mpsc Performance Comparison

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

// crossbeam is typically 2-5x faster than mpsc
```

---

## Real-World Scenarios

### Scenario 1: Task Distribution System

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

    // Create worker thread pool
    let num_workers = 4;
    for worker_id in 0..num_workers {
        let task_rx = task_rx.clone();
        let result_tx = result_tx.clone();

        thread::spawn(move || {
            // Error: mpsc::Receiver cannot be cloned
            // Need to use Arc<Mutex<Receiver>> or crossbeam
        });
    }

    // Correct implementation using crossbeam
    use crossbeam_channel::unbounded;

    let (task_tx, task_rx) = unbounded::<Task>();
    let (result_tx, result_rx) = unbounded::<Result>();

    for worker_id in 0..num_workers {
        let task_rx = task_rx.clone();
        let result_tx = result_tx.clone();

        thread::spawn(move || {
            while let Ok(task) = task_rx.recv() {
                // Simulate work
                thread::sleep(Duration::from_millis(task.workload as u64));

                result_tx.send(Result {
                    task_id: task.id,
                    output: format!("Worker {} completed task {}", worker_id, task.id),
                }).unwrap();
            }
        });
    }

    // Distribute tasks
    for id in 0..20 {
        task_tx.send(Task { id, workload: 100 }).unwrap();
    }
    drop(task_tx);  // Close task channel

    // Collect results
    drop(result_tx);
    for result in result_rx {
        println!("{:?}", result);
    }
}
```

### Scenario 2: Log Aggregator

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

    // Log aggregation thread
    let aggregator = thread::spawn(move || {
        for entry in rx {
            let elapsed = entry.timestamp.duration_since(start);
            println!(
                "[{:?}] [{:?}] [{}] {}",
                elapsed, entry.level, entry.source, entry.message
            );
        }
        println!("Log aggregator closed");
    });

    let logger = Logger { tx };

    // Simulate logging from multiple modules
    let modules = vec!["auth", "database", "api", "cache"];
    let mut handles = vec![];

    for module in modules {
        let logger = logger.clone();
        let module = module.to_string();
        handles.push(thread::spawn(move || {
            for i in 0..3 {
                logger.info(&module, &format!("Operation {} started", i));
                thread::sleep(Duration::from_millis(50));
                logger.info(&module, &format!("Operation {} completed", i));
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

### Scenario 3: Request-Response Pattern

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

    // Server thread
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

    // Client sends requests
    let queries = vec!["user:1", "user:2", "user:3"];

    for (id, query) in queries.iter().enumerate() {
        let (response_tx, response_rx) = mpsc::channel();

        request_tx.send(Request {
            id: id as u64,
            query: query.to_string(),
            response_channel: response_tx,
        }).unwrap();

        // Wait for response
        if let Ok(response) = response_rx.recv() {
            println!("Request {} ({}): {}", response.id, query, response.result);
        }
    }

    drop(request_tx);
    server.join().unwrap();
}
```

### Scenario 4: Pipeline Pattern

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // Create pipeline: input -> filter -> transform -> output
    let (input_tx, input_rx) = mpsc::channel::<i32>();
    let (filter_tx, filter_rx) = mpsc::channel::<i32>();
    let (transform_tx, transform_rx) = mpsc::channel::<String>();

    // Stage 1: Filter even numbers
    thread::spawn(move || {
        for val in input_rx {
            if val % 2 == 0 {
                filter_tx.send(val).unwrap();
            }
        }
    });

    // Stage 2: Square
    thread::spawn(move || {
        for val in filter_rx {
            transform_tx.send(format!("{}^2 = {}", val, val * val)).unwrap();
        }
    });

    // Stage 3: Output
    let output = thread::spawn(move || {
        for result in transform_rx {
            println!("{}", result);
        }
    });

    // Input data
    for i in 1..=10 {
        input_tx.send(i).unwrap();
    }

    drop(input_tx);
    output.join().unwrap();
}
```

---

## Interview Key Points

### What are the differences between mpsc and crossbeam channels?

**Key Points**:
- mpsc is the multiple producer single consumer channel provided by the standard library
- crossbeam supports multiple consumers (MPMC)
- crossbeam provides the select! macro
- crossbeam has better performance (optimized lock-free implementation)
- crossbeam has a richer API (tick, after, etc.)

### Why can't Receiver be cloned?

**Key Points**:
- Ensures single-consumer semantics
- Prevents messages from being competed for by multiple receivers
- If you need multiple consumers, use crossbeam or `Arc<Mutex<Receiver>>`

### When should you use sync channels?

**Key Points**:
- Need backpressure control, prevent producers from going too fast
- Limit memory usage
- Need producers to wait for consumers to process
- Implement synchronous handshaking (zero-capacity channel)

### How to avoid channel deadlocks?

**Key Points**:
- Ensure all senders are dropped
- Avoid using zero-capacity sync channels in the same thread
- Use try_recv or recv_timeout instead of recv
- Properly handle SendError and RecvError

### Message passing vs shared state, how to choose?

**Key Points**:
- Message passing: Decoupling, clear data flow, avoid locks
- Shared state: Low latency, sharing large amounts of data, simple counters
- Message passing suits task distribution, log aggregation, pipeline patterns
- Shared state suits caching, configuration, simple state synchronization

### How to optimize when sending large data?

**Key Points**:
- Use `Arc<T>` to share immutable data
- Use `Box<T>` to avoid large objects on the stack
- Consider sending references (requires scoped threads or crossbeam-scope)
- Batch sending reduces channel operations

---

## Further Reading

### Official Documentation
- [std::sync::mpsc Module Documentation](https://doc.rust-lang.org/std/sync/mpsc/)
- [Rust Book - Message Passing](https://doc.rust-lang.org/book/ch16-02-message-passing.html)

### Third-Party Libraries
- [crossbeam-channel](https://docs.rs/crossbeam-channel) - High-performance MPMC channels
- [flume](https://docs.rs/flume) - Another high-performance channel implementation
- [tokio::sync::mpsc](https://docs.rs/tokio/latest/tokio/sync/mpsc/) - Async channels

### Advanced Reading
- [Fearless Concurrency with Rust](https://blog.rust-lang.org/2015/04/10/Fearless-Concurrency.html)
- [Lock-free Programming in Rust](https://www.youtube.com/watch?v=s19G6n0UjsM)
- [Rust Atomics and Locks](https://marabos.nl/atomics/) - Online book by Mara Bos

### Related Concepts
- CSP (Communicating Sequential Processes)
- Actor Model
- Go channels (one of the inspirations for Rust channels)
