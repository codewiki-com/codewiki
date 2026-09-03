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
origin: old/src/content/docs/rust/traits-generics.zh.md
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

Trait 是 Rust 中实现抽象和多态的核心机制。它定义了类型必须提供的行为，类似于其他语言中的接口。泛型则允许我们编写可以处理多种类型的代码，结合 Trait 边界，我们可以构建既灵活又类型安全的系统。

## Trait 定义与实现

### 基础 Trait 定义

Trait 定义了一组方法签名，任何实现该 Trait 的类型都必须提供这些方法的具体实现。

```rust
// 定义一个描述可总结内容的 Trait
pub trait Summary {
    fn summarize(&self) -> String;
}

// 定义结构体
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

// 为 NewsArticle 实现 Summary trait
impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

// 为 Tweet 实现 Summary trait
impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}

fn main() {
    let article = NewsArticle {
        headline: String::from("Rust 1.70 发布"),
        location: String::from("在线"),
        author: String::from("Rust 团队"),
        content: String::from("Rust 1.70 带来了许多新特性..."),
    };

    let tweet = Tweet {
        username: String::from("rust_lang"),
        content: String::from("我们很高兴宣布..."),
        reply: false,
        retweet: false,
    };

    println!("新文章: {}", article.summarize());
    println!("新推文: {}", tweet.summarize());
}
```

### 默认实现

Trait 可以提供方法的默认实现，类型可以选择使用默认实现或提供自己的实现。

```rust
pub trait Summary {
    fn summarize_author(&self) -> String;

    // 带有默认实现的方法
    fn summarize(&self) -> String {
        format!("(阅读更多来自 {}...)", self.summarize_author())
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}

impl Summary for Tweet {
    // 只需实现 summarize_author
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
    // summarize 使用默认实现
}

fn main() {
    let tweet = Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("当然，正如你可能已经知道的，人们"),
        reply: false,
        retweet: false,
    };

    println!("1 条新推文: {}", tweet.summarize());
    // 输出: 1 条新推文: (阅读更多来自 @horse_ebooks...)
}
```

默认实现可以调用同一 Trait 中的其他方法，即使这些方法没有默认实现：

```rust
pub trait Display {
    fn fmt(&self) -> String;

    fn print(&self) {
        println!("{}", self.fmt());
    }
}
```

## Trait 作为参数

### impl Trait 语法

最简单的方式是使用 `impl Trait` 语法：

```rust
pub fn notify(item: &impl Summary) {
    println!("突发新闻！{}", item.summarize());
}

// 可以接受任何实现了 Summary trait 的类型
fn main() {
    let article = NewsArticle {
        headline: String::from("重大发现"),
        location: String::from("实验室"),
        author: String::from("科学家"),
        content: String::from("详细内容..."),
    };

    notify(&article);
}
```

### Trait 边界语法

`impl Trait` 实际上是 Trait 边界的语法糖：

```rust
// impl Trait 语法
pub fn notify(item: &impl Summary) {
    println!("突发新闻！{}", item.summarize());
}

// 等价的 Trait 边界语法
pub fn notify<T: Summary>(item: &T) {
    println!("突发新闻！{}", item.summarize());
}
```

对于更复杂的情况，Trait 边界更加清晰：

```rust
// 两个参数可以是不同类型
pub fn notify(item1: &impl Summary, item2: &impl Summary) {
    // ...
}

// 强制两个参数是相同类型
pub fn notify<T: Summary>(item1: &T, item2: &T) {
    // ...
}
```

### 多个 Trait 边界

使用 `+` 语法指定多个 Trait 边界：

```rust
use std::fmt::Display;

pub fn notify(item: &(impl Summary + Display)) {
    println!("{}", item);
    println!("摘要: {}", item.summarize());
}

// 或使用泛型语法
pub fn notify<T: Summary + Display>(item: &T) {
    println!("{}", item);
    println!("摘要: {}", item.summarize());
}
```

### where 子句

当 Trait 边界变得复杂时，使用 `where` 子句可以提高可读性：

```rust
// 不使用 where 子句
fn some_function<T: Display + Clone, U: Clone + Debug>(t: &T, u: &U) -> i32 {
    // ...
}

// 使用 where 子句
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
    // ...
}
```

复杂示例：

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

## 返回实现 Trait 的类型

### 返回 impl Trait

可以使用 `impl Trait` 语法返回实现了某个 Trait 的类型：

```rust
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("当然，正如你可能已经知道的，人们"),
        reply: false,
        retweet: false,
    }
}
```

**重要限制**：只能返回单一类型。以下代码无法编译：

```rust
// 错误！无法根据条件返回不同类型
fn returns_summarizable(switch: bool) -> impl Summary {
    if switch {
        NewsArticle {
            headline: String::from("企鹅队赢得冠军！"),
            location: String::from("匹兹堡"),
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

## 泛型与 Trait 边界

### 基础泛型函数

```rust
// 寻找切片中的最大值
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
    println!("最大的数字是 {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];
    let result = largest(&char_list);
    println!("最大的字符是 {}", result);
}
```

### 结构体中的泛型与 Trait 边界

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

// 只为实现了特定 Trait 的类型实现方法
impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("最大的成员是 x = {}", self.x);
        } else {
            println!("最大的成员是 y = {}", self.y);
        }
    }
}

fn main() {
    let pair = Pair::new(5, 10);
    pair.cmp_display(); // 可以调用，因为 i32 实现了 Display 和 PartialOrd
}
```

### 有条件地实现 Trait

```rust
use std::fmt::Display;

struct Wrapper<T>(T);

// 为所有类型实现 new 方法
impl<T> Wrapper<T> {
    fn new(value: T) -> Self {
        Wrapper(value)
    }
}

// 只为实现了 Display 的类型实现 print 方法
impl<T: Display> Wrapper<T> {
    fn print(&self) {
        println!("包装的值: {}", self.0);
    }
}

fn main() {
    let wrapper_int = Wrapper::new(42);
    wrapper_int.print(); // 可以调用

    let wrapper_vec = Wrapper::new(vec![1, 2, 3]);
    // wrapper_vec.print(); // 错误！Vec 没有实现 Display
}
```

### blanket implementations (覆盖实现)

可以为任何满足特定 Trait 边界的类型实现 Trait：

```rust
trait MyTrait {
    fn do_something(&self);
}

// 为所有实现了 Display 的类型实现 MyTrait
impl<T: Display> MyTrait for T {
    fn do_something(&self) {
        println!("执行操作: {}", self);
    }
}

fn main() {
    let number = 42;
    number.do_something(); // i32 实现了 Display，所以也有 MyTrait

    let text = "hello";
    text.do_something(); // &str 也实现了 Display
}
```

标准库中的实际例子：

```rust
// 标准库中的覆盖实现
// 为任何实现了 Display 的类型实现 ToString
impl<T: Display> ToString for T {
    fn to_string(&self) -> String {
        // ...
    }
}
```

## 关联类型

关联类型是 Trait 中的类型占位符，实现者必须指定具体类型。

### 基础关联类型

```rust
pub trait Iterator {
    type Item; // 关联类型

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
    type Item = u32; // 指定关联类型

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
        println!("计数: {}", value);
    }
}
```

### 关联类型 vs 泛型

关联类型和泛型看起来相似，但有重要区别：

```rust
// 使用泛型 - 可以为同一类型实现多次
pub trait Iterator<T> {
    fn next(&mut self) -> Option<T>;
}

// 需要在每次使用时指定类型
impl Iterator<String> for Counter {
    fn next(&mut self) -> Option<String> { /* ... */ }
}

impl Iterator<u32> for Counter {
    fn next(&mut self) -> Option<u32> { /* ... */ }
}

// 使用关联类型 - 每个类型只能实现一次
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}

// 只能有一个实现
impl Iterator for Counter {
    type Item = u32;
    fn next(&mut self) -> Option<Self::Item> { /* ... */ }
}
```

关联类型的优势：

```rust
// 使用关联类型 - 更简洁
fn process_iterator(iter: &mut impl Iterator) {
    if let Some(item) = iter.next() {
        // 使用 item
    }
}

// 如果使用泛型 - 需要指定类型参数
fn process_iterator<T>(iter: &mut impl Iterator<T>) {
    if let Some(item) = iter.next() {
        // 使用 item
    }
}
```

### 复杂关联类型示例

```rust
use std::ops::Add;

trait Graph {
    type Node;
    type Edge;

    fn has_edge(&self, node1: &Self::Node, node2: &Self::Node) -> bool;
    fn edges(&self, node: &Self::Node) -> Vec<Self::Edge>;
}

struct MyGraph {
    // 图的数据结构
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
        // 实现逻辑
        true
    }

    fn edges(&self, node: &Self::Node) -> Vec<Self::Edge> {
        // 返回边
        vec![]
    }
}
```

## Trait 对象与动态分发

Trait 对象允许在运行时处理不同的类型，实现动态多态。

### 创建 Trait 对象

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
        println!("绘制按钮: {} ({}x{})", self.label, self.width, self.height);
    }
}

pub struct SelectBox {
    pub width: u32,
    pub height: u32,
    pub options: Vec<String>,
}

impl Draw for SelectBox {
    fn draw(&self) {
        println!("绘制选择框: {} 个选项 ({}x{})",
                 self.options.len(), self.width, self.height);
    }
}

// 使用 Trait 对象存储不同类型
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
                label: String::from("确定"),
            }),
            Box::new(SelectBox {
                width: 75,
                height: 10,
                options: vec![
                    String::from("是"),
                    String::from("否"),
                    String::from("可能"),
                ],
            }),
        ],
    };

    screen.run();
}
```

### 静态分发 vs 动态分发

```rust
// 静态分发 - 编译时确定具体类型，单态化
fn draw_static<T: Draw>(item: &T) {
    item.draw();
}

// 动态分发 - 运行时通过虚表查找方法
fn draw_dynamic(item: &dyn Draw) {
    item.draw();
}

fn main() {
    let button = Button {
        width: 50,
        height: 10,
        label: String::from("点击"),
    };

    // 静态分发 - 性能更好，代码体积可能更大
    draw_static(&button);

    // 动态分发 - 更灵活，运行时开销
    draw_dynamic(&button);
}
```

### Object Safety (对象安全)

并非所有 Trait 都可以作为 Trait 对象。要成为对象安全的，Trait 必须满足：

1. 方法不返回 `Self`
2. 方法没有泛型类型参数

```rust
// 对象安全的 Trait
pub trait Draw {
    fn draw(&self);
}

// 不是对象安全的 Trait
pub trait Clone {
    fn clone(&self) -> Self; // 返回 Self
}

// 不是对象安全的 Trait
pub trait Comparable<T> {
    fn compare(&self, other: &T) -> bool; // 泛型类型参数
}

// 使用 Trait 对象会导致错误
// let obj: Box<dyn Clone> = Box::new(5); // 编译错误！
```

使对象不安全的 Trait 变为对象安全：

```rust
// 修改返回类型
pub trait Drawable {
    fn draw(&self) -> Box<dyn Drawable>; // 返回 Trait 对象而不是 Self
}

// 移除泛型，使用关联类型
pub trait Comparable {
    type Other;
    fn compare(&self, other: &Self::Other) -> bool;
}
```

## 孤儿规则 (Orphan Rule)

孤儿规则是 Rust 中的一个重要约束：**只有当 Trait 或类型至少有一个是在当前 crate 中定义的时候，才能为该类型实现该 Trait**。

### 合法的实现

```rust
use std::fmt;

// 情况 1: 为本地类型实现外部 Trait
struct MyType {
    value: i32,
}

// ✅ 合法：MyType 是本地类型
impl fmt::Display for MyType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "MyType({})", self.value)
    }
}

// 情况 2: 为外部类型实现本地 Trait
trait MyTrait {
    fn do_something(&self);
}

// ✅ 合法：MyTrait 是本地 Trait
impl MyTrait for i32 {
    fn do_something(&self) {
        println!("值: {}", self);
    }
}

// 情况 3: 为本地类型实现本地 Trait
struct LocalType;
trait LocalTrait {
    fn method(&self);
}

// ✅ 合法：两者都是本地的
impl LocalTrait for LocalType {
    fn method(&self) {
        println!("本地实现");
    }
}
```

### 非法的实现

```rust
use std::fmt;

// ❌ 非法：不能为外部类型实现外部 Trait
// impl fmt::Display for Vec<i32> {
//     fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
//         write!(f, "{:?}", self)
//     }
// }
// 错误：Display 和 Vec 都不是在本 crate 中定义的
```

### 绕过孤儿规则：Newtype 模式

使用 newtype 模式包装外部类型：

```rust
use std::fmt;

// 创建包装类型
struct Wrapper(Vec<String>);

// ✅ 合法：Wrapper 是本地类型
impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

fn main() {
    let w = Wrapper(vec![
        String::from("你好"),
        String::from("世界"),
    ]);
    println!("包装的向量: {}", w);
}
```

Newtype 模式的好处：

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

    // 类型安全：不会混淆公里和英里
    // let wrong: Kilometers = miles; // 编译错误！
}
```

## 高级 Trait 功能

### 完全限定语法

当多个 Trait 有同名方法时，使用完全限定语法：

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
        println!("机长在此");
    }
}

impl Wizard for Human {
    fn fly(&self) {
        println!("起飞！");
    }
}

impl Human {
    fn fly(&self) {
        println!("*用力挥舞手臂*");
    }
}

fn main() {
    let person = Human;

    person.fly();           // 调用 Human 的方法
    Pilot::fly(&person);    // 调用 Pilot trait 的方法
    Wizard::fly(&person);   // 调用 Wizard trait 的方法

    // 完全限定语法
    <Human as Pilot>::fly(&person);
    <Human as Wizard>::fly(&person);
}
```

对于关联函数（没有 `self` 参数）：

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
    println!("小狗叫: {}", Dog::baby_name());
    // 必须使用完全限定语法
    println!("小狗叫: {}", <Dog as Animal>::baby_name());
}
```

### Supertraits (父 Trait)

要求实现某个 Trait 的类型也必须实现另一个 Trait：

```rust
use std::fmt;

// OutlinePrint 需要 Display
trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string(); // 可以使用 Display 的方法
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

// 必须先实现 Display
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

// 然后才能实现 OutlinePrint
impl OutlinePrint for Point {}

fn main() {
    let p = Point { x: 1, y: 3 };
    p.outline_print();
}
```

### Derive 宏

自动为类型生成 Trait 实现：

```rust
// 常用的可派生 Trait
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
struct Person {
    name: String,
    age: u32,
}

fn main() {
    let person1 = Person {
        name: String::from("张三"),
        age: 30,
    };

    // Debug
    println!("{:?}", person1);

    // Clone
    let person2 = person1.clone();

    // PartialEq
    println!("相等吗？{}", person1 == person2);

    // PartialOrd
    let person3 = Person {
        name: String::from("李四"),
        age: 25,
    };
    println!("person1 > person3? {}", person1 > person3);
}
```

## 实战示例

### 构建插件系统

```rust
use std::collections::HashMap;

// 定义插件接口
trait Plugin: Send + Sync {
    fn name(&self) -> &str;
    fn execute(&self, input: &str) -> String;
}

// 插件注册表
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

// 实现具体插件
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

    let input = "你好，世界";

    if let Some(result) = registry.execute("uppercase", input) {
        println!("大写: {}", result);
    }

    if let Some(result) = registry.execute("reverse", input) {
        println!("反转: {}", result);
    }
}
```

### 类型状态模式

使用 Trait 和泛型实现编译时状态检查：

```rust
// 状态标记
struct Draft;
struct PendingReview;
struct Published;

// 文章结构
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
    post.add_text("我今天午餐吃了沙拉");

    let post = post.request_review();
    // post.add_text("更多文本"); // 编译错误！不能修改审核中的文章

    let post = post.approve();
    println!("已发布的内容: {}", post.content());

    // 编译时保证状态转换正确
    // let post = Post::<Published>::new(); // 编译错误！不能直接创建已发布的文章
}
```

## 最佳实践

### 优先使用 Trait 边界而非 Trait 对象

```rust
// 推荐：静态分发
fn process<T: Summary>(item: &T) {
    println!("{}", item.summarize());
}

// 仅在需要运行时多态时使用
fn process_dynamic(item: &dyn Summary) {
    println!("{}", item.summarize());
}
```

### 使用 impl Trait 简化返回类型

```rust
// 清晰简洁
fn make_iterator() -> impl Iterator<Item = i32> {
    vec![1, 2, 3].into_iter()
}

// 而不是
fn make_iterator_verbose() -> std::vec::IntoIter<i32> {
    vec![1, 2, 3].into_iter()
}
```

### 保持 Trait 小而专注

```rust
// 好：职责单一
trait Read {
    fn read(&mut self, buf: &mut [u8]) -> Result<usize>;
}

trait Write {
    fn write(&mut self, buf: &[u8]) -> Result<usize>;
}

// 避免：过大的 Trait
// trait FileOperations {
//     fn read(&mut self) -> String;
//     fn write(&mut self, data: &str);
//     fn delete(&mut self);
//     fn rename(&mut self, new_name: &str);
//     fn copy(&mut self, dest: &str);
//     // ... 太多方法
// }
```

### 使用关联类型简化 API

```rust
// 推荐：使用关联类型
trait Container {
    type Item;
    fn get(&self, index: usize) -> Option<&Self::Item>;
}

// 而不是泛型（除非需要多个实现）
trait Container<T> {
    fn get(&self, index: usize) -> Option<&T>;
}
```

## 总结

Trait 和泛型是 Rust 实现抽象和代码复用的核心机制：

- **Trait** 定义共享行为，类似于接口
- **泛型** 允许编写适用于多种类型的代码
- **Trait 边界** 约束泛型类型必须实现特定行为
- **关联类型** 简化 Trait 定义，每个类型只有一个实现
- **Trait 对象** 实现运行时多态，但有性能开销
- **孤儿规则** 确保代码一致性，可通过 newtype 模式绕过
- **静态分发** 提供零成本抽象，**动态分发** 提供灵活性

掌握这些概念，你将能够设计出既灵活又高效的 Rust 程序，充分利用 Rust 的类型系统提供的安全性和性能优势。
