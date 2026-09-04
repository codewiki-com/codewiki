---
title: Swift 语言基础
description: 深入理解 Swift 变量、常量、数据类型与可选类型
track: swift
section: basics
difficulty: beginner
tags:
  - Swift
  - 基础
  - Optional
  - iOS
status: imported
origin: old/src/content/docs/swift/fundamentals.zh.md
divergence: 0.12
issues: []
legacy:
  category: Swift
  subcategory: 语言基础
  order: 1
  lastUpdated: 2026-01-07
---

Swift 是 Apple 开发的现代化编程语言,具有安全、快速、表达力强的特点。本文将深入介绍 Swift 的核心基础知识。

## 变量与常量

### 常量 (let)

使用 `let` 关键字声明常量,常量一旦赋值后就不能更改。这是 Swift 推荐的默认选择,有助于提高代码安全性。

```swift
let maximumNumberOfLoginAttempts = 10
let welcomeMessage = "欢迎使用 Swift"

// 错误:常量不能被修改
// maximumNumberOfLoginAttempts = 20
```

**最佳实践**: 优先使用 `let`,只有在确实需要改变值时才使用 `var`。

### 变量 (var)

使用 `var` 关键字声明变量,变量的值可以在声明后修改。

```swift
var currentLoginAttempt = 0
currentLoginAttempt = 1  // 可以修改
currentLoginAttempt += 1  // 现在是 2

var environment = "开发环境"
environment = "生产环境"  // 可以重新赋值
```

### 类型标注

Swift 支持类型推断,但也可以显式指定类型:

```swift
// 类型推断
let inferredInteger = 42  // Int 类型
let inferredDouble = 3.14159  // Double 类型

// 显式类型标注
let explicitDouble: Double = 70
let username: String = "张三"
let isLoggedIn: Bool = false

// 先声明后赋值
var welcomeText: String
welcomeText = "你好,世界!"
```

### 多个声明

可以在一行声明多个常量或变量:

```swift
var x = 0.0, y = 0.0, z = 0.0
let red = 255, green = 0, blue = 0
```

## 数据类型

### 基本数据类型

#### 整数类型 (Int)

```swift
let age: Int = 25
let year = 2026  // 推断为 Int

// 有符号整数
let signedInt8: Int8 = -128  // -128 到 127
let signedInt16: Int16 = -32768
let signedInt32: Int32 = -2147483648
let signedInt64: Int64 = -9223372036854775808

// 无符号整数
let unsignedInt8: UInt8 = 255  // 0 到 255
let unsignedInt16: UInt16 = 65535
let unsignedInt32: UInt32 = 4294967295
let unsignedInt64: UInt64 = 18446744073709551615

// 获取最大值和最小值
print("Int8 最小值: \(Int8.min)")  // -128
print("Int8 最大值: \(Int8.max)")  // 127
print("UInt8 最大值: \(UInt8.max)")  // 255
```

#### 浮点数类型

```swift
// Double: 64 位浮点数,精度至少 15 位小数
let pi: Double = 3.14159265358979

// Float: 32 位浮点数,精度约 6 位小数
let euler: Float = 2.71828

// 默认推断为 Double
let inferredDouble = 3.14  // Double 类型
```

#### 布尔类型 (Bool)

```swift
let isSwiftFun = true
let isComplicated = false

if isSwiftFun {
    print("Swift 很有趣!")
}

// Swift 的 Bool 是类型安全的
// let invalid = 1  // 不能用整数代替布尔值
```

#### 字符串类型 (String)

```swift
let greeting = "你好"
let name = "李明"

// 字符串拼接
let message = greeting + ", " + name + "!"

// 字符串插值
let age = 28
let introduction = "我叫\(name),今年\(age)岁"

// 多行字符串
let multilineString = """
这是第一行
这是第二行
这是第三行
"""

// 字符串常用操作
let emptyString = ""
let anotherEmptyString = String()

if emptyString.isEmpty {
    print("字符串为空")
}

let count = greeting.count  // 2
let upperCased = greeting.uppercased()  // "你好"
let lowerCased = "HELLO".lowercased()  // "hello"
```

#### 字符类型 (Character)

```swift
let exclamationMark: Character = "!"
let chineseCharacter: Character = "中"
let emoji: Character = "😊"

// 遍历字符串中的字符
for character in "Swift" {
    print(character)
}
```

### 类型转换

```swift
// 整数转换
let three = 3
let pointOneFourOneFiveNine = 0.14159
let pi = Double(three) + pointOneFourOneFiveNine  // 3.14159

// 浮点数转整数(会截断小数部分)
let integerPi = Int(pi)  // 3

// 字符串转数字
let numberString = "123"
if let number = Int(numberString) {
    print("转换成功: \(number)")
} else {
    print("转换失败")
}

// 数字转字符串
let numberValue = 42
let stringValue = String(numberValue)  // "42"
```

### 类型别名

```swift
typealias AudioSample = UInt16
let maxAmplitude: AudioSample = AudioSample.max  // 65535

typealias UserID = Int
let currentUser: UserID = 12345
```

## 可选类型 (Optional)

可选类型是 Swift 的重要特性,用于处理值可能缺失的情况。

### 声明可选类型

```swift
// 可选 String
var serverResponseCode: Int? = 404
serverResponseCode = nil  // 可以设置为 nil

// 非可选类型不能为 nil
var mustHaveValue: String = "不能为空"
// mustHaveValue = nil  // 编译错误!

// 隐式声明可选类型初始值为 nil
var surveyAnswer: String?  // 自动设置为 nil
```

### 可选绑定 (Optional Binding)

安全地解包可选值的推荐方式:

```swift
// if let 绑定
let possibleNumber = "123"
if let actualNumber = Int(possibleNumber) {
    print("字符串包含数字: \(actualNumber)")
} else {
    print("无法转换为数字")
}

// 多个可选绑定
let firstNumber = "42"
let secondNumber = "9"

if let first = Int(firstNumber), let second = Int(secondNumber) {
    let sum = first + second
    print("总和: \(sum)")  // 总和: 51
}

// 使用 where 条件
if let number = Int(possibleNumber), number > 0 {
    print("正数: \(number)")
}

// guard let 绑定(提前退出)
func greet(person: [String: String]) {
    guard let name = person["name"] else {
        print("找不到姓名")
        return
    }

    print("你好, \(name)!")

    // name 在 guard 之后可用
    guard let location = person["location"] else {
        print("\(name) 的位置未知")
        return
    }

    print("\(name) 来自 \(location)")
}

greet(person: ["name": "王芳"])
greet(person: ["name": "张伟", "location": "北京"])
```

### 强制解包

只在确定可选值包含值时使用强制解包:

```swift
let possibleString: String? = "一个可选字符串"
let forcedString: String = possibleString!  // 强制解包,危险!

// 安全的使用场景
if possibleString != nil {
    print(possibleString!)  // 已检查不为 nil
}

// 错误示例
let nilString: String? = nil
// let crash = nilString!  // 运行时崩溃!
```

### 空合运算符 (Nil Coalescing)

```swift
let defaultColorName = "红色"
var userDefinedColorName: String?  // 默认为 nil

// 如果 userDefinedColorName 为 nil,使用默认值
var colorNameToUse = userDefinedColorName ?? defaultColorName
print(colorNameToUse)  // "红色"

userDefinedColorName = "绿色"
colorNameToUse = userDefinedColorName ?? defaultColorName
print(colorNameToUse)  // "绿色"

// 链式使用
let a: String? = nil
let b: String? = nil
let c: String? = "C 的值"
let result = a ?? b ?? c ?? "默认值"
print(result)  // "C 的值"
```

### 可选链 (Optional Chaining)

```swift
class Person {
    var residence: Residence?
}

class Residence {
    var numberOfRooms = 1
    var address: Address?
}

class Address {
    var street: String?
    var city = "北京"
}

let person = Person()

// 可选链调用
if let roomCount = person.residence?.numberOfRooms {
    print("房间数: \(roomCount)")
} else {
    print("无法获取房间数")
}

// 多层可选链
if let street = person.residence?.address?.street {
    print("街道: \(street)")
} else {
    print("无法获取街道信息")
}

// 设置值
person.residence = Residence()
person.residence?.address = Address()
person.residence?.address?.street = "长安街"

if let street = person.residence?.address?.street {
    print("街道: \(street)")  // "街道: 长安街"
}
```

### 隐式解包可选类型

```swift
// 用于确定初始化后总是有值的场景
let possibleString: String? = "可选字符串"
let assumedString: String! = "隐式解包可选字符串"

// 隐式解包可以直接使用,无需解包
let implicitString: String = assumedString  // 不需要 !

// 仍然可以当作普通可选类型使用
if assumedString != nil {
    print(assumedString!)
}

// 可选绑定
if let definiteString = assumedString {
    print(definiteString)
}

// 常见使用场景: IBOutlet
// @IBOutlet weak var nameLabel: UILabel!
```

## 集合类型

Swift 提供三种主要集合类型:数组、集合和字典。

### 数组 (Array)

有序的值列表:

```swift
// 创建数组
var shoppingList: [String] = ["鸡蛋", "牛奶"]
var numbers = [1, 2, 3, 4, 5]  // 类型推断为 [Int]

// 创建空数组
var emptyArray: [Int] = []
var anotherEmptyArray = [String]()

// 创建具有默认值的数组
var threeDoubles = Array(repeating: 0.0, count: 3)  // [0.0, 0.0, 0.0]

// 数组操作
shoppingList.append("面包")  // 添加元素
shoppingList += ["巧克力", "黄油"]  // 数组拼接

print("购物清单有 \(shoppingList.count) 项")
print("是否为空: \(shoppingList.isEmpty)")

// 访问和修改
let firstItem = shoppingList[0]  // "鸡蛋"
shoppingList[0] = "六个鸡蛋"

// 区间替换
shoppingList[1...3] = ["香蕉", "苹果"]

// 插入和删除
shoppingList.insert("枫糖浆", at: 0)
let removedItem = shoppingList.remove(at: 0)
let lastItem = shoppingList.removeLast()

// 遍历数组
for item in shoppingList {
    print(item)
}

// 需要索引时
for (index, item) in shoppingList.enumerated() {
    print("项目 \(index + 1): \(item)")
}

// 常用数组方法
let fruits = ["苹果", "香蕉", "橙子", "葡萄"]
print(fruits.first)  // Optional("苹果")
print(fruits.last)   // Optional("葡萄")
print(fruits.contains("香蕉"))  // true
print(fruits.sorted())  // 排序后的数组

// 过滤和映射
let evenNumbers = numbers.filter { $0 % 2 == 0 }  // [2, 4]
let squaredNumbers = numbers.map { $0 * $0 }  // [1, 4, 9, 16, 25]
let sum = numbers.reduce(0, +)  // 15
```

### 集合 (Set)

无序且唯一的值集合:

```swift
// 创建集合
var favoriteGenres: Set<String> = ["摇滚", "古典", "嘻哈"]
var numbers: Set = [1, 2, 3, 3, 2, 1]  // {1, 2, 3} - 自动去重

// 创建空集合
var emptySet = Set<String>()

// 集合操作
favoriteGenres.insert("爵士")
print("有 \(favoriteGenres.count) 种流派")

if let removed = favoriteGenres.remove("摇滚") {
    print("移除了 \(removed)")
}

print(favoriteGenres.contains("古典"))  // true

// 遍历集合(顺序不固定)
for genre in favoriteGenres {
    print(genre)
}

// 排序后遍历
for genre in favoriteGenres.sorted() {
    print(genre)
}

// 集合运算
let oddDigits: Set = [1, 3, 5, 7, 9]
let evenDigits: Set = [0, 2, 4, 6, 8]
let singleDigitPrimes: Set = [2, 3, 5, 7]

// 并集
let union = oddDigits.union(evenDigits).sorted()  // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// 交集
let intersection = oddDigits.intersection(singleDigitPrimes).sorted()  // [3, 5, 7]

// 差集
let difference = oddDigits.subtracting(singleDigitPrimes).sorted()  // [1, 9]

// 对称差集
let symmetricDiff = oddDigits.symmetricDifference(singleDigitPrimes).sorted()  // [1, 2, 9]

// 集合关系判断
let houseAnimals: Set = ["狗", "猫"]
let farmAnimals: Set = ["牛", "鸡", "羊", "狗", "猫"]
let cityAnimals: Set = ["鸟", "鼠"]

houseAnimals.isSubset(of: farmAnimals)  // true
farmAnimals.isSuperset(of: houseAnimals)  // true
farmAnimals.isDisjoint(with: cityAnimals)  // true
```

### 字典 (Dictionary)

键值对的无序集合:

```swift
// 创建字典
var airports: [String: String] = ["YYZ": "多伦多", "DUB": "都柏林"]
var scores = ["Alice": 95, "Bob": 87, "Charlie": 92]

// 创建空字典
var emptyDict: [String: Int] = [:]
var anotherEmptyDict = [String: String]()

// 字典操作
airports["LHR"] = "伦敦"  // 添加新键值对
print("有 \(airports.count) 个机场")

// 访问和修改
if let oldValue = airports.updateValue("都柏林国际机场", forKey: "DUB") {
    print("旧值是 \(oldValue)")
}

// 访问值(返回可选类型)
if let airportName = airports["DUB"] {
    print("机场名称: \(airportName)")
} else {
    print("机场不存在")
}

// 删除键值对
airports["LHR"] = nil  // 通过赋值 nil 删除
if let removed = airports.removeValue(forKey: "YYZ") {
    print("移除了 \(removed)")
}

// 遍历字典
for (airportCode, airportName) in airports {
    print("\(airportCode): \(airportName)")
}

// 只遍历键
for airportCode in airports.keys {
    print("机场代码: \(airportCode)")
}

// 只遍历值
for airportName in airports.values {
    print("机场名称: \(airportName)")
}

// 转换为数组
let airportCodes = [String](airports.keys)
let airportNames = [String](airports.values)

// 实用示例:计数器
var letterCounts: [Character: Int] = [:]
let text = "hello"

for letter in text {
    letterCounts[letter, default: 0] += 1
}
print(letterCounts)  // ["h": 1, "e": 1, "l": 2, "o": 1]

// 嵌套字典
var nestedDict: [String: [String: Int]] = [
    "水果": ["苹果": 10, "香蕉": 5],
    "蔬菜": ["番茄": 8, "黄瓜": 12]
]

if let fruitCount = nestedDict["水果"]?["苹果"] {
    print("苹果数量: \(fruitCount)")
}
```

## 元组 (Tuple)

将多个值组合成单一复合值:

```swift
// 创建元组
let httpError = (404, "Not Found")
let httpSuccess = (code: 200, message: "OK")

// 分解元组
let (statusCode, statusMessage) = httpError
print("状态码: \(statusCode)")  // 404
print("消息: \(statusMessage)")  // Not Found

// 忽略某些值
let (justTheCode, _) = httpError
print(justTheCode)  // 404

// 通过索引访问
print("状态码: \(httpError.0)")
print("消息: \(httpError.1)")

// 通过名称访问
print("状态码: \(httpSuccess.code)")
print("消息: \(httpSuccess.message)")

// 函数返回元组
func minMax(array: [Int]) -> (min: Int, max: Int)? {
    guard !array.isEmpty else { return nil }

    var currentMin = array[0]
    var currentMax = array[0]

    for value in array[1..<array.count] {
        if value < currentMin {
            currentMin = value
        } else if value > currentMax {
            currentMax = value
        }
    }

    return (currentMin, currentMax)
}

if let bounds = minMax(array: [8, -6, 2, 109, 3, 71]) {
    print("最小值: \(bounds.min), 最大值: \(bounds.max)")
}
```

## 总结

本文介绍了 Swift 的核心基础知识:

1. **变量与常量**: 使用 `let` 声明常量,`var` 声明变量,优先使用 `let`
2. **数据类型**: Int、Double、Bool、String、Character 等基本类型
3. **可选类型**: Swift 的安全特性,处理值可能缺失的情况
4. **可选绑定**: 使用 `if let` 和 `guard let` 安全解包
5. **集合类型**: Array(有序)、Set(唯一)、Dictionary(键值对)

掌握这些基础知识是学习 Swift 的重要第一步,为后续学习控制流、函数、闭包等高级特性打下坚实基础。

## 最佳实践

1. 优先使用 `let` 而非 `var`,提高代码安全性
2. 使用类型推断,让代码更简洁
3. 使用可选绑定而非强制解包,避免运行时崩溃
4. 选择合适的集合类型:需要顺序用 Array,需要唯一性用 Set,需要键值关联用 Dictionary
5. 利用 Swift 的类型安全特性,让编译器帮助发现错误
