---
title: Enums and Pattern Matching
description: Complete guide to Swift enums and pattern matching, associated values, raw values and switch
track: swift
section: basics
difficulty: intermediate
tags:
  - Swift
  - Enums
  - Pattern Matching
  - switch
status: imported
origin: old/src/content/docs/swift/enums-pattern-matching.en.md
divergence: 0.187
issues: []
legacy:
  category: Swift
  subcategory: Language Features
  order: 7
  lastUpdated: 2026-01-07
---

Enumerations (enums) in Swift are first-class types that define a group of related values. Combined with Swift's powerful pattern matching capabilities, enums become one of the most expressive features of the language. We'll cover everything from basic enum definitions to advanced pattern matching techniques.

## Enum Basics

### Defining Simple Enums

At their simplest, enums define a type with a fixed set of possible values:

```swift
enum Direction {
    case north
    case south
    case east
    case west
}

// Multiple cases on one line
enum Planet {
    case mercury, venus, earth, mars, jupiter, saturn, uranus, neptune
}
```

### Using Enums

Once defined, you can create and use enum values:

```swift
var heading = Direction.north

// Type inference allows shorter syntax
heading = .south

func navigate(direction: Direction) {
    print("Heading \(direction)")
}

navigate(direction: .east)
```

### Enums as Types

Swift enums are full types, meaning they can have:
- Computed properties
- Instance methods
- Initializers
- Extensions
- Protocol conformances

```swift
enum Beverage {
    case coffee, tea, juice, water

    var isHot: Bool {
        switch self {
        case .coffee, .tea:
            return true
        case .juice, .water:
            return false
        }
    }

    func describe() -> String {
        switch self {
        case .coffee:
            return "A hot caffeinated drink"
        case .tea:
            return "A soothing warm beverage"
        case .juice:
            return "A refreshing fruit drink"
        case .water:
            return "Pure hydration"
        }
    }
}

let drink = Beverage.coffee
print(drink.isHot)      // true
print(drink.describe()) // "A hot caffeinated drink"
```

## Raw Values

Enums can store raw values of a specific type. Each case gets a unique raw value of that type.

### String Raw Values

```swift
enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
}

let method = HTTPMethod.post
print(method.rawValue) // "GET"

// If you omit the raw value for String enums, Swift uses the case name
enum Compass: String {
    case north, south, east, west
}

print(Compass.north.rawValue) // "north"
```

### Integer Raw Values

```swift
enum StatusCode: Int {
    case success = 200
    case created = 201
    case badRequest = 400
    case unauthorized = 401
    case notFound = 404
    case serverError = 500
}

print(StatusCode.notFound.rawValue) // 404

// Auto-incrementing integers
enum Priority: Int {
    case low = 1
    case medium    // 2
    case high      // 3
    case critical  // 4
}
```

### Initializing from Raw Values

You can create an enum from its raw value. This returns an optional since the raw value might not match any case:

```swift
if let status = StatusCode(rawValue: 404) {
    print("Status: \(status)") // Status: notFound
}

// Invalid raw value returns nil
let invalid = StatusCode(rawValue: 999) // nil
```

## Associated Values

Associated values are Swift's killer feature for enums. Each case can store different types and amounts of data:

```swift
enum NetworkResult {
    case success(data: Data, statusCode: Int)
    case failure(error: Error)
    case loading(progress: Double)
}

let result = NetworkResult.success(data: Data(), statusCode: 200)
let error = NetworkResult.failure(error: URLError(.notConnectedToInternet))
let progress = NetworkResult.loading(progress: 0.75)
```

### Practical Example: API Response

```swift
enum APIResponse<T> {
    case success(T)
    case failure(APIError)
    case loading
}

enum APIError {
    case networkError(underlying: Error)
    case decodingError(message: String)
    case serverError(code: Int, message: String)
    case unauthorized
}

func handleResponse(_ response: APIResponse<User>) {
    switch response {
    case .success(let user):
        print("Welcome, \(user.name)")
    case .failure(let error):
        handleError(error)
    case .loading:
        showLoadingIndicator()
    }
}
```

### Modeling Complex State

```swift
enum PaymentState {
    case idle
    case processing(transactionId: String)
    case completed(receipt: Receipt, timestamp: Date)
    case failed(reason: PaymentError, canRetry: Bool)
    case refunded(originalAmount: Decimal, refundAmount: Decimal)
}

struct Receipt {
    let id: String
    let amount: Decimal
}

enum PaymentError {
    case insufficientFunds
    case cardDeclined
    case networkError
}
```

## Pattern Matching with switch

The `switch` statement is the primary way to work with enums in Swift.

### Basic Switch

```swift
enum TrafficLight {
    case red, yellow, green
}

let light = TrafficLight.red

switch light {
case .red:
    print("Stop")
case .yellow:
    print("Caution")
case .green:
    print("Go")
}
```

### Switch Exhaustiveness

Swift requires switch statements on enums to be exhaustive - you must handle every case:

```swift
enum Suit {
    case hearts, diamonds, clubs, spades
}

let card = Suit.hearts

// This won't compile - missing cases
// switch card {
// case .hearts:
//     print("Red suit")
// }

// Option 1: Handle all cases
switch card {
case .hearts:
    print("Red heart suit")
case .diamonds:
    print("Red diamond suit")
case .clubs:
    print("Black club suit")
case .spades:
    print("Black spade suit")
}

// Option 2: Use default for remaining cases
switch card {
case .hearts, .diamonds:
    print("Red suit")
default:
    print("Black suit")
}
```

### Extracting Associated Values

Use pattern matching to extract associated values:

```swift
enum Measurement {
    case distance(meters: Double)
    case temperature(celsius: Double)
    case weight(kilograms: Double)
    case time(seconds: Double)
}

let reading = Measurement.distance(meters: 150.5)

switch reading {
case .distance(let meters):
    print("Distance: \(meters)m")
case .temperature(let celsius):
    print("Temperature: \(celsius)C")
case .weight(let kilograms):
    print("Weight: \(kilograms)kg")
case .time(let seconds):
    print("Time: \(seconds)s")
}

// Shorthand: place 'let' before the case name
switch reading {
case let .distance(meters):
    print("Distance: \(meters)m")
case let .temperature(celsius):
    print("Temperature: \(celsius)C")
case let .weight(kilograms):
    print("Weight: \(kilograms)kg")
case let .time(seconds):
    print("Time: \(seconds)s")
}
```

### Ignoring Associated Values

Use `_` to ignore values you don't need:

```swift
enum Event {
    case userLoggedIn(userId: String, timestamp: Date)
    case userLoggedOut(userId: String, timestamp: Date)
    case purchaseCompleted(orderId: String, amount: Decimal, timestamp: Date)
}

let event = Event.purchaseCompleted(orderId: "123", amount: 99.99, timestamp: Date())

switch event {
case .userLoggedIn(let userId, _):
    print("User \(userId) logged in")
case .userLoggedOut(let userId, _):
    print("User \(userId) logged out")
case .purchaseCompleted(let orderId, let amount, _):
    print("Order \(orderId) completed for $\(amount)")
}
```

## Where Clauses

Add conditions to pattern matching with `where`:

```swift
enum Score {
    case points(Int)
    case percentage(Double)
    case grade(String)
}

let result = Score.points(85)

switch result {
case .points(let value) where value >= 90:
    print("Excellent! A grade")
case .points(let value) where value >= 80:
    print("Good! B grade")
case .points(let value) where value >= 70:
    print("Satisfactory! C grade")
case .points(let value) where value >= 60:
    print("Pass! D grade")
case .points:
    print("Failed")
case .percentage(let pct) where pct >= 0.9:
    print("Excellent!")
case .percentage:
    print("Below excellent")
case .grade(let letter) where ["A", "B"].contains(letter):
    print("High performer")
case .grade:
    print("Standard performer")
}
```

### Complex Where Conditions

```swift
enum UserAction {
    case purchase(amount: Decimal, category: String)
    case refund(amount: Decimal, reason: String)
    case subscription(plan: String, monthlyPrice: Decimal)
}

let action = UserAction.purchase(amount: 150, category: "Electronics")

switch action {
case .purchase(let amount, let category) where amount > 100 && category == "Electronics":
    print("High-value electronics purchase - apply discount!")
case .purchase(let amount, _) where amount > 500:
    print("VIP purchase - free shipping!")
case .purchase:
    print("Standard purchase")
case .refund(let amount, _) where amount > 200:
    print("Large refund - requires manager approval")
case .refund:
    print("Process standard refund")
case .subscription(_, let price) where price > 50:
    print("Premium subscription")
case .subscription:
    print("Standard subscription")
}
```

## if-case and guard-case

When you only care about one specific case, use `if case` or `guard case` instead of a full switch.

### if case let

```swift
enum Notification {
    case email(subject: String, body: String)
    case push(title: String, badge: Int)
    case sms(message: String)
}

let notification = Notification.push(title: "New Message", badge: 5)

// Check for a specific case
if case .push(let title, let badge) = notification {
    print("Push: \(title) with badge \(badge)")
}

// With where clause
if case .push(_, let badge) = notification, badge > 0 {
    print("You have \(badge) unread notifications")
}
```

### guard case let

Perfect for early exits in functions:

```swift
enum AuthState {
    case loggedOut
    case loggingIn(username: String)
    case loggedIn(user: User, token: String)
    case error(message: String)
}

struct User {
    let id: String
    let name: String
}

func performSecureAction(authState: AuthState) {
    guard case .loggedIn(let user, let token) = authState else {
        print("Must be logged in to perform this action")
        return
    }

    // Now we have access to user and token
    print("Performing action for \(user.name) with token \(token)")
}
```

### Combining with Optional Binding

```swift
enum Result<T> {
    case success(T)
    case failure(Error)
}

let optionalResult: Result<String>? = .success("Data loaded")

// Combine optional unwrapping with case matching
if let result = optionalResult, case .success(let data) = result {
    print("Got data: \(data)")
}

// Or use if-case directly with optional
if case .success(let data)? = optionalResult {
    print("Got data: \(data)")
}
```

## Pattern Matching in Loops

### for-case-in

Filter elements in a loop using pattern matching:

```swift
enum Media {
    case photo(url: URL, dimensions: CGSize)
    case video(url: URL, duration: TimeInterval)
    case audio(url: URL, duration: TimeInterval)
}

let mediaItems: [Media] = [
    .photo(url: URL(string: "https://example.com/1.jpg")!, dimensions: CGSize(width: 800, height: 600)),
    .video(url: URL(string: "https://example.com/1.mp4")!, duration: 120),
    .photo(url: URL(string: "https://example.com/2.jpg")!, dimensions: CGSize(width: 1920, height: 1080)),
    .audio(url: URL(string: "https://example.com/1.mp3")!, duration: 180)
]

// Process only photos
for case let .photo(url, dimensions) in mediaItems {
    print("Photo at \(url) with size \(dimensions)")
}

// Process only videos longer than 60 seconds
for case let .video(url, duration) in mediaItems where duration > 60 {
    print("Long video at \(url): \(duration)s")
}
```

### Filtering Optionals

```swift
let numbers: [Int?] = [1, nil, 3, nil, 5, 6, nil]

// Extract only non-nil values
for case let number? in numbers {
    print(number) // 1, 3, 5, 6
}

// Equivalent to:
for number in numbers.compactMap({ $0 }) {
    print(number)
}
```

## Advanced Pattern Matching

### Tuple Patterns

Combine enum matching with tuple patterns:

```swift
enum ConnectionState {
    case disconnected
    case connecting
    case connected(latency: Int)
}

func diagnose(state: ConnectionState, isWifi: Bool) {
    switch (state, isWifi) {
    case (.disconnected, _):
        print("Not connected to any network")
    case (.connecting, true):
        print("Connecting via WiFi...")
    case (.connecting, false):
        print("Connecting via cellular...")
    case (.connected(let latency), true) where latency < 50:
        print("Excellent WiFi connection")
    case (.connected(let latency), true):
        print("WiFi connected, latency: \(latency)ms")
    case (.connected(let latency), false) where latency < 100:
        print("Good cellular connection")
    case (.connected, false):
        print("Cellular connected, may be slow")
    }
}
```

### Nested Enum Patterns

```swift
enum OuterState {
    case idle
    case active(InnerState)

    enum InnerState {
        case processing(progress: Double)
        case completed(result: String)
        case failed(error: Error)
    }
}

let state = OuterState.active(.processing(progress: 0.5))

switch state {
case .idle:
    print("System idle")
case .active(.processing(let progress)):
    print("Processing: \(Int(progress * 100))%")
case .active(.completed(let result)):
    print("Done: \(result)")
case .active(.failed(let error)):
    print("Error: \(error)")
}
```

### Expression Patterns with ~=

The `~=` operator powers pattern matching. You can customize it:

```swift
enum HTTPStatus {
    case informational(Int)  // 100-199
    case success(Int)        // 200-299
    case redirect(Int)       // 300-399
    case clientError(Int)    // 400-499
    case serverError(Int)    // 500-599
}

// Match ranges
switch 404 {
case 200..<300:
    print("Success")
case 400..<500:
    print("Client error")
default:
    print("Other")
}
```

## Recursive Enums

Use `indirect` for enums that reference themselves:

```swift
indirect enum ArithmeticExpression {
    case number(Int)
    case addition(ArithmeticExpression, ArithmeticExpression)
    case multiplication(ArithmeticExpression, ArithmeticExpression)
}

func evaluate(_ expression: ArithmeticExpression) -> Int {
    switch expression {
    case .number(let value):
        return value
    case .addition(let left, let right):
        return evaluate(left) + evaluate(right)
    case .multiplication(let left, let right):
        return evaluate(left) * evaluate(right)
    }
}

// (5 + 4) * 2
let expression = ArithmeticExpression.multiplication(
    .addition(.number(5), .number(4)),
    .number(2)
)

print(evaluate(expression)) // 18
```

### Building a JSON Type

```swift
indirect enum JSON {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSON])
    case object([String: JSON])
}

let json: JSON = .object([
    "name": .string("John"),
    "age": .number(30),
    "isActive": .bool(true),
    "tags": .array([.string("swift"), .string("developer")]),
    "metadata": .null
])

func prettyPrint(_ json: JSON, indent: Int = 0) -> String {
    let spaces = String(repeating: "  ", count: indent)

    switch json {
    case .null:
        return "null"
    case .bool(let value):
        return value ? "true" : "false"
    case .number(let value):
        return "\(value)"
    case .string(let value):
        return "\"\(value)\""
    case .array(let items):
        let elements = items.map { prettyPrint($0, indent: indent + 1) }
        return "[\n\(spaces)  \(elements.joined(separator: ",\n\(spaces)  "))\n\(spaces)]"
    case .object(let dict):
        let pairs = dict.map { "\"\($0.key)\": \(prettyPrint($0.value, indent: indent + 1))" }
        return "{\n\(spaces)  \(pairs.joined(separator: ",\n\(spaces)  "))\n\(spaces)}"
    }
}
```

## Enums with Protocols

Enums can conform to protocols, making them even more powerful:

```swift
protocol Describable {
    var description: String { get }
}

enum Vehicle: Describable, Comparable {
    case car(brand: String, seats: Int)
    case motorcycle(brand: String)
    case bicycle

    var description: String {
        switch self {
        case .car(let brand, let seats):
            return "\(brand) car with \(seats) seats"
        case .motorcycle(let brand):
            return "\(brand) motorcycle"
        case .bicycle:
            return "Bicycle"
        }
    }

    private var sortOrder: Int {
        switch self {
        case .bicycle: return 0
        case .motorcycle: return 1
        case .car: return 2
        }
    }

    static func < (lhs: Vehicle, rhs: Vehicle) -> Bool {
        lhs.sortOrder < rhs.sortOrder
    }
}
```

### CaseIterable Protocol

Automatically get all cases of an enum:

```swift
enum Season: CaseIterable {
    case spring, summer, autumn, winter
}

for season in Season.allCases {
    print(season)
}

print("There are \(Season.allCases.count) seasons")
```

Note: `CaseIterable` doesn't work with enums that have associated values.

## Practical Examples

### State Machine

```swift
enum OrderState {
    case pending
    case confirmed(orderId: String)
    case shipped(trackingNumber: String)
    case delivered(signature: String?)
    case cancelled(reason: String)

    mutating func confirm(orderId: String) -> Bool {
        guard case .pending = self else { return false }
        self = .confirmed(orderId: orderId)
        return true
    }

    mutating func ship(trackingNumber: String) -> Bool {
        guard case .confirmed = self else { return false }
        self = .shipped(trackingNumber: trackingNumber)
        return true
    }

    mutating func deliver(signature: String?) -> Bool {
        guard case .shipped = self else { return false }
        self = .delivered(signature: signature)
        return true
    }

    mutating func cancel(reason: String) -> Bool {
        switch self {
        case .pending, .confirmed:
            self = .cancelled(reason: reason)
            return true
        case .shipped, .delivered, .cancelled:
            return false
        }
    }
}
```

### Result Type Pattern

```swift
enum DataResult<Success, Failure: Error> {
    case success(Success)
    case failure(Failure)

    func map<NewSuccess>(_ transform: (Success) -> NewSuccess) -> DataResult<NewSuccess, Failure> {
        switch self {
        case .success(let value):
            return .success(transform(value))
        case .failure(let error):
            return .failure(error)
        }
    }

    func flatMap<NewSuccess>(_ transform: (Success) -> DataResult<NewSuccess, Failure>) -> DataResult<NewSuccess, Failure> {
        switch self {
        case .success(let value):
            return transform(value)
        case .failure(let error):
            return .failure(error)
        }
    }

    func get() throws -> Success {
        switch self {
        case .success(let value):
            return value
        case .failure(let error):
            throw error
        }
    }
}
```

### Form Validation

```swift
enum ValidationResult {
    case valid
    case invalid(errors: [ValidationError])

    var isValid: Bool {
        if case .valid = self { return true }
        return false
    }
}

enum ValidationError {
    case required(field: String)
    case tooShort(field: String, minLength: Int)
    case tooLong(field: String, maxLength: Int)
    case invalidFormat(field: String, expectedFormat: String)
    case custom(message: String)

    var message: String {
        switch self {
        case .required(let field):
            return "\(field) is required"
        case .tooShort(let field, let minLength):
            return "\(field) must be at least \(minLength) characters"
        case .tooLong(let field, let maxLength):
            return "\(field) must be no more than \(maxLength) characters"
        case .invalidFormat(let field, let format):
            return "\(field) must be in format: \(format)"
        case .custom(let message):
            return message
        }
    }
}

func validateUsername(_ username: String) -> ValidationResult {
    var errors: [ValidationError] = []

    if username.isEmpty {
        errors.append(.required(field: "Username"))
    } else {
        if username.count < 3 {
            errors.append(.tooShort(field: "Username", minLength: 3))
        }
        if username.count > 20 {
            errors.append(.tooLong(field: "Username", maxLength: 20))
        }
        if !username.allSatisfy({ $0.isLetter || $0.isNumber || $0 == "_" }) {
            errors.append(.invalidFormat(field: "Username", expectedFormat: "letters, numbers, and underscores only"))
        }
    }

    return errors.isEmpty ? .valid : .invalid(errors: errors)
}
```

## Best Practices

1. **Use enums for finite, known sets of values** - If the set of values is open-ended, consider other approaches.

2. **Prefer associated values over separate properties** - Keep related data together with the case.

3. **Make switch statements exhaustive** - Avoid `default` when possible to get compiler warnings when new cases are added.

4. **Use `if case` for single-case checks** - Don't write a full switch for one case.

5. **Leverage `CaseIterable`** - When you need to iterate over all cases.

6. **Consider raw values for serialization** - They make encoding/decoding straightforward.

7. **Use recursive enums for tree structures** - The `indirect` keyword enables powerful data modeling.

## Summary

Swift enums combined with pattern matching provide a type-safe, expressive way to model domain concepts:

- **Basic enums** define a closed set of related values
- **Raw values** associate each case with a primitive value
- **Associated values** let each case carry different data
- **switch statements** must be exhaustive, ensuring you handle all cases
- **if case** and **guard case** provide concise single-case matching
- **where clauses** add conditions to pattern matching
- **for case in** filters collections during iteration
- **Recursive enums** enable tree-like data structures

Mastering enums and pattern matching is essential for writing idiomatic Swift code. They help eliminate invalid states, make code self-documenting, and catch errors at compile time rather than runtime.
