---
title: Swift Closures Comprehensive Guide
description: "Master Swift closures: syntax, capturing, escaping, autoclosures, and advanced patterns for functional programming"
track: swift
section: basics
difficulty: intermediate
tags:
  - closures
  - functional programming
  - memory management
  - escaping
  - autoclosure
status: imported
origin: old/src/content/docs/swift/closures.en.md
divergence: 0.174
issues:
  - missing-subcategory-en
legacy:
  category: Swift
  subcategory: ""
  order: 10
  lastUpdated: 2026-01-07
---

Closures are one of the most powerful and essential features in Swift, forming the backbone of functional programming patterns and enabling elegant solutions for callbacks, completion handlers, and data transformations. This comprehensive guide takes you from fundamental concepts to advanced closure techniques used in production code.

## Concept Explanation

### What Are Closures?

Closures are self-contained blocks of functionality that can be passed around and used in your code. They capture and store references to any constants and variables from the context in which they are defined—a concept known as *closing over* those values.

Swift closures are equivalent to:
- **Blocks** in C and Objective-C
- **Lambdas** in languages like Python, Java, and JavaScript
- **Anonymous functions** in JavaScript
- **Function pointers** in C

### The Three Forms of Closures

Swift recognizes three forms of closures, each serving different purposes:

**1. Global Functions**
Named closures that don't capture any values. They exist at the module level and are the simplest form.

```swift
func greet(name: String) -> String {
    return "Hello, \(name)!"
}
```

**2. Nested Functions**
Named closures defined inside other functions. They can capture values from their enclosing scope.

```swift
func makeGreeter() -> (String) -> String {
    func greet(name: String) -> String {
        return "Hello, \(name)!"
    }
    return greet
}
```

**3. Closure Expressions**
Unnamed closures written in lightweight syntax. They capture values from their surrounding context and are the most commonly used form in Swift code.

```swift
let greetClosure = { (name: String) -> String in
    return "Hello, \(name)!"
}
```

### Why Closures Matter

Closures enable:
- **Functional programming patterns** like map, filter, reduce
- **Asynchronous programming** with completion handlers
- **Event handling** in UI frameworks
- **Lazy evaluation** of expressions
- **Data encapsulation** with captured context

## Core Principles

### Closure Expression Syntax

The complete syntax for closure expressions follows this pattern:

```swift
{ (parameters) -> ReturnType in
    statements
}
```

**Components breakdown:**
- Opening brace `{`
- Parameter list `(parameters)` with types
- Return type `-> ReturnType`
- `in` keyword separates signature from body
- Closure body statements
- Closing brace `}`

### Type Inference and Simplification

Swift's powerful type inference allows reducing closure verbosity:

```swift
let names = ["Chris", "Alex", "Ewa", "Barry", "Daniella"]

// Full explicit syntax
let sorted1 = names.sorted(by: { (s1: String, s2: String) -> Bool in
    return s1 > s2
})

// Omit parameter types and return type (inferred)
let sorted2 = names.sorted(by: { s1, s2 in
    return s1 > s2
})

// Implicit return from single expression
let sorted3 = names.sorted(by: { s1, s2 in s1 > s2 })

// Shorthand parameter names
let sorted4 = names.sorted(by: { $0 > $1 })

// Operator method
let sorted5 = names.sorted(by: >)
```

Each form is equivalent; choose based on context and clarity.

### Capturing Values

Closures capture references to variables and constants from their defining scope. This is fundamental to closure behavior.

**By-Reference Capture (Default)**
```swift
var counter = 0

let increment = {
    counter += 1
}

increment() // counter is now 1
counter = 10
increment() // counter is now 11
```

**By-Value Capture (Using Capture Lists)**
```swift
var counter = 0

let capture = { [counter] in
    // counter is captured as value, creates immutable copy
    print(counter) // Captured value won't change
}

counter = 10
capture() // Prints 0, not 10
```

### Reference Types

Closures are reference types, meaning when assigned to multiple variables, they reference the same closure instance:

```swift
let incrementByTen = makeIncrementer(forIncrement: 10)
let alsoIncrement = incrementByTen

print(incrementByTen())   // 10
print(alsoIncrement())    // 20 (shares same captured state)
```

### Escaping vs Non-Escaping

**Non-escaping closures** (default):
- Called within the function before it returns
- Can use implicit `self` in methods
- More optimizable

**Escaping closures** (with `@escaping`):
- Called after the function returns
- Must explicitly reference `self`
- Stored for later use

```swift
// Non-escaping - must be called immediately
func process(completion: () -> Void) {
    completion() // Called before return
}

// Escaping - called after return
func setupHandler(completion: @escaping () -> Void) {
    DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
        completion() // Called after return
    }
}
```

## Key Points

### Essential Closure Concepts

**1. Closure syntax has multiple forms**
- Start simple and concise, increasing complexity as needed
- Use shorthand syntax for readability in most cases
- Keep explicit syntax when clarity requires it

**2. Closures capture by reference by default**
- Variables in capture list are captured by reference unless specified otherwise
- Use capture lists `[value]` to capture by value
- Critical for avoiding stale closures in async code

**3. Escaping closures require explicit self**
- Escaping closures in classes must explicitly reference `self`
- Use `[weak self]` to prevent retain cycles
- Use `[unowned self]` only when you're certain self won't be deallocated

**4. Autoclosures enable lazy evaluation**
- `@autoclosure` attribute allows passing expressions as closures
- Expression is automatically wrapped in a closure
- No parentheses needed at call site

**5. Trailing closures improve readability**
- Place closure after function parentheses as last argument
- Omit parentheses if closure is the only argument
- Multiple trailing closures supported in Swift 5.3+

**6. Higher-order functions transform collections elegantly**
- Chain `map`, `filter`, `reduce`, `compactMap`, `flatMap`
- Avoid manual loops for collection transformations
- Express intent clearly through function names

**7. Memory management is critical**
- Closures extending object lifetimes can cause retain cycles
- Always consider capture implications
- Test deinitialization with debug statements

**8. Type-safe and expressive**
- Swift infers closure types at call sites
- Compiler prevents unsafe self capture in escaping closures
- Typesafe compared to Objective-C blocks

## Code Examples

### Basic Closure Operations

**Closure assignment and invocation:**
```swift
// Simple closure
let greet = { (name: String) in
    print("Hello, \(name)!")
}

greet("Alice") // Hello, Alice!

// Closure returning value
let multiply = { (a: Int, b: Int) -> Int in
    return a * b
}

let result = multiply(4, 5) // 20
```

**Using closures with sorted:**
```swift
struct Person {
    let name: String
    let age: Int
}

let people = [
    Person(name: "Alice", age: 30),
    Person(name: "Bob", age: 25),
    Person(name: "Carol", age: 35)
]

// Sort by age descending
let sortedByAge = people.sorted { $0.age > $1.age }
// [Carol, Alice, Bob]

// Sort by name
let sortedByName = people.sorted { $0.name < $1.name }
// [Alice, Bob, Carol]
```

### Capturing Values in Closures

**Counter pattern with value capture:**
```swift
func makeIncrementer(forIncrement amount: Int) -> () -> Int {
    var runningTotal = 0

    func incrementer() -> Int {
        runningTotal += amount
        return runningTotal
    }

    return incrementer
}

let incrementByTen = makeIncrementer(forIncrement: 10)
print(incrementByTen()) // 10
print(incrementByTen()) // 20
print(incrementByTen()) // 30

// Each closure maintains separate state
let incrementBySeven = makeIncrementer(forIncrement: 7)
print(incrementBySeven()) // 7
print(incrementByTen())   // 40 (independent state)
```

**Capture list control:**
```swift
var value = 10
var list = [1, 2, 3]

// Capture by reference (default)
let captureByRef = {
    print("Ref - value: \(value), count: \(list.count)")
}

// Capture by value
let captureByValue = { [value, list] in
    print("Value - value: \(value), count: \(list.count)")
}

value = 20
list = [1, 2, 3, 4, 5]

captureByRef()    // Ref - value: 20, count: 5
captureByValue()  // Value - value: 10, count: 3
```

### Escaping and Non-Escaping Closures

**Escaping closure example:**
```swift
class DataLoader {
    var completionHandler: ((Result<String, Error>) -> Void)?

    func loadData(from url: URL, completion: @escaping (Result<String, Error>) -> Void) {
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data,
                  let string = String(data: data, encoding: .utf8) else {
                let error = NSError(domain: "Parse", code: -1)
                completion(.failure(error))
                return
            }

            completion(.success(string))
        }.resume()
    }
}

// Usage
let loader = DataLoader()
loader.loadData(from: URL(string: "https://api.example.com")!) { result in
    switch result {
    case .success(let data):
        print("Loaded: \(data)")
    case .failure(let error):
        print("Error: \(error)")
    }
}
```

**Preventing retain cycles:**
```swift
class ViewController: UIViewController {
    var api: APIClient?

    func setupWithoutLeaks() {
        api?.fetchData { [weak self] result in
            guard let self = self else { return }
            self.handleResult(result)
        }
    }

    func setupWithUnowned() {
        // Use unowned only when self's lifetime is guaranteed
        api?.fetchData { [unowned self] result in
            self.handleResult(result)
        }
    }

    func handleResult(_ result: Result<String, Error>) {
        // Process result
    }
}
```

### Autoclosures for Clean APIs

**Basic autoclosure:**
```swift
// Without autoclosure - verbose
func customAssert(_ condition: @escaping () -> Bool, _ message: @escaping () -> String) {
    #if DEBUG
    if !condition() {
        print("Assertion failed: \(message())")
    }
    #endif
}

customAssert({ 1 + 1 == 2 }, { "Math failed" })

// With autoclosure - clean
func customAssertAuto(_ condition: @autoclosure () -> Bool, _ message: @autoclosure () -> String) {
    #if DEBUG
    if !condition() {
        print("Assertion failed: \(message())")
    }
    #endif
}

customAssertAuto(1 + 1 == 2, "Math failed") // Much cleaner!
```

**Logical operators with autoclosure:**
```swift
// Custom logical AND with short-circuit evaluation
func logicalAnd(_ lhs: @autoclosure () -> Bool,
                _ rhs: @autoclosure () -> Bool) -> Bool {
    guard lhs() else { return false }  // rhs only evaluated if lhs is true
    return rhs()
}

let expensiveComputation = {
    print("Computing...")
    return true
}

logicalAnd(true, expensiveComputation()) // Still prints "Computing"

// For true short-circuiting, need both autoclosure:
func logicalAndShortCircuit(_ lhs: @autoclosure () -> Bool,
                           _ rhs: @autoclosure () -> Bool) -> Bool {
    guard lhs() else { return false }
    return rhs()
}

logicalAndShortCircuit(false, expensiveComputation())
// Doesn't print - rhs not evaluated
```

### Higher-Order Functions

**Map, Filter, Reduce chain:**
```swift
struct Product {
    let name: String
    let price: Double
    let quantity: Int
}

let products = [
    Product(name: "Laptop", price: 999, quantity: 2),
    Product(name: "Mouse", price: 25, quantity: 5),
    Product(name: "Keyboard", price: 75, quantity: 3)
]

// Calculate total revenue for expensive items
let totalRevenue = products
    .filter { $0.price > 50 }                    // Filter expensive
    .map { $0.price * Double($0.quantity) }     // Calculate revenue
    .reduce(0, +)                                // Sum all

print(totalRevenue) // 2148.0 = (999*2) + (75*3)

// Extract product names and sort
let expensiveNames = products
    .filter { $0.price > 50 }
    .map { $0.name }
    .sorted()

print(expensiveNames) // ["Keyboard", "Laptop"]
```

**CompactMap and FlatMap:**
```swift
// compactMap - removes nil values
let strings = ["1", "two", "3", "four", "5"]
let numbers = strings.compactMap { Int($0) }
// [1, 3, 5]

// flatMap - flattens nested structures
let matrix = [[1, 2, 3], [4, 5], [6, 7, 8, 9]]
let flattened = matrix.flatMap { $0 }
// [1, 2, 3, 4, 5, 6, 7, 8, 9]

// Combining transformations
let data = [["a", "b", "c"], ["1", "2"], ["x", "y", "z"]]
let transformed = data.flatMap {
    $0.map { $0.uppercased() }
}
// ["A", "B", "C", "1", "2", "X", "Y", "Z"]
```

**Custom higher-order functions:**
```swift
// Filter with index
func filterIndexed<T>(_ array: [T],
                     predicate: (T, Int) -> Bool) -> [T] {
    var result: [T] = []
    for (index, element) in array.enumerated() {
        if predicate(element, index) {
            result.append(element)
        }
    }
    return result
}

let numbers = [10, 20, 30, 40, 50]
let evenPositions = filterIndexed(numbers) { _, index in
    index % 2 == 0
}
// [10, 30, 50]

// Map with previous value
func scan<T>(_ array: [T],
             initial: T,
             transform: (T, T) -> T) -> [T] {
    var result = [initial]
    for element in array {
        result.append(transform(result.last!, element))
    }
    return result
}

let cumulative = scan([1, 2, 3, 4], initial: 0, transform: +)
// [0, 1, 3, 6, 10]
```

### Trailing Closures

**Single trailing closure:**
```swift
let numbers = [1, 2, 3, 4, 5]

// Without trailing closure syntax
let doubled = numbers.map({ $0 * 2 })

// With trailing closure (cleaner)
let doubled = numbers.map { $0 * 2 }
```

**Multiple trailing closures (Swift 5.3+):**
```swift
func animate(
    duration: TimeInterval,
    animations: () -> Void,
    completion: ((Bool) -> Void)? = nil
) {
    UIView.animate(withDuration: duration, animations: animations, completion: completion)
}

// Called with multiple trailing closures
animate(duration: 0.3) {
    // animations closure
    self.view.alpha = 0
} completion: { finished in
    // completion closure
    print("Animation finished: \(finished)")
}
```

### Practical Patterns

**Delegation replacement with closures:**
```swift
class NetworkRequest {
    var onSuccess: ((Data) -> Void)?
    var onError: ((Error) -> Void)?

    func execute(url: URL) {
        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            if let error = error {
                self?.onError?(error)
                return
            }

            if let data = data {
                self?.onSuccess?(data)
            }
        }.resume()
    }
}

// Usage
let request = NetworkRequest()
request.onSuccess = { data in
    print("Received \(data.count) bytes")
}
request.onError = { error in
    print("Failed: \(error)")
}
request.execute(url: URL(string: "https://api.example.com")!)
```

**Currying and partial application:**
```swift
// Curried function
func add(_ a: Int) -> (Int) -> Int {
    return { b in a + b }
}

let addFive = add(5)
print(addFive(3))   // 8
print(addFive(10))  // 15

// Generic currying
func curry<A, B, C>(_ function: @escaping (A, B) -> C) -> (A) -> (B) -> C {
    return { a in { b in function(a, b) } }
}

func multiply(_ a: Int, _ b: Int) -> Int {
    return a * b
}

let curriedMultiply = curry(multiply)
let triple = curriedMultiply(3)
print(triple(4)) // 12
```

**Memoization pattern:**
```swift
func memoize<Input: Hashable, Output>(_ fn: @escaping (Input) -> Output) -> (Input) -> Output {
    var cache: [Input: Output] = [:]

    return { input in
        if let cached = cache[input] {
            print("Cache hit: \(input)")
            return cached
        }

        print("Computing: \(input)")
        let result = fn(input)
        cache[input] = result
        return result
    }
}

// Fibonacci without memoization is slow
func fibonacci(_ n: Int) -> Int {
    guard n > 1 else { return n }
    return fibonacci(n - 1) + fibonacci(n - 2)
}

let memoizedFib = memoize(fibonacci)
print(memoizedFib(10)) // Computing...
print(memoizedFib(10)) // Cache hit
```

## Best Practices

### Prefer Trailing Closure Syntax

```swift
// Avoid - parentheses unnecessary
let result = numbers.map({ $0 * 2 })

// Prefer - cleaner and more readable
let result = numbers.map { $0 * 2 }
```

### Use Appropriate Syntax Level

```swift
// Simple operation - use shorthand
let doubled = numbers.map { $0 * 2 }

// Complex logic - be explicit
let filtered = numbers.filter { number in
    // Multiple conditions
    return number > 10 && number % 2 == 0
}

// Very complex - extract to function
func isValidAndEven(_ number: Int) -> Bool {
    // Detailed validation logic
    return number > 10 && number % 2 == 0 && number < 1000
}
let filtered = numbers.filter(isValidAndEven)
```

### Manage Memory Carefully

```swift
// Rule 1: Use [weak self] for escaping closures in classes
api.fetch { [weak self] data in
    guard let self = self else { return }
    self.update(data)
}

// Rule 2: Don't capture more than needed
// Avoid
var largeDictionary: [String: String] = [:]
let closure = { [largeDictionary] in  // Captures entire dict
    print(largeDictionary["key"])
}

// Better - capture only needed value
let value = largeDictionary["key"]
let closure = { [value] in
    print(value)
}

// Rule 3: Break cycles with capture lists
class Handler {
    var completion: (() -> Void)?

    func setup() {
        completion = { [weak self] in
            self?.handle()
        }
    }

    func handle() { }
}
```

### Use Capture Lists for Explicit Semantics

```swift
var counter = 0
var name = "Alice"

// Explicit about what we're capturing
let closure = { [counter, name] in
    print("\(name): \(counter)")
}

counter = 10
name = "Bob"
closure() // Prints "Alice: 0" (captured by value)

// Mixed capture
let mixed = { [weak self, counter] in
    print("Counter: \(counter), Self: \(self?.name ?? "none")")
}
```

### Prefer Escaping Closures for Async Work

```swift
// Use @escaping for any closure that might outlive the function
func loadUser(id: Int, completion: @escaping (User?) -> Void) {
    DispatchQueue.global().async {
        let user = fetchUserFromNetwork(id: id)
        DispatchQueue.main.async {
            completion(user)
        }
    }
}

// Non-escaping for immediate execution
func transform(_ items: [Int], with transformer: (Int) -> String) -> [String] {
    return items.map(transformer) // Called synchronously before return
}
```

### Avoid Unnecessary Closure Wrapping

```swift
// Unnecessary
let numbers = [1, 2, 3]
let doubled = numbers.map { n in Int($0) }  // Already Int

// Better
let doubled = numbers.map { String($0) }

// Use method reference when applicable
let strings = ["1", "2", "3"]
let numbers = strings.compactMap(Int.init)  // Cleaner than closure
```

### Document Escaping Behavior

```swift
/// Fetches user data asynchronously
/// - Parameters:
///   - userId: The user identifier
///   - completion: Called after data is fetched. This closure escapes the function.
///                Remember to use `[weak self]` to avoid retain cycles.
func fetchUser(id: Int, completion: @escaping (Result<User, Error>) -> Void) {
    // Implementation
}
```

### Test Deinitialization

```swift
class MyViewController: UIViewController {
    var apiClient: APIClient?

    func setupAPI() {
        apiClient?.fetch { [weak self] data in
            self?.handleData(data)
        }
    }

    deinit {
        print("MyViewController deallocated") // Should see this in tests
    }
}

// In tests
func testNoRetainCycle() {
    var controller: MyViewController? = MyViewController()
    controller?.setupAPI()
    controller = nil
    // Should see "MyViewController deallocated"
}
```

## Common Pitfalls

### Pitfall 1: Forgetting @escaping

```swift
// ERROR: Escaping closure captures non-escaping parameter
func fetchData(completion: () -> Void) {
    DispatchQueue.global().async {
        completion()  // Error!
    }
}

// SOLUTION: Add @escaping
func fetchData(completion: @escaping () -> Void) {
    DispatchQueue.global().async {
        completion()  // OK
    }
}
```

### Pitfall 2: Strong Reference Cycles (Retain Cycles)

```swift
// PROBLEM: Retain cycle
class ViewController: UIViewController {
    var onComplete: (() -> Void)?

    func setup() {
        onComplete = {
            self.doSomething()  // self holds onComplete, onComplete holds self
        }
    }

    func doSomething() { }

    deinit {
        print("Deallocated")  // Never called!
    }
}

// SOLUTION: Use weak self
class ViewController: UIViewController {
    var onComplete: (() -> Void)?

    func setup() {
        onComplete = { [weak self] in
            self?.doSomething()  // Safe
        }
    }

    func doSomething() { }

    deinit {
        print("Deallocated")  // Now called properly
    }
}
```

### Pitfall 3: Unexpected Capture Timing

```swift
// PROBLEM: Closure captures variable reference, not value
var value = 10

let closure = {
    print(value)  // Captures reference to value
}

value = 20
closure()  // Prints 20, not 10!

// SOLUTION: Use capture list
let closureFixed = { [value] in
    print(value)  // Captures value at creation time
}

value = 30
closureFixed()  // Prints 20
```

### Pitfall 4: Loop Variable Capture

```swift
// PROBLEM: All closures capture reference to loop variable
var handlers: [() -> Void] = []

for i in 0..<3 {
    handlers.append {
        print(i)  // All capture same reference to i
    }
}

handlers[0]()  // Prints 2, not 0!
handlers[1]()  // Prints 2, not 1!

// SOLUTION: Use capture list
var handlers: [() -> Void] = []

for i in 0..<3 {
    handlers.append { [i] in
        print(i)  // Captures value of i
    }
}

handlers[0]()  // Prints 0
handlers[1]()  // Prints 1
```

### Pitfall 5: Using Implicit Self in Escaping Closures

```swift
// ERROR: Implicit self in escaping closure
func setup(completion: @escaping () -> Void) {
    let handler = {
        self.doSomething()  // Error in escaping closure!
    }
}

// SOLUTION: Make self explicit
func setup(completion: @escaping () -> Void) {
    let handler = { [weak self] in
        self?.doSomething()  // OK
    }
}
```

### Pitfall 6: Capturing More Than Needed

```swift
// PROBLEM: Captures entire array even if only need one element
let largeArray = Array(0..<1_000_000)
let element = largeArray[500]

let closure = { [largeArray] in  // Captures entire array!
    print(element)
}

// SOLUTION: Capture only what you need
let closure = { [element] in
    print(element)
}
```

### Pitfall 7: Thread Safety with Closures

```swift
// PROBLEM: Data race
class Counter {
    private var count = 0

    func increment(completion: @escaping (Int) -> Void) {
        DispatchQueue.global().async {
            self.count += 1  // Data race - unsynchronized access
            completion(self.count)
        }
    }
}

// SOLUTION: Synchronize access
class Counter {
    private var count = 0
    private let queue = DispatchQueue(label: "counter.queue")

    func increment(completion: @escaping (Int) -> Void) {
        queue.async {
            self.count += 1  // Protected by queue
            let value = self.count
            DispatchQueue.main.async {
                completion(value)
            }
        }
    }
}
```

## Performance Considerations

### Closure Allocation

Closures have small overhead for allocation, but it's negligible in most cases:

```swift
// Performance: Closures are cheap to create
// Avoid unnecessary creation in tight loops
for item in items {
    let closure = { print(item) }  // Avoid
    process(closure)
}

// Better: Create once
let createPrinter = { (item: String) in print(item) }
for item in items {
    process(createPrinter(item))
}
```

### Capture Performance

Value captures create copies; reference captures are pointers:

```swift
// Reference capture (default, efficient)
let refCapture = { [counter] in
    // counter is reference, cheap to access
}

// Value capture (copies, slightly more overhead)
let valueCapture = { [valueCopy] in
    // valueCopy is copied value
}

// Heavy value capture can have performance impact
let heavyArray = Array(0..<1_000_000)
let closure1 = { [heavyArray] in  // Copies array
    print(heavyArray.count)
}

// Better: capture only needed value
let count = heavyArray.count
let closure2 = { [count] in
    print(count)
}
```

### Higher-Order Function Performance

Chained operations create intermediate collections:

```swift
// Creates 3 intermediate arrays
let result = numbers
    .filter { $0 > 5 }      // Creates array
    .map { $0 * 2 }         // Creates array
    .sorted()               // Creates array

// Better for large collections: use lazy
let result = numbers
    .lazy
    .filter { $0 > 5 }
    .map { $0 * 2 }
    .sorted()
```

### Escaping Closure Overhead

Escaping closures have slightly more overhead than non-escaping:

```swift
// Non-escaping can be optimized by compiler
func process(closure: (Int) -> Void) {
    // Compiler can inline and optimize
    closure(42)
}

// Escaping has more overhead
func processLater(closure: @escaping (Int) -> Void) {
    // Must be stored, harder to optimize
    DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
        closure(42)
    }
}
```

### Measuring Closure Performance

```swift
import Foundation

func measurePerformance(name: String, closure: @escaping () -> Void) {
    let start = Date()
    closure()
    let elapsed = Date().timeIntervalSince(start)
    print("\(name): \(elapsed * 1000)ms")
}

// Compare approaches
let numbers = Array(0...10_000)

measurePerformance(name: "Direct loop") {
    var sum = 0
    for n in numbers {
        if n > 5000 {
            sum += n * 2
        }
    }
}

measurePerformance(name: "Higher-order functions") {
    let _ = numbers.filter { $0 > 5000 }.map { $0 * 2 }.reduce(0, +)
}

measurePerformance(name: "Lazy evaluation") {
    let _ = numbers.lazy.filter { $0 > 5000 }.map { $0 * 2 }.reduce(0, +)
}
```

## Real-world Scenarios

### Scenario 1: API Client with Completion Handlers

```swift
class APIClient {
    enum APIError: Error {
        case invalidURL
        case networkError
        case decodingError
    }

    func fetchUsers(completion: @escaping (Result<[User], APIError>) -> Void) {
        guard let url = URL(string: "https://api.example.com/users") else {
            completion(.failure(.invalidURL))
            return
        }

        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            if error != nil {
                completion(.failure(.networkError))
                return
            }

            guard let data = data else {
                completion(.failure(.networkError))
                return
            }

            do {
                let users = try JSONDecoder().decode([User].self, from: data)
                DispatchQueue.main.async {
                    completion(.success(users))
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(.decodingError))
                }
            }
        }.resume()
    }
}

// Usage
let client = APIClient()
client.fetchUsers { result in
    switch result {
    case .success(let users):
        print("Fetched \(users.count) users")
    case .failure(let error):
        print("Error: \(error)")
    }
}
```

### Scenario 2: Debouncing Search Input

```swift
class SearchController {
    var debouncedSearch: ((String) -> Void)?

    init() {
        debouncedSearch = createDebouncedSearch(delay: 0.5)
    }

    private func createDebouncedSearch(delay: TimeInterval) -> (String) -> Void {
        var workItem: DispatchWorkItem?

        return { [weak self] query in
            workItem?.cancel()
            workItem = DispatchWorkItem {
                self?.performSearch(query)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: workItem!)
        }
    }

    private func performSearch(_ query: String) {
        print("Searching for: \(query)")
        // Actual search logic
    }
}

// Usage
let controller = SearchController()
controller.debouncedSearch?("Swift")
controller.debouncedSearch?("Swift Closures")
// Only performs last search after 0.5s delay
```

### Scenario 3: SwiftUI State Management

```swift
import SwiftUI

class UserViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var isLoading = false

    private let client = APIClient()

    func loadUsers() {
        isLoading = true

        client.fetchUsers { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false

                switch result {
                case .success(let users):
                    self?.users = users
                case .failure:
                    self?.users = []
                }
            }
        }
    }
}

struct UserListView: View {
    @StateObject var viewModel = UserViewModel()

    var body: some View {
        List {
            ForEach(viewModel.users) { user in
                Text(user.name)
            }
        }
        .onAppear {
            viewModel.loadUsers()  // Closure captures self
        }
    }
}
```

### Scenario 4: Custom Higher-Order Function for Error Handling

```swift
class RequestManager {
    func executeWithRetry<T>(
        maxAttempts: Int = 3,
        delay: TimeInterval = 1.0,
        operation: @escaping () async throws -> T,
        onSuccess: @escaping (T) -> Void,
        onError: @escaping (Error) -> Void
    ) {
        Task {
            var lastError: Error?

            for attempt in 1...maxAttempts {
                do {
                    let result = try await operation()
                    onSuccess(result)
                    return
                } catch {
                    lastError = error

                    if attempt < maxAttempts {
                        try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                    }
                }
            }

            if let error = lastError {
                onError(error)
            }
        }
    }
}

// Usage
let manager = RequestManager()
manager.executeWithRetry(
    maxAttempts: 3,
    operation: {
        try await fetchDataFromAPI()
    },
    onSuccess: { data in
        print("Success: \(data)")
    },
    onError: { error in
        print("Failed after retries: \(error)")
    }
)
```

### Scenario 5: Observable Pattern with Closures

```swift
class Observable<Value> {
    private var listeners: [(Value) -> Void] = []
    private(set) var value: Value {
        didSet {
            notifyListeners()
        }
    }

    init(_ initialValue: Value) {
        self.value = initialValue
    }

    func observe(_ listener: @escaping (Value) -> Void) {
        listeners.append(listener)
        listener(value)  // Notify immediately
    }

    private func notifyListeners() {
        listeners.forEach { $0(value) }
    }
}

// Usage
class SettingsViewModel {
    let isDarkMode = Observable(false)
    let userName = Observable("")

    func setup() {
        isDarkMode.observe { [weak self] isDark in
            self?.applyTheme(isDark: isDark)
        }

        userName.observe { [weak self] name in
            self?.updateUI(userName: name)
        }
    }

    private func applyTheme(isDark: Bool) {
        print("Theme: \(isDark ? "Dark" : "Light")")
    }

    private func updateUI(userName: String) {
        print("User: \(userName)")
    }
}
```

## Interview Points

### Common Interview Questions

**Q1: What's the difference between escaping and non-escaping closures?**

A: Non-escaping closures are called before the function returns and can implicitly reference `self`. Escaping closures are called after the function returns and require explicit `self` reference to prevent retaining the object unnecessarily. Use `@escaping` attribute for escaping closures.

```swift
// Non-escaping
func process(closure: () -> Void) {
    closure()  // Called immediately
}

// Escaping
func processLater(closure: @escaping () -> Void) {
    DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
        closure()  // Called later
    }
}
```

**Q2: Explain closure capture and how to avoid retain cycles.**

A: Closures capture references to variables from their defining scope by default. A retain cycle occurs when an object holds a closure that captures the same object. Break cycles using `[weak self]` or `[unowned self]` in the capture list:

```swift
class Handler {
    var closure: (() -> Void)?

    func setup() {
        // Creates retain cycle
        closure = { self.handle() }

        // Breaks cycle with weak self
        closure = { [weak self] in self?.handle() }
    }

    func handle() { }
}
```

**Q3: What are capture lists and when would you use them?**

A: Capture lists control how closures capture variables—by reference (default) or by value. Syntax: `{ [variable] in ... }`. Use them to:
- Capture by value to preserve snapshot of value at closure creation
- Capture `self` weakly to prevent retain cycles
- Be explicit about capture semantics for clarity

**Q4: Explain the difference between weak and unowned.**

A: Both prevent retain cycles. Use `weak` when the captured reference might become `nil` (returns optional). Use `unowned` when you're certain it won't be deallocated while the closure is active (must force-unwrap). Generally prefer `weak` for safety:

```swift
// Weak - safe, handles deallocation
closure = { [weak self] in
    guard let self = self else { return }
    self.work()
}

// Unowned - faster, dangerous if wrong
closure = { [unowned self] in
    self.work()  // Crashes if self deallocated
}
```

**Q5: What's an autoclosure and when would you use it?**

A: `@autoclosure` automatically wraps an expression in a closure, allowing clean API syntax. Useful for:
- Lazy evaluation (expression evaluated only if used)
- Clean assertion/logging APIs
- Short-circuit logical operators

```swift
func logIfDebug(_ message: @autoclosure () -> String) {
    #if DEBUG
    print(message())  // Only evaluated in debug
    #endif
}

logIfDebug("Debug message")  // Expression automatically wrapped
```

**Q6: How would you implement a simple once() function?**

A: A closure that executes only once, subsequent calls return cached result:

```swift
func once<T>(_ closure: @escaping () -> T) -> () -> T {
    var result: T?
    var executed = false

    return {
        if !executed {
            result = closure()
            executed = true
        }
        return result!
    }
}

let initialize = once {
    print("Initializing")
    return 42
}

initialize()  // Prints "Initializing", returns 42
initialize()  // Returns 42 (no print)
```

**Q7: Compare filter/map/reduce and explain what each does.**

A:
- **filter**: Returns new array with elements matching predicate
- **map**: Transforms each element to new value
- **reduce**: Combines all elements into single value

```swift
let numbers = [1, 2, 3, 4, 5]

let evens = numbers.filter { $0 % 2 == 0 }      // [2, 4]
let doubled = numbers.map { $0 * 2 }            // [2, 4, 6, 8, 10]
let sum = numbers.reduce(0) { $0 + $1 }        // 15
```

**Q8: How do you handle multiple trailing closures in Swift 5.3+?**

A: When a function has multiple closure parameters, each becomes a trailing closure with label:

```swift
func animate(
    duration: TimeInterval,
    animations: () -> Void,
    completion: ((Bool) -> Void)? = nil
) { }

animate(duration: 0.3) {
    // animations closure
} completion: { finished in
    // completion closure
}
```

### Coding Interview Challenge

**Problem: Implement a Debounce Function**

```swift
func debounce<T>(delay: TimeInterval, action: @escaping (T) -> Void) -> (T) -> Void {
    var workItem: DispatchWorkItem?

    return { input in
        workItem?.cancel()
        workItem = DispatchWorkItem {
            action(input)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: workItem!)
    }
}

// Test
let debouncedPrint = debounce(delay: 0.5) { (text: String) in
    print("Debounced: \(text)")
}

debouncedPrint("A")
debouncedPrint("AB")
debouncedPrint("ABC")
// Prints "Debounced: ABC" after 0.5 seconds
```

## Further Reading

### Official Swift Documentation

- [The Swift Programming Language - Closures](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/closures/)
- [Swift API Guidelines](https://swift.org/documentation/api-design-guidelines/)

### Related Concepts

- **Higher-Order Functions**: Functions that take or return other functions
- **Functional Programming**: Programming paradigm using functions as primary building blocks
- **Memory Management**: Understanding retain cycles and weak/unowned references
- **Async/Await**: Modern alternative to closure-based asynchronous programming
- **Combine Framework**: Reactive programming with closures and publishers

### Advanced Topics

- **Closure Capture Lists**: `[weak self]`, `[unowned self]`, mixed captures
- **Escaping Closures**: For async callbacks and stored completions
- **Autoclosures**: `@autoclosure` for lazy evaluation
- **Result Type**: `Result<Success, Failure>` for better error handling
- **Continuations**: `withCheckedThrowingContinuation` for converting callbacks to async

### Practice Resources

- Implement standard library functions (map, filter, reduce) from scratch
- Create reusable higher-order functions
- Practice avoiding retain cycles
- Refactor callback-based code to async/await
- Study SwiftUI view builders which heavily use closures

### Key Takeaways

1. **Closures are everywhere in Swift** - from collection operations to async callbacks
2. **Memory management matters** - understand capture semantics and avoid cycles
3. **Syntax varies by context** - choose clarity over brevity
4. **Multiple forms exist** - global functions, nested functions, expressions
5. **Escaping changes rules** - requires explicit self in methods
6. **Higher-order functions transform code** - prefer them over manual loops
7. **Performance is usually fine** - microoptimizations rarely needed
8. **Async/await is modern approach** - but closures still essential

Closures are fundamental to Swift programming. Master them, and you unlock the full expressiveness and power of the language.
