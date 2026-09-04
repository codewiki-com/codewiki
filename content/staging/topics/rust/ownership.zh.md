---
title: Rust 所有权系统
description: 深入理解 Rust 所有权：所有权规则、借用、生命周期
track: rust
section: ownership-borrowing
difficulty: intermediate
tags:
  - Rust
  - 所有权
  - 借用
  - 生命周期
status: imported
origin: old/src/content/docs/rust/ownership.zh.md
divergence: 0.245
issues: []
legacy:
  category: Rust
  subcategory: 所有权
  order: 1
  lastUpdated: 2026-01-07
---

Rust 的所有权系统是该语言最独特和最强大的特性之一。它在编译时确保内存安全,无需垃圾回收器,这使得 Rust 能够提供高性能的同时保证安全性。

## 所有权规则

Rust 的所有权系统基于三个核心规则:

1. **每个值都有一个所有者(owner)**
2. **一个值在同一时间只能有一个所有者**
3. **当所有者离开作用域时,值将被丢弃**

### 基本示例

```rust
fn main() {
    // s 进入作用域
    let s = String::from("hello");

    // s 在这里是有效的
    println!("{}", s);

} // s 离开作用域,内存被自动释放
```

在这个例子中,`s` 是 `String` 值的所有者。当 `s` 离开作用域时,Rust 自动调用 `drop` 函数释放内存。

### 作用域与所有权

```rust
fn main() {
    {
        let s = String::from("hello"); // s 在此处进入作用域
        println!("{}", s);
    } // s 在此处离开作用域并被丢弃

    // println!("{}", s); // 错误! s 已经不在作用域内
}
```

## 移动语义

在 Rust 中,当将一个值赋给另一个变量时,所有权会发生转移,这被称为"移动"(move)。

### 简单的移动

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 的所有权移动到 s2

    // println!("{}", s1); // 错误! s1 不再有效
    println!("{}", s2); // 正确
}
```

这与其他语言中的浅拷贝类似,但 Rust 同时使原始变量失效,防止双重释放(double free)错误。

### 函数与所有权

将值传递给函数也会移动所有权:

```rust
fn main() {
    let s = String::from("hello");

    takes_ownership(s); // s 的所有权移动到函数中

    // println!("{}", s); // 错误! s 不再有效

    let x = 5;
    makes_copy(x); // x 是 i32,实现了 Copy trait,所以这里是复制

    println!("{}", x); // 正确,x 仍然有效
}

fn takes_ownership(some_string: String) {
    println!("{}", some_string);
} // some_string 在这里离开作用域并被丢弃

fn makes_copy(some_integer: i32) {
    println!("{}", some_integer);
}
```

### 返回值与所有权

函数可以通过返回值转移所有权:

```rust
fn main() {
    let s1 = gives_ownership(); // 函数将所有权移动给 s1

    let s2 = String::from("hello");
    let s3 = takes_and_gives_back(s2); // s2 移动到函数中,然后返回值移动给 s3

    println!("s1 = {}, s3 = {}", s1, s3);
    // println!("{}", s2); // 错误! s2 已经被移动
}

fn gives_ownership() -> String {
    let some_string = String::from("yours");
    some_string // 返回值移动给调用者
}

fn takes_and_gives_back(a_string: String) -> String {
    a_string // 返回值移动给调用者
}
```

## 克隆与复制

### 深拷贝:Clone

如果我们确实需要深度复制堆上的数据,可以使用 `clone` 方法:

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone(); // 深拷贝

    println!("s1 = {}, s2 = {}", s1, s2); // 两者都有效
}
```

`clone` 可能会很昂贵,因为它会复制堆上的数据。

### 栈上的复制:Copy

一些存储在栈上的类型实现了 `Copy` trait,这些类型在赋值时会自动复制:

```rust
fn main() {
    let x = 5;
    let y = x; // 复制,而不是移动

    println!("x = {}, y = {}", x, y); // 两者都有效
}
```

实现 `Copy` trait 的常见类型包括:
- 所有整数类型(i32, u32, i64 等)
- 布尔类型 `bool`
- 所有浮点类型(f32, f64)
- 字符类型 `char`
- 元组,如果其所有元素都实现了 `Copy`

```rust
fn main() {
    // 这些类型都实现了 Copy
    let a = 42;
    let b = true;
    let c = 3.14;
    let d = 'a';
    let e = (1, 2, 3);

    // 这些赋值都是复制,不是移动
    let a2 = a;
    let b2 = b;
    let c2 = c;
    let d2 = d;
    let e2 = e;

    println!("{}, {}, {}, {}, {:?}", a, b, c, d, e); // 全部仍然有效
}
```

## 借用规则

为了在不转移所有权的情况下使用值,Rust 提供了**借用**(borrowing)机制。

### 不可变借用

使用 `&` 创建引用,允许读取值但不能修改:

```rust
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1); // 借用 s1

    println!("'{}' 的长度是 {}", s1, len); // s1 仍然有效
}

fn calculate_length(s: &String) -> usize {
    s.len()
} // s 离开作用域,但因为它不拥有引用值,所以不会丢弃
```

### 可变借用

使用 `&mut` 创建可变引用,允许修改值:

```rust
fn main() {
    let mut s = String::from("hello");

    change(&mut s);

    println!("{}", s); // 输出: "hello, world"
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```

### 借用规则详解

Rust 的借用规则确保数据竞争在编译时被消除:

1. **在任意给定时间,要么只能有一个可变引用,要么只能有多个不可变引用**
2. **引用必须总是有效的**

#### 规则一:可变引用的限制

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &mut s;
    // let r2 = &mut s; // 错误! 不能同时有两个可变引用

    println!("{}", r1);
}
```

这个限制防止数据竞争:

```rust
fn main() {
    let mut s = String::from("hello");

    {
        let r1 = &mut s;
        println!("{}", r1);
    } // r1 离开作用域

    let r2 = &mut s; // 正确,r1 已经不在作用域内
    println!("{}", r2);
}
```

#### 不可变引用和可变引用不能同时存在

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s; // 不可变引用
    let r2 = &s; // 不可变引用
    // let r3 = &mut s; // 错误! 不能在有不可变引用时创建可变引用

    println!("{} and {}", r1, r2);
}
```

#### 引用的作用域

引用的作用域从声明的地方开始到最后一次使用为止:

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s; // 不可变引用
    let r2 = &s; // 不可变引用
    println!("{} and {}", r1, r2);
    // r1 和 r2 在此之后不再使用

    let r3 = &mut s; // 正确,r1 和 r2 的作用域已经结束
    println!("{}", r3);
}
```

### 悬垂引用

Rust 编译器确保引用永远不会成为悬垂引用(指向已被释放内存的引用):

```rust
fn main() {
    // let reference_to_nothing = dangle(); // 错误!
    let string = no_dangle();
    println!("{}", string);
}

// fn dangle() -> &String { // 错误! 返回悬垂引用
//     let s = String::from("hello");
//     &s
// } // s 离开作用域被丢弃,返回的引用将指向无效内存

fn no_dangle() -> String {
    let s = String::from("hello");
    s // 移动所有权,正确
}
```

## 生命周期标注

生命周期是 Rust 用来确保所有引用都有效的机制。大多数时候,生命周期是隐式和推断的,但有时需要显式标注。

### 生命周期标注语法

生命周期标注使用撇号 `'` 开头,通常使用小写字母:

```rust
&i32        // 引用
&'a i32     // 带有显式生命周期的引用
&'a mut i32 // 带有显式生命周期的可变引用
```

### 函数中的生命周期

当函数返回引用时,可能需要生命周期标注:

```rust
fn main() {
    let string1 = String::from("abcd");
    let string2 = "xyz";

    let result = longest(string1.as_str(), string2);
    println!("最长的字符串是 {}", result);
}

// 生命周期标注告诉编译器:返回的引用与参数中生命周期较短的那个相同
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

生命周期 `'a` 表示:返回的引用的生命周期与传入参数的生命周期中较短的那个相同。

### 生命周期与作用域

```rust
fn main() {
    let string1 = String::from("long string is long");

    {
        let string2 = String::from("xyz");
        let result = longest(string1.as_str(), string2.as_str());
        println!("最长的字符串是 {}", result);
    }
}

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

如果尝试在 `string2` 的作用域外使用 `result`,将会出错:

```rust
fn main() {
    let string1 = String::from("long string is long");
    let result;

    {
        let string2 = String::from("xyz");
        // result = longest(string1.as_str(), string2.as_str());
        // 错误! string2 的生命周期不够长
    }

    // println!("最长的字符串是 {}", result);
}

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

### 结构体中的生命周期

当结构体包含引用时,需要生命周期标注:

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("Could not find a '.'");

    let i = ImportantExcerpt {
        part: first_sentence,
    };

    println!("重要摘录: {}", i.part);
}
```

这个标注意味着 `ImportantExcerpt` 的实例不能比其 `part` 字段的引用存活得更久。

### 生命周期省略规则

编译器使用三条规则来推断生命周期,无需显式标注:

1. **每个引用参数都有自己的生命周期**
2. **如果只有一个输入生命周期参数,该生命周期被赋予所有输出生命周期参数**
3. **如果有多个输入生命周期参数,但其中一个是 `&self` 或 `&mut self`,`self` 的生命周期被赋予所有输出生命周期参数**

示例:

```rust
// 编译器自动推断,等同于 fn first_word<'a>(s: &'a str) -> &'a str
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

### 方法定义中的生命周期

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }

    // 根据第三条省略规则,返回值获得 &self 的生命周期
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("请注意: {}", announcement);
        self.part
    }
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("Could not find a '.'");

    let i = ImportantExcerpt {
        part: first_sentence,
    };

    println!("级别: {}", i.level());
    println!("{}", i.announce_and_return_part("今日要闻"));
}
```

### 静态生命周期

`'static` 生命周期表示引用可以在整个程序期间存活:

```rust
fn main() {
    let s: &'static str = "我有静态生命周期。";
    println!("{}", s);
}
```

所有字符串字面值都有 `'static` 生命周期,因为它们被直接存储在程序的二进制文件中。

## 综合示例

下面是一个综合运用所有权、借用和生命周期的复杂示例:

```rust
struct Config<'a> {
    query: &'a str,
    filename: &'a str,
}

impl<'a> Config<'a> {
    fn new(args: &'a [String]) -> Result<Config<'a>, &'static str> {
        if args.len() < 3 {
            return Err("参数不足");
        }

        let query = &args[1];
        let filename = &args[2];

        Ok(Config { query, filename })
    }
}

fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let mut results = Vec::new();

    for line in contents.lines() {
        if line.contains(query) {
            results.push(line);
        }
    }

    results
}

fn main() {
    let args = vec![
        String::from("program"),
        String::from("Rust"),
        String::from("data.txt"),
    ];

    let config = Config::new(&args).unwrap_or_else(|err| {
        eprintln!("解析参数时出错: {}", err);
        std::process::exit(1);
    });

    let contents = "Rust 是一门系统编程语言\n\
                    它专注于安全和性能\n\
                    Rust 的所有权系统非常强大";

    let results = search(config.query, contents);

    println!("搜索 '{}' 的结果:", config.query);
    for line in results {
        println!("{}", line);
    }
}
```

## 最佳实践

1. **优先使用借用而不是所有权转移**:除非确实需要所有权,否则使用引用
2. **尽可能使用不可变引用**:这使代码更容易理解和维护
3. **避免过度使用 `clone`**:虽然方便,但可能影响性能
4. **理解生命周期省略规则**:大多数情况下不需要显式标注
5. **当编译器要求时才添加生命周期标注**:先让编译器尝试推断

## 总结

Rust 的所有权系统是其核心特性,提供了以下优势:

- **内存安全**:在编译时防止悬垂指针、双重释放等问题
- **无需垃圾回收**:确定性的内存管理,无运行时开销
- **线程安全**:所有权规则防止数据竞争
- **零成本抽象**:安全性不以性能为代价

理解所有权、借用和生命周期是掌握 Rust 的关键。虽然初学时可能感到困难,但这些概念能够帮助你编写更安全、更高效的代码。随着实践的增加,这些模式会变得自然而然。
