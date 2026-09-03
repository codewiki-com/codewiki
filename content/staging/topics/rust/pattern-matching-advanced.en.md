---
title: Rust 高级模式匹配
description: 深入探索 Rust 高级模式匹配技术，包括复杂解构、模式守卫、@ 绑定、or 模式、ref/ref mut 以及编译器优化原理
track: rust
section: unsafe-ffi
difficulty: advanced
tags:
  - Rust
  - 模式匹配
  - 高级模式
  - 解构
  - 守卫
  - ref
  - 编译器优化
status: imported
origin: old/src/content/docs/rust/pattern-matching-advanced.en.md
divergence: 0.212
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 高级特性
  order: 17
  lastUpdated: 2026-01-07
---

Pattern matching is one of the core pillars of Rust's type system. Once you know the basic syntax, understanding advanced pattern matching techniques helps you write more expressive, safer, and more performant code. This article covers all aspects of Rust's advanced pattern matching, from underlying principles to practical applications.

## Concept Explanation

### What is Advanced Pattern Matching

Advanced pattern matching refers to complex pattern techniques beyond basic `match` syntax, including:

- **Deep Destructuring**: Recursive decomposition of nested structures
- **Pattern Guards**: Adding extra boolean conditions in pattern matching
- **@ Bindings**: Binding values to variables while testing patterns
- **Or Patterns**: Logical OR combination of multiple patterns
- **ref/ref mut Patterns**: Controlling how values are borrowed
- **Slice Patterns**: Structural matching on arrays and slices

### Historical Background

Rust's pattern matching is deeply influenced by ML-family languages (such as OCaml, Haskell), but has unique designs under the constraints of the ownership system. As Rust versions evolved, pattern matching has been continuously enhanced:

- **Rust 1.26**: Introduced `..=` inclusive range patterns
- **Rust 1.53**: Or patterns available in all positions
- **Rust 1.56**: Bindings and or patterns can be mixed
- **Rust 1.65**: Introduced `let-else` syntax
- **Rust 1.75+**: Slice patterns continue to be enhanced

### Problems Solved

Advanced pattern matching solves the following key problems:

1. **Safe Access to Complex Data Structures**: Avoiding manual layer-by-layer unwrapping
2. **Exhaustiveness Guarantee**: Compile-time assurance that all cases are handled
3. **Precise Ownership Control**: Precise management of borrowing and moving in matching
4. **Code Expressiveness**: Expressing complex logic in a declarative way

## Core Principles

### Compiler Implementation of Pattern Matching

The Rust compiler compiles pattern matching into a decision tree, optimizing through the following steps:

```rust
// Source code
enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
    Triangle { base: f64, height: f64 },
}

fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle { radius } => std::f64::consts::PI * radius * radius,
        Shape::Rectangle { width, height } => width * height,
        Shape::Triangle { base, height } => 0.5 * base * height,
    }
}

// The compiler internally generates roughly the following decision logic:
// 1. Check the discriminant to determine the enum variant
// 2. Jump directly to the corresponding branch
// 3. Extract fields into local variables
// 4. Execute the expression
```

### Discriminant and Memory Layout

Enum pattern matching relies on discriminants:

```rust
use std::mem;

enum Message {
    Quit,                       // discriminant = 0
    Move { x: i32, y: i32 },    // discriminant = 1
    Write(String),              // discriminant = 2
    ChangeColor(u8, u8, u8),    // discriminant = 3
}

fn main() {
    // Enum size = largest variant size + discriminant size + alignment padding
    println!("Message size: {} bytes", mem::size_of::<Message>());

    // View the discriminant
    let msg = Message::Write(String::from("hello"));
    let discriminant = unsafe {
        *(&msg as *const Message as *const u8)
    };
    println!("Discriminant value: {}", discriminant);
}
```

### Exhaustiveness Checking in Pattern Matching

The compiler uses a usefulness matrix algorithm to check pattern exhaustiveness:

```rust
// The compiler internally establishes the following check:
// Pattern space: Shape = { Circle, Rectangle, Triangle }
// Covered: { Circle, Rectangle, Triangle }
// Uncovered: {} (empty set = exhaustive)

// If a branch is missing, the compiler reports an error and indicates the missing pattern
fn incomplete_match(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle { radius } => std::f64::consts::PI * radius * radius,
        Shape::Rectangle { width, height } => width * height,
        // Error: missing Triangle branch
    }
}
```

### Borrow Checking and Pattern Matching

Pattern matching works closely with the borrow checker:

```rust
struct Container {
    value: String,
    count: i32,
}

fn demonstrate_borrow_in_match(container: &mut Container) {
    // The match expression creates a temporary borrow scope
    match &container.value {
        s if s.starts_with("prefix") => {
            // Here container is immutably borrowed
            println!("Value: {}", s);
        }
        _ => {
            // Here the borrow ends, can mutably borrow
            container.count += 1;
        }
    }
    // After match ends, the borrow is released
    container.value.push_str(" suffix");
}
```

## Core Points

### Deep Destructuring

Deep destructuring allows decomposing multiple levels of nested structures at once:

```rust
struct Address {
    city: String,
    street: String,
    number: u32,
}

struct Person {
    name: String,
    address: Address,
}

struct Company {
    name: String,
    ceo: Person,
    headquarters: Address,
}

fn print_ceo_city(company: &Company) {
    // Deep destructuring: accessing multiple nested fields at once
    let Company {
        name: company_name,
        ceo: Person {
            name: ceo_name,
            address: Address { city, .. },
        },
        ..
    } = company;

    println!("{}'s CEO {} lives in {}", company_name, ceo_name, city);
}
```

### Pattern Guards

Pattern guards add extra conditions after pattern matching:

```rust
fn classify_number(n: i32) -> &'static str {
    match n {
        x if x < 0 => "negative",
        0 => "zero",
        x if x % 2 == 0 => "positive even",
        x if x % 2 == 1 => "positive odd",
        _ => unreachable!(),
    }
}

// Guards can reference external variables
fn check_password(input: &str, stored_hash: u64) -> bool {
    // Simplified hash check example
    fn hash(s: &str) -> u64 {
        s.bytes().fold(0u64, |acc, b| acc.wrapping_mul(31).wrapping_add(b as u64))
    }

    match input {
        s if s.len() >= 8 && hash(s) == stored_hash => true,
        s if s.len() < 8 => {
            println!("Password too short");
            false
        }
        _ => {
            println!("Password mismatch");
            false
        }
    }
}
```

### @ Bindings

@ bindings allow capturing values while testing patterns:

```rust
enum Message {
    Hello { id: i32 },
    Goodbye { id: i32, reason: String },
}

fn process_message(msg: Message) {
    match msg {
        // Both check the range and bind the value
        Message::Hello { id: id @ 1..=100 } => {
            println!("Valid Hello, ID: {}", id);
        }
        // @ binding the entire structure
        msg @ Message::Goodbye { id: 200..=300, .. } => {
            println!("Special Goodbye: {:?}", msg);
        }
        // Nested @ binding
        Message::Goodbye {
            id: id @ 1..=199,
            reason: ref r @ _
        } => {
            println!("Normal Goodbye, ID: {}, reason: {}", id, r);
        }
        _ => println!("Other message"),
    }
}

// @ binding in slice patterns
fn analyze_sequence(data: &[i32]) {
    match data {
        [] => println!("Empty sequence"),
        [single] => println!("Single element: {}", single),
        // Bind first element and check range
        [first @ 1..=10, rest @ ..] => {
            println!("Starts with small number {}, {} elements remaining", first, rest.len());
        }
        // Bind entire slice and check pattern
        all @ [_, _, _] => {
            println!("Exactly three elements: {:?}", all);
        }
        _ => println!("Other pattern"),
    }
}
```

### Or Patterns

Or patterns use `|` to combine multiple patterns:

```rust
enum Event {
    KeyPress { key: char, ctrl: bool, alt: bool },
    MouseClick { x: i32, y: i32, button: MouseButton },
    Scroll { delta: i32 },
    Resize { width: u32, height: u32 },
}

enum MouseButton { Left, Right, Middle }

fn handle_event(event: Event) {
    match event {
        // Or pattern combining multiple cases
        Event::KeyPress { key: 'q', .. } | Event::KeyPress { key: 'Q', .. } => {
            println!("Quit");
        }
        // Complex or pattern
        Event::KeyPress { key: 'c' | 'C', ctrl: true, .. } => {
            println!("Copy");
        }
        Event::KeyPress { key: 'v' | 'V', ctrl: true, .. } => {
            println!("Paste");
        }
        // Or pattern in nested structures
        Event::MouseClick {
            button: MouseButton::Left | MouseButton::Right,
            x,
            y
        } => {
            println!("Primary button click at ({}, {})", x, y);
        }
        // Or pattern with binding
        Event::Scroll { delta: d @ (1..=10 | -10..=-1) } => {
            println!("Small scroll: {}", d);
        }
        _ => {}
    }
}

// Or pattern in if let
fn check_result<T, E>(result: &Result<T, E>) -> bool {
    // Supported in Rust 1.65+
    matches!(result, Ok(_) | Err(_)) // Always true, just for syntax demonstration
}
```

### ref and ref mut Patterns

`ref` and `ref mut` control borrowing behavior in pattern matching:

```rust
struct Data {
    value: String,
    count: i32,
}

fn demonstrate_ref_patterns() {
    let data = Data {
        value: String::from("hello"),
        count: 42,
    };

    // Without ref: value is moved
    // let Data { value, count } = data;  // data.value is moved

    // With ref: creates a reference instead of moving
    let Data { ref value, count } = data;
    println!("value: {}, count: {}", value, count);
    // data is still intact and usable
    println!("data.value: {}", data.value);
}

fn demonstrate_ref_mut() {
    let mut data = Data {
        value: String::from("hello"),
        count: 0,
    };

    // ref mut creates a mutable reference
    let Data { ref mut value, ref mut count } = data;
    value.push_str(" world");
    *count += 1;

    println!("After modification: {} ({})", data.value, data.count);
}

// Using ref in match
fn process_option(opt: Option<String>) {
    match opt {
        // Use ref to avoid moving
        Some(ref s) => println!("Value: {}", s),
        None => println!("No value"),
    }
    // opt is still usable (if Some, the String was not moved)
}

// match auto-dereferencing on references
fn process_option_ref(opt: &Option<String>) {
    match opt {
        // Auto-dereference &Option<String>
        Some(s) => println!("Value: {}", s),  // s is &String
        None => println!("No value"),
    }
}

// ref in complex patterns
enum Container {
    Single(String),
    Multiple(Vec<String>),
}

fn examine_container(container: &Container) {
    match container {
        // Automatically gets a reference
        Container::Single(s) => println!("Single value: {}", s),
        Container::Multiple(items) if items.len() > 2 => {
            println!("More than two items: {:?}", items);
        }
        Container::Multiple(items) => {
            println!("At most two items: {:?}", items);
        }
    }
}
```

### Advanced Slice Patterns

```rust
fn advanced_slice_patterns() {
    let numbers: &[i32] = &[1, 2, 3, 4, 5];

    match numbers {
        // Match specific beginning
        [1, 2, rest @ ..] => {
            println!("Starts with 1, 2, rest: {:?}", rest);
        }
        // Match specific ending
        [init @ .., 4, 5] => {
            println!("Ends with 4, 5, before: {:?}", init);
        }
        // Match head and tail
        [first, middle @ .., last] => {
            println!("First: {}, middle: {:?}, last: {}", first, middle, last);
        }
        _ => {}
    }

    // Using slice patterns in recursion
    fn sum(slice: &[i32]) -> i32 {
        match slice {
            [] => 0,
            [x] => *x,
            [first, rest @ ..] => first + sum(rest),
        }
    }

    println!("Sum: {}", sum(numbers));
}

// Slice pattern matching strings
fn parse_command(input: &str) -> Option<(&str, Vec<&str>)> {
    let parts: Vec<&str> = input.split_whitespace().collect();

    match parts.as_slice() {
        [] => None,
        [cmd] => Some((cmd, vec![])),
        [cmd, args @ ..] => Some((cmd, args.to_vec())),
    }
}
```

## Code Examples

### Example 1: Expression Evaluator

```rust
/// Arithmetic expression AST
#[derive(Debug, Clone)]
enum Expr {
    Num(f64),
    Var(String),
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
    Pow(Box<Expr>, Box<Expr>),
    Neg(Box<Expr>),
    Call { func: String, args: Vec<Expr> },
}

use std::collections::HashMap;

type Context = HashMap<String, f64>;

fn evaluate(expr: &Expr, ctx: &Context) -> Result<f64, String> {
    match expr {
        // Basic values
        Expr::Num(n) => Ok(*n),

        // Variable lookup
        Expr::Var(name) => ctx
            .get(name)
            .copied()
            .ok_or_else(|| format!("Undefined variable: {}", name)),

        // Binary operations - using @ binding to simplify error handling
        op @ (Expr::Add(l, r) | Expr::Sub(l, r) | Expr::Mul(l, r) | Expr::Div(l, r)) => {
            let lv = evaluate(l, ctx)?;
            let rv = evaluate(r, ctx)?;
            match op {
                Expr::Add(_, _) => Ok(lv + rv),
                Expr::Sub(_, _) => Ok(lv - rv),
                Expr::Mul(_, _) => Ok(lv * rv),
                Expr::Div(_, _) if rv != 0.0 => Ok(lv / rv),
                Expr::Div(_, _) => Err("Division by zero".to_string()),
                _ => unreachable!(),
            }
        }

        // Power operation
        Expr::Pow(base, exp) => {
            let b = evaluate(base, ctx)?;
            let e = evaluate(exp, ctx)?;
            Ok(b.powf(e))
        }

        // Unary negation
        Expr::Neg(inner) => Ok(-evaluate(inner, ctx)?),

        // Function calls - using slice patterns to match arguments
        Expr::Call { func, args } => {
            let evaluated: Result<Vec<f64>, String> =
                args.iter().map(|a| evaluate(a, ctx)).collect();
            let args = evaluated?;

            match (func.as_str(), args.as_slice()) {
                ("sin", [x]) => Ok(x.sin()),
                ("cos", [x]) => Ok(x.cos()),
                ("sqrt", [x]) if *x >= 0.0 => Ok(x.sqrt()),
                ("sqrt", [x]) => Err(format!("Square root of negative number: {}", x)),
                ("max", [a, b]) => Ok(a.max(*b)),
                ("min", [a, b]) => Ok(a.min(*b)),
                ("abs", [x]) => Ok(x.abs()),
                (name, args) => Err(format!(
                    "Unknown function {} or wrong number of arguments (got {})",
                    name,
                    args.len()
                )),
            }
        }
    }
}

/// Expression simplification
fn simplify(expr: Expr) -> Expr {
    match expr {
        // 0 + x = x
        Expr::Add(l, r) => match (*l, *r) {
            (Expr::Num(0.0), e) | (e, Expr::Num(0.0)) => simplify(e),
            (l, r) => Expr::Add(Box::new(simplify(l)), Box::new(simplify(r))),
        },

        // x - 0 = x
        Expr::Sub(l, r) => match (*l, *r) {
            (e, Expr::Num(0.0)) => simplify(e),
            (l, r) => Expr::Sub(Box::new(simplify(l)), Box::new(simplify(r))),
        },

        // 1 * x = x, 0 * x = 0
        Expr::Mul(l, r) => match (*l, *r) {
            (Expr::Num(0.0), _) | (_, Expr::Num(0.0)) => Expr::Num(0.0),
            (Expr::Num(1.0), e) | (e, Expr::Num(1.0)) => simplify(e),
            (l, r) => Expr::Mul(Box::new(simplify(l)), Box::new(simplify(r))),
        },

        // x / 1 = x
        Expr::Div(l, r) => match (*l, *r) {
            (e, Expr::Num(1.0)) => simplify(e),
            (l, r) => Expr::Div(Box::new(simplify(l)), Box::new(simplify(r))),
        },

        // x^0 = 1, x^1 = x
        Expr::Pow(base, exp) => match (*base, *exp) {
            (_, Expr::Num(0.0)) => Expr::Num(1.0),
            (e, Expr::Num(1.0)) => simplify(e),
            (b, e) => Expr::Pow(Box::new(simplify(b)), Box::new(simplify(e))),
        },

        // --x = x
        Expr::Neg(inner) => match *inner {
            Expr::Neg(e) => simplify(*e),
            e => Expr::Neg(Box::new(simplify(e))),
        },

        // Recursively simplify function arguments
        Expr::Call { func, args } => Expr::Call {
            func,
            args: args.into_iter().map(simplify).collect(),
        },

        // Leaf nodes remain unchanged
        e @ (Expr::Num(_) | Expr::Var(_)) => e,
    }
}

fn main() {
    use Expr::*;

    // Build: (x + 2) * sin(y)
    let expr = Mul(
        Box::new(Add(
            Box::new(Var("x".to_string())),
            Box::new(Num(2.0)),
        )),
        Box::new(Call {
            func: "sin".to_string(),
            args: vec![Var("y".to_string())],
        }),
    );

    let mut ctx = HashMap::new();
    ctx.insert("x".to_string(), 3.0);
    ctx.insert("y".to_string(), std::f64::consts::FRAC_PI_2);

    match evaluate(&expr, &ctx) {
        Ok(result) => println!("Result: {}", result),
        Err(e) => println!("Error: {}", e),
    }

    // Simplification demo: 0 + x * 1 => x
    let complex = Add(
        Box::new(Num(0.0)),
        Box::new(Mul(
            Box::new(Var("x".to_string())),
            Box::new(Num(1.0)),
        )),
    );

    println!("Before simplification: {:?}", complex);
    println!("After simplification: {:?}", simplify(complex));
}
```

### Example 2: State Machine and Event Handling

```rust
use std::collections::VecDeque;

/// Network connection state machine
#[derive(Debug, Clone)]
enum ConnectionState {
    Disconnected,
    Connecting { attempt: u32, timeout_ms: u64 },
    Connected { socket_id: u64, encrypted: bool },
    Authenticated { socket_id: u64, user_id: String, permissions: Vec<String> },
    Disconnecting { reason: DisconnectReason },
}

#[derive(Debug, Clone)]
enum DisconnectReason {
    UserRequest,
    Timeout,
    Error(String),
}

#[derive(Debug)]
enum ConnectionEvent {
    Connect { host: String, port: u16 },
    ConnectionEstablished { socket_id: u64 },
    EncryptionEnabled,
    Authenticate { user: String, token: String },
    AuthSuccess { user_id: String, permissions: Vec<String> },
    AuthFailure { reason: String },
    Disconnect,
    Timeout,
    Error(String),
}

#[derive(Debug)]
enum StateTransitionResult {
    NewState(ConnectionState),
    Stay,
    Error(String),
}

fn transition(state: ConnectionState, event: ConnectionEvent) -> StateTransitionResult {
    use ConnectionState::*;
    use ConnectionEvent::*;
    use StateTransitionResult::*;

    match (&state, event) {
        // Connect from disconnected state
        (Disconnected, Connect { host, port }) => {
            println!("Connecting to {}:{}", host, port);
            NewState(Connecting { attempt: 1, timeout_ms: 5000 })
        }

        // Connection established
        (Connecting { .. }, ConnectionEstablished { socket_id }) => {
            println!("Connection established, socket: {}", socket_id);
            NewState(Connected { socket_id, encrypted: false })
        }

        // Connection retry
        (Connecting { attempt, timeout_ms }, Timeout) if *attempt < 3 => {
            println!("Connection timeout, retry attempt {}", attempt + 1);
            NewState(Connecting {
                attempt: attempt + 1,
                timeout_ms: timeout_ms * 2
            })
        }

        // Connection failed
        (Connecting { attempt, .. }, Timeout) => {
            println!("Connection failed, tried {} times", attempt);
            NewState(Disconnected)
        }

        // Enable encryption
        (Connected { socket_id, encrypted: false }, EncryptionEnabled) => {
            println!("Encryption enabled");
            NewState(Connected { socket_id: *socket_id, encrypted: true })
        }

        // Authentication request - requires encryption
        (Connected { socket_id, encrypted: true }, Authenticate { user, token }) => {
            println!("Authenticating user: {}", user);
            // In real applications, this would send an authentication request
            // For simplicity, directly simulate success
            NewState(Authenticated {
                socket_id: *socket_id,
                user_id: user,
                permissions: vec!["read".to_string(), "write".to_string()],
            })
        }

        // Attempt authentication without encryption
        (Connected { encrypted: false, .. }, Authenticate { .. }) => {
            Error("Must enable encryption before authenticating".to_string())
        }

        // User disconnect - from any connected state
        (Connected { .. } | Authenticated { .. }, Disconnect) => {
            NewState(Disconnecting { reason: DisconnectReason::UserRequest })
        }

        // Error handling - using @ binding to capture state
        (state @ (Connected { .. } | Authenticated { .. }), Error(msg)) => {
            println!("Connection state {:?} encountered error: {}", state, msg);
            NewState(Disconnecting { reason: DisconnectReason::Error(msg) })
        }

        // Disconnect complete
        (Disconnecting { reason }, _) => {
            println!("Disconnected, reason: {:?}", reason);
            NewState(Disconnected)
        }

        // Invalid transition
        (state, event) => {
            println!("Invalid event {:?} in state {:?}", event, state);
            Stay
        }
    }
}

fn run_state_machine() {
    let mut state = ConnectionState::Disconnected;
    let events = vec![
        ConnectionEvent::Connect { host: "example.com".to_string(), port: 443 },
        ConnectionEvent::ConnectionEstablished { socket_id: 12345 },
        ConnectionEvent::EncryptionEnabled,
        ConnectionEvent::Authenticate {
            user: "admin".to_string(),
            token: "secret".to_string()
        },
        ConnectionEvent::Disconnect,
    ];

    println!("Initial state: {:?}\n", state);

    for event in events {
        println!("Event: {:?}", event);
        match transition(state.clone(), event) {
            StateTransitionResult::NewState(new) => {
                state = new;
                println!("New state: {:?}\n", state);
            }
            StateTransitionResult::Stay => {
                println!("State unchanged: {:?}\n", state);
            }
            StateTransitionResult::Error(msg) => {
                println!("Error: {}\n", msg);
            }
        }
    }
}
```

### Example 3: Recursive Data Structure Processing

```rust
/// Binary Search Tree
#[derive(Debug)]
enum BST<T> {
    Empty,
    Node {
        value: T,
        left: Box<BST<T>>,
        right: Box<BST<T>>,
    },
}

impl<T: Ord + Clone> BST<T> {
    fn new() -> Self {
        BST::Empty
    }

    fn insert(&mut self, item: T) {
        match self {
            BST::Empty => {
                *self = BST::Node {
                    value: item,
                    left: Box::new(BST::Empty),
                    right: Box::new(BST::Empty),
                };
            }
            BST::Node { value, left, right } => {
                match item.cmp(value) {
                    std::cmp::Ordering::Less => left.insert(item),
                    std::cmp::Ordering::Greater => right.insert(item),
                    std::cmp::Ordering::Equal => {} // Ignore duplicates
                }
            }
        }
    }

    fn contains(&self, item: &T) -> bool {
        match self {
            BST::Empty => false,
            BST::Node { value, left, right } => match item.cmp(value) {
                std::cmp::Ordering::Less => left.contains(item),
                std::cmp::Ordering::Greater => right.contains(item),
                std::cmp::Ordering::Equal => true,
            },
        }
    }

    fn min(&self) -> Option<&T> {
        match self {
            BST::Empty => None,
            BST::Node { value, left, .. } => {
                match left.as_ref() {
                    BST::Empty => Some(value),
                    _ => left.min(),
                }
            }
        }
    }

    fn max(&self) -> Option<&T> {
        match self {
            BST::Empty => None,
            BST::Node { value, right, .. } => {
                match right.as_ref() {
                    BST::Empty => Some(value),
                    _ => right.max(),
                }
            }
        }
    }

    /// In-order traversal collecting elements
    fn inorder(&self) -> Vec<T> {
        match self {
            BST::Empty => vec![],
            BST::Node { value, left, right } => {
                let mut result = left.inorder();
                result.push(value.clone());
                result.extend(right.inorder());
                result
            }
        }
    }

    /// Find elements within a range
    fn range(&self, min: &T, max: &T) -> Vec<T> {
        match self {
            BST::Empty => vec![],
            BST::Node { value, left, right } => {
                let mut result = Vec::new();

                // If current value is greater than min, left subtree may have results
                if value > min {
                    result.extend(left.range(min, max));
                }

                // Check if current value is within range
                if value >= min && value <= max {
                    result.push(value.clone());
                }

                // If current value is less than max, right subtree may have results
                if value < max {
                    result.extend(right.range(min, max));
                }

                result
            }
        }
    }

    /// Tree height
    fn height(&self) -> usize {
        match self {
            BST::Empty => 0,
            BST::Node { left, right, .. } => {
                1 + left.height().max(right.height())
            }
        }
    }

    /// Check if balanced (height difference no more than 1)
    fn is_balanced(&self) -> bool {
        match self {
            BST::Empty => true,
            BST::Node { left, right, .. } => {
                let lh = left.height() as i32;
                let rh = right.height() as i32;
                (lh - rh).abs() <= 1 && left.is_balanced() && right.is_balanced()
            }
        }
    }
}

fn demonstrate_bst() {
    let mut tree = BST::new();

    for &value in &[5, 3, 7, 1, 4, 6, 8, 2] {
        tree.insert(value);
    }

    println!("In-order traversal: {:?}", tree.inorder());
    println!("Contains 4: {}", tree.contains(&4));
    println!("Contains 9: {}", tree.contains(&9));
    println!("Minimum: {:?}", tree.min());
    println!("Maximum: {:?}", tree.max());
    println!("Range [3, 6]: {:?}", tree.range(&3, &6));
    println!("Tree height: {}", tree.height());
    println!("Is balanced: {}", tree.is_balanced());
}
```

## Best Practices

### Prefer Exhaustive Matching

```rust
enum Status {
    Active,
    Inactive,
    Pending,
    Suspended,
}

// Good practice: explicitly handle all cases
fn handle_status_good(status: Status) -> &'static str {
    match status {
        Status::Active => "active",
        Status::Inactive => "inactive",
        Status::Pending => "pending",
        Status::Suspended => "suspended",
    }
}

// Avoid: wildcard may hide new variants
fn handle_status_bad(status: Status) -> &'static str {
    match status {
        Status::Active => "active",
        _ => "other",  // New statuses will be silently ignored
    }
}

// If wildcard is truly needed, use #[non_exhaustive] to express intent
#[non_exhaustive]
enum ExtensibleStatus {
    Active,
    Inactive,
}
```

### Use if let and let-else Appropriately

```rust
// Suitable for if let: only care about one case
fn process_if_single(opt: Option<i32>) {
    if let Some(value) = opt {
        println!("Processing value: {}", value);
    }
}

// Suitable for let-else: need early return
fn parse_config(input: &str) -> Result<Config, &'static str> {
    let Some(name) = input.split('=').next() else {
        return Err("Missing name");
    };

    let Some(value) = input.split('=').nth(1) else {
        return Err("Missing value");
    };

    Ok(Config {
        name: name.to_string(),
        value: value.to_string()
    })
}

struct Config {
    name: String,
    value: String,
}
```

### Avoid Overly Nested Patterns

```rust
// Avoid: deeply nested is hard to read
fn complex_bad(data: Option<Result<Vec<i32>, String>>) {
    match data {
        Some(Ok(vec)) => match vec.as_slice() {
            [first, rest @ ..] if *first > 0 => {
                println!("Starts with positive: {}", first);
            }
            _ => {}
        },
        _ => {}
    }
}

// Good practice: break into multiple steps
fn complex_good(data: Option<Result<Vec<i32>, String>>) {
    let Some(Ok(vec)) = data else { return };
    let [first, rest @ ..] = vec.as_slice() else { return };

    if *first > 0 {
        println!("Starts with positive: {}", first);
    }
}
```

### Use @ Bindings for Debugging and Logging

```rust
#[derive(Debug)]
enum Event {
    Critical { id: u32, message: String },
    Normal { id: u32, data: Vec<u8> },
    Unknown,
}

fn handle_critical(evt: &Event) {
    println!("Handling critical event: {:?}", evt);
}

fn handle_normal(id: u32, data: Vec<u8>) {
    println!("Handling normal event: {} with {} bytes", id, data.len());
}

fn process_with_logging(event: Event) {
    match event {
        // Capture entire value for logging
        evt @ Event::Critical { .. } => {
            println!("Processing critical event: {:?}", evt);
            handle_critical(&evt);
        }
        // Normal processing
        Event::Normal { id, data } => {
            handle_normal(id, data);
        }
        // Capture unknown events
        unknown @ _ => {
            println!("Unknown event type: {:?}", unknown);
        }
    }
}
```

### Use matches! Macro to Simplify Boolean Checks

```rust
enum Permission {
    Admin,
    User { level: u8 },
    Guest,
}

// Use matches! to simplify checks
fn is_privileged(perm: &Permission) -> bool {
    matches!(perm, Permission::Admin | Permission::User { level: 5.. })
}

// Use in iterators
fn count_admins(perms: &[Permission]) -> usize {
    perms.iter().filter(|p| matches!(p, Permission::Admin)).count()
}

// Combined with guards
fn has_write_access(perm: &Permission, resource: &str) -> bool {
    matches!(
        perm,
        Permission::Admin | Permission::User { level } if *level >= 3
    ) && !resource.starts_with("readonly/")
}
```

## Common Pitfalls

### Pitfall 1: Ownership Issues in Guards

```rust
struct Data {
    value: String,
}

fn problematic_guard(data: Option<Data>) {
    // Error: value moved in guard
    // match data {
    //     Some(d) if d.value.len() > 5 => {
    //         // d has been partially moved
    //         println!("{}", d.value);  // Error!
    //     }
    //     _ => {}
    // }

    // Correct: use reference
    match &data {
        Some(d) if d.value.len() > 5 => {
            println!("{}", d.value);
        }
        _ => {}
    }
}
```

### Pitfall 2: Inconsistent Bindings in Or Patterns

```rust
enum Value {
    Int(i32),
    Float(f64),
    Text(String),
}

fn process_value(v: Value) {
    // Error: bindings in or pattern have inconsistent types
    // match v {
    //     Value::Int(n) | Value::Float(n) => {  // n has different types
    //         println!("{}", n);
    //     }
    //     _ => {}
    // }

    // Correct: handle separately or convert types
    match v {
        Value::Int(n) => println!("Integer: {}", n),
        Value::Float(n) => println!("Float: {}", n),
        Value::Text(s) => println!("Text: {}", s),
    }
}
```

### Pitfall 3: Ambiguity in Slice Patterns

```rust
fn ambiguous_slice(data: &[i32]) {
    // Possible ambiguity: these patterns overlap
    match data {
        [x] => println!("Single element"),
        [_, ..] => println!("At least one"),  // Overlaps with above
        [] => println!("Empty"),
    }

    // Correct: ensure patterns don't overlap or use correct order
    match data {
        [] => println!("Empty"),
        [x] => println!("Single element: {}", x),
        [first, rest @ ..] => println!("Multiple elements, first: {}", first),
    }
}
```

### Pitfall 4: Forgetting @ Binding Scope

```rust
fn binding_scope(opt: Option<i32>) {
    match opt {
        // n is only valid in this branch
        Some(n @ 1..=10) => {
            println!("Small number: {}", n);
        }
        Some(n) => {
            // This also defines n, but unrelated to the above n
            println!("Other: {}", n);
        }
        None => {
            // n doesn't exist here
            // println!("{}", n);  // Error!
        }
    }
}
```

### Pitfall 5: Confusion Between ref and mut

```rust
fn ref_mut_confusion() {
    let mut data = (String::from("hello"), 42);

    // ref creates immutable reference
    let (ref s, n) = data;
    // s.push_str(" world");  // Error: s is immutable reference

    // ref mut creates mutable reference
    let (ref mut s, ref mut n) = data;
    s.push_str(" world");
    *n += 1;

    println!("{}, {}", data.0, data.1);
}
```

## Performance Considerations

### Match Compilation Optimizations

The Rust compiler performs extensive optimizations on match expressions:

```rust
enum Direction {
    North,
    South,
    East,
    West,
}

fn direction_to_angle(dir: Direction) -> i32 {
    // Compiler optimizes this to a jump table
    match dir {
        Direction::North => 0,
        Direction::South => 180,
        Direction::East => 90,
        Direction::West => 270,
    }
}

// For enums with consecutive values, compiler generates direct computation
enum SmallNumber {
    Zero = 0,
    One = 1,
    Two = 2,
    Three = 3,
}

fn double_number(n: SmallNumber) -> i32 {
    // May be optimized to: n as i32 * 2
    match n {
        SmallNumber::Zero => 0,
        SmallNumber::One => 2,
        SmallNumber::Two => 4,
        SmallNumber::Three => 6,
    }
}
```

### Avoid Unnecessary Cloning

```rust
struct LargeData {
    buffer: Vec<u8>,
    metadata: String,
}

// Inefficient: cloning large data
fn process_inefficient(data: LargeData) -> String {
    match data {
        LargeData { metadata, .. } => metadata.clone(),  // Unnecessary clone
    }
}

// Efficient: use destructuring to move
fn process_efficient(data: LargeData) -> String {
    match data {
        LargeData { metadata, .. } => metadata,  // Direct move
    }
}

// Efficient: use reference
fn process_ref(data: &LargeData) -> &str {
    match data {
        LargeData { metadata, .. } => metadata,  // Return reference
    }
}
```

### Performance Impact of Guards

```rust
// Guards are evaluated on each match attempt
fn expensive_guard(data: &[i32]) -> i32 {
    match data {
        // expensive_check is called on each match
        [x, ..] if expensive_check(x) => *x,
        [_, rest @ ..] => rest.iter().sum(),
        [] => 0,
    }
}

fn expensive_check(x: &i32) -> bool {
    // Simulate expensive check
    std::thread::sleep(std::time::Duration::from_millis(1));
    *x > 0
}

// Optimization: pre-compute or restructure logic
fn optimized(data: &[i32]) -> i32 {
    match data.first() {
        Some(x) if expensive_check(x) => *x,
        _ => data.iter().skip(1).sum(),
    }
}
```

### Memory Considerations for Slice Patterns

```rust
// Slice patterns don't allocate new memory
fn slice_pattern_memory(data: &[i32]) {
    match data {
        // rest is a slice reference, doesn't copy data
        [first, rest @ ..] => {
            println!("First: {}, rest length: {}", first, rest.len());
        }
        [] => {}
    }
}

// But converting to Vec allocates
fn slice_to_vec(data: &[i32]) -> Vec<i32> {
    match data {
        [_, rest @ ..] => rest.to_vec(),  // Allocates new Vec
        [] => vec![],
    }
}
```

## Real-World Scenarios

### Scenario 1: HTTP Request Routing

```rust
use std::collections::HashMap;

#[derive(Debug)]
enum HttpMethod {
    Get,
    Post,
    Put,
    Delete,
    Patch,
}

#[derive(Debug)]
struct Request {
    method: HttpMethod,
    path: String,
    query: HashMap<String, String>,
    body: Option<String>,
}

#[derive(Debug)]
enum Response {
    Ok { body: String, content_type: String },
    Created { id: String, location: String },
    NotFound { message: String },
    BadRequest { errors: Vec<String> },
    MethodNotAllowed,
    InternalError,
}

fn route_request(req: Request) -> Response {
    let path_segments: Vec<&str> = req.path.trim_matches('/').split('/').collect();

    match (&req.method, path_segments.as_slice()) {
        // GET /
        (HttpMethod::Get, [""]) | (HttpMethod::Get, []) => {
            Response::Ok {
                body: "Welcome to API".to_string(),
                content_type: "text/plain".to_string(),
            }
        }

        // GET /users
        (HttpMethod::Get, ["users"]) => {
            let limit = req.query.get("limit")
                .and_then(|s| s.parse().ok())
                .unwrap_or(10);
            Response::Ok {
                body: format!("List users (limit: {})", limit),
                content_type: "application/json".to_string(),
            }
        }

        // GET /users/:id
        (HttpMethod::Get, ["users", id]) => {
            Response::Ok {
                body: format!("User {}", id),
                content_type: "application/json".to_string(),
            }
        }

        // POST /users
        (HttpMethod::Post, ["users"]) => {
            match &req.body {
                Some(body) if !body.is_empty() => Response::Created {
                    id: "new-user-id".to_string(),
                    location: "/users/new-user-id".to_string(),
                },
                _ => Response::BadRequest {
                    errors: vec!["Body is required".to_string()],
                },
            }
        }

        // PUT /users/:id
        (HttpMethod::Put | HttpMethod::Patch, ["users", id]) => {
            match &req.body {
                Some(_) => Response::Ok {
                    body: format!("Updated user {}", id),
                    content_type: "application/json".to_string(),
                },
                None => Response::BadRequest {
                    errors: vec!["Body is required".to_string()],
                },
            }
        }

        // DELETE /users/:id
        (HttpMethod::Delete, ["users", id]) => {
            Response::Ok {
                body: format!("Deleted user {}", id),
                content_type: "application/json".to_string(),
            }
        }

        // Nested resource: GET /users/:id/posts
        (HttpMethod::Get, ["users", user_id, "posts"]) => {
            Response::Ok {
                body: format!("Posts for user {}", user_id),
                content_type: "application/json".to_string(),
            }
        }

        // Nested resource: GET /users/:id/posts/:post_id
        (HttpMethod::Get, ["users", user_id, "posts", post_id]) => {
            Response::Ok {
                body: format!("Post {} by user {}", post_id, user_id),
                content_type: "application/json".to_string(),
            }
        }

        // Path exists but method not allowed
        (_, ["users", ..]) => Response::MethodNotAllowed,

        // 404
        _ => Response::NotFound {
            message: format!("Path not found: {}", req.path),
        },
    }
}
```

### Scenario 2: Compiler Lexical Analysis

```rust
#[derive(Debug, Clone, PartialEq)]
enum Token {
    // Literals
    Integer(i64),
    Float(f64),
    String(String),
    Bool(bool),

    // Identifiers and keywords
    Identifier(String),
    Keyword(Keyword),

    // Operators
    Plus, Minus, Star, Slash, Percent,
    Eq, Ne, Lt, Le, Gt, Ge,
    And, Or, Not,
    Assign,

    // Delimiters
    LParen, RParen,
    LBrace, RBrace,
    LBracket, RBracket,
    Comma, Semicolon, Colon,
    Arrow,

    // Special
    Eof,
    Error(String),
}

#[derive(Debug, Clone, PartialEq)]
enum Keyword {
    Let, Mut, Fn, If, Else, While, For, Return,
    Struct, Enum, Impl, Trait, Pub, Use,
    True, False, None,
}

struct Lexer<'a> {
    input: &'a str,
    pos: usize,
}

impl<'a> Lexer<'a> {
    fn new(input: &'a str) -> Self {
        Self { input, pos: 0 }
    }

    fn peek(&self) -> Option<char> {
        self.input[self.pos..].chars().next()
    }

    fn peek_next(&self) -> Option<char> {
        self.input[self.pos..].chars().nth(1)
    }

    fn advance(&mut self) -> Option<char> {
        let c = self.peek()?;
        self.pos += c.len_utf8();
        Some(c)
    }

    fn skip_whitespace(&mut self) {
        while matches!(self.peek(), Some(c) if c.is_whitespace()) {
            self.advance();
        }
    }

    fn next_token(&mut self) -> Token {
        self.skip_whitespace();

        match self.peek() {
            None => Token::Eof,

            // Numbers
            Some(c @ '0'..='9') => self.read_number(),

            // Identifiers or keywords
            Some(c) if c.is_alphabetic() || c == '_' => self.read_identifier(),

            // Strings
            Some('"') => self.read_string(),

            // Two-character operators
            Some('=') => match self.peek_next() {
                Some('=') => { self.advance(); self.advance(); Token::Eq }
                Some('>') => { self.advance(); self.advance(); Token::Arrow }
                _ => { self.advance(); Token::Assign }
            },
            Some('!') => match self.peek_next() {
                Some('=') => { self.advance(); self.advance(); Token::Ne }
                _ => { self.advance(); Token::Not }
            },
            Some('<') => match self.peek_next() {
                Some('=') => { self.advance(); self.advance(); Token::Le }
                _ => { self.advance(); Token::Lt }
            },
            Some('>') => match self.peek_next() {
                Some('=') => { self.advance(); self.advance(); Token::Ge }
                _ => { self.advance(); Token::Gt }
            },
            Some('&') => match self.peek_next() {
                Some('&') => { self.advance(); self.advance(); Token::And }
                _ => { self.advance(); Token::Error("Expected &&".to_string()) }
            },
            Some('|') => match self.peek_next() {
                Some('|') => { self.advance(); self.advance(); Token::Or }
                _ => { self.advance(); Token::Error("Expected ||".to_string()) }
            },
            Some('-') => match self.peek_next() {
                Some('>') => { self.advance(); self.advance(); Token::Arrow }
                _ => { self.advance(); Token::Minus }
            },

            // Single-character operators
            Some('+') => { self.advance(); Token::Plus }
            Some('*') => { self.advance(); Token::Star }
            Some('/') => { self.advance(); Token::Slash }
            Some('%') => { self.advance(); Token::Percent }

            // Delimiters
            Some('(') => { self.advance(); Token::LParen }
            Some(')') => { self.advance(); Token::RParen }
            Some('{') => { self.advance(); Token::LBrace }
            Some('}') => { self.advance(); Token::RBrace }
            Some('[') => { self.advance(); Token::LBracket }
            Some(']') => { self.advance(); Token::RBracket }
            Some(',') => { self.advance(); Token::Comma }
            Some(';') => { self.advance(); Token::Semicolon }
            Some(':') => { self.advance(); Token::Colon }

            // Unknown character
            Some(c) => {
                self.advance();
                Token::Error(format!("Unexpected character: {}", c))
            }
        }
    }

    fn read_number(&mut self) -> Token {
        let start = self.pos;
        let mut has_dot = false;

        while let Some(c) = self.peek() {
            match c {
                '0'..='9' => { self.advance(); }
                '.' if !has_dot => {
                    has_dot = true;
                    self.advance();
                }
                _ => break,
            }
        }

        let num_str = &self.input[start..self.pos];
        if has_dot {
            num_str.parse().map(Token::Float)
                .unwrap_or_else(|_| Token::Error("Invalid float".to_string()))
        } else {
            num_str.parse().map(Token::Integer)
                .unwrap_or_else(|_| Token::Error("Invalid integer".to_string()))
        }
    }

    fn read_identifier(&mut self) -> Token {
        let start = self.pos;

        while let Some(c) = self.peek() {
            if c.is_alphanumeric() || c == '_' {
                self.advance();
            } else {
                break;
            }
        }

        let ident = &self.input[start..self.pos];

        // Keyword check
        match ident {
            "let" => Token::Keyword(Keyword::Let),
            "mut" => Token::Keyword(Keyword::Mut),
            "fn" => Token::Keyword(Keyword::Fn),
            "if" => Token::Keyword(Keyword::If),
            "else" => Token::Keyword(Keyword::Else),
            "while" => Token::Keyword(Keyword::While),
            "for" => Token::Keyword(Keyword::For),
            "return" => Token::Keyword(Keyword::Return),
            "struct" => Token::Keyword(Keyword::Struct),
            "enum" => Token::Keyword(Keyword::Enum),
            "impl" => Token::Keyword(Keyword::Impl),
            "trait" => Token::Keyword(Keyword::Trait),
            "pub" => Token::Keyword(Keyword::Pub),
            "use" => Token::Keyword(Keyword::Use),
            "true" => Token::Bool(true),
            "false" => Token::Bool(false),
            _ => Token::Identifier(ident.to_string()),
        }
    }

    fn read_string(&mut self) -> Token {
        self.advance(); // consume opening "
        let start = self.pos;

        while let Some(c) = self.peek() {
            match c {
                '"' => {
                    let s = self.input[start..self.pos].to_string();
                    self.advance();
                    return Token::String(s);
                }
                '\\' => {
                    self.advance();
                    self.advance(); // skip escaped char
                }
                _ => { self.advance(); }
            }
        }

        Token::Error("Unterminated string".to_string())
    }

    fn tokenize(&mut self) -> Vec<Token> {
        let mut tokens = Vec::new();
        loop {
            let token = self.next_token();
            let is_eof = matches!(token, Token::Eof);
            tokens.push(token);
            if is_eof { break; }
        }
        tokens
    }
}

fn demonstrate_lexer() {
    let code = r#"
        fn calculate(x: i32, y: i32) -> i32 {
            let result = x + y * 2;
            if result > 100 {
                return 100;
            }
            result
        }
    "#;

    let mut lexer = Lexer::new(code);
    let tokens = lexer.tokenize();

    for token in tokens {
        println!("{:?}", token);
    }
}
```

### Scenario 3: Configuration File Parsing

```rust
use std::collections::HashMap;

#[derive(Debug, Clone)]
enum ConfigValue {
    String(String),
    Integer(i64),
    Float(f64),
    Boolean(bool),
    Array(Vec<ConfigValue>),
    Object(HashMap<String, ConfigValue>),
    Null,
}

impl ConfigValue {
    fn as_str(&self) -> Option<&str> {
        match self {
            ConfigValue::String(s) => Some(s),
            _ => None,
        }
    }

    fn as_int(&self) -> Option<i64> {
        match self {
            ConfigValue::Integer(n) => Some(*n),
            ConfigValue::Float(f) => Some(*f as i64),
            _ => None,
        }
    }

    fn as_bool(&self) -> Option<bool> {
        match self {
            ConfigValue::Boolean(b) => Some(*b),
            _ => None,
        }
    }

    fn get(&self, key: &str) -> Option<&ConfigValue> {
        match self {
            ConfigValue::Object(map) => map.get(key),
            _ => None,
        }
    }

    fn index(&self, idx: usize) -> Option<&ConfigValue> {
        match self {
            ConfigValue::Array(arr) => arr.get(idx),
            _ => None,
        }
    }
}

/// Access nested config using path
fn get_path<'a>(config: &'a ConfigValue, path: &[&str]) -> Option<&'a ConfigValue> {
    match (config, path) {
        (value, []) => Some(value),
        (ConfigValue::Object(map), [key, rest @ ..]) => {
            map.get(*key).and_then(|v| get_path(v, rest))
        }
        (ConfigValue::Array(arr), [index, rest @ ..]) => {
            index.parse::<usize>().ok()
                .and_then(|i| arr.get(i))
                .and_then(|v| get_path(v, rest))
        }
        _ => None,
    }
}

/// Validate configuration structure
fn validate_config(config: &ConfigValue) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    // Check required fields
    let required_fields = ["name", "version", "server"];
    for field in required_fields {
        if config.get(field).is_none() {
            errors.push(format!("Missing required field: {}", field));
        }
    }

    // Validate server configuration
    if let Some(server) = config.get("server") {
        match server {
            ConfigValue::Object(map) => {
                // Check host
                match map.get("host") {
                    Some(ConfigValue::String(host)) if !host.is_empty() => {}
                    Some(ConfigValue::String(_)) => {
                        errors.push("server.host cannot be empty".to_string());
                    }
                    None => errors.push("Missing server.host".to_string()),
                    _ => errors.push("server.host must be a string".to_string()),
                }

                // Check port
                match map.get("port") {
                    Some(ConfigValue::Integer(port @ 1..=65535)) => {}
                    Some(ConfigValue::Integer(_)) => {
                        errors.push("server.port must be in range 1-65535".to_string());
                    }
                    None => errors.push("Missing server.port".to_string()),
                    _ => errors.push("server.port must be an integer".to_string()),
                }
            }
            _ => errors.push("server must be an object".to_string()),
        }
    }

    // Validate features array (if present)
    if let Some(features) = config.get("features") {
        match features {
            ConfigValue::Array(arr) => {
                for (i, feature) in arr.iter().enumerate() {
                    match feature {
                        ConfigValue::String(s) if s.chars().all(|c| c.is_alphanumeric() || c == '_') => {}
                        ConfigValue::String(_) => {
                            errors.push(format!("features[{}] contains invalid characters", i));
                        }
                        _ => {
                            errors.push(format!("features[{}] must be a string", i));
                        }
                    }
                }
            }
            _ => errors.push("features must be an array".to_string()),
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

fn demonstrate_config() {
    let mut server = HashMap::new();
    server.insert("host".to_string(), ConfigValue::String("localhost".to_string()));
    server.insert("port".to_string(), ConfigValue::Integer(8080));
    server.insert("ssl".to_string(), ConfigValue::Boolean(true));

    let mut config = HashMap::new();
    config.insert("name".to_string(), ConfigValue::String("my-app".to_string()));
    config.insert("version".to_string(), ConfigValue::String("1.0.0".to_string()));
    config.insert("server".to_string(), ConfigValue::Object(server));
    config.insert("features".to_string(), ConfigValue::Array(vec![
        ConfigValue::String("auth".to_string()),
        ConfigValue::String("logging".to_string()),
    ]));

    let config = ConfigValue::Object(config);

    // Path access
    if let Some(port) = get_path(&config, &["server", "port"]) {
        println!("Server port: {:?}", port);
    }

    // Validation
    match validate_config(&config) {
        Ok(()) => println!("Configuration is valid"),
        Err(errors) => {
            for e in errors {
                println!("Validation error: {}", e);
            }
        }
    }
}
```

## Interview Key Points

### Question 1: Explain Rust's Pattern Matching Exhaustiveness Checking

**Key Points**:
- The compiler uses a usefulness matrix algorithm to check if all possible values are covered
- For enums, checks if all variants have corresponding match branches
- Wildcard `_` can match any uncovered cases
- The `#[non_exhaustive]` attribute can mark enums that may add variants in the future
- Exhaustiveness checking is done at compile time and doesn't affect runtime performance

### Question 2: Difference Between ref and & in Pattern Matching

**Key Points**:
```rust
let value = String::from("hello");

// & is used to match references
let reference = &value;
match reference {
    s => println!("{}", s),  // s is &String
}

// ref is used to create references during matching
match value {
    ref s => println!("{}", s),  // s is &String, value is not moved
}
```

- `&` is used to destructure existing references
- `ref` is used to create references during destructuring
- `ref` allows borrowing instead of moving when matching value types

### Question 3: What are @ Bindings Used For? When to Use Them?

**Key Points**:
- Bind entire values or parts of values to variables while testing patterns
- Used in scenarios that need both condition checking and value usage
- Commonly used for range checking, logging, debugging

```rust
match value {
    n @ 1..=10 => println!("Small number: {}", n),
    all @ (x, y, z) => println!("Tuple {:?} components: {}, {}, {}", all, x, y, z),
}
```

### Question 4: Performance Impact of Pattern Guards

**Key Points**:
- Guards are evaluated on each match attempt
- If guards contain expensive computations, performance is affected
- Recommend extracting expensive computations before the match
- Compiler cannot optimize guards across branches

### Question 5: How to Handle Nested Option Matching?

**Key Points**:
```rust
let nested: Option<Option<i32>> = Some(Some(42));

// Method 1: Nested match
match nested {
    Some(Some(n)) => println!("{}", n),
    Some(None) => println!("Inner is None"),
    None => println!("Outer is None"),
}

// Method 2: flatten
let flattened = nested.flatten();

// Method 3: and_then
let result = nested.and_then(|inner| inner);
```

## Further Reading

### Official Documentation

- [The Rust Programming Language - Patterns](https://doc.rust-lang.org/book/ch18-00-patterns.html)
- [Rust Reference - Patterns](https://doc.rust-lang.org/reference/patterns.html)
- [Rust RFC 2005 - Match Ergonomics](https://rust-lang.github.io/rfcs/2005-match-ergonomics.html)

### Classic Books

- "Programming Rust, 2nd Edition" Chapter 10 - Detailed explanation of patterns and matching
- "Rust for Rustaceans" Chapter 3 - Advanced pattern matching techniques
- "Zero To Production In Rust" - Practical pattern matching applications

### Quality Articles

- [Rust Pattern Matching Compilation](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_mir_build/build/matches/index.html) - Compiler implementation details
- [Advanced Patterns in Rust](https://www.lurklurk.org/effective-rust/match.html) - Effective Rust series
- [Pattern Matching Tips](https://rust-unofficial.github.io/patterns/idioms/deref.html) - Rust Design Patterns

### Related RFCs

- RFC 2005: Match Ergonomics
- RFC 3137: Or Patterns syntax unification
- RFC 2909: let-else syntax

---

Pattern matching is a core pillar of Rust's type safety and expressiveness. Deeply mastering advanced pattern matching techniques, including deep destructuring, pattern guards, @ bindings, or patterns, and ref/ref mut, will enable you to write more elegant, safe, and efficient Rust code. Understanding how the compiler optimizes pattern matching and appropriately applying these techniques in real projects is an essential path to becoming an advanced Rust developer.
