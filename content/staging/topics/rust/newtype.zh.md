---
title: Newtype 模式及其应用
description: Rust 中 newtype 模式的完整指南，用于类型安全、封装和在外部类型上实现外部 trait
track: rust
section: traits-generics
difficulty: intermediate
tags:
  - Rust
  - Newtype
  - 类型安全
  - 设计模式
  - 零成本抽象
status: imported
origin: old/src/content/docs/rust/newtype.zh.md
divergence: 0.209
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Rust
  subcategory: ""
  order: 13
  lastUpdated: 2026-01-21
---

Newtype 模式将现有类型包装在单字段元组结构体中，创建具有自己身份的独特类型。这个简单的模式以零运行时成本实现类型安全、trait 实现灵活性和更好的 API 设计。

## 概念解释

Newtype 是一个具有单个字段的元组结构体，它创建一个与其内部类型不同的新类型：

```rust
// 包装 String 的 Newtype
struct Username(String);

// 包装 u64 的 Newtype
struct UserId(u64);

// 这些现在是不同的类型 - 不能混淆！
fn create_user(id: UserId, name: Username) {
    // 编译器确保我们不会意外交换这些参数
}

fn main() {
    let id = UserId(42);
    let name = Username("alice".to_string());

    create_user(id, name); // OK
    // create_user(name, id); // 编译错误！
}
```

主要好处是：
- **类型安全**：不同类型防止混淆值
- **零成本**：编译为与包装类型相同的代码
- **Trait 实现**：在外部类型上实现外部 trait
- **封装**：隐藏实现细节

## 核心原理

### 基本 Newtype 结构

```rust
// 简单 newtype
struct Meters(f64);
struct Kilometers(f64);

// 带可见性控制的 newtype
pub struct PublicId(pub u64);  // 内部值是公开的
pub struct PrivateId(u64);      // 内部值是私有的

// 带泛型的 newtype
struct Wrapper<T>(T);

// 带生命周期的 newtype
struct BorrowedStr<'a>(&'a str);

// 包装复杂类型的 newtype
struct JsonString(String);
struct EmailAddress(String);
struct Url(String);
```

### 实现 Trait

```rust
use std::fmt;
use std::ops::{Add, Deref};

struct Meters(f64);

// 实现 Display
impl fmt::Display for Meters {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} m", self.0)
    }
}

// 实现 Debug
impl fmt::Debug for Meters {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_tuple("Meters").field(&self.0).finish()
    }
}

// 实现算术运算
impl Add for Meters {
    type Output = Meters;

    fn add(self, other: Meters) -> Meters {
        Meters(self.0 + other.0)
    }
}

// 实现 From/Into 转换
impl From<f64> for Meters {
    fn from(value: f64) -> Self {
        Meters(value)
    }
}

impl From<Meters> for f64 {
    fn from(meters: Meters) -> Self {
        meters.0
    }
}

// 实现 Default
impl Default for Meters {
    fn default() -> Self {
        Meters(0.0)
    }
}

fn main() {
    let a = Meters(100.0);
    let b = Meters(50.0);

    println!("{}", a + b);     // 150 m
    println!("{:?}", a);       // Meters(100.0)

    let c: Meters = 75.0.into();
    let d: f64 = c.into();
}
```

### Deref 和 DerefMut

```rust
use std::ops::{Deref, DerefMut};

struct MyString(String);

impl Deref for MyString {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for MyString {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

fn main() {
    let mut s = MyString("Hello".to_string());

    // 可以通过 Deref 直接使用 String 方法
    println!("长度：{}", s.len());
    println!("大写：{}", s.to_uppercase());

    // 可以通过 DerefMut 修改
    s.push_str(", World!");
    println!("{}", *s);
}

// 警告：Deref 应该只用于类似智能指针的类型
// 对于其他情况，优先使用显式方法或 AsRef/AsMut
```

## 核心要点

### 孤儿规则的解决方法

```rust
// 孤儿规则：不能在外部类型上实现外部 trait
// use std::fmt::Display;
// impl Display for Vec<i32> { } // 错误！

// Newtype 让你可以绕过这个限制
struct MyVec(Vec<i32>);

impl std::fmt::Display for MyVec {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[")?;
        for (i, val) in self.0.iter().enumerate() {
            if i > 0 { write!(f, ", ")?; }
            write!(f, "{}", val)?;
        }
        write!(f, "]")
    }
}

fn main() {
    let v = MyVec(vec![1, 2, 3, 4, 5]);
    println!("{}", v); // [1, 2, 3, 4, 5]
}
```

### 类型安全的标识符

```rust
// 没有 newtype - 容易混淆 ID
// fn transfer(from: u64, to: u64, amount: u64) { ... }
// transfer(amount, from, to); // 糟糕！编译通过但是错误

// 使用 newtype - 编译时安全
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct UserId(u64);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct AccountId(u64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
struct Amount(f64);

fn transfer(from: AccountId, to: AccountId, amount: Amount) {
    println!("从 {:?} 转账 {} 到 {:?}", from, amount.0, to);
}

fn main() {
    let alice_account = AccountId(1001);
    let bob_account = AccountId(1002);
    let amount = Amount(500.0);

    transfer(alice_account, bob_account, amount); // 清晰且安全
    // transfer(amount, alice_account, bob_account); // 编译错误！
}
```

### 度量单位

```rust
use std::ops::{Add, Sub, Mul, Div};

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
struct Meters(f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
struct Seconds(f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
struct MetersPerSecond(f64);

// 实现单位转换
impl Meters {
    pub fn to_kilometers(self) -> f64 {
        self.0 / 1000.0
    }

    pub fn to_miles(self) -> f64 {
        self.0 / 1609.344
    }
}

// 实现带类型安全的算术运算
impl Add for Meters {
    type Output = Meters;
    fn add(self, rhs: Meters) -> Meters {
        Meters(self.0 + rhs.0)
    }
}

impl Sub for Meters {
    type Output = Meters;
    fn sub(self, rhs: Meters) -> Meters {
        Meters(self.0 - rhs.0)
    }
}

// 距离 / 时间 = 速度
impl Div<Seconds> for Meters {
    type Output = MetersPerSecond;
    fn div(self, rhs: Seconds) -> MetersPerSecond {
        MetersPerSecond(self.0 / rhs.0)
    }
}

// 速度 * 时间 = 距离
impl Mul<Seconds> for MetersPerSecond {
    type Output = Meters;
    fn mul(self, rhs: Seconds) -> Meters {
        Meters(self.0 * rhs.0)
    }
}

fn main() {
    let distance = Meters(1000.0);
    let time = Seconds(100.0);

    let speed = distance / time;
    println!("速度：{:?}", speed); // MetersPerSecond(10.0)

    let new_distance = speed * Seconds(200.0);
    println!("距离：{:?}", new_distance); // Meters(2000.0)

    // let invalid = distance + time; // 编译错误！
}
```

### 验证类型

```rust
#[derive(Debug, Clone)]
pub struct Email(String);

#[derive(Debug)]
pub struct EmailError(String);

impl Email {
    pub fn new(email: impl Into<String>) -> Result<Self, EmailError> {
        let email = email.into();

        if !email.contains('@') {
            return Err(EmailError("邮箱必须包含 @".to_string()));
        }

        if email.len() < 5 {
            return Err(EmailError("邮箱太短".to_string()));
        }

        // 更多验证...

        Ok(Email(email))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn domain(&self) -> &str {
        self.0.split('@').nth(1).unwrap_or("")
    }
}

#[derive(Debug, Clone)]
pub struct NonEmptyString(String);

impl NonEmptyString {
    pub fn new(s: impl Into<String>) -> Option<Self> {
        let s = s.into();
        if s.is_empty() {
            None
        } else {
            Some(NonEmptyString(s))
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, Copy)]
pub struct PositiveInt(i32);

impl PositiveInt {
    pub fn new(n: i32) -> Option<Self> {
        if n > 0 {
            Some(PositiveInt(n))
        } else {
            None
        }
    }

    pub fn get(self) -> i32 {
        self.0
    }
}

fn main() {
    let email = Email::new("user@example.com").unwrap();
    println!("域名：{}", email.domain());

    let name = NonEmptyString::new("Alice").unwrap();
    // let empty = NonEmptyString::new(""); // 返回 None

    let count = PositiveInt::new(42).unwrap();
    // let invalid = PositiveInt::new(-1); // 返回 None
}
```

## 代码示例

### 完整的带所有常用 Trait 的 Newtype

```rust
use std::fmt;
use std::str::FromStr;
use std::hash::{Hash, Hasher};
use std::cmp::Ordering;

/// 用户的唯一标识符
#[derive(Clone, Copy)]
pub struct UserId(u64);

impl UserId {
    /// 创建新的 UserId
    pub const fn new(id: u64) -> Self {
        UserId(id)
    }

    /// 返回内部值
    pub const fn get(self) -> u64 {
        self.0
    }
}

// Debug - 面向开发者的输出
impl fmt::Debug for UserId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_tuple("UserId").field(&self.0).finish()
    }
}

// Display - 面向用户的输出
impl fmt::Display for UserId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "user:{}", self.0)
    }
}

// PartialEq 和 Eq
impl PartialEq for UserId {
    fn eq(&self, other: &Self) -> bool {
        self.0 == other.0
    }
}
impl Eq for UserId {}

// PartialOrd 和 Ord
impl PartialOrd for UserId {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for UserId {
    fn cmp(&self, other: &Self) -> Ordering {
        self.0.cmp(&other.0)
    }
}

// Hash - 用于 HashMap/HashSet
impl Hash for UserId {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.0.hash(state);
    }
}

// Default
impl Default for UserId {
    fn default() -> Self {
        UserId(0)
    }
}

// From 转换
impl From<u64> for UserId {
    fn from(value: u64) -> Self {
        UserId(value)
    }
}

impl From<UserId> for u64 {
    fn from(id: UserId) -> Self {
        id.0
    }
}

// FromStr 用于解析
impl FromStr for UserId {
    type Err = std::num::ParseIntError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let s = s.strip_prefix("user:").unwrap_or(s);
        Ok(UserId(s.parse()?))
    }
}

// AsRef
impl AsRef<u64> for UserId {
    fn as_ref(&self) -> &u64 {
        &self.0
    }
}

fn main() {
    use std::collections::HashMap;

    let id1 = UserId::new(42);
    let id2: UserId = 100.into();
    let id3: UserId = "user:999".parse().unwrap();

    println!("Debug: {:?}", id1);      // Debug: UserId(42)
    println!("Display: {}", id1);      // Display: user:42

    let mut users: HashMap<UserId, String> = HashMap::new();
    users.insert(id1, "Alice".to_string());
    users.insert(id2, "Bob".to_string());

    let mut ids = vec![id3, id1, id2];
    ids.sort();
    println!("排序后：{:?}", ids);
}
```

### 用于 API 边界的 Newtype

```rust
use serde::{Deserialize, Serialize};

/// 表示用户的显示名称（1-50 个字符，无前后空白）
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct DisplayName(String);

#[derive(Debug, Clone)]
pub struct DisplayNameError {
    pub message: String,
}

impl std::fmt::Display for DisplayNameError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for DisplayNameError {}

impl DisplayName {
    pub fn new(name: impl Into<String>) -> Result<Self, DisplayNameError> {
        let name = name.into();
        let trimmed = name.trim();

        if trimmed.is_empty() {
            return Err(DisplayNameError {
                message: "显示名称不能为空".to_string(),
            });
        }

        if trimmed.len() > 50 {
            return Err(DisplayNameError {
                message: "显示名称不能超过 50 个字符".to_string(),
            });
        }

        if name != trimmed {
            return Err(DisplayNameError {
                message: "显示名称不能有前后空白".to_string(),
            });
        }

        Ok(DisplayName(name))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for DisplayName {
    type Error = DisplayNameError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        DisplayName::new(value)
    }
}

impl From<DisplayName> for String {
    fn from(name: DisplayName) -> Self {
        name.0
    }
}

impl AsRef<str> for DisplayName {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

// API 请求/响应类型使用验证过的 newtype
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub display_name: DisplayName,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: u64,
    pub display_name: DisplayName,
}

fn main() {
    // 反序列化自动验证
    let json = r#"{"display_name": "Alice", "email": "alice@example.com"}"#;
    let request: CreateUserRequest = serde_json::from_str(json).unwrap();
    println!("创建用户：{:?}", request);

    // 无效输入导致反序列化失败
    let invalid_json = r#"{"display_name": "", "email": "test@test.com"}"#;
    let result: Result<CreateUserRequest, _> = serde_json::from_str(invalid_json);
    assert!(result.is_err());
}
```

### 泛型 Newtype 模式

```rust
use std::marker::PhantomData;

// 类型级标签的幻影类型
struct Id<T>(u64, PhantomData<T>);

impl<T> Id<T> {
    pub fn new(id: u64) -> Self {
        Id(id, PhantomData)
    }

    pub fn get(&self) -> u64 {
        self.0
    }
}

impl<T> Clone for Id<T> {
    fn clone(&self) -> Self {
        Id(self.0, PhantomData)
    }
}

impl<T> Copy for Id<T> {}

impl<T> PartialEq for Id<T> {
    fn eq(&self, other: &Self) -> bool {
        self.0 == other.0
    }
}

impl<T> Eq for Id<T> {}

impl<T> std::fmt::Debug for Id<T> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Id<{}>({})", std::any::type_name::<T>(), self.0)
    }
}

// 类型标签
struct UserTag;
struct PostTag;
struct CommentTag;

// 方便使用的类型别名
type UserId = Id<UserTag>;
type PostId = Id<PostTag>;
type CommentId = Id<CommentTag>;

// 函数是类型安全的
fn get_user(id: UserId) -> String {
    format!("ID 为 {} 的用户", id.get())
}

fn get_post(id: PostId) -> String {
    format!("ID 为 {} 的文章", id.get())
}

fn main() {
    let user_id: UserId = Id::new(1);
    let post_id: PostId = Id::new(1);

    println!("{}", get_user(user_id));
    println!("{}", get_post(post_id));

    // 即使两者有相同的内部值，
    // 也不能混淆：
    // get_user(post_id); // 编译错误！
}
```

## 最佳实践

### 1. 派生常用 Trait

```rust
// 尽可能使用 derive 派生常用 trait
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
struct MyId(u64);

// 需要更多控制时，手动实现
#[derive(Clone, Copy)]
struct SecretKey([u8; 32]);

impl std::fmt::Debug for SecretKey {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "SecretKey([已隐藏])")
    }
}
```

### 2. 提供方便的构造函数

```rust
struct Temperature(f64);

impl Temperature {
    pub fn from_celsius(c: f64) -> Self {
        Temperature(c)
    }

    pub fn from_fahrenheit(f: f64) -> Self {
        Temperature((f - 32.0) * 5.0 / 9.0)
    }

    pub fn from_kelvin(k: f64) -> Self {
        Temperature(k - 273.15)
    }

    pub fn to_celsius(&self) -> f64 {
        self.0
    }

    pub fn to_fahrenheit(&self) -> f64 {
        self.0 * 9.0 / 5.0 + 32.0
    }
}
```

### 3. 为 FFI 使用 `#[repr(transparent)]`

```rust
// 确保 newtype 与包装类型具有相同的内存布局
#[repr(transparent)]
pub struct Handle(u64);

// 可以安全地传递给期望 u64 的 FFI
extern "C" {
    fn ffi_function(handle: Handle);
}
```

## 常见陷阱

### 1. 过度使用 Deref

```rust
// 不要：对一般的"包装器"行为使用 Deref
struct Wrapper(Inner);
impl Deref for Wrapper {
    type Target = Inner;
    fn deref(&self) -> &Inner { &self.0 }
}

// 应该：使用显式方法或 AsRef
struct Wrapper(Inner);
impl Wrapper {
    pub fn inner(&self) -> &Inner { &self.0 }
}
impl AsRef<Inner> for Wrapper {
    fn as_ref(&self) -> &Inner { &self.0 }
}
```

### 2. 不必要地暴露内部类型

```rust
// 不要：公开内部字段破坏封装
pub struct Email(pub String); // 任何人都可以创建无效的邮箱

// 应该：私有字段配合验证构造函数
pub struct Email(String);
impl Email {
    pub fn new(s: &str) -> Result<Self, Error> { /* 验证 */ }
    pub fn as_str(&self) -> &str { &self.0 }
}
```

### 3. 忘记实现标准 Trait

```rust
// 你经常需要的常用 trait：
// - Debug（总是需要）
// - Clone/Copy（如果内部类型支持）
// - PartialEq/Eq（用于比较）
// - Hash（用于 HashMap/HashSet）
// - Default（如果有合理的默认值）
// - Display（用于用户输出）
// - From/Into（用于转换）
// - Serialize/Deserialize（用于序列化）
```

## 性能考量

### 零成本抽象

```rust
// Newtype 没有运行时开销
struct Meters(f64);

fn use_f64(x: f64) -> f64 {
    x * 2.0
}

fn use_meters(x: Meters) -> Meters {
    Meters(x.0 * 2.0)
}

// 两者编译为相同的机器码！
// 类型检查完全在编译时发生
```

### 内存布局

```rust
use std::mem;

struct Wrapper(u64);

fn main() {
    // 与内部类型大小相同
    assert_eq!(mem::size_of::<Wrapper>(), mem::size_of::<u64>());

    // 相同的对齐
    assert_eq!(mem::align_of::<Wrapper>(), mem::align_of::<u64>());
}
```

## 面试要点

1. **定义**：创建不同类型的单字段元组结构体

2. **好处**：
   - 编译时类型安全
   - 孤儿规则解决方法
   - 零运行时成本
   - 封装

3. **常见用途**：
   - 类型安全的 ID
   - 度量单位
   - 验证字符串
   - API 边界

4. **需要实现的关键 trait**：
   - Debug、Clone、Copy
   - PartialEq、Eq、Hash
   - From、Into、FromStr
   - Display、Default

5. **`#[repr(transparent)]`**：保证与内部类型相同的布局，用于 FFI

## 延伸阅读

- [Rust 书：使用 Newtype 模式](https://doc.rust-lang.org/book/ch19-04-advanced-types.html#using-the-newtype-pattern-for-type-safety-and-abstraction)
- [Rust API 指南](https://rust-lang.github.io/api-guidelines/)
- [Typestate 模式](https://cliffle.com/blog/rust-typestate/)
- [解析，而非验证](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
