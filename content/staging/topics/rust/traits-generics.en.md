---
title: Rust Trait 与泛型
description: 掌握 Rust Trait：定义、实现、边界与高级 Trait
track: rust
section: traits-generics
difficulty: intermediate
tags:
  - Rust
  - Trait
  - 泛型
  - 多态
status: imported
origin: old/src/content/docs/rust/traits-generics.en.md
divergence: 0.2
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: Trait
  order: 2
  lastUpdated: 2026-01-07
---

Traits are the core mechanism for implementing abstraction and polymorphism in Rust. They define the behavior that types must provide, similar to interfaces in other languages. Generics allow us to write code that can handle multiple types, and combined with trait bounds, we can build systems that are both flexible and type-safe.

## Trait Definition and Implementation

### Basic Trait Definition

A trait defines a set of method signatures that any type implementing the trait must provide concrete implementations for.

```rust
// Define a trait describing summarizable content
pub trait Summary {
    fn summarize(&self) -> String;
}

// Define structs
pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}

// Implement Summary trait for NewsArticle
impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

// Implement Summary trait for Tweet
impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}

fn main() {
    let article = NewsArticle {
        headline: String::from("Rust 1.70 Released"),
        location: String::from("Online"),
        author: String::from("Rust Team"),
        content: String::from("Rust 1.70 brings many new features..."),
    };

    let tweet = Tweet {
        username: String::from("rust_lang"),
        content: String::from("We are excited to announce..."),
        reply: false,
        retweet: false,
    };

    println!("New article: {}", article.summarize());
    println!("New tweet: {}", tweet.summarize());
}
```

### Default Implementation

Traits can provide default implementations for methods, and types can choose to use the default implementation or provide their own.

```rust
pub trait Summary {
    fn summarize_author(&self) -> String;

    // Method with default implementation
    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.summarize_author())
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}

impl Summary for Tweet {
    // Only need to implement summarize_author
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
    // summarize uses the default implementation
}

fn main() {
    let tweet = Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        retweet: false,
    };

    println!("1 new tweet: {}", tweet.summarize());
    // Output: 1 new tweet: (Read more from @horse_ebooks...)
}
```

Default implementations can call other methods in the same trait, even if those methods don't have default implementations:

```rust
pub trait Display {
    fn fmt(&self) -> String;

    fn print(&self) {
        println!("{}", self.fmt());
    }
}
```

## Traits as Parameters

### impl Trait Syntax

The simplest way is to use `impl Trait` syntax:

```rust
pub fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}

// Can accept any type that implements the Summary trait
fn main() {
    let article = NewsArticle {
        headline: String::from("Major Discovery"),
        location: String::from("Laboratory"),
        author: String::from("Scientist"),
        content: String::from("Detailed content..."),
    };

    notify(&article);
}
```

### Trait Bound Syntax

`impl Trait` is actually syntactic sugar for trait bounds:

```rust
// impl Trait syntax
pub fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}

// Equivalent trait bound syntax
pub fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}
```

For more complex cases, trait bounds are clearer:

```rust
// Two parameters can be different types
pub fn notify(item1: &impl Summary, item2: &impl Summary) {
    // ...
}

// Force both parameters to be the same type
pub fn notify<T: Summary>(item1: &T, item2: &T) {
    // ...
}
```

### Multiple Trait Bounds

Use `+` syntax to specify multiple trait bounds:

```rust
use std::fmt::Display;

pub fn notify(item: &(impl Summary + Display)) {
    println!("{}", item);
    println!("Summary: {}", item.summarize());
}

// Or using generic syntax
pub fn notify<T: Summary + Display>(item: &T) {
    println!("{}", item);
    println!("Summary: {}", item.summarize());
}
```

### where Clauses

When trait bounds become complex, using `where` clauses can improve readability:

```rust
// Without where clause
fn some_function<T: Display + Clone, U: Clone + Debug>(t: &T, u: &U) -> i32 {
    // ...
}

// With where clause
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
    // ...
}
```

Complex example:

```rust
use std::fmt::Debug;

fn complex_function<T, U, V>(t: T, u: U, v: V) -> String
where
    T: Display + Clone,
    U: Debug + Clone,
    V: Summary + Display,
{
    format!(
        "T: {}, U: {:?}, V: {}",
        t,
        u,
        v.summarize()
    )
}
```

## Returning Types that Implement Traits

### Returning impl Trait

You can use `impl Trait` syntax to return a type that implements a trait:

```rust
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        retweet: false,
    }
}
```

**Important limitation**: You can only return a single type. The following code won't compile:

```rust
// Error! Cannot return different types based on condition
fn returns_summarizable(switch: bool) -> impl Summary {
    if switch {
        NewsArticle {
            headline: String::from("Penguins Win the Championship!"),
            location: String::from("Pittsburgh"),
            author: String::from("Iceburgh"),
            content: String::from("..."),
        }
    } else {
        Tweet {
            username: String::from("horse_ebooks"),
            content: String::from("..."),
            reply: false,
            retweet: false,
        }
    }
}
```

## Generics and Trait Bounds

### Basic Generic Functions

```rust
// Find the largest value in a slice
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];
    let result = largest(&number_list);
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];
    let result = largest(&char_list);
    println!("The largest character is {}", result);
}
```

### Generics and Trait Bounds in Structs

```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

// Implement methods only for types that implement specific traits
impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest member is y = {}", self.y);
        }
    }
}

fn main() {
    let pair = Pair::new(5, 10);
    pair.cmp_display(); // Can call because i32 implements Display and PartialOrd
}
```

### Conditionally Implementing Traits

```rust
use std::fmt::Display;

struct Wrapper<T>(T);

// Implement new method for all types
impl<T> Wrapper<T> {
    fn new(value: T) -> Self {
        Wrapper(value)
    }
}

// Implement print method only for types that implement Display
impl<T: Display> Wrapper<T> {
    fn print(&self) {
        println!("Wrapped value: {}", self.0);
    }
}

fn main() {
    let wrapper_int = Wrapper::new(42);
    wrapper_int.print(); // Can call

    let wrapper_vec = Wrapper::new(vec![1, 2, 3]);
    // wrapper_vec.print(); // Error! Vec doesn't implement Display
}
```

### Blanket Implementations

You can implement a trait for any type that satisfies specific trait bounds:

```rust
trait MyTrait {
    fn do_something(&self);
}

// Implement MyTrait for all types that implement Display
impl<T: Display> MyTrait for T {
    fn do_something(&self) {
        println!("Performing action: {}", self);
    }
}

fn main() {
    let number = 42;
    number.do_something(); // i32 implements Display, so it also has MyTrait

    let text = "hello";
    text.do_something(); // &str also implements Display
}
```

Real example from the standard library:

```rust
// Blanket implementation in the standard library
// Implement ToString for any type that implements Display
impl<T: Display> ToString for T {
    fn to_string(&self) -> String {
        // ...
    }
}
```

## Associated Types

Associated types are type placeholders in traits that implementors must specify with concrete types.

### Basic Associated Types

```rust
pub trait Iterator {
    type Item; // Associated type

    fn next(&mut self) -> Option<Self::Item>;
}

struct Counter {
    count: u32,
}

impl Counter {
    fn new() -> Counter {
        Counter { count: 0 }
    }
}

impl Iterator for Counter {
    type Item = u32; // Specify the associated type

    fn next(&mut self) -> Option<Self::Item> {
        if self.count < 5 {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    let mut counter = Counter::new();

    while let Some(value) = counter.next() {
        println!("Count: {}", value);
    }
}
```

### Associated Types vs Generics

Associated types and generics look similar but have important differences:

```rust
// Using generics - can implement multiple times for the same type
pub trait Iterator<T> {
    fn next(&mut self) -> Option<T>;
}

// Need to specify type each time
impl Iterator<String> for Counter {
    fn next(&mut self) -> Option<String> { /* ... */ }
}

impl Iterator<u32> for Counter {
    fn next(&mut self) -> Option<u32> { /* ... */ }
}

// Using associated types - each type can only implement once
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}

// Can only have one implementation
impl Iterator for Counter {
    type Item = u32;
    fn next(&mut self) -> Option<Self::Item> { /* ... */ }
}
```

Advantages of associated types:

```rust
// Using associated types - more concise
fn process_iterator(iter: &mut impl Iterator) {
    if let Some(item) = iter.next() {
        // use item
    }
}

// If using generics - need to specify type parameter
fn process_iterator<T>(iter: &mut impl Iterator<T>) {
    if let Some(item) = iter.next() {
        // use item
    }
}
```

### Complex Associated Types Example

```rust
use std::ops::Add;

trait Graph {
    type Node;
    type Edge;

    fn has_edge(&self, node1: &Self::Node, node2: &Self::Node) -> bool;
    fn edges(&self, node: &Self::Node) -> Vec<Self::Edge>;
}

struct MyGraph {
    // Graph data structure
}

#[derive(Debug)]
struct MyNode {
    id: usize,
}

#[derive(Debug)]
struct MyEdge {
    from: usize,
    to: usize,
    weight: f64,
}

impl Graph for MyGraph {
    type Node = MyNode;
    type Edge = MyEdge;

    fn has_edge(&self, node1: &Self::Node, node2: &Self::Node) -> bool {
        // Implementation logic
        true
    }

    fn edges(&self, node: &Self::Node) -> Vec<Self::Edge> {
        // Return edges
        vec![]
    }
}
```

## Trait Objects and Dynamic Dispatch

Trait objects allow handling different types at runtime, implementing dynamic polymorphism.

### Creating Trait Objects

```rust
pub trait Draw {
    fn draw(&self);
}

pub struct Button {
    pub width: u32,
    pub height: u32,
    pub label: String,
}

impl Draw for Button {
    fn draw(&self) {
        println!("Drawing button: {} ({}x{})", self.label, self.width, self.height);
    }
}

pub struct SelectBox {
    pub width: u32,
    pub height: u32,
    pub options: Vec<String>,
}

impl Draw for SelectBox {
    fn draw(&self) {
        println!("Drawing select box: {} options ({}x{})",
                 self.options.len(), self.width, self.height);
    }
}

// Use trait objects to store different types
pub struct Screen {
    pub components: Vec<Box<dyn Draw>>,
}

impl Screen {
    pub fn run(&self) {
        for component in self.components.iter() {
            component.draw();
        }
    }
}

fn main() {
    let screen = Screen {
        components: vec![
            Box::new(Button {
                width: 50,
                height: 10,
                label: String::from("OK"),
            }),
            Box::new(SelectBox {
                width: 75,
                height: 10,
                options: vec![
                    String::from("Yes"),
                    String::from("No"),
                    String::from("Maybe"),
                ],
            }),
        ],
    };

    screen.run();
}
```

### Static Dispatch vs Dynamic Dispatch

```rust
// Static dispatch - concrete type determined at compile time, monomorphization
fn draw_static<T: Draw>(item: &T) {
    item.draw();
}

// Dynamic dispatch - method lookup via vtable at runtime
fn draw_dynamic(item: &dyn Draw) {
    item.draw();
}

fn main() {
    let button = Button {
        width: 50,
        height: 10,
        label: String::from("Click"),
    };

    // Static dispatch - better performance, potentially larger code size
    draw_static(&button);

    // Dynamic dispatch - more flexible, runtime overhead
    draw_dynamic(&button);
}
```

### Object Safety

Not all traits can be used as trait objects. To be object-safe, a trait must satisfy:

1. Methods don't return `Self`
2. Methods don't have generic type parameters

```rust
// Object-safe trait
pub trait Draw {
    fn draw(&self);
}

// Not object-safe trait
pub trait Clone {
    fn clone(&self) -> Self; // Returns Self
}

// Not object-safe trait
pub trait Comparable<T> {
    fn compare(&self, other: &T) -> bool; // Generic type parameter
}

// Using trait object will cause error
// let obj: Box<dyn Clone> = Box::new(5); // Compile error!
```

Making an object-unsafe trait object-safe:

```rust
// Modify return type
pub trait Drawable {
    fn draw(&self) -> Box<dyn Drawable>; // Return trait object instead of Self
}

// Remove generics, use associated types
pub trait Comparable {
    type Other;
    fn compare(&self, other: &Self::Other) -> bool;
}
```

## Orphan Rule

The orphan rule is an important constraint in Rust: **you can only implement a trait for a type if at least one of the trait or the type is defined in the current crate**.

### Valid Implementations

```rust
use std::fmt;

// Case 1: Implement external trait for local type
struct MyType {
    value: i32,
}

// Valid: MyType is a local type
impl fmt::Display for MyType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "MyType({})", self.value)
    }
}

// Case 2: Implement local trait for external type
trait MyTrait {
    fn do_something(&self);
}

// Valid: MyTrait is a local trait
impl MyTrait for i32 {
    fn do_something(&self) {
        println!("Value: {}", self);
    }
}

// Case 3: Implement local trait for local type
struct LocalType;
trait LocalTrait {
    fn method(&self);
}

// Valid: Both are local
impl LocalTrait for LocalType {
    fn method(&self) {
        println!("Local implementation");
    }
}
```

### Invalid Implementations

```rust
use std::fmt;

// Invalid: Cannot implement external trait for external type
// impl fmt::Display for Vec<i32> {
//     fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
//         write!(f, "{:?}", self)
//     }
// }
// Error: Neither Display nor Vec is defined in this crate
```

### Bypassing the Orphan Rule: Newtype Pattern

Use the newtype pattern to wrap external types:

```rust
use std::fmt;

// Create a wrapper type
struct Wrapper(Vec<String>);

// Valid: Wrapper is a local type
impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

fn main() {
    let w = Wrapper(vec![
        String::from("hello"),
        String::from("world"),
    ]);
    println!("Wrapped vector: {}", w);
}
```

Benefits of the newtype pattern:

```rust
struct Kilometers(i32);
struct Miles(i32);

impl Kilometers {
    fn to_miles(&self) -> Miles {
        Miles((self.0 as f64 * 0.621371) as i32)
    }
}

fn main() {
    let distance = Kilometers(100);
    let miles = distance.to_miles();

    // Type safety: won't confuse kilometers and miles
    // let wrong: Kilometers = miles; // Compile error!
}
```

## Advanced Trait Features

### Fully Qualified Syntax

When multiple traits have methods with the same name, use fully qualified syntax:

```rust
trait Pilot {
    fn fly(&self);
}

trait Wizard {
    fn fly(&self);
}

struct Human;

impl Pilot for Human {
    fn fly(&self) {
        println!("This is your captain speaking");
    }
}

impl Wizard for Human {
    fn fly(&self) {
        println!("Up!");
    }
}

impl Human {
    fn fly(&self) {
        println!("*waving arms furiously*");
    }
}

fn main() {
    let person = Human;

    person.fly();           // Calls Human's method
    Pilot::fly(&person);    // Calls Pilot trait's method
    Wizard::fly(&person);   // Calls Wizard trait's method

    // Fully qualified syntax
    <Human as Pilot>::fly(&person);
    <Human as Wizard>::fly(&person);
}
```

For associated functions (without `self` parameter):

```rust
trait Animal {
    fn baby_name() -> String;
}

struct Dog;

impl Dog {
    fn baby_name() -> String {
        String::from("Spot")
    }
}

impl Animal for Dog {
    fn baby_name() -> String {
        String::from("puppy")
    }
}

fn main() {
    println!("A baby dog is called: {}", Dog::baby_name());
    // Must use fully qualified syntax
    println!("A baby dog is called: {}", <Dog as Animal>::baby_name());
}
```

### Supertraits

Require that types implementing a trait must also implement another trait:

```rust
use std::fmt;

// OutlinePrint requires Display
trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string(); // Can use Display's methods
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("*{}*", " ".repeat(len + 2));
        println!("* {} *", output);
        println!("*{}*", " ".repeat(len + 2));
        println!("{}", "*".repeat(len + 4));
    }
}

struct Point {
    x: i32,
    y: i32,
}

// Must implement Display first
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

// Then can implement OutlinePrint
impl OutlinePrint for Point {}

fn main() {
    let p = Point { x: 1, y: 3 };
    p.outline_print();
}
```

### Derive Macros

Automatically generate trait implementations for types:

```rust
// Common derivable traits
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
struct Person {
    name: String,
    age: u32,
}

fn main() {
    let person1 = Person {
        name: String::from("Alice"),
        age: 30,
    };

    // Debug
    println!("{:?}", person1);

    // Clone
    let person2 = person1.clone();

    // PartialEq
    println!("Are they equal? {}", person1 == person2);

    // PartialOrd
    let person3 = Person {
        name: String::from("Bob"),
        age: 25,
    };
    println!("person1 > person3? {}", person1 > person3);
}
```

## Practical Examples

### Building a Plugin System

```rust
use std::collections::HashMap;

// Define plugin interface
trait Plugin: Send + Sync {
    fn name(&self) -> &str;
    fn execute(&self, input: &str) -> String;
}

// Plugin registry
struct PluginRegistry {
    plugins: HashMap<String, Box<dyn Plugin>>,
}

impl PluginRegistry {
    fn new() -> Self {
        PluginRegistry {
            plugins: HashMap::new(),
        }
    }

    fn register(&mut self, plugin: Box<dyn Plugin>) {
        let name = plugin.name().to_string();
        self.plugins.insert(name, plugin);
    }

    fn execute(&self, plugin_name: &str, input: &str) -> Option<String> {
        self.plugins.get(plugin_name).map(|p| p.execute(input))
    }
}

// Implement concrete plugins
struct UpperCasePlugin;

impl Plugin for UpperCasePlugin {
    fn name(&self) -> &str {
        "uppercase"
    }

    fn execute(&self, input: &str) -> String {
        input.to_uppercase()
    }
}

struct ReversePlugin;

impl Plugin for ReversePlugin {
    fn name(&self) -> &str {
        "reverse"
    }

    fn execute(&self, input: &str) -> String {
        input.chars().rev().collect()
    }
}

fn main() {
    let mut registry = PluginRegistry::new();

    registry.register(Box::new(UpperCasePlugin));
    registry.register(Box::new(ReversePlugin));

    let input = "Hello, World";

    if let Some(result) = registry.execute("uppercase", input) {
        println!("Uppercase: {}", result);
    }

    if let Some(result) = registry.execute("reverse", input) {
        println!("Reverse: {}", result);
    }
}
```

### Typestate Pattern

Use traits and generics to implement compile-time state checking:

```rust
// State markers
struct Draft;
struct PendingReview;
struct Published;

// Post structure
struct Post<State> {
    content: String,
    state: std::marker::PhantomData<State>,
}

impl Post<Draft> {
    fn new() -> Post<Draft> {
        Post {
            content: String::new(),
            state: std::marker::PhantomData,
        }
    }

    fn add_text(&mut self, text: &str) {
        self.content.push_str(text);
    }

    fn request_review(self) -> Post<PendingReview> {
        Post {
            content: self.content,
            state: std::marker::PhantomData,
        }
    }
}

impl Post<PendingReview> {
    fn approve(self) -> Post<Published> {
        Post {
            content: self.content,
            state: std::marker::PhantomData,
        }
    }

    fn reject(self) -> Post<Draft> {
        Post {
            content: self.content,
            state: std::marker::PhantomData,
        }
    }
}

impl Post<Published> {
    fn content(&self) -> &str {
        &self.content
    }
}

fn main() {
    let mut post = Post::new();
    post.add_text("I had a salad for lunch today");

    let post = post.request_review();
    // post.add_text("more text"); // Compile error! Cannot modify a post under review

    let post = post.approve();
    println!("Published content: {}", post.content());

    // Compile-time guarantee of correct state transitions
    // let post = Post::<Published>::new(); // Compile error! Cannot directly create a published post
}
```

## Best Practices

### Prefer Trait Bounds Over Trait Objects

```rust
// Recommended: Static dispatch
fn process<T: Summary>(item: &T) {
    println!("{}", item.summarize());
}

// Only use when runtime polymorphism is needed
fn process_dynamic(item: &dyn Summary) {
    println!("{}", item.summarize());
}
```

### Use impl Trait to Simplify Return Types

```rust
// Clear and concise
fn make_iterator() -> impl Iterator<Item = i32> {
    vec![1, 2, 3].into_iter()
}

// Instead of
fn make_iterator_verbose() -> std::vec::IntoIter<i32> {
    vec![1, 2, 3].into_iter()
}
```

### Keep Traits Small and Focused

```rust
// Good: Single responsibility
trait Read {
    fn read(&mut self, buf: &mut [u8]) -> Result<usize>;
}

trait Write {
    fn write(&mut self, buf: &[u8]) -> Result<usize>;
}

// Avoid: Overly large trait
// trait FileOperations {
//     fn read(&mut self) -> String;
//     fn write(&mut self, data: &str);
//     fn delete(&mut self);
//     fn rename(&mut self, new_name: &str);
//     fn copy(&mut self, dest: &str);
//     // ... too many methods
// }
```

### Use Associated Types to Simplify APIs

```rust
// Recommended: Use associated types
trait Container {
    type Item;
    fn get(&self, index: usize) -> Option<&Self::Item>;
}

// Instead of generics (unless multiple implementations are needed)
trait Container<T> {
    fn get(&self, index: usize) -> Option<&T>;
}
```

## Summary

Traits and generics are the core mechanisms in Rust for implementing abstraction and code reuse:

- **Traits** define shared behavior, similar to interfaces
- **Generics** allow writing code that works with multiple types
- **Trait bounds** constrain generic types to implement specific behaviors
- **Associated types** simplify trait definitions, with only one implementation per type
- **Trait objects** implement runtime polymorphism, but with performance overhead
- **Orphan rule** ensures code consistency, can be bypassed with the newtype pattern
- **Static dispatch** provides zero-cost abstraction, **dynamic dispatch** provides flexibility

Mastering these concepts will enable you to design Rust programs that are both flexible and efficient, fully leveraging the safety and performance advantages provided by Rust's type system.
