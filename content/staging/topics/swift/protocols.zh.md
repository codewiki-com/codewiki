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
origin: old/src/content/docs/swift/protocols.zh.md
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

协议是 Swift 语言的核心特性之一，它定义了一组方法、属性和其他要求的蓝图，任何遵循该协议的类型都必须实现这些要求。Swift 的协议不仅仅是接口定义，更是面向协议编程（Protocol-Oriented Programming, POP）范式的基础。

## 概念解释

### 什么是协议

协议（Protocol）定义了一套规范或契约，描述了遵循该协议的类型必须具备的能力。与面向对象编程中的接口类似，但 Swift 的协议更加强大，支持默认实现、关联类型、协议继承等高级特性。

```swift
// 定义一个简单的协议
protocol Identifiable {
    var id: String { get }
}

// 遵循协议的类型必须提供 id 属性
struct User: Identifiable {
    var id: String
    var name: String
}
```

### 历史背景

Swift 从 2014 年发布之初就将协议作为核心特性。2015 年 WWDC 上，Apple 正式提出"面向协议编程"的概念，强调 Swift 是一门"协议优先"的语言。与传统的面向对象编程相比，面向协议编程更加灵活，避免了类继承带来的紧耦合问题。

### 解决的问题

协议解决了以下核心问题：

1. **代码复用困境**：传统继承只能单一继承，协议支持多协议遵循
2. **值类型的多态**：结构体和枚举无法继承，但可以遵循协议
3. **接口隔离**：通过协议组合实现精确的接口定义
4. **测试与解耦**：基于协议的依赖注入使单元测试更容易

## 核心原理

### 协议的内存布局

Swift 使用存在容器（Existential Container）来存储遵循协议的值。当使用协议类型时，Swift 需要处理不同大小类型的统一存储：

```swift
// 协议类型需要存在容器
protocol Drawable {
    func draw()
}

// 存在容器包含：
// 1. 值缓冲区（Value Buffer）：存储小型值或指向堆的指针
// 2. 值证人表（Value Witness Table）：处理值的复制、销毁等操作
// 3. 协议证人表（Protocol Witness Table）：存储协议方法的实现
```

### 静态派发 vs 动态派发

协议方法的派发方式取决于调用上下文：

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

// 协议要求的方法：动态派发
print(person.greet())     // "Hi there!" - 静态派发
print(greetable.greet())  // "Hi there!" - 动态派发，调用实现

// 扩展中的非协议要求方法：静态派发
print(person.wave())      // "Person waving" - 静态派发
print(greetable.wave())   // "Waving" - 静态派发，调用扩展
```

### 协议遵循的检查机制

Swift 在编译时验证类型是否完整实现了协议要求：

```swift
protocol DataSource {
    var count: Int { get }
    func item(at index: Int) -> String
}

// 编译器会检查是否实现了所有要求
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

## 核心要点

### 协议定义语法

```swift
// 属性要求
protocol PropertyProtocol {
    var readOnly: String { get }           // 只读属性
    var readWrite: Int { get set }          // 可读写属性
    static var typeProperty: Bool { get }   // 类型属性
}

// 方法要求
protocol MethodProtocol {
    func instanceMethod()                   // 实例方法
    static func typeMethod()                // 类型方法
    mutating func mutatingMethod()          // 可变方法（值类型）
}

// 初始化器要求
protocol InitProtocol {
    init(value: Int)
    init?(optional: String)                 // 可失败初始化器
}

// 下标要求
protocol SubscriptProtocol {
    subscript(index: Int) -> String { get set }
}
```

### 协议遵循

```swift
// 结构体遵循协议
struct Point: Equatable, CustomStringConvertible {
    var x: Double
    var y: Double

    var description: String {
        return "(\(x), \(y))"
    }
}

// 类遵循协议（初始化器需要 required）
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

// 枚举遵循协议
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

### 协议继承

```swift
protocol Named {
    var name: String { get }
}

protocol Aged {
    var age: Int { get }
}

// 协议可以继承其他协议
protocol Person: Named, Aged {
    var occupation: String { get }
}

// 遵循 Person 的类型必须满足所有继承链上的要求
struct Employee: Person {
    var name: String
    var age: Int
    var occupation: String
}
```

### 类专属协议

```swift
// 使用 AnyObject 限制协议只能被类遵循
protocol Referenceable: AnyObject {
    var referenceCount: Int { get set }
}

class ManagedObject: Referenceable {
    var referenceCount: Int = 0
}

// 结构体不能遵循类专属协议
// struct Value: Referenceable { } // 编译错误
```

### 协议组合

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

// 使用 & 进行协议组合
func travel(with creature: Flyable & Swimmable) {
    creature.fly()
    creature.swim()
}

// 组合协议类型别名
typealias Amphibious = Flyable & Swimmable

struct Duck: Flyable, Swimmable, Walkable {
    func fly() { print("Duck flying") }
    func swim() { print("Duck swimming") }
    func walk() { print("Duck walking") }
}

let duck = Duck()
travel(with: duck)  // Duck 满足 Flyable & Swimmable
```

## 代码示例

### 示例1：协议基础与遵循

```swift
// 定义可序列化协议
protocol JSONSerializable {
    func toJSON() -> [String: Any]
}

// 定义可验证协议
protocol Validatable {
    var validationErrors: [String] { get }
    var isValid: Bool { get }
}

// 扩展提供默认实现
extension Validatable {
    var isValid: Bool {
        return validationErrors.isEmpty
    }
}

// 用户模型遵循多个协议
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

// 使用
let user = UserModel(id: 1, email: "test@example.com", age: 25)
print("Is valid: \(user.isValid)")  // Is valid: true
print("JSON: \(user.toJSON())")     // JSON: ["id": 1, "email": "test@example.com", "age": 25]
```

### 示例2：关联类型

```swift
// 带关联类型的协议
protocol Container {
    associatedtype Item

    var count: Int { get }
    mutating func append(_ item: Item)
    subscript(index: Int) -> Item { get }
}

// 泛型实现
struct Stack<Element>: Container {
    // Swift 自动推断 Item = Element
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

// 显式指定关联类型
struct IntBuffer: Container {
    typealias Item = Int  // 显式指定

    private var buffer: [Int] = []

    var count: Int { buffer.count }

    mutating func append(_ item: Int) {
        buffer.append(item)
    }

    subscript(index: Int) -> Int {
        return buffer[index]
    }
}

// 使用约束的关联类型
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

### 示例3：协议扩展

```swift
// 集合协议扩展
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

// 为遵循 Summable 的 Collection 添加 sum 方法
extension Collection where Element: Summable {
    func sum() -> Element {
        return reduce(Element.zero, +)
    }
}

// 使用
let integers = [1, 2, 3, 4, 5]
print("Sum: \(integers.sum())")  // Sum: 15

let doubles = [1.5, 2.5, 3.0]
print("Sum: \(doubles.sum())")   // Sum: 7.0

// 条件扩展
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

### 示例4：协议组合与类型擦除

```swift
// 定义多个协议
protocol Encodable {
    func encode() -> Data
}

protocol Decodable {
    init(from data: Data) throws
}

// 组合协议
typealias Codable = Encodable & Decodable

// 类型擦除包装器
struct AnyEncodable: Encodable {
    private let _encode: () -> Data

    init<T: Encodable>(_ encodable: T) {
        _encode = encodable.encode
    }

    func encode() -> Data {
        return _encode()
    }
}

// 使用示例
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

// 类型擦除允许存储不同类型
var encodables: [AnyEncodable] = [
    AnyEncodable(Message(content: "Hello")),
    AnyEncodable(Event(name: "Login", timestamp: Date()))
]

for encodable in encodables {
    let data = encodable.encode()
    print("Encoded \(data.count) bytes")
}
```

### 示例5：协议在依赖注入中的应用

```swift
// 网络服务协议
protocol NetworkService {
    func fetch(url: URL) async throws -> Data
}

// 缓存服务协议
protocol CacheService {
    func get(key: String) -> Data?
    func set(key: String, data: Data)
}

// 真实实现
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

// 使用协议的视图模型
class DataViewModel {
    private let networkService: NetworkService
    private let cacheService: CacheService

    // 依赖注入
    init(networkService: NetworkService, cacheService: CacheService) {
        self.networkService = networkService
        self.cacheService = cacheService
    }

    func loadData(from url: URL) async throws -> Data {
        let cacheKey = url.absoluteString

        // 先检查缓存
        if let cachedData = cacheService.get(key: cacheKey) {
            return cachedData
        }

        // 网络请求
        let data = try await networkService.fetch(url: url)
        cacheService.set(key: cacheKey, data: data)
        return data
    }
}

// 测试用 Mock 实现
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

## 最佳实践

### 使用协议组合而非继承

```swift
// 推荐：小而专注的协议
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

// 按需组合
struct Document: Identifiable, Timestampable {
    var id: UUID
    var createdAt: Date
    var updatedAt: Date
    var content: String
}

// 不推荐：大而全的协议
protocol BaseModel {
    var id: UUID { get }
    var createdAt: Date { get }
    var updatedAt: Date { get }
    var version: Int { get }
    var isDeleted: Bool { get }
    func save() throws
    func delete() throws
    func validate() -> Bool
    // ... 过多的要求
}
```

### 优先使用协议扩展提供默认实现

```swift
protocol Describable {
    var name: String { get }
    var details: String { get }
    func describe() -> String
}

// 提供合理的默认实现
extension Describable {
    var details: String {
        return ""  // 默认空字符串
    }

    func describe() -> String {
        if details.isEmpty {
            return name
        }
        return "\(name): \(details)"
    }
}

// 遵循类型可以选择性覆盖
struct Product: Describable {
    var name: String
    var price: Double

    // 自定义 details
    var details: String {
        return "Price: $\(price)"
    }
    // 使用默认的 describe()
}
```

### 使用 where 子句精确约束

```swift
protocol Stackable {
    associatedtype Element
    mutating func push(_ element: Element)
    mutating func pop() -> Element?
}

// 为特定条件添加方法
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

### 明智选择 some 和 any

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

// 使用 some：返回类型确定，编译器可优化
func makeCircle(radius: Double) -> some Shape {
    return Circle(radius: radius)
}

// 使用 any：需要存储不同类型
func collectShapes() -> [any Shape] {
    return [Circle(radius: 5), Rectangle(width: 3, height: 4)]
}

// 函数参数中的选择
// some：相当于泛型约束，每次调用使用同一类型
func process(_ shape: some Shape) {
    print("Area: \(shape.area())")
}

// any：接受任何遵循 Shape 的类型
func processAny(_ shape: any Shape) {
    print("Area: \(shape.area())")
}
```

### 避免协议方法默认实现的陷阱

```swift
protocol Logging {
    func log(message: String)
}

extension Logging {
    // 协议要求的默认实现
    func log(message: String) {
        print("[Default] \(message)")
    }

    // 扩展中的新方法（非协议要求）
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

// log 是协议要求：动态派发
logger.log(message: "Test")          // [Console] Test
protocolLogger.log(message: "Test")  // [Console] Test ✓ 符合预期

// debug 非协议要求：静态派发
logger.debug(message: "Test")          // [Console Debug] Test
protocolLogger.debug(message: "Test")  // [Debug] Test ✗ 可能不符合预期
```

## 常见陷阱

### 关联类型使协议无法作为类型使用

```swift
protocol Container {
    associatedtype Item
    var items: [Item] { get }
}

// 错误：带关联类型的协议不能直接作为类型
// var containers: [Container] = []  // 编译错误

// 解决方案1：使用泛型
func printItems<C: Container>(from container: C) where C.Item: CustomStringConvertible {
    container.items.forEach { print($0) }
}

// 解决方案2：使用 any 关键字（Swift 5.7+）
var containers: [any Container] = []

// 解决方案3：类型擦除
struct AnyContainer<T>: Container {
    typealias Item = T
    private let _items: () -> [T]

    init<C: Container>(_ container: C) where C.Item == T {
        _items = { container.items }
    }

    var items: [T] { _items() }
}
```

### 协议扩展方法的静态派发问题

```swift
protocol Drawable {
    func draw()
}

extension Drawable {
    func draw() {
        print("Drawing default shape")
    }

    func render() {
        draw()  // 这里调用的 draw 取决于静态类型
    }
}

struct Square: Drawable {
    func draw() {
        print("Drawing square")
    }
}

let square = Square()
square.render()  // "Drawing square" - 因为 self 是 Square

let drawable: Drawable = square
drawable.render()  // "Drawing square" - draw() 是协议要求，动态派发

// 但如果 render 调用非协议要求的方法，行为会不同
```

### mutating 要求的限制

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

    // 类不需要 mutating 关键字
    func reset() {
        count = 0
    }
}

// 问题：协议类型的变量需要是 var
var resettable: Resettable = Counter()
resettable.reset()  // OK

let constantResettable: Resettable = Counter()
// constantResettable.reset()  // 编译错误：不能对常量调用 mutating 方法
```

### 协议初始化器的 required 要求

```swift
protocol Creatable {
    init()
}

class BaseClass: Creatable {
    required init() {}  // 必须标记 required
}

class DerivedClass: BaseClass {
    var value: Int

    // 必须也实现 required init
    required init() {
        value = 0
        super.init()
    }
}

// final 类不需要 required
final class FinalClass: Creatable {
    init() {}  // 不需要 required
}
```

### Self 类型的限制

```swift
protocol Copyable {
    func copy() -> Self
}

// 结构体可以直接返回 Self
struct Document: Copyable {
    var content: String

    func copy() -> Document {
        return Document(content: content)
    }
}

// 类需要特殊处理
class Node: Copyable {
    var value: Int

    required init(value: Int) {
        self.value = value
    }

    func copy() -> Self {
        // 使用 type(of: self) 和 required init
        return type(of: self).init(value: value)
    }
}

class ChildNode: Node {
    var name: String = ""

    required init(value: Int) {
        super.init(value: value)
    }

    // 如果不覆盖 copy()，返回的仍是正确类型
}
```

## 性能考量

### 存在容器的开销

```swift
protocol Animal {
    func speak() -> String
}

struct Dog: Animal {
    func speak() -> String { "Woof!" }
}

// 具体类型：无额外开销
let dog = Dog()  // 直接存储，静态派发

// 存在类型：有额外开销
let animal: Animal = Dog()  // 存在容器，动态派发
// 存在容器包含：
// - 值缓冲区（24字节内联或堆分配）
// - 元数据指针
// - 协议证人表指针

// 性能对比
func processDirectly(_ dog: Dog) {
    _ = dog.speak()  // 静态派发，可内联
}

func processExistential(_ animal: Animal) {
    _ = animal.speak()  // 动态派发，不可内联
}
```

### 使用泛型代替存在类型

```swift
// 存在类型版本：动态派发
func feedAnimals(_ animals: [any Animal]) {
    for animal in animals {
        print(animal.speak())
    }
}

// 泛型版本：可以被优化
func feedAnimals<T: Animal>(_ animals: [T]) {
    for animal in animals {
        print(animal.speak())  // 编译器可以特化和内联
    }
}

// 如果所有元素类型相同，泛型版本性能更好
let dogs: [Dog] = [Dog(), Dog(), Dog()]
feedAnimals(dogs)  // 编译器生成针对 Dog 的特化版本
```

### 协议扩展 vs 具体实现

```swift
protocol Calculatable {
    var value: Double { get }
}

extension Calculatable {
    // 协议扩展中的方法
    func squared() -> Double {
        return value * value
    }
}

struct Number: Calculatable {
    var value: Double

    // 具体实现可能更高效
    func squared() -> Double {
        return value * value
    }
}

// 当类型已知时，编译器会优先使用具体实现
let num = Number(value: 5)
_ = num.squared()  // 调用 Number.squared()，静态派发
```

### 建议

1. **优先使用泛型约束**：当类型在编译时确定，使用 `<T: Protocol>` 而非 `any Protocol`
2. **避免频繁装箱拆箱**：存在类型的频繁转换会带来开销
3. **考虑 @inlinable**：对性能关键的协议扩展方法使用 `@inlinable`
4. **使用 some 返回类型**：允许编译器进行更多优化

## 实战场景

### 场景1：插件系统

```swift
// 定义插件协议
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

// 插件管理器
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

// 具体插件实现
struct AnalyticsPlugin: Plugin {
    var name: String { "Analytics" }
    var version: String { "1.0.0" }

    func initialize() {
        // 初始化分析SDK
    }

    func execute(with context: PluginContext) {
        // 发送分析数据
    }

    func shutdown() {
        // 清理资源
    }
}
```

### 场景2：策略模式

```swift
// 价格计算策略
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

// 使用策略
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

// 根据条件切换策略
let cart = ShoppingCart()
cart.items = [(price: 10.0, quantity: 5)]

cart.pricingStrategy = RegularPricing()
print("Regular: \(cart.total)")  // 50

cart.pricingStrategy = BulkPricing(threshold: 3, discount: 0.1)
print("Bulk: \(cart.total)")  // 45

cart.pricingStrategy = SeasonalPricing(multiplier: 1.2)
print("Seasonal: \(cart.total)")  // 60
```

### 场景3：数据存储抽象

```swift
// 存储协议
protocol DataStore {
    associatedtype Model: Identifiable

    func save(_ model: Model) async throws
    func fetch(id: Model.ID) async throws -> Model?
    func fetchAll() async throws -> [Model]
    func delete(id: Model.ID) async throws
}

// 用户模型
struct User: Identifiable, Codable {
    var id: UUID
    var name: String
    var email: String
}

// 内存实现
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

// UserDefaults 实现
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

// 服务层使用抽象
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

## 面试要点

### 常见问题

**1. 协议和抽象类的区别是什么？**

- Swift 没有抽象类，协议是实现抽象的主要方式
- 协议可以被结构体、枚举、类遵循，抽象类只能被类继承
- 类型可以遵循多个协议，但只能继承一个类
- 协议定义的是能力/契约，抽象类定义的是"是什么"的关系

**2. 什么时候用 some，什么时候用 any？**

```swift
// some：不透明类型
// - 返回类型固定，但对调用者隐藏
// - 编译器可以优化
// - 适用于工厂方法、SwiftUI 视图
func makeView() -> some View { Text("Hello") }

// any：存在类型
// - 可以存储不同具体类型
// - 有运行时开销
// - 适用于异构集合、动态类型场景
var views: [any View] = []
```

**3. 解释协议扩展中方法的派发规则**

- 协议要求的方法：动态派发（通过协议证人表）
- 仅在扩展中定义的方法：静态派发（根据编译时类型）

**4. 什么是关联类型？为什么需要它？**

关联类型是协议中的类型占位符，允许协议在不指定具体类型的情况下定义方法签名。它使协议更加通用，遵循类型可以指定具体类型。

**5. 如何解决"协议不能作为类型使用"的问题？**

- 使用泛型约束 `<T: Protocol>`
- 使用 `any Protocol`（Swift 5.7+）
- 实现类型擦除包装器

### 进阶话题

**协议证人表（Protocol Witness Table）**

每个类型对协议的遵循都有一个证人表，存储协议方法的具体实现。当通过协议类型调用方法时，运行时通过这个表找到正确的实现。

**主关联类型（Primary Associated Types）**

Swift 5.7 引入，允许在协议类型中指定关联类型的具体值：

```swift
protocol Collection<Element> {
    associatedtype Element
    // ...
}

func process(_ collection: some Collection<Int>) { }
```

**协议的元编程**

使用 `Self` 类型和关联类型可以实现复杂的类型关系：

```swift
protocol Clonable {
    func clone() -> Self
}

protocol Factory {
    associatedtype Product
    static func create() -> Product
}
```

## 延伸阅读

### 官方资源

- [The Swift Programming Language - Protocols](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/)
- [WWDC 2015: Protocol-Oriented Programming in Swift](https://developer.apple.com/videos/play/wwdc2015/408/)
- [WWDC 2016: Protocol and Value Oriented Programming in UIKit Apps](https://developer.apple.com/videos/play/wwdc2016/419/)
- [Swift Evolution - SE-0335: Existential any](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0335-existential-any.md)

### 推荐书籍

- 《Swift 进阶》- objc.io
- 《Swift 编程权威指南》- Big Nerd Ranch
- 《Advanced Swift》- objc.io

### 优质文章

- [Understanding Protocol-Oriented Programming](https://www.swiftbysundell.com/articles/understanding-protocol-oriented-programming/)
- [Protocols in Swift](https://www.hackingwithswift.com/read/0/22/protocols)
- [Type Erasure in Swift](https://www.donnywals.com/understanding-type-erasure-in-swift/)
- [Swift Protocol Dispatch](https://www.rightpoint.com/rplabs/switch-method-dispatch-table)

### 相关工具

- [Sourcery](https://github.com/krzysztofzablocki/Sourcery) - 自动生成协议实现代码
- [SwiftLint](https://github.com/realm/SwiftLint) - 代码规范检查，包含协议相关规则

---

Swift 的协议系统是语言设计中最精妙的部分之一。通过协议，我们可以定义清晰的抽象边界，实现代码复用，并保持类型安全。掌握协议的各种特性——从基本定义到关联类型，从协议扩展到 some/any 关键字——将帮助你写出更加优雅、可维护的 Swift 代码。面向协议编程不仅是一种编程范式，更是一种思维方式，鼓励我们从能力而非继承的角度思考类型设计。
