---
title: Rust Pattern Matching
description: Complete guide to Rust pattern matching including match, if let, pattern syntax and destructuring
track: rust
section: ownership-borrowing
difficulty: intermediate
tags:
  - Rust
  - pattern matching
  - match
  - destructuring
status: imported
origin: old/src/content/docs/rust/pattern-matching.en.md
divergence: 0.2
issues: []
legacy:
  category: Rust
  subcategory: Core Concepts
  order: 16
  lastUpdated: 2026-01-07
---

Pattern matching is one of Rust's most powerful and expressive features. It allows you to compare values against patterns and execute code based on which pattern matches. Pattern matching in Rust goes far beyond simple switch statements found in other languages, enabling sophisticated destructuring, guard clauses, and exhaustive checking that catches bugs at compile time.

## Introduction to Pattern Matching

Pattern matching allows you to test a value against a series of patterns and execute code when a pattern matches. Patterns can be simple literals, variable names, wildcards, or complex structures that extract data from composite types.

Key benefits of Rust's pattern matching:

- **Exhaustiveness checking**: The compiler ensures all possible cases are handled
- **Destructuring**: Extract values from complex data structures in one step
- **Concise syntax**: Express complex logic clearly and succinctly
- **Type safety**: Patterns are type-checked at compile time

```rust
fn main() {
    let number = 7;

    match number {
        1 => println!("One"),
        2 => println!("Two"),
        3 => println!("Three"),
        4..=6 => println!("Four through Six"),
        _ => println!("Something else"),
    }
}
```

## The match Expression

The `match` expression is the primary tool for pattern matching in Rust. It compares a value against a series of patterns and executes the code associated with the first matching pattern.

### Basic match Syntax

```rust
fn main() {
    let coin = Coin::Quarter;

    let value_in_cents = match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    };

    println!("Value: {} cents", value_in_cents);
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}
```

### match Arms

Each pattern and its associated code form a "match arm". The syntax is `pattern => expression`:

```rust
fn main() {
    let x = 5;

    match x {
        1 => println!("one"),
        2 => println!("two"),
        3 => println!("three"),
        4 | 5 => println!("four or five"),  // Multiple patterns with |
        _ => println!("anything else"),      // Catch-all pattern
    }
}
```

### match is an Expression

Since `match` is an expression, it returns a value:

```rust
fn main() {
    let boolean = true;

    let binary = match boolean {
        false => 0,
        true => 1,
    };

    println!("Binary value: {}", binary);
}
```

### Exhaustiveness

Rust requires `match` expressions to be exhaustive, meaning all possible values must be covered:

```rust
enum Direction {
    North,
    South,
    East,
    West,
}

fn describe_direction(dir: Direction) -> &'static str {
    match dir {
        Direction::North => "Going north",
        Direction::South => "Going south",
        Direction::East => "Going east",
        Direction::West => "Going west",
        // No _ needed because all variants are covered
    }
}

fn main() {
    let dir = Direction::North;
    println!("{}", describe_direction(dir));
}
```

If you forget a variant, the compiler will produce an error:

```rust
// This won't compile!
fn incomplete_match(dir: Direction) -> &'static str {
    match dir {
        Direction::North => "Going north",
        Direction::South => "Going south",
        // ERROR: non-exhaustive patterns: `East` and `West` not covered
    }
}
```

### The Wildcard Pattern

The underscore `_` matches any value and is used as a catch-all:

```rust
fn main() {
    let number = 42;

    match number {
        1 => println!("One"),
        2 => println!("Two"),
        3 => println!("Three"),
        _ => println!("Not one, two, or three"),
    }
}
```

### Matching with Code Blocks

When you need multiple statements, use curly braces:

```rust
fn main() {
    let number = 13;

    let description = match number {
        1 => "one".to_string(),
        n if n < 0 => {
            println!("Processing negative number");
            format!("negative: {}", n)
        }
        n if n > 100 => {
            println!("Processing large number");
            let category = "large";
            format!("{}: {}", category, n)
        }
        n => format!("other: {}", n),
    };

    println!("{}", description);
}
```

## if let and while let

When you only care about one pattern, `if let` and `while let` provide more concise alternatives to `match`.

### if let

`if let` is syntactic sugar for a `match` that only handles one pattern:

```rust
fn main() {
    let config_max = Some(3u8);

    // Using match
    match config_max {
        Some(max) => println!("The maximum is configured to be {}", max),
        _ => (),
    }

    // Using if let - more concise
    if let Some(max) = config_max {
        println!("The maximum is configured to be {}", max);
    }
}
```

### if let with else

You can include an `else` branch to handle non-matching cases:

```rust
fn main() {
    let coin = Coin::Penny;

    // Using match
    let mut count = 0;
    match coin {
        Coin::Quarter => println!("A quarter!"),
        _ => count += 1,
    }

    // Using if let with else
    let mut count = 0;
    if let Coin::Quarter = coin {
        println!("A quarter!");
    } else {
        count += 1;
    }

    println!("Count: {}", count);
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}
```

### if let chains

You can chain multiple `if let` expressions:

```rust
fn main() {
    let optional_number = Some(42);
    let optional_name = Some("Alice");

    if let Some(number) = optional_number {
        if let Some(name) = optional_name {
            println!("{} has number {}", name, number);
        }
    }
}
```

### while let

`while let` continues looping as long as the pattern matches:

```rust
fn main() {
    let mut stack = vec![1, 2, 3, 4, 5];

    while let Some(top) = stack.pop() {
        println!("Popped: {}", top);
    }

    println!("Stack is empty!");
}
```

This is particularly useful with iterators and channels:

```rust
fn main() {
    let mut optional = Some(0);

    while let Some(i) = optional {
        if i > 5 {
            println!("Reached limit, stopping");
            optional = None;
        } else {
            println!("i is {}", i);
            optional = Some(i + 1);
        }
    }
}
```

### let else

The `let else` construct allows early returns when a pattern does not match:

```rust
fn get_value(opt: Option<i32>) -> i32 {
    let Some(value) = opt else {
        println!("No value provided, using default");
        return 0;
    };

    value * 2
}

fn main() {
    println!("Result: {}", get_value(Some(21)));  // Result: 42
    println!("Result: {}", get_value(None));       // Result: 0
}
```

## Pattern Syntax

Rust provides a rich pattern syntax for matching different kinds of values.

### Literal Patterns

Match against specific values:

```rust
fn main() {
    let x = 1;

    match x {
        1 => println!("one"),
        2 => println!("two"),
        3 => println!("three"),
        _ => println!("anything"),
    }

    let y = 'c';

    match y {
        'a' => println!("first letter"),
        'z' => println!("last letter"),
        _ => println!("something else"),
    }
}
```

### Named Variables

Variables in patterns create new bindings:

```rust
fn main() {
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        Some(y) => println!("Matched, y = {}", y),  // New 'y' shadows outer 'y'
        _ => println!("Default case, x = {:?}", x),
    }

    println!("at the end: x = {:?}, y = {}", x, y);  // Original 'y' is still 10
}
```

### Multiple Patterns with |

Match multiple patterns with the `|` operator:

```rust
fn main() {
    let x = 1;

    match x {
        1 | 2 => println!("one or two"),
        3 => println!("three"),
        _ => println!("anything"),
    }
}
```

### Range Patterns

Match a range of values with `..=`:

```rust
fn main() {
    let x = 5;

    match x {
        1..=5 => println!("one through five"),
        _ => println!("something else"),
    }

    let c = 'c';

    match c {
        'a'..='j' => println!("early ASCII letter"),
        'k'..='z' => println!("late ASCII letter"),
        _ => println!("something else"),
    }
}
```

### Ignoring Values with _

Ignore values entirely:

```rust
fn main() {
    let numbers = (1, 2, 3, 4, 5);

    match numbers {
        (first, _, third, _, fifth) => {
            println!("Some numbers: {}, {}, {}", first, third, fifth);
        }
    }
}
```

### Ignoring Remaining Parts with ..

Ignore multiple values at once:

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (first, .., last) => {
            println!("First: {}, Last: {}", first, last);
        }
    }

    let point = Point { x: 0, y: 0, z: 0 };

    match point {
        Point { x, .. } => println!("x is {}", x),
    }
}

struct Point {
    x: i32,
    y: i32,
    z: i32,
}
```

### Reference Patterns

Match references with `&` and `ref`:

```rust
fn main() {
    let reference = &4;

    // Using & in pattern to dereference
    match reference {
        &val => println!("Got a value via destructuring: {}", val),
    }

    // Using * to dereference before matching
    match *reference {
        val => println!("Got a value via dereferencing: {}", val),
    }

    // Creating a reference with ref
    let value = 5;

    match value {
        ref r => println!("Got a reference to a value: {:?}", r),
    }

    // Mutable reference
    let mut mut_value = 6;

    match mut_value {
        ref mut m => {
            *m += 10;
            println!("We added 10. `mut_value`: {}", m);
        }
    }
}
```

## Destructuring

Destructuring allows you to break apart complex types and extract their components.

### Destructuring Structs

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    // Full destructuring
    let Point { x: a, y: b } = p;
    println!("a: {}, b: {}", a, b);

    // Shorthand when variable names match field names
    let Point { x, y } = p;
    println!("x: {}, y: {}", x, y);

    // Partial destructuring
    let Point { x, .. } = p;
    println!("x: {}", x);
}
```

### Destructuring Structs in match

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    match p {
        Point { x: 0, y } => println!("On the y axis at {}", y),
        Point { x, y: 0 } => println!("On the x axis at {}", x),
        Point { x, y } => println!("At ({}, {})", x, y),
    }
}
```

### Destructuring Enums

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {
    let msg = Message::ChangeColor(0, 160, 255);

    match msg {
        Message::Quit => {
            println!("Quit variant has no data to destructure.");
        }
        Message::Move { x, y } => {
            println!("Move to x: {}, y: {}", x, y);
        }
        Message::Write(text) => {
            println!("Text message: {}", text);
        }
        Message::ChangeColor(r, g, b) => {
            println!("Change color to RGB({}, {}, {})", r, g, b);
        }
    }
}
```

### Destructuring Nested Structures

```rust
enum Color {
    Rgb(i32, i32, i32),
    Hsv(i32, i32, i32),
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(Color),
}

fn main() {
    let msg = Message::ChangeColor(Color::Hsv(0, 160, 255));

    match msg {
        Message::ChangeColor(Color::Rgb(r, g, b)) => {
            println!("Change color to RGB({}, {}, {})", r, g, b);
        }
        Message::ChangeColor(Color::Hsv(h, s, v)) => {
            println!("Change color to HSV({}, {}, {})", h, s, v);
        }
        _ => (),
    }
}
```

### Destructuring Tuples

```rust
fn main() {
    let tuple = (1, "hello", 4.5);

    let (a, b, c) = tuple;
    println!("a: {}, b: {}, c: {}", a, b, c);

    // In match
    match tuple {
        (1, _, _) => println!("First element is 1"),
        (_, "hello", _) => println!("Second element is 'hello'"),
        _ => println!("No match"),
    }

    // Nested tuples
    let nested = ((1, 2), (3, 4));

    match nested {
        ((1, a), (b, 4)) => println!("Matched with a={}, b={}", a, b),
        _ => println!("No match"),
    }
}
```

### Destructuring Arrays and Slices

```rust
fn main() {
    let arr = [1, 2, 3];

    // Array destructuring
    let [a, b, c] = arr;
    println!("a: {}, b: {}, c: {}", a, b, c);

    // Slice patterns
    let slice = &[1, 2, 3, 4, 5][..];

    match slice {
        [] => println!("Empty slice"),
        [single] => println!("Single element: {}", single),
        [first, second] => println!("Two elements: {}, {}", first, second),
        [first, middle @ .., last] => {
            println!("First: {}, Last: {}, Middle: {:?}", first, last, middle);
        }
    }
}
```

### Combined Destructuring

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let ((feet, inches), Point { x, y }) = ((3, 10), Point { x: 3, y: -10 });
    println!("feet: {}, inches: {}, x: {}, y: {}", feet, inches, x, y);
}
```

## Pattern Guards

Pattern guards add extra conditions to patterns using `if`:

```rust
fn main() {
    let num = Some(4);

    match num {
        Some(x) if x < 5 => println!("Less than five: {}", x),
        Some(x) if x >= 5 => println!("Five or more: {}", x),
        None => println!("No value"),
        _ => unreachable!(),
    }
}
```

### Guards with Multiple Patterns

```rust
fn main() {
    let x = 4;
    let y = false;

    match x {
        4 | 5 | 6 if y => println!("yes"),  // Guard applies to all patterns
        _ => println!("no"),
    }
}
```

### Complex Guard Conditions

```rust
fn main() {
    let pair = (2, -2);

    match pair {
        (x, y) if x == y => println!("Twins"),
        (x, y) if x + y == 0 => println!("Antimatter, kaboom!"),
        (x, _) if x % 2 == 1 => println!("The first one is odd"),
        _ => println!("No correlation"),
    }
}
```

### Guards with Destructuring

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let point = Point { x: 5, y: 10 };

    match point {
        Point { x, y } if x == y => println!("On the diagonal"),
        Point { x, y } if x == 0 => println!("On the y-axis at y={}", y),
        Point { x, y } if y == 0 => println!("On the x-axis at x={}", x),
        Point { x, y } => println!("At ({}, {})", x, y),
    }
}
```

## @ Bindings

The `@` operator lets you create a variable that holds a value while also testing it:

```rust
fn main() {
    let msg = Message::Hello { id: 5 };

    match msg {
        Message::Hello { id: id_variable @ 3..=7 } => {
            println!("Found an id in range: {}", id_variable);
        }
        Message::Hello { id: 10..=12 } => {
            println!("Found an id in another range");
        }
        Message::Hello { id } => {
            println!("Found some other id: {}", id);
        }
    }
}

enum Message {
    Hello { id: i32 },
}
```

### @ with Structs

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let point = Point { x: 5, y: 10 };

    match point {
        p @ Point { x: 0..=10, y: 0..=10 } => {
            println!("Point in first quadrant (0-10): {:?}", (p.x, p.y));
        }
        Point { x, y } => {
            println!("Point outside range: ({}, {})", x, y);
        }
    }
}
```

### @ with Enums

```rust
enum Temperature {
    Celsius(i32),
    Fahrenheit(i32),
}

fn main() {
    let temp = Temperature::Celsius(35);

    match temp {
        Temperature::Celsius(t @ 30..=40) => {
            println!("Hot day! {} degrees Celsius", t);
        }
        Temperature::Celsius(t) => {
            println!("{} degrees Celsius", t);
        }
        Temperature::Fahrenheit(t @ 86..=104) => {
            println!("Hot day! {} degrees Fahrenheit", t);
        }
        Temperature::Fahrenheit(t) => {
            println!("{} degrees Fahrenheit", t);
        }
    }
}
```

## Refutability

Patterns come in two forms: refutable and irrefutable.

### Irrefutable Patterns

Irrefutable patterns match any possible value. They're used in:
- `let` statements
- Function parameters
- `for` loops

```rust
fn main() {
    // Irrefutable pattern - always matches
    let x = 5;
    let (a, b, c) = (1, 2, 3);

    // Function parameter - irrefutable
    fn print_coordinates(&(x, y): &(i32, i32)) {
        println!("Current location: ({}, {})", x, y);
    }

    let point = (3, 5);
    print_coordinates(&point);

    // for loop - irrefutable
    let v = vec!['a', 'b', 'c'];
    for (index, value) in v.iter().enumerate() {
        println!("{} is at index {}", value, index);
    }
}
```

### Refutable Patterns

Refutable patterns might fail to match. They're used in:
- `if let`
- `while let`
- `match` arms (except the catch-all)

```rust
fn main() {
    let some_value: Option<i32> = None;

    // Refutable pattern - might not match
    if let Some(x) = some_value {
        println!("Got value: {}", x);
    }

    // This won't compile - using refutable pattern where irrefutable is expected
    // let Some(x) = some_value; // ERROR!

    // Use let else for refutable patterns in let statements
    let some_value: Option<i32> = Some(42);
    let Some(x) = some_value else {
        panic!("Expected Some value");
    };
    println!("x = {}", x);
}
```

### When to Use Which

```rust
fn main() {
    let optional = Some(5);

    // if let - for when you might not match
    if let Some(value) = optional {
        println!("Value: {}", value);
    }

    // match - for exhaustive checking
    match optional {
        Some(value) => println!("Value: {}", value),
        None => println!("No value"),
    }

    // let - for when you're certain of the pattern
    let tuple = (1, 2);
    let (x, y) = tuple;  // Always succeeds
    println!("x: {}, y: {}", x, y);
}
```

## Common Patterns and Best Practices

### Pattern 1: Matching Option and Result

```rust
fn main() {
    // Option matching
    let config_value = Some(42);

    match config_value {
        Some(value) => println!("Configuration: {}", value),
        None => println!("Using default configuration"),
    }

    // Result matching
    let result: Result<i32, &str> = Ok(200);

    match result {
        Ok(code) => println!("Success with code: {}", code),
        Err(msg) => println!("Error: {}", msg),
    }

    // Using if let for single-case handling
    if let Ok(code) = result {
        println!("Got code: {}", code);
    }
}
```

### Pattern 2: State Machine Implementation

```rust
enum ConnectionState {
    Disconnected,
    Connecting { attempt: u32, max_attempts: u32 },
    Connected { session_id: String },
    Error { message: String },
}

fn handle_state(state: ConnectionState) -> ConnectionState {
    match state {
        ConnectionState::Disconnected => {
            println!("Starting connection...");
            ConnectionState::Connecting { attempt: 1, max_attempts: 3 }
        }
        ConnectionState::Connecting { attempt, max_attempts } if attempt < max_attempts => {
            println!("Connection attempt {} of {}", attempt, max_attempts);
            ConnectionState::Connecting { attempt: attempt + 1, max_attempts }
        }
        ConnectionState::Connecting { attempt, max_attempts } => {
            println!("Failed after {} attempts", max_attempts);
            ConnectionState::Error { message: "Max attempts reached".to_string() }
        }
        ConnectionState::Connected { session_id } => {
            println!("Connected with session: {}", session_id);
            state
        }
        ConnectionState::Error { message } => {
            println!("Error: {}", message);
            ConnectionState::Disconnected
        }
    }
}

fn main() {
    let mut state = ConnectionState::Disconnected;

    for _ in 0..5 {
        state = handle_state(state);
    }
}
```

### Pattern 3: Extracting Data from Complex Types

```rust
#[derive(Debug)]
struct User {
    name: String,
    email: String,
    age: u32,
    address: Address,
}

#[derive(Debug)]
struct Address {
    street: String,
    city: String,
    country: String,
}

fn main() {
    let user = User {
        name: "Alice".to_string(),
        email: "alice@example.com".to_string(),
        age: 30,
        address: Address {
            street: "123 Main St".to_string(),
            city: "Springfield".to_string(),
            country: "USA".to_string(),
        },
    };

    // Deep destructuring
    let User {
        name,
        address: Address { city, country, .. },
        ..
    } = &user;

    println!("{} lives in {}, {}", name, city, country);
}
```

### Pattern 4: Command Parsing

```rust
enum Command {
    Move { direction: Direction, steps: u32 },
    Turn(Direction),
    Stop,
    Jump { height: f32 },
}

enum Direction {
    North,
    South,
    East,
    West,
}

fn execute_command(cmd: Command) {
    match cmd {
        Command::Move { direction: Direction::North, steps } => {
            println!("Moving north {} steps", steps);
        }
        Command::Move { direction: Direction::South, steps } => {
            println!("Moving south {} steps", steps);
        }
        Command::Move { direction, steps } => {
            println!("Moving {:?} {} steps", direction, steps);
        }
        Command::Turn(direction) => {
            println!("Turning to face {:?}", direction);
        }
        Command::Stop => {
            println!("Stopping");
        }
        Command::Jump { height } if height > 2.0 => {
            println!("High jump of {} meters!", height);
        }
        Command::Jump { height } => {
            println!("Jumping {} meters", height);
        }
    }
}

impl std::fmt::Debug for Direction {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Direction::North => write!(f, "North"),
            Direction::South => write!(f, "South"),
            Direction::East => write!(f, "East"),
            Direction::West => write!(f, "West"),
        }
    }
}

fn main() {
    execute_command(Command::Move { direction: Direction::North, steps: 5 });
    execute_command(Command::Turn(Direction::East));
    execute_command(Command::Jump { height: 3.5 });
    execute_command(Command::Stop);
}
```

### Pattern 5: Error Handling with Pattern Matching

```rust
use std::fs::File;
use std::io::{self, Read};

#[derive(Debug)]
enum AppError {
    IoError(io::Error),
    ParseError(String),
    NotFound { resource: String },
    Unauthorized,
}

fn process_file(path: &str) -> Result<String, AppError> {
    let mut file = File::open(path).map_err(|e| {
        match e.kind() {
            io::ErrorKind::NotFound => AppError::NotFound { resource: path.to_string() },
            io::ErrorKind::PermissionDenied => AppError::Unauthorized,
            _ => AppError::IoError(e),
        }
    })?;

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(AppError::IoError)?;

    Ok(contents)
}

fn handle_result(result: Result<String, AppError>) {
    match result {
        Ok(content) => println!("Content: {}", content),
        Err(AppError::NotFound { resource }) => {
            println!("Resource not found: {}", resource);
        }
        Err(AppError::Unauthorized) => {
            println!("Access denied");
        }
        Err(AppError::IoError(e)) => {
            println!("I/O error: {}", e);
        }
        Err(AppError::ParseError(msg)) => {
            println!("Parse error: {}", msg);
        }
    }
}

fn main() {
    let result = process_file("config.txt");
    handle_result(result);
}
```

### Pattern 6: Visitor Pattern with Enums

```rust
enum Expr {
    Number(i64),
    Add(Box<Expr>, Box<Expr>),
    Subtract(Box<Expr>, Box<Expr>),
    Multiply(Box<Expr>, Box<Expr>),
    Divide(Box<Expr>, Box<Expr>),
}

fn evaluate(expr: &Expr) -> i64 {
    match expr {
        Expr::Number(n) => *n,
        Expr::Add(left, right) => evaluate(left) + evaluate(right),
        Expr::Subtract(left, right) => evaluate(left) - evaluate(right),
        Expr::Multiply(left, right) => evaluate(left) * evaluate(right),
        Expr::Divide(left, right) => evaluate(left) / evaluate(right),
    }
}

fn print_expr(expr: &Expr) -> String {
    match expr {
        Expr::Number(n) => n.to_string(),
        Expr::Add(left, right) => format!("({} + {})", print_expr(left), print_expr(right)),
        Expr::Subtract(left, right) => format!("({} - {})", print_expr(left), print_expr(right)),
        Expr::Multiply(left, right) => format!("({} * {})", print_expr(left), print_expr(right)),
        Expr::Divide(left, right) => format!("({} / {})", print_expr(left), print_expr(right)),
    }
}

fn main() {
    // (2 + 3) * 4
    let expr = Expr::Multiply(
        Box::new(Expr::Add(
            Box::new(Expr::Number(2)),
            Box::new(Expr::Number(3)),
        )),
        Box::new(Expr::Number(4)),
    );

    println!("Expression: {}", print_expr(&expr));
    println!("Result: {}", evaluate(&expr));
}
```

### Pattern 7: matches! Macro

The `matches!` macro provides a convenient way to check if a value matches a pattern:

```rust
fn main() {
    let foo = 'f';

    // Without matches! macro
    let is_letter = match foo {
        'a'..='z' | 'A'..='Z' => true,
        _ => false,
    };

    // With matches! macro - more concise
    let is_letter = matches!(foo, 'a'..='z' | 'A'..='Z');
    println!("Is letter: {}", is_letter);

    // Useful for filtering
    let chars = vec!['a', '1', 'b', '2', 'c'];
    let letters: Vec<_> = chars
        .iter()
        .filter(|c| matches!(c, 'a'..='z' | 'A'..='Z'))
        .collect();
    println!("Letters: {:?}", letters);

    // With guards
    let value = Some(42);
    let is_positive = matches!(value, Some(x) if x > 0);
    println!("Is positive: {}", is_positive);
}
```

## Conclusion

Pattern matching is a cornerstone of idiomatic Rust programming. It provides a powerful and expressive way to handle different cases, extract data from complex structures, and ensure exhaustive handling of all possibilities.

Key takeaways:

- **match expressions**: Use for exhaustive pattern matching with multiple cases
- **if let / while let**: Use for single-pattern matching when you do not need exhaustiveness
- **Destructuring**: Extract values from structs, enums, tuples, and arrays
- **Pattern guards**: Add conditional logic to patterns with `if` clauses
- **@ bindings**: Create variables while testing patterns
- **Exhaustiveness**: Let the compiler help you handle all cases

Pattern matching, combined with Rust's type system, enables you to write code that is both safe and expressive. The compiler's exhaustiveness checking catches missing cases at compile time, preventing runtime errors that could occur in languages without such guarantees.

## Further Reading

- [The Rust Programming Language Book - Patterns](https://doc.rust-lang.org/book/ch18-00-patterns.html)
- [Rust Reference - Patterns](https://doc.rust-lang.org/reference/patterns.html)
- [Rust By Example - match](https://doc.rust-lang.org/rust-by-example/flow_control/match.html)
