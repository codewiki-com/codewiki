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
origin: old/src/content/docs/rust/iterators.en.md
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

Iterators are the core abstraction for processing sequential data in Rust. They provide an elegant, efficient, and safe way to traverse elements in collections. Rust iterators are **lazily evaluated**, meaning no computation is performed until the iterator is actually consumed, achieving zero-cost abstraction.

## Iterator Trait

All iterators in Rust implement the `Iterator` trait defined in the standard library. The core definition of this trait is as follows:

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;

    // Plus many methods with default implementations...
}
```

### Core Concepts

- **Item**: An associated type representing the type of elements produced by the iterator
- **next()**: The only method that must be implemented, returns the next element in the sequence each time it's called
- **Option**: Returns `Some(item)` when there's an element, `None` when iteration is complete

### Basic Usage Example

```rust
fn main() {
    let v = vec![1, 2, 3];

    // Create an iterator
    let mut iter = v.iter();

    // Manually call next()
    assert_eq!(iter.next(), Some(&1));
    assert_eq!(iter.next(), Some(&2));
    assert_eq!(iter.next(), Some(&3));
    assert_eq!(iter.next(), None);
}
```

### Three Ways to Iterate

Rust provides three different iteration methods, corresponding to different ownership semantics:

```rust
fn main() {
    let v = vec![String::from("a"), String::from("b"), String::from("c")];

    // 1. iter() - immutable borrow, produces &T
    for item in v.iter() {
        println!("Borrowed: {}", item);
    }
    // v is still valid

    // 2. iter_mut() - mutable borrow, produces &mut T
    let mut v2 = vec![1, 2, 3];
    for item in v2.iter_mut() {
        *item *= 2;
    }
    println!("After modification: {:?}", v2); // [2, 4, 6]

    // 3. into_iter() - takes ownership, produces T
    for item in v.into_iter() {
        println!("Owned: {}", item);
    }
    // v is no longer valid, ownership has been transferred
}
```

### for Loops and Iterators

The `for` loop uses the `IntoIterator` trait under the hood:

```rust
fn main() {
    let v = vec![1, 2, 3];

    // These two forms are equivalent
    for x in &v {
        println!("{}", x);
    }

    for x in v.iter() {
        println!("{}", x);
    }
}
```

## Iterator Adapters

Adapters are methods that take an iterator and return another iterator. They are lazy and only execute when consumed.

### map - Transform Elements

`map` applies a closure to each element, producing new values:

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // Square each element
    let squared: Vec<i32> = v.iter()
        .map(|x| x * x)
        .collect();

    println!("{:?}", squared); // [1, 4, 9, 16, 25]

    // Type conversion
    let numbers = vec![1, 2, 3];
    let strings: Vec<String> = numbers.iter()
        .map(|n| n.to_string())
        .collect();

    println!("{:?}", strings); // ["1", "2", "3"]
}
```

### filter - Filter Elements

`filter` keeps only elements that satisfy a condition:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Keep only even numbers
    let evens: Vec<&i32> = numbers.iter()
        .filter(|x| *x % 2 == 0)
        .collect();

    println!("{:?}", evens); // [2, 4, 6, 8, 10]

    // Combining map and filter
    let result: Vec<i32> = numbers.iter()
        .filter(|x| *x % 2 == 0)  // Filter even numbers
        .map(|x| x * x)           // Square them
        .collect();

    println!("{:?}", result); // [4, 16, 36, 64, 100]
}
```

### filter_map - Filter and Transform

`filter_map` combines the functionality of `filter` and `map`, handling transformations that return `Option`:

```rust
fn main() {
    let strings = vec!["1", "two", "3", "four", "5"];

    // Keep only strings that can be parsed as numbers
    let numbers: Vec<i32> = strings.iter()
        .filter_map(|s| s.parse::<i32>().ok())
        .collect();

    println!("{:?}", numbers); // [1, 3, 5]
}
```

### take and skip - Control Quantity

```rust
fn main() {
    let numbers: Vec<i32> = (1..=100).collect();

    // take: Only take the first 5 elements
    let first_five: Vec<&i32> = numbers.iter().take(5).collect();
    println!("{:?}", first_five); // [1, 2, 3, 4, 5]

    // skip: Skip the first 95 elements
    let last_five: Vec<&i32> = numbers.iter().skip(95).collect();
    println!("{:?}", last_five); // [96, 97, 98, 99, 100]

    // Combined: Skip first 2, take the next 3
    let middle: Vec<&i32> = numbers.iter().skip(2).take(3).collect();
    println!("{:?}", middle); // [3, 4, 5]
}
```

### take_while and skip_while - Conditional Control

```rust
fn main() {
    let numbers = vec![1, 2, 3, 10, 4, 5];

    // take_while: Take elements until condition is not satisfied
    let small: Vec<&i32> = numbers.iter()
        .take_while(|x| **x < 10)
        .collect();
    println!("{:?}", small); // [1, 2, 3]

    // skip_while: Skip elements until condition is not satisfied
    let rest: Vec<&i32> = numbers.iter()
        .skip_while(|x| **x < 10)
        .collect();
    println!("{:?}", rest); // [10, 4, 5]
}
```

### enumerate - Add Indices

```rust
fn main() {
    let fruits = vec!["apple", "banana", "cherry"];

    for (index, fruit) in fruits.iter().enumerate() {
        println!("{}: {}", index, fruit);
    }
    // Output:
    // 0: apple
    // 1: banana
    // 2: cherry

    // Find element position
    let position = fruits.iter()
        .enumerate()
        .find(|(_, &f)| f == "banana")
        .map(|(i, _)| i);

    println!("Position of banana: {:?}", position); // Some(1)
}
```

### zip - Combine Iterators

```rust
fn main() {
    let names = vec!["Alice", "Bob", "Charlie"];
    let ages = vec![25, 30, 35];

    // Combine two iterators
    let people: Vec<(&str, i32)> = names.iter()
        .copied()
        .zip(ages.iter().copied())
        .collect();

    println!("{:?}", people);
    // [("Alice", 25), ("Bob", 30), ("Charlie", 35)]

    // Practical scenario: Process two collections in parallel
    for (name, age) in names.iter().zip(ages.iter()) {
        println!("{} is {} years old", name, age);
    }
}
```

### chain - Concatenate Iterators

```rust
fn main() {
    let a = vec![1, 2, 3];
    let b = vec![4, 5, 6];

    // Concatenate two iterators
    let combined: Vec<&i32> = a.iter().chain(b.iter()).collect();
    println!("{:?}", combined); // [1, 2, 3, 4, 5, 6]

    // Concatenate multiple iterators
    let c = vec![7, 8, 9];
    let all: Vec<&i32> = a.iter()
        .chain(b.iter())
        .chain(c.iter())
        .collect();
    println!("{:?}", all); // [1, 2, 3, 4, 5, 6, 7, 8, 9]
}
```

### flatten - Flatten Nested Structures

```rust
fn main() {
    let nested = vec![vec![1, 2], vec![3, 4], vec![5, 6]];

    // Flatten nested vectors
    let flat: Vec<&i32> = nested.iter()
        .flatten()
        .collect();
    println!("{:?}", flat); // [1, 2, 3, 4, 5, 6]

    // Flatten Options
    let options = vec![Some(1), None, Some(3), None, Some(5)];
    let values: Vec<i32> = options.into_iter()
        .flatten()
        .collect();
    println!("{:?}", values); // [1, 3, 5]
}
```

### flat_map - Map and Flatten

```rust
fn main() {
    let words = vec!["hello", "world"];

    // Convert each string to a character iterator, then flatten
    let chars: Vec<char> = words.iter()
        .flat_map(|s| s.chars())
        .collect();
    println!("{:?}", chars);
    // ['h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd']

    // Practical scenario: One-to-many mapping
    let numbers = vec![1, 2, 3];
    let expanded: Vec<i32> = numbers.iter()
        .flat_map(|&n| vec![n, n * 10, n * 100])
        .collect();
    println!("{:?}", expanded);
    // [1, 10, 100, 2, 20, 200, 3, 30, 300]
}
```

### peekable - Preview the Next Element

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let mut iter = numbers.iter().peekable();

    while let Some(&current) = iter.next() {
        // Preview the next element without consuming it
        if let Some(&&next) = iter.peek() {
            println!("Current: {}, Next: {}", current, next);
        } else {
            println!("Current: {}, this is the last one", current);
        }
    }
}
```

### rev - Reverse Iteration

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Reverse traversal
    let reversed: Vec<&i32> = numbers.iter().rev().collect();
    println!("{:?}", reversed); // [5, 4, 3, 2, 1]

    // Note: Only iterators that implement DoubleEndedIterator can use rev
}
```

### cloned and copied - Copy Elements

```rust
fn main() {
    let numbers = vec![1, 2, 3];

    // copied: For Copy types, get T from &T
    let owned: Vec<i32> = numbers.iter().copied().collect();
    println!("{:?}", owned); // [1, 2, 3]

    // cloned: For Clone types
    let strings = vec![String::from("a"), String::from("b")];
    let cloned: Vec<String> = strings.iter().cloned().collect();
    println!("{:?}", cloned); // ["a", "b"]
}
```

### inspect - Debug Iteration Process

```rust
fn main() {
    let result: Vec<i32> = (1..=5)
        .inspect(|x| println!("Starting to process: {}", x))
        .map(|x| x * 2)
        .inspect(|x| println!("After multiplying by 2: {}", x))
        .filter(|x| x > &5)
        .inspect(|x| println!("Passed filter: {}", x))
        .collect();

    println!("Final result: {:?}", result);
}
```

## Consumers

Consumers are methods that consume an iterator and produce a final result. Calling a consumer triggers the actual execution of the iterator chain.

### collect - Collect into a Collection

`collect` is the most commonly used consumer, capable of converting an iterator into various collection types:

```rust
use std::collections::{HashMap, HashSet, BTreeMap};

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Collect into Vec
    let vec: Vec<i32> = numbers.iter().copied().collect();

    // Collect into HashSet
    let set: HashSet<i32> = numbers.iter().copied().collect();

    // Collect into String
    let chars = vec!['h', 'e', 'l', 'l', 'o'];
    let string: String = chars.iter().collect();
    println!("{}", string); // "hello"

    // Collect into HashMap
    let pairs = vec![("a", 1), ("b", 2), ("c", 3)];
    let map: HashMap<&str, i32> = pairs.into_iter().collect();
    println!("{:?}", map);

    // Collect a sequence of Results
    let results: Vec<Result<i32, &str>> = vec![Ok(1), Ok(2), Ok(3)];
    let collected: Result<Vec<i32>, &str> = results.into_iter().collect();
    println!("{:?}", collected); // Ok([1, 2, 3])

    // If there's one Err, the whole result is Err
    let with_error: Vec<Result<i32, &str>> = vec![Ok(1), Err("error"), Ok(3)];
    let collected: Result<Vec<i32>, &str> = with_error.into_iter().collect();
    println!("{:?}", collected); // Err("error")
}
```

### fold - Fold/Reduce

`fold` is one of the most powerful consumers, capable of implementing almost all other consumers:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Sum
    let sum = numbers.iter().fold(0, |acc, x| acc + x);
    println!("Sum: {}", sum); // 15

    // Product
    let product = numbers.iter().fold(1, |acc, x| acc * x);
    println!("Product: {}", product); // 120

    // Build a string
    let words = vec!["Hello", "World", "Rust"];
    let sentence = words.iter().fold(String::new(), |mut acc, word| {
        if !acc.is_empty() {
            acc.push(' ');
        }
        acc.push_str(word);
        acc
    });
    println!("{}", sentence); // "Hello World Rust"

    // Find maximum (fold implementation)
    let max = numbers.iter().fold(i32::MIN, |acc, &x| {
        if x > acc { x } else { acc }
    });
    println!("Maximum: {}", max); // 5
}
```

### reduce - Simplified Fold

`reduce` uses the first element as the initial value:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Sum
    let sum = numbers.iter().copied().reduce(|acc, x| acc + x);
    println!("{:?}", sum); // Some(15)

    // Empty iterator returns None
    let empty: Vec<i32> = vec![];
    let result = empty.iter().copied().reduce(|acc, x| acc + x);
    println!("{:?}", result); // None

    // Find maximum
    let max = numbers.iter().copied().reduce(|a, b| a.max(b));
    println!("{:?}", max); // Some(5)
}
```

### sum and product

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Sum
    let sum: i32 = numbers.iter().sum();
    println!("Sum: {}", sum); // 15

    // Product
    let product: i32 = numbers.iter().product();
    println!("Product: {}", product); // 120

    // Floating-point sum
    let floats = vec![1.5, 2.5, 3.0];
    let sum: f64 = floats.iter().sum();
    println!("Float sum: {}", sum); // 7.0
}
```

### count and last

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Count
    let count = numbers.iter().count();
    println!("Number of elements: {}", count); // 5

    // Conditional count
    let even_count = numbers.iter().filter(|x| *x % 2 == 0).count();
    println!("Number of even numbers: {}", even_count); // 2

    // Get the last element
    let last = numbers.iter().last();
    println!("Last element: {:?}", last); // Some(5)
}
```

### find and position

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6];

    // find: Find the first element satisfying a condition
    let first_even = numbers.iter().find(|x| *x % 2 == 0);
    println!("First even number: {:?}", first_even); // Some(2)

    // find_map: find + map combined
    let strings = vec!["1", "two", "3"];
    let first_number = strings.iter()
        .find_map(|s| s.parse::<i32>().ok());
    println!("First number: {:?}", first_number); // Some(1)

    // position: Find the index of an element
    let pos = numbers.iter().position(|x| *x == 4);
    println!("Position of 4: {:?}", pos); // Some(3)

    // rposition: Find from the end
    let numbers2 = vec![1, 2, 3, 2, 1];
    let last_pos = numbers2.iter().rposition(|x| *x == 2);
    println!("Position of last 2: {:?}", last_pos); // Some(3)
}
```

### any and all

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // any: Does any element satisfy the condition
    let has_even = numbers.iter().any(|x| x % 2 == 0);
    println!("Has even number: {}", has_even); // true

    // all: Do all elements satisfy the condition
    let all_positive = numbers.iter().all(|x| *x > 0);
    println!("All positive: {}", all_positive); // true

    let all_even = numbers.iter().all(|x| x % 2 == 0);
    println!("All even: {}", all_even); // false
}
```

### max, min and Related Methods

```rust
fn main() {
    let numbers = vec![3, 1, 4, 1, 5, 9, 2, 6];

    // Maximum and minimum
    let max = numbers.iter().max();
    let min = numbers.iter().min();
    println!("Max: {:?}, Min: {:?}", max, min); // Some(9), Some(1)

    // max_by and min_by: Custom comparison
    let people = vec![
        ("Alice", 25),
        ("Bob", 30),
        ("Charlie", 20),
    ];

    let oldest = people.iter().max_by(|a, b| a.1.cmp(&b.1));
    println!("Oldest: {:?}", oldest); // Some(("Bob", 30))

    // max_by_key and min_by_key: Compare by key
    let youngest = people.iter().min_by_key(|p| p.1);
    println!("Youngest: {:?}", youngest); // Some(("Charlie", 20))

    // Find the longest by string length
    let words = vec!["apple", "pie", "extraordinary"];
    let longest = words.iter().max_by_key(|s| s.len());
    println!("Longest word: {:?}", longest); // Some("extraordinary")
}
```

### nth - Get the nth Element

```rust
fn main() {
    let numbers = vec![10, 20, 30, 40, 50];

    let mut iter = numbers.iter();

    // Get the 2nd element (0-indexed)
    let second = iter.nth(1);
    println!("2nd element: {:?}", second); // Some(20)

    // Note: nth consumes previous elements
    let next = iter.nth(1); // Now counting from 30, skip 30, get 40
    println!("Next: {:?}", next); // Some(40)
}
```

### for_each - Execute Action on Each Element

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // for_each is more functional than a for loop
    numbers.iter().for_each(|x| println!("{}", x));

    // Can be used in chained calls
    numbers.iter()
        .map(|x| x * 2)
        .filter(|x| x > &5)
        .for_each(|x| println!("Processing: {}", x));
}
```

### partition - Split an Iterator

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Split into even and odd
    let (evens, odds): (Vec<i32>, Vec<i32>) = numbers.iter()
        .copied()
        .partition(|x| x % 2 == 0);

    println!("Evens: {:?}", evens); // [2, 4, 6, 8, 10]
    println!("Odds: {:?}", odds);  // [1, 3, 5, 7, 9]
}
```

### unzip - Split a Tuple Iterator

```rust
fn main() {
    let pairs = vec![(1, 'a'), (2, 'b'), (3, 'c')];

    let (numbers, letters): (Vec<i32>, Vec<char>) = pairs.into_iter().unzip();

    println!("Numbers: {:?}", numbers); // [1, 2, 3]
    println!("Letters: {:?}", letters); // ['a', 'b', 'c']
}
```

## Lazy Evaluation

Iterator adapters are lazy, meaning no operations are executed until a consumer is called:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // This line won't print anything!
    let _lazy = numbers.iter()
        .map(|x| {
            println!("Processing {}", x);
            x * 2
        });

    println!("No operations have been executed yet...");

    // Calling collect() triggers execution
    let result: Vec<i32> = numbers.iter()
        .map(|x| {
            println!("Processing {}", x);
            x * 2
        })
        .collect();

    println!("Result: {:?}", result);
}
```

### Benefits of Lazy Evaluation

```rust
fn main() {
    // Only compute the elements needed
    let first_large = (1..)
        .map(|x| {
            println!("Computing square of {}", x);
            x * x
        })
        .find(|&x| x > 100);

    println!("First square greater than 100: {:?}", first_large);
    // Only prints computation process for 1 to 11

    // Infinite iterators
    let first_10_squares: Vec<i32> = (1..)
        .map(|x| x * x)
        .take(10)
        .collect();

    println!("{:?}", first_10_squares);
    // [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
}
```

## Custom Iterators

### Implementing the Iterator Trait

Creating a custom iterator requires implementing the `Iterator` trait:

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
    // Output: 1, 2, 3, 4, 5

    // Using iterator methods
    let sum: u32 = Counter::new(5).sum();
    println!("Sum: {}", sum); // 15

    // Chained operations
    let result: Vec<u32> = Counter::new(10)
        .filter(|x| x % 2 == 0)
        .map(|x| x * x)
        .collect();

    println!("{:?}", result); // [4, 16, 36, 64, 100]
}
```

### Fibonacci Sequence Iterator

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
    // First 10 Fibonacci numbers
    let fibs: Vec<u64> = Fibonacci::new().take(10).collect();
    println!("{:?}", fibs);
    // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

    // First Fibonacci number greater than 1000
    let large = Fibonacci::new().find(|&x| x > 1000);
    println!("{:?}", large); // Some(1597)
}
```

### Range Iterator

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
    // Forward stepping
    let forward: Vec<i32> = Range::new(0, 10, 2).collect();
    println!("{:?}", forward); // [0, 2, 4, 6, 8]

    // Backward stepping
    let backward: Vec<i32> = Range::new(10, 0, -2).collect();
    println!("{:?}", backward); // [10, 8, 6, 4, 2]
}
```

### Implementing DoubleEndedIterator

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
    // Forward iteration
    let forward: Vec<u32> = CounterBidirectional::new(5).collect();
    println!("{:?}", forward); // [1, 2, 3, 4, 5]

    // Reverse iteration
    let backward: Vec<u32> = CounterBidirectional::new(5).rev().collect();
    println!("{:?}", backward); // [5, 4, 3, 2, 1]

    // Iterating from both ends
    let mut iter = CounterBidirectional::new(6);
    assert_eq!(iter.next(), Some(1));
    assert_eq!(iter.next_back(), Some(6));
    assert_eq!(iter.next(), Some(2));
    assert_eq!(iter.next_back(), Some(5));
}
```

## IntoIterator Trait

The `IntoIterator` trait allows types to be converted into iterators, which is the foundation of how `for` loops work:

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

    // Can be used directly in a for loop
    for component in color {
        println!("{}", component);
    }
}
```

### Implementing IntoIterator for References

```rust
struct Matrix {
    data: Vec<Vec<i32>>,
}

impl Matrix {
    fn new(data: Vec<Vec<i32>>) -> Self {
        Matrix { data }
    }
}

// Implement for immutable reference
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

    // Borrow the matrix and iterate over rows
    for row in &matrix {
        println!("{:?}", row);
    }

    // matrix is still valid
    println!("Number of rows: {}", matrix.data.len());
}
```

## Practical Examples

### Text Processing

```rust
fn main() {
    let text = "Hello, World! Welcome to Rust programming.";

    // Word count
    let word_count = text.split_whitespace().count();
    println!("Word count: {}", word_count);

    // Longest word
    let longest_word = text
        .split_whitespace()
        .map(|s| s.trim_matches(|c: char| !c.is_alphabetic()))
        .max_by_key(|s| s.len());
    println!("Longest word: {:?}", longest_word);

    // Word frequency statistics
    use std::collections::HashMap;
    let mut freq: HashMap<&str, usize> = HashMap::new();

    for word in text.split_whitespace() {
        let word = word.trim_matches(|c: char| !c.is_alphabetic()).to_lowercase();
        // Simplified handling, using original word here
        *freq.entry(word.leak()).or_insert(0) += 1;
    }

    // Sort by frequency
    let mut sorted: Vec<_> = freq.iter().collect();
    sorted.sort_by(|a, b| b.1.cmp(a.1));

    for (word, count) in sorted.iter().take(5) {
        println!("{}: {}", word, count);
    }
}
```

### Data Processing Pipeline

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

    // Find names of all active users, sorted by age
    let mut active_users: Vec<&User> = users.iter()
        .filter(|u| u.active)
        .collect();

    active_users.sort_by_key(|u| u.age);

    let names: Vec<&str> = active_users.iter()
        .map(|u| u.name.as_str())
        .collect();

    println!("Active users (by age): {:?}", names);
    // ["Charlie", "Alice", "Diana"]

    // Calculate average age of active users
    let (sum, count) = users.iter()
        .filter(|u| u.active)
        .fold((0u32, 0u32), |(sum, count), user| {
            (sum + user.age, count + 1)
        });

    let avg_age = sum as f64 / count as f64;
    println!("Average age of active users: {:.1}", avg_age);
}
```

### Error Handling with Iterators

```rust
fn parse_numbers(input: &str) -> Result<Vec<i32>, std::num::ParseIntError> {
    input
        .split(',')
        .map(|s| s.trim().parse::<i32>())
        .collect()
}

fn main() {
    // Success case
    let result = parse_numbers("1, 2, 3, 4, 5");
    println!("{:?}", result); // Ok([1, 2, 3, 4, 5])

    // Failure case
    let result = parse_numbers("1, 2, three, 4");
    println!("{:?}", result); // Err(ParseIntError { kind: InvalidDigit })

    // Ignoring parse errors
    let numbers: Vec<i32> = "1, 2, three, 4, 5"
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();
    println!("{:?}", numbers); // [1, 2, 4, 5]
}
```

### Parallel Iterators (using rayon)

```rust
// Note: Requires adding rayon dependency
// use rayon::prelude::*;

fn main() {
    let numbers: Vec<i64> = (1..=1_000_000).collect();

    // Sequential processing
    let sum: i64 = numbers.iter().sum();
    println!("Sequential sum: {}", sum);

    // Parallel processing (using rayon)
    // let parallel_sum: i64 = numbers.par_iter().sum();
    // println!("Parallel sum: {}", parallel_sum);

    // Parallel map-reduce
    // let result: i64 = numbers.par_iter()
    //     .map(|x| x * x)
    //     .filter(|x| x % 2 == 0)
    //     .sum();
}
```

## Performance Considerations

### Iterators vs Loops

Rust's iterators are typically as fast as handwritten loops, sometimes even faster:

```rust
fn main() {
    let numbers: Vec<i32> = (1..=1000).collect();

    // Iterator approach
    let sum1: i32 = numbers.iter().sum();

    // Loop approach
    let mut sum2 = 0;
    for n in &numbers {
        sum2 += n;
    }

    assert_eq!(sum1, sum2);
    // Both approaches compile to nearly identical code
}
```

### Avoid Unnecessary Allocations

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Bad: Creates intermediate Vec
    let result: i32 = numbers.iter()
        .map(|x| x * 2)
        .collect::<Vec<i32>>() // Unnecessary allocation
        .iter()
        .sum();

    // Good: Direct chaining
    let result: i32 = numbers.iter()
        .map(|x| x * 2)
        .sum();

    println!("{}", result);
}
```

### Using size_hint

Custom iterators can implement `size_hint` to optimize memory allocation:

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

    // Provide size hint to help collect pre-allocate memory
    fn size_hint(&self) -> (usize, Option<usize>) {
        let remaining = self.max - self.current;
        (remaining, Some(remaining))
    }
}

fn main() {
    // collect will use size_hint to pre-allocate space
    let numbers: Vec<usize> = Counter::new(1000).collect();
    println!("Collected {} elements", numbers.len());
}
```

## Summary

Rust's iterator system is one of the most powerful features of the language:

1. **Zero-cost abstraction**: Iterator chains compile to code as efficient as handwritten loops
2. **Lazy evaluation**: Computation only happens when needed, avoiding unnecessary work
3. **Functional programming**: Supports functional operations like map, filter, fold
4. **Type safety**: Compile-time checking ensures type correctness
5. **Composability**: Adapters can be arbitrarily combined to form complex data processing pipelines
6. **Custom extensibility**: Create your own iterators by implementing the `Iterator` trait

Mastering iterators is key to writing idiomatic Rust code. They make code more concise and readable while helping you take full advantage of Rust's performance benefits.

Quick Reference for Common Patterns:

| Operation | Method |
|-----------|--------|
| Transform elements | `map` |
| Filter elements | `filter` |
| Filter and transform | `filter_map` |
| Flatten nested structures | `flatten`, `flat_map` |
| Take first N | `take` |
| Skip first N | `skip` |
| Add indices | `enumerate` |
| Combine iterators | `zip`, `chain` |
| Sum | `sum` |
| Product | `product` |
| Fold | `fold`, `reduce` |
| Collect | `collect` |
| Find | `find`, `position` |
| Check conditions | `any`, `all` |
| Extrema | `max`, `min` |
