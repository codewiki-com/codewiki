---
title: Rust 借用规则
description: 深入理解 Rust 借用规则，包括不可变借用、可变借用、借用检查器与非词法生命周期（NLL）
track: rust
section: basics
difficulty: intermediate
tags:
  - Rust
  - 借用
  - 引用
  - NLL
  - 借用检查器
  - 内存安全
status: imported
origin: old/src/content/docs/rust/borrowing-rules.zh.md
divergence: 0.204
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Rust
  subcategory: 核心概念
  order: 2
  lastUpdated: 2026-01-07
---

借用（Borrowing）是 Rust 所有权系统的核心机制之一。它允许你在不转移所有权的情况下访问数据，同时在编译时确保内存安全。本文将深入探讨 Rust 的借用规则、借用检查器的工作原理，以及非词法生命周期（NLL）如何让借用检查更加智能。

---

## 概念解释

### 什么是借用

借用是通过引用访问数据而不获取其所有权的方式。在 Rust 中，创建一个指向值的引用称为"借用"该值。借用就像是临时"借用"别人的书来阅读，你可以查看内容，但书仍然属于原来的主人。

```rust
fn main() {
    let s = String::from("hello");

    // 借用 s，而不是获取所有权
    let len = calculate_length(&s);

    // s 仍然有效，因为我们只是借用了它
    println!("'{}' 的长度是 {}", s, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}  // s 离开作用域，但它不拥有引用的值，所以什么也不会发生
```

### 借用的历史背景

在传统的系统编程语言（如 C 和 C++）中，指针可以自由地指向任何内存位置，这导致了许多内存安全问题：

- **悬垂指针**：指向已被释放的内存
- **数据竞争**：多个指针同时读写同一内存
- **迭代器失效**：在遍历集合时修改集合

Rust 的借用系统通过编译时检查解决了这些问题，无需运行时开销。

### 借用解决的问题

1. **内存安全**：防止访问无效内存
2. **数据竞争预防**：在编译时消除数据竞争
3. **无需垃圾回收**：确定性的内存管理
4. **零成本抽象**：所有检查在编译时完成

---

## 核心原理

### 引用的本质

引用在底层就是一个指针，但 Rust 编译器会追踪引用的有效性：

```rust
fn main() {
    let x = 5;
    let r = &x;  // r 是指向 x 的引用（在底层是一个指针）

    println!("x = {}, r = {}", x, r);
    println!("r 指向的地址: {:p}", r);
}
```

### 借用检查器（Borrow Checker）

借用检查器是 Rust 编译器的核心组件，它在编译时验证所有借用是否遵守规则。

```rust
fn main() {
    let mut data = vec![1, 2, 3];

    // 借用检查器追踪这个可变借用
    let r = &mut data;

    // 借用检查器确保在 r 有效期间，不会有其他引用
    r.push(4);

    println!("{:?}", r);
}  // r 的生命周期结束
```

### 借用检查器的工作流程

1. **生命周期推断**：确定每个引用的有效范围
2. **借用规则验证**：检查是否违反借用规则
3. **生命周期检查**：确保引用不会比其引用的数据存活更久

```rust
fn main() {
    let r;                      // 声明 r
    {
        let x = 5;              // x 的生命周期开始
        r = &x;                 // r 借用 x
    }                           // x 的生命周期结束

    // println!("{}", r);       // 错误！r 是悬垂引用
    // 借用检查器阻止了这段代码编译
}
```

---

## 核心要点

### 借用的两种形式

Rust 提供两种引用类型：

| 引用类型 | 语法 | 可读 | 可写 | 数量限制 |
|----------|------|------|------|----------|
| 不可变引用 | `&T` | 是 | 否 | 无限制 |
| 可变引用 | `&mut T` | 是 | 是 | 同时只能有一个 |

### 两条核心借用规则

Rust 的借用规则可以总结为两条：

**规则一：在任意给定时间，要么只能有一个可变引用，要么只能有多个不可变引用（但不能同时存在）**

```rust
fn main() {
    let mut s = String::from("hello");

    // 正确：多个不可变引用
    let r1 = &s;
    let r2 = &s;
    println!("{} and {}", r1, r2);

    // 正确：一个可变引用（在 r1, r2 不再使用后）
    let r3 = &mut s;
    r3.push_str(", world");
    println!("{}", r3);
}
```

**规则二：引用必须总是有效的**

```rust
// 错误示例：尝试返回悬垂引用
// fn dangle() -> &String {
//     let s = String::from("hello");
//     &s  // 错误！s 在函数结束时被释放
// }

// 正确：返回所有权
fn no_dangle() -> String {
    let s = String::from("hello");
    s  // 所有权被转移给调用者
}
```

### 借用规则的目的

这些规则在编译时防止：

1. **数据竞争**：不可能同时有可变和不可变访问
2. **迭代器失效**：不可能在遍历时修改集合
3. **悬垂引用**：引用不可能比数据存活更久

---

## 代码示例

### 不可变借用（共享引用）

不可变借用允许多个读取者同时访问数据：

```rust
fn main() {
    let message = String::from("Rust 是安全的！");

    // 可以同时创建多个不可变引用
    let r1 = &message;
    let r2 = &message;
    let r3 = &message;

    // 所有引用都可以读取数据
    println!("r1: {}", r1);
    println!("r2: {}", r2);
    println!("r3: {}", r3);

    // 原始变量也仍然可用
    println!("message: {}", message);
}
```

### 可变借用（独占引用）

可变借用允许修改数据，但要求独占访问：

```rust
fn main() {
    let mut numbers = vec![1, 2, 3];

    // 创建可变引用
    let r = &mut numbers;

    // 可以通过可变引用修改数据
    r.push(4);
    r.push(5);

    println!("numbers: {:?}", r);
}
```

### 可变引用的独占性

```rust
fn main() {
    let mut s = String::from("hello");

    // 错误示例：同时存在多个可变引用
    // let r1 = &mut s;
    // let r2 = &mut s;  // 错误！不能同时借用 s 两次作为可变引用

    // 正确：可变引用在不同作用域
    {
        let r1 = &mut s;
        r1.push_str(" world");
    }  // r1 的生命周期结束

    {
        let r2 = &mut s;
        r2.push_str("!");
    }

    println!("{}", s);  // "hello world!"
}
```

### 不可变引用与可变引用互斥

```rust
fn main() {
    let mut s = String::from("hello");

    // 创建不可变引用
    let r1 = &s;
    let r2 = &s;

    // 错误：不能在有不可变引用时创建可变引用
    // let r3 = &mut s;  // 错误！不能借用 s 作为可变引用，因为它已经被借用为不可变引用

    // 使用不可变引用
    println!("{} and {}", r1, r2);
    // r1 和 r2 的生命周期在这里结束

    // 现在可以创建可变引用了
    let r3 = &mut s;
    r3.push_str(" world");
    println!("{}", r3);
}
```

### 引用作为函数参数

```rust
// 不可变借用作为参数
fn print_length(s: &String) {
    println!("字符串 '{}' 的长度是 {}", s, s.len());
}

// 可变借用作为参数
fn append_world(s: &mut String) {
    s.push_str(" world");
}

fn main() {
    let mut greeting = String::from("hello");

    // 传递不可变引用
    print_length(&greeting);

    // 传递可变引用
    append_world(&mut greeting);

    print_length(&greeting);
}
```

### 切片借用

切片是对连续序列部分元素的引用：

```rust
fn main() {
    let s = String::from("hello world");

    // 字符串切片是对字符串部分内容的借用
    let hello = &s[0..5];
    let world = &s[6..11];

    println!("{} {}", hello, world);

    // 数组切片
    let numbers = [1, 2, 3, 4, 5];
    let slice = &numbers[1..4];

    println!("切片: {:?}", slice);  // [2, 3, 4]
}

// 返回字符串切片的函数
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

### 结构体中的引用

结构体可以包含引用，但需要生命周期标注：

```rust
// 包含引用的结构体需要生命周期参数
struct Excerpt<'a> {
    part: &'a str,
}

impl<'a> Excerpt<'a> {
    fn new(text: &'a str) -> Self {
        Excerpt { part: text }
    }

    fn get_part(&self) -> &str {
        self.part
    }
}

fn main() {
    let novel = String::from("很久很久以前。在一个遥远的地方...");
    let first_sentence = novel.split('。').next().unwrap();

    let excerpt = Excerpt::new(first_sentence);

    println!("摘录: {}", excerpt.get_part());
}
```

---

## 非词法生命周期（NLL）

### 什么是 NLL

非词法生命周期（Non-Lexical Lifetimes，NLL）是 Rust 2018 edition 引入的借用检查器改进。在 NLL 之前，引用的生命周期延续到整个词法作用域（花括号）结束；有了 NLL 后，引用的生命周期在最后一次使用后就结束了。

### NLL 之前 vs 之后

```rust
fn main() {
    let mut data = vec![1, 2, 3];

    let first = &data[0];
    println!("第一个元素: {}", first);
    // 在 NLL 之前，first 的生命周期会延续到作用域结束
    // 在 NLL 之后，first 的生命周期在这里（最后一次使用后）就结束了

    // 这在 NLL 之前会报错，但现在可以正常工作
    data.push(4);

    println!("data: {:?}", data);
}
```

### NLL 的工作原理

NLL 通过控制流分析来确定引用的实际使用范围：

```rust
fn main() {
    let mut x = 5;

    let r = &x;
    println!("r = {}", r);
    // r 的生命周期在这里结束（NLL）

    // 现在可以创建可变引用
    let r_mut = &mut x;
    *r_mut += 1;
    println!("x = {}", x);
}
```

### 复杂控制流中的 NLL

```rust
fn main() {
    let mut data = vec![1, 2, 3, 4, 5];

    // NLL 可以处理条件分支中的借用
    let result = if data.len() > 3 {
        let slice = &data[..3];  // 不可变借用
        slice.iter().sum::<i32>()
        // slice 的生命周期在这里结束
    } else {
        0
    };

    // 可变借用在条件块之后
    data.push(6);

    println!("结果: {}, 数据: {:?}", result, data);
}
```

### NLL 与循环

```rust
fn main() {
    let mut items = vec![1, 2, 3, 4, 5];

    // NLL 允许在循环中正确处理借用
    loop {
        let last = items.last();  // 不可变借用
        match last {
            Some(&x) if x > 3 => {
                println!("移除 {}", x);
                // last 的生命周期在 match 之后结束
                items.pop();  // 可变操作
            }
            _ => break,
        }
    }

    println!("最终: {:?}", items);
}
```

### NLL 的限制

虽然 NLL 让借用检查更智能，但它仍有一些限制：

```rust
// 这种模式仍然需要重构
fn main() {
    let mut map = std::collections::HashMap::new();
    map.insert("key", 1);

    // 这在某些复杂情况下仍然可能失败
    // 因为 get 返回的引用与 map 关联
    match map.get("key") {
        Some(_value) => {
            // 某些操作可能仍需要重构
        }
        None => {
            map.insert("key", 2);
        }
    }
}
```

### Polonius：下一代借用检查器

Polonius 是正在开发中的下一代借用检查器，它将提供更精确的借用分析：

```rust
// Polonius 将能处理更多复杂情况
fn get_or_insert<'a>(map: &'a mut std::collections::HashMap<String, String>, key: &str) -> &'a String {
    // 未来 Polonius 将能更好地处理这种模式
    if !map.contains_key(key) {
        map.insert(key.to_string(), String::from("default"));
    }
    map.get(key).unwrap()
}
```

---

## 最佳实践

### 优先使用不可变借用

```rust
// 推荐：默认使用不可变借用
fn process_data(data: &Vec<i32>) -> i32 {
    data.iter().sum()
}

// 只在需要修改时使用可变借用
fn add_element(data: &mut Vec<i32>, elem: i32) {
    data.push(elem);
}

fn main() {
    let mut numbers = vec![1, 2, 3];

    let sum = process_data(&numbers);
    println!("总和: {}", sum);

    add_element(&mut numbers, 4);
    println!("添加后: {:?}", numbers);
}
```

### 最小化借用范围

```rust
fn main() {
    let mut data = vec![1, 2, 3];

    // 不推荐：借用范围过大
    // let r = &data;
    // // ... 很多代码 ...
    // println!("{:?}", r);
    // // ... 更多代码，无法修改 data ...

    // 推荐：尽早结束借用
    {
        let r = &data;
        println!("{:?}", r);
    }
    // 现在可以自由修改 data
    data.push(4);
}
```

### 使用切片而非完整集合的引用

```rust
// 不推荐：接受 &Vec<T>
fn sum_vec(v: &Vec<i32>) -> i32 {
    v.iter().sum()
}

// 推荐：接受切片 &[T]，更通用
fn sum_slice(s: &[i32]) -> i32 {
    s.iter().sum()
}

fn main() {
    let vec = vec![1, 2, 3, 4, 5];
    let array = [1, 2, 3, 4, 5];

    // 切片版本可以接受 Vec、数组和切片
    println!("Vec 之和: {}", sum_slice(&vec));
    println!("数组之和: {}", sum_slice(&array));
    println!("部分和: {}", sum_slice(&vec[1..4]));
}
```

### 使用 &str 而非 &String

```rust
// 不推荐：只接受 String 的引用
fn greet_string(name: &String) {
    println!("Hello, {}!", name);
}

// 推荐：接受 &str，更通用
fn greet(name: &str) {
    println!("Hello, {}!", name);
}

fn main() {
    let string = String::from("World");
    let str_literal = "Rust";

    greet(&string);      // String 自动解引用为 &str
    greet(str_literal);  // 字符串字面量本身就是 &str
}
```

### 利用 NLL 简化代码

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert("Alice", 100);
    scores.insert("Bob", 85);

    // 利用 NLL，不需要额外的作用域
    let alice_score = scores.get("Alice").copied().unwrap_or(0);
    println!("Alice 的分数: {}", alice_score);
    // get 返回的引用在这里结束

    // 可以直接进行可变操作
    scores.insert("Charlie", 90);

    println!("所有分数: {:?}", scores);
}
```

### 避免不必要的克隆

```rust
fn main() {
    let data = vec![1, 2, 3, 4, 5];

    // 不推荐：不必要的克隆
    // let cloned = data.clone();
    // process(&cloned);

    // 推荐：直接借用
    fn process(data: &[i32]) {
        println!("处理: {:?}", data);
    }

    process(&data);
    // data 仍然可用
    println!("原数据: {:?}", data);
}
```

---

## 常见陷阱

### 陷阱 1：在循环中借用

```rust
fn main() {
    let mut vec = vec![1, 2, 3, 4, 5];

    // 错误：在迭代时尝试修改
    // for item in &vec {
    //     if *item > 3 {
    //         vec.push(*item * 2);  // 错误！不能在迭代时修改
    //     }
    // }

    // 解决方案 1：收集需要添加的元素
    let to_add: Vec<i32> = vec.iter()
        .filter(|&&x| x > 3)
        .map(|&x| x * 2)
        .collect();
    vec.extend(to_add);

    println!("{:?}", vec);

    // 解决方案 2：使用索引迭代
    let mut vec2 = vec![1, 2, 3, 4, 5];
    let len = vec2.len();
    for i in 0..len {
        if vec2[i] > 3 {
            let new_val = vec2[i] * 2;
            vec2.push(new_val);
        }
    }

    println!("{:?}", vec2);
}
```

### 陷阱 2：方法链中的借用冲突

```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert("a", 1);
    map.insert("b", 2);

    // 错误：在方法链中借用冲突
    // map.entry("a").or_insert(map.len());  // 错误！

    // 解决方案：分开操作
    let len = map.len();
    map.entry("c").or_insert(len);

    println!("{:?}", map);
}
```

### 陷阱 3：结构体方法中的借用冲突

```rust
struct Data {
    value: i32,
    cache: Option<i32>,
}

impl Data {
    // 错误的设计
    // fn get_cached(&mut self) -> i32 {
    //     if self.cache.is_none() {
    //         self.cache = Some(self.compute());  // 可能的借用冲突
    //     }
    //     self.cache.unwrap()
    // }

    fn compute(&self) -> i32 {
        self.value * 2
    }

    // 正确的设计
    fn get_cached(&mut self) -> i32 {
        if let Some(cached) = self.cache {
            return cached;
        }
        let computed = self.value * 2;  // 先计算
        self.cache = Some(computed);
        computed
    }
}

fn main() {
    let mut data = Data { value: 21, cache: None };
    println!("缓存值: {}", data.get_cached());
    println!("再次获取: {}", data.get_cached());
}
```

### 陷阱 4：闭包中的借用

```rust
fn main() {
    let mut data = vec![1, 2, 3];

    // 错误：闭包捕获可变引用后，外部无法再访问
    // let closure = || data.push(4);
    // println!("{:?}", data);  // 错误！
    // closure();

    // 解决方案 1：立即执行
    (|| data.push(4))();
    println!("{:?}", data);

    // 解决方案 2：使用 RefCell（如果需要共享可变性）
    use std::cell::RefCell;
    let data = RefCell::new(vec![1, 2, 3]);
    let closure = || data.borrow_mut().push(4);
    println!("{:?}", data.borrow());
    closure();
    println!("{:?}", data.borrow());
}
```

### 陷阱 5：返回局部变量的引用

```rust
// 错误：返回局部变量的引用
// fn create_string() -> &str {
//     let s = String::from("hello");
//     &s  // 错误！s 在函数结束时被释放
// }

// 解决方案 1：返回拥有所有权的值
fn create_string() -> String {
    String::from("hello")
}

// 解决方案 2：返回静态字符串
fn get_greeting() -> &'static str {
    "hello"
}

// 解决方案 3：借用输入参数
fn get_first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}

fn main() {
    println!("{}", create_string());
    println!("{}", get_greeting());
    println!("{}", get_first_word("hello world"));
}
```

### 陷阱 6：可变借用与不可变借用的重叠

```rust
fn main() {
    let mut s = String::from("hello");

    // 错误模式：尝试同时持有两种借用
    // let r1 = &s;
    // let r2 = &mut s;  // 错误！
    // println!("{}, {}", r1, r2);

    // 正确模式：确保生命周期不重叠
    {
        let r1 = &s;
        let r2 = &s;
        println!("不可变借用: {}, {}", r1, r2);
    }  // 不可变借用结束

    {
        let r3 = &mut s;
        r3.push_str(" world");
        println!("可变借用: {}", r3);
    }  // 可变借用结束

    println!("最终: {}", s);
}
```

---

## 性能考量

### 借用是零成本抽象

引用在编译后就是普通指针，没有运行时开销：

```rust
use std::mem::size_of;

fn main() {
    println!("引用的大小:");
    println!("  &i32:     {} 字节", size_of::<&i32>());      // 8（64位系统）
    println!("  &mut i32: {} 字节", size_of::<&mut i32>());  // 8
    println!("  &str:     {} 字节", size_of::<&str>());      // 16（指针+长度）
    println!("  &[i32]:   {} 字节", size_of::<&[i32]>());    // 16（指针+长度）
}
```

### 借用 vs 克隆

借用比克隆更高效，因为它不复制数据：

```rust
use std::time::Instant;

fn process_by_borrow(data: &[i32]) -> i32 {
    data.iter().sum()
}

fn process_by_value(data: Vec<i32>) -> i32 {
    data.iter().sum()
}

fn main() {
    let data: Vec<i32> = (0..1_000_000).collect();

    // 借用方式
    let start = Instant::now();
    for _ in 0..100 {
        let _ = process_by_borrow(&data);
    }
    println!("借用耗时: {:?}", start.elapsed());

    // 克隆方式
    let start = Instant::now();
    for _ in 0..100 {
        let _ = process_by_value(data.clone());
    }
    println!("克隆耗时: {:?}", start.elapsed());
}
```

### 缓存行友好的借用

连续内存访问更高效：

```rust
fn main() {
    let data: Vec<i32> = (0..1000).collect();

    // 高效：顺序访问（缓存友好）
    let sum1: i32 = data.iter().sum();

    // 相对低效：随机访问
    use std::collections::HashMap;
    let map: HashMap<usize, i32> = data.iter()
        .enumerate()
        .map(|(i, &v)| (i, v))
        .collect();

    let sum2: i32 = (0..1000).map(|i| map.get(&i).unwrap()).sum();

    assert_eq!(sum1, sum2);
}
```

### 内联与借用

小函数中的借用通常会被内联优化：

```rust
// 这个函数可能被内联
#[inline]
fn get_first(slice: &[i32]) -> Option<&i32> {
    slice.first()
}

fn main() {
    let data = vec![1, 2, 3];

    // 由于内联，这可能编译为直接访问
    if let Some(first) = get_first(&data) {
        println!("第一个元素: {}", first);
    }
}
```

---

## 实战场景

### 场景 1：实现字符串解析器

```rust
struct Parser<'a> {
    input: &'a str,
    position: usize,
}

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Self {
        Parser { input, position: 0 }
    }

    fn remaining(&self) -> &str {
        &self.input[self.position..]
    }

    fn peek(&self) -> Option<char> {
        self.remaining().chars().next()
    }

    fn advance(&mut self) -> Option<char> {
        let ch = self.peek()?;
        self.position += ch.len_utf8();
        Some(ch)
    }

    fn parse_word(&mut self) -> &'a str {
        let start = self.position;
        while let Some(ch) = self.peek() {
            if ch.is_alphabetic() {
                self.advance();
            } else {
                break;
            }
        }
        &self.input[start..self.position]
    }

    fn skip_whitespace(&mut self) {
        while let Some(ch) = self.peek() {
            if ch.is_whitespace() {
                self.advance();
            } else {
                break;
            }
        }
    }

    fn parse_words(&mut self) -> Vec<&'a str> {
        let mut words = Vec::new();
        loop {
            self.skip_whitespace();
            if self.remaining().is_empty() {
                break;
            }
            let word = self.parse_word();
            if !word.is_empty() {
                words.push(word);
            } else {
                self.advance();  // 跳过非字母字符
            }
        }
        words
    }
}

fn main() {
    let text = "Hello, World! Rust 是很棒的编程语言。";
    let mut parser = Parser::new(text);
    let words = parser.parse_words();

    println!("解析出的单词: {:?}", words);
}
```

### 场景 2：实现链表迭代器

```rust
#[derive(Debug)]
struct Node<T> {
    value: T,
    next: Option<Box<Node<T>>>,
}

struct LinkedList<T> {
    head: Option<Box<Node<T>>>,
}

impl<T> LinkedList<T> {
    fn new() -> Self {
        LinkedList { head: None }
    }

    fn push_front(&mut self, value: T) {
        let new_node = Box::new(Node {
            value,
            next: self.head.take(),
        });
        self.head = Some(new_node);
    }

    fn iter(&self) -> Iter<T> {
        Iter {
            next: self.head.as_deref(),
        }
    }

    fn iter_mut(&mut self) -> IterMut<T> {
        IterMut {
            next: self.head.as_deref_mut(),
        }
    }
}

// 不可变迭代器
struct Iter<'a, T> {
    next: Option<&'a Node<T>>,
}

impl<'a, T> Iterator for Iter<'a, T> {
    type Item = &'a T;

    fn next(&mut self) -> Option<Self::Item> {
        self.next.map(|node| {
            self.next = node.next.as_deref();
            &node.value
        })
    }
}

// 可变迭代器
struct IterMut<'a, T> {
    next: Option<&'a mut Node<T>>,
}

impl<'a, T> Iterator for IterMut<'a, T> {
    type Item = &'a mut T;

    fn next(&mut self) -> Option<Self::Item> {
        self.next.take().map(|node| {
            self.next = node.next.as_deref_mut();
            &mut node.value
        })
    }
}

fn main() {
    let mut list = LinkedList::new();
    list.push_front(3);
    list.push_front(2);
    list.push_front(1);

    // 不可变迭代
    println!("链表内容:");
    for value in list.iter() {
        println!("  {}", value);
    }

    // 可变迭代
    for value in list.iter_mut() {
        *value *= 2;
    }

    println!("修改后:");
    for value in list.iter() {
        println!("  {}", value);
    }
}
```

### 场景 3：实现简单的 JSON 解析器

```rust
#[derive(Debug, Clone)]
enum JsonValue<'a> {
    Null,
    Bool(bool),
    Number(f64),
    String(&'a str),
    Array(Vec<JsonValue<'a>>),
    Object(Vec<(&'a str, JsonValue<'a>)>),
}

struct JsonParser<'a> {
    input: &'a str,
    pos: usize,
}

impl<'a> JsonParser<'a> {
    fn new(input: &'a str) -> Self {
        JsonParser { input, pos: 0 }
    }

    fn skip_whitespace(&mut self) {
        while self.pos < self.input.len() {
            let ch = self.input[self.pos..].chars().next().unwrap();
            if ch.is_whitespace() {
                self.pos += ch.len_utf8();
            } else {
                break;
            }
        }
    }

    fn peek(&self) -> Option<char> {
        self.input[self.pos..].chars().next()
    }

    fn consume(&mut self, expected: char) -> bool {
        self.skip_whitespace();
        if self.peek() == Some(expected) {
            self.pos += expected.len_utf8();
            true
        } else {
            false
        }
    }

    fn parse_string(&mut self) -> Option<&'a str> {
        self.skip_whitespace();
        if !self.consume('"') {
            return None;
        }

        let start = self.pos;
        while let Some(ch) = self.peek() {
            if ch == '"' {
                let s = &self.input[start..self.pos];
                self.pos += 1;
                return Some(s);
            }
            self.pos += ch.len_utf8();
        }
        None
    }

    fn parse_number(&mut self) -> Option<f64> {
        self.skip_whitespace();
        let start = self.pos;

        while let Some(ch) = self.peek() {
            if ch.is_numeric() || ch == '.' || ch == '-' || ch == '+' || ch == 'e' || ch == 'E' {
                self.pos += 1;
            } else {
                break;
            }
        }

        self.input[start..self.pos].parse().ok()
    }

    fn parse_value(&mut self) -> Option<JsonValue<'a>> {
        self.skip_whitespace();

        match self.peek()? {
            '"' => self.parse_string().map(JsonValue::String),
            '0'..='9' | '-' => self.parse_number().map(JsonValue::Number),
            't' | 'f' => {
                if self.input[self.pos..].starts_with("true") {
                    self.pos += 4;
                    Some(JsonValue::Bool(true))
                } else if self.input[self.pos..].starts_with("false") {
                    self.pos += 5;
                    Some(JsonValue::Bool(false))
                } else {
                    None
                }
            }
            'n' => {
                if self.input[self.pos..].starts_with("null") {
                    self.pos += 4;
                    Some(JsonValue::Null)
                } else {
                    None
                }
            }
            '[' => self.parse_array(),
            '{' => self.parse_object(),
            _ => None,
        }
    }

    fn parse_array(&mut self) -> Option<JsonValue<'a>> {
        if !self.consume('[') {
            return None;
        }

        let mut arr = Vec::new();

        self.skip_whitespace();
        if self.consume(']') {
            return Some(JsonValue::Array(arr));
        }

        loop {
            arr.push(self.parse_value()?);
            self.skip_whitespace();
            if self.consume(']') {
                break;
            }
            if !self.consume(',') {
                return None;
            }
        }

        Some(JsonValue::Array(arr))
    }

    fn parse_object(&mut self) -> Option<JsonValue<'a>> {
        if !self.consume('{') {
            return None;
        }

        let mut obj = Vec::new();

        self.skip_whitespace();
        if self.consume('}') {
            return Some(JsonValue::Object(obj));
        }

        loop {
            let key = self.parse_string()?;
            self.skip_whitespace();
            if !self.consume(':') {
                return None;
            }
            let value = self.parse_value()?;
            obj.push((key, value));

            self.skip_whitespace();
            if self.consume('}') {
                break;
            }
            if !self.consume(',') {
                return None;
            }
        }

        Some(JsonValue::Object(obj))
    }
}

fn main() {
    let json = r#"{
        "name": "Rust",
        "version": 1.75,
        "is_awesome": true,
        "features": ["safe", "fast", "concurrent"]
    }"#;

    let mut parser = JsonParser::new(json);
    if let Some(value) = parser.parse_value() {
        println!("解析结果: {:#?}", value);
    }
}
```

### 场景 4：实现缓冲读取器

```rust
use std::io::{self, Read, BufRead};

struct BufReader<R> {
    inner: R,
    buffer: Vec<u8>,
    pos: usize,
    cap: usize,
}

impl<R: Read> BufReader<R> {
    fn new(inner: R) -> Self {
        BufReader::with_capacity(8192, inner)
    }

    fn with_capacity(capacity: usize, inner: R) -> Self {
        BufReader {
            inner,
            buffer: vec![0; capacity],
            pos: 0,
            cap: 0,
        }
    }

    fn fill_buf_internal(&mut self) -> io::Result<&[u8]> {
        if self.pos >= self.cap {
            self.cap = self.inner.read(&mut self.buffer)?;
            self.pos = 0;
        }
        Ok(&self.buffer[self.pos..self.cap])
    }
}

impl<R: Read> Read for BufReader<R> {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let available = self.fill_buf_internal()?;
        let amt = std::cmp::min(available.len(), buf.len());
        buf[..amt].copy_from_slice(&available[..amt]);
        self.pos += amt;
        Ok(amt)
    }
}

impl<R: Read> BufRead for BufReader<R> {
    fn fill_buf(&mut self) -> io::Result<&[u8]> {
        self.fill_buf_internal()
    }

    fn consume(&mut self, amt: usize) {
        self.pos = std::cmp::min(self.pos + amt, self.cap);
    }
}

fn main() {
    let data = b"Hello, World!\nThis is a test.\nLine 3.";
    let mut reader = BufReader::new(&data[..]);

    let mut line = String::new();
    while reader.read_line(&mut line).unwrap() > 0 {
        print!("读取: {}", line);
        line.clear();
    }
}
```

---

## 面试要点

### 问题 1：解释 Rust 中的借用规则

**答案要点：**
- 在任意时刻，要么只能有一个可变引用，要么只能有多个不可变引用
- 引用必须始终有效（不能有悬垂引用）
- 这些规则在编译时检查，防止数据竞争和内存错误

### 问题 2：什么是 NLL（非词法生命周期）？

**答案要点：**
- NLL 是 Rust 2018 引入的借用检查器改进
- 引用的生命周期在最后一次使用后结束，而非词法作用域结束
- 使借用检查更精确，减少不必要的编译错误
- 通过控制流分析实现

### 问题 3：可变引用和不可变引用的区别？

**答案要点：**

| 特性 | 不可变引用 `&T` | 可变引用 `&mut T` |
|------|----------------|------------------|
| 读取 | 可以 | 可以 |
| 修改 | 不可以 | 可以 |
| 同时数量 | 无限制 | 最多一个 |
| 别名 | Send | 独占访问 |

### 问题 4：如何解决借用冲突？

**答案要点：**
1. **缩小借用范围**：使用花括号限制借用的作用域
2. **重新排序操作**：先完成读取，再进行修改
3. **使用克隆**：在必要时克隆数据（性能代价）
4. **使用内部可变性**：`RefCell`、`Cell` 等
5. **重构代码结构**：改变数据组织方式

### 问题 5：什么情况下会出现悬垂引用？

**答案要点：**
- 返回局部变量的引用
- 引用比其引用的数据存活更久
- Rust 编译器会在编译时阻止悬垂引用

```rust
// 编译器会阻止这种代码
// fn dangling() -> &String {
//     let s = String::from("hello");
//     &s  // 错误：s 即将被释放
// }
```

### 问题 6：解释切片与借用的关系

**答案要点：**
- 切片是对连续序列一部分的借用
- 字符串切片 `&str` 是对字符串数据的不可变借用
- 切片包含指针和长度，是"胖指针"
- 切片借用原始数据，不拥有数据

### 问题 7：为什么 Rust 不允许同时有可变和不可变引用？

**答案要点：**
- 防止数据竞争（读写冲突）
- 确保不可变引用读取的数据不会被意外修改
- 允许编译器进行更激进的优化
- 这是 Rust 内存安全保证的核心

---

## 延伸阅读

### 官方文档

- [The Rust Programming Language - 引用与借用](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)
- [Rust Reference - 借用](https://doc.rust-lang.org/reference/expressions/operator-expr.html#borrow-operators)
- [RFC 2094 - Non-Lexical Lifetimes](https://rust-lang.github.io/rfcs/2094-nll.html)

### 经典文章

- [Rust Blog - NLL 介绍](https://blog.rust-lang.org/2018/12/06/Rust-1.31-and-rust-2018.html)
- [Polonius - 下一代借用检查器](https://rust-lang.github.io/polonius/)

### 推荐书籍

- 《Rust 程序设计语言》（官方书籍）第 4 章
- 《Rust 编程之道》内存管理章节
- 《Programming Rust》第 5 章

### 实践项目

- 实现一个简单的解析器，练习生命周期标注
- 实现自定义迭代器，理解引用生命周期
- 阅读标准库 `std::slice` 和 `std::str` 的源码
