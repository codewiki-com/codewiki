---
title: Macros
description: Complete Guide to Rust Macros, Declarative Macros and Procedural Macros
track: rust
section: traits-generics
difficulty: advanced
tags:
  - Rust
  - 宏
  - 元编程
  - macro_rules
status: imported
origin: old/src/content/docs/rust/macros.en.md
divergence: 0.215
issues: []
legacy:
  category: Rust
  subcategory: 元编程
  order: 7
  lastUpdated: 2026-01-07
---

Macros are powerful metaprogramming tools in Rust that allow you to write code that generates other code. Unlike functions, macros expand at compile time, can accept a variable number of arguments, and can manipulate Rust syntax structures.

## Why Do We Need Macros?

Macros solve the following core problems:

1. **Reduce repetitive code**: Automatically generate boilerplate code, avoiding copy-paste
2. **Variable arguments**: Handle variable number of arguments (like `println\!`, `vec\!`)
3. **DSL (Domain-Specific Language)**: Create domain-specific syntax
4. **Compile-time computation**: Perform code generation and validation at compile time
5. **Trait implementation automation**: Automatically implement traits for types

## Classification of Macros

Macros in Rust are divided into two main categories:

1. **Declarative Macros**: Defined using `macro_rules\!`, generate code through pattern matching
2. **Procedural Macros**: More powerful macros that can manipulate Rust code's Abstract Syntax Tree (AST)
   - Derive Macros
   - Attribute Macros
   - Function-like Macros

---

## Declarative Macros (macro_rules\!)

Declarative macros are the most common type of macros, using pattern matching to define code transformation rules.

### Basic Syntax

```rust
macro_rules\! macro_name {
    (pattern1) => {
        expanded_code1
    };
    (pattern2) => {
        expanded_code2
    };
}
```

### Simple Example

```rust
macro_rules\! say_hello {
    () => {
        println\!("Hello, World\!");
    };
}

fn main() {
    say_hello\!(); // Output: Hello, World\!
}
```

### Macros with Parameters

```rust
macro_rules\! greet {
    ($name:expr) => {
        println\!("Hello, {}\!", $name);
    };
}

fn main() {
    greet\!("John"); // Output: Hello, John\!
}
```

### Fragment Specifiers

Macro parameters use fragment specifiers to specify the accepted syntax type:

| Specifier | Description | Example |
|-----------|-------------|---------|
| `expr` | Expression | `1 + 2`, `foo()` |
| `ident` | Identifier | `foo`, `bar` |
| `ty` | Type | `i32`, `Vec<String>` |
| `path` | Path | `std::collections::HashMap` |
| `pat` | Pattern | `Some(x)`, `_` |
| `stmt` | Statement | `let x = 1;` |
| `block` | Code block | `{ ... }` |
| `item` | Item (function, struct, etc.) | `fn foo() {}` |
| `meta` | Metadata | `cfg(target_os = "linux")` |
| `tt` | Single token tree | Any token |
| `literal` | Literal | `"hello"`, `42` |
| `lifetime` | Lifetime | `'a`, `'static` |
| `vis` | Visibility modifier | `pub`, `pub(crate)` |

```rust
macro_rules\! create_function {
    ($func_name:ident) => {
        fn $func_name() {
            println\!("Function {:?} was called", stringify\!($func_name));
        }
    };
}

create_function\!(foo);
create_function\!(bar);

fn main() {
    foo(); // Output: Function "foo" was called
    bar(); // Output: Function "bar" was called
}
```

### Repetition Patterns

Macros support repetition patterns for handling variable number of arguments:

```rust
macro_rules\! vector {
    // Base case: empty vector
    () => {
        Vec::new()
    };
    // Repetition pattern: one or more elements
    ($($element:expr),+ $(,)?) => {
        {
            let mut v = Vec::new();
            $(
                v.push($element);
            )+
            v
        }
    };
}

fn main() {
    let v1: Vec<i32> = vector\![];
    let v2 = vector\![1, 2, 3];
    let v3 = vector\![1, 2, 3,]; // Supports trailing comma

    println\!("{:?}", v2); // [1, 2, 3]
}
```

Repetition syntax explanation:
- `$(...)*` - Zero or more times
- `$(...)+` - One or more times
- `$(...)??` - Zero or one time
- Separators can be `,`, `;`, etc.

### Multi-branch Pattern Matching

```rust
macro_rules\! calculate {
    // Addition
    (add $a:expr, $b:expr) => {
        $a + $b
    };
    // Subtraction
    (sub $a:expr, $b:expr) => {
        $a - $b
    };
    // Multiplication
    (mul $a:expr, $b:expr) => {
        $a * $b
    };
    // Sum multiple numbers
    (sum $($x:expr),+) => {
        {
            let mut sum = 0;
            $(
                sum += $x;
            )+
            sum
        }
    };
}

fn main() {
    println\!("{}", calculate\!(add 5, 3));       // 8
    println\!("{}", calculate\!(sub 10, 4));      // 6
    println\!("{}", calculate\!(mul 3, 7));       // 21
    println\!("{}", calculate\!(sum 1, 2, 3, 4)); // 10
}
```

### Recursive Macros

Macros can call themselves recursively:

```rust
macro_rules\! count_exprs {
    () => { 0 };
    ($head:expr) => { 1 };
    ($head:expr, $($tail:expr),+) => {
        1 + count_exprs\!($($tail),+)
    };
}

macro_rules\! find_min {
    ($x:expr) => ($x);
    ($x:expr, $($y:expr),+) => {
        std::cmp::min($x, find_min\!($($y),+))
    };
}

fn main() {
    println\!("{}", count_exprs\!());           // 0
    println\!("{}", count_exprs\!(1));          // 1
    println\!("{}", count_exprs\!(1, 2, 3, 4)); // 4

    println\!("{}", find_min\!(5));           // 5
    println\!("{}", find_min\!(3, 7, 2, 9));  // 2
}
```

### Practical Example: HashMap Construction Macro

```rust
macro_rules\! hashmap {
    () => {
        ::std::collections::HashMap::new()
    };
    ($($key:expr => $value:expr),+ $(,)?) => {
        {
            let mut map = ::std::collections::HashMap::new();
            $(
                map.insert($key, $value);
            )+
            map
        }
    };
}

fn main() {
    let scores = hashmap\! {
        "Alice" => 95,
        "Bob" => 87,
        "Charlie" => 92,
    };

    println\!("{:?}", scores);
}
```

### Practical Example: Test Helper Macro

```rust
macro_rules\! assert_approx_eq {
    ($left:expr, $right:expr) => {
        assert_approx_eq\!($left, $right, 1e-6)
    };
    ($left:expr, $right:expr, $epsilon:expr) => {
        {
            let left_val = $left;
            let right_val = $right;
            let diff = (left_val - right_val).abs();
            if diff > $epsilon {
                panic\!(
                    "Assertion failed: {} ≈ {}
  left: {}
  right: {}
  diff: {} (allowed error: {})",
                    stringify\!($left),
                    stringify\!($right),
                    left_val,
                    right_val,
                    diff,
                    $epsilon
                );
            }
        }
    };
}

fn main() {
    let pi = 3.14159265;
    assert_approx_eq\!(pi, 3.14159, 0.0001);
    assert_approx_eq\!(0.1 + 0.2, 0.3, 1e-10);
}
```

---

## Macro Hygiene

Rust macros have partial hygiene, meaning identifiers defined inside macros will not conflict with identifiers in the outer scope.

### Hygiene Example

```rust
macro_rules\! using_a {
    () => {
        let a = 42;
        println\!("a inside macro: {}", a);
    };
}

fn main() {
    let a = 10;
    using_a\!();                           // a inside macro: 42
    println\!("a in main: {}", a);        // a in main: 10
}
```

### Creating Externally Visible Identifiers

Sometimes you need to create variables accessible from outside the macro:

```rust
macro_rules\! create_variable {
    ($name:ident) => {
        let $name = 42;
    };
}

macro_rules\! create_function {
    ($name:ident) => {
        fn $name() {
            println\!("Function {} was called", stringify\!($name));
        }
    };
}

create_function\!(hello);
create_function\!(world);

fn main() {
    create_variable\!(x);
    println\!("x = {}", x); // 42

    hello(); // Function hello was called
    world(); // Function world was called
}
```

---

## Importing and Exporting Macros

### Macros Within Modules

```rust
// For use within the current crate
#[macro_use]
mod macros {
    macro_rules\! my_macro {
        () => { println\!("From macros module"); };
    }
}

fn main() {
    my_macro\!();
}
```

### Exporting Macros to Other Crates

```rust
// lib.rs
#[macro_export]
macro_rules\! public_macro {
    () => {
        println\!("This is a public macro");
    };
}
```

Usage:

```rust
// Method 1: Using #[macro_use]
#[macro_use]
extern crate my_crate;

// Method 2: Using path import (Rust 2018+, recommended)
use my_crate::public_macro;

fn main() {
    public_macro\!();
}
```

---

## Procedural Macros

Procedural macros are more powerful than declarative macros. They are compiler plugins that can manipulate Rust code's TokenStream. Procedural macros must be defined in a separate crate, and that crate needs to set `proc-macro = true`.

### Setting Up a Procedural Macro Crate

```toml
# Cargo.toml
[package]
name = "my_macro"
version = "0.1.0"
edition = "2021"

[lib]
proc-macro = true

[dependencies]
syn = { version = "2.0", features = ["full"] }
quote = "1.0"
proc-macro2 = "1.0"
```

### Core Library Introduction

#### syn

`syn` is used to parse Rust code's TokenStream:

```rust
use syn::{parse_macro_input, DeriveInput};

// Parse struct definition
let ast: DeriveInput = parse_macro_input\!(input);
```

Main types:
- `DeriveInput`: Derive macro input (struct, enum, union)
- `ItemFn`: Function definition
- `Expr`: Expression
- `Type`: Type

#### quote

`quote` is used to generate Rust code:

```rust
use quote::quote;

let tokens = quote\! {
    fn hello() {
        println\!("Hello from macro\!");
    }
};
```

Features:
- `#var`: Insert variable
- `#(#iter)*`: Iteration expansion

---

## Derive Macros

Derive macros are used to automatically implement traits for types.

### Simple Derive Macro

```rust
// my_macro/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(HelloWorld)]
pub fn hello_world_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input\!(input as DeriveInput);
    let name = &ast.ident;

    let gen = quote\! {
        impl HelloWorld for #name {
            fn hello_world() {
                println\!("Hello, World\! I am {}", stringify\!(#name));
            }
        }
    };

    gen.into()
}
```

Using the derive macro:

```rust
use my_macro::HelloWorld;

trait HelloWorld {
    fn hello_world();
}

#[derive(HelloWorld)]
struct MyStruct;

fn main() {
    MyStruct::hello_world(); // Hello, World\! I am MyStruct
}
```

### Derive Macro Processing Fields

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields};

#[proc_macro_derive(Describe)]
pub fn describe_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input\!(input as DeriveInput);
    let name = &ast.ident;

    // Get field information
    let fields = match &ast.data {
        Data::Struct(data) => {
            match &data.fields {
                Fields::Named(fields) => {
                    let field_names = fields.named.iter().map(|f| {
                        let name = &f.ident;
                        quote\! { stringify\!(#name) }
                    });
                    quote\! { vec\![#(#field_names),*] }
                }
                _ => quote\! { vec\![] }
            }
        }
        _ => quote\! { vec\![] }
    };

    let gen = quote\! {
        impl Describe for #name {
            fn describe() -> String {
                let fields: Vec<&str> = #fields;
                format\!("{} has fields: {}", stringify\!(#name), fields.join(", "))
            }
        }
    };

    gen.into()
}
```

Usage example:

```rust
trait Describe {
    fn describe() -> String;
}

#[derive(Describe)]
struct Person {
    name: String,
    age: u32,
    email: String,
}

fn main() {
    println\!("{}", Person::describe());
    // Person has fields: name, age, email
}
```

### Derive Macro with Attributes: Builder Pattern

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields};

#[proc_macro_derive(Builder, attributes(builder))]
pub fn builder_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input\!(input as DeriveInput);
    let name = &ast.ident;
    let builder_name = syn::Ident::new(
        &format\!("{}Builder", name),
        name.span()
    );

    let fields = match &ast.data {
        Data::Struct(data) => match &data.fields {
            Fields::Named(fields) => &fields.named,
            _ => panic\!("Builder only supports structs with named fields"),
        },
        _ => panic\!("Builder only supports structs"),
    };

    let builder_fields = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;
        quote\! { #name: Option<#ty> }
    });

    let builder_defaults = fields.iter().map(|f| {
        let name = &f.ident;
        quote\! { #name: None }
    });

    let builder_methods = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;
        quote\! {
            pub fn #name(mut self, value: #ty) -> Self {
                self.#name = Some(value);
                self
            }
        }
    });

    let build_fields = fields.iter().map(|f| {
        let name = &f.ident;
        let name_str = name.as_ref().map(|n| n.to_string()).unwrap_or_default();
        quote\! {
            #name: self.#name.ok_or(format\!("Field {} not set", #name_str))?
        }
    });

    let gen = quote\! {
        pub struct #builder_name {
            #(#builder_fields,)*
        }

        impl #name {
            pub fn builder() -> #builder_name {
                #builder_name {
                    #(#builder_defaults,)*
                }
            }
        }

        impl #builder_name {
            #(#builder_methods)*

            pub fn build(self) -> Result<#name, String> {
                Ok(#name {
                    #(#build_fields,)*
                })
            }
        }
    };

    gen.into()
}
```

Using the Builder macro:

```rust
use my_macro::Builder;

#[derive(Builder, Debug)]
struct User {
    name: String,
    age: u32,
    email: String,
}

fn main() {
    let user = User::builder()
        .name("John".to_string())
        .age(25)
        .email("john@example.com".to_string())
        .build()
        .unwrap();

    println\!("{:?}", user);
}
```

---

## Attribute Macros

Attribute macros can create custom attributes, more flexible than derive macros, and can be attached to any item.

### Basic Attribute Macro: Timer

```rust
// my_macro/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

#[proc_macro_attribute]
pub fn timing(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input_fn = parse_macro_input\!(item as ItemFn);
    let fn_name = &input_fn.sig.ident;
    let fn_block = &input_fn.block;
    let fn_vis = &input_fn.vis;
    let fn_sig = &input_fn.sig;

    let gen = quote\! {
        #fn_vis #fn_sig {
            let start = std::time::Instant::now();
            let result = (|| #fn_block)();
            let duration = start.elapsed();
            println\!("Function {} execution time: {:?}", stringify\!(#fn_name), duration);
            result
        }
    };

    gen.into()
}
```

Usage:

```rust
use my_macro::timing;

#[timing]
fn expensive_operation() -> u64 {
    std::thread::sleep(std::time::Duration::from_millis(100));
    42
}

fn main() {
    let result = expensive_operation();
    println\!("Result: {}", result);
    // Function expensive_operation execution time: 100.123ms
    // Result: 42
}
```

### Attribute Macro with Parameters: Log Level

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

#[proc_macro_attribute]
pub fn log_call(attr: TokenStream, item: TokenStream) -> TokenStream {
    let input_fn = parse_macro_input\!(item as ItemFn);
    let fn_name = &input_fn.sig.ident;
    let fn_block = &input_fn.block;
    let fn_vis = &input_fn.vis;
    let fn_sig = &input_fn.sig;

    let level = if attr.is_empty() {
        "INFO".to_string()
    } else {
        attr.to_string().trim().to_uppercase()
    };

    let gen = quote\! {
        #fn_vis #fn_sig {
            println\!("[{}] Entering function: {}", #level, stringify\!(#fn_name));
            let start = std::time::Instant::now();
            let result = (|| #fn_block)();
            let duration = start.elapsed();
            println\!("[{}] Leaving function: {}, elapsed: {:?}", #level, stringify\!(#fn_name), duration);
            result
        }
    };

    gen.into()
}
```

Usage:

```rust
use my_macro::log_call;

#[log_call]
fn process_data(data: &str) -> usize {
    std::thread::sleep(std::time::Duration::from_millis(100));
    data.len()
}

#[log_call(debug)]
fn calculate(x: i32, y: i32) -> i32 {
    x + y
}

fn main() {
    let len = process_data("Hello, World\!");
    println\!("Length: {}", len);

    let sum = calculate(10, 20);
    println\!("Sum: {}", sum);
}
```

---

## Function-like Macros

Function-like procedural macros look like function calls but can accept arbitrary tokens, providing greater flexibility.

### SQL Validation Macro

```rust
// my_macro/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, LitStr};

#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
    let input_str = parse_macro_input\!(input as LitStr);
    let sql_query = input_str.value();

    // Simple SQL validation
    let sql_upper = sql_query.to_uppercase();
    if \!sql_upper.starts_with("SELECT")
        && \!sql_upper.starts_with("INSERT")
        && \!sql_upper.starts_with("UPDATE")
        && \!sql_upper.starts_with("DELETE")
    {
        return syn::Error::new(
            input_str.span(),
            "SQL must start with SELECT, INSERT, UPDATE, or DELETE"
        ).to_compile_error().into();
    }

    let gen = quote\! {
        {
            println\!("Executing SQL: {}", #sql_query);
            #sql_query
        }
    };

    gen.into()
}
```

Usage:

```rust
use my_macro::sql;

fn main() {
    let query = sql\!("SELECT * FROM users WHERE id = 1");
    println\!("Query: {}", query);

    // The following will cause a compile-time error:
    // let bad = sql\!("DROP TABLE users");
}
```

### Function-like Macro with Custom Parsing

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse::{Parse, ParseStream}, Token, Ident, LitStr};

struct RouteInput {
    method: Ident,
    path: LitStr,
    handler: Ident,
}

impl Parse for RouteInput {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let method: Ident = input.parse()?;
        input.parse::<Token\![,]>()?;
        let path: LitStr = input.parse()?;
        input.parse::<Token\![,]>()?;
        let handler: Ident = input.parse()?;

        Ok(RouteInput { method, path, handler })
    }
}

#[proc_macro]
pub fn route(input: TokenStream) -> TokenStream {
    let RouteInput { method, path, handler } =
        syn::parse_macro_input\!(input as RouteInput);

    let gen = quote\! {
        Route {
            method: stringify\!(#method).to_uppercase(),
            path: #path.to_string(),
            handler: #handler,
        }
    };

    gen.into()
}
```

Usage:

```rust
struct Route {
    method: String,
    path: String,
    handler: fn(),
}

fn index_handler() {
    println\!("Index page");
}

fn main() {
    let r = route\!(GET, "/index", index_handler);
    println\!("Route: {} {}", r.method, r.path);
}
```

---

## Common Macro Patterns

### Internal Rules Pattern

Use `@` prefix to define internal helper rules, avoiding public API pollution:

```rust
macro_rules\! count_tts {
    // Public entry
    ($($tts:tt)*) => {
        count_tts\!(@count 0, $($tts)*)
    };
    // Internal rules
    (@count $acc:expr,) => { $acc };
    (@count $acc:expr, $_tt:tt $($rest:tt)*) => {
        count_tts\!(@count ($acc + 1), $($rest)*)
    };
}

fn main() {
    println\!("{}", count_tts\!(a b c d e)); // 5
}
```

### Accumulator Pattern

```rust
macro_rules\! reverse {
    // Entry: initialize empty accumulator
    ($($items:expr),*) => {
        reverse\!(@acc [], $($items),*)
    };
    // Base case: all items processed
    (@acc [$($reversed:expr),*],) => {
        vec\![$($reversed),*]
    };
    // Recursion: move first item to front of accumulator
    (@acc [$($reversed:expr),*], $first:expr $(, $rest:expr)*) => {
        reverse\!(@acc [$first $(, $reversed)*], $($rest),*)
    };
}

fn main() {
    let v = reverse\![1, 2, 3, 4, 5];
    println\!("{:?}", v); // [5, 4, 3, 2, 1]
}
```

### TT Muncher (Token Tree Consumer)

Process tokens one by one, suitable for handling mixed syntax:

```rust
macro_rules\! mixed_rules {
    () => {};
    (add $a:expr, $b:expr; $($tail:tt)*) => {
        {
            println\!("{} + {} = {}", $a, $b, $a + $b);
            mixed_rules\!($($tail)*);
        }
    };
    (mul $a:expr, $b:expr; $($tail:tt)*) => {
        {
            println\!("{} * {} = {}", $a, $b, $a * $b);
            mixed_rules\!($($tail)*);
        }
    };
}

fn main() {
    mixed_rules\! {
        add 1, 2;
        mul 3, 4;
        add 5, 6;
    }
    // 1 + 2 = 3
    // 3 * 4 = 12
    // 5 + 6 = 11
}
```

### Callback Pattern

```rust
macro_rules\! call_with_values {
    ($callback:ident, $($values:expr),*) => {
        $callback\!($($values),*)
    };
}

macro_rules\! sum {
    ($($x:expr),*) => {
        {
            let mut total = 0;
            $(total += $x;)*
            total
        }
    };
}

macro_rules\! product {
    ($($x:expr),*) => {
        {
            let mut total = 1;
            $(total *= $x;)*
            total
        }
    };
}

fn main() {
    let s = call_with_values\!(sum, 1, 2, 3, 4, 5);
    let p = call_with_values\!(product, 1, 2, 3, 4, 5);
    println\!("Sum: {}, Product: {}", s, p); // Sum: 15, Product: 120
}
```

---

## Practical Examples

### Simple Test Framework

```rust
static mut PASSED: usize = 0;
static mut FAILED: usize = 0;

macro_rules\! test_case {
    ($name:ident, $body:block) => {
        fn $name() {
            print\!("Test {} ... ", stringify\!($name));
            let result = std::panic::catch_unwind(|| $body);
            match result {
                Ok(_) => {
                    println\!("passed");
                    unsafe { PASSED += 1; }
                }
                Err(_) => {
                    println\!("failed");
                    unsafe { FAILED += 1; }
                }
            }
        }
    };
}

macro_rules\! assert_eq_custom {
    ($left:expr, $right:expr) => {
        if $left \!= $right {
            panic\!("Assertion failed: {} \!= {}", $left, $right);
        }
    };
    ($left:expr, $right:expr, $msg:expr) => {
        if $left \!= $right {
            panic\!("{}: {} \!= {}", $msg, $left, $right);
        }
    };
}

macro_rules\! run_tests {
    ($($test:ident),* $(,)?) => {
        fn main() {
            println\!("Running tests...
");
            $($test();)*
            println\!("
Tests completed:");
            unsafe {
                println\!("  Passed: {}", PASSED);
                println\!("  Failed: {}", FAILED);
            }
        }
    };
}

test_case\!(test_addition, {
    assert_eq_custom\!(2 + 2, 4);
});

test_case\!(test_subtraction, {
    assert_eq_custom\!(5 - 3, 2);
});

test_case\!(test_will_fail, {
    assert_eq_custom\!(1, 2, "Intentionally failing test");
});

run_tests\!(test_addition, test_subtraction, test_will_fail);
```

### HTML DSL Builder

```rust
macro_rules\! html {
    // Self-closing tag
    ($tag:ident []) => {
        format\!("<{} />", stringify\!($tag))
    };

    // Self-closing tag with attributes
    ($tag:ident [$($attr:ident = $val:expr),*]) => {
        format\!(
            "<{} {} />",
            stringify\!($tag),
            vec\![$(format\!("{}="{}"", stringify\!($attr), $val)),*].join(" ")
        )
    };

    // Tag with content
    ($tag:ident { $($inner:tt)* }) => {
        format\!(
            "<{}>{}</{}>",
            stringify\!($tag),
            html\!(@inner $($inner)*),
            stringify\!($tag)
        )
    };

    // Tag with attributes and content
    ($tag:ident [$($attr:ident = $val:expr),*] { $($inner:tt)* }) => {
        format\!(
            "<{} {}>{}</{}>",
            stringify\!($tag),
            vec\![$(format\!("{}="{}"", stringify\!($attr), $val)),*].join(" "),
            html\!(@inner $($inner)*),
            stringify\!($tag)
        )
    };

    // Internal rule: process content
    (@inner) => { String::new() };
    (@inner $text:literal) => { $text.to_string() };
    (@inner $($tag:ident $($rest:tt)*);* $(;)?) => {
        vec\![$(html\!($tag $($rest)*)),*].join("")
    };
}

fn main() {
    let page = html\! {
        html {
            head {
                title { "My Page" }
            };
            body [class = "main"] {
                h1 { "Welcome" };
                p { "This is a paragraph." };
                br [];
                div [id = "content", class = "container"] {
                    span { "Nested content" }
                }
            }
        }
    };

    println\!("{}", page);
}
```

### Enum Helper Methods Auto-generation

```rust
#[proc_macro_derive(EnumMethods)]
pub fn enum_methods_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input\!(input as DeriveInput);
    let name = &ast.ident;

    let variants = match &ast.data {
        Data::Enum(data) => &data.variants,
        _ => panic\!("EnumMethods only works on enums"),
    };

    let variant_names: Vec<_> = variants.iter()
        .map(|v| &v.ident)
        .collect();

    let as_str_arms = variants.iter().map(|v| {
        let variant = &v.ident;
        let name_str = variant.to_string();
        quote\! { #name::#variant => #name_str }
    });

    let from_str_arms = variants.iter().map(|v| {
        let variant = &v.ident;
        let name_str = variant.to_string();
        quote\! { #name_str => Ok(#name::#variant) }
    });

    let gen = quote\! {
        impl #name {
            pub fn as_str(&self) -> &'static str {
                match self {
                    #(#as_str_arms,)*
                }
            }

            pub fn variants() -> &'static [&'static str] {
                &[#(stringify\!(#variant_names)),*]
            }

            pub fn from_str(s: &str) -> Result<Self, String> {
                match s {
                    #(#from_str_arms,)*
                    _ => Err(format\!("Unknown variant: {}", s))
                }
            }
        }
    };

    gen.into()
}
```

Usage:

```rust
#[derive(EnumMethods)]
enum Color {
    Red,
    Green,
    Blue,
}

fn main() {
    println\!("{}", Color::Red.as_str());   // "Red"
    println\!("{:?}", Color::variants());    // ["Red", "Green", "Blue"]

    let color = Color::from_str("Green").unwrap();
    println\!("{}", color.as_str());         // "Green"
}
```

---

## Debugging Macros

### Using cargo expand

```bash
# Install cargo-expand
cargo install cargo-expand

# View macro expanded code
cargo expand

# View macro expansion for specific function
cargo expand --lib fn_name
```

### Using trace_macros (nightly)

```rust
#\![feature(trace_macros)]

trace_macros\!(true);
let v = vec\![1, 2, 3];
trace_macros\!(false);
```

### Using stringify\! for Debugging

```rust
macro_rules\! debug_print {
    ($expr:expr) => {
        println\!("{} = {:?}", stringify\!($expr), $expr);
    };
}

fn main() {
    let x = 42;
    debug_print\!(x);        // x = 42
    debug_print\!(x * 2);    // x * 2 = 84
    debug_print\!(vec\![1,2]); // vec\![1, 2] = [1, 2]
}
```

### Procedural Macro Debugging

```rust
#[proc_macro]
pub fn my_macro(input: TokenStream) -> TokenStream {
    // Print input tokens
    eprintln\!("Input tokens: {}", input);

    let ast = parse_macro_input\!(input as DeriveInput);
    eprintln\!("Parsed AST: {:#?}", ast);

    let output = quote\! { /* ... */ };
    eprintln\!("Output tokens: {}", output);

    output.into()
}
```

---

## Best Practices

### Error Handling

Use `syn::Error` to provide friendly compile-time error messages:

```rust
use syn::{Error, spanned::Spanned};

#[proc_macro_derive(MyMacro)]
pub fn my_macro_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input\!(input as DeriveInput);

    match &ast.data {
        Data::Struct(_) => { /* Normal processing */ }
        _ => {
            return Error::new(
                ast.span(),
                "MyMacro only supports structs"
            )
            .to_compile_error()
            .into();
        }
    }

    // ...
}
```

### Use Full Paths

Avoid relying on imported names, use full paths:

```rust
macro_rules\! create_vec {
    ($($elem:expr),*) => {
        // Use full path to avoid name conflicts
        ::std::vec\![$($elem),*]
    };
}
```

### Keep Macros Simple

- Prefer functions, only use macros when necessary
- Each macro should do one thing
- Extract complex logic into helper functions

```rust
fn impl_my_trait(ast: &DeriveInput) -> TokenStream {
    let name = &ast.ident;
    let gen = quote\! {
        impl MyTrait for #name {
            // ...
        }
    };
    gen.into()
}

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input\!(input as DeriveInput);
    impl_my_trait(&ast)
}
```

### Document Macros

```rust
/// Creates a HashMap containing the specified elements.
///
/// # Example
///
/// \`\`\`
/// let map = hashmap\! {
///     "key1" => "value1",
///     "key2" => "value2",
/// };
/// assert_eq\!(map.get("key1"), Some(&"value1"));
/// \`\`\`
#[macro_export]
macro_rules\! hashmap {
    ($($key:expr => $value:expr),* $(,)?) => {
        {
            let mut map = ::std::collections::HashMap::new();
            $(map.insert($key, $value);)*
            map
        }
    };
}
```

### Test Macros

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hashmap_macro() {
        let map = hashmap\! {
            "a" => 1,
            "b" => 2,
        };
        assert_eq\!(map.get("a"), Some(&1));
        assert_eq\!(map.get("b"), Some(&2));
        assert_eq\!(map.len(), 2);
    }

    #[test]
    fn test_empty_hashmap() {
        let map: std::collections::HashMap<&str, i32> = hashmap\![];
        assert\!(map.is_empty());
    }
}
```

---

## Performance Considerations

### Compile Time

- Macros increase compile time, especially complex procedural macros
- Use `cargo build --timings` to analyze compile time

### Generated Code Size

- Avoid generating too much repetitive code
- Consider using generics instead of macros to reduce code bloat

### Caching and Incremental Compilation

- Changes to procedural macros cause all dependent code to recompile
- Separate macro definitions from implementations into different crates

---

## Summary

Rust's macro system provides powerful metaprogramming capabilities:

| Macro Type | Use Case | Complexity |
|------------|----------|------------|
| Declarative Macros (`macro_rules\!`) | Simple code generation and pattern substitution | Low |
| Derive Macros | Automatically implement traits for types | Medium |
| Attribute Macros | Enhance or modify item behavior | Medium-High |
| Function-like Macros | Custom syntax and DSL | High |

Selection recommendations:
- **Simple repetitive code** -> Declarative macros
- **Trait implementation** -> Derive macros
- **Function/struct enhancement** -> Attribute macros
- **Custom syntax** -> Function-like macros

Mastering `syn` and `quote` is key to writing procedural macros. By combining these tools, you can create powerful compile-time code generation tools, reduce boilerplate code, and boost developer productivity. However, be careful not to overuse macros, as it may reduce code readability and maintainability.

---

## Reference Resources

- [The Rust Programming Language - Macros](https://doc.rust-lang.org/book/ch19-06-macros.html)
- [The Little Book of Rust Macros](https://danielkeep.github.io/tlborm/book/)
- [syn Documentation](https://docs.rs/syn/)
- [quote Documentation](https://docs.rs/quote/)
- [Procedural Macros Workshop](https://github.com/dtolnay/proc-macro-workshop)
