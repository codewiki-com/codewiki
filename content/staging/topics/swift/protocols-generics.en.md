---
title: Protocols and Generics
description: Complete guide to Swift protocols and generics, protocol extensions, associated types and generic constraints
track: swift
section: optionals-protocols
difficulty: intermediate
tags:
  - Swift
  - Protocols
  - Generics
  - Type Constraints
status: imported
origin: old/src/content/docs/swift/protocols-generics.en.md
divergence: 0.273
issues: []
legacy:
  category: Swift
  subcategory: Type System
  order: 3
  lastUpdated: 2026-01-07
---

Swift's type system is built on two powerful pillars: protocols and generics. Together, they enable you to write flexible, reusable, and type-safe code. We'll cover everything from basic protocol definitions to advanced generic constraints and the modern `some` and `any` keywords.

## Understanding Protocols

A protocol defines a blueprint of methods, properties, and other requirements that a conforming type must implement. Think of protocols as contracts that types agree to fulfill.

### Defining a Protocol

```swift
protocol Drawable {
    var color: String { get set }
    func draw()
}
```

This protocol requires conforming types to have a mutable `color` property and a `draw()` method.

### Protocol Conformance

Types conform to protocols by implementing all required members:

```swift
struct Circle: Drawable {
    var color: String
    var radius: Double

    func draw() {
        print("Drawing a \(color) circle with radius \(radius)")
    }
}

struct Rectangle: Drawable {
    var color: String
    var width: Double
    var height: Double

    func draw() {
        print("Drawing a \(color) rectangle: \(width) x \(height)")
    }
}
```

### Property Requirements

Protocols can require properties with specific access levels:

```swift
protocol Vehicle {
    var numberOfWheels: Int { get }        // Read-only requirement
    var currentSpeed: Double { get set }   // Read-write requirement
    static var category: String { get }    // Type property requirement
}

struct Car: Vehicle {
    let numberOfWheels = 4
    var currentSpeed: Double = 0.0
    static let category = "Automobile"
}
```

A `{ get }` requirement can be satisfied by any property (constant, variable, or computed). A `{ get set }` requirement must be satisfied by a variable property.

### Method Requirements

Protocols can require instance methods, type methods, and mutating methods:

```swift
protocol Togglable {
    mutating func toggle()
}

protocol MathOperations {
    static func add(_ a: Int, _ b: Int) -> Int
    func square() -> Int
}

enum Switch: Togglable {
    case on, off

    mutating func toggle() {
        switch self {
        case .on:
            self = .off
        case .off:
            self = .on
        }
    }
}
```

The `mutating` keyword is required for methods that modify value types (structs and enums).

### Initializer Requirements

Protocols can require specific initializers:

```swift
protocol Named {
    var name: String { get }
    init(name: String)
}

class Person: Named {
    var name: String

    required init(name: String) {
        self.name = name
    }
}
```

Classes must use `required` for protocol initializer requirements to ensure subclasses also implement them.

## Protocol Inheritance

Protocols can inherit from other protocols, building more specialized requirements:

```swift
protocol Identifiable {
    var id: String { get }
}

protocol Persistable: Identifiable {
    func save()
    func delete()
}

protocol Syncable: Persistable {
    func sync() async throws
}

struct Document: Syncable {
    let id: String
    var content: String

    func save() {
        print("Saving document \(id)")
    }

    func delete() {
        print("Deleting document \(id)")
    }

    func sync() async throws {
        print("Syncing document \(id)")
    }
}
```

## Protocol Composition

When you need a type to conform to multiple protocols, use protocol composition with the `&` operator:

```swift
protocol Codable: Encodable & Decodable {}

func saveAndPrint<T: Identifiable & CustomStringConvertible>(_ item: T) {
    print("Saving \(item.id): \(item.description)")
}

// Or as a type annotation
typealias PersistableAndDrawable = Persistable & Drawable
```

## Protocol Extensions

Protocol extensions add default implementations and additional functionality to all conforming types:

```swift
protocol Greetable {
    var name: String { get }
    func greet() -> String
}

extension Greetable {
    // Default implementation
    func greet() -> String {
        return "Hello, \(name)!"
    }

    // Additional functionality
    func formalGreet() -> String {
        return "Good day, \(name). How do you do?"
    }
}

struct Guest: Greetable {
    var name: String
    // greet() is automatically available with default implementation
}

struct VIPGuest: Greetable {
    var name: String

    // Custom implementation overrides default
    func greet() -> String {
        return "Welcome, esteemed \(name)!"
    }
}

let guest = Guest(name: "Alice")
print(guest.greet())       // "Hello, Alice!"
print(guest.formalGreet()) // "Good day, Alice. How do you do?"

let vip = VIPGuest(name: "Bob")
print(vip.greet())         // "Welcome, esteemed Bob!"
```

### Constrained Protocol Extensions

You can add extensions that only apply when certain conditions are met:

```swift
extension Collection where Element: Numeric {
    func sum() -> Element {
        reduce(0, +)
    }
}

extension Collection where Element: Equatable {
    func allEqual() -> Bool {
        guard let first = first else { return true }
        return allSatisfy { $0 == first }
    }
}

let numbers = [1, 2, 3, 4, 5]
print(numbers.sum())       // 15

let repeating = [7, 7, 7]
print(repeating.allEqual()) // true
```

## Associated Types

Associated types are placeholders for types used within a protocol. They allow protocols to be generic without using generic syntax:

```swift
protocol Container {
    associatedtype Item

    var count: Int { get }
    mutating func append(_ item: Item)
    subscript(i: Int) -> Item { get }
}

struct Stack<Element>: Container {
    // Swift infers that Item == Element
    private var items: [Element] = []

    var count: Int {
        items.count
    }

    mutating func append(_ item: Element) {
        items.append(item)
    }

    subscript(i: Int) -> Element {
        items[i]
    }

    mutating func pop() -> Element? {
        items.popLast()
    }
}

var intStack = Stack<Int>()
intStack.append(1)
intStack.append(2)
print(intStack[0]) // 1
```

### Constraining Associated Types

You can add constraints to associated types:

```swift
protocol Repository {
    associatedtype Entity: Identifiable
    associatedtype ID: Hashable

    func find(by id: ID) -> Entity?
    func save(_ entity: Entity)
    func delete(_ entity: Entity)
}

protocol ComparableContainer {
    associatedtype Item: Comparable

    var items: [Item] { get }
    func sorted() -> [Item]
}

extension ComparableContainer {
    func sorted() -> [Item] {
        items.sorted()
    }
}
```

### Where Clauses with Associated Types

For complex constraints, use `where` clauses:

```swift
protocol SuffixableContainer: Container {
    associatedtype Suffix: Container where Suffix.Item == Item
    func suffix(_ size: Int) -> Suffix
}

// Practical example: a protocol for bidirectional conversion
protocol Convertible {
    associatedtype Target
    associatedtype Source where Source.Target == Self, Target: Convertible

    func convert() -> Target
}
```

## Introduction to Generics

Generics allow you to write flexible, reusable functions and types that work with any type:

```swift
// Without generics - repetitive code
func swapInts(_ a: inout Int, _ b: inout Int) {
    let temp = a
    a = b
    b = temp
}

func swapStrings(_ a: inout String, _ b: inout String) {
    let temp = a
    a = b
    b = temp
}

// With generics - one function for all types
func swap<T>(_ a: inout T, _ b: inout T) {
    let temp = a
    a = b
    b = temp
}
```

### Generic Functions

```swift
func findIndex<T: Equatable>(of valueToFind: T, in array: [T]) -> Int? {
    for (index, value) in array.enumerated() {
        if value == valueToFind {
            return index
        }
    }
    return nil
}

let strings = ["apple", "banana", "cherry"]
if let index = findIndex(of: "banana", in: strings) {
    print("Found at index \(index)") // Found at index 1
}
```

### Generic Types

```swift
struct Queue<Element> {
    private var elements: [Element] = []

    var isEmpty: Bool {
        elements.isEmpty
    }

    var count: Int {
        elements.count
    }

    mutating func enqueue(_ element: Element) {
        elements.append(element)
    }

    mutating func dequeue() -> Element? {
        isEmpty ? nil : elements.removeFirst()
    }

    func peek() -> Element? {
        elements.first
    }
}

var queue = Queue<String>()
queue.enqueue("First")
queue.enqueue("Second")
print(queue.dequeue()!) // "First"
```

### Multiple Type Parameters

```swift
struct Pair<First, Second> {
    let first: First
    let second: Second
}

func zip<T, U>(_ array1: [T], _ array2: [U]) -> [Pair<T, U>] {
    let count = min(array1.count, array2.count)
    var result: [Pair<T, U>] = []

    for i in 0..<count {
        result.append(Pair(first: array1[i], second: array2[i]))
    }

    return result
}

let names = ["Alice", "Bob"]
let ages = [30, 25]
let pairs = zip(names, ages)
// [Pair(first: "Alice", second: 30), Pair(first: "Bob", second: 25)]
```

## Type Constraints

Type constraints specify that a generic type must conform to a protocol or inherit from a specific class:

```swift
// Protocol constraint
func findMax<T: Comparable>(_ array: [T]) -> T? {
    guard var max = array.first else { return nil }
    for element in array {
        if element > max {
            max = element
        }
    }
    return max
}

// Multiple constraints with where clause
func process<T, U>(_ item: T, with helper: U) -> String
    where T: CustomStringConvertible, U: Hashable {
    return "Item: \(item.description), Helper hash: \(helper.hashValue)"
}

// Class constraint
class Animal {}
class Dog: Animal {}

func handleAnimal<T: Animal>(_ animal: T) {
    print("Handling an animal")
}
```

### Generic Where Clauses

Where clauses provide powerful constraint expressions:

```swift
func allItemsMatch<C1: Container, C2: Container>(_ container1: C1, _ container2: C2) -> Bool
    where C1.Item == C2.Item, C1.Item: Equatable {

    guard container1.count == container2.count else { return false }

    for i in 0..<container1.count {
        if container1[i] != container2[i] {
            return false
        }
    }
    return true
}
```

### Extensions with Where Clauses

```swift
extension Stack where Element: Equatable {
    func contains(_ item: Element) -> Bool {
        for i in 0..<count {
            if self[i] == item {
                return true
            }
        }
        return false
    }
}

extension Stack where Element: CustomStringConvertible {
    var description: String {
        var result = "Stack: ["
        for i in 0..<count {
            if i > 0 { result += ", " }
            result += self[i].description
        }
        result += "]"
        return result
    }
}
```

## Opaque Types with `some`

The `some` keyword creates an opaque type that hides the concrete type while preserving type identity. The compiler knows the exact type, but callers only see the protocol.

### Basic Usage

```swift
protocol Shape {
    func area() -> Double
}

struct Square: Shape {
    var side: Double
    func area() -> Double { side * side }
}

struct Circle: Shape {
    var radius: Double
    func area() -> Double { .pi * radius * radius }
}

// Opaque return type - always returns the same concrete type
func makeShape() -> some Shape {
    Square(side: 5)
}

let shape = makeShape()
print(shape.area()) // 25.0
```

### Why Use Opaque Types?

Opaque types solve several problems:

```swift
// 1. They work with protocols that have associated types
protocol Producer {
    associatedtype Output
    func produce() -> Output
}

struct IntProducer: Producer {
    func produce() -> Int { 42 }
}

// This works with opaque types
func getProducer() -> some Producer {
    IntProducer()
}

// 2. They preserve type identity across calls
func makeSquare() -> some Shape {
    Square(side: 10)
}

let s1 = makeSquare()
let s2 = makeSquare()
// s1 and s2 are guaranteed to be the same type
```

### Opaque Types in Properties

```swift
struct ShapeFactory {
    var primaryShape: some Shape {
        Square(side: 10)
    }

    // Can use different types in different properties
    var secondaryShape: some Shape {
        Circle(radius: 5)
    }
}
```

### Opaque Parameter Types

Swift 5.7 introduced opaque parameter types:

```swift
// Instead of generic syntax
func drawShape<T: Shape>(_ shape: T) {
    print("Area: \(shape.area())")
}

// You can write
func drawShape(_ shape: some Shape) {
    print("Area: \(shape.area())")
}

// Both are equivalent, but `some` is more concise
```

## Existential Types with `any`

The `any` keyword explicitly marks existential types - types that can hold any value conforming to a protocol. Unlike opaque types, existential types can hold different concrete types.

### Basic Usage

```swift
// Existential type - can hold any Shape
var shapes: [any Shape] = [
    Square(side: 5),
    Circle(radius: 3)
]

func addShape(_ shape: any Shape, to collection: inout [any Shape]) {
    collection.append(shape)
}

addShape(Square(side: 10), to: &shapes)
```

### When to Use `any` vs `some`

```swift
// Use `some` when you want to work with a single, consistent type
func makePrimaryShape() -> some Shape {
    Square(side: 10)
}

// Use `any` when you need heterogeneous collections or dynamic dispatch
class ShapeRenderer {
    private var shapesToRender: [any Shape] = []

    func add(_ shape: any Shape) {
        shapesToRender.append(shape)
    }

    func renderAll() {
        for shape in shapesToRender {
            print("Rendering shape with area: \(shape.area())")
        }
    }
}
```

### Existential Types and Associated Types

Prior to Swift 5.7, you couldn't use protocols with associated types as existential types directly. Now you can with `any`:

```swift
protocol Sequence {
    associatedtype Element
    func makeIterator() -> some IteratorProtocol
}

// You can now use:
var sequences: [any Sequence] = []
```

However, you lose access to the associated type information:

```swift
protocol Container {
    associatedtype Item
    var items: [Item] { get }
}

func processContainer(_ container: any Container) {
    // container.items is of type [Any] here
    // We've lost the specific Item type information
}
```

### Type Erasure Pattern

When you need to store heterogeneous types but maintain some type information, use type erasure:

```swift
protocol Animal {
    associatedtype Food
    func eat(_ food: Food)
}

// Type-erased wrapper
struct AnyAnimal<Food> {
    private let _eat: (Food) -> Void

    init<A: Animal>(_ animal: A) where A.Food == Food {
        _eat = animal.eat
    }

    func eat(_ food: Food) {
        _eat(food)
    }
}

struct Cat: Animal {
    func eat(_ food: String) {
        print("Cat eating \(food)")
    }
}

struct Dog: Animal {
    func eat(_ food: String) {
        print("Dog eating \(food)")
    }
}

let animals: [AnyAnimal<String>] = [
    AnyAnimal(Cat()),
    AnyAnimal(Dog())
]

for animal in animals {
    animal.eat("treats")
}
```

## Primary Associated Types

Swift 5.7 introduced primary associated types, which allow you to specify type parameters for protocols:

```swift
protocol Collection<Element> {
    associatedtype Element
    associatedtype Index
    // ... other requirements
}

// Now you can write constrained existentials more easily
var intCollections: [any Collection<Int>] = []

// And use them with opaque types
func getNumbers() -> some Collection<Int> {
    [1, 2, 3, 4, 5]
}
```

This is particularly useful for common protocols:

```swift
func processStrings(_ strings: some Collection<String>) {
    for string in strings {
        print(string.uppercased())
    }
}

processStrings(["hello", "world"])
processStrings(Set(["unique", "values"]))
```

## Practical Examples

### Generic Repository Pattern

```swift
protocol Entity: Identifiable, Codable {
    var id: UUID { get }
}

protocol Repository<T> {
    associatedtype T: Entity

    func findAll() async throws -> [T]
    func find(by id: UUID) async throws -> T?
    func save(_ entity: T) async throws
    func delete(_ entity: T) async throws
}

struct User: Entity {
    let id: UUID
    var name: String
    var email: String
}

class InMemoryRepository<T: Entity>: Repository {
    private var storage: [UUID: T] = [:]

    func findAll() async throws -> [T] {
        Array(storage.values)
    }

    func find(by id: UUID) async throws -> T? {
        storage[id]
    }

    func save(_ entity: T) async throws {
        storage[entity.id] = entity
    }

    func delete(_ entity: T) async throws {
        storage.removeValue(forKey: entity.id)
    }
}

// Usage
let userRepo = InMemoryRepository<User>()
```

### Builder Pattern with Generics

```swift
protocol Builder {
    associatedtype Product
    func build() -> Product
}

class RequestBuilder: Builder {
    private var method: String = "GET"
    private var url: String = ""
    private var headers: [String: String] = [:]
    private var body: Data?

    func setMethod(_ method: String) -> Self {
        self.method = method
        return self
    }

    func setURL(_ url: String) -> Self {
        self.url = url
        return self
    }

    func addHeader(_ key: String, _ value: String) -> Self {
        headers[key] = value
        return self
    }

    func setBody(_ data: Data) -> Self {
        self.body = data
        return self
    }

    func build() -> URLRequest {
        var request = URLRequest(url: URL(string: url)!)
        request.httpMethod = method
        request.allHTTPHeaderFields = headers
        request.httpBody = body
        return request
    }
}

let request = RequestBuilder()
    .setMethod("POST")
    .setURL("https://api.example.com/users")
    .addHeader("Content-Type", "application/json")
    .build()
```

### Protocol-Oriented Networking

```swift
protocol Endpoint {
    associatedtype Response: Decodable

    var path: String { get }
    var method: String { get }
    var headers: [String: String] { get }
}

extension Endpoint {
    var method: String { "GET" }
    var headers: [String: String] { [:] }
}

protocol NetworkClient {
    func request<E: Endpoint>(_ endpoint: E) async throws -> E.Response
}

struct APIClient: NetworkClient {
    let baseURL: URL
    let session: URLSession

    func request<E: Endpoint>(_ endpoint: E) async throws -> E.Response {
        var request = URLRequest(url: baseURL.appendingPathComponent(endpoint.path))
        request.httpMethod = endpoint.method
        request.allHTTPHeaderFields = endpoint.headers

        let (data, _) = try await session.data(for: request)
        return try JSONDecoder().decode(E.Response.self, from: data)
    }
}

// Define endpoints
struct UsersEndpoint: Endpoint {
    typealias Response = [User]
    let path = "/users"
}

struct UserEndpoint: Endpoint {
    typealias Response = User
    let userId: UUID
    var path: String { "/users/\(userId)" }
}
```

### Dependency Injection with Protocols

```swift
protocol Logger {
    func log(_ message: String)
}

protocol Analytics {
    func track(_ event: String, properties: [String: Any])
}

protocol ServiceContainer {
    var logger: any Logger { get }
    var analytics: any Analytics { get }
}

class ProductionContainer: ServiceContainer {
    lazy var logger: any Logger = ConsoleLogger()
    lazy var analytics: any Analytics = MixpanelAnalytics()
}

class TestContainer: ServiceContainer {
    lazy var logger: any Logger = MockLogger()
    lazy var analytics: any Analytics = MockAnalytics()
}

class FeatureController {
    private let container: any ServiceContainer

    init(container: any ServiceContainer) {
        self.container = container
    }

    func performAction() {
        container.logger.log("Action performed")
        container.analytics.track("action_performed", properties: [:])
    }
}
```

## Summary

Protocols and generics are cornerstones of Swift's type system:

- **Protocols** define contracts that types must fulfill, enabling polymorphism and abstraction
- **Protocol extensions** provide default implementations and add functionality to conforming types
- **Associated types** make protocols generic, allowing them to work with placeholder types
- **Generics** enable type-safe, reusable code that works with any type
- **Type constraints** restrict generic types to those meeting specific requirements
- **Opaque types (`some`)** hide implementation details while preserving type identity
- **Existential types (`any`)** enable heterogeneous collections and dynamic dispatch
- **Primary associated types** make working with generic protocols more ergonomic

By mastering these concepts, you can write Swift code that is both flexible and type-safe, taking full advantage of the compiler's ability to catch errors at compile time while maintaining clean, reusable abstractions.
