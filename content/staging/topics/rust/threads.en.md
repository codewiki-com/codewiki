---
title: Rust Threading In-Depth Guide
description: "Master Rust's standard library threading model: std::thread, spawn, join, move closures, and scoped threads"
track: rust
section: concurrency-async
difficulty: intermediate
tags:
  - Rust
  - threads
  - concurrency
  - std::thread
  - spawn
  - join
  - thread::scope
status: imported
origin: old/src/content/docs/rust/threads.en.md
divergence: 0.221
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: rust
  subcategory: ""
  order: 5
  lastUpdated: 2026-01-07
---

## Concepts Explained

### What Are Threads?

Threads are the smallest unit of execution that the operating system can schedule. They represent the actual execution units within a process. Multi-threaded programming allows a program to execute multiple tasks simultaneously, fully leveraging the computational power of multi-core processors and improving overall program performance and responsiveness.

Rust provides a 1:1 threading model through the standard library's `std::thread` module, meaning each Rust thread directly corresponds to an operating system thread. This model ensures optimal system integration and predictable performance characteristics.

### Historical Background

Before Rust 1.0, the language supported an M:N threading model (green threads), but to maintain language simplicity and the zero-cost abstraction principle, the 1:1 model was ultimately chosen. While green threads have lower overhead, they require more substantial runtime support, which contradicts Rust's design philosophy.

Rust 1.63 (released August 2022) introduced scoped threads (`thread::scope`), a major improvement to the threading API that addresses the limitation of traditional `spawn` requiring `'static` lifetime.

### Problems Solved

Traditional multi-threaded programming faces numerous challenges:

1. **Data Races**: Multiple threads reading and writing the same data simultaneously
2. **Memory Safety**: Issues like dangling pointers and use-after-free errors
3. **Lifetime Management**: Ensuring data accessed by threads remains valid during their execution

Rust addresses these issues at compile time through its ownership and type systems, converting runtime errors into compile-time errors.

## Core Principles

### Threading Model Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Rust Program                      │
├─────────────────────────────────────────────────────┤
│    std::thread API                                  │
│    ┌─────────┬─────────┬──────────┬───────────┐    │
│    │ spawn   │  join   │  scope   │  Builder  │    │
│    └─────────┴─────────┴──────────┴───────────┘    │
├─────────────────────────────────────────────────────┤
│    Operating System Thread Interface                 │
│    (pthread / Windows Threads)                      │
├─────────────────────────────────────────────────────┤
│    Hardware (CPU Cores)                              │
│    ┌────┐ ┌────┐ ┌────┐ ┌────┐                     │
│    │Core│ │Core│ │Core│ │Core│                     │
│    └────┘ └────┘ └────┘ └────┘                     │
└─────────────────────────────────────────────────────┘
```

### JoinHandle Mechanism

`thread::spawn` returns a `JoinHandle<T>`, which is a handle to the thread with the following characteristics:

- **Ownership Transfer**: `JoinHandle` owns the corresponding thread
- **Blocking Wait**: Calling `join()` blocks the current thread until the target thread completes
- **Return Value Passing**: `join()` returns `Result<T, Box<dyn Any + Send>>`
- **Automatic Detach**: If `JoinHandle` is dropped without calling `join()`, the thread is automatically detached

```
┌──────────────────┐         ┌──────────────────┐
│    Main Thread   │         │    Child Thread  │
├──────────────────┤         ├──────────────────┤
│ spawn() ─────────┼────────►│ Start execution  │
│ returns Handle   │         │  ...             │
│   ...            │         │  ...             │
│ join() ──────────┼─────────│ Complete         │
│ blocks           │◄────────┼─ Return result   │
│ continues        │         │                  │
└──────────────────┘         └──────────────────┘
```

### Ownership Transfer with move Closures

When a closure captures external variables, Rust must determine how to capture them:

- **Borrowing**: The default method, the closure borrows the variable
- **Moving**: Using the `move` keyword, the closure takes ownership of the variable

In threads, you must use `move` because the compiler cannot guarantee that borrows remain valid during the thread's lifetime:

```
Main thread stack:
┌─────────────────┐
│ data: Vec<i32>  │──── ownership ────┐
└─────────────────┘                   │
                                      ▼
Child thread:                 ┌──────────────────┐
┌─────────────────┐          │ Closure env      │
│ Execute closure │◄─────────│ data: Vec<i32>   │
└─────────────────┘          └──────────────────┘
```

### Scoped Threads Mechanism

`thread::scope` creates a scope where threads created within it:

1. Are guaranteed to complete before the scope ends
2. Can safely borrow stack data (no `'static` requirement)
3. Automatically join all child threads

```
┌─────────────────────────────────────────┐
│ fn main() {                             │
│     let data = vec![1, 2, 3];           │
│     ┌─────────────────────────────────┐ │
│     │ thread::scope(|s| {             │ │
│     │     s.spawn(|| {                │ │
│     │         // Can borrow data      │ │
│     │         println!("{:?}", data); │ │
│     │     });                         │ │
│     │     // Auto join at scope end   │ │
│     │ });                             │ │
│     └─────────────────────────────────┘ │
│     // Threads guaranteed complete     │
│     data.push(4);                       │
│ }                                       │
└─────────────────────────────────────────┘
```

## Key Points

### std::thread Module Overview

| Component | Description |
|-----------|-------------|
| `spawn` | Create a new thread, returns `JoinHandle` |
| `JoinHandle` | Thread handle for join and return value retrieval |
| `scope` | Create a scoped thread environment |
| `Scope` | Scope type providing `spawn` method |
| `ScopedJoinHandle` | Scoped thread handle |
| `Builder` | Thread configuration builder |
| `current` | Get current thread handle |
| `sleep` | Put thread to sleep |
| `yield_now` | Voluntarily yield CPU |
| `park` / `unpark` | Thread suspend and wake |
| `available_parallelism` | Get available parallelism |

### spawn vs scope Comparison

| Feature | `spawn` | `scope` |
|---------|---------|---------|
| Lifetime requirement | `'static` | Can borrow local variables |
| Join method | Manual `join()` call | Automatic join |
| Return handle | `JoinHandle<T>` | `ScopedJoinHandle<'scope, T>` |
| Thread detach | Can detach | Cannot detach |
| Use case | Long-running tasks | Temporary parallel computation |

### Thread Safety Guarantees

Rust guarantees thread safety through the following mechanisms:

1. **Send trait**: Type can safely transfer ownership between threads
2. **Sync trait**: Type's references can safely be shared between threads
3. **Ownership System**: Compile-time checks for legal data access
4. **Lifetime Checking**: Ensures references remain valid during use

## Code Examples

### Basic Thread Creation and Join

```rust
use std::thread;
use std::time::Duration;

fn main() {
    println!("Main thread started");

    // spawn returns JoinHandle
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("Child thread: counting {}", i);
            thread::sleep(Duration::from_millis(100));
        }
        "Child thread complete" // Return value
    });

    // Main thread continues
    for i in 1..=3 {
        println!("Main thread: counting {}", i);
        thread::sleep(Duration::from_millis(150));
    }

    // join waits for child thread to complete and gets return value
    let result = handle.join().unwrap();
    println!("Child thread returned: {}", result);

    println!("Main thread finished");
}

// Output example:
// Main thread started
// Main thread: counting 1
// Child thread: counting 1
// Child thread: counting 2
// Main thread: counting 2
// Child thread: counting 3
// Main thread: counting 3
// Child thread: counting 4
// Child thread: counting 5
// Child thread returned: Child thread complete
// Main thread finished
```

### move Closure Explained

```rust
use std::thread;

fn main() {
    // Example 1: must use move
    let numbers = vec![1, 2, 3, 4, 5];

    let handle = thread::spawn(move || {
        // Ownership of numbers transferred to this closure
        let sum: i32 = numbers.iter().sum();
        println!("Vector sum: {}", sum);
        sum
    });

    // Error! numbers has been moved
    // println!("{:?}", numbers);

    let result = handle.join().unwrap();
    println!("Result: {}", result);

    // Example 2: clone then move
    let data = String::from("Hello");
    let data_clone = data.clone();

    let handle = thread::spawn(move || {
        println!("In thread: {}", data_clone);
    });

    // Original data still usable
    println!("Main thread: {}", data);
    handle.join().unwrap();

    // Example 3: move multiple variables
    let name = String::from("Rust");
    let version = 2021u32;
    let features = vec!["safe", "concurrent", "efficient"];

    let handle = thread::spawn(move || {
        // All variables moved to closure
        println!("{} {} features: {:?}", name, version, features);
    });

    handle.join().unwrap();
}
```

### Thread Return Values and Error Handling

```rust
use std::thread;

fn main() {
    // Normal return
    let handle = thread::spawn(|| -> i32 {
        let mut sum = 0;
        for i in 1..=100 {
            sum += i;
        }
        sum
    });

    match handle.join() {
        Ok(result) => println!("Computation result: {}", result),
        Err(e) => println!("Thread panic: {:?}", e),
    }

    // Handle thread panic
    let handle = thread::spawn(|| {
        panic!("Child thread error!");
    });

    match handle.join() {
        Ok(_) => println!("Thread completed normally"),
        Err(e) => {
            // Attempt to convert panic message to string
            if let Some(msg) = e.downcast_ref::<&str>() {
                println!("Thread panic message: {}", msg);
            } else if let Some(msg) = e.downcast_ref::<String>() {
                println!("Thread panic message: {}", msg);
            } else {
                println!("Thread panicked with unknown type");
            }
        }
    }

    // Return Result type
    let handle = thread::spawn(|| -> Result<i32, String> {
        let value = 42;
        if value > 0 {
            Ok(value * 2)
        } else {
            Err("Value must be positive".to_string())
        }
    });

    match handle.join() {
        Ok(Ok(result)) => println!("Success: {}", result),
        Ok(Err(e)) => println!("Business error: {}", e),
        Err(_) => println!("Thread panic"),
    }
}
```

### Scoped Threads (thread::scope)

```rust
use std::thread;

fn main() {
    let mut data = vec![1, 2, 3, 4, 5];
    let config = "processing config";

    // Threads in scope can borrow local variables
    thread::scope(|s| {
        // Immutable borrow
        s.spawn(|| {
            println!("Thread 1 reading config: {}", config);
            println!("Thread 1 reading data: {:?}", data);
        });

        // Another immutable borrow
        s.spawn(|| {
            let sum: i32 = data.iter().sum();
            println!("Thread 2 calculating sum: {}", sum);
        });

        // Can create more threads
        for i in 0..3 {
            s.spawn(move || {
                println!("Worker thread {} executing", i);
            });
        }
    });
    // All threads automatically join here

    // Can continue using and modifying data
    data.push(6);
    println!("Final data: {:?}", data);
}
```

### Mutable Borrowing with Scoped Threads

```rust
use std::thread;

fn main() {
    let mut results = vec![0; 5];

    thread::scope(|s| {
        // Use iter_mut to split mutable borrow
        for (i, result) in results.iter_mut().enumerate() {
            s.spawn(move || {
                // Each thread has exclusive mutable reference to one element
                *result = (i + 1) * 10;
                println!("Thread {} set result to {}", i, *result);
            });
        }
    });

    println!("All results: {:?}", results);
    // Output: All results: [10, 20, 30, 40, 50]
}
```

### thread::Builder Advanced Configuration

```rust
use std::thread;

fn main() {
    // Customize thread name and stack size
    let builder = thread::Builder::new()
        .name("compute-thread".to_string())
        .stack_size(4 * 1024 * 1024); // 4MB stack

    let handle = builder.spawn(|| {
        let current = thread::current();
        println!("Thread name: {:?}", current.name());
        println!("Thread ID: {:?}", current.id());

        // Large stack allocation (requires larger stack)
        let large_array = [0u8; 1024 * 1024]; // 1MB
        println!("Allocated large array, length: {}", large_array.len());
    }).expect("Thread creation failed");

    handle.join().unwrap();

    // Get available parallelism
    match thread::available_parallelism() {
        Ok(count) => println!("Available parallelism: {}", count),
        Err(e) => println!("Cannot get parallelism: {}", e),
    }
}
```

### Inter-Thread Data Sharing Patterns

```rust
use std::thread;
use std::sync::Arc;

fn main() {
    // Use Arc to share immutable data across threads
    let shared_data = Arc::new(vec![1, 2, 3, 4, 5]);
    let mut handles = vec![];

    for i in 0..3 {
        // Clone Arc (only increments reference count)
        let data = Arc::clone(&shared_data);
        let handle = thread::spawn(move || {
            println!("Thread {} reading data: {:?}", i, data);
            let sum: i32 = data.iter().sum();
            println!("Thread {} calculated sum: {}", i, sum);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    // Arc still usable after all threads finish
    println!("Shared data reference count: {}", Arc::strong_count(&shared_data));
}
```

### Thread Control: park and unpark

```rust
use std::thread;
use std::time::Duration;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

fn main() {
    let ready = Arc::new(AtomicBool::new(false));
    let ready_clone = Arc::clone(&ready);

    let handle = thread::spawn(move || {
        println!("Worker thread: waiting for signal...");

        // Park thread, wait to be unparked
        while !ready_clone.load(Ordering::Relaxed) {
            thread::park();
        }

        println!("Worker thread: received signal, starting work");
        thread::sleep(Duration::from_millis(100));
        println!("Worker thread: work complete");
    });

    // Main thread prepares
    println!("Main thread: preparing data...");
    thread::sleep(Duration::from_millis(500));

    // Set ready flag and unpark worker thread
    ready.store(true, Ordering::Relaxed);
    handle.thread().unpark();

    println!("Main thread: signal sent");
    handle.join().unwrap();
}
```

### Creating Multiple Threads and Collecting Results

```rust
use std::thread;

fn main() {
    let input_data: Vec<i32> = (1..=10).collect();

    // Create multiple threads to process data
    let handles: Vec<_> = input_data
        .into_iter()
        .map(|n| {
            thread::spawn(move || {
                // Simulate computation
                let result = n * n;
                println!("Computing {}^2 = {}", n, result);
                result
            })
        })
        .collect();

    // Collect all results
    let results: Vec<i32> = handles
        .into_iter()
        .map(|h| h.join().unwrap())
        .collect();

    println!("All results: {:?}", results);
    println!("Sum of results: {}", results.iter().sum::<i32>());
}
```

### Parallel Chunk Processing with scope

```rust
use std::thread;

fn main() {
    let data: Vec<i32> = (1..=100).collect();
    let chunk_size = 25;

    let mut partial_sums = vec![0i32; 4];

    thread::scope(|s| {
        for (chunk, sum) in data.chunks(chunk_size).zip(partial_sums.iter_mut()) {
            s.spawn(move || {
                *sum = chunk.iter().sum();
                println!("Chunk sum: {:?} = {}", chunk, *sum);
            });
        }
    });

    let total: i32 = partial_sums.iter().sum();
    println!("Chunk results: {:?}", partial_sums);
    println!("Total: {}", total);
}
```

## Best Practices

### Prefer scope Over spawn

```rust
use std::thread;

fn process_data(data: &[i32]) {
    // Recommended: use scope, can borrow parameters
    thread::scope(|s| {
        for chunk in data.chunks(10) {
            s.spawn(|| {
                println!("Processing: {:?}", chunk);
            });
        }
    });
}

fn main() {
    let data: Vec<i32> = (1..=50).collect();
    process_data(&data);
    println!("Processing complete, data still available: {:?}", &data[..5]);
}
```

### Set Thread Count Appropriately

```rust
use std::thread;

fn main() {
    // Get recommended parallelism
    let num_threads = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4);

    println!("Using {} worker threads", num_threads);

    let work_items: Vec<i32> = (0..100).collect();
    let chunk_size = (work_items.len() + num_threads - 1) / num_threads;

    thread::scope(|s| {
        for (i, chunk) in work_items.chunks(chunk_size).enumerate() {
            s.spawn(move || {
                println!("Thread {} processing {} items", i, chunk.len());
            });
        }
    });
}
```

### Avoid Unnecessary Cloning

```rust
use std::thread;
use std::sync::Arc;

fn main() {
    // Good: use Arc to share large data
    let large_data = Arc::new(vec![0u8; 1_000_000]);

    let handles: Vec<_> = (0..4)
        .map(|i| {
            let data = Arc::clone(&large_data); // Only copy pointer, O(1)
            thread::spawn(move || {
                println!("Thread {} reading data length: {}", i, data.len());
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
}
```

### Handle Thread Panics Properly

```rust
use std::thread;

fn main() {
    let handles: Vec<_> = (0..5)
        .map(|i| {
            thread::spawn(move || {
                if i == 3 {
                    panic!("Thread {} error", i);
                }
                i * 10
            })
        })
        .collect();

    let mut results = Vec::new();
    let mut errors = Vec::new();

    for (i, handle) in handles.into_iter().enumerate() {
        match handle.join() {
            Ok(result) => results.push(result),
            Err(_) => errors.push(i),
        }
    }

    println!("Successful results: {:?}", results);
    println!("Failed threads: {:?}", errors);
}
```

### Use Builder to Name Threads for Debugging

```rust
use std::thread;

fn main() {
    let handles: Vec<_> = ["data-processor", "logger", "network-request"]
        .iter()
        .map(|name| {
            thread::Builder::new()
                .name(name.to_string())
                .spawn(|| {
                    let current = thread::current();
                    println!("[{}] starting execution", current.name().unwrap_or("unknown"));
                    // Work...
                    println!("[{}] execution complete", current.name().unwrap_or("unknown"));
                })
                .unwrap()
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
}
```

## Common Pitfalls

### Pitfall 1: Forgetting join Causes Early Program Exit

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // Wrong: no join, main thread may exit before child completes
    thread::spawn(|| {
        thread::sleep(Duration::from_secs(1));
        println!("This may not be printed!");
    });

    println!("Main thread finished");
    // Program exits, child thread forcibly terminated
}
```

**Solution**:
```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        thread::sleep(Duration::from_secs(1));
        println!("This will definitely be printed!");
    });

    println!("Main thread waiting for child...");
    handle.join().unwrap();
    println!("Main thread finished");
}
```

### Pitfall 2: Forgetting move Keyword

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3];

    // Compile error! Closure may outlive data
    // let handle = thread::spawn(|| {
    //     println!("{:?}", data);
    // });

    // Correct: use move
    let handle = thread::spawn(move || {
        println!("{:?}", data);
    });

    handle.join().unwrap();
}
```

### Pitfall 3: Incorrectly Sharing Variables in Loops

```rust
use std::thread;
use std::sync::Arc;

fn main() {
    let data = Arc::new(vec![1, 2, 3]);

    // Wrong: creating Arc outside loop, would try to move same variable multiple times
    // for i in 0..3 {
    //     let data = Arc::clone(&data);  // This is correct
    //     thread::spawn(move || {
    //         println!("{}: {:?}", i, data);
    //     });
    // }

    // Correct: collect handles and join
    let handles: Vec<_> = (0..3)
        .map(|i| {
            let data = Arc::clone(&data);
            thread::spawn(move || {
                println!("{}: {:?}", i, data);
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
}
```

### Pitfall 4: Trying to Modify Data After spawn in scope

```rust
use std::thread;

fn main() {
    let mut data = vec![1, 2, 3];

    thread::scope(|s| {
        // Immutable borrow
        s.spawn(|| {
            println!("{:?}", data);
        });

        // Compile error! data already borrowed
        // data.push(4);

        // Cannot create mutable borrow thread either
        // s.spawn(|| {
        //     data.push(4);  // Error: conflicts with immutable borrow above
        // });
    });

    // After scope ends, can modify
    data.push(4);
    println!("{:?}", data);
}
```

### Pitfall 5: Overusing Threads

```rust
use std::thread;

fn main() {
    // Bad: create thread for each small task
    // let handles: Vec<_> = (0..10000)
    //     .map(|i| thread::spawn(move || i * 2))
    //     .collect();

    // Good: batch processing
    let data: Vec<i32> = (0..10000).collect();
    let num_threads = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4);

    let chunk_size = (data.len() + num_threads - 1) / num_threads;

    let results: Vec<i32> = thread::scope(|s| {
        let handles: Vec<_> = data
            .chunks(chunk_size)
            .map(|chunk| {
                s.spawn(move || {
                    chunk.iter().map(|&x| x * 2).collect::<Vec<_>>()
                })
            })
            .collect();

        handles
            .into_iter()
            .flat_map(|h| h.join().unwrap())
            .collect()
    });

    println!("Processed {} results", results.len());
}
```

## Performance Considerations

### Thread Creation Overhead

```rust
use std::thread;
use std::time::Instant;

fn main() {
    // Test thread creation overhead
    let iterations = 1000;

    let start = Instant::now();
    let handles: Vec<_> = (0..iterations)
        .map(|_| thread::spawn(|| {}))
        .collect();

    for h in handles {
        h.join().unwrap();
    }

    let duration = start.elapsed();
    println!(
        "Creating and joining {} threads took: {:?}",
        iterations, duration
    );
    println!(
        "Average per thread: {:?}",
        duration / iterations
    );

    // Typical result: each thread ~10-100 microseconds
    // For small tasks, this overhead may exceed the task itself
}
```

### spawn vs scope Performance Comparison

```rust
use std::thread;
use std::time::Instant;

fn main() {
    let data: Vec<i32> = (0..1000).collect();
    let iterations = 100;

    // Test spawn
    let start = Instant::now();
    for _ in 0..iterations {
        let data_clone = data.clone();
        let handle = thread::spawn(move || {
            data_clone.iter().sum::<i32>()
        });
        let _ = handle.join().unwrap();
    }
    println!("spawn {} times: {:?}", iterations, start.elapsed());

    // Test scope
    let start = Instant::now();
    for _ in 0..iterations {
        thread::scope(|s| {
            s.spawn(|| {
                data.iter().sum::<i32>()
            });
        });
    }
    println!("scope {} times: {:?}", iterations, start.elapsed());

    // scope is often faster because:
    // 1. No need to clone data
    // 2. Compiler may have better optimization opportunities
}
```

### Stack Size Impact on Performance

```rust
use std::thread;
use std::time::Instant;

fn main() {
    // Default stack size (typically 2MB-8MB)
    let start = Instant::now();
    let h = thread::spawn(|| {});
    h.join().unwrap();
    println!("Default stack: {:?}", start.elapsed());

    // Small stack
    let start = Instant::now();
    let h = thread::Builder::new()
        .stack_size(64 * 1024) // 64KB
        .spawn(|| {})
        .unwrap();
    h.join().unwrap();
    println!("64KB stack: {:?}", start.elapsed());

    // For tasks not requiring much stack space,
    // smaller stacks can reduce memory usage, but creation speed difference is small
}
```

### Parallelism Choice

```rust
use std::thread;
use std::time::Instant;

fn cpu_intensive_work(n: u64) -> u64 {
    (0..n).fold(0, |acc, x| acc.wrapping_add(x.wrapping_mul(x)))
}

fn main() {
    let work_size = 10_000_000u64;
    let total_work = work_size * 8;

    // Test different thread counts
    for num_threads in [1, 2, 4, 8, 16] {
        let chunk_size = total_work / num_threads as u64;

        let start = Instant::now();

        thread::scope(|s| {
            let _handles: Vec<_> = (0..num_threads)
                .map(|_| {
                    s.spawn(move || {
                        cpu_intensive_work(chunk_size)
                    })
                })
                .collect();
        });

        println!(
            "{} threads: {:?}",
            num_threads,
            start.elapsed()
        );
    }

    // Usually best performance when threads equal CPU cores
    // Beyond that, context switching overhead may reduce performance
}
```

## Real-World Scenarios

### Scenario 1: Parallel File Processing

```rust
use std::thread;
use std::fs;
use std::path::Path;

fn count_lines(content: &str) -> usize {
    content.lines().count()
}

fn count_words(content: &str) -> usize {
    content.split_whitespace().count()
}

fn count_chars(content: &str) -> usize {
    content.chars().count()
}

fn main() {
    // Simulate file contents
    let files = vec![
        ("file1.txt", "Hello World\nThis is Rust\nGreat language"),
        ("file2.txt", "Concurrent programming\nis fun\nand safe"),
        ("file3.txt", "Threads are\npowerful\nbut use wisely"),
    ];

    let results: Vec<_> = thread::scope(|s| {
        files
            .iter()
            .map(|(name, content)| {
                s.spawn(move || {
                    let lines = count_lines(content);
                    let words = count_words(content);
                    let chars = count_chars(content);
                    (*name, lines, words, chars)
                })
            })
            .collect::<Vec<_>>()
            .into_iter()
            .map(|h| h.join().unwrap())
            .collect()
    });

    println!("{:<15} {:>6} {:>6} {:>6}", "File", "Lines", "Words", "Chars");
    println!("{}", "-".repeat(40));
    for (name, lines, words, chars) in results {
        println!("{:<15} {:>6} {:>6} {:>6}", name, lines, words, chars);
    }
}
```

### Scenario 2: Parallel Data Validation

```rust
use std::thread;

#[derive(Debug)]
struct ValidationResult {
    field: String,
    is_valid: bool,
    message: Option<String>,
}

fn validate_email(email: &str) -> ValidationResult {
    let is_valid = email.contains('@') && email.contains('.');
    ValidationResult {
        field: "email".to_string(),
        is_valid,
        message: if is_valid { None } else { Some("Invalid email format".to_string()) },
    }
}

fn validate_phone(phone: &str) -> ValidationResult {
    let is_valid = phone.chars().filter(|c| c.is_numeric()).count() >= 10;
    ValidationResult {
        field: "phone".to_string(),
        is_valid,
        message: if is_valid { None } else { Some("Phone number too short".to_string()) },
    }
}

fn validate_password(password: &str) -> ValidationResult {
    let has_upper = password.chars().any(|c| c.is_uppercase());
    let has_lower = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_numeric());
    let long_enough = password.len() >= 8;

    let is_valid = has_upper && has_lower && has_digit && long_enough;
    ValidationResult {
        field: "password".to_string(),
        is_valid,
        message: if is_valid { None } else {
            Some("Password needs uppercase, lowercase, digit, 8+ chars".to_string())
        },
    }
}

fn main() {
    let email = "user@example.com";
    let phone = "1234567890";
    let password = "SecurePass123";

    // Execute all validations in parallel
    let results = thread::scope(|s| {
        let email_result = s.spawn(|| validate_email(email));
        let phone_result = s.spawn(|| validate_phone(phone));
        let password_result = s.spawn(|| validate_password(password));

        vec![
            email_result.join().unwrap(),
            phone_result.join().unwrap(),
            password_result.join().unwrap(),
        ]
    });

    println!("Validation Results:");
    for result in &results {
        let status = if result.is_valid { "OK" } else { "FAIL" };
        print!("  {}: {} ", result.field, status);
        if let Some(msg) = &result.message {
            print!("- {}", msg);
        }
        println!();
    }

    let all_valid = results.iter().all(|r| r.is_valid);
    println!("\nOverall: {}", if all_valid { "PASS" } else { "FAIL" });
}
```

### Scenario 3: Producer-Consumer Pattern (Simplified)

```rust
use std::thread;
use std::sync::mpsc;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    // Producer thread
    let producer = thread::spawn(move || {
        for i in 1..=10 {
            println!("[Producer] producing task {}", i);
            tx.send(i).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
        println!("[Producer] production complete");
    });

    // Consumer thread
    let consumer = thread::spawn(move || {
        let mut total = 0;
        for received in rx {
            println!("[Consumer] processing task {}", received);
            total += received;
            thread::sleep(Duration::from_millis(50));
        }
        println!("[Consumer] processing complete, total: {}", total);
        total
    });

    producer.join().unwrap();
    let result = consumer.join().unwrap();
    println!("Final result: {}", result);
}
```

### Scenario 4: Task Execution with Timeout

```rust
use std::thread;
use std::sync::mpsc;
use std::time::Duration;

fn run_with_timeout<F, T>(f: F, timeout: Duration) -> Option<T>
where
    F: FnOnce() -> T + Send + 'static,
    T: Send + 'static,
{
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let result = f();
        let _ = tx.send(result);
    });

    rx.recv_timeout(timeout).ok()
}

fn main() {
    // Fast task
    let result = run_with_timeout(
        || {
            thread::sleep(Duration::from_millis(100));
            "fast task complete"
        },
        Duration::from_secs(1),
    );
    println!("Fast task: {:?}", result);

    // Slow task (timeout)
    let result = run_with_timeout(
        || {
            thread::sleep(Duration::from_secs(5));
            "slow task complete"
        },
        Duration::from_secs(1),
    );
    println!("Slow task: {:?}", result);
}
```

## Interview Questions

### What's the difference between spawn and scope?

**Key Points**:
- `spawn` creates threads with `'static` lifetime, must own all captured data
- `scope` creates threads that can borrow local variables because they're guaranteed to complete before the scope ends
- `spawn` requires manual `join`, `scope` automatically waits for all threads
- `spawn` threads can be detached, `scope` threads cannot

### Why does spawn require the move keyword?

**Key Points**:
```rust
// Compiler cannot guarantee borrow lifetime
let data = vec![1, 2, 3];
// thread::spawn(|| println!("{:?}", data)); // Error!

// move transfers ownership to closure
thread::spawn(move || println!("{:?}", data)); // Correct
```
The compiler cannot prove that `data` outlives the thread, so `move` transfers ownership to ensure safety.

### What does JoinHandle's join method return?

**Key Points**:
- Returns `Result<T, Box<dyn Any + Send>>`
- `Ok(T)`: Thread completed normally, T is the closure's return value
- `Err`: Thread panicked, can attempt downcast to get panic message

### How do you share data between threads?

**Key Points**:
- Immutable data: Use `Arc<T>` for reference-counted pointer
- Mutable data: Use `Arc<Mutex<T>>` or `Arc<RwLock<T>>`
- Scoped threads: Direct borrowing, no wrapping needed
- One-way transfer: Use channels (`mpsc`)

### What is thread safety? How does Rust guarantee it?

**Key Points**:
- Thread safety means concurrent access won't cause data races
- Rust uses `Send` and `Sync` traits for compile-time thread safety verification
- `Send`: Type can safely transfer ownership between threads
- `Sync`: Type's references can safely be shared between threads
- Most types automatically implement these, compiler checks them

### How does thread::scope guarantee borrowing safety?

**Key Points**:
```rust
thread::scope(|s| {
    let data = vec![1, 2, 3];
    s.spawn(|| println!("{:?}", data));
    // Scope end: all threads must complete
}); // <- All threads complete at this point
// data can be safely dropped
```
- `scope` waits for all child threads before returning
- Compiler knows thread lifetime won't exceed scope
- Therefore can safely borrow scope variables

## Further Reading

### Official Documentation

- [std::thread Module Documentation](https://doc.rust-lang.org/std/thread/)
- [The Rust Book - Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html)
- [Rust By Example - Threads](https://doc.rust-lang.org/rust-by-example/std_misc/threads.html)

### Related RFCs

- [RFC 3151 - Scoped Threads](https://rust-lang.github.io/rfcs/3151-scoped-threads.html)
- [RFC 0243 - Thread Spawn Arguments](https://rust-lang.github.io/rfcs/0243-thread-spawn-arguments.html)

### Advanced Resources

- [Rust Atomics and Locks](https://marabos.nl/atomics/) - Mara Bos's authoritative guide to concurrent programming
- [Programming Rust, 2nd Edition](https://www.oreilly.com/library/view/programming-rust-2nd/9781492052586/) - Chapter 19: Concurrency
- [Rustonomicon - Concurrency](https://doc.rust-lang.org/nomicon/concurrency.html)

### Related Libraries

- [rayon](https://crates.io/crates/rayon) - Data parallelism library
- [crossbeam](https://crates.io/crates/crossbeam) - Concurrency utilities
- [parking_lot](https://crates.io/crates/parking_lot) - High-performance synchronization primitives
- [tokio](https://crates.io/crates/tokio) - Async runtime (async/await)

---

Mastering Rust threading is foundational for writing high-performance concurrent programs. Although Rust's ownership system adds some initial learning curve, it catches most concurrency errors at compile time, letting you write safe multi-threaded code with confidence. For CPU-intensive tasks, combining `thread::scope` with Rayon enables elegant and efficient parallel computation.
