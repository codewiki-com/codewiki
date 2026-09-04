---
title: Rust 模式匹配
description: 全面掌握 Rust 模式匹配，包括 match、if let、模式语法和解构
track: rust
section: ownership-borrowing
difficulty: intermediate
tags:
  - Rust
  - 模式匹配
  - match
  - 解构
status: imported
origin: old/src/content/docs/rust/pattern-matching.zh.md
divergence: 0.2
issues: []
legacy:
  category: Rust
  subcategory: 核心概念
  order: 16
  lastUpdated: 2026-01-07
---

模式匹配是 Rust 中最强大和最具表现力的特性之一。它允许你根据数据的结构和值来控制程序流程,同时提供编译时的穷尽性检查,确保处理所有可能的情况。

## match 表达式

`match` 是 Rust 中最基本也是最强大的模式匹配工具。它将一个值与一系列模式进行比较,并执行匹配模式对应的代码。

### 基本语法

```rust
fn main() {
    let number = 3;

    match number {
        1 => println!("一"),
        2 => println!("二"),
        3 => println!("三"),
        _ => println!("其他数字"),
    }
}
```

### match 表达式的特性

`match` 表达式有几个重要特性:

1. **穷尽性**: 必须覆盖所有可能的情况
2. **表达式**: `match` 是表达式,可以返回值
3. **从上到下匹配**: 按顺序检查模式,执行第一个匹配的分支

```rust
fn main() {
    let number = 7;

    // match 作为表达式返回值
    let description = match number {
        1 => "一",
        2 => "二",
        3..=5 => "三到五之间",
        6 | 7 => "六或七",
        _ => "其他数字",
    };

    println!("数字描述: {}", description);
}
```

### 匹配枚举

`match` 与枚举类型配合使用特别强大:

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn process_message(msg: Message) {
    match msg {
        Message::Quit => {
            println!("收到退出消息");
        }
        Message::Move { x, y } => {
            println!("移动到坐标 ({}, {})", x, y);
        }
        Message::Write(text) => {
            println!("文本消息: {}", text);
        }
        Message::ChangeColor(r, g, b) => {
            println!("改变颜色为 RGB({}, {}, {})", r, g, b);
        }
    }
}

fn main() {
    process_message(Message::Move { x: 10, y: 20 });
    process_message(Message::Write(String::from("你好")));
    process_message(Message::ChangeColor(255, 128, 0));
    process_message(Message::Quit);
}
```

### 匹配 Option 和 Result

`match` 是处理 `Option` 和 `Result` 类型的常用方式:

```rust
fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None
    } else {
        Some(a / b)
    }
}

fn main() {
    // 匹配 Option
    let result = divide(10.0, 2.0);
    match result {
        Some(value) => println!("结果: {}", value),
        None => println!("无法除以零"),
    }

    // 匹配 Result
    let parse_result: Result<i32, _> = "42".parse();
    match parse_result {
        Ok(num) => println!("解析成功: {}", num),
        Err(e) => println!("解析失败: {}", e),
    }
}
```

### 绑定值与 @ 模式

使用 `@` 可以在测试模式的同时绑定值到变量:

```rust
enum Message {
    Hello { id: i32 },
}

fn main() {
    let msg = Message::Hello { id: 5 };

    match msg {
        Message::Hello { id: id_variable @ 3..=7 } => {
            println!("在范围内找到 id: {}", id_variable);
        }
        Message::Hello { id: 10..=12 } => {
            println!("id 在另一个范围内");
        }
        Message::Hello { id } => {
            println!("找到其他 id: {}", id);
        }
    }
}
```

更多 `@` 绑定的示例:

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (first, .., last) => {
            println!("第一个: {}, 最后一个: {}", first, last);
        }
    }

    // 结合范围和 @ 绑定
    let age = 25;
    match age {
        n @ 0..=12 => println!("{}岁是儿童", n),
        n @ 13..=19 => println!("{}岁是青少年", n),
        n @ 20..=59 => println!("{}岁是成年人", n),
        n => println!("{}岁是老年人", n),
    }
}
```

## if let 简洁匹配

当只关心一种匹配情况时,`if let` 提供了更简洁的语法:

### 基本用法

```rust
fn main() {
    let some_value = Some(3);

    // 使用 match
    match some_value {
        Some(x) => println!("值是: {}", x),
        None => (),
    }

    // 使用 if let (更简洁)
    if let Some(x) = some_value {
        println!("值是: {}", x);
    }
}
```

### if let else

`if let` 可以搭配 `else` 处理不匹配的情况:

```rust
fn main() {
    let config_max = Some(3u8);

    if let Some(max) = config_max {
        println!("配置的最大值是 {}", max);
    } else {
        println!("没有配置最大值");
    }
}
```

### 链式 if let

可以使用 `else if let` 进行多重匹配:

```rust
enum Status {
    Active,
    Inactive,
    Pending { reason: String },
}

fn check_status(status: Status) {
    if let Status::Active = status {
        println!("状态: 活跃");
    } else if let Status::Pending { reason } = status {
        println!("状态: 待处理 - {}", reason);
    } else {
        println!("状态: 非活跃");
    }
}

fn main() {
    check_status(Status::Active);
    check_status(Status::Pending {
        reason: String::from("等待审批"),
    });
    check_status(Status::Inactive);
}
```

### if let 与布尔条件组合

```rust
fn main() {
    let favorite_color: Option<&str> = None;
    let is_tuesday = false;
    let age: Result<u8, _> = "34".parse();

    if let Some(color) = favorite_color {
        println!("使用你最喜欢的颜色 {} 作为背景", color);
    } else if is_tuesday {
        println!("星期二是绿色日!");
    } else if let Ok(age) = age {
        if age > 30 {
            println!("使用紫色作为背景色");
        } else {
            println!("使用橙色作为背景色");
        }
    } else {
        println!("使用蓝色作为背景色");
    }
}
```

## while let 条件循环

`while let` 允许在模式匹配成功时持续循环:

### 基本用法

```rust
fn main() {
    let mut stack = vec![1, 2, 3];

    // 只要 pop() 返回 Some,就继续循环
    while let Some(top) = stack.pop() {
        println!("弹出: {}", top);
    }
}
```

### 处理迭代器

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let mut iter = numbers.iter();

    while let Some(num) = iter.next() {
        println!("数字: {}", num);
    }
}
```

### 处理通道接收

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let messages = vec!["消息1", "消息2", "消息3"];
        for msg in messages {
            tx.send(msg).unwrap();
        }
    });

    // 使用 while let 接收消息直到通道关闭
    while let Ok(msg) = rx.recv() {
        println!("收到: {}", msg);
    }
}
```

### 嵌套 while let

```rust
fn main() {
    let mut matrix = vec![
        vec![1, 2, 3],
        vec![4, 5, 6],
        vec![7, 8, 9],
    ];

    while let Some(mut row) = matrix.pop() {
        print!("行: ");
        while let Some(val) = row.pop() {
            print!("{} ", val);
        }
        println!();
    }
}
```

## 模式语法详解

Rust 的模式语法丰富多样,可以匹配各种数据结构。

### 字面值匹配

```rust
fn main() {
    let x = 1;

    match x {
        1 => println!("一"),
        2 => println!("二"),
        3 => println!("三"),
        _ => println!("其他"),
    }

    // 字符串字面值
    let greeting = "你好";
    match greeting {
        "你好" => println!("中文问候"),
        "Hello" => println!("英文问候"),
        _ => println!("其他问候"),
    }
}
```

### 变量绑定

```rust
fn main() {
    let x = Some(5);

    match x {
        Some(value) => println!("值: {}", value), // value 绑定到 5
        None => println!("没有值"),
    }
}
```

### 多重模式 (|)

使用 `|` 可以匹配多个模式:

```rust
fn main() {
    let x = 1;

    match x {
        1 | 2 => println!("一或二"),
        3 | 4 | 5 => println!("三、四或五"),
        _ => println!("其他"),
    }

    // 在字符匹配中使用
    let c = 'e';
    match c {
        'a' | 'e' | 'i' | 'o' | 'u' => println!("元音字母"),
        _ => println!("辅音字母或其他"),
    }
}
```

### 范围模式 (..=)

使用 `..=` 匹配值的范围:

```rust
fn main() {
    let x = 5;

    match x {
        1..=5 => println!("一到五"),
        6..=10 => println!("六到十"),
        _ => println!("其他"),
    }

    // 字符范围
    let c = 'c';
    match c {
        'a'..='j' => println!("前十个字母"),
        'k'..='z' => println!("后十六个字母"),
        _ => println!("其他字符"),
    }
}
```

### 通配符模式

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        // 只关心第一个和最后一个
        (first, _, _, _, last) => {
            println!("第一个: {}, 最后一个: {}", first, last);
        }
    }

    // 使用 .. 忽略剩余部分
    match numbers {
        (first, .., last) => {
            println!("第一个: {}, 最后一个: {}", first, last);
        }
    }

    // 忽略中间元素
    let point = (3, 4, 5);
    match point {
        (x, ..) => println!("x 坐标: {}", x),
    }

    match point {
        (.., z) => println!("z 坐标: {}", z),
    }
}
```

### 引用模式

```rust
fn main() {
    let reference = &4;

    match reference {
        &val => println!("通过解构获得值: {}", val),
    }

    // 等价于
    match *reference {
        val => println!("解引用后的值: {}", val),
    }

    // ref 关键字创建引用
    let value = 5;
    match value {
        ref r => println!("获得引用: {:p}", r),
    }

    // ref mut 创建可变引用
    let mut mutable_value = 6;
    match mutable_value {
        ref mut m => {
            *m += 10;
            println!("修改后的值: {}", m);
        }
    }
}
```

## 解构

解构是模式匹配中提取复杂数据结构各部分的能力。

### 解构结构体

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    // 基本解构
    let Point { x, y } = p;
    println!("x: {}, y: {}", x, y);

    // 使用不同变量名
    let Point { x: a, y: b } = p;
    println!("a: {}, b: {}", a, b);

    // 部分解构
    let Point { x, .. } = p;
    println!("x: {}", x);

    // 在 match 中解构
    match p {
        Point { x: 0, y } => println!("在 y 轴上,y = {}", y),
        Point { x, y: 0 } => println!("在 x 轴上,x = {}", x),
        Point { x, y } => println!("在其他位置: ({}, {})", x, y),
    }
}
```

### 解构枚举

```rust
enum Color {
    Rgb(i32, i32, i32),
    Hsv(i32, i32, i32),
    Named(String),
}

fn main() {
    let color = Color::Rgb(128, 255, 90);

    match color {
        Color::Rgb(r, g, b) => {
            println!("RGB 颜色: 红={}, 绿={}, 蓝={}", r, g, b);
        }
        Color::Hsv(h, s, v) => {
            println!("HSV 颜色: 色相={}, 饱和度={}, 明度={}", h, s, v);
        }
        Color::Named(name) => {
            println!("命名颜色: {}", name);
        }
    }
}
```

### 解构嵌套结构

```rust
struct Point {
    x: i32,
    y: i32,
}

enum Shape {
    Circle { center: Point, radius: i32 },
    Rectangle { top_left: Point, bottom_right: Point },
}

fn main() {
    let shape = Shape::Circle {
        center: Point { x: 0, y: 0 },
        radius: 10,
    };

    // 深层解构
    match shape {
        Shape::Circle {
            center: Point { x, y },
            radius,
        } => {
            println!("圆心: ({}, {}), 半径: {}", x, y, radius);
        }
        Shape::Rectangle {
            top_left: Point { x: x1, y: y1 },
            bottom_right: Point { x: x2, y: y2 },
        } => {
            println!("矩形: ({}, {}) 到 ({}, {})", x1, y1, x2, y2);
        }
    }
}
```

### 解构元组

```rust
fn main() {
    let tuple = (1, "hello", 4.5);

    // 完全解构
    let (a, b, c) = tuple;
    println!("a: {}, b: {}, c: {}", a, b, c);

    // 部分解构
    let (first, ..) = tuple;
    println!("第一个元素: {}", first);

    let (.., last) = tuple;
    println!("最后一个元素: {}", last);

    // 嵌套元组解构
    let nested = ((1, 2), (3, 4));
    let ((a, b), (c, d)) = nested;
    println!("a: {}, b: {}, c: {}, d: {}", a, b, c, d);
}
```

### 解构数组和切片

```rust
fn main() {
    // 解构固定大小数组
    let arr = [1, 2, 3];
    let [a, b, c] = arr;
    println!("a: {}, b: {}, c: {}", a, b, c);

    // 解构切片
    let slice = &[1, 2, 3, 4, 5][..];

    match slice {
        [] => println!("空切片"),
        [single] => println!("单元素: {}", single),
        [first, second] => println!("两个元素: {}, {}", first, second),
        [first, middle @ .., last] => {
            println!("第一个: {}, 中间: {:?}, 最后: {}", first, middle, last);
        }
    }

    // 更多切片模式
    let numbers = [1, 2, 3, 4, 5];
    match &numbers[..] {
        [first, rest @ ..] => {
            println!("头部: {}, 尾部: {:?}", first, rest);
        }
        [] => println!("空数组"),
    }
}
```

### 解构函数参数

```rust
struct Point {
    x: i32,
    y: i32,
}

// 在函数参数中解构
fn print_coordinates(&(x, y): &(i32, i32)) {
    println!("坐标: ({}, {})", x, y);
}

fn print_point(Point { x, y }: Point) {
    println!("点: ({}, {})", x, y);
}

fn main() {
    let point = (3, 5);
    print_coordinates(&point);

    let p = Point { x: 10, y: 20 };
    print_point(p);
}
```

## 模式守卫 (Guards)

模式守卫是 `match` 分支后的额外 `if` 条件,提供更精细的匹配控制。

### 基本守卫

```rust
fn main() {
    let num = Some(4);

    match num {
        Some(x) if x < 5 => println!("小于5: {}", x),
        Some(x) if x >= 5 => println!("大于等于5: {}", x),
        None => println!("没有值"),
        _ => unreachable!(),
    }
}
```

### 复杂守卫条件

```rust
fn main() {
    let x = 4;
    let y = false;

    match x {
        4 | 5 | 6 if y => println!("是"),
        _ => println!("否"),
    }

    // 守卫与多重模式组合
    let pair = (2, -2);
    match pair {
        (x, y) if x == y => println!("两者相等"),
        (x, y) if x + y == 0 => println!("互为相反数"),
        (x, _) if x % 2 == 0 => println!("第一个是偶数"),
        _ => println!("没有特殊关系"),
    }
}
```

### 守卫与绑定

```rust
enum Temperature {
    Celsius(i32),
    Fahrenheit(i32),
}

fn main() {
    let temp = Temperature::Celsius(35);

    match temp {
        Temperature::Celsius(t) if t > 30 => {
            println!("{}°C - 很热!", t);
        }
        Temperature::Celsius(t) if t < 10 => {
            println!("{}°C - 很冷!", t);
        }
        Temperature::Celsius(t) => {
            println!("{}°C - 适宜温度", t);
        }
        Temperature::Fahrenheit(t) if t > 86 => {
            println!("{}°F - 很热!", t);
        }
        Temperature::Fahrenheit(t) if t < 50 => {
            println!("{}°F - 很冷!", t);
        }
        Temperature::Fahrenheit(t) => {
            println!("{}°F - 适宜温度", t);
        }
    }
}
```

### 守卫与引用

```rust
fn main() {
    let words = vec!["hello", "world", "rust"];

    for word in words.iter() {
        match word {
            w if w.len() > 4 => println!("'{}' 是长单词", w),
            w if w.starts_with('r') => println!("'{}' 以 r 开头", w),
            w => println!("'{}' 普通单词", w),
        }
    }
}
```

### 实际应用: 权限检查

```rust
enum Permission {
    Admin,
    User { level: u8 },
    Guest,
}

struct Resource {
    sensitivity: u8,
    owner: String,
}

fn can_access(perm: &Permission, resource: &Resource, user: &str) -> bool {
    match perm {
        Permission::Admin => true,
        Permission::User { level } if *level >= resource.sensitivity => true,
        Permission::User { .. } if resource.owner == user => true,
        Permission::Guest if resource.sensitivity == 0 => true,
        _ => false,
    }
}

fn main() {
    let resource = Resource {
        sensitivity: 5,
        owner: String::from("alice"),
    };

    let admin = Permission::Admin;
    let user_high = Permission::User { level: 10 };
    let user_low = Permission::User { level: 3 };
    let guest = Permission::Guest;

    println!("管理员可以访问: {}", can_access(&admin, &resource, "bob"));
    println!("高级用户可以访问: {}", can_access(&user_high, &resource, "bob"));
    println!("低级用户可以访问: {}", can_access(&user_low, &resource, "bob"));
    println!("所有者可以访问: {}", can_access(&user_low, &resource, "alice"));
    println!("访客可以访问: {}", can_access(&guest, &resource, "bob"));
}
```

## 可反驳与不可反驳模式

Rust 中的模式分为两类:

- **不可反驳模式 (Irrefutable)**: 能匹配任何传递的值,如 `let x = 5` 中的 `x`
- **可反驳模式 (Refutable)**: 对某些可能的值可能匹配失败,如 `if let Some(x) = value` 中的 `Some(x)`

### 使用场景

```rust
fn main() {
    // let 语句需要不可反驳模式
    let x = 5; // 正确: x 匹配任何值

    // let Some(x) = some_option; // 错误! Some(x) 是可反驳的

    // if let 可以使用可反驳模式
    let some_option: Option<i32> = Some(5);
    if let Some(x) = some_option {
        println!("x = {}", x);
    }

    // 强制使用可反驳模式会产生警告
    // if let x = 5 { ... } // 警告: 不可反驳模式

    // match 分支使用可反驳模式(除了最后一个可以是 _)
    match some_option {
        Some(x) => println!("Some: {}", x),
        None => println!("None"),
    }
}
```

### 函数参数中的模式

```rust
// 函数参数需要不可反驳模式
fn process_pair((x, y): (i32, i32)) {
    println!("x: {}, y: {}", x, y);
}

// 使用 Option 需要不同的处理方式
fn process_optional(opt: Option<i32>) {
    // 不能直接在参数中解构 Option
    if let Some(value) = opt {
        println!("值: {}", value);
    }
}

fn main() {
    process_pair((1, 2));
    process_optional(Some(42));
}
```

### for 循环中的模式

```rust
fn main() {
    let v = vec![1, 2, 3];

    // for 循环使用不可反驳模式
    for (index, value) in v.iter().enumerate() {
        println!("索引 {} 的值是 {}", index, value);
    }

    // 解构复杂结构
    let pairs = vec![(1, "one"), (2, "two"), (3, "three")];
    for (num, name) in pairs {
        println!("{} = {}", num, name);
    }
}
```

## 高级模式技巧

### 结合 Box 和智能指针

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}

fn main() {
    use List::{Cons, Nil};

    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));

    fn sum(list: &List) -> i32 {
        match list {
            Cons(head, tail) => head + sum(tail),
            Nil => 0,
        }
    }

    println!("链表总和: {}", sum(&list));
}
```

### 模式与泛型

```rust
fn process<T>(value: Option<T>)
where
    T: std::fmt::Debug,
{
    match value {
        Some(v) => println!("获得值: {:?}", v),
        None => println!("无值"),
    }
}

fn process_result<T, E>(result: Result<T, E>)
where
    T: std::fmt::Debug,
    E: std::fmt::Debug,
{
    match result {
        Ok(v) => println!("成功: {:?}", v),
        Err(e) => println!("错误: {:?}", e),
    }
}

fn main() {
    process(Some(42));
    process::<i32>(None);

    process_result::<i32, &str>(Ok(100));
    process_result::<i32, &str>(Err("出错了"));
}
```

### 使用 matches! 宏

`matches!` 宏提供了检查模式是否匹配的简洁方式:

```rust
fn main() {
    let foo = 'f';

    // 传统方式
    let is_vowel = match foo {
        'a' | 'e' | 'i' | 'o' | 'u' => true,
        _ => false,
    };

    // 使用 matches! 宏
    let is_vowel = matches!(foo, 'a' | 'e' | 'i' | 'o' | 'u');
    println!("是元音: {}", is_vowel);

    // 结合守卫
    let num = Some(4);
    let is_small = matches!(num, Some(x) if x < 5);
    println!("是小数字: {}", is_small);

    // 检查枚举变体
    enum Status {
        Active,
        Inactive,
        Pending,
    }

    let status = Status::Active;
    assert!(matches!(status, Status::Active));

    // 在迭代器中使用
    let numbers = vec![1, 2, 3, 4, 5, 6];
    let evens: Vec<_> = numbers
        .iter()
        .filter(|&&x| matches!(x, n if n % 2 == 0))
        .collect();
    println!("偶数: {:?}", evens);
}
```

### let-else 语法 (Rust 1.65+)

`let-else` 提供了在模式不匹配时提前返回的简洁语法:

```rust
fn get_count_item(s: &str) -> (u64, &str) {
    let mut iter = s.splitn(2, ' ');

    // let-else: 如果模式不匹配则执行 else 分支
    let Some(count_str) = iter.next() else {
        return (0, "");
    };

    let Some(item) = iter.next() else {
        return (0, "");
    };

    let Ok(count) = count_str.parse::<u64>() else {
        return (0, "");
    };

    (count, item)
}

fn process_user(data: Option<(String, u32)>) -> String {
    let Some((name, age)) = data else {
        return String::from("无效用户数据");
    };

    format!("用户: {}, 年龄: {}", name, age)
}

fn main() {
    println!("{:?}", get_count_item("3 apples"));
    println!("{:?}", get_count_item("invalid"));

    println!("{}", process_user(Some(("张三".to_string(), 25))));
    println!("{}", process_user(None));
}
```

### 模式在闭包中的应用

```rust
fn main() {
    let pairs = vec![(1, 2), (3, 4), (5, 6)];

    // 在闭包参数中解构
    let sum: i32 = pairs.iter().map(|(a, b)| a + b).sum();
    println!("总和: {}", sum);

    // 复杂解构
    struct Person {
        name: String,
        age: u32,
    }

    let people = vec![
        Person { name: String::from("Alice"), age: 30 },
        Person { name: String::from("Bob"), age: 25 },
    ];

    let names: Vec<_> = people
        .iter()
        .map(|Person { name, .. }| name.clone())
        .collect();
    println!("名字: {:?}", names);

    // filter_map 结合模式
    let numbers = vec!["1", "two", "3", "four", "5"];
    let parsed: Vec<i32> = numbers
        .iter()
        .filter_map(|s| s.parse().ok())
        .collect();
    println!("解析的数字: {:?}", parsed);
}
```

## 实际应用示例

### 状态机实现

```rust
#[derive(Debug)]
enum State {
    Idle,
    Running { progress: u8 },
    Paused { reason: String },
    Completed { result: String },
    Failed { error: String },
}

enum Event {
    Start,
    Progress(u8),
    Pause(String),
    Resume,
    Complete(String),
    Error(String),
}

fn transition(state: State, event: Event) -> State {
    match (state, event) {
        (State::Idle, Event::Start) => State::Running { progress: 0 },

        (State::Running { progress }, Event::Progress(p)) => {
            State::Running { progress: progress.saturating_add(p) }
        }

        (State::Running { .. }, Event::Pause(reason)) => {
            State::Paused { reason }
        }

        (State::Paused { .. }, Event::Resume) => {
            State::Running { progress: 0 }
        }

        (State::Running { .. }, Event::Complete(result)) => {
            State::Completed { result }
        }

        (state @ (State::Running { .. } | State::Paused { .. }), Event::Error(error)) => {
            println!("从状态 {:?} 转换到失败状态", state);
            State::Failed { error }
        }

        (state, event) => {
            println!("无效转换,保持当前状态");
            state
        }
    }
}

fn main() {
    let mut state = State::Idle;
    println!("初始状态: {:?}", state);

    state = transition(state, Event::Start);
    println!("启动后: {:?}", state);

    state = transition(state, Event::Progress(30));
    println!("进度更新后: {:?}", state);

    state = transition(state, Event::Complete(String::from("任务完成")));
    println!("完成后: {:?}", state);
}
```

### 命令行参数解析

```rust
#[derive(Debug)]
enum Command {
    Add { name: String, value: i32 },
    Remove { name: String },
    List,
    Help,
}

fn parse_command(args: &[String]) -> Option<Command> {
    match args.as_slice() {
        [cmd] if cmd == "list" => Some(Command::List),
        [cmd] if cmd == "help" => Some(Command::Help),
        [cmd, name] if cmd == "remove" => {
            Some(Command::Remove { name: name.clone() })
        }
        [cmd, name, value] if cmd == "add" => {
            value.parse().ok().map(|v| Command::Add {
                name: name.clone(),
                value: v,
            })
        }
        _ => None,
    }
}

fn execute_command(cmd: Command) {
    match cmd {
        Command::Add { name, value } => {
            println!("添加: {} = {}", name, value);
        }
        Command::Remove { name } => {
            println!("删除: {}", name);
        }
        Command::List => {
            println!("列出所有项目");
        }
        Command::Help => {
            println!("用法: add <name> <value> | remove <name> | list | help");
        }
    }
}

fn main() {
    let test_cases = vec![
        vec!["help".to_string()],
        vec!["list".to_string()],
        vec!["add".to_string(), "x".to_string(), "42".to_string()],
        vec!["remove".to_string(), "x".to_string()],
    ];

    for args in test_cases {
        print!("命令 {:?}: ", args);
        match parse_command(&args) {
            Some(cmd) => execute_command(cmd),
            None => println!("无效命令"),
        }
    }
}
```

### JSON 处理

```rust
#[derive(Debug)]
enum JsonValue {
    Null,
    Bool(bool),
    Number(f64),
    String(String),
    Array(Vec<JsonValue>),
    Object(Vec<(String, JsonValue)>),
}

fn format_json(value: &JsonValue, indent: usize) -> String {
    let prefix = " ".repeat(indent);

    match value {
        JsonValue::Null => "null".to_string(),
        JsonValue::Bool(b) => b.to_string(),
        JsonValue::Number(n) => n.to_string(),
        JsonValue::String(s) => format!("\"{}\"", s),
        JsonValue::Array(arr) if arr.is_empty() => "[]".to_string(),
        JsonValue::Array(arr) => {
            let items: Vec<_> = arr
                .iter()
                .map(|v| format!("{}  {}", prefix, format_json(v, indent + 2)))
                .collect();
            format!("[\n{}\n{}]", items.join(",\n"), prefix)
        }
        JsonValue::Object(obj) if obj.is_empty() => "{}".to_string(),
        JsonValue::Object(obj) => {
            let items: Vec<_> = obj
                .iter()
                .map(|(k, v)| {
                    format!("{}  \"{}\": {}", prefix, k, format_json(v, indent + 2))
                })
                .collect();
            format!("{{\n{}\n{}}}", items.join(",\n"), prefix)
        }
    }
}

fn find_value<'a>(json: &'a JsonValue, path: &[&str]) -> Option<&'a JsonValue> {
    match (json, path) {
        (value, []) => Some(value),
        (JsonValue::Object(obj), [key, rest @ ..]) => {
            obj.iter()
                .find(|(k, _)| k == *key)
                .and_then(|(_, v)| find_value(v, rest))
        }
        (JsonValue::Array(arr), [index, rest @ ..]) => {
            index.parse::<usize>().ok()
                .and_then(|i| arr.get(i))
                .and_then(|v| find_value(v, rest))
        }
        _ => None,
    }
}

fn main() {
    let json = JsonValue::Object(vec![
        ("name".to_string(), JsonValue::String("张三".to_string())),
        ("age".to_string(), JsonValue::Number(30.0)),
        ("active".to_string(), JsonValue::Bool(true)),
        ("tags".to_string(), JsonValue::Array(vec![
            JsonValue::String("rust".to_string()),
            JsonValue::String("programming".to_string()),
        ])),
    ]);

    println!("格式化的 JSON:\n{}", format_json(&json, 0));

    // 路径查找
    if let Some(value) = find_value(&json, &["name"]) {
        println!("\n找到 name: {:?}", value);
    }

    if let Some(value) = find_value(&json, &["tags", "0"]) {
        println!("找到 tags[0]: {:?}", value);
    }
}
```

## 最佳实践

### 优先使用 match 而非 if-else 链

```rust
enum Status {
    Active,
    Inactive,
    Pending,
}

// 不推荐
fn check_status_bad(status: &Status) -> &str {
    if matches!(status, Status::Active) {
        "活跃"
    } else if matches!(status, Status::Inactive) {
        "非活跃"
    } else {
        "待定"
    }
}

// 推荐
fn check_status_good(status: &Status) -> &str {
    match status {
        Status::Active => "活跃",
        Status::Inactive => "非活跃",
        Status::Pending => "待定",
    }
}
```

### 使用 if let 简化单一匹配

```rust
fn main() {
    let config = Some(42);

    // 不推荐: 当只关心一种情况时
    match config {
        Some(value) => println!("配置值: {}", value),
        None => (),
    }

    // 推荐
    if let Some(value) = config {
        println!("配置值: {}", value);
    }
}
```

### 避免通配符吞噬所有情况

```rust
enum Event {
    Click,
    KeyPress(char),
    Scroll { delta: i32 },
}

// 不推荐: 通配符可能掩盖新增的枚举变体
fn handle_event_bad(event: Event) {
    match event {
        Event::Click => println!("点击"),
        _ => println!("其他事件"),
    }
}

// 推荐: 显式处理所有情况
fn handle_event_good(event: Event) {
    match event {
        Event::Click => println!("点击"),
        Event::KeyPress(c) => println!("按键: {}", c),
        Event::Scroll { delta } => println!("滚动: {}", delta),
    }
}
```

### 合理使用 @ 绑定

```rust
fn main() {
    let age = 25;

    // 清晰的 @ 绑定使用
    match age {
        n @ 0..=17 => println!("{}岁是未成年人", n),
        n @ 18..=64 => println!("{}岁是成年人", n),
        n @ 65.. => println!("{}岁是老年人", n),
        // 注意: 0..=17 已覆盖负数不会出现的情况(u32)
    }
}
```

### 利用解构简化代码

```rust
struct Config {
    host: String,
    port: u16,
    debug: bool,
}

// 不推荐
fn start_server_bad(config: Config) {
    println!("启动服务器: {}:{}", config.host, config.port);
    if config.debug {
        println!("调试模式已启用");
    }
}

// 推荐: 在函数签名中解构
fn start_server_good(Config { host, port, debug }: Config) {
    println!("启动服务器: {}:{}", host, port);
    if debug {
        println!("调试模式已启用");
    }
}
```

## 总结

Rust 的模式匹配是一个强大而灵活的特性,提供了以下优势:

1. **穷尽性检查**: 编译器确保处理所有可能的情况
2. **表达力强**: 支持复杂的数据结构解构和条件匹配
3. **类型安全**: 模式匹配与类型系统紧密集成
4. **简洁语法**: `if let`、`while let`、`let-else` 等语法糖简化常见场景
5. **零成本抽象**: 模式匹配编译为高效的机器代码

掌握模式匹配是成为高效 Rust 程序员的关键。通过合理运用 `match`、`if let`、解构和模式守卫,可以编写出既安全又优雅的代码。记住:在 Rust 中,模式匹配不仅是控制流工具,更是一种表达程序逻辑的强大方式。
