---
title: Swift 扩展
description: 学习 Swift 扩展为现有类型添加功能，包括计算属性、方法和协议遵循
track: swift
section: optionals-protocols
difficulty: intermediate
tags:
  - Swift
  - 扩展
  - 协议
status: imported
origin: old/src/content/docs/swift/extensions.zh.md
divergence: 0.151
issues: []
legacy:
  category: Swift
  subcategory: 核心概念
  order: 12
  lastUpdated: 2026-01-07
---

扩展（Extensions）是 Swift 中一项强大的特性，它允许你为现有的类、结构体、枚举或协议类型添加新功能，即使你没有访问原始源代码的权限。这种能力使得代码组织更加灵活，也让你能够扩展系统框架中的类型。

## 扩展基础

### 扩展语法

扩展使用 `extension` 关键字声明：

```swift
extension SomeType {
    // 为 SomeType 添加的新功能
}
```

扩展可以为现有类型添加以下功能：

- 计算实例属性和计算类型属性
- 实例方法和类型方法
- 新的构造器
- 下标
- 嵌套类型
- 使现有类型遵循协议

> **注意**：扩展可以添加新功能，但不能重写现有功能，也不能添加存储属性或属性观察器。

### 基本示例

```swift
// 为 Int 类型添加扩展
extension Int {
    var squared: Int {
        return self * self
    }

    func times(_ task: () -> Void) {
        for _ in 0..<self {
            task()
        }
    }
}

let number = 5
print(number.squared)  // 输出: 25

3.times {
    print("Hello, Swift!")
}
// 输出:
// Hello, Swift!
// Hello, Swift!
// Hello, Swift!
```

### 扩展与原类型的关系

扩展是原类型的一部分，可以访问类型的所有成员：

```swift
class Vehicle {
    var speed: Double = 0

    func accelerate() {
        speed += 10
    }
}

extension Vehicle {
    // 可以访问原类型的所有成员
    func doubleSpeed() {
        speed *= 2       // 访问存储属性
        accelerate()     // 调用原有方法
    }
}

let car = Vehicle()
car.accelerate()
car.doubleSpeed()
print(car.speed)  // 输出: 20.0
```

## 计算属性

扩展可以为现有类型添加计算实例属性和计算类型属性。需要注意的是，扩展不能添加存储属性，也不能为现有属性添加属性观察器。

### 计算实例属性

```swift
extension Double {
    // 长度单位转换
    var km: Double { return self * 1_000.0 }
    var m: Double { return self }
    var cm: Double { return self / 100.0 }
    var mm: Double { return self / 1_000.0 }
    var ft: Double { return self / 3.28084 }

    // 温度转换
    var celsiusToFahrenheit: Double {
        return self * 9 / 5 + 32
    }

    var fahrenheitToCelsius: Double {
        return (self - 32) * 5 / 9
    }
}

// 使用示例
let marathon = 42.km + 195.m
print("马拉松全程: \(marathon) 米")  // 输出: 马拉松全程: 42195.0 米

let bodyTemp = 37.0
print("体温: \(bodyTemp.celsiusToFahrenheit)°F")  // 输出: 体温: 98.6°F

let height = 5.5.ft
print("身高: \(height) 米")  // 输出: 约 1.676 米
```

### 计算类型属性

```swift
extension Int {
    static var randomDigit: Int {
        return Int.random(in: 0...9)
    }

    static var zero: Int {
        return 0
    }
}

print(Int.randomDigit)  // 输出: 随机数字 0-9
print(Int.zero)         // 输出: 0
```

### 复杂计算属性示例

```swift
extension String {
    // 检查是否为有效邮箱
    var isValidEmail: Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: self)
    }

    // 单词计数
    var wordCount: Int {
        let words = self.components(separatedBy: .whitespacesAndNewlines)
        return words.filter { !$0.isEmpty }.count
    }

    // 反转字符串
    var reversed: String {
        return String(self.reversed())
    }

    // 首字母大写每个单词
    var titleCased: String {
        return self.capitalized
    }

    // 移除空白字符
    var trimmed: String {
        return self.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

// 使用示例
let email = "user@example.com"
print(email.isValidEmail)  // 输出: true

let sentence = "Swift 是一门强大的编程语言"
print(sentence.wordCount)  // 输出: 5

let text = "  Hello World  "
print(text.trimmed)  // 输出: "Hello World"
```

## 方法

扩展可以为现有类型添加新的实例方法和类型方法。

### 实例方法

```swift
extension Int {
    // 重复执行闭包
    func times(_ task: () -> Void) {
        for _ in 0..<self {
            task()
        }
    }

    // 判断是否为偶数
    func isEven() -> Bool {
        return self % 2 == 0
    }

    // 判断是否为奇数
    func isOdd() -> Bool {
        return self % 2 != 0
    }

    // 阶乘
    func factorial() -> Int {
        guard self > 0 else { return 1 }
        return (1...self).reduce(1, *)
    }
}

// 使用示例
3.times {
    print("Hello, Swift!")
}
// 输出:
// Hello, Swift!
// Hello, Swift!
// Hello, Swift!

print(10.isEven())     // 输出: true
print(7.isOdd())       // 输出: true
print(5.factorial())   // 输出: 120
```

### 可变实例方法

对于值类型（结构体和枚举），如果方法需要修改 `self`，必须将该方法标记为 `mutating`：

```swift
extension Int {
    mutating func square() {
        self = self * self
    }

    mutating func increment(by amount: Int = 1) {
        self += amount
    }

    mutating func clamp(to range: ClosedRange<Int>) {
        self = Swift.min(Swift.max(self, range.lowerBound), range.upperBound)
    }
}

var someInt = 5
someInt.square()
print(someInt)  // 输出: 25

var score = 85
score.increment(by: 10)
print(score)  // 输出: 95

var value = 150
value.clamp(to: 0...100)
print(value)  // 输出: 100
```

### 类型方法

```swift
extension Array where Element: Numeric {
    static func zeros(count: Int) -> [Element] {
        return Array(repeating: 0, count: count)
    }
}

extension String {
    static func randomString(length: Int) -> String {
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<length).map { _ in letters.randomElement()! })
    }
}

// 使用示例
let zeroArray = [Int].zeros(count: 5)
print(zeroArray)  // 输出: [0, 0, 0, 0, 0]

let randomStr = String.randomString(length: 10)
print(randomStr)  // 输出: 随机10位字符串
```

### 带参数的复杂方法

```swift
extension Array {
    // 安全获取元素
    func element(at index: Int) -> Element? {
        guard index >= 0 && index < count else { return nil }
        return self[index]
    }

    // 分块
    func chunked(into size: Int) -> [[Element]] {
        return stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}

extension String {
    // 截断字符串
    func truncated(to length: Int, trailing: String = "...") -> String {
        if self.count > length {
            return String(self.prefix(length)) + trailing
        }
        return self
    }

    // 重复字符串
    func repeated(_ times: Int) -> String {
        return String(repeating: self, count: times)
    }

    // 分割为单词数组
    func words() -> [String] {
        return self.components(separatedBy: .whitespaces)
            .filter { !$0.isEmpty }
    }
}

// 使用示例
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
print(numbers.element(at: 3))      // 输出: Optional(4)
print(numbers.element(at: 100))    // 输出: nil
print(numbers.chunked(into: 3))    // 输出: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]

let longText = "这是一段很长的文本内容需要截断"
print(longText.truncated(to: 5))   // 输出: 这是一段很...

print("Swift ".repeated(3))        // 输出: Swift Swift Swift

let sentence = "Swift 是一门 优秀的 编程语言"
print(sentence.words())  // 输出: ["Swift", "是一门", "优秀的", "编程语言"]
```

## 构造器

扩展可以为现有类型添加新的构造器。对于类类型，扩展只能添加便利构造器，不能添加指定构造器或析构器。

### 值类型的构造器

```swift
struct Size {
    var width = 0.0
    var height = 0.0
}

struct Point {
    var x = 0.0
    var y = 0.0
}

struct Rect {
    var origin = Point()
    var size = Size()
}

extension Rect {
    // 通过中心点和大小初始化
    init(center: Point, size: Size) {
        let originX = center.x - (size.width / 2)
        let originY = center.y - (size.height / 2)
        self.init(origin: Point(x: originX, y: originY), size: size)
    }

    // 通过两个对角点初始化
    init(topLeft: Point, bottomRight: Point) {
        let width = bottomRight.x - topLeft.x
        let height = bottomRight.y - topLeft.y
        self.init(origin: topLeft, size: Size(width: width, height: height))
    }

    // 通过坐标和尺寸初始化
    init(x: Double, y: Double, width: Double, height: Double) {
        self.init(
            origin: Point(x: x, y: y),
            size: Size(width: width, height: height)
        )
    }
}

// 使用示例
let rect1 = Rect(origin: Point(x: 0, y: 0), size: Size(width: 100, height: 50))
let rect2 = Rect(center: Point(x: 50, y: 25), size: Size(width: 100, height: 50))
let rect3 = Rect(x: 0, y: 0, width: 100, height: 50)

print("rect2 Origin: (\(rect2.origin.x), \(rect2.origin.y))")
// 输出: rect2 Origin: (0.0, 0.0)
```

### 类类型的便利构造器

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
    // 便利构造器：只需名字
    convenience init(name: String) {
        self.init(name: name, age: 0)
    }

    // 便利构造器：从字典初始化
    convenience init?(dictionary: [String: Any]) {
        guard let name = dictionary["name"] as? String,
              let age = dictionary["age"] as? Int else {
            return nil
        }
        self.init(name: name, age: age)
    }
}

// 使用示例
let person1 = Person(name: "张三", age: 25)
let person2 = Person(name: "李四")

let personDict: [String: Any] = ["name": "王五", "age": 30]
if let person3 = Person(dictionary: personDict) {
    print("\(person3.name), \(person3.age)岁")  // 输出: 王五, 30岁
}
```

### 为系统类型添加构造器

```swift
import UIKit

extension UIColor {
    // 通过十六进制值初始化
    convenience init(hex: Int, alpha: CGFloat = 1.0) {
        let red = CGFloat((hex >> 16) & 0xFF) / 255.0
        let green = CGFloat((hex >> 8) & 0xFF) / 255.0
        let blue = CGFloat(hex & 0xFF) / 255.0
        self.init(red: red, green: green, blue: blue, alpha: alpha)
    }

    // 通过十六进制字符串初始化
    convenience init?(hexString: String) {
        var hexSanitized = hexString.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        guard let hexValue = Int(hexSanitized, radix: 16) else {
            return nil
        }

        self.init(hex: hexValue)
    }
}

// 使用示例
let redColor = UIColor(hex: 0xFF0000)
let blueColor = UIColor(hexString: "#0000FF")
let greenColor = UIColor(hex: 0x00FF00, alpha: 0.5)
```

## 下标

扩展可以为现有类型添加新的下标。

### 基本下标

```swift
extension Int {
    // 获取指定位置的数字
    subscript(digitIndex: Int) -> Int {
        var decimalBase = 1
        for _ in 0..<digitIndex {
            decimalBase *= 10
        }
        return (self / decimalBase) % 10
    }
}

// 使用示例
let number = 987654321
print(number[0])  // 输出: 1 (个位)
print(number[1])  // 输出: 2 (十位)
print(number[8])  // 输出: 9 (亿位)
```

### 字符串下标

```swift
extension String {
    // 通过整数索引获取字符
    subscript(index: Int) -> Character? {
        guard index >= 0 && index < count else { return nil }
        return self[self.index(startIndex, offsetBy: index)]
    }

    // 通过范围获取子字符串
    subscript(range: Range<Int>) -> String? {
        guard range.lowerBound >= 0 && range.upperBound <= count else { return nil }
        let start = self.index(startIndex, offsetBy: range.lowerBound)
        let end = self.index(startIndex, offsetBy: range.upperBound)
        return String(self[start..<end])
    }

    // 通过闭区间获取子字符串
    subscript(range: ClosedRange<Int>) -> String? {
        return self[range.lowerBound..<range.upperBound + 1]
    }
}

// 使用示例
let greeting = "Hello, Swift!"
print(greeting[0])        // 输出: Optional("H")
print(greeting[7])        // 输出: Optional("S")
print(greeting[0..<5])    // 输出: Optional("Hello")
print(greeting[7...11])   // 输出: Optional("Swift")
```

### 安全下标访问

```swift
extension Array {
    // 安全下标访问
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}

let numbers = [1, 2, 3, 4, 5]
print(numbers[safe: 2])   // 输出: Optional(3)
print(numbers[safe: 10])  // 输出: nil（不会崩溃）
```

### 多参数下标

```swift
extension Array where Element == [Int] {
    // 二维数组下标
    subscript(row: Int, column: Int) -> Int? {
        get {
            guard row >= 0 && row < count,
                  column >= 0 && column < self[row].count else {
                return nil
            }
            return self[row][column]
        }
        set {
            guard let newValue = newValue,
                  row >= 0 && row < count,
                  column >= 0 && column < self[row].count else {
                return
            }
            self[row][column] = newValue
        }
    }
}

// 使用示例
var matrix: [[Int]] = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

print(matrix[1, 1])  // 输出: Optional(5)
matrix[0, 0] = 100
print(matrix[0, 0])  // 输出: Optional(100)
```

## 嵌套类型

扩展可以为现有的类、结构体和枚举添加新的嵌套类型。

### 基本嵌套类型

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

// 使用示例
func printIntegerKinds(_ numbers: [Int]) {
    for number in numbers {
        switch number.kind {
        case .negative:
            print("\(number) 是负数")
        case .zero:
            print("\(number) 是零")
        case .positive:
            print("\(number) 是正数")
        }
    }
}

printIntegerKinds([3, -5, 0, 12, -8])
// 输出:
// 3 是正数
// -5 是负数
// 0 是零
// 12 是正数
// -8 是负数
```

### 复杂嵌套类型

```swift
extension String {
    // 嵌套结构体：表示字符串统计信息
    struct Statistics {
        let characterCount: Int
        let wordCount: Int
        let lineCount: Int
        let vowelCount: Int
        let consonantCount: Int
    }

    var statistics: Statistics {
        let chars = self.count
        let words = self.components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }.count
        let lines = self.components(separatedBy: .newlines).count

        let vowels = Set("aeiouAEIOU")
        let consonants = Set("bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ")

        let vowelCount = self.filter { vowels.contains($0) }.count
        let consonantCount = self.filter { consonants.contains($0) }.count

        return Statistics(
            characterCount: chars,
            wordCount: words,
            lineCount: lines,
            vowelCount: vowelCount,
            consonantCount: consonantCount
        )
    }
}

// 使用示例
let text = """
Hello World
Swift is great
"""
let stats = text.statistics
print("字符数: \(stats.characterCount)")
print("单词数: \(stats.wordCount)")
print("行数: \(stats.lineCount)")
print("元音数: \(stats.vowelCount)")
print("辅音数: \(stats.consonantCount)")
```

### 嵌套枚举用于状态管理

```swift
extension URLSession {
    enum NetworkError: Error {
        case invalidURL
        case noData
        case decodingFailed
        case serverError(statusCode: Int)
        case connectionFailed

        var localizedDescription: String {
            switch self {
            case .invalidURL:
                return "无效的URL"
            case .noData:
                return "没有返回数据"
            case .decodingFailed:
                return "数据解码失败"
            case .serverError(let code):
                return "服务器错误，状态码: \(code)"
            case .connectionFailed:
                return "网络连接失败"
            }
        }
    }
}
```

## 协议遵循

扩展可以使现有类型遵循一个或多个协议。这是扩展最强大的功能之一，也是 Swift 面向协议编程的核心。

### 基本协议遵循

```swift
protocol TextRepresentable {
    var textDescription: String { get }
}

struct Dice {
    let sides: Int

    func roll() -> Int {
        return Int.random(in: 1...sides)
    }
}

extension Dice: TextRepresentable {
    var textDescription: String {
        return "一个 \(sides) 面的骰子"
    }
}

// 使用示例
let d6 = Dice(sides: 6)
print(d6.textDescription)  // 输出: 一个 6 面的骰子
```

### 遵循多个协议

```swift
protocol Describable {
    var description: String { get }
}

protocol Comparable {
    func compare(to other: Self) -> Int
}

struct Temperature {
    var celsius: Double
}

extension Temperature: Describable {
    var description: String {
        return "\(celsius)°C"
    }
}

extension Temperature: Comparable {
    func compare(to other: Temperature) -> Int {
        if self.celsius < other.celsius {
            return -1
        } else if self.celsius > other.celsius {
            return 1
        }
        return 0
    }
}

// 使用示例
let temp1 = Temperature(celsius: 25.0)
let temp2 = Temperature(celsius: 30.0)
print(temp1.description)              // 输出: 25.0°C
print(temp1.compare(to: temp2))       // 输出: -1
```

### 让现有类型遵循标准库协议

```swift
struct Person {
    var name: String
    var age: Int
}

// 遵循 CustomStringConvertible
extension Person: CustomStringConvertible {
    var description: String {
        return "\(name), \(age)岁"
    }
}

// 遵循 Equatable
extension Person: Equatable {
    static func == (lhs: Person, rhs: Person) -> Bool {
        return lhs.name == rhs.name && lhs.age == rhs.age
    }
}

// 遵循 Hashable
extension Person: Hashable {
    func hash(into hasher: inout Hasher) {
        hasher.combine(name)
        hasher.combine(age)
    }
}

// 使用示例
let person1 = Person(name: "张三", age: 25)
let person2 = Person(name: "张三", age: 25)

print(person1)               // 输出: 张三, 25岁
print(person1 == person2)    // 输出: true

// 可以放入 Set
let personSet: Set<Person> = [person1, person2]
print(personSet.count)       // 输出: 1
```

### 条件性协议遵循

你可以使用 `where` 子句让泛型类型在满足特定条件时遵循协议：

```swift
protocol Summable {
    var sum: Self { get }
}

extension Array: Summable where Element: Numeric {
    var sum: Element {
        return reduce(0, +)
    }
}

extension Array: TextRepresentable where Element: TextRepresentable {
    var textDescription: String {
        let itemsAsText = self.map { $0.textDescription }
        return "[" + itemsAsText.joined(separator: ", ") + "]"
    }
}

// 使用示例
let numbers = [1, 2, 3, 4, 5]
print(numbers.sum)  // 输出: 15

let doubles = [1.5, 2.5, 3.0]
print(doubles.sum)  // 输出: 7.0

let dice = [Dice(sides: 6), Dice(sides: 20)]
print(dice.textDescription)  // 输出: [一个 6 面的骰子, 一个 20 面的骰子]
```

### 更复杂的条件遵循

```swift
// 自定义容器类型
struct Box<T> {
    let value: T
}

// 当 T 遵循 Equatable 时，Box<T> 也遵循 Equatable
extension Box: Equatable where T: Equatable {
    static func == (lhs: Box<T>, rhs: Box<T>) -> Bool {
        return lhs.value == rhs.value
    }
}

// 当 T 遵循 Hashable 时，Box<T> 也遵循 Hashable
extension Box: Hashable where T: Hashable {
    func hash(into hasher: inout Hasher) {
        hasher.combine(value)
    }
}

// 当 T 遵循 Comparable 时，Box<T> 也遵循 Comparable
extension Box: Comparable where T: Comparable {
    static func < (lhs: Box<T>, rhs: Box<T>) -> Bool {
        return lhs.value < rhs.value
    }
}

// 使用示例
let box1 = Box(value: 10)
let box2 = Box(value: 10)
let box3 = Box(value: 20)

print(box1 == box2)  // 输出: true
print(box1 < box3)   // 输出: true

// 可以放入 Set（因为遵循 Hashable）
let boxSet: Set<Box<Int>> = [box1, box2, box3]
print(boxSet.count)  // 输出: 2（box1 和 box2 相等）
```

### 使用扩展添加协议默认实现

```swift
protocol Greetable {
    var name: String { get }
    func greet() -> String
}

// 为协议提供默认实现
extension Greetable {
    func greet() -> String {
        return "你好，我是 \(name)"
    }

    func formalGreet() -> String {
        return "您好，我的名字是 \(name)，很高兴认识您"
    }
}

struct Student: Greetable {
    let name: String
    // 使用默认的 greet() 实现
}

struct Teacher: Greetable {
    let name: String

    // 自定义 greet() 实现
    func greet() -> String {
        return "同学们好，我是 \(name) 老师"
    }
}

// 使用示例
let student = Student(name: "小明")
print(student.greet())       // 输出: 你好，我是 小明
print(student.formalGreet()) // 输出: 您好，我的名字是 小明，很高兴认识您

let teacher = Teacher(name: "王")
print(teacher.greet())       // 输出: 同学们好，我是 王 老师
print(teacher.formalGreet()) // 输出: 您好，我的名字是 王，很高兴认识您
```

## 实际应用案例

### 案例一：日期处理扩展

```swift
extension Date {
    // MARK: - 日期组件

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

    // MARK: - 日期判断

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

    // MARK: - 日期计算

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

    // MARK: - 日期格式化

    func formatted(_ format: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = format
        formatter.locale = Locale(identifier: "zh_CN")
        return formatter.string(from: self)
    }

    var shortDateString: String {
        return formatted("yyyy-MM-dd")
    }

    var longDateString: String {
        return formatted("yyyy年MM月dd日")
    }

    var timeString: String {
        return formatted("HH:mm:ss")
    }

    // MARK: - 相对时间

    var relativeTimeString: String {
        let now = Date()
        let seconds = Int(now.timeIntervalSince(self))

        if seconds < 0 {
            return "未来"
        }

        switch seconds {
        case 0..<60:
            return "刚刚"
        case 60..<3600:
            return "\(seconds / 60)分钟前"
        case 3600..<86400:
            return "\(seconds / 3600)小时前"
        case 86400..<604800:
            return "\(seconds / 86400)天前"
        default:
            return shortDateString
        }
    }
}

// 使用示例
let now = Date()
print("年份: \(now.year)")
print("今天: \(now.isToday)")
print("短日期: \(now.shortDateString)")
print("长日期: \(now.longDateString)")

let yesterday = now.adding(days: -1)
print("昨天: \(yesterday.isYesterday)")
print("相对时间: \(yesterday.relativeTimeString)")

let nextWeek = now.adding(days: 7)
print("下周: \(nextWeek.shortDateString)")
print("相隔天数: \(nextWeek.days(from: now))")
```

### 案例二：集合操作扩展

```swift
extension Collection {
    // 安全获取元素
    subscript(safe index: Index) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }

    // 是否非空
    var isNotEmpty: Bool {
        return !isEmpty
    }
}

extension Collection where Element: Numeric {
    // 求和
    var sum: Element {
        return reduce(0, +)
    }

    // 求积
    var product: Element {
        return reduce(1, *)
    }
}

extension Collection where Element: Comparable {
    // 获取最小和最大值
    var minMax: (min: Element, max: Element)? {
        guard let first = first else { return nil }
        return reduce((first, first)) { result, element in
            (Swift.min(result.0, element), Swift.max(result.1, element))
        }
    }
}

extension Array {
    // 移除重复元素（保持顺序）
    func removingDuplicates<T: Hashable>(by keyPath: KeyPath<Element, T>) -> [Element] {
        var seen = Set<T>()
        return filter { element in
            let key = element[keyPath: keyPath]
            return seen.insert(key).inserted
        }
    }

    // 分组
    func grouped<T: Hashable>(by keyPath: KeyPath<Element, T>) -> [T: [Element]] {
        return Dictionary(grouping: self) { $0[keyPath: keyPath] }
    }
}

extension Array where Element: Equatable {
    // 移除所有指定元素
    mutating func removeAll(_ element: Element) {
        removeAll { $0 == element }
    }

    // 获取唯一元素数组
    var unique: [Element] {
        var result: [Element] = []
        for element in self where !result.contains(element) {
            result.append(element)
        }
        return result
    }

    // 统计元素出现次数
    func count(of element: Element) -> Int {
        return filter { $0 == element }.count
    }
}

// 使用示例
let numbers = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
print(numbers.sum)                    // 输出: 44
print(numbers.minMax!)                // 输出: (min: 1, max: 9)
print(numbers.unique)                 // 输出: [3, 1, 4, 5, 9, 2, 6]
print(numbers.count(of: 5))           // 输出: 3

let emptyArray: [Int] = []
print(emptyArray.isNotEmpty)          // 输出: false
print(emptyArray[safe: 0])            // 输出: nil

struct Item {
    let id: Int
    let category: String
}

let items = [
    Item(id: 1, category: "A"),
    Item(id: 2, category: "B"),
    Item(id: 3, category: "A")
]

let groupedItems = items.grouped(by: \.category)
print(groupedItems)  // ["A": [Item1, Item3], "B": [Item2]]
```

### 案例三：可选值扩展

```swift
extension Optional {
    // 是否为 nil
    var isNil: Bool {
        return self == nil
    }

    // 是否不为 nil
    var isNotNil: Bool {
        return self != nil
    }

    // 解包或抛出错误
    func unwrap(or error: Error) throws -> Wrapped {
        guard let value = self else {
            throw error
        }
        return value
    }

    // 解包或执行闪退
    func unwrap(orFatalError message: String) -> Wrapped {
        guard let value = self else {
            fatalError(message)
        }
        return value
    }

    // 执行闭包如果有值
    func `do`(_ action: (Wrapped) -> Void) {
        if let value = self {
            action(value)
        }
    }

    // 转换为 Result
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
    // 是否为空（nil 或空集合）
    var isNilOrEmpty: Bool {
        return self?.isEmpty ?? true
    }

    // 是否非空
    var isNotNilOrEmpty: Bool {
        return !isNilOrEmpty
    }
}

extension Optional where Wrapped == String {
    // 是否为空白（nil、空字符串或只有空白字符）
    var isNilOrBlank: Bool {
        return self?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true
    }

    // 空白时返回默认值
    func orEmpty() -> String {
        return self ?? ""
    }
}

// 使用示例
enum MyError: Error {
    case valueNotFound
}

let optionalValue: Int? = nil
print(optionalValue.isNil)  // 输出: true

let optionalString: String? = "  "
print(optionalString.isNilOrBlank)  // 输出: true

let optionalArray: [Int]? = []
print(optionalArray.isNilOrEmpty)  // 输出: true

let name: String? = "Swift"
name.do { value in
    print("Name is \(value)")  // 输出: Name is Swift
}

// 使用 Result 转换
let result = optionalValue.toResult(withError: MyError.valueNotFound)
switch result {
case .success(let value):
    print("Value: \(value)")
case .failure(let error):
    print("Error: \(error)")  // 输出: Error: valueNotFound
}
```

### 案例四：网络请求扩展

```swift
extension URL {
    // 添加查询参数
    func appendingQueryParameters(_ parameters: [String: String]) -> URL? {
        guard var components = URLComponents(url: self, resolvingAgainstBaseURL: true) else {
            return nil
        }

        let queryItems = parameters.map { URLQueryItem(name: $0.key, value: $0.value) }
        components.queryItems = (components.queryItems ?? []) + queryItems

        return components.url
    }

    // 获取查询参数字典
    var queryParameters: [String: String]? {
        guard let components = URLComponents(url: self, resolvingAgainstBaseURL: true),
              let queryItems = components.queryItems else {
            return nil
        }

        return queryItems.reduce(into: [String: String]()) { result, item in
            result[item.name] = item.value
        }
    }
}

// 使用示例
if let url = URL(string: "https://api.example.com/users") {
    let urlWithParams = url.appendingQueryParameters([
        "page": "1",
        "limit": "20"
    ])
    print(urlWithParams?.absoluteString ?? "")
    // 输出: https://api.example.com/users?page=1&limit=20
}
```

## 扩展的最佳实践

### 使用扩展组织代码

将相关功能分组到不同的扩展中，提高代码可读性：

```swift
class UserViewController: UIViewController {
    // 属性声明
    private var users: [User] = []
    private var selectedUser: User?
}

// MARK: - 生命周期
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

// MARK: - UI 设置
extension UserViewController {
    private func setupUI() {
        // UI 设置代码
    }
}

// MARK: - 数据加载
extension UserViewController {
    private func loadData() {
        // 数据加载代码
    }

    private func refreshData() {
        // 刷新数据代码
    }
}

// MARK: - UITableViewDataSource
extension UserViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return users.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        // 单元格配置
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

### 将协议遵循放在单独的扩展中

```swift
// 模型定义
struct User {
    var id: Int
    var name: String
    var email: String
}

// MARK: - 计算属性
extension User {
    var displayName: String {
        return name.isEmpty ? "匿名用户" : name
    }

    var isValidEmail: Bool {
        return email.contains("@")
    }
}

// MARK: - CustomStringConvertible
extension User: CustomStringConvertible {
    var description: String {
        return "User(id: \(id), name: \(name))"
    }
}

// MARK: - Equatable
extension User: Equatable {
    static func == (lhs: User, rhs: User) -> Bool {
        return lhs.id == rhs.id
    }
}

// MARK: - Codable
extension User: Codable {
    // Codable 实现
}
```

### 使用条件扩展避免类型约束污染

```swift
// 不好的做法：在协议定义中要求太多约束
protocol BadContainer {
    associatedtype Element: Equatable & Hashable & Comparable
    // 这要求所有元素都必须同时遵循三个协议
}

// 好的做法：使用条件扩展
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

### 为第三方类型添加扩展时使用前缀

```swift
// 为第三方类型添加扩展时，使用前缀避免命名冲突
extension String {
    // 使用项目或模块前缀
    var myApp_isValidEmail: Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        return NSPredicate(format: "SELF MATCHES %@", emailRegex).evaluate(with: self)
    }

    func myApp_truncated(to length: Int) -> String {
        if count <= length { return self }
        return String(prefix(length)) + "..."
    }
}

// 或者使用嵌套类型来组织
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

// 使用
let email = "test@example.com"
print(email.myApp.isValidEmail)  // 输出: true
```

## 扩展的限制

使用扩展时需要注意以下限制：

### 不能添加存储属性

```swift
class MyClass {
    var storedProperty = 0
}

extension MyClass {
    // 错误：不能添加存储属性
    // var newStoredProperty = 1

    // 正确：可以添加计算属性
    var computedProperty: Int {
        return storedProperty * 2
    }
}
```

### 不能添加属性观察器

```swift
extension MyClass {
    // 错误：不能为现有属性添加观察器
    // override var storedProperty: Int {
    //     willSet { print("将要改变") }
    //     didSet { print("已经改变") }
    // }
}
```

### 不能重写现有功能

```swift
class Animal {
    func speak() {
        print("...")
    }
}

extension Animal {
    // 错误：不能重写现有方法
    // override func speak() { }

    // 正确：可以添加新方法
    func newMethod() {
        print("新方法")
    }
}
```

### 类扩展只能添加便利构造器

```swift
class Person {
    var name: String

    init(name: String) {
        self.name = name
    }
}

extension Person {
    // 错误：不能添加指定构造器
    // init(firstName: String, lastName: String) {
    //     self.name = firstName + " " + lastName
    // }

    // 正确：只能添加便利构造器
    convenience init(firstName: String, lastName: String) {
        self.init(name: firstName + " " + lastName)
    }
}
```

### 扩展方法的静态派发

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

    // 注意：扩展中的方法不能被覆盖（除非使用 @objc）
    // override func greet() { }  // 错误
}

let animal: Animal = Dog()
animal.speak()  // 输出: "Woof!" - 动态派发
animal.greet()  // 输出: "Hello!" - 静态派发，总是调用 Animal 的实现
```

要使扩展方法支持覆盖，需要使用 `@objc` 标记：

```swift
extension Animal {
    @objc func greet() {
        print("Hello!")
    }
}

class Cat: Animal {
    override func greet() {
        print("Meow, hello!")
    }
}

let animal: Animal = Cat()
animal.greet()  // 输出: "Meow, hello!" - 动态派发
```

## 性能考量

### 静态派发 vs 动态派发

扩展中的方法默认使用静态派发，性能更优：

```swift
protocol Shape {
    func area() -> Double  // 协议要求 - 动态派发
}

extension Shape {
    func perimeter() -> Double {  // 扩展方法 - 静态派发
        return 0  // 默认实现
    }

    func describe() -> String {  // 扩展方法 - 静态派发
        return "面积: \(area()), 周长: \(perimeter())"
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
```

### 泛型特化

使用泛型约束可以帮助编译器进行特化优化：

```swift
// 允许编译器特化
extension Array where Element == Int {
    func fastSum() -> Int {
        var result = 0
        for element in self {
            result += element
        }
        return result
    }
}

// 较慢的泛型版本
extension Array where Element: Numeric {
    func genericSum() -> Element {
        return reduce(0, +)
    }
}
```

## 常见陷阱

### 协议扩展的静态派发陷阱

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
greeter.greet()     // 输出: "Hi there!" - 动态派发（协议要求的方法）
greeter.farewell()  // 输出: "Goodbye!" - 静态派发（扩展中的方法）

let englishGreeter = EnglishGreeter()
englishGreeter.greet()     // 输出: "Hi there!"
englishGreeter.farewell()  // 输出: "See you!" - 直接调用具体类型的方法
```

### 命名冲突

```swift
// 如果多个扩展定义了同名方法，可能导致意外行为
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
print(ints.sum())  // 编译器会选择更具体的版本

// 避免：明确命名或使用不同的方法名
extension Array where Element == Int {
    func intSum() -> Int {
        return reduce(0, +)
    }
}
```

## 总结

Swift 扩展是一个强大而灵活的特性，让你能够：

- 为现有类型添加新功能，无需访问原始源代码
- 添加计算属性、方法、构造器、下标和嵌套类型
- 更好地组织代码，将相关功能分组到不同的扩展中
- 使现有类型遵循新的协议
- 为协议提供默认实现
- 使用条件遵循实现灵活的协议适配

通过合理使用扩展，你可以编写出更加模块化、可维护的代码。记住扩展的核心原则：

1. **增强而非替换**：扩展用于添加新功能，不能重写现有功能
2. **保持组织性**：使用扩展将相关代码分组，提高可读性
3. **利用协议扩展**：为协议提供默认实现，减少重复代码
4. **注意派发方式**：理解静态派发和动态派发的区别

扩展与协议的结合使用是 Swift 面向协议编程的核心，掌握扩展的使用将帮助你更好地理解和应用 Swift 的设计理念。
