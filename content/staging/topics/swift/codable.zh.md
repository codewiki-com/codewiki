---
title: Swift Codable
description: 掌握 Swift Codable 协议进行 JSON 编码/解码，包括自定义编码和嵌套类型
track: swift
section: basics
difficulty: intermediate
tags:
  - Swift
  - Codable
  - JSON
  - serialization
status: imported
origin: old/src/content/docs/swift/codable.zh.md
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

Codable 是 Swift 4 中引入的强大协议，它将类型安全的序列化和反序列化带入了 Swift 的类型系统。本指南探讨了 Codable 的核心概念、工作原理、自定义编码/解码技术和实际应用。

## 理解 Codable

### 什么是 Codable？

Codable 是 Swift 标准库中定义的类型别名，它组合了两个协议：

```swift
typealias Codable = Encodable & Decodable
```

- **Encodable**：定义类型如何编码（序列化）为外部表示形式，如 JSON 或 Property List
- **Decodable**：定义类型如何从外部表示形式解码（反序列化）

### 为什么 Codable 重要

在 Codable 之前，iOS 开发者通常使用以下方式处理 JSON：

1. **NSJSONSerialization**：返回 `Any` 类型，需要大量类型转换
2. **第三方库（如 SwiftyJSON）**：提供便捷语法但缺乏类型安全
3. **手动解析**：编写容易出错且繁琐的样板代码

Codable 通过以下方式解决了这些问题：

- **类型安全**：编译时检查减少运行时错误
- **最少样板代码**：大多数情况下零样板代码
- **标准化**：原生 Swift 标准库支持
- **可扩展性**：支持自定义编码/解码逻辑

### 历史背景

Codable 作为提案 SE-0166 和 SE-0167 的一部分在 Swift 4（2017 年）中引入。它是 Swift 演进中的重要里程碑，借鉴了其他语言中的序列化机制（如 Rust 的 Serde 和 Go 的 encoding/json），同时利用了 Swift 的类型系统和编译器能力。

## 核心原理

### 协议定义

```swift
// Encodable 协议
protocol Encodable {
    func encode(to encoder: Encoder) throws
}

// Decodable 协议
protocol Decodable {
    init(from decoder: Decoder) throws
}
```

### 自动合成

当类型的所有存储属性都符合 Codable 时，Swift 编译器会自动合成 `encode(to:)` 和 `init(from:)` 方法。这是通过编译器魔法实现的，不需要运行时反射。

```swift
// 编译器自动生成编码/解码方法
struct User: Codable {
    let id: Int
    let name: String
    let email: String
}
```

### 编码器和解码器系统

Swift 提供了抽象的编码/解码系统：

```swift
// Encoder 协议
protocol Encoder {
    var codingPath: [CodingKey] { get }
    var userInfo: [CodingUserInfoKey: Any] { get }

    func container<Key: CodingKey>(keyedBy type: Key.Type) -> KeyedEncodingContainer<Key>
    func unkeyedContainer() -> UnkeyedEncodingContainer
    func singleValueContainer() -> SingleValueEncodingContainer
}

// Decoder 协议
protocol Decoder {
    var codingPath: [CodingKey] { get }
    var userInfo: [CodingUserInfoKey: Any] { get }

    func container<Key: CodingKey>(keyedBy type: Key.Type) throws -> KeyedDecodingContainer<Key>
    func unkeyedContainer() throws -> UnkeyedDecodingContainer
    func singleValueContainer() throws -> SingleValueDecodingContainer
}
```

### 容器类型

编码/解码过程使用三种类型的容器：

1. **KeyedContainer**：键值对容器，用于对象/字典
2. **UnkeyedContainer**：无键容器，用于数组
3. **SingleValueContainer**：单值容器，用于原始类型

```swift
// 容器使用示例
func encode(to encoder: Encoder) throws {
    // 键值容器
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(name, forKey: .name)

    // 嵌套容器
    var addressContainer = container.nestedContainer(keyedBy: AddressKeys.self, forKey: .address)
    try addressContainer.encode(city, forKey: .city)
}
```

## 基本用法

### 自动 Codable 合成

```swift
// 所有属性都是 Codable，自动合成发生
struct Product: Codable {
    let id: Int
    let name: String
    let price: Double
    let inStock: Bool
    let tags: [String]
    let metadata: [String: String]?
}
```

### JSONEncoder 和 JSONDecoder

```swift
let product = Product(
    id: 1,
    name: "iPhone",
    price: 999.99,
    inStock: true,
    tags: ["electronics", "phone"],
    metadata: ["color": "black"]
)

// 编码为 JSON
let encoder = JSONEncoder()
encoder.outputFormatting = .prettyPrinted
let jsonData = try encoder.encode(product)
let jsonString = String(data: jsonData, encoding: .utf8)!

// 解码 JSON
let decoder = JSONDecoder()
let decodedProduct = try decoder.decode(Product.self, from: jsonData)
```

### CodingKeys 用于自定义键名

当 JSON 键与属性名不匹配时，使用 CodingKeys：

```swift
struct User: Codable {
    let id: Int
    let userName: String
    let emailAddress: String
    let createdAt: Date

    // 自定义 JSON 键映射
    enum CodingKeys: String, CodingKey {
        case id
        case userName = "user_name"
        case emailAddress = "email_address"
        case createdAt = "created_at"
    }
}
```

### 自动键转换策略

JSONEncoder/JSONDecoder 提供自动键名转换：

```swift
struct User: Codable {
    let userId: Int
    let userName: String
    let emailAddress: String
}

// 编码：camelCase -> snake_case
let encoder = JSONEncoder()
encoder.keyEncodingStrategy = .convertToSnakeCase

// 解码：snake_case -> camelCase
let decoder = JSONDecoder()
decoder.keyDecodingStrategy = .convertFromSnakeCase

// JSON: {"user_id": 1, "user_name": "John", "email_address": "..."}
```

### 日期编码/解码策略

```swift
struct Event: Codable {
    let name: String
    let date: Date
}

let encoder = JSONEncoder()
let decoder = JSONDecoder()

// 1. ISO 8601 格式
encoder.dateEncodingStrategy = .iso8601
decoder.dateDecodingStrategy = .iso8601

// 2. Unix 时间戳（秒）
encoder.dateEncodingStrategy = .secondsSince1970
decoder.dateDecodingStrategy = .secondsSince1970

// 3. Unix 时间戳（毫秒）
encoder.dateEncodingStrategy = .millisecondsSince1970
decoder.dateDecodingStrategy = .millisecondsSince1970

// 4. 自定义格式
let dateFormatter = DateFormatter()
dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
dateFormatter.locale = Locale(identifier: "en_US_POSIX")
encoder.dateEncodingStrategy = .formatted(dateFormatter)
decoder.dateDecodingStrategy = .formatted(dateFormatter)

// 5. 自定义闭包
encoder.dateEncodingStrategy = .custom { date, encoder in
    var container = encoder.singleValueContainer()
    let timestamp = Int(date.timeIntervalSince1970 * 1000)
    try container.encode(timestamp)
}
```

### Data 编码/解码策略

```swift
struct Document: Codable {
    let name: String
    let content: Data
}

let encoder = JSONEncoder()
let decoder = JSONDecoder()

// 1. Base64 编码（默认）
encoder.dataEncodingStrategy = .base64
decoder.dataDecodingStrategy = .base64

// 2. 延迟转换
encoder.dataEncodingStrategy = .deferredToData
decoder.dataDecodingStrategy = .deferredToData

// 3. 自定义处理
encoder.dataEncodingStrategy = .custom { data, encoder in
    var container = encoder.singleValueContainer()
    try container.encode(data.base64EncodedString())
}
```

## 代码示例

### 基本编码/解码

```swift
import Foundation

// 定义数据模型
struct Book: Codable {
    let isbn: String
    let title: String
    let author: String
    let price: Double
    let publishDate: Date
    let categories: [String]
}

// 创建实例
let book = Book(
    isbn: "978-0-13-468599-1",
    title: "The Swift Programming Language",
    author: "Apple Inc.",
    price: 59.99,
    publishDate: Date(),
    categories: ["Programming", "iOS", "Swift"]
)

// 编码
func encodeBook(_ book: Book) throws -> Data {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    encoder.dateEncodingStrategy = .iso8601
    return try encoder.encode(book)
}

// 解码
func decodeBook(from data: Data) throws -> Book {
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return try decoder.decode(Book.self, from: data)
}

// 使用示例
do {
    let jsonData = try encodeBook(book)
    print(String(data: jsonData, encoding: .utf8)!)

    let decodedBook = try decodeBook(from: jsonData)
    print("Decoded successfully: \(decodedBook.title)")
} catch {
    print("Encoding/Decoding error: \(error)")
}
```

### 嵌套类型

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

// JSON 示例
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

// 解码
let decoder = JSONDecoder()
if let data = orderJSON.data(using: .utf8),
   let order = try? decoder.decode(Order.self, from: data) {
    print("Order ID: \(order.orderId)")
    print("Customer: \(order.customer.name)")
    print("Item count: \(order.items.count)")
    print("Status: \(order.status.rawValue)")
}
```

### 自定义编码/解码实现

```swift
struct Person: Codable {
    let name: String
    let age: Int
    let birthday: Date
    private let secretCode: String

    // 自定义 CodingKeys
    enum CodingKeys: String, CodingKey {
        case name
        case age
        case birthday = "birth_date"
        // secretCode 未列出，不会被编码/解码
    }

    // 自定义解码
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        name = try container.decode(String.self, forKey: .name)
        age = try container.decode(Int.self, forKey: .age)
        birthday = try container.decode(Date.self, forKey: .birthday)

        // secretCode 使用默认值
        secretCode = "DEFAULT"
    }

    // 自定义编码
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        try container.encode(name, forKey: .name)
        try container.encode(age, forKey: .age)
        try container.encode(birthday, forKey: .birthday)
        // secretCode 不会被编码
    }

    // 常规初始化器
    init(name: String, age: Int, birthday: Date, secretCode: String) {
        self.name = name
        self.age = age
        self.birthday = birthday
        self.secretCode = secretCode
    }
}
```

### 处理动态 JSON 键

```swift
// 处理具有动态键名的 JSON
// {"user_1": {...}, "user_2": {...}, "user_3": {...}}

struct DynamicUsers: Codable {
    var users: [String: User]

    struct User: Codable {
        let name: String
        let email: String
    }

    // 动态键
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

### 处理异构数组

```swift
// 处理包含不同类型的数组
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
            // 创建副本以查看类型
            let nestedContainer = try container.nestedContainer(keyedBy: TypeKey.self)
            let typeString = try nestedContainer.decode(String.self, forKey: .type)

            // 根据类型解码 - 需要使用 superDecoder 模式
            let item: any ContentItem
            switch typeString {
            case "text":
                item = try TextContent(from: nestedContainer.superDecoder())
            case "image":
                item = try ImageContent(from: nestedContainer.superDecoder())
            default:
                continue // 跳过未知类型
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

### 可选值和默认值

```swift
struct UserProfile: Codable {
    let id: Int
    let name: String
    let nickname: String?          // 可选，JSON 中可能缺失
    let avatar: String?            // 可选
    let isVerified: Bool           // 必须提供默认值处理
    let memberLevel: Int           // 提供默认值

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

        // 可选值，如果缺失则为 nil
        nickname = try container.decodeIfPresent(String.self, forKey: .nickname)
        avatar = try container.decodeIfPresent(String.self, forKey: .avatar)

        // 提供默认值
        isVerified = try container.decodeIfPresent(Bool.self, forKey: .isVerified) ?? false
        memberLevel = try container.decodeIfPresent(Int.self, forKey: .memberLevel) ?? 1
    }
}

// 使用 Property Wrapper 简化默认值处理（Swift 5.1+）
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

### 扁平化嵌套结构

```swift
// JSON 结构
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

// 期望的 Swift 结构（扁平化）
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

        // 解码嵌套的 personal_info
        let personalContainer = try container.nestedContainer(
            keyedBy: PersonalInfoKeys.self,
            forKey: .personalInfo
        )
        name = try personalContainer.decode(String.self, forKey: .name)
        age = try personalContainer.decode(Int.self, forKey: .age)

        // 解码嵌套的 contact_info
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

        // 编码为嵌套结构
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

## 最佳实践

### 优先使用自动合成

只在必要时自定义编码/解码逻辑：

```swift
// 推荐：尽可能使用自动合成
struct SimpleUser: Codable {
    let id: Int
    let name: String
}

// 仅在需要时自定义 CodingKeys
struct APIUser: Codable {
    let userId: Int
    let userName: String

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case userName = "user_name"
    }
}
```

### 使用 keyEncodingStrategy 减少样板代码

```swift
// 避免：为每个属性编写 CodingKeys
struct User: Codable {
    let userId: Int
    let userName: String
    let emailAddress: String
    // 不需要手动定义 CodingKeys
}

let encoder = JSONEncoder()
encoder.keyEncodingStrategy = .convertToSnakeCase
// 自动转换为：user_id, user_name, email_address
```

### 封装通用编码/解码配置

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

### 使用扩展添加便捷方法

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

// 使用示例
let user = User(id: 1, name: "John")
let jsonString = try user.toJSONString()
let decodedUser = try User.from(jsonString: jsonString)
```

### 显式处理可选值

```swift
struct Config: Codable {
    let required: String           // 必须存在
    let optional: String?          // 可能缺失
    let withDefault: String        // 如果缺失使用默认值

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        // 必须存在，如果缺失则抛出错误
        required = try container.decode(String.self, forKey: .required)

        // 可选，如果缺失则为 nil
        optional = try container.decodeIfPresent(String.self, forKey: .optional)

        // 提供默认值
        withDefault = try container.decodeIfPresent(String.self, forKey: .withDefault) ?? "default"
    }
}
```

### 使用 Result 类型进行错误处理

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

// 使用示例
let result = JSONDecoder().decodeResult(User.self, from: jsonData)
switch result {
case .success(let user):
    print("Decoded successfully: \(user.name)")
case .failure(let error):
    print("Decoding failed: \(error.localizedDescription)")
}
```

## 常见陷阱

### 键名不匹配

```swift
// JSON: {"user_id": 1, "user_name": "John"}

// 错误：属性名与 JSON 键不匹配
struct User: Codable {
    let userId: Int    // 期望 "userId"，但实际是 "user_id"
    let userName: String
}

// 解决方案 1：使用 CodingKeys
struct User: Codable {
    let userId: Int
    let userName: String

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case userName = "user_name"
    }
}

// 解决方案 2：使用 keyDecodingStrategy
let decoder = JSONDecoder()
decoder.keyDecodingStrategy = .convertFromSnakeCase
```

### 类型不匹配

```swift
// JSON 中的 "123" 是字符串，但期望 Int
// {"id": "123", "count": "100"}

struct Stats: Codable {
    let id: Int     // 会失败！
    let count: Int  // 会失败！
}

// 解决方案：自定义解码逻辑
struct Stats: Codable {
    let id: Int
    let count: Int

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        // 尝试解码为 Int，回退到 String 转换
        if let intId = try? container.decode(Int.self, forKey: .id) {
            id = intId
        } else {
            let stringId = try container.decode(String.self, forKey: .id)
            guard let intId = Int(stringId) else {
                throw DecodingError.dataCorruptedError(forKey: .id, in: container, debugDescription: "Cannot convert to Int")
            }
            id = intId
        }

        // count 同样处理
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

// 通用解决方案：创建灵活类型
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

### 空值处理

```swift
// JSON: {"name": "John", "age": null}

// 问题：非可选类型遇到 null 会失败
struct User: Codable {
    let name: String
    let age: Int  // JSON 有 null 会失败!
}

// 解决方案 1：使用可选类型
struct User: Codable {
    let name: String
    let age: Int?
}

// 解决方案 2：提供默认值
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

### 未知枚举值

```swift
// JSON: {"status": "unknown_status"}

// 问题：遇到未定义的枚举值会失败
enum Status: String, Codable {
    case active
    case inactive
    case pending
}

// 解决方案：添加 unknown case
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

### 循环引用

```swift
// 问题：循环引用会导致无限递归
class Person: Codable {
    let name: String
    var bestFriend: Person?  // 可能导致循环引用
}

// 解决方案：使用标识符引用
class Person: Codable {
    let id: Int
    let name: String
    var bestFriendId: Int?  // 使用 ID 而不是直接引用
}
```

### 忽略错误细节

```swift
// 不推荐：吞掉错误
let user = try? decoder.decode(User.self, from: data)

// 推荐：正确处理和记录错误
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

## 性能考虑

### 复用 JSONEncoder/Decoder 实例

```swift
// 不推荐：每次创建新实例
func decode<T: Decodable>(_ data: Data) throws -> T {
    let decoder = JSONDecoder()  // 每次都创建新实例
    return try decoder.decode(T.self, from: data)
}

// 推荐：复用实例
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

### 避免不必要的中间转换

```swift
// 不推荐：多次转换
let dict = try JSONSerialization.jsonObject(with: data) as! [String: Any]
let jsonData = try JSONSerialization.data(withJSONObject: dict)
let user = try JSONDecoder().decode(User.self, from: jsonData)

// 推荐：直接解码
let user = try JSONDecoder().decode(User.self, from: data)
```

### 大数据处理

```swift
// 对于大型 JSON 数组，考虑流式处理或分页
// 使用 JSONSerialization 的 ReadingOptions.fragmentsAllowed
// 或考虑第三方流式 JSON 解析器

// 大型数组的分页处理
struct PaginatedResponse<T: Codable>: Codable {
    let data: [T]
    let page: Int
    let totalPages: Int
    let hasMore: Bool
}
```

### 延迟解码

```swift
// 对于大型对象，考虑延迟解码
struct LazyDocument: Codable {
    let id: String
    let title: String
    private let contentJSON: String  // 存储原始 JSON 字符串

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

### 编码性能优化

```swift
// 对于频繁编码的小对象，考虑缓存
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

## 实际场景

### 场景 1：网络 API 响应处理

```swift
// 通用 API 响应包装器
struct APIResponse<T: Codable>: Codable {
    let code: Int
    let message: String
    let data: T?
    let timestamp: Date

    var isSuccess: Bool {
        return code == 200
    }
}

// 具体业务模型
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

// 网络请求包装器
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

// 使用示例
let client = APIClient()
let response: APIResponse<UserInfo> = try await client.request(userInfoURL)

if response.isSuccess, let user = response.data {
    print("User: \(user.nickname)")
} else {
    print("Error: \(response.message)")
}
```

### 场景 2：本地数据持久化

```swift
// 用户设置模型
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

// 持久化管理器
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

### 场景 3：缓存层实现

```swift
// 缓存条目
struct CacheEntry<T: Codable>: Codable {
    let value: T
    let createdAt: Date
    let expiresAt: Date

    var isExpired: Bool {
        return Date() > expiresAt
    }
}

// 磁盘缓存
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

### 场景 4：配置文件解析

```swift
// 应用程序配置
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

// 配置加载器
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

// config.json 示例
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

## 面试问题

### 常见面试主题

**1. Codable、Encodable 和 Decodable 之间有什么关系？**

```swift
// Codable 是 Encodable 和 Decodable 的组合
typealias Codable = Encodable & Decodable

// Encodable：定义如何编码（序列化）
protocol Encodable {
    func encode(to encoder: Encoder) throws
}

// Decodable：定义如何解码（反序列化）
protocol Decodable {
    init(from decoder: Decoder) throws
}

// 用例：
// - 只需要编码：遵循 Encodable
// - 只需要解码：遵循 Decodable
// - 两者都需要：遵循 Codable
```

**2. Swift 如何自动合成 Codable 实现？**

Swift 编译器在以下情况自动合成：
- 所有存储属性都遵循 Codable
- 如果定义了 CodingKeys 枚举，它必须涵盖所有要编码/解码的属性
- 自动合成基于编译时代码生成，不是运行时反射

**3. CodingKeys 的作用是什么？**

```swift
// CodingKeys 用于：
// 1. 自定义 JSON 键名
// 2. 从编码/解码中排除属性
// 3. 处理不符合 Swift 命名规范的键

struct User: Codable {
    let userId: Int
    let userName: String
    let internalData: String  // 不被编码/解码

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case userName = "user_name"
        // internalData 未列出，不会被编码/解码
    }
}
```

**4. 如何处理 JSON 中的 null 值？**

```swift
// 方法 1：使用可选类型
struct User: Codable {
    let name: String?  // JSON 中可以是 null
}

// 方法 2：使用 decodeIfPresent
init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    name = try container.decodeIfPresent(String.self, forKey: .name)
}

// 方法 3：提供默认值
name = try container.decodeIfPresent(String.self, forKey: .name) ?? "Default Name"
```

**5. 如何处理 Date 类型的编码/解码？**

```swift
// 使用 dateEncodingStrategy / dateDecodingStrategy
let decoder = JSONDecoder()

// ISO 8601 格式
decoder.dateDecodingStrategy = .iso8601

// Unix 时间戳
decoder.dateDecodingStrategy = .secondsSince1970

// 自定义格式
let formatter = DateFormatter()
formatter.dateFormat = "yyyy-MM-dd"
decoder.dateDecodingStrategy = .formatted(formatter)

// 自定义逻辑
decoder.dateDecodingStrategy = .custom { decoder in
    // 自定义解析逻辑
}
```

**6. encode(to:) 和 init(from:) 中有哪些可用的容器类型？**

```swift
// 1. KeyedContainer：键值对，用于对象
var container = encoder.container(keyedBy: CodingKeys.self)
try container.encode(name, forKey: .name)

// 2. UnkeyedContainer：无键，用于数组
var container = encoder.unkeyedContainer()
for item in items {
    try container.encode(item)
}

// 3. SingleValueContainer：单值，用于原始类型
var container = encoder.singleValueContainer()
try container.encode(rawValue)
```

**7. 如何处理多态类型（异构数组）？**

```swift
// 使用类型标识符字段
// {"type": "text", "content": "..."} 或 {"type": "image", "url": "..."}

// 解码时，首先读取类型字段，然后解码相应的结构
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

**8. Codable 和 NSCoding 有什么区别？**

| 特性 | Codable | NSCoding |
|---------|---------|----------|
| 语言 | Swift 原生 | Objective-C 兼容 |
| 类型安全 | 编译时检查 | 运行时检查 |
| 格式支持 | JSON、PropertyList 等 | NSKeyedArchiver |
| 值类型支持 | 支持 struct、enum | 仅 class |
| 自动合成 | 支持 | 不支持 |

**9. 如何调试 Codable 错误？**

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

**10. 性能优化技巧？**

- 复用 JSONEncoder/JSONDecoder 实例
- 避免不必要的中间转换
- 大数据考虑流式处理或分页
- 使用 keyEncodingStrategy 减少 CodingKeys 定义

## 延伸阅读

### 官方资源

- [Swift 文档 - 编码和解码自定义类型](https://developer.apple.com/documentation/swift/codable)
- [Swift Evolution SE-0166 - Swift 归档和序列化](https://github.com/apple/swift-evolution/blob/main/proposals/0166-swift-archival-serialization.md)
- [Swift Evolution SE-0167 - Swift 编码器](https://github.com/apple/swift-evolution/blob/main/proposals/0167-swift-encoders.md)

### 相关库

- **CodableWrappers**：简化 Codable 使用的属性包装器
- **BetterCodable**：更灵活的默认值和类型转换
- **AnyCodable**：处理动态 JSON 类型
- **XMLCoder**：XML 格式的 Codable 支持

### 高级主题

- **PropertyListEncoder/Decoder**：处理 plist 格式
- **自定义 Encoder/Decoder**：实现自定义序列化格式
- **Codable 与 Combine**：网络请求与 Codable 集成
- **SwiftData/CoreData 和 Codable**：持久化框架集成

### 推荐文章

- [使用 Swift 解析 JSON 的终极指南](https://developer.apple.com/swift/blog/?id=37)
- [Codable 实战](https://www.swiftbysundell.com/articles/codable-synthesis-for-swift-enums/)
- [高级 Codable](https://www.objc.io/issues/27-json/codable-in-practice/)

## 总结

Swift Codable 是处理数据序列化的强大工具，为 JSON 解析带来了类型安全。通过本指南，你应该能够：

1. **理解核心概念**：Encodable 和 Decodable 协议的设计理念
2. **掌握基本用法**：自动合成、CodingKeys、日期处理
3. **处理复杂场景**：嵌套类型、动态键、异构数组
4. **避免常见陷阱**：类型不匹配、null 处理、未知枚举值
5. **优化性能**：复用实例、减少中间转换
6. **应用于实际场景**：网络请求、本地存储、配置解析

记住，Codable 的核心优势在于类型安全和编译时检查。利用这些特性使你的代码更加健壮和可维护。
