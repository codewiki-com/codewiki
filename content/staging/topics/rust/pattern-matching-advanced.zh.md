---
title: Rust 高级模式匹配
description: 深入探索 Rust 高级模式匹配技术，包括复杂解构、模式守卫、@ 绑定、or 模式、ref/ref mut 以及编译器优化原理
track: rust
section: unsafe-ffi
difficulty: advanced
tags:
  - Rust
  - 模式匹配
  - 高级模式
  - 解构
  - 守卫
  - ref
  - 编译器优化
status: imported
origin: old/src/content/docs/rust/pattern-matching-advanced.zh.md
divergence: 0.212
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 高级特性
  order: 17
  lastUpdated: 2026-01-07
---

模式匹配是 Rust 类型系统的核心支柱之一。在掌握基础语法后，深入理解高级模式匹配技术将帮助你编写更具表现力、更安全、性能更优的代码。本文将系统剖析 Rust 高级模式匹配的各个方面，从底层原理到实战应用。

## 概念解释

### 什么是高级模式匹配

高级模式匹配是指超越基本 `match` 语法的复杂模式技术，包括：

- **深层解构 (Deep Destructuring)**: 嵌套结构的递归拆解
- **模式守卫 (Pattern Guards)**: 在模式匹配中添加额外的布尔条件
- **@ 绑定 (@ Bindings)**: 在测试模式的同时绑定值到变量
- **or 模式 (Or Patterns)**: 多个模式的逻辑或组合
- **ref/ref mut 模式**: 控制值的借用方式
- **切片模式**: 对数组和切片的结构匹配

### 历史背景

Rust 的模式匹配深受 ML 系语言（如 OCaml、Haskell）的影响，但在所有权系统的约束下有独特的设计。随着 Rust 版本的演进，模式匹配不断增强：

- **Rust 1.26**: 引入 `..=` 闭区间模式
- **Rust 1.53**: or 模式在所有位置可用
- **Rust 1.56**: 绑定和 or 模式可混合使用
- **Rust 1.65**: 引入 `let-else` 语法
- **Rust 1.75+**: 切片模式持续增强

### 解决的问题

高级模式匹配解决了以下关键问题：

1. **复杂数据结构的安全访问**: 避免手动层层解包
2. **穷尽性保证**: 编译时确保处理所有情况
3. **所有权精确控制**: 在匹配中精确管理借用和移动
4. **代码表现力**: 用声明式方式表达复杂逻辑

## 核心原理

### 模式匹配的编译器实现

Rust 编译器将模式匹配编译为决策树，通过以下步骤优化：

```rust
// 源代码
enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
    Triangle { base: f64, height: f64 },
}

fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle { radius } => std::f64::consts::PI * radius * radius,
        Shape::Rectangle { width, height } => width * height,
        Shape::Triangle { base, height } => 0.5 * base * height,
    }
}

// 编译器内部大致生成的决策逻辑：
// 1. 检查判别式 (discriminant) 确定枚举变体
// 2. 直接跳转到对应分支
// 3. 提取字段到局部变量
// 4. 执行表达式
```

### 判别式与内存布局

枚举的模式匹配依赖判别式（discriminant）：

```rust
use std::mem;

enum Message {
    Quit,                       // 判别式 = 0
    Move { x: i32, y: i32 },    // 判别式 = 1
    Write(String),              // 判别式 = 2
    ChangeColor(u8, u8, u8),    // 判别式 = 3
}

fn main() {
    // 枚举大小 = 最大变体大小 + 判别式大小 + 对齐填充
    println!("Message 大小: {} 字节", mem::size_of::<Message>());

    // 查看判别式
    let msg = Message::Write(String::from("hello"));
    let discriminant = unsafe {
        *(&msg as *const Message as *const u8)
    };
    println!("判别式值: {}", discriminant);
}
```

### 模式匹配的穷尽性检查

编译器使用可用性矩阵算法检查模式穷尽性：

```rust
// 编译器内部建立如下检查：
// 模式空间: Shape = { Circle, Rectangle, Triangle }
// 已覆盖: { Circle, Rectangle, Triangle }
// 未覆盖: {} (空集 = 穷尽)

// 如果缺少分支，编译器报错并指出缺失的模式
fn incomplete_match(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle { radius } => std::f64::consts::PI * radius * radius,
        Shape::Rectangle { width, height } => width * height,
        // 错误: 缺少 Triangle 分支
    }
}
```

### 借用检查与模式匹配

模式匹配与借用检查器紧密协作：

```rust
struct Container {
    value: String,
    count: i32,
}

fn demonstrate_borrow_in_match(container: &mut Container) {
    // match 表达式创建临时借用作用域
    match &container.value {
        s if s.starts_with("prefix") => {
            // 这里 container 被不可变借用
            println!("Value: {}", s);
        }
        _ => {
            // 这里借用结束，可以可变借用
            container.count += 1;
        }
    }
    // match 结束后，借用释放
    container.value.push_str(" suffix");
}
```

## 核心要点

### 深层解构 (Deep Destructuring)

深层解构允许一次性拆解多层嵌套结构：

```rust
struct Address {
    city: String,
    street: String,
    number: u32,
}

struct Person {
    name: String,
    address: Address,
}

struct Company {
    name: String,
    ceo: Person,
    headquarters: Address,
}

fn print_ceo_city(company: &Company) {
    // 深层解构：一次性访问多层嵌套字段
    let Company {
        name: company_name,
        ceo: Person {
            name: ceo_name,
            address: Address { city, .. },
        },
        ..
    } = company;

    println!("{} 的 CEO {} 住在 {}", company_name, ceo_name, city);
}
```

### 模式守卫 (Pattern Guards)

模式守卫在模式匹配后添加额外条件：

```rust
fn classify_number(n: i32) -> &'static str {
    match n {
        x if x < 0 => "负数",
        0 => "零",
        x if x % 2 == 0 => "正偶数",
        x if x % 2 == 1 => "正奇数",
        _ => unreachable!(),
    }
}

// 守卫可以引用外部变量
fn check_password(input: &str, stored_hash: u64) -> bool {
    // 简化的哈希检查示例
    fn hash(s: &str) -> u64 {
        s.bytes().fold(0u64, |acc, b| acc.wrapping_mul(31).wrapping_add(b as u64))
    }

    match input {
        s if s.len() >= 8 && hash(s) == stored_hash => true,
        s if s.len() < 8 => {
            println!("密码太短");
            false
        }
        _ => {
            println!("密码不匹配");
            false
        }
    }
}
```

### @ 绑定 (@ Bindings)

@ 绑定允许在测试模式的同时捕获值：

```rust
enum Message {
    Hello { id: i32 },
    Goodbye { id: i32, reason: String },
}

fn process_message(msg: Message) {
    match msg {
        // 既检查范围，又绑定值
        Message::Hello { id: id @ 1..=100 } => {
            println!("有效 Hello，ID: {}", id);
        }
        // @ 绑定整个结构
        msg @ Message::Goodbye { id: 200..=300, .. } => {
            println!("特殊 Goodbye: {:?}", msg);
        }
        // 嵌套 @ 绑定
        Message::Goodbye {
            id: id @ 1..=199,
            reason: ref r @ _
        } => {
            println!("普通 Goodbye，ID: {}, 原因: {}", id, r);
        }
        _ => println!("其他消息"),
    }
}

// @ 绑定在切片模式中的应用
fn analyze_sequence(data: &[i32]) {
    match data {
        [] => println!("空序列"),
        [single] => println!("单元素: {}", single),
        // 绑定第一个元素并检查范围
        [first @ 1..=10, rest @ ..] => {
            println!("以小数字 {} 开头，剩余 {} 个元素", first, rest.len());
        }
        // 绑定整个切片并检查模式
        all @ [_, _, _] => {
            println!("正好三个元素: {:?}", all);
        }
        _ => println!("其他模式"),
    }
}
```

### or 模式 (Or Patterns)

or 模式使用 `|` 组合多个模式：

```rust
enum Event {
    KeyPress { key: char, ctrl: bool, alt: bool },
    MouseClick { x: i32, y: i32, button: MouseButton },
    Scroll { delta: i32 },
    Resize { width: u32, height: u32 },
}

enum MouseButton { Left, Right, Middle }

fn handle_event(event: Event) {
    match event {
        // or 模式组合多种情况
        Event::KeyPress { key: 'q', .. } | Event::KeyPress { key: 'Q', .. } => {
            println!("退出");
        }
        // 复杂的 or 模式
        Event::KeyPress { key: 'c' | 'C', ctrl: true, .. } => {
            println!("复制");
        }
        Event::KeyPress { key: 'v' | 'V', ctrl: true, .. } => {
            println!("粘贴");
        }
        // or 模式在嵌套结构中
        Event::MouseClick {
            button: MouseButton::Left | MouseButton::Right,
            x,
            y
        } => {
            println!("主要按钮点击在 ({}, {})", x, y);
        }
        // 带绑定的 or 模式
        Event::Scroll { delta: d @ (1..=10 | -10..=-1) } => {
            println!("小幅滚动: {}", d);
        }
        _ => {}
    }
}

// or 模式在 if let 中
fn check_result<T, E>(result: &Result<T, E>) -> bool {
    // Rust 1.65+ 支持
    matches!(result, Ok(_) | Err(_)) // 总是 true，仅作语法演示
}
```

### ref 和 ref mut 模式

`ref` 和 `ref mut` 控制模式匹配中的借用行为：

```rust
struct Data {
    value: String,
    count: i32,
}

fn demonstrate_ref_patterns() {
    let data = Data {
        value: String::from("hello"),
        count: 42,
    };

    // 不使用 ref：value 被移动
    // let Data { value, count } = data;  // data.value 被移动

    // 使用 ref：创建引用而非移动
    let Data { ref value, count } = data;
    println!("value: {}, count: {}", value, count);
    // data 仍然完整可用
    println!("data.value: {}", data.value);
}

fn demonstrate_ref_mut() {
    let mut data = Data {
        value: String::from("hello"),
        count: 0,
    };

    // ref mut 创建可变引用
    let Data { ref mut value, ref mut count } = data;
    value.push_str(" world");
    *count += 1;

    println!("修改后: {} ({})", data.value, data.count);
}

// 在 match 中使用 ref
fn process_option(opt: Option<String>) {
    match opt {
        // 使用 ref 避免移动
        Some(ref s) => println!("值: {}", s),
        None => println!("无值"),
    }
    // opt 仍然可用（如果是 Some，String 未被移动）
}

// match 对引用的自动解引用
fn process_option_ref(opt: &Option<String>) {
    match opt {
        // 自动解引用 &Option<String>
        Some(s) => println!("值: {}", s),  // s 是 &String
        None => println!("无值"),
    }
}

// ref 在复杂模式中的应用
enum Container {
    Single(String),
    Multiple(Vec<String>),
}

fn examine_container(container: &Container) {
    match container {
        // 自动获得引用
        Container::Single(s) => println!("单值: {}", s),
        Container::Multiple(items) if items.len() > 2 => {
            println!("多于两项: {:?}", items);
        }
        Container::Multiple(items) => {
            println!("最多两项: {:?}", items);
        }
    }
}
```

### 切片模式高级用法

```rust
fn advanced_slice_patterns() {
    let numbers: &[i32] = &[1, 2, 3, 4, 5];

    match numbers {
        // 匹配特定开头
        [1, 2, rest @ ..] => {
            println!("以 1, 2 开头，剩余: {:?}", rest);
        }
        // 匹配特定结尾
        [init @ .., 4, 5] => {
            println!("以 4, 5 结尾，前面: {:?}", init);
        }
        // 匹配首尾
        [first, middle @ .., last] => {
            println!("首: {}, 中间: {:?}, 尾: {}", first, middle, last);
        }
        _ => {}
    }

    // 在递归中使用切片模式
    fn sum(slice: &[i32]) -> i32 {
        match slice {
            [] => 0,
            [x] => *x,
            [first, rest @ ..] => first + sum(rest),
        }
    }

    println!("总和: {}", sum(numbers));
}

// 切片模式匹配字符串
fn parse_command(input: &str) -> Option<(&str, Vec<&str>)> {
    let parts: Vec<&str> = input.split_whitespace().collect();

    match parts.as_slice() {
        [] => None,
        [cmd] => Some((cmd, vec![])),
        [cmd, args @ ..] => Some((cmd, args.to_vec())),
    }
}
```

## 代码示例

### 示例 1: 表达式求值器

```rust
/// 算术表达式 AST
#[derive(Debug, Clone)]
enum Expr {
    Num(f64),
    Var(String),
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
    Pow(Box<Expr>, Box<Expr>),
    Neg(Box<Expr>),
    Call { func: String, args: Vec<Expr> },
}

use std::collections::HashMap;

type Context = HashMap<String, f64>;

fn evaluate(expr: &Expr, ctx: &Context) -> Result<f64, String> {
    match expr {
        // 基本值
        Expr::Num(n) => Ok(*n),

        // 变量查找
        Expr::Var(name) => ctx
            .get(name)
            .copied()
            .ok_or_else(|| format!("未定义变量: {}", name)),

        // 二元运算 - 使用 @ 绑定简化错误处理
        op @ (Expr::Add(l, r) | Expr::Sub(l, r) | Expr::Mul(l, r) | Expr::Div(l, r)) => {
            let lv = evaluate(l, ctx)?;
            let rv = evaluate(r, ctx)?;
            match op {
                Expr::Add(_, _) => Ok(lv + rv),
                Expr::Sub(_, _) => Ok(lv - rv),
                Expr::Mul(_, _) => Ok(lv * rv),
                Expr::Div(_, _) if rv != 0.0 => Ok(lv / rv),
                Expr::Div(_, _) => Err("除以零".to_string()),
                _ => unreachable!(),
            }
        }

        // 幂运算
        Expr::Pow(base, exp) => {
            let b = evaluate(base, ctx)?;
            let e = evaluate(exp, ctx)?;
            Ok(b.powf(e))
        }

        // 一元负号
        Expr::Neg(inner) => Ok(-evaluate(inner, ctx)?),

        // 函数调用 - 使用切片模式匹配参数
        Expr::Call { func, args } => {
            let evaluated: Result<Vec<f64>, String> =
                args.iter().map(|a| evaluate(a, ctx)).collect();
            let args = evaluated?;

            match (func.as_str(), args.as_slice()) {
                ("sin", [x]) => Ok(x.sin()),
                ("cos", [x]) => Ok(x.cos()),
                ("sqrt", [x]) if *x >= 0.0 => Ok(x.sqrt()),
                ("sqrt", [x]) => Err(format!("负数平方根: {}", x)),
                ("max", [a, b]) => Ok(a.max(*b)),
                ("min", [a, b]) => Ok(a.min(*b)),
                ("abs", [x]) => Ok(x.abs()),
                (name, args) => Err(format!(
                    "未知函数 {} 或参数数量错误 (得到 {} 个)",
                    name,
                    args.len()
                )),
            }
        }
    }
}

/// 表达式简化
fn simplify(expr: Expr) -> Expr {
    match expr {
        // 0 + x = x
        Expr::Add(l, r) => match (*l, *r) {
            (Expr::Num(0.0), e) | (e, Expr::Num(0.0)) => simplify(e),
            (l, r) => Expr::Add(Box::new(simplify(l)), Box::new(simplify(r))),
        },

        // x - 0 = x
        Expr::Sub(l, r) => match (*l, *r) {
            (e, Expr::Num(0.0)) => simplify(e),
            (l, r) => Expr::Sub(Box::new(simplify(l)), Box::new(simplify(r))),
        },

        // 1 * x = x, 0 * x = 0
        Expr::Mul(l, r) => match (*l, *r) {
            (Expr::Num(0.0), _) | (_, Expr::Num(0.0)) => Expr::Num(0.0),
            (Expr::Num(1.0), e) | (e, Expr::Num(1.0)) => simplify(e),
            (l, r) => Expr::Mul(Box::new(simplify(l)), Box::new(simplify(r))),
        },

        // x / 1 = x
        Expr::Div(l, r) => match (*l, *r) {
            (e, Expr::Num(1.0)) => simplify(e),
            (l, r) => Expr::Div(Box::new(simplify(l)), Box::new(simplify(r))),
        },

        // x^0 = 1, x^1 = x
        Expr::Pow(base, exp) => match (*base, *exp) {
            (_, Expr::Num(0.0)) => Expr::Num(1.0),
            (e, Expr::Num(1.0)) => simplify(e),
            (b, e) => Expr::Pow(Box::new(simplify(b)), Box::new(simplify(e))),
        },

        // --x = x
        Expr::Neg(inner) => match *inner {
            Expr::Neg(e) => simplify(*e),
            e => Expr::Neg(Box::new(simplify(e))),
        },

        // 递归简化函数参数
        Expr::Call { func, args } => Expr::Call {
            func,
            args: args.into_iter().map(simplify).collect(),
        },

        // 叶节点保持不变
        e @ (Expr::Num(_) | Expr::Var(_)) => e,
    }
}

fn main() {
    use Expr::*;

    // 构建: (x + 2) * sin(y)
    let expr = Mul(
        Box::new(Add(
            Box::new(Var("x".to_string())),
            Box::new(Num(2.0)),
        )),
        Box::new(Call {
            func: "sin".to_string(),
            args: vec![Var("y".to_string())],
        }),
    );

    let mut ctx = HashMap::new();
    ctx.insert("x".to_string(), 3.0);
    ctx.insert("y".to_string(), std::f64::consts::FRAC_PI_2);

    match evaluate(&expr, &ctx) {
        Ok(result) => println!("结果: {}", result),
        Err(e) => println!("错误: {}", e),
    }

    // 简化演示: 0 + x * 1 => x
    let complex = Add(
        Box::new(Num(0.0)),
        Box::new(Mul(
            Box::new(Var("x".to_string())),
            Box::new(Num(1.0)),
        )),
    );

    println!("简化前: {:?}", complex);
    println!("简化后: {:?}", simplify(complex));
}
```

### 示例 2: 状态机与事件处理

```rust
use std::collections::VecDeque;

/// 网络连接状态机
#[derive(Debug, Clone)]
enum ConnectionState {
    Disconnected,
    Connecting { attempt: u32, timeout_ms: u64 },
    Connected { socket_id: u64, encrypted: bool },
    Authenticated { socket_id: u64, user_id: String, permissions: Vec<String> },
    Disconnecting { reason: DisconnectReason },
}

#[derive(Debug, Clone)]
enum DisconnectReason {
    UserRequest,
    Timeout,
    Error(String),
}

#[derive(Debug)]
enum ConnectionEvent {
    Connect { host: String, port: u16 },
    ConnectionEstablished { socket_id: u64 },
    EncryptionEnabled,
    Authenticate { user: String, token: String },
    AuthSuccess { user_id: String, permissions: Vec<String> },
    AuthFailure { reason: String },
    Disconnect,
    Timeout,
    Error(String),
}

#[derive(Debug)]
enum StateTransitionResult {
    NewState(ConnectionState),
    Stay,
    Error(String),
}

fn transition(state: ConnectionState, event: ConnectionEvent) -> StateTransitionResult {
    use ConnectionState::*;
    use ConnectionEvent::*;
    use StateTransitionResult::*;

    match (&state, event) {
        // 从断开状态连接
        (Disconnected, Connect { host, port }) => {
            println!("正在连接到 {}:{}", host, port);
            NewState(Connecting { attempt: 1, timeout_ms: 5000 })
        }

        // 连接建立
        (Connecting { .. }, ConnectionEstablished { socket_id }) => {
            println!("连接已建立，socket: {}", socket_id);
            NewState(Connected { socket_id, encrypted: false })
        }

        // 连接重试
        (Connecting { attempt, timeout_ms }, Timeout) if *attempt < 3 => {
            println!("连接超时，重试第 {} 次", attempt + 1);
            NewState(Connecting {
                attempt: attempt + 1,
                timeout_ms: timeout_ms * 2
            })
        }

        // 连接失败
        (Connecting { attempt, .. }, Timeout) => {
            println!("连接失败，已尝试 {} 次", attempt);
            NewState(Disconnected)
        }

        // 启用加密
        (Connected { socket_id, encrypted: false }, EncryptionEnabled) => {
            println!("加密已启用");
            NewState(Connected { socket_id: *socket_id, encrypted: true })
        }

        // 认证请求 - 需要已加密
        (Connected { socket_id, encrypted: true }, Authenticate { user, token }) => {
            println!("正在认证用户: {}", user);
            // 实际应用中这里会发送认证请求
            // 为简化，直接模拟成功
            NewState(Authenticated {
                socket_id: *socket_id,
                user_id: user,
                permissions: vec!["read".to_string(), "write".to_string()],
            })
        }

        // 未加密时尝试认证
        (Connected { encrypted: false, .. }, Authenticate { .. }) => {
            Error("必须先启用加密才能认证".to_string())
        }

        // 用户断开连接 - 从任何已连接状态
        (Connected { .. } | Authenticated { .. }, Disconnect) => {
            NewState(Disconnecting { reason: DisconnectReason::UserRequest })
        }

        // 错误处理 - 使用 @ 绑定捕获状态
        (state @ (Connected { .. } | Authenticated { .. }), Error(msg)) => {
            println!("连接状态 {:?} 遇到错误: {}", state, msg);
            NewState(Disconnecting { reason: DisconnectReason::Error(msg) })
        }

        // 断开完成
        (Disconnecting { reason }, _) => {
            println!("断开连接，原因: {:?}", reason);
            NewState(Disconnected)
        }

        // 无效转换
        (state, event) => {
            println!("无效事件 {:?} 在状态 {:?}", event, state);
            Stay
        }
    }
}

fn run_state_machine() {
    let mut state = ConnectionState::Disconnected;
    let events = vec![
        ConnectionEvent::Connect { host: "example.com".to_string(), port: 443 },
        ConnectionEvent::ConnectionEstablished { socket_id: 12345 },
        ConnectionEvent::EncryptionEnabled,
        ConnectionEvent::Authenticate {
            user: "admin".to_string(),
            token: "secret".to_string()
        },
        ConnectionEvent::Disconnect,
    ];

    println!("初始状态: {:?}\n", state);

    for event in events {
        println!("事件: {:?}", event);
        match transition(state.clone(), event) {
            StateTransitionResult::NewState(new) => {
                state = new;
                println!("新状态: {:?}\n", state);
            }
            StateTransitionResult::Stay => {
                println!("状态不变: {:?}\n", state);
            }
            StateTransitionResult::Error(msg) => {
                println!("错误: {}\n", msg);
            }
        }
    }
}
```

### 示例 3: 递归数据结构处理

```rust
/// 二叉搜索树
#[derive(Debug)]
enum BST<T> {
    Empty,
    Node {
        value: T,
        left: Box<BST<T>>,
        right: Box<BST<T>>,
    },
}

impl<T: Ord + Clone> BST<T> {
    fn new() -> Self {
        BST::Empty
    }

    fn insert(&mut self, item: T) {
        match self {
            BST::Empty => {
                *self = BST::Node {
                    value: item,
                    left: Box::new(BST::Empty),
                    right: Box::new(BST::Empty),
                };
            }
            BST::Node { value, left, right } => {
                match item.cmp(value) {
                    std::cmp::Ordering::Less => left.insert(item),
                    std::cmp::Ordering::Greater => right.insert(item),
                    std::cmp::Ordering::Equal => {} // 忽略重复
                }
            }
        }
    }

    fn contains(&self, item: &T) -> bool {
        match self {
            BST::Empty => false,
            BST::Node { value, left, right } => match item.cmp(value) {
                std::cmp::Ordering::Less => left.contains(item),
                std::cmp::Ordering::Greater => right.contains(item),
                std::cmp::Ordering::Equal => true,
            },
        }
    }

    fn min(&self) -> Option<&T> {
        match self {
            BST::Empty => None,
            BST::Node { value, left, .. } => {
                match left.as_ref() {
                    BST::Empty => Some(value),
                    _ => left.min(),
                }
            }
        }
    }

    fn max(&self) -> Option<&T> {
        match self {
            BST::Empty => None,
            BST::Node { value, right, .. } => {
                match right.as_ref() {
                    BST::Empty => Some(value),
                    _ => right.max(),
                }
            }
        }
    }

    /// 中序遍历收集元素
    fn inorder(&self) -> Vec<T> {
        match self {
            BST::Empty => vec![],
            BST::Node { value, left, right } => {
                let mut result = left.inorder();
                result.push(value.clone());
                result.extend(right.inorder());
                result
            }
        }
    }

    /// 查找范围内的元素
    fn range(&self, min: &T, max: &T) -> Vec<T> {
        match self {
            BST::Empty => vec![],
            BST::Node { value, left, right } => {
                let mut result = Vec::new();

                // 如果当前值大于最小值，左子树可能有结果
                if value > min {
                    result.extend(left.range(min, max));
                }

                // 检查当前值是否在范围内
                if value >= min && value <= max {
                    result.push(value.clone());
                }

                // 如果当前值小于最大值，右子树可能有结果
                if value < max {
                    result.extend(right.range(min, max));
                }

                result
            }
        }
    }

    /// 树的高度
    fn height(&self) -> usize {
        match self {
            BST::Empty => 0,
            BST::Node { left, right, .. } => {
                1 + left.height().max(right.height())
            }
        }
    }

    /// 判断是否平衡（高度差不超过1）
    fn is_balanced(&self) -> bool {
        match self {
            BST::Empty => true,
            BST::Node { left, right, .. } => {
                let lh = left.height() as i32;
                let rh = right.height() as i32;
                (lh - rh).abs() <= 1 && left.is_balanced() && right.is_balanced()
            }
        }
    }
}

fn demonstrate_bst() {
    let mut tree = BST::new();

    for &value in &[5, 3, 7, 1, 4, 6, 8, 2] {
        tree.insert(value);
    }

    println!("中序遍历: {:?}", tree.inorder());
    println!("包含 4: {}", tree.contains(&4));
    println!("包含 9: {}", tree.contains(&9));
    println!("最小值: {:?}", tree.min());
    println!("最大值: {:?}", tree.max());
    println!("范围 [3, 6]: {:?}", tree.range(&3, &6));
    println!("树高度: {}", tree.height());
    println!("是否平衡: {}", tree.is_balanced());
}
```

## 最佳实践

### 优先使用穷尽匹配

```rust
enum Status {
    Active,
    Inactive,
    Pending,
    Suspended,
}

// 好的做法：显式处理所有情况
fn handle_status_good(status: Status) -> &'static str {
    match status {
        Status::Active => "活跃",
        Status::Inactive => "非活跃",
        Status::Pending => "待处理",
        Status::Suspended => "已暂停",
    }
}

// 避免的做法：通配符可能掩盖新增变体
fn handle_status_bad(status: Status) -> &'static str {
    match status {
        Status::Active => "活跃",
        _ => "其他",  // 新增状态会被静默忽略
    }
}

// 如果确实需要通配符，使用 #[non_exhaustive] 提供意图
#[non_exhaustive]
enum ExtensibleStatus {
    Active,
    Inactive,
}
```

### 合理使用 if let 和 let-else

```rust
// 适合 if let：只关心一种情况
fn process_if_single(opt: Option<i32>) {
    if let Some(value) = opt {
        println!("处理值: {}", value);
    }
}

// 适合 let-else：需要提前返回
fn parse_config(input: &str) -> Result<Config, &'static str> {
    let Some(name) = input.split('=').next() else {
        return Err("缺少名称");
    };

    let Some(value) = input.split('=').nth(1) else {
        return Err("缺少值");
    };

    Ok(Config {
        name: name.to_string(),
        value: value.to_string()
    })
}

struct Config {
    name: String,
    value: String,
}
```

### 避免过度嵌套的模式

```rust
// 避免的做法：深层嵌套难以阅读
fn complex_bad(data: Option<Result<Vec<i32>, String>>) {
    match data {
        Some(Ok(vec)) => match vec.as_slice() {
            [first, rest @ ..] if *first > 0 => {
                println!("正数开头: {}", first);
            }
            _ => {}
        },
        _ => {}
    }
}

// 好的做法：分解为多个步骤
fn complex_good(data: Option<Result<Vec<i32>, String>>) {
    let Some(Ok(vec)) = data else { return };
    let [first, rest @ ..] = vec.as_slice() else { return };

    if *first > 0 {
        println!("正数开头: {}", first);
    }
}
```

### 善用 @ 绑定进行调试和日志

```rust
#[derive(Debug)]
enum Event {
    Critical { id: u32, message: String },
    Normal { id: u32, data: Vec<u8> },
    Unknown,
}

fn handle_critical(evt: &Event) {
    println!("处理关键事件: {:?}", evt);
}

fn handle_normal(id: u32, data: Vec<u8>) {
    println!("处理普通事件: {} with {} bytes", id, data.len());
}

fn process_with_logging(event: Event) {
    match event {
        // 捕获整个值用于日志
        evt @ Event::Critical { .. } => {
            println!("处理关键事件: {:?}", evt);
            handle_critical(&evt);
        }
        // 正常处理
        Event::Normal { id, data } => {
            handle_normal(id, data);
        }
        // 捕获未知事件
        unknown @ _ => {
            println!("未知事件类型: {:?}", unknown);
        }
    }
}
```

### 使用 matches! 宏简化布尔检查

```rust
enum Permission {
    Admin,
    User { level: u8 },
    Guest,
}

// 使用 matches! 简化判断
fn is_privileged(perm: &Permission) -> bool {
    matches!(perm, Permission::Admin | Permission::User { level: 5.. })
}

// 在迭代器中使用
fn count_admins(perms: &[Permission]) -> usize {
    perms.iter().filter(|p| matches!(p, Permission::Admin)).count()
}

// 结合守卫
fn has_write_access(perm: &Permission, resource: &str) -> bool {
    matches!(
        perm,
        Permission::Admin | Permission::User { level } if *level >= 3
    ) && !resource.starts_with("readonly/")
}
```

## 常见陷阱

### 陷阱 1: 守卫中的所有权问题

```rust
struct Data {
    value: String,
}

fn problematic_guard(data: Option<Data>) {
    // 错误：守卫中移动了值
    // match data {
    //     Some(d) if d.value.len() > 5 => {
    //         // d 已被部分移动
    //         println!("{}", d.value);  // 错误！
    //     }
    //     _ => {}
    // }

    // 正确：使用引用
    match &data {
        Some(d) if d.value.len() > 5 => {
            println!("{}", d.value);
        }
        _ => {}
    }
}
```

### 陷阱 2: or 模式中的绑定不一致

```rust
enum Value {
    Int(i32),
    Float(f64),
    Text(String),
}

fn process_value(v: Value) {
    // 错误：or 模式中绑定的类型不一致
    // match v {
    //     Value::Int(n) | Value::Float(n) => {  // n 是不同类型
    //         println!("{}", n);
    //     }
    //     _ => {}
    // }

    // 正确：分开处理或转换类型
    match v {
        Value::Int(n) => println!("整数: {}", n),
        Value::Float(n) => println!("浮点: {}", n),
        Value::Text(s) => println!("文本: {}", s),
    }
}
```

### 陷阱 3: 切片模式的歧义

```rust
fn ambiguous_slice(data: &[i32]) {
    // 可能的歧义：这些模式有重叠
    match data {
        [x] => println!("单元素"),
        [_, ..] => println!("至少一个"),  // 与上面重叠
        [] => println!("空"),
    }

    // 正确：确保模式不重叠或按正确顺序
    match data {
        [] => println!("空"),
        [x] => println!("单元素: {}", x),
        [first, rest @ ..] => println!("多元素，首: {}", first),
    }
}
```

### 陷阱 4: 忘记 @ 绑定的作用域

```rust
fn binding_scope(opt: Option<i32>) {
    match opt {
        // n 只在这个分支有效
        Some(n @ 1..=10) => {
            println!("小数: {}", n);
        }
        Some(n) => {
            // 这里也定义了 n，但与上面的 n 无关
            println!("其他: {}", n);
        }
        None => {
            // 这里 n 不存在
            // println!("{}", n);  // 错误！
        }
    }
}
```

### 陷阱 5: ref 和 mut 的混淆

```rust
fn ref_mut_confusion() {
    let mut data = (String::from("hello"), 42);

    // ref 创建不可变引用
    let (ref s, n) = data;
    // s.push_str(" world");  // 错误：s 是不可变引用

    // ref mut 创建可变引用
    let (ref mut s, ref mut n) = data;
    s.push_str(" world");
    *n += 1;

    println!("{}, {}", data.0, data.1);
}
```

## 性能考量

### match 的编译优化

Rust 编译器对 match 表达式进行了大量优化：

```rust
enum Direction {
    North,
    South,
    East,
    West,
}

fn direction_to_angle(dir: Direction) -> i32 {
    // 编译器将此优化为跳转表
    match dir {
        Direction::North => 0,
        Direction::South => 180,
        Direction::East => 90,
        Direction::West => 270,
    }
}

// 对于连续值的枚举，编译器生成直接计算
enum SmallNumber {
    Zero = 0,
    One = 1,
    Two = 2,
    Three = 3,
}

fn double_number(n: SmallNumber) -> i32 {
    // 可能被优化为: n as i32 * 2
    match n {
        SmallNumber::Zero => 0,
        SmallNumber::One => 2,
        SmallNumber::Two => 4,
        SmallNumber::Three => 6,
    }
}
```

### 避免不必要的克隆

```rust
struct LargeData {
    buffer: Vec<u8>,
    metadata: String,
}

// 低效：克隆大数据
fn process_inefficient(data: LargeData) -> String {
    match data {
        LargeData { metadata, .. } => metadata.clone(),  // 不必要的克隆
    }
}

// 高效：使用解构移动
fn process_efficient(data: LargeData) -> String {
    match data {
        LargeData { metadata, .. } => metadata,  // 直接移动
    }
}

// 高效：使用引用
fn process_ref(data: &LargeData) -> &str {
    match data {
        LargeData { metadata, .. } => metadata,  // 返回引用
    }
}
```

### 守卫的性能影响

```rust
// 守卫在每次匹配时都会求值
fn expensive_guard(data: &[i32]) -> i32 {
    match data {
        // 每次匹配都调用 expensive_check
        [x, ..] if expensive_check(x) => *x,
        [_, rest @ ..] => rest.iter().sum(),
        [] => 0,
    }
}

fn expensive_check(x: &i32) -> bool {
    // 模拟昂贵的检查
    std::thread::sleep(std::time::Duration::from_millis(1));
    *x > 0
}

// 优化：预计算或重构逻辑
fn optimized(data: &[i32]) -> i32 {
    match data.first() {
        Some(x) if expensive_check(x) => *x,
        _ => data.iter().skip(1).sum(),
    }
}
```

### 切片模式的内存考量

```rust
// 切片模式不会分配新内存
fn slice_pattern_memory(data: &[i32]) {
    match data {
        // rest 是切片引用，不复制数据
        [first, rest @ ..] => {
            println!("首: {}, 剩余长度: {}", first, rest.len());
        }
        [] => {}
    }
}

// 但转换为 Vec 会分配
fn slice_to_vec(data: &[i32]) -> Vec<i32> {
    match data {
        [_, rest @ ..] => rest.to_vec(),  // 分配新 Vec
        [] => vec![],
    }
}
```

## 实战场景

### 场景 1: HTTP 请求路由

```rust
use std::collections::HashMap;

#[derive(Debug)]
enum HttpMethod {
    Get,
    Post,
    Put,
    Delete,
    Patch,
}

#[derive(Debug)]
struct Request {
    method: HttpMethod,
    path: String,
    query: HashMap<String, String>,
    body: Option<String>,
}

#[derive(Debug)]
enum Response {
    Ok { body: String, content_type: String },
    Created { id: String, location: String },
    NotFound { message: String },
    BadRequest { errors: Vec<String> },
    MethodNotAllowed,
    InternalError,
}

fn route_request(req: Request) -> Response {
    let path_segments: Vec<&str> = req.path.trim_matches('/').split('/').collect();

    match (&req.method, path_segments.as_slice()) {
        // GET /
        (HttpMethod::Get, [""]) | (HttpMethod::Get, []) => {
            Response::Ok {
                body: "Welcome to API".to_string(),
                content_type: "text/plain".to_string(),
            }
        }

        // GET /users
        (HttpMethod::Get, ["users"]) => {
            let limit = req.query.get("limit")
                .and_then(|s| s.parse().ok())
                .unwrap_or(10);
            Response::Ok {
                body: format!("List users (limit: {})", limit),
                content_type: "application/json".to_string(),
            }
        }

        // GET /users/:id
        (HttpMethod::Get, ["users", id]) => {
            Response::Ok {
                body: format!("User {}", id),
                content_type: "application/json".to_string(),
            }
        }

        // POST /users
        (HttpMethod::Post, ["users"]) => {
            match &req.body {
                Some(body) if !body.is_empty() => Response::Created {
                    id: "new-user-id".to_string(),
                    location: "/users/new-user-id".to_string(),
                },
                _ => Response::BadRequest {
                    errors: vec!["Body is required".to_string()],
                },
            }
        }

        // PUT /users/:id
        (HttpMethod::Put | HttpMethod::Patch, ["users", id]) => {
            match &req.body {
                Some(_) => Response::Ok {
                    body: format!("Updated user {}", id),
                    content_type: "application/json".to_string(),
                },
                None => Response::BadRequest {
                    errors: vec!["Body is required".to_string()],
                },
            }
        }

        // DELETE /users/:id
        (HttpMethod::Delete, ["users", id]) => {
            Response::Ok {
                body: format!("Deleted user {}", id),
                content_type: "application/json".to_string(),
            }
        }

        // 嵌套资源: GET /users/:id/posts
        (HttpMethod::Get, ["users", user_id, "posts"]) => {
            Response::Ok {
                body: format!("Posts for user {}", user_id),
                content_type: "application/json".to_string(),
            }
        }

        // 嵌套资源: GET /users/:id/posts/:post_id
        (HttpMethod::Get, ["users", user_id, "posts", post_id]) => {
            Response::Ok {
                body: format!("Post {} by user {}", post_id, user_id),
                content_type: "application/json".to_string(),
            }
        }

        // 路径存在但方法不允许
        (_, ["users", ..]) => Response::MethodNotAllowed,

        // 404
        _ => Response::NotFound {
            message: format!("Path not found: {}", req.path),
        },
    }
}
```

### 场景 2: 编译器词法分析

```rust
#[derive(Debug, Clone, PartialEq)]
enum Token {
    // 字面量
    Integer(i64),
    Float(f64),
    String(String),
    Bool(bool),

    // 标识符和关键字
    Identifier(String),
    Keyword(Keyword),

    // 运算符
    Plus, Minus, Star, Slash, Percent,
    Eq, Ne, Lt, Le, Gt, Ge,
    And, Or, Not,
    Assign,

    // 分隔符
    LParen, RParen,
    LBrace, RBrace,
    LBracket, RBracket,
    Comma, Semicolon, Colon,
    Arrow,

    // 特殊
    Eof,
    Error(String),
}

#[derive(Debug, Clone, PartialEq)]
enum Keyword {
    Let, Mut, Fn, If, Else, While, For, Return,
    Struct, Enum, Impl, Trait, Pub, Use,
    True, False, None,
}

struct Lexer<'a> {
    input: &'a str,
    pos: usize,
}

impl<'a> Lexer<'a> {
    fn new(input: &'a str) -> Self {
        Self { input, pos: 0 }
    }

    fn peek(&self) -> Option<char> {
        self.input[self.pos..].chars().next()
    }

    fn peek_next(&self) -> Option<char> {
        self.input[self.pos..].chars().nth(1)
    }

    fn advance(&mut self) -> Option<char> {
        let c = self.peek()?;
        self.pos += c.len_utf8();
        Some(c)
    }

    fn skip_whitespace(&mut self) {
        while matches!(self.peek(), Some(c) if c.is_whitespace()) {
            self.advance();
        }
    }

    fn next_token(&mut self) -> Token {
        self.skip_whitespace();

        match self.peek() {
            None => Token::Eof,

            // 数字
            Some(c @ '0'..='9') => self.read_number(),

            // 标识符或关键字
            Some(c) if c.is_alphabetic() || c == '_' => self.read_identifier(),

            // 字符串
            Some('"') => self.read_string(),

            // 两字符运算符
            Some('=') => match self.peek_next() {
                Some('=') => { self.advance(); self.advance(); Token::Eq }
                Some('>') => { self.advance(); self.advance(); Token::Arrow }
                _ => { self.advance(); Token::Assign }
            },
            Some('!') => match self.peek_next() {
                Some('=') => { self.advance(); self.advance(); Token::Ne }
                _ => { self.advance(); Token::Not }
            },
            Some('<') => match self.peek_next() {
                Some('=') => { self.advance(); self.advance(); Token::Le }
                _ => { self.advance(); Token::Lt }
            },
            Some('>') => match self.peek_next() {
                Some('=') => { self.advance(); self.advance(); Token::Ge }
                _ => { self.advance(); Token::Gt }
            },
            Some('&') => match self.peek_next() {
                Some('&') => { self.advance(); self.advance(); Token::And }
                _ => { self.advance(); Token::Error("Expected &&".to_string()) }
            },
            Some('|') => match self.peek_next() {
                Some('|') => { self.advance(); self.advance(); Token::Or }
                _ => { self.advance(); Token::Error("Expected ||".to_string()) }
            },
            Some('-') => match self.peek_next() {
                Some('>') => { self.advance(); self.advance(); Token::Arrow }
                _ => { self.advance(); Token::Minus }
            },

            // 单字符运算符
            Some('+') => { self.advance(); Token::Plus }
            Some('*') => { self.advance(); Token::Star }
            Some('/') => { self.advance(); Token::Slash }
            Some('%') => { self.advance(); Token::Percent }

            // 分隔符
            Some('(') => { self.advance(); Token::LParen }
            Some(')') => { self.advance(); Token::RParen }
            Some('{') => { self.advance(); Token::LBrace }
            Some('}') => { self.advance(); Token::RBrace }
            Some('[') => { self.advance(); Token::LBracket }
            Some(']') => { self.advance(); Token::RBracket }
            Some(',') => { self.advance(); Token::Comma }
            Some(';') => { self.advance(); Token::Semicolon }
            Some(':') => { self.advance(); Token::Colon }

            // 未知字符
            Some(c) => {
                self.advance();
                Token::Error(format!("Unexpected character: {}", c))
            }
        }
    }

    fn read_number(&mut self) -> Token {
        let start = self.pos;
        let mut has_dot = false;

        while let Some(c) = self.peek() {
            match c {
                '0'..='9' => { self.advance(); }
                '.' if !has_dot => {
                    has_dot = true;
                    self.advance();
                }
                _ => break,
            }
        }

        let num_str = &self.input[start..self.pos];
        if has_dot {
            num_str.parse().map(Token::Float)
                .unwrap_or_else(|_| Token::Error("Invalid float".to_string()))
        } else {
            num_str.parse().map(Token::Integer)
                .unwrap_or_else(|_| Token::Error("Invalid integer".to_string()))
        }
    }

    fn read_identifier(&mut self) -> Token {
        let start = self.pos;

        while let Some(c) = self.peek() {
            if c.is_alphanumeric() || c == '_' {
                self.advance();
            } else {
                break;
            }
        }

        let ident = &self.input[start..self.pos];

        // 关键字检查
        match ident {
            "let" => Token::Keyword(Keyword::Let),
            "mut" => Token::Keyword(Keyword::Mut),
            "fn" => Token::Keyword(Keyword::Fn),
            "if" => Token::Keyword(Keyword::If),
            "else" => Token::Keyword(Keyword::Else),
            "while" => Token::Keyword(Keyword::While),
            "for" => Token::Keyword(Keyword::For),
            "return" => Token::Keyword(Keyword::Return),
            "struct" => Token::Keyword(Keyword::Struct),
            "enum" => Token::Keyword(Keyword::Enum),
            "impl" => Token::Keyword(Keyword::Impl),
            "trait" => Token::Keyword(Keyword::Trait),
            "pub" => Token::Keyword(Keyword::Pub),
            "use" => Token::Keyword(Keyword::Use),
            "true" => Token::Bool(true),
            "false" => Token::Bool(false),
            _ => Token::Identifier(ident.to_string()),
        }
    }

    fn read_string(&mut self) -> Token {
        self.advance(); // consume opening "
        let start = self.pos;

        while let Some(c) = self.peek() {
            match c {
                '"' => {
                    let s = self.input[start..self.pos].to_string();
                    self.advance();
                    return Token::String(s);
                }
                '\\' => {
                    self.advance();
                    self.advance(); // skip escaped char
                }
                _ => { self.advance(); }
            }
        }

        Token::Error("Unterminated string".to_string())
    }

    fn tokenize(&mut self) -> Vec<Token> {
        let mut tokens = Vec::new();
        loop {
            let token = self.next_token();
            let is_eof = matches!(token, Token::Eof);
            tokens.push(token);
            if is_eof { break; }
        }
        tokens
    }
}

fn demonstrate_lexer() {
    let code = r#"
        fn calculate(x: i32, y: i32) -> i32 {
            let result = x + y * 2;
            if result > 100 {
                return 100;
            }
            result
        }
    "#;

    let mut lexer = Lexer::new(code);
    let tokens = lexer.tokenize();

    for token in tokens {
        println!("{:?}", token);
    }
}
```

### 场景 3: 配置文件解析

```rust
use std::collections::HashMap;

#[derive(Debug, Clone)]
enum ConfigValue {
    String(String),
    Integer(i64),
    Float(f64),
    Boolean(bool),
    Array(Vec<ConfigValue>),
    Object(HashMap<String, ConfigValue>),
    Null,
}

impl ConfigValue {
    fn as_str(&self) -> Option<&str> {
        match self {
            ConfigValue::String(s) => Some(s),
            _ => None,
        }
    }

    fn as_int(&self) -> Option<i64> {
        match self {
            ConfigValue::Integer(n) => Some(*n),
            ConfigValue::Float(f) => Some(*f as i64),
            _ => None,
        }
    }

    fn as_bool(&self) -> Option<bool> {
        match self {
            ConfigValue::Boolean(b) => Some(*b),
            _ => None,
        }
    }

    fn get(&self, key: &str) -> Option<&ConfigValue> {
        match self {
            ConfigValue::Object(map) => map.get(key),
            _ => None,
        }
    }

    fn index(&self, idx: usize) -> Option<&ConfigValue> {
        match self {
            ConfigValue::Array(arr) => arr.get(idx),
            _ => None,
        }
    }
}

/// 使用路径访问嵌套配置
fn get_path<'a>(config: &'a ConfigValue, path: &[&str]) -> Option<&'a ConfigValue> {
    match (config, path) {
        (value, []) => Some(value),
        (ConfigValue::Object(map), [key, rest @ ..]) => {
            map.get(*key).and_then(|v| get_path(v, rest))
        }
        (ConfigValue::Array(arr), [index, rest @ ..]) => {
            index.parse::<usize>().ok()
                .and_then(|i| arr.get(i))
                .and_then(|v| get_path(v, rest))
        }
        _ => None,
    }
}

/// 验证配置结构
fn validate_config(config: &ConfigValue) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    // 检查必需字段
    let required_fields = ["name", "version", "server"];
    for field in required_fields {
        if config.get(field).is_none() {
            errors.push(format!("缺少必需字段: {}", field));
        }
    }

    // 验证 server 配置
    if let Some(server) = config.get("server") {
        match server {
            ConfigValue::Object(map) => {
                // 检查 host
                match map.get("host") {
                    Some(ConfigValue::String(host)) if !host.is_empty() => {}
                    Some(ConfigValue::String(_)) => {
                        errors.push("server.host 不能为空".to_string());
                    }
                    None => errors.push("缺少 server.host".to_string()),
                    _ => errors.push("server.host 必须是字符串".to_string()),
                }

                // 检查 port
                match map.get("port") {
                    Some(ConfigValue::Integer(port @ 1..=65535)) => {}
                    Some(ConfigValue::Integer(_)) => {
                        errors.push("server.port 必须在 1-65535 范围内".to_string());
                    }
                    None => errors.push("缺少 server.port".to_string()),
                    _ => errors.push("server.port 必须是整数".to_string()),
                }
            }
            _ => errors.push("server 必须是对象".to_string()),
        }
    }

    // 验证 features 数组（如果存在）
    if let Some(features) = config.get("features") {
        match features {
            ConfigValue::Array(arr) => {
                for (i, feature) in arr.iter().enumerate() {
                    match feature {
                        ConfigValue::String(s) if s.chars().all(|c| c.is_alphanumeric() || c == '_') => {}
                        ConfigValue::String(_) => {
                            errors.push(format!("features[{}] 包含无效字符", i));
                        }
                        _ => {
                            errors.push(format!("features[{}] 必须是字符串", i));
                        }
                    }
                }
            }
            _ => errors.push("features 必须是数组".to_string()),
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

fn demonstrate_config() {
    let mut server = HashMap::new();
    server.insert("host".to_string(), ConfigValue::String("localhost".to_string()));
    server.insert("port".to_string(), ConfigValue::Integer(8080));
    server.insert("ssl".to_string(), ConfigValue::Boolean(true));

    let mut config = HashMap::new();
    config.insert("name".to_string(), ConfigValue::String("my-app".to_string()));
    config.insert("version".to_string(), ConfigValue::String("1.0.0".to_string()));
    config.insert("server".to_string(), ConfigValue::Object(server));
    config.insert("features".to_string(), ConfigValue::Array(vec![
        ConfigValue::String("auth".to_string()),
        ConfigValue::String("logging".to_string()),
    ]));

    let config = ConfigValue::Object(config);

    // 路径访问
    if let Some(port) = get_path(&config, &["server", "port"]) {
        println!("服务器端口: {:?}", port);
    }

    // 验证
    match validate_config(&config) {
        Ok(()) => println!("配置有效"),
        Err(errors) => {
            for e in errors {
                println!("验证错误: {}", e);
            }
        }
    }
}
```

## 面试要点

### 问题 1: 解释 Rust 模式匹配的穷尽性检查

**答案要点**:
- 编译器使用可用性矩阵算法检查所有可能的值是否被覆盖
- 对于枚举，检查所有变体是否都有对应的匹配分支
- 通配符 `_` 可以匹配任何未被覆盖的情况
- `#[non_exhaustive]` 属性可以标记枚举在未来可能增加变体
- 穷尽性检查是编译时进行的，不影响运行时性能

### 问题 2: ref 和 & 在模式匹配中的区别

**答案要点**:
```rust
let value = String::from("hello");

// & 用于匹配引用
let reference = &value;
match reference {
    s => println!("{}", s),  // s 是 &String
}

// ref 用于在匹配时创建引用
match value {
    ref s => println!("{}", s),  // s 是 &String，value 未被移动
}
```

- `&` 用于解构已有的引用
- `ref` 用于在解构时创建引用
- `ref` 允许在匹配值类型时借用而非移动

### 问题 3: @ 绑定有什么用途？何时使用？

**答案要点**:
- 在测试模式的同时绑定整个值或部分值到变量
- 用于需要同时检查条件和使用值的场景
- 常用于范围检查、日志记录、调试

```rust
match value {
    n @ 1..=10 => println!("小数字: {}", n),
    all @ (x, y, z) => println!("元组 {:?} 的组成: {}, {}, {}", all, x, y, z),
}
```

### 问题 4: 模式守卫的性能影响

**答案要点**:
- 守卫在模式匹配后每次都会求值
- 如果守卫中有昂贵的计算，会影响性能
- 建议将昂贵的计算提取到 match 之前
- 编译器无法对守卫进行跨分支优化

### 问题 5: 如何处理嵌套 Option 的匹配？

**答案要点**:
```rust
let nested: Option<Option<i32>> = Some(Some(42));

// 方法 1: 嵌套 match
match nested {
    Some(Some(n)) => println!("{}", n),
    Some(None) => println!("内层为空"),
    None => println!("外层为空"),
}

// 方法 2: flatten
let flattened = nested.flatten();

// 方法 3: and_then
let result = nested.and_then(|inner| inner);
```

## 延伸阅读

### 官方文档

- [The Rust Programming Language - Patterns](https://doc.rust-lang.org/book/ch18-00-patterns.html)
- [Rust Reference - Patterns](https://doc.rust-lang.org/reference/patterns.html)
- [Rust RFC 2005 - Match Ergonomics](https://rust-lang.github.io/rfcs/2005-match-ergonomics.html)

### 经典书籍

- 《Programming Rust, 2nd Edition》第 10 章 - 详细讲解模式与匹配
- 《Rust for Rustaceans》第 3 章 - 高级模式匹配技术
- 《Zero To Production In Rust》- 实战中的模式匹配应用

### 优质文章

- [Rust Pattern Matching Compilation](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_mir_build/build/matches/index.html) - 编译器实现细节
- [Advanced Patterns in Rust](https://www.lurklurk.org/effective-rust/match.html) - Effective Rust 系列
- [Pattern Matching Tips](https://rust-unofficial.github.io/patterns/idioms/deref.html) - Rust 设计模式

### 相关 RFC

- RFC 2005: Match Ergonomics（匹配人体工程学）
- RFC 3137: Or Patterns 语法统一
- RFC 2909: let-else 语法

---

模式匹配是 Rust 类型安全性和表达力的核心支柱。深入掌握高级模式匹配技术，包括深层解构、模式守卫、@ 绑定、or 模式和 ref/ref mut，将使你能够编写更加优雅、安全、高效的 Rust 代码。理解编译器如何优化模式匹配，以及在实际项目中合理应用这些技术，是成为高级 Rust 开发者的必经之路。
