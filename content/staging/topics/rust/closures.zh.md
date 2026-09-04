---
title: Rust 闭包详解
description: 深入学习 Rust 闭包，包括捕获环境、Fn traits 和闭包作为参数
track: rust
section: ownership-borrowing
difficulty: intermediate
tags:
  - Rust
  - 闭包
  - 函数式编程
status: imported
origin: old/src/content/docs/rust/closures.zh.md
divergence: 0.362
issues:
  - divergent
legacy:
  category: Rust
  subcategory: 核心概念
  order: 19
  lastUpdated: 2026-01-07
---

闭包（Closure）是 Rust 中一种强大的函数式编程特性。与普通函数不同，闭包可以捕获其定义环境中的变量，这使得它们在编写简洁、灵活的代码时非常有用。

## 什么是闭包

闭包是一种匿名函数，可以保存在变量中或作为参数传递给其他函数。闭包最重要的特性是能够捕获其所在作用域中的值。

### 闭包的基本语法

闭包使用 `|参数|` 语法定义，而不是函数的 `fn(参数)` 语法：

```rust
fn main() {
    // 最简单的闭包
    let greet = || println!("Hello!");
    greet(); // 输出: Hello!

    // 带参数的闭包
    let add = |a, b| a + b;
    println!("{}", add(2, 3)); // 输出: 5

    // 带类型注解的闭包
    let multiply = |x: i32, y: i32| -> i32 {
        x * y
    };
    println!("{}", multiply(4, 5)); // 输出: 20

    // 多行闭包
    let complex = |x: i32| {
        let doubled = x * 2;
        let squared = doubled * doubled;
        squared + 1
    };
    println!("{}", complex(3)); // 输出: 37
}
```

### 闭包与函数的对比

```rust
// 函数定义
fn add_one_fn(x: i32) -> i32 {
    x + 1
}

fn main() {
    // 闭包定义 - 多种等价写法
    let add_one_v1 = |x: i32| -> i32 { x + 1 };  // 完整类型注解
    let add_one_v2 = |x: i32| x + 1;              // 省略返回类型
    let add_one_v3 = |x| x + 1;                   // 省略所有类型注解

    // 所有版本的行为相同
    println!("{}", add_one_fn(5));  // 6
    println!("{}", add_one_v1(5));  // 6
    println!("{}", add_one_v2(5));  // 6
    println!("{}", add_one_v3(5));  // 6
}
```

## 捕获环境

闭包最强大的特性是能够捕获其定义作用域中的变量。根据闭包如何使用这些变量，Rust 会自动推断捕获方式。

### 三种捕获方式

闭包可以通过三种方式捕获环境中的变量：

1. **不可变借用**（`&T`）- 闭包只读取变量
2. **可变借用**（`&mut T`）- 闭包修改变量
3. **获取所有权**（`T`）- 闭包获取变量的所有权

```rust
fn main() {
    // 1. 不可变借用
    let message = String::from("Hello");
    let print_message = || println!("{}", message);
    print_message();
    println!("原始值仍可用: {}", message); // message 仍然可用

    // 2. 可变借用
    let mut counter = 0;
    let mut increment = || {
        counter += 1;
        println!("Counter: {}", counter);
    };
    increment(); // Counter: 1
    increment(); // Counter: 2
    // 注意：在闭包存在期间，不能有其他对 counter 的借用
    drop(increment); // 显式释放闭包
    println!("最终值: {}", counter); // 最终值: 2

    // 3. 获取所有权
    let data = vec![1, 2, 3];
    let consume_data = || {
        println!("数据: {:?}", data);
        drop(data); // 消费数据
    };
    consume_data();
    // println!("{:?}", data); // 错误！data 已被移动
}
```

### 智能捕获推断

Rust 编译器会根据闭包体中如何使用变量来推断捕获方式：

```rust
fn main() {
    let s1 = String::from("被借用");
    let s2 = String::from("被移动");
    let mut s3 = String::from("被可变借用");

    let closure = || {
        // s1 被不可变借用（只读取）
        println!("s1: {}", s1);

        // s2 被移动（所有权转移）
        let _owned = s2;

        // s3 被可变借用（修改）
        s3.push_str("！");
    };

    closure();

    println!("s1 仍然可用: {}", s1);
    // println!("{}", s2); // 错误：s2 已被移动
    // println!("{}", s3); // 错误：s3 仍被闭包借用（如果闭包还存在）
}
```

## move 闭包

使用 `move` 关键字可以强制闭包获取所有捕获变量的所有权，这在需要将闭包传递到另一个线程时特别有用。

### move 关键字的使用

```rust
fn main() {
    let numbers = vec![1, 2, 3];

    // 不使用 move - 闭包借用 numbers
    let print_numbers = || println!("{:?}", numbers);
    print_numbers();
    println!("numbers 仍可用: {:?}", numbers);

    // 使用 move - 闭包获取 numbers 的所有权
    let take_numbers = move || {
        println!("已移动: {:?}", numbers);
    };
    take_numbers();
    // println!("{:?}", numbers); // 错误！numbers 已被移动到闭包中
}
```

### 线程中的 move 闭包

`move` 闭包在多线程编程中非常重要：

```rust
use std::thread;

fn main() {
    let message = String::from("来自主线程的消息");

    // 必须使用 move，因为新线程可能比主线程存活更久
    let handle = thread::spawn(move || {
        println!("子线程收到: {}", message);
    });

    // println!("{}", message); // 错误：message 已被移动

    handle.join().unwrap();
}
```

### Copy 类型与 move

对于实现了 `Copy` trait 的类型，`move` 会复制值而不是移动：

```rust
fn main() {
    let x = 42; // i32 实现了 Copy

    let closure = move || {
        println!("闭包中的 x: {}", x);
    };

    closure();
    println!("原始 x 仍可用: {}", x); // 可以使用，因为 x 被复制了
}
```

## Fn Traits

Rust 使用三个 trait 来表示闭包的不同行为：`Fn`、`FnMut` 和 `FnOnce`。这些 trait 决定了闭包如何访问捕获的变量。

### FnOnce

`FnOnce` 是最基本的闭包 trait。所有闭包都实现了 `FnOnce`，表示闭包至少可以被调用一次：

```rust
fn call_once<F>(f: F)
where
    F: FnOnce() -> String,
{
    let result = f();
    println!("结果: {}", result);
    // f(); // 错误！不能再次调用
}

fn main() {
    let s = String::from("Hello");

    // 这个闭包会消费 s，所以只能调用一次
    let consume = || {
        let owned = s; // 获取 s 的所有权
        owned + " World"
    };

    call_once(consume);
    // call_once(consume); // 错误：闭包已被消费
}
```

### FnMut

`FnMut` 表示闭包可以修改捕获的变量，可以被多次调用：

```rust
fn call_multiple_times<F>(mut f: F)
where
    F: FnMut(i32) -> i32,
{
    println!("第一次调用: {}", f(1));
    println!("第二次调用: {}", f(2));
    println!("第三次调用: {}", f(3));
}

fn main() {
    let mut sum = 0;

    let accumulator = |x| {
        sum += x;
        sum
    };

    call_multiple_times(accumulator);
    // 输出:
    // 第一次调用: 1
    // 第二次调用: 3
    // 第三次调用: 6
}
```

### Fn

`Fn` 是最严格的 trait，表示闭包只不可变地借用捕获的变量：

```rust
fn call_many<F>(f: F)
where
    F: Fn(i32) -> i32,
{
    // 可以任意多次调用，甚至可以并发调用
    println!("{}", f(1));
    println!("{}", f(2));
    println!("{}", f(3));
}

fn main() {
    let factor = 10;

    // 只读取 factor，不修改
    let multiplier = |x| x * factor;

    call_many(multiplier);
    call_many(multiplier); // 可以再次传递

    println!("factor 仍可用: {}", factor);
}
```

### Trait 层次关系

三个 trait 之间存在继承关系：

```
Fn : FnMut : FnOnce
```

- 所有闭包都实现 `FnOnce`
- 不消费捕获变量的闭包还实现 `FnMut`
- 不修改捕获变量的闭包还实现 `Fn`

```rust
fn main() {
    let s = String::from("hello");

    // 实现 Fn + FnMut + FnOnce
    let fn_closure = || println!("{}", s);

    let mut count = 0;
    // 实现 FnMut + FnOnce（但不是 Fn）
    let fnmut_closure = || {
        count += 1;
        println!("count: {}", count);
    };

    let data = vec![1, 2, 3];
    // 只实现 FnOnce
    let fnonce_closure = || {
        drop(data);
        println!("data dropped");
    };
}
```

## 闭包作为函数参数

闭包最常见的用途之一是作为函数参数传递，这使得高阶函数成为可能。

### 使用泛型和 trait bound

```rust
// 接受实现 Fn 的闭包
fn apply<F>(value: i32, f: F) -> i32
where
    F: Fn(i32) -> i32,
{
    f(value)
}

// 接受实现 FnMut 的闭包
fn apply_mut<F>(value: i32, mut f: F) -> i32
where
    F: FnMut(i32) -> i32,
{
    f(value)
}

// 接受实现 FnOnce 的闭包
fn apply_once<F>(value: i32, f: F) -> i32
where
    F: FnOnce(i32) -> i32,
{
    f(value)
}

fn main() {
    let add_ten = |x| x + 10;

    println!("{}", apply(5, add_ten));      // 15
    println!("{}", apply_mut(5, add_ten));  // 15
    println!("{}", apply_once(5, add_ten)); // 15
}
```

### 使用 impl Trait 语法

Rust 2018 引入了更简洁的 `impl Trait` 语法：

```rust
fn apply(value: i32, f: impl Fn(i32) -> i32) -> i32 {
    f(value)
}

fn apply_twice(value: i32, f: impl Fn(i32) -> i32) -> i32 {
    f(f(value))
}

fn main() {
    let double = |x| x * 2;

    println!("{}", apply(5, double));       // 10
    println!("{}", apply_twice(5, double)); // 20
}
```

### 使用 trait 对象实现动态分发

当需要存储不同类型的闭包时，可以使用 trait 对象：

```rust
fn main() {
    // 使用 Box<dyn Fn> 存储不同的闭包
    let operations: Vec<Box<dyn Fn(i32) -> i32>> = vec![
        Box::new(|x| x + 1),
        Box::new(|x| x * 2),
        Box::new(|x| x * x),
    ];

    let value = 5;
    for (i, op) in operations.iter().enumerate() {
        println!("操作 {}: {}", i, op(value));
    }
    // 输出:
    // 操作 0: 6
    // 操作 1: 10
    // 操作 2: 25
}
```

## 闭包作为返回值

返回闭包需要使用 `impl Trait` 或 `Box<dyn Trait>`，因为闭包类型是匿名的。

### 使用 impl Trait 返回闭包

```rust
// 返回一个加法器闭包
fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
    move |x| x + n
}

// 返回一个乘法器闭包
fn make_multiplier(factor: i32) -> impl Fn(i32) -> i32 {
    move |x| x * factor
}

fn main() {
    let add_five = make_adder(5);
    let triple = make_multiplier(3);

    println!("{}", add_five(10)); // 15
    println!("{}", triple(10));   // 30

    // 组合使用
    println!("{}", triple(add_five(10))); // 45
}
```

### 使用 Box 返回不同类型的闭包

当需要根据条件返回不同闭包时，必须使用 `Box<dyn Fn>`：

```rust
fn make_operation(multiply: bool) -> Box<dyn Fn(i32) -> i32> {
    if multiply {
        Box::new(|x| x * 2)
    } else {
        Box::new(|x| x + 2)
    }
}

fn main() {
    let double = make_operation(true);
    let add_two = make_operation(false);

    println!("double(5) = {}", double(5));   // 10
    println!("add_two(5) = {}", add_two(5)); // 7
}
```

### 返回捕获环境的闭包

```rust
fn create_counter() -> impl FnMut() -> i32 {
    let mut count = 0;
    move || {
        count += 1;
        count
    }
}

fn main() {
    let mut counter = create_counter();

    println!("{}", counter()); // 1
    println!("{}", counter()); // 2
    println!("{}", counter()); // 3

    // 创建新的计数器，独立计数
    let mut counter2 = create_counter();
    println!("{}", counter2()); // 1
}
```

## 闭包与迭代器

闭包与迭代器的结合是 Rust 函数式编程的核心。

### 常用的迭代器方法

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // map - 转换每个元素
    let doubled: Vec<i32> = numbers.iter()
        .map(|x| x * 2)
        .collect();
    println!("doubled: {:?}", doubled);

    // filter - 过滤元素
    let evens: Vec<&i32> = numbers.iter()
        .filter(|x| *x % 2 == 0)
        .collect();
    println!("evens: {:?}", evens);

    // filter_map - 同时过滤和转换
    let parsed: Vec<i32> = vec!["1", "two", "3", "four", "5"]
        .iter()
        .filter_map(|s| s.parse().ok())
        .collect();
    println!("parsed: {:?}", parsed);

    // fold - 累积操作
    let sum: i32 = numbers.iter()
        .fold(0, |acc, x| acc + x);
    println!("sum: {}", sum);

    // find - 查找第一个匹配项
    let first_even = numbers.iter()
        .find(|x| *x % 2 == 0);
    println!("first_even: {:?}", first_even);

    // any / all - 检查条件
    let has_ten = numbers.iter().any(|x| *x == 10);
    let all_positive = numbers.iter().all(|x| *x > 0);
    println!("has_ten: {}, all_positive: {}", has_ten, all_positive);
}
```

### 链式调用

```rust
fn main() {
    let words = vec!["hello", "world", "rust", "programming"];

    // 链式处理
    let result: String = words.iter()
        .filter(|w| w.len() > 4)           // 过滤长度 > 4 的单词
        .map(|w| w.to_uppercase())          // 转换为大写
        .collect::<Vec<_>>()                // 收集为向量
        .join(", ");                        // 用逗号连接

    println!("{}", result); // HELLO, WORLD, PROGRAMMING
}
```

### 自定义排序

```rust
fn main() {
    let mut people = vec![
        ("Alice", 30),
        ("Bob", 25),
        ("Charlie", 35),
        ("Diana", 28),
    ];

    // 按年龄排序
    people.sort_by(|a, b| a.1.cmp(&b.1));
    println!("按年龄: {:?}", people);

    // 按名字长度排序
    people.sort_by(|a, b| a.0.len().cmp(&b.0.len()));
    println!("按名字长度: {:?}", people);

    // 使用 sort_by_key 简化
    people.sort_by_key(|p| p.1);
    println!("按年龄 (使用 key): {:?}", people);
}
```

## 闭包的性能

Rust 闭包是零成本抽象，编译器会对闭包进行优化。

### 内联优化

```rust
fn main() {
    let numbers: Vec<i32> = (1..=1000000).collect();

    // 这段代码会被编译器优化，性能接近手写循环
    let sum: i32 = numbers.iter()
        .filter(|x| *x % 2 == 0)
        .map(|x| x * x)
        .sum();

    println!("偶数平方和: {}", sum);
}
```

### 闭包大小

每个闭包都有唯一类型，其大小取决于捕获的变量：

```rust
use std::mem::size_of_val;

fn main() {
    let a = 42i32;
    let b = String::from("hello");

    // 不捕获任何变量的闭包大小为 0
    let closure1 = || println!("no capture");
    println!("closure1 大小: {} bytes", size_of_val(&closure1));

    // 捕获 i32 的闭包
    let closure2 = || println!("{}", a);
    println!("closure2 大小: {} bytes", size_of_val(&closure2));

    // 捕获 String 的闭包（String 是 24 bytes：指针 + 长度 + 容量）
    let closure3 = || println!("{}", b);
    println!("closure3 大小: {} bytes", size_of_val(&closure3));
}
```

## 实际应用示例

### 事件回调系统

```rust
type Callback = Box<dyn Fn(&str)>;

struct EventEmitter {
    callbacks: Vec<Callback>,
}

impl EventEmitter {
    fn new() -> Self {
        EventEmitter { callbacks: vec![] }
    }

    fn on<F>(&mut self, callback: F)
    where
        F: Fn(&str) + 'static,
    {
        self.callbacks.push(Box::new(callback));
    }

    fn emit(&self, message: &str) {
        for callback in &self.callbacks {
            callback(message);
        }
    }
}

fn main() {
    let mut emitter = EventEmitter::new();

    emitter.on(|msg| println!("监听器 1: {}", msg));
    emitter.on(|msg| println!("监听器 2: {}", msg.to_uppercase()));

    emitter.emit("Hello, World!");
    // 输出:
    // 监听器 1: Hello, World!
    // 监听器 2: HELLO, WORLD!
}
```

### 惰性求值

```rust
struct Lazy<T, F>
where
    F: FnOnce() -> T,
{
    value: Option<T>,
    initializer: Option<F>,
}

impl<T, F> Lazy<T, F>
where
    F: FnOnce() -> T,
{
    fn new(f: F) -> Self {
        Lazy {
            value: None,
            initializer: Some(f),
        }
    }

    fn get(&mut self) -> &T {
        if self.value.is_none() {
            let f = self.initializer.take().unwrap();
            self.value = Some(f());
        }
        self.value.as_ref().unwrap()
    }
}

fn main() {
    let mut expensive = Lazy::new(|| {
        println!("执行昂贵的计算...");
        42
    });

    println!("创建完成，尚未计算");
    println!("第一次访问: {}", expensive.get()); // 触发计算
    println!("第二次访问: {}", expensive.get()); // 使用缓存值
}
```

### 函数组合

```rust
fn compose<A, B, C, F, G>(f: F, g: G) -> impl Fn(A) -> C
where
    F: Fn(A) -> B,
    G: Fn(B) -> C,
{
    move |x| g(f(x))
}

fn main() {
    let add_one = |x: i32| x + 1;
    let double = |x: i32| x * 2;
    let to_string = |x: i32| format!("结果: {}", x);

    // 组合函数：(x + 1) * 2
    let add_then_double = compose(add_one, double);
    println!("{}", add_then_double(5)); // 12

    // 三个函数组合
    let pipeline = compose(compose(add_one, double), to_string);
    println!("{}", pipeline(5)); // 结果: 12
}
```

## 常见陷阱与最佳实践

### 避免不必要的 clone

```rust
fn main() {
    let data = vec![1, 2, 3, 4, 5];

    // 不好的做法：不必要的 clone
    let bad = || {
        let cloned = data.clone();
        println!("{:?}", cloned);
    };

    // 好的做法：只借用
    let good = || {
        println!("{:?}", data);
    };

    good();
    println!("data 仍可用: {:?}", data);
}
```

### 理解生命周期

```rust
fn returns_closure(s: &str) -> impl Fn() + '_ {
    // 闭包捕获了引用，需要标注生命周期
    move || println!("{}", s)
}

fn main() {
    let text = String::from("Hello");
    let closure = returns_closure(&text);
    closure(); // Hello
}
```

### 选择正确的 Fn trait

```rust
// 选择最宽松的 trait bound
fn process<F: FnOnce()>(f: F) { f(); }       // 最灵活
fn process_mut<F: FnMut()>(mut f: F) { f(); } // 中等
fn process_ref<F: Fn()>(f: F) { f(); }        // 最严格

// 根据实际需要选择：
// - 只需要调用一次？用 FnOnce
// - 需要多次调用且可能修改状态？用 FnMut
// - 需要多次调用且可能并发？用 Fn
```

## 总结

Rust 闭包是一个强大而灵活的特性：

1. **语法简洁**：使用 `|参数|` 语法定义，类型通常可以推断
2. **环境捕获**：自动推断借用、可变借用或移动语义
3. **move 关键字**：强制获取所有权，用于线程等场景
4. **Fn traits**：`Fn`、`FnMut`、`FnOnce` 表示不同的调用约定
5. **零成本抽象**：编译器优化确保高性能
6. **与迭代器配合**：实现优雅的函数式编程

掌握闭包是编写地道 Rust 代码的关键，它们在迭代器处理、回调函数、并发编程等场景中都有广泛应用。
