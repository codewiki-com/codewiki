---
title: Procedural Macros with syn and quote
description: Complete guide to building procedural macros in Rust using syn for parsing and quote for code generation
track: rust
section: traits-generics
difficulty: advanced
tags:
  - Rust
  - Macros
  - syn
  - quote
  - Procedural Macros
  - Metaprogramming
status: imported
origin: old/src/content/docs/rust/syn-quote.en.md
divergence: 0.205
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Rust
  subcategory: ""
  order: 10
  lastUpdated: 2026-01-21
---

Procedural macros are one of Rust's most powerful features, allowing you to generate code at compile time. The `syn` and `quote` crates form the foundation for building these macros, providing parsing and code generation capabilities.

## Concept Explanation

Procedural macros operate on Rust's token stream, transforming input code into output code. There are three types:

- **Derive macros**: `#[derive(MyTrait)]` - generate trait implementations
- **Attribute macros**: `#[my_attr]` - transform items with custom attributes
- **Function-like macros**: `my_macro!(...)` - custom macro invocation syntax

The `syn` crate parses Rust code into an AST (Abstract Syntax Tree), while `quote` generates Rust code from templates.

```rust
// Cargo.toml for a proc-macro crate
// [lib]
// proc-macro = true
//
// [dependencies]
// syn = { version = "2.0", features = ["full"] }
// quote = "1.0"
// proc-macro2 = "1.0"

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(HelloWorld)]
pub fn hello_world_derive(input: TokenStream) -> TokenStream {
    // Parse the input tokens into a syntax tree
    let input = parse_macro_input!(input as DeriveInput);

    // Get the name of the type
    let name = &input.ident;

    // Generate the impl
    let expanded = quote! {
        impl #name {
            pub fn hello_world() {
                println!("Hello, World! I'm a {}!", stringify!(#name));
            }
        }
    };

    TokenStream::from(expanded)
}
```

## Core Principles

### Token Streams and Parsing

```rust
use proc_macro::TokenStream;
use proc_macro2::TokenStream as TokenStream2;
use syn::{
    parse::{Parse, ParseStream},
    parse_macro_input,
    Expr, Ident, Token, LitStr,
};

// Custom syntax: key = "value", key2 = expr
struct KeyValue {
    key: Ident,
    eq_token: Token![=],
    value: Expr,
}

impl Parse for KeyValue {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        Ok(KeyValue {
            key: input.parse()?,
            eq_token: input.parse()?,
            value: input.parse()?,
        })
    }
}

// Parse multiple key-value pairs
struct KeyValueList {
    pairs: syn::punctuated::Punctuated<KeyValue, Token![,]>,
}

impl Parse for KeyValueList {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        Ok(KeyValueList {
            pairs: input.parse_terminated(KeyValue::parse, Token![,])?,
        })
    }
}

#[proc_macro]
pub fn config(input: TokenStream) -> TokenStream {
    let list = parse_macro_input!(input as KeyValueList);

    // Process the parsed input...
    let expanded = quote! {
        // Generated code
    };

    TokenStream::from(expanded)
}
```

### The DeriveInput Structure

```rust
use syn::{
    DeriveInput, Data, Fields, Type, Attribute,
    DataStruct, DataEnum, DataUnion,
};

fn analyze_derive_input(input: &DeriveInput) {
    // The name of the type
    let name = &input.ident;

    // Generics
    let generics = &input.generics;

    // Visibility
    let vis = &input.vis;

    // Attributes on the type
    let attrs = &input.attrs;

    // The data (struct, enum, or union)
    match &input.data {
        Data::Struct(data_struct) => {
            handle_struct(data_struct);
        }
        Data::Enum(data_enum) => {
            handle_enum(data_enum);
        }
        Data::Union(data_union) => {
            handle_union(data_union);
        }
    }
}

fn handle_struct(data: &DataStruct) {
    match &data.fields {
        Fields::Named(fields) => {
            // struct Foo { x: i32, y: String }
            for field in &fields.named {
                let name = field.ident.as_ref().unwrap();
                let ty = &field.ty;
                println!("Field: {} of type {:?}", name, ty);
            }
        }
        Fields::Unnamed(fields) => {
            // struct Foo(i32, String)
            for (i, field) in fields.unnamed.iter().enumerate() {
                let ty = &field.ty;
                println!("Field {}: {:?}", i, ty);
            }
        }
        Fields::Unit => {
            // struct Foo;
            println!("Unit struct");
        }
    }
}

fn handle_enum(data: &DataEnum) {
    for variant in &data.variants {
        let name = &variant.ident;
        println!("Variant: {}", name);

        // Handle variant fields similar to struct fields
        match &variant.fields {
            Fields::Named(fields) => { /* ... */ }
            Fields::Unnamed(fields) => { /* ... */ }
            Fields::Unit => { /* ... */ }
        }
    }
}

fn handle_union(data: &DataUnion) {
    // Union only has named fields
    for field in &data.fields.named {
        let name = field.ident.as_ref().unwrap();
        let ty = &field.ty;
        println!("Union field: {} of type {:?}", name, ty);
    }
}
```

### Quote Interpolation

```rust
use quote::{quote, quote_spanned, format_ident};
use syn::spanned::Spanned;

fn demonstrate_quote() {
    let name = format_ident!("MyStruct");
    let field_name = format_ident!("my_field");
    let field_type = quote! { String };

    // Basic interpolation with #
    let basic = quote! {
        struct #name {
            #field_name: #field_type,
        }
    };

    // Repetition with #(...)*
    let fields = vec![
        (format_ident!("x"), quote! { i32 }),
        (format_ident!("y"), quote! { i32 }),
        (format_ident!("z"), quote! { i32 }),
    ];

    let field_names = fields.iter().map(|(n, _)| n);
    let field_types = fields.iter().map(|(_, t)| t);

    let with_repetition = quote! {
        struct Point {
            #(#field_names: #field_types),*
        }
    };

    // Nested repetition
    let methods = vec!["get_x", "get_y"];
    let with_nested = quote! {
        impl Point {
            #(
                pub fn #(#methods)() -> i32 {
                    self.x
                }
            )*
        }
    };

    // Conditional generation
    let include_debug = true;
    let debug_impl = if include_debug {
        quote! {
            impl std::fmt::Debug for #name {
                fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                    write!(f, "{}", stringify!(#name))
                }
            }
        }
    } else {
        quote! {}
    };
}
```

## Key Concepts

### Derive Macro with Attributes

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Meta, Expr, Lit};

#[proc_macro_derive(Builder, attributes(builder))]
pub fn builder_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;
    let builder_name = format_ident!("{}Builder", name);

    let fields = match &input.data {
        syn::Data::Struct(data) => match &data.fields {
            syn::Fields::Named(fields) => &fields.named,
            _ => panic!("Builder only supports named fields"),
        },
        _ => panic!("Builder only supports structs"),
    };

    // Generate builder fields (all Optional)
    let builder_fields = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;
        quote! {
            #name: Option<#ty>
        }
    });

    // Generate setter methods
    let setters = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;

        // Check for #[builder(default = "...")] attribute
        let default_value = f.attrs.iter()
            .find(|attr| attr.path().is_ident("builder"))
            .and_then(|attr| {
                if let Meta::List(list) = &attr.meta {
                    // Parse the attribute content
                    // #[builder(default = "value")]
                    None // Simplified
                } else {
                    None
                }
            });

        quote! {
            pub fn #name(mut self, value: #ty) -> Self {
                self.#name = Some(value);
                self
            }
        }
    });

    // Generate build method
    let build_fields = fields.iter().map(|f| {
        let name = &f.ident;
        quote! {
            #name: self.#name.ok_or(concat!(stringify!(#name), " is required"))?
        }
    });

    let expanded = quote! {
        pub struct #builder_name {
            #(#builder_fields),*
        }

        impl #name {
            pub fn builder() -> #builder_name {
                #builder_name {
                    #(#fields.ident: None),*
                }
            }
        }

        impl #builder_name {
            #(#setters)*

            pub fn build(self) -> Result<#name, &'static str> {
                Ok(#name {
                    #(#build_fields),*
                })
            }
        }
    };

    TokenStream::from(expanded)
}
```

### Attribute Macro

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn, AttributeArgs, NestedMeta, Lit, Meta};

#[proc_macro_attribute]
pub fn log_calls(attr: TokenStream, item: TokenStream) -> TokenStream {
    let args = parse_macro_input!(attr as AttributeArgs);
    let input = parse_macro_input!(item as ItemFn);

    // Parse attribute arguments
    let log_level = args.iter()
        .find_map(|arg| {
            if let NestedMeta::Meta(Meta::NameValue(nv)) = arg {
                if nv.path.is_ident("level") {
                    if let Lit::Str(s) = &nv.lit {
                        return Some(s.value());
                    }
                }
            }
            None
        })
        .unwrap_or_else(|| "info".to_string());

    let fn_name = &input.sig.ident;
    let fn_block = &input.block;
    let fn_vis = &input.vis;
    let fn_sig = &input.sig;

    let expanded = quote! {
        #fn_vis #fn_sig {
            println!("[{}] Entering function: {}", #log_level, stringify!(#fn_name));
            let __result = (|| #fn_block)();
            println!("[{}] Exiting function: {}", #log_level, stringify!(#fn_name));
            __result
        }
    };

    TokenStream::from(expanded)
}

// Usage:
// #[log_calls(level = "debug")]
// fn my_function() { ... }
```

### Function-like Macro

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Expr, Token};
use syn::parse::{Parse, ParseStream};

struct SqlQuery {
    query: syn::LitStr,
    params: Vec<Expr>,
}

impl Parse for SqlQuery {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let query: syn::LitStr = input.parse()?;
        let mut params = Vec::new();

        while !input.is_empty() {
            input.parse::<Token![,]>()?;
            params.push(input.parse()?);
        }

        Ok(SqlQuery { query, params })
    }
}

#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
    let SqlQuery { query, params } = parse_macro_input!(input as SqlQuery);

    let query_str = query.value();
    let param_count = params.len();

    // Validate placeholder count matches parameter count
    let placeholder_count = query_str.matches('?').count();
    if placeholder_count != param_count {
        return syn::Error::new(
            query.span(),
            format!(
                "Expected {} parameters, got {}",
                placeholder_count, param_count
            ),
        )
        .to_compile_error()
        .into();
    }

    let expanded = quote! {
        {
            let query = #query;
            let params: Vec<Box<dyn ToSql>> = vec![#(Box::new(#params)),*];
            PreparedQuery::new(query, params)
        }
    };

    TokenStream::from(expanded)
}

// Usage:
// let query = sql!("SELECT * FROM users WHERE id = ? AND name = ?", user_id, name);
```

## Code Examples

### Complete Derive Macro: Serialize

```rust
// lib.rs in proc-macro crate
use proc_macro::TokenStream;
use quote::{quote, format_ident};
use syn::{parse_macro_input, DeriveInput, Data, Fields, Type};

#[proc_macro_derive(MySerialize, attributes(serde))]
pub fn derive_serialize(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;
    let generics = &input.generics;
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();

    let serialize_body = match &input.data {
        Data::Struct(data) => generate_struct_serialize(&data.fields),
        Data::Enum(data) => generate_enum_serialize(data),
        Data::Union(_) => panic!("Unions are not supported"),
    };

    let expanded = quote! {
        impl #impl_generics MySerialize for #name #ty_generics #where_clause {
            fn serialize(&self) -> String {
                let mut result = String::from("{");
                #serialize_body
                result.push('}');
                result
            }
        }
    };

    TokenStream::from(expanded)
}

fn generate_struct_serialize(fields: &Fields) -> proc_macro2::TokenStream {
    match fields {
        Fields::Named(fields) => {
            let field_serializers = fields.named.iter().enumerate().map(|(i, f)| {
                let name = f.ident.as_ref().unwrap();
                let name_str = name.to_string();

                let comma = if i > 0 { quote! { result.push_str(", "); } } else { quote! {} };

                quote! {
                    #comma
                    result.push_str(&format!("\"{}\": {:?}", #name_str, self.#name));
                }
            });

            quote! {
                #(#field_serializers)*
            }
        }
        Fields::Unnamed(fields) => {
            let field_serializers = fields.unnamed.iter().enumerate().map(|(i, _)| {
                let index = syn::Index::from(i);
                let comma = if i > 0 { quote! { result.push_str(", "); } } else { quote! {} };

                quote! {
                    #comma
                    result.push_str(&format!("{:?}", self.#index));
                }
            });

            quote! {
                result.push('[');
                #(#field_serializers)*
                result.push(']');
            }
        }
        Fields::Unit => quote! {},
    }
}

fn generate_enum_serialize(data: &syn::DataEnum) -> proc_macro2::TokenStream {
    let variants = data.variants.iter().map(|v| {
        let variant_name = &v.ident;
        let variant_str = variant_name.to_string();

        match &v.fields {
            Fields::Unit => quote! {
                Self::#variant_name => {
                    result.push_str(&format!("\"{}\"", #variant_str));
                }
            },
            Fields::Unnamed(fields) => {
                let bindings: Vec<_> = (0..fields.unnamed.len())
                    .map(|i| format_ident!("_{}", i))
                    .collect();

                quote! {
                    Self::#variant_name(#(#bindings),*) => {
                        result.push_str(&format!("{{\"{}\": [", #variant_str));
                        #(result.push_str(&format!("{:?}, ", #bindings));)*
                        result.push_str("]}");
                    }
                }
            },
            Fields::Named(fields) => {
                let bindings: Vec<_> = fields.named.iter()
                    .map(|f| f.ident.as_ref().unwrap())
                    .collect();

                quote! {
                    Self::#variant_name { #(#bindings),* } => {
                        result.push_str(&format!("{{\"{}\": {{", #variant_str));
                        #(result.push_str(&format!("\"{}\": {:?}, ", stringify!(#bindings), #bindings));)*
                        result.push_str("}}");
                    }
                }
            },
        }
    });

    quote! {
        match self {
            #(#variants)*
        }
    }
}
```

### Error Handling and Diagnostics

```rust
use proc_macro::TokenStream;
use quote::quote_spanned;
use syn::{parse_macro_input, DeriveInput, Error, spanned::Spanned};

#[proc_macro_derive(ValidatedDerive)]
pub fn validated_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    // Collect errors instead of panicking
    let mut errors = Vec::new();

    match &input.data {
        syn::Data::Struct(data) => {
            for field in data.fields.iter() {
                // Validate field types
                if let syn::Type::Path(type_path) = &field.ty {
                    let type_name = type_path.path.segments.last()
                        .map(|s| s.ident.to_string())
                        .unwrap_or_default();

                    if type_name == "RawPointer" {
                        errors.push(Error::new(
                            field.ty.span(),
                            "RawPointer type is not allowed in this derive",
                        ));
                    }
                }

                // Validate field names
                if let Some(name) = &field.ident {
                    if name.to_string().starts_with('_') {
                        errors.push(Error::new(
                            name.span(),
                            "Field names starting with underscore are not supported",
                        ));
                    }
                }
            }
        }
        syn::Data::Enum(_) => {
            errors.push(Error::new(
                input.ident.span(),
                "ValidatedDerive does not support enums",
            ));
        }
        syn::Data::Union(_) => {
            errors.push(Error::new(
                input.ident.span(),
                "ValidatedDerive does not support unions",
            ));
        }
    }

    // If there are errors, return them as compile errors
    if !errors.is_empty() {
        let compile_errors = errors.into_iter().map(|e| e.to_compile_error());
        return TokenStream::from(quote! {
            #(#compile_errors)*
        });
    }

    // Generate the implementation
    let name = &input.ident;
    let expanded = quote! {
        impl Validated for #name {
            fn is_valid(&self) -> bool {
                true
            }
        }
    };

    TokenStream::from(expanded)
}
```

## Best Practices

### 1. Use proc-macro2 for Testing

```rust
// Can test without full compilation
#[cfg(test)]
mod tests {
    use super::*;
    use quote::quote;

    #[test]
    fn test_code_generation() {
        let input = quote! {
            struct MyStruct {
                field1: i32,
                field2: String,
            }
        };

        let input: DeriveInput = syn::parse2(input).unwrap();
        let output = generate_impl(&input);

        // Compare output token stream
        let expected = quote! {
            impl MyStruct {
                // ...
            }
        };

        assert_eq!(output.to_string(), expected.to_string());
    }
}
```

### 2. Provide Good Error Messages

```rust
use syn::Error;

fn validate_input(input: &DeriveInput) -> syn::Result<()> {
    if input.generics.lifetimes().count() > 0 {
        return Err(Error::new_spanned(
            &input.generics,
            "This macro does not support lifetime parameters. \
             Consider using 'static or owned types.",
        ));
    }

    match &input.data {
        syn::Data::Struct(_) => Ok(()),
        syn::Data::Enum(_) => Err(Error::new_spanned(
            &input.ident,
            "Expected a struct, found an enum. \
             Use #[derive(EnumVariant)] for enums instead.",
        )),
        syn::Data::Union(_) => Err(Error::new_spanned(
            &input.ident,
            "Unions are not supported by this macro",
        )),
    }
}
```

### 3. Handle Generics Properly

```rust
use syn::{DeriveInput, Generics, GenericParam, TypeParam};
use quote::quote;

fn generate_with_generics(input: &DeriveInput) -> proc_macro2::TokenStream {
    let name = &input.ident;
    let generics = &input.generics;

    // Add trait bounds to generics
    let mut generics_with_bounds = generics.clone();
    for param in &mut generics_with_bounds.params {
        if let GenericParam::Type(type_param) = param {
            type_param.bounds.push(syn::parse_quote!(Clone));
        }
    }

    let (impl_generics, ty_generics, where_clause) = generics_with_bounds.split_for_impl();

    quote! {
        impl #impl_generics MyTrait for #name #ty_generics #where_clause {
            fn clone_inner(&self) -> Self {
                self.clone()
            }
        }
    }
}
```

## Common Pitfalls

### 1. Forgetting to Handle All Cases

```rust
// BAD: Only handles named fields
fn bad_generate(fields: &Fields) -> TokenStream2 {
    let Fields::Named(fields) = fields else {
        panic!("Only named fields supported"); // Will crash on tuple structs
    };
    // ...
}

// GOOD: Handle all cases gracefully
fn good_generate(fields: &Fields) -> TokenStream2 {
    match fields {
        Fields::Named(fields) => { /* ... */ }
        Fields::Unnamed(fields) => { /* ... */ }
        Fields::Unit => { /* ... */ }
    }
}
```

### 2. Hygiene Issues

```rust
// BAD: Using user's identifiers directly
let bad = quote! {
    let result = compute(); // `result` might conflict
};

// GOOD: Use fully qualified paths and unique names
let good = quote! {
    let __macro_result = ::std::result::Result::Ok(());
};
```

### 3. Span Handling

```rust
use quote::quote_spanned;
use syn::spanned::Spanned;

// Use quote_spanned for better error messages
fn generate_field_check(field: &syn::Field) -> TokenStream2 {
    let name = &field.ident;
    let ty = &field.ty;

    // Errors will point to the actual field location
    quote_spanned! {field.span()=>
        fn check_#name(value: &#ty) -> bool {
            // validation logic
            true
        }
    }
}
```

## Performance Considerations

### Compilation Time

```rust
// Minimize syn parsing features in Cargo.toml
// [dependencies]
// syn = { version = "2.0", features = ["derive"] }  // Not "full"

// Cache parsed results
use std::sync::OnceLock;

static CACHED_CONFIG: OnceLock<Config> = OnceLock::new();

fn get_config() -> &'static Config {
    CACHED_CONFIG.get_or_init(|| {
        // Parse configuration once
        Config::new()
    })
}
```

## Interview Key Points

1. **Three types of proc macros**:
   - Derive: `#[derive(Trait)]`
   - Attribute: `#[attribute]`
   - Function-like: `macro!()`

2. **syn parsing**:
   - `parse_macro_input!` for entry point
   - `DeriveInput` for derive macros
   - Custom `Parse` trait implementation

3. **quote code generation**:
   - `#var` for interpolation
   - `#(#var)*` for repetition
   - `quote_spanned!` for error locations

4. **Error handling**:
   - Return `syn::Error::to_compile_error()`
   - Use spans for accurate error locations
   - Collect multiple errors when possible

5. **Testing**:
   - Use `proc-macro2` for unit tests
   - Integration tests with actual macros

## Further Reading

- [syn Documentation](https://docs.rs/syn)
- [quote Documentation](https://docs.rs/quote)
- [The Little Book of Rust Macros](https://danielkeep.github.io/tlborm/book/)
- [Rust Reference: Procedural Macros](https://doc.rust-lang.org/reference/procedural-macros.html)
- [proc-macro Workshop](https://github.com/dtolnay/proc-macro-workshop)
