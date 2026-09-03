---
title: Rust Closures Explained
description: Deep dive into Rust closures including capturing environment, Fn traits and closures as parameters
track: rust
section: ownership-borrowing
difficulty: intermediate
tags:
  - Rust
  - closures
  - functional programming
status: imported
origin: old/src/content/docs/rust/closures.en.md
divergence: 0.362
issues:
  - divergent
legacy:
  category: Rust
  subcategory: Core Concepts
  order: 19
  lastUpdated: 2026-01-07
---

Closures are anonymous functions that can capture values from their enclosing scope. They are one of Rust's most powerful features for writing concise, expressive, and functional-style code. Unlike regular functions, closures can access variables from the environment in which they are defined.

## What is a Closure?

A closure is an anonymous function you can save in a variable or pass as an argument to other functions. Closures are particularly useful for short operations and callbacks where defining a full function would be overly verbose.

### Basic Syntax

```rust
// Basic closure syntax
let add_one = |x| x + 1;

// With explicit type annotations
let add_one_typed: fn(i32) -> i32 = |x: i32| -> i32 { x + 1 };

// Multi-line closure with braces
let calculate = |x: i32, y: i32| {
    let sum = x + y;
    let product = x * y;
    sum + product
};

println!("{}", add_one(5));        // Output: 6
println!("{}", calculate(3, 4));   // Output: 19
```

### Closures vs Functions

While closures and functions share similarities, there are key differences:

```rust
// Regular function
fn add_one_fn(x: i32) -> i32 {
    x + 1
}

// Closure
let add_one_closure = |x: i32| x + 1;

// Both can be called the same way
println!("{}", add_one_fn(5));       // 6
println!("{}", add_one_closure(5));  // 6
```

The main difference is that closures can capture their environment, while functions cannot:

```rust
let multiplier = 3;

// This closure captures `multiplier` from its environment
let multiply = |x| x * multiplier;

println!("{}", multiply(5)); // Output: 15
```

## Capturing the Environment

Closures can capture values from their enclosing scope in three ways, corresponding to the three ways a function can take a parameter: borrowing immutably, borrowing mutably, and taking ownership.

### Immutable Borrow

By default, closures capture variables by immutable reference when possible:

```rust
fn main() {
    let message = String::from("Hello");

    // Closure borrows `message` immutably
    let print_message = || println!("{}", message);

    print_message();
    print_message();

    // `message` is still valid here
    println!("Original: {}", message);
}
```

### Mutable Borrow

When a closure modifies a captured variable, it takes a mutable borrow:

```rust
fn main() {
    let mut count = 0;

    // Closure borrows `count` mutably
    let mut increment = || {
        count += 1;
        println!("Count: {}", count);
    };

    increment(); // Count: 1
    increment(); // Count: 2
    increment(); // Count: 3

    // After the closure is done, we can use `count` again
    println!("Final count: {}", count); // Final count: 3
}
```

Note that the closure itself must be declared as `mut` since calling it modifies its captured environment.

### Taking Ownership with `move`

The `move` keyword forces the closure to take ownership of captured variables:

```rust
fn main() {
    let data = vec![1, 2, 3];

    // `move` transfers ownership of `data` into the closure
    let owns_data = move || {
        println!("Data: {:?}", data);
    };

    owns_data();

    // This would cause a compile error:
    // println!("{:?}", data); // Error: value borrowed after move
}
```

The `move` keyword is essential when passing closures to new threads or when you need the closure to outlive the current scope:

```rust
use std::thread;

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Without `move`, this would fail because the thread might
    // outlive the scope where `numbers` was created
    let handle = thread::spawn(move || {
        println!("Numbers from thread: {:?}", numbers);
    });

    handle.join().unwrap();
}
```

## The Fn Traits

Rust uses three traits to represent different types of closures based on how they capture and use their environment:

### `FnOnce`

A closure that can be called only once. It takes ownership of captured variables:

```rust
fn consume_closure<F>(f: F)
where
    F: FnOnce() -> String,
{
    let result = f();
    println!("Result: {}", result);
    // Cannot call f() again - it's been consumed
}

fn main() {
    let greeting = String::from("Hello, World!");

    let closure = || greeting; // Takes ownership of greeting

    consume_closure(closure);
    // Cannot use `closure` again - it's been consumed
}
```

### `FnMut`

A closure that can be called multiple times and may mutate captured variables:

```rust
fn apply_twice<F>(mut f: F)
where
    F: FnMut(),
{
    f();
    f();
}

fn main() {
    let mut total = 0;

    let mut add_ten = || {
        total += 10;
    };

    apply_twice(&mut add_ten);

    println!("Total: {}", total); // Total: 20
}
```

### `Fn`

A closure that can be called multiple times without mutating its environment:

```rust
fn call_multiple_times<F>(f: F, times: u32)
where
    F: Fn(),
{
    for _ in 0..times {
        f();
    }
}

fn main() {
    let message = "Hello!";

    let greet = || println!("{}", message);

    call_multiple_times(greet, 3);
    // Output:
    // Hello!
    // Hello!
    // Hello!
}
```

### Trait Hierarchy

The `Fn` traits form a hierarchy:

- All closures implement `FnOnce`
- Closures that don't move captured variables implement `FnMut`
- Closures that don't mutate captured variables implement `Fn`

```rust
// This function accepts any closure
fn accepts_fn_once<F: FnOnce()>(f: F) {
    f();
}

// This function requires a closure that can be called multiple times
fn accepts_fn_mut<F: FnMut()>(mut f: F) {
    f();
    f();
}

// This function requires a pure closure
fn accepts_fn<F: Fn()>(f: F) {
    f();
    f();
}

fn main() {
    let x = 10;

    // This closure implements all three traits
    let pure_closure = || println!("{}", x);

    accepts_fn_once(pure_closure);
    // pure_closure can still be used because Fn closures are Copy
    accepts_fn_mut(pure_closure);
    accepts_fn(pure_closure);
}
```

## Closures as Function Parameters

Closures are commonly used as parameters to higher-order functions. Rust provides several ways to accept closures:

### Using Generic Types with Trait Bounds

```rust
fn apply_operation<F>(value: i32, operation: F) -> i32
where
    F: Fn(i32) -> i32,
{
    operation(value)
}

fn main() {
    let double = |x| x * 2;
    let square = |x| x * x;

    println!("Double 5: {}", apply_operation(5, double));   // 10
    println!("Square 5: {}", apply_operation(5, square));   // 25

    // Inline closure
    println!("Add 10: {}", apply_operation(5, |x| x + 10)); // 15
}
```

### Using `impl Trait`

A more concise syntax available since Rust 2018:

```rust
fn apply_operation(value: i32, operation: impl Fn(i32) -> i32) -> i32 {
    operation(value)
}

fn main() {
    let result = apply_operation(5, |x| x * 3);
    println!("Result: {}", result); // 15
}
```

### Using Trait Objects

For runtime polymorphism when you need to store different closure types:

```rust
fn apply_operations(value: i32, operations: Vec<Box<dyn Fn(i32) -> i32>>) -> i32 {
    operations.iter().fold(value, |acc, op| op(acc))
}

fn main() {
    let ops: Vec<Box<dyn Fn(i32) -> i32>> = vec![
        Box::new(|x| x + 1),
        Box::new(|x| x * 2),
        Box::new(|x| x - 3),
    ];

    let result = apply_operations(5, ops);
    println!("Result: {}", result); // ((5 + 1) * 2) - 3 = 9
}
```

## Returning Closures from Functions

Returning closures requires special handling because closures don't have a concrete type:

```rust
// Using `impl Trait`
fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
    move |x| x + n
}

// Using Box for dynamic dispatch
fn make_multiplier(n: i32) -> Box<dyn Fn(i32) -> i32> {
    Box::new(move |x| x * n)
}

fn main() {
    let add_five = make_adder(5);
    let multiply_by_three = make_multiplier(3);

    println!("{}", add_five(10));           // 15
    println!("{}", multiply_by_three(10));  // 30
}
```

## Closures with Iterators

Closures are extensively used with iterator methods:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // map: Transform each element
    let doubled: Vec<i32> = numbers.iter()
        .map(|x| x * 2)
        .collect();
    println!("Doubled: {:?}", doubled);

    // filter: Keep elements that satisfy a condition
    let evens: Vec<&i32> = numbers.iter()
        .filter(|x| *x % 2 == 0)
        .collect();
    println!("Evens: {:?}", evens);

    // fold: Reduce to a single value
    let sum: i32 = numbers.iter()
        .fold(0, |acc, x| acc + x);
    println!("Sum: {}", sum);

    // Chaining multiple operations
    let result: i32 = numbers.iter()
        .filter(|x| *x % 2 == 0)
        .map(|x| x * x)
        .sum();
    println!("Sum of squares of evens: {}", result);
}
```

### Common Iterator Methods with Closures

```rust
fn main() {
    let words = vec!["apple", "banana", "cherry", "date"];

    // find: Get first matching element
    let long_word = words.iter()
        .find(|w| w.len() > 5);
    println!("Long word: {:?}", long_word); // Some("banana")

    // any: Check if any element matches
    let has_short = words.iter()
        .any(|w| w.len() < 5);
    println!("Has short word: {}", has_short); // true

    // all: Check if all elements match
    let all_lowercase = words.iter()
        .all(|w| w.chars().all(|c| c.is_lowercase()));
    println!("All lowercase: {}", all_lowercase); // true

    // for_each: Apply side effect to each element
    words.iter()
        .for_each(|w| println!("Word: {}", w));

    // partition: Split based on predicate
    let (short, long): (Vec<_>, Vec<_>) = words.iter()
        .partition(|w| w.len() <= 5);
    println!("Short: {:?}, Long: {:?}", short, long);
}
```

## Closure Type Inference and Annotations

Rust can often infer closure types, but sometimes annotations are needed:

```rust
fn main() {
    // Type inference works here
    let add = |a, b| a + b;
    let result = add(1, 2); // Inferred as i32

    // Explicit type annotations
    let multiply = |a: i64, b: i64| -> i64 { a * b };

    // Type is locked after first use
    let identity = |x| x;
    let _ = identity(5);     // Now locked to i32
    // let _ = identity(5.0); // Error: expected i32, found f64
}
```

## Practical Examples

### Custom Sorting

```rust
fn main() {
    let mut people = vec![
        ("Alice", 30),
        ("Bob", 25),
        ("Charlie", 35),
    ];

    // Sort by age
    people.sort_by(|a, b| a.1.cmp(&b.1));
    println!("By age: {:?}", people);

    // Sort by name
    people.sort_by(|a, b| a.0.cmp(&b.0));
    println!("By name: {:?}", people);

    // Sort by name length
    people.sort_by_key(|p| p.0.len());
    println!("By name length: {:?}", people);
}
```

### Memoization with Closures

```rust
use std::collections::HashMap;

struct Cacher<T>
where
    T: Fn(u32) -> u32,
{
    calculation: T,
    values: HashMap<u32, u32>,
}

impl<T> Cacher<T>
where
    T: Fn(u32) -> u32,
{
    fn new(calculation: T) -> Cacher<T> {
        Cacher {
            calculation,
            values: HashMap::new(),
        }
    }

    fn value(&mut self, arg: u32) -> u32 {
        match self.values.get(&arg) {
            Some(&v) => v,
            None => {
                let v = (self.calculation)(arg);
                self.values.insert(arg, v);
                v
            }
        }
    }
}

fn main() {
    let mut expensive_result = Cacher::new(|num| {
        println!("Calculating for {}...", num);
        num * num
    });

    println!("First call with 2: {}", expensive_result.value(2));
    println!("Second call with 2: {}", expensive_result.value(2)); // Uses cached value
    println!("Call with 3: {}", expensive_result.value(3));
}
```

### Event Handling

```rust
struct Button {
    on_click: Box<dyn FnMut()>,
}

impl Button {
    fn new(handler: impl FnMut() + 'static) -> Self {
        Button {
            on_click: Box::new(handler),
        }
    }

    fn click(&mut self) {
        (self.on_click)();
    }
}

fn main() {
    let mut click_count = 0;

    let mut button = Button::new(move || {
        click_count += 1;
        println!("Button clicked {} times", click_count);
    });

    button.click(); // Button clicked 1 times
    button.click(); // Button clicked 2 times
    button.click(); // Button clicked 3 times
}
```

## Best Practices

### Prefer Closures for Short Operations

```rust
// Good: Closure for simple transformation
let squares: Vec<i32> = (1..=5).map(|x| x * x).collect();

// Consider a function for complex logic
fn complex_calculation(x: i32) -> i32 {
    // Multiple lines of complex logic
    let step1 = x * 2;
    let step2 = step1 + 10;
    let step3 = step2 / 3;
    step3
}

let results: Vec<i32> = (1..=5).map(complex_calculation).collect();
```

### Use `move` When Necessary

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3];

    // Always use `move` for thread spawning
    let handle = thread::spawn(move || {
        println!("{:?}", data);
    });

    handle.join().unwrap();
}
```

### Choose the Right Fn Trait

```rust
// FnOnce: When you only need to call once
fn consume<F: FnOnce()>(f: F) { f(); }

// FnMut: When the closure needs to mutate state
fn apply_mut<F: FnMut()>(mut f: F) { f(); f(); }

// Fn: When you need a pure, reusable closure
fn apply_many<F: Fn()>(f: F) { for _ in 0..10 { f(); } }
```

### Avoid Capturing More Than Needed

```rust
struct LargeStruct {
    data: Vec<u8>,
    name: String,
}

fn main() {
    let large = LargeStruct {
        data: vec![0; 1_000_000],
        name: String::from("example"),
    };

    // Bad: Captures entire struct
    // let closure = move || println!("{}", large.name);

    // Good: Capture only what's needed
    let name = large.name.clone();
    let closure = move || println!("{}", name);

    // large.data is still accessible
}
```

## Summary

Closures are a cornerstone of Rust's approach to functional programming, offering:

- **Concise syntax** for anonymous functions
- **Environment capture** with fine-grained control over borrowing and ownership
- **Three Fn traits** (`FnOnce`, `FnMut`, `Fn`) that express how closures use captured variables
- **Seamless integration** with iterators and higher-order functions
- **Zero-cost abstractions** that compile to efficient machine code

Understanding closures is essential for writing idiomatic Rust code, especially when working with iterators, concurrent programming, and event-driven architectures. The borrowing rules that apply to closures are the same as those throughout Rust, ensuring memory safety while providing flexibility in how you structure your code.
