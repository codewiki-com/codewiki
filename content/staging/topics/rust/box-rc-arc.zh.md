---
title: Box、Rc、Arc 深度解析
description: 深入理解 Rust 智能指针 Box<T>、Rc<T>、Arc<T> 和 Weak<T> 的原理、引用计数机制与线程安全
track: rust
section: ownership-borrowing
difficulty: advanced
tags:
  - Rust
  - 智能指针
  - Box
  - Rc
  - Arc
  - Weak
  - 引用计数
  - 线程安全
status: imported
origin: old/src/content/docs/rust/box-rc-arc.zh.md
divergence: 0.212
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Rust
  subcategory: 内存管理
  order: 6
  lastUpdated: 2026-01-07
---

## 概念解释

在 Rust 的所有权系统中，每个值默认只有一个所有者。然而在实际编程中，我们经常需要让多个部分共享同一份数据，或者将数据分配到堆上以实现动态大小或延长生命周期。`Box<T>`、`Rc<T>`、`Arc<T>` 是 Rust 标准库提供的三种核心智能指针，它们分别解决了不同场景下的内存管理需求。

### 历史背景

智能指针的概念起源于 C++，最早出现在 1990 年代。C++ 的 `std::unique_ptr`、`std::shared_ptr`、`std::weak_ptr` 为 Rust 的智能指针设计提供了参考。Rust 在此基础上结合其所有权系统，设计出了更加安全且零成本抽象的智能指针体系。

### 解决的问题

| 智能指针 | 解决的核心问题 |
|----------|----------------|
| `Box<T>` | 在堆上分配数据，实现递归类型，转移大型数据的所有权 |
| `Rc<T>` | 单线程环境下多所有者共享数据 |
| `Arc<T>` | 多线程环境下多所有者共享数据 |
| `Weak<T>` | 打破循环引用，防止内存泄漏 |

### 与普通引用的区别

```rust
// 普通引用：借用数据，不拥有所有权
fn with_reference(data: &String) {
    println!("{}", data);
} // data 的所有权不变

// 智能指针：拥有数据的所有权
fn with_box(data: Box<String>) {
    println!("{}", data);
} // data 被销毁，内存被释放
```

---

## 核心原理

### Box<T> 的内部实现

`Box<T>` 是最简单的智能指针，本质上是一个指向堆内存的裸指针加上所有权语义。

```rust
// Box 的简化内部表示
pub struct Box<T: ?Sized>(Unique<T>);

// Unique<T> 是一个非空的裸指针包装器
// 在编译器层面保证：
// 1. 指针非空
// 2. 指针唯一拥有该内存
// 3. 内存对齐正确
```

#### 内存布局

```
栈                    堆
+----------+         +----------+
| Box<T>   |  -----> | T (数据) |
| (8字节)  |         |          |
+----------+         +----------+
```

```rust
use std::mem::{size_of, align_of};

fn main() {
    // Box 本身只占用一个指针的大小
    println!("Box<i32> 大小: {} 字节", size_of::<Box<i32>>());       // 8 字节
    println!("Box<[u8; 1000]> 大小: {} 字节", size_of::<Box<[u8; 1000]>>()); // 仍然是 8 字节

    // 但它指向的数据在堆上
    let boxed = Box::new([0u8; 1000]);
    println!("堆上数据大小: {} 字节", std::mem::size_of_val(&*boxed)); // 1000 字节
}
```

### Rc<T> 的引用计数机制

`Rc<T>` (Reference Counted) 使用引用计数来追踪有多少个所有者。当最后一个 `Rc` 被销毁时，数据才会被清理。

```rust
// Rc 的简化内部表示
pub struct Rc<T: ?Sized> {
    ptr: NonNull<RcBox<T>>,
}

struct RcBox<T: ?Sized> {
    strong: Cell<usize>,  // 强引用计数
    weak: Cell<usize>,    // 弱引用计数
    value: T,             // 实际数据
}
```

#### 内存布局

```
栈                    堆
+----------+         +------------------+
| Rc<T> a  |  ----+  | RcBox<T>        |
| (8字节)  |      |  | strong: 2       |
+----------+      +->| weak: 1         |
| Rc<T> b  |  ----+  | value: T        |
| (8字节)  |         +------------------+
+----------+
```

```rust
use std::rc::Rc;
use std::cell::Cell;

fn main() {
    let a = Rc::new(42);
    println!("创建后强引用: {}", Rc::strong_count(&a)); // 1

    let b = Rc::clone(&a);  // 增加引用计数，不复制数据
    println!("克隆后强引用: {}", Rc::strong_count(&a)); // 2

    {
        let c = Rc::clone(&a);
        println!("内部作用域强引用: {}", Rc::strong_count(&a)); // 3
    } // c 离开作用域，引用计数减 1

    println!("c 销毁后强引用: {}", Rc::strong_count(&a)); // 2
}
```

### Arc<T> 的原子引用计数

`Arc<T>` (Atomically Reference Counted) 使用原子操作来管理引用计数，确保线程安全。

```rust
// Arc 的简化内部表示
pub struct Arc<T: ?Sized> {
    ptr: NonNull<ArcInner<T>>,
}

struct ArcInner<T: ?Sized> {
    strong: AtomicUsize,  // 原子强引用计数
    weak: AtomicUsize,    // 原子弱引用计数
    data: T,
}
```

#### 原子操作的本质

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

// Rc 使用普通的 Cell<usize>
struct NonAtomicCounter {
    count: std::cell::Cell<usize>,
}

impl NonAtomicCounter {
    fn increment(&self) {
        // 非原子操作：读取-修改-写入不是原子的
        // 在多线程环境下可能出现数据竞争
        let current = self.count.get();
        self.count.set(current + 1);
    }
}

// Arc 使用 AtomicUsize
struct AtomicCounter {
    count: AtomicUsize,
}

impl AtomicCounter {
    fn increment(&self) {
        // 原子操作：硬件保证读取-修改-写入是不可分割的
        self.count.fetch_add(1, Ordering::Relaxed);
    }
}
```

### Weak<T> 的工作原理

`Weak<T>` 是 `Rc<T>` 或 `Arc<T>` 的弱引用版本，不增加强引用计数，不会阻止数据被销毁。

```rust
use std::rc::{Rc, Weak};

fn main() {
    let strong = Rc::new(String::from("数据"));
    let weak: Weak<String> = Rc::downgrade(&strong);

    println!("强引用: {}, 弱引用: {}",
             Rc::strong_count(&strong),
             Rc::weak_count(&strong));

    // upgrade() 尝试获取强引用
    if let Some(data) = weak.upgrade() {
        println!("数据存在: {}", data);
    }

    drop(strong);  // 销毁唯一的强引用

    // 数据已被销毁，upgrade() 返回 None
    assert!(weak.upgrade().is_none());
    println!("数据已被销毁");
}
```

---

## 核心要点

### Box<T> 的核心特性

```rust
// 1. 堆分配
let boxed = Box::new(5);

// 2. 解引用透明
let value: i32 = *boxed;  // 自动解引用

// 3. 自动释放
fn example() {
    let b = Box::new(vec![1, 2, 3]);
} // b 离开作用域，堆内存自动释放

// 4. 大小固定（无论 T 多大，Box<T> 始终是一个指针大小）
assert_eq!(std::mem::size_of::<Box<i32>>(), 8);
assert_eq!(std::mem::size_of::<Box<[i32; 1000]>>(), 8);
```

### Rc<T> 的核心特性

```rust
use std::rc::Rc;

// 1. 共享所有权
let a = Rc::new(vec![1, 2, 3]);
let b = Rc::clone(&a);  // a 和 b 共享同一份数据

// 2. 引用计数
println!("引用数: {}", Rc::strong_count(&a));  // 2

// 3. 不可变性
// Rc<T> 默认不允许修改内部数据
// 需要配合 RefCell 实现内部可变性

// 4. 非线程安全
// Rc<T> 只能在单线程中使用
// let rc = Rc::new(1);
// std::thread::spawn(move || println!("{}", rc)); // 编译错误！
```

### Arc<T> 的核心特性

```rust
use std::sync::Arc;
use std::thread;

// 1. 线程安全的共享所有权
let data = Arc::new(vec![1, 2, 3]);

let handles: Vec<_> = (0..3).map(|i| {
    let data = Arc::clone(&data);
    thread::spawn(move || {
        println!("线程 {} 看到: {:?}", i, data);
    })
}).collect();

for handle in handles {
    handle.join().unwrap();
}

// 2. 原子引用计数（线程安全）
println!("引用数: {}", Arc::strong_count(&data));
```

### Weak<T> 的核心特性

```rust
use std::rc::{Rc, Weak};

// 1. 不增加强引用计数
let strong = Rc::new(42);
let weak = Rc::downgrade(&strong);
assert_eq!(Rc::strong_count(&strong), 1);  // 仍然是 1

// 2. 不阻止数据销毁
drop(strong);
assert!(weak.upgrade().is_none());

// 3. 用于打破循环引用
struct Node {
    parent: Weak<Node>,      // 弱引用指向父节点
    children: Vec<Rc<Node>>, // 强引用指向子节点
}
```

### Send 和 Sync 特性

```rust
use std::rc::Rc;
use std::sync::Arc;

fn is_send<T: Send>() {}
fn is_sync<T: Sync>() {}

fn main() {
    // Arc<T> 是 Send + Sync（当 T 满足条件时）
    is_send::<Arc<i32>>();
    is_sync::<Arc<i32>>();

    // Rc<T> 不是 Send，也不是 Sync
    // is_send::<Rc<i32>>();  // 编译错误
    // is_sync::<Rc<i32>>();  // 编译错误
}
```

---

## 代码示例

### Box<T> 实现递归类型

```rust
// 链表定义 - 必须使用 Box 来打破无限递归
#[derive(Debug)]
enum List<T> {
    Cons(T, Box<List<T>>),
    Nil,
}

use List::{Cons, Nil};

impl<T> List<T> {
    fn new() -> Self {
        Nil
    }

    fn prepend(self, elem: T) -> Self {
        Cons(elem, Box::new(self))
    }

    fn len(&self) -> usize {
        match self {
            Nil => 0,
            Cons(_, tail) => 1 + tail.len(),
        }
    }
}

fn main() {
    let list = List::new()
        .prepend(3)
        .prepend(2)
        .prepend(1);

    println!("链表: {:?}", list);
    println!("长度: {}", list.len());
}
```

### Box<T> 用于 trait 对象

```rust
trait Shape {
    fn area(&self) -> f64;
    fn name(&self) -> &str;
}

struct Circle {
    radius: f64,
}

struct Rectangle {
    width: f64,
    height: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius * self.radius
    }
    fn name(&self) -> &str { "圆形" }
}

impl Shape for Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
    fn name(&self) -> &str { "矩形" }
}

fn main() {
    // 使用 Box<dyn Trait> 存储不同类型的对象
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { radius: 3.0 }),
        Box::new(Rectangle { width: 4.0, height: 5.0 }),
    ];

    for shape in &shapes {
        println!("{} 的面积: {:.2}", shape.name(), shape.area());
    }
}
```

### Rc<T> 实现共享数据

```rust
use std::rc::Rc;

#[derive(Debug)]
struct SharedConfig {
    database_url: String,
    max_connections: u32,
}

struct ServiceA {
    config: Rc<SharedConfig>,
}

struct ServiceB {
    config: Rc<SharedConfig>,
}

impl ServiceA {
    fn connect(&self) {
        println!("ServiceA 连接到: {}", self.config.database_url);
    }
}

impl ServiceB {
    fn connect(&self) {
        println!("ServiceB 使用 {} 个连接", self.config.max_connections);
    }
}

fn main() {
    let config = Rc::new(SharedConfig {
        database_url: String::from("postgres://localhost/db"),
        max_connections: 10,
    });

    let service_a = ServiceA { config: Rc::clone(&config) };
    let service_b = ServiceB { config: Rc::clone(&config) };

    service_a.connect();
    service_b.connect();

    println!("配置被 {} 个服务共享", Rc::strong_count(&config));
}
```

### Rc<RefCell<T>> 组合模式

```rust
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug)]
struct BankAccount {
    owner: String,
    balance: i64,
}

impl BankAccount {
    fn new(owner: &str, balance: i64) -> Self {
        BankAccount {
            owner: owner.to_string(),
            balance,
        }
    }

    fn deposit(&mut self, amount: i64) {
        self.balance += amount;
        println!("{} 存款 {}，余额: {}", self.owner, amount, self.balance);
    }

    fn withdraw(&mut self, amount: i64) -> Result<(), String> {
        if self.balance >= amount {
            self.balance -= amount;
            println!("{} 取款 {}，余额: {}", self.owner, amount, self.balance);
            Ok(())
        } else {
            Err(format!("余额不足"))
        }
    }
}

fn main() {
    // 创建共享的可变账户
    let account = Rc::new(RefCell::new(BankAccount::new("张三", 1000)));

    // 多个引用持有同一账户
    let teller1 = Rc::clone(&account);
    let teller2 = Rc::clone(&account);

    // 柜员 1 操作
    teller1.borrow_mut().deposit(500);

    // 柜员 2 操作
    teller2.borrow_mut().withdraw(200).unwrap();

    // 查看最终状态
    println!("最终余额: {}", account.borrow().balance);
}
```

### Arc<T> 多线程共享

```rust
use std::sync::Arc;
use std::thread;
use std::time::Duration;

fn main() {
    let data = Arc::new(vec![1, 2, 3, 4, 5]);
    let mut handles = vec![];

    for i in 0..3 {
        let data = Arc::clone(&data);
        let handle = thread::spawn(move || {
            // 每个线程都可以读取共享数据
            let sum: i32 = data.iter().sum();
            println!("线程 {} 计算总和: {}", i, sum);
            thread::sleep(Duration::from_millis(100));
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("所有线程完成，引用计数: {}", Arc::strong_count(&data));
}
```

### Arc<Mutex<T>> 线程安全可变共享

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            // 获取锁，修改数据
            let mut num = counter.lock().unwrap();
            *num += 1;
            println!("线程 {} 将计数器增加到 {}", i, *num);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终计数: {}", *counter.lock().unwrap());
}
```

### Weak<T> 防止循环引用

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

#[derive(Debug)]
struct TreeNode {
    value: i32,
    parent: RefCell<Weak<TreeNode>>,
    children: RefCell<Vec<Rc<TreeNode>>>,
}

impl TreeNode {
    fn new(value: i32) -> Rc<Self> {
        Rc::new(TreeNode {
            value,
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(Vec::new()),
        })
    }

    fn add_child(parent: &Rc<TreeNode>, child: &Rc<TreeNode>) {
        // 子节点保存父节点的弱引用
        *child.parent.borrow_mut() = Rc::downgrade(parent);
        // 父节点保存子节点的强引用
        parent.children.borrow_mut().push(Rc::clone(child));
    }
}

fn main() {
    let root = TreeNode::new(1);
    let child1 = TreeNode::new(2);
    let child2 = TreeNode::new(3);

    TreeNode::add_child(&root, &child1);
    TreeNode::add_child(&root, &child2);

    println!("root 强引用: {}", Rc::strong_count(&root));
    println!("root 弱引用: {}", Rc::weak_count(&root));

    // 通过弱引用访问父节点
    if let Some(parent) = child1.parent.borrow().upgrade() {
        println!("child1 的父节点值: {}", parent.value);
    }
}
```

### 综合示例：发布-订阅模式

```rust
use std::sync::{Arc, Weak, Mutex};
use std::thread;

trait Subscriber: Send + Sync {
    fn on_message(&self, message: &str);
}

struct Publisher {
    subscribers: Mutex<Vec<Weak<dyn Subscriber>>>,
}

impl Publisher {
    fn new() -> Self {
        Publisher {
            subscribers: Mutex::new(Vec::new()),
        }
    }

    fn subscribe(&self, subscriber: &Arc<dyn Subscriber>) {
        self.subscribers.lock().unwrap()
            .push(Arc::downgrade(subscriber));
    }

    fn publish(&self, message: &str) {
        let mut subs = self.subscribers.lock().unwrap();

        // 清理已失效的订阅者并通知有效的订阅者
        subs.retain(|weak| {
            if let Some(subscriber) = weak.upgrade() {
                subscriber.on_message(message);
                true
            } else {
                false
            }
        });
    }
}

struct EmailSubscriber {
    email: String,
}

impl Subscriber for EmailSubscriber {
    fn on_message(&self, message: &str) {
        println!("发送邮件到 {}: {}", self.email, message);
    }
}

struct SmsSubscriber {
    phone: String,
}

impl Subscriber for SmsSubscriber {
    fn on_message(&self, message: &str) {
        println!("发送短信到 {}: {}", self.phone, message);
    }
}

fn main() {
    let publisher = Arc::new(Publisher::new());

    let email_sub: Arc<dyn Subscriber> = Arc::new(EmailSubscriber {
        email: String::from("user@example.com"),
    });

    let sms_sub: Arc<dyn Subscriber> = Arc::new(SmsSubscriber {
        phone: String::from("13800138000"),
    });

    publisher.subscribe(&email_sub);
    publisher.subscribe(&sms_sub);

    // 在多线程环境中发布消息
    let pub_clone = Arc::clone(&publisher);
    let handle = thread::spawn(move || {
        pub_clone.publish("系统通知：服务器维护");
    });

    handle.join().unwrap();

    // 取消一个订阅者
    drop(sms_sub);

    // 再次发布，只有 email_sub 收到
    publisher.publish("只有邮件订阅者能收到这条消息");
}
```

---

## 最佳实践

### 优先使用栈分配

```rust
// 不好：不必要的堆分配
fn bad_example() {
    let x = Box::new(42);  // 小数据不需要 Box
    println!("{}", x);
}

// 好：直接使用栈
fn good_example() {
    let x = 42;
    println!("{}", x);
}
```

### 根据场景选择 Rc 还是 Arc

```rust
use std::rc::Rc;
use std::sync::Arc;

// 单线程场景：使用 Rc（性能更好）
fn single_threaded() {
    let data = Rc::new(vec![1, 2, 3]);
    let copy = Rc::clone(&data);
    // ...
}

// 多线程场景：使用 Arc
fn multi_threaded() {
    let data = Arc::new(vec![1, 2, 3]);
    std::thread::spawn({
        let data = Arc::clone(&data);
        move || {
            println!("{:?}", data);
        }
    });
}
```

### 使用 Rc::clone 而非 .clone()

```rust
use std::rc::Rc;

fn main() {
    let data = Rc::new(String::from("hello"));

    // 推荐：明确表示只是增加引用计数
    let copy1 = Rc::clone(&data);

    // 不推荐：容易误解为深拷贝
    let copy2 = data.clone();

    // 两者效果相同，但 Rc::clone 更清晰
}
```

### 使用 Weak 避免循环引用

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

// 错误：循环引用导致内存泄漏
struct BadNode {
    next: Option<Rc<RefCell<BadNode>>>,
    prev: Option<Rc<RefCell<BadNode>>>,  // 强引用形成循环
}

// 正确：使用 Weak 打破循环
struct GoodNode {
    next: Option<Rc<RefCell<GoodNode>>>,
    prev: RefCell<Weak<GoodNode>>,  // 弱引用不会阻止销毁
}
```

### 最小化锁的持有时间

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));

    let data_clone = Arc::clone(&data);
    thread::spawn(move || {
        // 不好：长时间持有锁
        // let mut guard = data_clone.lock().unwrap();
        // expensive_computation();
        // guard.push(4);

        // 好：快速获取锁并释放
        let new_value = expensive_computation();
        data_clone.lock().unwrap().push(new_value);
    });
}

fn expensive_computation() -> i32 {
    std::thread::sleep(std::time::Duration::from_millis(100));
    42
}
```

### 优先使用 RwLock 而非 Mutex（读多写少场景）

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // 多个读取者可以并行
    for i in 0..5 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let read_guard = data.read().unwrap();
            println!("读取者 {}: {:?}", i, *read_guard);
        }));
    }

    // 写入者需要独占访问
    {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let mut write_guard = data.write().unwrap();
            write_guard.push(4);
            println!("写入完成");
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

---

## 常见陷阱

### RefCell 借用冲突导致 panic

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);

    // 陷阱：同时存在不可变和可变借用
    let borrow = data.borrow();
    // let borrow_mut = data.borrow_mut();  // panic: already borrowed

    // 解决方案：确保借用作用域不重叠
    drop(borrow);
    let borrow_mut = data.borrow_mut();

    // 或者使用 try_borrow_mut
    let data2 = RefCell::new(10);
    let _ = data2.borrow();
    match data2.try_borrow_mut() {
        Ok(mut val) => *val += 1,
        Err(_) => println!("无法获取可变借用"),
    }
}
```

### 循环引用导致内存泄漏

```rust
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    // 陷阱：循环引用
    let a = Rc::new(RefCell::new(None::<Rc<RefCell<Option<Rc<RefCell<Option<Rc<_>>>>>>>>));
    let b = Rc::new(RefCell::new(Some(Rc::clone(&a))));
    *a.borrow_mut() = Some(Rc::clone(&b));

    // a -> b -> a 形成循环
    // 即使离开作用域，内存也不会被释放

    println!("a 引用计数: {}", Rc::strong_count(&a));  // 2
    println!("b 引用计数: {}", Rc::strong_count(&b));  // 2
}
```

### 死锁

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let lock1 = Arc::new(Mutex::new(1));
    let lock2 = Arc::new(Mutex::new(2));

    // 陷阱：两个线程以不同顺序获取锁可能导致死锁
    let l1 = Arc::clone(&lock1);
    let l2 = Arc::clone(&lock2);
    let h1 = thread::spawn(move || {
        let _g1 = l1.lock().unwrap();
        thread::sleep(std::time::Duration::from_millis(10));
        let _g2 = l2.lock().unwrap();  // 可能死锁
    });

    let l1 = Arc::clone(&lock1);
    let l2 = Arc::clone(&lock2);
    let h2 = thread::spawn(move || {
        let _g2 = l2.lock().unwrap();
        thread::sleep(std::time::Duration::from_millis(10));
        let _g1 = l1.lock().unwrap();  // 可能死锁
    });

    // 解决方案：始终按相同顺序获取锁
}
```

### 在 Rc 上调用 clone 而非 Rc::clone

```rust
use std::rc::Rc;

fn main() {
    let data = Rc::new(String::from("expensive data"));

    // 虽然功能相同，但意图不明确
    let copy1 = data.clone();      // 读者可能误以为是深拷贝
    let copy2 = Rc::clone(&data);  // 明确表示是引用计数增加
}
```

### 忘记 Arc 需要配合 Mutex 才能修改

```rust
use std::sync::Arc;

fn main() {
    let data = Arc::new(vec![1, 2, 3]);

    // 陷阱：Arc 本身不提供内部可变性
    // data.push(4);  // 编译错误

    // Arc::get_mut 只在引用计数为 1 时才能获取可变引用
    let mut data = Arc::new(vec![1, 2, 3]);
    if let Some(vec) = Arc::get_mut(&mut data) {
        vec.push(4);
    }

    // 正确做法：配合 Mutex 或 RwLock
    use std::sync::Mutex;
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));
    data.lock().unwrap().push(4);
}
```

### Weak::upgrade 失败后继续使用

```rust
use std::rc::{Rc, Weak};

fn main() {
    let weak: Weak<i32>;
    {
        let strong = Rc::new(42);
        weak = Rc::downgrade(&strong);
    } // strong 离开作用域

    // 陷阱：使用 unwrap 而不检查
    // let value = weak.upgrade().unwrap();  // panic!

    // 正确做法：检查 upgrade 结果
    match weak.upgrade() {
        Some(value) => println!("值: {}", value),
        None => println!("数据已被销毁"),
    }
}
```

---

## 性能考量

### 内存占用对比

```rust
use std::mem::size_of;
use std::rc::Rc;
use std::sync::Arc;
use std::cell::{Cell, RefCell};

fn main() {
    println!("=== 类型大小对比 ===");
    println!("i32:           {} 字节", size_of::<i32>());
    println!("Box<i32>:      {} 字节", size_of::<Box<i32>>());
    println!("Rc<i32>:       {} 字节", size_of::<Rc<i32>>());
    println!("Arc<i32>:      {} 字节", size_of::<Arc<i32>>());
    println!("Cell<i32>:     {} 字节", size_of::<Cell<i32>>());
    println!("RefCell<i32>:  {} 字节", size_of::<RefCell<i32>>());

    // Rc 和 Arc 的实际开销（堆上的控制块）
    // Rc: strong_count (usize) + weak_count (usize) + data
    // Arc: 同上，但使用原子类型
}
```

### 引用计数 vs 克隆

```rust
use std::rc::Rc;
use std::time::Instant;

fn main() {
    let data = vec![0u8; 1_000_000];  // 1MB 数据

    // 深拷贝：开销大
    let start = Instant::now();
    for _ in 0..1000 {
        let _copy = data.clone();
    }
    println!("1000 次深拷贝: {:?}", start.elapsed());

    // 引用计数：开销小
    let rc_data = Rc::new(data);
    let start = Instant::now();
    for _ in 0..1000 {
        let _copy = Rc::clone(&rc_data);
    }
    println!("1000 次 Rc::clone: {:?}", start.elapsed());
}
```

### Rc vs Arc 性能差异

```rust
use std::rc::Rc;
use std::sync::Arc;
use std::time::Instant;

fn main() {
    const ITERATIONS: usize = 10_000_000;

    // Rc：普通引用计数
    let rc = Rc::new(42);
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        let _clone = Rc::clone(&rc);
    }
    println!("Rc {} 次 clone: {:?}", ITERATIONS, start.elapsed());

    // Arc：原子引用计数
    let arc = Arc::new(42);
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        let _clone = Arc::clone(&arc);
    }
    println!("Arc {} 次 clone: {:?}", ITERATIONS, start.elapsed());
}
```

### 选择指南

| 场景 | 推荐类型 | 理由 |
|------|----------|------|
| 堆分配单一所有者 | `Box<T>` | 零开销抽象 |
| 单线程共享只读 | `Rc<T>` | 比 Arc 更快 |
| 单线程共享可变 | `Rc<RefCell<T>>` | 内部可变性 |
| 多线程共享只读 | `Arc<T>` | 线程安全 |
| 多线程共享可变 | `Arc<Mutex<T>>` | 线程安全 + 互斥 |
| 多线程读多写少 | `Arc<RwLock<T>>` | 允许多读取者 |

---

## 实战场景

### 场景一：图数据结构

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;
use std::collections::HashMap;

type NodeRef = Rc<RefCell<GraphNode>>;
type WeakNodeRef = Weak<RefCell<GraphNode>>;

struct GraphNode {
    id: usize,
    neighbors: Vec<WeakNodeRef>,
}

struct Graph {
    nodes: HashMap<usize, NodeRef>,
}

impl Graph {
    fn new() -> Self {
        Graph { nodes: HashMap::new() }
    }

    fn add_node(&mut self, id: usize) {
        let node = Rc::new(RefCell::new(GraphNode {
            id,
            neighbors: Vec::new(),
        }));
        self.nodes.insert(id, node);
    }

    fn add_edge(&mut self, from: usize, to: usize) {
        if let (Some(from_node), Some(to_node)) =
            (self.nodes.get(&from), self.nodes.get(&to))
        {
            from_node.borrow_mut().neighbors.push(Rc::downgrade(to_node));
            to_node.borrow_mut().neighbors.push(Rc::downgrade(from_node));
        }
    }

    fn print_neighbors(&self, id: usize) {
        if let Some(node) = self.nodes.get(&id) {
            print!("节点 {} 的邻居: ", id);
            for weak in &node.borrow().neighbors {
                if let Some(neighbor) = weak.upgrade() {
                    print!("{} ", neighbor.borrow().id);
                }
            }
            println!();
        }
    }
}

fn main() {
    let mut graph = Graph::new();

    for i in 0..5 {
        graph.add_node(i);
    }

    graph.add_edge(0, 1);
    graph.add_edge(0, 2);
    graph.add_edge(1, 2);
    graph.add_edge(2, 3);
    graph.add_edge(3, 4);

    for i in 0..5 {
        graph.print_neighbors(i);
    }
}
```

### 场景二：线程池任务共享状态

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::collections::VecDeque;

struct TaskQueue {
    tasks: Mutex<VecDeque<Box<dyn FnOnce() + Send>>>,
}

struct ThreadPool {
    workers: Vec<thread::JoinHandle<()>>,
    queue: Arc<TaskQueue>,
}

impl ThreadPool {
    fn new(size: usize) -> Self {
        let queue = Arc::new(TaskQueue {
            tasks: Mutex::new(VecDeque::new()),
        });

        let workers = (0..size).map(|id| {
            let queue = Arc::clone(&queue);
            thread::spawn(move || {
                loop {
                    let task = {
                        let mut tasks = queue.tasks.lock().unwrap();
                        tasks.pop_front()
                    };

                    match task {
                        Some(task) => {
                            println!("Worker {} 执行任务", id);
                            task();
                        }
                        None => {
                            thread::sleep(std::time::Duration::from_millis(100));
                        }
                    }
                }
            })
        }).collect();

        ThreadPool { workers, queue }
    }

    fn submit<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static
    {
        self.queue.tasks.lock().unwrap().push_back(Box::new(f));
    }
}

fn main() {
    let pool = ThreadPool::new(4);

    let counter = Arc::new(Mutex::new(0));

    for i in 0..10 {
        let counter = Arc::clone(&counter);
        pool.submit(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
            println!("任务 {} 完成，当前计数: {}", i, *num);
        });
    }

    thread::sleep(std::time::Duration::from_secs(2));
    println!("最终计数: {}", *counter.lock().unwrap());
}
```

### 场景三：缓存系统

```rust
use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use std::time::{Duration, Instant};

struct CacheEntry<V> {
    value: V,
    created_at: Instant,
    ttl: Duration,
}

struct Cache<K, V> {
    data: RwLock<HashMap<K, CacheEntry<V>>>,
}

impl<K, V> Cache<K, V>
where
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    fn new() -> Arc<Self> {
        Arc::new(Cache {
            data: RwLock::new(HashMap::new()),
        })
    }

    fn get(&self, key: &K) -> Option<V> {
        let data = self.data.read().unwrap();
        data.get(key).and_then(|entry| {
            if entry.created_at.elapsed() < entry.ttl {
                Some(entry.value.clone())
            } else {
                None
            }
        })
    }

    fn set(&self, key: K, value: V, ttl: Duration) {
        let mut data = self.data.write().unwrap();
        data.insert(key, CacheEntry {
            value,
            created_at: Instant::now(),
            ttl,
        });
    }

    fn cleanup(&self) {
        let mut data = self.data.write().unwrap();
        data.retain(|_, entry| entry.created_at.elapsed() < entry.ttl);
    }
}

fn main() {
    let cache = Cache::new();

    cache.set("key1".to_string(), "value1".to_string(), Duration::from_secs(5));
    cache.set("key2".to_string(), "value2".to_string(), Duration::from_millis(100));

    println!("key1: {:?}", cache.get(&"key1".to_string()));
    println!("key2: {:?}", cache.get(&"key2".to_string()));

    std::thread::sleep(Duration::from_millis(150));

    println!("等待后 key1: {:?}", cache.get(&"key1".to_string()));
    println!("等待后 key2: {:?}", cache.get(&"key2".to_string())); // 已过期

    cache.cleanup();
}
```

---

## 面试要点

### Q1: Box、Rc、Arc 有什么区别？

**答案要点：**
- `Box<T>`：堆分配，单一所有者，编译期确定所有权
- `Rc<T>`：引用计数，多所有者，单线程，运行时引用计数
- `Arc<T>`：原子引用计数，多所有者，多线程安全，使用原子操作

```rust
// Box: 单一所有者
let b = Box::new(5);
// let b2 = b;  // 所有权转移
// println!("{}", b);  // 编译错误

// Rc: 共享所有权（单线程）
let rc = Rc::new(5);
let rc2 = Rc::clone(&rc);  // 引用计数 +1

// Arc: 共享所有权（多线程）
let arc = Arc::new(5);
std::thread::spawn(move || println!("{}", arc));
```

### Q2: 为什么 Rc 不是线程安全的？

**答案要点：**
- `Rc` 使用普通的 `Cell<usize>` 存储引用计数
- 非原子操作在多线程环境下可能导致数据竞争
- 引用计数的增减操作（读取-修改-写入）不是原子的

```rust
// Rc 的引用计数操作（简化）
fn increment(count: &Cell<usize>) {
    let current = count.get();    // 1. 读取
    count.set(current + 1);       // 2. 写入
    // 在 1 和 2 之间，另一个线程可能也读取了相同的值
}
```

### Q3: 什么是循环引用？如何避免？

**答案要点：**
- 循环引用是指两个或多个对象相互持有对方的强引用
- 会导致引用计数永远不会降到 0，造成内存泄漏
- 解决方案：使用 `Weak<T>` 打破循环

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

struct Node {
    parent: RefCell<Weak<Node>>,   // 弱引用
    children: RefCell<Vec<Rc<Node>>>,  // 强引用
}
```

### Q4: RefCell 和 Mutex 有什么区别？

**答案要点：**
- `RefCell`：编译时借用检查推迟到运行时，单线程，违规时 panic
- `Mutex`：线程安全的互斥锁，多线程，阻塞等待

| 特性 | RefCell | Mutex |
|------|---------|-------|
| 线程安全 | 否 | 是 |
| 错误处理 | panic | 阻塞/返回 Result |
| 性能 | 更快 | 较慢（需要系统调用） |

### Q5: Arc<Mutex<T>> 和 Arc<RwLock<T>> 如何选择？

**答案要点：**
- 读多写少：使用 `RwLock`，允许多个读取者并行
- 写多或读写均衡：使用 `Mutex`，实现更简单，开销更小

```rust
// Mutex: 适合频繁修改
let counter = Arc::new(Mutex::new(0));

// RwLock: 适合读多写少
let config = Arc::new(RwLock::new(HashMap::new()));
// 多个线程可以同时读取
let read_guard = config.read().unwrap();
```

### Q6: Box::leak 有什么用途？

**答案要点：**
- 将 `Box<T>` 转换为 `&'static T`
- 内存永远不会被释放
- 适用于需要静态生命周期引用的场景

```rust
let static_str: &'static str = Box::leak(Box::new(String::from("永久字符串")));
```

### Q7: Rc::make_mut 和 Arc::make_mut 是什么？

**答案要点：**
- 实现写时复制（Copy-on-Write）语义
- 如果只有一个引用，直接返回可变引用
- 如果有多个引用，先克隆数据再返回可变引用

```rust
let mut rc = Rc::new(vec![1, 2, 3]);
Rc::make_mut(&mut rc).push(4);  // 可能克隆
```

---

## 延伸阅读

### 官方文档
- [The Rust Programming Language - Smart Pointers](https://doc.rust-lang.org/book/ch15-00-smart-pointers.html)
- [std::boxed::Box](https://doc.rust-lang.org/std/boxed/struct.Box.html)
- [std::rc::Rc](https://doc.rust-lang.org/std/rc/struct.Rc.html)
- [std::sync::Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html)
- [std::rc::Weak](https://doc.rust-lang.org/std/rc/struct.Weak.html)

### 经典书籍
- 《Rust 程序设计语言》第 15 章：智能指针
- 《Rust 编程之道》：内存管理与所有权
- 《Programming Rust》：Smart Pointers

### 深入阅读
- [Rust Nomicon - Arc and Mutex](https://doc.rust-lang.org/nomicon/arc-mutex.html)
- [RustBelt: Logical Foundations for the Future of Safe Systems Programming](https://plv.mpi-sws.org/rustbelt/)
- [Understanding Rust's Ownership and Borrowing](https://blog.thoughtram.io/ownership-in-rust/)

### 相关主题
- [所有权系统](/rust/ownership) - 理解 Rust 内存管理基础
- [生命周期](/rust/lifetimes) - 借用检查与生命周期标注
- [并发编程](/rust/concurrency) - 多线程与同步原语
- [智能指针](/rust/smart-pointers) - 更多智能指针类型（Cell、RefCell、Cow）
