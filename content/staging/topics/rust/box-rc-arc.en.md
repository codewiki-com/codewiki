---
title: Deep Dive into Box, Rc, and Arc
description: "A comprehensive guide to Rust's smart pointers: Box<T>, Rc<T>, Arc<T>, and Weak<T>. Explore reference counting mechanisms, thread safety, and practical applications."
track: rust
section: ownership-borrowing
difficulty: advanced
tags:
  - Rust
  - smart pointers
  - Box
  - Rc
  - Arc
  - Weak
  - reference counting
  - thread safety
status: imported
origin: old/src/content/docs/rust/box-rc-arc.en.md
divergence: 0.212
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: rust
  subcategory: ""
  order: 6
  lastUpdated: 2026-01-07
---

## Conceptual Overview

In Rust's ownership system, each value has only one owner by default. However, in practical programming, we often need multiple parts to share the same data, or allocate data on the heap to enable dynamic sizing or extend lifetimes. `Box<T>`, `Rc<T>`, and `Arc<T>` are three core smart pointers provided by Rust's standard library, each solving memory management needs in different scenarios.

### Historical Context

The concept of smart pointers originated in C++, first appearing in the 1990s. C++'s `std::unique_ptr`, `std::shared_ptr`, and `std::weak_ptr` provided inspiration for Rust's smart pointer design. Rust built upon this foundation, combining it with its ownership system to create a safer and zero-cost abstraction smart pointer system.

### Problems They Solve

| Smart Pointer | Core Problem Solved |
|---|---|
| `Box<T>` | Allocate data on the heap, enable recursive types, transfer ownership of large data |
| `Rc<T>` | Multiple owners sharing data in single-threaded environments |
| `Arc<T>` | Multiple owners sharing data in multi-threaded environments |
| `Weak<T>` | Break circular references, prevent memory leaks |

### Differences from Ordinary References

```rust
// Ordinary reference: borrows data, doesn't own it
fn with_reference(data: &String) {
    println!("{}", data);
} // data's ownership unchanged

// Smart pointer: owns the data
fn with_box(data: Box<String>) {
    println!("{}", data);
} // data is dropped, memory is freed
```

---

## Core Principles

### Box<T> Internal Implementation

`Box<T>` is the simplest smart pointer, essentially a raw pointer to heap memory plus ownership semantics.

```rust
// Simplified internal representation of Box
pub struct Box<T: ?Sized>(Unique<T>);

// Unique<T> is a non-null raw pointer wrapper
// Guaranteed by the compiler:
// 1. Pointer is non-null
// 2. Pointer has exclusive ownership of the memory
// 3. Memory alignment is correct
```

#### Memory Layout

```
Stack                 Heap
+----------+         +----------+
| Box<T>   |  -----> | T (data) |
| (8 bytes)|         |          |
+----------+         +----------+
```

```rust
use std::mem::{size_of, align_of};

fn main() {
    // Box itself only takes up the size of one pointer
    println!("Box<i32> size: {} bytes", size_of::<Box<i32>>());       // 8 bytes
    println!("Box<[u8; 1000]> size: {} bytes", size_of::<Box<[u8; 1000]>>()); // still 8 bytes

    // But the data it points to is on the heap
    let boxed = Box::new([0u8; 1000]);
    println!("Heap data size: {} bytes", std::mem::size_of_val(&*boxed)); // 1000 bytes
}
```

### Rc<T> Reference Counting Mechanism

`Rc<T>` (Reference Counted) uses reference counting to track how many owners there are. When the last `Rc` is dropped, the data is cleaned up.

```rust
// Simplified internal representation of Rc
pub struct Rc<T: ?Sized> {
    ptr: NonNull<RcBox<T>>,
}

struct RcBox<T: ?Sized> {
    strong: Cell<usize>,  // strong reference count
    weak: Cell<usize>,    // weak reference count
    value: T,             // actual data
}
```

#### Memory Layout

```
Stack                 Heap
+----------+         +------------------+
| Rc<T> a  |  ----+  | RcBox<T>        |
| (8 bytes)|      |  | strong: 2       |
+----------+      +->| weak: 1         |
| Rc<T> b  |  ----+  | value: T        |
| (8 bytes)|         +------------------+
+----------+
```

```rust
use std::rc::Rc;
use std::cell::Cell;

fn main() {
    let a = Rc::new(42);
    println!("Strong count after creation: {}", Rc::strong_count(&a)); // 1

    let b = Rc::clone(&a);  // increment reference count, don't copy data
    println!("Strong count after clone: {}", Rc::strong_count(&a)); // 2

    {
        let c = Rc::clone(&a);
        println!("Strong count in inner scope: {}", Rc::strong_count(&a)); // 3
    } // c leaves scope, reference count decrements by 1

    println!("Strong count after c drops: {}", Rc::strong_count(&a)); // 2
}
```

### Arc<T> Atomic Reference Counting

`Arc<T>` (Atomically Reference Counted) uses atomic operations to manage reference counting, ensuring thread safety.

```rust
// Simplified internal representation of Arc
pub struct Arc<T: ?Sized> {
    ptr: NonNull<ArcInner<T>>,
}

struct ArcInner<T: ?Sized> {
    strong: AtomicUsize,  // atomic strong reference count
    weak: AtomicUsize,    // atomic weak reference count
    data: T,
}
```

#### The Nature of Atomic Operations

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

// Rc uses ordinary Cell<usize>
struct NonAtomicCounter {
    count: std::cell::Cell<usize>,
}

impl NonAtomicCounter {
    fn increment(&self) {
        // Non-atomic operation: read-modify-write is not atomic
        // May cause data races in multi-threaded environments
        let current = self.count.get();
        self.count.set(current + 1);
    }
}

// Arc uses AtomicUsize
struct AtomicCounter {
    count: AtomicUsize,
}

impl AtomicCounter {
    fn increment(&self) {
        // Atomic operation: hardware guarantees read-modify-write is indivisible
        self.count.fetch_add(1, Ordering::Relaxed);
    }
}
```

### Weak<T> How It Works

`Weak<T>` is a weak reference version of `Rc<T>` or `Arc<T>`. It doesn't increment the strong reference count and won't prevent the data from being dropped.

```rust
use std::rc::{Rc, Weak};

fn main() {
    let strong = Rc::new(String::from("data"));
    let weak: Weak<String> = Rc::downgrade(&strong);

    println!("Strong refs: {}, Weak refs: {}",
             Rc::strong_count(&strong),
             Rc::weak_count(&strong));

    // upgrade() attempts to get a strong reference
    if let Some(data) = weak.upgrade() {
        println!("Data exists: {}", data);
    }

    drop(strong);  // drop the only strong reference

    // Data has been dropped, upgrade() returns None
    assert!(weak.upgrade().is_none());
    println!("Data has been dropped");
}
```

---

## Key Points

### Box<T> Core Features

```rust
// 1. Heap allocation
let boxed = Box::new(5);

// 2. Transparent deref
let value: i32 = *boxed;  // automatic deref

// 3. Automatic cleanup
fn example() {
    let b = Box::new(vec![1, 2, 3]);
} // b leaves scope, heap memory is automatically freed

// 4. Fixed size (regardless of T size, Box<T> is always pointer-sized)
assert_eq!(std::mem::size_of::<Box<i32>>(), 8);
assert_eq!(std::mem::size_of::<Box<[i32; 1000]>>(), 8);
```

### Rc<T> Core Features

```rust
use std::rc::Rc;

// 1. Shared ownership
let a = Rc::new(vec![1, 2, 3]);
let b = Rc::clone(&a);  // a and b share the same data

// 2. Reference counting
println!("Reference count: {}", Rc::strong_count(&a));  // 2

// 3. Immutability by default
// Rc<T> doesn't allow modifying internal data by default
// Requires pairing with RefCell for interior mutability

// 4. Not thread-safe
// Rc<T> can only be used in single-threaded context
// let rc = Rc::new(1);
// std::thread::spawn(move || println!("{}", rc)); // compile error!
```

### Arc<T> Core Features

```rust
use std::sync::Arc;
use std::thread;

// 1. Thread-safe shared ownership
let data = Arc::new(vec![1, 2, 3]);

let handles: Vec<_> = (0..3).map(|i| {
    let data = Arc::clone(&data);
    thread::spawn(move || {
        println!("Thread {} sees: {:?}", i, data);
    })
}).collect();

for handle in handles {
    handle.join().unwrap();
}

// 2. Atomic reference counting (thread-safe)
println!("Reference count: {}", Arc::strong_count(&data));
```

### Weak<T> Core Features

```rust
use std::rc::{Rc, Weak};

// 1. Doesn't increment strong reference count
let strong = Rc::new(42);
let weak = Rc::downgrade(&strong);
assert_eq!(Rc::strong_count(&strong), 1);  // still 1

// 2. Doesn't prevent data destruction
drop(strong);
assert!(weak.upgrade().is_none());

// 3. Used to break circular references
struct Node {
    parent: Weak<Node>,      // weak reference to parent
    children: Vec<Rc<Node>>, // strong reference to children
}
```

### Send and Sync Traits

```rust
use std::rc::Rc;
use std::sync::Arc;

fn is_send<T: Send>() {}
fn is_sync<T: Sync>() {}

fn main() {
    // Arc<T> is Send + Sync (when T satisfies conditions)
    is_send::<Arc<i32>>();
    is_sync::<Arc<i32>>();

    // Rc<T> is neither Send nor Sync
    // is_send::<Rc<i32>>();  // compile error
    // is_sync::<Rc<i32>>();  // compile error
}
```

---

## Code Examples

### Box<T> Implementing Recursive Types

```rust
// Linked list definition - must use Box to break infinite recursion
#[derive(Debug)]
enum List<T> {
    Cons(T, Box<List<T>>),
    Nil,
}

use List::{Cons, Nil};

impl<T> List<T> {
    fn new() -> Self {
        Nil
    }

    fn prepend(self, elem: T) -> Self {
        Cons(elem, Box::new(self))
    }

    fn len(&self) -> usize {
        match self {
            Nil => 0,
            Cons(_, tail) => 1 + tail.len(),
        }
    }
}

fn main() {
    let list = List::new()
        .prepend(3)
        .prepend(2)
        .prepend(1);

    println!("List: {:?}", list);
    println!("Length: {}", list.len());
}
```

### Box<T> for Trait Objects

```rust
trait Shape {
    fn area(&self) -> f64;
    fn name(&self) -> &str;
}

struct Circle {
    radius: f64,
}

struct Rectangle {
    width: f64,
    height: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius * self.radius
    }
    fn name(&self) -> &str { "Circle" }
}

impl Shape for Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
    fn name(&self) -> &str { "Rectangle" }
}

fn main() {
    // Use Box<dyn Trait> to store objects of different types
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { radius: 3.0 }),
        Box::new(Rectangle { width: 4.0, height: 5.0 }),
    ];

    for shape in &shapes {
        println!("Area of {}: {:.2}", shape.name(), shape.area());
    }
}
```

### Rc<T> Implementing Shared Data

```rust
use std::rc::Rc;

#[derive(Debug)]
struct SharedConfig {
    database_url: String,
    max_connections: u32,
}

struct ServiceA {
    config: Rc<SharedConfig>,
}

struct ServiceB {
    config: Rc<SharedConfig>,
}

impl ServiceA {
    fn connect(&self) {
        println!("ServiceA connecting to: {}", self.config.database_url);
    }
}

impl ServiceB {
    fn connect(&self) {
        println!("ServiceB using {} connections", self.config.max_connections);
    }
}

fn main() {
    let config = Rc::new(SharedConfig {
        database_url: String::from("postgres://localhost/db"),
        max_connections: 10,
    });

    let service_a = ServiceA { config: Rc::clone(&config) };
    let service_b = ServiceB { config: Rc::clone(&config) };

    service_a.connect();
    service_b.connect();

    println!("Config shared by {} services", Rc::strong_count(&config));
}
```

### Rc<RefCell<T>> Combination Pattern

```rust
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug)]
struct BankAccount {
    owner: String,
    balance: i64,
}

impl BankAccount {
    fn new(owner: &str, balance: i64) -> Self {
        BankAccount {
            owner: owner.to_string(),
            balance,
        }
    }

    fn deposit(&mut self, amount: i64) {
        self.balance += amount;
        println!("{} deposited {}, balance: {}", self.owner, amount, self.balance);
    }

    fn withdraw(&mut self, amount: i64) -> Result<(), String> {
        if self.balance >= amount {
            self.balance -= amount;
            println!("{} withdrew {}, balance: {}", self.owner, amount, self.balance);
            Ok(())
        } else {
            Err(String::from("Insufficient balance"))
        }
    }
}

fn main() {
    // Create a shared mutable account
    let account = Rc::new(RefCell::new(BankAccount::new("Alice", 1000)));

    // Multiple references hold the same account
    let teller1 = Rc::clone(&account);
    let teller2 = Rc::clone(&account);

    // Teller 1 operates
    teller1.borrow_mut().deposit(500);

    // Teller 2 operates
    teller2.borrow_mut().withdraw(200).unwrap();

    // Check final state
    println!("Final balance: {}", account.borrow().balance);
}
```

### Arc<T> Multi-threaded Sharing

```rust
use std::sync::Arc;
use std::thread;
use std::time::Duration;

fn main() {
    let data = Arc::new(vec![1, 2, 3, 4, 5]);
    let mut handles = vec![];

    for i in 0..3 {
        let data = Arc::clone(&data);
        let handle = thread::spawn(move || {
            // Each thread can read the shared data
            let sum: i32 = data.iter().sum();
            println!("Thread {} computed sum: {}", i, sum);
            thread::sleep(Duration::from_millis(100));
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("All threads complete, reference count: {}", Arc::strong_count(&data));
}
```

### Arc<Mutex<T>> Thread-safe Mutable Sharing

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            // Acquire lock, modify data
            let mut num = counter.lock().unwrap();
            *num += 1;
            println!("Thread {} incremented counter to {}", i, *num);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", *counter.lock().unwrap());
}
```

### Weak<T> Preventing Circular References

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

#[derive(Debug)]
struct TreeNode {
    value: i32,
    parent: RefCell<Weak<TreeNode>>,
    children: RefCell<Vec<Rc<TreeNode>>>,
}

impl TreeNode {
    fn new(value: i32) -> Rc<Self> {
        Rc::new(TreeNode {
            value,
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(Vec::new()),
        })
    }

    fn add_child(parent: &Rc<TreeNode>, child: &Rc<TreeNode>) {
        // Child stores weak reference to parent
        *child.parent.borrow_mut() = Rc::downgrade(parent);
        // Parent stores strong reference to child
        parent.children.borrow_mut().push(Rc::clone(child));
    }
}

fn main() {
    let root = TreeNode::new(1);
    let child1 = TreeNode::new(2);
    let child2 = TreeNode::new(3);

    TreeNode::add_child(&root, &child1);
    TreeNode::add_child(&root, &child2);

    println!("root strong refs: {}", Rc::strong_count(&root));
    println!("root weak refs: {}", Rc::weak_count(&root));

    // Access parent through weak reference
    if let Some(parent) = child1.parent.borrow().upgrade() {
        println!("child1's parent value: {}", parent.value);
    }
}
```

### Comprehensive Example: Publish-Subscribe Pattern

```rust
use std::sync::{Arc, Weak, Mutex};
use std::thread;

trait Subscriber: Send + Sync {
    fn on_message(&self, message: &str);
}

struct Publisher {
    subscribers: Mutex<Vec<Weak<dyn Subscriber>>>,
}

impl Publisher {
    fn new() -> Self {
        Publisher {
            subscribers: Mutex::new(Vec::new()),
        }
    }

    fn subscribe(&self, subscriber: &Arc<dyn Subscriber>) {
        self.subscribers.lock().unwrap()
            .push(Arc::downgrade(subscriber));
    }

    fn publish(&self, message: &str) {
        let mut subs = self.subscribers.lock().unwrap();

        // Clean up invalid subscribers and notify valid ones
        subs.retain(|weak| {
            if let Some(subscriber) = weak.upgrade() {
                subscriber.on_message(message);
                true
            } else {
                false
            }
        });
    }
}

struct EmailSubscriber {
    email: String,
}

impl Subscriber for EmailSubscriber {
    fn on_message(&self, message: &str) {
        println!("Send email to {}: {}", self.email, message);
    }
}

struct SmsSubscriber {
    phone: String,
}

impl Subscriber for SmsSubscriber {
    fn on_message(&self, message: &str) {
        println!("Send SMS to {}: {}", self.phone, message);
    }
}

fn main() {
    let publisher = Arc::new(Publisher::new());

    let email_sub: Arc<dyn Subscriber> = Arc::new(EmailSubscriber {
        email: String::from("user@example.com"),
    });

    let sms_sub: Arc<dyn Subscriber> = Arc::new(SmsSubscriber {
        phone: String::from("13800138000"),
    });

    publisher.subscribe(&email_sub);
    publisher.subscribe(&sms_sub);

    // Publish message in multi-threaded environment
    let pub_clone = Arc::clone(&publisher);
    let handle = thread::spawn(move || {
        pub_clone.publish("System notification: server maintenance");
    });

    handle.join().unwrap();

    // Unsubscribe one subscriber
    drop(sms_sub);

    // Publish again, only email_sub receives it
    publisher.publish("Only email subscribers receive this message");
}
```

---

## Best Practices

### Prefer Stack Allocation

```rust
// Bad: unnecessary heap allocation
fn bad_example() {
    let x = Box::new(42);  // small data doesn't need Box
    println!("{}", x);
}

// Good: use stack directly
fn good_example() {
    let x = 42;
    println!("{}", x);
}
```

### Choose Rc or Arc Based on Scenario

```rust
use std::rc::Rc;
use std::sync::Arc;

// Single-threaded: use Rc (better performance)
fn single_threaded() {
    let data = Rc::new(vec![1, 2, 3]);
    let copy = Rc::clone(&data);
    // ...
}

// Multi-threaded: use Arc
fn multi_threaded() {
    let data = Arc::new(vec![1, 2, 3]);
    std::thread::spawn({
        let data = Arc::clone(&data);
        move || {
            println!("{:?}", data);
        }
    });
}
```

### Use Rc::clone Instead of .clone()

```rust
use std::rc::Rc;

fn main() {
    let data = Rc::new(String::from("hello"));

    // Recommended: clearly shows only incrementing reference count
    let copy1 = Rc::clone(&data);

    // Not recommended: can be misunderstood as deep copy
    let copy2 = data.clone();

    // Same effect, but Rc::clone is clearer
}
```

### Use Weak to Avoid Circular References

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

// Wrong: circular reference causes memory leak
struct BadNode {
    next: Option<Rc<RefCell<BadNode>>>,
    prev: Option<Rc<RefCell<BadNode>>>,  // strong reference creates cycle
}

// Correct: use Weak to break cycle
struct GoodNode {
    next: Option<Rc<RefCell<GoodNode>>>,
    prev: RefCell<Weak<GoodNode>>,  // weak reference won't prevent dropping
}
```

### Minimize Lock Holding Time

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));

    let data_clone = Arc::clone(&data);
    thread::spawn(move || {
        // Bad: hold lock for long time
        // let mut guard = data_clone.lock().unwrap();
        // expensive_computation();
        // guard.push(4);

        // Good: acquire lock quickly and release
        let new_value = expensive_computation();
        data_clone.lock().unwrap().push(new_value);
    });
}

fn expensive_computation() -> i32 {
    std::thread::sleep(std::time::Duration::from_millis(100));
    42
}
```

### Prefer RwLock Over Mutex (For Read-Heavy Scenarios)

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // Multiple readers can run in parallel
    for i in 0..5 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let read_guard = data.read().unwrap();
            println!("Reader {}: {:?}", i, *read_guard);
        }));
    }

    // Writers need exclusive access
    {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let mut write_guard = data.write().unwrap();
            write_guard.push(4);
            println!("Write complete");
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

---

## Common Pitfalls

### RefCell Borrow Conflicts Causing Panic

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);

    // Pitfall: simultaneous immutable and mutable borrow
    let borrow = data.borrow();
    // let borrow_mut = data.borrow_mut();  // panic: already borrowed

    // Solution: ensure borrow scopes don't overlap
    drop(borrow);
    let borrow_mut = data.borrow_mut();

    // Or use try_borrow_mut
    let data2 = RefCell::new(10);
    let _ = data2.borrow();
    match data2.try_borrow_mut() {
        Ok(mut val) => *val += 1,
        Err(_) => println!("Cannot get mutable borrow"),
    }
}
```

### Circular References Causing Memory Leaks

```rust
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    // Pitfall: circular reference
    let a = Rc::new(RefCell::new(None::<Rc<RefCell<Option<Rc<RefCell<Option<Rc<_>>>>>>>>));
    let b = Rc::new(RefCell::new(Some(Rc::clone(&a))));
    *a.borrow_mut() = Some(Rc::clone(&b));

    // a -> b -> a creates a cycle
    // Even leaving scope won't release memory

    println!("a strong count: {}", Rc::strong_count(&a));  // 2
    println!("b strong count: {}", Rc::strong_count(&b));  // 2
}
```

### Deadlock

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let lock1 = Arc::new(Mutex::new(1));
    let lock2 = Arc::new(Mutex::new(2));

    // Pitfall: two threads acquiring locks in different order may deadlock
    let l1 = Arc::clone(&lock1);
    let l2 = Arc::clone(&lock2);
    let h1 = thread::spawn(move || {
        let _g1 = l1.lock().unwrap();
        thread::sleep(std::time::Duration::from_millis(10));
        let _g2 = l2.lock().unwrap();  // possible deadlock
    });

    let l1 = Arc::clone(&lock1);
    let l2 = Arc::clone(&lock2);
    let h2 = thread::spawn(move || {
        let _g2 = l2.lock().unwrap();
        thread::sleep(std::time::Duration::from_millis(10));
        let _g1 = l1.lock().unwrap();  // possible deadlock
    });

    // Solution: always acquire locks in the same order
}
```

### Calling clone on Rc Instead of Rc::clone

```rust
use std::rc::Rc;

fn main() {
    let data = Rc::new(String::from("expensive data"));

    // While functionally identical, intent is unclear
    let copy1 = data.clone();      // reader might think it's deep copy
    let copy2 = Rc::clone(&data);  // clearly shows reference count increment
}
```

### Forgetting Arc Requires Mutex to Modify

```rust
use std::sync::Arc;

fn main() {
    let data = Arc::new(vec![1, 2, 3]);

    // Pitfall: Arc doesn't provide interior mutability
    // data.push(4);  // compile error

    // Arc::get_mut only works when reference count is 1
    let mut data = Arc::new(vec![1, 2, 3]);
    if let Some(vec) = Arc::get_mut(&mut data) {
        vec.push(4);
    }

    // Correct approach: pair with Mutex or RwLock
    use std::sync::Mutex;
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));
    data.lock().unwrap().push(4);
}
```

### Continuing to Use After Weak::upgrade Fails

```rust
use std::rc::{Rc, Weak};

fn main() {
    let weak: Weak<i32>;
    {
        let strong = Rc::new(42);
        weak = Rc::downgrade(&strong);
    } // strong leaves scope

    // Pitfall: using unwrap without checking
    // let value = weak.upgrade().unwrap();  // panic!

    // Correct approach: check upgrade result
    match weak.upgrade() {
        Some(value) => println!("Value: {}", value),
        None => println!("Data has been dropped"),
    }
}
```

---

## Performance Considerations

### Memory Overhead Comparison

```rust
use std::mem::size_of;
use std::rc::Rc;
use std::sync::Arc;
use std::cell::{Cell, RefCell};

fn main() {
    println!("=== Type Size Comparison ===");
    println!("i32:           {} bytes", size_of::<i32>());
    println!("Box<i32>:      {} bytes", size_of::<Box<i32>>());
    println!("Rc<i32>:       {} bytes", size_of::<Rc<i32>>());
    println!("Arc<i32>:      {} bytes", size_of::<Arc<i32>>());
    println!("Cell<i32>:     {} bytes", size_of::<Cell<i32>>());
    println!("RefCell<i32>:  {} bytes", size_of::<RefCell<i32>>());

    // Actual overhead of Rc and Arc (control block on heap)
    // Rc: strong_count (usize) + weak_count (usize) + data
    // Arc: same, but using atomic types
}
```

### Reference Counting vs Cloning

```rust
use std::rc::Rc;
use std::time::Instant;

fn main() {
    let data = vec![0u8; 1_000_000];  // 1MB data

    // Deep copy: expensive
    let start = Instant::now();
    for _ in 0..1000 {
        let _copy = data.clone();
    }
    println!("1000 deep clones: {:?}", start.elapsed());

    // Reference counting: cheap
    let rc_data = Rc::new(data);
    let start = Instant::now();
    for _ in 0..1000 {
        let _copy = Rc::clone(&rc_data);
    }
    println!("1000 Rc::clones: {:?}", start.elapsed());
}
```

### Rc vs Arc Performance Difference

```rust
use std::rc::Rc;
use std::sync::Arc;
use std::time::Instant;

fn main() {
    const ITERATIONS: usize = 10_000_000;

    // Rc: ordinary reference counting
    let rc = Rc::new(42);
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        let _clone = Rc::clone(&rc);
    }
    println!("Rc {} clones: {:?}", ITERATIONS, start.elapsed());

    // Arc: atomic reference counting
    let arc = Arc::new(42);
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        let _clone = Arc::clone(&arc);
    }
    println!("Arc {} clones: {:?}", ITERATIONS, start.elapsed());
}
```

### Selection Guide

| Scenario | Recommended Type | Reason |
|---|---|---|
| Heap-allocate single owner | `Box<T>` | Zero-cost abstraction |
| Single-threaded shared read-only | `Rc<T>` | Faster than Arc |
| Single-threaded shared mutable | `Rc<RefCell<T>>` | Interior mutability |
| Multi-threaded shared read-only | `Arc<T>` | Thread-safe |
| Multi-threaded shared mutable | `Arc<Mutex<T>>` | Thread-safe + mutual exclusion |
| Multi-threaded read-heavy | `Arc<RwLock<T>>` | Allows multiple readers |

---

## Real-World Scenarios

### Scenario 1: Graph Data Structure

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;
use std::collections::HashMap;

type NodeRef = Rc<RefCell<GraphNode>>;
type WeakNodeRef = Weak<RefCell<GraphNode>>;

struct GraphNode {
    id: usize,
    neighbors: Vec<WeakNodeRef>,
}

struct Graph {
    nodes: HashMap<usize, NodeRef>,
}

impl Graph {
    fn new() -> Self {
        Graph { nodes: HashMap::new() }
    }

    fn add_node(&mut self, id: usize) {
        let node = Rc::new(RefCell::new(GraphNode {
            id,
            neighbors: Vec::new(),
        }));
        self.nodes.insert(id, node);
    }

    fn add_edge(&mut self, from: usize, to: usize) {
        if let (Some(from_node), Some(to_node)) =
            (self.nodes.get(&from), self.nodes.get(&to))
        {
            from_node.borrow_mut().neighbors.push(Rc::downgrade(to_node));
            to_node.borrow_mut().neighbors.push(Rc::downgrade(from_node));
        }
    }

    fn print_neighbors(&self, id: usize) {
        if let Some(node) = self.nodes.get(&id) {
            print!("Node {} neighbors: ", id);
            for weak in &node.borrow().neighbors {
                if let Some(neighbor) = weak.upgrade() {
                    print!("{} ", neighbor.borrow().id);
                }
            }
            println!();
        }
    }
}

fn main() {
    let mut graph = Graph::new();

    for i in 0..5 {
        graph.add_node(i);
    }

    graph.add_edge(0, 1);
    graph.add_edge(0, 2);
    graph.add_edge(1, 2);
    graph.add_edge(2, 3);
    graph.add_edge(3, 4);

    for i in 0..5 {
        graph.print_neighbors(i);
    }
}
```

### Scenario 2: Thread Pool Task Sharing State

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::collections::VecDeque;

struct TaskQueue {
    tasks: Mutex<VecDeque<Box<dyn FnOnce() + Send>>>,
}

struct ThreadPool {
    workers: Vec<thread::JoinHandle<()>>,
    queue: Arc<TaskQueue>,
}

impl ThreadPool {
    fn new(size: usize) -> Self {
        let queue = Arc::new(TaskQueue {
            tasks: Mutex::new(VecDeque::new()),
        });

        let workers = (0..size).map(|id| {
            let queue = Arc::clone(&queue);
            thread::spawn(move || {
                loop {
                    let task = {
                        let mut tasks = queue.tasks.lock().unwrap();
                        tasks.pop_front()
                    };

                    match task {
                        Some(task) => {
                            println!("Worker {} executing task", id);
                            task();
                        }
                        None => {
                            thread::sleep(std::time::Duration::from_millis(100));
                        }
                    }
                }
            })
        }).collect();

        ThreadPool { workers, queue }
    }

    fn submit<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static
    {
        self.queue.tasks.lock().unwrap().push_back(Box::new(f));
    }
}

fn main() {
    let pool = ThreadPool::new(4);

    let counter = Arc::new(Mutex::new(0));

    for i in 0..10 {
        let counter = Arc::clone(&counter);
        pool.submit(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
            println!("Task {} complete, count: {}", i, *num);
        });
    }

    thread::sleep(std::time::Duration::from_secs(2));
    println!("Final count: {}", *counter.lock().unwrap());
}
```

### Scenario 3: Cache System

```rust
use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use std::time::{Duration, Instant};

struct CacheEntry<V> {
    value: V,
    created_at: Instant,
    ttl: Duration,
}

struct Cache<K, V> {
    data: RwLock<HashMap<K, CacheEntry<V>>>,
}

impl<K, V> Cache<K, V>
where
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    fn new() -> Arc<Self> {
        Arc::new(Cache {
            data: RwLock::new(HashMap::new()),
        })
    }

    fn get(&self, key: &K) -> Option<V> {
        let data = self.data.read().unwrap();
        data.get(key).and_then(|entry| {
            if entry.created_at.elapsed() < entry.ttl {
                Some(entry.value.clone())
            } else {
                None
            }
        })
    }

    fn set(&self, key: K, value: V, ttl: Duration) {
        let mut data = self.data.write().unwrap();
        data.insert(key, CacheEntry {
            value,
            created_at: Instant::now(),
            ttl,
        });
    }

    fn cleanup(&self) {
        let mut data = self.data.write().unwrap();
        data.retain(|_, entry| entry.created_at.elapsed() < entry.ttl);
    }
}

fn main() {
    let cache = Cache::new();

    cache.set("key1".to_string(), "value1".to_string(), Duration::from_secs(5));
    cache.set("key2".to_string(), "value2".to_string(), Duration::from_millis(100));

    println!("key1: {:?}", cache.get(&"key1".to_string()));
    println!("key2: {:?}", cache.get(&"key2".to_string()));

    std::thread::sleep(Duration::from_millis(150));

    println!("After wait key1: {:?}", cache.get(&"key1".to_string()));
    println!("After wait key2: {:?}", cache.get(&"key2".to_string())); // expired

    cache.cleanup();
}
```

---

## Interview Questions

### Q1: What are the differences between Box, Rc, and Arc?

**Answer Key Points:**
- `Box<T>`: heap allocation, single owner, compile-time ownership
- `Rc<T>`: reference counting, multiple owners, single-threaded, runtime reference counting
- `Arc<T>`: atomic reference counting, multiple owners, multi-threaded safe, uses atomic operations

```rust
// Box: single owner
let b = Box::new(5);
// let b2 = b;  // ownership transferred
// println!("{}", b);  // compile error

// Rc: shared ownership (single-threaded)
let rc = Rc::new(5);
let rc2 = Rc::clone(&rc);  // reference count +1

// Arc: shared ownership (multi-threaded)
let arc = Arc::new(5);
std::thread::spawn(move || println!("{}", arc));
```

### Q2: Why is Rc not thread-safe?

**Answer Key Points:**
- `Rc` uses ordinary `Cell<usize>` to store reference count
- Non-atomic operations can cause data races in multi-threaded environments
- Increment/decrement of reference count (read-modify-write) is not atomic

```rust
// Rc's reference counting operation (simplified)
fn increment(count: &Cell<usize>) {
    let current = count.get();    // 1. read
    count.set(current + 1);       // 2. write
    // Between 1 and 2, another thread might read the same value
}
```

### Q3: What is a circular reference? How to prevent it?

**Answer Key Points:**
- Circular reference: two or more objects hold strong references to each other
- Causes reference count to never reach 0, creating memory leak
- Solution: use `Weak<T>` to break the cycle

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

struct Node {
    parent: RefCell<Weak<Node>>,   // weak reference
    children: RefCell<Vec<Rc<Node>>>,  // strong reference
}
```

### Q4: What are the differences between RefCell and Mutex?

**Answer Key Points:**
- `RefCell`: compile-time borrow check deferred to runtime, single-threaded, panics on violation
- `Mutex`: thread-safe mutual exclusion lock, multi-threaded, blocks/returns Result

| Feature | RefCell | Mutex |
|---|---|---|
| Thread-safe | No | Yes |
| Error handling | panic | block/Result |
| Performance | faster | slower (syscall) |

### Q5: How to choose between Arc<Mutex<T>> and Arc<RwLock<T>>?

**Answer Key Points:**
- Read-heavy: use `RwLock`, allows multiple concurrent readers
- Write-heavy or balanced: use `Mutex`, simpler, less overhead

```rust
// Mutex: frequent modifications
let counter = Arc::new(Mutex::new(0));

// RwLock: read-heavy
let config = Arc::new(RwLock::new(HashMap::new()));
// multiple threads can read simultaneously
let read_guard = config.read().unwrap();
```

### Q6: What is Box::leak used for?

**Answer Key Points:**
- Converts `Box<T>` to `&'static T`
- Memory is never released
- Useful for scenarios requiring static lifetime references

```rust
let static_str: &'static str = Box::leak(Box::new(String::from("permanent string")));
```

### Q7: What are Rc::make_mut and Arc::make_mut?

**Answer Key Points:**
- Implements Copy-on-Write (CoW) semantics
- If only one reference exists, directly returns mutable reference
- If multiple references exist, clones data first then returns mutable reference

```rust
let mut rc = Rc::new(vec![1, 2, 3]);
Rc::make_mut(&mut rc).push(4);  // might clone
```

---

## Further Reading

### Official Documentation
- [The Rust Programming Language - Smart Pointers](https://doc.rust-lang.org/book/ch15-00-smart-pointers.html)
- [std::boxed::Box](https://doc.rust-lang.org/std/boxed/struct.Box.html)
- [std::rc::Rc](https://doc.rust-lang.org/std/rc/struct.Rc.html)
- [std::sync::Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html)
- [std::rc::Weak](https://doc.rust-lang.org/std/rc/struct.Weak.html)

### Classic Books
- The Rust Programming Language - Chapter 15: Smart Pointers
- Rust in Action - Memory Management and Ownership
- Programming Rust - Smart Pointers

### Deep Dives
- [Rust Nomicon - Arc and Mutex](https://doc.rust-lang.org/nomicon/arc-mutex.html)
- [RustBelt: Logical Foundations for the Future of Safe Systems Programming](https://plv.mpi-sws.org/rustbelt/)
- [Understanding Rust's Ownership and Borrowing](https://blog.thoughtram.io/ownership-in-rust/)

### Related Topics
- [Ownership System](/rust/ownership) - Understand Rust memory management fundamentals
- [Lifetimes](/rust/lifetimes) - Borrow checking and lifetime annotations
- [Concurrency](/rust/concurrency) - Multi-threading and synchronization primitives
- [Smart Pointers](/rust/smart-pointers) - More smart pointer types (Cell, RefCell, Cow)
