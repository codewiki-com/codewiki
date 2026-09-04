---
title: Rust 所有权规则深度解析
description: 全面解析 Rust 所有权三大规则、移动语义、Copy trait 及所有权转移机制，从原理到实战掌握 Rust 内存管理核心
track: rust
section: ownership-borrowing
difficulty: intermediate
tags:
  - Rust
  - 所有权
  - 移动语义
  - Copy trait
  - 内存管理
  - 面试
status: imported
origin: old/src/content/docs/rust/ownership-rules.zh.md
divergence: 0.074
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Rust
  subcategory: 所有权系统
  order: 5
  lastUpdated: 2026-01-07
---

所有权（Ownership）是 Rust 最具革命性的特性，它让 Rust 在编译期就能保证内存安全，无需垃圾回收器。本文将深入剖析所有权的三大规则、移动语义、Copy trait 及所有权转移机制，帮助你彻底掌握 Rust 内存管理的核心。

## 概念解释

### 什么是所有权

所有权是 Rust 用于管理内存的一组规则。与其他语言不同，Rust 既不使用垃圾回收（如 Java、Go），也不要求程序员手动管理内存（如 C/C++），而是通过所有权系统在编译时检查内存使用的正确性。

**历史背景**：在 Rust 之前，系统编程语言面临着两难选择——要么牺牲安全性换取性能（如 C/C++），要么牺牲性能换取安全性（如使用 GC 的语言）。Rust 的所有权系统开创了第三条路：通过编译期静态分析，实现零成本的内存安全。

**所有权解决的核心问题**：

1. **内存泄漏**：忘记释放不再使用的内存
2. **悬垂指针**：使用已被释放的内存
3. **双重释放**：同一块内存被释放两次
4. **数据竞争**：多线程同时修改同一数据

### 所有权的三大规则

Rust 的所有权系统建立在三条简单但强大的规则之上：

```
规则一：Rust 中的每个值都有一个所有者（owner）
规则二：值在任一时刻只能有一个所有者
规则三：当所有者离开作用域时，值将被丢弃（drop）
```

这三条规则看似简单，却构成了 Rust 内存管理的基石。

## 核心原理

### 栈与堆：理解所有权的基础

在深入所有权之前，必须理解栈（Stack）和堆（Heap）的区别：

```rust
fn main() {
    // 栈上分配：大小固定，分配快速
    let x: i32 = 42;           // 4 字节，直接存储在栈上
    let y: f64 = 3.14;         // 8 字节，直接存储在栈上
    let z: bool = true;        // 1 字节，直接存储在栈上

    // 堆上分配：大小可变，需要所有权管理
    let s: String = String::from("hello");  // 数据在堆上，指针/长度/容量在栈上
    let v: Vec<i32> = vec![1, 2, 3];        // 数据在堆上，元数据在栈上
}
```

**栈的特点**：
- 后进先出（LIFO）结构
- 分配和释放极快（只需移动栈指针）
- 存储大小在编译时已知的数据
- 自动管理，函数返回时自动清理

**堆的特点**：
- 动态分配，大小可在运行时确定
- 分配较慢（需要找到足够大的空间）
- 需要显式管理生命周期
- 这正是所有权系统发挥作用的地方

### 所有权如何工作

让我们通过内存模型来理解所有权：

```rust
fn main() {
    let s1 = String::from("hello");
    // 此时内存布局:
    // 栈: s1 -> { ptr: 0x1234, len: 5, capacity: 5 }
    // 堆: 0x1234 -> ['h', 'e', 'l', 'l', 'o']

    let s2 = s1;  // 所有权移动！
    // 此时内存布局:
    // 栈: s1 -> [无效]
    //     s2 -> { ptr: 0x1234, len: 5, capacity: 5 }
    // 堆: 0x1234 -> ['h', 'e', 'l', 'l', 'o']

    // println!("{}", s1);  // 编译错误：s1 已失效
    println!("{}", s2);     // 正确
} // s2 离开作用域，堆内存被释放
```

### RAII 模式

Rust 采用 RAII（Resource Acquisition Is Initialization）模式：

```rust
fn main() {
    {
        let file = std::fs::File::create("temp.txt").unwrap();
        // 文件被打开，资源被获取

        // 使用文件...

    } // file 离开作用域，自动调用 drop，文件被关闭

    // 对比 C 语言：需要手动调用 fclose()
}
```

`drop` 函数是 Rust 的析构函数，当值离开作用域时自动调用：

```rust
struct CustomResource {
    name: String,
}

impl Drop for CustomResource {
    fn drop(&mut self) {
        println!("释放资源: {}", self.name);
    }
}

fn main() {
    let r1 = CustomResource { name: String::from("资源1") };
    {
        let r2 = CustomResource { name: String::from("资源2") };
        println!("使用资源...");
    } // 输出: 释放资源: 资源2

    println!("继续执行...");
} // 输出: 释放资源: 资源1
```

## 核心要点

### 要点一：移动语义（Move Semantics）

移动是 Rust 所有权转移的核心机制。当一个值被赋给另一个变量时，所有权会转移：

```rust
fn main() {
    // 1. 简单赋值引发移动
    let s1 = String::from("hello");
    let s2 = s1;  // s1 的所有权移动到 s2
    // s1 此时无效，不能再使用

    // 2. 函数参数引发移动
    let s3 = String::from("world");
    take_ownership(s3);  // s3 的所有权移动到函数内
    // s3 此时无效

    // 3. 返回值引发移动
    let s4 = give_ownership();  // 函数返回值的所有权移动到 s4
}

fn take_ownership(s: String) {
    println!("{}", s);
} // s 在此被 drop

fn give_ownership() -> String {
    String::from("new string")  // 所有权移动给调用者
}
```

**为什么需要移动语义？**

```rust
// 假设没有移动语义，而是浅拷贝
fn hypothetical() {
    let s1 = String::from("hello");
    let s2 = s1;  // 如果是浅拷贝...

    // s1 和 s2 都指向同一块堆内存
    // 当两者都离开作用域时，同一块内存会被释放两次！
    // 这就是 double free 错误
}

// Rust 通过移动语义避免这个问题
fn reality() {
    let s1 = String::from("hello");
    let s2 = s1;  // 移动，s1 失效

    // 只有 s2 指向堆内存
    // s2 离开作用域时，内存只被释放一次
}
```

### 要点二：Copy trait

某些类型实现了 `Copy` trait，在赋值时会自动复制而不是移动：

```rust
fn main() {
    // 实现了 Copy 的类型
    let x = 5;
    let y = x;  // 复制，不是移动！
    println!("x = {}, y = {}", x, y);  // 两者都有效

    // 未实现 Copy 的类型
    let s1 = String::from("hello");
    let s2 = s1;  // 移动！
    // println!("{}", s1);  // 错误：s1 已无效
}
```

**哪些类型实现了 Copy？**

```rust
// 1. 所有标量类型
let a: i8 = 1;
let b: i16 = 2;
let c: i32 = 3;
let d: i64 = 4;
let e: i128 = 5;
let f: isize = 6;

let g: u8 = 1;
let h: u16 = 2;
let i: u32 = 3;
let j: u64 = 4;
let k: u128 = 5;
let l: usize = 6;

let m: f32 = 3.14;
let n: f64 = 2.718;

let o: bool = true;
let p: char = 'A';

// 2. 只包含 Copy 类型的元组
let tuple: (i32, f64, bool) = (1, 2.0, true);
let tuple_copy = tuple;  // 复制

// 3. 只包含 Copy 类型的固定大小数组
let arr: [i32; 5] = [1, 2, 3, 4, 5];
let arr_copy = arr;  // 复制

// 4. 共享引用（&T）
let s = String::from("hello");
let r1 = &s;
let r2 = r1;  // 复制引用，两个引用都指向同一数据
println!("{}, {}", r1, r2);  // 两者都有效
```

**Copy 的约束规则**：

```rust
// 规则：如果类型实现了 Drop trait，就不能实现 Copy trait
// 原因：Drop 意味着需要特殊的清理逻辑，简单的按位复制是不安全的

// String 实现了 Drop（释放堆内存），所以不能实现 Copy
// Vec<T> 实现了 Drop（释放堆内存），所以不能实现 Copy

// 自定义类型实现 Copy
#[derive(Copy, Clone)]  // Clone 是 Copy 的超 trait
struct Point {
    x: i32,
    y: i32,
}

// 包含非 Copy 字段的结构体不能实现 Copy
// #[derive(Copy, Clone)]  // 编译错误！
// struct Container {
//     data: String,  // String 不是 Copy
// }
```

### 要点三：Clone trait

当需要深拷贝时，使用 `Clone` trait：

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone();  // 显式深拷贝

    println!("s1 = {}, s2 = {}", s1, s2);  // 两者都有效

    // 内存布局:
    // 栈: s1 -> { ptr: 0x1234, len: 5, capacity: 5 }
    //     s2 -> { ptr: 0x5678, len: 5, capacity: 5 }
    // 堆: 0x1234 -> ['h', 'e', 'l', 'l', 'o']
    //     0x5678 -> ['h', 'e', 'l', 'l', 'o']  // 新分配的内存
}
```

**Copy 与 Clone 的关系**：

```rust
// Copy 是 Clone 的子 trait
// 实现 Copy 必须也实现 Clone

// Clone: 显式调用，可能昂贵（如分配内存）
// Copy:  隐式发生，必须是廉价的按位复制

trait Copy: Clone { }  // Copy 要求 Clone

// 所有 Copy 类型都可以 clone，但 clone 可能比复制更灵活
let x: i32 = 5;
let y = x.clone();  // 对于 Copy 类型，clone() 等同于复制
```

### 要点四：所有权转移的各种场景

```rust
fn main() {
    // 场景1：变量赋值
    let a = String::from("hello");
    let b = a;  // 移动

    // 场景2：函数调用
    let c = String::from("world");
    consume(c);  // 移动到函数

    // 场景3：函数返回
    let d = produce();  // 从函数获得所有权

    // 场景4：结构体字段
    let e = String::from("field");
    let container = Container { data: e };  // 移动到结构体

    // 场景5：集合操作
    let f = String::from("item");
    let mut vec = Vec::new();
    vec.push(f);  // 移动到向量

    // 场景6：模式匹配
    let g = Some(String::from("optional"));
    if let Some(s) = g {  // s 获得所有权
        println!("{}", s);
    }
    // g 此时无效（已被消耗）
}

fn consume(s: String) {
    println!("{}", s);
}

fn produce() -> String {
    String::from("produced")
}

struct Container {
    data: String,
}
```

## 代码示例

### 示例一：所有权规则的基本应用

```rust
/// 演示所有权的三大规则
fn ownership_rules_demo() {
    // 规则1：每个值都有一个所有者
    let owner = String::from("I am owned");

    // 规则2：同一时刻只能有一个所有者
    let new_owner = owner;  // 所有权转移
    // owner 不再是所有者，不能使用

    // 规则3：所有者离开作用域，值被丢弃
    {
        let scoped = String::from("I am scoped");
        println!("{}", scoped);
    }  // scoped 在此被 drop

    println!("{}", new_owner);
}

fn main() {
    ownership_rules_demo();
}
```

### 示例二：移动语义详解

```rust
/// 深入理解移动语义
fn move_semantics_deep_dive() {
    // 1. 基本移动
    let original = String::from("original data");
    let moved = original;
    // println!("{}", original);  // 编译错误！
    println!("Moved: {}", moved);

    // 2. 函数参数中的移动
    let data = String::from("function data");
    process_string(data);
    // data 已移动到函数内，此处不可用

    // 3. 保留所有权的方式：返回
    let data2 = String::from("return data");
    let data2 = process_and_return(data2);
    println!("Returned: {}", data2);  // 可以继续使用

    // 4. 结构体中的移动
    let name = String::from("Alice");
    let person = Person { name };  // name 移动到 person
    // println!("{}", name);  // 编译错误！
    println!("Person: {:?}", person);
}

fn process_string(s: String) {
    println!("Processing: {}", s);
}  // s 在此被 drop

fn process_and_return(s: String) -> String {
    println!("Processing: {}", s);
    s  // 返回所有权
}

#[derive(Debug)]
struct Person {
    name: String,
}

fn main() {
    move_semantics_deep_dive();
}
```

### 示例三：Copy 与 Clone 的实践

```rust
/// Copy 与 Clone 的区别和使用
fn copy_and_clone_demo() {
    // Copy 类型：自动复制
    let num1 = 42;
    let num2 = num1;  // 复制
    println!("Copy: num1 = {}, num2 = {}", num1, num2);

    // 非 Copy 类型：必须 clone
    let str1 = String::from("hello");
    let str2 = str1.clone();  // 显式克隆
    println!("Clone: str1 = {}, str2 = {}", str1, str2);

    // 自定义 Copy 类型
    let point1 = Point { x: 10, y: 20 };
    let point2 = point1;  // 复制
    println!("Copy struct: point1 = {:?}, point2 = {:?}", point1, point2);

    // 非 Copy 的自定义类型
    let rect1 = Rectangle::new(100, 50);
    let rect2 = rect1.clone();  // 必须克隆
    println!("Clone struct: rect1 = {:?}, rect2 = {:?}", rect1, rect2);

    // 复杂场景：Vec 中的元素
    let numbers: Vec<i32> = vec![1, 2, 3];
    let numbers_copy = numbers.clone();  // Vec 本身需要 clone

    // 但 Vec 中的 i32 是 Copy 的
    for &n in &numbers {
        let copied = n;  // i32 自动复制
        println!("Copied number: {}", copied);
    }
}

#[derive(Debug, Copy, Clone)]
struct Point {
    x: i32,
    y: i32,
}

#[derive(Debug, Clone)]  // 不能 Copy，因为内部可能有复杂逻辑
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn new(width: u32, height: u32) -> Self {
        Self { width, height }
    }
}

fn main() {
    copy_and_clone_demo();
}
```

### 示例四：所有权转移的高级模式

```rust
/// 所有权转移的高级模式
fn advanced_ownership_patterns() {
    // 模式1：构建器模式中的所有权
    let config = ConfigBuilder::new()
        .set_name(String::from("MyApp"))
        .set_version(String::from("1.0.0"))
        .build();
    println!("Config: {:?}", config);

    // 模式2：Option 中的所有权
    let mut maybe_data: Option<String> = Some(String::from("data"));

    // take() 转移所有权并留下 None
    if let Some(data) = maybe_data.take() {
        println!("Took: {}", data);
    }
    println!("After take: {:?}", maybe_data);  // None

    // 模式3：Result 中的所有权
    let result: Result<String, &str> = Ok(String::from("success"));
    match result {
        Ok(s) => println!("Got: {}", s),  // s 获得所有权
        Err(e) => println!("Error: {}", e),
    }
    // result 已被消耗，不能再使用

    // 模式4：into_iter() 转移所有权
    let strings = vec![
        String::from("a"),
        String::from("b"),
        String::from("c"),
    ];

    for s in strings.into_iter() {  // 转移每个元素的所有权
        println!("Got string: {}", s);
    }
    // strings 已被消耗，不能再使用
}

#[derive(Debug)]
struct Config {
    name: String,
    version: String,
}

struct ConfigBuilder {
    name: Option<String>,
    version: Option<String>,
}

impl ConfigBuilder {
    fn new() -> Self {
        Self {
            name: None,
            version: None,
        }
    }

    fn set_name(mut self, name: String) -> Self {
        self.name = Some(name);
        self  // 返回 self 的所有权
    }

    fn set_version(mut self, version: String) -> Self {
        self.version = Some(version);
        self
    }

    fn build(self) -> Config {
        Config {
            name: self.name.unwrap_or_default(),
            version: self.version.unwrap_or_default(),
        }
    }
}

fn main() {
    advanced_ownership_patterns();
}
```

### 示例五：部分移动（Partial Move）

```rust
/// 部分移动示例
fn partial_move_demo() {
    #[derive(Debug)]
    struct Person {
        name: String,
        age: u32,
        email: String,
    }

    let person = Person {
        name: String::from("Alice"),
        age: 30,
        email: String::from("alice@example.com"),
    };

    // 部分移动：只移动某些字段
    let name = person.name;  // name 字段被移动
    let age = person.age;    // age 是 Copy，被复制

    // person 整体不再可用
    // println!("{:?}", person);  // 编译错误！

    // 但未移动的字段仍可访问
    println!("Name: {}", name);
    println!("Age: {}", age);
    println!("Email: {}", person.email);  // email 未被移动

    // 使用 ref 关键字避免移动
    let person2 = Person {
        name: String::from("Bob"),
        age: 25,
        email: String::from("bob@example.com"),
    };

    let Person { ref name, age, ref email } = person2;
    println!("Borrowed name: {}", name);
    println!("Copied age: {}", age);
    println!("Borrowed email: {}", email);
    println!("Person2 still valid: {:?}", person2);
}

fn main() {
    partial_move_demo();
}
```

## 最佳实践

### 实践一：优先使用借用

```rust
// 不推荐：不必要地获取所有权
fn print_length_bad(s: String) -> usize {
    let len = s.len();
    // s 在这里被 drop，调用者失去了对数据的访问
    len
}

// 推荐：使用借用
fn print_length_good(s: &String) -> usize {
    s.len()
    // s 的所有权保留在调用者处
}

// 更推荐：使用 &str 提高通用性
fn print_length_best(s: &str) -> usize {
    s.len()
    // 可以接受 &String 和 &str
}

fn main() {
    let s = String::from("hello");

    // 使用借用版本
    let len = print_length_best(&s);
    println!("Length: {}, still have: {}", len, s);
}
```

### 实践二：合理使用 Clone

```rust
// 场景1：需要独立副本时使用 clone
fn need_independent_copy() {
    let original = String::from("shared data");

    let copy_for_thread = original.clone();
    std::thread::spawn(move || {
        println!("Thread: {}", copy_for_thread);
    });

    println!("Main: {}", original);  // original 仍然可用
}

// 场景2：避免不必要的 clone
fn avoid_unnecessary_clone(data: &Vec<String>) {
    // 不推荐
    // let cloned = data.clone();
    // for s in cloned.iter() { ... }

    // 推荐：直接使用引用
    for s in data.iter() {
        println!("{}", s);
    }
}

// 场景3：使用 Cow（Clone-on-Write）优化
use std::borrow::Cow;

fn process_text(input: &str) -> Cow<str> {
    if input.contains("bad") {
        // 只有需要修改时才克隆
        Cow::Owned(input.replace("bad", "good"))
    } else {
        // 无需修改时返回借用
        Cow::Borrowed(input)
    }
}
```

### 实践三：使用 std::mem::take 和 std::mem::replace

```rust
use std::mem;

fn main() {
    // take：取出值并用默认值替换
    let mut s = String::from("hello");
    let taken = mem::take(&mut s);
    println!("Taken: {}, Remaining: {:?}", taken, s);  // s 变成空字符串

    // replace：用新值替换并返回旧值
    let mut value = String::from("old");
    let old = mem::replace(&mut value, String::from("new"));
    println!("Old: {}, New: {}", old, value);

    // 实际应用：在结构体方法中转移字段所有权
    let mut container = Container {
        data: Some(String::from("important")),
    };

    if let Some(data) = container.data.take() {
        println!("Got: {}", data);
    }
}

struct Container {
    data: Option<String>,
}
```

### 实践四：Drop 顺序的理解

```rust
struct Droppable {
    name: &'static str,
}

impl Drop for Droppable {
    fn drop(&mut self) {
        println!("Dropping: {}", self.name);
    }
}

fn main() {
    let a = Droppable { name: "a" };
    let b = Droppable { name: "b" };
    let c = Droppable { name: "c" };

    // Drop 顺序：变量按声明的逆序 drop
    // 输出顺序：c, b, a
}

// 结构体字段的 drop 顺序
struct Container {
    first: Droppable,
    second: Droppable,
}

fn struct_drop_order() {
    let container = Container {
        first: Droppable { name: "first" },
        second: Droppable { name: "second" },
    };
    // 字段按声明顺序 drop：first, second
}
```

## 常见陷阱

### 陷阱一：循环中的所有权问题

```rust
fn main() {
    let strings = vec![
        String::from("a"),
        String::from("b"),
        String::from("c"),
    ];

    // 陷阱：into_iter 会消耗 Vec
    // for s in strings.into_iter() {
    //     println!("{}", s);
    // }
    // println!("{:?}", strings);  // 错误！strings 已被消耗

    // 解决方案1：使用 iter() 借用
    for s in strings.iter() {
        println!("{}", s);
    }
    println!("Still have: {:?}", strings);

    // 解决方案2：如果需要所有权，使用 clone
    for s in strings.iter().cloned() {
        // s 是每个元素的克隆
        println!("{}", s);
    }

    // 解决方案3：使用索引
    for i in 0..strings.len() {
        println!("{}", &strings[i]);
    }
}
```

### 陷阱二：闭包捕获所有权

```rust
fn main() {
    let s = String::from("hello");

    // 陷阱：闭包默认按引用捕获，但有时会移动
    // let closure = || {
    //     let moved = s;  // 闭包内部移动了 s
    //     println!("{}", moved);
    // };
    // println!("{}", s);  // 错误！s 已被闭包捕获

    // 解决方案1：使用 move 关键字明确意图
    let s1 = String::from("hello");
    let closure = move || {
        println!("{}", s1);
    };
    // s1 已移动到闭包中
    closure();

    // 解决方案2：在闭包外 clone
    let s2 = String::from("world");
    let s2_clone = s2.clone();
    let closure2 = move || {
        println!("{}", s2_clone);
    };
    println!("Original: {}", s2);  // s2 仍然可用
    closure2();
}
```

### 陷阱三：match 表达式中的移动

```rust
fn main() {
    let opt = Some(String::from("value"));

    // 陷阱：match 会移动非 Copy 类型
    // match opt {
    //     Some(s) => println!("{}", s),  // s 获得所有权
    //     None => println!("None"),
    // }
    // println!("{:?}", opt);  // 错误！opt 已被消耗

    // 解决方案1：使用 ref 关键字
    let opt1 = Some(String::from("value1"));
    match opt1 {
        Some(ref s) => println!("{}", s),  // s 是引用
        None => println!("None"),
    }
    println!("{:?}", opt1);  // opt1 仍然可用

    // 解决方案2：对 Option 的引用进行 match
    let opt2 = Some(String::from("value2"));
    match &opt2 {
        Some(s) => println!("{}", s),  // s 自动是引用
        None => println!("None"),
    }
    println!("{:?}", opt2);

    // 解决方案3：使用 as_ref() 方法
    let opt3 = Some(String::from("value3"));
    if let Some(s) = opt3.as_ref() {
        println!("{}", s);
    }
    println!("{:?}", opt3);
}
```

### 陷阱四：结构体更新语法与移动

```rust
#[derive(Debug)]
struct User {
    name: String,
    email: String,
    age: u32,
}

fn main() {
    let user1 = User {
        name: String::from("Alice"),
        email: String::from("alice@example.com"),
        age: 30,
    };

    // 陷阱：结构体更新语法会移动非 Copy 字段
    let user2 = User {
        name: String::from("Bob"),
        ..user1  // email 被移动，age 被复制
    };

    // println!("{:?}", user1);  // 错误！user1 部分移动
    println!("user1.age: {}", user1.age);  // age 是 Copy，可以访问
    // println!("user1.email: {}", user1.email);  // 错误！email 已移动

    println!("{:?}", user2);

    // 解决方案：显式 clone
    let user3 = User {
        name: String::from("Charlie"),
        email: String::from("charlie@example.com"),
        age: 25,
    };

    let user4 = User {
        name: String::from("David"),
        email: user3.email.clone(),  // 显式 clone
        age: user3.age,
    };

    println!("{:?}", user3);  // user3 仍然完全可用
    println!("{:?}", user4);
}
```

## 性能考量

### 移动 vs Clone：性能对比

```rust
use std::time::Instant;

fn benchmark_move_vs_clone() {
    const ITERATIONS: usize = 1_000_000;

    // 测试移动性能
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        let s = String::from("hello world, this is a test string");
        let _ = move_string(s);
    }
    let move_time = start.elapsed();

    // 测试克隆性能
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        let s = String::from("hello world, this is a test string");
        let _ = clone_string(&s);
    }
    let clone_time = start.elapsed();

    println!("Move time: {:?}", move_time);
    println!("Clone time: {:?}", clone_time);
    // 移动通常比克隆快很多倍
}

fn move_string(s: String) -> String {
    s  // 只是复制指针，O(1)
}

fn clone_string(s: &String) -> String {
    s.clone()  // 复制堆数据，O(n)
}
```

### 避免不必要的分配

```rust
// 不推荐：每次调用都分配新 String
fn format_greeting_bad(name: &str) -> String {
    format!("Hello, {}!", name)
}

// 推荐：使用预分配的缓冲区
fn format_greeting_good(name: &str, buffer: &mut String) {
    buffer.clear();
    buffer.push_str("Hello, ");
    buffer.push_str(name);
    buffer.push('!');
}

// 更好：使用 Cow 避免不必要的分配
use std::borrow::Cow;

fn maybe_uppercase(s: &str) -> Cow<str> {
    if s.chars().any(|c| c.is_lowercase()) {
        Cow::Owned(s.to_uppercase())
    } else {
        Cow::Borrowed(s)  // 已经是大写，无需分配
    }
}
```

### 内联与所有权

```rust
// 小的 Copy 类型可以高效地按值传递
#[inline]
fn add_points(p1: Point, p2: Point) -> Point {
    Point {
        x: p1.x + p2.x,
        y: p1.y + p2.y,
    }
}

#[derive(Copy, Clone)]
struct Point {
    x: i32,
    y: i32,
}

// 大的类型应该按引用传递
fn process_large_data(data: &LargeStruct) -> u64 {
    // 不移动，只读取
    data.compute_hash()
}

struct LargeStruct {
    data: [u8; 1024],
}

impl LargeStruct {
    fn compute_hash(&self) -> u64 {
        // 计算哈希值
        0
    }
}
```

## 实战场景

### 场景一：资源管理器

```rust
use std::collections::HashMap;

/// 文件句柄管理器
struct ResourceManager {
    handles: HashMap<String, FileHandle>,
}

struct FileHandle {
    path: String,
    // 其他资源...
}

impl Drop for FileHandle {
    fn drop(&mut self) {
        println!("Closing file: {}", self.path);
        // 清理资源
    }
}

impl ResourceManager {
    fn new() -> Self {
        Self {
            handles: HashMap::new(),
        }
    }

    /// 打开文件并获取句柄的所有权
    fn open(&mut self, path: String) -> &FileHandle {
        self.handles.entry(path.clone()).or_insert_with(|| {
            println!("Opening file: {}", path);
            FileHandle { path }
        })
    }

    /// 关闭文件，转移所有权并 drop
    fn close(&mut self, path: &str) -> Option<FileHandle> {
        self.handles.remove(path)
        // 返回的 FileHandle 如果不被使用，将被 drop
    }

    /// 转移某个文件的所有权给调用者
    fn take(&mut self, path: &str) -> Option<FileHandle> {
        self.handles.remove(path)
    }
}

fn main() {
    let mut manager = ResourceManager::new();

    manager.open(String::from("/tmp/file1.txt"));
    manager.open(String::from("/tmp/file2.txt"));

    // 获取文件句柄的所有权
    if let Some(handle) = manager.take("/tmp/file1.txt") {
        println!("Got ownership of: {}", handle.path);
        // handle 在这里被 drop
    }

    // manager 被 drop 时，剩余的文件会被关闭
}
```

### 场景二：消息传递系统

```rust
use std::sync::mpsc;
use std::thread;

/// 消息类型 - 所有权在通道间传递
enum Message {
    Text(String),
    Binary(Vec<u8>),
    Quit,
}

fn main() {
    let (tx, rx) = mpsc::channel();

    // 生产者线程
    let producer = thread::spawn(move || {
        // tx 的所有权移动到这个线程
        for i in 0..5 {
            let msg = Message::Text(format!("Message {}", i));
            tx.send(msg).unwrap();  // msg 的所有权转移到通道
        }
        tx.send(Message::Quit).unwrap();
        // tx 在线程结束时被 drop
    });

    // 消费者线程
    let consumer = thread::spawn(move || {
        // rx 的所有权移动到这个线程
        loop {
            match rx.recv().unwrap() {
                Message::Text(s) => println!("Received: {}", s),
                Message::Binary(data) => println!("Received {} bytes", data.len()),
                Message::Quit => {
                    println!("Quitting...");
                    break;
                }
            }
        }
    });

    producer.join().unwrap();
    consumer.join().unwrap();
}
```

### 场景三：状态机实现

```rust
/// 使用所有权实现类型安全的状态机
mod state_machine {
    pub struct Idle;
    pub struct Running {
        pub task_id: u64,
    }
    pub struct Paused {
        pub task_id: u64,
        pub progress: f32,
    }
    pub struct Completed {
        pub task_id: u64,
        pub result: String,
    }

    pub struct Machine<State> {
        state: State,
    }

    impl Machine<Idle> {
        pub fn new() -> Self {
            Machine { state: Idle }
        }

        // 消耗 self，返回新状态的 Machine
        pub fn start(self, task_id: u64) -> Machine<Running> {
            println!("Starting task {}", task_id);
            Machine {
                state: Running { task_id },
            }
        }
    }

    impl Machine<Running> {
        pub fn pause(self, progress: f32) -> Machine<Paused> {
            println!("Pausing task {} at {}%", self.state.task_id, progress * 100.0);
            Machine {
                state: Paused {
                    task_id: self.state.task_id,
                    progress,
                },
            }
        }

        pub fn complete(self, result: String) -> Machine<Completed> {
            println!("Completing task {}", self.state.task_id);
            Machine {
                state: Completed {
                    task_id: self.state.task_id,
                    result,
                },
            }
        }
    }

    impl Machine<Paused> {
        pub fn resume(self) -> Machine<Running> {
            println!("Resuming task {} from {}%",
                     self.state.task_id, self.state.progress * 100.0);
            Machine {
                state: Running {
                    task_id: self.state.task_id,
                },
            }
        }
    }

    impl Machine<Completed> {
        pub fn get_result(&self) -> &str {
            &self.state.result
        }
    }
}

fn main() {
    use state_machine::*;

    // 类型系统确保状态转换的正确性
    let machine = Machine::new()
        .start(1)
        .pause(0.5)
        .resume()
        .complete(String::from("Done!"));

    println!("Result: {}", machine.get_result());

    // 以下代码无法编译 - 类型系统阻止非法状态转换
    // let idle = Machine::new();
    // let paused = idle.pause(0.5);  // 错误！Idle 状态没有 pause 方法
}
```

## 面试要点

### 必考问题一：解释 Rust 的所有权规则

**答案要点**：
1. 每个值有且只有一个所有者
2. 同一时刻只能有一个所有者
3. 所有者离开作用域时值被丢弃
4. 这三条规则在编译时检查，保证内存安全

### 必考问题二：移动语义 vs 复制语义

```rust
// 回答示例
fn explain_move_vs_copy() {
    // 移动：适用于堆上分配的数据
    let s1 = String::from("hello");
    let s2 = s1;  // s1 失效，所有权转移到 s2

    // 复制：适用于栈上的简单数据（实现了 Copy trait）
    let n1 = 5;
    let n2 = n1;  // n1 仍然有效，值被复制

    // 为什么需要区分？
    // 1. 防止 double free
    // 2. 零成本抽象：移动只是复制指针，非常高效
    // 3. 编译时安全检查
}
```

### 必考问题三：何时使用 Clone？

**答案要点**：
1. 需要数据的独立副本时
2. 跨线程传递数据时
3. 必须保留原数据的所有权时
4. 注意 Clone 可能很昂贵，应谨慎使用

### 必考问题四：为什么 String 不能 Copy？

```rust
// 回答示例
fn why_string_not_copy() {
    // String 在堆上分配内存
    // 如果 String 是 Copy：
    // 1. 赋值会创建浅拷贝（只复制指针）
    // 2. 两个变量指向同一块堆内存
    // 3. 两个变量离开作用域时，同一内存被释放两次 → double free！

    // Rust 的解决方案：
    // - String 不实现 Copy，赋值时发生移动
    // - 需要复制时，显式调用 clone()
    // - clone() 会分配新的堆内存，复制数据
}
```

### 必考问题五：编写代码题

```rust
// 题目：实现一个函数，接受一个 Vec<String>，
// 返回最长字符串的长度，但保持原 Vec 可用

// 方案1：使用借用
fn longest_length(strings: &[String]) -> usize {
    strings.iter().map(|s| s.len()).max().unwrap_or(0)
}

// 方案2：如果需要返回字符串本身
fn longest_string(strings: &[String]) -> Option<&String> {
    strings.iter().max_by_key(|s| s.len())
}

fn main() {
    let strings = vec![
        String::from("short"),
        String::from("medium length"),
        String::from("the longest string here"),
    ];

    let len = longest_length(&strings);
    println!("Longest length: {}", len);

    // strings 仍然可用
    println!("Original vec: {:?}", strings);

    if let Some(s) = longest_string(&strings) {
        println!("Longest string: {}", s);
    }
}
```

## 延伸阅读

### 官方资源

- [The Rust Programming Language - Ownership](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html)
- [Rust Reference - Memory Model](https://doc.rust-lang.org/reference/memory-model.html)
- [Rustonomicon - Ownership and Lifetimes](https://doc.rust-lang.org/nomicon/ownership.html)

### 深入理解

- [Learning Rust With Entirely Too Many Linked Lists](https://rust-unofficial.github.io/too-many-lists/) - 通过实现链表深入理解所有权
- [Rust Design Patterns](https://rust-unofficial.github.io/patterns/) - 所有权相关的设计模式

### 相关主题

- 借用与引用：所有权的补充机制
- 生命周期：引用的有效期
- 智能指针：`Box`, `Rc`, `Arc` 等
- 内部可变性：`Cell`, `RefCell`, `Mutex`

### 工具与诊断

- `rustc --explain E0382`：解释"use of moved value"错误
- `cargo clippy`：静态分析工具，可以发现所有权相关的问题
- Miri：Rust 的中间表示解释器，可以检测未定义行为

---

掌握所有权规则是成为 Rust 开发者的第一步。虽然初学时可能会遇到编译器的"抱怨"，但这些错误正是 Rust 保护你免受内存安全问题的方式。随着实践的深入，所有权规则会变得自然而然，你会发现这些约束实际上帮助你写出更好、更安全的代码。
