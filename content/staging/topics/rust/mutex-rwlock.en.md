---
title: Mutex与RwLock
description: Rust互斥锁与读写锁完全指南，深入理解Mutex<T>、RwLock<T>、锁中毒与死锁预防
track: rust
section: concurrency-async
difficulty: advanced
tags:
  - Rust
  - Mutex
  - RwLock
  - 并发
  - 线程安全
  - 锁
status: imported
origin: old/src/content/docs/rust/mutex-rwlock.en.md
divergence: 0.183
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 并发
  order: 7
  lastUpdated: 2026-01-07
---

In multi-threaded programming, when multiple threads need to access and modify shared data, we need synchronization mechanisms to ensure data consistency and thread safety. The Rust standard library provides two main lock types: `Mutex<T>` (mutual exclusion lock) and `RwLock<T>` (read-write lock). This article will dive into how these two locks work, how to use them, and best practices.

## Concept Explanation

### What is a Mutex

Mutex is short for "Mutual Exclusion". `Mutex<T>` guarantees that only one thread can access the protected data at any given time. When one thread holds the lock, other threads attempting to acquire the lock must wait until the lock is released.

### What is a Read-Write Lock (RwLock)

`RwLock<T>` is a more fine-grained lock that distinguishes between read and write operations:
- **Multiple readers**: Allows any number of threads to hold a read lock simultaneously
- **Single writer**: Write lock is exclusive; no other read or write locks are allowed when a write lock is held

### Historical Background

The concepts of Mutex and RwLock originate from operating systems and concurrent programming theory, with decades of history. Rust's innovation lies in deeply integrating these synchronization primitives with the ownership system, enabling:

1. Data protected by locks is bound to the lock itself, making it impossible to access data without acquiring the lock
2. Lock release is automatic, ensured through the RAII (Resource Acquisition Is Initialization) pattern
3. Compile-time type checking prevents many common concurrency errors

### What Problems Does It Solve

Lock mechanisms primarily solve the following problems:

- **Data Race**: Multiple threads accessing the same data simultaneously, with at least one being a write operation
- **Atomicity Issues**: Ensuring atomic execution of compound operations
- **Visibility Issues**: Ensuring modifications by one thread are visible to other threads

---

## Core Principles

### Internal Structure of Mutex

The simplified definition of `Mutex<T>` in Rust is as follows:

```rust
pub struct Mutex<T: ?Sized> {
    inner: sys::Mutex,     // OS native mutex
    poison: poison::Flag,  // Poison flag
    data: UnsafeCell<T>,   // Protected data
}
```

Core components:

1. **inner**: Underlying OS mutex (such as pthread_mutex or Windows CRITICAL_SECTION)
2. **poison**: Records whether the lock is "poisoned" (the thread holding the lock panicked)
3. **data**: Data wrapped with `UnsafeCell`, enabling interior mutability

### Internal Structure of RwLock

```rust
pub struct RwLock<T: ?Sized> {
    inner: sys::RwLock,    // OS native read-write lock
    poison: poison::Flag,  // Poison flag
    data: UnsafeCell<T>,   // Protected data
}
```

### MutexGuard and RAII

When calling the `lock()` method, it returns a `MutexGuard<T>` smart pointer:

```rust
pub struct MutexGuard<'a, T: ?Sized + 'a> {
    lock: &'a Mutex<T>,
    // Implements Deref and DerefMut traits
}

impl<T: ?Sized> Drop for MutexGuard<'_, T> {
    fn drop(&mut self) {
        // Automatically release the lock
        unsafe { self.lock.inner.unlock(); }
    }
}
```

This design ensures:
- The lock's lifetime is bound to the Guard
- The lock is automatically released when the Guard goes out of scope
- No need to manually call unlock

### Lock Poisoning Mechanism

When a thread holding a lock panics, the lock is marked as "poisoned":

```rust
// Simplified poison detection logic
pub fn lock(&self) -> LockResult<MutexGuard<'_, T>> {
    unsafe {
        self.inner.lock();
        // Check poison status
        if self.poison.get() {
            Err(PoisonError::new(MutexGuard::new(self)))
        } else {
            Ok(MutexGuard::new(self))
        }
    }
}
```

The purpose of poisoning is to alert subsequent threads acquiring the lock: the data may be in an inconsistent state.

### Memory Ordering Guarantees

Rust's Mutex and RwLock provide the following memory ordering guarantees:

- **Acquire semantics**: When acquiring the lock, ensures visibility of all writes from previous lock releases
- **Release semantics**: When releasing the lock, ensures all prior writes are visible to threads that subsequently acquire the lock

---

## Key Points

### Mutex Core API

| Method | Description | Blocking | Return Type |
|--------|-------------|----------|-------------|
| `lock()` | Acquire lock, blocking wait | Yes | `LockResult<MutexGuard<T>>` |
| `try_lock()` | Try to acquire lock, return immediately | No | `TryLockResult<MutexGuard<T>>` |
| `is_poisoned()` | Check if lock is poisoned | No | `bool` |
| `into_inner()` | Consume the lock, return internal data | No | `LockResult<T>` |
| `get_mut()` | Get mutable reference (requires &mut self) | No | `LockResult<&mut T>` |

### RwLock Core API

| Method | Description | Blocking | Return Type |
|--------|-------------|----------|-------------|
| `read()` | Acquire read lock | Yes | `LockResult<RwLockReadGuard<T>>` |
| `write()` | Acquire write lock | Yes | `LockResult<RwLockWriteGuard<T>>` |
| `try_read()` | Try to acquire read lock | No | `TryLockResult<RwLockReadGuard<T>>` |
| `try_write()` | Try to acquire write lock | No | `TryLockResult<RwLockWriteGuard<T>>` |

### Key Feature Comparison

| Feature | Mutex | RwLock |
|---------|-------|--------|
| Concurrent reads | Not supported | Supported |
| Exclusive writes | Yes | Yes |
| Implementation complexity | Simple | Complex |
| Lock acquisition overhead | Lower | Higher |
| Use case | Write-heavy or balanced read-write | Read-heavy |
| Writer starvation risk | None | Yes (depends on implementation) |

---

## Code Examples

### Basic Mutex Usage

```rust
use std::sync::Mutex;

fn main() {
    // Create a value protected by Mutex
    let counter = Mutex::new(0);

    {
        // Acquire lock, returns MutexGuard
        let mut guard = counter.lock().unwrap();
        // Modify value through dereferencing
        *guard += 1;
        println!("Counter value: {}", *guard);
        // guard automatically releases lock when it goes out of scope
    }

    // Acquire lock again
    let value = counter.lock().unwrap();
    println!("Final value: {}", *value);
}
```

### Sharing Mutex Across Threads

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Arc is used to share Mutex across threads
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            // Acquire lock and increment count
            let mut num = counter.lock().unwrap();
            *num += 1;
            println!("Thread {} incremented count, current value: {}", i, *num);
        });
        handles.push(handle);
    }

    // Wait for all threads to complete
    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", *counter.lock().unwrap());
}
```

### Non-blocking Acquisition with try_lock

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

fn main() {
    let data = Arc::new(Mutex::new(0));

    // First thread holds lock for a long time
    let data_clone = Arc::clone(&data);
    let handle = thread::spawn(move || {
        let _guard = data_clone.lock().unwrap();
        println!("Thread 1: Holding lock");
        thread::sleep(Duration::from_secs(2));
        println!("Thread 1: Releasing lock");
    });

    // Wait for first thread to acquire lock
    thread::sleep(Duration::from_millis(100));

    // Second thread attempts non-blocking acquisition
    match data.try_lock() {
        Ok(guard) => {
            println!("Successfully acquired lock: {}", *guard);
        }
        Err(_) => {
            println!("Lock is held, cannot acquire");
        }
    }

    // Retry with loop
    let mut attempts = 0;
    loop {
        match data.try_lock() {
            Ok(guard) => {
                println!("Attempt {} succeeded, acquired lock: {}", attempts + 1, *guard);
                break;
            }
            Err(_) => {
                attempts += 1;
                if attempts > 10 {
                    println!("Too many attempts, giving up");
                    break;
                }
                println!("Attempt {} failed, retrying later...", attempts);
                thread::sleep(Duration::from_millis(300));
            }
        }
    }

    handle.join().unwrap();
}
```

### Basic RwLock Usage

```rust
use std::sync::RwLock;

fn main() {
    let data = RwLock::new(vec![1, 2, 3]);

    // Multiple readers can hold read locks simultaneously
    {
        let read1 = data.read().unwrap();
        let read2 = data.read().unwrap();
        println!("Read 1: {:?}", *read1);
        println!("Read 2: {:?}", *read2);
        // Two read locks can exist simultaneously
    }

    // Writing requires exclusive lock
    {
        let mut write = data.write().unwrap();
        write.push(4);
        println!("After write: {:?}", *write);
    }

    // Can continue reading after write lock is released
    {
        let read = data.read().unwrap();
        println!("Final data: {:?}", *read);
    }
}
```

### Multi-threaded RwLock

```rust
use std::sync::{Arc, RwLock};
use std::thread;
use std::time::Duration;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // Create multiple reader threads
    for i in 0..5 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            for j in 0..3 {
                let read_guard = data.read().unwrap();
                println!("Reader thread {} read #{}: {:?}", i, j, *read_guard);
                drop(read_guard);
                thread::sleep(Duration::from_millis(50));
            }
        }));
    }

    // Create one writer thread
    {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            for i in 4..7 {
                thread::sleep(Duration::from_millis(100));
                let mut write_guard = data.write().unwrap();
                write_guard.push(i);
                println!("Writer thread added element: {}", i);
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final data: {:?}", *data.read().unwrap());
}
```

### Handling Lock Poisoning

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));

    // Panic in a thread
    let data_clone = Arc::clone(&data);
    let handle = thread::spawn(move || {
        let _guard = data_clone.lock().unwrap();
        panic!("Thread panicked!");
    });

    // Ignore the panic
    let _ = handle.join();

    // Check if lock is poisoned
    println!("Is lock poisoned: {}", data.is_poisoned());

    // Handle poisoned lock
    match data.lock() {
        Ok(guard) => {
            println!("Successfully acquired lock: {:?}", *guard);
        }
        Err(poisoned) => {
            println!("Lock is poisoned, but data is still accessible");
            // Option 1: Ignore poisoning, get data
            let guard = poisoned.into_inner();
            println!("Recovered data: {:?}", *guard);
        }
    }

    // Using unwrap_or_else for concise handling
    let guard = data.lock().unwrap_or_else(|poisoned| {
        println!("Warning: Lock is poisoned, recovering...");
        poisoned.into_inner()
    });
    println!("Data: {:?}", *guard);
}
```

### Clearing Lock Poisoning

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(100));

    // Cause poisoning
    let data_clone = Arc::clone(&data);
    let _ = thread::spawn(move || {
        let _guard = data_clone.lock().unwrap();
        panic!("Intentional panic");
    }).join();

    println!("Poisoned status: {}", data.is_poisoned());

    // Use clear_poison() to clear poisoning status (Rust 1.77+)
    data.clear_poison();
    println!("Poisoned status after clearing: {}", data.is_poisoned());

    // Now can use normally
    let guard = data.lock().unwrap();
    println!("Value: {}", *guard);
}
```

### Condition Variables with Mutex

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;
use std::time::Duration;

fn main() {
    let pair = Arc::new((Mutex::new(false), Condvar::new()));

    // Waiting thread
    let pair_clone = Arc::clone(&pair);
    let waiter = thread::spawn(move || {
        let (lock, cvar) = &*pair_clone;
        let mut started = lock.lock().unwrap();

        println!("Waiter thread: Waiting for condition...");
        while !*started {
            // wait automatically releases lock and blocks
            // Reacquires lock when woken up
            started = cvar.wait(started).unwrap();
        }
        println!("Waiter thread: Condition met, continuing execution");
    });

    // Notifier thread
    thread::sleep(Duration::from_secs(1));
    let (lock, cvar) = &*pair;
    {
        let mut started = lock.lock().unwrap();
        *started = true;
        println!("Notifier thread: Setting condition to true");
    }
    cvar.notify_one();

    waiter.join().unwrap();
}
```

### Condition Wait with Timeout

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;
use std::time::Duration;

fn main() {
    let pair = Arc::new((Mutex::new(false), Condvar::new()));

    let pair_clone = Arc::clone(&pair);
    let waiter = thread::spawn(move || {
        let (lock, cvar) = &*pair_clone;
        let mut guard = lock.lock().unwrap();

        println!("Waiting for up to 2 seconds...");
        let result = cvar.wait_timeout_while(
            guard,
            Duration::from_secs(2),
            |pending| !*pending
        ).unwrap();

        if result.1.timed_out() {
            println!("Wait timed out!");
        } else {
            println!("Condition met before timeout");
        }
    });

    // Set condition after 3 seconds (will cause timeout)
    thread::sleep(Duration::from_secs(3));
    let (lock, cvar) = &*pair;
    *lock.lock().unwrap() = true;
    cvar.notify_one();

    waiter.join().unwrap();
}
```

---

## Best Practices

### Minimize Lock Hold Time

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

struct DataProcessor {
    data: Arc<Mutex<Vec<i32>>>,
}

impl DataProcessor {
    // Good practice: Quickly copy data and release lock
    fn process_good(&self) {
        // Quickly copy data
        let data_copy = {
            let guard = self.data.lock().unwrap();
            guard.clone()
        }; // Lock is released here

        // Perform time-consuming processing outside the lock
        let result: i32 = data_copy.iter().sum();
        thread::sleep(Duration::from_millis(100)); // Simulate time-consuming operation
        println!("Processing result: {}", result);
    }

    // Bad practice: Holding lock for too long
    fn process_bad(&self) {
        let guard = self.data.lock().unwrap();
        let result: i32 = guard.iter().sum();
        thread::sleep(Duration::from_millis(100)); // Lock is still held!
        println!("Processing result: {}", result);
    }
}
```

### Use Scopes to Control Lock Lifetime

```rust
use std::sync::Mutex;

fn main() {
    let data = Mutex::new(vec![1, 2, 3]);

    // Use explicit scope
    {
        let mut guard = data.lock().unwrap();
        guard.push(4);
    } // Lock is released here

    // Use drop for explicit release
    let mut guard = data.lock().unwrap();
    guard.push(5);
    drop(guard); // Explicitly release lock

    // Continue with other operations
    println!("Data: {:?}", *data.lock().unwrap());
}
```

### Avoid Blocking Operations While Holding Lock

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

// Bad practice
fn bad_example(data: &Mutex<String>) {
    let guard = data.lock().unwrap();
    // Performing I/O while holding lock
    // std::fs::write("output.txt", &*guard).unwrap();
    println!("Operation while holding lock: {}", guard);
    thread::sleep(Duration::from_secs(1)); // Simulate I/O
}

// Good practice
fn good_example(data: &Mutex<String>) {
    let content = {
        let guard = data.lock().unwrap();
        guard.clone()
    }; // Lock is released

    // Perform I/O outside the lock
    // std::fs::write("output.txt", &content).unwrap();
    println!("Operation outside lock: {}", content);
    thread::sleep(Duration::from_secs(1));
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
use std::thread;

fn main() {
    // Advantages of parking_lot:
    // 1. No poisoning (no need to handle Result)
    // 2. Smaller memory footprint
    // 3. Better performance

    let data = Arc::new(Mutex::new(0));

    let mut handles = vec![];
    for _ in 0..10 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let mut guard = data.lock(); // Returns Guard directly, no unwrap needed
            *guard += 1;
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *data.lock());

    // RwLock usage
    let rw_data = Arc::new(RwLock::new(vec![1, 2, 3]));

    // Upgradable read lock
    let upgradable = rw_data.upgradable_read();
    println!("Read: {:?}", *upgradable);

    // Upgrade to write lock
    let mut write_guard = parking_lot::RwLockUpgradableReadGuard::upgrade(upgradable);
    write_guard.push(4);
    println!("After write: {:?}", *write_guard);
}
```

### Lock Granularity Selection

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::collections::HashMap;

// Coarse-grained lock: One lock for entire structure
struct CoarseGrained {
    data: Mutex<HashMap<String, Vec<i32>>>,
}

// Fine-grained lock: One lock per value
struct FineGrained {
    data: RwLock<HashMap<String, Arc<Mutex<Vec<i32>>>>>,
}

impl FineGrained {
    fn new() -> Self {
        FineGrained {
            data: RwLock::new(HashMap::new()),
        }
    }

    fn get_or_create(&self, key: &str) -> Arc<Mutex<Vec<i32>>> {
        // Try reading first
        {
            let read_guard = self.data.read().unwrap();
            if let Some(value) = read_guard.get(key) {
                return Arc::clone(value);
            }
        }

        // Need to write
        let mut write_guard = self.data.write().unwrap();
        // Double-check
        if let Some(value) = write_guard.get(key) {
            return Arc::clone(value);
        }

        let value = Arc::new(Mutex::new(Vec::new()));
        write_guard.insert(key.to_string(), Arc::clone(&value));
        value
    }

    fn update(&self, key: &str, item: i32) {
        let bucket = self.get_or_create(key);
        let mut guard = bucket.lock().unwrap();
        guard.push(item);
    }
}
```

### Using Type State Pattern

```rust
use std::sync::Mutex;

// Use types to encode lock state
struct Unlocked;
struct Locked<'a, T>(&'a Mutex<T>);

struct SafeCounter {
    inner: Mutex<i32>,
}

impl SafeCounter {
    fn new(initial: i32) -> Self {
        SafeCounter {
            inner: Mutex::new(initial),
        }
    }

    fn lock(&self) -> LockedCounter<'_> {
        LockedCounter {
            guard: self.inner.lock().unwrap(),
        }
    }
}

struct LockedCounter<'a> {
    guard: std::sync::MutexGuard<'a, i32>,
}

impl LockedCounter<'_> {
    fn increment(&mut self) {
        *self.guard += 1;
    }

    fn decrement(&mut self) {
        *self.guard -= 1;
    }

    fn get(&self) -> i32 {
        *self.guard
    }
}

fn main() {
    let counter = SafeCounter::new(0);

    let mut locked = counter.lock();
    locked.increment();
    locked.increment();
    println!("Value: {}", locked.get());
    // locked goes out of scope, automatically unlocks
}
```

---

## Common Pitfalls

### Deadlock

Deadlock occurs when multiple threads are waiting for locks held by each other:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn deadlock_example() {
    let lock_a = Arc::new(Mutex::new(0));
    let lock_b = Arc::new(Mutex::new(0));

    let a1 = Arc::clone(&lock_a);
    let b1 = Arc::clone(&lock_b);
    let handle1 = thread::spawn(move || {
        let _guard_a = a1.lock().unwrap();
        println!("Thread 1: Holding lock A");
        thread::sleep(std::time::Duration::from_millis(100));
        println!("Thread 1: Trying to acquire lock B...");
        let _guard_b = b1.lock().unwrap(); // May deadlock
        println!("Thread 1: Holding locks A and B");
    });

    let a2 = Arc::clone(&lock_a);
    let b2 = Arc::clone(&lock_b);
    let handle2 = thread::spawn(move || {
        let _guard_b = b2.lock().unwrap();
        println!("Thread 2: Holding lock B");
        thread::sleep(std::time::Duration::from_millis(100));
        println!("Thread 2: Trying to acquire lock A...");
        let _guard_a = a2.lock().unwrap(); // May deadlock
        println!("Thread 2: Holding locks B and A");
    });

    handle1.join().unwrap();
    handle2.join().unwrap();
}

// Solution: Always acquire locks in the same order
fn no_deadlock_example() {
    let lock_a = Arc::new(Mutex::new(0));
    let lock_b = Arc::new(Mutex::new(0));

    let a1 = Arc::clone(&lock_a);
    let b1 = Arc::clone(&lock_b);
    let handle1 = thread::spawn(move || {
        let _guard_a = a1.lock().unwrap(); // A first
        let _guard_b = b1.lock().unwrap(); // B second
        println!("Thread 1: Safely holding both locks");
    });

    let a2 = Arc::clone(&lock_a);
    let b2 = Arc::clone(&lock_b);
    let handle2 = thread::spawn(move || {
        let _guard_a = a2.lock().unwrap(); // A first (same order)
        let _guard_b = b2.lock().unwrap(); // B second
        println!("Thread 2: Safely holding both locks");
    });

    handle1.join().unwrap();
    handle2.join().unwrap();
}
```

### Repeatedly Acquiring Non-recursive Lock in Same Thread

```rust
use std::sync::Mutex;

fn recursive_lock_issue() {
    let data = Mutex::new(0);

    let _guard = data.lock().unwrap();
    // The following line will cause deadlock! Rust standard library Mutex is not recursive
    // let _guard2 = data.lock().unwrap();

    println!("This line will never execute");
}

// Solution: Refactor code to avoid recursive locking
fn avoid_recursive_lock() {
    let data = Mutex::new(0);

    // Concentrate all operations requiring the lock in one acquisition
    {
        let mut guard = data.lock().unwrap();
        *guard += 1;
        *guard *= 2;
        // Release lock after all operations complete
    }
}

// Or use parking_lot's ReentrantMutex
// use parking_lot::ReentrantMutex;
```

### Forgetting to Release Lock

```rust
use std::sync::Mutex;

fn forgotten_lock() {
    let data = Mutex::new(vec![1, 2, 3]);

    // Problem code: Lock not released promptly
    let result = {
        let guard = data.lock().unwrap();
        guard.len()
    }; // guard is released here

    // Or use drop
    let guard = data.lock().unwrap();
    let len = guard.len();
    drop(guard); // Explicit release

    // Common mistake: Holding lock too long in match/if
    let data2 = Mutex::new(Some(42));
    match *data2.lock().unwrap() {
        Some(v) => {
            // Lock is still held
            println!("Value: {}", v);
        }
        None => {}
    } // Lock is released here
}
```

### RwLock Writer Starvation

```rust
use std::sync::{Arc, RwLock};
use std::thread;
use std::time::Duration;

fn writer_starvation() {
    let data = Arc::new(RwLock::new(0));

    // Many readers
    for i in 0..100 {
        let data = Arc::clone(&data);
        thread::spawn(move || {
            loop {
                let _read = data.read().unwrap();
                thread::sleep(Duration::from_millis(1));
            }
        });
    }

    // Writer may never get a chance
    let data = Arc::clone(&data);
    thread::spawn(move || {
        loop {
            // In read-intensive situations, writes may struggle to acquire lock
            let mut write = data.write().unwrap();
            *write += 1;
            println!("Successfully wrote: {}", *write);
            thread::sleep(Duration::from_millis(100));
        }
    });

    thread::sleep(Duration::from_secs(5));
}
```

### Inappropriate Lock Granularity

```rust
use std::sync::Mutex;
use std::collections::HashMap;

// Problem: One lock for entire HashMap, poor concurrent performance
struct BadCache {
    data: Mutex<HashMap<String, String>>,
}

// Improvement: Sharded locks
struct ShardedCache {
    shards: Vec<Mutex<HashMap<String, String>>>,
}

impl ShardedCache {
    fn new(shard_count: usize) -> Self {
        let shards = (0..shard_count)
            .map(|_| Mutex::new(HashMap::new()))
            .collect();
        ShardedCache { shards }
    }

    fn get_shard(&self, key: &str) -> &Mutex<HashMap<String, String>> {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        key.hash(&mut hasher);
        let index = (hasher.finish() as usize) % self.shards.len();
        &self.shards[index]
    }

    fn get(&self, key: &str) -> Option<String> {
        let shard = self.get_shard(key);
        let guard = shard.lock().unwrap();
        guard.get(key).cloned()
    }

    fn set(&self, key: String, value: String) {
        let shard = self.get_shard(&key);
        let mut guard = shard.lock().unwrap();
        guard.insert(key, value);
    }
}
```

---

## Performance Considerations

### Mutex vs RwLock Performance Comparison

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::time::Instant;

fn benchmark_mutex_vs_rwlock() {
    const THREADS: usize = 8;
    const ITERATIONS: usize = 100_000;

    // Mutex benchmark (all read operations)
    let mutex_data = Arc::new(Mutex::new(0i32));
    let start = Instant::now();

    let handles: Vec<_> = (0..THREADS)
        .map(|_| {
            let data = Arc::clone(&mutex_data);
            thread::spawn(move || {
                for _ in 0..ITERATIONS {
                    let _value = *data.lock().unwrap();
                }
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
    println!("Mutex (read): {:?}", start.elapsed());

    // RwLock benchmark (all read operations)
    let rwlock_data = Arc::new(RwLock::new(0i32));
    let start = Instant::now();

    let handles: Vec<_> = (0..THREADS)
        .map(|_| {
            let data = Arc::clone(&rwlock_data);
            thread::spawn(move || {
                for _ in 0..ITERATIONS {
                    let _value = *data.read().unwrap();
                }
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
    println!("RwLock (read): {:?}", start.elapsed());

    // Mixed read-write scenario
    let mutex_data = Arc::new(Mutex::new(0i32));
    let start = Instant::now();

    let handles: Vec<_> = (0..THREADS)
        .map(|i| {
            let data = Arc::clone(&mutex_data);
            thread::spawn(move || {
                for j in 0..ITERATIONS {
                    if i == 0 && j % 100 == 0 {
                        // 1% write operations
                        *data.lock().unwrap() += 1;
                    } else {
                        let _value = *data.lock().unwrap();
                    }
                }
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
    println!("Mutex (99% read 1% write): {:?}", start.elapsed());

    let rwlock_data = Arc::new(RwLock::new(0i32));
    let start = Instant::now();

    let handles: Vec<_> = (0..THREADS)
        .map(|i| {
            let data = Arc::clone(&rwlock_data);
            thread::spawn(move || {
                for j in 0..ITERATIONS {
                    if i == 0 && j % 100 == 0 {
                        *data.write().unwrap() += 1;
                    } else {
                        let _value = *data.read().unwrap();
                    }
                }
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
    println!("RwLock (99% read 1% write): {:?}", start.elapsed());
}
```

### Selection Guide

| Scenario | Recommendation | Reason |
|----------|----------------|--------|
| Balanced read-write | Mutex | Simpler, lower overhead |
| Read-heavy (>10:1) | RwLock | Reads can be concurrent |
| Write-heavy | Mutex | RwLock write lock has higher overhead |
| Very short lock hold time | Mutex | Simple and efficient |
| Longer lock hold time with heavy reads | RwLock | Reduces read blocking |
| High contention scenarios | Consider lock-free structures | Atomic operations or sharding |

### Strategies to Reduce Lock Contention

```rust
use std::sync::{Arc, Mutex};
use std::thread;

// Strategy 1: Reduce lock scope
fn minimize_critical_section() {
    let data = Arc::new(Mutex::new(Vec::new()));

    // Bad: Do everything inside lock
    // let mut guard = data.lock().unwrap();
    // let processed = expensive_computation();
    // guard.push(processed);

    // Good: Only hold lock when necessary
    let processed = expensive_computation(); // Compute outside lock
    data.lock().unwrap().push(processed);    // Quickly acquire lock and update
}

fn expensive_computation() -> i32 {
    // Simulate time-consuming computation
    42
}

// Strategy 2: Batch operations
fn batch_operations() {
    let data = Arc::new(Mutex::new(Vec::new()));
    let items_to_add = vec![1, 2, 3, 4, 5];

    // Bad: Acquire lock for each element
    // for item in &items_to_add {
    //     data.lock().unwrap().push(*item);
    // }

    // Good: Acquire lock once, add in batch
    let mut guard = data.lock().unwrap();
    for item in items_to_add {
        guard.push(item);
    }
}

// Strategy 3: Use thread-local cache
use std::cell::RefCell;

thread_local! {
    static LOCAL_CACHE: RefCell<Vec<i32>> = RefCell::new(Vec::new());
}

fn use_thread_local() {
    let global_data = Arc::new(Mutex::new(Vec::new()));

    let handles: Vec<_> = (0..4)
        .map(|_| {
            let global = Arc::clone(&global_data);
            thread::spawn(move || {
                // Accumulate results locally
                LOCAL_CACHE.with(|cache| {
                    for i in 0..1000 {
                        cache.borrow_mut().push(i);
                    }

                    // Batch commit to global
                    let local_data: Vec<_> = cache.borrow_mut().drain(..).collect();
                    global.lock().unwrap().extend(local_data);
                });
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }

    println!("Total elements: {}", global_data.lock().unwrap().len());
}
```

---

## Real-World Scenarios

### Scenario 1: Thread-Safe Singleton Pattern

```rust
use std::sync::{Mutex, OnceLock};

struct Config {
    database_url: String,
    max_connections: u32,
}

static CONFIG: OnceLock<Mutex<Config>> = OnceLock::new();

fn get_config() -> &'static Mutex<Config> {
    CONFIG.get_or_init(|| {
        println!("Initializing configuration...");
        Mutex::new(Config {
            database_url: String::from("postgres://localhost/db"),
            max_connections: 10,
        })
    })
}

fn main() {
    // Read configuration
    {
        let config = get_config().lock().unwrap();
        println!("Database URL: {}", config.database_url);
    }

    // Update configuration
    {
        let mut config = get_config().lock().unwrap();
        config.max_connections = 20;
    }

    // Read again
    {
        let config = get_config().lock().unwrap();
        println!("Max connections: {}", config.max_connections);
    }
}
```

### Scenario 2: Thread-Safe Cache

```rust
use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use std::time::{Duration, Instant};

struct CacheEntry<V> {
    value: V,
    expires_at: Instant,
}

struct Cache<K, V> {
    data: RwLock<HashMap<K, CacheEntry<V>>>,
    default_ttl: Duration,
}

impl<K, V> Cache<K, V>
where
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    fn new(default_ttl: Duration) -> Self {
        Cache {
            data: RwLock::new(HashMap::new()),
            default_ttl,
        }
    }

    fn get(&self, key: &K) -> Option<V> {
        let data = self.data.read().unwrap();
        data.get(key).and_then(|entry| {
            if entry.expires_at > Instant::now() {
                Some(entry.value.clone())
            } else {
                None
            }
        })
    }

    fn set(&self, key: K, value: V) {
        self.set_with_ttl(key, value, self.default_ttl);
    }

    fn set_with_ttl(&self, key: K, value: V, ttl: Duration) {
        let entry = CacheEntry {
            value,
            expires_at: Instant::now() + ttl,
        };
        self.data.write().unwrap().insert(key, entry);
    }

    fn remove(&self, key: &K) -> Option<V> {
        self.data.write().unwrap().remove(key).map(|e| e.value)
    }

    fn cleanup_expired(&self) {
        let now = Instant::now();
        self.data.write().unwrap().retain(|_, entry| {
            entry.expires_at > now
        });
    }

    fn len(&self) -> usize {
        self.data.read().unwrap().len()
    }
}

fn main() {
    let cache = Arc::new(Cache::new(Duration::from_secs(60)));

    // Set cache
    cache.set("user:1", "Alice".to_string());
    cache.set("user:2", "Bob".to_string());

    // Read cache
    if let Some(user) = cache.get(&"user:1") {
        println!("Found user: {}", user);
    }

    // Set short-lived cache
    cache.set_with_ttl("session:abc", "data".to_string(), Duration::from_secs(5));

    println!("Cache entries: {}", cache.len());

    // Cleanup expired entries
    cache.cleanup_expired();
}
```

### Scenario 3: Work Queue

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;
use std::collections::VecDeque;

struct WorkQueue<T> {
    queue: Mutex<VecDeque<T>>,
    condvar: Condvar,
    shutdown: Mutex<bool>,
}

impl<T> WorkQueue<T> {
    fn new() -> Self {
        WorkQueue {
            queue: Mutex::new(VecDeque::new()),
            condvar: Condvar::new(),
            shutdown: Mutex::new(false),
        }
    }

    fn push(&self, item: T) {
        let mut queue = self.queue.lock().unwrap();
        queue.push_back(item);
        self.condvar.notify_one();
    }

    fn pop(&self) -> Option<T> {
        let mut queue = self.queue.lock().unwrap();
        loop {
            if let Some(item) = queue.pop_front() {
                return Some(item);
            }

            if *self.shutdown.lock().unwrap() {
                return None;
            }

            queue = self.condvar.wait(queue).unwrap();
        }
    }

    fn try_pop(&self) -> Option<T> {
        self.queue.lock().unwrap().pop_front()
    }

    fn shutdown(&self) {
        *self.shutdown.lock().unwrap() = true;
        self.condvar.notify_all();
    }

    fn len(&self) -> usize {
        self.queue.lock().unwrap().len()
    }
}

fn main() {
    let queue = Arc::new(WorkQueue::new());

    // Producer thread
    let producer_queue = Arc::clone(&queue);
    let producer = thread::spawn(move || {
        for i in 0..10 {
            producer_queue.push(format!("Task {}", i));
            println!("Producer: Added task {}", i);
            thread::sleep(std::time::Duration::from_millis(100));
        }
        producer_queue.shutdown();
        println!("Producer: Done");
    });

    // Consumer threads
    let mut consumers = vec![];
    for id in 0..3 {
        let consumer_queue = Arc::clone(&queue);
        consumers.push(thread::spawn(move || {
            while let Some(task) = consumer_queue.pop() {
                println!("Consumer {}: Processing {}", id, task);
                thread::sleep(std::time::Duration::from_millis(150));
            }
            println!("Consumer {}: Exiting", id);
        }));
    }

    producer.join().unwrap();
    for c in consumers {
        c.join().unwrap();
    }
}
```

### Scenario 4: Read-Write Separated State Management

```rust
use std::sync::{Arc, RwLock};
use std::thread;
use std::time::Duration;

#[derive(Clone, Debug)]
struct AppState {
    counter: i64,
    last_update: String,
    data: Vec<String>,
}

struct StateManager {
    state: RwLock<AppState>,
}

impl StateManager {
    fn new() -> Self {
        StateManager {
            state: RwLock::new(AppState {
                counter: 0,
                last_update: String::new(),
                data: Vec::new(),
            }),
        }
    }

    fn get_snapshot(&self) -> AppState {
        self.state.read().unwrap().clone()
    }

    fn get_counter(&self) -> i64 {
        self.state.read().unwrap().counter
    }

    fn increment_counter(&self) -> i64 {
        let mut state = self.state.write().unwrap();
        state.counter += 1;
        state.last_update = format!("{:?}", std::time::SystemTime::now());
        state.counter
    }

    fn add_data(&self, item: String) {
        let mut state = self.state.write().unwrap();
        state.data.push(item);
        state.last_update = format!("{:?}", std::time::SystemTime::now());
    }

    fn get_data_count(&self) -> usize {
        self.state.read().unwrap().data.len()
    }
}

fn main() {
    let manager = Arc::new(StateManager::new());

    // Multiple reader threads
    let readers: Vec<_> = (0..5)
        .map(|id| {
            let manager = Arc::clone(&manager);
            thread::spawn(move || {
                for _ in 0..10 {
                    let count = manager.get_counter();
                    println!("Reader {}: counter = {}", id, count);
                    thread::sleep(Duration::from_millis(50));
                }
            })
        })
        .collect();

    // One writer thread
    let writer_manager = Arc::clone(&manager);
    let writer = thread::spawn(move || {
        for i in 0..20 {
            let new_value = writer_manager.increment_counter();
            println!("Writer: Incremented counter to {}", new_value);
            if i % 5 == 0 {
                writer_manager.add_data(format!("Data item {}", i));
            }
            thread::sleep(Duration::from_millis(100));
        }
    });

    for r in readers {
        r.join().unwrap();
    }
    writer.join().unwrap();

    let final_state = manager.get_snapshot();
    println!("Final state: {:?}", final_state);
}
```

---

## Interview Key Points

### What is the difference between Mutex and RwLock?

**Answer**:
- **Mutex** is a mutual exclusion lock that allows only one thread to access data at any time, regardless of read or write
- **RwLock** is a read-write lock that allows multiple readers to access simultaneously, but writers need exclusive access
- Mutex has simpler implementation and lower overhead; RwLock performs better in read-heavy scenarios
- RwLock has writer starvation risk, Mutex does not

### What is lock poisoning? How to handle it?

**Answer**:
When a thread holding a lock panics, the lock is marked as "poisoned". This alerts other threads that the protected data may be in an inconsistent state.

Handling methods:
```rust
// Method 1: Use unwrap_or_else to recover
let guard = mutex.lock().unwrap_or_else(|poisoned| poisoned.into_inner());

// Method 2: Check and handle
match mutex.lock() {
    Ok(guard) => { /* Normal processing */ }
    Err(poisoned) => {
        // Decide whether to recover or propagate error based on business requirements
        let guard = poisoned.into_inner();
    }
}

// Method 3: Clear poisoning status (Rust 1.77+)
mutex.clear_poison();
```

### How to avoid deadlock?

**Answer**:
1. **Acquire locks in fixed order**: All threads acquire multiple locks in the same order
2. **Use try_lock**: Non-blocking attempt, release held locks and retry on failure
3. **Minimize lock hold time**: Reduce deadlock window
4. **Use a single lock**: If possible, use one coarse-grained lock instead of multiple fine-grained locks
5. **Use lock hierarchy**: Establish a lock hierarchy, only allow acquiring from higher to lower levels

### What is the difference between lock() and try_lock()?

**Answer**:
- `lock()` is blocking; if the lock is held, the current thread waits until the lock becomes available
- `try_lock()` is non-blocking; it returns immediately with the result: successfully acquired or failed
- `try_lock()` is suitable for scenarios where blocking needs to be avoided or timeout logic needs to be implemented

### Why do we need Arc<Mutex<T>> instead of just Mutex<T>?

**Answer**:
- `Mutex<T>` does not implement `Clone`, so ownership cannot be shared across multiple threads
- `Arc<T>` (Atomic Reference Counted) provides thread-safe reference-counted sharing
- `Arc<Mutex<T>>` combination allows multiple threads to share ownership of a Mutex
- Each thread gets a clone of `Arc` (only increments reference count), then accesses internal data through `lock()`

### How do RwLock read-write locks work?

**Answer**:
- Read locks (`read()`) are shared; multiple threads can hold them simultaneously
- Write locks (`write()`) are exclusive; no other locks are allowed when held
- When there's a write lock request, new read lock requests are typically blocked (preventing writer starvation)
- Specific behavior depends on implementation (standard library may vary by platform)

### What are the advantages of parking_lot over the standard library?

**Answer**:
1. No poisoning, cleaner API
2. Smaller memory footprint (1 byte vs 40+ bytes in standard library)
3. Generally better performance, especially in high-contention scenarios
4. More features: fair locks, upgradable read locks, `ReentrantMutex`, etc.
5. Consistent behavior across platforms

### When should you choose Mutex over RwLock?

**Answer**:
- Write operations are frequent (read-write ratio is close or writes are more)
- Lock hold time is very short
- Need simple and reliable implementation
- Memory usage is sensitive (Mutex is smaller)
- Need to avoid writer starvation issues

---

## Further Reading

### Official Documentation
- [std::sync::Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html)
- [std::sync::RwLock](https://doc.rust-lang.org/std/sync/struct.RwLock.html)
- [The Rust Book - Shared-State Concurrency](https://doc.rust-lang.org/book/ch16-03-shared-state.html)

### Recommended Crates
- [parking_lot](https://crates.io/crates/parking_lot) - Faster synchronization primitives
- [tokio::sync](https://docs.rs/tokio/latest/tokio/sync/) - Async locks
- [crossbeam](https://crates.io/crates/crossbeam) - Advanced concurrency tools

### Related Articles
- Rust Atomics and Locks by Mara Bos (O'Reilly)
- [Rust Concurrent Programming in Practice](https://course.rs/advance/concurrency-with-threads/thread.html)
- [Lock-free Programming](https://www.infoq.com/presentations/Lock-Free-Algorithms/)

### Advanced Topics
- Lock-free data structures
- Memory Ordering
- Atomic operations and CAS
- Choosing between async locks and sync locks
