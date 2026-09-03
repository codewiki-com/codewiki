---
title: 集合类型
description: Rust集合类型完全指南，Vec、HashMap、HashSet与BTreeMap
track: rust
section: basics
difficulty: intermediate
tags:
  - Rust
  - 集合
  - Vec
  - HashMap
status: imported
origin: old/src/content/docs/rust/collections.zh.md
divergence: 0.294
issues: []
legacy:
  category: Rust
  subcategory: 标准库
  order: 13
  lastUpdated: 2026-01-07
---

集合是 Rust 标准库中最常用的数据结构，用于存储多个值。与内置的数组和元组不同，集合的数据存储在堆上，这意味着数据量不需要在编译时确定，可以在运行时动态增长或缩小。本文将全面介绍 Rust 中的主要集合类型及其使用方法。

## Vec - 动态数组

`Vec<T>` 是 Rust 中最常用的集合类型，它是一个可增长的、堆分配的数组。所有元素必须是相同类型。

### 创建 Vec

```rust
fn main() {
    // 方式 1: 使用 Vec::new()
    let mut v1: Vec<i32> = Vec::new();
    v1.push(1);
    v1.push(2);
    v1.push(3);

    // 方式 2: 使用 vec! 宏
    let v2 = vec![1, 2, 3];

    // 方式 3: 使用指定容量创建
    let mut v3: Vec<i32> = Vec::with_capacity(10);
    println!("容量: {}, 长度: {}", v3.capacity(), v3.len());
    // 输出: 容量: 10, 长度: 0

    // 方式 4: 使用重复值创建
    let v4 = vec![0; 5]; // [0, 0, 0, 0, 0]
    println!("{:?}", v4);

    // 方式 5: 从迭代器创建
    let v5: Vec<i32> = (1..=5).collect();
    println!("{:?}", v5); // [1, 2, 3, 4, 5]
}
```

### 访问元素

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // 方式 1: 使用索引(可能 panic)
    let third = v[2];
    println!("第三个元素: {}", third);

    // 方式 2: 使用 get 方法(返回 Option)
    match v.get(2) {
        Some(value) => println!("第三个元素: {}", value),
        None => println!("没有第三个元素"),
    }

    // 安全访问越界索引
    let tenth = v.get(10);
    println!("第十个元素: {:?}", tenth); // None

    // 获取第一个和最后一个元素
    if let Some(first) = v.first() {
        println!("第一个: {}", first);
    }
    if let Some(last) = v.last() {
        println!("最后一个: {}", last);
    }
}
```

### 修改 Vec

```rust
fn main() {
    let mut v = vec![1, 2, 3];

    // 添加元素
    v.push(4);
    println!("push 后: {:?}", v); // [1, 2, 3, 4]

    // 弹出最后一个元素
    let popped = v.pop();
    println!("pop 返回: {:?}", popped); // Some(4)

    // 在指定位置插入
    v.insert(1, 10);
    println!("insert 后: {:?}", v); // [1, 10, 2, 3]

    // 删除指定位置的元素
    let removed = v.remove(1);
    println!("remove 返回: {}, 现在: {:?}", removed, v); // 10, [1, 2, 3]

    // 交换删除(O(1) 但不保持顺序)
    let mut v2 = vec![1, 2, 3, 4, 5];
    v2.swap_remove(1); // 用最后一个元素替换被删除的元素
    println!("swap_remove 后: {:?}", v2); // [1, 5, 3, 4]

    // 清空
    v.clear();
    println!("clear 后: {:?}", v); // []

    // 追加另一个 Vec
    let mut v3 = vec![1, 2];
    let mut v4 = vec![3, 4];
    v3.append(&mut v4);
    println!("append 后: {:?}, v4: {:?}", v3, v4); // [1, 2, 3, 4], []

    // 扩展
    let mut v5 = vec![1, 2];
    v5.extend([3, 4, 5]);
    println!("extend 后: {:?}", v5); // [1, 2, 3, 4, 5]
}
```

### 切片操作

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // 获取切片
    let slice = &v[1..4];
    println!("切片: {:?}", slice); // [2, 3, 4]

    // 切片转换为 Vec
    let new_vec = slice.to_vec();
    println!("新 Vec: {:?}", new_vec);

    // 分割
    let (left, right) = v.split_at(2);
    println!("左: {:?}, 右: {:?}", left, right); // [1, 2], [3, 4, 5]

    // 可变分割
    let mut v2 = vec![1, 2, 3, 4, 5];
    let (left, right) = v2.split_at_mut(2);
    left[0] = 10;
    right[0] = 30;
    println!("修改后: {:?}", v2); // [10, 2, 30, 4, 5]

    // chunks - 分块迭代
    let v3 = vec![1, 2, 3, 4, 5, 6, 7];
    for chunk in v3.chunks(3) {
        println!("块: {:?}", chunk);
    }
    // 块: [1, 2, 3]
    // 块: [4, 5, 6]
    // 块: [7]

    // windows - 滑动窗口
    for window in v3.windows(3) {
        println!("窗口: {:?}", window);
    }
    // 窗口: [1, 2, 3]
    // 窗口: [2, 3, 4]
    // 窗口: [3, 4, 5]
    // ...
}
```

### 排序和搜索

```rust
fn main() {
    let mut numbers = vec![3, 1, 4, 1, 5, 9, 2, 6];

    // 排序
    numbers.sort();
    println!("排序后: {:?}", numbers); // [1, 1, 2, 3, 4, 5, 6, 9]

    // 逆序排序
    numbers.sort_by(|a, b| b.cmp(a));
    println!("逆序: {:?}", numbers); // [9, 6, 5, 4, 3, 2, 1, 1]

    // 按键排序
    let mut words = vec!["banana", "apple", "cherry"];
    words.sort_by_key(|s| s.len());
    println!("按长度排序: {:?}", words); // ["apple", "banana", "cherry"]

    // 二分查找(需要已排序)
    let sorted = vec![1, 2, 3, 4, 5, 6, 7, 8, 9];
    match sorted.binary_search(&5) {
        Ok(index) => println!("找到 5 在索引 {}", index),
        Err(index) => println!("未找到,应插入位置: {}", index),
    }

    // 包含检查
    println!("包含 5: {}", sorted.contains(&5)); // true

    // 去重(需要已排序)
    let mut duplicates = vec![1, 1, 2, 2, 3, 3, 3];
    duplicates.dedup();
    println!("去重后: {:?}", duplicates); // [1, 2, 3]
}
```

### 容量管理

```rust
fn main() {
    let mut v = Vec::with_capacity(10);

    println!("初始 - 容量: {}, 长度: {}", v.capacity(), v.len());

    for i in 0..10 {
        v.push(i);
    }
    println!("填满后 - 容量: {}, 长度: {}", v.capacity(), v.len());

    v.push(10); // 超过容量,会重新分配
    println!("超容量后 - 容量: {}, 长度: {}", v.capacity(), v.len());

    // 收缩容量
    v.shrink_to_fit();
    println!("收缩后 - 容量: {}, 长度: {}", v.capacity(), v.len());

    // 预留额外容量
    v.reserve(100);
    println!("预留后 - 容量: {}, 长度: {}", v.capacity(), v.len());
}
```

## String - 字符串

`String` 是 Rust 中的可增长字符串类型，本质上是一个 `Vec<u8>` 的封装，保证内容始终是有效的 UTF-8。

### 创建 String

```rust
fn main() {
    // 方式 1: 空字符串
    let mut s1 = String::new();

    // 方式 2: 从字面量创建
    let s2 = String::from("Hello");
    let s3 = "World".to_string();

    // 方式 3: 使用 format! 宏
    let s4 = format!("{} {}", s2, s3);
    println!("{}", s4); // "Hello World"

    // 方式 4: 从字符迭代器创建
    let chars = vec!['H', 'e', 'l', 'l', 'o'];
    let s5: String = chars.iter().collect();
    println!("{}", s5);

    // 方式 5: 重复字符串
    let s6 = "ab".repeat(3);
    println!("{}", s6); // "ababab"
}
```

### 修改 String

```rust
fn main() {
    let mut s = String::from("Hello");

    // 追加字符串切片
    s.push_str(", World");
    println!("{}", s); // "Hello, World"

    // 追加单个字符
    s.push('!');
    println!("{}", s); // "Hello, World!"

    // 使用 + 运算符连接(消耗左操作数)
    let s1 = String::from("Hello, ");
    let s2 = String::from("World!");
    let s3 = s1 + &s2; // s1 被移动,s2 被借用
    println!("{}", s3);
    // println!("{}", s1); // 错误: s1 已被移动

    // 插入
    let mut s4 = String::from("Hello!");
    s4.insert(5, ',');
    s4.insert_str(6, " World");
    println!("{}", s4); // "Hello, World!"

    // 替换
    let s5 = String::from("I like Rust");
    let s6 = s5.replace("Rust", "programming");
    println!("{}", s6); // "I like programming"

    // 删除
    let mut s7 = String::from("Hello, World!");
    s7.truncate(5);
    println!("{}", s7); // "Hello"

    let mut s8 = String::from("Hello");
    s8.pop(); // 移除最后一个字符
    println!("{}", s8); // "Hell"

    // 清空
    s8.clear();
    println!("清空后长度: {}", s8.len()); // 0
}
```

### 字符串切片和索引

```rust
fn main() {
    let s = String::from("Hello, World!");

    // 字符串切片(必须在字符边界)
    let hello = &s[0..5];
    let world = &s[7..12];
    println!("{} {}", hello, world);

    // 注意: 不能直接用索引访问单个字符
    // let h = s[0]; // 错误!

    // 遍历字符
    for c in s.chars() {
        print!("{} ", c);
    }
    println!();

    // 遍历字节
    for b in s.bytes() {
        print!("{} ", b);
    }
    println!();

    // 获取第 n 个字符
    if let Some(c) = s.chars().nth(0) {
        println!("第一个字符: {}", c);
    }

    // 处理中文
    let chinese = String::from("你好世界");
    println!("字节长度: {}", chinese.len()); // 12 (每个中文字符 3 字节)
    println!("字符数量: {}", chinese.chars().count()); // 4

    // 正确的中文切片(按字节边界)
    let ni_hao = &chinese[0..6]; // "你好"
    println!("{}", ni_hao);
}
```

### 字符串搜索和分割

```rust
fn main() {
    let s = "Hello, World! Hello, Rust!";

    // 包含检查
    println!("包含 World: {}", s.contains("World"));
    println!("以 Hello 开头: {}", s.starts_with("Hello"));
    println!("以 ! 结尾: {}", s.ends_with("!"));

    // 查找位置
    if let Some(pos) = s.find("World") {
        println!("World 在位置: {}", pos);
    }

    // 分割
    for word in s.split(", ") {
        println!("单词: {}", word);
    }

    // 按空白分割
    for word in s.split_whitespace() {
        println!("词: {}", word);
    }

    // 分割成行
    let multiline = "line1\nline2\nline3";
    for line in multiline.lines() {
        println!("行: {}", line);
    }

    // 分割成两部分
    if let Some((left, right)) = s.split_once(", ") {
        println!("左: {}, 右: {}", left, right);
    }
}
```

### 字符串转换和修剪

```rust
fn main() {
    let s = "  Hello, World!  ";

    // 修剪空白
    println!("trim: '{}'", s.trim());
    println!("trim_start: '{}'", s.trim_start());
    println!("trim_end: '{}'", s.trim_end());

    // 修剪特定字符
    let s2 = "###Hello###";
    println!("trim #: '{}'", s2.trim_matches('#'));

    // 大小写转换
    let s3 = "Hello, World!";
    println!("大写: {}", s3.to_uppercase());
    println!("小写: {}", s3.to_lowercase());

    // 解析为其他类型
    let num_str = "42";
    let num: i32 = num_str.parse().unwrap();
    println!("解析结果: {}", num);

    // 数字转字符串
    let n = 42;
    let s4 = n.to_string();
    println!("数字字符串: {}", s4);
}
```

## HashMap - 哈希表

`HashMap<K, V>` 存储键值对,通过哈希函数实现快速查找。键必须实现 `Eq` 和 `Hash` trait。

### 创建 HashMap

```rust
use std::collections::HashMap;

fn main() {
    // 方式 1: 空 HashMap
    let mut map1: HashMap<String, i32> = HashMap::new();
    map1.insert(String::from("Blue"), 10);
    map1.insert(String::from("Red"), 50);

    // 方式 2: 使用 collect 从元组创建
    let teams = vec![
        (String::from("Blue"), 10),
        (String::from("Red"), 50),
    ];
    let map2: HashMap<_, _> = teams.into_iter().collect();
    println!("{:?}", map2);

    // 方式 3: 指定容量
    let map3: HashMap<String, i32> = HashMap::with_capacity(10);

    // 方式 4: 从两个向量创建
    let keys = vec!["a", "b", "c"];
    let values = vec![1, 2, 3];
    let map4: HashMap<_, _> = keys.into_iter().zip(values.into_iter()).collect();
    println!("{:?}", map4);
}
```

### 访问和修改

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Red"), 50);

    // 获取值
    let team = String::from("Blue");
    if let Some(score) = scores.get(&team) {
        println!("{} 队得分: {}", team, score);
    }

    // 获取可变引用
    if let Some(score) = scores.get_mut(&team) {
        *score += 10;
    }
    println!("更新后: {:?}", scores);

    // 检查键是否存在
    println!("包含 Blue: {}", scores.contains_key("Blue"));

    // 删除
    let removed = scores.remove("Red");
    println!("移除: {:?}", removed);

    // 遍历
    for (key, value) in &scores {
        println!("{}: {}", key, value);
    }

    // 获取所有键或值
    let keys: Vec<_> = scores.keys().collect();
    let values: Vec<_> = scores.values().collect();
    println!("键: {:?}, 值: {:?}", keys, values);
}
```

### Entry API

Entry API 是 HashMap 最强大的特性之一,它提供了一种优雅的方式来处理"如果不存在则插入"的模式。

```rust
use std::collections::HashMap;

fn main() {
    let mut scores: HashMap<String, i32> = HashMap::new();

    // or_insert: 如果键不存在,插入默认值
    scores.entry(String::from("Blue")).or_insert(50);
    scores.entry(String::from("Blue")).or_insert(100); // 不会覆盖
    println!("{:?}", scores); // {"Blue": 50}

    // or_insert_with: 使用闭包计算默认值
    scores.entry(String::from("Red")).or_insert_with(|| {
        println!("计算默认值...");
        25
    });

    // or_default: 使用类型的 Default 值
    let count: &mut i32 = scores.entry(String::from("Green")).or_default();
    *count += 10;

    // and_modify: 如果存在则修改
    scores.entry(String::from("Blue"))
        .and_modify(|v| *v += 10)
        .or_insert(0);
    println!("{:?}", scores); // {"Blue": 60, "Red": 25, "Green": 10}

    // 实用示例: 单词计数
    let text = "hello world hello rust world";
    let mut word_count: HashMap<&str, i32> = HashMap::new();

    for word in text.split_whitespace() {
        *word_count.entry(word).or_insert(0) += 1;
    }
    println!("单词计数: {:?}", word_count);
    // {"hello": 2, "world": 2, "rust": 1}
}
```

### Entry API 高级用法

```rust
use std::collections::HashMap;

fn main() {
    // 分组数据
    let data = vec![
        ("fruit", "apple"),
        ("vegetable", "carrot"),
        ("fruit", "banana"),
        ("vegetable", "broccoli"),
        ("fruit", "cherry"),
    ];

    let mut groups: HashMap<&str, Vec<&str>> = HashMap::new();

    for (category, item) in data {
        groups.entry(category).or_default().push(item);
    }

    println!("{:?}", groups);
    // {"fruit": ["apple", "banana", "cherry"], "vegetable": ["carrot", "broccoli"]}

    // 缓存计算结果
    fn expensive_calculation(n: i32) -> i32 {
        println!("计算 {}...", n);
        n * n
    }

    let mut cache: HashMap<i32, i32> = HashMap::new();

    let result1 = *cache.entry(5).or_insert_with(|| expensive_calculation(5));
    let result2 = *cache.entry(5).or_insert_with(|| expensive_calculation(5)); // 不会重新计算

    println!("结果: {}, {}", result1, result2);
}
```

## HashSet - 哈希集合

`HashSet<T>` 是一个只存储键的集合,常用于去重和集合运算。

### 创建和基本操作

```rust
use std::collections::HashSet;

fn main() {
    // 创建
    let mut set1: HashSet<i32> = HashSet::new();
    set1.insert(1);
    set1.insert(2);
    set1.insert(3);
    set1.insert(2); // 重复插入,不会添加
    println!("{:?}", set1); // {1, 2, 3}

    // 从迭代器创建
    let set2: HashSet<i32> = [1, 2, 3, 4, 5].into_iter().collect();

    // 从 Vec 去重
    let numbers = vec![1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
    let unique: HashSet<_> = numbers.into_iter().collect();
    println!("去重后: {:?}", unique);

    // 检查成员
    println!("包含 2: {}", set1.contains(&2));

    // 删除
    set1.remove(&2);
    println!("移除 2 后: {:?}", set1);

    // 长度
    println!("大小: {}", set1.len());
    println!("是否为空: {}", set1.is_empty());
}
```

### 集合运算

```rust
use std::collections::HashSet;

fn main() {
    let a: HashSet<i32> = [1, 2, 3, 4, 5].into_iter().collect();
    let b: HashSet<i32> = [3, 4, 5, 6, 7].into_iter().collect();

    // 交集
    let intersection: HashSet<_> = a.intersection(&b).copied().collect();
    println!("交集: {:?}", intersection); // {3, 4, 5}

    // 并集
    let union: HashSet<_> = a.union(&b).copied().collect();
    println!("并集: {:?}", union); // {1, 2, 3, 4, 5, 6, 7}

    // 差集 (a - b)
    let difference: HashSet<_> = a.difference(&b).copied().collect();
    println!("差集 a-b: {:?}", difference); // {1, 2}

    // 对称差集 (只在一个集合中)
    let symmetric_difference: HashSet<_> = a.symmetric_difference(&b).copied().collect();
    println!("对称差集: {:?}", symmetric_difference); // {1, 2, 6, 7}

    // 子集和超集检查
    let c: HashSet<i32> = [3, 4].into_iter().collect();
    println!("c 是 a 的子集: {}", c.is_subset(&a));
    println!("a 是 c 的超集: {}", a.is_superset(&c));

    // 无交集检查
    let d: HashSet<i32> = [10, 11].into_iter().collect();
    println!("a 和 d 无交集: {}", a.is_disjoint(&d));
}
```

### 集合实用示例

```rust
use std::collections::HashSet;

fn main() {
    // 查找两个列表的共同元素
    let list1 = vec!["apple", "banana", "cherry", "date"];
    let list2 = vec!["banana", "date", "fig", "grape"];

    let set1: HashSet<_> = list1.iter().collect();
    let set2: HashSet<_> = list2.iter().collect();

    let common: Vec<_> = set1.intersection(&set2).collect();
    println!("共同元素: {:?}", common);

    // 查找重复元素
    let numbers = vec![1, 2, 3, 2, 4, 3, 5, 6, 5];
    let mut seen = HashSet::new();
    let mut duplicates = HashSet::new();

    for &num in &numbers {
        if !seen.insert(num) {
            duplicates.insert(num);
        }
    }
    println!("重复元素: {:?}", duplicates); // {2, 3, 5}

    // 保持顺序去重
    let items = vec!["a", "b", "a", "c", "b", "d"];
    let mut seen = HashSet::new();
    let unique: Vec<_> = items.into_iter()
        .filter(|x| seen.insert(*x))
        .collect();
    println!("顺序去重: {:?}", unique); // ["a", "b", "c", "d"]
}
```

## BTreeMap - 有序映射

`BTreeMap<K, V>` 是基于 B 树的有序映射,键始终按顺序排列。适合需要有序遍历或范围查询的场景。

### 基本使用

```rust
use std::collections::BTreeMap;

fn main() {
    let mut map = BTreeMap::new();

    // 无序插入
    map.insert(3, "three");
    map.insert(1, "one");
    map.insert(4, "four");
    map.insert(1, "ONE"); // 覆盖
    map.insert(5, "five");
    map.insert(9, "nine");
    map.insert(2, "two");

    // 遍历时按键排序
    for (key, value) in &map {
        println!("{}: {}", key, value);
    }
    // 1: ONE
    // 2: two
    // 3: three
    // 4: four
    // 5: five
    // 9: nine

    // 获取第一个和最后一个
    println!("第一个: {:?}", map.first_key_value()); // Some((1, "ONE"))
    println!("最后一个: {:?}", map.last_key_value()); // Some((9, "nine"))

    // 弹出第一个和最后一个
    let first = map.pop_first();
    let last = map.pop_last();
    println!("弹出: {:?}, {:?}", first, last);
}
```

### 范围查询

```rust
use std::collections::BTreeMap;
use std::ops::Bound;

fn main() {
    let mut map = BTreeMap::new();
    for i in 0..10 {
        map.insert(i, i * i);
    }

    // 范围遍历 [3, 7)
    println!("范围 3..7:");
    for (k, v) in map.range(3..7) {
        println!("  {}: {}", k, v);
    }

    // 使用 Bound 进行更精确的范围控制
    println!("范围 (3, 7]:");
    for (k, v) in map.range((Bound::Excluded(3), Bound::Included(7))) {
        println!("  {}: {}", k, v);
    }

    // 从某个键开始
    println!("从 5 开始:");
    for (k, v) in map.range(5..) {
        println!("  {}: {}", k, v);
    }

    // 可变范围查询
    for (_, v) in map.range_mut(3..7) {
        *v += 100;
    }
    println!("修改后的范围: {:?}", map.range(3..7).collect::<Vec<_>>());
}
```

### BTreeMap 与 HashMap 对比

```rust
use std::collections::{BTreeMap, HashMap};

fn main() {
    // BTreeMap 的优势
    let mut btree: BTreeMap<i32, &str> = BTreeMap::new();
    btree.insert(3, "c");
    btree.insert(1, "a");
    btree.insert(2, "b");

    // 1. 有序迭代
    println!("BTreeMap 按序遍历:");
    for (k, v) in &btree {
        println!("  {}: {}", k, v); // 保证顺序: 1, 2, 3
    }

    // 2. 范围查询
    let in_range: Vec<_> = btree.range(1..3).collect();
    println!("范围 [1, 3): {:?}", in_range);

    // 3. 第一个/最后一个元素
    println!("最小键: {:?}", btree.first_key_value());
    println!("最大键: {:?}", btree.last_key_value());

    // HashMap 的优势
    let mut hash: HashMap<i32, &str> = HashMap::new();
    hash.insert(3, "c");
    hash.insert(1, "a");
    hash.insert(2, "b");

    // 1. 平均 O(1) 查找时间(BTreeMap 是 O(log n))
    // 2. 对于大量数据,通常更快
    // 3. 不需要键实现 Ord trait

    // 选择建议:
    // - 需要有序遍历或范围查询 -> BTreeMap
    // - 只需要快速查找 -> HashMap
    // - 键不能排序 -> HashMap
}
```

## BTreeSet - 有序集合

`BTreeSet<T>` 是基于 B 树的有序集合,元素始终按顺序排列。

```rust
use std::collections::BTreeSet;

fn main() {
    let mut set = BTreeSet::new();

    // 无序插入
    set.insert(5);
    set.insert(2);
    set.insert(8);
    set.insert(1);
    set.insert(9);

    // 有序遍历
    println!("有序集合: {:?}", set); // {1, 2, 5, 8, 9}

    // 获取第一个和最后一个
    println!("最小: {:?}", set.first()); // Some(1)
    println!("最大: {:?}", set.last()); // Some(9)

    // 范围查询
    let in_range: Vec<_> = set.range(2..8).collect();
    println!("范围 [2, 8): {:?}", in_range); // [2, 5]

    // 集合运算(与 HashSet 类似)
    let set2: BTreeSet<i32> = [3, 5, 7, 9].into_iter().collect();
    let intersection: BTreeSet<_> = set.intersection(&set2).copied().collect();
    println!("交集: {:?}", intersection); // {5, 9}

    // 弹出第一个和最后一个
    let first = set.pop_first();
    let last = set.pop_last();
    println!("弹出最小 {:?} 和最大 {:?}", first, last);
    println!("剩余: {:?}", set); // {2, 5, 8}
}
```

## VecDeque - 双端队列

`VecDeque<T>` 是一个双端队列,支持在两端高效地添加和删除元素。

### 基本操作

```rust
use std::collections::VecDeque;

fn main() {
    let mut deque: VecDeque<i32> = VecDeque::new();

    // 在后端添加
    deque.push_back(1);
    deque.push_back(2);
    deque.push_back(3);
    println!("push_back 后: {:?}", deque); // [1, 2, 3]

    // 在前端添加
    deque.push_front(0);
    deque.push_front(-1);
    println!("push_front 后: {:?}", deque); // [-1, 0, 1, 2, 3]

    // 从后端弹出
    let back = deque.pop_back();
    println!("pop_back: {:?}", back); // Some(3)

    // 从前端弹出
    let front = deque.pop_front();
    println!("pop_front: {:?}", front); // Some(-1)

    println!("最终: {:?}", deque); // [0, 1, 2]

    // 查看两端(不移除)
    println!("前端: {:?}", deque.front()); // Some(0)
    println!("后端: {:?}", deque.back()); // Some(2)

    // 索引访问
    println!("索引 1: {:?}", deque.get(1)); // Some(1)
    println!("deque[1]: {}", deque[1]); // 1
}
```

### 队列和栈

```rust
use std::collections::VecDeque;

fn main() {
    // 用作队列 (FIFO)
    let mut queue: VecDeque<&str> = VecDeque::new();

    // 入队
    queue.push_back("first");
    queue.push_back("second");
    queue.push_back("third");

    // 出队
    while let Some(item) = queue.pop_front() {
        println!("处理: {}", item);
    }
    // 处理: first
    // 处理: second
    // 处理: third

    // 用作栈 (LIFO) - 虽然 Vec 更适合
    let mut stack: VecDeque<i32> = VecDeque::new();

    // 压栈
    stack.push_back(1);
    stack.push_back(2);
    stack.push_back(3);

    // 出栈
    while let Some(item) = stack.pop_back() {
        println!("出栈: {}", item);
    }
    // 出栈: 3
    // 出栈: 2
    // 出栈: 1
}
```

### VecDeque 特有操作

```rust
use std::collections::VecDeque;

fn main() {
    let mut deque: VecDeque<i32> = (1..=5).collect();
    println!("初始: {:?}", deque); // [1, 2, 3, 4, 5]

    // 旋转
    deque.rotate_left(2);
    println!("左旋 2: {:?}", deque); // [3, 4, 5, 1, 2]

    deque.rotate_right(2);
    println!("右旋 2: {:?}", deque); // [1, 2, 3, 4, 5]

    // 交换
    deque.swap(0, 4);
    println!("交换 0 和 4: {:?}", deque); // [5, 2, 3, 4, 1]

    // 转换为连续内存
    let (front, back) = deque.as_slices();
    println!("切片: {:?}, {:?}", front, back);

    deque.make_contiguous();
    let slice = deque.as_slices().0;
    println!("连续切片: {:?}", slice);

    // 转换为 Vec
    let vec: Vec<i32> = deque.into();
    println!("Vec: {:?}", vec);
}
```

## 遍历集合

### 三种迭代方式

```rust
use std::collections::HashMap;

fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // 1. 不可变借用 - iter()
    println!("不可变借用:");
    for item in v.iter() {
        println!("  {}", item);
    }
    // v 仍然有效

    // 2. 可变借用 - iter_mut()
    let mut v2 = vec![1, 2, 3, 4, 5];
    println!("可变借用:");
    for item in v2.iter_mut() {
        *item *= 2;
    }
    println!("  修改后: {:?}", v2); // [2, 4, 6, 8, 10]

    // 3. 获取所有权 - into_iter()
    println!("获取所有权:");
    for item in v.into_iter() {
        println!("  {}", item);
    }
    // v 不再有效

    // HashMap 的迭代
    let mut map = HashMap::new();
    map.insert("a", 1);
    map.insert("b", 2);

    // 遍历键值对
    for (key, value) in &map {
        println!("{}: {}", key, value);
    }

    // 只遍历键
    for key in map.keys() {
        println!("键: {}", key);
    }

    // 只遍历值
    for value in map.values() {
        println!("值: {}", value);
    }

    // 可变遍历值
    for value in map.values_mut() {
        *value *= 10;
    }
    println!("修改后: {:?}", map);
}
```

### 使用迭代器适配器

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // map + filter + collect
    let result: Vec<i32> = numbers.iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * x)
        .collect();
    println!("偶数的平方: {:?}", result); // [4, 16, 36, 64, 100]

    // enumerate - 带索引遍历
    for (index, value) in numbers.iter().enumerate() {
        println!("索引 {}: {}", index, value);
    }

    // fold - 折叠/归约
    let sum: i32 = numbers.iter().fold(0, |acc, &x| acc + x);
    println!("总和: {}", sum);

    // 链接多个集合
    let a = vec![1, 2, 3];
    let b = vec![4, 5, 6];
    let combined: Vec<_> = a.iter().chain(b.iter()).collect();
    println!("链接: {:?}", combined); // [1, 2, 3, 4, 5, 6]
}
```

### drain - 移动元素

```rust
fn main() {
    // Vec drain
    let mut v = vec![1, 2, 3, 4, 5];
    let drained: Vec<_> = v.drain(1..4).collect();
    println!("drained: {:?}", drained); // [2, 3, 4]
    println!("remaining: {:?}", v); // [1, 5]

    // HashMap drain
    use std::collections::HashMap;
    let mut map = HashMap::new();
    map.insert("a", 1);
    map.insert("b", 2);
    map.insert("c", 3);

    // 移动所有元素
    let entries: Vec<_> = map.drain().collect();
    println!("entries: {:?}", entries);
    println!("map is empty: {}", map.is_empty()); // true
}
```

## Entry API 详解

Entry API 是 Rust 集合库中最强大的特性之一,它提供了一种优雅且高效的方式来处理集合中的条目。

### Entry 枚举

```rust
use std::collections::HashMap;
use std::collections::hash_map::Entry;

fn main() {
    let mut map: HashMap<&str, i32> = HashMap::new();
    map.insert("a", 1);

    // Entry 是一个枚举
    match map.entry("a") {
        Entry::Occupied(entry) => {
            println!("已存在: {}", entry.get());
        }
        Entry::Vacant(entry) => {
            println!("不存在,插入默认值");
            entry.insert(0);
        }
    }

    match map.entry("b") {
        Entry::Occupied(entry) => {
            println!("已存在: {}", entry.get());
        }
        Entry::Vacant(entry) => {
            println!("不存在,插入默认值");
            entry.insert(0);
        }
    }
}
```

### OccupiedEntry 操作

```rust
use std::collections::HashMap;
use std::collections::hash_map::Entry;

fn main() {
    let mut map = HashMap::new();
    map.insert("key", 10);

    if let Entry::Occupied(mut entry) = map.entry("key") {
        // 获取值的引用
        println!("当前值: {}", entry.get());

        // 获取值的可变引用
        *entry.get_mut() += 5;
        println!("修改后: {}", entry.get());

        // 获取键的引用
        println!("键: {}", entry.key());

        // 移除并返回值
        let value = entry.remove();
        println!("移除的值: {}", value);
    }

    println!("map: {:?}", map); // {}
}
```

### VacantEntry 操作

```rust
use std::collections::HashMap;
use std::collections::hash_map::Entry;

fn main() {
    let mut map: HashMap<String, Vec<i32>> = HashMap::new();

    if let Entry::Vacant(entry) = map.entry(String::from("new_key")) {
        // 获取键的引用
        println!("将要插入键: {}", entry.key());

        // 插入值并返回可变引用
        let value = entry.insert(vec![1, 2, 3]);
        value.push(4);
        println!("插入后的值: {:?}", value);
    }

    println!("map: {:?}", map);
}
```

### 实用 Entry 模式

```rust
use std::collections::HashMap;

fn main() {
    // 模式 1: 计数器
    let words = vec!["apple", "banana", "apple", "cherry", "banana", "apple"];
    let mut counts: HashMap<&str, i32> = HashMap::new();

    for word in &words {
        *counts.entry(word).or_insert(0) += 1;
    }
    println!("计数: {:?}", counts);

    // 模式 2: 分组
    let items = vec![("a", 1), ("b", 2), ("a", 3), ("b", 4), ("c", 5)];
    let mut groups: HashMap<&str, Vec<i32>> = HashMap::new();

    for (key, value) in items {
        groups.entry(key).or_default().push(value);
    }
    println!("分组: {:?}", groups);

    // 模式 3: 缓存/记忆化
    let mut cache: HashMap<u32, u64> = HashMap::new();

    fn fib_cached(n: u32, cache: &mut HashMap<u32, u64>) -> u64 {
        if n <= 1 {
            return n as u64;
        }

        if let Some(&result) = cache.get(&n) {
            return result;
        }

        let result = fib_cached(n - 1, cache) + fib_cached(n - 2, cache);
        cache.insert(n, result);
        result
    }

    println!("fib(50) = {}", fib_cached(50, &mut cache));

    // 模式 4: 更新或插入
    let mut scores: HashMap<&str, i32> = HashMap::new();
    scores.insert("Alice", 50);

    // 如果存在则增加 10,否则设为 10
    scores.entry("Alice")
        .and_modify(|v| *v += 10)
        .or_insert(10);

    scores.entry("Bob")
        .and_modify(|v| *v += 10)
        .or_insert(10);

    println!("分数: {:?}", scores); // {"Alice": 60, "Bob": 10}
}
```

## 实用示例

### 实现 LRU 缓存

```rust
use std::collections::HashMap;
use std::collections::VecDeque;

struct LRUCache<K, V> {
    capacity: usize,
    map: HashMap<K, V>,
    order: VecDeque<K>,
}

impl<K: Eq + std::hash::Hash + Clone, V> LRUCache<K, V> {
    fn new(capacity: usize) -> Self {
        LRUCache {
            capacity,
            map: HashMap::with_capacity(capacity),
            order: VecDeque::with_capacity(capacity),
        }
    }

    fn get(&mut self, key: &K) -> Option<&V> {
        if self.map.contains_key(key) {
            // 移动到最近使用
            self.order.retain(|k| k != key);
            self.order.push_back(key.clone());
            self.map.get(key)
        } else {
            None
        }
    }

    fn put(&mut self, key: K, value: V) {
        if self.map.contains_key(&key) {
            self.order.retain(|k| k != &key);
        } else if self.map.len() >= self.capacity {
            // 移除最久未使用的
            if let Some(old_key) = self.order.pop_front() {
                self.map.remove(&old_key);
            }
        }

        self.map.insert(key.clone(), value);
        self.order.push_back(key);
    }
}

fn main() {
    let mut cache = LRUCache::new(3);

    cache.put("a", 1);
    cache.put("b", 2);
    cache.put("c", 3);

    println!("获取 a: {:?}", cache.get(&"a")); // Some(1)

    cache.put("d", 4); // 这会移除 "b"

    println!("获取 b: {:?}", cache.get(&"b")); // None
    println!("获取 c: {:?}", cache.get(&"c")); // Some(3)
}
```

### 图的邻接表表示

```rust
use std::collections::{HashMap, HashSet, VecDeque};

struct Graph {
    adjacency: HashMap<String, HashSet<String>>,
}

impl Graph {
    fn new() -> Self {
        Graph {
            adjacency: HashMap::new(),
        }
    }

    fn add_edge(&mut self, from: &str, to: &str) {
        self.adjacency
            .entry(from.to_string())
            .or_default()
            .insert(to.to_string());

        // 无向图,添加反向边
        self.adjacency
            .entry(to.to_string())
            .or_default()
            .insert(from.to_string());
    }

    fn bfs(&self, start: &str) -> Vec<String> {
        let mut visited = HashSet::new();
        let mut queue = VecDeque::new();
        let mut result = Vec::new();

        queue.push_back(start.to_string());
        visited.insert(start.to_string());

        while let Some(node) = queue.pop_front() {
            result.push(node.clone());

            if let Some(neighbors) = self.adjacency.get(&node) {
                for neighbor in neighbors {
                    if !visited.contains(neighbor) {
                        visited.insert(neighbor.clone());
                        queue.push_back(neighbor.clone());
                    }
                }
            }
        }

        result
    }
}

fn main() {
    let mut graph = Graph::new();

    graph.add_edge("A", "B");
    graph.add_edge("A", "C");
    graph.add_edge("B", "D");
    graph.add_edge("C", "D");
    graph.add_edge("D", "E");

    let traversal = graph.bfs("A");
    println!("BFS 遍历: {:?}", traversal);
}
```

### 多值映射

```rust
use std::collections::HashMap;

struct MultiMap<K, V> {
    inner: HashMap<K, Vec<V>>,
}

impl<K: Eq + std::hash::Hash, V> MultiMap<K, V> {
    fn new() -> Self {
        MultiMap {
            inner: HashMap::new(),
        }
    }

    fn insert(&mut self, key: K, value: V) {
        self.inner.entry(key).or_default().push(value);
    }

    fn get(&self, key: &K) -> Option<&Vec<V>> {
        self.inner.get(key)
    }

    fn get_all(&self, key: &K) -> impl Iterator<Item = &V> {
        self.inner.get(key).into_iter().flatten()
    }

    fn remove_one(&mut self, key: &K) -> Option<V> {
        self.inner.get_mut(key)?.pop()
    }

    fn remove_all(&mut self, key: &K) -> Option<Vec<V>> {
        self.inner.remove(key)
    }
}

fn main() {
    let mut mmap = MultiMap::new();

    mmap.insert("fruit", "apple");
    mmap.insert("fruit", "banana");
    mmap.insert("fruit", "cherry");
    mmap.insert("vegetable", "carrot");

    println!("fruits: {:?}", mmap.get(&"fruit"));
    // Some(["apple", "banana", "cherry"])

    for fruit in mmap.get_all(&"fruit") {
        println!("  {}", fruit);
    }
}
```

## 集合选择指南

| 需求 | 推荐集合 | 原因 |
|------|----------|------|
| 有序序列,需要索引访问 | `Vec<T>` | O(1) 索引访问,尾部操作高效 |
| 键值存储,快速查找 | `HashMap<K, V>` | 平均 O(1) 查找 |
| 键值存储,需要有序遍历 | `BTreeMap<K, V>` | 有序,支持范围查询 |
| 去重,集合运算 | `HashSet<T>` | 平均 O(1) 查找 |
| 去重,需要有序遍历 | `BTreeSet<T>` | 有序,支持范围查询 |
| 双端队列,两端操作 | `VecDeque<T>` | 两端 O(1) 操作 |
| UTF-8 字符串 | `String` | 保证有效 UTF-8 |
| 队列 (FIFO) | `VecDeque<T>` | 前端弹出 O(1) |
| 栈 (LIFO) | `Vec<T>` | 尾部操作 O(1) |

## 性能特点

| 操作 | Vec | HashMap | BTreeMap | VecDeque |
|------|-----|---------|----------|----------|
| 索引访问 | O(1) | O(1)* | O(log n) | O(1) |
| 插入(尾部) | O(1)* | O(1)* | O(log n) | O(1)* |
| 插入(头部) | O(n) | - | - | O(1)* |
| 删除(尾部) | O(1) | - | - | O(1) |
| 删除(头部) | O(n) | - | - | O(1) |
| 查找 | O(n) | O(1)* | O(log n) | O(n) |
| 有序遍历 | O(n) | O(n log n)** | O(n) | O(n) |

*均摊时间复杂度
**需要先收集并排序

## 总结

Rust 的集合库提供了丰富且高效的数据结构:

1. **Vec**: 最常用的动态数组,适合大多数序列存储需求
2. **String**: UTF-8 字符串,与 `Vec<u8>` 紧密相关
3. **HashMap/HashSet**: 基于哈希的快速查找结构
4. **BTreeMap/BTreeSet**: 基于 B 树的有序结构,支持范围查询
5. **VecDeque**: 双端队列,适合队列和双端操作场景

选择正确的集合类型对程序性能至关重要。理解每种集合的特点和适用场景,能够帮助你编写更高效的 Rust 代码。Entry API 是处理集合操作的强大工具,掌握它可以让代码更简洁、更高效。
