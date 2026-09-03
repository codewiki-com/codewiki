---
title: RefCell 与 Cell：内部可变性
description: 深入理解 Rust 内部可变性模式，掌握 Cell<T> 和 RefCell<T> 的工作原理、借用检查机制及实际应用
track: rust
section: ownership-borrowing
difficulty: advanced
tags:
  - Rust
  - RefCell
  - Cell
  - 内部可变性
  - 借用检查
  - 智能指针
status: imported
origin: old/src/content/docs/rust/refcell-cell.zh.md
divergence: 0.211
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 内存管理
  order: 6
  lastUpdated: 2026-01-07
---

内部可变性 (Interior Mutability) 是 Rust 中一种重要的设计模式，它允许在持有不可变引用的情况下修改数据。`Cell<T>` 和 `RefCell<T>` 是实现这一模式的核心类型，它们通过不同的机制突破了编译器的借用检查限制。

## 概念解释

### 什么是内部可变性？

在 Rust 的所有权系统中，默认的借用规则是：

- 同一时刻只能有一个可变引用，或任意数量的不可变引用
- 引用必须始终有效

然而，某些场景下我们需要在只有不可变引用的情况下修改数据。例如：

- Mock 对象需要记录调用历史
- 缓存需要在读取时更新
- 共享数据结构需要被多个所有者修改

**内部可变性**提供了一种安全的方式来实现这种需求，它将借用检查从编译时推迟到运行时。

```rust
use std::cell::RefCell;

// 没有内部可变性：无法编译
// struct Counter {
//     count: i32,
// }
// impl Counter {
//     fn increment(&self) {  // &self 是不可变的
//         self.count += 1;   // 错误：不能修改不可变引用的字段
//     }
// }

// 使用内部可变性：可以工作
struct Counter {
    count: RefCell<i32>,
}

impl Counter {
    fn new() -> Self {
        Counter { count: RefCell::new(0) }
    }

    fn increment(&self) {  // &self 仍然是不可变的
        *self.count.borrow_mut() += 1;  // 但可以修改内部数据
    }

    fn get(&self) -> i32 {
        *self.count.borrow()
    }
}

fn main() {
    let counter = Counter::new();
    counter.increment();
    counter.increment();
    println!("计数: {}", counter.get());  // 输出: 计数: 2
}
```

### Cell 与 RefCell 的区别

| 特性 | Cell\<T\> | RefCell\<T\> |
|------|-----------|--------------|
| 类型要求 | `T: Copy` | 任意类型 |
| 获取方式 | 值复制 (`get`/`set`) | 借用 (`borrow`/`borrow_mut`) |
| 运行时开销 | 零 | 有（借用状态追踪） |
| panic 风险 | 无 | 有（借用规则违反时） |
| 适用场景 | 简单标量值 | 复杂数据结构 |
| 线程安全 | 否 | 否 |

---

## 核心原理

### Cell\<T\> 的工作原理

`Cell<T>` 通过值的移动（而非借用）来实现内部可变性。它的核心思想是：既然不提供引用，就不存在借用冲突。

```rust
use std::cell::Cell;

// Cell 的简化实现原理
pub struct SimpleCell<T> {
    value: std::cell::UnsafeCell<T>,
}

impl<T: Copy> SimpleCell<T> {
    pub fn new(value: T) -> Self {
        SimpleCell {
            value: std::cell::UnsafeCell::new(value),
        }
    }

    pub fn get(&self) -> T {
        // 安全的原因：
        // 1. T: Copy，所以复制值不会导致所有权问题
        // 2. 我们只是读取值，不返回引用
        unsafe { *self.value.get() }
    }

    pub fn set(&self, value: T) {
        // 安全的原因：
        // 1. 我们不提供任何引用给外部
        // 2. Cell 不是 Sync，所以不会有数据竞争
        unsafe { *self.value.get() = value; }
    }
}
```

`Cell` 的关键特性：

1. **不提供引用**：`get()` 返回值的副本，`set()` 接受新值
2. **无运行时开销**：没有借用状态需要追踪
3. **类型限制**：只能用于 `Copy` 类型

### RefCell\<T\> 的工作原理

`RefCell<T>` 在运行时追踪借用状态，实现动态借用检查。

```rust
use std::cell::{RefCell, Ref, RefMut, BorrowError, BorrowMutError};

// RefCell 内部状态示意（简化版）
// 实际使用 Cell<isize> 来存储借用计数
enum BorrowState {
    Unused,                  // 未被借用
    Reading(usize),          // 有 N 个不可变借用
    Writing,                 // 有一个可变借用
}

// RefCell 的借用规则
// - borrow(): 当状态为 Unused 或 Reading 时成功，增加读计数
// - borrow_mut(): 仅当状态为 Unused 时成功，设置为 Writing
// - 违反规则时 panic（或使用 try_ 版本返回 Err）
```

运行时借用检查的实现：

```rust
use std::cell::RefCell;

fn demonstrate_borrow_tracking() {
    let data = RefCell::new(vec![1, 2, 3]);

    // 查看当前借用状态的方法
    // RefCell 不直接暴露状态，但我们可以通过尝试借用来推断

    // 场景 1：无借用时
    {
        let r = data.borrow();      // 成功，状态变为 Reading(1)
        let r2 = data.borrow();     // 成功，状态变为 Reading(2)
        println!("两个不可变借用: {:?}, {:?}", *r, *r2);
    }  // r 和 r2 离开作用域，状态回到 Unused

    // 场景 2：可变借用
    {
        let mut w = data.borrow_mut();  // 成功，状态变为 Writing
        w.push(4);
        // let r = data.borrow();       // 这里会 panic！
    }  // w 离开作用域，状态回到 Unused

    // 场景 3：使用 try_borrow 安全检查
    {
        let r = data.borrow();
        match data.try_borrow_mut() {
            Ok(_) => println!("获取可变借用成功"),
            Err(e) => println!("获取可变借用失败: {}", e),
        }
    }

    println!("最终数据: {:?}", data.borrow());
}

fn main() {
    demonstrate_borrow_tracking();
}
```

### UnsafeCell：内部可变性的基石

`Cell` 和 `RefCell` 都建立在 `UnsafeCell<T>` 之上，它是 Rust 中唯一合法获取内部可变性的方式。

```rust
use std::cell::UnsafeCell;

// UnsafeCell 是所有内部可变性类型的基础
fn unsafe_cell_basics() {
    let cell = UnsafeCell::new(42);

    // 获取裸指针
    let ptr: *mut i32 = cell.get();

    // 必须使用 unsafe 来操作
    unsafe {
        *ptr = 100;
        println!("值: {}", *ptr);
    }
}
```

`UnsafeCell` 的特殊之处：

- 它是编译器唯一认可的「可以从 `&T` 获取 `*mut T`」的类型
- 它告诉编译器不要对其内容进行某些优化假设
- 它不是 `Sync`，防止多线程数据竞争

---

## 核心要点

### Cell\<T\> 的核心 API

```rust
use std::cell::Cell;

fn cell_api_overview() {
    // 创建
    let cell = Cell::new(10);

    // 获取值（复制）
    let value = cell.get();
    println!("当前值: {}", value);

    // 设置值
    cell.set(20);

    // 替换并返回旧值
    let old = cell.replace(30);
    println!("旧值: {}, 新值: {}", old, cell.get());

    // 获取内部值的可变指针（unsafe）
    let ptr = cell.as_ptr();
    unsafe {
        println!("通过指针: {}", *ptr);
    }

    // 交换两个 Cell 的值
    let cell2 = Cell::new(100);
    cell.swap(&cell2);
    println!("交换后: cell={}, cell2={}", cell.get(), cell2.get());

    // 取出值（消费 Cell）
    let inner = cell.into_inner();
    println!("取出的值: {}", inner);

    // update 方法（需要 T: Copy）
    let counter = Cell::new(0);
    // Rust 1.50+ 支持
    // counter.update(|x| x + 1);
    // 替代方案：
    counter.set(counter.get() + 1);
}

fn main() {
    cell_api_overview();
}
```

### RefCell\<T\> 的核心 API

```rust
use std::cell::{RefCell, Ref, RefMut};

fn refcell_api_overview() {
    let data = RefCell::new(String::from("Hello"));

    // 不可变借用
    {
        let r: Ref<String> = data.borrow();
        println!("不可变借用: {}", *r);
        // 可以有多个不可变借用
        let r2 = data.borrow();
        println!("另一个不可变借用: {}", *r2);
    }

    // 可变借用
    {
        let mut w: RefMut<String> = data.borrow_mut();
        w.push_str(", World!");
    }

    // try_borrow 和 try_borrow_mut：不会 panic
    match data.try_borrow() {
        Ok(r) => println!("try_borrow 成功: {}", *r),
        Err(e) => println!("try_borrow 失败: {}", e),
    }

    match data.try_borrow_mut() {
        Ok(mut w) => {
            w.push_str(" Rust!");
            println!("try_borrow_mut 成功");
        }
        Err(e) => println!("try_borrow_mut 失败: {}", e),
    }

    // 获取内部值的可变引用（需要 &mut self）
    let refcell = RefCell::new(vec![1, 2, 3]);
    // get_mut 需要独占访问
    // let inner = refcell.get_mut();

    // into_inner：消费 RefCell 获取内部值
    let inner = refcell.into_inner();
    println!("取出的值: {:?}", inner);

    // replace：替换内部值并返回旧值
    let data2 = RefCell::new(10);
    let old = data2.replace(20);
    println!("replace: 旧={}, 新={}", old, *data2.borrow());

    // swap：交换两个 RefCell 的值
    let a = RefCell::new(1);
    let b = RefCell::new(2);
    a.swap(&b);
    println!("swap 后: a={}, b={}", *a.borrow(), *b.borrow());

    println!("最终数据: {}", data.borrow());
}

fn main() {
    refcell_api_overview();
}
```

### Ref 和 RefMut 智能指针

`borrow()` 和 `borrow_mut()` 返回的是智能指针类型，它们在离开作用域时自动更新借用计数。

```rust
use std::cell::{RefCell, Ref, RefMut};

fn ref_and_refmut_features() {
    let data = RefCell::new(vec![1, 2, 3, 4, 5]);

    // Ref 的 map 方法：转换引用
    let first: Ref<i32> = Ref::map(data.borrow(), |v| &v[0]);
    println!("第一个元素: {}", *first);
    drop(first);  // 必须先释放

    // RefMut 的 map 方法
    {
        let mut borrowed = data.borrow_mut();
        let first_mut: RefMut<i32> = RefMut::map(borrowed, |v| &mut v[0]);
        // *first_mut = 100;
        // 注意：RefMut::map 消费原来的 RefMut
    }

    // filter_map：条件映射
    let maybe_first = Ref::filter_map(data.borrow(), |v| v.first());
    match maybe_first {
        Ok(r) => println!("filter_map 成功: {}", *r),
        Err(_) => println!("filter_map 失败"),
    }

    // 克隆 Ref（增加借用计数）
    {
        let r1 = data.borrow();
        let r2 = Ref::clone(&r1);
        println!("r1={:?}, r2={:?}", *r1, *r2);
    }

    println!("最终: {:?}", data.borrow());
}

fn main() {
    ref_and_refmut_features();
}
```

---

## 代码示例

### 示例 1：使用 Cell 实现计数器

```rust
use std::cell::Cell;

/// 一个简单的调用计数器
struct CallCounter {
    count: Cell<u64>,
}

impl CallCounter {
    fn new() -> Self {
        CallCounter { count: Cell::new(0) }
    }

    /// 增加计数（接受 &self，使用内部可变性修改）
    fn increment(&self) {
        self.count.set(self.count.get() + 1);
    }

    /// 获取当前计数
    fn get(&self) -> u64 {
        self.count.get()
    }

    /// 重置计数
    fn reset(&self) {
        self.count.set(0);
    }
}

/// 带有调用统计的函数包装器
struct TrackedFunction<F> {
    func: F,
    call_count: Cell<u64>,
}

impl<F, T> TrackedFunction<F>
where
    F: Fn() -> T,
{
    fn new(func: F) -> Self {
        TrackedFunction {
            func,
            call_count: Cell::new(0),
        }
    }

    fn call(&self) -> T {
        self.call_count.set(self.call_count.get() + 1);
        (self.func)()
    }

    fn call_count(&self) -> u64 {
        self.call_count.get()
    }
}

fn main() {
    // 基本计数器使用
    let counter = CallCounter::new();
    for _ in 0..100 {
        counter.increment();
    }
    println!("调用次数: {}", counter.get());

    // 函数追踪
    let expensive_computation = TrackedFunction::new(|| {
        // 模拟复杂计算
        (0..1000).sum::<i32>()
    });

    let result1 = expensive_computation.call();
    let result2 = expensive_computation.call();

    println!("结果: {}, {}", result1, result2);
    println!("函数被调用了 {} 次", expensive_computation.call_count());
}
```

### 示例 2：使用 RefCell 实现缓存

```rust
use std::cell::RefCell;
use std::collections::HashMap;

/// 带缓存的计算器
struct CachedCalculator {
    cache: RefCell<HashMap<i64, i64>>,
}

impl CachedCalculator {
    fn new() -> Self {
        CachedCalculator {
            cache: RefCell::new(HashMap::new()),
        }
    }

    /// 计算斐波那契数列（带缓存）
    fn fibonacci(&self, n: i64) -> i64 {
        // 先检查缓存
        if let Some(&cached) = self.cache.borrow().get(&n) {
            return cached;
        }

        // 计算结果
        let result = if n <= 1 {
            n
        } else {
            self.fibonacci(n - 1) + self.fibonacci(n - 2)
        };

        // 存入缓存
        self.cache.borrow_mut().insert(n, result);
        result
    }

    /// 获取缓存统计
    fn cache_stats(&self) -> usize {
        self.cache.borrow().len()
    }

    /// 清除缓存
    fn clear_cache(&self) {
        self.cache.borrow_mut().clear();
    }
}

/// 惰性求值容器
struct Lazy<T, F>
where
    F: Fn() -> T,
{
    value: RefCell<Option<T>>,
    initializer: F,
}

impl<T, F> Lazy<T, F>
where
    F: Fn() -> T,
{
    fn new(initializer: F) -> Self {
        Lazy {
            value: RefCell::new(None),
            initializer,
        }
    }

    fn get(&self) -> std::cell::Ref<T> {
        // 如果未初始化，先初始化
        if self.value.borrow().is_none() {
            let val = (self.initializer)();
            *self.value.borrow_mut() = Some(val);
        }

        std::cell::Ref::map(self.value.borrow(), |opt| {
            opt.as_ref().unwrap()
        })
    }
}

fn main() {
    let calc = CachedCalculator::new();

    println!("计算 fib(40)...");
    let result = calc.fibonacci(40);
    println!("fib(40) = {}", result);
    println!("缓存了 {} 个值", calc.cache_stats());

    // 再次计算会使用缓存
    let result2 = calc.fibonacci(40);
    println!("再次计算 fib(40) = {} (使用缓存)", result2);

    // 惰性求值示例
    let expensive = Lazy::new(|| {
        println!("执行昂贵的初始化...");
        42
    });

    println!("Lazy 值已创建，但尚未初始化");
    println!("第一次访问: {}", *expensive.get());
    println!("第二次访问: {}", *expensive.get());  // 不会再执行初始化
}
```

### 示例 3：使用 RefCell 实现 Mock 对象

```rust
use std::cell::RefCell;

/// 邮件发送 trait
trait EmailSender {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), String>;
}

/// 真实的邮件发送器
struct RealEmailSender;

impl EmailSender for RealEmailSender {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), String> {
        // 实际发送邮件的逻辑
        println!("发送邮件到 {}: {} - {}", to, subject, body);
        Ok(())
    }
}

/// Mock 邮件发送器（用于测试）
struct MockEmailSender {
    sent_emails: RefCell<Vec<(String, String, String)>>,
    should_fail: RefCell<bool>,
}

impl MockEmailSender {
    fn new() -> Self {
        MockEmailSender {
            sent_emails: RefCell::new(Vec::new()),
            should_fail: RefCell::new(false),
        }
    }

    /// 设置是否应该失败
    fn set_should_fail(&self, fail: bool) {
        *self.should_fail.borrow_mut() = fail;
    }

    /// 获取所有已发送的邮件
    fn get_sent_emails(&self) -> Vec<(String, String, String)> {
        self.sent_emails.borrow().clone()
    }

    /// 验证是否发送了特定邮件
    fn verify_sent(&self, to: &str, subject: &str) -> bool {
        self.sent_emails.borrow().iter().any(|(t, s, _)| {
            t == to && s == subject
        })
    }

    /// 获取发送邮件的数量
    fn sent_count(&self) -> usize {
        self.sent_emails.borrow().len()
    }
}

impl EmailSender for MockEmailSender {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), String> {
        if *self.should_fail.borrow() {
            return Err("模拟发送失败".to_string());
        }

        // 记录发送的邮件
        self.sent_emails.borrow_mut().push((
            to.to_string(),
            subject.to_string(),
            body.to_string(),
        ));

        Ok(())
    }
}

/// 使用邮件发送器的服务
struct NotificationService<S: EmailSender> {
    sender: S,
}

impl<S: EmailSender> NotificationService<S> {
    fn new(sender: S) -> Self {
        NotificationService { sender }
    }

    fn notify_user(&self, user_email: &str, message: &str) -> Result<(), String> {
        self.sender.send(
            user_email,
            "系统通知",
            message,
        )
    }
}

fn main() {
    // 使用 Mock 进行测试
    let mock_sender = MockEmailSender::new();
    let service = NotificationService::new(&mock_sender);

    // 发送通知
    service.notify_user("user@example.com", "欢迎使用我们的服务！").unwrap();
    service.notify_user("admin@example.com", "新用户注册通知").unwrap();

    // 验证发送结果
    assert_eq!(mock_sender.sent_count(), 2);
    assert!(mock_sender.verify_sent("user@example.com", "系统通知"));

    println!("发送了 {} 封邮件", mock_sender.sent_count());
    for (to, subject, body) in mock_sender.get_sent_emails() {
        println!("  -> {}: {} - {}", to, subject, body);
    }

    // 测试失败场景
    mock_sender.set_should_fail(true);
    let result = service.notify_user("test@example.com", "测试");
    assert!(result.is_err());
    println!("模拟失败测试通过");
}
```

### 示例 4：Rc\<RefCell\<T\>\> 共享可变状态

```rust
use std::rc::Rc;
use std::cell::RefCell;

/// 银行账户
#[derive(Debug)]
struct Account {
    id: String,
    balance: i64,
}

impl Account {
    fn new(id: &str, initial_balance: i64) -> Self {
        Account {
            id: id.to_string(),
            balance: initial_balance,
        }
    }

    fn deposit(&mut self, amount: i64) {
        self.balance += amount;
    }

    fn withdraw(&mut self, amount: i64) -> Result<(), String> {
        if self.balance >= amount {
            self.balance -= amount;
            Ok(())
        } else {
            Err(format!("账户 {} 余额不足", self.id))
        }
    }
}

/// 共享账户引用
type SharedAccount = Rc<RefCell<Account>>;

/// 账户持有者
struct AccountHolder {
    name: String,
    account: SharedAccount,
}

impl AccountHolder {
    fn new(name: &str, account: SharedAccount) -> Self {
        AccountHolder {
            name: name.to_string(),
            account,
        }
    }

    fn deposit(&self, amount: i64) {
        self.account.borrow_mut().deposit(amount);
        println!("{} 存入 {} 元", self.name, amount);
    }

    fn withdraw(&self, amount: i64) -> Result<(), String> {
        let result = self.account.borrow_mut().withdraw(amount);
        match &result {
            Ok(_) => println!("{} 取出 {} 元", self.name, amount),
            Err(e) => println!("{} 取款失败: {}", self.name, e),
        }
        result
    }

    fn balance(&self) -> i64 {
        self.account.borrow().balance
    }
}

/// 交易系统
struct TransactionSystem {
    accounts: Vec<SharedAccount>,
}

impl TransactionSystem {
    fn new() -> Self {
        TransactionSystem { accounts: Vec::new() }
    }

    fn create_account(&mut self, id: &str, initial_balance: i64) -> SharedAccount {
        let account = Rc::new(RefCell::new(Account::new(id, initial_balance)));
        self.accounts.push(Rc::clone(&account));
        account
    }

    fn transfer(
        &self,
        from: &SharedAccount,
        to: &SharedAccount,
        amount: i64
    ) -> Result<(), String> {
        // 先取款
        from.borrow_mut().withdraw(amount)?;
        // 再存款
        to.borrow_mut().deposit(amount);
        Ok(())
    }

    fn total_balance(&self) -> i64 {
        self.accounts.iter()
            .map(|acc| acc.borrow().balance)
            .sum()
    }
}

fn main() {
    let mut system = TransactionSystem::new();

    // 创建联名账户
    let joint_account = system.create_account("JOINT-001", 10000);

    // 两个人共同持有这个账户
    let alice = AccountHolder::new("Alice", Rc::clone(&joint_account));
    let bob = AccountHolder::new("Bob", Rc::clone(&joint_account));

    println!("初始余额: {} 元", alice.balance());
    println!("账户引用计数: {}", Rc::strong_count(&joint_account));

    // 两人都可以操作账户
    alice.deposit(1000);
    println!("Alice 存款后余额: {} 元", bob.balance());

    bob.withdraw(500).unwrap();
    println!("Bob 取款后余额: {} 元", alice.balance());

    // 创建另一个账户用于转账
    let saving_account = system.create_account("SAVE-001", 0);

    // 从联名账户转账到储蓄账户
    system.transfer(&joint_account, &saving_account, 3000).unwrap();
    println!("\n转账后:");
    println!("联名账户余额: {} 元", joint_account.borrow().balance);
    println!("储蓄账户余额: {} 元", saving_account.borrow().balance);
    println!("系统总余额: {} 元", system.total_balance());
}
```

### 示例 5：观察者模式

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

/// 观察者 trait
trait Observer<T> {
    fn on_change(&self, old_value: &T, new_value: &T);
}

/// 可观察的值
struct Observable<T> {
    value: RefCell<T>,
    observers: RefCell<Vec<Weak<dyn Observer<T>>>>,
}

impl<T: Clone> Observable<T> {
    fn new(value: T) -> Self {
        Observable {
            value: RefCell::new(value),
            observers: RefCell::new(Vec::new()),
        }
    }

    fn get(&self) -> T {
        self.value.borrow().clone()
    }

    fn set(&self, new_value: T) {
        let old_value = self.value.borrow().clone();

        // 通知所有有效的观察者
        let mut observers = self.observers.borrow_mut();
        observers.retain(|weak| {
            if let Some(observer) = weak.upgrade() {
                observer.on_change(&old_value, &new_value);
                true
            } else {
                false  // 移除失效的弱引用
            }
        });

        *self.value.borrow_mut() = new_value;
    }

    fn subscribe(&self, observer: &Rc<dyn Observer<T>>) {
        self.observers.borrow_mut().push(Rc::downgrade(observer));
    }
}

/// 日志观察者
struct LogObserver {
    name: String,
}

impl<T: std::fmt::Debug> Observer<T> for LogObserver {
    fn on_change(&self, old_value: &T, new_value: &T) {
        println!("[{}] 值变化: {:?} -> {:?}", self.name, old_value, new_value);
    }
}

/// 验证观察者
struct ValidationObserver<T: Ord> {
    min: T,
    max: T,
    warnings: RefCell<Vec<String>>,
}

impl<T: Ord + std::fmt::Debug> ValidationObserver<T> {
    fn new(min: T, max: T) -> Self {
        ValidationObserver {
            min,
            max,
            warnings: RefCell::new(Vec::new()),
        }
    }

    fn get_warnings(&self) -> Vec<String> {
        self.warnings.borrow().clone()
    }
}

impl<T: Ord + std::fmt::Debug> Observer<T> for ValidationObserver<T> {
    fn on_change(&self, _old_value: &T, new_value: &T) {
        if new_value < &self.min {
            self.warnings.borrow_mut().push(
                format!("警告: {:?} 低于最小值 {:?}", new_value, self.min)
            );
        } else if new_value > &self.max {
            self.warnings.borrow_mut().push(
                format!("警告: {:?} 超过最大值 {:?}", new_value, self.max)
            );
        }
    }
}

fn main() {
    let temperature = Observable::new(20);

    // 创建观察者
    let logger: Rc<dyn Observer<i32>> = Rc::new(LogObserver {
        name: "温度日志".to_string(),
    });

    let validator: Rc<dyn Observer<i32>> = Rc::new(ValidationObserver::new(0, 40));

    // 订阅
    temperature.subscribe(&logger);
    temperature.subscribe(&validator);

    // 改变值
    temperature.set(25);
    temperature.set(38);
    temperature.set(45);  // 超过最大值
    temperature.set(-5);  // 低于最小值

    // 检查验证警告
    let validator_ref = validator.as_ref() as &dyn std::any::Any;
    // 由于类型擦除，这里简化处理

    println!("\n最终温度: {}", temperature.get());

    // 演示弱引用自动清理
    {
        let temp_observer: Rc<dyn Observer<i32>> = Rc::new(LogObserver {
            name: "临时观察者".to_string(),
        });
        temperature.subscribe(&temp_observer);
        temperature.set(30);
    }  // temp_observer 在这里被销毁

    temperature.set(32);  // 临时观察者已经不会收到通知了
}
```

---

## 最佳实践

### 选择正确的类型

```rust
use std::cell::{Cell, RefCell};

// 好的做法：对 Copy 类型使用 Cell
struct GoodConfig {
    enabled: Cell<bool>,     // bool 是 Copy
    count: Cell<usize>,      // usize 是 Copy
    threshold: Cell<f64>,    // f64 是 Copy
}

// 好的做法：对非 Copy 类型使用 RefCell
struct GoodState {
    name: RefCell<String>,          // String 不是 Copy
    items: RefCell<Vec<i32>>,       // Vec 不是 Copy
    cache: RefCell<std::collections::HashMap<String, i32>>,
}

// 不好的做法：对 Copy 类型使用 RefCell（虽然可以工作，但有额外开销）
struct BadConfig {
    enabled: RefCell<bool>,  // 不必要的运行时开销
    count: RefCell<usize>,
}
```

### 最小化借用作用域

```rust
use std::cell::RefCell;

struct Data {
    values: RefCell<Vec<i32>>,
}

impl Data {
    // 好的做法：尽快释放借用
    fn sum_good(&self) -> i32 {
        let borrowed = self.values.borrow();
        let sum = borrowed.iter().sum();
        // borrowed 在这里隐式释放
        sum
    }

    // 更好的做法：使用代码块限制作用域
    fn process_good(&self) {
        let sum = {
            let values = self.values.borrow();
            values.iter().sum::<i32>()
        };  // 借用在这里释放

        // 现在可以安全地可变借用
        if sum > 100 {
            self.values.borrow_mut().push(sum);
        }
    }

    // 不好的做法：借用跨越可能冲突的操作
    fn process_bad(&self) {
        let values = self.values.borrow();
        let sum: i32 = values.iter().sum();

        // 如果这里尝试修改，会 panic
        // self.values.borrow_mut().push(sum);  // panic!

        drop(values);  // 必须显式释放
        self.values.borrow_mut().push(sum);
    }
}
```

### 使用 try_borrow 避免 panic

```rust
use std::cell::RefCell;

fn safe_refcell_usage() {
    let data = RefCell::new(vec![1, 2, 3]);

    // 好的做法：使用 try_borrow 系列方法
    fn try_read(data: &RefCell<Vec<i32>>) -> Option<i32> {
        data.try_borrow().ok().map(|v| v.iter().sum())
    }

    fn try_write(data: &RefCell<Vec<i32>>, value: i32) -> bool {
        match data.try_borrow_mut() {
            Ok(mut v) => {
                v.push(value);
                true
            }
            Err(_) => false,
        }
    }

    // 好的做法：在可能失败的场景中优雅处理
    let _read = data.borrow();

    if try_write(&data, 4) {
        println!("写入成功");
    } else {
        println!("当前数据正在被读取，无法写入");
    }
}

fn main() {
    safe_refcell_usage();
}
```

### 合理组合使用

```rust
use std::rc::Rc;
use std::cell::{Cell, RefCell};

// 好的做法：根据需求组合使用
struct SharedCounter {
    // 共享的不可变数据
    name: String,
    // 共享的可变简单值
    count: Cell<u64>,
    // 共享的可变复杂数据
    history: RefCell<Vec<u64>>,
}

// 使用 Rc 共享整个结构
fn create_shared_counter(name: &str) -> Rc<SharedCounter> {
    Rc::new(SharedCounter {
        name: name.to_string(),
        count: Cell::new(0),
        history: RefCell::new(Vec::new()),
    })
}

fn main() {
    let counter = create_shared_counter("MyCounter");
    let counter2 = Rc::clone(&counter);

    // 两个引用都可以修改
    counter.count.set(counter.count.get() + 1);
    counter.history.borrow_mut().push(counter.count.get());

    counter2.count.set(counter2.count.get() + 1);
    counter2.history.borrow_mut().push(counter2.count.get());

    println!("名称: {}", counter.name);
    println!("计数: {}", counter.count.get());
    println!("历史: {:?}", counter.history.borrow());
}
```

### 文档化内部可变性

```rust
use std::cell::RefCell;

/// 带缓存的计算结果
///
/// # 内部可变性说明
///
/// 此结构使用 `RefCell` 实现内部可变性来缓存计算结果。
/// 虽然 `compute` 方法接受 `&self`，但它可能会修改内部缓存。
///
/// ## 线程安全
///
/// 此类型不是线程安全的。如需多线程使用，请考虑 `Mutex<Option<T>>`。
///
/// ## Panic 情况
///
/// 如果在持有 `borrow()` 的同时调用 `invalidate()`，会导致 panic。
pub struct CachedValue<T, F>
where
    F: Fn() -> T,
{
    /// 缓存的值。使用 RefCell 实现内部可变性。
    cache: RefCell<Option<T>>,
    /// 计算函数
    compute_fn: F,
}

impl<T: Clone, F: Fn() -> T> CachedValue<T, F> {
    /// 创建新的缓存值
    pub fn new(compute_fn: F) -> Self {
        CachedValue {
            cache: RefCell::new(None),
            compute_fn,
        }
    }

    /// 获取值（如果未缓存则计算）
    ///
    /// # 内部可变性
    ///
    /// 此方法接受 `&self` 但可能修改内部缓存。
    pub fn get(&self) -> T {
        let mut cache = self.cache.borrow_mut();
        match &*cache {
            Some(value) => value.clone(),
            None => {
                let value = (self.compute_fn)();
                *cache = Some(value.clone());
                value
            }
        }
    }

    /// 使缓存失效
    ///
    /// # Panics
    ///
    /// 如果在持有 `get()` 返回值的借用时调用此方法，会 panic。
    pub fn invalidate(&self) {
        *self.cache.borrow_mut() = None;
    }
}
```

---

## 常见陷阱

### 陷阱 1：借用冲突导致 panic

```rust
use std::cell::RefCell;

fn borrow_conflict_example() {
    let data = RefCell::new(vec![1, 2, 3]);

    // 陷阱：在持有借用时尝试可变借用
    // 这会导致运行时 panic
    let panic_example = || {
        let borrowed = data.borrow();
        // let mut_borrowed = data.borrow_mut();  // panic: already borrowed
        println!("{:?}", borrowed);
    };

    // 解决方案 1：确保借用作用域不重叠
    {
        let borrowed = data.borrow();
        println!("读取: {:?}", borrowed);
    }  // borrowed 在这里释放
    {
        let mut mut_borrowed = data.borrow_mut();
        mut_borrowed.push(4);
    }

    // 解决方案 2：使用 try_borrow
    if let Ok(borrowed) = data.try_borrow() {
        println!("安全读取: {:?}", borrowed);
    }

    // 解决方案 3：先释放再借用
    let borrowed = data.borrow();
    let sum: i32 = borrowed.iter().sum();
    drop(borrowed);  // 显式释放
    data.borrow_mut().push(sum);

    println!("最终: {:?}", data.borrow());
}

fn main() {
    borrow_conflict_example();
}
```

### 陷阱 2：意外的长生命周期借用

```rust
use std::cell::RefCell;

struct Container {
    data: RefCell<Vec<i32>>,
}

impl Container {
    fn new() -> Self {
        Container { data: RefCell::new(vec![1, 2, 3]) }
    }

    // 陷阱：返回 Ref 导致调用者持有借用
    // fn get_first_bad(&self) -> std::cell::Ref<i32> {
    //     std::cell::Ref::map(self.data.borrow(), |v| &v[0])
    // }

    // 解决方案：返回值的副本
    fn get_first_good(&self) -> Option<i32> {
        self.data.borrow().first().copied()
    }

    // 或者明确文档化返回类型
    fn get_data(&self) -> std::cell::Ref<Vec<i32>> {
        self.data.borrow()
    }
}

fn main() {
    let container = Container::new();

    // 好的做法：立即使用并释放
    println!("第一个元素: {:?}", container.get_first_good());

    // 如果保留 Ref，需要注意生命周期
    {
        let data = container.get_data();
        println!("数据: {:?}", *data);
        // data 在这里释放
    }

    // 现在可以安全地可变借用
    container.data.borrow_mut().push(4);
}
```

### 陷阱 3：循环引用导致内存泄漏

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

// 陷阱：使用强引用导致循环引用
mod bad_example {
    use super::*;

    struct Node {
        value: i32,
        // 错误：相互强引用会导致内存泄漏
        // neighbors: RefCell<Vec<Rc<Node>>>,
    }
}

// 解决方案：使用 Weak 引用
mod good_example {
    use super::*;

    struct Node {
        value: i32,
        // 使用弱引用避免循环
        parent: RefCell<Weak<Node>>,
        children: RefCell<Vec<Rc<Node>>>,
    }

    impl Node {
        fn new(value: i32) -> Rc<Self> {
            Rc::new(Node {
                value,
                parent: RefCell::new(Weak::new()),
                children: RefCell::new(Vec::new()),
            })
        }

        fn add_child(parent: &Rc<Node>, child: Rc<Node>) {
            *child.parent.borrow_mut() = Rc::downgrade(parent);
            parent.children.borrow_mut().push(child);
        }
    }

    pub fn demonstrate() {
        let root = Node::new(1);
        let child = Node::new(2);

        Node::add_child(&root, child);

        println!("Root 引用计数: {}", Rc::strong_count(&root));
        // root 离开作用域时，所有节点都会被正确释放
    }
}

fn main() {
    good_example::demonstrate();
}
```

### 陷阱 4：在迭代中修改

```rust
use std::cell::RefCell;

fn iteration_modification() {
    let data = RefCell::new(vec![1, 2, 3, 4, 5]);

    // 陷阱：在迭代借用期间尝试修改
    // for item in data.borrow().iter() {
    //     if *item > 3 {
    //         data.borrow_mut().push(*item * 2);  // panic!
    //     }
    // }

    // 解决方案 1：先收集要添加的元素
    let to_add: Vec<i32> = data.borrow()
        .iter()
        .filter(|&&x| x > 3)
        .map(|&x| x * 2)
        .collect();

    data.borrow_mut().extend(to_add);

    // 解决方案 2：使用索引迭代
    let len = data.borrow().len();
    for i in 0..len {
        let val = data.borrow()[i];
        if val > 3 {
            data.borrow_mut().push(val * 2);
        }
    }

    println!("结果: {:?}", data.borrow());
}

fn main() {
    iteration_modification();
}
```

### 陷阱 5：混淆 Cell 和 RefCell 的使用场景

```rust
use std::cell::{Cell, RefCell};

// 陷阱：对非 Copy 类型使用 Cell
// struct BadDesign {
//     name: Cell<String>,  // 编译错误：String 不是 Copy
// }

// 解决方案：正确选择类型
struct GoodDesign {
    count: Cell<u32>,           // Copy 类型用 Cell
    name: RefCell<String>,      // 非 Copy 类型用 RefCell
}

// 另一个陷阱：不必要地使用 RefCell
struct OverEngineered {
    x: RefCell<i32>,  // 对于简单的 i32，Cell 更合适
    y: RefCell<i32>,
}

// 更好的设计
struct WellDesigned {
    x: Cell<i32>,
    y: Cell<i32>,
}

fn main() {
    let good = GoodDesign {
        count: Cell::new(0),
        name: RefCell::new(String::from("test")),
    };

    // Cell: 直接 get/set
    good.count.set(good.count.get() + 1);

    // RefCell: 借用后操作
    good.name.borrow_mut().push_str("!");

    println!("count: {}, name: {}", good.count.get(), good.name.borrow());
}
```

---

## 性能考量

### Cell vs RefCell 性能对比

```rust
use std::cell::{Cell, RefCell};
use std::time::Instant;

fn performance_comparison() {
    const ITERATIONS: u64 = 10_000_000;

    // Cell 性能测试
    let cell = Cell::new(0u64);
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        cell.set(cell.get() + 1);
    }
    let cell_duration = start.elapsed();

    // RefCell 性能测试
    let refcell = RefCell::new(0u64);
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        *refcell.borrow_mut() += 1;
    }
    let refcell_duration = start.elapsed();

    // 普通可变变量性能测试（作为基准）
    let mut normal = 0u64;
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        normal += 1;
    }
    let normal_duration = start.elapsed();

    println!("性能对比 ({} 次迭代):", ITERATIONS);
    println!("  普通变量: {:?}", normal_duration);
    println!("  Cell:     {:?} (相对普通: {:.2}x)",
             cell_duration,
             cell_duration.as_nanos() as f64 / normal_duration.as_nanos() as f64);
    println!("  RefCell:  {:?} (相对普通: {:.2}x)",
             refcell_duration,
             refcell_duration.as_nanos() as f64 / normal_duration.as_nanos() as f64);
}

fn main() {
    performance_comparison();
}
```

### 内存开销分析

```rust
use std::cell::{Cell, RefCell};
use std::mem::size_of;

fn memory_overhead() {
    println!("内存开销分析:");
    println!();

    // 基本类型
    println!("i32:           {} 字节", size_of::<i32>());
    println!("Cell<i32>:     {} 字节", size_of::<Cell<i32>>());
    println!("RefCell<i32>:  {} 字节", size_of::<RefCell<i32>>());
    println!();

    // 较大类型
    println!("[u8; 100]:           {} 字节", size_of::<[u8; 100]>());
    println!("Cell<[u8; 100]>:     {} 字节", size_of::<Cell<[u8; 100]>>());
    println!("RefCell<[u8; 100]>:  {} 字节", size_of::<RefCell<[u8; 100]>>());
    println!();

    // 指针类型
    println!("Box<i32>:            {} 字节", size_of::<Box<i32>>());
    println!("RefCell<Box<i32>>:   {} 字节", size_of::<RefCell<Box<i32>>>());
    println!();

    // RefCell 的额外开销来自借用状态标记
    println!("RefCell 额外开销: {} 字节",
             size_of::<RefCell<i32>>() - size_of::<i32>());
}

fn main() {
    memory_overhead();
}
```

### 借用检查的开销

```rust
use std::cell::RefCell;

/// RefCell 的运行时借用检查机制
///
/// RefCell 内部维护一个借用计数器（通常是 isize）：
/// - 0: 未被借用
/// - 正数: 不可变借用的数量
/// - -1: 存在可变借用
///
/// 每次 borrow() 或 borrow_mut() 都需要：
/// 1. 读取当前计数
/// 2. 检查是否允许借用
/// 3. 更新计数
///
/// 每次 Ref/RefMut 释放时需要：
/// 1. 减少/重置计数
fn explain_overhead() {
    let data = RefCell::new(42);

    // borrow() 的伪代码：
    // if count < 0 { panic!("already mutably borrowed"); }
    // count += 1;
    // return Ref { ... }

    // borrow_mut() 的伪代码：
    // if count != 0 { panic!("already borrowed"); }
    // count = -1;
    // return RefMut { ... }

    // Ref::drop() 的伪代码：
    // count -= 1;

    // RefMut::drop() 的伪代码：
    // count = 0;

    let r = data.borrow();
    println!("值: {}", *r);
}

fn main() {
    explain_overhead();
}
```

### 优化建议

```rust
use std::cell::{Cell, RefCell};

struct OptimizedDesign {
    // 对于频繁访问的简单值，使用 Cell
    access_count: Cell<u64>,
    last_access_time: Cell<u64>,

    // 对于不常修改的复杂数据，使用 RefCell
    cache: RefCell<std::collections::HashMap<String, String>>,
}

impl OptimizedDesign {
    fn new() -> Self {
        OptimizedDesign {
            access_count: Cell::new(0),
            last_access_time: Cell::new(0),
            cache: RefCell::new(std::collections::HashMap::new()),
        }
    }

    // 优化：批量操作减少借用次数
    fn batch_update(&self, updates: Vec<(String, String)>) {
        // 一次获取可变借用，执行多次操作
        let mut cache = self.cache.borrow_mut();
        for (key, value) in updates {
            cache.insert(key, value);
        }
        // 只有一次借用开销
    }

    // 反例：多次借用
    fn inefficient_update(&self, updates: Vec<(String, String)>) {
        for (key, value) in updates {
            // 每次循环都有借用开销
            self.cache.borrow_mut().insert(key, value);
        }
    }

    // 优化：先检查是否需要修改
    fn smart_get_or_insert(&self, key: &str, compute: impl FnOnce() -> String) -> String {
        // 先用不可变借用检查
        if let Some(value) = self.cache.borrow().get(key) {
            return value.clone();
        }

        // 确实需要插入时再可变借用
        let value = compute();
        self.cache.borrow_mut().insert(key.to_string(), value.clone());
        value
    }
}

fn main() {
    let design = OptimizedDesign::new();

    // 批量更新
    design.batch_update(vec![
        ("key1".to_string(), "value1".to_string()),
        ("key2".to_string(), "value2".to_string()),
    ]);

    // 智能获取
    let value = design.smart_get_or_insert("key3", || "computed".to_string());
    println!("值: {}", value);
}
```

---

## 实战场景

### 场景 1：实现简单的状态机

```rust
use std::cell::Cell;

#[derive(Debug, Clone, Copy, PartialEq)]
enum State {
    Idle,
    Running,
    Paused,
    Completed,
}

struct StateMachine {
    current_state: Cell<State>,
    transitions: u32,
}

impl StateMachine {
    fn new() -> Self {
        StateMachine {
            current_state: Cell::new(State::Idle),
            transitions: 0,
        }
    }

    fn current(&self) -> State {
        self.current_state.get()
    }

    fn start(&self) -> Result<(), &'static str> {
        match self.current_state.get() {
            State::Idle => {
                self.current_state.set(State::Running);
                Ok(())
            }
            State::Paused => {
                self.current_state.set(State::Running);
                Ok(())
            }
            _ => Err("无法从当前状态启动"),
        }
    }

    fn pause(&self) -> Result<(), &'static str> {
        match self.current_state.get() {
            State::Running => {
                self.current_state.set(State::Paused);
                Ok(())
            }
            _ => Err("只能在运行状态下暂停"),
        }
    }

    fn complete(&self) -> Result<(), &'static str> {
        match self.current_state.get() {
            State::Running => {
                self.current_state.set(State::Completed);
                Ok(())
            }
            _ => Err("只能从运行状态完成"),
        }
    }

    fn reset(&self) {
        self.current_state.set(State::Idle);
    }
}

fn main() {
    let machine = StateMachine::new();
    println!("初始状态: {:?}", machine.current());

    machine.start().unwrap();
    println!("启动后: {:?}", machine.current());

    machine.pause().unwrap();
    println!("暂停后: {:?}", machine.current());

    machine.start().unwrap();
    println!("恢复后: {:?}", machine.current());

    machine.complete().unwrap();
    println!("完成后: {:?}", machine.current());
}
```

### 场景 2：配置管理系统

```rust
use std::cell::RefCell;
use std::collections::HashMap;

struct ConfigManager {
    config: RefCell<HashMap<String, String>>,
    access_log: RefCell<Vec<String>>,
}

impl ConfigManager {
    fn new() -> Self {
        ConfigManager {
            config: RefCell::new(HashMap::new()),
            access_log: RefCell::new(Vec::new()),
        }
    }

    fn set(&self, key: &str, value: &str) {
        self.access_log.borrow_mut().push(format!("SET {}={}", key, value));
        self.config.borrow_mut().insert(key.to_string(), value.to_string());
    }

    fn get(&self, key: &str) -> Option<String> {
        self.access_log.borrow_mut().push(format!("GET {}", key));
        self.config.borrow().get(key).cloned()
    }

    fn get_or_default(&self, key: &str, default: &str) -> String {
        self.get(key).unwrap_or_else(|| {
            self.set(key, default);
            default.to_string()
        })
    }

    fn show_access_log(&self) {
        println!("访问日志:");
        for entry in self.access_log.borrow().iter() {
            println!("  {}", entry);
        }
    }
}

fn main() {
    let config = ConfigManager::new();

    config.set("database.host", "localhost");
    config.set("database.port", "5432");

    let host = config.get("database.host");
    println!("数据库主机: {:?}", host);

    let timeout = config.get_or_default("database.timeout", "30");
    println!("超时设置: {}", timeout);

    config.show_access_log();
}
```

### 场景 3：事件发布-订阅系统

```rust
use std::rc::Rc;
use std::cell::RefCell;
use std::collections::HashMap;

type EventHandler = Box<dyn Fn(&str)>;

struct EventBus {
    handlers: RefCell<HashMap<String, Vec<EventHandler>>>,
    event_count: std::cell::Cell<u64>,
}

impl EventBus {
    fn new() -> Rc<Self> {
        Rc::new(EventBus {
            handlers: RefCell::new(HashMap::new()),
            event_count: std::cell::Cell::new(0),
        })
    }

    fn subscribe(&self, event_type: &str, handler: impl Fn(&str) + 'static) {
        self.handlers
            .borrow_mut()
            .entry(event_type.to_string())
            .or_insert_with(Vec::new)
            .push(Box::new(handler));
    }

    fn publish(&self, event_type: &str, data: &str) {
        self.event_count.set(self.event_count.get() + 1);

        if let Some(handlers) = self.handlers.borrow().get(event_type) {
            for handler in handlers {
                handler(data);
            }
        }
    }

    fn event_count(&self) -> u64 {
        self.event_count.get()
    }
}

fn main() {
    let bus = EventBus::new();

    // 订阅事件
    bus.subscribe("user.login", |data| {
        println!("[LoginHandler] 用户登录: {}", data);
    });

    bus.subscribe("user.login", |data| {
        println!("[AuditLogger] 记录登录: {}", data);
    });

    bus.subscribe("user.logout", |data| {
        println!("[LogoutHandler] 用户登出: {}", data);
    });

    // 发布事件
    bus.publish("user.login", "alice");
    bus.publish("user.login", "bob");
    bus.publish("user.logout", "alice");

    println!("\n总共发布了 {} 个事件", bus.event_count());
}
```

### 场景 4：带撤销功能的编辑器

```rust
use std::cell::RefCell;

#[derive(Clone)]
struct DocumentState {
    content: String,
}

struct Document {
    current: RefCell<DocumentState>,
    undo_stack: RefCell<Vec<DocumentState>>,
    redo_stack: RefCell<Vec<DocumentState>>,
}

impl Document {
    fn new(content: &str) -> Self {
        Document {
            current: RefCell::new(DocumentState {
                content: content.to_string(),
            }),
            undo_stack: RefCell::new(Vec::new()),
            redo_stack: RefCell::new(Vec::new()),
        }
    }

    fn content(&self) -> String {
        self.current.borrow().content.clone()
    }

    fn edit(&self, new_content: &str) {
        // 保存当前状态到撤销栈
        let old_state = self.current.borrow().clone();
        self.undo_stack.borrow_mut().push(old_state);

        // 清空重做栈
        self.redo_stack.borrow_mut().clear();

        // 更新当前状态
        self.current.borrow_mut().content = new_content.to_string();
    }

    fn undo(&self) -> bool {
        if let Some(prev_state) = self.undo_stack.borrow_mut().pop() {
            // 保存当前状态到重做栈
            let current = self.current.borrow().clone();
            self.redo_stack.borrow_mut().push(current);

            // 恢复之前的状态
            *self.current.borrow_mut() = prev_state;
            true
        } else {
            false
        }
    }

    fn redo(&self) -> bool {
        if let Some(next_state) = self.redo_stack.borrow_mut().pop() {
            // 保存当前状态到撤销栈
            let current = self.current.borrow().clone();
            self.undo_stack.borrow_mut().push(current);

            // 应用重做状态
            *self.current.borrow_mut() = next_state;
            true
        } else {
            false
        }
    }

    fn can_undo(&self) -> bool {
        !self.undo_stack.borrow().is_empty()
    }

    fn can_redo(&self) -> bool {
        !self.redo_stack.borrow().is_empty()
    }
}

fn main() {
    let doc = Document::new("Hello");
    println!("初始: {}", doc.content());

    doc.edit("Hello, World");
    println!("编辑1: {}", doc.content());

    doc.edit("Hello, Rust");
    println!("编辑2: {}", doc.content());

    doc.undo();
    println!("撤销: {}", doc.content());

    doc.undo();
    println!("再撤销: {}", doc.content());

    doc.redo();
    println!("重做: {}", doc.content());

    println!("\n可撤销: {}, 可重做: {}", doc.can_undo(), doc.can_redo());
}
```

---

## 面试要点

### 什么是内部可变性？为什么需要它？

**答案要点**：
- 内部可变性允许在只有不可变引用的情况下修改数据
- 解决编译器静态借用检查过于严格的问题
- 典型场景：Mock 对象、缓存、引用计数容器内部的修改
- 将借用检查从编译时推迟到运行时

### Cell 和 RefCell 的区别是什么？

**答案要点**：

| 对比项 | Cell\<T\> | RefCell\<T\> |
|--------|-----------|--------------|
| 类型约束 | T: Copy | 任意 T |
| 获取方式 | get() 返回值副本 | borrow() 返回引用 |
| 运行时开销 | 无 | 借用状态追踪 |
| panic 可能 | 不可能 | 借用冲突时 panic |
| 使用场景 | 简单标量 | 复杂数据结构 |

### RefCell 的 borrow() 和 borrow_mut() 什么时候会 panic？

**答案要点**：
- `borrow()` 在已有 `borrow_mut()` 时会 panic
- `borrow_mut()` 在已有任何借用（`borrow()` 或 `borrow_mut()`）时会 panic
- 使用 `try_borrow()` 和 `try_borrow_mut()` 可以避免 panic
- 借用规则与编译时相同，只是在运行时检查

### Rc\<RefCell\<T\>\> 模式的应用场景和注意事项？

**答案要点**：

应用场景：
- 需要多个所有者共享可变数据
- 图数据结构中的节点
- 观察者模式中的共享状态

注意事项：
- 不是线程安全的（单线程使用）
- 可能导致运行时借用冲突
- 需要避免循环引用（使用 Weak）
- 多线程场景使用 `Arc<Mutex<T>>` 或 `Arc<RwLock<T>>`

### 如何避免 RefCell 的借用冲突？

**答案要点**：
- 最小化借用作用域
- 使用代码块限制 Ref/RefMut 的生命周期
- 使用 `try_borrow()` 系列方法
- 避免在持有借用时调用可能再次借用的方法
- 必要时使用 `drop()` 显式释放借用

### 为什么 Cell 和 RefCell 不是线程安全的？

**答案要点**：
- 它们没有实现 `Sync` trait
- Cell 的 get/set 不是原子操作
- RefCell 的借用计数不是原子的
- 多线程场景需要使用 `Mutex`、`RwLock`（配合 `Arc`）或原子类型

---

## 延伸阅读

### 官方文档
- [std::cell 模块文档](https://doc.rust-lang.org/std/cell/index.html)
- [The Rust Programming Language - RefCell](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html)
- [Rust Reference - Interior Mutability](https://doc.rust-lang.org/reference/interior-mutability.html)

### 相关类型
- [std::sync::Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html) - 线程安全的互斥锁
- [std::sync::RwLock](https://doc.rust-lang.org/std/sync/struct.RwLock.html) - 线程安全的读写锁
- [std::sync::atomic](https://doc.rust-lang.org/std/sync/atomic/index.html) - 原子类型

### 进阶主题
- [UnsafeCell 深入理解](https://doc.rust-lang.org/std/cell/struct.UnsafeCell.html)
- [OnceCell 和 LazyCell](https://doc.rust-lang.org/std/cell/struct.OnceCell.html)
- [GhostCell - 一种新的内部可变性模式](https://plv.mpi-sws.org/rustbelt/ghostcell/)

### 相关书籍
- 《Rust 程序设计语言》第 15 章
- 《Rust 编程之道》内存管理章节
- 《Programming Rust》Chapter 9: Structs
