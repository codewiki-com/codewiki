---
title: Rust Lifetimes
description: Deep dive into Rust lifetimes including annotations, elision rules and advanced lifetime patterns
track: rust
section: ownership-borrowing
difficulty: advanced
tags:
  - Rust
  - lifetimes
  - borrowing
  - memory safety
status: imported
origin: old/src/content/docs/rust/lifetimes.en.md
divergence: 0.244
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Rust
  subcategory: Core Concepts
  order: 15
  lastUpdated: 2026-01-07
---

Lifetimes are Rust's mechanism for ensuring that references are always valid. They are part of Rust's compile-time guarantee of memory safety, preventing dangling references and use-after-free bugs without requiring a garbage collector. While lifetimes can seem complex at first, understanding them is essential for writing advanced Rust code.

## What are Lifetimes?

Every reference in Rust has a lifetime, which is the scope for which that reference is valid. Most of the time, lifetimes are implicit and inferred by the compiler, just like types. However, when the compiler cannot determine the relationship between lifetimes, you must annotate them explicitly.

### The Problem Lifetimes Solve

Consider this code that would be problematic without lifetime checking:

```rust
fn main() {
    let r;                      // Declare r without initialization

    {
        let x = 5;
        r = &x;                 // r borrows x
    }                           // x goes out of scope here

    // println!("{}", r);       // ERROR! r would be a dangling reference
}
```

Without lifetime checking, `r` would reference memory that has been freed. Rust's borrow checker uses lifetimes to ensure this code does not compile.

### How the Borrow Checker Works

The borrow checker compares the lifetimes of references to ensure that all borrows are valid:

```rust
fn main() {
    let x = 5;            // ----------+-- 'a
                          //           |
    let r = &x;           // --+-- 'b  |
                          //   |       |
    println!("{}", r);    //   |       |
                          // --+       |
}                         // ----------+
```

Here, `'b` (the lifetime of `r`) is contained within `'a` (the lifetime of `x`), so the code compiles successfully.

### Lifetimes are About Scope, Not Duration

A common misconception is that lifetimes control how long data lives. In reality, lifetimes are annotations that tell the compiler about the relationships between the scopes of references. They do not change how long any value lives.

```rust
fn main() {
    let string1 = String::from("hello");    // string1 lives until end of main
    let string2 = String::from("world");    // string2 lives until end of main

    // The lifetime annotation on longest() doesn't change when
    // string1 or string2 are dropped - it only tells the compiler
    // about the relationship between input and output references
    let result = longest(&string1, &string2);

    println!("Longest: {}", result);
}

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

## Lifetime Annotation Syntax

Lifetime annotations use an apostrophe followed by a lowercase name. By convention, the first lifetime is named `'a`, the second `'b`, and so on.

### Basic Syntax

```rust
&i32         // A reference
&'a i32      // A reference with an explicit lifetime 'a
&'a mut i32  // A mutable reference with an explicit lifetime 'a
```

### Multiple Lifetime Parameters

Functions can have multiple lifetime parameters when references have different relationships:

```rust
fn example<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    // Return type is tied to 'a, not 'b
    x
}
```

### Where Lifetimes Appear

Lifetimes can appear in several contexts:

```rust
// Function signatures
fn foo<'a>(x: &'a str) -> &'a str { x }

// Struct definitions
struct Wrapper<'a> {
    value: &'a str,
}

// Impl blocks
impl<'a> Wrapper<'a> {
    fn get(&self) -> &'a str {
        self.value
    }
}

// Type aliases
type StrRef<'a> = &'a str;

// Trait bounds
fn bar<'a, T: 'a>(x: &'a T) { }
```

## Lifetimes in Functions

Functions that accept and return references often need lifetime annotations to express the relationship between input and output lifetimes.

### Why Functions Need Lifetime Annotations

Consider a function that returns the longer of two string slices:

```rust
// This won't compile - missing lifetime annotations
// fn longest(x: &str, y: &str) -> &str {
//     if x.len() > y.len() { x } else { y }
// }

// Correct version with lifetime annotations
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("abcd");
    let string2 = "xyz";

    let result = longest(string1.as_str(), string2);
    println!("The longest string is: {}", result);
}
```

The signature `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str` tells the compiler:
- The function takes two references that must live at least as long as `'a`
- The returned reference will be valid for at least `'a`
- In practice, `'a` will be the smaller of the two input lifetimes

### Understanding Lifetime Constraints

When you use the same lifetime parameter for multiple references, you're saying they must all be valid for the same duration:

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let string1 = String::from("long string is long");

    {
        let string2 = String::from("xyz");
        let result = longest(string1.as_str(), string2.as_str());
        println!("The longest string is: {}", result);
        // result is valid here because both strings are in scope
    }
    // result would not be valid here because string2 is dropped
}
```

### Different Lifetimes for Different Parameters

Sometimes input references have independent lifetimes:

```rust
fn first_word<'a>(s: &'a str) -> &'a str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}

// Here, 'a and 'b are independent - y's lifetime doesn't affect the return
fn choose_first<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    println!("y is: {}", y);  // y is only used, not returned
    x
}

fn main() {
    let outer = String::from("outer");
    let result;

    {
        let inner = String::from("inner");
        result = choose_first(&outer, &inner);
        // This is fine! result only depends on outer's lifetime
    }

    println!("Result: {}", result);  // Works because outer is still alive
}
```

### Lifetime Annotations and Return Types

The return type's lifetime must be tied to an input lifetime or be `'static`:

```rust
// Valid: return lifetime tied to input
fn identity<'a>(s: &'a str) -> &'a str {
    s
}

// Valid: returning a static string
fn hello_world() -> &'static str {
    "Hello, World!"
}

// Invalid: cannot return a reference to locally created data
// fn invalid<'a>() -> &'a str {
//     let s = String::from("hello");
//     &s  // ERROR! s is dropped at end of function
// }

// Correct: return owned data instead
fn create_string() -> String {
    String::from("hello")
}
```

## Lifetime Elision Rules

Rust has lifetime elision rules that allow you to omit explicit lifetime annotations in common patterns. These rules make the code cleaner without sacrificing safety.

### The Three Elision Rules

The compiler applies these rules in order:

**Rule 1: Each elided lifetime in input position becomes a distinct lifetime parameter.**

```rust
// This:
fn foo(x: &str, y: &str) { }

// Becomes:
fn foo<'a, 'b>(x: &'a str, y: &'b str) { }
```

**Rule 2: If there is exactly one input lifetime position, that lifetime is assigned to all elided output lifetimes.**

```rust
// This:
fn foo(x: &str) -> &str { x }

// Becomes:
fn foo<'a>(x: &'a str) -> &'a str { x }
```

**Rule 3: If there are multiple input lifetime positions, but one of them is `&self` or `&mut self`, the lifetime of `self` is assigned to all elided output lifetimes.**

```rust
impl MyStruct {
    // This:
    fn get_data(&self, s: &str) -> &str { &self.data }

    // Becomes:
    fn get_data<'a, 'b>(&'a self, s: &'b str) -> &'a str { &self.data }
}
```

### Examples of Elision

```rust
// No elision needed - no references in signature
fn add(x: i32, y: i32) -> i32 { x + y }

// Rule 1 only - no output references
fn print_str(s: &str) {
    println!("{}", s);
}

// Rules 1 and 2 - single input, output lifetime matches
fn first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}

// Equivalent to:
fn first_word_explicit<'a>(s: &'a str) -> &'a str {
    s.split_whitespace().next().unwrap_or("")
}

// Rules 1 and 3 - method with &self
struct Parser {
    data: String,
}

impl Parser {
    // Output lifetime tied to &self
    fn parse(&self) -> &str {
        &self.data
    }

    // Equivalent to:
    fn parse_explicit<'a>(&'a self) -> &'a str {
        &self.data
    }
}
```

### When Elision Doesn't Work

Elision rules don't cover all cases. You need explicit annotations when:

```rust
// Multiple input references, return could be either
fn longest(x: &str, y: &str) -> &str {  // ERROR! Ambiguous
    if x.len() > y.len() { x } else { y }
}

// Must specify:
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// Struct fields always need explicit lifetimes
struct Excerpt<'a> {
    part: &'a str,  // Cannot elide this
}
```

## Lifetimes in Structs

When a struct holds a reference, it needs a lifetime parameter to ensure the reference remains valid for the struct's lifetime.

### Basic Struct Lifetimes

```rust
struct Excerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("Could not find '.'");

    let excerpt = Excerpt {
        part: first_sentence,
    };

    println!("Excerpt: {}", excerpt.part);
}
// excerpt cannot outlive novel because excerpt.part references novel
```

### Structs with Multiple Lifetimes

```rust
struct MultiRef<'a, 'b> {
    first: &'a str,
    second: &'b str,
}

fn main() {
    let string1 = String::from("first");

    {
        let string2 = String::from("second");
        let multi = MultiRef {
            first: &string1,
            second: &string2,
        };
        println!("{} and {}", multi.first, multi.second);
    }
    // multi dropped here because string2 is dropped
}
```

### Methods on Structs with Lifetimes

```rust
struct Parser<'a> {
    input: &'a str,
    position: usize,
}

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Self {
        Parser { input, position: 0 }
    }

    // Return type lifetime tied to struct's lifetime (Rule 3)
    fn remaining(&self) -> &str {
        &self.input[self.position..]
    }

    // Explicit lifetime showing the same thing
    fn remaining_explicit(&self) -> &'a str {
        &self.input[self.position..]
    }

    // Method that doesn't return a reference to the borrowed data
    fn is_empty(&self) -> bool {
        self.position >= self.input.len()
    }

    fn advance(&mut self, n: usize) {
        self.position = (self.position + n).min(self.input.len());
    }
}

fn main() {
    let text = String::from("Hello, World!");
    let mut parser = Parser::new(&text);

    println!("Remaining: {}", parser.remaining());
    parser.advance(7);
    println!("Remaining: {}", parser.remaining());
}
```

### Lifetimes with Generic Types

```rust
use std::fmt::Display;

struct Wrapper<'a, T> {
    value: &'a T,
}

impl<'a, T: Display> Wrapper<'a, T> {
    fn display(&self) {
        println!("{}", self.value);
    }
}

// Combining lifetime bounds with trait bounds
struct Pair<'a, T: 'a> {
    first: &'a T,
    second: &'a T,
}

impl<'a, T: 'a + PartialOrd + Display> Pair<'a, T> {
    fn larger(&self) -> &'a T {
        if self.first >= self.second {
            self.first
        } else {
            self.second
        }
    }
}
```

## Lifetime Bounds

Lifetime bounds specify relationships between lifetimes and between lifetimes and types.

### Type Bounds: `T: 'a`

The bound `T: 'a` means "type T must live at least as long as lifetime 'a":

```rust
struct Ref<'a, T: 'a> {
    value: &'a T,
}

// Without the T: 'a bound, this wouldn't compile because
// we couldn't guarantee T lives long enough

fn print_ref<'a, T: 'a + std::fmt::Debug>(value: &'a T) {
    println!("{:?}", value);
}
```

### Lifetime Bounds: `'a: 'b`

The bound `'a: 'b` means "'a outlives 'b" or "'a is at least as long as 'b":

```rust
fn longest_with_announcement<'a, 'b>(
    x: &'a str,
    y: &'a str,
    announcement: &'b str,
) -> &'a str
where
    'a: 'b,  // 'a must outlive 'b
{
    println!("Announcement: {}", announcement);
    if x.len() > y.len() { x } else { y }
}
```

### Combining Multiple Bounds

```rust
use std::fmt::{Debug, Display};

fn complex_function<'a, 'b, T, U>(
    x: &'a T,
    y: &'b U,
) -> &'a T
where
    'a: 'b,           // 'a outlives 'b
    T: 'a + Debug,    // T lives at least as long as 'a and is Debug
    U: 'b + Display,  // U lives at least as long as 'b and is Display
{
    println!("y: {}", y);
    println!("x: {:?}", x);
    x
}
```

## The Static Lifetime

The `'static` lifetime is a special lifetime that means the reference can live for the entire duration of the program.

### String Literals are Static

```rust
fn main() {
    let s: &'static str = "I have a static lifetime.";
    println!("{}", s);
}
```

String literals are stored directly in the program's binary, so they're always available.

### Creating Static References

```rust
// Global constants have static lifetime
static GLOBAL: i32 = 42;

fn get_global() -> &'static i32 {
    &GLOBAL
}

// Using Box::leak to create static references
fn create_static() -> &'static str {
    let s = String::from("Hello");
    Box::leak(s.into_boxed_str())
}

// lazy_static or once_cell for complex static data
use std::sync::OnceLock;

static CONFIG: OnceLock<String> = OnceLock::new();

fn get_config() -> &'static str {
    CONFIG.get_or_init(|| {
        String::from("default config")
    })
}
```

### When to Use `'static`

```rust
// Thread spawning requires 'static because thread may outlive caller
use std::thread;

fn main() {
    let message = String::from("Hello from thread!");

    // This works because we move ownership
    thread::spawn(move || {
        println!("{}", message);
    }).join().unwrap();

    // This would NOT work:
    // let borrowed = &message;
    // thread::spawn(|| {
    //     println!("{}", borrowed);  // ERROR! borrowed is not 'static
    // });
}

// Trait objects often need 'static
fn takes_dyn(x: Box<dyn std::fmt::Debug + 'static>) {
    println!("{:?}", x);
}
```

### `'static` Doesn't Mean "Lives Forever"

A common misconception: `'static` doesn't mean the data lives forever, it means the data *can* live that long if needed:

```rust
fn main() {
    let s: &'static str = "hello";

    // s is dropped here, but the string literal in the binary remains
    // The 'static just means this reference is valid for as long as we need
}

// Owned types satisfy 'static bounds because they can live arbitrarily long
fn requires_static<T: 'static>(x: T) {
    // T can live as long as needed because it's owned
}

fn main() {
    let s = String::from("hello");
    requires_static(s);  // Works! String owns its data

    let local = 42;
    requires_static(local);  // Works! i32 is Copy and owns its value
}
```

## Advanced Lifetime Patterns

### Covariance and Contravariance

Rust lifetimes are covariant, meaning a longer lifetime can be used where a shorter one is expected:

```rust
fn covariance_example<'long, 'short>(
    long: &'long str,
    short: &'short str,
) where
    'long: 'short,  // 'long outlives 'short
{
    // Can use &'long str where &'short str is expected
    let _: &'short str = long;  // OK: covariance allows this

    // Cannot do the reverse
    // let _: &'long str = short;  // ERROR
}
```

### Reborrowing

Reborrowing allows you to create a shorter-lived reference from a longer-lived one:

```rust
fn reborrow_example() {
    let mut data = vec![1, 2, 3];

    let r1 = &mut data;

    // Reborrow: create a new mutable reference with shorter lifetime
    {
        let r2 = &mut *r1;  // Reborrow r1
        r2.push(4);
        // r2 dropped here
    }

    // r1 is usable again after r2 is dropped
    r1.push(5);

    println!("{:?}", data);
}
```

### Self-Referential Structs

Self-referential structs are challenging in Rust because of lifetime constraints:

```rust
// This WON'T compile - self-referential struct
// struct SelfRef {
//     data: String,
//     slice: &str,  // Cannot reference data
// }

// Solution 1: Use indices instead of references
struct WithIndices {
    data: String,
    start: usize,
    end: usize,
}

impl WithIndices {
    fn slice(&self) -> &str {
        &self.data[self.start..self.end]
    }
}

// Solution 2: Use Pin and unsafe (advanced)
use std::pin::Pin;
use std::marker::PhantomPinned;

struct SelfRefPinned {
    data: String,
    slice: *const str,  // Raw pointer instead of reference
    _marker: PhantomPinned,
}

impl SelfRefPinned {
    fn new(data: String) -> Pin<Box<Self>> {
        let res = SelfRefPinned {
            data,
            slice: std::ptr::null(),
            _marker: PhantomPinned,
        };
        let mut boxed = Box::pin(res);

        let slice = boxed.data.as_str() as *const str;

        // SAFETY: We're not moving the data
        unsafe {
            let mut_ref: Pin<&mut Self> = Pin::as_mut(&mut boxed);
            Pin::get_unchecked_mut(mut_ref).slice = slice;
        }

        boxed
    }

    fn get_slice(self: Pin<&Self>) -> &str {
        // SAFETY: slice points to valid data that won't move
        unsafe { &*self.slice }
    }
}
```

### Lifetime Subtyping in Traits

```rust
trait Container<'a> {
    fn get(&self) -> &'a str;
}

struct StringContainer<'a> {
    value: &'a str,
}

impl<'a> Container<'a> for StringContainer<'a> {
    fn get(&self) -> &'a str {
        self.value
    }
}

// Using the trait with different lifetimes
fn use_container<'a, 'b, C: Container<'a>>(container: &'b C) -> &'a str
where
    'a: 'b,
{
    container.get()
}
```

## Higher-Ranked Trait Bounds (HRTB)

Higher-Ranked Trait Bounds (HRTB) allow you to express "for any lifetime" in trait bounds.

### The `for<'a>` Syntax

```rust
fn call_with_ref<F>(f: F)
where
    F: for<'a> Fn(&'a str) -> &'a str,
{
    let s = String::from("hello");
    let result = f(&s);
    println!("{}", result);
}

fn identity(s: &str) -> &str {
    s
}

fn main() {
    call_with_ref(identity);
}
```

### HRTB with Closures

```rust
// This closure needs to work with any lifetime
fn apply_to_strings<F>(f: F, strings: &[String])
where
    F: for<'a> Fn(&'a str) -> usize,
{
    for s in strings {
        println!("Length of '{}': {}", s, f(s));
    }
}

fn main() {
    let strings = vec![
        String::from("hello"),
        String::from("world"),
    ];

    apply_to_strings(|s| s.len(), &strings);
}
```

### When HRTB is Necessary

```rust
trait Parser {
    // This method must work for any input lifetime
    fn parse<'a>(&self, input: &'a str) -> Result<&'a str, &'static str>;
}

// Storing a parser requires HRTB
struct ParserBox {
    parser: Box<dyn for<'a> Fn(&'a str) -> Result<&'a str, &'static str>>,
}

impl ParserBox {
    fn new<F>(f: F) -> Self
    where
        F: for<'a> Fn(&'a str) -> Result<&'a str, &'static str> + 'static,
    {
        ParserBox {
            parser: Box::new(f),
        }
    }

    fn parse<'a>(&self, input: &'a str) -> Result<&'a str, &'static str> {
        (self.parser)(input)
    }
}
```

## Common Lifetime Pitfalls

### Pitfall 1: Conflating Lifetime Annotations

```rust
// WRONG: Thinking 'a makes the strings live longer
fn wrong_thinking<'a>(x: &'a str, y: &'a str) -> &'a str {
    // The 'a doesn't extend lifetimes - it describes relationships
    x
}

// RIGHT: Understanding that 'a is the intersection of input lifetimes
fn right_thinking<'a>(x: &'a str, y: &'a str) -> &'a str {
    // The returned reference is valid only while BOTH x and y are valid
    if x.len() > y.len() { x } else { y }
}
```

### Pitfall 2: Returning References to Local Variables

```rust
// WRONG: Returning reference to local data
// fn create_and_return() -> &str {
//     let s = String::from("hello");
//     &s  // ERROR! s is dropped
// }

// RIGHT: Return owned data
fn create_and_return() -> String {
    String::from("hello")
}

// RIGHT: Return static data
fn return_static() -> &'static str {
    "hello"
}
```

### Pitfall 3: Over-constraining Lifetimes

```rust
// OVER-CONSTRAINED: Both parameters tied to same lifetime unnecessarily
fn over_constrained<'a>(data: &'a str, prefix: &'a str) -> String {
    format!("{}{}", prefix, data)
}

// BETTER: Independent lifetimes since we're returning owned data
fn better<'a, 'b>(data: &'a str, prefix: &'b str) -> String {
    format!("{}{}", prefix, data)
}

// BEST: Using elision since no lifetime relationship needed
fn best(data: &str, prefix: &str) -> String {
    format!("{}{}", prefix, data)
}
```

### Pitfall 4: Struct Lifetime Too Restrictive

```rust
// Problem: Parser can't outlive any temporary used in parsing
struct BadParser<'a> {
    source: &'a str,
    temp_buffer: &'a str,  // This ties everything to one lifetime
}

// Better: Separate lifetimes for independent data
struct BetterParser<'source, 'buffer> {
    source: &'source str,
    temp_buffer: &'buffer str,
}

// Best: Own the buffer if it's temporary
struct BestParser<'a> {
    source: &'a str,
    temp_buffer: String,  // Owned, no lifetime constraint
}
```

### Pitfall 5: Fighting the Borrow Checker

```rust
// FIGHTING: Trying to return reference while holding mutable borrow
struct Data {
    values: Vec<i32>,
}

impl Data {
    // WRONG approach - trying to modify and return reference
    // fn add_and_get(&mut self, value: i32) -> &i32 {
    //     self.values.push(value);
    //     self.values.last().unwrap()  // Reference while mutably borrowed
    // }

    // RIGHT: Return index instead
    fn add_and_get_index(&mut self, value: i32) -> usize {
        self.values.push(value);
        self.values.len() - 1
    }

    fn get(&self, index: usize) -> Option<&i32> {
        self.values.get(index)
    }
}
```

## Best Practices

### Let the Compiler Infer When Possible

```rust
// Good: Let elision rules work
fn first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}

// Unnecessary: Explicit lifetimes that match elision
fn first_word_explicit<'a>(s: &'a str) -> &'a str {
    s.split_whitespace().next().unwrap_or("")
}
```

### Prefer Owned Types When Practical

```rust
// If you're going to clone anyway, just take ownership
fn process_owned(s: String) -> String {
    s.to_uppercase()
}

// Only borrow when you don't need ownership
fn process_borrowed(s: &str) -> String {
    s.to_uppercase()
}
```

### Use Generic Lifetime Bounds for Flexibility

```rust
use std::fmt::Display;

// Flexible: works with any lifetime
fn announce<'a, T: Display>(value: &'a T, message: &str) -> &'a T {
    println!("{}: {}", message, value);
    value
}
```

### Document Complex Lifetime Relationships

```rust
/// Returns the longer of two strings.
///
/// # Lifetimes
/// The returned reference is valid for the shorter of the two input lifetimes.
/// If `first` outlives `second`, the result is only valid while `second` is valid.
fn longest<'a>(first: &'a str, second: &'a str) -> &'a str {
    if first.len() >= second.len() {
        first
    } else {
        second
    }
}
```

### Consider Using Cow for Flexibility

```rust
use std::borrow::Cow;

// Can return either borrowed or owned data
fn maybe_modify(s: &str, should_modify: bool) -> Cow<str> {
    if should_modify {
        Cow::Owned(s.to_uppercase())
    } else {
        Cow::Borrowed(s)
    }
}

fn main() {
    let original = "hello";

    let not_modified = maybe_modify(original, false);
    let modified = maybe_modify(original, true);

    println!("Not modified: {}", not_modified);  // No allocation
    println!("Modified: {}", modified);          // Allocated
}
```

### Use Type Aliases for Complex Lifetimes

```rust
type ParseResult<'a> = Result<(&'a str, &'a str), ParseError>;

struct ParseError {
    message: String,
}

fn parse_pair(input: &str) -> ParseResult {
    // Implementation...
    Ok((&input[0..5], &input[6..]))
}
```

## Conclusion

Lifetimes are one of Rust's most powerful features, enabling memory safety without garbage collection. Key takeaways:

- **Lifetimes describe relationships**: They tell the compiler how reference lifetimes relate to each other, not how long data lives.
- **Elision handles common cases**: Most lifetime annotations can be inferred by the compiler using elision rules.
- **`'static` means "can live forever"**: Not that it will, but that it's not constrained by any other lifetime.
- **Prefer simplicity**: Use owned types when practical, let the compiler infer lifetimes when possible.
- **Trust the borrow checker**: It's catching real bugs. If you're fighting it, reconsider your design.

Understanding lifetimes deeply will help you write more sophisticated Rust code and better understand error messages when the borrow checker rejects your code.

## Further Reading

- [The Rust Programming Language - Validating References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html)
- [Rust By Example - Lifetimes](https://doc.rust-lang.org/rust-by-example/scope/lifetime.html)
- [The Rustonomicon - Lifetimes](https://doc.rust-lang.org/nomicon/lifetimes.html)
- [Common Rust Lifetime Misconceptions](https://github.com/pretzelhammer/rust-blog/blob/master/posts/common-rust-lifetime-misconceptions.md)
