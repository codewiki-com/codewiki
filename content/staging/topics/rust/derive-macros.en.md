---
title: Rust Derive Macros
description: "Deep dive into Rust derive macros: #[derive], proc_macro_derive, syn, quote, and custom derive macro implementation"
track: rust
section: traits-generics
difficulty: advanced
tags:
  - Rust
  - Macros
  - Derive Macros
  - Procedural Macros
  - syn
  - quote
status: imported
origin: old/src/content/docs/rust/derive-macros.en.md
divergence: 0.2
issues: []
legacy:
  category: Rust
  subcategory: Metaprogramming
  order: 8
  lastUpdated: 2026-01-07
---

Derive macros are the most commonly used form of Rust's procedural macro system. They allow you to automatically implement traits for types through the `#[derive(...)]` attribute. From standard library traits like `Debug` and `Clone` to third-party traits like `Serialize` and `Deserialize`, derive macros significantly reduce boilerplate code and boost developer productivity.

## Concept Explanation

### What Are Derive Macros

Derive macros are a special kind of procedural macro that receives struct, enum, or union definitions as input at compile time, then generates additional code (usually trait implementations) attached to the original type.

```rust
// Using derive macros
#[derive(Debug, Clone, PartialEq)]
struct User {
    name: String,
    age: u32,
}

// The compiler automatically generates code equivalent to:
// impl Debug for User { ... }
// impl Clone for User { ... }
// impl PartialEq for User { ... }
```

The name "derive macro" comes from the concept of "deriving" — deriving trait implementations from type definitions.

### Differences Between Derive Macros and Other Macros

Rust provides three types of procedural macros:

| Macro Type | Syntax | Purpose | Input | Output |
|-----------|--------|---------|-------|--------|
| **Derive Macros** | `#[derive(MacroName)]` | Auto-implement traits | Type definitions | Add new code |
| **Attribute Macros** | `#[macro_name]` | Modify or enhance items | Any item | Replace or enhance |
| **Function-like Macros** | `macro_name!(...)` | Custom syntax | Any tokens | Any tokens |

The unique characteristics of derive macros:
1. **Only applicable to type definitions** (struct, enum, union)
2. **Only adds code, does not modify original definitions**
3. **Can define helper attributes** for configuring generation behavior

### Why Do We Need Derive Macros

Manually implementing common traits for each type is both tedious and error-prone. Take the `Debug` trait as an example:

```rust
// Without derive macros, manual implementation required
struct Point {
    x: i32,
    y: i32,
}

impl std::fmt::Debug for Point {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Point")
            .field("x", &self.x)
            .field("y", &self.y)
            .finish()
    }
}

// With derive macros, one line does it all
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}
```

Advantages of derive macros:
- **Reduce boilerplate code**: Automatically generate repetitive code
- **Maintain consistency**: Ensure implementations follow uniform patterns
- **Reduce errors**: Machine-generated code is more reliable than handwritten code
- **Improve maintainability**: Implementations auto-update when fields change

## Core Principles

### Derive Macro Workflow

Derive macros go through the following stages during compilation:

```
┌─────────────────────────────────────────────────────────────┐
│                      Source Code                             │
│   #[derive(MyTrait)]                                        │
│   struct Foo { ... }                                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Lexical & Syntax Analysis                   │
│                   Generate TokenStream                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Derive Macro Function                      │
│   #[proc_macro_derive(MyTrait)]                             │
│   pub fn my_trait_derive(input: TokenStream) -> TokenStream │
│                                                              │
│   1. Use syn to parse TokenStream into AST                   │
│   2. Analyze type structure (name, fields, attributes, etc.) │
│   3. Use quote to generate new TokenStream                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Merge Code                              │
│       Original type definition + generated trait impl        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Continue Compilation                       │
│           Type checking, borrow checking, code generation    │
└─────────────────────────────────────────────────────────────┘
```

### TokenStream and AST

The core data structure that derive macros operate on is `TokenStream` — a token sequence representation of Rust code.

```rust
use proc_macro::TokenStream;

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    // input contains the token sequence of the annotated type
    // return value is the new token sequence to add to the code
    todo!()
}
```

Directly manipulating `TokenStream` is complex, so we use helper libraries:
- **syn**: Parses `TokenStream` into a structured AST
- **quote**: Generates `TokenStream` from Rust code templates

### Core Concepts of the syn Library

`syn` provides rich types to represent Rust's syntax structures:

```rust
use syn::{DeriveInput, Data, Fields, Ident, Type};

// DeriveInput represents the input to a derive macro
pub struct DeriveInput {
    pub attrs: Vec<Attribute>,    // Attribute list
    pub vis: Visibility,          // Visibility
    pub ident: Ident,             // Type name
    pub generics: Generics,       // Generic parameters
    pub data: Data,               // Type content
}

// Data represents the concrete form of the type
pub enum Data {
    Struct(DataStruct),  // Struct
    Enum(DataEnum),      // Enum
    Union(DataUnion),    // Union
}

// Fields represents the field collection
pub enum Fields {
    Named(FieldsNamed),      // Named fields { x: i32, y: i32 }
    Unnamed(FieldsUnnamed),  // Tuple fields (i32, i32)
    Unit,                    // Unit type
}
```

### Core Concepts of the quote Library

`quote` provides the `quote!` macro for writing code generation templates:

```rust
use quote::quote;
use syn::Ident;

let name = Ident::new("MyStruct", proc_macro2::Span::call_site());
let field_name = Ident::new("value", proc_macro2::Span::call_site());

let expanded = quote! {
    impl Default for #name {
        fn default() -> Self {
            Self {
                #field_name: Default::default(),
            }
        }
    }
};

// quote! interpolation syntax:
// #var         - Insert variable
// #(#iter)*    - Iterate expansion (no separator)
// #(#iter),*   - Iterate expansion (comma separated)
// #(#iter);*   - Iterate expansion (semicolon separated)
```

## Key Points

### Derive Macro Crate Configuration

Derive macros must be defined in a separate crate with special configuration:

```toml
# Cargo.toml
[package]
name = "my_derive"
version = "0.1.0"
edition = "2021"

[lib]
proc-macro = true  # Key: Declare as procedural macro crate

[dependencies]
syn = { version = "2.0", features = ["full"] }
quote = "1.0"
proc-macro2 = "1.0"
```

### Basic Derive Macro Structure

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    // 1. Parse input
    let input = parse_macro_input!(input as DeriveInput);

    // 2. Extract information
    let name = &input.ident;

    // 3. Generate code
    let expanded = quote! {
        impl MyTrait for #name {
            fn my_method(&self) {
                println!("MyTrait implemented for {}", stringify!(#name));
            }
        }
    };

    // 4. Return generated TokenStream
    TokenStream::from(expanded)
}
```

### Helper Attributes

Derive macros can define helper attributes for providing extra configuration on fields or variants:

```rust
#[proc_macro_derive(MyTrait, attributes(my_attr))]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    // Now we can recognize the #[my_attr] attribute
    todo!()
}

// Usage
#[derive(MyTrait)]
struct Config {
    #[my_attr(skip)]        // Helper attribute
    internal_field: String,

    #[my_attr(rename = "userName")]
    user_name: String,
}
```

### Handling Generics

Derive macros need to properly handle generic parameters:

```rust
use syn::{parse_macro_input, DeriveInput, GenericParam, Generics};
use quote::quote;

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;
    let generics = &input.generics;

    // Split generic parameters for different positions
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();

    let expanded = quote! {
        impl #impl_generics MyTrait for #name #ty_generics #where_clause {
            fn my_method(&self) {
                // ...
            }
        }
    };

    TokenStream::from(expanded)
}
```

For `struct Container<T> where T: Clone`, `split_for_impl()` returns:
- `impl_generics`: `<T>`
- `ty_generics`: `<T>`
- `where_clause`: `where T: Clone`

## Code Examples

### Example 1: Implementing a Describe Trait

A simple derive macro that prints type information:

```rust
// my_derive/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Data, DeriveInput, Fields};

#[proc_macro_derive(Describe)]
pub fn describe_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    // Get field information
    let field_descriptions = match &input.data {
        Data::Struct(data) => {
            match &data.fields {
                Fields::Named(fields) => {
                    let field_info = fields.named.iter().map(|f| {
                        let field_name = f.ident.as_ref().unwrap();
                        let field_type = &f.ty;
                        quote! {
                            format!("  {}: {}",
                                stringify!(#field_name),
                                stringify!(#field_type))
                        }
                    });
                    quote! {
                        vec![#(#field_info),*].join("\n")
                    }
                }
                Fields::Unnamed(fields) => {
                    let field_info = fields.unnamed.iter().enumerate().map(|(i, f)| {
                        let field_type = &f.ty;
                        quote! {
                            format!("  {}: {}", #i, stringify!(#field_type))
                        }
                    });
                    quote! {
                        vec![#(#field_info),*].join("\n")
                    }
                }
                Fields::Unit => quote! { String::from("  (unit struct)") },
            }
        }
        Data::Enum(data) => {
            let variant_info = data.variants.iter().map(|v| {
                let variant_name = &v.ident;
                quote! {
                    format!("  - {}", stringify!(#variant_name))
                }
            });
            quote! {
                vec![#(#variant_info),*].join("\n")
            }
        }
        Data::Union(_) => {
            quote! { String::from("  (union type)") }
        }
    };

    let type_kind = match &input.data {
        Data::Struct(_) => "struct",
        Data::Enum(_) => "enum",
        Data::Union(_) => "union",
    };

    let expanded = quote! {
        impl Describe for #name {
            fn describe() -> String {
                format!(
                    "{} {} {{\n{}\n}}",
                    #type_kind,
                    stringify!(#name),
                    #field_descriptions
                )
            }
        }
    };

    TokenStream::from(expanded)
}
```

Usage example:

```rust
// In another crate
use my_derive::Describe;

trait Describe {
    fn describe() -> String;
}

#[derive(Describe)]
struct User {
    id: u64,
    name: String,
    email: Option<String>,
}

#[derive(Describe)]
enum Status {
    Active,
    Inactive,
    Pending,
}

fn main() {
    println!("{}", User::describe());
    // Output:
    // struct User {
    //   id: u64
    //   name: String
    //   email: Option<String>
    // }

    println!("{}", Status::describe());
    // Output:
    // enum Status {
    //   - Active
    //   - Inactive
    //   - Pending
    // }
}
```

### Example 2: Builder Derive Macro with Attributes

Implementing a full-featured Builder pattern derive macro:

```rust
// my_derive/src/lib.rs
use proc_macro::TokenStream;
use quote::{quote, format_ident};
use syn::{parse_macro_input, Data, DeriveInput, Fields, Lit, Meta, NestedMeta};

#[proc_macro_derive(Builder, attributes(builder))]
pub fn builder_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;
    let builder_name = format_ident!("{}Builder", name);

    let fields = match &input.data {
        Data::Struct(data) => match &data.fields {
            Fields::Named(fields) => &fields.named,
            _ => panic!("Builder only supports structs with named fields"),
        },
        _ => panic!("Builder only supports structs"),
    };

    // Generate Builder struct fields
    let builder_fields = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;

        // Check for default attribute
        let has_default = f.attrs.iter().any(|attr| {
            attr.path.is_ident("builder") &&
            attr.parse_meta().ok().map(|m| {
                if let Meta::List(list) = m {
                    list.nested.iter().any(|n| {
                        matches!(n, NestedMeta::Meta(Meta::Path(p)) if p.is_ident("default"))
                    })
                } else {
                    false
                }
            }).unwrap_or(false)
        });

        if has_default {
            quote! { #name: #ty }
        } else {
            quote! { #name: Option<#ty> }
        }
    });

    // Generate Builder default values
    let builder_defaults = fields.iter().map(|f| {
        let name = &f.ident;

        let has_default = f.attrs.iter().any(|attr| {
            attr.path.is_ident("builder") &&
            attr.parse_meta().ok().map(|m| {
                if let Meta::List(list) = m {
                    list.nested.iter().any(|n| {
                        matches!(n, NestedMeta::Meta(Meta::Path(p)) if p.is_ident("default"))
                    })
                } else {
                    false
                }
            }).unwrap_or(false)
        });

        if has_default {
            quote! { #name: Default::default() }
        } else {
            quote! { #name: None }
        }
    });

    // Generate setter methods
    let setters = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;

        let has_default = f.attrs.iter().any(|attr| {
            attr.path.is_ident("builder") &&
            attr.parse_meta().ok().map(|m| {
                if let Meta::List(list) = m {
                    list.nested.iter().any(|n| {
                        matches!(n, NestedMeta::Meta(Meta::Path(p)) if p.is_ident("default"))
                    })
                } else {
                    false
                }
            }).unwrap_or(false)
        });

        if has_default {
            quote! {
                pub fn #name(mut self, value: #ty) -> Self {
                    self.#name = value;
                    self
                }
            }
        } else {
            quote! {
                pub fn #name(mut self, value: #ty) -> Self {
                    self.#name = Some(value);
                    self
                }
            }
        }
    });

    // Generate field extraction in build method
    let build_fields = fields.iter().map(|f| {
        let name = &f.ident;
        let name_str = name.as_ref().unwrap().to_string();

        let has_default = f.attrs.iter().any(|attr| {
            attr.path.is_ident("builder") &&
            attr.parse_meta().ok().map(|m| {
                if let Meta::List(list) = m {
                    list.nested.iter().any(|n| {
                        matches!(n, NestedMeta::Meta(Meta::Path(p)) if p.is_ident("default"))
                    })
                } else {
                    false
                }
            }).unwrap_or(false)
        });

        if has_default {
            quote! { #name: self.#name }
        } else {
            quote! {
                #name: self.#name.ok_or_else(|| {
                    format!("Field '{}' not set", #name_str)
                })?
            }
        }
    });

    let expanded = quote! {
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
            #(#setters)*

            pub fn build(self) -> Result<#name, String> {
                Ok(#name {
                    #(#build_fields,)*
                })
            }
        }
    };

    TokenStream::from(expanded)
}
```

Usage example:

```rust
use my_derive::Builder;

#[derive(Builder, Debug)]
struct Server {
    host: String,
    port: u16,
    #[builder(default)]
    max_connections: usize,
    #[builder(default)]
    timeout_ms: u64,
}

fn main() {
    let server = Server::builder()
        .host("localhost".to_string())
        .port(8080)
        .max_connections(100)
        .build()
        .unwrap();

    println!("{:?}", server);
    // Server { host: "localhost", port: 8080, max_connections: 100, timeout_ms: 0 }

    // Required field not set will cause error
    let result = Server::builder()
        .host("localhost".to_string())
        .build();

    assert!(result.is_err());
    println!("{}", result.unwrap_err()); // Field 'port' not set
}
```

### Example 3: FromStr Derive Macro for Enums

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Data, DeriveInput};

#[proc_macro_derive(EnumFromStr)]
pub fn enum_from_str_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    let variants = match &input.data {
        Data::Enum(data) => &data.variants,
        _ => panic!("EnumFromStr only supports enum types"),
    };

    // Generate match arms
    let match_arms = variants.iter().map(|v| {
        let variant = &v.ident;
        let variant_str = variant.to_string();
        let variant_lower = variant_str.to_lowercase();

        quote! {
            #variant_str | #variant_lower => Ok(#name::#variant)
        }
    });

    // Generate variant name list for error message
    let variant_names: Vec<_> = variants.iter()
        .map(|v| v.ident.to_string())
        .collect();
    let variants_str = variant_names.join(", ");

    let expanded = quote! {
        impl std::str::FromStr for #name {
            type Err = String;

            fn from_str(s: &str) -> Result<Self, Self::Err> {
                match s {
                    #(#match_arms,)*
                    _ => Err(format!(
                        "Invalid value '{}', valid options: {}",
                        s,
                        #variants_str
                    ))
                }
            }
        }

        impl #name {
            pub fn variants() -> &'static [&'static str] {
                &[#(#variant_names),*]
            }
        }
    };

    TokenStream::from(expanded)
}
```

Usage example:

```rust
use my_derive::EnumFromStr;

#[derive(EnumFromStr, Debug, PartialEq)]
enum Color {
    Red,
    Green,
    Blue,
}

fn main() {
    let color: Color = "Red".parse().unwrap();
    assert_eq!(color, Color::Red);

    let color: Color = "green".parse().unwrap();  // Case insensitive
    assert_eq!(color, Color::Green);

    let result: Result<Color, _> = "Yellow".parse();
    assert!(result.is_err());
    println!("{}", result.unwrap_err());
    // Invalid value 'Yellow', valid options: Red, Green, Blue

    println!("Available colors: {:?}", Color::variants());
    // Available colors: ["Red", "Green", "Blue"]
}
```

### Example 4: Debug Derive Macro for Generic Structs

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Data, DeriveInput, Fields, GenericParam};

#[proc_macro_derive(CustomDebug)]
pub fn custom_debug_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;
    let generics = &input.generics;

    // Add Debug bound to all type parameters
    let mut generics_with_bounds = generics.clone();
    for param in &mut generics_with_bounds.params {
        if let GenericParam::Type(type_param) = param {
            type_param.bounds.push(syn::parse_quote!(std::fmt::Debug));
        }
    }

    let (impl_generics, ty_generics, where_clause) = generics_with_bounds.split_for_impl();

    let debug_impl = match &input.data {
        Data::Struct(data) => {
            match &data.fields {
                Fields::Named(fields) => {
                    let field_debug = fields.named.iter().map(|f| {
                        let field_name = f.ident.as_ref().unwrap();
                        let field_str = field_name.to_string();
                        quote! {
                            .field(#field_str, &self.#field_name)
                        }
                    });

                    let name_str = name.to_string();
                    quote! {
                        f.debug_struct(#name_str)
                            #(#field_debug)*
                            .finish()
                    }
                }
                Fields::Unnamed(fields) => {
                    let field_debug = (0..fields.unnamed.len()).map(|i| {
                        let index = syn::Index::from(i);
                        quote! {
                            .field(&self.#index)
                        }
                    });

                    let name_str = name.to_string();
                    quote! {
                        f.debug_tuple(#name_str)
                            #(#field_debug)*
                            .finish()
                    }
                }
                Fields::Unit => {
                    let name_str = name.to_string();
                    quote! {
                        write!(f, #name_str)
                    }
                }
            }
        }
        _ => panic!("CustomDebug only supports structs"),
    };

    let expanded = quote! {
        impl #impl_generics std::fmt::Debug for #name #ty_generics #where_clause {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                #debug_impl
            }
        }
    };

    TokenStream::from(expanded)
}
```

Usage example:

```rust
use my_derive::CustomDebug;

#[derive(CustomDebug)]
struct Container<T> {
    value: T,
    count: usize,
}

#[derive(CustomDebug)]
struct Point(i32, i32);

#[derive(CustomDebug)]
struct Unit;

fn main() {
    let container = Container { value: "hello", count: 5 };
    println!("{:?}", container);
    // Container { value: "hello", count: 5 }

    let point = Point(10, 20);
    println!("{:?}", point);
    // Point(10, 20)

    println!("{:?}", Unit);
    // Unit
}
```

## Best Practices

### Provide Clear Compile-Time Error Messages

```rust
use syn::spanned::Spanned;
use syn::Error;

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    // Use syn::Error for errors with location information
    if let Data::Enum(_) = &input.data {
        return Error::new(
            input.ident.span(),
            "MyTrait does not support enums, please use a struct"
        )
        .to_compile_error()
        .into();
    }

    // Validate fields
    if let Data::Struct(data) = &input.data {
        if let Fields::Named(fields) = &data.fields {
            for field in &fields.named {
                if field.ident.as_ref().unwrap().to_string().starts_with("_") {
                    return Error::new(
                        field.span(),
                        "Field names cannot start with underscore"
                    )
                    .to_compile_error()
                    .into();
                }
            }
        }
    }

    // Normal processing...
    todo!()
}
```

### Use Full Paths to Avoid Name Conflicts

```rust
let expanded = quote! {
    // Use full paths
    impl ::std::fmt::Debug for #name {
        fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
            ::std::write!(f, "{}", stringify!(#name))
        }
    }
};
```

### Separate Logic into Helper Functions

```rust
fn generate_field_impl(fields: &Fields) -> proc_macro2::TokenStream {
    match fields {
        Fields::Named(fields) => {
            let field_impls = fields.named.iter().map(|f| {
                let name = &f.ident;
                quote! { self.#name.process() }
            });
            quote! { #(#field_impls;)* }
        }
        // ...
    }
}

fn generate_struct_impl(data: &DataStruct, name: &Ident) -> proc_macro2::TokenStream {
    let field_impl = generate_field_impl(&data.fields);
    quote! {
        impl Process for #name {
            fn process(&self) {
                #field_impl
            }
        }
    }
}

#[proc_macro_derive(Process)]
pub fn process_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    match &input.data {
        Data::Struct(data) => {
            generate_struct_impl(data, &input.ident).into()
        }
        _ => panic!("Unsupported type"),
    }
}
```

### Use Attribute Configuration Appropriately

```rust
// Define configuration structure
struct FieldConfig {
    skip: bool,
    rename: Option<String>,
}

fn parse_field_config(field: &syn::Field) -> FieldConfig {
    let mut config = FieldConfig {
        skip: false,
        rename: None,
    };

    for attr in &field.attrs {
        if !attr.path.is_ident("my_attr") {
            continue;
        }

        if let Ok(Meta::List(list)) = attr.parse_meta() {
            for nested in &list.nested {
                match nested {
                    NestedMeta::Meta(Meta::Path(path)) if path.is_ident("skip") => {
                        config.skip = true;
                    }
                    NestedMeta::Meta(Meta::NameValue(nv)) if nv.path.is_ident("rename") => {
                        if let Lit::Str(s) = &nv.lit {
                            config.rename = Some(s.value());
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    config
}
```

### Write Tests

Derive macro tests typically use `trybuild` or integration tests:

```rust
// tests/derive_test.rs
use my_derive::MyTrait;

trait MyTrait {
    fn do_something(&self) -> String;
}

#[derive(MyTrait)]
struct TestStruct {
    name: String,
    value: i32,
}

#[test]
fn test_derive() {
    let s = TestStruct {
        name: "test".to_string(),
        value: 42,
    };
    assert_eq!(s.do_something(), "TestStruct { name, value }");
}

// Use trybuild for compilation error tests
#[test]
fn ui_tests() {
    let t = trybuild::TestCases::new();
    t.compile_fail("tests/ui/*.rs");
}
```

## Common Pitfalls

### Pitfall 1: Forgetting to Handle Generics

```rust
// Wrong example
let expanded = quote! {
    impl MyTrait for #name {  // Missing generic parameters
        // ...
    }
};

// Correct example
let (impl_generics, ty_generics, where_clause) = input.generics.split_for_impl();

let expanded = quote! {
    impl #impl_generics MyTrait for #name #ty_generics #where_clause {
        // ...
    }
};
```

### Pitfall 2: Incomplete Attribute Parsing

```rust
// Helper attributes not declared in proc_macro_derive will cause compiler error
#[proc_macro_derive(MyTrait)]  // Wrong: my_attr not declared
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    // Trying to use #[my_attr] will fail
}

// Correct: Declare helper attributes
#[proc_macro_derive(MyTrait, attributes(my_attr))]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    // Now #[my_attr] can be used
}
```

### Pitfall 3: Generated Code Missing Use Imports

```rust
// Wrong: Assumes user imported HashMap
let expanded = quote! {
    impl #name {
        fn to_map(&self) -> HashMap<String, String> {  // HashMap might not be found
            // ...
        }
    }
};

// Correct: Use full path
let expanded = quote! {
    impl #name {
        fn to_map(&self) -> ::std::collections::HashMap<String, String> {
            // ...
        }
    }
};
```

### Pitfall 4: Not Handling All Field Types

```rust
// Only handles named fields, tuple structs will panic
let fields = match &input.data {
    Data::Struct(data) => match &data.fields {
        Fields::Named(fields) => &fields.named,
        _ => panic!("Only supports named fields"),  // Should provide better error message
    },
    _ => panic!("Only supports structs"),
};

// Better approach: Return compile error
let fields = match &input.data {
    Data::Struct(data) => match &data.fields {
        Fields::Named(fields) => &fields.named,
        Fields::Unnamed(_) => {
            return Error::new(
                input.ident.span(),
                "This derive macro does not support tuple structs, please use named fields"
            )
            .to_compile_error()
            .into();
        }
        Fields::Unit => {
            return Error::new(
                input.ident.span(),
                "This derive macro does not support unit structs"
            )
            .to_compile_error()
            .into();
        }
    },
    _ => {
        return Error::new(
            input.ident.span(),
            "This derive macro only supports structs"
        )
        .to_compile_error()
        .into();
    }
};
```

### Pitfall 5: Lifetime Issues in quote

```rust
// Wrong: Lifetime annotations need escaping
let expanded = quote! {
    impl<'a> MyTrait<'a> for #name {  // Compile error
        // ...
    }
};

// Correct: Using quote's lifetime syntax
let expanded = quote! {
    impl<'a> MyTrait<'a> for #name {  // Actually this is correct
        fn get(&'a self) -> &'a str {
            // ...
        }
    }
};

// If you need to dynamically generate lifetimes
use syn::Lifetime;
let lifetime = Lifetime::new("'a", proc_macro2::Span::call_site());

let expanded = quote! {
    impl<#lifetime> MyTrait<#lifetime> for #name {
        // ...
    }
};
```

## Performance Considerations

### Compile Time Impact

Derive macros execute at compile time, and their complexity directly affects compilation speed:

```rust
// Avoid unnecessary complex parsing
// If you only need the type name, don't parse full field information
let name = &input.ident;

// Avoid heavy string operations in macros
// Bad practice
let code = format!("impl {} for {} {{ ... }}", trait_name, struct_name);
code.parse().unwrap()  // Parsing strings is slow

// Good practice: Use quote
quote! {
    impl #trait_name for #struct_name { ... }
}
```

### Generated Code Size

Too many derive macros can lead to binary bloat:

```rust
// Consider whether you really need to generate code for each type
// Sometimes a generic trait implementation is better than derive macros

// Derive macro generated code (each type has its own implementation)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
struct Config { ... }

// Consider whether all these traits are needed
// Or whether generics can reduce code duplication
```

### Incremental Compilation

Changes to procedural macros trigger recompilation of all code that depends on them:

```
my_derive (procedural macro crate)
    │
    ├── module_a (uses #[derive(MyTrait)])
    │       │
    │       └── Recompile
    │
    └── module_b (uses #[derive(MyTrait)])
            │
            └── Recompile
```

Recommendations:
- Place derive macros in separate, stable crates
- Avoid frequent modifications to derive macro implementations
- Consider using `cargo check` for quick validation

## Practical Scenarios

### Scenario 1: ORM Framework Entity Derive

```rust
#[derive(Entity)]
#[table(name = "users")]
struct User {
    #[column(primary_key, auto_increment)]
    id: i64,

    #[column(name = "user_name", length = 100)]
    username: String,

    #[column(nullable)]
    email: Option<String>,

    #[column(default = "now()")]
    created_at: DateTime,
}

// Derive macro generates:
// - Table name constant
// - Field mapping
// - SQL generation methods
// - CRUD operation methods
```

### Scenario 2: API Response Structures

```rust
#[derive(ApiResponse)]
#[api(status = 200, content_type = "application/json")]
struct UserResponse {
    #[api(rename = "userId")]
    id: u64,

    #[api(flatten)]
    profile: UserProfile,

    #[api(skip_serializing_if = "Option::is_none")]
    metadata: Option<Metadata>,
}

// Generates HTTP response related code
```

### Scenario 3: Configuration File Parsing

```rust
#[derive(Config)]
#[config(file = "config.toml", env_prefix = "APP")]
struct AppConfig {
    #[config(default = "localhost")]
    host: String,

    #[config(default = 8080, env = "PORT")]
    port: u16,

    #[config(nested)]
    database: DatabaseConfig,
}

// Generates code to load config from files and environment variables
```

### Scenario 4: Command Line Argument Parsing

```rust
#[derive(Args)]
#[command(name = "myapp", about = "My CLI application")]
struct Cli {
    #[arg(short, long, help = "Input file path")]
    input: PathBuf,

    #[arg(short, long, default_value = "output.txt")]
    output: PathBuf,

    #[arg(short, long, action = ArgAction::Count)]
    verbose: u8,
}

// Generates command line parsing code
```

## Interview Key Points

### Basic Concept Questions

**Q1: What are derive macros? How do they differ from declarative macros?**

Derive macros are a type of procedural macro that automatically implements traits for types through the `#[derive(...)]` attribute. Main differences:

| Feature | Derive Macros | Declarative Macros (macro_rules!) |
|---------|---------------|-----------------------------------|
| Definition location | Separate crate, `proc-macro = true` | Any location |
| Input | Complete type AST | Token pattern matching |
| Capability | Can access full type information | Can only do pattern substitution |
| Complexity | Requires syn/quote | Relatively simple |
| Debugging | Needs cargo expand | Can use trace_macros |

**Q2: What are the roles of syn and quote libraries?**

- **syn**: Parses `TokenStream` into structured AST, providing types like `DeriveInput`, `Data`, `Fields` to represent Rust code structures
- **quote**: Provides the `quote!` macro for generating `TokenStream` from Rust code templates, supporting variable interpolation and iteration expansion

**Q3: How do you handle generics in derive macros?**

Use `Generics::split_for_impl()` to separate generic parameters:

```rust
let (impl_generics, ty_generics, where_clause) = input.generics.split_for_impl();

quote! {
    impl #impl_generics MyTrait for #name #ty_generics #where_clause {
        // ...
    }
}
```

### Advanced Questions

**Q4: How do derive macros support helper attributes?**

Declare `attributes` in `#[proc_macro_derive]`:

```rust
#[proc_macro_derive(MyTrait, attributes(my_attr))]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    // Now you can use #[my_attr(...)] on fields
}
```

**Q5: How do you provide friendly compile errors in derive macros?**

Use `syn::Error` and `spanned::Spanned`:

```rust
use syn::{Error, spanned::Spanned};

if condition_not_met {
    return Error::new(
        some_ast_node.span(),  // Points to the problematic code location
        "Clear error description"
    )
    .to_compile_error()
    .into();
}
```

**Q6: Does derive macro output replace the original type definition?**

No. Derive macros only add code without modifying the original definition. This is a key difference between derive macros and attribute macros.

### Practical Questions

**Q7: Implement a `Default` derive macro that supports specifying default values via attributes**

```rust
#[derive(MyDefault)]
struct Config {
    #[default("localhost")]
    host: String,

    #[default(8080)]
    port: u16,
}
```

Key points:
1. Parse `#[default(...)]` attribute
2. Extract literal values
3. Generate `Default` trait implementation

**Q8: How do you test derive macros?**

- **Positive testing**: Write code using the derive macro, verify generated functionality
- **Compile error testing**: Use `trybuild` to verify error cases produce correct compile errors
- **Expansion testing**: Use `cargo expand` to view generated code

## Further Reading

### Official Documentation

- [The Rust Reference - Procedural Macros](https://doc.rust-lang.org/reference/procedural-macros.html)
- [The Rust Book - Macros](https://doc.rust-lang.org/book/ch19-06-macros.html)
- [Rust By Example - Macros](https://doc.rust-lang.org/rust-by-example/macros.html)

### Core Library Documentation

- [syn crate documentation](https://docs.rs/syn/)
- [quote crate documentation](https://docs.rs/quote/)
- [proc-macro2 crate documentation](https://docs.rs/proc-macro2/)

### Tutorials and Resources

- [Procedural Macros Workshop by David Tolnay](https://github.com/dtolnay/proc-macro-workshop) - Best practices tutorial
- [The Little Book of Rust Macros](https://danielkeep.github.io/tlborm/book/) - In-depth guide to macro programming

### Common Derive Macro References

- **serde** - `Serialize`, `Deserialize`: Serialization/Deserialization
- **thiserror** - `Error`: Custom error types
- **derive_more** - Collection of various utility derive macros
- **strum** - Enum helper derive macros
- **derive_builder** - Builder pattern derive macro
- **clap** - `Parser`: Command line argument parsing

### Debugging Tools

- [cargo-expand](https://github.com/dtolnay/cargo-expand) - View expanded macro code
- [trybuild](https://docs.rs/trybuild/) - Test compilation errors

---

Derive macros are one of Rust's core metaprogramming tools. By mastering `syn` and `quote`, you can create powerful code generators that significantly reduce boilerplate code. The key is to balance the convenience of code generation with maintainability, provide clear error messages, and write comprehensive tests. As the Rust ecosystem evolves, derive macros have become an essential skill for library developers.
