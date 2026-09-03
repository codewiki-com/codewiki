---
title: Rust Ownership System
description: "Deep dive into Rust ownership: ownership rules, borrowing, lifetimes"
track: rust
section: ownership-borrowing
difficulty: intermediate
tags:
  - Rust
  - Ownership
  - Borrowing
  - Lifetimes
status: imported
origin: old/src/content/docs/rust/ownership.en.md
divergence: 0.245
issues: []
legacy:
  category: Rust
  subcategory: Ownership
  order: 1
  lastUpdated: 2026-01-07
---

Rust's ownership system is one of the most distinctive and powerful features of the language. It enables memory safety without requiring a garbage collector, making Rust unique among modern programming languages. Understanding ownership is crucial to writing effective Rust code.

## What is Ownership?

Ownership is Rust's approach to memory management. Instead of using a garbage collector or requiring manual memory allocation and deallocation, Rust uses a system of ownership with a set of rules that the compiler checks at compile time. This ensures memory safety without runtime overhead.

The ownership system solves several common programming problems:

- **Memory leaks**: Unused memory that is never freed
- **Dangling pointers**: References to memory that has been freed
- **Double free errors**: Attempting to free memory twice
- **Data races**: Concurrent access to mutable data

## Ownership Rules

Rust's ownership system is built on three fundamental rules:

1. **Each value in Rust has an owner**
2. **There can only be one owner at a time**
3. **When the owner goes out of scope, the value will be dropped**

Let's explore each rule with examples:

```rust
fn main() {
    // Rule 1: Each value has an owner
    let s = String::from("hello"); // 's' is the owner of the String

    // Rule 2: Only one owner at a time
    let s2 = s; // Ownership moves from 's' to 's2'
    // println!("{}", s); // ERROR! 's' no longer owns the value

    println!("{}", s2); // This works

} // Rule 3: When 's2' goes out of scope, the String is dropped
```

### Scope and Ownership

A variable's scope determines how long its owner exists:

```rust
fn main() {
    {
        let s = String::from("hello"); // 's' is valid from this point

        // Do stuff with 's'
        println!("{}", s);

    } // 's' goes out of scope and is dropped here

    // println!("{}", s); // ERROR! 's' is no longer in scope
}
```

## Move Semantics

Move semantics is the default behavior when assigning or passing values in Rust. When a value is moved, ownership is transferred, and the original owner can no longer access the value.

### Basic Move Example

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // Ownership moves to s2

    // s1 is no longer valid
    // println!("{}", s1); // Compile error!
    println!("{}", s2); // Works fine
}
```

### Move in Function Calls

```rust
fn main() {
    let s = String::from("hello");

    takes_ownership(s); // Ownership moves into the function

    // println!("{}", s); // ERROR! 's' is no longer valid
}

fn takes_ownership(some_string: String) {
    println!("{}", some_string);
} // some_string goes out of scope and is dropped
```

### Returning Ownership

Functions can return ownership to transfer it back to the caller:

```rust
fn main() {
    let s1 = gives_ownership(); // Function gives ownership to s1

    let s2 = String::from("hello");
    let s3 = takes_and_gives_back(s2); // s2 moves in, s3 gets ownership back

    println!("{}", s1);
    println!("{}", s3);
    // println!("{}", s2); // ERROR! s2 was moved
}

fn gives_ownership() -> String {
    let some_string = String::from("yours");
    some_string // Ownership moves to caller
}

fn takes_and_gives_back(a_string: String) -> String {
    a_string // Ownership moves to caller
}
```

## Clone and Copy

Rust provides two traits to handle value duplication: `Clone` and `Copy`.

### Clone Trait

The `Clone` trait allows explicit deep copying of data:

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone(); // Explicitly copy the data

    println!("s1 = {}, s2 = {}", s1, s2); // Both are valid
}
```

Cloning can be expensive for large data structures, so Rust requires it to be explicit:

```rust
fn main() {
    let vec1 = vec![1, 2, 3, 4, 5];
    let vec2 = vec1.clone(); // Deep copy of all elements

    println!("vec1: {:?}", vec1);
    println!("vec2: {:?}", vec2);
}
```

### Copy Trait

The `Copy` trait is for types that can be trivially copied by copying bits. Types that implement `Copy` don't move; they're automatically copied:

```rust
fn main() {
    let x = 5; // i32 implements Copy
    let y = x; // x is copied, not moved

    println!("x = {}, y = {}", x, y); // Both are valid
}
```

Types that implement `Copy`:

- All integer types (`i32`, `u64`, etc.)
- Boolean type (`bool`)
- All floating-point types (`f32`, `f64`)
- Character type (`char`)
- Tuples containing only `Copy` types

```rust
fn main() {
    let tuple1 = (5, 10.5, true);
    let tuple2 = tuple1; // Copied, not moved

    println!("tuple1: {:?}", tuple1);
    println!("tuple2: {:?}", tuple2);
}
```

**Important**: A type cannot implement `Copy` if any of its parts implements `Drop`, or if it manages resources that need cleanup.

## Borrowing

Borrowing allows you to reference a value without taking ownership. There are two types of borrows: immutable and mutable.

### Immutable References

Immutable references allow read-only access to data:

```rust
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1); // Borrow s1

    println!("The length of '{}' is {}.", s1, len); // s1 is still valid
}

fn calculate_length(s: &String) -> usize {
    s.len()
} // s goes out of scope, but it doesn't drop the String (it doesn't own it)
```

You can have multiple immutable references simultaneously:

```rust
fn main() {
    let s = String::from("hello");

    let r1 = &s;
    let r2 = &s;
    let r3 = &s;

    println!("{}, {}, and {}", r1, r2, r3); // All valid
}
```

### Mutable References

Mutable references allow modification of borrowed data:

```rust
fn main() {
    let mut s = String::from("hello");

    change(&mut s); // Mutable borrow

    println!("{}", s); // Prints "hello, world"
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```

### Borrowing Rules

Rust enforces strict borrowing rules to prevent data races:

1. **At any given time, you can have either one mutable reference or any number of immutable references**
2. **References must always be valid**

#### Rule 1: Exclusive Mutable Access

You cannot have a mutable reference while immutable references exist:

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s; // Immutable borrow
    let r2 = &s; // Another immutable borrow
    // let r3 = &mut s; // ERROR! Cannot borrow as mutable

    println!("{} and {}", r1, r2);
}
```

However, this is allowed because references' scopes end:

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;
    let r2 = &s;
    println!("{} and {}", r1, r2);
    // r1 and r2 are no longer used after this point

    let r3 = &mut s; // This is OK
    println!("{}", r3);
}
```

You also cannot have multiple mutable references:

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &mut s;
    // let r2 = &mut s; // ERROR! Cannot have two mutable borrows

    println!("{}", r1);
}
```

#### Rule 2: No Dangling References

Rust guarantees that references never dangle:

```rust
fn main() {
    // let reference_to_nothing = dangle(); // ERROR! Compilation fails
}

// fn dangle() -> &String { // ERROR! Missing lifetime specifier
//     let s = String::from("hello");
//     &s // Returns reference to s, but s will be dropped
// } // s goes out of scope
```

The correct way is to return ownership:

```rust
fn main() {
    let string = no_dangle();
    println!("{}", string);
}

fn no_dangle() -> String {
    let s = String::from("hello");
    s // Ownership is moved out
}
```

## Lifetime Annotations

Lifetimes ensure that references are valid for as long as they're used. Most of the time, Rust can infer lifetimes, but sometimes you need to annotate them explicitly.

### Lifetime Syntax

Lifetime annotations use an apostrophe followed by a name (conventionally starting with 'a'):

```rust
&i32        // A reference
&'a i32     // A reference with an explicit lifetime
&'a mut i32 // A mutable reference with an explicit lifetime
```

### Lifetime Annotations in Functions

When a function has multiple reference parameters, Rust needs to know how their lifetimes relate:

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("long string is long");
    let string2 = String::from("xyz");

    let result = longest(string1.as_str(), string2.as_str());
    println!("The longest string is {}", result);
}
```

The lifetime annotation `'a` tells Rust that the returned reference will be valid for as long as both input references are valid:

```rust
fn main() {
    let string1 = String::from("long string is long");
    let result;

    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
        println!("The longest string is {}", result); // OK: used in scope
    }

    // println!("The longest string is {}", result); // ERROR! string2 is dropped
}

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

### Lifetime Annotations in Structs

Structs can hold references, but they need lifetime annotations:

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("Could not find a '.'");

    let i = ImportantExcerpt {
        part: first_sentence,
    };

    println!("Excerpt: {}", i.part);
}
```

This annotation means an instance of `ImportantExcerpt` can't outlive the reference it holds:

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let i;

    {
        let novel = String::from("Call me Ishmael. Some years ago...");
        let first_sentence = novel.split('.').next().expect("Could not find a '.'");

        i = ImportantExcerpt {
            part: first_sentence,
        };

        println!("{}", i.part); // OK: used while novel is in scope
    }

    // println!("{}", i.part); // ERROR! novel is dropped
}
```

### Lifetime Elision Rules

Rust has three lifetime elision rules that allow you to omit lifetime annotations in common cases:

1. Each parameter that is a reference gets its own lifetime
2. If there's exactly one input lifetime, it's assigned to all output lifetimes
3. If there are multiple input lifetimes but one is `&self` or `&mut self`, the lifetime of `self` is assigned to all output lifetimes

Examples where lifetimes are automatically inferred:

```rust
// Compiler applies rule 2
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}

// Compiler applies rule 3
impl<'a> ImportantExcerpt<'a> {
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention please: {}", announcement);
        self.part
    }
}
```

### The Static Lifetime

The `'static` lifetime means a reference can live for the entire duration of the program:

```rust
fn main() {
    let s: &'static str = "I have a static lifetime.";
    println!("{}", s);
}
```

All string literals have the `'static` lifetime because they're stored directly in the program's binary.

### Generic Types with Lifetimes

You can combine generic types with lifetime annotations:

```rust
use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display,
{
    println!("Announcement! {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("long string is long");
    let string2 = String::from("xyz");

    let result = longest_with_an_announcement(
        string1.as_str(),
        string2.as_str(),
        "Today is someone's birthday!",
    );

    println!("The longest string is {}", result);
}
```

## Common Patterns and Best Practices

### Pattern 1: Taking Ownership When Needed

Take ownership when you need to modify or consume the data:

```rust
struct Document {
    content: String,
}

impl Document {
    fn new(content: String) -> Self {
        Document { content }
    }

    fn append_signature(mut self, signature: String) -> Self {
        self.content.push_str("\n\n---\n");
        self.content.push_str(&signature);
        self
    }
}

fn main() {
    let doc = Document::new(String::from("Hello, world!"));
    let signed_doc = doc.append_signature(String::from("John Doe"));

    println!("{}", signed_doc.content);
}
```

### Pattern 2: Borrowing for Read Access

Use immutable references for read-only operations:

```rust
fn print_document(doc: &Document) {
    println!("Document content:\n{}", doc.content);
}

fn count_words(doc: &Document) -> usize {
    doc.content.split_whitespace().count()
}

fn main() {
    let doc = Document::new(String::from("Hello world"));

    print_document(&doc);
    let word_count = count_words(&doc);
    println!("Word count: {}", word_count);

    // doc is still usable
    print_document(&doc);
}
```

### Pattern 3: Mutable Borrowing for Modifications

Use mutable references when you need to modify data:

```rust
impl Document {
    fn add_line(&mut self, line: &str) {
        self.content.push('\n');
        self.content.push_str(line);
    }

    fn clear(&mut self) {
        self.content.clear();
    }
}

fn main() {
    let mut doc = Document::new(String::from("First line"));

    doc.add_line("Second line");
    doc.add_line("Third line");

    println!("{}", doc.content);
}
```

### Pattern 4: Returning Owned Data

Return owned data when creating new values:

```rust
fn create_greeting(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    let name = "Alice";
    let greeting = create_greeting(name);

    println!("{}", greeting);
}
```

### Pattern 5: Using Clone Strategically

Clone when you need independent copies but be mindful of performance:

```rust
use std::collections::HashMap;

fn process_data(data: &HashMap<String, i32>) -> HashMap<String, i32> {
    let mut result = data.clone();

    for (key, value) in result.iter_mut() {
        *value *= 2;
    }

    result
}

fn main() {
    let mut data = HashMap::new();
    data.insert(String::from("a"), 1);
    data.insert(String::from("b"), 2);

    let doubled = process_data(&data);

    println!("Original: {:?}", data);
    println!("Doubled: {:?}", doubled);
}
```

### Pattern 6: Builder Pattern with Ownership

Use ownership transfers in builder patterns:

```rust
struct Config {
    host: String,
    port: u16,
    timeout: u64,
}

struct ConfigBuilder {
    host: String,
    port: u16,
    timeout: u64,
}

impl ConfigBuilder {
    fn new() -> Self {
        ConfigBuilder {
            host: String::from("localhost"),
            port: 8080,
            timeout: 30,
        }
    }

    fn host(mut self, host: String) -> Self {
        self.host = host;
        self
    }

    fn port(mut self, port: u16) -> Self {
        self.port = port;
        self
    }

    fn timeout(mut self, timeout: u64) -> Self {
        self.timeout = timeout;
        self
    }

    fn build(self) -> Config {
        Config {
            host: self.host,
            port: self.port,
            timeout: self.timeout,
        }
    }
}

fn main() {
    let config = ConfigBuilder::new()
        .host(String::from("example.com"))
        .port(443)
        .timeout(60)
        .build();

    println!("Config: {}:{} (timeout: {}s)", config.host, config.port, config.timeout);
}
```

## Conclusion

Rust's ownership system is a powerful mechanism that ensures memory safety and prevents data races at compile time. While it may seem complex at first, the ownership rules become intuitive with practice:

- **Ownership**: Each value has a single owner, and the value is dropped when the owner goes out of scope
- **Move semantics**: Ownership transfers by default for types without `Copy`
- **Borrowing**: References allow temporary access without taking ownership
- **Lifetimes**: Ensure references remain valid for their entire usage

By mastering these concepts, you'll write safe, efficient, and concurrent Rust code without the need for a garbage collector or manual memory management. The compiler becomes your ally, catching potential bugs before they reach production.

## Further Reading

- [The Rust Programming Language Book - Ownership](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html)
- [Rust Reference - Memory Management](https://doc.rust-lang.org/reference/memory-model.html)
- [Rustonomicon - Advanced Ownership Topics](https://doc.rust-lang.org/nomicon/)
