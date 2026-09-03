---
title: 智能指针
description: Rust 智能指针完全指南，Box、Rc、Arc、RefCell 和内部可变性
track: rust
section: ownership-borrowing
difficulty: advanced
tags:
  - Rust
  - Smart Pointers
  - Box
  - Rc
  - Arc
status: imported
origin: old/src/content/docs/rust/smart-pointers.zh.md
divergence: 0.216
issues: []
legacy:
  category: Rust
  subcategory: Memory Management
  order: 5
  lastUpdated: 2026-01-07
---

智能指针是一种数据结构，它们像指针一样工作，但提供超越简单内存地址的额外元数据和功能。与仅借用数据的普通引用不同，智能指针通常拥有它们指向的数据。Rust 标准库提供了多种智能指针类型，每种都是为特定用例设计的。

## 指针为何"智能"？

在 Rust 中，智能指针通常实现为实现了 `Deref` 和 `Drop` trait 的结构体：

- **`Deref`**：允许智能指针表现得像普通引用，支持使用 `*` 解引用和方法调用中的自动解引用。
- **`Drop`**：提供智能指针离开作用域时的自定义清理逻辑。

常见的智能指针包括 `String` 和 `Vec<T>`，它们拥有自己的数据，并提供超越简单引用的额外功能。

## Box\<T\>：堆分配

`Box<T>` 是最简单的智能指针，为值提供堆分配。除了堆分配本身之外，它没有性能开销。

### 何时使用 Box

1. **不应复制的大数据**：在栈上移动大型结构体是昂贵的。
2. **递归类型**：引用自身的类型需要间接引用。
3. **trait 对象**：当你需要使用 `dyn Trait` 进行动态分发时。

### 基本用法

```rust
fn main() {
    // 在堆上分配一个整数
    let boxed_num = Box::new(42);
    println!("Boxed value: {}", boxed_num);

    // 解引用
    let unboxed = *boxed_num;
    println!("Unboxed value: {}", unboxed);
}
```

### 使用 Box 的递归类型

没有 `Box`，递归类型将具有无限大小：

```rust
// 这无法编译 - 大小无限
// enum List {
//     Cons(i32, List),
//     Nil,
// }

// 使用 Box 进行间接引用
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));

    // 打印列表
    fn print_list(list: &List) {
        match list {
            Cons(value, next) => {
                print!("{} -> ", value);
                print_list(next);
            }
            Nil => println!("Nil"),
        }
    }

    print_list(&list); // 输出: 1 -> 2 -> 3 -> Nil
}
```

### 大数据传输

```rust
struct LargeStruct {
    data: [u8; 1000000],
}

fn main() {
    // 没有 Box：在栈上复制 1MB
    // let large = LargeStruct { data: [0; 1000000] };

    // 使用 Box：只复制一个指针（64 位系统上 8 字节）
    let large = Box::new(LargeStruct { data: [0; 1000000] });
    let moved_large = large; // 只复制指针
}
```

### 使用 Box 的 trait 对象

```rust
trait Animal {
    fn speak(&self);
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn speak(&self) {
        println!("Woof!");
    }
}

impl Animal for Cat {
    fn speak(&self) {
        println!("Meow!");
    }
}

fn main() {
    let animals: Vec<Box<dyn Animal>> = vec![
        Box::new(Dog),
        Box::new(Cat),
    ];

    for animal in &animals {
        animal.speak();
    }
}
```

### Box::leak 用于静态引用

有时你需要从拥有的数据创建 `'static` 引用：

```rust
fn main() {
    let boxed = Box::new(String::from("Hello, World!"));

    // 泄露 box 以获取 'static 引用
    let static_str: &'static str = Box::leak(boxed);

    println!("{}", static_str);
    // 注意：这块内存永远不会被释放
}
```

## Rc\<T\>：引用计数

`Rc<T>`（引用计数）允许同一数据的多所有权。它跟踪引用数量，只有当计数达到零时才释放内存。

**重要**：`Rc<T>` 仅用于单线程场景。它不是线程安全的。

### 基本用法

```rust
use std::rc::Rc;

fn main() {
    let data = Rc::new(vec![1, 2, 3]);

    println!("Reference count: {}", Rc::strong_count(&data)); // 1

    let data_clone = Rc::clone(&data);
    println!("Reference count: {}", Rc::strong_count(&data)); // 2

    {
        let another_clone = Rc::clone(&data);
        println!("Reference count: {}", Rc::strong_count(&data)); // 3
    }

    println!("Reference count: {}", Rc::strong_count(&data)); // 2
}
```

### 共享所有权示例

```rust
use std::rc::Rc;

#[derive(Debug)]
struct Node {
    value: i32,
    children: Vec<Rc<Node>>,
}

fn main() {
    // 创建共享节点
    let shared_child = Rc::new(Node {
        value: 10,
        children: vec![],
    });

    // 多个父节点可以引用同一个子节点
    let parent1 = Node {
        value: 1,
        children: vec![Rc::clone(&shared_child)],
    };

    let parent2 = Node {
        value: 2,
        children: vec![Rc::clone(&shared_child)],
    };

    println!("Shared child reference count: {}", Rc::strong_count(&shared_child)); // 3
    println!("Parent 1: {:?}", parent1);
    println!("Parent 2: {:?}", parent2);
}
```

### Rc 的弱引用

`Weak<T>` 防止可能导致内存泄漏的引用循环：

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}

fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });

    let branch = Rc::new(Node {
        value: 5,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![Rc::clone(&leaf)]),
    });

    // 使用弱引用将 leaf 的父节点设置为 branch
    *leaf.parent.borrow_mut() = Rc::downgrade(&branch);

    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade());
    println!("branch strong count: {}", Rc::strong_count(&branch)); // 1
    println!("branch weak count: {}", Rc::weak_count(&branch)); // 1
}
```

### 理解弱引用

```rust
use std::rc::{Rc, Weak};

fn main() {
    let strong = Rc::new(5);
    println!("Strong count: {}", Rc::strong_count(&strong)); // 1
    println!("Weak count: {}", Rc::weak_count(&strong));     // 0

    let weak: Weak<i32> = Rc::downgrade(&strong);
    println!("Strong count: {}", Rc::strong_count(&strong)); // 1
    println!("Weak count: {}", Rc::weak_count(&strong));     // 1

    // 通过弱引用访问值
    match weak.upgrade() {
        Some(rc) => println!("Value: {}", rc),
        None => println!("Value was dropped"),
    }

    drop(strong);

    // 丢弃强引用后
    match weak.upgrade() {
        Some(rc) => println!("Value: {}", rc),
        None => println!("Value was dropped"), // 这会打印
    }
}
```

## Arc\<T\>：原子引用计数

`Arc<T>`（原子引用计数）是 `Rc<T>` 的线程安全版本。它使用原子操作进行引用计数，使其可以安全地在线程间共享。

### 基本线程安全共享

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3, 4, 5]);
    let mut handles = vec![];

    for i in 0..3 {
        let data_clone = Arc::clone(&data);
        let handle = thread::spawn(move || {
            println!("Thread {}: {:?}", i, data_clone);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

### Arc 与 Mutex 用于可变共享状态

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter_clone = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter_clone.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", *counter.lock().unwrap()); // 10
}
```

### Arc 与 RwLock 用于读密集型工作负载

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // 多个读者
    for i in 0..3 {
        let data_clone = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let read_guard = data_clone.read().unwrap();
            println!("Reader {}: {:?}", i, *read_guard);
        }));
    }

    // 单个写者
    let data_clone = Arc::clone(&data);
    handles.push(thread::spawn(move || {
        let mut write_guard = data_clone.write().unwrap();
        write_guard.push(4);
        println!("Writer added element");
    }));

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final data: {:?}", *data.read().unwrap());
}
```

### 共享配置模式

```rust
use std::sync::Arc;
use std::thread;

struct Config {
    database_url: String,
    max_connections: u32,
    timeout_seconds: u64,
}

fn main() {
    let config = Arc::new(Config {
        database_url: String::from("postgres://localhost/mydb"),
        max_connections: 10,
        timeout_seconds: 30,
    });

    let mut handles = vec![];

    for i in 0..5 {
        let config = Arc::clone(&config);
        handles.push(thread::spawn(move || {
            println!(
                "Worker {}: connecting to {} with timeout {}s",
                i, config.database_url, config.timeout_seconds
            );
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

## 内部可变性

Rust 的借用规则通常阻止通过共享引用修改数据。内部可变性是一种设计模式，允许即使存在不可变引用也能进行修改，通过将借用检查从编译时移到运行时。

## Cell\<T\>：基于复制的内部可变性

`Cell<T>` 为实现 `Copy` 的类型提供内部可变性。它从不给出其内容的引用，而是将值复制进出。

### 基本用法

```rust
use std::cell::Cell;

struct Counter {
    value: Cell<i32>,
}

impl Counter {
    fn new() -> Self {
        Counter { value: Cell::new(0) }
    }

    fn increment(&self) {
        // 注意：&self，不是 &mut self
        self.value.set(self.value.get() + 1);
    }

    fn get(&self) -> i32 {
        self.value.get()
    }
}

fn main() {
    let counter = Counter::new();

    counter.increment();
    counter.increment();
    counter.increment();

    println!("Count: {}", counter.get()); // 3
}
```

### Cell 方法

```rust
use std::cell::Cell;

fn main() {
    let cell = Cell::new(5);

    // get：返回包含值的副本
    let value = cell.get();
    println!("Value: {}", value);

    // set：替换包含的值
    cell.set(10);
    println!("New value: {}", cell.get());

    // replace：替换并返回旧值
    let old = cell.replace(20);
    println!("Old: {}, New: {}", old, cell.get());

    // take：取出值，留下 Default::default()
    let cell_option: Cell<Option<i32>> = Cell::new(Some(42));
    let taken = cell_option.take();
    println!("Taken: {:?}, Remaining: {:?}", taken, cell_option.get());

    // update：使用函数更新包含的值（nightly 特性）
    // cell.update(|x| x + 1);
}
```

### Cell 用于缓存

```rust
use std::cell::Cell;

struct CachedComputation {
    input: i32,
    cached_result: Cell<Option<i32>>,
}

impl CachedComputation {
    fn new(input: i32) -> Self {
        CachedComputation {
            input,
            cached_result: Cell::new(None),
        }
    }

    fn compute(&self) -> i32 {
        match self.cached_result.get() {
            Some(result) => result,
            None => {
                // 昂贵的计算
                let result = self.input * self.input;
                self.cached_result.set(Some(result));
                result
            }
        }
    }
}

fn main() {
    let computation = CachedComputation::new(5);

    println!("First call: {}", computation.compute());  // 计算
    println!("Second call: {}", computation.compute()); // 使用缓存
}
```

## RefCell\<T\>：运行时借用检查

`RefCell<T>` 提供带有运行时借用检查的内部可变性。与 `Cell<T>` 不同，它可以处理任何类型，并提供对其内容的引用。

### 基本用法

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(vec![1, 2, 3]);

    // 不可变借用
    {
        let borrowed = data.borrow();
        println!("Data: {:?}", *borrowed);
    }

    // 可变借用
    {
        let mut borrowed_mut = data.borrow_mut();
        borrowed_mut.push(4);
    }

    println!("Modified data: {:?}", data.borrow());
}
```

### RefCell 在借用违规时 panic

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);

    let borrow1 = data.borrow();
    let borrow2 = data.borrow(); // OK：多个不可变借用

    println!("borrow1: {}, borrow2: {}", borrow1, borrow2);

    drop(borrow1);
    drop(borrow2);

    // 这会在运行时 panic：
    // let borrow = data.borrow();
    // let borrow_mut = data.borrow_mut(); // PANIC!
}
```

### 使用 try_borrow 进行安全访问

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(42);

    let _borrow = data.borrow_mut();

    // try_borrow 返回 Result 而不是 panic
    match data.try_borrow() {
        Ok(value) => println!("Value: {}", value),
        Err(_) => println!("Could not borrow: already mutably borrowed"),
    }

    match data.try_borrow_mut() {
        Ok(mut value) => *value = 100,
        Err(_) => println!("Could not mutably borrow: already borrowed"),
    }
}
```

### Mock 对象模式

```rust
use std::cell::RefCell;

trait Messenger {
    fn send(&self, msg: &str);
}

struct MockMessenger {
    messages: RefCell<Vec<String>>,
}

impl MockMessenger {
    fn new() -> MockMessenger {
        MockMessenger {
            messages: RefCell::new(vec![]),
        }
    }
}

impl Messenger for MockMessenger {
    fn send(&self, message: &str) {
        // 由于 RefCell，可以使用 &self 进行修改
        self.messages.borrow_mut().push(String::from(message));
    }
}

fn main() {
    let mock = MockMessenger::new();

    mock.send("Hello");
    mock.send("World");

    assert_eq!(mock.messages.borrow().len(), 2);
    println!("Messages: {:?}", mock.messages.borrow());
}
```

### 组合 Rc 和 RefCell

一个常见模式是组合 `Rc<RefCell<T>>` 用于共享可变状态：

```rust
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
struct SharedState {
    value: i32,
}

fn main() {
    let shared = Rc::new(RefCell::new(SharedState { value: 0 }));

    let reference1 = Rc::clone(&shared);
    let reference2 = Rc::clone(&shared);

    // 通过 reference1 修改
    reference1.borrow_mut().value = 42;

    // 通过 reference2 读取
    println!("Value via reference2: {}", reference2.borrow().value);

    // 通过 reference2 修改
    reference2.borrow_mut().value = 100;

    // 通过原始引用读取
    println!("Value via shared: {}", shared.borrow().value);
}
```

## Cow\<T\>：写时克隆

`Cow<T>`（Clone on Write，写时克隆）是一个提供写时克隆功能的智能指针。它可以持有借用数据或拥有的数据，只有在需要修改时才克隆。

### 基本用法

```rust
use std::borrow::Cow;

fn main() {
    // 借用的数据
    let borrowed: Cow<str> = Cow::Borrowed("hello");
    println!("Borrowed: {}", borrowed);

    // 拥有的数据
    let owned: Cow<str> = Cow::Owned(String::from("world"));
    println!("Owned: {}", owned);
}
```

### 高效字符串处理

```rust
use std::borrow::Cow;

fn remove_whitespace(input: &str) -> Cow<str> {
    if input.contains(' ') {
        // 需要修改：创建拥有的版本
        Cow::Owned(input.chars().filter(|c| *c != ' ').collect())
    } else {
        // 不需要修改：借用
        Cow::Borrowed(input)
    }
}

fn main() {
    let no_spaces = "hello";
    let with_spaces = "hello world";

    let result1 = remove_whitespace(no_spaces);
    let result2 = remove_whitespace(with_spaces);

    match &result1 {
        Cow::Borrowed(_) => println!("'{}' was borrowed (no allocation)", result1),
        Cow::Owned(_) => println!("'{}' was owned (allocated)", result1),
    }

    match &result2 {
        Cow::Borrowed(_) => println!("'{}' was borrowed (no allocation)", result2),
        Cow::Owned(_) => println!("'{}' was owned (allocated)", result2),
    }
}
```

### Cow 与 to_mut

```rust
use std::borrow::Cow;

fn ensure_uppercase(input: Cow<str>) -> Cow<str> {
    if input.chars().any(|c| c.is_lowercase()) {
        // to_mut() 如果是借用的则克隆，然后返回可变引用
        let mut owned = input.into_owned();
        owned.make_ascii_uppercase();
        Cow::Owned(owned)
    } else {
        input
    }
}

fn main() {
    let already_upper: Cow<str> = Cow::Borrowed("HELLO");
    let needs_upper: Cow<str> = Cow::Borrowed("Hello");

    println!("{}", ensure_uppercase(already_upper)); // 不分配
    println!("{}", ensure_uppercase(needs_upper));   // 分配
}
```

### 函数参数中的 Cow

```rust
use std::borrow::Cow;

fn process_name(name: Cow<str>) {
    println!("Processing: {}", name);
}

fn main() {
    // 可以接受借用和拥有的字符串
    process_name(Cow::Borrowed("Alice"));
    process_name(Cow::Owned(String::from("Bob")));

    // 使用 Into trait
    let borrowed: Cow<str> = "Charlie".into();
    let owned: Cow<str> = String::from("Diana").into();

    process_name(borrowed);
    process_name(owned);
}
```

### Cow 用于带默认值的配置

```rust
use std::borrow::Cow;

struct Config<'a> {
    name: Cow<'a, str>,
    path: Cow<'a, str>,
}

impl<'a> Config<'a> {
    fn new() -> Self {
        Config {
            name: Cow::Borrowed("default"),
            path: Cow::Borrowed("/tmp"),
        }
    }

    fn with_name(mut self, name: impl Into<Cow<'a, str>>) -> Self {
        self.name = name.into();
        self
    }

    fn with_path(mut self, path: impl Into<Cow<'a, str>>) -> Self {
        self.path = path.into();
        self
    }
}

fn main() {
    // 使用借用的默认值 - 不分配
    let default_config = Config::new();
    println!("Default: {} at {}", default_config.name, default_config.path);

    // 自定义值
    let custom_config = Config::new()
        .with_name("my_app")
        .with_path(String::from("/home/user/data"));
    println!("Custom: {} at {}", custom_config.name, custom_config.path);
}
```

### Cow 用于切片操作

```rust
use std::borrow::Cow;

fn normalize_path(path: &[u8]) -> Cow<[u8]> {
    if path.iter().any(|&b| b == b'\\') {
        // 将反斜杠转换为正斜杠
        Cow::Owned(
            path.iter()
                .map(|&b| if b == b'\\' { b'/' } else { b })
                .collect()
        )
    } else {
        Cow::Borrowed(path)
    }
}

fn main() {
    let unix_path = b"/home/user/file.txt";
    let windows_path = b"C:\\Users\\file.txt";

    let normalized1 = normalize_path(unix_path);
    let normalized2 = normalize_path(windows_path);

    println!("Unix path allocated: {}", matches!(normalized1, Cow::Owned(_)));     // false
    println!("Windows path allocated: {}", matches!(normalized2, Cow::Owned(_))); // true
}
```

## Deref Trait

`Deref` trait 允许你自定义解引用运算符 `*` 的行为。智能指针实现 `Deref` 以表现得像普通引用。

### 基本实现

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let x = 5;
    let y = MyBox::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y); // 底层调用 deref()
}
```

### Deref 强制转换

Deref 强制转换通过 `Deref` 实现自动将一种类型的引用转换为另一种类型的引用：

```rust
fn hello(name: &str) {
    println!("Hello, {}!", name);
}

fn main() {
    let boxed_string = Box::new(String::from("Rust"));

    // Deref 强制转换：&Box<String> -> &String -> &str
    hello(&boxed_string);

    // 没有 deref 强制转换，我们需要：
    // hello(&(*boxed_string)[..]);
}
```

### DerefMut 用于可变解引用

```rust
use std::ops::{Deref, DerefMut};

struct Wrapper<T> {
    value: T,
}

impl<T> Wrapper<T> {
    fn new(value: T) -> Self {
        Wrapper { value }
    }
}

impl<T> Deref for Wrapper<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.value
    }
}

impl<T> DerefMut for Wrapper<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.value
    }
}

fn main() {
    let mut wrapper = Wrapper::new(String::from("Hello"));

    // 不可变解引用
    println!("Length: {}", wrapper.len());

    // 可变解引用
    wrapper.push_str(", World!");
    println!("{}", *wrapper);
}
```

## Drop Trait

`Drop` trait 允许你自定义值离开作用域时发生的事情。它用于资源清理。

### 基本实现

```rust
struct CustomSmartPointer {
    data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer {
        data: String::from("my stuff"),
    };
    let d = CustomSmartPointer {
        data: String::from("other stuff"),
    };
    println!("CustomSmartPointers created.");

    // 变量按创建的相反顺序销毁
    // 输出：
    // CustomSmartPointers created.
    // Dropping CustomSmartPointer with data `other stuff`!
    // Dropping CustomSmartPointer with data `my stuff`!
}
```

### 使用 std::mem::drop 手动 Drop

```rust
struct Resource {
    name: String,
}

impl Drop for Resource {
    fn drop(&mut self) {
        println!("Releasing resource: {}", self.name);
    }
}

fn main() {
    let resource = Resource {
        name: String::from("database connection"),
    };
    println!("Resource acquired.");

    // 不能直接调用 resource.drop() - Rust 阻止这样做
    // resource.drop(); // 这无法编译

    // 使用 std::mem::drop 代替
    drop(resource);
    println!("Resource released early.");

    // resource 在这里不再有效
}
```

### RAII 模式用于资源管理

```rust
use std::fs::File;
use std::io::{self, Write};

struct TempFile {
    path: String,
    file: File,
}

impl TempFile {
    fn new(path: &str) -> io::Result<Self> {
        let file = File::create(path)?;
        Ok(TempFile {
            path: path.to_string(),
            file,
        })
    }

    fn write(&mut self, data: &[u8]) -> io::Result<()> {
        self.file.write_all(data)
    }
}

impl Drop for TempFile {
    fn drop(&mut self) {
        // 清理：删除临时文件
        if let Err(e) = std::fs::remove_file(&self.path) {
            eprintln!("Failed to delete temp file: {}", e);
        } else {
            println!("Temp file {} cleaned up", self.path);
        }
    }
}

fn main() -> io::Result<()> {
    {
        let mut temp = TempFile::new("/tmp/example.txt")?;
        temp.write(b"Hello, World!")?;
        // 当 temp 离开作用域时，文件自动删除
    }

    println!("After scope - temp file should be deleted");
    Ok(())
}
```

## 实际示例

### 构建简单缓存

```rust
use std::cell::RefCell;
use std::collections::HashMap;

struct Cache {
    data: RefCell<HashMap<String, String>>,
}

impl Cache {
    fn new() -> Self {
        Cache {
            data: RefCell::new(HashMap::new()),
        }
    }

    fn get_or_compute(&self, key: &str, compute: impl FnOnce() -> String) -> String {
        // 检查值是否存在
        if let Some(value) = self.data.borrow().get(key) {
            return value.clone();
        }

        // 计算并存储
        let value = compute();
        self.data.borrow_mut().insert(key.to_string(), value.clone());
        value
    }
}

fn main() {
    let cache = Cache::new();

    let value1 = cache.get_or_compute("key1", || {
        println!("Computing value1...");
        "computed_value_1".to_string()
    });

    let value1_cached = cache.get_or_compute("key1", || {
        println!("This won't print");
        "should_not_see_this".to_string()
    });

    println!("First call: {}", value1);
    println!("Cached call: {}", value1_cached);
}
```

### 线程安全计数器

```rust
use std::sync::{Arc, Mutex};
use std::thread;

struct ThreadSafeCounter {
    count: Arc<Mutex<i64>>,
}

impl ThreadSafeCounter {
    fn new() -> Self {
        ThreadSafeCounter {
            count: Arc::new(Mutex::new(0)),
        }
    }

    fn clone_counter(&self) -> Self {
        ThreadSafeCounter {
            count: Arc::clone(&self.count),
        }
    }

    fn increment(&self) {
        let mut count = self.count.lock().unwrap();
        *count += 1;
    }

    fn get(&self) -> i64 {
        *self.count.lock().unwrap()
    }
}

fn main() {
    let counter = ThreadSafeCounter::new();
    let mut handles = vec![];

    for _ in 0..10 {
        let counter_clone = counter.clone_counter();
        handles.push(thread::spawn(move || {
            for _ in 0..100 {
                counter_clone.increment();
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", counter.get()); // 1000
}
```

### 图数据结构

```rust
use std::cell::RefCell;
use std::rc::{Rc, Weak};

type NodeRef = Rc<RefCell<GraphNode>>;
type WeakNodeRef = Weak<RefCell<GraphNode>>;

struct GraphNode {
    value: i32,
    neighbors: Vec<WeakNodeRef>,
}

impl GraphNode {
    fn new(value: i32) -> NodeRef {
        Rc::new(RefCell::new(GraphNode {
            value,
            neighbors: Vec::new(),
        }))
    }

    fn add_neighbor(node: &NodeRef, neighbor: &NodeRef) {
        node.borrow_mut().neighbors.push(Rc::downgrade(neighbor));
    }

    fn print_neighbors(&self) {
        print!("Node {} neighbors: ", self.value);
        for weak_neighbor in &self.neighbors {
            if let Some(neighbor) = weak_neighbor.upgrade() {
                print!("{} ", neighbor.borrow().value);
            }
        }
        println!();
    }
}

fn main() {
    let node1 = GraphNode::new(1);
    let node2 = GraphNode::new(2);
    let node3 = GraphNode::new(3);

    // 创建连接（双向）
    GraphNode::add_neighbor(&node1, &node2);
    GraphNode::add_neighbor(&node1, &node3);
    GraphNode::add_neighbor(&node2, &node1);
    GraphNode::add_neighbor(&node2, &node3);
    GraphNode::add_neighbor(&node3, &node1);
    GraphNode::add_neighbor(&node3, &node2);

    node1.borrow().print_neighbors();
    node2.borrow().print_neighbors();
    node3.borrow().print_neighbors();
}
```

### 使用 RefCell 的观察者模式

```rust
use std::cell::RefCell;
use std::rc::Rc;

type Callback<T> = Box<dyn Fn(&T)>;

struct Observable<T> {
    value: RefCell<T>,
    observers: RefCell<Vec<Callback<T>>>,
}

impl<T> Observable<T> {
    fn new(value: T) -> Rc<Self> {
        Rc::new(Observable {
            value: RefCell::new(value),
            observers: RefCell::new(Vec::new()),
        })
    }

    fn get(&self) -> std::cell::Ref<T> {
        self.value.borrow()
    }

    fn set(&self, value: T) {
        *self.value.borrow_mut() = value;
        self.notify();
    }

    fn subscribe(&self, callback: impl Fn(&T) + 'static) {
        self.observers.borrow_mut().push(Box::new(callback));
    }

    fn notify(&self) {
        let value = self.value.borrow();
        for observer in self.observers.borrow().iter() {
            observer(&*value);
        }
    }
}

fn main() {
    let counter = Observable::new(0);

    counter.subscribe(|value| println!("Observer 1: value is now {}", value));
    counter.subscribe(|value| println!("Observer 2: doubled value is {}", value * 2));

    counter.set(5);
    counter.set(10);
}
```

## 选择正确的智能指针

| 指针 | 所有权 | 线程安全 | 用例 |
|---------|-----------|---------------|----------|
| `Box<T>` | 单一 | 否 | 堆分配、递归类型、trait 对象 |
| `Rc<T>` | 多个 | 否 | 单线程代码中的共享所有权 |
| `Arc<T>` | 多个 | 是 | 跨线程的共享所有权 |
| `Cell<T>` | 单一 | 否 | `Copy` 类型的内部可变性 |
| `RefCell<T>` | 单一 | 否 | 运行时借用检查的内部可变性 |
| `Cow<T>` | 借用或拥有 | 取决于 | 写时克隆优化 |
| `Weak<T>` | 无（非拥有） | 与 Rc/Arc 相同 | 打破引用循环 |

## 性能考虑

1. **Box**：最小开销 - 只有堆分配和指针间接引用。
2. **Rc/Arc**：克隆/丢弃时的引用计数开销。Arc 使用原子操作，比 Rc 更昂贵。
3. **Cell**：对 Copy 类型的简单 get/set 操作没有开销。
4. **RefCell**：运行时借用检查的小开销（单个整数计数器）。
5. **Cow**：借用时零成本，只有在需要克隆时才有分配成本。

### 基准测试示例

```rust
use std::cell::{Cell, RefCell};
use std::time::Instant;

fn main() {
    const ITERATIONS: u64 = 10_000_000;

    // Cell 性能
    let cell = Cell::new(0u64);
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        cell.set(cell.get() + 1);
    }
    println!("Cell: {:?}", start.elapsed());

    // RefCell 性能
    let refcell = RefCell::new(0u64);
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        *refcell.borrow_mut() += 1;
    }
    println!("RefCell: {:?}", start.elapsed());

    // 直接修改（基准）
    let mut direct = 0u64;
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        direct += 1;
    }
    println!("Direct: {:?}", start.elapsed());
}
```

## 常见陷阱及如何避免

### Rc 的引用循环

```rust
use std::cell::RefCell;
use std::rc::Rc;

struct Node {
    next: RefCell<Option<Rc<Node>>>,
}

fn create_cycle() {
    let a = Rc::new(Node { next: RefCell::new(None) });
    let b = Rc::new(Node { next: RefCell::new(Some(Rc::clone(&a))) });

    // 创建循环 - 内存泄漏！
    *a.next.borrow_mut() = Some(Rc::clone(&b));

    // 当此函数结束时，a 和 b 离开作用域
    // 但它们的引用计数永远不会达到 0
}

// 解决方案：使用 Weak<T> 作为反向引用
use std::rc::Weak;

struct SafeNode {
    next: RefCell<Option<Rc<SafeNode>>>,
    prev: RefCell<Weak<SafeNode>>,  // 使用弱引用作为反向指针
}
```

### RefCell 运行时 Panic

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);

    // 这会在运行时 panic
    let borrow1 = data.borrow();
    // let borrow_mut = data.borrow_mut(); // PANIC!

    // 安全替代方案：使用 try_borrow
    match data.try_borrow_mut() {
        Ok(mut val) => *val = 10,
        Err(_) => println!("Cannot borrow mutably right now"),
    }

    drop(borrow1);  // 现在我们可以可变借用了
    *data.borrow_mut() = 10;
}
```

### 没有内部可变性的 Arc

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(5);

    // 这没问题 - 只读
    let handles: Vec<_> = (0..3)
        .map(|i| {
            let data = Arc::clone(&data);
            thread::spawn(move || println!("Thread {}: {}", i, data))
        })
        .collect();

    for handle in handles {
        handle.join().unwrap();
    }

    // 要修改，你必须使用 Arc<Mutex<T>> 或 Arc<RwLock<T>>
    // Arc 单独只提供共享读访问
}
```

### Mutex 的死锁

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let lock_a = Arc::new(Mutex::new(1));
    let lock_b = Arc::new(Mutex::new(2));

    // 如果两个线程以不同顺序锁定，可能发生死锁
    // 线程 1：锁定 A，然后尝试锁定 B
    // 线程 2：锁定 B，然后尝试锁定 A

    // 解决方案：始终以相同顺序锁定，或使用 try_lock
    let lock_a_clone = Arc::clone(&lock_a);
    let lock_b_clone = Arc::clone(&lock_b);

    let handle = thread::spawn(move || {
        // 尝试获取两个锁
        if let Ok(a) = lock_a_clone.try_lock() {
            if let Ok(b) = lock_b_clone.try_lock() {
                println!("Got both locks: {} {}", *a, *b);
            }
        }
    });

    handle.join().unwrap();
}
```

## 总结

Rust 中的智能指针为内存管理和所有权模式提供了强大的抽象：

- **Box\<T\>**：简单的堆分配和递归类型、trait 对象的间接引用。
- **Rc\<T\>**：单线程场景中带引用计数的共享所有权。
- **Arc\<T\>**：使用原子引用计数的线程安全共享所有权。
- **Weak\<T\>**：打破循环和实现缓存的非拥有引用。
- **Cell\<T\>**：`Copy` 类型的零成本内部可变性。
- **RefCell\<T\>**：任何类型的运行时借用检查的内部可变性。
- **Cow\<T\>**：高效数据处理的写时克隆优化。

理解何时以及如何使用每种智能指针对于编写地道、安全和高效的 Rust 代码至关重要。关键原则是：

1. 尽可能优先使用编译时保证而不是运行时检查。
2. 使用满足需求的最简单智能指针。
3. 了解每种选择的性能影响。
4. 使用弱引用防止引用循环造成的内存泄漏。
5. 适当组合智能指针以实现复杂的所有权模式。

通过掌握这些工具，你可以在保持 Rust 强大安全保证的同时建模复杂的所有权模式。
