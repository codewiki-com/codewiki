---
title: Swift Structs and Classes Deep Dive
description: Comprehensive understanding of the differences between structs and classes in Swift, value types vs reference types, memberwise initializers, mutating methods, and selection strategies
track: swift
section: basics
difficulty: intermediate
tags:
  - Swift
  - Struct
  - Class
  - 值类型
  - 引用类型
  - iOS
status: imported
origin: old/src/content/docs/swift/structs-classes.en.md
divergence: 0.195
issues: []
legacy:
  category: Swift
  subcategory: 面向对象
  order: 5
  lastUpdated: 2026-01-07
---

In Swift, structs (Struct) and classes (Class) are the core building blocks of programs. They can both define properties, methods, subscripts, initializers, and enhance functionality through extensions and protocols. However, there is a fundamental difference between them: structs are value types, and classes are reference types. Understanding this distinction is crucial for writing high-quality Swift code.

## Concept Explanation

### What is a Struct

A struct is a value type in Swift used to encapsulate related data and functionality. When you assign a struct to a new variable or pass it to a function, a complete copy is created.

```swift
struct Point {
    var x: Double
    var y: Double
}

var pointA = Point(x: 10.0, y: 20.0)
var pointB = pointA  // Creates a complete copy

pointB.x = 50.0

print(pointA.x)  // 10.0 - Original value unaffected
print(pointB.x)  // 50.0
```

### What is a Class

A class is a reference type in Swift. When you assign a class instance to a new variable, you are actually creating a new reference pointing to the same memory location, not a copy.

```swift
class Person {
    var name: String
    var age: Int

    init(name: String, age: Int) {
        self.name = name
        self.age = age
    }
}

var personA = Person(name: "John", age: 25)
var personB = personA  // personB points to the same object

personB.name = "Jane"

print(personA.name)  // "Jane" - Original object was modified!
print(personB.name)  // "Jane"
```

### Historical Background

Swift's design philosophy emphasizes safety and immutability. Unlike Objective-C, Swift elevates structs to equal importance as classes, and Apple's official guidelines even recommend preferring structs. This design is influenced by functional programming ideas, aiming to reduce problems caused by shared mutable state.

Most basic types in the Swift standard library (such as `Int`, `String`, `Array`, `Dictionary`) are actually structs, which contrasts sharply with many other languages.

## Core Principles

### Value Types vs Reference Types

#### Memory Model of Value Types

Value type data is stored directly in the memory location where the variable resides. For structs, each variable has its own independent copy of data.

```swift
struct Size {
    var width: Double
    var height: Double
}

// Representation in memory (conceptualized):
// sizeA: [width: 100.0 | height: 200.0]  <- Independent memory block
var sizeA = Size(width: 100.0, height: 200.0)

// sizeB: [width: 100.0 | height: 200.0]  <- Another independent memory block
var sizeB = sizeA
```

#### Memory Model of Reference Types

Reference type variables store a pointer (reference) to the actual object in heap memory.

```swift
class Rectangle {
    var width: Double
    var height: Double

    init(width: Double, height: Double) {
        self.width = width
        self.height = height
    }
}

// Representation in memory (conceptualized):
// Heap memory: 0x1234 -> [width: 100.0 | height: 200.0]
// rectA: [0x1234]  <- Stores the address
var rectA = Rectangle(width: 100.0, height: 200.0)

// rectB: [0x1234]  <- Stores the same address
var rectB = rectA
```

#### Copy-on-Write

Swift implements copy-on-write optimization for certain value types (such as `Array`, `Dictionary`, `String`). This means copying only actually happens when modification occurs, improving performance.

```swift
var array1 = [1, 2, 3, 4, 5]
var array2 = array1  // No actual copy yet, both share storage

print(array1)  // [1, 2, 3, 4, 5]
print(array2)  // [1, 2, 3, 4, 5]

// Only when one is modified does the actual copy occur
array2.append(6)  // Now array2 has its own storage

print(array1)  // [1, 2, 3, 4, 5] - Unaffected
print(array2)  // [1, 2, 3, 4, 5, 6]
```

### Stack vs Heap Allocation

- **Stack**: Structs are typically allocated on the stack, with extremely fast allocation and deallocation
- **Heap**: Class instances are allocated on the heap, requiring reference counting management, relatively slower

```swift
// Stack allocation - Fast
struct StackPoint {
    var x: Int
    var y: Int
}

// Heap allocation - Relatively slower, requires ARC management
class HeapPoint {
    var x: Int
    var y: Int

    init(x: Int, y: Int) {
        self.x = x
        self.y = y
    }
}
```

### Identity vs Equality

Class instances have identity, which can be checked using the `===` and `!==` operators to determine if two variables point to the same instance.

```swift
class Vehicle {
    var brand: String

    init(brand: String) {
        self.brand = brand
    }
}

let car1 = Vehicle(brand: "Tesla")
let car2 = car1
let car3 = Vehicle(brand: "Tesla")

print(car1 === car2)  // true - Same instance
print(car1 === car3)  // false - Different instances, even with same content

// Structs have no concept of identity, only equality
struct Coordinate: Equatable {
    var lat: Double
    var lon: Double
}

let coord1 = Coordinate(lat: 40.0, lon: 116.0)
let coord2 = Coordinate(lat: 40.0, lon: 116.0)
print(coord1 == coord2)  // true - Values are equal
// coord1 === coord2  // Compile error! Structs don't support ===
```

## Key Points

### Memberwise Initializer

Structs automatically receive a memberwise initializer, which is one of the important differences from classes.

```swift
struct User {
    var username: String
    var email: String
    var age: Int
}

// Auto-generated memberwise initializer
let user = User(username: "swift_lover", email: "swift@example.com", age: 28)

// With default values, memberwise initializer is more flexible
struct Configuration {
    var theme: String = "light"
    var fontSize: Int = 14
    var notifications: Bool = true
}

// Can provide only some parameters
let config1 = Configuration()  // Uses all default values
let config2 = Configuration(theme: "dark")  // Only modifies theme
let config3 = Configuration(theme: "dark", fontSize: 16, notifications: false)
```

Classes don't have automatic memberwise initializers; you must define them manually:

```swift
class Account {
    var balance: Double
    var owner: String

    // Must manually define initializer
    init(balance: Double, owner: String) {
        self.balance = balance
        self.owner = owner
    }
}
```

### mutating Methods

Structs are value types, and by default their methods cannot modify their own properties. If you need to modify properties within a method, you must use the `mutating` keyword.

```swift
struct Counter {
    var count: Int = 0

    // Regular method cannot modify properties
    func getCurrentCount() -> Int {
        return count
    }

    // mutating method can modify properties
    mutating func increment() {
        count += 1
    }

    mutating func increment(by amount: Int) {
        count += amount
    }

    mutating func reset() {
        count = 0
    }
}

var counter = Counter()
counter.increment()
print(counter.count)  // 1

counter.increment(by: 5)
print(counter.count)  // 6

// Note: let-declared structs cannot call mutating methods
let immutableCounter = Counter()
// immutableCounter.increment()  // Compile error!
```

A mutating method can even completely replace self:

```swift
struct Point {
    var x: Double
    var y: Double

    mutating func moveBy(x deltaX: Double, y deltaY: Double) {
        self = Point(x: x + deltaX, y: y + deltaY)
    }
}

var point = Point(x: 1.0, y: 1.0)
point.moveBy(x: 2.0, y: 3.0)
print(point)  // Point(x: 3.0, y: 4.0)
```

### Inheritance

Classes support inheritance, structs do not. This is an important consideration when choosing between classes and structs.

```swift
// Base class
class Animal {
    var name: String

    init(name: String) {
        self.name = name
    }

    func makeSound() {
        print("Some sound")
    }
}

// Subclass
class Dog: Animal {
    var breed: String

    init(name: String, breed: String) {
        self.breed = breed
        super.init(name: name)
    }

    override func makeSound() {
        print("\(name) says: Woof!")
    }
}

class Cat: Animal {
    override func makeSound() {
        print("\(name) says: Meow!")
    }
}

let dog = Dog(name: "Buddy", breed: "Golden Retriever")
let cat = Cat(name: "Whiskers")

dog.makeSound()  // "Buddy says: Woof!"
cat.makeSound()  // "Whiskers says: Meow!"

// Structs cannot inherit
// struct SpecialPoint: Point { }  // Compile error!
```

But structs can achieve similar polymorphism through protocols:

```swift
protocol Drawable {
    func draw()
}

struct Circle: Drawable {
    var radius: Double

    func draw() {
        print("Drawing a circle with radius \(radius)")
    }
}

struct Rectangle: Drawable {
    var width: Double
    var height: Double

    func draw() {
        print("Drawing a rectangle \(width) x \(height)")
    }
}

let shapes: [Drawable] = [
    Circle(radius: 5.0),
    Rectangle(width: 10.0, height: 20.0)
]

for shape in shapes {
    shape.draw()
}
```

### Deinitializer

Only classes can define a deinitializer (`deinit`), used to perform cleanup work when an instance is deallocated.

```swift
class FileHandler {
    var filename: String

    init(filename: String) {
        self.filename = filename
        print("Opening file: \(filename)")
    }

    deinit {
        print("Closing file: \(filename)")
        // Clean up resources
    }
}

func processFile() {
    let handler = FileHandler(filename: "data.txt")
    // Use handler...
}  // handler leaves scope, deinit is called

processFile()
// Output:
// Opening file: data.txt
// Closing file: data.txt
```

## Code Examples

### Complete Struct Example

```swift
struct BankAccount {
    // Stored properties
    let accountNumber: String
    var balance: Double
    private(set) var transactionHistory: [String]

    // Computed properties
    var formattedBalance: String {
        return String(format: "$%.2f", balance)
    }

    var isOverdrawn: Bool {
        return balance < 0
    }

    // Initializer
    init(accountNumber: String, initialDeposit: Double = 0) {
        self.accountNumber = accountNumber
        self.balance = initialDeposit
        self.transactionHistory = []

        if initialDeposit > 0 {
            transactionHistory.append("Initial deposit: $\(initialDeposit)")
        }
    }

    // mutating methods
    mutating func deposit(_ amount: Double) {
        guard amount > 0 else {
            print("Deposit amount must be greater than 0")
            return
        }

        balance += amount
        transactionHistory.append("Deposit: +$\(amount)")
    }

    mutating func withdraw(_ amount: Double) -> Bool {
        guard amount > 0 else {
            print("Withdrawal amount must be greater than 0")
            return false
        }

        guard balance >= amount else {
            print("Insufficient balance")
            return false
        }

        balance -= amount
        transactionHistory.append("Withdrawal: -$\(amount)")
        return true
    }

    // Regular method
    func printStatement() {
        print("Account: \(accountNumber)")
        print("Balance: \(formattedBalance)")
        print("Transaction history:")
        for transaction in transactionHistory {
            print("  - \(transaction)")
        }
    }
}

// Usage example
var myAccount = BankAccount(accountNumber: "6222021234567890", initialDeposit: 1000)
myAccount.deposit(500)
myAccount.withdraw(200)
myAccount.printStatement()

// Value type characteristic demonstration
var anotherAccount = myAccount
anotherAccount.deposit(100)  // Does not affect myAccount

print("Original account balance: \(myAccount.formattedBalance)")  // $1300.00
print("Copy balance: \(anotherAccount.formattedBalance)")  // $1400.00
```

### Complete Class Example

```swift
class NetworkManager {
    // Singleton pattern
    static let shared = NetworkManager()

    // Stored properties
    var baseURL: String
    var timeout: TimeInterval
    private var requestCount: Int = 0

    // Computed property
    var isConfigured: Bool {
        return !baseURL.isEmpty
    }

    // Private initializer (singleton pattern)
    private init() {
        self.baseURL = ""
        self.timeout = 30.0
    }

    // Configuration method
    func configure(baseURL: String, timeout: TimeInterval = 30.0) {
        self.baseURL = baseURL
        self.timeout = timeout
        print("NetworkManager configured: \(baseURL)")
    }

    // Simulate network request
    func fetchData(endpoint: String, completion: @escaping (Result<String, Error>) -> Void) {
        guard isConfigured else {
            completion(.failure(NetworkError.notConfigured))
            return
        }

        requestCount += 1
        let url = "\(baseURL)/\(endpoint)"

        print("Requesting: \(url)")

        // Simulate async request
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            completion(.success("Data from \(endpoint)"))
        }
    }

    // Status query
    func getStats() -> (requestCount: Int, baseURL: String) {
        return (requestCount, baseURL)
    }

    // Deinitializer
    deinit {
        print("NetworkManager deallocated")
    }
}

enum NetworkError: Error {
    case notConfigured
    case invalidURL
    case requestFailed
}

// Usage example
NetworkManager.shared.configure(baseURL: "https://api.example.com")
NetworkManager.shared.fetchData(endpoint: "users") { result in
    switch result {
    case .success(let data):
        print("Fetch successful: \(data)")
    case .failure(let error):
        print("Fetch failed: \(error)")
    }
}
```

### Nested Types Example

```swift
struct Card {
    // Nested enum
    enum Suit: String, CaseIterable {
        case spades = "\u{2660}"
        case hearts = "\u{2665}"
        case diamonds = "\u{2666}"
        case clubs = "\u{2663}"
    }

    enum Rank: Int, CaseIterable {
        case ace = 1, two, three, four, five, six, seven
        case eight, nine, ten, jack, queen, king

        var name: String {
            switch self {
            case .ace: return "A"
            case .jack: return "J"
            case .queen: return "Q"
            case .king: return "K"
            default: return String(rawValue)
            }
        }
    }

    let suit: Suit
    let rank: Rank

    var description: String {
        return "\(suit.rawValue)\(rank.name)"
    }
}

// Create a deck of cards
struct Deck {
    private(set) var cards: [Card] = []

    init() {
        for suit in Card.Suit.allCases {
            for rank in Card.Rank.allCases {
                cards.append(Card(suit: suit, rank: rank))
            }
        }
    }

    mutating func shuffle() {
        cards.shuffle()
    }

    mutating func draw() -> Card? {
        guard !cards.isEmpty else { return nil }
        return cards.removeFirst()
    }
}

var deck = Deck()
deck.shuffle()

if let card = deck.draw() {
    print("Card drawn: \(card.description)")
}
```

## Best Practices

### When to Choose Structs

Apple officially recommends using structs by default, especially in these cases:

```swift
// 1. Encapsulating a small number of related data values
struct Coordinate {
    var latitude: Double
    var longitude: Double
}

// 2. When data should be copied rather than shared when passed
struct Temperature {
    var celsius: Double

    var fahrenheit: Double {
        return celsius * 9/5 + 32
    }
}

// 3. When properties are also value types
struct Person {
    var name: String      // String is a struct
    var age: Int          // Int is a struct
    var address: Address  // Address is also a struct
}

struct Address {
    var street: String
    var city: String
    var zipCode: String
}

// 4. When you don't need to inherit properties or behavior from other types
struct Vector3D {
    var x: Double
    var y: Double
    var z: Double

    static func + (lhs: Vector3D, rhs: Vector3D) -> Vector3D {
        return Vector3D(x: lhs.x + rhs.x, y: lhs.y + rhs.y, z: lhs.z + rhs.z)
    }
}
```

### When to Choose Classes

Classes are more appropriate in these situations:

```swift
// 1. Need inheritance
class UIControl: UIView {
    var isEnabled: Bool = true
}

class UIButton: UIControl {
    var title: String?
}

// 2. Need to control instance identity
class DatabaseConnection {
    let connectionID: String
    var isConnected: Bool = false

    init() {
        self.connectionID = UUID().uuidString
    }

    func connect() {
        isConnected = true
        print("Connection established: \(connectionID)")
    }
}

// 3. Need deinitializer to clean up resources
class TemporaryFile {
    let path: String

    init(path: String) {
        self.path = path
        // Create temporary file
    }

    deinit {
        // Delete temporary file
        print("Cleaning up temporary file: \(path)")
    }
}

// 4. Instance needs to be shared and modified by multiple places
class UserSession {
    static let current = UserSession()

    var isLoggedIn: Bool = false
    var username: String?

    private init() {}

    func login(username: String) {
        self.username = username
        self.isLoggedIn = true
    }

    func logout() {
        self.username = nil
        self.isLoggedIn = false
    }
}
```

### Combining Both

In real development, structs and classes are often used together:

```swift
// Data models use structs
struct Article: Codable {
    let id: Int
    let title: String
    let content: String
    let author: Author
    let publishedAt: Date
}

struct Author: Codable {
    let name: String
    let avatar: String
}

// Business logic uses classes
class ArticleRepository {
    private var cache: [Int: Article] = [:]

    func fetch(id: Int, completion: @escaping (Result<Article, Error>) -> Void) {
        if let cached = cache[id] {
            completion(.success(cached))
            return
        }

        // Network request...
    }

    func save(_ article: Article) {
        cache[article.id] = article
    }
}

// ViewModel uses class (needs to be referenced by View)
class ArticleViewModel: ObservableObject {
    @Published var articles: [Article] = []
    @Published var isLoading = false

    private let repository: ArticleRepository

    init(repository: ArticleRepository) {
        self.repository = repository
    }

    func loadArticles() {
        isLoading = true
        // Load articles...
    }
}
```

## Common Pitfalls

### Pitfall 1: Unexpected Value Copying

```swift
struct Settings {
    var volume: Int = 50
    var brightness: Int = 80
}

class SettingsManager {
    var settings = Settings()
}

let manager = SettingsManager()
var mySettings = manager.settings  // This is a copy!

mySettings.volume = 100

print(manager.settings.volume)  // 50 - Original value unchanged!
print(mySettings.volume)        // 100

// Correct approach: modify directly
manager.settings.volume = 100
print(manager.settings.volume)  // 100
```

### Pitfall 2: Reference Types Inside Structs

```swift
class Engine {
    var horsepower: Int

    init(horsepower: Int) {
        self.horsepower = horsepower
    }
}

struct Car {
    var brand: String
    var engine: Engine  // Reference type!
}

var car1 = Car(brand: "Tesla", engine: Engine(horsepower: 400))
var car2 = car1  // Shallow copy!

car2.brand = "BMW"           // car1.brand unaffected
car2.engine.horsepower = 500  // car1.engine also modified!

print(car1.brand)              // "Tesla"
print(car1.engine.horsepower)  // 500 - Unexpectedly modified!

// Solution: implement deep copy
struct SafeCar {
    var brand: String
    var engine: Engine

    // Custom copy logic
    func copy() -> SafeCar {
        return SafeCar(
            brand: brand,
            engine: Engine(horsepower: engine.horsepower)
        )
    }
}
```

### Pitfall 3: let and mutating

```swift
struct Stack<Element> {
    private var items: [Element] = []

    mutating func push(_ item: Element) {
        items.append(item)
    }

    mutating func pop() -> Element? {
        return items.popLast()
    }
}

let constantStack = Stack<Int>()
// constantStack.push(1)  // Compile error! let-declared struct cannot call mutating methods

var mutableStack = Stack<Int>()
mutableStack.push(1)  // OK
```

### Pitfall 4: Retain Cycles (Classes Only)

```swift
class Person {
    var name: String
    var apartment: Apartment?

    init(name: String) {
        self.name = name
        print("\(name) created")
    }

    deinit {
        print("\(name) deallocated")
    }
}

class Apartment {
    var unit: String
    var tenant: Person?  // Strong reference causes retain cycle!

    init(unit: String) {
        self.unit = unit
    }

    deinit {
        print("Apartment \(unit) deallocated")
    }
}

var john: Person? = Person(name: "John")
var unit4A: Apartment? = Apartment(unit: "4A")

john?.apartment = unit4A
unit4A?.tenant = john  // Retain cycle!

john = nil    // Person won't be deallocated
unit4A = nil  // Apartment won't be deallocated either
// Memory leak!

// Solution: use weak or unowned
class SafeApartment {
    var unit: String
    weak var tenant: Person?  // Weak reference, doesn't increase reference count

    init(unit: String) {
        self.unit = unit
    }
}
```

### Pitfall 5: Closures Capturing self

```swift
class DataLoader {
    var data: [String] = []

    func loadData() {
        // Problem: closure strongly references self
        fetchFromNetwork { result in
            self.data = result  // May cause retain cycle
        }
    }

    // Solution
    func loadDataSafe() {
        fetchFromNetwork { [weak self] result in
            guard let self = self else { return }
            self.data = result
        }
    }

    private func fetchFromNetwork(completion: @escaping ([String]) -> Void) {
        // Simulate network request
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            completion(["Data1", "Data2"])
        }
    }
}
```

## Performance Considerations

### Stack vs Heap Allocation

```swift
import Foundation

// Performance test
func measurePerformance() {
    let iterations = 1_000_000

    // Struct performance test
    struct StructPoint {
        var x: Double
        var y: Double
    }

    let structStart = CFAbsoluteTimeGetCurrent()
    for _ in 0..<iterations {
        var point = StructPoint(x: 1.0, y: 2.0)
        point.x += 1
    }
    let structTime = CFAbsoluteTimeGetCurrent() - structStart

    // Class performance test
    class ClassPoint {
        var x: Double
        var y: Double
        init(x: Double, y: Double) {
            self.x = x
            self.y = y
        }
    }

    let classStart = CFAbsoluteTimeGetCurrent()
    for _ in 0..<iterations {
        let point = ClassPoint(x: 1.0, y: 2.0)
        point.x += 1
    }
    let classTime = CFAbsoluteTimeGetCurrent() - classStart

    print("Struct time: \(structTime) seconds")
    print("Class time: \(classTime) seconds")
}
```

### When Structs Are Faster

1. **Small data**: Structs are allocated directly on the stack, no heap allocation overhead
2. **Frequent creation/destruction**: Stack allocation and deallocation have almost no overhead
3. **No reference counting**: Structs don't need ARC management

### When Classes Are Faster

1. **Large data**: Passing references is more efficient than copying entire data
2. **Need sharing**: More efficient when multiple places need to access the same data
3. **Frequent modifications**: Avoids copy-on-write overhead

```swift
// Large structs may cause performance issues
struct LargeStruct {
    var data1: [Int] = Array(repeating: 0, count: 10000)
    var data2: [Int] = Array(repeating: 0, count: 10000)
    var data3: [Int] = Array(repeating: 0, count: 10000)
}

// Passing large struct triggers copy (copy-on-write may delay)
func process(_ data: LargeStruct) {
    // If data is modified, triggers complete copy
}

// For large data, consider using class or passing inout
func processInout(_ data: inout LargeStruct) {
    // Modify directly, no copy needed
}
```

### Implementing Custom Copy-on-Write

```swift
final class Ref<T> {
    var value: T
    init(_ value: T) {
        self.value = value
    }
}

struct COWArray<Element> {
    private var storage: Ref<[Element]>

    init(_ elements: [Element] = []) {
        storage = Ref(elements)
    }

    var count: Int {
        return storage.value.count
    }

    // Ensure uniqueness
    private mutating func ensureUnique() {
        if !isKnownUniquelyReferenced(&storage) {
            storage = Ref(storage.value)
            print("Copy triggered")
        }
    }

    mutating func append(_ element: Element) {
        ensureUnique()
        storage.value.append(element)
    }

    subscript(index: Int) -> Element {
        get {
            return storage.value[index]
        }
        set {
            ensureUnique()
            storage.value[index] = newValue
        }
    }
}

var array1 = COWArray([1, 2, 3])
var array2 = array1  // Shared storage

print(array1.count)  // 3
print(array2.count)  // 3

array2.append(4)  // Output: Copy triggered
print(array1.count)  // 3
print(array2.count)  // 4
```

## Real-World Scenarios

### Scenario 1: Data Model Layer

```swift
// API response model using structs
struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let message: String?
    let data: T?
}

struct User: Codable, Equatable {
    let id: Int
    let username: String
    let email: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, username, email
        case createdAt = "created_at"
    }
}

struct Post: Codable, Identifiable {
    let id: Int
    let title: String
    let content: String
    let author: User
    let tags: [String]
}

// Parse JSON
let jsonData = """
{
    "success": true,
    "data": {
        "id": 1,
        "username": "swift_dev",
        "email": "dev@swift.org",
        "created_at": "2026-01-01T00:00:00Z"
    }
}
""".data(using: .utf8)!

let decoder = JSONDecoder()
decoder.dateDecodingStrategy = .iso8601

do {
    let response = try decoder.decode(APIResponse<User>.self, from: jsonData)
    if let user = response.data {
        print("User: \(user.username)")
    }
} catch {
    print("Parse error: \(error)")
}
```

### Scenario 2: SwiftUI State Management

```swift
import SwiftUI

// Model using struct
struct TodoItem: Identifiable, Equatable {
    let id: UUID
    var title: String
    var isCompleted: Bool
    var priority: Priority

    enum Priority: String, CaseIterable {
        case low = "Low"
        case medium = "Medium"
        case high = "High"
    }
}

// ViewModel using class
class TodoListViewModel: ObservableObject {
    @Published var items: [TodoItem] = []
    @Published var filterPriority: TodoItem.Priority?

    var filteredItems: [TodoItem] {
        guard let priority = filterPriority else {
            return items
        }
        return items.filter { $0.priority == priority }
    }

    func addItem(title: String, priority: TodoItem.Priority) {
        let item = TodoItem(
            id: UUID(),
            title: title,
            isCompleted: false,
            priority: priority
        )
        items.append(item)
    }

    func toggleCompletion(_ item: TodoItem) {
        if let index = items.firstIndex(where: { $0.id == item.id }) {
            items[index].isCompleted.toggle()
        }
    }

    func deleteItem(_ item: TodoItem) {
        items.removeAll { $0.id == item.id }
    }
}

// View
struct TodoListView: View {
    @StateObject private var viewModel = TodoListViewModel()
    @State private var newItemTitle = ""

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.filteredItems) { item in
                    TodoItemRow(item: item) {
                        viewModel.toggleCompletion(item)
                    }
                }
                .onDelete { indexSet in
                    for index in indexSet {
                        viewModel.deleteItem(viewModel.filteredItems[index])
                    }
                }
            }
            .navigationTitle("To-Do List")
        }
    }
}

struct TodoItemRow: View {
    let item: TodoItem
    let onToggle: () -> Void

    var body: some View {
        HStack {
            Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                .onTapGesture(perform: onToggle)
            Text(item.title)
            Spacer()
            Text(item.priority.rawValue)
                .font(.caption)
        }
    }
}
```

### Scenario 3: Entities in Game Development

```swift
// Game components using structs
struct Position: Equatable {
    var x: Float
    var y: Float

    static let zero = Position(x: 0, y: 0)

    func distance(to other: Position) -> Float {
        let dx = x - other.x
        let dy = y - other.y
        return sqrt(dx * dx + dy * dy)
    }

    static func + (lhs: Position, rhs: Velocity) -> Position {
        return Position(x: lhs.x + rhs.dx, y: lhs.y + rhs.dy)
    }
}

struct Velocity {
    var dx: Float
    var dy: Float

    static let zero = Velocity(dx: 0, dy: 0)
}

struct Health {
    var current: Int
    var maximum: Int

    var percentage: Float {
        return Float(current) / Float(maximum)
    }

    var isDead: Bool {
        return current <= 0
    }

    mutating func takeDamage(_ amount: Int) {
        current = max(0, current - amount)
    }

    mutating func heal(_ amount: Int) {
        current = min(maximum, current + amount)
    }
}

// Game entities using classes (need reference identity)
class GameEntity {
    let id: UUID
    var position: Position
    var velocity: Velocity
    var health: Health

    init(position: Position, health: Health) {
        self.id = UUID()
        self.position = position
        self.velocity = .zero
        self.health = health
    }

    func update(deltaTime: Float) {
        position = position + Velocity(
            dx: velocity.dx * deltaTime,
            dy: velocity.dy * deltaTime
        )
    }
}

class Player: GameEntity {
    var score: Int = 0
    var name: String

    init(name: String, position: Position) {
        self.name = name
        super.init(position: position, health: Health(current: 100, maximum: 100))
    }
}

class Enemy: GameEntity {
    var target: GameEntity?

    func moveTowardsTarget(speed: Float) {
        guard let target = target else { return }

        let dx = target.position.x - position.x
        let dy = target.position.y - position.y
        let distance = sqrt(dx * dx + dy * dy)

        if distance > 0 {
            velocity = Velocity(
                dx: (dx / distance) * speed,
                dy: (dy / distance) * speed
            )
        }
    }
}
```

## Interview Essentials

### Common Interview Questions

**Q1: What are the main differences between structs and classes in Swift?**

```swift
/*
Core differences:
1. Value type vs Reference type
   - Struct: Value type, copied on assignment
   - Class: Reference type, shared on assignment

2. Inheritance
   - Struct: Does not support inheritance
   - Class: Supports inheritance

3. Initializers
   - Struct: Automatically gets memberwise initializer
   - Class: Must manually define initializer

4. Deinitializer
   - Struct: No deinitializer
   - Class: Can define deinit

5. Reference counting
   - Struct: No ARC management needed
   - Class: Requires ARC for memory management

6. Identity
   - Struct: Does not support === operator
   - Class: Supports === to check if same instance
*/
```

**Q2: What is the mutating keyword? Why is it needed?**

```swift
/*
mutating marks struct methods that can modify their properties.

Reason:
- Structs are value types, immutable by default
- self is a constant during method calls
- mutating tells the compiler this method will modify self

In effect, a mutating method implicitly replaces self with a new value.
*/

struct Point {
    var x: Int
    var y: Int

    // This method is equivalent to:
    // func move(by delta: Point) -> Point
    mutating func move(by delta: Point) {
        x += delta.x
        y += delta.y
        // Equivalent to: self = Point(x: x + delta.x, y: y + delta.y)
    }
}
```

**Q3: How can you achieve inheritance-like functionality in structs?**

```swift
// Using protocols and extensions
protocol Identifiable {
    var id: String { get }
}

protocol Displayable {
    var displayName: String { get }
}

// Protocol extension provides default implementation
extension Displayable {
    var displayName: String {
        return "Unnamed"
    }
}

// Protocol composition
typealias Entity = Identifiable & Displayable

struct User: Entity {
    let id: String
    let name: String

    var displayName: String {
        return name
    }
}

struct Product: Entity {
    let id: String
    let title: String

    var displayName: String {
        return title
    }
}
```

**Q4: When should you use a class instead of a struct?**

```swift
/*
Use cases for classes:
1. Need inheritance: When creating class hierarchies
2. Need identity: Need to check if two variables refer to the same instance
3. Need deinitializer: Need cleanup when instance is deallocated
4. Need shared state: Multiple places need to modify the same data
5. Objective-C interoperability: Need to work with OC code
6. Reference semantics more appropriate: e.g., UIViewController, singletons
*/

// Example: Singletons must use classes
class AppConfiguration {
    static let shared = AppConfiguration()
    private init() {}

    var apiKey: String = ""
}

// Example: Need inheritance
class Animal {
    func speak() { }
}

class Dog: Animal {
    override func speak() {
        print("Woof!")
    }
}
```

**Q5: How does Copy-on-Write work?**

```swift
/*
Copy-on-Write (COW) is an optimization technique:
1. During copy, only reference count is increased, no actual data copy
2. When modification occurs, reference count is checked
3. If reference count > 1, create actual copy
4. If reference count = 1, modify directly

Swift's Array, Dictionary, String, etc. all implement COW.
*/

var array1 = [1, 2, 3]
var array2 = array1  // Shared storage, reference count increases

// At this point array1 and array2 point to the same memory
// No actual copy has occurred

array2.append(4)  // Modification triggers copy
// Now array1 and array2 have separate storage

// Can use isKnownUniquelyReferenced to check
```

### Code Challenge Questions

**Question 1: Predict the Output**

```swift
struct Point {
    var x: Int
    var y: Int
}

class Circle {
    var center: Point
    var radius: Double

    init(center: Point, radius: Double) {
        self.center = center
        self.radius = radius
    }
}

var p1 = Point(x: 0, y: 0)
var p2 = p1
p2.x = 10

var c1 = Circle(center: Point(x: 5, y: 5), radius: 10)
var c2 = c1
c2.center.x = 20
c2.radius = 20

print("p1.x = \(p1.x)")           // ?
print("p2.x = \(p2.x)")           // ?
print("c1.center.x = \(c1.center.x)")  // ?
print("c1.radius = \(c1.radius)")      // ?

/*
Answers:
p1.x = 0 (Struct is value type, p2 is a copy of p1)
p2.x = 10
c1.center.x = 20 (Class is reference type, c2 and c1 point to same object)
c1.radius = 20
*/
```

**Question 2: Fix the Memory Leak**

```swift
class Node {
    var value: Int
    var next: Node?  // May cause retain cycle
    var previous: Node?  // May cause retain cycle

    init(value: Int) {
        self.value = value
    }
}

// Fixed version
class SafeNode {
    var value: Int
    var next: SafeNode?
    weak var previous: SafeNode?  // Use weak to break cycle

    init(value: Int) {
        self.value = value
    }
}
```

## Further Reading

### Official Documentation

- [Swift Language Guide - Structures and Classes](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/classesandstructures/)
- [Swift Language Guide - Properties](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/properties/)
- [WWDC 2015 - Building Better Apps with Value Types in Swift](https://developer.apple.com/videos/play/wwdc2015/414/)
- [WWDC 2016 - Understanding Swift Performance](https://developer.apple.com/videos/play/wwdc2016/416/)

### Classic Books

- "Swift Programming: The Big Nerd Ranch Guide" - Chapters 14-15
- "Advanced Swift" by objc.io - Chapter 1 on Structs and Classes
- "Pro Swift" by Paul Hudson - Value Types and Reference Types chapter

### Advanced Topics

- [Automatic Reference Counting (ARC)](/swift/arc) - Understanding class memory management
- [Swift Closures Deep Dive](/swift/closures) - Closures and value capture
- [Swift Concurrency](/swift/concurrency) - Actors and value type safety
- [Swift Protocols and Generics](/swift/protocols-generics) - Polymorphism with structs

### Community Resources

- [Swift by Sundell - Value and Reference Types](https://www.swiftbysundell.com/articles/value-and-reference-types-in-swift/)
- [Ray Wenderlich - Reference vs Value Types in Swift](https://www.kodeco.com/9481-reference-vs-value-types-in-swift)
- [objc.io - Value Types](https://www.objc.io/issues/16-swift/swift-classes-vs-structs/)

## Summary

Structs and classes are the two pillars of Swift programming, and understanding their differences is crucial for writing high-quality code:

1. **Prefer value types**: Swift recommends using structs by default because they're safer and more predictable
2. **Reference type scenarios**: Use classes when you need inheritance, identity, deinitializers, or shared state
3. **The nature of mutating**: Struct methods need mutating to modify properties because value types are immutable by default
4. **Performance tradeoffs**: Structs are faster for small data, classes are more efficient for large shared data
5. **Copy-on-Write**: Swift implements COW optimization for standard library collection types

Once you master these concepts, you'll be able to make the right type choices in your projects and write Swift code that is both safe and efficient.
