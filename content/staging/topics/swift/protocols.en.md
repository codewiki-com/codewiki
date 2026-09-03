---
title: Swift 协议 (Protocol) 深入指南
description: 全面掌握Swift协议的定义、遵循、组合、关联类型与协议扩展，理解面向协议编程的核心思想
track: swift
section: optionals-protocols
difficulty: intermediate
tags:
  - Swift
  - 协议
  - Protocol
  - 面向协议编程
  - POP
status: imported
origin: old/src/content/docs/swift/protocols.en.md
divergence: 0.202
issues:
  - title-lang-en
  - title-language
legacy:
  category: Swift
  subcategory: 类型系统
  order: 4
  lastUpdated: 2026-01-07
---

Protocols are one of the core features of the Swift language. They define a blueprint of methods, properties, and other requirements that any type conforming to the protocol must implement. Swift protocols are not just interface definitions - they are the foundation of Protocol-Oriented Programming (POP).

## Concept Explanation

### What is a Protocol

A Protocol defines a set of specifications or contracts that describe the capabilities a conforming type must have. Similar to interfaces in object-oriented programming, Swift protocols are more powerful, supporting default implementations, associated types, protocol inheritance, and other advanced features.

```swift
// Define a simple protocol
protocol Identifiable {
    var id: String { get }
}

// Types conforming to the protocol must provide the id property
struct User: Identifiable {
    var id: String
    var name: String
}
```

### Historical Background

Swift has had protocols as a core feature since its initial release in 2014. At WWDC 2015, Apple officially introduced the concept of "Protocol-Oriented Programming," emphasizing that Swift is a "protocol-first" language. Compared to traditional object-oriented programming, protocol-oriented programming is more flexible and avoids the tight coupling issues that come with class inheritance.

### Problems Solved

Protocols solve the following core problems:

1. **Code Reuse Dilemma**: Traditional inheritance only supports single inheritance; protocols support conforming to multiple protocols
2. **Polymorphism for Value Types**: Structs and enums cannot inherit, but they can conform to protocols
3. **Interface Segregation**: Precise interface definitions through protocol composition
4. **Testing and Decoupling**: Protocol-based dependency injection makes unit testing easier

## Core Principles

### Memory Layout of Protocols

Swift uses Existential Containers to store values that conform to protocols. When using protocol types, Swift needs to handle uniform storage for types of different sizes:

```swift
// Protocol types require existential containers
protocol Drawable {
    func draw()
}

// Existential container contains:
// 1. Value Buffer: stores small values or pointers to the heap
// 2. Value Witness Table: handles copying, destruction, etc. of values
// 3. Protocol Witness Table: stores implementations of protocol methods
```

### Static Dispatch vs Dynamic Dispatch

The dispatch method for protocol methods depends on the calling context:

```swift
protocol Greetable {
    func greet() -> String
}

extension Greetable {
    func greet() -> String { "Hello" }
    func wave() -> String { "Waving" }
}

struct Person: Greetable {
    func greet() -> String { "Hi there!" }
    func wave() -> String { "Person waving" }
}

let person = Person()
let greetable: Greetable = person

// Protocol-required methods: dynamic dispatch
print(person.greet())     // "Hi there!" - static dispatch
print(greetable.greet())  // "Hi there!" - dynamic dispatch, calls implementation

// Non-protocol-required methods in extensions: static dispatch
print(person.wave())      // "Person waving" - static dispatch
print(greetable.wave())   // "Waving" - static dispatch, calls extension
```

### Protocol Conformance Checking Mechanism

Swift verifies at compile time whether a type has fully implemented all protocol requirements:

```swift
protocol DataSource {
    var count: Int { get }
    func item(at index: Int) -> String
}

// Compiler checks if all requirements are implemented
struct ArrayDataSource: DataSource {
    var items: [String]

    var count: Int {
        return items.count
    }

    func item(at index: Int) -> String {
        return items[index]
    }
}
```

## Key Points

### Protocol Definition Syntax

```swift
// Property requirements
protocol PropertyProtocol {
    var readOnly: String { get }           // Read-only property
    var readWrite: Int { get set }          // Read-write property
    static var typeProperty: Bool { get }   // Type property
}

// Method requirements
protocol MethodProtocol {
    func instanceMethod()                   // Instance method
    static func typeMethod()                // Type method
    mutating func mutatingMethod()          // Mutating method (for value types)
}

// Initializer requirements
protocol InitProtocol {
    init(value: Int)
    init?(optional: String)                 // Failable initializer
}

// Subscript requirements
protocol SubscriptProtocol {
    subscript(index: Int) -> String { get set }
}
```

### Protocol Conformance

```swift
// Struct conforming to protocols
struct Point: Equatable, CustomStringConvertible {
    var x: Double
    var y: Double

    var description: String {
        return "(\(x), \(y))"
    }
}

// Class conforming to protocol (initializers need required)
class Vehicle: InitProtocol {
    var speed: Int

    required init(value: Int) {
        self.speed = value
    }

    required init?(optional: String) {
        guard let speed = Int(optional) else { return nil }
        self.speed = speed
    }
}

// Enum conforming to protocols
enum Direction: CaseIterable, CustomStringConvertible {
    case north, south, east, west

    var description: String {
        switch self {
        case .north: return "North"
        case .south: return "South"
        case .east: return "East"
        case .west: return "West"
        }
    }
}
```

### Protocol Inheritance

```swift
protocol Named {
    var name: String { get }
}

protocol Aged {
    var age: Int { get }
}

// Protocols can inherit from other protocols
protocol Person: Named, Aged {
    var occupation: String { get }
}

// Types conforming to Person must satisfy all requirements in the inheritance chain
struct Employee: Person {
    var name: String
    var age: Int
    var occupation: String
}
```

### Class-Only Protocols

```swift
// Use AnyObject to restrict protocol conformance to classes only
protocol Referenceable: AnyObject {
    var referenceCount: Int { get set }
}

class ManagedObject: Referenceable {
    var referenceCount: Int = 0
}

// Structs cannot conform to class-only protocols
// struct Value: Referenceable { } // Compile error
```

### Protocol Composition

```swift
protocol Flyable {
    func fly()
}

protocol Swimmable {
    func swim()
}

protocol Walkable {
    func walk()
}

// Use & for protocol composition
func travel(with creature: Flyable & Swimmable) {
    creature.fly()
    creature.swim()
}

// Protocol composition type alias
typealias Amphibious = Flyable & Swimmable

struct Duck: Flyable, Swimmable, Walkable {
    func fly() { print("Duck flying") }
    func swim() { print("Duck swimming") }
    func walk() { print("Duck walking") }
}

let duck = Duck()
travel(with: duck)  // Duck satisfies Flyable & Swimmable
```

## Code Examples

### Example 1: Protocol Basics and Conformance

```swift
// Define a JSON serializable protocol
protocol JSONSerializable {
    func toJSON() -> [String: Any]
}

// Define a validatable protocol
protocol Validatable {
    var validationErrors: [String] { get }
    var isValid: Bool { get }
}

// Extension provides default implementation
extension Validatable {
    var isValid: Bool {
        return validationErrors.isEmpty
    }
}

// User model conforming to multiple protocols
struct UserModel: JSONSerializable, Validatable {
    var id: Int
    var email: String
    var age: Int

    func toJSON() -> [String: Any] {
        return [
            "id": id,
            "email": email,
            "age": age
        ]
    }

    var validationErrors: [String] {
        var errors: [String] = []
        if email.isEmpty || !email.contains("@") {
            errors.append("Invalid email format")
        }
        if age < 0 || age > 150 {
            errors.append("Age must be between 0 and 150")
        }
        return errors
    }
}

// Usage
let user = UserModel(id: 1, email: "test@example.com", age: 25)
print("Is valid: \(user.isValid)")  // Is valid: true
print("JSON: \(user.toJSON())")     // JSON: ["id": 1, "email": "test@example.com", "age": 25]
```

### Example 2: Associated Types

```swift
// Protocol with associated type
protocol Container {
    associatedtype Item

    var count: Int { get }
    mutating func append(_ item: Item)
    subscript(index: Int) -> Item { get }
}

// Generic implementation
struct Stack<Element>: Container {
    // Swift automatically infers Item = Element
    private var items: [Element] = []

    var count: Int {
        return items.count
    }

    mutating func append(_ item: Element) {
        items.append(item)
    }

    subscript(index: Int) -> Element {
        return items[index]
    }

    mutating func pop() -> Element? {
        return items.popLast()
    }
}

// Explicitly specifying the associated type
struct IntBuffer: Container {
    typealias Item = Int  // Explicit specification

    private var buffer: [Int] = []

    var count: Int { buffer.count }

    mutating func append(_ item: Int) {
        buffer.append(item)
    }

    subscript(index: Int) -> Int {
        return buffer[index]
    }
}

// Using constrained associated types
protocol ComparableContainer: Container where Item: Comparable {
    func sorted() -> [Item]
}

extension ComparableContainer {
    func sorted() -> [Item] {
        var result: [Item] = []
        for i in 0..<count {
            result.append(self[i])
        }
        return result.sorted()
    }
}
```

### Example 3: Protocol Extensions

```swift
// Collection protocol extension
protocol Summable {
    static func +(lhs: Self, rhs: Self) -> Self
    static var zero: Self { get }
}

extension Int: Summable {
    static var zero: Int { 0 }
}

extension Double: Summable {
    static var zero: Double { 0.0 }
}

// Add sum method to Collection where Element conforms to Summable
extension Collection where Element: Summable {
    func sum() -> Element {
        return reduce(Element.zero, +)
    }
}

// Usage
let integers = [1, 2, 3, 4, 5]
print("Sum: \(integers.sum())")  // Sum: 15

let doubles = [1.5, 2.5, 3.0]
print("Sum: \(doubles.sum())")   // Sum: 7.0

// Conditional extension
extension Collection where Element: Equatable {
    func countOf(_ element: Element) -> Int {
        return filter { $0 == element }.count
    }
}

extension Collection where Element: Hashable {
    func unique() -> [Element] {
        var seen = Set<Element>()
        return filter { seen.insert($0).inserted }
    }
}

let numbers = [1, 2, 2, 3, 3, 3, 4]
print("Count of 3: \(numbers.countOf(3))")  // Count of 3: 3
print("Unique: \(numbers.unique())")        // Unique: [1, 2, 3, 4]
```

### Example 4: Protocol Composition and Type Erasure

```swift
// Define multiple protocols
protocol Encodable {
    func encode() -> Data
}

protocol Decodable {
    init(from data: Data) throws
}

// Composed protocol
typealias Codable = Encodable & Decodable

// Type erasure wrapper
struct AnyEncodable: Encodable {
    private let _encode: () -> Data

    init<T: Encodable>(_ encodable: T) {
        _encode = encodable.encode
    }

    func encode() -> Data {
        return _encode()
    }
}

// Usage example
struct Message: Encodable {
    let content: String

    func encode() -> Data {
        return content.data(using: .utf8) ?? Data()
    }
}

struct Event: Encodable {
    let name: String
    let timestamp: Date

    func encode() -> Data {
        let dict: [String: Any] = ["name": name, "timestamp": timestamp.timeIntervalSince1970]
        return try! JSONSerialization.data(withJSONObject: dict)
    }
}

// Type erasure allows storing different types
var encodables: [AnyEncodable] = [
    AnyEncodable(Message(content: "Hello")),
    AnyEncodable(Event(name: "Login", timestamp: Date()))
]

for encodable in encodables {
    let data = encodable.encode()
    print("Encoded \(data.count) bytes")
}
```

### Example 5: Protocols in Dependency Injection

```swift
// Network service protocol
protocol NetworkService {
    func fetch(url: URL) async throws -> Data
}

// Cache service protocol
protocol CacheService {
    func get(key: String) -> Data?
    func set(key: String, data: Data)
}

// Real implementations
class URLSessionNetworkService: NetworkService {
    func fetch(url: URL) async throws -> Data {
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    }
}

class InMemoryCacheService: CacheService {
    private var cache: [String: Data] = [:]

    func get(key: String) -> Data? {
        return cache[key]
    }

    func set(key: String, data: Data) {
        cache[key] = data
    }
}

// View model using protocols
class DataViewModel {
    private let networkService: NetworkService
    private let cacheService: CacheService

    // Dependency injection
    init(networkService: NetworkService, cacheService: CacheService) {
        self.networkService = networkService
        self.cacheService = cacheService
    }

    func loadData(from url: URL) async throws -> Data {
        let cacheKey = url.absoluteString

        // Check cache first
        if let cachedData = cacheService.get(key: cacheKey) {
            return cachedData
        }

        // Network request
        let data = try await networkService.fetch(url: url)
        cacheService.set(key: cacheKey, data: data)
        return data
    }
}

// Mock implementations for testing
class MockNetworkService: NetworkService {
    var mockData: Data = Data()
    var shouldFail: Bool = false

    func fetch(url: URL) async throws -> Data {
        if shouldFail {
            throw URLError(.networkConnectionLost)
        }
        return mockData
    }
}

class MockCacheService: CacheService {
    var storage: [String: Data] = [:]

    func get(key: String) -> Data? { storage[key] }
    func set(key: String, data: Data) { storage[key] = data }
}
```

## Best Practices

### Use Protocol Composition Instead of Inheritance

```swift
// Recommended: Small and focused protocols
protocol Identifiable {
    var id: UUID { get }
}

protocol Timestampable {
    var createdAt: Date { get }
    var updatedAt: Date { get }
}

protocol Persistable: Identifiable, Timestampable {
    func save() throws
    func delete() throws
}

// Compose as needed
struct Document: Identifiable, Timestampable {
    var id: UUID
    var createdAt: Date
    var updatedAt: Date
    var content: String
}

// Not recommended: Large, all-encompassing protocol
protocol BaseModel {
    var id: UUID { get }
    var createdAt: Date { get }
    var updatedAt: Date { get }
    var version: Int { get }
    var isDeleted: Bool { get }
    func save() throws
    func delete() throws
    func validate() -> Bool
    // ... too many requirements
}
```

### Prefer Protocol Extensions for Default Implementations

```swift
protocol Describable {
    var name: String { get }
    var details: String { get }
    func describe() -> String
}

// Provide reasonable default implementations
extension Describable {
    var details: String {
        return ""  // Default empty string
    }

    func describe() -> String {
        if details.isEmpty {
            return name
        }
        return "\(name): \(details)"
    }
}

// Conforming types can optionally override
struct Product: Describable {
    var name: String
    var price: Double

    // Custom details
    var details: String {
        return "Price: $\(price)"
    }
    // Uses default describe()
}
```

### Use Where Clauses for Precise Constraints

```swift
protocol Stackable {
    associatedtype Element
    mutating func push(_ element: Element)
    mutating func pop() -> Element?
}

// Add methods for specific conditions
extension Stackable where Element: Equatable {
    func contains(_ element: Element) -> Bool {
        var copy = self
        while let top = copy.pop() {
            if top == element { return true }
        }
        return false
    }
}

extension Stackable where Element: Comparable {
    func sorted() -> [Element] {
        var result: [Element] = []
        var copy = self
        while let element = copy.pop() {
            result.append(element)
        }
        return result.sorted()
    }
}

extension Stackable where Element == String {
    func joinedContents(separator: String = ", ") -> String {
        var result: [String] = []
        var copy = self
        while let element = copy.pop() {
            result.append(element)
        }
        return result.joined(separator: separator)
    }
}
```

### Choose Wisely Between some and any

```swift
protocol Shape {
    func area() -> Double
}

struct Circle: Shape {
    var radius: Double
    func area() -> Double { .pi * radius * radius }
}

struct Rectangle: Shape {
    var width: Double
    var height: Double
    func area() -> Double { width * height }
}

// Use some: Fixed return type, compiler can optimize
func makeCircle(radius: Double) -> some Shape {
    return Circle(radius: radius)
}

// Use any: Need to store different types
func collectShapes() -> [any Shape] {
    return [Circle(radius: 5), Rectangle(width: 3, height: 4)]
}

// Choosing in function parameters
// some: Equivalent to generic constraint, same type for each call
func process(_ shape: some Shape) {
    print("Area: \(shape.area())")
}

// any: Accepts any type conforming to Shape
func processAny(_ shape: any Shape) {
    print("Area: \(shape.area())")
}
```

### Avoid Pitfalls of Protocol Extension Default Implementations

```swift
protocol Logging {
    func log(message: String)
}

extension Logging {
    // Default implementation for protocol requirement
    func log(message: String) {
        print("[Default] \(message)")
    }

    // New method in extension (not a protocol requirement)
    func debug(message: String) {
        print("[Debug] \(message)")
    }
}

struct ConsoleLogger: Logging {
    func log(message: String) {
        print("[Console] \(message)")
    }

    func debug(message: String) {
        print("[Console Debug] \(message)")
    }
}

let logger = ConsoleLogger()
let protocolLogger: Logging = logger

// log is a protocol requirement: dynamic dispatch
logger.log(message: "Test")          // [Console] Test
protocolLogger.log(message: "Test")  // [Console] Test - as expected

// debug is not a protocol requirement: static dispatch
logger.debug(message: "Test")          // [Console Debug] Test
protocolLogger.debug(message: "Test")  // [Debug] Test - may be unexpected
```

## Common Pitfalls

### Associated Types Make Protocols Unusable as Types

```swift
protocol Container {
    associatedtype Item
    var items: [Item] { get }
}

// Error: Protocols with associated types cannot be used directly as types
// var containers: [Container] = []  // Compile error

// Solution 1: Use generics
func printItems<C: Container>(from container: C) where C.Item: CustomStringConvertible {
    container.items.forEach { print($0) }
}

// Solution 2: Use the any keyword (Swift 5.7+)
var containers: [any Container] = []

// Solution 3: Type erasure
struct AnyContainer<T>: Container {
    typealias Item = T
    private let _items: () -> [T]

    init<C: Container>(_ container: C) where C.Item == T {
        _items = { container.items }
    }

    var items: [T] { _items() }
}
```

### Static Dispatch Issues with Protocol Extension Methods

```swift
protocol Drawable {
    func draw()
}

extension Drawable {
    func draw() {
        print("Drawing default shape")
    }

    func render() {
        draw()  // Which draw is called here depends on static type
    }
}

struct Square: Drawable {
    func draw() {
        print("Drawing square")
    }
}

let square = Square()
square.render()  // "Drawing square" - because self is Square

let drawable: Drawable = square
drawable.render()  // "Drawing square" - draw() is protocol requirement, dynamic dispatch

// But if render calls a non-protocol-requirement method, behavior differs
```

### Restrictions with mutating Requirements

```swift
protocol Resettable {
    mutating func reset()
}

struct Counter: Resettable {
    var count: Int = 0

    mutating func reset() {
        count = 0
    }
}

class CounterClass: Resettable {
    var count: Int = 0

    // Classes don't need mutating keyword
    func reset() {
        count = 0
    }
}

// Issue: Protocol type variables need to be var
var resettable: Resettable = Counter()
resettable.reset()  // OK

let constantResettable: Resettable = Counter()
// constantResettable.reset()  // Compile error: Cannot call mutating method on constant
```

### required Requirement for Protocol Initializers

```swift
protocol Creatable {
    init()
}

class BaseClass: Creatable {
    required init() {}  // Must be marked required
}

class DerivedClass: BaseClass {
    var value: Int

    // Must also implement required init
    required init() {
        value = 0
        super.init()
    }
}

// final classes don't need required
final class FinalClass: Creatable {
    init() {}  // No required needed
}
```

### Restrictions with Self Type

```swift
protocol Copyable {
    func copy() -> Self
}

// Structs can directly return Self
struct Document: Copyable {
    var content: String

    func copy() -> Document {
        return Document(content: content)
    }
}

// Classes need special handling
class Node: Copyable {
    var value: Int

    required init(value: Int) {
        self.value = value
    }

    func copy() -> Self {
        // Use type(of: self) and required init
        return type(of: self).init(value: value)
    }
}

class ChildNode: Node {
    var name: String = ""

    required init(value: Int) {
        super.init(value: value)
    }

    // If copy() is not overridden, it still returns the correct type
}
```

## Performance Considerations

### Existential Container Overhead

```swift
protocol Animal {
    func speak() -> String
}

struct Dog: Animal {
    func speak() -> String { "Woof!" }
}

// Concrete type: No extra overhead
let dog = Dog()  // Direct storage, static dispatch

// Existential type: Has extra overhead
let animal: Animal = Dog()  // Existential container, dynamic dispatch
// Existential container contains:
// - Value buffer (24 bytes inline or heap allocated)
// - Metadata pointer
// - Protocol witness table pointer

// Performance comparison
func processDirectly(_ dog: Dog) {
    _ = dog.speak()  // Static dispatch, can be inlined
}

func processExistential(_ animal: Animal) {
    _ = animal.speak()  // Dynamic dispatch, cannot be inlined
}
```

### Use Generics Instead of Existential Types

```swift
// Existential type version: Dynamic dispatch
func feedAnimals(_ animals: [any Animal]) {
    for animal in animals {
        print(animal.speak())
    }
}

// Generic version: Can be optimized
func feedAnimals<T: Animal>(_ animals: [T]) {
    for animal in animals {
        print(animal.speak())  // Compiler can specialize and inline
    }
}

// If all elements have the same type, generic version performs better
let dogs: [Dog] = [Dog(), Dog(), Dog()]
feedAnimals(dogs)  // Compiler generates specialized version for Dog
```

### Protocol Extension vs Concrete Implementation

```swift
protocol Calculatable {
    var value: Double { get }
}

extension Calculatable {
    // Method in protocol extension
    func squared() -> Double {
        return value * value
    }
}

struct Number: Calculatable {
    var value: Double

    // Concrete implementation may be more efficient
    func squared() -> Double {
        return value * value
    }
}

// When type is known, compiler prefers concrete implementation
let num = Number(value: 5)
_ = num.squared()  // Calls Number.squared(), static dispatch
```

### Recommendations

1. **Prefer generic constraints**: When type is known at compile time, use `<T: Protocol>` instead of `any Protocol`
2. **Avoid frequent boxing/unboxing**: Frequent conversion of existential types has overhead
3. **Consider @inlinable**: Use `@inlinable` for performance-critical protocol extension methods
4. **Use some return types**: Allows compiler to perform more optimizations

## Real-World Scenarios

### Scenario 1: Plugin System

```swift
// Define plugin protocol
protocol Plugin {
    var name: String { get }
    var version: String { get }

    func initialize()
    func execute(with context: PluginContext)
    func shutdown()
}

struct PluginContext {
    var parameters: [String: Any]
    var logger: Logger
}

protocol Logger {
    func log(_ message: String)
}

// Plugin manager
class PluginManager {
    private var plugins: [Plugin] = []
    private let context: PluginContext

    init(context: PluginContext) {
        self.context = context
    }

    func register(_ plugin: Plugin) {
        plugins.append(plugin)
        plugin.initialize()
        context.logger.log("Registered plugin: \(plugin.name) v\(plugin.version)")
    }

    func executeAll() {
        for plugin in plugins {
            plugin.execute(with: context)
        }
    }

    func shutdown() {
        for plugin in plugins.reversed() {
            plugin.shutdown()
        }
    }
}

// Concrete plugin implementation
struct AnalyticsPlugin: Plugin {
    var name: String { "Analytics" }
    var version: String { "1.0.0" }

    func initialize() {
        // Initialize analytics SDK
    }

    func execute(with context: PluginContext) {
        // Send analytics data
    }

    func shutdown() {
        // Clean up resources
    }
}
```

### Scenario 2: Strategy Pattern

```swift
// Pricing calculation strategy
protocol PricingStrategy {
    func calculatePrice(basePrice: Decimal, quantity: Int) -> Decimal
}

struct RegularPricing: PricingStrategy {
    func calculatePrice(basePrice: Decimal, quantity: Int) -> Decimal {
        return basePrice * Decimal(quantity)
    }
}

struct BulkPricing: PricingStrategy {
    let threshold: Int
    let discount: Decimal

    func calculatePrice(basePrice: Decimal, quantity: Int) -> Decimal {
        let total = basePrice * Decimal(quantity)
        if quantity >= threshold {
            return total * (1 - discount)
        }
        return total
    }
}

struct SeasonalPricing: PricingStrategy {
    let multiplier: Decimal

    func calculatePrice(basePrice: Decimal, quantity: Int) -> Decimal {
        return basePrice * multiplier * Decimal(quantity)
    }
}

// Using strategy
class ShoppingCart {
    var items: [(price: Decimal, quantity: Int)] = []
    var pricingStrategy: PricingStrategy = RegularPricing()

    var total: Decimal {
        items.reduce(Decimal.zero) { result, item in
            result + pricingStrategy.calculatePrice(
                basePrice: item.price,
                quantity: item.quantity
            )
        }
    }
}

// Switch strategy based on conditions
let cart = ShoppingCart()
cart.items = [(price: 10.0, quantity: 5)]

cart.pricingStrategy = RegularPricing()
print("Regular: \(cart.total)")  // 50

cart.pricingStrategy = BulkPricing(threshold: 3, discount: 0.1)
print("Bulk: \(cart.total)")  // 45

cart.pricingStrategy = SeasonalPricing(multiplier: 1.2)
print("Seasonal: \(cart.total)")  // 60
```

### Scenario 3: Data Storage Abstraction

```swift
// Storage protocol
protocol DataStore {
    associatedtype Model: Identifiable

    func save(_ model: Model) async throws
    func fetch(id: Model.ID) async throws -> Model?
    func fetchAll() async throws -> [Model]
    func delete(id: Model.ID) async throws
}

// User model
struct User: Identifiable, Codable {
    var id: UUID
    var name: String
    var email: String
}

// In-memory implementation
actor InMemoryStore<T: Identifiable>: DataStore {
    private var storage: [T.ID: T] = [:]

    func save(_ model: T) async throws {
        storage[model.id] = model
    }

    func fetch(id: T.ID) async throws -> T? {
        return storage[id]
    }

    func fetchAll() async throws -> [T] {
        return Array(storage.values)
    }

    func delete(id: T.ID) async throws {
        storage.removeValue(forKey: id)
    }
}

// UserDefaults implementation
class UserDefaultsStore<T: Identifiable & Codable>: DataStore where T.ID == UUID {
    private let key: String

    init(key: String) {
        self.key = key
    }

    func save(_ model: T) async throws {
        var all = try await fetchAll()
        if let index = all.firstIndex(where: { $0.id == model.id }) {
            all[index] = model
        } else {
            all.append(model)
        }
        let data = try JSONEncoder().encode(all)
        UserDefaults.standard.set(data, forKey: key)
    }

    func fetch(id: UUID) async throws -> T? {
        let all = try await fetchAll()
        return all.first { $0.id == id }
    }

    func fetchAll() async throws -> [T] {
        guard let data = UserDefaults.standard.data(forKey: key) else {
            return []
        }
        return try JSONDecoder().decode([T].self, from: data)
    }

    func delete(id: UUID) async throws {
        var all = try await fetchAll()
        all.removeAll { $0.id == id }
        let data = try JSONEncoder().encode(all)
        UserDefaults.standard.set(data, forKey: key)
    }
}

// Service layer using abstraction
class UserService<Store: DataStore> where Store.Model == User {
    private let store: Store

    init(store: Store) {
        self.store = store
    }

    func createUser(name: String, email: String) async throws -> User {
        let user = User(id: UUID(), name: name, email: email)
        try await store.save(user)
        return user
    }

    func getUser(id: UUID) async throws -> User? {
        return try await store.fetch(id: id)
    }
}
```

## Interview Key Points

### Common Questions

**1. What is the difference between protocols and abstract classes?**

- Swift does not have abstract classes; protocols are the primary way to achieve abstraction
- Protocols can be conformed to by structs, enums, and classes; abstract classes can only be inherited by classes
- Types can conform to multiple protocols but can only inherit from one class
- Protocols define capabilities/contracts; abstract classes define "is-a" relationships

**2. When to use some and when to use any?**

```swift
// some: Opaque type
// - Fixed return type, hidden from caller
// - Compiler can optimize
// - Suitable for factory methods, SwiftUI views
func makeView() -> some View { Text("Hello") }

// any: Existential type
// - Can store different concrete types
// - Has runtime overhead
// - Suitable for heterogeneous collections, dynamic type scenarios
var views: [any View] = []
```

**3. Explain the dispatch rules for methods in protocol extensions**

- Protocol-required methods: Dynamic dispatch (via protocol witness table)
- Methods defined only in extensions: Static dispatch (based on compile-time type)

**4. What are associated types? Why are they needed?**

Associated types are type placeholders in protocols that allow protocols to define method signatures without specifying concrete types. They make protocols more generic, and conforming types can specify the concrete type.

**5. How to solve the "protocol cannot be used as a type" problem?**

- Use generic constraints `<T: Protocol>`
- Use `any Protocol` (Swift 5.7+)
- Implement type erasure wrappers

### Advanced Topics

**Protocol Witness Table**

Each type's conformance to a protocol has a witness table that stores the concrete implementations of protocol methods. When calling methods through protocol types, the runtime uses this table to find the correct implementation.

**Primary Associated Types**

Introduced in Swift 5.7, allows specifying concrete values for associated types in protocol types:

```swift
protocol Collection<Element> {
    associatedtype Element
    // ...
}

func process(_ collection: some Collection<Int>) { }
```

**Protocol Metaprogramming**

Using `Self` type and associated types enables complex type relationships:

```swift
protocol Clonable {
    func clone() -> Self
}

protocol Factory {
    associatedtype Product
    static func create() -> Product
}
```

## Further Reading

### Official Resources

- [The Swift Programming Language - Protocols](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/)
- [WWDC 2015: Protocol-Oriented Programming in Swift](https://developer.apple.com/videos/play/wwdc2015/408/)
- [WWDC 2016: Protocol and Value Oriented Programming in UIKit Apps](https://developer.apple.com/videos/play/wwdc2016/419/)
- [Swift Evolution - SE-0335: Existential any](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0335-existential-any.md)

### Recommended Books

- "Advanced Swift" - objc.io
- "Swift Programming: The Big Nerd Ranch Guide" - Big Nerd Ranch
- "Advanced Swift" - objc.io

### Quality Articles

- [Understanding Protocol-Oriented Programming](https://www.swiftbysundell.com/articles/understanding-protocol-oriented-programming/)
- [Protocols in Swift](https://www.hackingwithswift.com/read/0/22/protocols)
- [Type Erasure in Swift](https://www.donnywals.com/understanding-type-erasure-in-swift/)
- [Swift Protocol Dispatch](https://www.rightpoint.com/rplabs/switch-method-dispatch-table)

### Related Tools

- [Sourcery](https://github.com/krzysztofzablocki/Sourcery) - Automatically generate protocol implementation code
- [SwiftLint](https://github.com/realm/SwiftLint) - Code linting, including protocol-related rules

---

Swift's protocol system is one of the most elegant parts of the language design. Through protocols, we can define clear abstraction boundaries, achieve code reuse, and maintain type safety. With the various features of protocols - from basic definitions to associated types, from protocol extensions to the some/any keywords - you can write more elegant and maintainable Swift code. Protocol-Oriented Programming is not just a programming paradigm but a way of thinking that encourages us to think about type design from the perspective of capabilities rather than inheritance.
