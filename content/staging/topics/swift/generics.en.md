---
title: Swift 泛型完全指南
description: 深入掌握 Swift 泛型编程：泛型函数、泛型类型、类型约束、where 子句、关联类型等核心概念与高级用法
track: swift
section: optionals-protocols
difficulty: advanced
tags:
  - Swift
  - 泛型
  - 类型系统
  - 类型约束
  - 关联类型
status: imported
origin: old/src/content/docs/swift/generics.en.md
divergence: 0.213
issues:
  - title-lang-en
  - title-language
legacy:
  category: Swift
  subcategory: 类型系统
  order: 4
  lastUpdated: 2026-01-07
---

Generics are one of Swift's most powerful features, allowing you to write flexible, reusable functions and types that can work with any type while maintaining complete type safety. A significant portion of the Swift standard library is built using generics, including core types like `Array`, `Dictionary`, `Set`, and `Optional`.

## Concept Explanation

### What Are Generics?

Generics are a programming paradigm of **parameterized types**. They allow you to define functions, types, or protocols without specifying concrete types in advance, using a placeholder (type parameter) instead. When actually used, this placeholder is replaced by a concrete type.

Consider a practical scenario: you need to write a function that swaps two values.

```swift
// Without generics - need to write separate functions for each type
func swapTwoInts(_ a: inout Int, _ b: inout Int) {
    let temp = a
    a = b
    b = temp
}

func swapTwoStrings(_ a: inout String, _ b: inout String) {
    let temp = a
    a = b
    b = temp
}

func swapTwoDoubles(_ a: inout Double, _ b: inout Double) {
    let temp = a
    a = b
    b = temp
}

// Using generics - one function works for all types
func swapTwoValues<T>(_ a: inout T, _ b: inout T) {
    let temp = a
    a = b
    b = temp
}
```

In the generic version above, `T` is a **type parameter**. It doesn't represent a specific type, but rather a placeholder meaning "some type". When you call this function, Swift automatically infers the concrete type of `T` based on the arguments passed.

### Problems Generics Solve

1. **Code Duplication**: Without generics, you need to write nearly identical code for different types
2. **Type Safety**: Using `Any` loses type information, while generics maintain complete type safety
3. **Abstraction Power**: Generics allow you to write more abstract, more general code
4. **Performance Optimization**: Swift generics are specialized at compile time, incurring no runtime overhead

### Historical Background

Swift has supported generics since version 1.0. As the language evolved, the generics system has been continuously enhanced:

- **Swift 2.0**: Introduced protocol extensions
- **Swift 4.0**: Improved generic constraint syntax
- **Swift 5.1**: Introduced opaque types (`some`)
- **Swift 5.6**: Introduced existential types (`any`)
- **Swift 5.7**: Introduced primary associated types

## Core Principles

### Type Parameters and Type Inference

The core of Swift generics is **type parameters**. Type parameters are declared using angle brackets `<>` and can be used in function signatures and type definitions.

```swift
// T is a type parameter
func identity<T>(_ value: T) -> T {
    return value
}

// Explicitly specifying type
let explicitInt: Int = identity<Int>(42)

// Type inference - Swift automatically infers T as String
let inferredString = identity("Hello")
```

The Swift compiler uses **type inference** to determine the concrete type of type parameters. In most cases, you don't need to explicitly specify type parameters.

### Generic Specialization

Swift generics undergo **specialization** at compile time. This means for each concrete type used, the compiler generates a specialized version of the code.

```swift
// The compiler may generate specialized versions for the following calls
let intResult = identity(10)     // Generates Int version
let stringResult = identity("A") // Generates String version
```

This specialization mechanism ensures that generic code performs comparably to handwritten type-specific code.

### Type Erasure and Runtime

Although Swift generics are specialized at compile time, in certain situations (such as when using protocol types), **type erasure** is needed. Type erasure loses some type information but allows more flexible runtime behavior.

```swift
// Existential types use type erasure
let animals: [any Animal] = [Dog(), Cat()]

// Opaque types preserve type information
func makeAnimal() -> some Animal {
    return Dog() // Compiler knows the concrete type
}
```

## Key Points

### Basic Generic Syntax

| Concept | Syntax | Description |
|---------|--------|-------------|
| Type Parameter | `<T>` | Declares a type placeholder |
| Multiple Type Parameters | `<T, U, V>` | Declares multiple type placeholders |
| Type Constraint | `<T: Protocol>` | Restricts type to conform to a protocol |
| where Clause | `where T: Equatable` | More complex constraint conditions |
| Associated Type | `associatedtype Item` | Type placeholder in protocols |

### Naming Conventions

- Single type parameters typically use `T` (abbreviation for Type)
- Multiple type parameters use `T`, `U`, `V` or meaningful names
- Key-value pairs use `Key`, `Value`
- Elements use `Element`
- Collections use `Collection`

## Code Examples

### Generic Functions

Generic functions are the most basic form of generic application.

```swift
// Basic generic function
func makeArray<T>(repeating item: T, count: Int) -> [T] {
    var result: [T] = []
    for _ in 0..<count {
        result.append(item)
    }
    return result
}

let threeInts = makeArray(repeating: 42, count: 3)      // [42, 42, 42]
let fourStrings = makeArray(repeating: "Hi", count: 4) // ["Hi", "Hi", "Hi", "Hi"]

// Multiple type parameters
func combine<T, U>(_ first: T, _ second: U) -> (T, U) {
    return (first, second)
}

let pair = combine("age", 25) // ("age", 25)

// Return type inference
func first<T>(of array: [T]) -> T? {
    return array.isEmpty ? nil : array[0]
}

let firstNumber = first(of: [1, 2, 3]) // Optional(1)
let firstChar = first(of: ["a", "b"])  // Optional("a")
```

### Generic Types

Generic types allow you to define custom types that work with any type.

```swift
// Generic stack structure
struct Stack<Element> {
    private var items: [Element] = []

    var isEmpty: Bool {
        return items.isEmpty
    }

    var count: Int {
        return items.count
    }

    var top: Element? {
        return items.last
    }

    mutating func push(_ item: Element) {
        items.append(item)
    }

    mutating func pop() -> Element? {
        return items.isEmpty ? nil : items.removeLast()
    }
}

// Using a generic stack
var intStack = Stack<Int>()
intStack.push(1)
intStack.push(2)
intStack.push(3)
print(intStack.pop()!) // 3

var stringStack = Stack<String>()
stringStack.push("Swift")
stringStack.push("Generics")
print(stringStack.top!) // Generics

// Generic class
class Box<Content> {
    var content: Content

    init(_ content: Content) {
        self.content = content
    }

    func map<NewContent>(_ transform: (Content) -> NewContent) -> Box<NewContent> {
        return Box<NewContent>(transform(content))
    }
}

let intBox = Box(42)
let stringBox = intBox.map { "Value: \($0)" }
print(stringBox.content) // Value: 42

// Generic enum
enum Result<Success, Failure: Error> {
    case success(Success)
    case failure(Failure)

    func map<NewSuccess>(_ transform: (Success) -> NewSuccess) -> Result<NewSuccess, Failure> {
        switch self {
        case .success(let value):
            return .success(transform(value))
        case .failure(let error):
            return .failure(error)
        }
    }
}
```

### Type Constraints

Type constraints are used to restrict the conditions that type parameters must satisfy.

```swift
// Single constraint - T must conform to Comparable protocol
func findMin<T: Comparable>(_ array: [T]) -> T? {
    guard !array.isEmpty else { return nil }
    return array.min()
}

print(findMin([3, 1, 4, 1, 5])!) // 1
print(findMin(["cherry", "apple", "banana"])!) // apple

// Single constraint - T must conform to Hashable protocol
func removeDuplicates<T: Hashable>(from array: [T]) -> [T] {
    var seen = Set<T>()
    return array.filter { seen.insert($0).inserted }
}

print(removeDuplicates(from: [1, 2, 2, 3, 1])) // [1, 2, 3]

// Multiple constraints using &
func processAndSort<T: Hashable & Comparable>(_ items: [T]) -> [T] {
    return Array(Set(items)).sorted()
}

print(processAndSort([3, 1, 4, 1, 5, 9, 2, 6])) // [1, 2, 3, 4, 5, 6, 9]

// Class constraint - T must be a subclass of a specific class
class Animal {
    var name: String
    init(name: String) { self.name = name }
}

class Dog: Animal {
    func bark() { print("Woof!") }
}

func printAnimalName<T: Animal>(_ animal: T) {
    print(animal.name)
}

let dog = Dog(name: "Buddy")
printAnimalName(dog) // Buddy
```

### where Clauses

The where clause provides more powerful and flexible constraint capabilities.

```swift
// Basic where clause
func allItemsMatch<C1: Collection, C2: Collection>(
    _ collection1: C1,
    _ collection2: C2
) -> Bool where C1.Element == C2.Element, C1.Element: Equatable {
    guard collection1.count == collection2.count else {
        return false
    }

    for (item1, item2) in zip(collection1, collection2) {
        if item1 != item2 {
            return false
        }
    }

    return true
}

let array1 = [1, 2, 3]
let array2 = [1, 2, 3]
print(allItemsMatch(array1, array2)) // true

// where clause in extensions
extension Stack where Element: Equatable {
    func contains(_ item: Element) -> Bool {
        return items.contains(item)
    }
}

extension Stack where Element: Numeric {
    var sum: Element {
        return items.reduce(0, +)
    }
}

var numStack = Stack<Int>()
numStack.push(10)
numStack.push(20)
numStack.push(30)
print(numStack.sum) // 60

// Complex where constraints
protocol Container {
    associatedtype Item
    var count: Int { get }
    subscript(i: Int) -> Item { get }
}

func compareContainers<C1: Container, C2: Container>(
    _ c1: C1,
    _ c2: C2
) -> Bool where C1.Item == C2.Item, C1.Item: Comparable {
    guard c1.count == c2.count else { return false }

    for i in 0..<c1.count {
        if c1[i] < c2[i] {
            return true
        } else if c1[i] > c2[i] {
            return false
        }
    }
    return true // Equal
}

// where clause for methods
extension Array {
    func allSatisfy<T>(where predicate: (Element) -> T?) -> [T] {
        return compactMap(predicate)
    }
}

extension Collection {
    // Only provides sorted method when elements are comparable
    func customSorted() -> [Element] where Element: Comparable {
        return sorted()
    }
}
```

### Associated Types

Associated types are generics in protocols, providing type placeholder capability for protocols.

```swift
// Basic associated type
protocol Queue {
    associatedtype Element

    var isEmpty: Bool { get }
    var count: Int { get }

    mutating func enqueue(_ element: Element)
    mutating func dequeue() -> Element?
    func peek() -> Element?
}

// Implementing a protocol with associated types
struct ArrayQueue<T>: Queue {
    // Swift automatically infers Element as T
    private var elements: [T] = []

    var isEmpty: Bool { elements.isEmpty }
    var count: Int { elements.count }

    mutating func enqueue(_ element: T) {
        elements.append(element)
    }

    mutating func dequeue() -> T? {
        isEmpty ? nil : elements.removeFirst()
    }

    func peek() -> T? {
        elements.first
    }
}

var queue = ArrayQueue<String>()
queue.enqueue("First")
queue.enqueue("Second")
print(queue.dequeue()!) // First

// Associated type constraints
protocol SortableContainer {
    associatedtype Item: Comparable
    var items: [Item] { get set }
}

extension SortableContainer {
    mutating func sort() {
        items.sort()
    }

    func sorted() -> [Item] {
        return items.sorted()
    }
}

// where clause for associated types
protocol Sequence2 {
    associatedtype Element
    associatedtype Iterator: IteratorProtocol where Iterator.Element == Element

    func makeIterator() -> Iterator
}

// Nested associated types
protocol Graph {
    associatedtype Vertex
    associatedtype Edge: GraphEdge where Edge.Vertex == Vertex

    var vertices: [Vertex] { get }
    var edges: [Edge] { get }
}

protocol GraphEdge {
    associatedtype Vertex
    var from: Vertex { get }
    var to: Vertex { get }
}

// Primary associated types (Swift 5.7+)
protocol DataStore<Element> {
    associatedtype Element

    func save(_ element: Element) throws
    func load(id: String) throws -> Element?
    func delete(id: String) throws
}

// Using primary associated types
func createUserStore() -> some DataStore<User> {
    return MemoryStore<User>()
}

struct User {
    let id: String
    let name: String
}

struct MemoryStore<T>: DataStore {
    private var storage: [String: T] = [:]

    func save(_ element: T) throws {
        // Implement save logic
    }

    func load(id: String) throws -> T? {
        return storage[id]
    }

    func delete(id: String) throws {
        // Implement delete logic
    }
}
```

### Generic Subscripts

Swift supports generic subscripts, enabling very flexible access patterns.

```swift
// Generic subscript
struct JSON {
    private var data: [String: Any]

    init(_ data: [String: Any]) {
        self.data = data
    }

    // Generic subscript
    subscript<T>(key: String) -> T? {
        return data[key] as? T
    }

    // Generic subscript with default value
    subscript<T>(key: String, default defaultValue: T) -> T {
        return (data[key] as? T) ?? defaultValue
    }
}

let json = JSON(["name": "Swift", "version": 5.9, "isAwesome": true])
let name: String? = json["name"]           // Optional("Swift")
let version: Double? = json["version"]     // Optional(5.9)
let missing: Int = json["count", default: 0] // 0

// Dynamic member lookup combined with generics
@dynamicMemberLookup
struct DynamicJSON {
    private var data: [String: Any]

    init(_ data: [String: Any]) {
        self.data = data
    }

    subscript<T>(dynamicMember key: String) -> T? {
        return data[key] as? T
    }
}

let dynamicJSON = DynamicJSON(["title": "Hello", "count": 42])
let title: String? = dynamicJSON.title  // Optional("Hello")
let count: Int? = dynamicJSON.count     // Optional(42)
```

### Recursive Generics

Generic types can reference themselves in their definitions, creating recursive data structures.

```swift
// Binary tree
indirect enum BinaryTree<Element> {
    case empty
    case node(Element, left: BinaryTree, right: BinaryTree)

    // Traversal
    func inorderTraversal() -> [Element] {
        switch self {
        case .empty:
            return []
        case .node(let value, let left, let right):
            return left.inorderTraversal() + [value] + right.inorderTraversal()
        }
    }

    // Search
    func contains(_ element: Element) -> Bool where Element: Equatable {
        switch self {
        case .empty:
            return false
        case .node(let value, let left, let right):
            return value == element || left.contains(element) || right.contains(element)
        }
    }
}

let tree: BinaryTree<Int> = .node(
    5,
    left: .node(3, left: .node(1, left: .empty, right: .empty), right: .empty),
    right: .node(8, left: .empty, right: .node(10, left: .empty, right: .empty))
)

print(tree.inorderTraversal()) // [1, 3, 5, 8, 10]
print(tree.contains(3)) // true

// Linked list
class LinkedList<Element> {
    class Node {
        var value: Element
        var next: Node?

        init(_ value: Element) {
            self.value = value
        }
    }

    private var head: Node?
    private var tail: Node?

    var isEmpty: Bool { head == nil }

    func append(_ value: Element) {
        let newNode = Node(value)
        if let tail = tail {
            tail.next = newNode
        } else {
            head = newNode
        }
        tail = newNode
    }

    func toArray() -> [Element] {
        var result: [Element] = []
        var current = head
        while let node = current {
            result.append(node.value)
            current = node.next
        }
        return result
    }
}

extension LinkedList: Sequence {
    func makeIterator() -> AnyIterator<Element> {
        var current = head
        return AnyIterator {
            guard let node = current else { return nil }
            current = node.next
            return node.value
        }
    }
}
```

## Best Practices

### Prefer Type Inference

Let the Swift compiler infer types for cleaner code.

```swift
// Recommended: Leverage type inference
let numbers = [1, 2, 3].map { $0 * 2 }
let stack = Stack<Int>() // Must be explicit

// Not recommended: Unnecessary type annotations
let numbers: [Int] = [1, 2, 3].map { (x: Int) -> Int in x * 2 }
```

### Use Meaningful Type Parameter Names

For complex generics, use descriptive type parameter names.

```swift
// Recommended: Descriptive names
protocol Repository<Entity, ID> {
    associatedtype Entity
    associatedtype ID: Hashable

    func find(by id: ID) -> Entity?
    func save(_ entity: Entity)
}

// T is fine for simple scenarios
func identity<T>(_ value: T) -> T { value }
```

### Add Type Constraints Appropriately

Only add necessary constraints; avoid over-constraining.

```swift
// Recommended: Only add necessary constraints
func findMax<T: Comparable>(_ array: [T]) -> T? {
    return array.max()
}

// Over-constrained
func findMax<T: Comparable & Hashable & Codable>(_ array: [T]) -> T? {
    return array.max() // Hashable and Codable are completely unnecessary
}
```

### Use Protocol Extensions to Provide Default Implementations

```swift
protocol Printable {
    var description: String { get }
}

extension Printable {
    var description: String {
        return String(describing: self)
    }

    func print() {
        Swift.print(description)
    }
}
```

### Choose the Right Level of Generic Abstraction

```swift
// Too specific
func processIntArray(_ array: [Int]) -> [Int] { ... }

// Too abstract
func processAnything<T>(_ value: T) -> T { ... }

// Appropriate abstraction
func processNumericArray<T: Numeric>(_ array: [T]) -> [T] { ... }
```

### Use Generic Type Aliases to Simplify Complex Types

```swift
// Complex type
let handler: (Result<[User], NetworkError>) -> Void

// Simplified using type aliases
typealias NetworkResult<T> = Result<T, NetworkError>
typealias Handler<T> = (NetworkResult<T>) -> Void

let handler: Handler<[User]>
```

## Common Pitfalls

### Confusing Generics with Any/AnyObject

```swift
// Wrong: Using Any loses type information
func wrongProcess(_ items: [Any]) -> Any {
    return items.first! // Returns Any, requires forced type casting
}

// Correct: Using generics maintains type safety
func correctProcess<T>(_ items: [T]) -> T? {
    return items.first // Returns T?, type safe
}
```

### Protocol as Type vs Generic Constraint

```swift
protocol Drawable {
    func draw()
}

// Protocol as type (existential type) - has performance overhead
func drawAll(shapes: [any Drawable]) {
    shapes.forEach { $0.draw() } // Dynamic dispatch
}

// Generic constraint - compile-time optimization
func drawAll<T: Drawable>(shapes: [T]) {
    shapes.forEach { $0.draw() } // May use static dispatch
}

// But the generic version requires all elements to be the same type
// let shapes: [any Drawable] = [Circle(), Square()] // OK
// let shapes: [T] = [Circle(), Square()] // Error, T cannot be both Circle and Square
```

### Type Erasure Issues with Associated Types

```swift
protocol Container {
    associatedtype Item
    var items: [Item] { get }
}

// Wrong: Cannot directly use a protocol with associated types as a type
// var containers: [Container] = [] // Compile error

// Correct approach 1: Use existential types (Swift 5.7+)
var containers: [any Container] = []

// Correct approach 2: Use a type-erased wrapper
struct AnyContainer<T>: Container {
    typealias Item = T
    var items: [T]

    init<C: Container>(_ container: C) where C.Item == T {
        self.items = container.items
    }
}
```

### Over-Genericization

```swift
// Over-genericized - unnecessary
func add<T: Numeric>(_ a: T, _ b: T) -> T {
    return a + b
}

// Using concrete types may be clearer
func add(_ a: Int, _ b: Int) -> Int {
    return a + b
}

// But for scenarios that truly need multi-type support, generics are the right choice
func sum<T: Numeric>(_ numbers: [T]) -> T {
    return numbers.reduce(0, +)
}
```

### Generic Method Override Issues

```swift
class Base {
    func process<T>(_ value: T) {
        print("Base: \(value)")
    }
}

class Derived: Base {
    // Note: This is not an override, but an overload
    override func process<T>(_ value: T) {
        print("Derived: \(value)")
    }
}

// Generic methods cannot be truly overridden
// The subclass's generic method is actually an independent method
```

### Confusing Self with Generics

```swift
protocol Copyable {
    func copy() -> Self // Returns the conforming type itself
}

// Self is not a generic parameter, but a placeholder for the conforming type
struct Document: Copyable {
    var content: String

    func copy() -> Document { // Must return Document
        return Document(content: content)
    }
}
```

## Performance Considerations

### Compile-Time Specialization

One of the main advantages of Swift generics is compile-time specialization. The compiler generates specialized code for each concrete type used.

```swift
// The compiler may generate specialized versions for the following calls
let intSum = sum([1, 2, 3])         // Int specialized version
let doubleSum = sum([1.0, 2.0, 3.0]) // Double specialized version

func sum<T: Numeric>(_ numbers: [T]) -> T {
    return numbers.reduce(0, +)
}
```

### Generics vs Protocol Types

```swift
// Generic version - static dispatch, better performance
func processGeneric<T: Drawable>(_ item: T) {
    item.draw() // Call target determined at compile time
}

// Protocol type - dynamic dispatch, has performance overhead
func processProtocol(_ item: any Drawable) {
    item.draw() // Call target determined at runtime
}

// In benchmarks, the generic version is typically 2-10x faster
```

### Avoiding Unnecessary Boxing

```swift
// Avoid boxing value types as Any
// Bad: Boxing occurs
var items: [Any] = [1, 2, 3]

// Good: Use generics directly
var items: [Int] = [1, 2, 3]

// Or use a generic container
struct Container<T> {
    var items: [T]
}
```

### Inlining and Optimization

Using `@inlinable` can help optimize generic code across modules.

```swift
@inlinable
public func fastMap<T, U>(_ array: [T], _ transform: (T) -> U) -> [U] {
    var result: [U] = []
    result.reserveCapacity(array.count)
    for item in array {
        result.append(transform(item))
    }
    return result
}
```

### Reducing Generic Instantiations

```swift
// Bad: Every combination generates new code
struct Wrapper<A, B, C, D> {
    var a: A
    var b: B
    var c: C
    var d: D
}

// Good: Reduce the number of type parameters
struct Wrapper<T> {
    var value: T
}

// Or use type erasure to reduce instantiations
protocol AnyWrapper {
    var anyValue: Any { get }
}
```

## Practical Scenarios

### Scenario 1: Generic Network Layer

```swift
// API response protocol
protocol APIResponse: Decodable {
    associatedtype Data: Decodable
    var data: Data { get }
    var success: Bool { get }
    var message: String? { get }
}

// Generic response structure
struct Response<T: Decodable>: APIResponse {
    typealias Data = T
    let data: T
    let success: Bool
    let message: String?
}

// Generic network client
class NetworkClient {
    private let session: URLSession
    private let decoder: JSONDecoder

    init(session: URLSession = .shared) {
        self.session = session
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
    }

    func request<T: Decodable>(
        _ endpoint: String,
        method: String = "GET",
        body: Encodable? = nil
    ) async throws -> T {
        guard let url = URL(string: endpoint) else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method

        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              200..<300 ~= httpResponse.statusCode else {
            throw NetworkError.serverError
        }

        return try decoder.decode(T.self, from: data)
    }

    // Request with generic response wrapper
    func fetchResource<T: Decodable>(_ endpoint: String) async throws -> T {
        let response: Response<T> = try await request(endpoint)
        guard response.success else {
            throw NetworkError.apiError(response.message ?? "Unknown error")
        }
        return response.data
    }
}

enum NetworkError: Error {
    case invalidURL
    case serverError
    case apiError(String)
}

// Usage example
struct User: Decodable {
    let id: Int
    let name: String
    let email: String
}

let client = NetworkClient()

// Automatic return type inference
let user: User = try await client.fetchResource("/api/users/1")
let users: [User] = try await client.fetchResource("/api/users")
```

### Scenario 2: Generic Repository Pattern

```swift
// Entity protocol
protocol Entity: Identifiable, Codable {
    var id: ID { get }
}

// Generic repository protocol
protocol Repository<E> where E: Entity {
    associatedtype E: Entity

    func findById(_ id: E.ID) async throws -> E?
    func findAll() async throws -> [E]
    func save(_ entity: E) async throws -> E
    func delete(_ id: E.ID) async throws
    func exists(_ id: E.ID) async throws -> Bool
}

// Providing default implementations
extension Repository {
    func exists(_ id: E.ID) async throws -> Bool {
        return try await findById(id) != nil
    }

    func saveAll(_ entities: [E]) async throws -> [E] {
        var saved: [E] = []
        for entity in entities {
            saved.append(try await save(entity))
        }
        return saved
    }
}

// In-memory implementation
class InMemoryRepository<E: Entity>: Repository where E.ID: Hashable {
    private var storage: [E.ID: E] = [:]

    func findById(_ id: E.ID) async throws -> E? {
        return storage[id]
    }

    func findAll() async throws -> [E] {
        return Array(storage.values)
    }

    func save(_ entity: E) async throws -> E {
        storage[entity.id] = entity
        return entity
    }

    func delete(_ id: E.ID) async throws {
        storage.removeValue(forKey: id)
    }
}

// Usage
struct Product: Entity {
    let id: UUID
    var name: String
    var price: Decimal
}

let productRepo = InMemoryRepository<Product>()

let product = Product(id: UUID(), name: "iPhone", price: 999.00)
try await productRepo.save(product)

if let found = try await productRepo.findById(product.id) {
    print("Found: \(found.name)")
}
```

### Scenario 3: Generic State Machine

```swift
// State protocol
protocol State {
    associatedtype Event
    associatedtype Context

    func handle(event: Event, context: inout Context) -> (any State)?
}

// Generic state machine
class StateMachine<S: State> {
    private(set) var currentState: S
    private var context: S.Context

    init(initialState: S, context: S.Context) {
        self.currentState = initialState
        self.context = context
    }

    func send(_ event: S.Event) {
        if let nextState = currentState.handle(event: event, context: &context) as? S {
            currentState = nextState
        }
    }

    func getContext() -> S.Context {
        return context
    }
}

// Order state machine example
struct OrderContext {
    var orderId: String
    var items: [String]
    var paymentStatus: String = ""
    var shippingInfo: String = ""
}

enum OrderEvent {
    case submit
    case pay(amount: Decimal)
    case ship(carrier: String)
    case deliver
    case cancel
}

struct PendingState: State {
    func handle(event: OrderEvent, context: inout OrderContext) -> (any State)? {
        switch event {
        case .submit:
            return PaymentPendingState()
        case .cancel:
            return CancelledState()
        default:
            return nil
        }
    }
}

struct PaymentPendingState: State {
    func handle(event: OrderEvent, context: inout OrderContext) -> (any State)? {
        switch event {
        case .pay(let amount):
            context.paymentStatus = "Paid: \(amount)"
            return ShippingState()
        case .cancel:
            return CancelledState()
        default:
            return nil
        }
    }
}

struct ShippingState: State {
    func handle(event: OrderEvent, context: inout OrderContext) -> (any State)? {
        switch event {
        case .ship(let carrier):
            context.shippingInfo = "Shipped via \(carrier)"
            return DeliveredState()
        case .cancel:
            return CancelledState()
        default:
            return nil
        }
    }
}

struct DeliveredState: State {
    func handle(event: OrderEvent, context: inout OrderContext) -> (any State)? {
        return nil // Final state
    }
}

struct CancelledState: State {
    func handle(event: OrderEvent, context: inout OrderContext) -> (any State)? {
        return nil // Final state
    }
}
```

### Scenario 4: Generic Dependency Injection

```swift
// Service locator pattern
class ServiceLocator {
    static let shared = ServiceLocator()

    private var services: [String: Any] = [:]
    private var factories: [String: () -> Any] = [:]

    private init() {}

    // Register singleton
    func register<T>(_ service: T) {
        let key = String(describing: T.self)
        services[key] = service
    }

    // Register factory
    func register<T>(factory: @escaping () -> T) {
        let key = String(describing: T.self)
        factories[key] = factory
    }

    // Resolve service
    func resolve<T>() -> T? {
        let key = String(describing: T.self)

        // Prefer returning singleton
        if let service = services[key] as? T {
            return service
        }

        // Create using factory
        if let factory = factories[key] {
            return factory() as? T
        }

        return nil
    }

    // Force resolve
    func resolveRequired<T>() -> T {
        guard let service: T = resolve() else {
            fatalError("Service \(T.self) not registered")
        }
        return service
    }
}

// Property wrapper to simplify dependency injection
@propertyWrapper
struct Inject<T> {
    private var service: T?

    var wrappedValue: T {
        mutating get {
            if service == nil {
                service = ServiceLocator.shared.resolve()
            }
            guard let service = service else {
                fatalError("Service \(T.self) not registered")
            }
            return service
        }
    }

    init() {}
}

// Usage example
protocol Logger {
    func log(_ message: String)
}

struct ConsoleLogger: Logger {
    func log(_ message: String) {
        print("[LOG] \(message)")
    }
}

// Register service
ServiceLocator.shared.register(ConsoleLogger() as Logger)

// Using dependency injection
class UserService {
    @Inject var logger: Logger

    func createUser(name: String) {
        logger.log("Creating user: \(name)")
    }
}
```

## Interview Key Points

### Common Interview Questions

**Q1: What are generics? Why use generics?**

Generics are a programming mechanism for parameterized types, allowing you to write code that works with multiple types. Main reasons for using generics:
- Code reuse: One piece of code works for multiple types
- Type safety: Compile-time type checking, avoiding runtime errors
- Performance optimization: Compile-time specialization, no runtime overhead
- Abstraction power: Writing more general algorithms and data structures

**Q2: What's the difference between Swift generics and Objective-C generics?**

| Feature | Swift Generics | Objective-C Generics |
|---------|---------------|---------------------|
| Type Safety | Complete compile-time checking | Only provides type hints |
| Runtime | Compile-time specialization | Type erasure |
| Value Type Support | Full support | Limited to object types |
| Constraint Capability | Powerful (protocols, classes, where) | Limited |

**Q3: Explain the difference between `some` and `any`**

```swift
// some (opaque type)
// - Returns a single concrete type
// - Type information determined at compile time
// - Better performance (static dispatch)
func makeShape() -> some Shape { Circle() }

// any (existential type)
// - Can hold any type conforming to the protocol
// - Type information determined at runtime
// - Has performance overhead (dynamic dispatch)
func processShape(_ shape: any Shape) { }
```

**Q4: What are associated types? How do they differ from generic parameters?**

```swift
// Associated type - used in protocols
protocol Container {
    associatedtype Item  // Determined by the conforming type
    func add(_ item: Item)
}

// Generic parameter - determined by caller
struct Box<T> {
    var value: T  // Determined by the user
}
```

Main differences:
- Associated types are determined by the type conforming to the protocol
- Generic parameters are determined by the caller/user
- Associated types are better suited for defining protocol type requirements
- Generic parameters are better suited for creating reusable types

**Q5: How to handle protocols with associated types?**

```swift
protocol DataSource {
    associatedtype Item
    func fetch() -> [Item]
}

// Method 1: Use generic constraints
func processDataSource<T: DataSource>(_ source: T) -> [T.Item] {
    return source.fetch()
}

// Method 2: Use existential types (Swift 5.7+)
func processAnyDataSource(_ source: any DataSource) {
    let items = source.fetch()
}

// Method 3: Use primary associated types
protocol DataSource2<Item> {
    associatedtype Item
    func fetch() -> [Item]
}

func processDataSource2(_ source: any DataSource2<String>) -> [String] {
    return source.fetch()
}

// Method 4: Type erasure
struct AnyDataSource<T>: DataSource {
    private let _fetch: () -> [T]

    init<D: DataSource>(_ dataSource: D) where D.Item == T {
        _fetch = { dataSource.fetch() }
    }

    func fetch() -> [T] { _fetch() }
}
```

**Q6: Explain the PECS principle in Swift**

PECS (Producer Extends, Consumer Super) is implemented in Swift through `in` and `out` (although Swift mainly uses protocol constraints rather than explicit variance declarations):

```swift
// Producer - covariant (reading)
protocol Producer {
    associatedtype Output
    func produce() -> Output
}

// Consumer - contravariant (writing)
protocol Consumer {
    associatedtype Input
    func consume(_ input: Input)
}

// In function signatures
// Parameter position is contravariant
// Return type is covariant
func process<T>(_ consumer: (T) -> Void, producer: () -> T) { }
```

### Advanced Topics

1. **Implementation principles of type erasure**
2. **Generic specialization and performance optimization**
3. **Recursive generic constraints**
4. **Combining generics with protocols**
5. **Complex applications of where clauses**
6. **Use cases for primary associated types**

## Further Reading

### Official Documentation

- [The Swift Programming Language - Generics](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/generics/)
- [Swift Standard Library - Generic Types](https://developer.apple.com/documentation/swift/swift-standard-library)
- [Swift Evolution - SE-0244: Opaque Result Types](https://github.com/apple/swift-evolution/blob/main/proposals/0244-opaque-result-types.md)
- [Swift Evolution - SE-0346: Lightweight same-type requirements](https://github.com/apple/swift-evolution/blob/main/proposals/0346-light-weight-same-type-syntax.md)

### Classic Books

- *Advanced Swift* by objc.io - In-depth coverage of generics and protocols
- *Swift in Depth* by Tjeerd in 't Veen - Practical generic use cases
- *Pro Swift* by Paul Hudson - Advanced generic techniques

### Quality Articles

- [Understanding Swift Generics](https://www.swiftbysundell.com/articles/understanding-swift-generics/)
- [Swift Generics: An In-Depth Guide](https://www.avanderlee.com/swift/generics-in-swift/)
- [Type Erasure in Swift](https://www.donnywals.com/understanding-type-erasure-in-swift/)
- [Associated Types and Self Requirements](https://khawerkhaliq.com/blog/swift-associated-types-self-requirements/)

### Related Tools

- [Swift Playground](https://developer.apple.com/swift-playgrounds/) - Interactive experimentation with generics
- [SwiftLint](https://github.com/realm/SwiftLint) - Code style checking
- [Swift Type Checker](https://swift.org/blog/new-diagnostic-arch-overview/) - Understanding type inference

---

Mastering Swift generics is an essential path to becoming an advanced Swift developer. Generics make code more flexible and reusable while maintaining complete type safety. It's recommended to start practicing with simple generic functions and gradually progress to generic types, type constraints, associated types, and other advanced features. In real projects, find a balance between flexibility and readability, avoiding over-genericization that makes code difficult to understand.
