---
title: "Rust Pin and Unpin: Memory Pinning Explained"
description: Comprehensive guide to Rust's Pin and Unpin traits for memory pinning, self-referential structs, and async/await patterns
track: rust
section: ownership-borrowing
difficulty: advanced
tags:
  - Rust
  - Pin
  - Unpin
  - memory safety
  - async
  - self-referential structs
status: imported
origin: old/src/content/docs/rust/pin.en.md
divergence: 0.137
issues:
  - order-mismatch
legacy:
  category: Rust
  subcategory: Advanced Memory Management
  order: 20
  lastUpdated: 2026-01-07
---

Pin and Unpin are two of the most misunderstood yet critically important concepts in Rust's advanced memory management. They exist to solve a specific problem that arises when building efficient async systems and self-referential data structures. Unlike lifetimes or ownership, which govern temporal validity, pinning controls whether a value can be moved in memory. We'll take a deep dive into pinning, its motivations, applications, and best practices.

---

## Concept Explanation

### What is Pin?

**Pin** is a wrapper type that prevents the wrapped value from being moved in memory. In Rust, moving a value means changing its memory address by reassigning ownership or copying. Pin explicitly prevents this operation, ensuring that the underlying value remains at the same memory location.

```rust
use std::pin::Pin;

fn main() {
    let value = 5;
    let pinned = Pin::new(&value);
    // pinned ensures value cannot be moved via this reference
}
```

### What is Unpin?

**Unpin** is a marker trait that indicates a type is safe to move even when pinned. Most Rust types implement Unpin by default. Types that implement Unpin can still be moved freely, rendering Pin's restrictions meaningless for that type.

```rust
use std::pin::Pin;

// Most types are Unpin
fn takes_unpin<T: Unpin>(p: Pin<&T>) {
    // Can safely move T even though it's pinned
}
```

### Why Pin Matters

Pin exists to solve a critical problem: **safe handling of self-referential data structures and async futures**. Consider a struct that contains a reference to one of its own fields:

```rust
// This is problematic without Pin
struct SelfRef {
    value: u32,
    ptr: *const u32,  // Points to self.value
}

impl SelfRef {
    fn new(value: u32) -> Self {
        let s = SelfRef { value, ptr: std::ptr::null() };
        // UNSAFE: Creating a self-reference
        // s
    }
}
```

If this struct is moved in memory, the pointer becomes invalid (dangling). Pin prevents the struct from being moved, ensuring the pointer remains valid.

### Pin and Futures

In async Rust, futures can yield control and resume later. Many futures are self-referential:

```rust
async fn example() {
    let data = String::from("hello");
    some_async_operation().await;  // Future may hold reference to data
}
```

When a future is pinned, it guarantees the data it references won't be moved when resumed.

---

## Core Principles

### Pin Prevents Movement

Pin is a structural wrapper that prevents the underlying value from being moved. Once pinned, you cannot access methods that take `self` by value.

```rust
use std::pin::Pin;

struct Value {
    data: u32,
}

impl Value {
    fn consume(self) {
        // Requires self by value (moves self)
    }

    fn borrow(&self) {
        // Safe to call on pinned values
    }
}

fn demonstrate_pin() {
    let value = Value { data: 42 };
    let pinned = Pin::new(&value);

    // pinned.borrow();  // OK - takes &self
    // pinned.consume(); // ERROR - requires self by value
}
```

### Unpin Makes Pin a No-op

For types implementing Unpin, Pin provides no actual restrictions. You can convert freely between `Pin<&T>` and `&T` for Unpin types.

```rust
use std::pin::Pin;

fn unpin_example<T: Unpin>(pinned: Pin<&T>) {
    let unpinned: &T = Pin::into_inner(pinned);
    // Conversion is safe for Unpin types
}
```

### Pin is Structural

Pin's behavior depends on its type parameter. `Pin<&mut T>` and `Pin<Box<T>>` have different properties:

- **`Pin<&mut T>`**: Can be unpinned if T is Unpin, but projection gives another pinned reference
- **`Pin<Box<T>>`**: Owns the data, prevents moving it from the heap

```rust
use std::pin::Pin;

fn pin_types() {
    let boxed = Box::new(5);
    let pinned_box: Pin<Box<i32>> = Pin::new(boxed);
    // Data is heap-allocated and pinned

    let value = 5;
    let pinned_ref: Pin<&i32> = Pin::new(&value);
    // Reference is pinned, but underlying value is on stack
}
```

### Variance in Pin

Pin is invariant in its type parameter, meaning `Pin<&T>` cannot be implicitly converted to `Pin<&U>` even if `T` coerces to `U`.

```rust
use std::pin::Pin;

fn invariance_example() {
    let x: Pin<&i32> = Pin::new(&5);
    // let y: Pin<&dyn std::any::Any> = x;  // ERROR - invariance violation
}
```

---

## Key Points

### Key Point 1: Pin Requires Unsafe to Create

Creating a pin for a self-referential struct requires unsafe code because you're asserting that the value won't move:

```rust
use std::pin::Pin;

unsafe fn pin_value<T>(value: T) -> Pin<Box<T>> {
    Box::pin(value)  // Safer alternative using Box::pin
}

// Better: Use Box::pin instead
fn safe_pin_value<T>(value: T) -> Pin<Box<T>> {
    Box::pin(value)  // Pin automatically set correctly
}
```

### Key Point 2: Projection and Pinning

When projecting to a field within a pinned struct, you must decide if that field should also be pinned:

```rust
use std::pin::Pin;

struct Container {
    unpin_field: u32,
    non_unpin_field: String,
}

impl Container {
    // Unpin projection: safe to unpin
    fn unpin_project(self: Pin<&mut Self>) -> &mut u32 {
        // SAFE because u32 is Unpin
        unsafe { &mut self.get_unchecked_mut().unpin_field }
    }

    // Pinned projection: field stays pinned
    fn pinned_project(self: Pin<&mut Self>) -> Pin<&mut String> {
        unsafe { Pin::map_unchecked_mut(self, |s| &mut s.non_unpin_field) }
    }
}
```

### Key Point 3: Async Requires Pin

All futures must be pinned to be polled:

```rust
use std::pin::Pin;
use std::task::{Context, Poll};
use std::future::Future;

struct MyFuture;

impl Future for MyFuture {
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        Poll::Ready(())
    }
}

fn use_future() {
    let future = MyFuture;
    let mut pinned = Box::pin(future);
    // Must use Pin to poll
}
```

### Key Point 4: Unpin is the Default

Almost all types implement Unpin automatically. Only types that need pinning (like self-referential types or generators) might not implement it:

```rust
use std::pin::Pin;
use std::marker::Unpin;

struct MustBePinned {
    self_ref: *const Self,
}

// This type does NOT implement Unpin
impl !Unpin for MustBePinned {}
```

### Key Point 5: Pin Doesn't Affect Dropping

Pin only affects movement, not dropping. A pinned value can still be dropped:

```rust
use std::pin::Pin;

fn drop_pinned<T>(pinned: Pin<Box<T>>) {
    drop(pinned);  // OK - dropping is allowed
}
```

---

## Code Examples

### Example 1: Simple Self-Referential Struct

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

struct SelfReferential {
    value: u32,
    // Pointer to self.value
    pointer: *const u32,
    _pin: PhantomPinned,
}

impl SelfReferential {
    fn new(value: u32) -> Pin<Box<Self>> {
        let s = SelfReferential {
            value,
            pointer: std::ptr::null(),
            _pin: PhantomPinned,
        };

        let mut boxed = Box::pin(s);
        let ptr = &boxed.value as *const u32;
        unsafe {
            boxed.as_mut().get_unchecked_mut().pointer = ptr;
        }
        boxed
    }

    fn get_value(&self) -> u32 {
        unsafe { *self.pointer }
    }
}

fn main() {
    let sr = SelfReferential::new(42);
    println!("Value: {}", sr.get_value());

    // sr is pinned, cannot be moved
    // let moved = *sr;  // ERROR - cannot move pinned data
}
```

### Example 2: Custom Future Implementation

```rust
use std::pin::Pin;
use std::task::{Context, Poll};
use std::future::Future;
use std::time::{Duration, Instant};

struct DelayFuture {
    deadline: Instant,
}

impl DelayFuture {
    fn new(duration: Duration) -> Self {
        DelayFuture {
            deadline: Instant::now() + duration,
        }
    }
}

impl Future for DelayFuture {
    type Output = ();

    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
        if Instant::now() >= self.deadline {
            Poll::Ready(())
        } else {
            Poll::Pending
        }
    }
}

#[tokio::main]
async fn main() {
    let delay = DelayFuture::new(Duration::from_secs(1));
    delay.await;
    println!("Delay complete!");
}
```

### Example 3: Pin Projection with Field Pinning

```rust
use std::pin::Pin;

struct Wrapper {
    pinned_field: String,
    unpinned_field: u32,
}

impl Wrapper {
    // Project to unpinned field - safe to unpin
    fn get_unpinned(self: Pin<&mut Self>) -> &mut u32 {
        unsafe { &mut self.get_unchecked_mut().unpinned_field }
    }

    // Project to pinned field - stays pinned
    fn get_pinned(self: Pin<&mut Self>) -> Pin<&mut String> {
        unsafe { Pin::map_unchecked_mut(self, |w| &mut w.pinned_field) }
    }
}

fn main() {
    let mut wrapper = Box::pin(Wrapper {
        pinned_field: String::from("hello"),
        unpinned_field: 42,
    });

    // Can mutate unpinned field without breaking pinning invariant
    *wrapper.as_mut().get_unpinned() = 100;

    // Pinned field stays pinned
    let _pinned_str = wrapper.as_mut().get_pinned();
}
```

### Example 4: Unpin and Marker Traits

```rust
use std::marker::{PhantomPinned, Unpin};
use std::pin::Pin;

// Type that must be pinned
struct MustPin {
    data: u32,
    _pin: PhantomPinned,
}

// Explicitly prevent Unpin implementation
impl !Unpin for MustPin {}

// Type that can be unpinned (default Unpin)
struct CanUnpin {
    data: u32,
}

fn require_unpin<T: Unpin>() {
    println!("Type is Unpin");
}

fn main() {
    require_unpin::<CanUnpin>();  // OK
    // require_unpin::<MustPin>();  // ERROR - doesn't implement Unpin
}
```

### Example 5: Advanced Pinning with Generators

```rust
#![feature(generators, generator_trait)]

use std::pin::Pin;
use std::ops::Generator;
use std::ops::GeneratorState;

fn main() {
    let mut gen = || {
        println!("Start");
        yield 1;
        println!("Middle");
        yield 2;
        println!("End");
        return 3;
    };

    let mut pinned = Box::pin(gen);

    loop {
        match pinned.as_mut().resume(()) {
            GeneratorState::Yielded(value) => println!("Yielded: {}", value),
            GeneratorState::Complete(value) => {
                println!("Complete: {}", value);
                break;
            }
        }
    }
}
```

---

## Best Practices

### Use `Box::pin` Over Manual Pin Creation

Always prefer `Box::pin()` to `Pin::new()` for owned values:

```rust
use std::pin::Pin;

// Good - clear intent, automatic
let pinned = Box::pin(my_value);

// Avoid - manual and error-prone
let pinned = Pin::new(&my_value);
```

### Use `PhantomPinned` for Non-Unpin Structs

Mark structs that require pinning with `PhantomPinned`:

```rust
use std::marker::PhantomPinned;

struct MustBePinned {
    data: u32,
    _pin: PhantomPinned,
}
```

### Document Pinning Requirements

Clearly document which fields require pinning:

```rust
/// A struct with self-referential fields.
///
/// # Pinning Requirements
/// This struct must be pinned to maintain invariants.
/// Use `Box::pin()` or similar to create instances.
struct SelfRef {
    value: String,
    _pin: PhantomPinned,
}
```

### Prefer `pin_mut!` Macro in Async Contexts

Use `tokio::pin!` or similar macros for convenience:

```rust
use tokio::pin;

async fn example() {
    let future = some_async_operation();
    pin!(future);
    // future is now pinned
}
```

### Be Cautious with Unsafe Pinning Operations

Always verify invariants when using `Pin::map_unchecked_mut`:

```rust
use std::pin::Pin;

// Document why this is safe
impl MyType {
    fn project(self: Pin<&mut Self>) -> Pin<&mut SomeField> {
        unsafe {
            // SAFETY: SomeField is not structurally pinned
            Pin::map_unchecked_mut(self, |s| &mut s.some_field)
        }
    }
}
```

### Use Helper Crates

Leverage pinning helpers like `pin-project` or `pin-project-lite`:

```rust
use pin_project::pin_project;

#[pin_project]
struct MyStruct {
    #[pin]
    pinned_field: String,
    unpinned_field: u32,
}
```

---

## Common Pitfalls

### Pitfall 1: Forgetting PhantomPinned

Forgetting to add `PhantomPinned` allows the struct to implement `Unpin` automatically, breaking self-referential invariants:

```rust
use std::marker::PhantomPinned;

// WRONG - will be Unpin
struct BadSelfRef {
    data: u32,
    ptr: *const u32,
}

// CORRECT
struct GoodSelfRef {
    data: u32,
    ptr: *const u32,
    _pin: PhantomPinned,
}
```

### Pitfall 2: Assuming Pin Prevents All Moves

Pin doesn't prevent moving if the type is Unpin:

```rust
use std::pin::Pin;

fn misleading_pin<T: Unpin>(pinned: Pin<&mut T>) {
    let unpinned = Pin::into_inner(pinned);
    // T can be moved freely if Unpin
}
```

### Pitfall 3: Incorrect Projection

Projecting a pinned field to unpin or vice versa without proper reasoning:

```rust
use std::pin::Pin;

struct Container {
    field: String,
}

// WRONG - projects pinned to unpin without justification
impl Container {
    fn bad_project(self: Pin<&mut Self>) -> &mut String {
        unsafe { &mut self.get_unchecked_mut().field }
    }
}
```

### Pitfall 4: Mixing Pin with Stack-Allocated Values

Pin on stack values provides no guarantee since the stack can be rearranged:

```rust
use std::pin::Pin;

fn misleading_stack_pin() {
    let mut value = 5;
    let pinned = Pin::new(&mut value);
    // Pinning a stack reference doesn't prevent moving 'value'
}
```

### Pitfall 5: Ignoring Pinning in Public APIs

Exposing constructors that bypass pinning requirements:

```rust
use std::marker::PhantomPinned;

struct Pinned {
    data: u32,
    _pin: PhantomPinned,
}

// WRONG - allows unpinned construction
impl Pinned {
    fn new(data: u32) -> Self {
        Pinned { data, _pin: PhantomPinned }
    }
}

// CORRECT - enforces pinning
impl Pinned {
    fn new(data: u32) -> Pin<Box<Self>> {
        Box::pin(Pinned { data, _pin: PhantomPinned })
    }
}
```

---

## Performance Considerations

### Runtime Overhead

Pin itself has zero runtime overhead:

```rust
use std::pin::Pin;

fn no_overhead() {
    let value = Box::pin(5);
    // Pin adds no runtime cost - it's a compile-time check
    // Size of Pin<Box<T>> == Size of Box<T>
}
```

### Boxing Costs

Using `Box::pin` incurs heap allocation costs:

```rust
use std::pin::Pin;

// Cheaper - no allocation
let stack_pinned = Pin::new(&value);

// More expensive - allocates on heap
let heap_pinned = Box::pin(value);
```

### Projection Performance

Pinned projections are compile-time operations with no runtime cost:

```rust
use std::pin::Pin;

fn cheap_projection(pinned: Pin<&mut String>) {
    let _projected = unsafe {
        Pin::map_unchecked_mut(pinned, |s| &mut s)
    };
    // Projection is zero-cost
}
```

### Async Performance Impact

Pinning is essential for efficient async in Rust and carries no overhead compared to alternatives:

```rust
async fn efficient_async() {
    // Pin is transparent in async/await
    let future = some_operation().await;
}
```

### Memory Layout

Pin doesn't change memory layout:

```rust
use std::pin::Pin;
use std::mem::size_of;

struct Value {
    data: u64,
}

assert_eq!(
    size_of::<Pin<&Value>>(),
    size_of::<&Value>()
);
```

---

## Real-world Scenarios

### Scenario 1: Building a Custom Async Runtime

```rust
use std::pin::Pin;
use std::task::{Context, Poll};
use std::future::Future;
use std::collections::VecDeque;

struct SimpleExecutor {
    tasks: VecDeque<Pin<Box<dyn Future<Output = ()>>>>,
}

impl SimpleExecutor {
    fn new() -> Self {
        SimpleExecutor {
            tasks: VecDeque::new(),
        }
    }

    fn spawn<F: Future<Output = ()> + 'static>(&mut self, future: F) {
        self.tasks.push_back(Box::pin(future));
    }

    fn run(&mut self) {
        let waker = todo!(); // Implement proper waker
        let mut cx = Context::from_waker(&waker);

        while let Some(mut future) = self.tasks.pop_front() {
            match future.as_mut().poll(&mut cx) {
                Poll::Ready(_) => {},
                Poll::Pending => self.tasks.push_back(future),
            }
        }
    }
}
```

### Scenario 2: Intrusive Data Structures

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

struct ListNode {
    value: u32,
    next: *mut ListNode,
    prev: *mut ListNode,
    _pin: PhantomPinned,
}

impl ListNode {
    fn new(value: u32) -> Pin<Box<Self>> {
        Box::pin(ListNode {
            value,
            next: std::ptr::null_mut(),
            prev: std::ptr::null_mut(),
            _pin: PhantomPinned,
        })
    }

    fn insert_after(mut self: Pin<&mut Self>, mut other: Pin<&mut Self>) {
        unsafe {
            let self_ptr = self.as_mut().get_unchecked_mut() as *mut Self;
            let other_ptr = other.as_mut().get_unchecked_mut() as *mut Self;

            other.next = self.next;
            other.prev = self_ptr;

            if !self.next.is_null() {
                (*self.next).prev = other_ptr;
            }
            self.as_mut().get_unchecked_mut().next = other_ptr;
        }
    }
}
```

### Scenario 3: Custom State Machines

```rust
use std::pin::Pin;
use std::task::{Context, Poll};
use std::future::Future;

enum StateMachine {
    Initial,
    Running { id: u32 },
    Completed(String),
}

struct StateMachineFuture {
    state: StateMachine,
}

impl Future for StateMachineFuture {
    type Output = String;

    fn poll(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
        match &mut self.state {
            StateMachine::Initial => {
                self.state = StateMachine::Running { id: 1 };
                Poll::Pending
            }
            StateMachine::Running { id } => {
                self.state = StateMachine::Completed(format!("Done: {}", id));
                Poll::Ready(format!("Result: {}", id))
            }
            StateMachine::Completed(result) => {
                Poll::Ready(result.clone())
            }
        }
    }
}
```

### Scenario 4: Token-based State Tracking

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

struct Session {
    token: String,
    data: Vec<u8>,
    _pin: PhantomPinned,
}

impl Session {
    fn new(token: String, data: Vec<u8>) -> Pin<Box<Self>> {
        Box::pin(Session {
            token,
            data,
            _pin: PhantomPinned,
        })
    }

    fn validate(self: Pin<&Self>) -> bool {
        !self.token.is_empty()
    }
}

fn manage_session() {
    let session = Session::new("token123".to_string(), vec![1, 2, 3]);
    // Session is pinned, cannot be accidentally moved during validation
    assert!(session.validate());
}
```

---

## Interview Points

### Point 1: When Would You Use Pin?

**Answer**: Pin is used when:
- Building self-referential data structures
- Implementing custom futures or async constructs
- Working with intrusive data structures (linked lists with internal pointers)
- Ensuring values don't move during their lifetime
- Building low-level async runtimes

### Point 2: What's the Difference Between Pin and References?

**Answer**:
- References prevent aliasing but allow movement
- Pin prevents movement but allows aliasing
- Together, they provide different safety guarantees

### Point 3: Why Is Unpin the Default?

**Answer**: Unpin is the default because most types don't have self-referential invariants. Making Unpin default means:
- Less boilerplate for typical code
- Pin only provides restrictions for types that need it
- Easier ergonomics for common cases

### Point 4: Can You Drop a Pinned Value?

**Answer**: Yes, dropping is allowed. Pin only prevents moving, not dropping. Once dropped, the Pin wrapper is meaningless.

### Point 5: How Does Pin Work with Async/Await?

**Answer**: In async/await:
- All futures are pinned before polling
- The compiler automatically pins futures when needed
- This allows futures to hold references across await points
- Self-referential state in futures is safe because the future can't move

### Point 6: What Happens if You Forget PhantomPinned?

**Answer**: Without `PhantomPinned`:
- The struct will implement `Unpin` automatically
- Pinning becomes ineffective
- Self-referential pointers can become dangling
- Undefined behavior becomes possible

### Point 7: Explain Pin::map_unchecked_mut

**Answer**:
`Pin::map_unchecked_mut` projects a pinned reference to a field:
- Caller asserts the field doesn't need pinning
- Requires unsafe code
- Useful for Unpin fields in pinned structures
- Incorrectly using it can break pinning invariants

### Point 8: What's the Relationship Between Pin and Variance?

**Answer**: Pin is invariant in its type parameter:
- `Pin<&T>` cannot coerce to `Pin<&U>` even if T coerces to U
- This prevents accidentally losing pinning constraints through type coercion
- Consistency with other invariant types like `&mut T`

---

## Further Reading

### Official Documentation
- [std::pin::Pin](https://doc.rust-lang.org/std/pin/)
- [std::marker::Unpin](https://doc.rust-lang.org/std/marker/trait.Unpin.html)
- [Async Await in Rust](https://rust-lang.github.io/async-book/)

### Recommended Crates
- **pin-project**: Ergonomic pinned projection
- **pin-project-lite**: Lightweight alternative to pin-project
- **tokio**: Production async runtime with pin support
- **futures**: Utilities for working with futures

### Advanced Topics
- Self-referential structs and their safety implications
- Intrusive data structures in Rust
- Custom future implementations
- Async runtime design patterns

### Related Concepts
- Lifetimes and borrow checking
- Move semantics and ownership
- Unsafe code patterns
- Future trait and async/await

### Learning Resources
1. **"The Async Rust Book"** - Official guide to async programming
2. **"Rustonomicon"** - Advanced unsafe patterns and guarantees
3. **"Pin and Unpin" talks** - Niko Matsakis' conference presentations
4. **Research papers** on linear types and move semantics

### Key Takeaways

1. **Pin prevents movement**: Use it for self-referential types and futures
2. **Unpin is the default**: Most types don't need pinning
3. **Use Box::pin**: Safest way to create pinned values
4. **Document requirements**: Always clarify pinning invariants
5. **Leverage existing tools**: Use pin-project or async runtimes instead of manual pinning
6. **Understand the why**: Pin exists to make async/await safe and efficient
7. **Avoid unsafe**: Only use Pin's unsafe operations with clear justification
8. **Pin is zero-cost**: No runtime overhead compared to alternatives

Pin and Unpin are powerful tools that enable safe, efficient async Rust and complex data structures. While they seem intimidating initially, understanding their core principle—preventing movement to maintain invariants—clarifies their purpose and usage patterns.
