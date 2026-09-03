---
title: Smart Pointers
description: Complete guide to Rust smart pointers, Box, Rc, Arc, RefCell and interior mutability
track: rust
section: ownership-borrowing
difficulty: advanced
tags:
  - Rust
  - Smart Pointers
  - Box
  - Rc
  - Arc
status: imported
origin: old/src/content/docs/rust/smart-pointers.en.md
divergence: 0.216
issues: []
legacy:
  category: Rust
  subcategory: Memory Management
  order: 5
  lastUpdated: 2026-01-07
---

Smart pointers are data structures that act like pointers but provide additional metadata and capabilities beyond simple memory addresses. Unlike regular references that only borrow data, smart pointers often own the data they point to. Rust's standard library provides several smart pointer types, each designed for specific use cases.

## What Makes a Pointer "Smart"?

In Rust, smart pointers are typically implemented as structs that implement the `Deref` and `Drop` traits:

- **`Deref`**: Allows the smart pointer to behave like a regular reference, enabling dereferencing with `*` and automatic dereferencing in method calls.
- **`Drop`**: Provides custom cleanup logic when the smart pointer goes out of scope.

Common smart pointers include `String` and `Vec<T>`, which own their data and provide additional capabilities beyond simple references.

## Box\<T\>: Heap Allocation

`Box<T>` is the simplest smart pointer, providing heap allocation for values. It has no performance overhead beyond the heap allocation itself.

### When to Use Box

1. **Large data that should not be copied**: Moving large structs on the stack is expensive.
2. **Recursive types**: Types that reference themselves need indirection.
3. **Trait objects**: When you need dynamic dispatch with `dyn Trait`.

### Basic Usage

```rust
fn main() {
    // Allocate an integer on the heap
    let boxed_num = Box::new(42);
    println!("Boxed value: {}", boxed_num);

    // Dereferencing
    let unboxed = *boxed_num;
    println!("Unboxed value: {}", unboxed);
}
```

### Recursive Types with Box

Without `Box`, recursive types would have infinite size:

```rust
// This won't compile - infinite size
// enum List {
//     Cons(i32, List),
//     Nil,
// }

// Using Box for indirection
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));

    // Print the list
    fn print_list(list: &List) {
        match list {
            Cons(value, next) => {
                print!("{} -> ", value);
                print_list(next);
            }
            Nil => println!("Nil"),
        }
    }

    print_list(&list); // Output: 1 -> 2 -> 3 -> Nil
}
```

### Large Data Transfer

```rust
struct LargeStruct {
    data: [u8; 1000000],
}

fn main() {
    // Without Box: copies 1MB on the stack
    // let large = LargeStruct { data: [0; 1000000] };

    // With Box: only copies a pointer (8 bytes on 64-bit systems)
    let large = Box::new(LargeStruct { data: [0; 1000000] });
    let moved_large = large; // Only pointer is copied
}
```

### Trait Objects with Box

```rust
trait Animal {
    fn speak(&self);
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn speak(&self) {
        println!("Woof!");
    }
}

impl Animal for Cat {
    fn speak(&self) {
        println!("Meow!");
    }
}

fn main() {
    let animals: Vec<Box<dyn Animal>> = vec![
        Box::new(Dog),
        Box::new(Cat),
    ];

    for animal in &animals {
        animal.speak();
    }
}
```

### Box::leak for Static References

Sometimes you need to create a `'static` reference from owned data:

```rust
fn main() {
    let boxed = Box::new(String::from("Hello, World!"));

    // Leak the box to get a 'static reference
    let static_str: &'static str = Box::leak(boxed);

    println!("{}", static_str);
    // Note: This memory will never be freed
}
```

## Rc\<T\>: Reference Counting

`Rc<T>` (Reference Counted) enables multiple ownership of the same data. It keeps track of the number of references and only deallocates when the count reaches zero.

**Important**: `Rc<T>` is only for single-threaded scenarios. It is not thread-safe.

### Basic Usage

```rust
use std::rc::Rc;

fn main() {
    let data = Rc::new(vec![1, 2, 3]);

    println!("Reference count: {}", Rc::strong_count(&data)); // 1

    let data_clone = Rc::clone(&data);
    println!("Reference count: {}", Rc::strong_count(&data)); // 2

    {
        let another_clone = Rc::clone(&data);
        println!("Reference count: {}", Rc::strong_count(&data)); // 3
    }

    println!("Reference count: {}", Rc::strong_count(&data)); // 2
}
```

### Shared Ownership Example

```rust
use std::rc::Rc;

#[derive(Debug)]
struct Node {
    value: i32,
    children: Vec<Rc<Node>>,
}

fn main() {
    // Create a shared node
    let shared_child = Rc::new(Node {
        value: 10,
        children: vec![],
    });

    // Multiple parents can reference the same child
    let parent1 = Node {
        value: 1,
        children: vec![Rc::clone(&shared_child)],
    };

    let parent2 = Node {
        value: 2,
        children: vec![Rc::clone(&shared_child)],
    };

    println!("Shared child reference count: {}", Rc::strong_count(&shared_child)); // 3
    println!("Parent 1: {:?}", parent1);
    println!("Parent 2: {:?}", parent2);
}
```

### Weak References with Rc

`Weak<T>` prevents reference cycles that could cause memory leaks:

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}

fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });

    let branch = Rc::new(Node {
        value: 5,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![Rc::clone(&leaf)]),
    });

    // Set leaf's parent to branch using a weak reference
    *leaf.parent.borrow_mut() = Rc::downgrade(&branch);

    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade());
    println!("branch strong count: {}", Rc::strong_count(&branch)); // 1
    println!("branch weak count: {}", Rc::weak_count(&branch)); // 1
}
```

### Understanding Weak References

```rust
use std::rc::{Rc, Weak};

fn main() {
    let strong = Rc::new(5);
    println!("Strong count: {}", Rc::strong_count(&strong)); // 1
    println!("Weak count: {}", Rc::weak_count(&strong));     // 0

    let weak: Weak<i32> = Rc::downgrade(&strong);
    println!("Strong count: {}", Rc::strong_count(&strong)); // 1
    println!("Weak count: {}", Rc::weak_count(&strong));     // 1

    // Access value through weak reference
    match weak.upgrade() {
        Some(rc) => println!("Value: {}", rc),
        None => println!("Value was dropped"),
    }

    drop(strong);

    // After dropping strong reference
    match weak.upgrade() {
        Some(rc) => println!("Value: {}", rc),
        None => println!("Value was dropped"), // This prints
    }
}
```

## Arc\<T\>: Atomic Reference Counting

`Arc<T>` (Atomically Reference Counted) is the thread-safe version of `Rc<T>`. It uses atomic operations for reference counting, making it safe to share across threads.

### Basic Thread-Safe Sharing

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3, 4, 5]);
    let mut handles = vec![];

    for i in 0..3 {
        let data_clone = Arc::clone(&data);
        let handle = thread::spawn(move || {
            println!("Thread {}: {:?}", i, data_clone);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

### Arc with Mutex for Mutable Shared State

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter_clone = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter_clone.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", *counter.lock().unwrap()); // 10
}
```

### Arc with RwLock for Read-Heavy Workloads

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // Multiple readers
    for i in 0..3 {
        let data_clone = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let read_guard = data_clone.read().unwrap();
            println!("Reader {}: {:?}", i, *read_guard);
        }));
    }

    // Single writer
    let data_clone = Arc::clone(&data);
    handles.push(thread::spawn(move || {
        let mut write_guard = data_clone.write().unwrap();
        write_guard.push(4);
        println!("Writer added element");
    }));

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final data: {:?}", *data.read().unwrap());
}
```

### Shared Configuration Pattern

```rust
use std::sync::Arc;
use std::thread;

struct Config {
    database_url: String,
    max_connections: u32,
    timeout_seconds: u64,
}

fn main() {
    let config = Arc::new(Config {
        database_url: String::from("postgres://localhost/mydb"),
        max_connections: 10,
        timeout_seconds: 30,
    });

    let mut handles = vec![];

    for i in 0..5 {
        let config = Arc::clone(&config);
        handles.push(thread::spawn(move || {
            println!(
                "Worker {}: connecting to {} with timeout {}s",
                i, config.database_url, config.timeout_seconds
            );
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

## Interior Mutability

Rust's borrowing rules normally prevent mutating data through shared references. Interior mutability is a design pattern that allows mutation even when there are immutable references, by moving the borrow checking from compile time to runtime.

## Cell\<T\>: Copy-Based Interior Mutability

`Cell<T>` provides interior mutability for types that implement `Copy`. It never gives out references to its contents, instead copying values in and out.

### Basic Usage

```rust
use std::cell::Cell;

struct Counter {
    value: Cell<i32>,
}

impl Counter {
    fn new() -> Self {
        Counter { value: Cell::new(0) }
    }

    fn increment(&self) {
        // Note: &self, not &mut self
        self.value.set(self.value.get() + 1);
    }

    fn get(&self) -> i32 {
        self.value.get()
    }
}

fn main() {
    let counter = Counter::new();

    counter.increment();
    counter.increment();
    counter.increment();

    println!("Count: {}", counter.get()); // 3
}
```

### Cell Methods

```rust
use std::cell::Cell;

fn main() {
    let cell = Cell::new(5);

    // get: Returns a copy of the contained value
    let value = cell.get();
    println!("Value: {}", value);

    // set: Replaces the contained value
    cell.set(10);
    println!("New value: {}", cell.get());

    // replace: Replaces and returns the old value
    let old = cell.replace(20);
    println!("Old: {}, New: {}", old, cell.get());

    // take: Takes the value, leaving Default::default()
    let cell_option: Cell<Option<i32>> = Cell::new(Some(42));
    let taken = cell_option.take();
    println!("Taken: {:?}, Remaining: {:?}", taken, cell_option.get());

    // update: Updates the contained value using a function (nightly feature)
    // cell.update(|x| x + 1);
}
```

### Cell for Caching

```rust
use std::cell::Cell;

struct CachedComputation {
    input: i32,
    cached_result: Cell<Option<i32>>,
}

impl CachedComputation {
    fn new(input: i32) -> Self {
        CachedComputation {
            input,
            cached_result: Cell::new(None),
        }
    }

    fn compute(&self) -> i32 {
        match self.cached_result.get() {
            Some(result) => result,
            None => {
                // Expensive computation
                let result = self.input * self.input;
                self.cached_result.set(Some(result));
                result
            }
        }
    }
}

fn main() {
    let computation = CachedComputation::new(5);

    println!("First call: {}", computation.compute());  // Computes
    println!("Second call: {}", computation.compute()); // Uses cache
}
```

## RefCell\<T\>: Runtime Borrow Checking

`RefCell<T>` provides interior mutability with runtime borrow checking. Unlike `Cell<T>`, it can work with any type and provides references to its contents.

### Basic Usage

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(vec![1, 2, 3]);

    // Immutable borrow
    {
        let borrowed = data.borrow();
        println!("Data: {:?}", *borrowed);
    }

    // Mutable borrow
    {
        let mut borrowed_mut = data.borrow_mut();
        borrowed_mut.push(4);
    }

    println!("Modified data: {:?}", data.borrow());
}
```

### RefCell Panics on Borrow Violations

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);

    let borrow1 = data.borrow();
    let borrow2 = data.borrow(); // OK: multiple immutable borrows

    println!("borrow1: {}, borrow2: {}", borrow1, borrow2);

    drop(borrow1);
    drop(borrow2);

    // This would panic at runtime:
    // let borrow = data.borrow();
    // let borrow_mut = data.borrow_mut(); // PANIC!
}
```

### Using try_borrow for Safe Access

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(42);

    let _borrow = data.borrow_mut();

    // try_borrow returns Result instead of panicking
    match data.try_borrow() {
        Ok(value) => println!("Value: {}", value),
        Err(_) => println!("Could not borrow: already mutably borrowed"),
    }

    match data.try_borrow_mut() {
        Ok(mut value) => *value = 100,
        Err(_) => println!("Could not mutably borrow: already borrowed"),
    }
}
```

### Mock Object Pattern

```rust
use std::cell::RefCell;

trait Messenger {
    fn send(&self, msg: &str);
}

struct MockMessenger {
    messages: RefCell<Vec<String>>,
}

impl MockMessenger {
    fn new() -> MockMessenger {
        MockMessenger {
            messages: RefCell::new(vec![]),
        }
    }
}

impl Messenger for MockMessenger {
    fn send(&self, message: &str) {
        // Can mutate with &self thanks to RefCell
        self.messages.borrow_mut().push(String::from(message));
    }
}

fn main() {
    let mock = MockMessenger::new();

    mock.send("Hello");
    mock.send("World");

    assert_eq!(mock.messages.borrow().len(), 2);
    println!("Messages: {:?}", mock.messages.borrow());
}
```

### Combining Rc and RefCell

A common pattern is combining `Rc<RefCell<T>>` for shared mutable state:

```rust
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
struct SharedState {
    value: i32,
}

fn main() {
    let shared = Rc::new(RefCell::new(SharedState { value: 0 }));

    let reference1 = Rc::clone(&shared);
    let reference2 = Rc::clone(&shared);

    // Mutate through reference1
    reference1.borrow_mut().value = 42;

    // Read through reference2
    println!("Value via reference2: {}", reference2.borrow().value);

    // Mutate through reference2
    reference2.borrow_mut().value = 100;

    // Read through original
    println!("Value via shared: {}", shared.borrow().value);
}
```

## Cow\<T\>: Clone on Write

`Cow<T>` (Clone on Write) is a smart pointer that provides clone-on-write functionality. It can hold either borrowed data or owned data, cloning only when mutation is needed.

### Basic Usage

```rust
use std::borrow::Cow;

fn main() {
    // Borrowed data
    let borrowed: Cow<str> = Cow::Borrowed("hello");
    println!("Borrowed: {}", borrowed);

    // Owned data
    let owned: Cow<str> = Cow::Owned(String::from("world"));
    println!("Owned: {}", owned);
}
```

### Efficient String Processing

```rust
use std::borrow::Cow;

fn remove_whitespace(input: &str) -> Cow<str> {
    if input.contains(' ') {
        // Need to modify: create owned version
        Cow::Owned(input.chars().filter(|c| *c != ' ').collect())
    } else {
        // No modification needed: borrow
        Cow::Borrowed(input)
    }
}

fn main() {
    let no_spaces = "hello";
    let with_spaces = "hello world";

    let result1 = remove_whitespace(no_spaces);
    let result2 = remove_whitespace(with_spaces);

    match &result1 {
        Cow::Borrowed(_) => println!("'{}' was borrowed (no allocation)", result1),
        Cow::Owned(_) => println!("'{}' was owned (allocated)", result1),
    }

    match &result2 {
        Cow::Borrowed(_) => println!("'{}' was borrowed (no allocation)", result2),
        Cow::Owned(_) => println!("'{}' was owned (allocated)", result2),
    }
}
```

### Cow with to_mut

```rust
use std::borrow::Cow;

fn ensure_uppercase(input: Cow<str>) -> Cow<str> {
    if input.chars().any(|c| c.is_lowercase()) {
        // to_mut() clones if borrowed, then returns mutable reference
        let mut owned = input.into_owned();
        owned.make_ascii_uppercase();
        Cow::Owned(owned)
    } else {
        input
    }
}

fn main() {
    let already_upper: Cow<str> = Cow::Borrowed("HELLO");
    let needs_upper: Cow<str> = Cow::Borrowed("Hello");

    println!("{}", ensure_uppercase(already_upper)); // No allocation
    println!("{}", ensure_uppercase(needs_upper));   // Allocates
}
```

### Cow in Function Parameters

```rust
use std::borrow::Cow;

fn process_name(name: Cow<str>) {
    println!("Processing: {}", name);
}

fn main() {
    // Can accept both borrowed and owned strings
    process_name(Cow::Borrowed("Alice"));
    process_name(Cow::Owned(String::from("Bob")));

    // Using Into trait
    let borrowed: Cow<str> = "Charlie".into();
    let owned: Cow<str> = String::from("Diana").into();

    process_name(borrowed);
    process_name(owned);
}
```

### Cow for Configuration with Defaults

```rust
use std::borrow::Cow;

struct Config<'a> {
    name: Cow<'a, str>,
    path: Cow<'a, str>,
}

impl<'a> Config<'a> {
    fn new() -> Self {
        Config {
            name: Cow::Borrowed("default"),
            path: Cow::Borrowed("/tmp"),
        }
    }

    fn with_name(mut self, name: impl Into<Cow<'a, str>>) -> Self {
        self.name = name.into();
        self
    }

    fn with_path(mut self, path: impl Into<Cow<'a, str>>) -> Self {
        self.path = path.into();
        self
    }
}

fn main() {
    // Uses borrowed defaults - no allocation
    let default_config = Config::new();
    println!("Default: {} at {}", default_config.name, default_config.path);

    // Custom values
    let custom_config = Config::new()
        .with_name("my_app")
        .with_path(String::from("/home/user/data"));
    println!("Custom: {} at {}", custom_config.name, custom_config.path);
}
```

### Cow for Slice Operations

```rust
use std::borrow::Cow;

fn normalize_path(path: &[u8]) -> Cow<[u8]> {
    if path.iter().any(|&b| b == b'\\') {
        // Convert backslashes to forward slashes
        Cow::Owned(
            path.iter()
                .map(|&b| if b == b'\\' { b'/' } else { b })
                .collect()
        )
    } else {
        Cow::Borrowed(path)
    }
}

fn main() {
    let unix_path = b"/home/user/file.txt";
    let windows_path = b"C:\\Users\\file.txt";

    let normalized1 = normalize_path(unix_path);
    let normalized2 = normalize_path(windows_path);

    println!("Unix path allocated: {}", matches!(normalized1, Cow::Owned(_)));     // false
    println!("Windows path allocated: {}", matches!(normalized2, Cow::Owned(_))); // true
}
```

## The Deref Trait

The `Deref` trait allows you to customize the behavior of the dereference operator `*`. Smart pointers implement `Deref` to behave like regular references.

### Basic Implementation

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let x = 5;
    let y = MyBox::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y); // Calls deref() under the hood
}
```

### Deref Coercion

Deref coercion automatically converts references of one type to references of another type through `Deref` implementations:

```rust
fn hello(name: &str) {
    println!("Hello, {}!", name);
}

fn main() {
    let boxed_string = Box::new(String::from("Rust"));

    // Deref coercion: &Box<String> -> &String -> &str
    hello(&boxed_string);

    // Without deref coercion, we'd need:
    // hello(&(*boxed_string)[..]);
}
```

### DerefMut for Mutable Dereferencing

```rust
use std::ops::{Deref, DerefMut};

struct Wrapper<T> {
    value: T,
}

impl<T> Wrapper<T> {
    fn new(value: T) -> Self {
        Wrapper { value }
    }
}

impl<T> Deref for Wrapper<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.value
    }
}

impl<T> DerefMut for Wrapper<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.value
    }
}

fn main() {
    let mut wrapper = Wrapper::new(String::from("Hello"));

    // Immutable deref
    println!("Length: {}", wrapper.len());

    // Mutable deref
    wrapper.push_str(", World!");
    println!("{}", *wrapper);
}
```

## The Drop Trait

The `Drop` trait allows you to customize what happens when a value goes out of scope. It's used for resource cleanup.

### Basic Implementation

```rust
struct CustomSmartPointer {
    data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer {
        data: String::from("my stuff"),
    };
    let d = CustomSmartPointer {
        data: String::from("other stuff"),
    };
    println!("CustomSmartPointers created.");

    // Variables are dropped in reverse order of creation
    // Output:
    // CustomSmartPointers created.
    // Dropping CustomSmartPointer with data `other stuff`!
    // Dropping CustomSmartPointer with data `my stuff`!
}
```

### Manual Drop with std::mem::drop

```rust
struct Resource {
    name: String,
}

impl Drop for Resource {
    fn drop(&mut self) {
        println!("Releasing resource: {}", self.name);
    }
}

fn main() {
    let resource = Resource {
        name: String::from("database connection"),
    };
    println!("Resource acquired.");

    // Can't call resource.drop() directly - Rust prevents this
    // resource.drop(); // This won't compile

    // Use std::mem::drop instead
    drop(resource);
    println!("Resource released early.");

    // resource is no longer valid here
}
```

### RAII Pattern for Resource Management

```rust
use std::fs::File;
use std::io::{self, Write};

struct TempFile {
    path: String,
    file: File,
}

impl TempFile {
    fn new(path: &str) -> io::Result<Self> {
        let file = File::create(path)?;
        Ok(TempFile {
            path: path.to_string(),
            file,
        })
    }

    fn write(&mut self, data: &[u8]) -> io::Result<()> {
        self.file.write_all(data)
    }
}

impl Drop for TempFile {
    fn drop(&mut self) {
        // Cleanup: delete the temp file
        if let Err(e) = std::fs::remove_file(&self.path) {
            eprintln!("Failed to delete temp file: {}", e);
        } else {
            println!("Temp file {} cleaned up", self.path);
        }
    }
}

fn main() -> io::Result<()> {
    {
        let mut temp = TempFile::new("/tmp/example.txt")?;
        temp.write(b"Hello, World!")?;
        // File is automatically deleted when temp goes out of scope
    }

    println!("After scope - temp file should be deleted");
    Ok(())
}
```

## Practical Examples

### Building a Simple Cache

```rust
use std::cell::RefCell;
use std::collections::HashMap;

struct Cache {
    data: RefCell<HashMap<String, String>>,
}

impl Cache {
    fn new() -> Self {
        Cache {
            data: RefCell::new(HashMap::new()),
        }
    }

    fn get_or_compute(&self, key: &str, compute: impl FnOnce() -> String) -> String {
        // Check if value exists
        if let Some(value) = self.data.borrow().get(key) {
            return value.clone();
        }

        // Compute and store
        let value = compute();
        self.data.borrow_mut().insert(key.to_string(), value.clone());
        value
    }
}

fn main() {
    let cache = Cache::new();

    let value1 = cache.get_or_compute("key1", || {
        println!("Computing value1...");
        "computed_value_1".to_string()
    });

    let value1_cached = cache.get_or_compute("key1", || {
        println!("This won't print");
        "should_not_see_this".to_string()
    });

    println!("First call: {}", value1);
    println!("Cached call: {}", value1_cached);
}
```

### Thread-Safe Counter

```rust
use std::sync::{Arc, Mutex};
use std::thread;

struct ThreadSafeCounter {
    count: Arc<Mutex<i64>>,
}

impl ThreadSafeCounter {
    fn new() -> Self {
        ThreadSafeCounter {
            count: Arc::new(Mutex::new(0)),
        }
    }

    fn clone_counter(&self) -> Self {
        ThreadSafeCounter {
            count: Arc::clone(&self.count),
        }
    }

    fn increment(&self) {
        let mut count = self.count.lock().unwrap();
        *count += 1;
    }

    fn get(&self) -> i64 {
        *self.count.lock().unwrap()
    }
}

fn main() {
    let counter = ThreadSafeCounter::new();
    let mut handles = vec![];

    for _ in 0..10 {
        let counter_clone = counter.clone_counter();
        handles.push(thread::spawn(move || {
            for _ in 0..100 {
                counter_clone.increment();
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", counter.get()); // 1000
}
```

### Graph Data Structure

```rust
use std::cell::RefCell;
use std::rc::{Rc, Weak};

type NodeRef = Rc<RefCell<GraphNode>>;
type WeakNodeRef = Weak<RefCell<GraphNode>>;

struct GraphNode {
    value: i32,
    neighbors: Vec<WeakNodeRef>,
}

impl GraphNode {
    fn new(value: i32) -> NodeRef {
        Rc::new(RefCell::new(GraphNode {
            value,
            neighbors: Vec::new(),
        }))
    }

    fn add_neighbor(node: &NodeRef, neighbor: &NodeRef) {
        node.borrow_mut().neighbors.push(Rc::downgrade(neighbor));
    }

    fn print_neighbors(&self) {
        print!("Node {} neighbors: ", self.value);
        for weak_neighbor in &self.neighbors {
            if let Some(neighbor) = weak_neighbor.upgrade() {
                print!("{} ", neighbor.borrow().value);
            }
        }
        println!();
    }
}

fn main() {
    let node1 = GraphNode::new(1);
    let node2 = GraphNode::new(2);
    let node3 = GraphNode::new(3);

    // Create connections (bidirectional)
    GraphNode::add_neighbor(&node1, &node2);
    GraphNode::add_neighbor(&node1, &node3);
    GraphNode::add_neighbor(&node2, &node1);
    GraphNode::add_neighbor(&node2, &node3);
    GraphNode::add_neighbor(&node3, &node1);
    GraphNode::add_neighbor(&node3, &node2);

    node1.borrow().print_neighbors();
    node2.borrow().print_neighbors();
    node3.borrow().print_neighbors();
}
```

### Observable Pattern with RefCell

```rust
use std::cell::RefCell;
use std::rc::Rc;

type Callback<T> = Box<dyn Fn(&T)>;

struct Observable<T> {
    value: RefCell<T>,
    observers: RefCell<Vec<Callback<T>>>,
}

impl<T> Observable<T> {
    fn new(value: T) -> Rc<Self> {
        Rc::new(Observable {
            value: RefCell::new(value),
            observers: RefCell::new(Vec::new()),
        })
    }

    fn get(&self) -> std::cell::Ref<T> {
        self.value.borrow()
    }

    fn set(&self, value: T) {
        *self.value.borrow_mut() = value;
        self.notify();
    }

    fn subscribe(&self, callback: impl Fn(&T) + 'static) {
        self.observers.borrow_mut().push(Box::new(callback));
    }

    fn notify(&self) {
        let value = self.value.borrow();
        for observer in self.observers.borrow().iter() {
            observer(&*value);
        }
    }
}

fn main() {
    let counter = Observable::new(0);

    counter.subscribe(|value| println!("Observer 1: value is now {}", value));
    counter.subscribe(|value| println!("Observer 2: doubled value is {}", value * 2));

    counter.set(5);
    counter.set(10);
}
```

## Choosing the Right Smart Pointer

| Pointer | Ownership | Thread Safety | Use Case |
|---------|-----------|---------------|----------|
| `Box<T>` | Single | No | Heap allocation, recursive types, trait objects |
| `Rc<T>` | Multiple | No | Shared ownership in single-threaded code |
| `Arc<T>` | Multiple | Yes | Shared ownership across threads |
| `Cell<T>` | Single | No | Interior mutability for `Copy` types |
| `RefCell<T>` | Single | No | Interior mutability with runtime borrow checking |
| `Cow<T>` | Borrowed or Owned | Depends | Clone-on-write optimization |
| `Weak<T>` | None (non-owning) | Same as Rc/Arc | Breaking reference cycles |

## Performance Considerations

1. **Box**: Minimal overhead - just heap allocation and pointer indirection.
2. **Rc/Arc**: Reference counting overhead on clone/drop. Arc uses atomic operations which are more expensive than Rc.
3. **Cell**: No overhead for simple get/set operations on Copy types.
4. **RefCell**: Small overhead for runtime borrow checking (a single integer counter).
5. **Cow**: Zero-cost when borrowed, allocation cost only when cloning is necessary.

### Benchmarking Example

```rust
use std::cell::{Cell, RefCell};
use std::time::Instant;

fn main() {
    const ITERATIONS: u64 = 10_000_000;

    // Cell performance
    let cell = Cell::new(0u64);
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        cell.set(cell.get() + 1);
    }
    println!("Cell: {:?}", start.elapsed());

    // RefCell performance
    let refcell = RefCell::new(0u64);
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        *refcell.borrow_mut() += 1;
    }
    println!("RefCell: {:?}", start.elapsed());

    // Direct mutation (baseline)
    let mut direct = 0u64;
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        direct += 1;
    }
    println!("Direct: {:?}", start.elapsed());
}
```

## Common Pitfalls and How to Avoid Them

### Reference Cycles with Rc

```rust
use std::cell::RefCell;
use std::rc::Rc;

struct Node {
    next: RefCell<Option<Rc<Node>>>,
}

fn create_cycle() {
    let a = Rc::new(Node { next: RefCell::new(None) });
    let b = Rc::new(Node { next: RefCell::new(Some(Rc::clone(&a))) });

    // Creating a cycle - memory leak!
    *a.next.borrow_mut() = Some(Rc::clone(&b));

    // When this function ends, a and b go out of scope
    // but their reference counts never reach 0
}

// Solution: Use Weak<T> for back-references
use std::rc::Weak;

struct SafeNode {
    next: RefCell<Option<Rc<SafeNode>>>,
    prev: RefCell<Weak<SafeNode>>,  // Weak reference for back-pointer
}
```

### RefCell Runtime Panics

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);

    // This will panic at runtime
    let borrow1 = data.borrow();
    // let borrow_mut = data.borrow_mut(); // PANIC!

    // Safe alternative: use try_borrow
    match data.try_borrow_mut() {
        Ok(mut val) => *val = 10,
        Err(_) => println!("Cannot borrow mutably right now"),
    }

    drop(borrow1);  // Now we can borrow mutably
    *data.borrow_mut() = 10;
}
```

### Arc Without Interior Mutability

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(5);

    // This is fine - read only
    let handles: Vec<_> = (0..3)
        .map(|i| {
            let data = Arc::clone(&data);
            thread::spawn(move || println!("Thread {}: {}", i, data))
        })
        .collect();

    for handle in handles {
        handle.join().unwrap();
    }

    // For mutation, you MUST use Arc<Mutex<T>> or Arc<RwLock<T>>
    // Arc alone only provides shared read access
}
```

### Deadlocks with Mutex

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let lock_a = Arc::new(Mutex::new(1));
    let lock_b = Arc::new(Mutex::new(2));

    // Potential deadlock if two threads lock in different orders
    // Thread 1: locks A, then tries to lock B
    // Thread 2: locks B, then tries to lock A

    // Solution: Always lock in the same order, or use try_lock
    let lock_a_clone = Arc::clone(&lock_a);
    let lock_b_clone = Arc::clone(&lock_b);

    let handle = thread::spawn(move || {
        // Try to acquire both locks
        if let Ok(a) = lock_a_clone.try_lock() {
            if let Ok(b) = lock_b_clone.try_lock() {
                println!("Got both locks: {} {}", *a, *b);
            }
        }
    });

    handle.join().unwrap();
}
```

## Summary

Smart pointers in Rust provide powerful abstractions for memory management and ownership patterns:

- **Box\<T\>**: Simple heap allocation and indirection for recursive types and trait objects.
- **Rc\<T\>**: Shared ownership with reference counting for single-threaded scenarios.
- **Arc\<T\>**: Thread-safe shared ownership using atomic reference counting.
- **Weak\<T\>**: Non-owning references to break cycles and implement caches.
- **Cell\<T\>**: Zero-cost interior mutability for `Copy` types.
- **RefCell\<T\>**: Interior mutability with runtime borrow checking for any type.
- **Cow\<T\>**: Clone-on-write optimization for efficient data processing.

Understanding when and how to use each smart pointer is crucial for writing idiomatic, safe, and efficient Rust code. The key principles are:

1. Prefer compile-time guarantees over runtime checks when possible.
2. Use the simplest smart pointer that meets your requirements.
3. Be aware of the performance implications of each choice.
4. Use weak references to prevent memory leaks from reference cycles.
5. Combine smart pointers appropriately for complex ownership patterns.

By mastering these tools, you can model complex ownership patterns while maintaining Rust's strong safety guarantees.
