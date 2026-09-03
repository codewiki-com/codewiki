---
title: syn 和 quote 过程宏开发
description: 使用 syn 解析和 quote 代码生成构建 Rust 过程宏的完整指南
track: rust
section: traits-generics
difficulty: advanced
tags:
  - Rust
  - 宏
  - syn
  - quote
  - 过程宏
  - 元编程
status: imported
origin: old/src/content/docs/rust/syn-quote.zh.md
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

过程宏是 Rust 最强大的特性之一，允许在编译时生成代码。`syn` 和 `quote` 两个 crate 构成了构建这些宏的基础，提供解析和代码生成能力。

## 概念解释

过程宏操作 Rust 的 token 流，将输入代码转换为输出代码。有三种类型：

- **派生宏（Derive macros）**：`#[derive(MyTrait)]` - 生成 trait 实现
- **属性宏（Attribute macros）**：`#[my_attr]` - 使用自定义属性转换项目
- **类函数宏（Function-like macros）**：`my_macro!(...)` - 自定义宏调用语法

`syn` crate 将 Rust 代码解析为 AST（抽象语法树），而 `quote` 从模板生成 Rust 代码。

```rust
// proc-macro crate 的 Cargo.toml
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
    // 将输入 token 解析为语法树
    let input = parse_macro_input!(input as DeriveInput);

    // 获取类型名称
    let name = &input.ident;

    // 生成实现
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

## 核心原理

### Token 流和解析

```rust
use proc_macro::TokenStream;
use proc_macro2::TokenStream as TokenStream2;
use syn::{
    parse::{Parse, ParseStream},
    parse_macro_input,
    Expr, Ident, Token, LitStr,
};

// 自定义语法：key = "value", key2 = expr
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

// 解析多个键值对
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

    // 处理解析后的输入...
    let expanded = quote! {
        // 生成的代码
    };

    TokenStream::from(expanded)
}
```

### DeriveInput 结构

```rust
use syn::{
    DeriveInput, Data, Fields, Type, Attribute,
    DataStruct, DataEnum, DataUnion,
};

fn analyze_derive_input(input: &DeriveInput) {
    // 类型的名称
    let name = &input.ident;

    // 泛型
    let generics = &input.generics;

    // 可见性
    let vis = &input.vis;

    // 类型上的属性
    let attrs = &input.attrs;

    // 数据（结构体、枚举或联合体）
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
                println!("字段：{} 类型 {:?}", name, ty);
            }
        }
        Fields::Unnamed(fields) => {
            // struct Foo(i32, String)
            for (i, field) in fields.unnamed.iter().enumerate() {
                let ty = &field.ty;
                println!("字段 {}：{:?}", i, ty);
            }
        }
        Fields::Unit => {
            // struct Foo;
            println!("单元结构体");
        }
    }
}

fn handle_enum(data: &DataEnum) {
    for variant in &data.variants {
        let name = &variant.ident;
        println!("变体：{}", name);

        // 处理变体字段，类似于结构体字段
        match &variant.fields {
            Fields::Named(fields) => { /* ... */ }
            Fields::Unnamed(fields) => { /* ... */ }
            Fields::Unit => { /* ... */ }
        }
    }
}

fn handle_union(data: &DataUnion) {
    // 联合体只有命名字段
    for field in &data.fields.named {
        let name = field.ident.as_ref().unwrap();
        let ty = &field.ty;
        println!("联合体字段：{} 类型 {:?}", name, ty);
    }
}
```

### Quote 插值

```rust
use quote::{quote, quote_spanned, format_ident};
use syn::spanned::Spanned;

fn demonstrate_quote() {
    let name = format_ident!("MyStruct");
    let field_name = format_ident!("my_field");
    let field_type = quote! { String };

    // 使用 # 进行基本插值
    let basic = quote! {
        struct #name {
            #field_name: #field_type,
        }
    };

    // 使用 #(...)* 进行重复
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

    // 嵌套重复
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

    // 条件生成
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

## 核心要点

### 带属性的派生宏

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
            _ => panic!("Builder 只支持命名字段"),
        },
        _ => panic!("Builder 只支持结构体"),
    };

    // 生成 builder 字段（全部为 Optional）
    let builder_fields = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;
        quote! {
            #name: Option<#ty>
        }
    });

    // 生成 setter 方法
    let setters = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;

        // 检查 #[builder(default = "...")] 属性
        let default_value = f.attrs.iter()
            .find(|attr| attr.path().is_ident("builder"))
            .and_then(|attr| {
                if let Meta::List(list) = &attr.meta {
                    // 解析属性内容
                    // #[builder(default = "value")]
                    None // 简化
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

    // 生成 build 方法
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

### 属性宏

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn, AttributeArgs, NestedMeta, Lit, Meta};

#[proc_macro_attribute]
pub fn log_calls(attr: TokenStream, item: TokenStream) -> TokenStream {
    let args = parse_macro_input!(attr as AttributeArgs);
    let input = parse_macro_input!(item as ItemFn);

    // 解析属性参数
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
            println!("[{}] 进入函数：{}", #log_level, stringify!(#fn_name));
            let __result = (|| #fn_block)();
            println!("[{}] 退出函数：{}", #log_level, stringify!(#fn_name));
            __result
        }
    };

    TokenStream::from(expanded)
}

// 使用方式：
// #[log_calls(level = "debug")]
// fn my_function() { ... }
```

### 类函数宏

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

    // 验证占位符数量与参数数量匹配
    let placeholder_count = query_str.matches('?').count();
    if placeholder_count != param_count {
        return syn::Error::new(
            query.span(),
            format!(
                "期望 {} 个参数，实际得到 {}",
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

// 使用方式：
// let query = sql!("SELECT * FROM users WHERE id = ? AND name = ?", user_id, name);
```

## 代码示例

### 完整的派生宏：序列化

```rust
// proc-macro crate 的 lib.rs
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
        Data::Union(_) => panic!("不支持联合体"),
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

### 错误处理和诊断

```rust
use proc_macro::TokenStream;
use quote::quote_spanned;
use syn::{parse_macro_input, DeriveInput, Error, spanned::Spanned};

#[proc_macro_derive(ValidatedDerive)]
pub fn validated_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    // 收集错误而不是直接 panic
    let mut errors = Vec::new();

    match &input.data {
        syn::Data::Struct(data) => {
            for field in data.fields.iter() {
                // 验证字段类型
                if let syn::Type::Path(type_path) = &field.ty {
                    let type_name = type_path.path.segments.last()
                        .map(|s| s.ident.to_string())
                        .unwrap_or_default();

                    if type_name == "RawPointer" {
                        errors.push(Error::new(
                            field.ty.span(),
                            "此派生宏不允许使用 RawPointer 类型",
                        ));
                    }
                }

                // 验证字段名称
                if let Some(name) = &field.ident {
                    if name.to_string().starts_with('_') {
                        errors.push(Error::new(
                            name.span(),
                            "不支持以下划线开头的字段名",
                        ));
                    }
                }
            }
        }
        syn::Data::Enum(_) => {
            errors.push(Error::new(
                input.ident.span(),
                "ValidatedDerive 不支持枚举",
            ));
        }
        syn::Data::Union(_) => {
            errors.push(Error::new(
                input.ident.span(),
                "ValidatedDerive 不支持联合体",
            ));
        }
    }

    // 如果有错误，将它们作为编译错误返回
    if !errors.is_empty() {
        let compile_errors = errors.into_iter().map(|e| e.to_compile_error());
        return TokenStream::from(quote! {
            #(#compile_errors)*
        });
    }

    // 生成实现
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

## 最佳实践

### 1. 使用 proc-macro2 进行测试

```rust
// 可以在不完整编译的情况下测试
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

        // 比较输出 token 流
        let expected = quote! {
            impl MyStruct {
                // ...
            }
        };

        assert_eq!(output.to_string(), expected.to_string());
    }
}
```

### 2. 提供良好的错误消息

```rust
use syn::Error;

fn validate_input(input: &DeriveInput) -> syn::Result<()> {
    if input.generics.lifetimes().count() > 0 {
        return Err(Error::new_spanned(
            &input.generics,
            "此宏不支持生命周期参数。\
             考虑使用 'static 或拥有所有权的类型。",
        ));
    }

    match &input.data {
        syn::Data::Struct(_) => Ok(()),
        syn::Data::Enum(_) => Err(Error::new_spanned(
            &input.ident,
            "期望结构体，发现枚举。\
             请使用 #[derive(EnumVariant)] 来处理枚举。",
        )),
        syn::Data::Union(_) => Err(Error::new_spanned(
            &input.ident,
            "此宏不支持联合体",
        )),
    }
}
```

### 3. 正确处理泛型

```rust
use syn::{DeriveInput, Generics, GenericParam, TypeParam};
use quote::quote;

fn generate_with_generics(input: &DeriveInput) -> proc_macro2::TokenStream {
    let name = &input.ident;
    let generics = &input.generics;

    // 为泛型添加 trait 约束
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

## 常见陷阱

### 1. 忘记处理所有情况

```rust
// 错误：只处理命名字段
fn bad_generate(fields: &Fields) -> TokenStream2 {
    let Fields::Named(fields) = fields else {
        panic!("只支持命名字段"); // 遇到元组结构体会崩溃
    };
    // ...
}

// 正确：优雅地处理所有情况
fn good_generate(fields: &Fields) -> TokenStream2 {
    match fields {
        Fields::Named(fields) => { /* ... */ }
        Fields::Unnamed(fields) => { /* ... */ }
        Fields::Unit => { /* ... */ }
    }
}
```

### 2. 卫生性问题

```rust
// 错误：直接使用用户的标识符
let bad = quote! {
    let result = compute(); // `result` 可能冲突
};

// 正确：使用完全限定路径和唯一名称
let good = quote! {
    let __macro_result = ::std::result::Result::Ok(());
};
```

### 3. Span 处理

```rust
use quote::quote_spanned;
use syn::spanned::Spanned;

// 使用 quote_spanned 获得更好的错误消息
fn generate_field_check(field: &syn::Field) -> TokenStream2 {
    let name = &field.ident;
    let ty = &field.ty;

    // 错误将指向实际的字段位置
    quote_spanned! {field.span()=>
        fn check_#name(value: &#ty) -> bool {
            // 验证逻辑
            true
        }
    }
}
```

## 性能考量

### 编译时间

```rust
// 在 Cargo.toml 中最小化 syn 解析功能
// [dependencies]
// syn = { version = "2.0", features = ["derive"] }  // 不是 "full"

// 缓存解析结果
use std::sync::OnceLock;

static CACHED_CONFIG: OnceLock<Config> = OnceLock::new();

fn get_config() -> &'static Config {
    CACHED_CONFIG.get_or_init(|| {
        // 只解析一次配置
        Config::new()
    })
}
```

## 面试要点

1. **三种过程宏类型**：
   - 派生宏：`#[derive(Trait)]`
   - 属性宏：`#[attribute]`
   - 类函数宏：`macro!()`

2. **syn 解析**：
   - `parse_macro_input!` 作为入口点
   - `DeriveInput` 用于派生宏
   - 自定义 `Parse` trait 实现

3. **quote 代码生成**：
   - `#var` 用于插值
   - `#(#var)*` 用于重复
   - `quote_spanned!` 用于错误位置

4. **错误处理**：
   - 返回 `syn::Error::to_compile_error()`
   - 使用 span 获取准确的错误位置
   - 尽可能收集多个错误

5. **测试**：
   - 使用 `proc-macro2` 进行单元测试
   - 使用实际宏进行集成测试

## 延伸阅读

- [syn 文档](https://docs.rs/syn)
- [quote 文档](https://docs.rs/quote)
- [Rust 宏小册子](https://danielkeep.github.io/tlborm/book/)
- [Rust 参考：过程宏](https://doc.rust-lang.org/reference/procedural-macros.html)
- [proc-macro 工作坊](https://github.com/dtolnay/proc-macro-workshop)
