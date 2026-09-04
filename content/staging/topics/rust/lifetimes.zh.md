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
origin: old/src/content/docs/rust/lifetimes.zh.md
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

生命周期是 Rust 确保引用始终有效的机制。它是 Rust 编译时内存安全保证的一部分，无需垃圾回收器即可防止悬垂引用和释放后使用的 bug。虽然生命周期最初看起来可能很复杂，但理解它们对于编写高级 Rust 代码至关重要。

## 什么是生命周期？

Rust 中的每个引用都有一个生命周期，即该引用有效的作用域。大多数情况下，生命周期是隐式的，由编译器推断，就像类型一样。然而，当编译器无法确定生命周期之间的关系时，你必须显式标注它们。

### 生命周期解决的问题

考虑这段如果没有生命周期检查就会出问题的代码：

```rust
fn main() {
    let r;                      // 声明 r 但不初始化

    {
        let x = 5;
        r = &x;                 // r 借用 x
    }                           // x 在这里离开作用域

    // println!("{}", r);       // 错误！r 将是一个悬垂引用
}
```

没有生命周期检查，`r` 将引用已被释放的内存。Rust 的借用检查器使用生命周期来确保这段代码无法编译。

### 借用检查器如何工作

借用检查器比较引用的生命周期以确保所有借用都是有效的：

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

这里，`'b`（`r` 的生命周期）包含在 `'a`（`x` 的生命周期）内，所以代码编译成功。

### 生命周期是关于作用域，而非持续时间

一个常见的误解是生命周期控制数据存活的时间长度。实际上，生命周期是告诉编译器引用作用域之间关系的标注。它们不会改变任何值存活的时间长度。

```rust
fn main() {
    let string1 = String::from("hello");    // string1 存活到 main 结束
    let string2 = String::from("world");    // string2 存活到 main 结束

    // longest() 上的生命周期标注不会改变
    // string1 或 string2 何时被丢弃 - 它只告诉编译器
    // 输入和输出引用之间的关系
    let result = longest(&string1, &string2);

    println!("Longest: {}", result);
}

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

## 生命周期标注语法

生命周期标注使用撇号后跟小写名称。按照惯例，第一个生命周期命名为 `'a`，第二个 `'b`，以此类推。

### 基本语法

```rust
&i32         // 一个引用
&'a i32      // 一个带有显式生命周期 'a 的引用
&'a mut i32  // 一个带有显式生命周期 'a 的可变引用
```

### 多个生命周期参数

当引用具有不同的关系时，函数可以有多个生命周期参数：

```rust
fn example<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    // 返回类型与 'a 关联，而非 'b
    x
}
```

### 生命周期出现的位置

生命周期可以出现在多个上下文中：

```rust
// 函数签名
fn foo<'a>(x: &'a str) -> &'a str { x }

// 结构体定义
struct Wrapper<'a> {
    value: &'a str,
}

// impl 块
impl<'a> Wrapper<'a> {
    fn get(&self) -> &'a str {
        self.value
    }
}

// 类型别名
type StrRef<'a> = &'a str;

// trait 约束
fn bar<'a, T: 'a>(x: &'a T) { }
```

## 函数中的生命周期

接受和返回引用的函数通常需要生命周期标注来表达输入和输出生命周期之间的关系。

### 为什么函数需要生命周期标注

考虑一个返回两个字符串切片中较长者的函数：

```rust
// 这不会编译 - 缺少生命周期标注
// fn longest(x: &str, y: &str) -> &str {
//     if x.len() > y.len() { x } else { y }
// }

// 带有生命周期标注的正确版本
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

签名 `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str` 告诉编译器：
- 函数接受两个引用，它们必须至少存活 `'a` 这么久
- 返回的引用将至少在 `'a` 期间有效
- 实际上，`'a` 将是两个输入生命周期中较短的那个

### 理解生命周期约束

当你对多个引用使用相同的生命周期参数时，你是在说它们必须在相同的持续时间内都有效：

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
        // result 在这里有效，因为两个字符串都在作用域内
    }
    // result 在这里将无效，因为 string2 已被丢弃
}
```

### 不同参数的不同生命周期

有时输入引用具有独立的生命周期：

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

// 这里，'a 和 'b 是独立的 - y 的生命周期不影响返回值
fn choose_first<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    println!("y is: {}", y);  // y 只是被使用，不被返回
    x
}

fn main() {
    let outer = String::from("outer");
    let result;

    {
        let inner = String::from("inner");
        result = choose_first(&outer, &inner);
        // 这没问题！result 只依赖于 outer 的生命周期
    }

    println!("Result: {}", result);  // 有效，因为 outer 仍然存活
}
```

### 生命周期标注和返回类型

返回类型的生命周期必须与输入生命周期相关联，或者是 `'static`：

```rust
// 有效：返回生命周期与输入相关联
fn identity<'a>(s: &'a str) -> &'a str {
    s
}

// 有效：返回静态字符串
fn hello_world() -> &'static str {
    "Hello, World!"
}

// 无效：不能返回对本地创建数据的引用
// fn invalid<'a>() -> &'a str {
//     let s = String::from("hello");
//     &s  // 错误！s 在函数结束时被丢弃
// }

// 正确：改为返回拥有所有权的数据
fn create_string() -> String {
    String::from("hello")
}
```

## 生命周期省略规则

Rust 有生命周期省略规则，允许你在常见模式中省略显式生命周期标注。这些规则使代码更简洁而不牺牲安全性。

### 三条省略规则

编译器按顺序应用这些规则：

**规则 1：输入位置的每个省略的生命周期成为一个独立的生命周期参数。**

```rust
// 这个：
fn foo(x: &str, y: &str) { }

// 变成：
fn foo<'a, 'b>(x: &'a str, y: &'b str) { }
```

**规则 2：如果只有一个输入生命周期位置，该生命周期被分配给所有省略的输出生命周期。**

```rust
// 这个：
fn foo(x: &str) -> &str { x }

// 变成：
fn foo<'a>(x: &'a str) -> &'a str { x }
```

**规则 3：如果有多个输入生命周期位置，但其中一个是 `&self` 或 `&mut self`，`self` 的生命周期被分配给所有省略的输出生命周期。**

```rust
impl MyStruct {
    // 这个：
    fn get_data(&self, s: &str) -> &str { &self.data }

    // 变成：
    fn get_data<'a, 'b>(&'a self, s: &'b str) -> &'a str { &self.data }
}
```

### 省略示例

```rust
// 不需要省略 - 签名中没有引用
fn add(x: i32, y: i32) -> i32 { x + y }

// 只有规则 1 - 没有输出引用
fn print_str(s: &str) {
    println!("{}", s);
}

// 规则 1 和 2 - 单个输入，输出生命周期匹配
fn first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}

// 等价于：
fn first_word_explicit<'a>(s: &'a str) -> &'a str {
    s.split_whitespace().next().unwrap_or("")
}

// 规则 1 和 3 - 带 &self 的方法
struct Parser {
    data: String,
}

impl Parser {
    // 输出生命周期与 &self 关联
    fn parse(&self) -> &str {
        &self.data
    }

    // 等价于：
    fn parse_explicit<'a>(&'a self) -> &'a str {
        &self.data
    }
}
```

### 当省略不起作用时

省略规则不能覆盖所有情况。在以下情况需要显式标注：

```rust
// 多个输入引用，返回可能是任一个
fn longest(x: &str, y: &str) -> &str {  // 错误！有歧义
    if x.len() > y.len() { x } else { y }
}

// 必须指定：
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// 结构体字段始终需要显式生命周期
struct Excerpt<'a> {
    part: &'a str,  // 不能省略这个
}
```

## 结构体中的生命周期

当结构体持有引用时，它需要一个生命周期参数来确保引用在结构体的生命周期内保持有效。

### 基本结构体生命周期

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
// excerpt 不能比 novel 存活更久，因为 excerpt.part 引用了 novel
```

### 多个生命周期的结构体

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
    // multi 在这里被丢弃，因为 string2 被丢弃了
}
```

### 带生命周期的结构体方法

```rust
struct Parser<'a> {
    input: &'a str,
    position: usize,
}

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Self {
        Parser { input, position: 0 }
    }

    // 返回类型生命周期与结构体的生命周期关联（规则 3）
    fn remaining(&self) -> &str {
        &self.input[self.position..]
    }

    // 显式生命周期显示同样的事情
    fn remaining_explicit(&self) -> &'a str {
        &self.input[self.position..]
    }

    // 不返回对借用数据的引用的方法
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

### 带泛型类型的生命周期

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

// 将生命周期约束与 trait 约束结合
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

## 生命周期约束

生命周期约束指定生命周期之间以及生命周期和类型之间的关系。

### 类型约束：`T: 'a`

约束 `T: 'a` 意味着"类型 T 必须至少存活与生命周期 'a 一样长"：

```rust
struct Ref<'a, T: 'a> {
    value: &'a T,
}

// 没有 T: 'a 约束，这不会编译，因为
// 我们无法保证 T 存活足够长

fn print_ref<'a, T: 'a + std::fmt::Debug>(value: &'a T) {
    println!("{:?}", value);
}
```

### 生命周期约束：`'a: 'b`

约束 `'a: 'b` 意味着"'a 比 'b 存活更久"或"'a 至少与 'b 一样长"：

```rust
fn longest_with_announcement<'a, 'b>(
    x: &'a str,
    y: &'a str,
    announcement: &'b str,
) -> &'a str
where
    'a: 'b,  // 'a 必须比 'b 存活更久
{
    println!("Announcement: {}", announcement);
    if x.len() > y.len() { x } else { y }
}
```

### 组合多个约束

```rust
use std::fmt::{Debug, Display};

fn complex_function<'a, 'b, T, U>(
    x: &'a T,
    y: &'b U,
) -> &'a T
where
    'a: 'b,           // 'a 比 'b 存活更久
    T: 'a + Debug,    // T 至少存活与 'a 一样长且实现 Debug
    U: 'b + Display,  // U 至少存活与 'b 一样长且实现 Display
{
    println!("y: {}", y);
    println!("x: {:?}", x);
    x
}
```

## 静态生命周期

`'static` 生命周期是一个特殊的生命周期，意味着引用可以在程序的整个持续时间内存活。

### 字符串字面量是静态的

```rust
fn main() {
    let s: &'static str = "I have a static lifetime.";
    println!("{}", s);
}
```

字符串字面量直接存储在程序的二进制文件中，所以它们始终可用。

### 创建静态引用

```rust
// 全局常量具有静态生命周期
static GLOBAL: i32 = 42;

fn get_global() -> &'static i32 {
    &GLOBAL
}

// 使用 Box::leak 创建静态引用
fn create_static() -> &'static str {
    let s = String::from("Hello");
    Box::leak(s.into_boxed_str())
}

// 对于复杂的静态数据使用 lazy_static 或 once_cell
use std::sync::OnceLock;

static CONFIG: OnceLock<String> = OnceLock::new();

fn get_config() -> &'static str {
    CONFIG.get_or_init(|| {
        String::from("default config")
    })
}
```

### 何时使用 `'static`

```rust
// 线程生成需要 'static，因为线程可能比调用者存活更久
use std::thread;

fn main() {
    let message = String::from("Hello from thread!");

    // 这有效是因为我们移动了所有权
    thread::spawn(move || {
        println!("{}", message);
    }).join().unwrap();

    // 这不会工作：
    // let borrowed = &message;
    // thread::spawn(|| {
    //     println!("{}", borrowed);  // 错误！borrowed 不是 'static
    // });
}

// trait 对象通常需要 'static
fn takes_dyn(x: Box<dyn std::fmt::Debug + 'static>) {
    println!("{:?}", x);
}
```

### `'static` 不意味着"永远存活"

一个常见的误解：`'static` 不意味着数据永远存活，它意味着数据*可以*在需要时存活那么久：

```rust
fn main() {
    let s: &'static str = "hello";

    // s 在这里被丢弃，但二进制文件中的字符串字面量仍然存在
    // 'static 只意味着这个引用在我们需要的时候是有效的
}

// 拥有所有权的类型满足 'static 约束，因为它们可以任意长时间存活
fn requires_static<T: 'static>(x: T) {
    // T 可以存活任意长时间，因为它是拥有所有权的
}

fn main() {
    let s = String::from("hello");
    requires_static(s);  // 有效！String 拥有其数据

    let local = 42;
    requires_static(local);  // 有效！i32 是 Copy 的且拥有其值
}
```

## 高级生命周期模式

### 协变和逆变

Rust 生命周期是协变的，意味着更长的生命周期可以在期望更短生命周期的地方使用：

```rust
fn covariance_example<'long, 'short>(
    long: &'long str,
    short: &'short str,
) where
    'long: 'short,  // 'long 比 'short 存活更久
{
    // 可以在期望 &'short str 的地方使用 &'long str
    let _: &'short str = long;  // OK：协变允许这样做

    // 不能反过来
    // let _: &'long str = short;  // 错误
}
```

### 重新借用

重新借用允许你从一个更长生命周期的引用创建一个更短生命周期的引用：

```rust
fn reborrow_example() {
    let mut data = vec![1, 2, 3];

    let r1 = &mut data;

    // 重新借用：创建一个具有更短生命周期的新可变引用
    {
        let r2 = &mut *r1;  // 重新借用 r1
        r2.push(4);
        // r2 在这里被丢弃
    }

    // r2 被丢弃后，r1 又可以使用了
    r1.push(5);

    println!("{:?}", data);
}
```

### 自引用结构体

由于生命周期约束，自引用结构体在 Rust 中很有挑战性：

```rust
// 这不会编译 - 自引用结构体
// struct SelfRef {
//     data: String,
//     slice: &str,  // 不能引用 data
// }

// 解决方案 1：使用索引而不是引用
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

// 解决方案 2：使用 Pin 和 unsafe（高级）
use std::pin::Pin;
use std::marker::PhantomPinned;

struct SelfRefPinned {
    data: String,
    slice: *const str,  // 原始指针而不是引用
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

        // SAFETY：我们不会移动数据
        unsafe {
            let mut_ref: Pin<&mut Self> = Pin::as_mut(&mut boxed);
            Pin::get_unchecked_mut(mut_ref).slice = slice;
        }

        boxed
    }

    fn get_slice(self: Pin<&Self>) -> &str {
        // SAFETY：slice 指向不会移动的有效数据
        unsafe { &*self.slice }
    }
}
```

### trait 中的生命周期子类型

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

// 使用不同生命周期的 trait
fn use_container<'a, 'b, C: Container<'a>>(container: &'b C) -> &'a str
where
    'a: 'b,
{
    container.get()
}
```

## 高阶 trait 约束 (HRTB)

高阶 trait 约束（HRTB）允许你在 trait 约束中表达"对于任何生命周期"。

### `for<'a>` 语法

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

### 闭包中的 HRTB

```rust
// 这个闭包需要适用于任何生命周期
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

### 何时需要 HRTB

```rust
trait Parser {
    // 这个方法必须适用于任何输入生命周期
    fn parse<'a>(&self, input: &'a str) -> Result<&'a str, &'static str>;
}

// 存储解析器需要 HRTB
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

## 常见的生命周期陷阱

### 陷阱 1：混淆生命周期标注

```rust
// 错误：认为 'a 会让字符串存活更久
fn wrong_thinking<'a>(x: &'a str, y: &'a str) -> &'a str {
    // 'a 不会延长生命周期 - 它描述关系
    x
}

// 正确：理解 'a 是输入生命周期的交集
fn right_thinking<'a>(x: &'a str, y: &'a str) -> &'a str {
    // 返回的引用只有在 x 和 y 都有效时才有效
    if x.len() > y.len() { x } else { y }
}
```

### 陷阱 2：返回对局部变量的引用

```rust
// 错误：返回对本地数据的引用
// fn create_and_return() -> &str {
//     let s = String::from("hello");
//     &s  // 错误！s 被丢弃
// }

// 正确：返回拥有所有权的数据
fn create_and_return() -> String {
    String::from("hello")
}

// 正确：返回静态数据
fn return_static() -> &'static str {
    "hello"
}
```

### 陷阱 3：过度约束生命周期

```rust
// 过度约束：两个参数不必要地绑定到同一个生命周期
fn over_constrained<'a>(data: &'a str, prefix: &'a str) -> String {
    format!("{}{}", prefix, data)
}

// 更好：独立的生命周期，因为我们返回拥有所有权的数据
fn better<'a, 'b>(data: &'a str, prefix: &'b str) -> String {
    format!("{}{}", prefix, data)
}

// 最好：使用省略，因为不需要生命周期关系
fn best(data: &str, prefix: &str) -> String {
    format!("{}{}", prefix, data)
}
```

### 陷阱 4：结构体生命周期过于限制

```rust
// 问题：Parser 不能比解析中使用的任何临时值存活更久
struct BadParser<'a> {
    source: &'a str,
    temp_buffer: &'a str,  // 这将所有东西绑定到一个生命周期
}

// 更好：为独立的数据分离生命周期
struct BetterParser<'source, 'buffer> {
    source: &'source str,
    temp_buffer: &'buffer str,
}

// 最好：如果缓冲区是临时的，则拥有它
struct BestParser<'a> {
    source: &'a str,
    temp_buffer: String,  // 拥有所有权，没有生命周期约束
}
```

### 陷阱 5：与借用检查器对抗

```rust
// 对抗：试图在持有可变借用时返回引用
struct Data {
    values: Vec<i32>,
}

impl Data {
    // 错误的方法 - 试图修改并返回引用
    // fn add_and_get(&mut self, value: i32) -> &i32 {
    //     self.values.push(value);
    //     self.values.last().unwrap()  // 可变借用时的引用
    // }

    // 正确：改为返回索引
    fn add_and_get_index(&mut self, value: i32) -> usize {
        self.values.push(value);
        self.values.len() - 1
    }

    fn get(&self, index: usize) -> Option<&i32> {
        self.values.get(index)
    }
}
```

## 最佳实践

### 尽可能让编译器推断

```rust
// 好：让省略规则起作用
fn first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}

// 不必要：与省略匹配的显式生命周期
fn first_word_explicit<'a>(s: &'a str) -> &'a str {
    s.split_whitespace().next().unwrap_or("")
}
```

### 在实际中优先使用拥有所有权的类型

```rust
// 如果你无论如何都要克隆，就直接获取所有权
fn process_owned(s: String) -> String {
    s.to_uppercase()
}

// 只有在不需要所有权时才借用
fn process_borrowed(s: &str) -> String {
    s.to_uppercase()
}
```

### 使用泛型生命周期约束以获得灵活性

```rust
use std::fmt::Display;

// 灵活：适用于任何生命周期
fn announce<'a, T: Display>(value: &'a T, message: &str) -> &'a T {
    println!("{}: {}", message, value);
    value
}
```

### 记录复杂的生命周期关系

```rust
/// 返回两个字符串中较长的一个。
///
/// # 生命周期
/// 返回的引用在两个输入生命周期中较短的那个期间有效。
/// 如果 `first` 比 `second` 存活更久，结果只在 `second` 有效期间有效。
fn longest<'a>(first: &'a str, second: &'a str) -> &'a str {
    if first.len() >= second.len() {
        first
    } else {
        second
    }
}
```

### 考虑使用 Cow 以获得灵活性

```rust
use std::borrow::Cow;

// 可以返回借用的或拥有的数据
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

    println!("Not modified: {}", not_modified);  // 无分配
    println!("Modified: {}", modified);          // 已分配
}
```

### 为复杂的生命周期使用类型别名

```rust
type ParseResult<'a> = Result<(&'a str, &'a str), ParseError>;

struct ParseError {
    message: String,
}

fn parse_pair(input: &str) -> ParseResult {
    // 实现...
    Ok((&input[0..5], &input[6..]))
}
```

## 结论

生命周期是 Rust 最强大的特性之一，可以在没有垃圾回收的情况下实现内存安全。关键要点：

- **生命周期描述关系**：它们告诉编译器引用生命周期如何相互关联，而不是数据存活多久。
- **省略处理常见情况**：大多数生命周期标注可以通过省略规则由编译器推断。
- **`'static` 意味着"可以永远存活"**：不是说它会永远存活，而是它不受任何其他生命周期的约束。
- **优先选择简单性**：在实际中使用拥有所有权的类型，尽可能让编译器推断生命周期。
- **信任借用检查器**：它在捕获真正的 bug。如果你在与它对抗，请重新考虑你的设计。

深入理解生命周期将帮助你编写更复杂的 Rust 代码，并在借用检查器拒绝你的代码时更好地理解错误消息。

## 延伸阅读

- [The Rust Programming Language - Validating References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html)
- [Rust By Example - Lifetimes](https://doc.rust-lang.org/rust-by-example/scope/lifetime.html)
- [The Rustonomicon - Lifetimes](https://doc.rust-lang.org/nomicon/lifetimes.html)
- [Common Rust Lifetime Misconceptions](https://github.com/pretzelhammer/rust-blog/blob/master/posts/common-rust-lifetime-misconceptions.md)
