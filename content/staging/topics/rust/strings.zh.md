---
title: Rust 字符串详解
description: 深入理解 Rust 字符串类型：String 与 &str 的区别、UTF-8 编码、字符串方法、OsString 与 CString
track: rust
section: basics
difficulty: intermediate
tags:
  - Rust
  - 字符串
  - String
  - str
  - UTF-8
  - OsString
  - CString
status: imported
origin: old/src/content/docs/rust/strings.zh.md
divergence: 0.217
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 基础语法
  order: 3
  lastUpdated: 2026-01-07
---

字符串是任何编程语言中最基础也最重要的数据类型之一。Rust 的字符串系统设计独特，它在提供安全性和性能的同时，也带来了一定的学习曲线。本文将全面解析 Rust 中的各种字符串类型，帮助你彻底掌握 Rust 字符串处理。

## 概念解释

### 为什么 Rust 有多种字符串类型？

在 Rust 中，字符串的设计考虑了以下几个核心问题：

1. **内存安全**：避免悬垂指针、缓冲区溢出等问题
2. **UTF-8 正确性**：确保所有字符串都是有效的 UTF-8 编码
3. **零成本抽象**：在保证安全的同时不牺牲性能
4. **互操作性**：需要与操作系统和 C 语言库交互

为了解决这些问题，Rust 提供了多种字符串类型，每种都有其特定的用途。

### 核心字符串类型概览

| 类型 | 描述 | 存储位置 | 可变性 | 编码 |
|------|------|----------|--------|------|
| `String` | 可增长的堆分配字符串 | 堆 | 可变 | UTF-8 |
| `&str` | 字符串切片（借用） | 任意 | 不可变 | UTF-8 |
| `&mut str` | 可变字符串切片 | 任意 | 有限可变 | UTF-8 |
| `OsString` | 平台原生字符串 | 堆 | 可变 | 平台相关 |
| `&OsStr` | 平台原生字符串切片 | 任意 | 不可变 | 平台相关 |
| `CString` | C 兼容的以 null 结尾的字符串 | 堆 | 可变 | 任意 |
| `&CStr` | C 字符串切片 | 任意 | 不可变 | 任意 |

## 核心原理

### String 的内存布局

`String` 是一个结构体，包含三个字段：

```rust
// String 的内部表示（简化版）
struct String {
    ptr: *mut u8,      // 指向堆上数据的指针
    len: usize,        // 当前长度（字节数）
    capacity: usize,   // 已分配的容量（字节数）
}
```

在内存中的布局如下：

```
栈                          堆
┌─────────────────────┐     ┌─────────────────────────────┐
│ ptr: 0x7f3a... ─────┼────→│ H │ e │ l │ l │ o │ ... │
│ len: 5              │     └─────────────────────────────┘
│ capacity: 8         │
└─────────────────────┘
```

### &str 的内存布局

`&str` 是一个胖指针（fat pointer），包含两个字段：

```rust
// &str 的内部表示（简化版）
struct StrSlice {
    ptr: *const u8,    // 指向数据的指针
    len: usize,        // 长度（字节数）
}
```

`&str` 可以指向不同位置的数据：

```rust
fn main() {
    // 指向静态存储区（程序二进制文件中）
    let static_str: &'static str = "hello";

    // 指向堆上的 String 数据
    let owned = String::from("world");
    let heap_str: &str = &owned;

    // 指向栈上的数组
    let stack_array: [u8; 5] = [104, 101, 108, 108, 111]; // "hello"
    let stack_str: &str = std::str::from_utf8(&stack_array).unwrap();

    println!("{}, {}, {}", static_str, heap_str, stack_str);
}
```

### UTF-8 编码原理

Rust 字符串强制使用 UTF-8 编码。UTF-8 是一种变长编码：

| Unicode 范围 | 字节数 | 编码格式 |
|--------------|--------|----------|
| U+0000 - U+007F | 1 | 0xxxxxxx |
| U+0080 - U+07FF | 2 | 110xxxxx 10xxxxxx |
| U+0800 - U+FFFF | 3 | 1110xxxx 10xxxxxx 10xxxxxx |
| U+10000 - U+10FFFF | 4 | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx |

```rust
fn main() {
    let s = "你好";

    // 字节长度
    println!("字节长度: {}", s.len()); // 6 (每个中文字符 3 字节)

    // 字符数量
    println!("字符数量: {}", s.chars().count()); // 2

    // 查看每个字节
    for byte in s.bytes() {
        print!("{:02x} ", byte);
    }
    // 输出: e4 bd a0 e5 a5 bd
    println!();

    // 查看每个字符
    for ch in s.chars() {
        println!("'{}' = U+{:04X}", ch, ch as u32);
    }
    // 输出:
    // '你' = U+4F60
    // '好' = U+597D
}
```

## 核心要点

### String 与 &str 的区别

#### 所有权

```rust
fn main() {
    // String 拥有数据的所有权
    let owned: String = String::from("hello");

    // &str 是借用，不拥有数据
    let borrowed: &str = "hello";
    let also_borrowed: &str = &owned;

    // String 可以转移所有权
    let new_owner = owned;
    // println!("{}", owned); // 错误！所有权已转移

    // &str 可以复制（因为它只是引用）
    let copy1 = borrowed;
    let copy2 = borrowed;
    println!("{}, {}", copy1, copy2); // 正确
}
```

#### 可变性

```rust
fn main() {
    // String 可以修改
    let mut s = String::from("hello");
    s.push_str(", world");
    s.push('!');
    println!("{}", s); // "hello, world!"

    // &str 不可修改
    let slice: &str = "hello";
    // slice.push_str(", world"); // 错误！&str 没有 push_str 方法

    // &mut str 只能进行就地修改（不能改变长度）
    let mut data = [b'h', b'e', b'l', b'l', b'o'];
    let slice_mut: &mut str = std::str::from_utf8_mut(&mut data).unwrap();
    slice_mut.make_ascii_uppercase();
    println!("{}", slice_mut); // "HELLO"
}
```

#### 函数参数选择

```rust
// 推荐：接受 &str 作为参数，更灵活
fn greet(name: &str) {
    println!("Hello, {}!", name);
}

// 不推荐：只接受 String
fn greet_owned(name: String) {
    println!("Hello, {}!", name);
}

fn main() {
    let owned = String::from("World");
    let borrowed = "Rust";

    // greet 可以接受两种类型
    greet(&owned);   // String 自动 deref 为 &str
    greet(borrowed); // &str 直接传递

    // greet_owned 只能接受 String
    greet_owned(owned);
    // greet_owned(borrowed); // 错误！需要 String
    greet_owned(borrowed.to_string()); // 需要显式转换
}
```

### 字符串创建方式

```rust
fn main() {
    // 1. 字符串字面值（&'static str）
    let s1: &str = "hello";

    // 2. String::new() 创建空字符串
    let s2: String = String::new();

    // 3. String::from() 从 &str 创建
    let s3: String = String::from("hello");

    // 4. to_string() 方法
    let s4: String = "hello".to_string();

    // 5. to_owned() 方法
    let s5: String = "hello".to_owned();

    // 6. into() 方法
    let s6: String = "hello".into();

    // 7. String::with_capacity() 预分配容量
    let mut s7 = String::with_capacity(100);
    s7.push_str("hello");
    println!("len: {}, capacity: {}", s7.len(), s7.capacity());

    // 8. format! 宏
    let name = "Rust";
    let s8: String = format!("Hello, {}!", name);

    // 9. 从字节创建
    let bytes = vec![104, 101, 108, 108, 111];
    let s9: String = String::from_utf8(bytes).unwrap();

    // 10. 从迭代器收集
    let chars = vec!['h', 'e', 'l', 'l', 'o'];
    let s10: String = chars.iter().collect();
}
```

### 字符串索引问题

Rust 不允许直接通过索引访问字符串中的字符：

```rust
fn main() {
    let s = "hello";

    // let ch = s[0]; // 错误！不能直接索引

    // 原因：UTF-8 是变长编码
    let chinese = "你好";
    // "你" 占 3 字节，直接索引 chinese[0] 应该返回什么？
    // 一个字节？一个字符？这种歧义导致 Rust 禁止直接索引

    // 正确的方式
    // 1. 获取字节
    let byte: u8 = s.as_bytes()[0];
    println!("第一个字节: {}", byte); // 104

    // 2. 获取字符
    let ch: char = s.chars().nth(0).unwrap();
    println!("第一个字符: {}", ch); // 'h'

    // 3. 使用切片（但要注意边界必须在字符边界上）
    let slice: &str = &s[0..2];
    println!("切片: {}", slice); // "he"

    // 危险：如果切片边界不在字符边界上，会 panic
    let chinese = "你好";
    // let bad_slice = &chinese[0..1]; // panic! 不是有效的字符边界
    let good_slice = &chinese[0..3]; // "你"
    println!("中文切片: {}", good_slice);
}
```

## 代码示例

### 字符串基本操作

```rust
fn main() {
    // === 追加内容 ===
    let mut s = String::from("Hello");

    // push_str: 追加字符串切片
    s.push_str(", ");
    s.push_str("World");

    // push: 追加单个字符
    s.push('!');

    println!("{}", s); // "Hello, World!"

    // === 字符串拼接 ===
    let s1 = String::from("Hello, ");
    let s2 = String::from("World!");

    // 使用 + 运算符（注意：第一个参数会被移动）
    let s3 = s1 + &s2;
    // println!("{}", s1); // 错误！s1 已被移动
    println!("{}", s3); // "Hello, World!"

    // 使用 format! 宏（不移动任何参数）
    let s4 = String::from("Hello");
    let s5 = String::from("World");
    let s6 = format!("{}, {}!", s4, s5);
    println!("{}", s6); // "Hello, World!"
    println!("{}, {}", s4, s5); // 仍然有效

    // === 插入和删除 ===
    let mut s = String::from("Hello World");

    // insert: 在指定位置插入字符
    s.insert(5, ',');
    println!("{}", s); // "Hello, World"

    // insert_str: 在指定位置插入字符串
    s.insert_str(7, "Rust ");
    println!("{}", s); // "Hello, Rust World"

    // remove: 删除指定位置的字符
    let removed = s.remove(5);
    println!("删除的字符: '{}', 结果: {}", removed, s);

    // pop: 删除并返回最后一个字符
    let last = s.pop();
    println!("弹出: {:?}", last);

    // truncate: 截断到指定长度
    s.truncate(5);
    println!("截断后: {}", s); // "Hello"

    // clear: 清空字符串
    s.clear();
    println!("清空后长度: {}", s.len()); // 0
}
```

### 字符串遍历

```rust
fn main() {
    let s = "Hello, 世界! 🌍";

    // === 按字符遍历 ===
    println!("字符遍历:");
    for ch in s.chars() {
        println!("  '{}'", ch);
    }

    // === 按字节遍历 ===
    println!("\n字节遍历:");
    for (i, byte) in s.bytes().enumerate() {
        println!("  [{}] = 0x{:02x}", i, byte);
    }

    // === 按字符索引遍历 ===
    println!("\n字符索引遍历:");
    for (i, ch) in s.char_indices() {
        println!("  字节位置 {}: '{}'", i, ch);
    }

    // === 按行遍历 ===
    let multiline = "第一行\n第二行\n第三行";
    println!("\n按行遍历:");
    for (i, line) in multiline.lines().enumerate() {
        println!("  行 {}: {}", i + 1, line);
    }

    // === 按单词遍历 ===
    let words = "Hello World Rust";
    println!("\n按单词遍历:");
    for word in words.split_whitespace() {
        println!("  {}", word);
    }

    // === 按自定义分隔符遍历 ===
    let csv = "apple,banana,cherry";
    println!("\n按逗号分割:");
    for item in csv.split(',') {
        println!("  {}", item);
    }
}
```

### 字符串搜索与替换

```rust
fn main() {
    let s = "Hello, World! Hello, Rust!";

    // === 搜索 ===

    // contains: 是否包含子串
    println!("包含 'World': {}", s.contains("World")); // true

    // starts_with / ends_with
    println!("以 'Hello' 开头: {}", s.starts_with("Hello")); // true
    println!("以 '!' 结尾: {}", s.ends_with("!")); // true

    // find: 查找第一次出现的位置
    if let Some(pos) = s.find("World") {
        println!("'World' 首次出现在位置: {}", pos); // 7
    }

    // rfind: 从后往前查找
    if let Some(pos) = s.rfind("Hello") {
        println!("'Hello' 最后出现在位置: {}", pos); // 14
    }

    // match_indices: 查找所有匹配
    println!("所有 'Hello' 的位置:");
    for (pos, matched) in s.match_indices("Hello") {
        println!("  位置 {}: '{}'", pos, matched);
    }

    // === 替换 ===

    // replace: 替换所有匹配
    let replaced = s.replace("Hello", "Hi");
    println!("替换后: {}", replaced); // "Hi, World! Hi, Rust!"

    // replacen: 替换前 N 个匹配
    let replaced_once = s.replacen("Hello", "Hi", 1);
    println!("替换一次: {}", replaced_once); // "Hi, World! Hello, Rust!"

    // === 修剪 ===
    let padded = "  Hello, World!  ";

    // trim: 去除两端空白
    println!("trim: '{}'", padded.trim()); // "Hello, World!"

    // trim_start / trim_end
    println!("trim_start: '{}'", padded.trim_start()); // "Hello, World!  "
    println!("trim_end: '{}'", padded.trim_end()); // "  Hello, World!"

    // trim_matches: 去除指定字符
    let dashed = "---hello---";
    println!("trim_matches: '{}'", dashed.trim_matches('-')); // "hello"
}
```

### 字符串大小写转换

```rust
fn main() {
    let s = "Hello, World!";

    // 转换为大写
    println!("大写: {}", s.to_uppercase()); // "HELLO, WORLD!"

    // 转换为小写
    println!("小写: {}", s.to_lowercase()); // "hello, world!"

    // 处理 Unicode
    let german = "Größe";
    println!("德语大写: {}", german.to_uppercase()); // "GRÖSSE" (ß -> SS)

    // ASCII 版本（只转换 ASCII 字符）
    let mixed = "Café";
    println!("ASCII 大写: {}", mixed.to_ascii_uppercase()); // "CAFé"

    // 就地转换（需要可变引用）
    let mut ascii = String::from("Hello");
    ascii.make_ascii_uppercase();
    println!("就地大写: {}", ascii); // "HELLO"
}
```

### 字符串解析与格式化

```rust
fn main() {
    // === 解析 ===

    // parse: 从字符串解析为其他类型
    let num: i32 = "42".parse().unwrap();
    let float: f64 = "3.14".parse().unwrap();
    let boolean: bool = "true".parse().unwrap();

    println!("解析结果: {}, {}, {}", num, float, boolean);

    // 处理解析错误
    let result: Result<i32, _> = "not a number".parse();
    match result {
        Ok(n) => println!("解析成功: {}", n),
        Err(e) => println!("解析失败: {}", e),
    }

    // === 格式化 ===

    // 基本格式化
    let formatted = format!("数字: {}, 浮点: {:.2}", 42, 3.14159);
    println!("{}", formatted); // "数字: 42, 浮点: 3.14"

    // 填充和对齐
    println!("右对齐: '{:>10}'", "hello"); // "     hello"
    println!("左对齐: '{:<10}'", "hello"); // "hello     "
    println!("居中:   '{:^10}'", "hello"); // "  hello   "
    println!("填充:   '{:*^10}'", "hello"); // "**hello***"

    // 数字格式化
    let num = 42;
    println!("十进制: {}", num);     // 42
    println!("二进制: {:b}", num);   // 101010
    println!("八进制: {:o}", num);   // 52
    println!("十六进制: {:x}", num); // 2a
    println!("十六进制大写: {:X}", num); // 2A

    // 带前缀
    println!("带前缀: {:#x}", num);  // 0x2a
    println!("带前缀: {:#b}", num);  // 0b101010

    // 位置参数
    println!("{0} {1} {0}", "hello", "world"); // "hello world hello"

    // 命名参数
    println!("{name} is {age} years old", name = "Alice", age = 30);

    // Debug 格式
    let vec = vec![1, 2, 3];
    println!("Debug: {:?}", vec);    // [1, 2, 3]
    println!("Pretty: {:#?}", vec);  // 带缩进的格式
}
```

## 最佳实践

### 函数参数类型选择

```rust
// 好：接受 &str，可以接受 String 和 &str
fn process(text: &str) {
    println!("Processing: {}", text);
}

// 好：需要拥有所有权时使用 String
fn store(text: String) -> String {
    // 存储或修改...
    text
}

// 好：使用 impl AsRef<str> 获得最大灵活性
fn flexible<S: AsRef<str>>(text: S) {
    let s: &str = text.as_ref();
    println!("Flexible: {}", s);
}

// 好：使用 Into<String> 接受可转换为 String 的类型
fn take_ownership(text: impl Into<String>) {
    let owned: String = text.into();
    println!("Owned: {}", owned);
}

fn main() {
    let owned = String::from("hello");
    let borrowed = "world";

    process(&owned);
    process(borrowed);

    flexible(&owned);
    flexible(borrowed);
    flexible(owned.clone());

    take_ownership("static str");
    take_ownership(String::from("owned"));
}
```

### 避免不必要的分配

```rust
fn main() {
    let s = String::from("Hello, World!");

    // 不好：不必要的 to_string()
    let _upper = s.to_uppercase().to_string(); // to_uppercase 已返回 String

    // 好：直接使用返回的 String
    let _upper = s.to_uppercase();

    // 不好：不必要的 clone
    fn process_bad(s: &str) -> String {
        s.to_string().clone() // clone 是多余的
    }

    // 好
    fn process_good(s: &str) -> String {
        s.to_string()
    }

    // 不好：在循环中重复分配
    let mut result = String::new();
    for i in 0..100 {
        result = result + &i.to_string(); // 每次迭代都分配
    }

    // 好：使用 push_str 或预分配容量
    let mut result = String::with_capacity(200);
    for i in 0..100 {
        result.push_str(&i.to_string());
    }

    // 更好：使用 format! 或 write!
    use std::fmt::Write;
    let mut result = String::new();
    for i in 0..100 {
        write!(&mut result, "{}", i).unwrap();
    }
}
```

### 正确处理 UTF-8

```rust
fn main() {
    // 好：使用 chars() 遍历字符
    let s = "Hello, 世界!";
    let char_count = s.chars().count();
    println!("字符数: {}", char_count);

    // 好：使用 char_indices() 获取正确的字节位置
    for (byte_pos, ch) in s.char_indices() {
        println!("字符 '{}' 在字节位置 {}", ch, byte_pos);
    }

    // 好：安全的字符串切片
    fn safe_substring(s: &str, start: usize, end: usize) -> Option<&str> {
        let mut char_indices = s.char_indices();

        let start_byte = char_indices.nth(start)?.0;
        let end_byte = char_indices
            .nth(end - start - 1)
            .map(|(i, _)| i)
            .unwrap_or(s.len());

        Some(&s[start_byte..end_byte])
    }

    if let Some(sub) = safe_substring("Hello, 世界!", 7, 9) {
        println!("子串: {}", sub); // "世界"
    }

    // 好：使用 graphemes 处理复杂 Unicode（需要 unicode-segmentation crate）
    // use unicode_segmentation::UnicodeSegmentation;
    // let emoji = "👨‍👩‍👧‍👦";
    // for grapheme in emoji.graphemes(true) {
    //     println!("字素: {}", grapheme);
    // }
}
```

### 字符串构建模式

```rust
fn main() {
    // 模式1：使用 String::with_capacity 预分配
    fn build_with_capacity() -> String {
        let mut s = String::with_capacity(100);
        for i in 0..10 {
            s.push_str(&format!("Item {}\n", i));
        }
        s
    }

    // 模式2：使用 collect 从迭代器构建
    fn build_with_collect() -> String {
        (0..10)
            .map(|i| format!("Item {}\n", i))
            .collect()
    }

    // 模式3：使用 join 连接
    fn build_with_join() -> String {
        let items: Vec<String> = (0..10)
            .map(|i| format!("Item {}", i))
            .collect();
        items.join("\n")
    }

    // 模式4：使用 write! 宏
    fn build_with_write() -> String {
        use std::fmt::Write;
        let mut s = String::new();
        for i in 0..10 {
            writeln!(&mut s, "Item {}", i).unwrap();
        }
        s
    }

    println!("{}", build_with_capacity());
    println!("{}", build_with_collect());
    println!("{}", build_with_join());
    println!("{}", build_with_write());
}
```

## 常见陷阱

### 索引越界

```rust
fn main() {
    let s = "Hello, 世界!";

    // 危险：直接用字节索引切片
    // let bad = &s[0..8]; // panic! 第 8 字节在 "世" 字符的中间

    // 安全：确保在字符边界
    let good = &s[0..7]; // "Hello, "
    println!("{}", good);

    // 更安全：使用 get 方法
    match s.get(0..8) {
        Some(slice) => println!("切片: {}", slice),
        None => println!("无效的切片范围"),
    }

    // 最安全：使用 char_indices
    fn safe_slice(s: &str, start_char: usize, end_char: usize) -> Option<&str> {
        let start = s.char_indices().nth(start_char)?.0;
        let end = s.char_indices().nth(end_char).map(|(i, _)| i)?;
        Some(&s[start..end])
    }
}
```

### 字符串长度混淆

```rust
fn main() {
    let s = "Hello, 世界!";

    // len() 返回字节数，不是字符数
    println!("字节长度: {}", s.len());        // 14
    println!("字符数量: {}", s.chars().count()); // 10

    // 对于 emoji 更复杂
    let emoji = "👨‍👩‍👧‍👦"; // 一个"家庭"emoji
    println!("字节长度: {}", emoji.len());        // 25
    println!("字符数量: {}", emoji.chars().count()); // 7 (包含 ZWJ 连接符)
    // 视觉上只有 1 个图形字符！

    // 正确处理需要使用 unicode-segmentation crate
    // println!("字素数量: {}", emoji.graphemes(true).count()); // 1
}
```

### 字符串比较陷阱

```rust
fn main() {
    // 大小写敏感
    assert!("Hello" != "hello");

    // Unicode 规范化问题
    let a = "é";      // 单个字符
    let b = "é";      // e + 组合重音符 (两个码点)

    // 字节比较可能不相等
    println!("直接比较: {}", a == b); // 可能是 false
    println!("a 的字节: {:?}", a.as_bytes());
    println!("b 的字节: {:?}", b.as_bytes());

    // 正确做法：使用 unicode-normalization crate
    // use unicode_normalization::UnicodeNormalization;
    // let a_nfc: String = a.nfc().collect();
    // let b_nfc: String = b.nfc().collect();
    // assert_eq!(a_nfc, b_nfc);

    // 大小写不敏感比较
    let s1 = "Hello";
    let s2 = "HELLO";

    // 简单方式（只对 ASCII 有效）
    println!("忽略大小写: {}", s1.eq_ignore_ascii_case(s2)); // true

    // 更正确的方式：转换为小写比较
    println!("转换比较: {}", s1.to_lowercase() == s2.to_lowercase()); // true
}
```

### 生命周期问题

```rust
fn main() {
    // 错误：返回局部 String 的引用
    // fn bad_return() -> &str {
    //     let s = String::from("hello");
    //     &s // 错误！s 将被释放
    // }

    // 正确：返回 String
    fn good_return_owned() -> String {
        String::from("hello")
    }

    // 正确：返回静态字符串
    fn good_return_static() -> &'static str {
        "hello"
    }

    // 正确：返回与参数相同生命周期的引用
    fn good_return_ref<'a>(s: &'a str) -> &'a str {
        &s[0..s.len().min(5)]
    }

    let s = good_return_owned();
    println!("{}", s);
}
```

## 性能考量

### String vs &str 性能

```rust
use std::time::Instant;

fn main() {
    const N: usize = 100_000;

    // 测试1：拼接性能
    let start = Instant::now();
    let mut s = String::new();
    for i in 0..N {
        s.push_str(&i.to_string());
    }
    println!("push_str 耗时: {:?}", start.elapsed());

    // 测试2：预分配容量
    let start = Instant::now();
    let mut s = String::with_capacity(N * 5);
    for i in 0..N {
        s.push_str(&i.to_string());
    }
    println!("预分配 push_str 耗时: {:?}", start.elapsed());

    // 测试3：使用 + 运算符（不推荐）
    // let start = Instant::now();
    // let mut s = String::new();
    // for i in 0..1000 {  // 减少次数，因为太慢
    //     s = s + &i.to_string();  // 每次都分配新字符串
    // }
    // println!("+ 运算符耗时: {:?}", start.elapsed());
}
```

### 容量管理

```rust
fn main() {
    let mut s = String::new();

    // 初始容量为 0
    println!("初始 - len: {}, capacity: {}", s.len(), s.capacity());

    // 自动扩容
    for i in 0..50 {
        s.push('a');
        if i % 10 == 0 {
            println!("i={} - len: {}, capacity: {}", i, s.len(), s.capacity());
        }
    }

    // 手动扩容
    s.reserve(100); // 保证至少还能容纳 100 字节
    println!("reserve 后 - len: {}, capacity: {}", s.len(), s.capacity());

    // 精确扩容
    s.reserve_exact(200);
    println!("reserve_exact 后 - len: {}, capacity: {}", s.len(), s.capacity());

    // 收缩容量
    s.shrink_to_fit();
    println!("shrink_to_fit 后 - len: {}, capacity: {}", s.len(), s.capacity());
}
```

### 避免不必要的复制

```rust
fn main() {
    // 使用 Cow (Copy on Write) 优化
    use std::borrow::Cow;

    fn process_string(input: &str) -> Cow<str> {
        if input.contains("bad") {
            // 需要修改时才分配新字符串
            Cow::Owned(input.replace("bad", "good"))
        } else {
            // 不需要修改时直接返回借用
            Cow::Borrowed(input)
        }
    }

    let s1 = "hello world";
    let s2 = "hello bad world";

    let result1 = process_string(s1);
    let result2 = process_string(s2);

    println!("result1 是借用: {}", matches!(result1, Cow::Borrowed(_))); // true
    println!("result2 是借用: {}", matches!(result2, Cow::Borrowed(_))); // false
}
```

## 实战场景

### 场景1：配置文件解析

```rust
use std::collections::HashMap;

fn parse_config(content: &str) -> HashMap<String, String> {
    let mut config = HashMap::new();

    for line in content.lines() {
        // 跳过空行和注释
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        // 解析 key=value 格式
        if let Some(pos) = line.find('=') {
            let key = line[..pos].trim().to_string();
            let value = line[pos + 1..].trim().to_string();
            config.insert(key, value);
        }
    }

    config
}

fn main() {
    let config_content = r#"
        # 数据库配置
        host = localhost
        port = 5432
        database = myapp

        # 应用配置
        debug = true
        log_level = info
    "#;

    let config = parse_config(config_content);

    for (key, value) in &config {
        println!("{} = {}", key, value);
    }
}
```

### 场景2：路径处理

```rust
use std::path::Path;

fn main() {
    // 使用 Path 处理文件路径（跨平台）
    let path = Path::new("/home/user/documents/file.txt");

    // 获取各部分
    println!("文件名: {:?}", path.file_name());
    println!("文件扩展名: {:?}", path.extension());
    println!("父目录: {:?}", path.parent());
    println!("文件干名: {:?}", path.file_stem());

    // 路径拼接
    let base = Path::new("/home/user");
    let full_path = base.join("documents").join("file.txt");
    println!("完整路径: {:?}", full_path);

    // 转换为字符串
    if let Some(path_str) = full_path.to_str() {
        println!("路径字符串: {}", path_str);
    }

    // 规范化路径
    let messy_path = Path::new("/home/user/../user/./documents");
    // 注意：canonicalize 需要路径实际存在
    // let clean_path = messy_path.canonicalize().unwrap();
}
```

### 场景3：模板渲染

```rust
use std::collections::HashMap;

fn render_template(template: &str, vars: &HashMap<&str, &str>) -> String {
    let mut result = template.to_string();

    for (key, value) in vars {
        let placeholder = format!("{{{{{}}}}}", key);
        result = result.replace(&placeholder, value);
    }

    result
}

fn main() {
    let template = r#"
        Dear {{name}},

        Thank you for your order #{{order_id}}.
        Your total is ${{total}}.

        Best regards,
        {{company}}
    "#;

    let mut vars = HashMap::new();
    vars.insert("name", "Alice");
    vars.insert("order_id", "12345");
    vars.insert("total", "99.99");
    vars.insert("company", "Rust Shop");

    let rendered = render_template(template, &vars);
    println!("{}", rendered);
}
```

### 场景4：JSON 字符串处理

```rust
// 简单的 JSON 字符串转义
fn escape_json_string(s: &str) -> String {
    let mut result = String::with_capacity(s.len() + 10);
    result.push('"');

    for ch in s.chars() {
        match ch {
            '"' => result.push_str("\\\""),
            '\\' => result.push_str("\\\\"),
            '\n' => result.push_str("\\n"),
            '\r' => result.push_str("\\r"),
            '\t' => result.push_str("\\t"),
            c if c.is_control() => {
                result.push_str(&format!("\\u{:04x}", c as u32));
            }
            c => result.push(c),
        }
    }

    result.push('"');
    result
}

fn main() {
    let text = "Hello, \"World\"!\nNew line\tTab";
    let escaped = escape_json_string(text);
    println!("转义后: {}", escaped);
    // 输出: "Hello, \"World\"!\nNew line\tTab"
}
```

## OsString 与 OsStr

### 为什么需要 OsString？

不同操作系统使用不同的字符串编码：

- **Windows**: 使用 UTF-16（可能包含无效的代理对）
- **Unix**: 使用字节序列（通常是 UTF-8，但不强制）
- **Rust String**: 强制 UTF-8

`OsString` 和 `OsStr` 用于表示操作系统原生字符串，可以处理这些差异。

```rust
use std::ffi::{OsString, OsStr};
use std::path::Path;

fn main() {
    // 从 String 创建 OsString
    let os_string: OsString = OsString::from("hello.txt");

    // 从 &str 创建 &OsStr
    let os_str: &OsStr = OsStr::new("hello.txt");

    // Path 内部使用 OsStr
    let path = Path::new("hello.txt");
    let file_name: Option<&OsStr> = path.file_name();

    // 尝试转换为 &str（可能失败）
    if let Some(name) = file_name {
        match name.to_str() {
            Some(s) => println!("文件名: {}", s),
            None => println!("文件名包含无效 UTF-8"),
        }
    }

    // 使用 to_string_lossy（将无效字节替换为 U+FFFD）
    if let Some(name) = file_name {
        println!("文件名 (lossy): {}", name.to_string_lossy());
    }

    // 环境变量也使用 OsString
    use std::env;

    if let Some(home) = env::var_os("HOME") {
        println!("HOME: {:?}", home);
        if let Some(home_str) = home.to_str() {
            println!("HOME (str): {}", home_str);
        }
    }
}
```

### 文件系统操作

```rust
use std::fs;
use std::path::Path;
use std::ffi::OsStr;

fn main() -> std::io::Result<()> {
    // 读取目录
    for entry in fs::read_dir(".")? {
        let entry = entry?;
        let path = entry.path();

        // file_name 返回 Option<&OsStr>
        if let Some(name) = path.file_name() {
            // 安全的方式：to_string_lossy
            println!("文件: {}", name.to_string_lossy());

            // 检查扩展名
            if path.extension() == Some(OsStr::new("rs")) {
                println!("  -> 这是 Rust 源文件");
            }
        }
    }

    Ok(())
}
```

## CString 与 CStr

### 为什么需要 CString？

C 语言使用以 null 结尾的字符串，而 Rust 字符串：
- 不以 null 结尾
- 可以包含 null 字节

`CString` 和 `CStr` 用于与 C 代码互操作。

```rust
use std::ffi::{CString, CStr};
use std::os::raw::c_char;

fn main() {
    // 创建 CString
    let c_string = CString::new("Hello, C!").expect("CString 不能包含内部 null 字节");

    // 获取原始指针（传递给 C 函数）
    let ptr: *const c_char = c_string.as_ptr();

    // 从原始指针创建 CStr（不安全）
    unsafe {
        let c_str: &CStr = CStr::from_ptr(ptr);

        // 转换为 Rust 字符串
        match c_str.to_str() {
            Ok(s) => println!("从 C 字符串: {}", s),
            Err(_) => println!("无效的 UTF-8"),
        }
    }

    // CString 包含内部 null 会失败
    let result = CString::new("Hello\0World");
    match result {
        Ok(_) => println!("成功创建"),
        Err(e) => println!("失败: {} (位置: {})", e, e.nul_position()),
    }
}
```

### FFI 实际应用

```rust
use std::ffi::{CString, CStr};
use std::os::raw::c_char;

// 模拟 C 函数
extern "C" {
    fn strlen(s: *const c_char) -> usize;
}

fn call_c_strlen(s: &str) -> Option<usize> {
    // 创建 CString
    let c_string = CString::new(s).ok()?;

    // 调用 C 函数
    unsafe {
        Some(strlen(c_string.as_ptr()))
    }
}

// 模拟从 C 接收字符串
unsafe fn receive_from_c(ptr: *const c_char) -> Option<String> {
    if ptr.is_null() {
        return None;
    }

    // 创建 CStr
    let c_str = CStr::from_ptr(ptr);

    // 尝试转换为 String
    c_str.to_str().ok().map(|s| s.to_string())
}

fn main() {
    // 示例：计算字符串长度
    // 注意：实际运行需要链接 libc
    // let len = call_c_strlen("Hello, World!");
    // println!("长度: {:?}", len);

    // 安全地包装 C 字符串指针
    let c_string = CString::new("Hello").unwrap();
    unsafe {
        let received = receive_from_c(c_string.as_ptr());
        println!("接收到: {:?}", received);
    }
}
```

## 面试要点

### 常见面试问题

**Q1: String 和 &str 有什么区别？**

```
答案要点：
1. String 是堆分配的、可变的、拥有所有权的字符串类型
2. &str 是字符串切片，是对 UTF-8 字节序列的借用
3. String 可以增长或收缩，&str 是不可变的
4. String 在栈上存储 (ptr, len, capacity)，数据在堆上
5. &str 是胖指针，存储 (ptr, len)
6. 函数参数优先使用 &str，因为更灵活
```

**Q2: 为什么 Rust 不允许直接索引字符串？**

```rust
// 答案要点：
fn explain_indexing() {
    let s = "你好";

    // 1. UTF-8 是变长编码
    println!("字节长度: {}", s.len()); // 6
    println!("字符数量: {}", s.chars().count()); // 2

    // 2. s[0] 应该返回什么？
    //    - 一个字节？(0xe4) 没有意义
    //    - 一个字符？需要 O(n) 时间扫描

    // 3. Rust 选择明确性，避免歧义
    let byte = s.as_bytes()[0]; // 明确要字节
    let ch = s.chars().nth(0);  // 明确要字符
}
```

**Q3: 如何高效地拼接多个字符串？**

```rust
fn efficient_concat() {
    let parts = vec!["Hello", ", ", "World", "!"];

    // 方法1: join
    let s1: String = parts.join("");

    // 方法2: concat
    let s2: String = parts.concat();

    // 方法3: collect
    let s3: String = parts.iter().copied().collect();

    // 方法4: push_str + 预分配
    let total_len: usize = parts.iter().map(|s| s.len()).sum();
    let mut s4 = String::with_capacity(total_len);
    for part in &parts {
        s4.push_str(part);
    }

    // 方法5: format! (最灵活但可能较慢)
    let s5 = format!("{}{}{}{}", parts[0], parts[1], parts[2], parts[3]);
}
```

**Q4: Cow<str> 是什么？什么时候使用？**

```rust
use std::borrow::Cow;

// Cow = Clone on Write
fn explain_cow() {
    // Cow<str> 可以是借用或拥有
    let borrowed: Cow<str> = Cow::Borrowed("hello");
    let owned: Cow<str> = Cow::Owned(String::from("world"));

    // 使用场景：可能需要修改也可能不需要
    fn maybe_modify(s: &str) -> Cow<str> {
        if s.contains("bad") {
            Cow::Owned(s.replace("bad", "good"))
        } else {
            Cow::Borrowed(s)
        }
    }

    // 优点：避免不必要的分配
    let s1 = maybe_modify("hello");       // 返回 Borrowed
    let s2 = maybe_modify("bad word");    // 返回 Owned
}
```

**Q5: 如何正确处理包含 Unicode 的字符串？**

```rust
fn unicode_handling() {
    let s = "Hello, 世界! 👋";

    // 1. 正确计算字符数
    let char_count = s.chars().count();

    // 2. 正确遍历
    for (i, ch) in s.char_indices() {
        println!("字节位置 {}: {}", i, ch);
    }

    // 3. 安全切片
    fn safe_slice(s: &str, char_start: usize, char_end: usize) -> Option<&str> {
        let mut indices = s.char_indices();
        let start = indices.nth(char_start)?.0;
        let end = indices.nth(char_end - char_start - 1)
            .map(|(i, _)| i)
            .unwrap_or(s.len());
        Some(&s[start..end])
    }

    // 4. 使用 unicode-segmentation 处理字素簇
    // let grapheme_count = s.graphemes(true).count();
}
```

## 延伸阅读

### 官方资源

- [The Rust Book - Storing UTF-8 Encoded Text with Strings](https://doc.rust-lang.org/book/ch08-02-strings.html)
- [Rust std::string 文档](https://doc.rust-lang.org/std/string/index.html)
- [Rust std::str 文档](https://doc.rust-lang.org/std/str/index.html)
- [Rust std::ffi 文档](https://doc.rust-lang.org/std/ffi/index.html)

### 推荐 Crate

- `unicode-segmentation`: Unicode 字素簇处理
- `unicode-normalization`: Unicode 规范化
- `regex`: 正则表达式
- `aho-corasick`: 高效多模式字符串匹配
- `memchr`: 高效字节搜索

### 深入文章

- [String vs &str in Rust](https://blog.thoughtram.io/string-vs-str-in-rust/)
- [Working with Strings in Rust](https://fasterthanli.me/articles/working-with-strings-in-rust)
- [UTF-8 Everywhere](https://utf8everywhere.org/)

## 总结

Rust 的字符串系统虽然初看复杂，但它的设计是为了解决真实世界中的问题：

1. **`String` 和 `&str`** 是最常用的类型
   - `String` 用于需要所有权或修改的场景
   - `&str` 用于只读访问，作为函数参数优先选择

2. **UTF-8** 是 Rust 字符串的基础
   - 理解变长编码对于正确处理字符串至关重要
   - 使用 `chars()` 遍历字符，`bytes()` 遍历字节

3. **性能优化** 的关键
   - 使用 `with_capacity` 预分配
   - 避免不必要的 `clone()` 和 `to_string()`
   - 使用 `Cow<str>` 优化可能需要也可能不需要修改的场景

4. **OsString/CString** 用于系统互操作
   - 文件路径使用 `Path`/`OsStr`
   - C FFI 使用 `CString`/`CStr`

掌握这些概念，你就能在 Rust 中高效、安全地处理各种字符串场景。
