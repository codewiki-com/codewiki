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
origin: old/src/content/docs/rust/strings.en.md
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

Strings are one of the most fundamental and important data types in any programming language. Rust's string system has a unique design that provides safety and performance, while also presenting a certain learning curve. This article comprehensively explains the various string types in Rust to help you fully master Rust string handling.

## Concept Explanation

### Why Does Rust Have Multiple String Types?

In Rust, string design addresses several core concerns:

1. **Memory safety**: Avoiding dangling pointers, buffer overflows, and other issues
2. **UTF-8 correctness**: Ensuring all strings are valid UTF-8 encoded
3. **Zero-cost abstractions**: Not sacrificing performance while guaranteeing safety
4. **Interoperability**: Needing to interact with operating systems and C libraries

To address these concerns, Rust provides multiple string types, each with its specific use case.

### Core String Types Overview

| Type | Description | Storage Location | Mutability | Encoding |
|------|-------------|------------------|------------|----------|
| `String` | Growable heap-allocated string | Heap | Mutable | UTF-8 |
| `&str` | String slice (borrowed) | Any | Immutable | UTF-8 |
| `&mut str` | Mutable string slice | Any | Limited mutability | UTF-8 |
| `OsString` | Platform-native string | Heap | Mutable | Platform-dependent |
| `&OsStr` | Platform-native string slice | Any | Immutable | Platform-dependent |
| `CString` | C-compatible null-terminated string | Heap | Mutable | Any |
| `&CStr` | C string slice | Any | Immutable | Any |

## Core Principles

### Memory Layout of String

`String` is a struct containing three fields:

```rust
// Internal representation of String (simplified)
struct String {
    ptr: *mut u8,      // Pointer to data on the heap
    len: usize,        // Current length (in bytes)
    capacity: usize,   // Allocated capacity (in bytes)
}
```

The memory layout looks like this:

```
Stack                         Heap
┌─────────────────────┐     ┌─────────────────────────────┐
│ ptr: 0x7f3a... ─────┼────→│ H │ e │ l │ l │ o │ ... │
│ len: 5              │     └─────────────────────────────┘
│ capacity: 8         │
└─────────────────────┘
```

### Memory Layout of &str

`&str` is a fat pointer containing two fields:

```rust
// Internal representation of &str (simplified)
struct StrSlice {
    ptr: *const u8,    // Pointer to data
    len: usize,        // Length (in bytes)
}
```

`&str` can point to data in different locations:

```rust
fn main() {
    // Points to static storage (in the program binary)
    let static_str: &'static str = "hello";

    // Points to String data on the heap
    let owned = String::from("world");
    let heap_str: &str = &owned;

    // Points to an array on the stack
    let stack_array: [u8; 5] = [104, 101, 108, 108, 111]; // "hello"
    let stack_str: &str = std::str::from_utf8(&stack_array).unwrap();

    println!("{}, {}, {}", static_str, heap_str, stack_str);
}
```

### UTF-8 Encoding Principles

Rust strings enforce UTF-8 encoding. UTF-8 is a variable-length encoding:

| Unicode Range | Bytes | Encoding Format |
|---------------|-------|-----------------|
| U+0000 - U+007F | 1 | 0xxxxxxx |
| U+0080 - U+07FF | 2 | 110xxxxx 10xxxxxx |
| U+0800 - U+FFFF | 3 | 1110xxxx 10xxxxxx 10xxxxxx |
| U+10000 - U+10FFFF | 4 | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx |

```rust
fn main() {
    let s = "你好";

    // Byte length
    println!("Byte length: {}", s.len()); // 6 (each Chinese character is 3 bytes)

    // Character count
    println!("Character count: {}", s.chars().count()); // 2

    // View each byte
    for byte in s.bytes() {
        print!("{:02x} ", byte);
    }
    // Output: e4 bd a0 e5 a5 bd
    println!();

    // View each character
    for ch in s.chars() {
        println!("'{}' = U+{:04X}", ch, ch as u32);
    }
    // Output:
    // '你' = U+4F60
    // '好' = U+597D
}
```

## Key Points

### Differences Between String and &str

#### Ownership

```rust
fn main() {
    // String owns the data
    let owned: String = String::from("hello");

    // &str is a borrow, doesn't own the data
    let borrowed: &str = "hello";
    let also_borrowed: &str = &owned;

    // String can transfer ownership
    let new_owner = owned;
    // println!("{}", owned); // Error! Ownership has been moved

    // &str can be copied (because it's just a reference)
    let copy1 = borrowed;
    let copy2 = borrowed;
    println!("{}, {}", copy1, copy2); // OK
}
```

#### Mutability

```rust
fn main() {
    // String can be modified
    let mut s = String::from("hello");
    s.push_str(", world");
    s.push('!');
    println!("{}", s); // "hello, world!"

    // &str cannot be modified
    let slice: &str = "hello";
    // slice.push_str(", world"); // Error! &str doesn't have push_str method

    // &mut str can only be modified in place (cannot change length)
    let mut data = [b'h', b'e', b'l', b'l', b'o'];
    let slice_mut: &mut str = std::str::from_utf8_mut(&mut data).unwrap();
    slice_mut.make_ascii_uppercase();
    println!("{}", slice_mut); // "HELLO"
}
```

#### Choosing Function Parameter Types

```rust
// Recommended: Accept &str as parameter, more flexible
fn greet(name: &str) {
    println!("Hello, {}!", name);
}

// Not recommended: Only accepts String
fn greet_owned(name: String) {
    println!("Hello, {}!", name);
}

fn main() {
    let owned = String::from("World");
    let borrowed = "Rust";

    // greet can accept both types
    greet(&owned);   // String automatically derefs to &str
    greet(borrowed); // &str passed directly

    // greet_owned only accepts String
    greet_owned(owned);
    // greet_owned(borrowed); // Error! Requires String
    greet_owned(borrowed.to_string()); // Requires explicit conversion
}
```

### Ways to Create Strings

```rust
fn main() {
    // 1. String literal (&'static str)
    let s1: &str = "hello";

    // 2. String::new() creates empty string
    let s2: String = String::new();

    // 3. String::from() creates from &str
    let s3: String = String::from("hello");

    // 4. to_string() method
    let s4: String = "hello".to_string();

    // 5. to_owned() method
    let s5: String = "hello".to_owned();

    // 6. into() method
    let s6: String = "hello".into();

    // 7. String::with_capacity() pre-allocates capacity
    let mut s7 = String::with_capacity(100);
    s7.push_str("hello");
    println!("len: {}, capacity: {}", s7.len(), s7.capacity());

    // 8. format! macro
    let name = "Rust";
    let s8: String = format!("Hello, {}!", name);

    // 9. Create from bytes
    let bytes = vec![104, 101, 108, 108, 111];
    let s9: String = String::from_utf8(bytes).unwrap();

    // 10. Collect from iterator
    let chars = vec!['h', 'e', 'l', 'l', 'o'];
    let s10: String = chars.iter().collect();
}
```

### String Indexing Issues

Rust doesn't allow direct indexing to access characters in a string:

```rust
fn main() {
    let s = "hello";

    // let ch = s[0]; // Error! Cannot index directly

    // Reason: UTF-8 is variable-length encoding
    let chinese = "你好";
    // "你" takes 3 bytes, what should chinese[0] return?
    // One byte? One character? This ambiguity is why Rust forbids direct indexing

    // Correct approaches
    // 1. Get bytes
    let byte: u8 = s.as_bytes()[0];
    println!("First byte: {}", byte); // 104

    // 2. Get characters
    let ch: char = s.chars().nth(0).unwrap();
    println!("First character: {}", ch); // 'h'

    // 3. Use slices (but boundaries must be on character boundaries)
    let slice: &str = &s[0..2];
    println!("Slice: {}", slice); // "he"

    // Danger: If slice boundaries aren't on character boundaries, it will panic
    let chinese = "你好";
    // let bad_slice = &chinese[0..1]; // panic! Not a valid character boundary
    let good_slice = &chinese[0..3]; // "你"
    println!("Chinese slice: {}", good_slice);
}
```

## Code Examples

### Basic String Operations

```rust
fn main() {
    // === Appending Content ===
    let mut s = String::from("Hello");

    // push_str: Append string slice
    s.push_str(", ");
    s.push_str("World");

    // push: Append single character
    s.push('!');

    println!("{}", s); // "Hello, World!"

    // === String Concatenation ===
    let s1 = String::from("Hello, ");
    let s2 = String::from("World!");

    // Using + operator (note: first argument is moved)
    let s3 = s1 + &s2;
    // println!("{}", s1); // Error! s1 has been moved
    println!("{}", s3); // "Hello, World!"

    // Using format! macro (doesn't move any arguments)
    let s4 = String::from("Hello");
    let s5 = String::from("World");
    let s6 = format!("{}, {}!", s4, s5);
    println!("{}", s6); // "Hello, World!"
    println!("{}, {}", s4, s5); // Still valid

    // === Insertion and Deletion ===
    let mut s = String::from("Hello World");

    // insert: Insert character at specified position
    s.insert(5, ',');
    println!("{}", s); // "Hello, World"

    // insert_str: Insert string at specified position
    s.insert_str(7, "Rust ");
    println!("{}", s); // "Hello, Rust World"

    // remove: Remove character at specified position
    let removed = s.remove(5);
    println!("Removed character: '{}', Result: {}", removed, s);

    // pop: Remove and return last character
    let last = s.pop();
    println!("Popped: {:?}", last);

    // truncate: Truncate to specified length
    s.truncate(5);
    println!("After truncate: {}", s); // "Hello"

    // clear: Clear the string
    s.clear();
    println!("Length after clear: {}", s.len()); // 0
}
```

### String Iteration

```rust
fn main() {
    let s = "Hello, 世界! 🌍";

    // === Iterate by Characters ===
    println!("Character iteration:");
    for ch in s.chars() {
        println!("  '{}'", ch);
    }

    // === Iterate by Bytes ===
    println!("\nByte iteration:");
    for (i, byte) in s.bytes().enumerate() {
        println!("  [{}] = 0x{:02x}", i, byte);
    }

    // === Iterate by Character Indices ===
    println!("\nCharacter index iteration:");
    for (i, ch) in s.char_indices() {
        println!("  Byte position {}: '{}'", i, ch);
    }

    // === Iterate by Lines ===
    let multiline = "First line\nSecond line\nThird line";
    println!("\nLine iteration:");
    for (i, line) in multiline.lines().enumerate() {
        println!("  Line {}: {}", i + 1, line);
    }

    // === Iterate by Words ===
    let words = "Hello World Rust";
    println!("\nWord iteration:");
    for word in words.split_whitespace() {
        println!("  {}", word);
    }

    // === Iterate by Custom Delimiter ===
    let csv = "apple,banana,cherry";
    println!("\nSplit by comma:");
    for item in csv.split(',') {
        println!("  {}", item);
    }
}
```

### String Search and Replace

```rust
fn main() {
    let s = "Hello, World! Hello, Rust!";

    // === Search ===

    // contains: Check if contains substring
    println!("Contains 'World': {}", s.contains("World")); // true

    // starts_with / ends_with
    println!("Starts with 'Hello': {}", s.starts_with("Hello")); // true
    println!("Ends with '!': {}", s.ends_with("!")); // true

    // find: Find first occurrence position
    if let Some(pos) = s.find("World") {
        println!("'World' first appears at position: {}", pos); // 7
    }

    // rfind: Find from end
    if let Some(pos) = s.rfind("Hello") {
        println!("'Hello' last appears at position: {}", pos); // 14
    }

    // match_indices: Find all matches
    println!("All 'Hello' positions:");
    for (pos, matched) in s.match_indices("Hello") {
        println!("  Position {}: '{}'", pos, matched);
    }

    // === Replace ===

    // replace: Replace all matches
    let replaced = s.replace("Hello", "Hi");
    println!("After replace: {}", replaced); // "Hi, World! Hi, Rust!"

    // replacen: Replace first N matches
    let replaced_once = s.replacen("Hello", "Hi", 1);
    println!("Replace once: {}", replaced_once); // "Hi, World! Hello, Rust!"

    // === Trimming ===
    let padded = "  Hello, World!  ";

    // trim: Remove whitespace from both ends
    println!("trim: '{}'", padded.trim()); // "Hello, World!"

    // trim_start / trim_end
    println!("trim_start: '{}'", padded.trim_start()); // "Hello, World!  "
    println!("trim_end: '{}'", padded.trim_end()); // "  Hello, World!"

    // trim_matches: Remove specified characters
    let dashed = "---hello---";
    println!("trim_matches: '{}'", dashed.trim_matches('-')); // "hello"
}
```

### String Case Conversion

```rust
fn main() {
    let s = "Hello, World!";

    // Convert to uppercase
    println!("Uppercase: {}", s.to_uppercase()); // "HELLO, WORLD!"

    // Convert to lowercase
    println!("Lowercase: {}", s.to_lowercase()); // "hello, world!"

    // Handle Unicode
    let german = "Größe";
    println!("German uppercase: {}", german.to_uppercase()); // "GRÖSSE" (ß -> SS)

    // ASCII version (only converts ASCII characters)
    let mixed = "Café";
    println!("ASCII uppercase: {}", mixed.to_ascii_uppercase()); // "CAFé"

    // In-place conversion (requires mutable reference)
    let mut ascii = String::from("Hello");
    ascii.make_ascii_uppercase();
    println!("In-place uppercase: {}", ascii); // "HELLO"
}
```

### String Parsing and Formatting

```rust
fn main() {
    // === Parsing ===

    // parse: Parse string to other types
    let num: i32 = "42".parse().unwrap();
    let float: f64 = "3.14".parse().unwrap();
    let boolean: bool = "true".parse().unwrap();

    println!("Parsed results: {}, {}, {}", num, float, boolean);

    // Handle parsing errors
    let result: Result<i32, _> = "not a number".parse();
    match result {
        Ok(n) => println!("Parse succeeded: {}", n),
        Err(e) => println!("Parse failed: {}", e),
    }

    // === Formatting ===

    // Basic formatting
    let formatted = format!("Number: {}, Float: {:.2}", 42, 3.14159);
    println!("{}", formatted); // "Number: 42, Float: 3.14"

    // Padding and alignment
    println!("Right align: '{:>10}'", "hello"); // "     hello"
    println!("Left align: '{:<10}'", "hello"); // "hello     "
    println!("Center:     '{:^10}'", "hello"); // "  hello   "
    println!("Fill:       '{:*^10}'", "hello"); // "**hello***"

    // Number formatting
    let num = 42;
    println!("Decimal: {}", num);     // 42
    println!("Binary: {:b}", num);   // 101010
    println!("Octal: {:o}", num);   // 52
    println!("Hexadecimal: {:x}", num); // 2a
    println!("Hexadecimal uppercase: {:X}", num); // 2A

    // With prefix
    println!("With prefix: {:#x}", num);  // 0x2a
    println!("With prefix: {:#b}", num);  // 0b101010

    // Positional arguments
    println!("{0} {1} {0}", "hello", "world"); // "hello world hello"

    // Named arguments
    println!("{name} is {age} years old", name = "Alice", age = 30);

    // Debug format
    let vec = vec![1, 2, 3];
    println!("Debug: {:?}", vec);    // [1, 2, 3]
    println!("Pretty: {:#?}", vec);  // Indented format
}
```

## Best Practices

### Choosing Function Parameter Types

```rust
// Good: Accept &str, can receive both String and &str
fn process(text: &str) {
    println!("Processing: {}", text);
}

// Good: Use String when ownership is needed
fn store(text: String) -> String {
    // Store or modify...
    text
}

// Good: Use impl AsRef<str> for maximum flexibility
fn flexible<S: AsRef<str>>(text: S) {
    let s: &str = text.as_ref();
    println!("Flexible: {}", s);
}

// Good: Use Into<String> to accept types convertible to String
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

### Avoiding Unnecessary Allocations

```rust
fn main() {
    let s = String::from("Hello, World!");

    // Bad: Unnecessary to_string()
    let _upper = s.to_uppercase().to_string(); // to_uppercase already returns String

    // Good: Use the returned String directly
    let _upper = s.to_uppercase();

    // Bad: Unnecessary clone
    fn process_bad(s: &str) -> String {
        s.to_string().clone() // clone is redundant
    }

    // Good
    fn process_good(s: &str) -> String {
        s.to_string()
    }

    // Bad: Repeated allocations in loop
    let mut result = String::new();
    for i in 0..100 {
        result = result + &i.to_string(); // Allocates each iteration
    }

    // Good: Use push_str or pre-allocate capacity
    let mut result = String::with_capacity(200);
    for i in 0..100 {
        result.push_str(&i.to_string());
    }

    // Even better: Use format! or write!
    use std::fmt::Write;
    let mut result = String::new();
    for i in 0..100 {
        write!(&mut result, "{}", i).unwrap();
    }
}
```

### Correctly Handling UTF-8

```rust
fn main() {
    // Good: Use chars() to iterate over characters
    let s = "Hello, 世界!";
    let char_count = s.chars().count();
    println!("Character count: {}", char_count);

    // Good: Use char_indices() to get correct byte positions
    for (byte_pos, ch) in s.char_indices() {
        println!("Character '{}' at byte position {}", ch, byte_pos);
    }

    // Good: Safe string slicing
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
        println!("Substring: {}", sub); // "世界"
    }

    // Good: Use graphemes for complex Unicode (requires unicode-segmentation crate)
    // use unicode_segmentation::UnicodeSegmentation;
    // let emoji = "👨‍👩‍👧‍👦";
    // for grapheme in emoji.graphemes(true) {
    //     println!("Grapheme: {}", grapheme);
    // }
}
```

### String Building Patterns

```rust
fn main() {
    // Pattern 1: Use String::with_capacity to pre-allocate
    fn build_with_capacity() -> String {
        let mut s = String::with_capacity(100);
        for i in 0..10 {
            s.push_str(&format!("Item {}\n", i));
        }
        s
    }

    // Pattern 2: Use collect to build from iterator
    fn build_with_collect() -> String {
        (0..10)
            .map(|i| format!("Item {}\n", i))
            .collect()
    }

    // Pattern 3: Use join to concatenate
    fn build_with_join() -> String {
        let items: Vec<String> = (0..10)
            .map(|i| format!("Item {}", i))
            .collect();
        items.join("\n")
    }

    // Pattern 4: Use write! macro
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

## Common Pitfalls

### Index Out of Bounds

```rust
fn main() {
    let s = "Hello, 世界!";

    // Dangerous: Directly slice with byte indices
    // let bad = &s[0..8]; // panic! Byte 8 is in the middle of "世"

    // Safe: Ensure on character boundaries
    let good = &s[0..7]; // "Hello, "
    println!("{}", good);

    // Safer: Use get method
    match s.get(0..8) {
        Some(slice) => println!("Slice: {}", slice),
        None => println!("Invalid slice range"),
    }

    // Safest: Use char_indices
    fn safe_slice(s: &str, start_char: usize, end_char: usize) -> Option<&str> {
        let start = s.char_indices().nth(start_char)?.0;
        let end = s.char_indices().nth(end_char).map(|(i, _)| i)?;
        Some(&s[start..end])
    }
}
```

### String Length Confusion

```rust
fn main() {
    let s = "Hello, 世界!";

    // len() returns byte count, not character count
    println!("Byte length: {}", s.len());        // 14
    println!("Character count: {}", s.chars().count()); // 10

    // For emoji it's even more complex
    let emoji = "👨‍👩‍👧‍👦"; // A "family" emoji
    println!("Byte length: {}", emoji.len());        // 25
    println!("Character count: {}", emoji.chars().count()); // 7 (includes ZWJ connectors)
    // Visually only 1 grapheme!

    // Correct handling requires unicode-segmentation crate
    // println!("Grapheme count: {}", emoji.graphemes(true).count()); // 1
}
```

### String Comparison Pitfalls

```rust
fn main() {
    // Case sensitive
    assert!("Hello" != "hello");

    // Unicode normalization issues
    let a = "é";      // Single character
    let b = "é";      // e + combining acute accent (two code points)

    // Byte comparison may not be equal
    println!("Direct comparison: {}", a == b); // May be false
    println!("Bytes of a: {:?}", a.as_bytes());
    println!("Bytes of b: {:?}", b.as_bytes());

    // Correct approach: Use unicode-normalization crate
    // use unicode_normalization::UnicodeNormalization;
    // let a_nfc: String = a.nfc().collect();
    // let b_nfc: String = b.nfc().collect();
    // assert_eq!(a_nfc, b_nfc);

    // Case-insensitive comparison
    let s1 = "Hello";
    let s2 = "HELLO";

    // Simple approach (only works for ASCII)
    println!("Ignore case: {}", s1.eq_ignore_ascii_case(s2)); // true

    // More correct: Convert to lowercase for comparison
    println!("Conversion comparison: {}", s1.to_lowercase() == s2.to_lowercase()); // true
}
```

### Lifetime Issues

```rust
fn main() {
    // Error: Returning reference to local String
    // fn bad_return() -> &str {
    //     let s = String::from("hello");
    //     &s // Error! s will be dropped
    // }

    // Correct: Return String
    fn good_return_owned() -> String {
        String::from("hello")
    }

    // Correct: Return static string
    fn good_return_static() -> &'static str {
        "hello"
    }

    // Correct: Return reference with same lifetime as parameter
    fn good_return_ref<'a>(s: &'a str) -> &'a str {
        &s[0..s.len().min(5)]
    }

    let s = good_return_owned();
    println!("{}", s);
}
```

## Performance Considerations

### String vs &str Performance

```rust
use std::time::Instant;

fn main() {
    const N: usize = 100_000;

    // Test 1: Concatenation performance
    let start = Instant::now();
    let mut s = String::new();
    for i in 0..N {
        s.push_str(&i.to_string());
    }
    println!("push_str time: {:?}", start.elapsed());

    // Test 2: Pre-allocated capacity
    let start = Instant::now();
    let mut s = String::with_capacity(N * 5);
    for i in 0..N {
        s.push_str(&i.to_string());
    }
    println!("Pre-allocated push_str time: {:?}", start.elapsed());

    // Test 3: Using + operator (not recommended)
    // let start = Instant::now();
    // let mut s = String::new();
    // for i in 0..1000 {  // Reduced iterations because too slow
    //     s = s + &i.to_string();  // Allocates new string each time
    // }
    // println!("+ operator time: {:?}", start.elapsed());
}
```

### Capacity Management

```rust
fn main() {
    let mut s = String::new();

    // Initial capacity is 0
    println!("Initial - len: {}, capacity: {}", s.len(), s.capacity());

    // Automatic growth
    for i in 0..50 {
        s.push('a');
        if i % 10 == 0 {
            println!("i={} - len: {}, capacity: {}", i, s.len(), s.capacity());
        }
    }

    // Manual capacity expansion
    s.reserve(100); // Ensure at least 100 more bytes can be held
    println!("After reserve - len: {}, capacity: {}", s.len(), s.capacity());

    // Exact capacity expansion
    s.reserve_exact(200);
    println!("After reserve_exact - len: {}, capacity: {}", s.len(), s.capacity());

    // Shrink capacity
    s.shrink_to_fit();
    println!("After shrink_to_fit - len: {}, capacity: {}", s.len(), s.capacity());
}
```

### Avoiding Unnecessary Copies

```rust
fn main() {
    // Use Cow (Copy on Write) optimization
    use std::borrow::Cow;

    fn process_string(input: &str) -> Cow<str> {
        if input.contains("bad") {
            // Only allocate new string when modification is needed
            Cow::Owned(input.replace("bad", "good"))
        } else {
            // Return borrow directly when no modification is needed
            Cow::Borrowed(input)
        }
    }

    let s1 = "hello world";
    let s2 = "hello bad world";

    let result1 = process_string(s1);
    let result2 = process_string(s2);

    println!("result1 is borrowed: {}", matches!(result1, Cow::Borrowed(_))); // true
    println!("result2 is borrowed: {}", matches!(result2, Cow::Borrowed(_))); // false
}
```

## Practical Scenarios

### Scenario 1: Configuration File Parsing

```rust
use std::collections::HashMap;

fn parse_config(content: &str) -> HashMap<String, String> {
    let mut config = HashMap::new();

    for line in content.lines() {
        // Skip empty lines and comments
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        // Parse key=value format
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
        # Database configuration
        host = localhost
        port = 5432
        database = myapp

        # Application configuration
        debug = true
        log_level = info
    "#;

    let config = parse_config(config_content);

    for (key, value) in &config {
        println!("{} = {}", key, value);
    }
}
```

### Scenario 2: Path Handling

```rust
use std::path::Path;

fn main() {
    // Use Path for file path handling (cross-platform)
    let path = Path::new("/home/user/documents/file.txt");

    // Get various parts
    println!("File name: {:?}", path.file_name());
    println!("Extension: {:?}", path.extension());
    println!("Parent directory: {:?}", path.parent());
    println!("File stem: {:?}", path.file_stem());

    // Path joining
    let base = Path::new("/home/user");
    let full_path = base.join("documents").join("file.txt");
    println!("Full path: {:?}", full_path);

    // Convert to string
    if let Some(path_str) = full_path.to_str() {
        println!("Path string: {}", path_str);
    }

    // Normalize path
    let messy_path = Path::new("/home/user/../user/./documents");
    // Note: canonicalize requires the path to actually exist
    // let clean_path = messy_path.canonicalize().unwrap();
}
```

### Scenario 3: Template Rendering

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

### Scenario 4: JSON String Handling

```rust
// Simple JSON string escaping
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
    println!("Escaped: {}", escaped);
    // Output: "Hello, \"World\"!\nNew line\tTab"
}
```

## OsString and OsStr

### Why Do We Need OsString?

Different operating systems use different string encodings:

- **Windows**: Uses UTF-16 (may contain invalid surrogate pairs)
- **Unix**: Uses byte sequences (usually UTF-8, but not enforced)
- **Rust String**: Enforces UTF-8

`OsString` and `OsStr` are used to represent operating system native strings and can handle these differences.

```rust
use std::ffi::{OsString, OsStr};
use std::path::Path;

fn main() {
    // Create OsString from String
    let os_string: OsString = OsString::from("hello.txt");

    // Create &OsStr from &str
    let os_str: &OsStr = OsStr::new("hello.txt");

    // Path internally uses OsStr
    let path = Path::new("hello.txt");
    let file_name: Option<&OsStr> = path.file_name();

    // Try to convert to &str (may fail)
    if let Some(name) = file_name {
        match name.to_str() {
            Some(s) => println!("File name: {}", s),
            None => println!("File name contains invalid UTF-8"),
        }
    }

    // Use to_string_lossy (replaces invalid bytes with U+FFFD)
    if let Some(name) = file_name {
        println!("File name (lossy): {}", name.to_string_lossy());
    }

    // Environment variables also use OsString
    use std::env;

    if let Some(home) = env::var_os("HOME") {
        println!("HOME: {:?}", home);
        if let Some(home_str) = home.to_str() {
            println!("HOME (str): {}", home_str);
        }
    }
}
```

### Filesystem Operations

```rust
use std::fs;
use std::path::Path;
use std::ffi::OsStr;

fn main() -> std::io::Result<()> {
    // Read directory
    for entry in fs::read_dir(".")? {
        let entry = entry?;
        let path = entry.path();

        // file_name returns Option<&OsStr>
        if let Some(name) = path.file_name() {
            // Safe approach: to_string_lossy
            println!("File: {}", name.to_string_lossy());

            // Check extension
            if path.extension() == Some(OsStr::new("rs")) {
                println!("  -> This is a Rust source file");
            }
        }
    }

    Ok(())
}
```

## CString and CStr

### Why Do We Need CString?

C language uses null-terminated strings, while Rust strings:
- Are not null-terminated
- Can contain null bytes

`CString` and `CStr` are used for interoperability with C code.

```rust
use std::ffi::{CString, CStr};
use std::os::raw::c_char;

fn main() {
    // Create CString
    let c_string = CString::new("Hello, C!").expect("CString cannot contain internal null bytes");

    // Get raw pointer (to pass to C functions)
    let ptr: *const c_char = c_string.as_ptr();

    // Create CStr from raw pointer (unsafe)
    unsafe {
        let c_str: &CStr = CStr::from_ptr(ptr);

        // Convert to Rust string
        match c_str.to_str() {
            Ok(s) => println!("From C string: {}", s),
            Err(_) => println!("Invalid UTF-8"),
        }
    }

    // CString with internal null will fail
    let result = CString::new("Hello\0World");
    match result {
        Ok(_) => println!("Successfully created"),
        Err(e) => println!("Failed: {} (position: {})", e, e.nul_position()),
    }
}
```

### FFI Practical Application

```rust
use std::ffi::{CString, CStr};
use std::os::raw::c_char;

// Simulated C function
extern "C" {
    fn strlen(s: *const c_char) -> usize;
}

fn call_c_strlen(s: &str) -> Option<usize> {
    // Create CString
    let c_string = CString::new(s).ok()?;

    // Call C function
    unsafe {
        Some(strlen(c_string.as_ptr()))
    }
}

// Simulated receiving string from C
unsafe fn receive_from_c(ptr: *const c_char) -> Option<String> {
    if ptr.is_null() {
        return None;
    }

    // Create CStr
    let c_str = CStr::from_ptr(ptr);

    // Try to convert to String
    c_str.to_str().ok().map(|s| s.to_string())
}

fn main() {
    // Example: Calculate string length
    // Note: Actual execution requires linking libc
    // let len = call_c_strlen("Hello, World!");
    // println!("Length: {:?}", len);

    // Safely wrap C string pointer
    let c_string = CString::new("Hello").unwrap();
    unsafe {
        let received = receive_from_c(c_string.as_ptr());
        println!("Received: {:?}", received);
    }
}
```

## Interview Key Points

### Common Interview Questions

**Q1: What are the differences between String and &str?**

```
Key points:
1. String is a heap-allocated, mutable, owned string type
2. &str is a string slice, a borrow of a UTF-8 byte sequence
3. String can grow or shrink, &str is immutable
4. String stores (ptr, len, capacity) on the stack, data on the heap
5. &str is a fat pointer, storing (ptr, len)
6. For function parameters, prefer &str as it's more flexible
```

**Q2: Why doesn't Rust allow direct string indexing?**

```rust
// Key points:
fn explain_indexing() {
    let s = "你好";

    // 1. UTF-8 is variable-length encoding
    println!("Byte length: {}", s.len()); // 6
    println!("Character count: {}", s.chars().count()); // 2

    // 2. What should s[0] return?
    //    - One byte? (0xe4) Not meaningful
    //    - One character? Requires O(n) time to scan

    // 3. Rust chooses explicitness to avoid ambiguity
    let byte = s.as_bytes()[0]; // Explicitly want byte
    let ch = s.chars().nth(0);  // Explicitly want character
}
```

**Q3: How to efficiently concatenate multiple strings?**

```rust
fn efficient_concat() {
    let parts = vec!["Hello", ", ", "World", "!"];

    // Method 1: join
    let s1: String = parts.join("");

    // Method 2: concat
    let s2: String = parts.concat();

    // Method 3: collect
    let s3: String = parts.iter().copied().collect();

    // Method 4: push_str + pre-allocation
    let total_len: usize = parts.iter().map(|s| s.len()).sum();
    let mut s4 = String::with_capacity(total_len);
    for part in &parts {
        s4.push_str(part);
    }

    // Method 5: format! (most flexible but potentially slower)
    let s5 = format!("{}{}{}{}", parts[0], parts[1], parts[2], parts[3]);
}
```

**Q4: What is Cow<str>? When should you use it?**

```rust
use std::borrow::Cow;

// Cow = Clone on Write
fn explain_cow() {
    // Cow<str> can be either borrowed or owned
    let borrowed: Cow<str> = Cow::Borrowed("hello");
    let owned: Cow<str> = Cow::Owned(String::from("world"));

    // Use case: May or may not need modification
    fn maybe_modify(s: &str) -> Cow<str> {
        if s.contains("bad") {
            Cow::Owned(s.replace("bad", "good"))
        } else {
            Cow::Borrowed(s)
        }
    }

    // Advantage: Avoids unnecessary allocations
    let s1 = maybe_modify("hello");       // Returns Borrowed
    let s2 = maybe_modify("bad word");    // Returns Owned
}
```

**Q5: How to correctly handle strings containing Unicode?**

```rust
fn unicode_handling() {
    let s = "Hello, 世界! 👋";

    // 1. Correctly count characters
    let char_count = s.chars().count();

    // 2. Correctly iterate
    for (i, ch) in s.char_indices() {
        println!("Byte position {}: {}", i, ch);
    }

    // 3. Safe slicing
    fn safe_slice(s: &str, char_start: usize, char_end: usize) -> Option<&str> {
        let mut indices = s.char_indices();
        let start = indices.nth(char_start)?.0;
        let end = indices.nth(char_end - char_start - 1)
            .map(|(i, _)| i)
            .unwrap_or(s.len());
        Some(&s[start..end])
    }

    // 4. Use unicode-segmentation for grapheme clusters
    // let grapheme_count = s.graphemes(true).count();
}
```

## Further Reading

### Official Resources

- [The Rust Book - Storing UTF-8 Encoded Text with Strings](https://doc.rust-lang.org/book/ch08-02-strings.html)
- [Rust std::string Documentation](https://doc.rust-lang.org/std/string/index.html)
- [Rust std::str Documentation](https://doc.rust-lang.org/std/str/index.html)
- [Rust std::ffi Documentation](https://doc.rust-lang.org/std/ffi/index.html)

### Recommended Crates

- `unicode-segmentation`: Unicode grapheme cluster handling
- `unicode-normalization`: Unicode normalization
- `regex`: Regular expressions
- `aho-corasick`: Efficient multi-pattern string matching
- `memchr`: Efficient byte searching

### In-Depth Articles

- [String vs &str in Rust](https://blog.thoughtram.io/string-vs-str-in-rust/)
- [Working with Strings in Rust](https://fasterthanli.me/articles/working-with-strings-in-rust)
- [UTF-8 Everywhere](https://utf8everywhere.org/)

## Summary

While Rust's string system may seem complex at first, its design addresses real-world problems:

1. **`String` and `&str`** are the most commonly used types
   - `String` for scenarios requiring ownership or modification
   - `&str` for read-only access, preferred for function parameters

2. **UTF-8** is the foundation of Rust strings
   - Understanding variable-length encoding is crucial for correct string handling
   - Use `chars()` to iterate over characters, `bytes()` to iterate over bytes

3. **Performance optimization** keys
   - Use `with_capacity` for pre-allocation
   - Avoid unnecessary `clone()` and `to_string()`
   - Use `Cow<str>` to optimize scenarios where modification may or may not be needed

4. **OsString/CString** for system interoperability
   - File paths use `Path`/`OsStr`
   - C FFI uses `CString`/`CStr`

Master these concepts, and you'll be able to handle various string scenarios efficiently and safely in Rust.
