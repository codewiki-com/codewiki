---
title: Rust 派生宏
description: 深入理解 Rust 派生宏：#[derive]、proc_macro_derive、syn、quote 及自定义派生宏实现
track: rust
section: traits-generics
difficulty: advanced
tags:
  - Rust
  - 宏
  - 派生宏
  - 过程宏
  - syn
  - quote
status: imported
origin: old/src/content/docs/rust/derive-macros.zh.md
divergence: 0.2
issues: []
legacy:
  category: Rust
  subcategory: 元编程
  order: 8
  lastUpdated: 2026-01-07
---

派生宏（Derive Macros）是 Rust 过程宏系统中最常用的一种形式，它允许你通过 `#[derive(...)]` 属性自动为类型实现 trait。从标准库的 `Debug`、`Clone` 到第三方库的 `Serialize`、`Deserialize`，派生宏极大地减少了样板代码，提升了开发效率。

## 概念解释

### 什么是派生宏

派生宏是一种特殊的过程宏，它在编译时接收结构体、枚举或联合体的定义作为输入，然后生成额外的代码（通常是 trait 实现）附加到原类型上。

```rust
// 使用派生宏
#[derive(Debug, Clone, PartialEq)]
struct User {
    name: String,
    age: u32,
}

// 编译器自动生成等价于以下代码：
// impl Debug for User { ... }
// impl Clone for User { ... }
// impl PartialEq for User { ... }
```

派生宏的名称来源于"派生"这个概念——从类型定义中派生出 trait 的实现。

### 派生宏与其他宏的区别

Rust 提供了三种过程宏类型：

| 宏类型 | 语法 | 用途 | 输入 | 输出 |
|--------|------|------|------|------|
| **派生宏** | `#[derive(MacroName)]` | 自动实现 trait | 类型定义 | 添加新代码 |
| **属性宏** | `#[macro_name]` | 修改或增强项 | 任意项 | 替换或增强 |
| **函数式宏** | `macro_name!(...)` | 自定义语法 | 任意 token | 任意 token |

派生宏的独特之处在于：
1. **只能用于类型定义**（struct、enum、union）
2. **只添加代码，不修改原始定义**
3. **可以定义辅助属性**用于配置生成行为

### 为什么需要派生宏

手动为每个类型实现常见 trait 既繁琐又容易出错。以 `Debug` trait 为例：

```rust
// 不使用派生宏，需要手动实现
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

// 使用派生宏，一行搞定
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}
```

派生宏的优势：
- **减少样板代码**：自动生成重复性代码
- **保持一致性**：确保实现遵循统一模式
- **减少错误**：机器生成的代码比手写更可靠
- **提高可维护性**：字段变化时自动更新实现

## 核心原理

### 派生宏的工作流程

派生宏在编译过程中经历以下阶段：

```
┌─────────────────────────────────────────────────────────────┐
│                      源代码                                  │
│   #[derive(MyTrait)]                                        │
│   struct Foo { ... }                                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    词法分析 & 语法分析                       │
│             生成 TokenStream                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     派生宏函数                               │
│   #[proc_macro_derive(MyTrait)]                             │
│   pub fn my_trait_derive(input: TokenStream) -> TokenStream │
│                                                              │
│   1. 使用 syn 解析 TokenStream 为 AST                        │
│   2. 分析类型结构（名称、字段、属性等）                       │
│   3. 使用 quote 生成新的 TokenStream                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    合并代码                                  │
│   原始类型定义 + 生成的 trait 实现                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    继续编译                                  │
│               类型检查、借用检查、代码生成                    │
└─────────────────────────────────────────────────────────────┘
```

### TokenStream 与 AST

派生宏操作的核心数据结构是 `TokenStream`——Rust 代码的 token 序列表示。

```rust
use proc_macro::TokenStream;

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    // input 包含被标记类型的 token 序列
    // 返回值是要添加到代码中的新 token 序列
    todo!()
}
```

直接操作 `TokenStream` 很复杂，因此我们使用辅助库：
- **syn**：将 `TokenStream` 解析为结构化的 AST
- **quote**：从 Rust 代码模板生成 `TokenStream`

### syn 库核心概念

`syn` 提供了丰富的类型来表示 Rust 的语法结构：

```rust
use syn::{DeriveInput, Data, Fields, Ident, Type};

// DeriveInput 表示派生宏的输入
pub struct DeriveInput {
    pub attrs: Vec<Attribute>,    // 属性列表
    pub vis: Visibility,          // 可见性
    pub ident: Ident,             // 类型名称
    pub generics: Generics,       // 泛型参数
    pub data: Data,               // 类型内容
}

// Data 表示类型的具体形式
pub enum Data {
    Struct(DataStruct),  // 结构体
    Enum(DataEnum),      // 枚举
    Union(DataUnion),    // 联合体
}

// Fields 表示字段集合
pub enum Fields {
    Named(FieldsNamed),      // 命名字段 { x: i32, y: i32 }
    Unnamed(FieldsUnnamed),  // 元组字段 (i32, i32)
    Unit,                    // 单元类型
}
```

### quote 库核心概念

`quote` 提供了 `quote!` 宏，用于编写生成代码的模板：

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

// quote! 支持的插值语法：
// #var         - 插入变量
// #(#iter)*    - 迭代展开（无分隔符）
// #(#iter),*   - 迭代展开（逗号分隔）
// #(#iter);*   - 迭代展开（分号分隔）
```

## 核心要点

### 派生宏 crate 配置

派生宏必须在独立的 crate 中定义，且需要特殊配置：

```toml
# Cargo.toml
[package]
name = "my_derive"
version = "0.1.0"
edition = "2021"

[lib]
proc-macro = true  # 关键：声明为过程宏 crate

[dependencies]
syn = { version = "2.0", features = ["full"] }
quote = "1.0"
proc-macro2 = "1.0"
```

### 基本派生宏结构

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    // 1. 解析输入
    let input = parse_macro_input!(input as DeriveInput);

    // 2. 提取信息
    let name = &input.ident;

    // 3. 生成代码
    let expanded = quote! {
        impl MyTrait for #name {
            fn my_method(&self) {
                println!("MyTrait implemented for {}", stringify!(#name));
            }
        }
    };

    // 4. 返回生成的 TokenStream
    TokenStream::from(expanded)
}
```

### 辅助属性（Helper Attributes）

派生宏可以定义辅助属性，用于在字段或变体上提供额外配置：

```rust
#[proc_macro_derive(MyTrait, attributes(my_attr))]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    // 现在可以识别 #[my_attr] 属性
    todo!()
}

// 使用时
#[derive(MyTrait)]
struct Config {
    #[my_attr(skip)]        // 辅助属性
    internal_field: String,

    #[my_attr(rename = "userName")]
    user_name: String,
}
```

### 处理泛型

派生宏需要正确处理泛型参数：

```rust
use syn::{parse_macro_input, DeriveInput, GenericParam, Generics};
use quote::quote;

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;
    let generics = &input.generics;

    // 分离泛型参数用于不同位置
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

对于 `struct Container<T> where T: Clone`，`split_for_impl()` 返回：
- `impl_generics`: `<T>`
- `ty_generics`: `<T>`
- `where_clause`: `where T: Clone`

## 代码示例

### 示例一：实现 Describe trait

一个打印类型信息的简单派生宏：

```rust
// my_derive/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Data, DeriveInput, Fields};

#[proc_macro_derive(Describe)]
pub fn describe_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    // 获取字段信息
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

使用示例：

```rust
// 在另一个 crate 中
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
    // 输出:
    // struct User {
    //   id: u64
    //   name: String
    //   email: Option<String>
    // }

    println!("{}", Status::describe());
    // 输出:
    // enum Status {
    //   - Active
    //   - Inactive
    //   - Pending
    // }
}
```

### 示例二：带属性的 Builder 派生宏

实现一个功能完整的 Builder 模式派生宏：

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
            _ => panic!("Builder 只支持命名字段的结构体"),
        },
        _ => panic!("Builder 只支持结构体"),
    };

    // 生成 Builder 结构体的字段
    let builder_fields = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;

        // 检查是否有默认值属性
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

    // 生成 Builder 的默认值
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

    // 生成 setter 方法
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

    // 生成 build 方法中的字段提取
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
                    format!("字段 '{}' 未设置", #name_str)
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

使用示例：

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

    // 必填字段未设置会报错
    let result = Server::builder()
        .host("localhost".to_string())
        .build();

    assert!(result.is_err());
    println!("{}", result.unwrap_err()); // 字段 'port' 未设置
}
```

### 示例三：处理枚举的 FromStr 派生宏

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
        _ => panic!("EnumFromStr 只支持枚举类型"),
    };

    // 生成匹配分支
    let match_arms = variants.iter().map(|v| {
        let variant = &v.ident;
        let variant_str = variant.to_string();
        let variant_lower = variant_str.to_lowercase();

        quote! {
            #variant_str | #variant_lower => Ok(#name::#variant)
        }
    });

    // 生成变体名称列表用于错误信息
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
                        "无效值 '{}', 有效选项: {}",
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

使用示例：

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

    let color: Color = "green".parse().unwrap();  // 大小写不敏感
    assert_eq!(color, Color::Green);

    let result: Result<Color, _> = "Yellow".parse();
    assert!(result.is_err());
    println!("{}", result.unwrap_err());
    // 无效值 'Yellow', 有效选项: Red, Green, Blue

    println!("可用颜色: {:?}", Color::variants());
    // 可用颜色: ["Red", "Green", "Blue"]
}
```

### 示例四：泛型结构体的 Debug 派生宏

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Data, DeriveInput, Fields, GenericParam};

#[proc_macro_derive(CustomDebug)]
pub fn custom_debug_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;
    let generics = &input.generics;

    // 添加 Debug 约束到所有类型参数
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
        _ => panic!("CustomDebug 只支持结构体"),
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

使用示例：

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

## 最佳实践

### 提供清晰的编译时错误信息

```rust
use syn::spanned::Spanned;
use syn::Error;

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    // 使用 syn::Error 提供带位置信息的错误
    if let Data::Enum(_) = &input.data {
        return Error::new(
            input.ident.span(),
            "MyTrait 不支持枚举类型，请使用结构体"
        )
        .to_compile_error()
        .into();
    }

    // 验证字段
    if let Data::Struct(data) = &input.data {
        if let Fields::Named(fields) = &data.fields {
            for field in &fields.named {
                if field.ident.as_ref().unwrap().to_string().starts_with("_") {
                    return Error::new(
                        field.span(),
                        "字段名不能以下划线开头"
                    )
                    .to_compile_error()
                    .into();
                }
            }
        }
    }

    // 正常处理...
    todo!()
}
```

### 使用完整路径避免命名冲突

```rust
let expanded = quote! {
    // 使用完整路径
    impl ::std::fmt::Debug for #name {
        fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
            ::std::write!(f, "{}", stringify!(#name))
        }
    }
};
```

### 将逻辑分离到辅助函数

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
        _ => panic!("不支持的类型"),
    }
}
```

### 合理使用属性配置

```rust
// 定义配置结构
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

### 编写测试

派生宏的测试通常使用 `trybuild` 或编写集成测试：

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

// 使用 trybuild 测试编译错误
#[test]
fn ui_tests() {
    let t = trybuild::TestCases::new();
    t.compile_fail("tests/ui/*.rs");
}
```

## 常见陷阱

### 陷阱一：忘记处理泛型

```rust
// 错误示例
let expanded = quote! {
    impl MyTrait for #name {  // 缺少泛型参数
        // ...
    }
};

// 正确示例
let (impl_generics, ty_generics, where_clause) = input.generics.split_for_impl();

let expanded = quote! {
    impl #impl_generics MyTrait for #name #ty_generics #where_clause {
        // ...
    }
};
```

### 陷阱二：属性解析不完整

```rust
// 辅助属性如果不在 proc_macro_derive 中声明，编译器会报错
#[proc_macro_derive(MyTrait)]  // 错误：未声明 my_attr
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    // 尝试使用 #[my_attr] 会失败
}

// 正确：声明辅助属性
#[proc_macro_derive(MyTrait, attributes(my_attr))]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    // 现在可以使用 #[my_attr]
}
```

### 陷阱三：生成的代码缺少 use 导入

```rust
// 错误：假设用户导入了 HashMap
let expanded = quote! {
    impl #name {
        fn to_map(&self) -> HashMap<String, String> {  // 可能找不到 HashMap
            // ...
        }
    }
};

// 正确：使用完整路径
let expanded = quote! {
    impl #name {
        fn to_map(&self) -> ::std::collections::HashMap<String, String> {
            // ...
        }
    }
};
```

### 陷阱四：未处理所有字段类型

```rust
// 只处理了命名字段，元组结构体会 panic
let fields = match &input.data {
    Data::Struct(data) => match &data.fields {
        Fields::Named(fields) => &fields.named,
        _ => panic!("只支持命名字段"),  // 应该提供更好的错误信息
    },
    _ => panic!("只支持结构体"),
};

// 更好的做法：返回编译错误
let fields = match &input.data {
    Data::Struct(data) => match &data.fields {
        Fields::Named(fields) => &fields.named,
        Fields::Unnamed(_) => {
            return Error::new(
                input.ident.span(),
                "此派生宏不支持元组结构体，请使用命名字段"
            )
            .to_compile_error()
            .into();
        }
        Fields::Unit => {
            return Error::new(
                input.ident.span(),
                "此派生宏不支持单元结构体"
            )
            .to_compile_error()
            .into();
        }
    },
    _ => {
        return Error::new(
            input.ident.span(),
            "此派生宏只支持结构体"
        )
        .to_compile_error()
        .into();
    }
};
```

### 陷阱五：quote 中的生命周期问题

```rust
// 错误：生命周期标注需要转义
let expanded = quote! {
    impl<'a> MyTrait<'a> for #name {  // 编译错误
        // ...
    }
};

// 正确：使用 quote 的生命周期语法
let expanded = quote! {
    impl<'a> MyTrait<'a> for #name {  // 实际上这样是对的
        fn get(&'a self) -> &'a str {
            // ...
        }
    }
};

// 如果需要动态生成生命周期
use syn::Lifetime;
let lifetime = Lifetime::new("'a", proc_macro2::Span::call_site());

let expanded = quote! {
    impl<#lifetime> MyTrait<#lifetime> for #name {
        // ...
    }
};
```

## 性能考量

### 编译时间影响

派生宏在编译时执行，其复杂度直接影响编译速度：

```rust
// 避免不必要的复杂解析
// 如果只需要类型名，不要解析完整的字段信息
let name = &input.ident;

// 避免在宏中进行大量字符串操作
// 不好的做法
let code = format!("impl {} for {} {{ ... }}", trait_name, struct_name);
code.parse().unwrap()  // 解析字符串很慢

// 好的做法：使用 quote
quote! {
    impl #trait_name for #struct_name { ... }
}
```

### 生成代码大小

过多的派生宏可能导致二进制膨胀：

```rust
// 考虑是否真的需要为每个类型生成代码
// 有时候一个通用的 trait 实现比派生宏更好

// 派生宏生成的代码（每个类型都有独立的实现）
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
struct Config { ... }

// 考虑是否所有这些 trait 都需要
// 或者能否使用泛型减少代码重复
```

### 增量编译

过程宏的改变会触发所有依赖它的代码重新编译：

```
my_derive (过程宏 crate)
    │
    ├── module_a (使用 #[derive(MyTrait)])
    │       │
    │       └── 重新编译
    │
    └── module_b (使用 #[derive(MyTrait)])
            │
            └── 重新编译
```

建议：
- 将派生宏放在独立的、稳定的 crate 中
- 避免频繁修改派生宏的实现
- 考虑使用 `cargo check` 进行快速验证

## 实战场景

### 场景一：ORM 框架的实体派生

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

// 派生宏生成：
// - 表名常量
// - 字段映射
// - SQL 生成方法
// - CRUD 操作方法
```

### 场景二：API 响应结构

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

// 生成 HTTP 响应相关的代码
```

### 场景三：配置文件解析

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

// 生成从文件和环境变量加载配置的代码
```

### 场景四：命令行参数解析

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

// 生成命令行解析代码
```

## 面试要点

### 基础概念题

**Q1: 什么是派生宏？它与声明宏有什么区别？**

派生宏是一种过程宏，通过 `#[derive(...)]` 属性自动为类型实现 trait。主要区别：

| 特性 | 派生宏 | 声明宏 (macro_rules!) |
|------|--------|----------------------|
| 定义位置 | 独立 crate，`proc-macro = true` | 任意位置 |
| 输入 | 完整的类型 AST | Token 模式匹配 |
| 能力 | 可访问完整类型信息 | 只能做模式替换 |
| 复杂度 | 需要 syn/quote | 相对简单 |
| 调试 | 需要 cargo expand | 可用 trace_macros |

**Q2: syn 和 quote 库的作用是什么？**

- **syn**：将 `TokenStream` 解析为结构化的 AST，提供 `DeriveInput`、`Data`、`Fields` 等类型来表示 Rust 代码结构
- **quote**：提供 `quote!` 宏，用于从 Rust 代码模板生成 `TokenStream`，支持变量插值和迭代展开

**Q3: 如何在派生宏中处理泛型？**

使用 `Generics::split_for_impl()` 分离泛型参数：

```rust
let (impl_generics, ty_generics, where_clause) = input.generics.split_for_impl();

quote! {
    impl #impl_generics MyTrait for #name #ty_generics #where_clause {
        // ...
    }
}
```

### 进阶题

**Q4: 派生宏如何支持辅助属性？**

在 `#[proc_macro_derive]` 中声明 `attributes`：

```rust
#[proc_macro_derive(MyTrait, attributes(my_attr))]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    // 现在可以在字段上使用 #[my_attr(...)]
}
```

**Q5: 如何在派生宏中提供友好的编译错误？**

使用 `syn::Error` 和 `spanned::Spanned`：

```rust
use syn::{Error, spanned::Spanned};

if condition_not_met {
    return Error::new(
        some_ast_node.span(),  // 指向出错的代码位置
        "清晰的错误描述"
    )
    .to_compile_error()
    .into();
}
```

**Q6: 派生宏的输出会替换原始类型定义吗？**

不会。派生宏只添加代码，不修改原始定义。这是派生宏与属性宏的关键区别。

### 实战题

**Q7: 实现一个 `Default` 派生宏，支持通过属性指定默认值**

```rust
#[derive(MyDefault)]
struct Config {
    #[default("localhost")]
    host: String,

    #[default(8080)]
    port: u16,
}
```

关键点：
1. 解析 `#[default(...)]` 属性
2. 提取字面量值
3. 生成 `Default` trait 实现

**Q8: 如何测试派生宏？**

- **正向测试**：编写使用派生宏的代码，验证生成的功能
- **编译错误测试**：使用 `trybuild` 验证错误情况能给出正确的编译错误
- **扩展测试**：使用 `cargo expand` 查看生成的代码

## 延伸阅读

### 官方文档

- [The Rust Reference - Procedural Macros](https://doc.rust-lang.org/reference/procedural-macros.html)
- [The Rust Book - Macros](https://doc.rust-lang.org/book/ch19-06-macros.html)
- [Rust By Example - Macros](https://doc.rust-lang.org/rust-by-example/macros.html)

### 核心库文档

- [syn crate 文档](https://docs.rs/syn/)
- [quote crate 文档](https://docs.rs/quote/)
- [proc-macro2 crate 文档](https://docs.rs/proc-macro2/)

### 教程与资源

- [Procedural Macros Workshop by David Tolnay](https://github.com/dtolnay/proc-macro-workshop) - 最佳实践教程
- [The Little Book of Rust Macros](https://danielkeep.github.io/tlborm/book/) - 宏编程深度指南
- [Rust 宏小册](https://zjp-cn.github.io/tlborm/) - 中文版宏编程指南

### 常用派生宏参考

- **serde** - `Serialize`, `Deserialize`：序列化/反序列化
- **thiserror** - `Error`：自定义错误类型
- **derive_more** - 多种实用派生宏集合
- **strum** - 枚举辅助派生宏
- **derive_builder** - Builder 模式派生宏
- **clap** - `Parser`：命令行参数解析

### 调试工具

- [cargo-expand](https://github.com/dtolnay/cargo-expand) - 查看宏展开后的代码
- [trybuild](https://docs.rs/trybuild/) - 测试编译错误

---

派生宏是 Rust 元编程的核心工具之一。通过掌握 `syn` 和 `quote`，你可以创建功能强大的代码生成器，大幅减少样板代码。关键是要平衡代码生成的便利性与可维护性，提供清晰的错误信息，并编写完善的测试。随着 Rust 生态的发展，派生宏已经成为库开发者的必备技能。
