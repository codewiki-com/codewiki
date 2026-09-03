---
title: Swift 结构体与类深入解析
description: 全面理解 Swift 中结构体与类的区别、值类型与引用类型、成员初始化器、mutating 方法及选择策略
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
origin: old/src/content/docs/swift/structs-classes.zh.md
divergence: 0.195
issues: []
legacy:
  category: Swift
  subcategory: 面向对象
  order: 5
  lastUpdated: 2026-01-07
---

在 Swift 中,结构体(Struct)和类(Class)是构建程序的核心基础。它们都可以定义属性、方法、下标、初始化器,并通过扩展和协议来增强功能。然而,它们之间存在本质区别:结构体是值类型,类是引用类型。理解这一区别对于写出高质量的 Swift 代码至关重要。

## 概念解释

### 什么是结构体

结构体是 Swift 中的值类型,用于封装相关的数据和功能。当你把结构体赋值给新变量或传递给函数时,会创建一个完整的副本。

```swift
struct Point {
    var x: Double
    var y: Double
}

var pointA = Point(x: 10.0, y: 20.0)
var pointB = pointA  // 创建了一个完整副本

pointB.x = 50.0

print(pointA.x)  // 10.0 - 原始值不受影响
print(pointB.x)  // 50.0
```

### 什么是类

类是 Swift 中的引用类型。当你把类实例赋值给新变量时,实际上是创建了一个指向同一内存位置的新引用,而不是副本。

```swift
class Person {
    var name: String
    var age: Int

    init(name: String, age: Int) {
        self.name = name
        self.age = age
    }
}

var personA = Person(name: "张三", age: 25)
var personB = personA  // personB 指向同一个对象

personB.name = "李四"

print(personA.name)  // "李四" - 原始对象被修改了!
print(personB.name)  // "李四"
```

### 历史背景

Swift 的设计哲学强调安全性和不可变性。与 Objective-C 不同,Swift 将结构体提升到与类同等重要的地位,甚至在 Apple 的官方指南中推荐优先使用结构体。这一设计受到函数式编程思想的影响,旨在减少共享可变状态带来的问题。

Swift 标准库中的大多数基本类型(如 `Int`、`String`、`Array`、`Dictionary`)实际上都是结构体,这与许多其他语言形成鲜明对比。

## 核心原理

### 值类型 vs 引用类型

#### 值类型的内存模型

值类型的数据直接存储在变量所在的内存位置。对于结构体,每个变量都有自己独立的数据副本。

```swift
struct Size {
    var width: Double
    var height: Double
}

// 内存中的表示(概念化):
// sizeA: [width: 100.0 | height: 200.0]  <- 独立的内存块
var sizeA = Size(width: 100.0, height: 200.0)

// sizeB: [width: 100.0 | height: 200.0]  <- 另一个独立的内存块
var sizeB = sizeA
```

#### 引用类型的内存模型

引用类型的变量存储的是指向堆内存中实际对象的指针(引用)。

```swift
class Rectangle {
    var width: Double
    var height: Double

    init(width: Double, height: Double) {
        self.width = width
        self.height = height
    }
}

// 内存中的表示(概念化):
// 堆内存: 0x1234 -> [width: 100.0 | height: 200.0]
// rectA: [0x1234]  <- 存储的是地址
var rectA = Rectangle(width: 100.0, height: 200.0)

// rectB: [0x1234]  <- 存储的是同一个地址
var rectB = rectA
```

#### 写时复制(Copy-on-Write)

Swift 对某些值类型(如 `Array`、`Dictionary`、`String`)实现了写时复制优化。这意味着复制只在修改时才真正发生,从而提高性能。

```swift
var array1 = [1, 2, 3, 4, 5]
var array2 = array1  // 此时并未真正复制,两者共享存储

print(array1)  // [1, 2, 3, 4, 5]
print(array2)  // [1, 2, 3, 4, 5]

// 只有当修改其中一个时,才会触发真正的复制
array2.append(6)  // 现在 array2 有了自己的存储

print(array1)  // [1, 2, 3, 4, 5] - 不受影响
print(array2)  // [1, 2, 3, 4, 5, 6]
```

### 栈与堆分配

- **栈(Stack)**: 结构体通常分配在栈上,分配和释放速度极快
- **堆(Heap)**: 类实例分配在堆上,需要引用计数管理,相对较慢

```swift
// 栈分配 - 快速
struct StackPoint {
    var x: Int
    var y: Int
}

// 堆分配 - 相对较慢,需要 ARC 管理
class HeapPoint {
    var x: Int
    var y: Int

    init(x: Int, y: Int) {
        self.x = x
        self.y = y
    }
}
```

### 恒等性与相等性

类实例具有恒等性(Identity),可以使用 `===` 和 `!==` 操作符判断两个变量是否指向同一个实例。

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

print(car1 === car2)  // true - 同一个实例
print(car1 === car3)  // false - 不同实例,即使内容相同

// 结构体没有恒等性概念,只有相等性
struct Coordinate: Equatable {
    var lat: Double
    var lon: Double
}

let coord1 = Coordinate(lat: 40.0, lon: 116.0)
let coord2 = Coordinate(lat: 40.0, lon: 116.0)
print(coord1 == coord2)  // true - 值相等
// coord1 === coord2  // 编译错误! 结构体不支持 ===
```

## 核心要点

### 成员初始化器(Memberwise Initializer)

结构体自动获得一个成员初始化器,这是它们与类的重要区别之一。

```swift
struct User {
    var username: String
    var email: String
    var age: Int
}

// 自动生成的成员初始化器
let user = User(username: "swift_lover", email: "swift@example.com", age: 28)

// 带默认值时,成员初始化器更灵活
struct Configuration {
    var theme: String = "light"
    var fontSize: Int = 14
    var notifications: Bool = true
}

// 可以只提供部分参数
let config1 = Configuration()  // 全部使用默认值
let config2 = Configuration(theme: "dark")  // 只修改 theme
let config3 = Configuration(theme: "dark", fontSize: 16, notifications: false)
```

类没有自动的成员初始化器,必须手动定义:

```swift
class Account {
    var balance: Double
    var owner: String

    // 必须手动定义初始化器
    init(balance: Double, owner: String) {
        self.balance = balance
        self.owner = owner
    }
}
```

### mutating 方法

结构体是值类型,默认情况下其方法不能修改自身属性。如果需要在方法中修改属性,必须使用 `mutating` 关键字。

```swift
struct Counter {
    var count: Int = 0

    // 普通方法不能修改属性
    func getCurrentCount() -> Int {
        return count
    }

    // mutating 方法可以修改属性
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

// 注意: let 声明的结构体不能调用 mutating 方法
let immutableCounter = Counter()
// immutableCounter.increment()  // 编译错误!
```

mutating 方法甚至可以完全替换 self:

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

### 继承

类支持继承,结构体不支持。这是选择使用类还是结构体的重要考虑因素。

```swift
// 基类
class Animal {
    var name: String

    init(name: String) {
        self.name = name
    }

    func makeSound() {
        print("Some sound")
    }
}

// 子类
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

let dog = Dog(name: "旺财", breed: "金毛")
let cat = Cat(name: "咪咪")

dog.makeSound()  // "旺财 says: Woof!"
cat.makeSound()  // "咪咪 says: Meow!"

// 结构体不能继承
// struct SpecialPoint: Point { }  // 编译错误!
```

但结构体可以通过协议实现类似的多态:

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

### 析构器(Deinitializer)

只有类可以定义析构器(`deinit`),用于在实例被释放时执行清理工作。

```swift
class FileHandler {
    var filename: String

    init(filename: String) {
        self.filename = filename
        print("打开文件: \(filename)")
    }

    deinit {
        print("关闭文件: \(filename)")
        // 清理资源
    }
}

func processFile() {
    let handler = FileHandler(filename: "data.txt")
    // 使用 handler...
}  // handler 离开作用域,deinit 被调用

processFile()
// 输出:
// 打开文件: data.txt
// 关闭文件: data.txt
```

## 代码示例

### 完整的结构体示例

```swift
struct BankAccount {
    // 存储属性
    let accountNumber: String
    var balance: Double
    private(set) var transactionHistory: [String]

    // 计算属性
    var formattedBalance: String {
        return String(format: "¥%.2f", balance)
    }

    var isOverdrawn: Bool {
        return balance < 0
    }

    // 初始化器
    init(accountNumber: String, initialDeposit: Double = 0) {
        self.accountNumber = accountNumber
        self.balance = initialDeposit
        self.transactionHistory = []

        if initialDeposit > 0 {
            transactionHistory.append("初始存款: ¥\(initialDeposit)")
        }
    }

    // mutating 方法
    mutating func deposit(_ amount: Double) {
        guard amount > 0 else {
            print("存款金额必须大于 0")
            return
        }

        balance += amount
        transactionHistory.append("存款: +¥\(amount)")
    }

    mutating func withdraw(_ amount: Double) -> Bool {
        guard amount > 0 else {
            print("取款金额必须大于 0")
            return false
        }

        guard balance >= amount else {
            print("余额不足")
            return false
        }

        balance -= amount
        transactionHistory.append("取款: -¥\(amount)")
        return true
    }

    // 普通方法
    func printStatement() {
        print("账户: \(accountNumber)")
        print("余额: \(formattedBalance)")
        print("交易记录:")
        for transaction in transactionHistory {
            print("  - \(transaction)")
        }
    }
}

// 使用示例
var myAccount = BankAccount(accountNumber: "6222021234567890", initialDeposit: 1000)
myAccount.deposit(500)
myAccount.withdraw(200)
myAccount.printStatement()

// 值类型特性演示
var anotherAccount = myAccount
anotherAccount.deposit(100)  // 不影响 myAccount

print("原账户余额: \(myAccount.formattedBalance)")  // ¥1300.00
print("副本余额: \(anotherAccount.formattedBalance)")  // ¥1400.00
```

### 完整的类示例

```swift
class NetworkManager {
    // 单例模式
    static let shared = NetworkManager()

    // 存储属性
    var baseURL: String
    var timeout: TimeInterval
    private var requestCount: Int = 0

    // 计算属性
    var isConfigured: Bool {
        return !baseURL.isEmpty
    }

    // 私有初始化器(单例模式)
    private init() {
        self.baseURL = ""
        self.timeout = 30.0
    }

    // 配置方法
    func configure(baseURL: String, timeout: TimeInterval = 30.0) {
        self.baseURL = baseURL
        self.timeout = timeout
        print("NetworkManager 已配置: \(baseURL)")
    }

    // 模拟网络请求
    func fetchData(endpoint: String, completion: @escaping (Result<String, Error>) -> Void) {
        guard isConfigured else {
            completion(.failure(NetworkError.notConfigured))
            return
        }

        requestCount += 1
        let url = "\(baseURL)/\(endpoint)"

        print("正在请求: \(url)")

        // 模拟异步请求
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            completion(.success("来自 \(endpoint) 的数据"))
        }
    }

    // 状态查询
    func getStats() -> (requestCount: Int, baseURL: String) {
        return (requestCount, baseURL)
    }

    // 析构器
    deinit {
        print("NetworkManager 被释放")
    }
}

enum NetworkError: Error {
    case notConfigured
    case invalidURL
    case requestFailed
}

// 使用示例
NetworkManager.shared.configure(baseURL: "https://api.example.com")
NetworkManager.shared.fetchData(endpoint: "users") { result in
    switch result {
    case .success(let data):
        print("获取成功: \(data)")
    case .failure(let error):
        print("获取失败: \(error)")
    }
}
```

### 嵌套类型示例

```swift
struct Card {
    // 嵌套枚举
    enum Suit: String, CaseIterable {
        case spades = "♠️"
        case hearts = "♥️"
        case diamonds = "♦️"
        case clubs = "♣️"
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

// 创建一副牌
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
    print("抽到的牌: \(card.description)")
}
```

## 最佳实践

### 选择结构体的场景

Apple 官方建议默认使用结构体,在以下情况下优先考虑:

```swift
// 1. 封装少量相关的数据值
struct Coordinate {
    var latitude: Double
    var longitude: Double
}

// 2. 数据被传递时应该是复制而非共享
struct Temperature {
    var celsius: Double

    var fahrenheit: Double {
        return celsius * 9/5 + 32
    }
}

// 3. 属性本身也是值类型
struct Person {
    var name: String      // String 是结构体
    var age: Int          // Int 是结构体
    var address: Address  // Address 也是结构体
}

struct Address {
    var street: String
    var city: String
    var zipCode: String
}

// 4. 不需要继承其他类型的属性或行为
struct Vector3D {
    var x: Double
    var y: Double
    var z: Double

    static func + (lhs: Vector3D, rhs: Vector3D) -> Vector3D {
        return Vector3D(x: lhs.x + rhs.x, y: lhs.y + rhs.y, z: lhs.z + rhs.z)
    }
}
```

### 选择类的场景

在以下情况下使用类更合适:

```swift
// 1. 需要继承
class UIControl: UIView {
    var isEnabled: Bool = true
}

class UIButton: UIControl {
    var title: String?
}

// 2. 需要控制实例的恒等性
class DatabaseConnection {
    let connectionID: String
    var isConnected: Bool = false

    init() {
        self.connectionID = UUID().uuidString
    }

    func connect() {
        isConnected = true
        print("连接已建立: \(connectionID)")
    }
}

// 3. 需要使用析构器清理资源
class TemporaryFile {
    let path: String

    init(path: String) {
        self.path = path
        // 创建临时文件
    }

    deinit {
        // 删除临时文件
        print("清理临时文件: \(path)")
    }
}

// 4. 实例需要被多处共享和修改
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

### 组合使用

实际开发中,结构体和类经常配合使用:

```swift
// 数据模型使用结构体
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

// 业务逻辑使用类
class ArticleRepository {
    private var cache: [Int: Article] = [:]

    func fetch(id: Int, completion: @escaping (Result<Article, Error>) -> Void) {
        if let cached = cache[id] {
            completion(.success(cached))
            return
        }

        // 网络请求...
    }

    func save(_ article: Article) {
        cache[article.id] = article
    }
}

// ViewModel 使用类(需要被 View 引用)
class ArticleViewModel: ObservableObject {
    @Published var articles: [Article] = []
    @Published var isLoading = false

    private let repository: ArticleRepository

    init(repository: ArticleRepository) {
        self.repository = repository
    }

    func loadArticles() {
        isLoading = true
        // 加载文章...
    }
}
```

## 常见陷阱

### 陷阱1: 意外的值复制

```swift
struct Settings {
    var volume: Int = 50
    var brightness: Int = 80
}

class SettingsManager {
    var settings = Settings()
}

let manager = SettingsManager()
var mySettings = manager.settings  // 这是副本!

mySettings.volume = 100

print(manager.settings.volume)  // 50 - 原始值未改变!
print(mySettings.volume)        // 100

// 正确做法: 直接修改
manager.settings.volume = 100
print(manager.settings.volume)  // 100
```

### 陷阱2: 结构体中包含引用类型

```swift
class Engine {
    var horsepower: Int

    init(horsepower: Int) {
        self.horsepower = horsepower
    }
}

struct Car {
    var brand: String
    var engine: Engine  // 引用类型!
}

var car1 = Car(brand: "Tesla", engine: Engine(horsepower: 400))
var car2 = car1  // 浅复制!

car2.brand = "BMW"           // car1.brand 不受影响
car2.engine.horsepower = 500  // car1.engine 也被修改!

print(car1.brand)              // "Tesla"
print(car1.engine.horsepower)  // 500 - 被意外修改!

// 解决方案: 实现深复制
struct SafeCar {
    var brand: String
    var engine: Engine

    // 自定义复制逻辑
    func copy() -> SafeCar {
        return SafeCar(
            brand: brand,
            engine: Engine(horsepower: engine.horsepower)
        )
    }
}
```

### 陷阱3: let 与 mutating

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
// constantStack.push(1)  // 编译错误! let 声明的结构体不能调用 mutating 方法

var mutableStack = Stack<Int>()
mutableStack.push(1)  // OK
```

### 陷阱4: 循环引用(仅适用于类)

```swift
class Person {
    var name: String
    var apartment: Apartment?

    init(name: String) {
        self.name = name
        print("\(name) 被创建")
    }

    deinit {
        print("\(name) 被释放")
    }
}

class Apartment {
    var unit: String
    var tenant: Person?  // 强引用导致循环引用!

    init(unit: String) {
        self.unit = unit
    }

    deinit {
        print("公寓 \(unit) 被释放")
    }
}

var john: Person? = Person(name: "John")
var unit4A: Apartment? = Apartment(unit: "4A")

john?.apartment = unit4A
unit4A?.tenant = john  // 循环引用!

john = nil    // Person 不会被释放
unit4A = nil  // Apartment 也不会被释放
// 内存泄漏!

// 解决方案: 使用 weak 或 unowned
class SafeApartment {
    var unit: String
    weak var tenant: Person?  // 弱引用,不增加引用计数

    init(unit: String) {
        self.unit = unit
    }
}
```

### 陷阱5: 闭包捕获 self

```swift
class DataLoader {
    var data: [String] = []

    func loadData() {
        // 问题: 闭包强引用 self
        fetchFromNetwork { result in
            self.data = result  // 可能造成循环引用
        }
    }

    // 解决方案
    func loadDataSafe() {
        fetchFromNetwork { [weak self] result in
            guard let self = self else { return }
            self.data = result
        }
    }

    private func fetchFromNetwork(completion: @escaping ([String]) -> Void) {
        // 模拟网络请求
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            completion(["Data1", "Data2"])
        }
    }
}
```

## 性能考量

### 栈分配 vs 堆分配

```swift
import Foundation

// 性能测试
func measurePerformance() {
    let iterations = 1_000_000

    // 结构体性能测试
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

    // 类性能测试
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

    print("结构体耗时: \(structTime) 秒")
    print("类耗时: \(classTime) 秒")
}
```

### 何时结构体更快

1. **小型数据**: 结构体直接在栈上分配,无需堆分配开销
2. **频繁创建销毁**: 栈分配和释放几乎没有开销
3. **无需引用计数**: 结构体不需要 ARC 管理

### 何时类更快

1. **大型数据**: 传递引用比复制整个数据更高效
2. **需要共享**: 多处需要访问同一份数据时,类更高效
3. **频繁修改**: 避免写时复制的开销

```swift
// 大型结构体可能带来性能问题
struct LargeStruct {
    var data1: [Int] = Array(repeating: 0, count: 10000)
    var data2: [Int] = Array(repeating: 0, count: 10000)
    var data3: [Int] = Array(repeating: 0, count: 10000)
}

// 传递大型结构体会触发复制(写时复制可能延迟)
func process(_ data: LargeStruct) {
    // 如果修改 data,会触发完整复制
}

// 对于大型数据,考虑使用类或传递 inout
func processInout(_ data: inout LargeStruct) {
    // 直接修改,无需复制
}
```

### 实现自定义写时复制

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

    // 确保唯一性
    private mutating func ensureUnique() {
        if !isKnownUniquelyReferenced(&storage) {
            storage = Ref(storage.value)
            print("触发复制")
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
var array2 = array1  // 共享存储

print(array1.count)  // 3
print(array2.count)  // 3

array2.append(4)  // 输出: 触发复制
print(array1.count)  // 3
print(array2.count)  // 4
```

## 实战场景

### 场景1: 数据模型层

```swift
// API 响应模型使用结构体
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

// 解析 JSON
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
        print("用户: \(user.username)")
    }
} catch {
    print("解析错误: \(error)")
}
```

### 场景2: SwiftUI 状态管理

```swift
import SwiftUI

// 模型使用结构体
struct TodoItem: Identifiable, Equatable {
    let id: UUID
    var title: String
    var isCompleted: Bool
    var priority: Priority

    enum Priority: String, CaseIterable {
        case low = "低"
        case medium = "中"
        case high = "高"
    }
}

// ViewModel 使用类
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
            .navigationTitle("待办事项")
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

### 场景3: 游戏开发中的实体

```swift
// 游戏中的组件使用结构体
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

// 游戏实体使用类(需要引用恒等性)
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

## 面试要点

### 常见面试问题

**Q1: Swift 中结构体和类的主要区别是什么?**

```swift
/*
核心区别:
1. 值类型 vs 引用类型
   - 结构体: 值类型,赋值时复制
   - 类: 引用类型,赋值时共享

2. 继承
   - 结构体: 不支持继承
   - 类: 支持继承

3. 初始化器
   - 结构体: 自动获得成员初始化器
   - 类: 必须手动定义初始化器

4. 析构器
   - 结构体: 没有析构器
   - 类: 可以定义 deinit

5. 引用计数
   - 结构体: 无需 ARC 管理
   - 类: 需要 ARC 管理内存

6. 恒等性
   - 结构体: 不支持 === 操作符
   - 类: 支持 === 判断是否为同一实例
*/
```

**Q2: 什么是 mutating 关键字? 为什么需要它?**

```swift
/*
mutating 用于标记结构体方法可以修改其属性。

原因:
- 结构体是值类型,默认不可变
- 方法调用时 self 是常量
- mutating 告诉编译器这个方法会修改 self

实际上,mutating 方法会隐式地将 self 替换为新值。
*/

struct Point {
    var x: Int
    var y: Int

    // 这个方法实际上等同于:
    // func move(by delta: Point) -> Point
    mutating func move(by delta: Point) {
        x += delta.x
        y += delta.y
        // 等同于: self = Point(x: x + delta.x, y: y + delta.y)
    }
}
```

**Q3: 如何在结构体中实现类似继承的功能?**

```swift
// 使用协议和扩展
protocol Identifiable {
    var id: String { get }
}

protocol Displayable {
    var displayName: String { get }
}

// 协议扩展提供默认实现
extension Displayable {
    var displayName: String {
        return "未命名"
    }
}

// 协议组合
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

**Q4: 什么时候应该使用类而不是结构体?**

```swift
/*
使用类的场景:
1. 需要继承: 当你需要创建类层次结构时
2. 需要恒等性: 需要判断两个变量是否指向同一实例
3. 需要析构器: 需要在实例销毁时执行清理工作
4. 需要共享状态: 多处需要修改同一份数据
5. Objective-C 互操作: 需要与 OC 代码交互
6. 引用语义更合适: 如 UIViewController、单例等
*/

// 示例: 单例必须用类
class AppConfiguration {
    static let shared = AppConfiguration()
    private init() {}

    var apiKey: String = ""
}

// 示例: 需要继承
class Animal {
    func speak() { }
}

class Dog: Animal {
    override func speak() {
        print("Woof!")
    }
}
```

**Q5: 写时复制是如何工作的?**

```swift
/*
写时复制(Copy-on-Write, COW)是一种优化技术:
1. 复制时只增加引用计数,不真正复制数据
2. 当修改时检查引用计数
3. 如果引用计数 > 1,则创建真正的副本
4. 如果引用计数 = 1,则直接修改

Swift 的 Array、Dictionary、String 等都实现了 COW。
*/

var array1 = [1, 2, 3]
var array2 = array1  // 共享存储,引用计数增加

// 此时 array1 和 array2 指向同一块内存
// 没有发生真正的复制

array2.append(4)  // 修改触发复制
// 现在 array1 和 array2 有各自的存储

// 可以使用 isKnownUniquelyReferenced 检查
```

### 代码考察题

**题目1: 预测输出**

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
答案:
p1.x = 0 (结构体是值类型,p2 是 p1 的副本)
p2.x = 10
c1.center.x = 20 (类是引用类型,c2 和 c1 指向同一对象)
c1.radius = 20
*/
```

**题目2: 修复内存泄漏**

```swift
class Node {
    var value: Int
    var next: Node?  // 可能造成循环引用
    var previous: Node?  // 可能造成循环引用

    init(value: Int) {
        self.value = value
    }
}

// 修复版本
class SafeNode {
    var value: Int
    var next: SafeNode?
    weak var previous: SafeNode?  // 使用 weak 打破循环

    init(value: Int) {
        self.value = value
    }
}
```

## 延伸阅读

### 官方文档

- [Swift Language Guide - Structures and Classes](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/classesandstructures/)
- [Swift Language Guide - Properties](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/properties/)
- [WWDC 2015 - Building Better Apps with Value Types in Swift](https://developer.apple.com/videos/play/wwdc2015/414/)
- [WWDC 2016 - Understanding Swift Performance](https://developer.apple.com/videos/play/wwdc2016/416/)

### 经典书籍

- 《Swift Programming: The Big Nerd Ranch Guide》- 第 14-15 章
- 《Advanced Swift》by objc.io - 第 1 章结构体与类
- 《Pro Swift》by Paul Hudson - 值类型与引用类型章节

### 深入主题

- [Automatic Reference Counting (ARC)](/swift/arc) - 理解类的内存管理
- [Swift 闭包详解](/swift/closures) - 闭包与值捕获
- [Swift 并发编程](/swift/concurrency) - Actor 与值类型的安全性
- [Swift 协议与泛型](/swift/protocols-generics) - 结构体的多态实现

### 社区资源

- [Swift by Sundell - Value and Reference Types](https://www.swiftbysundell.com/articles/value-and-reference-types-in-swift/)
- [Ray Wenderlich - Reference vs Value Types in Swift](https://www.kodeco.com/9481-reference-vs-value-types-in-swift)
- [objc.io - Value Types](https://www.objc.io/issues/16-swift/swift-classes-vs-structs/)

## 总结

结构体和类是 Swift 编程的两大支柱,理解它们的区别对于写出高质量代码至关重要:

1. **值类型优先**: Swift 推荐默认使用结构体,因为它们更安全、更可预测
2. **引用类型场景**: 需要继承、恒等性、析构器或共享状态时使用类
3. **mutating 的本质**: 结构体方法修改属性需要 mutating,因为值类型默认不可变
4. **性能权衡**: 小型数据用结构体更快,大型共享数据用类更高效
5. **写时复制**: Swift 对标准库集合类型实现了 COW 优化

掌握这些概念后,你将能够在项目中做出正确的类型选择,写出既安全又高效的 Swift 代码。
