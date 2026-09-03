---
title: Swift Extensions
description: Learn Swift extensions to add functionality to existing types including computed properties and protocol conformance
track: swift
section: optionals-protocols
difficulty: intermediate
tags:
  - Swift
  - extensions
  - protocols
status: imported
origin: old/src/content/docs/swift/extensions.en.md
divergence: 0.151
issues: []
legacy:
  category: Swift
  subcategory: Core Concepts
  order: 12
  lastUpdated: 2026-01-07
---

Extensions are one of Swift's most powerful features, allowing you to add new functionality to existing types even when you don't have access to the original source code. This comprehensive guide covers everything from basic extension syntax to advanced patterns like conditional conformance.

## What Are Extensions?

### Definition

Extensions add new functionality to an existing class, structure, enumeration, or protocol type. This includes types from the Swift standard library, third-party frameworks, or your own code.

Key characteristics of Swift extensions:

- **No source code access required**: Extend any type, including built-in types
- **Retroactive modeling**: Make existing types conform to new protocols
- **Type safety**: All extension code benefits from full type checking
- **Compile-time resolution**: Extensions are resolved at compile time, not runtime

```swift
// Add new functionality to the built-in Int type
extension Int {
    var squared: Int {
        return self * self
    }

    func times(_ action: () -> Void) {
        for _ in 0..<self {
            action()
        }
    }
}

// Using the extended functionality
print(5.squared)  // 25

3.times {
    print("Hello!")
}
// Hello!
// Hello!
// Hello!
```

### Historical Context

The concept of extensions has roots in several programming paradigms:

1. **Objective-C Categories**: Swift extensions' direct predecessor, though categories cannot add stored properties
2. **Ruby Open Classes**: Allow runtime class modification, but lack type safety
3. **C# Extension Methods**: Limited to methods only, with more verbose syntax
4. **Kotlin Extension Functions**: Similar to Swift, but with different implementation mechanics

Swift extensions combine the best aspects of these approaches, providing a type-safe, feature-rich extension mechanism.

### What Extensions Can Do

Extensions can add the following to existing types:

- Computed instance properties and computed type properties
- Instance methods and type methods
- New initializers
- Subscripts
- Nested types
- Protocol conformance

**What extensions cannot do:**

- Add stored properties
- Add property observers to existing properties
- Override existing functionality

## How Extensions Work

### Compile-Time Mechanism

Swift extensions are processed at compile time. The compiler effectively "merges" extension content with the original type, which means:

1. **Static dispatch**: Extension methods use static dispatch by default, offering better performance
2. **Type safety**: All extension code undergoes complete type checking
3. **No runtime overhead**: Unlike dynamic languages, there's no runtime lookup cost

```swift
struct Point {
    var x: Double
    var y: Double
}

extension Point {
    // Computed property - determined at compile time
    var magnitude: Double {
        return sqrt(x * x + y * y)
    }

    // Method - static dispatch
    func distance(to other: Point) -> Double {
        let dx = x - other.x
        let dy = y - other.y
        return sqrt(dx * dx + dy * dy)
    }
}
```

### Extensions and the Original Type

Extensions are part of the original type, not separate entities:

```swift
class Vehicle {
    var speed: Double = 0

    func accelerate() {
        speed += 10
    }
}

extension Vehicle {
    // Can access all members of the original type
    func doubleSpeed() {
        speed *= 2  // Access stored property
        accelerate()  // Call original method
    }

    // Can access private members (within the same file)
}
```

### Dynamic Dispatch in Class Extensions

For class types, extension methods don't support dynamic dispatch and overriding by default:

```swift
class Animal {
    func speak() {
        print("...")
    }
}

extension Animal {
    func greet() {
        print("Hello!")
    }
}

class Dog: Animal {
    override func speak() {
        print("Woof!")
    }

    // Error: Cannot override extension methods
    // override func greet() { }
}

let animal: Animal = Dog()
animal.speak()  // "Woof!" - dynamic dispatch
animal.greet()  // "Hello!" - static dispatch, always calls Animal's implementation
```

To enable overriding in extension methods, use the `@objc` attribute:

```swift
class Animal {
    func speak() {
        print("...")
    }
}

extension Animal {
    @objc func greet() {
        print("Hello!")
    }
}

class Dog: Animal {
    override func greet() {
        print("Woof, hello!")
    }
}
```

## Core Extension Features

### Computed Properties

Extensions can add computed instance and type properties:

```swift
extension Double {
    // Distance unit conversions
    var km: Double { return self * 1000.0 }
    var m: Double { return self }
    var cm: Double { return self / 100.0 }
    var mm: Double { return self / 1000.0 }
    var ft: Double { return self / 3.28084 }

    // Type property
    static var tau: Double { return 2 * .pi }
}

let marathon = 42.km + 195.m
print("Marathon distance: \(marathon) meters")  // 42195.0 meters

let height = 5.5.ft
print("Height: \(height) meters")  // Approximately 1.676 meters

print("Tau: \(Double.tau)")  // 6.283185307179586
```

### Methods

Extensions can add instance methods and type methods:

```swift
extension String {
    // Instance method
    func truncated(to length: Int, trailing: String = "...") -> String {
        if self.count <= length {
            return self
        }
        return String(self.prefix(length)) + trailing
    }

    func words() -> [String] {
        return self.components(separatedBy: .whitespaces)
            .filter { !$0.isEmpty }
    }

    // Mutating method (for value types)
    mutating func appendLine(_ line: String) {
        self += "\n" + line
    }

    // Type method
    static func random(length: Int) -> String {
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<length).map { _ in letters.randomElement()! })
    }
}

// Usage
let title = "This is a very long title that needs truncation"
print(title.truncated(to: 20))  // "This is a very long ..."

let sentence = "Swift is an excellent programming language"
print(sentence.words())  // ["Swift", "is", "an", "excellent", "programming", "language"]

var text = "First line"
text.appendLine("Second line")
print(text)
// First line
// Second line

print(String.random(length: 8))  // e.g., "xK9mP2nL"
```

### Initializers

Extensions can add new initializers to types:

```swift
struct Size {
    var width: Double
    var height: Double
}

struct Point {
    var x: Double
    var y: Double
}

struct Rect {
    var origin: Point
    var size: Size
}

extension Rect {
    // Convenience initializer using center point
    init(center: Point, size: Size) {
        let originX = center.x - size.width / 2
        let originY = center.y - size.height / 2
        self.init(origin: Point(x: originX, y: originY), size: size)
    }

    // Convenience initializer with individual values
    init(x: Double, y: Double, width: Double, height: Double) {
        self.init(
            origin: Point(x: x, y: y),
            size: Size(width: width, height: height)
        )
    }
}

// Using different initializers
let rect1 = Rect(origin: Point(x: 0, y: 0), size: Size(width: 100, height: 50))
let rect2 = Rect(center: Point(x: 50, y: 25), size: Size(width: 100, height: 50))
let rect3 = Rect(x: 0, y: 0, width: 100, height: 50)
```

For class types, extensions can only add convenience initializers:

```swift
class Person {
    var name: String
    var age: Int

    init(name: String, age: Int) {
        self.name = name
        self.age = age
    }
}

extension Person {
    // Convenience initializers must call designated initializer
    convenience init(name: String) {
        self.init(name: name, age: 0)
    }

    convenience init(dictionary: [String: Any]) {
        let name = dictionary["name"] as? String ?? "Unknown"
        let age = dictionary["age"] as? Int ?? 0
        self.init(name: name, age: age)
    }
}

let person1 = Person(name: "Alice", age: 25)
let person2 = Person(name: "Bob")
let person3 = Person(dictionary: ["name": "Charlie", "age": 30])
```

### Subscripts

Extensions can add new subscripts:

```swift
extension Array {
    // Safe subscript access
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}

let numbers = [1, 2, 3, 4, 5]
print(numbers[safe: 2])   // Optional(3)
print(numbers[safe: 10])  // nil (doesn't crash)

extension String {
    // Access character by integer index
    subscript(index: Int) -> Character? {
        guard index >= 0 && index < count else { return nil }
        return self[self.index(startIndex, offsetBy: index)]
    }

    // Access substring by range
    subscript(range: Range<Int>) -> String? {
        guard range.lowerBound >= 0 && range.upperBound <= count else {
            return nil
        }
        let start = index(startIndex, offsetBy: range.lowerBound)
        let end = index(startIndex, offsetBy: range.upperBound)
        return String(self[start..<end])
    }
}

let str = "Hello, Swift!"
print(str[0])       // Optional("H")
print(str[7])       // Optional("S")
print(str[0..<5])   // Optional("Hello")
```

### Nested Types

Extensions can add new nested types:

```swift
extension Int {
    enum Kind {
        case negative, zero, positive
    }

    var kind: Kind {
        switch self {
        case 0:
            return .zero
        case let x where x > 0:
            return .positive
        default:
            return .negative
        }
    }
}

func printIntegerKinds(_ numbers: [Int]) {
    for number in numbers {
        switch number.kind {
        case .negative:
            print("- ", terminator: "")
        case .zero:
            print("0 ", terminator: "")
        case .positive:
            print("+ ", terminator: "")
        }
    }
    print("")
}

printIntegerKinds([3, 19, -27, 0, -6, 0, 7])
// Output: + + - 0 - 0 +
```

### Protocol Conformance

Extensions can make existing types conform to protocols:

```swift
protocol Describable {
    var description: String { get }
}

// Make existing types conform to protocol
extension Int: Describable {
    var description: String {
        return "Integer: \(self)"
    }
}

extension Double: Describable {
    var description: String {
        return String(format: "Float: %.2f", self)
    }
}

extension String: Describable {
    var description: String {
        return "String: \"\(self)\""
    }
}

func printValue(_ value: Describable) {
    print(value.description)
}

printValue(42)        // Integer: 42
printValue(3.14159)   // Float: 3.14
printValue("Hello")   // String: "Hello"
```

### Conditional Conformance

Conditional conformance allows generic types to conform to a protocol only when specific conditions are met:

```swift
// Standard library example: Array conforms to Equatable when Element is Equatable
extension Array: Equatable where Element: Equatable {
    // Swift standard library provides the implementation
}

// Custom example
protocol Summable {
    static func +(lhs: Self, rhs: Self) -> Self
    static var zero: Self { get }
}

extension Int: Summable {
    static var zero: Int { return 0 }
}

extension Double: Summable {
    static var zero: Double { return 0.0 }
}

// Array is Summable when elements are Summable
extension Array: Summable where Element: Summable {
    static func +(lhs: [Element], rhs: [Element]) -> [Element] {
        return lhs + rhs
    }

    static var zero: [Element] {
        return []
    }

    var sum: Element {
        return reduce(Element.zero, +)
    }
}

let numbers = [1, 2, 3, 4, 5]
print(numbers.sum)  // 15

let doubles = [1.5, 2.5, 3.0]
print(doubles.sum)  // 7.0
```

A more comprehensive conditional conformance example:

```swift
// Custom container type
struct Box<T> {
    let value: T
}

// Box<T> conforms to Equatable when T conforms to Equatable
extension Box: Equatable where T: Equatable {
    static func == (lhs: Box<T>, rhs: Box<T>) -> Bool {
        return lhs.value == rhs.value
    }
}

// Box<T> conforms to Hashable when T conforms to Hashable
extension Box: Hashable where T: Hashable {
    func hash(into hasher: inout Hasher) {
        hasher.combine(value)
    }
}

// Box<T> conforms to Comparable when T conforms to Comparable
extension Box: Comparable where T: Comparable {
    static func < (lhs: Box<T>, rhs: Box<T>) -> Bool {
        return lhs.value < rhs.value
    }
}

// Usage
let box1 = Box(value: 10)
let box2 = Box(value: 10)
let box3 = Box(value: 20)

print(box1 == box2)  // true
print(box1 < box3)   // true

// Can be used in a Set (because it conforms to Hashable)
let boxSet: Set<Box<Int>> = [box1, box2, box3]
print(boxSet.count)  // 2 (box1 and box2 are equal)
```

## Practical Examples

### Example 1: Enhancing Collection Types

```swift
extension Collection {
    // Safe element access
    subscript(safe index: Index) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }

    // Check if not empty
    var isNotEmpty: Bool {
        return !isEmpty
    }
}

extension Collection where Element: Numeric {
    // Sum of all elements
    var sum: Element {
        return reduce(0, +)
    }

    // Product of all elements
    var product: Element {
        return reduce(1, *)
    }
}

extension Collection where Element: Comparable {
    // Get minimum and maximum values
    var minMax: (min: Element, max: Element)? {
        guard let first = first else { return nil }
        return reduce((first, first)) { result, element in
            (Swift.min(result.0, element), Swift.max(result.1, element))
        }
    }
}

extension Collection where Element: Equatable {
    // Remove duplicates (preserving order)
    func unique() -> [Element] {
        var seen: [Element] = []
        return filter { element in
            if seen.contains(element) {
                return false
            }
            seen.append(element)
            return true
        }
    }

    // Count occurrences of an element
    func count(of element: Element) -> Int {
        return filter { $0 == element }.count
    }
}

// Usage
let numbers = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
print(numbers.sum)                    // 44
print(numbers.minMax!)                // (min: 1, max: 9)
print(numbers.unique())               // [3, 1, 4, 5, 9, 2, 6]
print(numbers.count(of: 5))           // 3

let emptyArray: [Int] = []
print(emptyArray.isNotEmpty)          // false
print(emptyArray[safe: 0])            // nil
```

### Example 2: Date Extensions

```swift
import Foundation

extension Date {
    // MARK: - Date Components

    var year: Int {
        return Calendar.current.component(.year, from: self)
    }

    var month: Int {
        return Calendar.current.component(.month, from: self)
    }

    var day: Int {
        return Calendar.current.component(.day, from: self)
    }

    var hour: Int {
        return Calendar.current.component(.hour, from: self)
    }

    var minute: Int {
        return Calendar.current.component(.minute, from: self)
    }

    var weekday: Int {
        return Calendar.current.component(.weekday, from: self)
    }

    // MARK: - Date Checks

    var isToday: Bool {
        return Calendar.current.isDateInToday(self)
    }

    var isYesterday: Bool {
        return Calendar.current.isDateInYesterday(self)
    }

    var isTomorrow: Bool {
        return Calendar.current.isDateInTomorrow(self)
    }

    var isWeekend: Bool {
        return Calendar.current.isDateInWeekend(self)
    }

    var isInPast: Bool {
        return self < Date()
    }

    var isInFuture: Bool {
        return self > Date()
    }

    // MARK: - Date Calculations

    func adding(days: Int) -> Date {
        return Calendar.current.date(byAdding: .day, value: days, to: self)!
    }

    func adding(months: Int) -> Date {
        return Calendar.current.date(byAdding: .month, value: months, to: self)!
    }

    func adding(years: Int) -> Date {
        return Calendar.current.date(byAdding: .year, value: years, to: self)!
    }

    func days(from date: Date) -> Int {
        return Calendar.current.dateComponents([.day], from: date, to: self).day ?? 0
    }

    // MARK: - Date Formatting

    func formatted(_ format: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = format
        return formatter.string(from: self)
    }

    var shortDateString: String {
        return formatted("yyyy-MM-dd")
    }

    var longDateString: String {
        return formatted("MMMM d, yyyy")
    }

    var timeString: String {
        return formatted("HH:mm:ss")
    }

    // MARK: - Relative Time

    var relativeTimeString: String {
        let now = Date()
        let seconds = Int(now.timeIntervalSince(self))

        if seconds < 0 {
            return "In the future"
        }

        switch seconds {
        case 0..<60:
            return "Just now"
        case 60..<3600:
            return "\(seconds / 60) minutes ago"
        case 3600..<86400:
            return "\(seconds / 3600) hours ago"
        case 86400..<604800:
            return "\(seconds / 86400) days ago"
        default:
            return shortDateString
        }
    }
}

// Usage
let now = Date()
print("Year: \(now.year)")
print("Is today: \(now.isToday)")
print("Short date: \(now.shortDateString)")
print("Long date: \(now.longDateString)")

let yesterday = now.adding(days: -1)
print("Is yesterday: \(yesterday.isYesterday)")
print("Relative time: \(yesterday.relativeTimeString)")

let nextWeek = now.adding(days: 7)
print("Next week: \(nextWeek.shortDateString)")
print("Days difference: \(nextWeek.days(from: now))")
```

### Example 3: Optional Extensions

```swift
extension Optional {
    // Check if nil
    var isNil: Bool {
        return self == nil
    }

    // Check if not nil
    var isNotNil: Bool {
        return self != nil
    }

    // Unwrap or throw error
    func unwrap(or error: Error) throws -> Wrapped {
        guard let value = self else {
            throw error
        }
        return value
    }

    // Unwrap or crash with message
    func unwrap(orFatalError message: String) -> Wrapped {
        guard let value = self else {
            fatalError(message)
        }
        return value
    }

    // Execute closure if value exists
    func `do`(_ action: (Wrapped) -> Void) {
        if let value = self {
            action(value)
        }
    }

    // Convert to Result
    func toResult<E: Error>(withError error: E) -> Result<Wrapped, E> {
        switch self {
        case .some(let value):
            return .success(value)
        case .none:
            return .failure(error)
        }
    }
}

extension Optional where Wrapped: Collection {
    // Is nil or empty collection
    var isNilOrEmpty: Bool {
        return self?.isEmpty ?? true
    }

    // Is not nil and not empty
    var isNotNilOrEmpty: Bool {
        return !isNilOrEmpty
    }
}

extension Optional where Wrapped == String {
    // Is nil, empty, or whitespace only
    var isNilOrBlank: Bool {
        return self?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true
    }

    // Return empty string if nil
    func orEmpty() -> String {
        return self ?? ""
    }
}

// Usage
enum MyError: Error {
    case valueNotFound
}

let optionalValue: Int? = nil
print(optionalValue.isNil)  // true

let optionalString: String? = "  "
print(optionalString.isNilOrBlank)  // true

let optionalArray: [Int]? = []
print(optionalArray.isNilOrEmpty)  // true

let name: String? = "Swift"
name.do { value in
    print("Name is \(value)")  // Name is Swift
}

// Using Result conversion
let result = optionalValue.toResult(withError: MyError.valueNotFound)
switch result {
case .success(let value):
    print("Value: \(value)")
case .failure(let error):
    print("Error: \(error)")  // Error: valueNotFound
}
```

### Example 4: Result Extensions

```swift
extension Result {
    // Check if success
    var isSuccess: Bool {
        switch self {
        case .success:
            return true
        case .failure:
            return false
        }
    }

    // Check if failure
    var isFailure: Bool {
        return !isSuccess
    }

    // Get success value
    var value: Success? {
        switch self {
        case .success(let value):
            return value
        case .failure:
            return nil
        }
    }

    // Get error
    var error: Failure? {
        switch self {
        case .success:
            return nil
        case .failure(let error):
            return error
        }
    }

    // Execute on success
    @discardableResult
    func onSuccess(_ action: (Success) -> Void) -> Result {
        if case .success(let value) = self {
            action(value)
        }
        return self
    }

    // Execute on failure
    @discardableResult
    func onFailure(_ action: (Failure) -> Void) -> Result {
        if case .failure(let error) = self {
            action(error)
        }
        return self
    }

    // Convert to optional
    func toOptional() -> Success? {
        return value
    }

    // Recover from error
    func recover(_ recovery: (Failure) -> Success) -> Success {
        switch self {
        case .success(let value):
            return value
        case .failure(let error):
            return recovery(error)
        }
    }
}

// Usage
enum NetworkError: Error {
    case noConnection
    case timeout
    case serverError(code: Int)
}

func fetchData() -> Result<String, NetworkError> {
    // Simulating network request
    return .success("Data content")
}

let result = fetchData()
    .onSuccess { data in
        print("Fetch successful: \(data)")
    }
    .onFailure { error in
        print("Fetch failed: \(error)")
    }

// Chained calls
let processedResult = result
    .map { $0.uppercased() }
    .mapError { _ in NetworkError.serverError(code: 500) }

// Using recover
let data = Result<String, NetworkError>.failure(.noConnection)
    .recover { error in
        switch error {
        case .noConnection:
            return "Offline data"
        default:
            return "Default data"
        }
    }
print(data)  // "Offline data"
```

### Example 5: Protocol Extensions with Default Implementations

```swift
// Define protocols
protocol Identifiable {
    var id: String { get }
}

protocol Timestamped {
    var createdAt: Date { get }
    var updatedAt: Date { get set }
}

protocol Persistable: Identifiable, Timestamped {
    func save() throws
    func delete() throws
}

// Provide default implementations
extension Identifiable {
    var id: String {
        return UUID().uuidString
    }
}

extension Timestamped {
    var createdAt: Date {
        return Date()
    }
}

extension Persistable {
    func save() throws {
        print("Saving object \(id) at \(updatedAt)")
        // Default save logic
    }

    func delete() throws {
        print("Deleting object \(id)")
        // Default delete logic
    }

    // Add additional functionality
    func touch() -> Self {
        var copy = self
        copy.updatedAt = Date()
        return copy
    }
}

// Type that conforms to the protocol
struct User: Persistable {
    let id: String
    let name: String
    var email: String
    let createdAt: Date
    var updatedAt: Date

    init(name: String, email: String) {
        self.id = UUID().uuidString
        self.name = name
        self.email = email
        self.createdAt = Date()
        self.updatedAt = Date()
    }
}

// Usage
var user = User(name: "Alice", email: "alice@example.com")
try user.save()  // Uses default implementation

user = user.touch()  // Uses method added by extension
```

## Best Practices

### Use Extensions to Organize Code

Group related functionality into different extensions to improve readability:

```swift
class UserViewController: UIViewController {
    // Property declarations
    private var users: [User] = []
    private var selectedUser: User?
}

// MARK: - Lifecycle
extension UserViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        loadData()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        refreshData()
    }
}

// MARK: - UI Setup
extension UserViewController {
    private func setupUI() {
        // UI setup code
    }
}

// MARK: - Data Loading
extension UserViewController {
    private func loadData() {
        // Data loading code
    }

    private func refreshData() {
        // Refresh data code
    }
}

// MARK: - UITableViewDataSource
extension UserViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return users.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        // Cell configuration
        return UITableViewCell()
    }
}

// MARK: - UITableViewDelegate
extension UserViewController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        selectedUser = users[indexPath.row]
    }
}
```

### Prefer Protocol Extensions for Default Implementations

```swift
// Good practice: Protocol extension provides default implementation
protocol Loggable {
    var logTag: String { get }
    func log(_ message: String)
}

extension Loggable {
    var logTag: String {
        return String(describing: type(of: self))
    }

    func log(_ message: String) {
        print("[\(logTag)] \(message)")
    }
}

// Types just need to conform to get functionality
struct UserService: Loggable {
    func fetchUser() {
        log("Starting user fetch")  // [UserService] Starting user fetch
    }
}
```

### Use Conditional Extensions to Avoid Type Constraint Pollution

```swift
// Bad practice: Requiring too many constraints in protocol definition
protocol BadContainer {
    associatedtype Element: Equatable & Hashable & Comparable
    // Requires all elements to conform to three protocols
}

// Good practice: Use conditional extensions
protocol GoodContainer {
    associatedtype Element
    var elements: [Element] { get }
}

extension GoodContainer where Element: Equatable {
    func contains(_ element: Element) -> Bool {
        return elements.contains(element)
    }
}

extension GoodContainer where Element: Hashable {
    var uniqueElements: Set<Element> {
        return Set(elements)
    }
}

extension GoodContainer where Element: Comparable {
    var sortedElements: [Element] {
        return elements.sorted()
    }
}
```

### Use Prefixes When Extending Third-Party Types

```swift
// When adding extensions to third-party types, use prefixes to avoid naming conflicts
extension String {
    // Use project or module prefix
    var myApp_isValidEmail: Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        return NSPredicate(format: "SELF MATCHES %@", emailRegex).evaluate(with: self)
    }

    func myApp_truncated(to length: Int) -> String {
        if count <= length { return self }
        return String(prefix(length)) + "..."
    }
}

// Or use nested types for organization
extension String {
    struct MyApp {
        let string: String

        var isValidEmail: Bool {
            let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
            return NSPredicate(format: "SELF MATCHES %@", emailRegex).evaluate(with: string)
        }
    }

    var myApp: MyApp {
        return MyApp(string: self)
    }
}

// Usage
let email = "test@example.com"
print(email.myApp.isValidEmail)  // true
```

### Avoid Adding Storage Requirements in Extensions

```swift
// Error: Extensions cannot add stored properties
// extension User {
//     var cachedData: Data  // Compile error
// }

// Solution 1: Use associated objects (class types only, requires Objective-C runtime)
import ObjectiveC

extension UIView {
    private struct AssociatedKeys {
        static var customTag = "customTag"
    }

    var customTag: String? {
        get {
            return objc_getAssociatedObject(self, &AssociatedKeys.customTag) as? String
        }
        set {
            objc_setAssociatedObject(self, &AssociatedKeys.customTag, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        }
    }
}

// Solution 2: Use computed properties with external storage
class DataCache {
    static let shared = DataCache()
    private var cache: [ObjectIdentifier: Data] = [:]

    func data(for object: AnyObject) -> Data? {
        return cache[ObjectIdentifier(object)]
    }

    func setData(_ data: Data?, for object: AnyObject) {
        cache[ObjectIdentifier(object)] = data
    }
}

extension NSObject {
    var cachedData: Data? {
        get { DataCache.shared.data(for: self) }
        set { DataCache.shared.setData(newValue, for: self) }
    }
}
```

## Common Pitfalls

### Static Dispatch in Extension Methods

```swift
protocol Greeter {
    func greet()
}

extension Greeter {
    func greet() {
        print("Hello!")
    }

    func farewell() {
        print("Goodbye!")
    }
}

struct EnglishGreeter: Greeter {
    func greet() {
        print("Hi there!")
    }

    func farewell() {
        print("See you!")
    }
}

let greeter: Greeter = EnglishGreeter()
greeter.greet()     // "Hi there!" - dynamic dispatch (protocol requirement)
greeter.farewell()  // "Goodbye!" - static dispatch (extension method)

let englishGreeter = EnglishGreeter()
englishGreeter.greet()     // "Hi there!"
englishGreeter.farewell()  // "See you!" - direct call to concrete type's method
```

### Naming Conflicts

```swift
// If multiple extensions define methods with the same name, unexpected behavior may occur
extension Array where Element == Int {
    func sum() -> Int {
        return reduce(0, +)
    }
}

extension Array where Element: Numeric {
    func sum() -> Element {
        return reduce(0, +)
    }
}

let ints: [Int] = [1, 2, 3]
print(ints.sum())  // Compiler chooses the more specific version

// Solution: Use explicit naming or different method names
extension Array where Element == Int {
    func intSum() -> Int {
        return reduce(0, +)
    }
}
```

### Protocol Extensions and Class Inheritance Interaction

```swift
protocol Describable {
    var description: String { get }
}

extension Describable {
    var description: String {
        return "A Describable object"
    }

    var detailedDescription: String {
        return "Details: \(description)"
    }
}

class Base: Describable {
    var description: String {
        return "Base"
    }
}

class Derived: Base {
    override var description: String {
        return "Derived"
    }
}

let obj: Describable = Derived()
print(obj.description)          // "Derived" - dynamic dispatch
print(obj.detailedDescription)  // "Details: Derived" - uses dynamically dispatched description

let base: Base = Derived()
print(base.description)          // "Derived" - dynamic dispatch
print(base.detailedDescription)  // "Details: Derived"
```

### Access Control in Extensions

```swift
public struct PublicStruct {
    private var privateValue: Int = 0
    internal var internalValue: Int = 0
}

// Extensions in the same file can access private members
extension PublicStruct {
    mutating func updatePrivate() {
        privateValue = 10  // Accessible
    }
}

// Extensions in different files cannot access private members
// file2.swift
// extension PublicStruct {
//     func readPrivate() {
//         print(privateValue)  // Compile error
//     }
// }
```

### Unexpected Behavior with Conditional Conformance

```swift
protocol Printable {
    func printSelf()
}

extension Array: Printable where Element: Printable {
    func printSelf() {
        forEach { $0.printSelf() }
    }
}

extension Int: Printable {
    func printSelf() {
        print(self)
    }
}

let ints: [Int] = [1, 2, 3]
ints.printSelf()  // Works correctly

let strings: [String] = ["a", "b", "c"]
// strings.printSelf()  // Compile error: String doesn't conform to Printable

// Need to explicitly add conformance for String
extension String: Printable {
    func printSelf() {
        print(self)
    }
}
```

## Performance Considerations

### Static Dispatch vs Dynamic Dispatch

Extension methods use static dispatch by default, offering better performance:

```swift
protocol Shape {
    func area() -> Double  // Protocol requirement - dynamic dispatch
}

extension Shape {
    func perimeter() -> Double {  // Extension method - static dispatch
        return 0  // Default implementation
    }

    func describe() -> String {  // Extension method - static dispatch
        return "Area: \(area()), Perimeter: \(perimeter())"
    }
}

struct Circle: Shape {
    let radius: Double

    func area() -> Double {
        return .pi * radius * radius
    }

    func perimeter() -> Double {
        return 2 * .pi * radius
    }
}

// Performance comparison
func testPerformance() {
    let shapes: [Shape] = (0..<1000000).map { _ in Circle(radius: 1) }

    // Dynamic dispatch
    let start1 = CFAbsoluteTimeGetCurrent()
    for shape in shapes {
        _ = shape.area()
    }
    print("Dynamic dispatch: \(CFAbsoluteTimeGetCurrent() - start1) seconds")

    // Static dispatch (using concrete type directly)
    let circles = shapes.compactMap { $0 as? Circle }
    let start2 = CFAbsoluteTimeGetCurrent()
    for circle in circles {
        _ = circle.area()
    }
    print("Static dispatch: \(CFAbsoluteTimeGetCurrent() - start2) seconds")
}
```

### Generic Specialization

Using generic constraints can help the compiler optimize through specialization:

```swift
// Allows compiler specialization
extension Array where Element == Int {
    func fastSum() -> Int {
        var result = 0
        for element in self {
            result += element
        }
        return result
    }
}

// Slower generic version
extension Array where Element: Numeric {
    func genericSum() -> Element {
        return reduce(0, +)
    }
}
```

### Avoid Unnecessary Protocol Overhead

```swift
// Using existential types has additional overhead
func processAny(_ items: [any Equatable]) {
    // Each comparison requires dynamic dispatch
}

// Using generics is more efficient
func processGeneric<T: Equatable>(_ items: [T]) {
    // Compiler can specialize
}

// Most efficient: Use concrete types directly
func processInts(_ items: [Int]) {
    // Fully static dispatch
}
```

## Real-World Scenarios

### Scenario 1: Network Layer Encapsulation

```swift
protocol NetworkRequest {
    associatedtype Response: Decodable
    var path: String { get }
    var method: HTTPMethod { get }
    var parameters: [String: Any]? { get }
    var headers: [String: String]? { get }
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

extension NetworkRequest {
    var method: HTTPMethod { .get }
    var parameters: [String: Any]? { nil }
    var headers: [String: String]? { nil }

    func execute() async throws -> Response {
        // Build request
        var urlComponents = URLComponents(string: "https://api.example.com" + path)!

        if method == .get, let params = parameters {
            urlComponents.queryItems = params.map {
                URLQueryItem(name: $0.key, value: "\($0.value)")
            }
        }

        var request = URLRequest(url: urlComponents.url!)
        request.httpMethod = method.rawValue

        if let headers = headers {
            for (key, value) in headers {
                request.setValue(value, forHTTPHeaderField: key)
            }
        }

        if method != .get, let params = parameters {
            request.httpBody = try JSONSerialization.data(withJSONObject: params)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(Response.self, from: data)
    }
}

// Define specific requests
struct UserRequest: NetworkRequest {
    typealias Response = User
    let userId: Int

    var path: String { "/users/\(userId)" }
}

struct CreateUserRequest: NetworkRequest {
    typealias Response = User
    let name: String
    let email: String

    var path: String { "/users" }
    var method: HTTPMethod { .post }
    var parameters: [String: Any]? {
        ["name": name, "email": email]
    }
}

// Usage
Task {
    let user = try await UserRequest(userId: 123).execute()
    print("Fetched user: \(user.name)")

    let newUser = try await CreateUserRequest(name: "Alice", email: "alice@example.com").execute()
    print("Created user: \(newUser.name)")
}
```

### Scenario 2: SwiftUI View Extensions

```swift
import SwiftUI

// MARK: - Conditional View Modifiers
extension View {
    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }

    @ViewBuilder
    func ifLet<T, Content: View>(_ optional: T?, transform: (Self, T) -> Content) -> some View {
        if let value = optional {
            transform(self, value)
        } else {
            self
        }
    }
}

// MARK: - Common Style Extensions
extension View {
    func cardStyle(cornerRadius: CGFloat = 12, shadowRadius: CGFloat = 4) -> some View {
        self
            .background(Color.white)
            .cornerRadius(cornerRadius)
            .shadow(radius: shadowRadius)
    }

    func primaryButtonStyle() -> some View {
        self
            .font(.headline)
            .foregroundColor(.white)
            .padding()
            .background(Color.blue)
            .cornerRadius(10)
    }

    func hideKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}

// MARK: - Navigation Extensions
extension View {
    func navigate<Destination: View>(
        isActive: Binding<Bool>,
        @ViewBuilder destination: () -> Destination
    ) -> some View {
        background(
            NavigationLink(
                destination: destination(),
                isActive: isActive,
                label: { EmptyView() }
            )
        )
    }
}

// Usage example
struct ContentView: View {
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showDetail = false

    var body: some View {
        VStack {
            Text("Title")
                .if(isLoading) { view in
                    view.opacity(0.5)
                }
                .ifLet(errorMessage) { view, error in
                    view.foregroundColor(.red)
                }

            Button("Submit") {
                // Handle submission
            }
            .primaryButtonStyle()

            VStack {
                Text("Card content")
            }
            .cardStyle()
        }
        .navigate(isActive: $showDetail) {
            Text("Detail Page")
        }
    }
}
```

### Scenario 3: Error Handling Extensions

```swift
// Define application error types
enum AppError: LocalizedError {
    case network(underlying: Error)
    case parsing(message: String)
    case validation(field: String, message: String)
    case authentication
    case unknown

    var errorDescription: String? {
        switch self {
        case .network(let error):
            return "Network error: \(error.localizedDescription)"
        case .parsing(let message):
            return "Data parsing failed: \(message)"
        case .validation(let field, let message):
            return "\(field): \(message)"
        case .authentication:
            return "Authentication failed, please log in again"
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

// Error extensions
extension Error {
    var asAppError: AppError {
        if let appError = self as? AppError {
            return appError
        }
        return .network(underlying: self)
    }

    func log(file: String = #file, line: Int = #line, function: String = #function) {
        let fileName = (file as NSString).lastPathComponent
        print("[\(fileName):\(line)] \(function) - Error: \(localizedDescription)")
    }
}

// Result error handling extension
extension Result where Failure == Error {
    func mapToAppError() -> Result<Success, AppError> {
        mapError { $0.asAppError }
    }
}

// Async function error handling
extension Task where Failure == Error {
    @discardableResult
    static func retrying(
        maxRetries: Int = 3,
        delay: TimeInterval = 1,
        operation: @escaping () async throws -> Success
    ) -> Task {
        Task {
            var lastError: Error?
            for attempt in 0..<maxRetries {
                do {
                    return try await operation()
                } catch {
                    lastError = error
                    if attempt < maxRetries - 1 {
                        try await Task<Never, Never>.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                    }
                }
            }
            throw lastError!
        }
    }
}

// Usage
func fetchUserData() async throws -> User {
    throw AppError.network(underlying: URLError(.notConnectedToInternet))
}

Task.retrying(maxRetries: 3, delay: 2) {
    try await fetchUserData()
}
```

## Interview Questions

### Common Interview Questions

**1. What can Swift extensions add, and what can't they add?**

Can add:
- Computed properties (instance and type)
- Instance methods and type methods
- New initializers (classes can only add convenience initializers)
- Subscripts
- Nested types
- Protocol conformance

Cannot add:
- Stored properties
- Property observers (willSet/didSet)
- Cannot override existing functionality

**2. Are extension methods statically or dynamically dispatched?**

They use static dispatch by default. This means:
- Better performance
- Subclasses cannot override them
- When called through a protocol type, the protocol extension's default implementation is called rather than the concrete type's implementation

**3. What is conditional conformance?**

Conditional conformance allows generic types to conform to a protocol only when specific conditions are met. For example:

```swift
extension Array: Equatable where Element: Equatable {
    // Array conforms to Equatable only when elements conform to Equatable
}
```

**4. What's the difference between protocol extensions and class inheritance?**

- Protocol extensions: Horizontal expansion, adding functionality without creating hierarchy
- Class inheritance: Vertical inheritance, creating hierarchy
- Protocol extensions cannot store state
- Protocols can be adopted by structs and enums

**5. How can you achieve stored property effects for third-party types?**

- Use associated objects (Objective-C runtime, classes only)
- Use external dictionary storage
- Use computed properties with global storage

### Code Challenge

**Implement a generic Result extension that adds chaining methods:**

```swift
extension Result {
    func chain<NewSuccess>(
        _ transform: (Success) -> Result<NewSuccess, Failure>
    ) -> Result<NewSuccess, Failure> {
        switch self {
        case .success(let value):
            return transform(value)
        case .failure(let error):
            return .failure(error)
        }
    }

    func ensure(
        _ predicate: (Success) -> Bool,
        orError error: Failure
    ) -> Result<Success, Failure> {
        flatMap { value in
            predicate(value) ? .success(value) : .failure(error)
        }
    }
}
```

## Further Reading

### Official Documentation
- [Swift Official Documentation - Extensions](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/extensions/)
- [Swift Official Documentation - Protocols](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/)
- [Swift Official Documentation - Generics](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/generics/)

### Deep Dive Resources
- [Swift Evolution - SE-0143: Conditional Conformances](https://github.com/apple/swift-evolution/blob/main/proposals/0143-conditional-conformances.md)
- [WWDC 2018 - Swift Generics](https://developer.apple.com/videos/play/wwdc2018/406/)
- [Swift by Sundell - The power of extensions in Swift](https://www.swiftbysundell.com/articles/the-power-of-extensions-in-swift/)

### Related Topics
- Protocol-Oriented Programming
- Generic Constraints and Type Erasure
- Swift Runtime and Method Dispatch

## Summary

Extensions are a fundamental part of Swift's powerful type system. By using extensions appropriately, you can write more modular and reusable code.

**Key Takeaways:**

1. **Extend without source access**: Add functionality to any type, including standard library types
2. **Organize code effectively**: Use extensions to group related functionality
3. **Protocol conformance**: Make existing types conform to new protocols
4. **Conditional conformance**: Provide protocol conformance based on generic constraints
5. **Default implementations**: Use protocol extensions to provide reusable default behavior
6. **Static dispatch**: Extension methods are statically dispatched by default
7. **No stored properties**: Extensions cannot add stored properties, only computed ones
8. **Code organization**: Use MARK comments and multiple extensions for better organization

**Best Practices:**

- Use extensions to organize large type definitions
- Prefer protocol extensions for providing default implementations
- Use conditional extensions to avoid over-constraining types
- Add prefixes when extending third-party types to avoid naming conflicts
- Be aware of static vs dynamic dispatch behavior
- Consider performance implications when designing extension hierarchies

With extensions, you can unlock the full potential of Swift's type system and write clean, maintainable, and extensible code.
