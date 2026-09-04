---
title: Rust Pin 和 Unpin
description: 深入理解 Rust 的 Pin 和 Unpin 类型，掌握内存固定的原理、应用场景和最佳实践
track: rust
section: ownership-borrowing
difficulty: advanced
tags:
  - Rust
  - Pin
  - Unpin
  - 内存管理
  - 异步编程
  - 自引用
status: imported
origin: old/src/content/docs/rust/pin.zh.md
divergence: 0.137
issues:
  - order-mismatch
legacy:
  category: Rust
  subcategory: 高级特性
  order: 20
  lastUpdated: 2026-01-07
---

Pin 和 Unpin 是 Rust 中用来管理对象在内存中移动的高级特性。当你需要创建自引用数据结构或使用某些异步运行时时，理解 Pin 和 Unpin 变得至关重要。

## 概念解释

### 什么是 Pin

Pin 是一个指针包装器，它保证被指向的值在内存中不会被移动。Pin 的定义如下：

```rust
#[lang = "pin"]
#[repr(transparent)]
pub struct Pin<P> {
    pointer: P,
}
```

Pin 包装任何指针类型 `P`（如 `&T`、`&mut T`、`Box<T>` 等），并通过类型系统保证：

- 只要 Pin 存在，被指向的值就无法被移动
- Pin 提供受限的内存访问方式，防止不安全的值移动

### Pin 与移动语义的关系

在 Rust 中，值默认是可以移动的：

```rust
let x = String::from("hello");
let y = x;  // x 被移动到 y，x 的内存地址可能改变
```

然而，某些数据结构（如自引用结构体）依赖固定的内存地址：

```rust
struct SelfRef {
    value: String,
    ptr: *const String,  // 指向 value
}

let mut s = SelfRef {
    value: String::from("hello"),
    ptr: std::ptr::null(),
};
s.ptr = &s.value;

let t = s;  // 移动会导致指针失效！
```

### 什么是 Unpin

Unpin 是一个标记 trait，表示类型可以安全地移动，即使它被 Pin 包装。

```rust
pub auto trait Unpin {}
```

- 大多数类型都自动实现 Unpin（所以可以安全移动）
- 只有某些特定类型需要 `!Unpin`（不实现 Unpin），通常是那些包含自引用的类型

## 核心原理

### Pin 的四个关键规则

#### 规则 1：Pin 无法以 Unpin 方式获得 mut 引用

```rust
fn pin_rules_1() {
    let mut x = String::from("hello");
    let mut pin_x = std::pin::Pin::new(&mut x);

    // 这会编译错误，因为 String 是 Unpin
    // let r: &mut String = &mut *pin_x;

    // 但你可以通过 Pin 的方法获得受限的访问
    let r: Pin<&mut String> = pin_x;
}
```

#### 规则 2：对于 Unpin 类型，Pin 是透明的

```rust
fn pin_rules_2() {
    let mut x = 5;
    let pin_x = std::pin::Pin::new(&mut x);

    // 对于 Unpin 类型（如 i32），可以正常访问
    let r: &mut i32 = Pin::into_inner(pin_x);
}
```

#### 规则 3：Pin 可以构造不可移动的不变引用

```rust
fn pin_rules_3() {
    struct NotUnpin {
        ptr: *mut String,
        _phantom: std::marker::PhantomPinned,
    }

    let mut value = String::from("hello");
    let mut pinned = Box::pin(NotUnpin {
        ptr: &mut value,
        _phantom: std::marker::PhantomPinned,
    });

    // pinned 被固定在内存中，无法被安全地移动
}
```

#### 规则 4：从 Pin<T> 获得 Pin<U>（投影）

```rust
use std::pin::Pin;

struct Outer {
    inner: String,
}

impl Outer {
    fn project_field(self: Pin<&mut Self>) -> Pin<&mut String> {
        // 安全地投影到字段（假设该字段是 Unpin）
        unsafe { Pin::map_unchecked_mut(self, |t| &mut t.inner) }
    }
}
```

### PhantomPinned

PhantomPinned 是一个零大小类型，用来表示"此类型不应该实现 Unpin"：

```rust
use std::marker::PhantomPinned;

struct SelfReferential {
    data: String,
    pointer: *const String,
    _pin: PhantomPinned,
}

// 编译器会自动让 SelfReferential 成为 !Unpin
// 因为它包含 PhantomPinned
```

### Pin 的内存布局

Pin 是一个透明包装器，运行时零成本：

```rust
use std::mem;

fn pin_layout() {
    // Pin<&T> 与 &T 有相同的大小和布局
    assert_eq!(mem::size_of::<Pin<&i32>>(), mem::size_of::<&i32>());

    // Pin<Box<T>> 与 Box<T> 有相同的大小和布局
    assert_eq!(
        mem::size_of::<Pin<Box<i32>>>(),
        mem::size_of::<Box<i32>>()
    );
}
```

## 核心要点

### Pin 不保证不可变性，只保证不可移动性

```rust
use std::pin::Pin;

fn point_1() {
    let mut value = String::from("hello");
    let mut pin_value = Pin::new(&mut value);

    // 对于 Unpin 类型，仍然可以通过 get_mut 修改
    Pin::get_mut(&mut pin_value).push_str(" world");
    println!("{}", value);  // "hello world"
}
```

### 大多数类型都是 Unpin

```rust
fn point_2() {
    // 原始类型、String、Vec、Box 等都是 Unpin
    let x = 5;
    let px = Pin::new(&x);  // Pin<&i32>

    let s = String::from("hello");
    let ps = Pin::new(&s);  // Pin<&String>

    // 对于 Unpin 类型，Pin 不提供额外的安全保证
}
```

### 只有包含 !Unpin 类型的结构体才是 !Unpin

```rust
use std::marker::PhantomPinned;

// 这个结构体是 !Unpin（因为包含 PhantomPinned）
struct NeverMove {
    data: u32,
    _pin: PhantomPinned,
}

// 这个结构体是 Unpin（即使包含指针）
struct CanMove {
    ptr: *const u32,
}

fn point_3() {
    // CanMove 仍然是 Unpin，因为原始指针被认为是 Unpin
    let c = CanMove { ptr: std::ptr::null() };
    let pc = Pin::new(&c);
}
```

### Pin 在异步编程中至关重要

```rust
use std::pin::Pin;
use std::task::{Context, Poll};
use std::future::Future;

trait MyFuture {
    type Output;

    // Future trait 需要 Pin<&mut Self>
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

### Pin 与栈和堆的关系

```rust
fn point_5() {
    // 栈上的 Pin：通常通过 Pin::new 创建
    let mut x = String::from("hello");
    let pin_stack = Pin::new(&mut x);
    // 当 pin_stack 被丢弃时，限制解除

    // 堆上的 Pin：通过 Box::pin 创建，更强的保证
    let pin_heap = Box::pin(String::from("world"));
    // pin_heap 被固定在堆上，不能被移动
}
```

## 代码示例

### 示例 1：基本 Pin 用法

```rust
use std::pin::Pin;

fn example_1_basic_pin() {
    let mut data = String::from("hello");
    let mut pin_data = Pin::new(&mut data);

    // 对于 Unpin 类型，可以获得可变引用
    Pin::get_mut(&mut pin_data).push_str(" world");

    println!("{}", data);  // "hello world"
}

fn main() {
    example_1_basic_pin();
}
```

### 示例 2：自引用结构体

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

struct SelfReferential {
    value: String,
    // 指向自身 value 字段
    pointer: Option<*const String>,
    _pin: PhantomPinned,
}

impl SelfReferential {
    fn new(value: String) -> Pin<Box<Self>> {
        let mut boxed = Box::pin(SelfReferential {
            value,
            pointer: None,
            _pin: PhantomPinned,
        });

        // 初始化指针
        unsafe {
            let ptr = &boxed.value as *const String;
            Pin::as_mut(&mut boxed).pointer = Some(ptr);
        }

        boxed
    }

    fn get_reference(&self) -> &String {
        unsafe {
            self.pointer.unwrap().as_ref().unwrap()
        }
    }
}

fn example_2_self_referential() {
    let sr = SelfReferential::new(String::from("hello"));
    println!("{}", sr.get_reference());
}

fn main() {
    example_2_self_referential();
}
```

### 示例 3：自定义实现 !Unpin 的类型

```rust
use std::marker::PhantomPinned;
use std::pin::Pin;

#[derive(Debug)]
struct Node {
    id: u32,
    _pin: PhantomPinned,
}

impl Node {
    fn new(id: u32) -> Pin<Box<Self>> {
        Box::pin(Node {
            id,
            _pin: PhantomPinned,
        })
    }
}

fn example_3_custom_unpin() {
    let node = Node::new(42);
    println!("Node id: {}", node.id);

    // 无法移动 node，因为它是 !Unpin
    // let moved_node = *node;  // 编译错误
}

fn main() {
    example_3_custom_unpin();
}
```

### 示例 4：Pin 的投影

```rust
use std::pin::Pin;

struct Container {
    value: String,
}

impl Container {
    // 投影到不可变字段
    fn get_value(self: Pin<&Self>) -> &String {
        &self.value
    }

    // 投影到可变字段（不安全的）
    fn get_value_mut(self: Pin<&mut Self>) -> Pin<&mut String> {
        // 必须验证字段是 Unpin 或安全移动
        unsafe { Pin::map_unchecked_mut(self, |t| &mut t.value) }
    }
}

fn example_4_projection() {
    let mut container = Box::pin(Container {
        value: String::from("hello"),
    });

    let value_ref = container.as_ref().get_value();
    println!("{}", value_ref);  // "hello"

    // 投影到可变引用
    let value_mut = container.as_mut().get_value_mut();
    value_mut.push_str(" world");
}

fn main() {
    example_4_projection();
}
```

### 示例 5：异步函数中的 Pin

```rust
use std::pin::Pin;
use std::future::Future;
use std::task::{Context, Poll};

// 简化的 Future 实现
struct MyFuture {
    completed: bool,
}

impl Future for MyFuture {
    type Output = String;

    fn poll(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
        if self.completed {
            Poll::Ready(String::from("Done"))
        } else {
            self.completed = true;
            Poll::Pending
        }
    }
}

fn example_5_async_future() {
    let future = MyFuture { completed: false };
    let mut pin_future = Box::pin(future);

    // 通常由异步运行时调用
    // let poll_result = Pin::as_mut(&mut pin_future).poll(&mut context);
}

fn main() {
    example_5_async_future();
}
```

### 示例 6：Pin 与 Drop

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

struct PinnedDropper {
    name: String,
    _pin: PhantomPinned,
}

impl Drop for PinnedDropper {
    fn drop(&mut self) {
        println!("Dropping: {}", self.name);
    }
}

fn example_6_pin_drop() {
    let pinned = Box::pin(PinnedDropper {
        name: String::from("my_data"),
        _pin: PhantomPinned,
    });

    // pinned 离开作用域时会被正确销毁
}

fn main() {
    example_6_pin_drop();
}
```

## 最佳实践

### 优先使用 Box::pin 用于堆分配

```rust
use std::pin::Pin;

// 推荐：使用 Box::pin 将值固定在堆上
fn best_practice_1() {
    let pinned = Box::pin(String::from("hello"));
    // 强力保证：pinned 无法被移动
}

// 不推荐：使用 Pin::new 进行栈上 Pin
fn not_recommended() {
    let mut data = String::from("hello");
    let pinned = Pin::new(&mut data);
    // 较弱的保证：如果 data 被移动，Pin 无法阻止
}
```

### 为 !Unpin 类型使用 PhantomPinned

```rust
use std::marker::PhantomPinned;

// 推荐
struct MyNotUnpin {
    data: u32,
    _pin: PhantomPinned,
}

// 避免
// struct BadNotUnpin {
//     data: u32,
//     fake_pointer: *const u32,  // 不能可靠地表示 !Unpin
// }
```

### 使用 unsafe 进行 Pin 投影时要谨慎

```rust
use std::pin::Pin;

struct Struct {
    field1: String,  // Unpin
    field2: Box<u32>,  // Unpin
}

impl Struct {
    // 安全的投影（投影到 Unpin 字段）
    fn get_field1(self: Pin<&mut Self>) -> &mut String {
        unsafe { &mut self.get_unchecked_mut().field1 }
    }

    // 投影时需要验证被投影字段是 Unpin
    fn get_field2_mut(self: Pin<&mut Self>) -> Pin<&mut Box<u32>> {
        unsafe { Pin::map_unchecked_mut(self, |t| &mut t.field2) }
    }
}
```

### 在异步代码中正确处理 Pin

```rust
use std::pin::Pin;
use std::future::Future;

// 推荐：接收 Pin<&mut Self>
async fn async_function() {
    let future = async {
        // 异步逻辑
        42
    };

    let _result = future.await;
}

// 避免
// fn bad_future<F: Future>(_f: &mut F) {
//     // 无法调用 poll，因为需要 Pin
// }
```

### 文档记录 Pin 的要求

```rust
use std::pin::Pin;

/// 处理数据的异步函数
///
/// # Pin 要求
///
/// 此函数接收 Pin<&mut self>，表示调用者保证
/// 在调用期间不会移动自身。
pub fn process(self: Pin<&mut Self>) {
    // 处理逻辑
}
```

## 常见陷阱

### 陷阱 1：混淆 Pin 和不可变性

```rust
use std::pin::Pin;

fn pitfall_1_confusion() {
    let mut s = String::from("hello");
    let pin_s = Pin::new(&mut s);

    // 错误的理解：认为 Pin 使值不可变
    // Pin 只保证不可移动，不保证不可变

    // 对于 Unpin 类型，仍然可以修改
    Pin::get_mut(&mut pin_s).push_str(" world");
    println!("{}", s);  // "hello world"
}
```

### 陷阱 2：忘记实现 !Unpin

```rust
use std::marker::PhantomPinned;

// 正确：包含 PhantomPinned 来表示 !Unpin
struct Correct {
    ptr: *const u32,
    _pin: PhantomPinned,
}

// 错误：仅使用指针无法表示 !Unpin
struct Wrong {
    ptr: *const u32,
    // 编译器仍然认为这是 Unpin
}

fn pitfall_2_unpin() {
    // Wrong 仍然可以被安全移动，这是危险的
    let w = Wrong { ptr: std::ptr::null() };
    let _w2 = w;  // 编译器允许，但可能不安全
}
```

### 陷阱 3：不当使用 unsafe 投影

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

struct Struct {
    value: String,
    pointer: Option<*const String>,
    _pin: PhantomPinned,
}

impl Struct {
    // 错误：投影不安全
    fn bad_projection(self: Pin<&mut Self>) -> &mut String {
        unsafe {
            // 这会破坏 Pin 的安全保证
            &mut self.get_unchecked_mut().value
        }
    }
}

fn pitfall_3_unsafe_projection() {
    let mut s = Box::pin(Struct {
        value: String::from("hello"),
        pointer: None,
        _pin: PhantomPinned,
    });

    // 通过不当的投影获得可移动引用是不安全的
}
```

### 陷阱 4：Pin 与集合的交互

```rust
use std::pin::Pin;

fn pitfall_4_collection() {
    // 问题：Pin 的值无法被轻易地放入集合
    let pinned = Box::pin(String::from("hello"));

    let mut vec = vec![];
    // vec.push(pinned);  // 编译错误：Vec 需要所有权，但 pinned 是 Pin

    // 解决：使用智能指针或引用的集合
    let mut vec_ref: Vec<Pin<Box<String>>> = vec![];
    vec_ref.push(pinned);
}
```

### 陷阱 5：栈上 Pin 的不稳定性

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

struct NotUnpin {
    _pin: PhantomPinned,
}

fn pitfall_5_stack_pin() {
    // 栈上 Pin 很容易被破坏
    let mut data = NotUnpin {
        _pin: PhantomPinned,
    };

    let pin_ref = Pin::new(&mut data);
    // 虽然 pin_ref 保证 data 不被移动...

    // 但这个保证只对 pin_ref 的作用域有效
    // 当 pin_ref 离开作用域时，data 可以被移动

    // 推荐：使用 Box::pin 获得更强的保证
    let pin_heap = Box::pin(NotUnpin {
        _pin: PhantomPinned,
    });
}
```

## 性能考量

### Pin 的零成本抽象

```rust
use std::pin::Pin;
use std::mem;

fn performance_1_zero_cost() {
    // Pin<&T> 与 &T 相同大小
    assert_eq!(mem::size_of::<Pin<&i32>>(), mem::size_of::<&i32>());

    // Pin<&mut T> 与 &mut T 相同大小
    assert_eq!(mem::size_of::<Pin<&mut i32>>(), mem::size_of::<&mut i32>());

    // Pin<Box<T>> 与 Box<T> 相同大小
    assert_eq!(mem::size_of::<Pin<Box<i32>>>(), mem::size_of::<Box<i32>>());
}

fn main() {
    performance_1_zero_cost();
}
```

### Pin 对异步性能的影响

```rust
use std::pin::Pin;
use std::future::Future;

// Pin 是异步Rust的必要部分，但不会引入额外开销
// 编译器在编译时验证Pin的约束条件

fn performance_2_async() {
    // 异步函数自动生成返回 Pin<Box<...>> 的代码
    async fn async_work() -> i32 {
        42
    }

    // 完全内联优化，无额外运行时成本
}

fn main() {
    performance_2_async();
}
```

### 避免频繁 Pin/Unpin 操作

```rust
use std::pin::Pin;

fn performance_3_avoid_repeated() {
    let data = String::from("hello");

    // 不推荐：频繁创建 Pin
    for _ in 0..1000 {
        let _pinned = Pin::new(&data);
    }

    // 推荐：重用 Pin
    let pinned = Pin::new(&data);
    for _ in 0..1000 {
        let _ref = &pinned;
    }
}
```

### Box::pin vs Pin::new 的性能

```rust
use std::pin::Pin;

fn performance_4_box_vs_stack() {
    // Box::pin：堆分配，一次分配，强力保证
    let pinned_heap = Box::pin(String::from("hello"));

    // Pin::new：栈上，无额外分配，较弱保证
    let mut s = String::from("hello");
    let pinned_stack = Pin::new(&mut s);

    // 对于长期持有的对象，Box::pin 更好
    // 对于短期临时对象，Pin::new 更好
}
```

## 实战场景

### 场景 1：实现自定义异步任务队列

```rust
use std::pin::Pin;
use std::future::Future;
use std::task::{Context, Poll};
use std::collections::VecDeque;

struct TaskQueue {
    tasks: VecDeque<Pin<Box<dyn Future<Output = ()>>>>,
}

impl TaskQueue {
    fn new() -> Self {
        TaskQueue {
            tasks: VecDeque::new(),
        }
    }

    fn add_task<F>(&mut self, task: F)
    where
        F: Future<Output = ()> + 'static,
    {
        self.tasks.push_back(Box::pin(task));
    }

    fn poll_next(&mut self, cx: &mut Context<'_>) -> Poll<()> {
        if let Some(mut task) = self.tasks.pop_front() {
            match task.as_mut().poll(cx) {
                Poll::Ready(_) => Poll::Ready(()),
                Poll::Pending => {
                    self.tasks.push_front(task);
                    Poll::Pending
                }
            }
        } else {
            Poll::Ready(())
        }
    }
}

fn scenario_1() {
    let mut queue = TaskQueue::new();
    queue.add_task(async {
        println!("Task 1");
    });
}
```

### 场景 2：构建自引用链表节点

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

struct Node {
    value: u32,
    next: Option<Pin<Box<Node>>>,
    _pin: PhantomPinned,
}

impl Node {
    fn new(value: u32) -> Pin<Box<Self>> {
        Box::pin(Node {
            value,
            next: None,
            _pin: PhantomPinned,
        })
    }

    fn append(mut self: Pin<&mut Self>, next: Pin<Box<Node>>) {
        self.next = Some(next);
    }
}

fn scenario_2() {
    let node1 = Node::new(1);
    let node2 = Node::new(2);

    let mut mutable_node = node1;
    mutable_node.as_mut().append(node2);
}
```

### 场景 3：实现事件驱动的状态机

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

struct StateMachine {
    state: State,
    _pin: PhantomPinned,
}

enum State {
    Idle,
    Processing,
    Done,
}

impl StateMachine {
    fn new() -> Pin<Box<Self>> {
        Box::pin(StateMachine {
            state: State::Idle,
            _pin: PhantomPinned,
        })
    }

    fn transition(mut self: Pin<&mut Self>) {
        match self.state {
            State::Idle => self.state = State::Processing,
            State::Processing => self.state = State::Done,
            State::Done => self.state = State::Idle,
        }
    }
}

fn scenario_3() {
    let mut sm = StateMachine::new();
    sm.as_mut().transition();
}
```

### 场景 4：异步条件变量

```rust
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::task::Wake;
use std::sync::atomic::{AtomicBool, Ordering};

struct AsyncCondVar {
    signaled: Arc<AtomicBool>,
    _pin: std::marker::PhantomPinned,
}

impl AsyncCondVar {
    fn new() -> Pin<Box<Self>> {
        Box::pin(AsyncCondVar {
            signaled: Arc::new(AtomicBool::new(false)),
            _pin: std::marker::PhantomPinned,
        })
    }

    fn signal(self: Pin<&mut Self>) {
        self.signaled.store(true, Ordering::Release);
    }

    fn is_signaled(&self) -> bool {
        self.signaled.load(Ordering::Acquire)
    }
}

fn scenario_4() {
    let cv = AsyncCondVar::new();
    // 在异步上下文中使用
}
```

## 面试要点

### 问题 1：Pin 和 Unpin 的关系

**回答要点：**

- Pin 是一个指针包装器，保证被指向的值无法被移动
- Unpin 是一个标记 trait，表示类型可以安全地移动
- 大多数类型都实现 Unpin，只有包含 PhantomPinned 的类型是 !Unpin
- Pin 仅对 !Unpin 类型提供额外的安全保证；对于 Unpin 类型，Pin 是透明的

```rust
use std::marker::PhantomPinned;

struct Pinned {
    _pin: PhantomPinned,  // 这使类型成为 !Unpin
}

struct Unpinned;  // 自动实现 Unpin
```

### 问题 2：为什么 Future trait 需要 Pin

**回答要点：**

- Future 可能包含自引用结构体（generator 状态机）
- 在 .await 时，生成的代码可能在栈上创建自引用
- Pin 保证这些自引用在 poll 之间保持有效
- 如果不使用 Pin，编译器无法保证自引用的安全性

```rust
use std::pin::Pin;
use std::task::{Context, Poll};
use std::future::Future;

trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

### 问题 3：Box::pin 和 Pin::new 的区别

**回答要点：**

| 特性 | Box::pin | Pin::new |
|------|----------|----------|
| 内存位置 | 堆上 | 栈上 |
| 保证强度 | 强（Pin 拥有所有权） | 弱（依赖外部保证） |
| 生命周期 | 由 Pin 管理 | 依赖原始值的生命周期 |
| 开销 | 堆分配 | 无额外开销 |

### 问题 4：PhantomPinned 的作用

**回答要点：**

- PhantomPinned 是一个零大小类型，编译器将其视为 !Unpin
- 通过在结构体中包含 PhantomPinned，使整个结构体变为 !Unpin
- 告诉编译器"这个类型包含自引用或需要固定的内存地址"
- 使编译器拒绝移动该类型的值

### 问题 5：如何安全地投影 Pin

**回答要点：**

```rust
use std::pin::Pin;

struct Struct {
    field: String,  // Unpin
}

impl Struct {
    // 安全投影（字段是 Unpin）
    fn project(self: Pin<&mut Self>) -> &mut String {
        unsafe { &mut self.get_unchecked_mut().field }
    }
}
```

安全投影需要：
1. 被投影的字段必须是 Unpin
2. 投影不能创建可移动的引用到被固定的数据
3. 使用 unsafe 代码，但需要正确的逻辑保证安全性

### 问题 6：Pin 与 Drop 的交互

**回答要点：**

- Pin 不影响 Drop 的调用，Drop 仍然会被正确调用
- Pin 无法防止 Drop，只能防止移动
- 对于自引用结构体，Drop 时自引用可能失效，需要谨慎
- 使用 PhantomPinned 或其他机制确保 Drop 的安全性

## 延伸阅读

### 相关 Rust 特性

- **生命周期**：Pin 与生命周期的关系
- **异步编程**：Future trait 对 Pin 的依赖
- **智能指针**：Box、Rc、Arc 与 Pin 的结合
- **Marker Trait**：PhantomData 和 PhantomPinned
- **Unsafe Rust**：Pin 的 unsafe 操作和保证

### 学习资源

- [Rust RFC 2349：Pin](https://rust-lang.github.io/rfcs/2349-pin.html)
- [The Async Rust Book - Pin](https://rust-lang.github.io/async-book/07_workarounds/03_select.html)
- [Tokio 的 Pin 使用指南](https://tokio.rs/)
- [Rust 标准库文档 - std::pin](https://doc.rust-lang.org/std/pin/)

### 进阶主题

1. **自引用结构体的完整实现**
   - 使用 Pin 正确处理自引用
   - 安全的初始化和销毁

2. **Generator 和 Coroutine**
   - Pin 在 generator 中的作用
   - 栈状态的保存和恢复

3. **异步运行时的设计**
   - executor 如何使用 Pin
   - 高效的 Future 轮询

4. **自定义投影**
   - 创建安全的投影 API
   - 使用 pin-project 宏库

## 总结

Pin 和 Unpin 是 Rust 中用于管理内存固定性的高级特性。掌握它们能够：

1. **理解异步编程**：Future trait 的设计基于 Pin
2. **构建自引用结构**：安全地创建包含内部指针的类型
3. **编写零成本抽象**：Pin 提供编译时检查，运行时零开销
4. **优化性能关键代码**：在需要固定内存地址的场景中应用

通过正确使用 Pin 和 Unpin，你可以充分利用 Rust 强大的类型系统，同时保持内存安全性和性能。
