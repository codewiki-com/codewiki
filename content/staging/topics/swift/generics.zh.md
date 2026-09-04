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
origin: old/src/content/docs/swift/generics.zh.md
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

泛型（Generics）是 Swift 最强大的特性之一，它让你能够编写灵活、可复用的函数和类型，可以适用于任何类型，同时保持完整的类型安全。Swift 标准库中的大量代码都是使用泛型构建的，包括 `Array`、`Dictionary`、`Set` 和 `Optional` 等核心类型。

## 概念解释

### 什么是泛型？

泛型是一种**参数化类型**的编程范式。它允许你在定义函数、类型或协议时，不预先指定具体的类型，而是使用一个占位符（类型参数）来代替。当实际使用时，这个占位符会被具体的类型所替代。

考虑一个实际场景：你需要编写一个交换两个值的函数。

```swift
// 不使用泛型 - 需要为每种类型编写单独的函数
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

// 使用泛型 - 一个函数适用于所有类型
func swapTwoValues<T>(_ a: inout T, _ b: inout T) {
    let temp = a
    a = b
    b = temp
}
```

在上面的泛型版本中，`T` 就是一个**类型参数**。它并不代表某个具体的类型，而是一个占位符，表示"某种类型"。当你调用这个函数时，Swift 会根据传入的参数自动推断 `T` 的具体类型。

### 泛型解决的问题

1. **代码重复**：没有泛型，你需要为不同类型编写几乎相同的代码
2. **类型安全**：使用 `Any` 会丢失类型信息，泛型则保持完整的类型安全
3. **抽象能力**：泛型允许你编写更加抽象、更加通用的代码
4. **性能优化**：Swift 泛型在编译时进行特化，不会带来运行时开销

### 历史背景

Swift 从 1.0 版本开始就支持泛型。随着语言的发展，泛型系统不断增强：

- **Swift 2.0**：引入协议扩展
- **Swift 4.0**：改进泛型约束语法
- **Swift 5.1**：引入不透明类型（`some`）
- **Swift 5.6**：引入存在类型（`any`）
- **Swift 5.7**：引入主关联类型（Primary Associated Types）

## 核心原理

### 类型参数与类型推断

Swift 泛型的核心是**类型参数**。类型参数用尖括号 `<>` 声明，可以在函数签名、类型定义中使用。

```swift
// T 是类型参数
func identity<T>(_ value: T) -> T {
    return value
}

// 显式指定类型
let explicitInt: Int = identity<Int>(42)

// 类型推断 - Swift 自动推断 T 为 String
let inferredString = identity("Hello")
```

Swift 编译器使用**类型推断**来确定类型参数的具体类型。在大多数情况下，你不需要显式指定类型参数。

### 泛型特化（Specialization）

Swift 泛型在编译时会进行**特化**处理。这意味着对于每个使用的具体类型，编译器会生成专门的代码版本。

```swift
// 编译器可能会为以下调用生成特化版本
let intResult = identity(10)     // 生成 Int 版本
let stringResult = identity("A") // 生成 String 版本
```

这种特化机制确保了泛型代码的性能与手写的类型特定代码相当。

### 类型擦除与运行时

虽然 Swift 泛型在编译时进行特化，但在某些情况下（如使用协议类型时），需要进行**类型擦除**。类型擦除会丢失部分类型信息，但允许更灵活的运行时行为。

```swift
// 存在类型使用类型擦除
let animals: [any Animal] = [Dog(), Cat()]

// 不透明类型保留类型信息
func makeAnimal() -> some Animal {
    return Dog() // 编译器知道具体类型
}
```

## 核心要点

### 泛型的基本语法

| 概念 | 语法 | 说明 |
|------|------|------|
| 类型参数 | `<T>` | 声明一个类型占位符 |
| 多类型参数 | `<T, U, V>` | 声明多个类型占位符 |
| 类型约束 | `<T: Protocol>` | 限制类型必须遵循协议 |
| where 子句 | `where T: Equatable` | 更复杂的约束条件 |
| 关联类型 | `associatedtype Item` | 协议中的类型占位符 |

### 命名约定

- 单个类型参数通常使用 `T`（Type 的缩写）
- 多个类型参数使用 `T`、`U`、`V` 或有意义的名称
- 键值对使用 `Key`、`Value`
- 元素使用 `Element`
- 集合使用 `Collection`

## 代码示例

### 泛型函数

泛型函数是最基础的泛型应用形式。

```swift
// 基础泛型函数
func makeArray<T>(repeating item: T, count: Int) -> [T] {
    var result: [T] = []
    for _ in 0..<count {
        result.append(item)
    }
    return result
}

let threeInts = makeArray(repeating: 42, count: 3)      // [42, 42, 42]
let fourStrings = makeArray(repeating: "Hi", count: 4) // ["Hi", "Hi", "Hi", "Hi"]

// 多类型参数
func combine<T, U>(_ first: T, _ second: U) -> (T, U) {
    return (first, second)
}

let pair = combine("age", 25) // ("age", 25)

// 返回类型推断
func first<T>(of array: [T]) -> T? {
    return array.isEmpty ? nil : array[0]
}

let firstNumber = first(of: [1, 2, 3]) // Optional(1)
let firstChar = first(of: ["a", "b"])  // Optional("a")
```

### 泛型类型

泛型类型让你可以定义适用于任何类型的自定义类型。

```swift
// 泛型栈结构
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

// 使用泛型栈
var intStack = Stack<Int>()
intStack.push(1)
intStack.push(2)
intStack.push(3)
print(intStack.pop()!) // 3

var stringStack = Stack<String>()
stringStack.push("Swift")
stringStack.push("Generics")
print(stringStack.top!) // Generics

// 泛型类
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

// 泛型枚举
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

### 类型约束

类型约束用于限制类型参数必须满足的条件。

```swift
// 单一约束 - T 必须遵循 Comparable 协议
func findMin<T: Comparable>(_ array: [T]) -> T? {
    guard !array.isEmpty else { return nil }
    return array.min()
}

print(findMin([3, 1, 4, 1, 5])!) // 1
print(findMin(["cherry", "apple", "banana"])!) // apple

// 单一约束 - T 必须遵循 Hashable 协议
func removeDuplicates<T: Hashable>(from array: [T]) -> [T] {
    var seen = Set<T>()
    return array.filter { seen.insert($0).inserted }
}

print(removeDuplicates(from: [1, 2, 2, 3, 1])) // [1, 2, 3]

// 多重约束使用 &
func processAndSort<T: Hashable & Comparable>(_ items: [T]) -> [T] {
    return Array(Set(items)).sorted()
}

print(processAndSort([3, 1, 4, 1, 5, 9, 2, 6])) // [1, 2, 3, 4, 5, 6, 9]

// 类约束 - T 必须是某个类的子类
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

### where 子句

where 子句提供了更强大、更灵活的约束能力。

```swift
// 基本 where 子句
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

// 扩展中的 where 子句
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

// 复杂的 where 约束
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
    return true // 相等
}

// where 子句用于方法
extension Array {
    func allSatisfy<T>(where predicate: (Element) -> T?) -> [T] {
        return compactMap(predicate)
    }
}

extension Collection {
    // 只有当元素可比较时才提供 sorted 方法
    func customSorted() -> [Element] where Element: Comparable {
        return sorted()
    }
}
```

### 关联类型

关联类型是协议中的泛型，它为协议提供了类型占位符的能力。

```swift
// 基础关联类型
protocol Queue {
    associatedtype Element

    var isEmpty: Bool { get }
    var count: Int { get }

    mutating func enqueue(_ element: Element)
    mutating func dequeue() -> Element?
    func peek() -> Element?
}

// 实现带有关联类型的协议
struct ArrayQueue<T>: Queue {
    // Swift 自动推断 Element 为 T
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

// 关联类型约束
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

// 关联类型的 where 子句
protocol Sequence2 {
    associatedtype Element
    associatedtype Iterator: IteratorProtocol where Iterator.Element == Element

    func makeIterator() -> Iterator
}

// 嵌套关联类型
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

// 主关联类型 (Swift 5.7+)
protocol DataStore<Element> {
    associatedtype Element

    func save(_ element: Element) throws
    func load(id: String) throws -> Element?
    func delete(id: String) throws
}

// 使用主关联类型
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
        // 实现保存逻辑
    }

    func load(id: String) throws -> T? {
        return storage[id]
    }

    func delete(id: String) throws {
        // 实现删除逻辑
    }
}
```

### 泛型下标

Swift 支持泛型下标，可以创建非常灵活的访问模式。

```swift
// 泛型下标
struct JSON {
    private var data: [String: Any]

    init(_ data: [String: Any]) {
        self.data = data
    }

    // 泛型下标
    subscript<T>(key: String) -> T? {
        return data[key] as? T
    }

    // 带默认值的泛型下标
    subscript<T>(key: String, default defaultValue: T) -> T {
        return (data[key] as? T) ?? defaultValue
    }
}

let json = JSON(["name": "Swift", "version": 5.9, "isAwesome": true])
let name: String? = json["name"]           // Optional("Swift")
let version: Double? = json["version"]     // Optional(5.9)
let missing: Int = json["count", default: 0] // 0

// 动态成员查找结合泛型
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

### 递归泛型

泛型类型可以在其定义中引用自身，创建递归数据结构。

```swift
// 二叉树
indirect enum BinaryTree<Element> {
    case empty
    case node(Element, left: BinaryTree, right: BinaryTree)

    // 遍历
    func inorderTraversal() -> [Element] {
        switch self {
        case .empty:
            return []
        case .node(let value, let left, let right):
            return left.inorderTraversal() + [value] + right.inorderTraversal()
        }
    }

    // 查找
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

// 链表
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

## 最佳实践

### 优先使用类型推断

让 Swift 编译器推断类型，代码更简洁。

```swift
// 推荐：利用类型推断
let numbers = [1, 2, 3].map { $0 * 2 }
let stack = Stack<Int>() // 必须显式指定

// 不推荐：不必要的类型标注
let numbers: [Int] = [1, 2, 3].map { (x: Int) -> Int in x * 2 }
```

### 使用有意义的类型参数名

对于复杂的泛型，使用描述性的类型参数名。

```swift
// 推荐：描述性名称
protocol Repository<Entity, ID> {
    associatedtype Entity
    associatedtype ID: Hashable

    func find(by id: ID) -> Entity?
    func save(_ entity: Entity)
}

// 简单场景可以用 T
func identity<T>(_ value: T) -> T { value }
```

### 适当添加类型约束

只添加必要的约束，避免过度限制。

```swift
// 推荐：只添加必要的约束
func findMax<T: Comparable>(_ array: [T]) -> T? {
    return array.max()
}

// 过度约束
func findMax<T: Comparable & Hashable & Codable>(_ array: [T]) -> T? {
    return array.max() // Hashable 和 Codable 完全不需要
}
```

### 使用协议扩展提供默认实现

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

### 选择合适的泛型抽象层次

```swift
// 过于具体
func processIntArray(_ array: [Int]) -> [Int] { ... }

// 过于抽象
func processAnything<T>(_ value: T) -> T { ... }

// 恰当的抽象
func processNumericArray<T: Numeric>(_ array: [T]) -> [T] { ... }
```

### 使用泛型类型别名简化复杂类型

```swift
// 复杂类型
let handler: (Result<[User], NetworkError>) -> Void

// 使用类型别名简化
typealias NetworkResult<T> = Result<T, NetworkError>
typealias Handler<T> = (NetworkResult<T>) -> Void

let handler: Handler<[User]>
```

## 常见陷阱

### 泛型与 Any/AnyObject 的混淆

```swift
// 错误：使用 Any 丢失类型信息
func wrongProcess(_ items: [Any]) -> Any {
    return items.first! // 返回 Any，需要强制类型转换
}

// 正确：使用泛型保持类型安全
func correctProcess<T>(_ items: [T]) -> T? {
    return items.first // 返回 T?，类型安全
}
```

### 协议作为类型 vs 泛型约束

```swift
protocol Drawable {
    func draw()
}

// 协议作为类型（存在类型）- 有性能开销
func drawAll(shapes: [any Drawable]) {
    shapes.forEach { $0.draw() } // 动态派发
}

// 泛型约束 - 编译时优化
func drawAll<T: Drawable>(shapes: [T]) {
    shapes.forEach { $0.draw() } // 可能被静态派发
}

// 但泛型版本要求所有元素类型相同
// let shapes: [any Drawable] = [Circle(), Square()] // OK
// let shapes: [T] = [Circle(), Square()] // 错误，T 不能同时是 Circle 和 Square
```

### 关联类型的类型擦除问题

```swift
protocol Container {
    associatedtype Item
    var items: [Item] { get }
}

// 错误：不能直接使用带关联类型的协议作为类型
// var containers: [Container] = [] // 编译错误

// 正确方案1：使用存在类型 (Swift 5.7+)
var containers: [any Container] = []

// 正确方案2：使用类型擦除包装器
struct AnyContainer<T>: Container {
    typealias Item = T
    var items: [T]

    init<C: Container>(_ container: C) where C.Item == T {
        self.items = container.items
    }
}
```

### 过度泛型化

```swift
// 过度泛型化 - 没必要
func add<T: Numeric>(_ a: T, _ b: T) -> T {
    return a + b
}

// 直接使用具体类型可能更清晰
func add(_ a: Int, _ b: Int) -> Int {
    return a + b
}

// 但对于真正需要多类型支持的场景，泛型是正确选择
func sum<T: Numeric>(_ numbers: [T]) -> T {
    return numbers.reduce(0, +)
}
```

### 泛型方法覆盖问题

```swift
class Base {
    func process<T>(_ value: T) {
        print("Base: \(value)")
    }
}

class Derived: Base {
    // 注意：这不是覆盖，而是重载
    override func process<T>(_ value: T) {
        print("Derived: \(value)")
    }
}

// 泛型方法不能被真正覆盖
// 子类的泛型方法实际上是独立的方法
```

### Self 与泛型的混淆

```swift
protocol Copyable {
    func copy() -> Self // 返回遵循类型本身
}

// Self 不是泛型参数，而是遵循类型的占位符
struct Document: Copyable {
    var content: String

    func copy() -> Document { // 必须返回 Document
        return Document(content: content)
    }
}
```

## 性能考量

### 编译时特化

Swift 泛型的主要优势之一是编译时特化。编译器会为每个使用的具体类型生成专门的代码。

```swift
// 编译器可能为以下调用生成特化版本
let intSum = sum([1, 2, 3])         // Int 特化版本
let doubleSum = sum([1.0, 2.0, 3.0]) // Double 特化版本

func sum<T: Numeric>(_ numbers: [T]) -> T {
    return numbers.reduce(0, +)
}
```

### 泛型 vs 协议类型

```swift
// 泛型版本 - 静态派发，性能更好
func processGeneric<T: Drawable>(_ item: T) {
    item.draw() // 编译时确定调用目标
}

// 协议类型 - 动态派发，有性能开销
func processProtocol(_ item: any Drawable) {
    item.draw() // 运行时确定调用目标
}

// 基准测试中，泛型版本通常快 2-10 倍
```

### 避免不必要的装箱

```swift
// 避免将值类型装箱为 Any
// 差：会发生装箱
var items: [Any] = [1, 2, 3]

// 好：直接使用泛型
var items: [Int] = [1, 2, 3]

// 或使用泛型容器
struct Container<T> {
    var items: [T]
}
```

### 内联与优化

使用 `@inlinable` 可以帮助跨模块优化泛型代码。

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

### 减少泛型实例化

```swift
// 差：每种组合都会生成新代码
struct Wrapper<A, B, C, D> {
    var a: A
    var b: B
    var c: C
    var d: D
}

// 好：减少类型参数数量
struct Wrapper<T> {
    var value: T
}

// 或使用类型擦除减少实例化
protocol AnyWrapper {
    var anyValue: Any { get }
}
```

## 实战场景

### 场景1：泛型网络层

```swift
// API 响应协议
protocol APIResponse: Decodable {
    associatedtype Data: Decodable
    var data: Data { get }
    var success: Bool { get }
    var message: String? { get }
}

// 通用响应结构
struct Response<T: Decodable>: APIResponse {
    typealias Data = T
    let data: T
    let success: Bool
    let message: String?
}

// 泛型网络客户端
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

    // 带泛型响应包装的请求
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

// 使用示例
struct User: Decodable {
    let id: Int
    let name: String
    let email: String
}

let client = NetworkClient()

// 自动推断返回类型
let user: User = try await client.fetchResource("/api/users/1")
let users: [User] = try await client.fetchResource("/api/users")
```

### 场景2：泛型仓储模式

```swift
// 实体协议
protocol Entity: Identifiable, Codable {
    var id: ID { get }
}

// 泛型仓储协议
protocol Repository<E> where E: Entity {
    associatedtype E: Entity

    func findById(_ id: E.ID) async throws -> E?
    func findAll() async throws -> [E]
    func save(_ entity: E) async throws -> E
    func delete(_ id: E.ID) async throws
    func exists(_ id: E.ID) async throws -> Bool
}

// 提供默认实现
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

// 内存实现
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

// 使用
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

### 场景3：泛型状态机

```swift
// 状态协议
protocol State {
    associatedtype Event
    associatedtype Context

    func handle(event: Event, context: inout Context) -> (any State)?
}

// 泛型状态机
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

// 订单状态机示例
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
        return nil // 终态
    }
}

struct CancelledState: State {
    func handle(event: OrderEvent, context: inout OrderContext) -> (any State)? {
        return nil // 终态
    }
}
```

### 场景4：泛型依赖注入

```swift
// 服务定位器模式
class ServiceLocator {
    static let shared = ServiceLocator()

    private var services: [String: Any] = [:]
    private var factories: [String: () -> Any] = [:]

    private init() {}

    // 注册单例
    func register<T>(_ service: T) {
        let key = String(describing: T.self)
        services[key] = service
    }

    // 注册工厂
    func register<T>(factory: @escaping () -> T) {
        let key = String(describing: T.self)
        factories[key] = factory
    }

    // 解析服务
    func resolve<T>() -> T? {
        let key = String(describing: T.self)

        // 优先返回单例
        if let service = services[key] as? T {
            return service
        }

        // 使用工厂创建
        if let factory = factories[key] {
            return factory() as? T
        }

        return nil
    }

    // 强制解析
    func resolveRequired<T>() -> T {
        guard let service: T = resolve() else {
            fatalError("Service \(T.self) not registered")
        }
        return service
    }
}

// 属性包装器简化依赖注入
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

// 使用示例
protocol Logger {
    func log(_ message: String)
}

struct ConsoleLogger: Logger {
    func log(_ message: String) {
        print("[LOG] \(message)")
    }
}

// 注册服务
ServiceLocator.shared.register(ConsoleLogger() as Logger)

// 使用依赖注入
class UserService {
    @Inject var logger: Logger

    func createUser(name: String) {
        logger.log("Creating user: \(name)")
    }
}
```

## 面试要点

### 常见面试问题

**Q1: 什么是泛型？为什么要使用泛型？**

泛型是一种参数化类型的编程机制，允许编写适用于多种类型的代码。使用泛型的主要原因：
- 代码复用：一份代码适用于多种类型
- 类型安全：编译时类型检查，避免运行时错误
- 性能优化：编译时特化，无运行时开销
- 抽象能力：编写更通用的算法和数据结构

**Q2: Swift 泛型与 Objective-C 的泛型有什么区别？**

| 特性 | Swift 泛型 | Objective-C 泛型 |
|------|-----------|-----------------|
| 类型安全 | 编译时完全检查 | 仅提供类型提示 |
| 运行时 | 编译时特化 | 类型擦除 |
| 值类型支持 | 完全支持 | 仅限对象类型 |
| 约束能力 | 强大（协议、类、where） | 有限 |

**Q3: 解释 `some` 和 `any` 的区别**

```swift
// some（不透明类型）
// - 返回单一具体类型
// - 类型信息在编译时确定
// - 性能更好（静态派发）
func makeShape() -> some Shape { Circle() }

// any（存在类型）
// - 可以持有任何遵循协议的类型
// - 类型信息在运行时确定
// - 有性能开销（动态派发）
func processShape(_ shape: any Shape) { }
```

**Q4: 什么是关联类型？与泛型参数有什么区别？**

```swift
// 关联类型 - 协议中使用
protocol Container {
    associatedtype Item  // 由遵循类型决定
    func add(_ item: Item)
}

// 泛型参数 - 调用者决定
struct Box<T> {
    var value: T  // 由使用者决定
}
```

主要区别：
- 关联类型由遵循协议的类型决定
- 泛型参数由调用者/使用者决定
- 关联类型更适合定义协议的类型要求
- 泛型参数更适合创建可复用的类型

**Q5: 如何处理带关联类型的协议？**

```swift
protocol DataSource {
    associatedtype Item
    func fetch() -> [Item]
}

// 方法1：使用泛型约束
func processDataSource<T: DataSource>(_ source: T) -> [T.Item] {
    return source.fetch()
}

// 方法2：使用存在类型 (Swift 5.7+)
func processAnyDataSource(_ source: any DataSource) {
    let items = source.fetch()
}

// 方法3：使用主关联类型
protocol DataSource2<Item> {
    associatedtype Item
    func fetch() -> [Item]
}

func processDataSource2(_ source: any DataSource2<String>) -> [String] {
    return source.fetch()
}

// 方法4：类型擦除
struct AnyDataSource<T>: DataSource {
    private let _fetch: () -> [T]

    init<D: DataSource>(_ dataSource: D) where D.Item == T {
        _fetch = { dataSource.fetch() }
    }

    func fetch() -> [T] { _fetch() }
}
```

**Q6: 解释 PECS 原则在 Swift 中的体现**

PECS（Producer Extends, Consumer Super）在 Swift 中通过 `in` 和 `out` 实现（虽然 Swift 主要使用协议约束而非显式型变声明）：

```swift
// 生产者 - 协变（读取）
protocol Producer {
    associatedtype Output
    func produce() -> Output
}

// 消费者 - 逆变（写入）
protocol Consumer {
    associatedtype Input
    func consume(_ input: Input)
}

// 在函数签名中
// 参数位置是逆变的
// 返回类型是协变的
func process<T>(_ consumer: (T) -> Void, producer: () -> T) { }
```

### 进阶考察点

1. **类型擦除的实现原理**
2. **泛型特化与性能优化**
3. **递归泛型约束**
4. **泛型与协议的结合使用**
5. **where 子句的复杂应用**
6. **主关联类型的使用场景**

## 延伸阅读

### 官方文档

- [The Swift Programming Language - Generics](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/generics/)
- [Swift Standard Library - Generic Types](https://developer.apple.com/documentation/swift/swift-standard-library)
- [Swift Evolution - SE-0244: Opaque Result Types](https://github.com/apple/swift-evolution/blob/main/proposals/0244-opaque-result-types.md)
- [Swift Evolution - SE-0346: Lightweight same-type requirements](https://github.com/apple/swift-evolution/blob/main/proposals/0346-light-weight-same-type-syntax.md)

### 经典书籍

- *Advanced Swift* by objc.io - 深入讲解泛型和协议
- *Swift in Depth* by Tjeerd in 't Veen - 泛型实战案例
- *Pro Swift* by Paul Hudson - 泛型进阶技巧

### 优质文章

- [Understanding Swift Generics](https://www.swiftbysundell.com/articles/understanding-swift-generics/)
- [Swift Generics: An In-Depth Guide](https://www.avanderlee.com/swift/generics-in-swift/)
- [Type Erasure in Swift](https://www.donnywals.com/understanding-type-erasure-in-swift/)
- [Associated Types and Self Requirements](https://khawerkhaliq.com/blog/swift-associated-types-self-requirements/)

### 相关工具

- [Swift Playground](https://developer.apple.com/swift-playgrounds/) - 交互式实验泛型
- [SwiftLint](https://github.com/realm/SwiftLint) - 代码风格检查
- [Swift Type Checker](https://swift.org/blog/new-diagnostic-arch-overview/) - 理解类型推断

---

掌握 Swift 泛型是成为高级 Swift 开发者的必经之路。泛型不仅能让代码更加灵活和可复用，还能保持完整的类型安全。建议从简单的泛型函数开始练习，逐步过渡到泛型类型、类型约束、关联类型等高级特性。在实际项目中，应该在灵活性和可读性之间找到平衡，避免过度泛型化导致代码难以理解。
