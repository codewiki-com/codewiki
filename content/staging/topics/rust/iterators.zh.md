---
title: 迭代器
description: Rust迭代器完全指南，Iterator trait、适配器与消费者
track: rust
section: basics
difficulty: intermediate
tags:
  - Rust
  - 迭代器
  - Iterator
  - 函数式
status: imported
origin: old/src/content/docs/rust/iterators.zh.md
divergence: 0.203
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 核心概念
  order: 8
  lastUpdated: 2026-01-07
---

迭代器是 Rust 中处理序列数据的核心抽象。它提供了一种优雅、高效且安全的方式来遍历集合中的元素。Rust 的迭代器是**惰性求值**的,这意味着在实际消费之前不会执行任何计算,从而实现了零成本抽象。

## Iterator Trait

Rust 中所有迭代器都实现了标准库中定义的 `Iterator` trait。这个 trait 的核心定义如下:

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;

    // 还有许多提供默认实现的方法...
}
```

### 核心概念

- **Item**: 关联类型,表示迭代器产生的元素类型
- **next()**: 唯一需要实现的方法,每次调用返回序列中的下一个元素
- **Option**: 返回 `Some(item)` 表示有元素,`None` 表示迭代结束

### 基本使用示例

```rust
fn main() {
    let v = vec![1, 2, 3];

    // 创建迭代器
    let mut iter = v.iter();

    // 手动调用 next()
    assert_eq!(iter.next(), Some(&1));
    assert_eq!(iter.next(), Some(&2));
    assert_eq!(iter.next(), Some(&3));
    assert_eq!(iter.next(), None);
}
```

### 三种迭代方式

Rust 提供了三种不同的迭代方式,对应不同的所有权语义:

```rust
fn main() {
    let v = vec![String::from("a"), String::from("b"), String::from("c")];

    // 1. iter() - 不可变借用,产生 &T
    for item in v.iter() {
        println!("借用: {}", item);
    }
    // v 仍然有效

    // 2. iter_mut() - 可变借用,产生 &mut T
    let mut v2 = vec![1, 2, 3];
    for item in v2.iter_mut() {
        *item *= 2;
    }
    println!("修改后: {:?}", v2); // [2, 4, 6]

    // 3. into_iter() - 获取所有权,产生 T
    for item in v.into_iter() {
        println!("拥有: {}", item);
    }
    // v 不再有效,所有权已转移
}
```

### for 循环与迭代器

`for` 循环在底层使用 `IntoIterator` trait:

```rust
fn main() {
    let v = vec![1, 2, 3];

    // 这两种写法等价
    for x in &v {
        println!("{}", x);
    }

    for x in v.iter() {
        println!("{}", x);
    }
}
```

## 迭代器适配器

适配器是接收一个迭代器并返回另一个迭代器的方法。它们是惰性的,只有在消费时才会执行。

### map - 转换元素

`map` 对每个元素应用一个闭包,产生新的值:

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // 将每个元素平方
    let squared: Vec<i32> = v.iter()
        .map(|x| x * x)
        .collect();

    println!("{:?}", squared); // [1, 4, 9, 16, 25]

    // 类型转换
    let numbers = vec![1, 2, 3];
    let strings: Vec<String> = numbers.iter()
        .map(|n| n.to_string())
        .collect();

    println!("{:?}", strings); // ["1", "2", "3"]
}
```

### filter - 过滤元素

`filter` 只保留满足条件的元素:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // 保留偶数
    let evens: Vec<&i32> = numbers.iter()
        .filter(|x| *x % 2 == 0)
        .collect();

    println!("{:?}", evens); // [2, 4, 6, 8, 10]

    // 结合 map 和 filter
    let result: Vec<i32> = numbers.iter()
        .filter(|x| *x % 2 == 0)  // 过滤偶数
        .map(|x| x * x)           // 平方
        .collect();

    println!("{:?}", result); // [4, 16, 36, 64, 100]
}
```

### filter_map - 过滤并转换

`filter_map` 结合了 `filter` 和 `map` 的功能,处理返回 `Option` 的转换:

```rust
fn main() {
    let strings = vec!["1", "two", "3", "four", "5"];

    // 只保留能解析为数字的字符串
    let numbers: Vec<i32> = strings.iter()
        .filter_map(|s| s.parse::<i32>().ok())
        .collect();

    println!("{:?}", numbers); // [1, 3, 5]
}
```

### take 和 skip - 控制数量

```rust
fn main() {
    let numbers: Vec<i32> = (1..=100).collect();

    // take: 只取前 5 个元素
    let first_five: Vec<&i32> = numbers.iter().take(5).collect();
    println!("{:?}", first_five); // [1, 2, 3, 4, 5]

    // skip: 跳过前 95 个元素
    let last_five: Vec<&i32> = numbers.iter().skip(95).collect();
    println!("{:?}", last_five); // [96, 97, 98, 99, 100]

    // 组合使用:跳过前 2 个,取接下来的 3 个
    let middle: Vec<&i32> = numbers.iter().skip(2).take(3).collect();
    println!("{:?}", middle); // [3, 4, 5]
}
```

### take_while 和 skip_while - 条件控制

```rust
fn main() {
    let numbers = vec![1, 2, 3, 10, 4, 5];

    // take_while: 取元素直到条件不满足
    let small: Vec<&i32> = numbers.iter()
        .take_while(|x| **x < 10)
        .collect();
    println!("{:?}", small); // [1, 2, 3]

    // skip_while: 跳过元素直到条件不满足
    let rest: Vec<&i32> = numbers.iter()
        .skip_while(|x| **x < 10)
        .collect();
    println!("{:?}", rest); // [10, 4, 5]
}
```

### enumerate - 添加索引

```rust
fn main() {
    let fruits = vec!["apple", "banana", "cherry"];

    for (index, fruit) in fruits.iter().enumerate() {
        println!("{}: {}", index, fruit);
    }
    // 输出:
    // 0: apple
    // 1: banana
    // 2: cherry

    // 查找元素位置
    let position = fruits.iter()
        .enumerate()
        .find(|(_, &f)| f == "banana")
        .map(|(i, _)| i);

    println!("banana 的位置: {:?}", position); // Some(1)
}
```

### zip - 合并迭代器

```rust
fn main() {
    let names = vec!["Alice", "Bob", "Charlie"];
    let ages = vec![25, 30, 35];

    // 合并两个迭代器
    let people: Vec<(&str, i32)> = names.iter()
        .copied()
        .zip(ages.iter().copied())
        .collect();

    println!("{:?}", people);
    // [("Alice", 25), ("Bob", 30), ("Charlie", 35)]

    // 实用场景:并行处理两个集合
    for (name, age) in names.iter().zip(ages.iter()) {
        println!("{} 今年 {} 岁", name, age);
    }
}
```

### chain - 连接迭代器

```rust
fn main() {
    let a = vec![1, 2, 3];
    let b = vec![4, 5, 6];

    // 连接两个迭代器
    let combined: Vec<&i32> = a.iter().chain(b.iter()).collect();
    println!("{:?}", combined); // [1, 2, 3, 4, 5, 6]

    // 连接多个迭代器
    let c = vec![7, 8, 9];
    let all: Vec<&i32> = a.iter()
        .chain(b.iter())
        .chain(c.iter())
        .collect();
    println!("{:?}", all); // [1, 2, 3, 4, 5, 6, 7, 8, 9]
}
```

### flatten - 展平嵌套结构

```rust
fn main() {
    let nested = vec![vec![1, 2], vec![3, 4], vec![5, 6]];

    // 展平嵌套向量
    let flat: Vec<&i32> = nested.iter()
        .flatten()
        .collect();
    println!("{:?}", flat); // [1, 2, 3, 4, 5, 6]

    // 展平 Option
    let options = vec![Some(1), None, Some(3), None, Some(5)];
    let values: Vec<i32> = options.into_iter()
        .flatten()
        .collect();
    println!("{:?}", values); // [1, 3, 5]
}
```

### flat_map - 映射并展平

```rust
fn main() {
    let words = vec!["hello", "world"];

    // 将每个字符串转换为字符迭代器,然后展平
    let chars: Vec<char> = words.iter()
        .flat_map(|s| s.chars())
        .collect();
    println!("{:?}", chars);
    // ['h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd']

    // 实用场景:一对多映射
    let numbers = vec![1, 2, 3];
    let expanded: Vec<i32> = numbers.iter()
        .flat_map(|&n| vec![n, n * 10, n * 100])
        .collect();
    println!("{:?}", expanded);
    // [1, 10, 100, 2, 20, 200, 3, 30, 300]
}
```

### peekable - 预览下一个元素

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let mut iter = numbers.iter().peekable();

    while let Some(&current) = iter.next() {
        // 预览下一个元素但不消费它
        if let Some(&&next) = iter.peek() {
            println!("当前: {}, 下一个: {}", current, next);
        } else {
            println!("当前: {}, 这是最后一个", current);
        }
    }
}
```

### rev - 反向迭代

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 反向遍历
    let reversed: Vec<&i32> = numbers.iter().rev().collect();
    println!("{:?}", reversed); // [5, 4, 3, 2, 1]

    // 注意:只有实现了 DoubleEndedIterator 的迭代器才能使用 rev
}
```

### cloned 和 copied - 复制元素

```rust
fn main() {
    let numbers = vec![1, 2, 3];

    // copied: 用于 Copy 类型,从 &T 得到 T
    let owned: Vec<i32> = numbers.iter().copied().collect();
    println!("{:?}", owned); // [1, 2, 3]

    // cloned: 用于 Clone 类型
    let strings = vec![String::from("a"), String::from("b")];
    let cloned: Vec<String> = strings.iter().cloned().collect();
    println!("{:?}", cloned); // ["a", "b"]
}
```

### inspect - 调试迭代过程

```rust
fn main() {
    let result: Vec<i32> = (1..=5)
        .inspect(|x| println!("开始处理: {}", x))
        .map(|x| x * 2)
        .inspect(|x| println!("乘以 2 后: {}", x))
        .filter(|x| x > &5)
        .inspect(|x| println!("通过过滤: {}", x))
        .collect();

    println!("最终结果: {:?}", result);
}
```

## 消费者(Consumers)

消费者是消耗迭代器并产生最终结果的方法。调用消费者会触发迭代器链的实际执行。

### collect - 收集到集合

`collect` 是最常用的消费者,可以将迭代器转换为多种集合类型:

```rust
use std::collections::{HashMap, HashSet, BTreeMap};

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 收集为 Vec
    let vec: Vec<i32> = numbers.iter().copied().collect();

    // 收集为 HashSet
    let set: HashSet<i32> = numbers.iter().copied().collect();

    // 收集为 String
    let chars = vec!['h', 'e', 'l', 'l', 'o'];
    let string: String = chars.iter().collect();
    println!("{}", string); // "hello"

    // 收集为 HashMap
    let pairs = vec![("a", 1), ("b", 2), ("c", 3)];
    let map: HashMap<&str, i32> = pairs.into_iter().collect();
    println!("{:?}", map);

    // 收集 Result 序列
    let results: Vec<Result<i32, &str>> = vec![Ok(1), Ok(2), Ok(3)];
    let collected: Result<Vec<i32>, &str> = results.into_iter().collect();
    println!("{:?}", collected); // Ok([1, 2, 3])

    // 如果有一个 Err,整个结果是 Err
    let with_error: Vec<Result<i32, &str>> = vec![Ok(1), Err("错误"), Ok(3)];
    let collected: Result<Vec<i32>, &str> = with_error.into_iter().collect();
    println!("{:?}", collected); // Err("错误")
}
```

### fold - 折叠/归约

`fold` 是最强大的消费者之一,可以实现几乎所有其他消费者的功能:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 求和
    let sum = numbers.iter().fold(0, |acc, x| acc + x);
    println!("和: {}", sum); // 15

    // 求积
    let product = numbers.iter().fold(1, |acc, x| acc * x);
    println!("积: {}", product); // 120

    // 构建字符串
    let words = vec!["Hello", "World", "Rust"];
    let sentence = words.iter().fold(String::new(), |mut acc, word| {
        if !acc.is_empty() {
            acc.push(' ');
        }
        acc.push_str(word);
        acc
    });
    println!("{}", sentence); // "Hello World Rust"

    // 找最大值(fold 实现)
    let max = numbers.iter().fold(i32::MIN, |acc, &x| {
        if x > acc { x } else { acc }
    });
    println!("最大值: {}", max); // 5
}
```

### reduce - 简化版折叠

`reduce` 使用第一个元素作为初始值:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 求和
    let sum = numbers.iter().copied().reduce(|acc, x| acc + x);
    println!("{:?}", sum); // Some(15)

    // 空迭代器返回 None
    let empty: Vec<i32> = vec![];
    let result = empty.iter().copied().reduce(|acc, x| acc + x);
    println!("{:?}", result); // None

    // 找最大值
    let max = numbers.iter().copied().reduce(|a, b| a.max(b));
    println!("{:?}", max); // Some(5)
}
```

### sum 和 product

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 求和
    let sum: i32 = numbers.iter().sum();
    println!("和: {}", sum); // 15

    // 求积
    let product: i32 = numbers.iter().product();
    println!("积: {}", product); // 120

    // 浮点数求和
    let floats = vec![1.5, 2.5, 3.0];
    let sum: f64 = floats.iter().sum();
    println!("浮点和: {}", sum); // 7.0
}
```

### count 和 last

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 计数
    let count = numbers.iter().count();
    println!("元素个数: {}", count); // 5

    // 条件计数
    let even_count = numbers.iter().filter(|x| *x % 2 == 0).count();
    println!("偶数个数: {}", even_count); // 2

    // 获取最后一个元素
    let last = numbers.iter().last();
    println!("最后一个: {:?}", last); // Some(5)
}
```

### find 和 position

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6];

    // find: 找到第一个满足条件的元素
    let first_even = numbers.iter().find(|x| *x % 2 == 0);
    println!("第一个偶数: {:?}", first_even); // Some(2)

    // find_map: find + map 结合
    let strings = vec!["1", "two", "3"];
    let first_number = strings.iter()
        .find_map(|s| s.parse::<i32>().ok());
    println!("第一个数字: {:?}", first_number); // Some(1)

    // position: 找到元素的索引
    let pos = numbers.iter().position(|x| *x == 4);
    println!("4 的位置: {:?}", pos); // Some(3)

    // rposition: 从后往前找
    let numbers2 = vec![1, 2, 3, 2, 1];
    let last_pos = numbers2.iter().rposition(|x| *x == 2);
    println!("最后一个 2 的位置: {:?}", last_pos); // Some(3)
}
```

### any 和 all

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // any: 是否存在满足条件的元素
    let has_even = numbers.iter().any(|x| x % 2 == 0);
    println!("存在偶数: {}", has_even); // true

    // all: 是否所有元素都满足条件
    let all_positive = numbers.iter().all(|x| *x > 0);
    println!("全部为正: {}", all_positive); // true

    let all_even = numbers.iter().all(|x| x % 2 == 0);
    println!("全部为偶: {}", all_even); // false
}
```

### max, min 和相关方法

```rust
fn main() {
    let numbers = vec![3, 1, 4, 1, 5, 9, 2, 6];

    // 最大值和最小值
    let max = numbers.iter().max();
    let min = numbers.iter().min();
    println!("最大: {:?}, 最小: {:?}", max, min); // Some(9), Some(1)

    // max_by 和 min_by: 自定义比较
    let people = vec![
        ("Alice", 25),
        ("Bob", 30),
        ("Charlie", 20),
    ];

    let oldest = people.iter().max_by(|a, b| a.1.cmp(&b.1));
    println!("年龄最大: {:?}", oldest); // Some(("Bob", 30))

    // max_by_key 和 min_by_key: 按键比较
    let youngest = people.iter().min_by_key(|p| p.1);
    println!("年龄最小: {:?}", youngest); // Some(("Charlie", 20))

    // 按字符串长度找最长
    let words = vec!["apple", "pie", "extraordinary"];
    let longest = words.iter().max_by_key(|s| s.len());
    println!("最长的单词: {:?}", longest); // Some("extraordinary")
}
```

### nth - 获取第 n 个元素

```rust
fn main() {
    let numbers = vec![10, 20, 30, 40, 50];

    let mut iter = numbers.iter();

    // 获取第 2 个元素(0-indexed)
    let second = iter.nth(1);
    println!("第 2 个: {:?}", second); // Some(20)

    // 注意:nth 会消耗之前的元素
    let next = iter.nth(1); // 现在从 30 开始数,跳过 30,得到 40
    println!("下一个: {:?}", next); // Some(40)
}
```

### for_each - 对每个元素执行操作

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // for_each 比 for 循环更函数式
    numbers.iter().for_each(|x| println!("{}", x));

    // 可以在链式调用中使用
    numbers.iter()
        .map(|x| x * 2)
        .filter(|x| x > &5)
        .for_each(|x| println!("处理: {}", x));
}
```

### partition - 分割迭代器

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // 分成偶数和奇数
    let (evens, odds): (Vec<i32>, Vec<i32>) = numbers.iter()
        .copied()
        .partition(|x| x % 2 == 0);

    println!("偶数: {:?}", evens); // [2, 4, 6, 8, 10]
    println!("奇数: {:?}", odds);  // [1, 3, 5, 7, 9]
}
```

### unzip - 拆分元组迭代器

```rust
fn main() {
    let pairs = vec![(1, 'a'), (2, 'b'), (3, 'c')];

    let (numbers, letters): (Vec<i32>, Vec<char>) = pairs.into_iter().unzip();

    println!("数字: {:?}", numbers); // [1, 2, 3]
    println!("字母: {:?}", letters); // ['a', 'b', 'c']
}
```

## 惰性求值

迭代器适配器是惰性的,这意味着在调用消费者之前不会执行任何操作:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 这行代码不会打印任何内容!
    let _lazy = numbers.iter()
        .map(|x| {
            println!("处理 {}", x);
            x * 2
        });

    println!("还没有执行任何操作...");

    // 调用 collect() 触发执行
    let result: Vec<i32> = numbers.iter()
        .map(|x| {
            println!("处理 {}", x);
            x * 2
        })
        .collect();

    println!("结果: {:?}", result);
}
```

### 惰性求值的优势

```rust
fn main() {
    // 只计算需要的元素
    let first_large = (1..)
        .map(|x| {
            println!("计算 {} 的平方", x);
            x * x
        })
        .find(|&x| x > 100);

    println!("第一个大于 100 的平方数: {:?}", first_large);
    // 只会打印 1 到 11 的计算过程

    // 无限迭代器
    let first_10_squares: Vec<i32> = (1..)
        .map(|x| x * x)
        .take(10)
        .collect();

    println!("{:?}", first_10_squares);
    // [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
}
```

## 自定义迭代器

### 实现 Iterator Trait

创建自定义迭代器需要实现 `Iterator` trait:

```rust
struct Counter {
    current: u32,
    max: u32,
}

impl Counter {
    fn new(max: u32) -> Counter {
        Counter { current: 0, max }
    }
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.current < self.max {
            self.current += 1;
            Some(self.current)
        } else {
            None
        }
    }
}

fn main() {
    let counter = Counter::new(5);

    for num in counter {
        println!("{}", num);
    }
    // 输出: 1, 2, 3, 4, 5

    // 使用迭代器方法
    let sum: u32 = Counter::new(5).sum();
    println!("和: {}", sum); // 15

    // 链式操作
    let result: Vec<u32> = Counter::new(10)
        .filter(|x| x % 2 == 0)
        .map(|x| x * x)
        .collect();

    println!("{:?}", result); // [4, 16, 36, 64, 100]
}
```

### 斐波那契数列迭代器

```rust
struct Fibonacci {
    current: u64,
    next: u64,
}

impl Fibonacci {
    fn new() -> Fibonacci {
        Fibonacci { current: 0, next: 1 }
    }
}

impl Iterator for Fibonacci {
    type Item = u64;

    fn next(&mut self) -> Option<Self::Item> {
        let current = self.current;
        self.current = self.next;
        self.next = current.checked_add(self.next)?;
        Some(current)
    }
}

fn main() {
    // 前 10 个斐波那契数
    let fibs: Vec<u64> = Fibonacci::new().take(10).collect();
    println!("{:?}", fibs);
    // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

    // 第一个大于 1000 的斐波那契数
    let large = Fibonacci::new().find(|&x| x > 1000);
    println!("{:?}", large); // Some(1597)
}
```

### 范围迭代器

```rust
struct Range {
    start: i32,
    end: i32,
    step: i32,
}

impl Range {
    fn new(start: i32, end: i32, step: i32) -> Range {
        Range { start, end, step }
    }
}

impl Iterator for Range {
    type Item = i32;

    fn next(&mut self) -> Option<Self::Item> {
        if (self.step > 0 && self.start < self.end) ||
           (self.step < 0 && self.start > self.end) {
            let current = self.start;
            self.start += self.step;
            Some(current)
        } else {
            None
        }
    }
}

fn main() {
    // 正向步进
    let forward: Vec<i32> = Range::new(0, 10, 2).collect();
    println!("{:?}", forward); // [0, 2, 4, 6, 8]

    // 反向步进
    let backward: Vec<i32> = Range::new(10, 0, -2).collect();
    println!("{:?}", backward); // [10, 8, 6, 4, 2]
}
```

### 实现 DoubleEndedIterator

```rust
struct CounterBidirectional {
    front: u32,
    back: u32,
}

impl CounterBidirectional {
    fn new(max: u32) -> Self {
        CounterBidirectional { front: 1, back: max }
    }
}

impl Iterator for CounterBidirectional {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.front <= self.back {
            let current = self.front;
            self.front += 1;
            Some(current)
        } else {
            None
        }
    }
}

impl DoubleEndedIterator for CounterBidirectional {
    fn next_back(&mut self) -> Option<Self::Item> {
        if self.front <= self.back {
            let current = self.back;
            self.back -= 1;
            Some(current)
        } else {
            None
        }
    }
}

fn main() {
    // 正向迭代
    let forward: Vec<u32> = CounterBidirectional::new(5).collect();
    println!("{:?}", forward); // [1, 2, 3, 4, 5]

    // 反向迭代
    let backward: Vec<u32> = CounterBidirectional::new(5).rev().collect();
    println!("{:?}", backward); // [5, 4, 3, 2, 1]

    // 两端同时迭代
    let mut iter = CounterBidirectional::new(6);
    assert_eq!(iter.next(), Some(1));
    assert_eq!(iter.next_back(), Some(6));
    assert_eq!(iter.next(), Some(2));
    assert_eq!(iter.next_back(), Some(5));
}
```

## IntoIterator Trait

`IntoIterator` trait 允许类型被转换为迭代器,这是 `for` 循环工作的基础:

```rust
struct Color {
    r: u8,
    g: u8,
    b: u8,
}

impl IntoIterator for Color {
    type Item = u8;
    type IntoIter = std::array::IntoIter<u8, 3>;

    fn into_iter(self) -> Self::IntoIter {
        [self.r, self.g, self.b].into_iter()
    }
}

fn main() {
    let color = Color { r: 255, g: 128, b: 64 };

    // 可以直接在 for 循环中使用
    for component in color {
        println!("{}", component);
    }
}
```

### 为引用实现 IntoIterator

```rust
struct Matrix {
    data: Vec<Vec<i32>>,
}

impl Matrix {
    fn new(data: Vec<Vec<i32>>) -> Self {
        Matrix { data }
    }
}

// 为不可变引用实现
impl<'a> IntoIterator for &'a Matrix {
    type Item = &'a Vec<i32>;
    type IntoIter = std::slice::Iter<'a, Vec<i32>>;

    fn into_iter(self) -> Self::IntoIter {
        self.data.iter()
    }
}

fn main() {
    let matrix = Matrix::new(vec![
        vec![1, 2, 3],
        vec![4, 5, 6],
        vec![7, 8, 9],
    ]);

    // 借用矩阵并迭代行
    for row in &matrix {
        println!("{:?}", row);
    }

    // matrix 仍然有效
    println!("矩阵行数: {}", matrix.data.len());
}
```

## 实用示例

### 文本处理

```rust
fn main() {
    let text = "Hello, World! Welcome to Rust programming.";

    // 单词计数
    let word_count = text.split_whitespace().count();
    println!("单词数: {}", word_count);

    // 最长单词
    let longest_word = text
        .split_whitespace()
        .map(|s| s.trim_matches(|c: char| !c.is_alphabetic()))
        .max_by_key(|s| s.len());
    println!("最长单词: {:?}", longest_word);

    // 单词频率统计
    use std::collections::HashMap;
    let mut freq: HashMap<&str, usize> = HashMap::new();

    for word in text.split_whitespace() {
        let word = word.trim_matches(|c: char| !c.is_alphabetic()).to_lowercase();
        // 简化处理,这里用原始 word
        *freq.entry(word.leak()).or_insert(0) += 1;
    }

    // 按频率排序
    let mut sorted: Vec<_> = freq.iter().collect();
    sorted.sort_by(|a, b| b.1.cmp(a.1));

    for (word, count) in sorted.iter().take(5) {
        println!("{}: {}", word, count);
    }
}
```

### 数据处理管道

```rust
#[derive(Debug, Clone)]
struct User {
    name: String,
    age: u32,
    active: bool,
}

fn main() {
    let users = vec![
        User { name: "Alice".to_string(), age: 28, active: true },
        User { name: "Bob".to_string(), age: 35, active: false },
        User { name: "Charlie".to_string(), age: 22, active: true },
        User { name: "Diana".to_string(), age: 31, active: true },
        User { name: "Eve".to_string(), age: 19, active: false },
    ];

    // 找出所有活跃用户的名字,按年龄排序
    let mut active_users: Vec<&User> = users.iter()
        .filter(|u| u.active)
        .collect();

    active_users.sort_by_key(|u| u.age);

    let names: Vec<&str> = active_users.iter()
        .map(|u| u.name.as_str())
        .collect();

    println!("活跃用户(按年龄): {:?}", names);
    // ["Charlie", "Alice", "Diana"]

    // 计算活跃用户的平均年龄
    let (sum, count) = users.iter()
        .filter(|u| u.active)
        .fold((0u32, 0u32), |(sum, count), user| {
            (sum + user.age, count + 1)
        });

    let avg_age = sum as f64 / count as f64;
    println!("活跃用户平均年龄: {:.1}", avg_age);
}
```

### 错误处理与迭代器

```rust
fn parse_numbers(input: &str) -> Result<Vec<i32>, std::num::ParseIntError> {
    input
        .split(',')
        .map(|s| s.trim().parse::<i32>())
        .collect()
}

fn main() {
    // 成功情况
    let result = parse_numbers("1, 2, 3, 4, 5");
    println!("{:?}", result); // Ok([1, 2, 3, 4, 5])

    // 失败情况
    let result = parse_numbers("1, 2, three, 4");
    println!("{:?}", result); // Err(ParseIntError { kind: InvalidDigit })

    // 忽略解析错误
    let numbers: Vec<i32> = "1, 2, three, 4, 5"
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();
    println!("{:?}", numbers); // [1, 2, 4, 5]
}
```

### 并行迭代器(使用 rayon)

```rust
// 注意:需要添加 rayon 依赖
// use rayon::prelude::*;

fn main() {
    let numbers: Vec<i64> = (1..=1_000_000).collect();

    // 顺序处理
    let sum: i64 = numbers.iter().sum();
    println!("顺序求和: {}", sum);

    // 并行处理(使用 rayon)
    // let parallel_sum: i64 = numbers.par_iter().sum();
    // println!("并行求和: {}", parallel_sum);

    // 并行 map-reduce
    // let result: i64 = numbers.par_iter()
    //     .map(|x| x * x)
    //     .filter(|x| x % 2 == 0)
    //     .sum();
}
```

## 性能考虑

### 迭代器 vs 循环

Rust 的迭代器通常与手写循环一样快,有时甚至更快:

```rust
fn main() {
    let numbers: Vec<i32> = (1..=1000).collect();

    // 迭代器方式
    let sum1: i32 = numbers.iter().sum();

    // 循环方式
    let mut sum2 = 0;
    for n in &numbers {
        sum2 += n;
    }

    assert_eq!(sum1, sum2);
    // 两种方式编译后的代码几乎相同
}
```

### 避免不必要的分配

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 不好:创建中间 Vec
    let result: i32 = numbers.iter()
        .map(|x| x * 2)
        .collect::<Vec<i32>>() // 不必要的分配
        .iter()
        .sum();

    // 好:直接链式调用
    let result: i32 = numbers.iter()
        .map(|x| x * 2)
        .sum();

    println!("{}", result);
}
```

### 使用 size_hint

自定义迭代器可以实现 `size_hint` 来优化内存分配:

```rust
struct Counter {
    current: usize,
    max: usize,
}

impl Counter {
    fn new(max: usize) -> Self {
        Counter { current: 0, max }
    }
}

impl Iterator for Counter {
    type Item = usize;

    fn next(&mut self) -> Option<Self::Item> {
        if self.current < self.max {
            self.current += 1;
            Some(self.current)
        } else {
            None
        }
    }

    // 提供大小提示,帮助 collect 预分配内存
    fn size_hint(&self) -> (usize, Option<usize>) {
        let remaining = self.max - self.current;
        (remaining, Some(remaining))
    }
}

fn main() {
    // collect 会使用 size_hint 预分配空间
    let numbers: Vec<usize> = Counter::new(1000).collect();
    println!("收集了 {} 个元素", numbers.len());
}
```

## 总结

Rust 的迭代器系统是该语言最强大的特性之一:

1. **零成本抽象**:迭代器链在编译后与手写循环一样高效
2. **惰性求值**:只有在需要时才计算,避免不必要的工作
3. **函数式编程**:支持 map、filter、fold 等函数式操作
4. **类型安全**:编译时检查确保类型正确
5. **可组合性**:适配器可以任意组合,形成复杂的数据处理管道
6. **自定义扩展**:通过实现 `Iterator` trait 创建自己的迭代器

掌握迭代器是编写地道 Rust 代码的关键。它们不仅使代码更简洁、更易读,还能帮助你充分利用 Rust 的性能优势。

常用模式速查:

| 操作 | 方法 |
|------|------|
| 转换元素 | `map` |
| 过滤元素 | `filter` |
| 过滤并转换 | `filter_map` |
| 展平嵌套 | `flatten`, `flat_map` |
| 取前 N 个 | `take` |
| 跳过前 N 个 | `skip` |
| 添加索引 | `enumerate` |
| 合并迭代器 | `zip`, `chain` |
| 求和 | `sum` |
| 求积 | `product` |
| 折叠 | `fold`, `reduce` |
| 收集 | `collect` |
| 查找 | `find`, `position` |
| 检查条件 | `any`, `all` |
| 极值 | `max`, `min` |
