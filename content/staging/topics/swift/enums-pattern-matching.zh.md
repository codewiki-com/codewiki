---
title: 枚举与模式匹配
description: Swift枚举与模式匹配完全指南，关联值、原始值与switch
track: swift
section: basics
difficulty: intermediate
tags:
  - Swift
  - 枚举
  - 模式匹配
  - switch
status: imported
origin: old/src/content/docs/swift/enums-pattern-matching.zh.md
divergence: 0.187
issues: []
legacy:
  category: Swift
  subcategory: 语言特性
  order: 7
  lastUpdated: 2026-01-07
---

Swift 的枚举（Enum）是一种强大的类型安全特性，远比其他语言中的枚举功能丰富。结合模式匹配（Pattern Matching），枚举成为了 Swift 中处理状态、构建类型安全 API 的核心工具。

## 枚举基础

### 定义简单枚举

最基本的枚举定义方式：

```swift
enum Direction {
    case north
    case south
    case east
    case west
}

// 也可以写在一行
enum Direction {
    case north, south, east, west
}
```

使用枚举值：

```swift
var heading = Direction.north

// 类型已知时可以省略枚举名
heading = .south

// 比较枚举值
if heading == .south {
    print("正在向南移动")
}
```

### 枚举与函数

枚举可以作为函数参数和返回值：

```swift
func opposite(of direction: Direction) -> Direction {
    switch direction {
    case .north: return .south
    case .south: return .north
    case .east: return .west
    case .west: return .east
    }
}

let current = Direction.north
let reversed = opposite(of: current)  // .south
```

## 原始值（Raw Values）

枚举可以关联原始值，原始值在定义时确定，同一枚举的所有实例共享相同的原始值类型。

### 整数原始值

```swift
enum HTTPStatus: Int {
    case ok = 200
    case created = 201
    case accepted = 202
    case badRequest = 400
    case unauthorized = 401
    case forbidden = 403
    case notFound = 404
    case internalServerError = 500
}

let status = HTTPStatus.notFound
print(status.rawValue)  // 404

// 从原始值创建枚举（返回可选值）
if let status = HTTPStatus(rawValue: 200) {
    print("状态: \(status)")  // 状态: ok
}
```

### 隐式原始值

整数类型会自动递增：

```swift
enum Planet: Int {
    case mercury = 1  // 1
    case venus        // 2
    case earth        // 3
    case mars         // 4
    case jupiter      // 5
    case saturn       // 6
    case uranus       // 7
    case neptune      // 8
}

print(Planet.earth.rawValue)  // 3
```

字符串类型默认使用 case 名称：

```swift
enum CompassPoint: String {
    case north      // "north"
    case south      // "south"
    case east       // "east"
    case west       // "west"
}

print(CompassPoint.north.rawValue)  // "north"

// 也可以自定义
enum APIEndpoint: String {
    case users = "/api/v1/users"
    case posts = "/api/v1/posts"
    case comments = "/api/v1/comments"
}
```

### 字符原始值

```swift
enum ASCIIControlCharacter: Character {
    case tab = "\t"
    case lineFeed = "\n"
    case carriageReturn = "\r"
}
```

## 关联值（Associated Values）

关联值是 Swift 枚举最强大的特性之一，每个 case 可以存储不同类型和数量的值。

### 基本关联值

```swift
enum Barcode {
    case upc(Int, Int, Int, Int)
    case qrCode(String)
}

var productBarcode = Barcode.upc(8, 85909, 51226, 3)
productBarcode = .qrCode("ABCDEFGHIJ")
```

### 命名关联值

为关联值添加标签提高可读性：

```swift
enum NetworkError {
    case timeout(seconds: Int)
    case serverError(code: Int, message: String)
    case noConnection
    case invalidURL(url: String)
}

let error = NetworkError.serverError(code: 500, message: "Internal Server Error")
```

### 实际应用：Result 类型

Swift 标准库的 `Result` 类型就是枚举的典型应用：

```swift
enum Result<Success, Failure: Error> {
    case success(Success)
    case failure(Failure)
}

// 自定义错误类型
enum FileError: Error {
    case notFound(filename: String)
    case permissionDenied
    case corrupted
}

// 返回 Result 的函数
func readFile(named filename: String) -> Result<String, FileError> {
    guard filename != "" else {
        return .failure(.notFound(filename: filename))
    }

    // 模拟读取文件
    return .success("文件内容...")
}

let result = readFile(named: "data.txt")
```

### 复杂关联值示例

```swift
enum Media {
    case book(title: String, author: String, pages: Int)
    case movie(title: String, director: String, duration: Int)
    case music(title: String, artist: String, album: String, duration: Int)
    case podcast(title: String, host: String, episode: Int)
}

let favorites: [Media] = [
    .book(title: "Swift编程", author: "Apple", pages: 500),
    .movie(title: "星际穿越", director: "诺兰", duration: 169),
    .music(title: "Yesterday", artist: "Beatles", album: "Help!", duration: 125)
]
```

## 模式匹配与 switch

### 基本 switch 语句

Swift 的 `switch` 语句必须穷尽所有可能的情况：

```swift
enum Season {
    case spring, summer, autumn, winter
}

func describe(season: Season) -> String {
    switch season {
    case .spring:
        return "万物复苏的春天"
    case .summer:
        return "炎热的夏天"
    case .autumn:
        return "丰收的秋天"
    case .winter:
        return "寒冷的冬天"
    }
}
```

### 穷尽性检查（Exhaustiveness）

编译器会确保所有情况都被处理：

```swift
enum TrafficLight {
    case red, yellow, green
}

func action(for light: TrafficLight) -> String {
    switch light {
    case .red:
        return "停止"
    case .yellow:
        return "准备"
    case .green:
        return "通行"
    // 不需要 default，因为已经穷尽所有情况
    }
}
```

使用 `default` 处理未明确列出的情况：

```swift
enum Weekday {
    case monday, tuesday, wednesday, thursday, friday, saturday, sunday
}

func isWeekend(_ day: Weekday) -> Bool {
    switch day {
    case .saturday, .sunday:
        return true
    default:
        return false
    }
}
```

### 提取关联值

使用 `let` 或 `var` 提取关联值：

```swift
enum Message {
    case text(content: String)
    case image(url: String, width: Int, height: Int)
    case voice(url: String, duration: Int)
    case location(latitude: Double, longitude: Double)
}

func handleMessage(_ message: Message) {
    switch message {
    case .text(let content):
        print("文本消息: \(content)")

    case .image(let url, let width, let height):
        print("图片: \(url), 尺寸: \(width)x\(height)")

    case .voice(let url, let duration):
        print("语音: \(url), 时长: \(duration)秒")

    case .location(let lat, let lng):
        print("位置: (\(lat), \(lng))")
    }
}

// 简写形式：将 let 提到前面
func handleMessageSimplified(_ message: Message) {
    switch message {
    case let .text(content):
        print("文本: \(content)")

    case let .image(url, width, height):
        print("图片: \(url), \(width)x\(height)")

    case let .voice(url, duration):
        print("语音: \(url), \(duration)秒")

    case let .location(lat, lng):
        print("位置: (\(lat), \(lng))")
    }
}
```

### 部分匹配

只提取需要的值，使用 `_` 忽略其他：

```swift
func getImageURL(_ message: Message) -> String? {
    switch message {
    case .image(let url, _, _):
        return url
    default:
        return nil
    }
}
```

## where 子句

`where` 子句允许添加额外的匹配条件：

```swift
enum Temperature {
    case celsius(Double)
    case fahrenheit(Double)
}

func describe(_ temp: Temperature) -> String {
    switch temp {
    case .celsius(let value) where value < 0:
        return "零下 \(-value) 摄氏度，非常寒冷"
    case .celsius(let value) where value < 15:
        return "\(value) 摄氏度，比较凉爽"
    case .celsius(let value) where value < 30:
        return "\(value) 摄氏度，温度适宜"
    case .celsius(let value):
        return "\(value) 摄氏度，比较炎热"
    case .fahrenheit(let value) where value < 32:
        return "零下，冰点以下"
    case .fahrenheit(let value):
        return "\(value) 华氏度"
    }
}
```

### 复杂条件匹配

```swift
enum Order {
    case placed(items: Int, total: Double)
    case shipped(trackingNumber: String)
    case delivered(date: String)
    case cancelled(reason: String)
}

func processOrder(_ order: Order) -> String {
    switch order {
    case .placed(let items, let total) where total > 1000:
        return "大额订单：\(items) 件商品，总价 \(total)，享受VIP配送"

    case .placed(let items, _) where items > 10:
        return "批量订单：\(items) 件商品"

    case .placed(let items, let total):
        return "普通订单：\(items) 件商品，总价 \(total)"

    case .shipped(let tracking) where tracking.hasPrefix("SF"):
        return "顺丰快递，单号：\(tracking)"

    case .shipped(let tracking):
        return "已发货，追踪号：\(tracking)"

    case .delivered(let date):
        return "已于 \(date) 送达"

    case .cancelled(let reason) where reason.isEmpty:
        return "订单已取消"

    case .cancelled(let reason):
        return "订单已取消，原因：\(reason)"
    }
}
```

## if case 语法

当只关心某个特定 case 时，`if case` 比 `switch` 更简洁：

```swift
enum Response {
    case success(data: Data)
    case failure(error: Error)
    case loading
}

let response = Response.success(data: Data())

// 使用 if case
if case .success(let data) = response {
    print("成功获取数据，大小：\(data.count) 字节")
}

// 等价的 switch 写法
switch response {
case .success(let data):
    print("成功获取数据，大小：\(data.count) 字节")
default:
    break
}
```

### if case 与 where

```swift
enum Download {
    case inProgress(percent: Double)
    case completed(file: String)
    case failed(error: String)
}

let download = Download.inProgress(percent: 75)

if case .inProgress(let percent) = download, percent > 50 {
    print("下载已过半：\(percent)%")
}

// 多条件组合
if case .inProgress(let percent) = download,
   percent > 0,
   percent < 100 {
    print("正在下载中...")
}
```

### 在循环中使用 if case

```swift
let responses: [Response] = [
    .success(data: Data()),
    .failure(error: NSError(domain: "", code: 1)),
    .success(data: Data()),
    .loading
]

// 只处理成功的响应
for case .success(let data) in responses {
    print("处理数据：\(data.count) 字节")
}

// 只计算失败的数量
let failureCount = responses.filter {
    if case .failure = $0 { return true }
    return false
}.count
```

## guard case 语法

`guard case` 用于提前退出，非常适合处理错误情况：

```swift
enum AuthResult {
    case authenticated(userId: String, token: String)
    case requiresTwoFactor(userId: String)
    case failed(reason: String)
}

func handleAuth(_ result: AuthResult) {
    guard case .authenticated(let userId, let token) = result else {
        print("认证失败，无法继续")
        return
    }

    // 认证成功，继续处理
    print("用户 \(userId) 已登录")
    print("Token: \(token)")
}
```

### 结合 where 使用

```swift
enum PaymentResult {
    case success(amount: Double, transactionId: String)
    case pending(amount: Double)
    case failed(reason: String)
}

func processPayment(_ result: PaymentResult) {
    guard case .success(let amount, let transactionId) = result,
          amount > 0 else {
        print("支付失败或金额无效")
        return
    }

    print("支付成功！金额：\(amount)，交易号：\(transactionId)")
}
```

## 枚举的高级特性

### 递归枚举

使用 `indirect` 关键字创建递归枚举：

```swift
indirect enum ArithmeticExpression {
    case number(Int)
    case addition(ArithmeticExpression, ArithmeticExpression)
    case multiplication(ArithmeticExpression, ArithmeticExpression)
}

// 表示 (5 + 4) * 2
let five = ArithmeticExpression.number(5)
let four = ArithmeticExpression.number(4)
let sum = ArithmeticExpression.addition(five, four)
let product = ArithmeticExpression.multiplication(sum, .number(2))

// 递归求值
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

print(evaluate(product))  // 18
```

### 枚举的方法和属性

枚举可以拥有计算属性和方法：

```swift
enum Suit: String, CaseIterable {
    case spades = "♠️"
    case hearts = "♥️"
    case diamonds = "♦️"
    case clubs = "♣️"

    var color: String {
        switch self {
        case .spades, .clubs:
            return "黑色"
        case .hearts, .diamonds:
            return "红色"
        }
    }

    var name: String {
        switch self {
        case .spades: return "黑桃"
        case .hearts: return "红心"
        case .diamonds: return "方块"
        case .clubs: return "梅花"
        }
    }

    func description() -> String {
        return "\(name) \(rawValue)"
    }
}

let suit = Suit.hearts
print(suit.color)        // 红色
print(suit.description())  // 红心 ♥️
```

### CaseIterable 协议

遵循 `CaseIterable` 可以遍历所有 case：

```swift
enum Beverage: CaseIterable {
    case coffee, tea, juice, water
}

print("共有 \(Beverage.allCases.count) 种饮料")

for beverage in Beverage.allCases {
    print(beverage)
}
```

### 带关联值的枚举实现 Equatable

```swift
enum NetworkState: Equatable {
    case idle
    case loading(progress: Double)
    case success(data: String)
    case failure(message: String)
}

let state1 = NetworkState.loading(progress: 0.5)
let state2 = NetworkState.loading(progress: 0.5)
let state3 = NetworkState.loading(progress: 0.8)

print(state1 == state2)  // true
print(state1 == state3)  // false
```

## 实际应用案例

### 状态机

```swift
enum PlayerState {
    case idle
    case playing(track: String, position: TimeInterval)
    case paused(track: String, position: TimeInterval)
    case buffering(track: String, progress: Double)
    case error(message: String)
}

class MusicPlayer {
    private(set) var state: PlayerState = .idle

    func play(track: String) {
        switch state {
        case .idle, .error:
            state = .buffering(track: track, progress: 0)
        case .paused(let currentTrack, let position) where currentTrack == track:
            state = .playing(track: currentTrack, position: position)
        case .paused, .playing, .buffering:
            state = .buffering(track: track, progress: 0)
        }
    }

    func pause() {
        guard case .playing(let track, let position) = state else {
            return
        }
        state = .paused(track: track, position: position)
    }

    var statusDescription: String {
        switch state {
        case .idle:
            return "等待播放"
        case .playing(let track, let position):
            return "正在播放: \(track) [\(Int(position))秒]"
        case .paused(let track, let position):
            return "已暂停: \(track) [\(Int(position))秒]"
        case .buffering(let track, let progress):
            return "缓冲中: \(track) [\(Int(progress * 100))%]"
        case .error(let message):
            return "错误: \(message)"
        }
    }
}
```

### JSON 解析

```swift
enum JSON {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSON])
    case object([String: JSON])
}

extension JSON {
    var stringValue: String? {
        guard case .string(let value) = self else { return nil }
        return value
    }

    var intValue: Int? {
        guard case .number(let value) = self else { return nil }
        return Int(value)
    }

    var arrayValue: [JSON]? {
        guard case .array(let value) = self else { return nil }
        return value
    }

    subscript(key: String) -> JSON? {
        guard case .object(let dict) = self else { return nil }
        return dict[key]
    }

    subscript(index: Int) -> JSON? {
        guard case .array(let arr) = self, index < arr.count else { return nil }
        return arr[index]
    }
}

// 使用示例
let json: JSON = .object([
    "name": .string("张三"),
    "age": .number(25),
    "hobbies": .array([.string("编程"), .string("音乐")])
])

if let name = json["name"]?.stringValue {
    print("姓名: \(name)")
}

if let firstHobby = json["hobbies"]?[0]?.stringValue {
    print("第一个爱好: \(firstHobby)")
}
```

### 路由系统

```swift
enum Route: Equatable {
    case home
    case profile(userId: String)
    case settings
    case article(id: Int, section: String?)
    case search(query: String, filters: [String])
}

struct Router {
    static func path(for route: Route) -> String {
        switch route {
        case .home:
            return "/"
        case .profile(let userId):
            return "/user/\(userId)"
        case .settings:
            return "/settings"
        case .article(let id, let section):
            if let section = section {
                return "/article/\(id)#\(section)"
            }
            return "/article/\(id)"
        case .search(let query, let filters):
            let filterStr = filters.joined(separator: ",")
            return "/search?q=\(query)&filters=\(filterStr)"
        }
    }

    static func parse(path: String) -> Route? {
        // 简化的路径解析
        if path == "/" { return .home }
        if path == "/settings" { return .settings }
        if path.hasPrefix("/user/") {
            let userId = String(path.dropFirst(6))
            return .profile(userId: userId)
        }
        return nil
    }
}
```

## 模式匹配的其他用法

### 元组匹配

```swift
let point = (x: 1, y: 0)

switch point {
case (0, 0):
    print("原点")
case (_, 0):
    print("在 x 轴上")
case (0, _):
    print("在 y 轴上")
case (-2...2, -2...2):
    print("在原点附近")
default:
    print("其他位置")
}
```

### 类型转换模式

```swift
let values: [Any] = [1, "hello", 3.14, true, [1, 2, 3]]

for value in values {
    switch value {
    case let intValue as Int:
        print("整数: \(intValue)")
    case let stringValue as String:
        print("字符串: \(stringValue)")
    case let doubleValue as Double:
        print("浮点数: \(doubleValue)")
    case let boolValue as Bool:
        print("布尔值: \(boolValue)")
    case let arrayValue as [Int]:
        print("整数数组: \(arrayValue)")
    default:
        print("未知类型")
    }
}
```

### Optional 模式

```swift
let optionalNumbers: [Int?] = [1, nil, 3, nil, 5]

// 只遍历非 nil 值
for case let number? in optionalNumbers {
    print(number)
}

// 使用 switch
let value: Int? = 42

switch value {
case .none:
    print("没有值")
case .some(let x) where x > 0:
    print("正数: \(x)")
case .some(let x):
    print("非正数: \(x)")
}
```

## 最佳实践

### 优先使用枚举表示有限状态

```swift
// 好的做法
enum ConnectionState {
    case disconnected
    case connecting
    case connected
    case disconnecting
}

// 避免使用多个布尔值
// var isConnected: Bool
// var isConnecting: Bool
```

### 使用关联值代替可选属性

```swift
// 好的做法
enum LoadingState<T> {
    case idle
    case loading
    case loaded(T)
    case failed(Error)
}

// 避免
// struct LoadingState<T> {
//     var isLoading: Bool
//     var data: T?
//     var error: Error?
// }
```

### 利用编译器的穷尽性检查

```swift
enum Feature {
    case dashboard
    case analytics
    case settings
    // 新增 case 时，编译器会提示所有未处理的 switch
}

// 避免使用 default，除非确实需要
func featureIcon(_ feature: Feature) -> String {
    switch feature {
    case .dashboard: return "house"
    case .analytics: return "chart"
    case .settings: return "gear"
    // 没有 default，新增 feature 时会编译错误
    }
}
```

### 合理组织关联值

```swift
// 当关联值较多时，考虑使用结构体
struct ImageMetadata {
    let url: String
    let width: Int
    let height: Int
    let format: String
}

enum MediaContent {
    case image(ImageMetadata)
    case video(url: String, duration: TimeInterval)
}
```

## 总结

Swift 的枚举和模式匹配是构建类型安全、表达力强的代码的核心工具：

- **枚举**不仅仅是命名常量的集合，还可以携带关联值，拥有方法和属性
- **原始值**提供了与其他类型（如整数、字符串）的映射
- **关联值**让每个 case 可以存储不同类型的数据
- **switch** 语句的穷尽性检查确保不会遗漏任何情况
- **if case** 和 **guard case** 提供了更简洁的单一模式匹配语法
- **where 子句**可以添加额外的匹配条件

掌握这些特性，能够帮助你写出更加安全、清晰、易于维护的 Swift 代码。
