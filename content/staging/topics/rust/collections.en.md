---
title: Collections
description: Complete guide to Rust collections, Vec, HashMap, HashSet and BTreeMap
track: rust
section: basics
difficulty: intermediate
tags:
  - Rust
  - Collections
  - Vec
  - HashMap
status: imported
origin: old/src/content/docs/rust/collections.en.md
divergence: 0.294
issues: []
legacy:
  category: Rust
  subcategory: Standard Library
  order: 13
  lastUpdated: 2026-01-07
---

Collections are data structures that can contain multiple values. Unlike the built-in array and tuple types, collections store their data on the heap, which means the amount of data does not need to be known at compile time and can grow or shrink as the program runs.

Rust's standard library provides a rich set of collection types, each optimized for different use cases. We'll cover the most commonly used collections and how to work with them effectively.

## Vec: The Dynamic Array

`Vec<T>`, or vector, is the most commonly used collection in Rust. It stores values of the same type in a contiguous, growable array.

### Creating Vectors

```rust
// Create an empty vector
let mut numbers: Vec<i32> = Vec::new();

// Create a vector with initial values using the vec! macro
let fruits = vec!["apple", "banana", "cherry"];

// Create a vector with a specific capacity
let mut buffer: Vec<u8> = Vec::with_capacity(1024);

// Create a vector with repeated values
let zeros = vec![0; 10]; // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
```

### Adding and Removing Elements

```rust
let mut stack = Vec::new();

// Add elements to the end
stack.push(1);
stack.push(2);
stack.push(3);

// Remove and return the last element
let top = stack.pop(); // Some(3)

// Insert at a specific index
stack.insert(0, 0); // [0, 1, 2]

// Remove at a specific index
let removed = stack.remove(1); // removes 1, returns 1

// Extend with another collection
stack.extend([4, 5, 6]);

// Append another vector (empties the source vector)
let mut more = vec![7, 8, 9];
stack.append(&mut more);

// Clear all elements
stack.clear();
```

### Accessing Elements

```rust
let numbers = vec![10, 20, 30, 40, 50];

// Direct indexing (panics if out of bounds)
let third = numbers[2]; // 30

// Safe access with get() returning Option
match numbers.get(10) {
    Some(value) => println!("Found: {}", value),
    None => println!("Index out of bounds"),
}

// First and last elements
let first = numbers.first(); // Some(&10)
let last = numbers.last();   // Some(&50)

// Slices
let middle = &numbers[1..4]; // [20, 30, 40]
```

### Iterating Over Vectors

```rust
let mut scores = vec![85, 92, 78, 95, 88];

// Immutable iteration
for score in &scores {
    println!("Score: {}", score);
}

// Mutable iteration
for score in &mut scores {
    *score += 5; // Add 5 bonus points to each score
}

// Iteration with index
for (index, score) in scores.iter().enumerate() {
    println!("Student {}: {}", index + 1, score);
}

// Consuming iteration (takes ownership)
for score in scores {
    println!("Final score: {}", score);
}
// scores is no longer valid here
```

### Useful Vector Methods

```rust
let mut numbers = vec![3, 1, 4, 1, 5, 9, 2, 6];

// Length and capacity
println!("Length: {}", numbers.len());
println!("Capacity: {}", numbers.capacity());
println!("Is empty: {}", numbers.is_empty());

// Searching
let has_five = numbers.contains(&5); // true
let position = numbers.iter().position(|&x| x == 4); // Some(2)

// Sorting
numbers.sort(); // [1, 1, 2, 3, 4, 5, 6, 9]
numbers.sort_by(|a, b| b.cmp(a)); // Descending order

// Deduplication (requires sorted vector)
numbers.sort();
numbers.dedup(); // [1, 2, 3, 4, 5, 6, 9]

// Reverse
numbers.reverse();

// Retain elements matching a condition
numbers.retain(|&x| x > 3); // Keep only elements > 3

// Split and chunk
let chunks: Vec<_> = numbers.chunks(2).collect();
let (left, right) = numbers.split_at(2);
```

## String: UTF-8 Encoded Text

`String` is a growable, heap-allocated, UTF-8 encoded string type. It's essentially a wrapper around `Vec<u8>` with guarantees about valid UTF-8 encoding.

### Creating Strings

```rust
// Create an empty string
let mut s = String::new();

// From a string literal
let hello = String::from("Hello, world!");
let hello = "Hello, world!".to_string();

// With capacity
let mut buffer = String::with_capacity(100);

// From characters
let s: String = ['H', 'e', 'l', 'l', 'o'].iter().collect();
```

### Modifying Strings

```rust
let mut greeting = String::from("Hello");

// Append a string slice
greeting.push_str(", world");

// Append a single character
greeting.push('!');

// Concatenation with +
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2; // s1 is moved, s2 is borrowed

// Using format! macro (doesn't take ownership)
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");
let combined = format!("{}-{}-{}", s1, s2, s3);

// Insert at position (byte index)
let mut s = String::from("Hello!");
s.insert(5, ',');      // "Hello,!"
s.insert_str(6, " world"); // "Hello, world!"

// Replace
let new_s = s.replace("world", "Rust");

// Remove characters
s.pop();           // Remove last character
s.remove(0);       // Remove character at byte index
s.truncate(5);     // Keep first 5 bytes
s.clear();         // Remove all content
```

### String Slicing and Indexing

Rust strings cannot be indexed by single integers because they are UTF-8 encoded, and a character might span multiple bytes.

```rust
let hello = String::from("Hello");

// Slicing (must be at valid UTF-8 boundaries)
let slice = &hello[0..2]; // "He"

// Iterating over characters
for c in hello.chars() {
    println!("{}", c);
}

// Iterating over bytes
for b in hello.bytes() {
    println!("{}", b);
}

// Getting character at index (O(n) operation)
let fourth: Option<char> = hello.chars().nth(3); // Some('l')

// Length in bytes vs characters
let russian = String::from("Привет");
println!("Bytes: {}", russian.len());        // 12
println!("Chars: {}", russian.chars().count()); // 6
```

### String Methods

```rust
let text = String::from("  Hello, World!  ");

// Trimming whitespace
let trimmed = text.trim();         // "Hello, World!"
let left = text.trim_start();      // "Hello, World!  "
let right = text.trim_end();       // "  Hello, World!"

// Case conversion
let upper = text.to_uppercase();
let lower = text.to_lowercase();

// Checking content
let starts = text.starts_with("  H");  // true
let ends = text.ends_with("!  ");      // true
let contains = text.contains("World"); // true

// Splitting
let words: Vec<&str> = text.split_whitespace().collect();
let parts: Vec<&str> = "a,b,c".split(',').collect();
let lines: Vec<&str> = "line1\nline2".lines().collect();

// Parsing
let num: i32 = "42".parse().unwrap();
let float: f64 = "3.14".parse().unwrap();
```

## HashMap: Key-Value Storage

`HashMap<K, V>` stores key-value pairs using a hash function. Keys must implement `Eq` and `Hash` traits.

### Creating HashMaps

```rust
use std::collections::HashMap;

// Create an empty HashMap
let mut scores: HashMap<String, i32> = HashMap::new();

// With capacity
let mut cache: HashMap<u64, String> = HashMap::with_capacity(100);

// From an iterator of tuples
let teams = vec![
    (String::from("Blue"), 10),
    (String::from("Red"), 50),
];
let scores: HashMap<_, _> = teams.into_iter().collect();

// From arrays (Rust 1.56+)
let scores = HashMap::from([
    ("Blue", 10),
    ("Red", 50),
]);
```

### Inserting and Updating

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

// Insert values
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Red"), 50);

// Insert returns the old value if key existed
let old = scores.insert(String::from("Blue"), 25); // Some(10)

// Insert only if key doesn't exist
scores.entry(String::from("Yellow")).or_insert(30);

// Insert with a default value from a function
scores.entry(String::from("Green")).or_insert_with(|| {
    println!("Computing default...");
    0
});

// Update based on old value
let count = scores.entry(String::from("Blue")).or_insert(0);
*count += 1;
```

### The Entry API

The Entry API provides an elegant way to handle the presence or absence of keys.

```rust
use std::collections::HashMap;

let text = "hello world wonderful world";
let mut word_count: HashMap<&str, u32> = HashMap::new();

// Count word frequencies
for word in text.split_whitespace() {
    let count = word_count.entry(word).or_insert(0);
    *count += 1;
}
// {"hello": 1, "world": 2, "wonderful": 1}

// More complex entry operations
let mut map: HashMap<String, Vec<i32>> = HashMap::new();

// or_insert_with for expensive default creation
map.entry(String::from("numbers"))
   .or_insert_with(Vec::new)
   .push(1);

// and_modify to update existing entries
map.entry(String::from("numbers"))
   .and_modify(|v| v.push(2))
   .or_insert_with(Vec::new);

// or_default for types implementing Default
let mut counts: HashMap<char, i32> = HashMap::new();
*counts.entry('a').or_default() += 1;
```

### Accessing Values

```rust
use std::collections::HashMap;

let mut scores = HashMap::from([
    ("Blue", 10),
    ("Red", 50),
]);

// Get returns Option<&V>
match scores.get("Blue") {
    Some(score) => println!("Blue: {}", score),
    None => println!("Team not found"),
}

// Get with default
let score = scores.get("Green").unwrap_or(&0);

// Get mutable reference
if let Some(score) = scores.get_mut("Blue") {
    *score += 5;
}

// Check if key exists
if scores.contains_key("Red") {
    println!("Red team exists");
}

// Get key-value pair
if let Some((&key, &value)) = scores.get_key_value("Blue") {
    println!("{}: {}", key, value);
}
```

### Iterating Over HashMaps

```rust
use std::collections::HashMap;

let scores = HashMap::from([
    ("Blue", 10),
    ("Red", 50),
    ("Green", 30),
]);

// Iterate over references
for (team, score) in &scores {
    println!("{}: {}", team, score);
}

// Iterate over keys only
for team in scores.keys() {
    println!("Team: {}", team);
}

// Iterate over values only
for score in scores.values() {
    println!("Score: {}", score);
}

// Mutable iteration over values
let mut scores = scores;
for score in scores.values_mut() {
    *score *= 2;
}

// Drain: iterate and remove all elements
for (team, score) in scores.drain() {
    println!("Removed {}: {}", team, score);
}
```

### Removing Elements

```rust
use std::collections::HashMap;

let mut scores = HashMap::from([
    ("Blue", 10),
    ("Red", 50),
    ("Green", 30),
]);

// Remove by key
let removed = scores.remove("Red"); // Some(50)

// Remove and get the key-value pair
let removed = scores.remove_entry("Blue"); // Some(("Blue", 10))

// Retain elements matching a condition
scores.retain(|_team, &mut score| score > 20);

// Clear all elements
scores.clear();
```

## HashSet: Unique Values

`HashSet<T>` is a collection of unique values, implemented as a `HashMap<T, ()>`.

### Creating and Using HashSets

```rust
use std::collections::HashSet;

// Create an empty set
let mut books: HashSet<String> = HashSet::new();

// From an array
let numbers: HashSet<i32> = HashSet::from([1, 2, 3, 4, 5]);

// From an iterator
let unique: HashSet<_> = vec![1, 2, 2, 3, 3, 3].into_iter().collect();
// {1, 2, 3}

// Insert elements
books.insert(String::from("The Rust Book"));
books.insert(String::from("Programming Rust"));

// Check membership
if books.contains("The Rust Book") {
    println!("We have it!");
}

// Remove elements
books.remove("The Rust Book");
```

### Set Operations

HashSet provides mathematical set operations.

```rust
use std::collections::HashSet;

let a: HashSet<i32> = HashSet::from([1, 2, 3, 4, 5]);
let b: HashSet<i32> = HashSet::from([3, 4, 5, 6, 7]);

// Union: elements in either set
let union: HashSet<_> = a.union(&b).cloned().collect();
// {1, 2, 3, 4, 5, 6, 7}

// Intersection: elements in both sets
let intersection: HashSet<_> = a.intersection(&b).cloned().collect();
// {3, 4, 5}

// Difference: elements in a but not in b
let difference: HashSet<_> = a.difference(&b).cloned().collect();
// {1, 2}

// Symmetric difference: elements in either but not both
let sym_diff: HashSet<_> = a.symmetric_difference(&b).cloned().collect();
// {1, 2, 6, 7}

// Subset and superset checks
let subset = HashSet::from([3, 4]);
println!("Is subset: {}", subset.is_subset(&a));     // true
println!("Is superset: {}", a.is_superset(&subset)); // true
println!("Is disjoint: {}", a.is_disjoint(&HashSet::from([8, 9]))); // true
```

## BTreeMap: Sorted Key-Value Storage

`BTreeMap<K, V>` is similar to HashMap but keeps keys in sorted order. Keys must implement `Ord`.

### Creating and Using BTreeMaps

```rust
use std::collections::BTreeMap;

let mut scores = BTreeMap::new();

scores.insert("Charlie", 85);
scores.insert("Alice", 92);
scores.insert("Bob", 78);

// Iteration is in sorted key order
for (name, score) in &scores {
    println!("{}: {}", name, score);
}
// Output:
// Alice: 92
// Bob: 78
// Charlie: 85
```

### Range Queries

BTreeMap supports efficient range queries due to its sorted nature.

```rust
use std::collections::BTreeMap;

let mut map = BTreeMap::new();
for i in 0..10 {
    map.insert(i, i * i);
}

// Range of keys
for (k, v) in map.range(3..7) {
    println!("{}: {}", k, v);
}
// 3: 9, 4: 16, 5: 25, 6: 36

// First and last entries
let first = map.first_key_value(); // Some((&0, &0))
let last = map.last_key_value();   // Some((&9, &81))

// Pop first and last
let first = map.pop_first(); // Some((0, 0))
let last = map.pop_last();   // Some((9, 81))

// Split at a key
let mut left = map.split_off(&5);
// map contains keys < 5, left contains keys >= 5
```

## BTreeSet: Sorted Unique Values

`BTreeSet<T>` is a sorted set, similar to HashSet but maintains order.

```rust
use std::collections::BTreeSet;

let mut set = BTreeSet::new();
set.insert(5);
set.insert(2);
set.insert(8);
set.insert(1);

// Iteration in sorted order
for num in &set {
    print!("{} ", num);
}
// Output: 1 2 5 8

// Range queries
for num in set.range(2..=5) {
    print!("{} ", num);
}
// Output: 2 5

// First and last
let first = set.first(); // Some(&1)
let last = set.last();   // Some(&8)

// Set operations work the same as HashSet
let other = BTreeSet::from([3, 4, 5, 6]);
let union: BTreeSet<_> = set.union(&other).cloned().collect();
```

## VecDeque: Double-Ended Queue

`VecDeque<T>` is a growable ring buffer that allows efficient insertion and removal at both ends.

### Basic Operations

```rust
use std::collections::VecDeque;

let mut deque: VecDeque<i32> = VecDeque::new();

// Add to back and front
deque.push_back(1);
deque.push_back(2);
deque.push_front(0);
// [0, 1, 2]

// Remove from back and front
let back = deque.pop_back();   // Some(2)
let front = deque.pop_front(); // Some(0)

// Access elements
let first = deque.front();     // Some(&1)
let last = deque.back();       // Some(&1)
let second = deque.get(1);     // None (only one element left)
```

### Use Cases

VecDeque is ideal for implementing queues, sliding windows, and buffers.

```rust
use std::collections::VecDeque;

// Implement a fixed-size sliding window
struct SlidingWindow {
    data: VecDeque<i32>,
    capacity: usize,
}

impl SlidingWindow {
    fn new(capacity: usize) -> Self {
        SlidingWindow {
            data: VecDeque::with_capacity(capacity),
            capacity,
        }
    }

    fn push(&mut self, value: i32) {
        if self.data.len() == self.capacity {
            self.data.pop_front();
        }
        self.data.push_back(value);
    }

    fn average(&self) -> f64 {
        if self.data.is_empty() {
            0.0
        } else {
            self.data.iter().sum::<i32>() as f64 / self.data.len() as f64
        }
    }
}

let mut window = SlidingWindow::new(3);
window.push(1);
window.push(2);
window.push(3);
println!("Average: {}", window.average()); // 2.0
window.push(4); // Removes 1, adds 4
println!("Average: {}", window.average()); // 3.0
```

### VecDeque Methods

```rust
use std::collections::VecDeque;

let mut deque = VecDeque::from([1, 2, 3, 4, 5]);

// Rotation
deque.rotate_left(2);  // [3, 4, 5, 1, 2]
deque.rotate_right(2); // [1, 2, 3, 4, 5]

// Make contiguous (useful before converting to slice)
deque.make_contiguous();
let slice: &[i32] = deque.as_slices().0;

// Swap elements
deque.swap(0, 4);

// Binary search (requires sorted deque)
deque.make_contiguous().sort();
let result = deque.binary_search(&3);

// Convert to/from Vec
let vec: Vec<i32> = deque.into();
let deque: VecDeque<i32> = VecDeque::from(vec![1, 2, 3]);
```

## Iterating Over Collections

All collections in Rust provide iterators through three methods:

- `iter()` - immutable references
- `iter_mut()` - mutable references
- `into_iter()` - owned values (consumes the collection)

### Iterator Adapters

```rust
let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Map: transform each element
let squared: Vec<i32> = numbers.iter().map(|x| x * x).collect();

// Filter: keep elements matching a condition
let evens: Vec<&i32> = numbers.iter().filter(|x| *x % 2 == 0).collect();

// Filter and map combined
let even_squares: Vec<i32> = numbers
    .iter()
    .filter(|x| *x % 2 == 0)
    .map(|x| x * x)
    .collect();

// Fold: reduce to a single value
let sum: i32 = numbers.iter().fold(0, |acc, x| acc + x);

// Find: get first matching element
let first_even = numbers.iter().find(|x| *x % 2 == 0);

// Any and all
let has_even = numbers.iter().any(|x| x % 2 == 0);
let all_positive = numbers.iter().all(|x| *x > 0);

// Take and skip
let first_three: Vec<_> = numbers.iter().take(3).collect();
let skip_three: Vec<_> = numbers.iter().skip(3).collect();

// Zip: combine two iterators
let letters = vec!['a', 'b', 'c'];
let zipped: Vec<_> = numbers.iter().zip(letters.iter()).collect();
// [(1, 'a'), (2, 'b'), (3, 'c')]

// Chain: concatenate iterators
let more = vec![11, 12, 13];
let all: Vec<_> = numbers.iter().chain(more.iter()).collect();

// Flatten: flatten nested structures
let nested = vec![vec![1, 2], vec![3, 4], vec![5, 6]];
let flat: Vec<_> = nested.into_iter().flatten().collect();
// [1, 2, 3, 4, 5, 6]
```

### Collecting into Different Types

```rust
use std::collections::{HashMap, HashSet, BTreeSet, VecDeque};

let numbers = vec![1, 2, 3, 2, 1];

// Into Vec
let vec: Vec<i32> = numbers.iter().cloned().collect();

// Into HashSet (removes duplicates)
let set: HashSet<i32> = numbers.iter().cloned().collect();

// Into BTreeSet (removes duplicates, sorted)
let sorted_set: BTreeSet<i32> = numbers.iter().cloned().collect();

// Into VecDeque
let deque: VecDeque<i32> = numbers.iter().cloned().collect();

// Into HashMap from tuples
let pairs = vec![("a", 1), ("b", 2), ("c", 3)];
let map: HashMap<_, _> = pairs.into_iter().collect();

// Into String from chars
let chars = vec!['H', 'e', 'l', 'l', 'o'];
let string: String = chars.into_iter().collect();
```

## Practical Examples

### Word Frequency Counter

```rust
use std::collections::HashMap;

fn count_words(text: &str) -> HashMap<String, usize> {
    let mut counts = HashMap::new();

    for word in text.split_whitespace() {
        // Normalize to lowercase and remove punctuation
        let word = word
            .to_lowercase()
            .chars()
            .filter(|c| c.is_alphabetic())
            .collect::<String>();

        if !word.is_empty() {
            *counts.entry(word).or_insert(0) += 1;
        }
    }

    counts
}

fn main() {
    let text = "The quick brown fox jumps over the lazy dog. The dog was not amused.";
    let counts = count_words(text);

    // Sort by frequency
    let mut sorted: Vec<_> = counts.iter().collect();
    sorted.sort_by(|a, b| b.1.cmp(a.1));

    for (word, count) in sorted.iter().take(5) {
        println!("{}: {}", word, count);
    }
}
```

### Graph Representation

```rust
use std::collections::{HashMap, HashSet};

struct Graph {
    edges: HashMap<String, HashSet<String>>,
}

impl Graph {
    fn new() -> Self {
        Graph {
            edges: HashMap::new(),
        }
    }

    fn add_edge(&mut self, from: &str, to: &str) {
        self.edges
            .entry(from.to_string())
            .or_insert_with(HashSet::new)
            .insert(to.to_string());

        // For undirected graph, add reverse edge
        self.edges
            .entry(to.to_string())
            .or_insert_with(HashSet::new)
            .insert(from.to_string());
    }

    fn neighbors(&self, node: &str) -> Option<&HashSet<String>> {
        self.edges.get(node)
    }

    fn has_edge(&self, from: &str, to: &str) -> bool {
        self.edges
            .get(from)
            .map(|neighbors| neighbors.contains(to))
            .unwrap_or(false)
    }
}

fn main() {
    let mut graph = Graph::new();
    graph.add_edge("A", "B");
    graph.add_edge("A", "C");
    graph.add_edge("B", "C");
    graph.add_edge("C", "D");

    if let Some(neighbors) = graph.neighbors("A") {
        println!("Neighbors of A: {:?}", neighbors);
    }
}
```

### LRU Cache Implementation

```rust
use std::collections::{HashMap, VecDeque};

struct LRUCache<K, V> {
    capacity: usize,
    order: VecDeque<K>,
    cache: HashMap<K, V>,
}

impl<K: Clone + Eq + std::hash::Hash, V> LRUCache<K, V> {
    fn new(capacity: usize) -> Self {
        LRUCache {
            capacity,
            order: VecDeque::with_capacity(capacity),
            cache: HashMap::with_capacity(capacity),
        }
    }

    fn get(&mut self, key: &K) -> Option<&V> {
        if self.cache.contains_key(key) {
            // Move to front (most recently used)
            self.order.retain(|k| k != key);
            self.order.push_front(key.clone());
            self.cache.get(key)
        } else {
            None
        }
    }

    fn put(&mut self, key: K, value: V) {
        if self.cache.contains_key(&key) {
            // Update existing and move to front
            self.order.retain(|k| k != &key);
        } else if self.cache.len() >= self.capacity {
            // Evict least recently used
            if let Some(lru_key) = self.order.pop_back() {
                self.cache.remove(&lru_key);
            }
        }

        self.order.push_front(key.clone());
        self.cache.insert(key, value);
    }
}
```

## Choosing the Right Collection

| Collection | Use When |
|------------|----------|
| `Vec` | Default choice for sequences; fast random access and iteration |
| `String` | Working with UTF-8 text that needs to grow |
| `HashMap` | Fast key-value lookups; order doesn't matter |
| `HashSet` | Tracking unique values; membership testing |
| `BTreeMap` | Sorted keys; range queries needed |
| `BTreeSet` | Sorted unique values; range queries |
| `VecDeque` | Queue or deque operations; efficient push/pop at both ends |

## Performance Considerations

### Time Complexity

| Operation | Vec | HashMap | BTreeMap | VecDeque |
|-----------|-----|---------|----------|----------|
| Index access | O(1) | - | - | O(1) |
| Search | O(n) | O(1)* | O(log n) | O(n) |
| Insert at end | O(1)* | O(1)* | O(log n) | O(1)* |
| Insert at start | O(n) | - | - | O(1)* |
| Remove | O(n) | O(1)* | O(log n) | O(n) |

*Amortized

### Memory Tips

```rust
// Pre-allocate when size is known
let mut vec = Vec::with_capacity(1000);
let mut map = HashMap::with_capacity(1000);

// Shrink to fit after removing many elements
vec.shrink_to_fit();
map.shrink_to_fit();

// Check memory usage
println!("Vec capacity: {} bytes",
    vec.capacity() * std::mem::size_of::<i32>());
```

## Summary

Rust's standard library collections provide powerful, safe, and efficient data structures for virtually any programming need:

- **Vec** is the go-to sequence type for most use cases
- **String** handles UTF-8 text with safety guarantees
- **HashMap** and **HashSet** provide fast, unordered storage
- **BTreeMap** and **BTreeSet** offer sorted alternatives with range queries
- **VecDeque** excels at double-ended operations

The Entry API for maps provides elegant handling of missing keys, and Rust's iterator system allows for expressive, chainable operations on all collections. Understanding these collections and their trade-offs is essential for writing efficient Rust programs.
