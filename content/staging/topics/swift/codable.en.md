---
title: Swift Codable
description: Master Swift Codable protocol for JSON encoding/decoding including custom encoding and nested types
track: swift
section: basics
difficulty: intermediate
tags:
  - Swift
  - Codable
  - JSON
  - serialization
status: imported
origin: old/src/content/docs/swift/codable.en.md
divergence: 0.207
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Swift
  subcategory: Data Processing
  order: 13
  lastUpdated: 2026-01-07
---

Codable is a powerful protocol introduced in Swift 4 that brings type-safe serialization and deserialization into Swift's type system. We'll cover Codable's core concepts, working principles, custom encoding/decoding techniques, and practical applications.

## Understanding Codable

### What is Codable?

Codable is a type alias defined in the Swift standard library that combines two protocols:

```swift
typealias Codable = Encodable & Decodable
```

- **Encodable**: Defines how a type can be encoded (serialized) to an external representation like JSON or Property List
- **Decodable**: Defines how a type can be decoded (deserialized) from an external representation

### Why Codable Matters

Before Codable, iOS developers typically handled JSON using:

1. **NSJSONSerialization**: Returns `Any` type, requiring extensive type casting
2. **Third-party libraries (like SwiftyJSON)**: Provide convenient syntax but lack type safety
3. **Manual parsing**: Writing boilerplate code that is error-prone and tedious

Codable solves these problems by providing:

- **Type safety**: Compile-time checking reduces runtime errors
- **Minimal boilerplate**: Zero boilerplate code in most cases
- **Standardization**: Native Swift standard library support
- **Extensibility**: Support for custom encoding/decoding logic

### Historical Context

Codable was introduced in Swift 4 (2017) as part of proposals SE-0166 and SE-0167. It was a significant milestone in Swift's evolution, drawing inspiration from serialization mechanisms in other languages (like Rust's Serde and Go's encoding/json) while leveraging Swift's type system and compiler capabilities.

## Core Principles

### Protocol Definitions

```swift
// Encodable protocol
protocol Encodable {
    func encode(to encoder: Encoder) throws
}

// Decodable protocol
protocol Decodable {
    init(from decoder: Decoder) throws
}
```

### Automatic Synthesis

When all stored properties of a type conform to Codable, the Swift compiler automatically synthesizes the `encode(to:)` and `init(from:)` methods. This is achieved through compiler magic without runtime reflection.

```swift
// Compiler automatically generates encoding/decoding methods
struct User: Codable {
    let id: Int
    let name: String
    let email: String
}
```

### The Encoder and Decoder System

Swift provides an abstract encoding/decoding system:

```swift
// Encoder protocol
protocol Encoder {
    var codingPath: [CodingKey] { get }
    var userInfo: [CodingUserInfoKey: Any] { get }

    func container<Key: CodingKey>(keyedBy type: Key.Type) -> KeyedEncodingContainer<Key>
    func unkeyedContainer() -> UnkeyedEncodingContainer
    func singleValueContainer() -> SingleValueEncodingContainer
}

// Decoder protocol
protocol Decoder {
    var codingPath: [CodingKey] { get }
    var userInfo: [CodingUserInfoKey: Any] { get }

    func container<Key: CodingKey>(keyedBy type: Key.Type) throws -> KeyedDecodingContainer<Key>
    func unkeyedContainer() throws -> UnkeyedDecodingContainer
    func singleValueContainer() throws -> SingleValueDecodingContainer
}
```

### Container Types

The encoding/decoding process uses three types of containers:

1. **KeyedContainer**: Key-value pair container for objects/dictionaries
2. **UnkeyedContainer**: Keyless container for arrays
3. **SingleValueContainer**: Single value container for primitive types

```swift
// Container usage example
func encode(to encoder: Encoder) throws {
    // Keyed container
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(name, forKey: .name)

    // Nested container
    var addressContainer = container.nestedContainer(keyedBy: AddressKeys.self, forKey: .address)
    try addressContainer.encode(city, forKey: .city)
}
```

## Basic Usage

### Automatic Codable Synthesis

```swift
// All properties are Codable, automatic synthesis occurs
struct Product: Codable {
    let id: Int
    let name: String
    let price: Double
    let inStock: Bool
    let tags: [String]
    let metadata: [String: String]?
}
```

### JSONEncoder and JSONDecoder

```swift
let product = Product(
    id: 1,
    name: "iPhone",
    price: 999.99,
    inStock: true,
    tags: ["electronics", "phone"],
    metadata: ["color": "black"]
)

// Encode to JSON
let encoder = JSONEncoder()
encoder.outputFormatting = .prettyPrinted
let jsonData = try encoder.encode(product)
let jsonString = String(data: jsonData, encoding: .utf8)!

// Decode JSON
let decoder = JSONDecoder()
let decodedProduct = try decoder.decode(Product.self, from: jsonData)
```

### CodingKeys for Custom Key Names

When JSON keys don't match property names, use CodingKeys:

```swift
struct User: Codable {
    let id: Int
    let userName: String
    let emailAddress: String
    let createdAt: Date

    // Custom JSON key mapping
    enum CodingKeys: String, CodingKey {
        case id
        case userName = "user_name"
        case emailAddress = "email_address"
        case createdAt = "created_at"
    }
}
```

### Automatic Key Conversion Strategies

JSONEncoder/JSONDecoder provide automatic key name conversion:

```swift
struct User: Codable {
    let userId: Int
    let userName: String
    let emailAddress: String
}

// Encoding: camelCase -> snake_case
let encoder = JSONEncoder()
encoder.keyEncodingStrategy = .convertToSnakeCase

// Decoding: snake_case -> camelCase
let decoder = JSONDecoder()
decoder.keyDecodingStrategy = .convertFromSnakeCase

// JSON: {"user_id": 1, "user_name": "John", "email_address": "..."}
```

### Date Encoding/Decoding Strategies

```swift
struct Event: Codable {
    let name: String
    let date: Date
}

let encoder = JSONEncoder()
let decoder = JSONDecoder()

// 1. ISO 8601 format
encoder.dateEncodingStrategy = .iso8601
decoder.dateDecodingStrategy = .iso8601

// 2. Unix timestamp (seconds)
encoder.dateEncodingStrategy = .secondsSince1970
decoder.dateDecodingStrategy = .secondsSince1970

// 3. Unix timestamp (milliseconds)
encoder.dateEncodingStrategy = .millisecondsSince1970
decoder.dateDecodingStrategy = .millisecondsSince1970

// 4. Custom format
let dateFormatter = DateFormatter()
dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
dateFormatter.locale = Locale(identifier: "en_US_POSIX")
encoder.dateEncodingStrategy = .formatted(dateFormatter)
decoder.dateDecodingStrategy = .formatted(dateFormatter)

// 5. Custom closure
encoder.dateEncodingStrategy = .custom { date, encoder in
    var container = encoder.singleValueContainer()
    let timestamp = Int(date.timeIntervalSince1970 * 1000)
    try container.encode(timestamp)
}
```

### Data Encoding/Decoding Strategies

```swift
struct Document: Codable {
    let name: String
    let content: Data
}

let encoder = JSONEncoder()
let decoder = JSONDecoder()

// 1. Base64 encoding (default)
encoder.dataEncodingStrategy = .base64
decoder.dataDecodingStrategy = .base64

// 2. Deferred conversion
encoder.dataEncodingStrategy = .deferredToData
decoder.dataDecodingStrategy = .deferredToData

// 3. Custom handling
encoder.dataEncodingStrategy = .custom { data, encoder in
    var container = encoder.singleValueContainer()
    try container.encode(data.base64EncodedString())
}
```

## Code Examples

### Basic Encoding/Decoding

```swift
import Foundation

// Define data model
struct Book: Codable {
    let isbn: String
    let title: String
    let author: String
    let price: Double
    let publishDate: Date
    let categories: [String]
}

// Create instance
let book = Book(
    isbn: "978-0-13-468599-1",
    title: "The Swift Programming Language",
    author: "Apple Inc.",
    price: 59.99,
    publishDate: Date(),
    categories: ["Programming", "iOS", "Swift"]
)

// Encode
func encodeBook(_ book: Book) throws -> Data {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    encoder.dateEncodingStrategy = .iso8601
    return try encoder.encode(book)
}

// Decode
func decodeBook(from data: Data) throws -> Book {
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return try decoder.decode(Book.self, from: data)
}

// Usage example
do {
    let jsonData = try encodeBook(book)
    print(String(data: jsonData, encoding: .utf8)!)

    let decodedBook = try decodeBook(from: jsonData)
    print("Decoded successfully: \(decodedBook.title)")
} catch {
    print("Encoding/Decoding error: \(error)")
}
```

### Nested Types

```swift
struct Order: Codable {
    let orderId: String
    let customer: Customer
    let items: [OrderItem]
    let shippingAddress: Address
    let totalAmount: Double
    let status: OrderStatus

    struct Customer: Codable {
        let id: Int
        let name: String
        let phone: String
    }

    struct OrderItem: Codable {
        let productId: Int
        let productName: String
        let quantity: Int
        let unitPrice: Double
    }

    struct Address: Codable {
        let street: String
        let city: String
        let state: String
        let postalCode: String
    }

    enum OrderStatus: String, Codable {
        case pending = "pending"
        case processing = "processing"
        case shipped = "shipped"
        case delivered = "delivered"
        case cancelled = "cancelled"
    }
}

// JSON example
let orderJSON = """
{
    "orderId": "ORD-2024-001",
    "customer": {
        "id": 12345,
        "name": "John Smith",
        "phone": "+1-555-123-4567"
    },
    "items": [
        {
            "productId": 101,
            "productName": "MacBook Pro",
            "quantity": 1,
            "unitPrice": 2499.00
        },
        {
            "productId": 102,
            "productName": "Magic Mouse",
            "quantity": 2,
            "unitPrice": 99.00
        }
    ],
    "shippingAddress": {
        "street": "123 Tech Avenue",
        "city": "San Francisco",
        "state": "California",
        "postalCode": "94102"
    },
    "totalAmount": 2697.00,
    "status": "processing"
}
"""

// Decode
let decoder = JSONDecoder()
if let data = orderJSON.data(using: .utf8),
   let order = try? decoder.decode(Order.self, from: data) {
    print("Order ID: \(order.orderId)")
    print("Customer: \(order.customer.name)")
    print("Item count: \(order.items.count)")
    print("Status: \(order.status.rawValue)")
}
```

### Custom Encoding/Decoding Implementation

```swift
struct Person: Codable {
    let name: String
    let age: Int
    let birthday: Date
    private let secretCode: String

    // Custom CodingKeys
    enum CodingKeys: String, CodingKey {
        case name
        case age
        case birthday = "birth_date"
        // secretCode is not listed, won't be encoded/decoded
    }

    // Custom decoding
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        name = try container.decode(String.self, forKey: .name)
        age = try container.decode(Int.self, forKey: .age)
        birthday = try container.decode(Date.self, forKey: .birthday)

        // secretCode uses default value
        secretCode = "DEFAULT"
    }

    // Custom encoding
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        try container.encode(name, forKey: .name)
        try container.encode(age, forKey: .age)
        try container.encode(birthday, forKey: .birthday)
        // secretCode is not encoded
    }

    // Regular initializer
    init(name: String, age: Int, birthday: Date, secretCode: String) {
        self.name = name
        self.age = age
        self.birthday = birthday
        self.secretCode = secretCode
    }
}
```

### Handling Dynamic JSON Keys

```swift
// Handling JSON with dynamic key names
// {"user_1": {...}, "user_2": {...}, "user_3": {...}}

struct DynamicUsers: Codable {
    var users: [String: User]

    struct User: Codable {
        let name: String
        let email: String
    }

    // Dynamic key
    struct DynamicKey: CodingKey {
        var stringValue: String
        var intValue: Int?

        init?(stringValue: String) {
            self.stringValue = stringValue
            self.intValue = nil
        }

        init?(intValue: Int) {
            self.stringValue = String(intValue)
            self.intValue = intValue
        }
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: DynamicKey.self)

        var users: [String: User] = [:]
        for key in container.allKeys {
            let user = try container.decode(User.self, forKey: key)
            users[key.stringValue] = user
        }
        self.users = users
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: DynamicKey.self)

        for (key, user) in users {
            let codingKey = DynamicKey(stringValue: key)!
            try container.encode(user, forKey: codingKey)
        }
    }
}
```

### Handling Heterogeneous Arrays

```swift
// Handling arrays containing different types
// [{"type": "text", "content": "..."}, {"type": "image", "url": "..."}]

protocol ContentItem: Codable {
    var type: String { get }
}

struct TextContent: ContentItem, Codable {
    let type: String
    let content: String
}

struct ImageContent: ContentItem, Codable {
    let type: String
    let url: String
    let width: Int
    let height: Int
}

enum ContentType: String, Codable {
    case text
    case image
}

struct ContentWrapper: Codable {
    let items: [any ContentItem]

    private enum TypeKey: String, CodingKey {
        case type
    }

    init(items: [any ContentItem]) {
        self.items = items
    }

    init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        var items: [any ContentItem] = []

        while !container.isAtEnd {
            // Create a copy to peek at the type
            let nestedContainer = try container.nestedContainer(keyedBy: TypeKey.self)
            let typeString = try nestedContainer.decode(String.self, forKey: .type)

            // Decode based on type - need to use superDecoder pattern
            let item: any ContentItem
            switch typeString {
            case "text":
                item = try TextContent(from: nestedContainer.superDecoder())
            case "image":
                item = try ImageContent(from: nestedContainer.superDecoder())
            default:
                continue // Skip unknown types
            }
            items.append(item)
        }

        self.items = items
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.unkeyedContainer()

        for item in items {
            if let textItem = item as? TextContent {
                try container.encode(textItem)
            } else if let imageItem = item as? ImageContent {
                try container.encode(imageItem)
            }
        }
    }
}
```

### Optional Values and Default Values

```swift
struct UserProfile: Codable {
    let id: Int
    let name: String
    let nickname: String?          // Optional, may be missing in JSON
    let avatar: String?            // Optional
    let isVerified: Bool           // Must provide default value handling
    let memberLevel: Int           // Provide default value

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case nickname
        case avatar
        case isVerified = "is_verified"
        case memberLevel = "member_level"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = try container.decode(Int.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)

        // Optional values, nil if missing
        nickname = try container.decodeIfPresent(String.self, forKey: .nickname)
        avatar = try container.decodeIfPresent(String.self, forKey: .avatar)

        // Provide default values
        isVerified = try container.decodeIfPresent(Bool.self, forKey: .isVerified) ?? false
        memberLevel = try container.decodeIfPresent(Int.self, forKey: .memberLevel) ?? 1
    }
}

// Using Property Wrapper to simplify default value handling (Swift 5.1+)
@propertyWrapper
struct Default<T: Codable>: Codable {
    var wrappedValue: T

    init(wrappedValue: T) {
        self.wrappedValue = wrappedValue
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        wrappedValue = (try? container.decode(T.self)) ?? wrappedValue
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(wrappedValue)
    }
}

struct Settings: Codable {
    @Default var theme: String = "light"
    @Default var fontSize: Int = 14
    @Default var notifications: Bool = true
}
```

### Flattening Nested Structures

```swift
// JSON structure
// {
//   "id": 1,
//   "personal_info": {
//     "name": "John",
//     "age": 25
//   },
//   "contact_info": {
//     "email": "...",
//     "phone": "..."
//   }
// }

// Desired Swift structure (flattened)
struct Employee: Codable {
    let id: Int
    let name: String
    let age: Int
    let email: String
    let phone: String

    enum CodingKeys: String, CodingKey {
        case id
        case personalInfo = "personal_info"
        case contactInfo = "contact_info"
    }

    enum PersonalInfoKeys: String, CodingKey {
        case name
        case age
    }

    enum ContactInfoKeys: String, CodingKey {
        case email
        case phone
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = try container.decode(Int.self, forKey: .id)

        // Decode nested personal_info
        let personalContainer = try container.nestedContainer(
            keyedBy: PersonalInfoKeys.self,
            forKey: .personalInfo
        )
        name = try personalContainer.decode(String.self, forKey: .name)
        age = try personalContainer.decode(Int.self, forKey: .age)

        // Decode nested contact_info
        let contactContainer = try container.nestedContainer(
            keyedBy: ContactInfoKeys.self,
            forKey: .contactInfo
        )
        email = try contactContainer.decode(String.self, forKey: .email)
        phone = try contactContainer.decode(String.self, forKey: .phone)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        try container.encode(id, forKey: .id)

        // Encode as nested structure
        var personalContainer = container.nestedContainer(
            keyedBy: PersonalInfoKeys.self,
            forKey: .personalInfo
        )
        try personalContainer.encode(name, forKey: .name)
        try personalContainer.encode(age, forKey: .age)

        var contactContainer = container.nestedContainer(
            keyedBy: ContactInfoKeys.self,
            forKey: .contactInfo
        )
        try contactContainer.encode(email, forKey: .email)
        try contactContainer.encode(phone, forKey: .phone)
    }
}
```

## Best Practices

### Prefer Automatic Synthesis

Only customize encoding/decoding logic when necessary:

```swift
// Recommended: Use automatic synthesis when possible
struct SimpleUser: Codable {
    let id: Int
    let name: String
}

// Only customize CodingKeys when needed
struct APIUser: Codable {
    let userId: Int
    let userName: String

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case userName = "user_name"
    }
}
```

### Use keyEncodingStrategy to Reduce Boilerplate

```swift
// Avoid: Writing CodingKeys for every property
struct User: Codable {
    let userId: Int
    let userName: String
    let emailAddress: String
    // No need to manually define CodingKeys
}

let encoder = JSONEncoder()
encoder.keyEncodingStrategy = .convertToSnakeCase
// Automatically converts to: user_id, user_name, email_address
```

### Encapsulate Common Encoding/Decoding Configuration

```swift
struct JSONHelper {
    static let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return encoder
    }()

    static let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }()

    static func encode<T: Encodable>(_ value: T) throws -> Data {
        return try encoder.encode(value)
    }

    static func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        return try decoder.decode(type, from: data)
    }
}
```

### Use Extensions for Convenience Methods

```swift
extension Encodable {
    func toJSONData() throws -> Data {
        return try JSONHelper.encoder.encode(self)
    }

    func toJSONString() throws -> String {
        let data = try toJSONData()
        return String(data: data, encoding: .utf8) ?? ""
    }

    func toDictionary() throws -> [String: Any] {
        let data = try toJSONData()
        guard let dict = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw EncodingError.invalidValue(self, .init(codingPath: [], debugDescription: "Cannot convert to dictionary"))
        }
        return dict
    }
}

extension Decodable {
    static func from(jsonData: Data) throws -> Self {
        return try JSONHelper.decoder.decode(Self.self, from: jsonData)
    }

    static func from(jsonString: String) throws -> Self {
        guard let data = jsonString.data(using: .utf8) else {
            throw DecodingError.dataCorrupted(.init(codingPath: [], debugDescription: "Invalid JSON string"))
        }
        return try from(jsonData: data)
    }
}

// Usage example
let user = User(id: 1, name: "John")
let jsonString = try user.toJSONString()
let decodedUser = try User.from(jsonString: jsonString)
```

### Handle Optional Values Explicitly

```swift
struct Config: Codable {
    let required: String           // Must exist
    let optional: String?          // May be missing
    let withDefault: String        // Use default value if missing

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        // Must exist, throws error if missing
        required = try container.decode(String.self, forKey: .required)

        // Optional, nil if missing
        optional = try container.decodeIfPresent(String.self, forKey: .optional)

        // Provide default value
        withDefault = try container.decodeIfPresent(String.self, forKey: .withDefault) ?? "default"
    }
}
```

### Use Result Type for Error Handling

```swift
extension JSONDecoder {
    func decodeResult<T: Decodable>(_ type: T.Type, from data: Data) -> Result<T, Error> {
        do {
            let decoded = try decode(type, from: data)
            return .success(decoded)
        } catch {
            return .failure(error)
        }
    }
}

// Usage example
let result = JSONDecoder().decodeResult(User.self, from: jsonData)
switch result {
case .success(let user):
    print("Decoded successfully: \(user.name)")
case .failure(let error):
    print("Decoding failed: \(error.localizedDescription)")
}
```

## Common Pitfalls

### Key Name Mismatch

```swift
// JSON: {"user_id": 1, "user_name": "John"}

// Error: Property names don't match JSON keys
struct User: Codable {
    let userId: Int    // Expects "userId", but actual is "user_id"
    let userName: String
}

// Solution 1: Use CodingKeys
struct User: Codable {
    let userId: Int
    let userName: String

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case userName = "user_name"
    }
}

// Solution 2: Use keyDecodingStrategy
let decoder = JSONDecoder()
decoder.keyDecodingStrategy = .convertFromSnakeCase
```

### Type Mismatch

```swift
// "123" in JSON is a string, but expecting Int
// {"id": "123", "count": "100"}

struct Stats: Codable {
    let id: Int     // Will fail!
    let count: Int  // Will fail!
}

// Solution: Custom decoding logic
struct Stats: Codable {
    let id: Int
    let count: Int

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        // Try to decode as Int, fallback to String conversion
        if let intId = try? container.decode(Int.self, forKey: .id) {
            id = intId
        } else {
            let stringId = try container.decode(String.self, forKey: .id)
            guard let intId = Int(stringId) else {
                throw DecodingError.dataCorruptedError(forKey: .id, in: container, debugDescription: "Cannot convert to Int")
            }
            id = intId
        }

        // Same handling for count
        if let intCount = try? container.decode(Int.self, forKey: .count) {
            count = intCount
        } else {
            let stringCount = try container.decode(String.self, forKey: .count)
            guard let intCount = Int(stringCount) else {
                throw DecodingError.dataCorruptedError(forKey: .count, in: container, debugDescription: "Cannot convert to Int")
            }
            count = intCount
        }
    }
}

// Generic solution: Create a flexible type
struct FlexibleInt: Codable {
    let value: Int

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if let intValue = try? container.decode(Int.self) {
            value = intValue
        } else if let stringValue = try? container.decode(String.self),
                  let intValue = Int(stringValue) {
            value = intValue
        } else if let doubleValue = try? container.decode(Double.self) {
            value = Int(doubleValue)
        } else {
            throw DecodingError.typeMismatch(Int.self, .init(codingPath: decoder.codingPath, debugDescription: "Expected numeric type"))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(value)
    }
}
```

### Null Value Handling

```swift
// JSON: {"name": "John", "age": null}

// Problem: Non-optional type encountering null will fail
struct User: Codable {
    let name: String
    let age: Int  // Will fail if JSON has null
}

// Solution 1: Use optional type
struct User: Codable {
    let name: String
    let age: Int?
}

// Solution 2: Provide default value
struct User: Codable {
    let name: String
    let age: Int

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decode(String.self, forKey: .name)
        age = try container.decodeIfPresent(Int.self, forKey: .age) ?? 0
    }
}
```

### Unknown Enum Values

```swift
// JSON: {"status": "unknown_status"}

// Problem: Encountering undefined enum value will fail
enum Status: String, Codable {
    case active
    case inactive
    case pending
}

// Solution: Add unknown case
enum Status: Codable {
    case active
    case inactive
    case pending
    case unknown(String)

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let rawValue = try container.decode(String.self)

        switch rawValue {
        case "active": self = .active
        case "inactive": self = .inactive
        case "pending": self = .pending
        default: self = .unknown(rawValue)
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .active: try container.encode("active")
        case .inactive: try container.encode("inactive")
        case .pending: try container.encode("pending")
        case .unknown(let value): try container.encode(value)
        }
    }
}
```

### Circular References

```swift
// Problem: Circular references cause infinite recursion
class Person: Codable {
    let name: String
    var bestFriend: Person?  // May cause circular reference
}

// Solution: Use identifier reference
class Person: Codable {
    let id: Int
    let name: String
    var bestFriendId: Int?  // Use ID instead of direct reference
}
```

### Ignoring Error Details

```swift
// Not recommended: Swallowing errors
let user = try? decoder.decode(User.self, from: data)

// Recommended: Handle and log errors properly
do {
    let user = try decoder.decode(User.self, from: data)
    print("Decoded successfully")
} catch DecodingError.keyNotFound(let key, let context) {
    print("Missing key: \(key.stringValue)")
    print("Path: \(context.codingPath)")
} catch DecodingError.typeMismatch(let type, let context) {
    print("Type mismatch: expected \(type)")
    print("Path: \(context.codingPath)")
} catch DecodingError.valueNotFound(let type, let context) {
    print("Value is null: expected \(type)")
    print("Path: \(context.codingPath)")
} catch DecodingError.dataCorrupted(let context) {
    print("Data corrupted: \(context.debugDescription)")
} catch {
    print("Other error: \(error)")
}
```

## Performance Considerations

### Reuse JSONEncoder/Decoder Instances

```swift
// Not recommended: Creating new instance each time
func decode<T: Decodable>(_ data: Data) throws -> T {
    let decoder = JSONDecoder()  // Creating new instance each time
    return try decoder.decode(T.self, from: data)
}

// Recommended: Reuse instances
class DataService {
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init() {
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        encoder.keyEncodingStrategy = .convertToSnakeCase
    }

    func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        return try decoder.decode(type, from: data)
    }

    func encode<T: Encodable>(_ value: T) throws -> Data {
        return try encoder.encode(value)
    }
}
```

### Avoid Unnecessary Intermediate Conversions

```swift
// Not recommended: Multiple conversions
let dict = try JSONSerialization.jsonObject(with: data) as! [String: Any]
let jsonData = try JSONSerialization.data(withJSONObject: dict)
let user = try JSONDecoder().decode(User.self, from: jsonData)

// Recommended: Direct decoding
let user = try JSONDecoder().decode(User.self, from: data)
```

### Large Data Handling

```swift
// For large JSON arrays, consider streaming or pagination
// Use JSONSerialization's ReadingOptions.fragmentsAllowed
// Or consider third-party streaming JSON parsers

// Paginated handling for large arrays
struct PaginatedResponse<T: Codable>: Codable {
    let data: [T]
    let page: Int
    let totalPages: Int
    let hasMore: Bool
}
```

### Lazy Decoding

```swift
// For large objects, consider lazy decoding
struct LazyDocument: Codable {
    let id: String
    let title: String
    private let contentJSON: String  // Store raw JSON string

    var content: DocumentContent {
        get throws {
            guard let data = contentJSON.data(using: .utf8) else {
                throw DecodingError.dataCorrupted(.init(codingPath: [], debugDescription: "Invalid content JSON"))
            }
            return try JSONDecoder().decode(DocumentContent.self, from: data)
        }
    }

    enum CodingKeys: String, CodingKey {
        case id, title
        case contentJSON = "content"
    }
}
```

### Encoding Performance Optimization

```swift
// For frequently encoded small objects, consider caching
actor EncodingCache<T: Encodable & Hashable> {
    private var cache: [T: Data] = [:]
    private let encoder = JSONEncoder()

    func encode(_ value: T) throws -> Data {
        if let cached = cache[value] {
            return cached
        }
        let data = try encoder.encode(value)
        cache[value] = data
        return data
    }

    func clearCache() {
        cache.removeAll()
    }
}
```

## Practical Scenarios

### Scenario 1: Network API Response Handling

```swift
// Generic API response wrapper
struct APIResponse<T: Codable>: Codable {
    let code: Int
    let message: String
    let data: T?
    let timestamp: Date

    var isSuccess: Bool {
        return code == 200
    }
}

// Specific business model
struct UserInfo: Codable {
    let userId: Int
    let nickname: String
    let avatar: String
    let level: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case nickname
        case avatar
        case level
        case createdAt = "created_at"
    }
}

// Network request wrapper
class APIClient {
    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }()

    func request<T: Codable>(_ url: URL) async throws -> APIResponse<T> {
        let (data, _) = try await URLSession.shared.data(from: url)
        return try decoder.decode(APIResponse<T>.self, from: data)
    }
}

// Usage example
let client = APIClient()
let response: APIResponse<UserInfo> = try await client.request(userInfoURL)

if response.isSuccess, let user = response.data {
    print("User: \(user.nickname)")
} else {
    print("Error: \(response.message)")
}
```

### Scenario 2: Local Data Persistence

```swift
// User settings model
struct UserSettings: Codable {
    var theme: Theme
    var fontSize: Int
    var notificationsEnabled: Bool
    var language: String
    var lastSyncDate: Date?

    enum Theme: String, Codable {
        case light, dark, system
    }

    static let `default` = UserSettings(
        theme: .system,
        fontSize: 16,
        notificationsEnabled: true,
        language: "en-US",
        lastSyncDate: nil
    )
}

// Persistence manager
class SettingsManager {
    private let fileURL: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private(set) var settings: UserSettings

    init() {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        fileURL = documentsPath.appendingPathComponent("settings.json")

        encoder.outputFormatting = .prettyPrinted
        encoder.dateEncodingStrategy = .iso8601
        decoder.dateDecodingStrategy = .iso8601

        settings = Self.load(from: fileURL, using: decoder) ?? .default
    }

    private static func load(from url: URL, using decoder: JSONDecoder) -> UserSettings? {
        guard let data = try? Data(contentsOf: url),
              let settings = try? decoder.decode(UserSettings.self, from: data) else {
            return nil
        }
        return settings
    }

    func save() throws {
        let data = try encoder.encode(settings)
        try data.write(to: fileURL)
    }

    func updateTheme(_ theme: UserSettings.Theme) throws {
        settings.theme = theme
        try save()
    }

    func reset() throws {
        settings = .default
        try save()
    }
}
```

### Scenario 3: Cache Layer Implementation

```swift
// Cache entry
struct CacheEntry<T: Codable>: Codable {
    let value: T
    let createdAt: Date
    let expiresAt: Date

    var isExpired: Bool {
        return Date() > expiresAt
    }
}

// Disk cache
actor DiskCache<T: Codable> {
    private let directory: URL
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(name: String) {
        let cacheDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        self.directory = cacheDir.appendingPathComponent(name)

        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)

        encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
    }

    private func fileURL(for key: String) -> URL {
        return directory.appendingPathComponent("\(key).json")
    }

    func set(_ value: T, for key: String, ttl: TimeInterval = 3600) throws {
        let entry = CacheEntry(
            value: value,
            createdAt: Date(),
            expiresAt: Date().addingTimeInterval(ttl)
        )
        let data = try encoder.encode(entry)
        try data.write(to: fileURL(for: key))
    }

    func get(_ key: String) throws -> T? {
        let url = fileURL(for: key)
        guard FileManager.default.fileExists(atPath: url.path) else {
            return nil
        }

        let data = try Data(contentsOf: url)
        let entry = try decoder.decode(CacheEntry<T>.self, from: data)

        if entry.isExpired {
            try? FileManager.default.removeItem(at: url)
            return nil
        }

        return entry.value
    }

    func remove(_ key: String) throws {
        try FileManager.default.removeItem(at: fileURL(for: key))
    }

    func clear() throws {
        try FileManager.default.removeItem(at: directory)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }
}
```

### Scenario 4: Configuration File Parsing

```swift
// Application configuration
struct AppConfig: Codable {
    let environment: Environment
    let api: APIConfig
    let features: FeatureFlags
    let logging: LoggingConfig

    enum Environment: String, Codable {
        case development
        case staging
        case production
    }

    struct APIConfig: Codable {
        let baseURL: URL
        let timeout: TimeInterval
        let retryCount: Int
        let headers: [String: String]
    }

    struct FeatureFlags: Codable {
        let newUI: Bool
        let analytics: Bool
        let crashReporting: Bool
        let darkMode: Bool
    }

    struct LoggingConfig: Codable {
        let level: LogLevel
        let enableConsole: Bool
        let enableFile: Bool

        enum LogLevel: String, Codable {
            case debug, info, warning, error
        }
    }
}

// Configuration loader
enum ConfigLoader {
    static func load() throws -> AppConfig {
        guard let url = Bundle.main.url(forResource: "config", withExtension: "json") else {
            throw ConfigError.fileNotFound
        }

        let data = try Data(contentsOf: url)
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        return try decoder.decode(AppConfig.self, from: data)
    }

    enum ConfigError: Error {
        case fileNotFound
        case invalidFormat
    }
}

// config.json example
/*
{
    "environment": "development",
    "api": {
        "base_url": "https://api.example.com",
        "timeout": 30,
        "retry_count": 3,
        "headers": {
            "Accept": "application/json",
            "X-App-Version": "1.0.0"
        }
    },
    "features": {
        "new_ui": true,
        "analytics": true,
        "crash_reporting": true,
        "dark_mode": false
    },
    "logging": {
        "level": "debug",
        "enable_console": true,
        "enable_file": false
    }
}
*/
```

## Interview Questions

### Common Interview Topics

**1. What is the relationship between Codable, Encodable, and Decodable?**

```swift
// Codable is a combination of Encodable and Decodable
typealias Codable = Encodable & Decodable

// Encodable: Defines how to encode (serialize)
protocol Encodable {
    func encode(to encoder: Encoder) throws
}

// Decodable: Defines how to decode (deserialize)
protocol Decodable {
    init(from decoder: Decoder) throws
}

// Use cases:
// - Only need encoding: Conform to Encodable
// - Only need decoding: Conform to Decodable
// - Need both: Conform to Codable
```

**2. How does Swift automatically synthesize Codable implementation?**

Swift compiler automatically synthesizes when:
- All stored properties conform to Codable
- If CodingKeys enum is defined, it must cover all properties to be encoded/decoded
- Automatic synthesis is based on compile-time code generation, not runtime reflection

**3. What is the purpose of CodingKeys?**

```swift
// CodingKeys is used for:
// 1. Custom JSON key names
// 2. Exclude properties from encoding/decoding
// 3. Handle keys that don't conform to Swift naming conventions

struct User: Codable {
    let userId: Int
    let userName: String
    let internalData: String  // Not encoded/decoded

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case userName = "user_name"
        // internalData not listed, won't be encoded/decoded
    }
}
```

**4. How to handle null values in JSON?**

```swift
// Method 1: Use optional type
struct User: Codable {
    let name: String?  // Can be null in JSON
}

// Method 2: Use decodeIfPresent
init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    name = try container.decodeIfPresent(String.self, forKey: .name)
}

// Method 3: Provide default value
name = try container.decodeIfPresent(String.self, forKey: .name) ?? "Default Name"
```

**5. How to handle Date type encoding/decoding?**

```swift
// Use dateEncodingStrategy / dateDecodingStrategy
let decoder = JSONDecoder()

// ISO 8601 format
decoder.dateDecodingStrategy = .iso8601

// Unix timestamp
decoder.dateDecodingStrategy = .secondsSince1970

// Custom format
let formatter = DateFormatter()
formatter.dateFormat = "yyyy-MM-dd"
decoder.dateDecodingStrategy = .formatted(formatter)

// Custom logic
decoder.dateDecodingStrategy = .custom { decoder in
    // Custom parsing logic
}
```

**6. What container types are available in encode(to:) and init(from:)?**

```swift
// 1. KeyedContainer: Key-value pairs, for objects
var container = encoder.container(keyedBy: CodingKeys.self)
try container.encode(name, forKey: .name)

// 2. UnkeyedContainer: No keys, for arrays
var container = encoder.unkeyedContainer()
for item in items {
    try container.encode(item)
}

// 3. SingleValueContainer: Single value, for primitive types
var container = encoder.singleValueContainer()
try container.encode(rawValue)
```

**7. How to handle polymorphic types (heterogeneous arrays)?**

```swift
// Use a type identifier field
// {"type": "text", "content": "..."} or {"type": "image", "url": "..."}

// During decoding, first read the type field, then decode corresponding structure
let typeString = try container.decode(String.self, forKey: .type)
switch typeString {
case "text":
    return try TextContent(from: decoder)
case "image":
    return try ImageContent(from: decoder)
default:
    throw DecodingError.dataCorrupted(...)
}
```

**8. What are the differences between Codable and NSCoding?**

| Feature | Codable | NSCoding |
|---------|---------|----------|
| Language | Swift native | Objective-C compatible |
| Type safety | Compile-time checking | Runtime checking |
| Format support | JSON, PropertyList, etc. | NSKeyedArchiver |
| Value type support | struct, enum supported | class only |
| Automatic synthesis | Supported | Not supported |

**9. How to debug Codable errors?**

```swift
do {
    let result = try decoder.decode(User.self, from: data)
} catch DecodingError.keyNotFound(let key, let context) {
    print("Missing key: \(key.stringValue)")
    print("Path: \(context.codingPath.map { $0.stringValue })")
    print("Description: \(context.debugDescription)")
} catch DecodingError.typeMismatch(let type, let context) {
    print("Type mismatch: expected \(type)")
    print("Path: \(context.codingPath)")
} catch {
    print("Other error: \(error)")
}
```

**10. Performance optimization tips?**

- Reuse JSONEncoder/JSONDecoder instances
- Avoid unnecessary intermediate conversions
- Consider streaming or pagination for large data
- Use keyEncodingStrategy to reduce CodingKeys definitions

## Further Reading

### Official Resources

- [Swift Documentation - Encoding and Decoding Custom Types](https://developer.apple.com/documentation/swift/codable)
- [Swift Evolution SE-0166 - Swift Archival & Serialization](https://github.com/apple/swift-evolution/blob/main/proposals/0166-swift-archival-serialization.md)
- [Swift Evolution SE-0167 - Swift Encoders](https://github.com/apple/swift-evolution/blob/main/proposals/0167-swift-encoders.md)

### Related Libraries

- **CodableWrappers**: Property wrappers to simplify Codable usage
- **BetterCodable**: More flexible default values and type conversion
- **AnyCodable**: Handle dynamic JSON types
- **XMLCoder**: XML format Codable support

### Advanced Topics

- **PropertyListEncoder/Decoder**: Handling plist format
- **Custom Encoder/Decoder**: Implementing custom serialization formats
- **Codable with Combine**: Network requests with Codable integration
- **SwiftData/CoreData and Codable**: Persistence framework integration

### Recommended Articles

- [Ultimate Guide to JSON Parsing with Swift](https://developer.apple.com/swift/blog/?id=37)
- [Codable in Practice](https://www.swiftbysundell.com/articles/codable-synthesis-for-swift-enums/)
- [Advanced Codable](https://www.objc.io/issues/27-json/codable-in-practice/)

## Summary

Swift Codable is a powerful tool for handling data serialization, bringing type safety to JSON parsing. After reading this guide, you should be able to:

1. **Understand core concepts**: The design philosophy of Encodable and Decodable protocols
2. **Master basic usage**: Automatic synthesis, CodingKeys, date handling
3. **Handle complex scenarios**: Nested types, dynamic keys, heterogeneous arrays
4. **Avoid common pitfalls**: Type mismatches, null handling, unknown enum values
5. **Optimize performance**: Reuse instances, reduce intermediate conversions
6. **Apply in real-world scenarios**: Network requests, local storage, configuration parsing

Remember, Codable's core advantage lies in type safety and compile-time checking. Leveraging these features makes your code more robust and maintainable.
