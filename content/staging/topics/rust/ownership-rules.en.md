---
title: Rust Ownership Rules
description: "Comprehensive guide to Rust's ownership system: rules, borrowing, lifetimes, and practical patterns for memory-safe concurrent programming"
track: rust
section: ownership-borrowing
difficulty: intermediate
tags:
  - ownership
  - borrowing
  - lifetimes
  - memory safety
  - move semantics
status: imported
origin: old/src/content/docs/rust/ownership-rules.en.md
divergence: 0.074
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Rust
  subcategory: ""
  order: 5
  lastUpdated: 2026-01-07
---

Rust's ownership system is its most distinguishing feature, enabling memory safety without garbage collection. Understanding ownership, borrowing, and lifetimes is fundamental to writing effective Rust code. We'll take a deep dive into these concepts, from foundational principles to advanced patterns.

## Concept Explanation

Rust's ownership model is a revolutionary approach to memory management that guarantees memory safety at compile-time without the performance overhead of garbage collection. Rather than relying on a garbage collector or requiring manual memory management, Rust enforces ownership rules that prevent entire categories of bugs.

### The Core Problem

Traditional programming languages handle memory in two ways:

1. **Manual Management (C/C++)**: Developers must explicitly allocate and deallocate memory, leading to bugs like use-after-free and memory leaks.
2. **Garbage Collection (Java, Python, Go)**: Automatic cleanup comes with runtime overhead and less predictable performance.

Rust solves this through compile-time verification of ownership rules, providing the safety of garbage collection with the performance of manual management.

### What is Ownership?

Ownership is a set of rules that govern how Rust manages memory. At any given time:
- Each value has exactly one owner
- When the owner goes out of scope, the value is dropped and its memory is freed
- Ownership can be transferred (moved) or loaned (borrowed)

### Why Ownership Matters

The ownership system prevents:
- **Use-after-free bugs**: Using memory after it's been freed
- **Double-free bugs**: Freeing the same memory twice
- **Memory leaks**: Forgetting to free allocated memory
- **Data races**: Concurrent modification of shared data
- **Null pointer dereferences**: Through Rust's `Option<T>` type

## Core Principles

### The Three Ownership Rules

**Rule 1: Each value in Rust has one owner**

```rust
fn main() {
    // String is owned by s1
    let s1 = String::from("hello");

    // When we assign s1 to s2, ownership is transferred
    let s2 = s1;  // s1 is no longer valid

    // println!("{}", s1);  // ERROR: value borrowed after move
    println!("{}", s2);     // OK: s2 is the owner
}
```

When a value is assigned to another variable, the ownership is transferred. The original variable is no longer valid and cannot be used. This is called a "move".

**Rule 2: When the owner goes out of scope, the value is dropped**

```rust
fn main() {
    {
        let s = String::from("hello");  // s comes into scope
        println!("{}", s);              // OK
    }   // s goes out of scope here, memory is freed automatically

    // println!("{}", s);  // ERROR: s is no longer in scope
}
```

When a variable goes out of scope, Rust automatically calls the `drop` function to free resources. This is the destructor pattern.

**Rule 3: You can borrow a value without taking ownership**

```rust
fn main() {
    let s1 = String::from("hello");

    // We borrow s1 (don't take ownership)
    let len = calculate_length(&s1);

    // s1 is still valid because we only borrowed it
    println!("The length of '{}' is {}", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}  // s goes out of scope, but it doesn't own the String, so nothing happens
```

Borrowing allows multiple parts of code to use data without taking ownership through references.

### Move vs. Copy Semantics

Rust distinguishes between types with "move" semantics and those with "copy" semantics:

```rust
fn main() {
    // Copy types (stack-allocated): ownership is implicitly copied
    let x = 5;
    let y = x;  // x is copied, both x and y are valid
    println!("{}, {}", x, y);  // OK

    // Move types (heap-allocated): ownership is transferred
    let s1 = String::from("hello");
    let s2 = s1;  // ownership moved, s1 is no longer valid
    // println!("{}", s1);  // ERROR
    println!("{}", s2);     // OK
}
```

**Copy Types**: Integers, floats, booleans, chars, tuples of Copy types (no heap allocation)
**Move Types**: String, Vec, Box, custom structs with heap-allocated fields

### Borrowing: Immutable and Mutable References

References allow you to borrow data without taking ownership:

```rust
fn main() {
    let s = String::from("hello");

    // Immutable reference: can read but not modify
    let r1 = &s;
    let r2 = &s;
    println!("{}, {}", r1, r2);  // OK: multiple immutable borrows

    // Mutable reference: can read and modify
    let mut s = String::from("hello");
    let r = &mut s;
    r.push_str(" world");
    println!("{}", r);  // OK
}
```

**Key Rules for References**:
- Any number of immutable references can exist simultaneously
- Only one mutable reference can exist at a time
- You cannot mix immutable and mutable references to the same data
- References cannot outlive the data they reference (enforced by lifetimes)

## Key Points

### Move Semantics Explained

Moving is the default behavior for types that don't implement `Copy`:

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;  // Move: s1's value moved to s2

    // Returning a value also moves ownership
    let s3 = takes_and_returns_string(s2);

    // After function call, s3 owns the string
    println!("{}", s3);
}

fn takes_and_returns_string(s: String) -> String {
    // Takes ownership of s, does something with it, returns it
    let result = format!("{} world", s);
    result  // Ownership transferred to caller
}
```

**Why Move Semantics?**
- Simple and predictable: no reference counting or garbage collection
- Clear memory responsibility: each function must return values it owns
- Zero-cost: no runtime overhead

### Ownership Transfer Patterns

**Pattern 1: Returning Ownership**
```rust
fn create_string() -> String {
    String::from("hello")  // Ownership transferred to caller
}

fn main() {
    let s = create_string();  // s takes ownership
    println!("{}", s);
}
```

**Pattern 2: Taking and Returning Ownership**
```rust
fn append_world(mut s: String) -> String {
    s.push_str(" world");
    s  // Return modified string
}

fn main() {
    let s1 = String::from("hello");
    let s2 = append_world(s1);  // s1 moved into function, s2 gets result
    println!("{}", s2);
}
```

**Pattern 3: Taking Ownership and Not Returning (Consumer)**
```rust
fn consume_string(s: String) {
    println!("Consuming: {}", s);
    // s dropped here, memory freed
}

fn main() {
    let s = String::from("hello");
    consume_string(s);
    // println!("{}", s);  // ERROR: s moved into function
}
```

### The Borrow Checker

Rust's borrow checker enforces ownership and borrowing rules at compile-time:

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;     // Immutable borrow
    let r2 = &s;     // Another immutable borrow (OK)
    println!("{}, {}", r1, r2);

    let r3 = &mut s; // Mutable borrow (ERROR: can't borrow as mutable while immutable refs exist)
}
```

The borrow checker tracks:
- Where each reference is created
- Where each reference is last used (scope ending)
- Whether references are mutable or immutable
- Ensures no overlapping mutable borrows

### Ownership with Collections

```rust
fn main() {
    // Ownership with Vec
    let mut v = vec![1, 2, 3];

    // Move into closure
    let take_ownership = || {
        println!("{:?}", v);
        v.push(4);
    };
    take_ownership();
    // println!("{:?}", v);  // ERROR: v moved into closure

    // Mutable borrow
    let mut v = vec![1, 2, 3];
    let borrow_mutable = || {
        v.push(5);
    };
    borrow_mutable();
    println!("{:?}", v);  // OK: borrow ended

    // Immutable borrow
    let v = vec![1, 2, 3];
    let borrow_immutable = || {
        println!("{:?}", v);
    };
    borrow_immutable();
    println!("{:?}", v);  // OK: multiple immutable borrows
}
```

## Code Examples

### Foundational Examples

**Example 1: Basic Ownership and Moves**

```rust
#[derive(Debug)]
struct User {
    name: String,
    email: String,
    age: u32,
}

fn main() {
    // Create a User
    let user1 = User {
        name: String::from("Alice"),
        email: String::from("alice@example.com"),
        age: 30,
    };

    // Move ownership to user2
    let user2 = user1;  // user1 moved to user2

    // This works because User contains owned data
    println!("{:?}", user2);

    // ERROR: user1 no longer owns the value
    // println!("{:?}", user1);
}
```

**Example 2: References and Borrowing**

```rust
struct Book {
    title: String,
    author: String,
    pages: u32,
}

fn print_book(book: &Book) {  // Immutable borrow
    println!("Title: {}", book.title);
    println!("Author: {}", book.author);
    println!("Pages: {}", book.pages);
}

fn add_page(book: &mut Book) {  // Mutable borrow
    book.pages += 1;
}

fn main() {
    let mut book = Book {
        title: String::from("Rust by Example"),
        author: String::from("Rust Community"),
        pages: 400,
    };

    // Immutable borrow
    print_book(&book);

    // Mutable borrow
    add_page(&mut book);

    // book is still valid
    println!("Updated pages: {}", book.pages);
}
```

**Example 3: Ownership in Collections**

```rust
fn main() {
    let mut names = vec![
        String::from("Alice"),
        String::from("Bob"),
        String::from("Charlie"),
    ];

    // Iterate with reference (don't take ownership)
    for name in &names {
        println!("Name: {}", name);
    }

    // names still valid
    println!("Total names: {}", names.len());

    // Take ownership while iterating
    for name in names {
        println!("Consuming: {}", name);
    }

    // ERROR: names moved in iteration
    // println!("{}", names.len());
}
```

### Advanced Ownership Patterns

**Example 4: Ownership with Result**

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}

fn parse_number(s: &str) -> Result<i32, String> {
    match s.parse::<i32>() {
        Ok(num) => Ok(num),
        Err(_) => Err(String::from("Failed to parse number")),
    }
}

fn main() {
    let input = "42";

    match parse_number(input) {
        Ok(num) => {
            println!("Parsed: {}", num);
            // num owned here
        },
        Err(e) => {
            println!("Error: {}", e);
            // e owned here
        }
    }
}
```

**Example 5: Ownership with Closures**

```rust
fn main() {
    let s = String::from("hello");

    // Closure that borrows immutably
    let borrow = || println!("{}", s);
    borrow();
    borrow();
    println!("{}", s);  // s still valid

    // Closure that borrows mutably
    let mut s = String::from("hello");
    let mut borrow_mut = || {
        s.push_str(" world");
    };
    borrow_mut();
    println!("{}", s);

    // Closure that takes ownership
    let s = String::from("hello");
    let consume = move || println!("{}", s);
    consume();
    // println!("{}", s);  // ERROR: s moved into closure
}
```

**Example 6: Ownership and Trait Objects**

```rust
trait Drawable {
    fn draw(&self);
}

struct Circle {
    radius: f32,
}

impl Drawable for Circle {
    fn draw(&self) {
        println!("Drawing circle with radius: {}", self.radius);
    }
}

struct Rectangle {
    width: f32,
    height: f32,
}

impl Drawable for Rectangle {
    fn draw(&self) {
        println!("Drawing rectangle: {} x {}", self.width, self.height);
    }
}

fn main() {
    let mut shapes: Vec<Box<dyn Drawable>> = vec![
        Box::new(Circle { radius: 5.0 }),
        Box::new(Rectangle { width: 10.0, height: 20.0 }),
    ];

    for shape in shapes.iter() {
        shape.draw();
    }
}
```

**Example 7: Smart Pointers and Ownership**

```rust
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    // Box: exclusive ownership on heap
    let b = Box::new(vec![1, 2, 3]);
    println!("Box: {:?}", b);

    // Rc: shared ownership (single-threaded)
    let rc1 = Rc::new(vec![1, 2, 3]);
    let rc2 = Rc::clone(&rc1);
    println!("rc1 strong count: {}", Rc::strong_count(&rc1));
    println!("rc2 strong count: {}", Rc::strong_count(&rc2));

    // RefCell: interior mutability
    let value = Rc::new(RefCell::new(5));
    *value.borrow_mut() = 10;
    println!("Mutated through RefCell: {}", value.borrow());
}
```

### Common Ownership Mistakes and Solutions

**Mistake 1: Forgetting to Borrow**

```rust
// WRONG
fn process_string(s: String) {
    println!("{}", s);
}

fn main() {
    let s = String::from("hello");
    process_string(s);
    // println!("{}", s);  // ERROR: s moved
}

// CORRECT
fn process_string(s: &String) {  // or &str
    println!("{}", s);
}

fn main() {
    let s = String::from("hello");
    process_string(&s);
    println!("{}", s);  // OK
}
```

**Mistake 2: Unnecessary Cloning**

```rust
// INEFFICIENT
fn main() {
    let s = String::from("hello");
    let s2 = s.clone();  // Unnecessary clone
    println!("{} {}", s, s2);
}

// BETTER
fn main() {
    let s = String::from("hello");
    println!("{} {}", s, s);  // No clone needed
}

// BEST
fn main() {
    let s = String::from("hello");
    let s_ref = &s;
    process(&s, s_ref);
}

fn process(s1: &String, s2: &String) {
    println!("{} {}", s1, s2);
}
```

**Mistake 3: Mutable Borrow After Immutable**

```rust
// WRONG
fn main() {
    let mut s = String::from("hello");
    let r1 = &s;
    let r2 = &s;

    let r3 = &mut s;  // ERROR: can't borrow as mutable

    println!("{}", r1);
}

// CORRECT
fn main() {
    let mut s = String::from("hello");
    let r1 = &s;
    let r2 = &s;
    println!("{}", r1);  // Last use of r1 and r2

    let r3 = &mut s;  // OK: r1 and r2 no longer used
    r3.push_str(" world");
    println!("{}", r3);
}
```

## Best Practices

### Ownership Design Principles

**Principle 1: Prefer Borrowing Over Ownership Transfer**

```rust
// AVOID: Takes ownership unnecessarily
fn print_vector(v: Vec<i32>) {
    for item in v.iter() {
        println!("{}", item);
    }
}

// BETTER: Borrows instead
fn print_vector(v: &[i32]) {
    for item in v.iter() {
        println!("{}", item);
    }
}

// BEST: More flexible with slices
fn print_vector(v: &[i32]) {
    println!("{:?}", v);
}
```

**Principle 2: Return Ownership When Modified**

```rust
// Clear ownership transfer
fn add_to_vector(mut v: Vec<i32>, item: i32) -> Vec<i32> {
    v.push(item);
    v
}

fn main() {
    let mut v = vec![1, 2, 3];
    v = add_to_vector(v, 4);
    println!("{:?}", v);
}
```

**Principle 3: Use References for Large Types**

```rust
struct LargeData {
    data: Vec<u8>,  // Could be large
}

// INEFFICIENT: Copies large data
fn process_data_copy(data: LargeData) -> LargeData {
    data
}

// EFFICIENT: Borrows data
fn process_data_borrow(data: &LargeData) {
    println!("Processing {} bytes", data.data.len());
}

// EFFICIENT: Mutable borrow
fn modify_data(data: &mut LargeData) {
    data.data.push(0);
}
```

### Smart Ownership Patterns

**Pattern 1: RAII (Resource Acquisition Is Initialization)**

```rust
struct File {
    handle: i32,
}

impl File {
    fn new(path: &str) -> Self {
        println!("Opening file: {}", path);
        File { handle: 1 }
    }
}

impl Drop for File {
    fn drop(&mut self) {
        println!("Closing file: {}", self.handle);
    }
}

fn main() {
    {
        let file = File::new("test.txt");
        println!("Using file");
    }  // File automatically closed here
    println!("File closed");
}
```

**Pattern 2: Builder Pattern with Ownership**

```rust
struct Request {
    method: String,
    url: String,
    headers: Vec<(String, String)>,
}

struct RequestBuilder {
    method: String,
    url: String,
    headers: Vec<(String, String)>,
}

impl RequestBuilder {
    fn new(url: &str) -> Self {
        RequestBuilder {
            method: String::from("GET"),
            url: String::from(url),
            headers: Vec::new(),
        }
    }

    fn method(mut self, method: &str) -> Self {
        self.method = String::from(method);
        self
    }

    fn header(mut self, key: &str, value: &str) -> Self {
        self.headers.push((String::from(key), String::from(value)));
        self
    }

    fn build(self) -> Request {
        Request {
            method: self.method,
            url: self.url,
            headers: self.headers,
        }
    }
}

fn main() {
    let request = RequestBuilder::new("https://example.com")
        .method("POST")
        .header("Content-Type", "application/json")
        .build();

    println!("Method: {}", request.method);
}
```

**Pattern 3: Conversion Traits for Zero-Cost Abstractions**

```rust
// Use From/Into for automatic conversions
impl From<&str> for String {
    fn from(s: &str) -> Self {
        String::from(s)
    }
}

impl From<String> for Box<str> {
    fn from(s: String) -> Self {
        s.into_boxed_str()
    }
}

fn takes_string<S: Into<String>>(s: S) {
    let s = s.into();
    println!("{}", s);
}

fn main() {
    takes_string("hello");
    takes_string(String::from("world"));
}
```

### Avoiding Common Ownership Pitfalls

**Pitfall 1: Excessive Cloning**

```rust
// SLOW: Clones unnecessarily
fn process_names(names: Vec<String>) -> usize {
    let mut count = 0;
    for name in names.clone() {
        if name.starts_with("A") {
            count += 1;
        }
    }
    count
}

// BETTER: Use references
fn process_names(names: &[String]) -> usize {
    let mut count = 0;
    for name in names {
        if name.starts_with("A") {
            count += 1;
        }
    }
    count
}
```

**Pitfall 2: Over-Borrowing References**

```rust
// UNCLEAR: Too many borrows
fn process(a: &Vec<i32>, b: &Vec<i32>) -> i32 {
    let a_ref = &a;
    let b_ref = &b;
    a_ref.len() as i32 + b_ref.len() as i32
}

// CLEANER: Use slice references
fn process(a: &[i32], b: &[i32]) -> i32 {
    a.len() as i32 + b.len() as i32
}
```

**Pitfall 3: Unnecessary Move Semantics**

```rust
// WRONG: Owns string unnecessarily
fn should_own(s: String) -> bool {
    s.starts_with("hello")
}

fn main() {
    let s = String::from("hello world");
    let result = should_own(s);
    // println!("{}", s);  // ERROR: moved
}

// CORRECT: Borrow instead
fn should_borrow(s: &str) -> bool {
    s.starts_with("hello")
}

fn main() {
    let s = String::from("hello world");
    let result = should_borrow(&s);
    println!("{}", s);  // OK
}
```

## Common Pitfalls

### Use-After-Move

```rust
// WRONG
fn main() {
    let s = String::from("hello");
    let s2 = s;
    println!("{}", s);  // ERROR: s moved to s2
}

// SOLUTION: Use reference
fn main() {
    let s = String::from("hello");
    let s2 = &s;
    println!("{}", s);  // OK
}

// SOLUTION: Clone if necessary
fn main() {
    let s = String::from("hello");
    let s2 = s.clone();
    println!("{}", s);  // OK
}
```

### Overlapping Mutable Borrows

```rust
// WRONG: Mutable borrows overlap
fn main() {
    let mut s = String::from("hello");
    let r1 = &mut s;
    let r2 = &mut s;  // ERROR: can't borrow twice as mutable
    r1.push_str(" world");
    r2.push_str("!");
}

// SOLUTION: Don't overlap mutable borrows
fn main() {
    let mut s = String::from("hello");
    let r1 = &mut s;
    r1.push_str(" world");
    // r1 done here

    let r2 = &mut s;
    r2.push_str("!");
    println!("{}", r2);
}
```

### Dangling References

```rust
// WRONG: Reference outlives data
fn bad_reference() -> &'static String {
    let s = String::from("hello");
    &s  // ERROR: s dropped, reference invalid
}

// SOLUTION: Return owned data
fn good_reference() -> String {
    let s = String::from("hello");
    s  // Transfer ownership
}

fn main() {
    let s = good_reference();
    println!("{}", s);
}
```

### Lifetime Confusion

```rust
// WRONG: Unclear lifetime
fn longest(x: &str, y: &str) -> &str {  // ERROR: missing lifetime
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

// SOLUTION: Explicit lifetime
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let s1 = String::from("hello");
    let s2 = String::from("world");
    println!("{}", longest(&s1, &s2));
}
```

### Iterator Consumption

```rust
// WRONG: Using iterator after consumption
fn main() {
    let v = vec![1, 2, 3];
    let mut iter = v.into_iter();
    let first = iter.next();

    for item in iter {  // iter partially consumed
        println!("{}", item);
    }

    let second = iter.next();  // ERROR: trying to use after for loop
}

// SOLUTION: Plan iteration order
fn main() {
    let v = vec![1, 2, 3];
    let mut iter = v.iter();

    if let Some(first) = iter.next() {
        println!("First: {}", first);
    }

    for item in iter {
        println!("{}", item);
    }
}
```

## Performance Considerations

### Move Semantics Performance

**Stack vs. Heap Allocation**

```rust
// Stack-allocated: Copy type, fast
fn stack_type() {
    let x = 42;  // Stack: 8 bytes
    let y = x;   // Copy, instant
}

// Heap-allocated: Move type, faster than copy
fn heap_type() {
    let s = String::from("hello");  // Heap allocation
    let s2 = s;  // Move: just pointer, no copy
}

// Dangerous: Large struct Copy
#[derive(Copy, Clone)]
struct LargeData {
    data: [u64; 1000],  // 8KB on stack!
}

fn main() {
    let d = LargeData { data: [0; 1000] };
    let d2 = d;  // Copies 8KB!
}
```

### Reference Performance

```rust
// Taking ownership is expensive for large types
fn takes_ownership(v: Vec<i32>) {
    println!("Length: {}", v.len());
}  // v dropped, deallocated

// Borrowing is cheap
fn borrows(v: &[i32]) {
    println!("Length: {}", v.len());
}  // No deallocation

fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // Cheap borrow
    borrows(&v);
    borrows(&v);

    // Expensive: move and drop
    takes_ownership(v);
}
```

### Clone Performance

```rust
fn main() {
    // String clone: O(n) where n is length
    let s1 = String::from("hello world");
    let s2 = s1.clone();  // Allocates new memory, copies data

    // Move: O(1)
    let s3 = s1;  // Just moves pointer

    // Avoid cloning in loops
    let names = vec![String::from("Alice"), String::from("Bob")];

    // SLOW: Clone each iteration
    for name in names.clone() {
        process_owned(name);
    }

    // FAST: Borrow instead
    for name in &names {
        process_borrowed(name);
    }
}

fn process_owned(s: String) {
    println!("{}", s);
}

fn process_borrowed(s: &str) {
    println!("{}", s);
}
```

### Smart Pointer Overhead

```rust
fn main() {
    // Direct ownership: no overhead
    let s = String::from("hello");  // Single pointer

    // Box: heap allocation + pointer
    let b = Box::new(String::from("hello"));  // Extra indirection

    // Rc: reference counting
    let rc = std::rc::Rc::new(String::from("hello"));
    let rc2 = rc.clone();  // Atomic increment (overhead)

    // Arc: atomic reference counting (for threading)
    let arc = std::sync::Arc::new(String::from("hello"));
    let arc2 = arc.clone();  // Atomic increment + mutex (more overhead)
}
```

## Real-world Scenarios

### Designing API Functions

**Scenario: Building a Configuration Manager**

```rust
struct Config {
    host: String,
    port: u16,
    timeout: u32,
}

impl Config {
    // Takes &mut self to modify config
    fn set_host(&mut self, host: String) {
        self.host = host;
    }

    // Takes &self for read-only access
    fn get_host(&self) -> &str {
        &self.host
    }

    // Takes self to consume and transform
    fn with_timeout(mut self, timeout: u32) -> Self {
        self.timeout = timeout;
        self
    }
}

fn main() {
    let mut config = Config {
        host: String::from("localhost"),
        port: 8080,
        timeout: 5000,
    };

    config.set_host(String::from("example.com"));
    println!("Host: {}", config.get_host());

    let config = config.with_timeout(10000);
    println!("Timeout: {}", config.timeout);
}
```

**Scenario: Processing Data Pipeline**

```rust
struct DataPipeline {
    data: Vec<i32>,
}

impl DataPipeline {
    fn new(data: Vec<i32>) -> Self {
        DataPipeline { data }
    }

    // Borrows data, returns reference
    fn filter(&self, predicate: fn(i32) -> bool) -> Vec<i32> {
        self.data.iter()
            .copied()
            .filter(predicate)
            .collect()
    }

    // Takes mutable reference
    fn sort(&mut self) {
        self.data.sort();
    }

    // Consumes self, returns new Pipeline with transformed data
    fn map<F>(self, f: F) -> DataPipeline
    where
        F: Fn(i32) -> i32,
    {
        let transformed = self.data.iter().map(|&x| f(x)).collect();
        DataPipeline { data: transformed }
    }
}

fn main() {
    let pipeline = DataPipeline::new(vec![3, 1, 4, 1, 5, 9]);

    let evens = pipeline.filter(|x| x % 2 == 0);
    println!("Evens: {:?}", evens);

    let pipeline = pipeline.map(|x| x * 2);
    println!("Doubled: {:?}", pipeline.data);
}
```

### Concurrency and Ownership

**Scenario: Thread-Safe Resource Sharing**

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));

    let mut handles = vec![];

    for i in 0..3 {
        // Clone Arc (reference count increases)
        let data_clone = Arc::clone(&data);

        let handle = thread::spawn(move || {
            // Each thread owns a clone of Arc
            let mut d = data_clone.lock().unwrap();
            d.push(i);
            println!("Thread {} added {}", i, i);
        });

        handles.push(handle);
    }

    // Wait for all threads
    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final data: {:?}", data.lock().unwrap());
}
```

### Error Handling with Ownership

**Scenario: Result-based Error Handling**

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_file_content(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)  // Ownership transferred
}

fn process_file(path: &str) -> Result<usize, Box<dyn std::error::Error>> {
    let contents = read_file_content(path)?;
    Ok(contents.len())
}

fn main() {
    match process_file("test.txt") {
        Ok(len) => println!("File length: {}", len),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

### Dependency Injection with Ownership

**Scenario: Service Composition**

```rust
trait Database {
    fn query(&self, sql: &str) -> String;
}

struct MockDatabase;

impl Database for MockDatabase {
    fn query(&self, sql: &str) -> String {
        format!("Result for: {}", sql)
    }
}

struct UserService {
    db: Box<dyn Database>,
}

impl UserService {
    fn new(db: Box<dyn Database>) -> Self {
        UserService { db }
    }

    fn get_user(&self, id: &str) -> String {
        self.db.query(&format!("SELECT * FROM users WHERE id = {}", id))
    }
}

fn main() {
    let db = Box::new(MockDatabase);
    let service = UserService::new(db);
    println!("{}", service.get_user("123"));
}
```

## Interview Points

### Common Interview Questions

**Q1: Explain Rust's ownership rules and why they exist.**

Rust has three core ownership rules:
1. Each value has exactly one owner
2. When the owner goes out of scope, the value is dropped
3. You can borrow values through references

These rules prevent memory bugs (use-after-free, double-free) at compile-time without garbage collection, enabling both safety and performance.

**Q2: What's the difference between move and copy semantics?**

Move semantics: The value is transferred to a new owner. Only works for non-Copy types (String, Vec). One owner at a time.

Copy semantics: The value is implicitly copied. Works for small stack-allocated types (integers, booleans). Multiple "owners" are copies.

**Q3: Explain borrowing and references.**

Borrowing allows temporary access to data without taking ownership through references:
- Immutable reference (&T): Read-only access, unlimited concurrent borrows
- Mutable reference (&mut T): Read-write access, only one mutable borrow at a time
- Cannot mix immutable and mutable borrows to the same data

**Q4: What's the borrow checker and how does it work?**

The borrow checker is Rust's compile-time mechanism that enforces ownership and borrowing rules. It:
- Tracks where each reference is created and last used
- Ensures no use-after-free (references can't outlive data)
- Prevents data races (mutable exclusion)
- Allows multiple immutable borrows but not concurrent mutable borrows

**Q5: How do lifetimes relate to ownership?**

Lifetimes are annotations that tell the compiler how long a reference is valid. They're implicit in many cases but must be explicit when:
- References are passed and returned between functions
- Structs contain references
- Ambiguous lifetimes exist

Example: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str`

**Q6: What's the difference between &String and &str?**

- &String: Reference to a String (owned String on heap)
- &str: String slice (borrowed view of string data)

Use &str in function parameters for flexibility: `fn process(s: &str)` accepts both &String and string literals.

**Q7: When should you use Box, Rc, Arc?**

- **Box<T>**: Single ownership on heap, zero-cost abstraction
- **Rc<T>**: Shared immutable ownership (single-threaded), reference counted
- **Arc<T>**: Shared immutable ownership (multi-threaded), atomic reference counted

**Q8: How do closures capture variables and ownership?**

Closures capture variables by:
- **Immutable borrow** (default): `Fn` traits, reads only
- **Mutable borrow**: `FnMut` traits, reads and modifies
- **Move**: `FnOnce` traits (or `move` keyword), takes ownership

## Problem-Solving Examples

**Problem: Iterate and Modify**

```rust
// APPROACH 1: Use iter_mut for in-place modification
fn main() {
    let mut v = vec![1, 2, 3];
    for x in v.iter_mut() {
        *x *= 2;
    }
    println!("{:?}", v);
}

// APPROACH 2: Use collect for transformation
fn main() {
    let v = vec![1, 2, 3];
    let v: Vec<_> = v.iter().map(|x| x * 2).collect();
    println!("{:?}", v);
}
```

**Problem: Returning Multiple Values**

```rust
// APPROACH 1: Return tuple
fn divide_remainder(a: i32, b: i32) -> (i32, i32) {
    (a / b, a % b)
}

// APPROACH 2: Use struct
struct DivideResult {
    quotient: i32,
    remainder: i32,
}

fn divide(a: i32, b: i32) -> DivideResult {
    DivideResult {
        quotient: a / b,
        remainder: a % b,
    }
}

fn main() {
    let (q, r) = divide_remainder(10, 3);
    println!("Quotient: {}, Remainder: {}", q, r);
}
```

## Further Reading

### Official Resources

- **The Rust Book - Ownership Chapter**: Comprehensive introduction to ownership fundamentals
- **The Rust Reference - Lifetimes**: Detailed lifetime syntax and rules
- **Rust by Example - Ownership**: Interactive examples of ownership patterns
- **Error Handling - Result and Option**: Working with ownership in error cases

### Advanced Topics

- **Smart Pointers**: Box, Rc, Arc, RefCell, Mutex
- **Lifetime Elision Rules**: When lifetimes can be omitted
- **Variance and Subtyping**: Advanced lifetime concepts
- **PhantomData**: Zero-cost phantom types for lifetime tracking

### Related Concepts

- **Trait Objects and Dynamic Dispatch**: Ownership with trait objects (Box<dyn Trait>)
- **Unsafe Rust**: When and how to bypass ownership rules
- **Interior Mutability**: Patterns like RefCell and Mutex for controlled mutation
- **Zero-Copy Abstractions**: Using references to avoid allocation

### Community Resources

- **Rust Discourse - Ownership Category**: Community discussions and questions
- **Stack Overflow Rust Tag**: Common problems and solutions
- **Rust YouTube Channels**: Visual explanations of ownership concepts
- **Community Blogs**: Deep dives into practical ownership patterns

## Summary

Rust's ownership system is a paradigm shift in how we think about memory management. This guide covered:

1. **Core Concepts**: The three ownership rules and their purpose
2. **Move vs. Copy**: Understanding when ownership is transferred
3. **Borrowing**: Immutable and mutable references with their rules
4. **The Borrow Checker**: Compile-time verification mechanism
5. **Code Patterns**: Practical examples from basic to advanced
6. **Best Practices**: Design principles and common patterns
7. **Performance**: Understanding memory allocation and moves
8. **Real-world Scenarios**: How ownership applies in actual programs
9. **Interview Preparation**: Key concepts and problem-solving approaches

Key Takeaways:

- **Ownership is the foundation**: Every value has exactly one owner
- **Borrowing is powerful**: References enable data access without taking ownership
- **The borrow checker is your friend**: It catches bugs at compile-time
- **Lifetimes ensure correctness**: References can't outlive their data
- **Zero-cost abstractions**: No runtime overhead for memory safety

With ownership, you can write safe, concurrent, and performant code without garbage collection or manual memory management. The learning curve is steep, but the rewards in terms of safety and performance are immense.
