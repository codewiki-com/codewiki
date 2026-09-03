---
title: Concurrent Programming
description: "A Complete Guide to Rust Concurrent Programming: Threads, Message Passing, and Shared State"
track: rust
section: concurrency-async
difficulty: advanced
tags:
  - Rust
  - Concurrency
  - Threads
  - Send
  - Sync
status: imported
origin: old/src/content/docs/rust/concurrency.en.md
divergence: 0.223
issues: []
legacy:
  category: Rust
  subcategory: Concurrency
  order: 6
  lastUpdated: 2026-01-07
---

Concurrent programming is an indispensable part of modern software development. Through its unique ownership system and type system, Rust can prevent data races at compile time, making concurrent programming safer and more reliable. We'll cover concurrent programming techniques in Rust, including threads, message passing, shared state, and the powerful Rayon library.

---

## Thread Basics

### Creating Threads

The Rust standard library provides the `std::thread` module for creating and managing threads. Use the `thread::spawn` function to create a new thread:

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // Create a new thread
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("Child thread: number {}", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    // Main thread work
    for i in 1..5 {
        println!("Main thread: number {}", i);
        thread::sleep(Duration::from_millis(1));
    }

    // Wait for child thread to complete
    handle.join().unwrap();
}
```

### move Closures and Threads

When you need to use external variables in a thread, you must use the `move` keyword to transfer ownership to the closure:

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3, 4, 5];

    // Use move to transfer ownership of data to the thread
    let handle = thread::spawn(move || {
        println!("Data: {:?}", data);
        // data's ownership now belongs to this thread
    });

    // Cannot use data here anymore because ownership has been transferred
    // println!("{:?}", data); // Compile error!

    handle.join().unwrap();
}
```

### Thread Builder

Use `thread::Builder` to customize thread attributes like name and stack size:

```rust
use std::thread;

fn main() {
    let builder = thread::Builder::new()
        .name("worker-thread".to_string())
        .stack_size(32 * 1024); // 32KB stack space

    let handle = builder.spawn(|| {
        println!("Thread name: {:?}", thread::current().name());
    }).unwrap();

    handle.join().unwrap();
}
```

### Getting Thread Count

```rust
use std::thread;

fn main() {
    // Get available parallelism (usually equals CPU core count)
    let num_cpus = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(1);

    println!("Available parallelism: {}", num_cpus);
}
```

### Thread Return Values

Threads can return computed results, retrieved via `join()`:

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        // Calculate Fibonacci number
        let mut a = 0u64;
        let mut b = 1u64;
        for _ in 0..50 {
            let temp = a.saturating_add(b);
            a = b;
            b = temp;
        }
        b // Return result
    });

    let result = handle.join().unwrap();
    println!("Thread return value: {}", result);
}
```

### Scoped Threads

Rust 1.63 introduced scoped threads, allowing threads to borrow data from the stack:

```rust
use std::thread;

fn main() {
    let mut data = vec![1, 2, 3, 4, 5];

    thread::scope(|s| {
        // Can borrow data without move
        s.spawn(|| {
            println!("Reading data: {:?}", data);
        });

        // Can even mutably borrow (as long as there's no conflict)
        s.spawn(|| {
            println!("Data length: {}", data.len());
        });
    });
    // All threads complete when scope ends

    // Can continue using data
    data.push(6);
    println!("Final data: {:?}", data);
}
```

---

## Message Passing and Channels

Rust advocates the concurrency philosophy of "share memory by communicating, rather than communicate by sharing memory." Channels are the core tool for implementing this concept.

### Basic Channel Usage

`std::sync::mpsc` provides Multiple Producer, Single Consumer channels:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // Create channel, returns sender and receiver
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let message = String::from("Hello, main thread!");
        tx.send(message).unwrap();
        // message's ownership has been transferred, cannot use it here
    });

    // Block waiting to receive message
    let received = rx.recv().unwrap();
    println!("Received: {}", received);
}
```

### Sending Multiple Messages

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let messages = vec![
            String::from("Message 1"),
            String::from("Message 2"),
            String::from("Message 3"),
            String::from("Message 4"),
        ];

        for msg in messages {
            tx.send(msg).unwrap();
            thread::sleep(Duration::from_millis(500));
        }
    });

    // Use receiver as iterator
    for received in rx {
        println!("Received: {}", received);
    }
}
```

### Multiple Producers Pattern

By cloning the sender, multiple producers can send messages to the same consumer:

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    // Clone sender for first producer
    let tx1 = tx.clone();
    thread::spawn(move || {
        let messages = vec!["Producer 1: A", "Producer 1: B", "Producer 1: C"];
        for msg in messages {
            tx1.send(msg.to_string()).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
    });

    // Original sender for second producer
    thread::spawn(move || {
        let messages = vec!["Producer 2: X", "Producer 2: Y", "Producer 2: Z"];
        for msg in messages {
            tx.send(msg.to_string()).unwrap();
            thread::sleep(Duration::from_millis(150));
        }
    });

    // Receive all messages
    for received in rx {
        println!("{}", received);
    }
}
```

### Synchronous Channel

`mpsc::sync_channel` creates a bounded channel where send operations block when the buffer is full:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // Create synchronous channel with capacity of 2
    let (tx, rx) = mpsc::sync_channel(2);

    thread::spawn(move || {
        for i in 0..5 {
            println!("Sending: {}", i);
            tx.send(i).unwrap();
            println!("Sent: {}", i);
        }
    });

    thread::sleep(std::time::Duration::from_secs(2));

    for received in rx {
        println!("Received: {}", received);
    }
}
```

### Non-blocking Receive

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        thread::sleep(Duration::from_secs(1));
        tx.send("Delayed message").unwrap();
    });

    // Non-blocking try receive
    loop {
        match rx.try_recv() {
            Ok(msg) => {
                println!("Received: {}", msg);
                break;
            }
            Err(mpsc::TryRecvError::Empty) => {
                println!("No message yet, continuing to wait...");
                thread::sleep(Duration::from_millis(200));
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
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        thread::sleep(Duration::from_secs(2));
        let _ = tx.send("Message");
    });

    // Receive with timeout
    match rx.recv_timeout(Duration::from_secs(1)) {
        Ok(msg) => println!("Received: {}", msg),
        Err(mpsc::RecvTimeoutError::Timeout) => println!("Timeout!"),
        Err(mpsc::RecvTimeoutError::Disconnected) => println!("Disconnected"),
    }
}
```

---

## Shared State Concurrency

While message passing is an elegant approach to concurrency, sometimes shared state is more direct and efficient. Rust provides various synchronization primitives for safely sharing state.

### Mutex

`Mutex<T>` ensures only one thread can access data at a time:

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);

    {
        // Acquire lock, returns MutexGuard smart pointer
        let mut num = m.lock().unwrap();
        *num = 6;
        // MutexGuard automatically releases lock when leaving scope
    }

    println!("m = {:?}", m);
}
```

### Arc and Mutex Together

In multi-threaded environments, use `Arc` (Atomic Reference Counting) to share `Mutex`:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Arc allows multiple threads to share ownership
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

    // Wait for all threads to complete
    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final result: {}", *counter.lock().unwrap());
}
```

### RwLock (Read-Write Lock)

`RwLock<T>` allows multiple readers or one writer:

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // Create multiple reader threads
    for i in 0..3 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            // Acquire read lock (multiple threads can hold simultaneously)
            let read_guard = data.read().unwrap();
            println!("Reader thread {}: {:?}", i, *read_guard);
        }));
    }

    // Create one writer thread
    {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            // Acquire write lock (exclusive access)
            let mut write_guard = data.write().unwrap();
            write_guard.push(4);
            println!("Writer thread: added element 4");
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final data: {:?}", *data.read().unwrap());
}
```

### Mutex vs RwLock Selection Guide

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::time::Instant;

fn benchmark_mutex(iterations: usize) {
    let data = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    let start = Instant::now();

    // Mainly read operations
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

    println!("Mutex time: {:?}", start.elapsed());
}

fn benchmark_rwlock(iterations: usize) {
    let data = Arc::new(RwLock::new(0));
    let mut handles = vec![];

    let start = Instant::now();

    // Mainly read operations
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

    println!("RwLock time: {:?}", start.elapsed());
}

// Selection guide:
// - Read-heavy, write-light: Use RwLock
// - Frequent writes: Use Mutex (RwLock write lock has more overhead)
// - Short lock hold time: Use Mutex
// - Simple and reliable: Use Mutex
```

### Avoiding Deadlock

Deadlock is a common problem in concurrent programming. Here are some strategies to avoid it:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let resource_a = Arc::new(Mutex::new(0));
    let resource_b = Arc::new(Mutex::new(0));

    // Bad example: May cause deadlock
    // Thread 1: Lock A first, then B
    // Thread 2: Lock B first, then A

    // Correct approach: Always acquire locks in the same order
    let (ra1, rb1) = (Arc::clone(&resource_a), Arc::clone(&resource_b));
    let handle1 = thread::spawn(move || {
        let _a = ra1.lock().unwrap();
        let _b = rb1.lock().unwrap();
        println!("Thread 1: acquired both resources");
    });

    let (ra2, rb2) = (Arc::clone(&resource_a), Arc::clone(&resource_b));
    let handle2 = thread::spawn(move || {
        let _a = ra2.lock().unwrap();  // Same order!
        let _b = rb2.lock().unwrap();
        println!("Thread 2: acquired both resources");
    });

    handle1.join().unwrap();
    handle2.join().unwrap();
}
```

### Using try_lock to Avoid Blocking

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

    // Try to acquire lock without blocking
    match lock.try_lock() {
        Ok(guard) => println!("Acquired lock: {}", *guard),
        Err(_) => println!("Lock is held, cannot acquire"),
    }

    handle.join().unwrap();
}
```

### Condvar (Condition Variable)

Condition variables allow threads to wait for specific conditions:

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
        println!("Worker thread: task complete, notifying waiting thread");
        cvar.notify_one();
    });

    let (lock, cvar) = &*pair;
    let mut started = lock.lock().unwrap();

    // Wait for condition to be satisfied
    while !*started {
        println!("Main thread: waiting for notification...");
        started = cvar.wait(started).unwrap();
    }

    println!("Main thread: received notification, continuing execution");
}
```

### Barrier

`Barrier` ensures multiple threads synchronize at a certain point:

```rust
use std::sync::{Arc, Barrier};
use std::thread;

fn main() {
    let barrier = Arc::new(Barrier::new(3));
    let mut handles = vec![];

    for i in 0..3 {
        let barrier = Arc::clone(&barrier);
        handles.push(thread::spawn(move || {
            println!("Thread {} starting work", i);
            thread::sleep(std::time::Duration::from_millis(100 * i as u64));
            println!("Thread {} reached barrier", i);

            barrier.wait();  // Wait for all threads to arrive

            println!("Thread {} continuing execution", i);
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

### Once (One-time Initialization)

`Once` ensures code executes only once, commonly used for global initialization:

```rust
use std::sync::Once;

static INIT: Once = Once::new();
static mut CONFIG: Option<String> = None;

fn get_config() -> &'static str {
    unsafe {
        INIT.call_once(|| {
            println!("Initializing config (executes only once)");
            CONFIG = Some(String::from("Configuration data"));
        });
        CONFIG.as_ref().unwrap()
    }
}

fn main() {
    // Multiple calls, but initialization executes only once
    println!("{}", get_config());
    println!("{}", get_config());
    println!("{}", get_config());
}
```

### Atomic Types

Atomic types provide lock-free thread-safe operations:

```rust
use std::sync::atomic::{AtomicUsize, AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    let counter = Arc::new(AtomicUsize::new(0));
    let running = Arc::new(AtomicBool::new(true));
    let mut handles = vec![];

    // Counter threads
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

    // Stop after running for a while
    thread::sleep(std::time::Duration::from_millis(100));
    running.store(false, Ordering::Relaxed);

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", counter.load(Ordering::SeqCst));
}
```

### Memory Ordering

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

fn main() {
    let counter = AtomicUsize::new(0);

    // Relaxed: Weakest ordering guarantee, best performance
    // Only guarantees atomicity, not ordering
    counter.store(1, Ordering::Relaxed);

    // Acquire: Read operation
    // Ensures subsequent operations won't be reordered before this
    let _val = counter.load(Ordering::Acquire);

    // Release: Write operation
    // Ensures previous operations won't be reordered after this
    counter.store(2, Ordering::Release);

    // AcqRel: Read-modify-write operation
    // Combines Acquire and Release
    counter.fetch_add(1, Ordering::AcqRel);

    // SeqCst: Strongest ordering guarantee
    // Provides globally consistent ordering
    counter.store(3, Ordering::SeqCst);

    println!("Final value: {}", counter.load(Ordering::SeqCst));
}
```

---

## Send and Sync Traits

Rust ensures thread safety through the `Send` and `Sync` marker traits.

### Send Trait

`Send` marks that ownership of a type can be safely transferred between threads:

```rust
// Almost all Rust types implement Send
// Exceptions: Rc<T>, raw pointers, etc.

use std::thread;

fn main() {
    let data = vec![1, 2, 3];  // Vec<T> implements Send

    // Can safely move to another thread
    let handle = thread::spawn(move || {
        println!("{:?}", data);
    });

    handle.join().unwrap();
}
```

### Sync Trait

`Sync` marks that a type can safely share references between multiple threads:

```rust
// If T implements Sync, then &T implements Send
// Mutex<T>, RwLock<T>, AtomicXxx, etc. all implement Sync

use std::sync::Arc;
use std::thread;

fn main() {
    // Arc<T> requires T: Send + Sync
    let data = Arc::new(vec![1, 2, 3]);

    let data_clone = Arc::clone(&data);
    let handle = thread::spawn(move || {
        // Safely access shared data
        println!("{:?}", data_clone);
    });

    println!("{:?}", data);
    handle.join().unwrap();
}
```

### Rules for Send and Sync

```rust
// Core rules:
// 1. If T: Send, then &mut T: Send
// 2. If T: Sync, then &T: Send
// 3. If T: Send + Sync, then Arc<T>: Send + Sync

// Types that don't implement Send:
// - Rc<T>: Reference count is not atomic
// - *const T, *mut T: Raw pointers
// - MutexGuard: Must be released on the same thread

// Types that don't implement Sync:
// - Cell<T>, RefCell<T>: Interior mutability is not thread-safe
// - Rc<T>: Same as above
// - UnsafeCell<T>: Building block, provides no synchronization
```

### Thread Safety for Custom Types

```rust
use std::sync::Arc;
use std::thread;

// If all fields are Send + Sync,
// the struct automatically implements Send + Sync
#[derive(Debug)]
struct ThreadSafeData {
    id: i32,
    name: String,
}

// Type containing non-thread-safe field
struct NotThreadSafe {
    data: std::rc::Rc<i32>, // Rc is not Send
}

fn main() {
    let safe_data = Arc::new(ThreadSafeData {
        id: 1,
        name: String::from("test"),
    });

    let data_clone = Arc::clone(&safe_data);
    let handle = thread::spawn(move || {
        println!("{:?}", data_clone);
    });

    handle.join().unwrap();

    // The following code won't compile:
    // let not_safe = Arc::new(NotThreadSafe { data: Rc::new(1) });
    // thread::spawn(move || { ... }); // Error! NotThreadSafe is not Send
}
```

### Manual Implementation (Use with Caution)

```rust
// Usually you don't need to manually implement these traits
// If you really need to, you must use unsafe

struct MyType {
    ptr: *mut i32,
}

// Warning: This is unsafe!
// Only do this when you can guarantee safety
unsafe impl Send for MyType {}
unsafe impl Sync for MyType {}

// In practice, use safe abstractions
// like Mutex, Arc, etc. to handle shared data
```

---

## Rayon Parallel Computing Library

Rayon is the most popular data parallelism library in the Rust ecosystem, making parallel programming extremely simple. Rayon uses a work-stealing algorithm to efficiently distribute tasks.

### Adding Dependency

```toml
# Cargo.toml
[dependencies]
rayon = "1.10"
```

### Parallel Iterators

Rayon's core is parallel iterators. Simply replace `iter()` with `par_iter()` to achieve parallelism:

```rust
use rayon::prelude::*;

fn main() {
    let numbers: Vec<i32> = (1..=100).collect();

    // Sequential sum of squares
    let sum_serial: i32 = numbers.iter()
        .map(|&x| x * x)
        .sum();

    // Parallel computation - just change to par_iter()!
    let sum_parallel: i32 = numbers.par_iter()
        .map(|&x| x * x)
        .sum();

    println!("Sequential result: {}", sum_serial);
    println!("Parallel result: {}", sum_parallel);
}
```

### Common Parallel Iterator Methods

```rust
use rayon::prelude::*;

fn main() {
    let data: Vec<i32> = (1..=1000).collect();

    // par_iter(): Parallel immutable iteration
    let sum: i32 = data.par_iter().sum();
    println!("Sum: {}", sum);

    // par_iter_mut(): Parallel mutable iteration
    let mut mutable_data: Vec<i32> = (1..=100).collect();
    mutable_data.par_iter_mut().for_each(|x| *x *= 2);
    println!("Doubled: {:?}", &mutable_data[..5]);

    // into_par_iter(): Consuming parallel iteration
    let squared: Vec<i32> = (1..=10).into_par_iter()
        .map(|x| x * x)
        .collect();
    println!("Squared: {:?}", squared);

    // par_chunks(): Parallel chunk processing
    let chunked_data: Vec<i32> = (1..=100).collect();
    let chunk_sums: Vec<i32> = chunked_data
        .par_chunks(10)
        .map(|chunk| chunk.iter().sum())
        .collect();
    println!("Chunk sums: {:?}", chunk_sums);

    // Parallel filtering
    let evens: Vec<i32> = (1..=100).into_par_iter()
        .filter(|&x| x % 2 == 0)
        .collect();
    println!("Even count: {}", evens.len());
}
```

### Parallel Sorting

```rust
use rayon::prelude::*;

fn main() {
    // Parallel sort
    let mut data: Vec<i32> = (1..=10000).rev().collect();
    data.par_sort();
    assert!(data.windows(2).all(|w| w[0] <= w[1]));
    println!("Sort complete (ascending)");

    // Parallel unstable sort (faster)
    let mut data2: Vec<i32> = (1..=10000).rev().collect();
    data2.par_sort_unstable();

    // Custom comparison function
    let mut data3: Vec<i32> = (1..=10000).collect();
    data3.par_sort_by(|a, b| b.cmp(a));  // Descending
    println!("First 5 (descending): {:?}", &data3[..5]);

    // Sort by key
    let mut strings = vec!["banana", "apple", "cherry", "date"];
    strings.par_sort_by_key(|s| s.len());
    println!("Sorted by length: {:?}", strings);
}
```

### join and scope

`join` is for executing two tasks in parallel, `scope` is for more complex parallel structures:

```rust
use rayon::prelude::*;

fn main() {
    // join: Execute two tasks in parallel
    let (result_a, result_b) = rayon::join(
        || {
            // Task A: Calculate sum from 1 to 1000
            (1..=1000).sum::<i64>()
        },
        || {
            // Task B: Calculate sum of squares from 1 to 1000
            (1..=1000).map(|x: i64| x * x).sum::<i64>()
        }
    );

    println!("Task A result (sum): {}", result_a);
    println!("Task B result (sum of squares): {}", result_b);

    // scope: Create parallel scope, can borrow external data
    let mut results = vec![0; 4];
    rayon::scope(|s| {
        for (i, result) in results.iter_mut().enumerate() {
            s.spawn(move |_| {
                *result = (i + 1) * 10;
                println!("Task {} complete", i);
            });
        }
    });
    // All child tasks complete before continuing
    println!("Results: {:?}", results);
}
```

### Custom Thread Pool

```rust
use rayon::prelude::*;
use rayon::ThreadPoolBuilder;

fn main() {
    // Create custom thread pool
    let pool = ThreadPoolBuilder::new()
        .num_threads(4)
        .thread_name(|i| format!("rayon-worker-{}", i))
        .build()
        .unwrap();

    // Execute in custom thread pool
    let result = pool.install(|| {
        let data: Vec<i32> = (1..=1000).collect();
        data.par_iter()
            .map(|&x| x * x)
            .sum::<i32>()
    });

    println!("Result computed in custom thread pool: {}", result);

    // Global configuration (must be called before using Rayon)
    // ThreadPoolBuilder::new()
    //     .num_threads(8)
    //     .build_global()
    //     .unwrap();
}
```

### Parallel String Processing

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

    // Parallel uppercase conversion
    let uppercase: Vec<String> = texts.par_iter()
        .map(|s| s.to_uppercase())
        .collect();
    println!("Uppercase: {:?}", uppercase);

    // Parallel filtering
    let long_texts: Vec<&str> = texts.par_iter()
        .filter(|s| s.len() > 12)
        .copied()
        .collect();
    println!("Long texts: {:?}", long_texts);

    // Parallel find
    let found = texts.par_iter()
        .find_any(|s| s.contains("Rust"));
    println!("Contains Rust: {:?}", found);

    // Parallel counting
    let total_chars: usize = texts.par_iter()
        .map(|s| s.len())
        .sum();
    println!("Total characters: {}", total_chars);
}
```

### Parallel Chained Operations

```rust
use rayon::prelude::*;

fn main() {
    let data: Vec<i32> = (1..=1000).collect();

    // Complex chained parallel operations
    let result: Vec<i32> = data.par_iter()
        .filter(|&&x| x % 3 == 0)    // Filter multiples of 3
        .map(|&x| x * 2)              // Double
        .filter(|&x| x > 100)         // Filter greater than 100
        .collect();

    println!("Result count: {}", result.len());
    println!("First 10: {:?}", &result[..10.min(result.len())]);

    // Parallel fold
    let sum = data.par_iter()
        .fold(|| 0, |acc, &x| acc + x)
        .sum::<i32>();
    println!("Fold sum: {}", sum);

    // Parallel reduce
    let max = data.par_iter()
        .reduce(|| &0, |a, b| if a > b { a } else { b });
    println!("Maximum: {}", max);
}
```

---

## Practical Examples

### Example 1: Concurrent Web Crawler

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
                // Check if already visited
                {
                    let mut visited_guard = visited.lock().unwrap();
                    if visited_guard.contains(&url) {
                        return;
                    }
                    visited_guard.insert(url.clone());
                }

                // Simulate crawling
                println!("Crawling: {}", url);
                thread::sleep(Duration::from_millis(100));

                // Store result
                let mut results_guard = results.lock().unwrap();
                results_guard.push(format!("Crawl complete: {}", url));
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

    println!("\n=== Crawl Results ===");
    for result in crawler.get_results() {
        println!("{}", result);
    }
}
```

### Example 2: Producer-Consumer Pattern

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

    // Create producers
    let mut producer_handles = vec![];
    for producer_id in 0..num_producers {
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            for i in 0..5 {
                let task = Task {
                    id: producer_id * 100 + i,
                    data: format!("Data from producer {}", producer_id),
                };
                println!("[Producer {}] Sending task {}", producer_id, task.id);
                tx.send(task).unwrap();
                thread::sleep(Duration::from_millis(50));
            }
            println!("[Producer {}] Complete", producer_id);
        });
        producer_handles.push(handle);
    }

    // Close original sender
    drop(tx);

    // Create consumers
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
                        println!("[Consumer {}] Processing task {} - {}",
                                 consumer_id, task.id, task.data);
                        thread::sleep(Duration::from_millis(100));
                    }
                    Err(mpsc::TryRecvError::Empty) => {
                        thread::sleep(Duration::from_millis(10));
                    }
                    Err(mpsc::TryRecvError::Disconnected) => {
                        println!("[Consumer {}] Channel closed, exiting", consumer_id);
                        break;
                    }
                }
            }
        });
        consumer_handles.push(handle);
    }

    // Wait for all threads to complete
    for handle in producer_handles {
        handle.join().unwrap();
    }
    for handle in consumer_handles {
        handle.join().unwrap();
    }

    println!("\nAll tasks processed!");
}
```

### Example 3: Image Processing with Rayon

```rust
use rayon::prelude::*;

// Simulated pixel structure
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

    // Parallel grayscale conversion
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

    // Parallel inversion
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

    // Parallel brightness adjustment
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

    // Parallel row processing
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
    println!("Original image: {}x{} ({} pixels)",
             image.width, image.height, image.width * image.height);

    // Parallel processing performance test
    let start = std::time::Instant::now();
    let _grayscale = image.to_grayscale_parallel();
    println!("Grayscale conversion time: {:?}", start.elapsed());

    let start = std::time::Instant::now();
    let _inverted = image.invert_parallel();
    println!("Inversion time: {:?}", start.elapsed());

    let start = std::time::Instant::now();
    let _brightened = image.adjust_brightness_parallel(1.2);
    println!("Brightness adjustment time: {:?}", start.elapsed());

    println!("Image processing complete!");
}
```

### Example 4: Thread Pool Implementation

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
        assert!(size > 0, "Thread pool size must be greater than 0");

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
        println!("Sending terminate signal to all workers...");

        for _ in &self.workers {
            self.sender
                .as_ref()
                .unwrap()
                .send(Message::Terminate)
                .unwrap();
        }

        println!("Shutting down all workers...");

        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);
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
                    println!("Worker {} received task", id);
                    job();
                }
                Message::Terminate => {
                    println!("Worker {} received terminate signal", id);
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
            println!("Executing task {}", i);
            thread::sleep(std::time::Duration::from_millis(100));
            println!("Task {} complete", i);
        });
    }

    // Wait for task execution
    thread::sleep(std::time::Duration::from_secs(1));
    println!("\nAll tasks submitted, thread pool shutting down...");

    // ThreadPool gracefully shuts down all workers when dropped
}
```

### Example 5: Parallel File Processing

```rust
use rayon::prelude::*;
use std::collections::HashMap;

fn main() {
    // Simulated file contents
    let files: Vec<(&str, &str)> = vec![
        ("file1.txt", "hello world rust programming"),
        ("file2.txt", "rust is fast and safe"),
        ("file3.txt", "concurrent programming in rust"),
        ("file4.txt", "hello rust hello world"),
        ("file5.txt", "safe concurrent rust code"),
    ];

    // Parallel word frequency count for each file
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

    // Print results
    for (name, counts) in &word_counts {
        println!("\n{} word frequency:", name);
        for (word, count) in counts {
            println!("  {}: {}", word, count);
        }
    }

    // Parallel merge of all file word frequencies
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

    println!("\n=== Total Word Frequency ===");
    let mut sorted: Vec<_> = total_counts.iter().collect();
    sorted.sort_by(|a, b| b.1.cmp(a.1));
    for (word, count) in sorted {
        println!("{}: {}", word, count);
    }
}
```

---

## Best Practices

### Choosing the Right Concurrency Model

```rust
// Scenario selection guide:

// Independent tasks, no shared state -> Message passing (mpsc)
// Simple data sharing -> Arc<T> (immutable)
// Need to modify shared data -> Arc<Mutex<T>> or Arc<RwLock<T>>
// Data parallel processing -> Rayon
// Simple counters/flags -> Atomic types
// Heavy I/O operations -> Consider async programming (async/await)
```

### Minimize Lock Hold Time

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

// Good practice: Only hold lock when necessary
fn good_practice(data: Arc<Mutex<Vec<i32>>>) {
    let item = {
        let guard = data.lock().unwrap();
        guard.get(0).copied()
    };  // Lock released here

    // Perform time-consuming operations outside the lock
    if let Some(value) = item {
        println!("Processing: {}", value);
        thread::sleep(Duration::from_secs(1));
    }
}

// Bad practice: Performing time-consuming operations while holding lock
fn bad_practice(data: Arc<Mutex<Vec<i32>>>) {
    let guard = data.lock().unwrap();
    if let Some(&value) = guard.get(0) {
        println!("Processing: {}", value);
        thread::sleep(Duration::from_secs(1)); // Other threads must wait!
    }
}
```

### Avoid Unnecessary Cloning

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    // Good: Use Arc to share immutable data
    let data = Arc::new(vec![1, 2, 3, 4, 5]);

    let handles: Vec<_> = (0..4).map(|i| {
        let data = Arc::clone(&data);  // Only increments reference count, O(1)
        thread::spawn(move || {
            println!("Thread {}: {:?}", i, data);
        })
    }).collect();

    for handle in handles {
        handle.join().unwrap();
    }

    // Bad: Clone entire data each time
    // let handles: Vec<_> = (0..4).map(|i| {
    //     let data = data.clone();  // Clones entire Vec, O(n)
    //     thread::spawn(move || { ... })
    // }).collect();
}
```

### Use parking_lot Instead of Standard Library

For high-performance scenarios, consider using the `parking_lot` crate:

```toml
[dependencies]
parking_lot = "0.12"
```

```rust
use parking_lot::{Mutex, RwLock};
use std::sync::Arc;

fn main() {
    // parking_lot's Mutex doesn't return Result
    let data = Arc::new(Mutex::new(0));

    let mut num = data.lock();  // Directly get MutexGuard
    *num += 1;
    drop(num);

    // parking_lot advantages:
    // - Smaller memory footprint
    // - Faster lock acquisition
    // - No poisoning
    // - Supports fair locking

    let rw_data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let read_guard = rw_data.read();
    println!("{:?}", *read_guard);
}
```

### Atomic Operations for Simple Counting

```rust
use std::sync::atomic::{AtomicUsize, AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    // For simple counters, atomic types are more efficient than Mutex
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

    println!("Count: {}", counter.load(Ordering::Relaxed));
}
```

### Error Handling and Lock Poisoning

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
                // Lock is poisoned (previous thread holding the lock panicked)
                // Can choose to recover data
                eprintln!("Lock poisoned, attempting recovery...");
                let mut data = poisoned.into_inner();
                data.clear();  // Reset state
                Err("Lock poisoned, reset complete")
            }
        }
    });

    match handle.join() {
        Ok(result) => println!("Thread complete: {:?}", result),
        Err(_) => println!("Thread panicked"),
    }
}
```

### Avoiding Common Pitfalls

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Pitfall 1: Forgetting to release lock
    let data = Arc::new(Mutex::new(0));
    {
        let _guard = data.lock().unwrap();
        // Forgetting to release lock will block other threads
        // Use scope or explicit drop
    } // Auto-released

    // Pitfall 2: Holding lock across await in async code
    // Should use tokio::sync::Mutex instead

    // Pitfall 3: Overusing unwrap
    let guard = match data.lock() {
        Ok(g) => g,
        Err(poisoned) => {
            eprintln!("Warning: lock poisoned");
            poisoned.into_inner()
        }
    };
    drop(guard);

    // Pitfall 4: Wrong Arc clone location
    let data = Arc::new(Mutex::new(0));
    for _ in 0..4 {
        let data = Arc::clone(&data); // Correct: clone inside loop
        thread::spawn(move || {
            let _guard = data.lock().unwrap();
        });
    }

    thread::sleep(std::time::Duration::from_millis(100));
}
```

---

## Summary

Rust's concurrent programming model ensures safety through these features:

1. **Ownership System**: Prevents data races, detects issues at compile time
2. **Send/Sync Traits**: Mark type thread safety
3. **Strongly Typed Channels**: Type-safe message passing
4. **Smart Pointers**: Arc, Mutex, RwLock, etc. provide thread-safe sharing

### Concurrency Strategy Selection Guide

| Scenario | Recommended Approach |
|----------|---------------------|
| Independent task communication | `mpsc` channel |
| Shared read-only data | `Arc<T>` |
| Shared mutable data (write-heavy) | `Arc<Mutex<T>>` |
| Shared mutable data (read-heavy, write-light) | `Arc<RwLock<T>>` |
| Data parallel processing | Rayon |
| Simple counters/flags | `AtomicUsize` / `AtomicBool` |
| High-performance scenarios | `parking_lot` crate |
| One-time initialization | `Once` or `OnceLock` |

### Performance Considerations

- **Rayon** is suitable for CPU-intensive data parallel tasks
- **Atomic types** are suitable for simple lock-free operations
- **Mutex** is suitable for scenarios with short lock hold times
- **RwLock** is suitable for read-heavy, write-light scenarios
- **Channels** are suitable for decoupling producers and consumers

### Core Philosophy

> "If the code compiles, it won't have data races." - Rust concurrency safety guarantee

Master these concurrency tools, and you'll be able to write concurrent Rust programs that are both safe and efficient. Rust's compiler is your best friend, catching most concurrency errors at compile time, letting you focus on business logic rather than debugging hard-to-reproduce concurrency bugs.
