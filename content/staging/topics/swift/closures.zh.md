---
title: Swift 闭包详解
description: 深入理解 Swift 闭包：闭包语法、尾随闭包、值捕获、逃逸闭包和自动闭包的完整指南
track: swift
section: basics
difficulty: intermediate
tags:
  - Swift
  - 闭包
  - 函数式编程
  - 逃逸闭包
  - 自动闭包
status: imported
origin: old/src/content/docs/swift/closures.zh.md
divergence: 0.174
issues:
  - missing-subcategory-en
legacy:
  category: Swift
  subcategory: 核心概念
  order: 10
  lastUpdated: 2026-01-07
---

闭包（Closure）是 Swift 中最强大且使用最广泛的特性之一。从简单的回调处理到复杂的函数式编程模式，闭包在现代 Swift 开发中无处不在。本文将从基础概念到高级应用，全面剖析 Swift 闭包的方方面面。

## 概念解释

### 什么是闭包

闭包是自包含的功能代码块，可以在代码中被传递和使用。更重要的是，闭包可以**捕获**并**存储**其所在上下文中任意常量和变量的引用。这种"记住"周围环境的能力，是闭包区别于普通函数的关键特性。

用通俗的话来说：**闭包是一段可以保存起来稍后执行的代码，它能够记住创建它时周围的变量，即使这些变量的原始作用域已经不存在**。

### 闭包的三种形式

Swift 中的闭包有三种形式，它们本质上是相同的，只是语法和使用场景不同：

```swift
// 1. 全局函数：有名字但不捕获任何值的闭包
func globalFunction() {
    print("我是一个全局函数")
}

// 2. 嵌套函数：有名字且能从其封闭函数捕获值的闭包
func outerFunction() -> () -> Int {
    var counter = 0

    func innerFunction() -> Int {
        counter += 1  // 捕获外部函数的变量
        return counter
    }

    return innerFunction
}

// 3. 闭包表达式：无名字的轻量级语法，能够从上下文中捕获值
let closure = { (name: String) -> String in
    return "你好，\(name)！"
}
```

### 闭包与函数的关系

在 Swift 中，**函数实际上是闭包的特殊形式**。函数和闭包都遵循相同的类型系统，可以相互替换使用：

```swift
// 函数类型定义
func addTwoNumbers(_ a: Int, _ b: Int) -> Int {
    return a + b
}

// 函数可以赋值给闭包类型的变量
let addition: (Int, Int) -> Int = addTwoNumbers
print(addition(3, 5))  // 输出: 8

// 闭包也可以作为函数参数传递
func calculate(_ a: Int, _ b: Int, operation: (Int, Int) -> Int) -> Int {
    return operation(a, b)
}

// 传递函数
let result1 = calculate(10, 5, operation: addTwoNumbers)

// 传递闭包
let result2 = calculate(10, 5, operation: { $0 - $1 })
```

### 历史背景

闭包的概念源自 lambda 演算，最早在 1960 年代的 Lisp 语言中实现。Swift 的闭包设计借鉴了多种现代语言的优秀特性：

- **Objective-C 的 Blocks**：Swift 闭包与之兼容，便于与 Cocoa 框架互操作
- **Ruby 和 Python 的语法糖**：简洁的尾随闭包语法
- **Haskell 的函数式特性**：强类型系统和闭包的函数式编程能力

## 核心原理

### 闭包表达式语法

闭包表达式的完整语法如下：

```swift
{ (参数列表) -> 返回类型 in
    闭包体
}
```

让我们通过排序示例逐步理解闭包的简化过程：

```swift
let names = ["张三", "李四", "王五", "赵六", "钱七"]

// 第一步：使用普通函数
func backward(_ s1: String, _ s2: String) -> Bool {
    return s1 > s2
}
var reversedNames = names.sorted(by: backward)

// 第二步：使用完整闭包表达式
reversedNames = names.sorted(by: { (s1: String, s2: String) -> Bool in
    return s1 > s2
})

// 第三步：类型推断（省略类型声明）
reversedNames = names.sorted(by: { s1, s2 in
    return s1 > s2
})

// 第四步：单表达式隐式返回（省略 return）
reversedNames = names.sorted(by: { s1, s2 in s1 > s2 })

// 第五步：参数名称缩写（使用 $0, $1）
reversedNames = names.sorted(by: { $0 > $1 })

// 第六步：运算符方法
reversedNames = names.sorted(by: >)
```

### 闭包的内存结构

从内存角度理解闭包，有助于我们更好地掌握其工作原理：

```swift
func makeIncrementer(incrementAmount: Int) -> () -> Int {
    var runningTotal = 0

    let incrementer: () -> Int = {
        runningTotal += incrementAmount
        return runningTotal
    }

    return incrementer
}
```

当这段代码执行时：

1. **闭包对象创建**：`incrementer` 闭包被创建时，Swift 会在堆上分配一个闭包对象
2. **捕获变量存储**：闭包对象包含对 `runningTotal` 和 `incrementAmount` 的引用
3. **引用保持**：即使 `makeIncrementer` 函数返回后，闭包仍然持有这些变量的引用
4. **独立副本**：每次调用 `makeIncrementer` 都会创建新的闭包，拥有独立的捕获变量

```swift
let incrementByTen = makeIncrementer(incrementAmount: 10)
print(incrementByTen())  // 10
print(incrementByTen())  // 20

let incrementByFive = makeIncrementer(incrementAmount: 5)
print(incrementByFive())  // 5
print(incrementByTen())   // 30 - 两个闭包独立维护各自的状态
```

### 闭包是引用类型

闭包是引用类型，这意味着当你将闭包赋值给变量时，实际上是创建了对同一闭包的引用：

```swift
let alsoIncrementByTen = incrementByTen
print(alsoIncrementByTen())  // 40 - 共享同一个闭包的状态
print(incrementByTen())      // 50 - 两者指向同一个闭包
```

### 捕获机制详解

闭包默认以**引用**方式捕获变量，这意味着闭包可以修改捕获的变量，且这些修改对外部可见：

```swift
var value = 10

let modifyClosure = {
    value += 5
    print("闭包内的值: \(value)")
}

modifyClosure()  // 输出: 闭包内的值: 15
print("外部的值: \(value)")  // 输出: 外部的值: 15
```

使用**捕获列表**可以改变捕获行为：

```swift
var counter = 0

// 值捕获：捕获创建时的值副本
let captureByValue = { [counter] in
    print("值捕获: \(counter)")  // 始终是 0
}

// 引用捕获：捕获变量的引用
let captureByReference = {
    print("引用捕获: \(counter)")  // 反映最新值
}

counter = 100

captureByValue()       // 输出: 值捕获: 0
captureByReference()   // 输出: 引用捕获: 100
```

## 核心要点

### 尾随闭包

当闭包是函数的最后一个参数时，可以使用尾随闭包语法，将闭包写在函数调用括号之后：

```swift
func performTask(delay: TimeInterval, completion: () -> Void) {
    print("延迟 \(delay) 秒执行任务...")
    completion()
}

// 普通写法
performTask(delay: 1.0, completion: {
    print("任务完成！")
})

// 尾随闭包写法
performTask(delay: 1.0) {
    print("任务完成！")
}

// 如果闭包是唯一参数，可以省略括号
func execute(action: () -> Void) {
    action()
}

execute {
    print("执行操作")
}
```

### 多尾随闭包（Swift 5.3+）

当函数有多个闭包参数时，可以使用多尾随闭包语法：

```swift
func loadData(
    onProgress: (Double) -> Void,
    onSuccess: (String) -> Void,
    onFailure: (Error) -> Void
) {
    onProgress(0.5)
    onProgress(1.0)
    onSuccess("数据加载成功")
}

// 使用多尾随闭包
loadData { progress in
    print("进度: \(progress * 100)%")
} onSuccess: { data in
    print(data)
} onFailure: { error in
    print("错误: \(error)")
}
```

### 逃逸闭包

当闭包在函数返回之后才被调用时，需要使用 `@escaping` 标记：

```swift
var completionHandlers: [() -> Void] = []

// 逃逸闭包：闭包被存储到函数外部
func addHandler(handler: @escaping () -> Void) {
    completionHandlers.append(handler)
}

// 非逃逸闭包：闭包在函数内部同步执行
func executeImmediately(handler: () -> Void) {
    handler()
}
```

逃逸闭包的常见场景：

```swift
// 场景1：异步操作
func downloadImage(
    from url: URL,
    completion: @escaping (Data?) -> Void
) {
    DispatchQueue.global().async {
        // 模拟下载
        let data = try? Data(contentsOf: url)
        DispatchQueue.main.async {
            completion(data)
        }
    }
}

// 场景2：存储闭包供后续使用
class Button {
    var tapHandler: (() -> Void)?

    func setTapHandler(_ handler: @escaping () -> Void) {
        tapHandler = handler
    }

    func simulateTap() {
        tapHandler?()
    }
}

// 场景3：延迟执行
func delayedExecution(
    delay: TimeInterval,
    action: @escaping () -> Void
) {
    DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
        action()
    }
}
```

### 自动闭包

`@autoclosure` 将表达式自动包装成闭包，实现延迟求值：

```swift
// 普通闭包
func logMessage(_ message: () -> String) {
    print("[LOG] \(message())")
}
logMessage({ return "这是一条日志" })

// 自动闭包 - 可以直接传递表达式
func logMessageAuto(_ message: @autoclosure () -> String) {
    print("[LOG] \(message())")
}
logMessageAuto("这是一条日志")  // 无需花括号
```

自动闭包的核心价值是**延迟求值**：

```swift
var customers = ["张三", "李四", "王五"]

// 使用自动闭包
func serveCustomer(provider: @autoclosure () -> String) {
    print("现在服务: \(provider())")
}

// 表达式在 provider() 被调用时才执行
serveCustomer(provider: customers.removeFirst())
// 此时 customers = ["李四", "王五"]
```

### 逃逸的自动闭包

自动闭包也可以是逃逸的：

```swift
var customerProviders: [() -> String] = []

func collectProviders(_ provider: @autoclosure @escaping () -> String) {
    customerProviders.append(provider)
}

var customers = ["张三", "李四", "王五"]

collectProviders(customers.removeFirst())
collectProviders(customers.removeFirst())

print("收集了 \(customerProviders.count) 个闭包")
print("customers 仍有 \(customers.count) 个元素")  // 仍是 3 个！

// 执行闭包时才真正移除元素
for provider in customerProviders {
    print("服务: \(provider())")
}
// 现在 customers 只剩 1 个元素
```

## 代码示例

### 示例1：高阶函数的闭包应用

```swift
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// map：转换数组元素
let doubled = numbers.map { $0 * 2 }
// [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

// filter：过滤数组元素
let evenNumbers = numbers.filter { $0 % 2 == 0 }
// [2, 4, 6, 8, 10]

// reduce：将数组元素合并为单个值
let sum = numbers.reduce(0) { $0 + $1 }
// 55

// 简化写法
let product = numbers.reduce(1, *)
// 3628800

// compactMap：转换并过滤 nil
let strings = ["1", "2", "abc", "3", "xyz"]
let validNumbers = strings.compactMap { Int($0) }
// [1, 2, 3]

// flatMap：扁平化嵌套数组
let nestedArrays = [[1, 2, 3], [4, 5], [6, 7, 8, 9]]
let flattened = nestedArrays.flatMap { $0 }
// [1, 2, 3, 4, 5, 6, 7, 8, 9]

// 链式调用
let result = numbers
    .filter { $0 % 2 == 0 }      // 筛选偶数
    .map { $0 * 3 }               // 乘以 3
    .reduce(0, +)                 // 求和
// (2+4+6+8+10) * 3 = 90
```

### 示例2：私有状态管理

```swift
func createBankAccount(initialBalance: Double) -> (
    deposit: (Double) -> Double,
    withdraw: (Double) -> Double?,
    balance: () -> Double
) {
    var balance = initialBalance

    let deposit: (Double) -> Double = { amount in
        balance += amount
        return balance
    }

    let withdraw: (Double) -> Double? = { amount in
        guard amount <= balance else {
            print("余额不足")
            return nil
        }
        balance -= amount
        return balance
    }

    let getBalance: () -> Double = {
        return balance
    }

    return (deposit, withdraw, getBalance)
}

let account = createBankAccount(initialBalance: 1000)
print(account.balance())        // 1000.0
print(account.deposit(500))     // 1500.0
print(account.withdraw(200)!)   // 1300.0
print(account.withdraw(2000))   // nil，输出"余额不足"
```

### 示例3：柯里化函数

```swift
// 普通函数
func add(_ a: Int, _ b: Int, _ c: Int) -> Int {
    return a + b + c
}

// 柯里化版本
func curriedAdd(_ a: Int) -> (Int) -> (Int) -> Int {
    return { b in
        return { c in
            return a + b + c
        }
    }
}

let addFive = curriedAdd(5)
let addFiveAndThree = addFive(3)
print(addFiveAndThree(2))  // 10

// 通用柯里化函数
func curry<A, B, C>(_ f: @escaping (A, B) -> C) -> (A) -> (B) -> C {
    return { a in { b in f(a, b) } }
}

func curry<A, B, C, D>(_ f: @escaping (A, B, C) -> D) -> (A) -> (B) -> (C) -> D {
    return { a in { b in { c in f(a, b, c) } } }
}

let curriedMultiply = curry { (a: Int, b: Int) in a * b }
let triple = curriedMultiply(3)
print(triple(4))  // 12
```

### 示例4：函数组合

```swift
// 定义组合运算符
infix operator >>>: AdditionPrecedence

func >>> <A, B, C>(
    lhs: @escaping (A) -> B,
    rhs: @escaping (B) -> C
) -> (A) -> C {
    return { a in rhs(lhs(a)) }
}

// 管道运算符
infix operator |>: AdditionPrecedence

func |> <A, B>(value: A, transform: (A) -> B) -> B {
    return transform(value)
}

// 使用示例
let addOne: (Int) -> Int = { $0 + 1 }
let double: (Int) -> Int = { $0 * 2 }
let toString: (Int) -> String = { "结果是 \($0)" }

// 函数组合
let combined = addOne >>> double >>> toString
print(combined(5))  // "结果是 12"

// 管道操作
let result = 5 |> addOne |> double |> toString
print(result)  // "结果是 12"
```

### 示例5：验证器模式

```swift
struct Validator<T> {
    let validate: (T) -> Bool
    let errorMessage: String
}

extension Validator where T == String {
    static let notEmpty = Validator(
        validate: { !$0.isEmpty },
        errorMessage: "不能为空"
    )

    static let email = Validator(
        validate: { $0.contains("@") && $0.contains(".") },
        errorMessage: "无效的邮箱格式"
    )

    static func minLength(_ length: Int) -> Validator {
        Validator(
            validate: { $0.count >= length },
            errorMessage: "至少需要 \(length) 个字符"
        )
    }

    static func maxLength(_ length: Int) -> Validator {
        Validator(
            validate: { $0.count <= length },
            errorMessage: "最多 \(length) 个字符"
        )
    }

    static func regex(_ pattern: String, message: String) -> Validator {
        Validator(
            validate: { input in
                guard let regex = try? NSRegularExpression(pattern: pattern) else {
                    return false
                }
                let range = NSRange(input.startIndex..., in: input)
                return regex.firstMatch(in: input, range: range) != nil
            },
            errorMessage: message
        )
    }
}

func validate<T>(_ value: T, with validators: [Validator<T>]) -> [String] {
    return validators
        .filter { !$0.validate(value) }
        .map { $0.errorMessage }
}

// 使用
let password = "abc"
let errors = validate(password, with: [
    .notEmpty,
    .minLength(8),
    .regex(".*[0-9].*", message: "必须包含数字")
])
print(errors)  // ["至少需要 8 个字符", "必须包含数字"]
```

## 最佳实践

### 合理选择闭包简写程度

```swift
let numbers = [1, 2, 3, 4, 5]

// 推荐：简单操作使用简写
let doubled = numbers.map { $0 * 2 }

// 推荐：复杂操作使用命名参数
let processed = numbers.filter { number in
    let isEven = number % 2 == 0
    let isGreaterThanTwo = number > 2
    return isEven && isGreaterThanTwo
}

// 不推荐：过于复杂的单行闭包
// let result = data.map { $0.components(separatedBy: ",").compactMap { Int($0.trimmingCharacters(in: .whitespaces)) }.reduce(0, +) }

// 推荐：拆分为多行或使用命名参数
let result = data.map { line in
    let components = line.components(separatedBy: ",")
    let numbers = components.compactMap { Int($0.trimmingCharacters(in: .whitespaces)) }
    return numbers.reduce(0, +)
}
```

### 使用类型别名提高可读性

```swift
// 定义类型别名
typealias DataCompletion<T> = (Result<T, Error>) -> Void
typealias ProgressHandler = (Double) -> Void
typealias Transformer<Input, Output> = (Input) -> Output

// 使用类型别名
func fetchData<T: Decodable>(
    from url: URL,
    progress: ProgressHandler?,
    completion: @escaping DataCompletion<T>
) {
    // 实现...
}
```

### 正确处理逃逸闭包中的 self

```swift
class DataLoader {
    var data: [String] = []
    var onDataLoaded: (() -> Void)?

    // 方式1：使用 [weak self]（推荐用于大多数场景）
    func loadData() {
        DispatchQueue.global().async { [weak self] in
            guard let self = self else { return }
            self.data = ["项目1", "项目2"]

            DispatchQueue.main.async { [weak self] in
                self?.onDataLoaded?()
            }
        }
    }

    // 方式2：使用 [unowned self]（确保 self 不会先于闭包释放时使用）
    func setupHandler() {
        // 只有当你确定 self 的生命周期长于闭包时才使用 unowned
        onDataLoaded = { [unowned self] in
            print("数据数量: \(self.data.count)")
        }
    }

    deinit {
        print("DataLoader 被释放")
    }
}
```

### 优先使用非逃逸闭包

非逃逸闭包有更好的性能和更简洁的语法：

```swift
// 非逃逸闭包（默认）
func process(data: [Int], transform: (Int) -> Int) -> [Int] {
    return data.map(transform)
}

// 非逃逸闭包可以隐式引用 self
class Calculator {
    var multiplier = 2

    func calculate(_ values: [Int]) -> [Int] {
        return process(data: values) { value in
            value * multiplier  // 无需 self.multiplier
        }
    }
}

// 只在必要时使用逃逸闭包
func processAsync(data: [Int], completion: @escaping ([Int]) -> Void) {
    DispatchQueue.global().async {
        let result = data.map { $0 * 2 }
        DispatchQueue.main.async {
            completion(result)
        }
    }
}
```

### 谨慎使用自动闭包

```swift
// 适合使用自动闭包的场景：延迟求值
func assertCondition(
    _ condition: @autoclosure () -> Bool,
    message: @autoclosure () -> String = "断言失败",
    file: String = #file,
    line: Int = #line
) {
    #if DEBUG
    if !condition() {
        print("\(message()) at \(file):\(line)")
    }
    #endif
}

assertCondition(array.count > 0, message: "数组不能为空")

// 不推荐：让调用者困惑的自动闭包
func doSomething(action: @autoclosure () -> Void) {
    action()
}

// 调用者可能不知道这是延迟执行
doSomething(action: print("这会执行吗？"))
```

## 常见陷阱

### 循环引用

这是闭包使用中最常见的问题：

```swift
class ViewController {
    var name = "主页"
    var completionHandler: (() -> Void)?

    func setupHandler() {
        // 错误：创建循环引用
        // self -> completionHandler -> 闭包 -> self
        completionHandler = {
            print(self.name)
        }
    }

    // 正确做法
    func setupHandlerCorrectly() {
        completionHandler = { [weak self] in
            guard let self = self else { return }
            print(self.name)
        }
    }

    deinit {
        print("ViewController 被释放")
    }
}

// 测试
var vc: ViewController? = ViewController()
vc?.setupHandler()
vc = nil  // 不会打印 deinit，因为存在循环引用

var vc2: ViewController? = ViewController()
vc2?.setupHandlerCorrectly()
vc2 = nil  // 会打印 "ViewController 被释放"
```

### 意外的值捕获

```swift
var multiplier = 2

// 闭包捕获的是变量的引用，不是值
let multiply = { (value: Int) -> Int in
    return value * multiplier
}

print(multiply(5))  // 10

multiplier = 10
print(multiply(5))  // 50，而不是 10！

// 如需捕获当前值，使用捕获列表
let multiplyFixed = { [multiplier] (value: Int) -> Int in
    return value * multiplier
}

multiplier = 20
print(multiplyFixed(5))  // 50，使用的是捕获时的值 10
```

### 循环中的闭包陷阱

```swift
var closures: [() -> Int] = []

// 错误：所有闭包都捕获同一个变量
for i in 0..<5 {
    closures.append {
        return i
    }
}

// 全部输出 5
for closure in closures {
    print(closure())
}

// 正确做法1：使用捕获列表
closures = []
for i in 0..<5 {
    closures.append { [i] in
        return i
    }
}

// 正确做法2：使用 map
closures = (0..<5).map { i in
    return { i }
}

// 输出 0, 1, 2, 3, 4
for closure in closures {
    print(closure())
}
```

### 逃逸闭包中忘记使用 self

```swift
class DataManager {
    var items: [String] = []

    func fetchItems(completion: @escaping () -> Void) {
        DispatchQueue.global().async {
            // 编译错误：逃逸闭包中必须显式使用 self
            // items.append("新项目")

            // 正确
            self.items.append("新项目")

            DispatchQueue.main.async {
                completion()
            }
        }
    }

    // 使用 [weak self] 时的常见错误
    func fetchItemsSafely(completion: @escaping () -> Void) {
        DispatchQueue.global().async { [weak self] in
            // 错误：多次使用可选链可能导致不一致
            // self?.items.append("项目1")
            // self?.items.append("项目2")  // 如果 self 在上一行后被释放

            // 正确：先解包
            guard let self = self else { return }
            self.items.append("项目1")
            self.items.append("项目2")

            DispatchQueue.main.async { [weak self] in
                self?.notifyUpdate()
                completion()
            }
        }
    }

    func notifyUpdate() {
        print("更新完成，共 \(items.count) 项")
    }
}
```

### 闭包的副作用

```swift
var sideEffectValue = 0

// 这个闭包有副作用
let closureWithSideEffect = { (x: Int) -> Int in
    sideEffectValue += 1  // 副作用！
    return x * 2
}

// 在函数式编程中，副作用可能导致难以追踪的 bug
let results = [1, 2, 3].map(closureWithSideEffect)
print(sideEffectValue)  // 3

// 纯函数（无副作用）更安全
let pureClosure = { (x: Int) -> Int in
    return x * 2  // 无副作用
}
```

## 性能考量

### 闭包 vs 函数性能

在大多数情况下，闭包和函数的性能差异可以忽略不计。但在热点代码路径中，了解它们的区别很重要：

```swift
// 内联函数通常更快
@inline(__always)
func inlineAdd(_ a: Int, _ b: Int) -> Int {
    return a + b
}

// 闭包可能无法被内联
let closureAdd = { (a: Int, b: Int) -> Int in
    return a + b
}

// 性能测试
let iterations = 10_000_000

// 直接函数调用
let start1 = CFAbsoluteTimeGetCurrent()
for i in 0..<iterations {
    _ = inlineAdd(i, i)
}
let time1 = CFAbsoluteTimeGetCurrent() - start1

// 闭包调用
let start2 = CFAbsoluteTimeGetCurrent()
for i in 0..<iterations {
    _ = closureAdd(i, i)
}
let time2 = CFAbsoluteTimeGetCurrent() - start2

print("函数: \(time1)s, 闭包: \(time2)s")
```

### 避免不必要的捕获

```swift
class HeavyObject {
    let data = Array(repeating: 0, count: 1_000_000)
}

// 不好：捕获整个对象
func badExample(obj: HeavyObject) -> () -> Int {
    return {
        return obj.data.count  // 捕获整个 obj
    }
}

// 好：只捕获需要的值
func goodExample(obj: HeavyObject) -> () -> Int {
    let count = obj.data.count
    return {
        return count  // 只捕获一个 Int
    }
}
```

### 使用 @noescape 优化（Swift 3 之前）

在 Swift 3+ 中，闭包参数默认是非逃逸的，编译器会自动优化。但理解其原理仍然重要：

```swift
// 非逃逸闭包的优势：
// 1. 无需引用计数操作
// 2. 可以使用栈分配
// 3. 可以被内联优化

func performOperation(value: Int, operation: (Int) -> Int) -> Int {
    return operation(value)  // 闭包在函数返回前执行完毕
}

// 编译器可以将上面的调用优化为直接内联
let result = performOperation(value: 5) { $0 * 2 }
// 可能被优化为：let result = 5 * 2
```

### 惰性初始化中的闭包

```swift
class Configuration {
    // 使用闭包进行惰性初始化
    lazy var settings: [String: Any] = {
        print("正在加载设置...")
        // 复杂的初始化逻辑
        return ["theme": "dark", "fontSize": 14]
    }()

    // 注意：lazy 属性中的闭包不会造成循环引用
    // 因为闭包在执行后就会被释放
    lazy var description: String = { [unowned self] in
        return "配置对象: \(self.settings)"
    }()
}

let config = Configuration()
// 此时 settings 还未初始化

print(config.settings)  // 触发初始化，输出"正在加载设置..."
print(config.settings)  // 直接返回缓存的值
```

### 记忆化优化

```swift
// 记忆化函数：缓存计算结果
func memoize<Input: Hashable, Output>(
    _ function: @escaping (Input) -> Output
) -> (Input) -> Output {
    var cache: [Input: Output] = [:]

    return { input in
        if let cached = cache[input] {
            return cached
        }
        let result = function(input)
        cache[input] = result
        return result
    }
}

// 使用记忆化优化递归
func makeMemoizedFibonacci() -> (Int) -> Int {
    var memo: [Int: Int] = [:]

    func fib(_ n: Int) -> Int {
        if let cached = memo[n] {
            return cached
        }

        let result: Int
        if n <= 1 {
            result = n
        } else {
            result = fib(n - 1) + fib(n - 2)
        }

        memo[n] = result
        return result
    }

    return fib
}

let fibonacci = makeMemoizedFibonacci()
print(fibonacci(50))  // 快速计算，不会栈溢出
```

## 实战场景

### 场景1：网络请求封装

```swift
import Foundation

enum NetworkError: Error {
    case invalidURL
    case noData
    case decodingError
    case serverError(Int)
}

class APIClient {
    static let shared = APIClient()
    private init() {}

    typealias DataCompletion<T> = (Result<T, NetworkError>) -> Void

    func request<T: Decodable>(
        url: String,
        method: String = "GET",
        body: Encodable? = nil,
        completion: @escaping DataCompletion<T>
    ) {
        guard let url = URL(string: url) else {
            completion(.failure(.invalidURL))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = method

        if let body = body {
            request.httpBody = try? JSONEncoder().encode(body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let httpResponse = response as? HTTPURLResponse,
                   httpResponse.statusCode >= 400 {
                    completion(.failure(.serverError(httpResponse.statusCode)))
                    return
                }

                guard let data = data else {
                    completion(.failure(.noData))
                    return
                }

                do {
                    let decoded = try JSONDecoder().decode(T.self, from: data)
                    completion(.success(decoded))
                } catch {
                    completion(.failure(.decodingError))
                }
            }
        }.resume()
    }
}

// 使用示例
struct User: Codable {
    let id: Int
    let name: String
    let email: String
}

APIClient.shared.request(url: "https://api.example.com/users/1") {
    (result: Result<User, NetworkError>) in
    switch result {
    case .success(let user):
        print("用户: \(user.name)")
    case .failure(let error):
        print("错误: \(error)")
    }
}
```

### 场景2：事件总线实现

```swift
class EventBus {
    static let shared = EventBus()
    private init() {}

    private var listeners: [String: [(Any) -> Void]] = [:]

    func on<T>(_ event: String, handler: @escaping (T) -> Void) -> () -> Void {
        let wrapper: (Any) -> Void = { data in
            if let typedData = data as? T {
                handler(typedData)
            }
        }

        if listeners[event] == nil {
            listeners[event] = []
        }
        listeners[event]?.append(wrapper)

        // 返回取消订阅函数
        let index = (listeners[event]?.count ?? 1) - 1
        return { [weak self] in
            self?.listeners[event]?.remove(at: index)
        }
    }

    func emit<T>(_ event: String, data: T) {
        listeners[event]?.forEach { handler in
            handler(data)
        }
    }

    func removeAllListeners(for event: String) {
        listeners[event] = nil
    }
}

// 使用示例
struct UserLoggedIn {
    let userId: String
    let timestamp: Date
}

let unsubscribe = EventBus.shared.on("user.loggedIn") { (event: UserLoggedIn) in
    print("用户 \(event.userId) 于 \(event.timestamp) 登录")
}

EventBus.shared.emit("user.loggedIn", data: UserLoggedIn(
    userId: "user123",
    timestamp: Date()
))

// 取消订阅
unsubscribe()
```

### 场景3：链式 Builder 模式

```swift
class RequestBuilder {
    private var url: String = ""
    private var method: String = "GET"
    private var headers: [String: String] = [:]
    private var body: Data?
    private var timeout: TimeInterval = 30

    func setURL(_ url: String) -> RequestBuilder {
        self.url = url
        return self
    }

    func setMethod(_ method: String) -> RequestBuilder {
        self.method = method
        return self
    }

    func addHeader(_ key: String, value: String) -> RequestBuilder {
        self.headers[key] = value
        return self
    }

    func setBody(_ body: Data) -> RequestBuilder {
        self.body = body
        return self
    }

    func setTimeout(_ timeout: TimeInterval) -> RequestBuilder {
        self.timeout = timeout
        return self
    }

    func build() -> URLRequest? {
        guard let url = URL(string: self.url) else { return nil }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        request.timeoutInterval = timeout

        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }

        return request
    }

    // 使用闭包配置
    static func configure(_ configuration: (RequestBuilder) -> Void) -> URLRequest? {
        let builder = RequestBuilder()
        configuration(builder)
        return builder.build()
    }
}

// 使用示例
let request = RequestBuilder.configure { builder in
    _ = builder
        .setURL("https://api.example.com/data")
        .setMethod("POST")
        .addHeader("Content-Type", value: "application/json")
        .addHeader("Authorization", value: "Bearer token123")
        .setTimeout(60)
}
```

### 场景4：防抖和节流

```swift
// 防抖：在一段时间内只执行最后一次
func debounce<T>(
    delay: TimeInterval,
    action: @escaping (T) -> Void
) -> (T) -> Void {
    var workItem: DispatchWorkItem?

    return { value in
        workItem?.cancel()

        workItem = DispatchWorkItem {
            action(value)
        }

        DispatchQueue.main.asyncAfter(
            deadline: .now() + delay,
            execute: workItem!
        )
    }
}

// 节流：在一段时间内最多执行一次
func throttle<T>(
    interval: TimeInterval,
    action: @escaping (T) -> Void
) -> (T) -> Void {
    var lastExecutionTime: Date?
    var pendingValue: T?
    var workItem: DispatchWorkItem?

    return { value in
        pendingValue = value

        let now = Date()

        if let lastTime = lastExecutionTime,
           now.timeIntervalSince(lastTime) < interval {
            // 在间隔内，设置延迟执行
            workItem?.cancel()

            let remainingTime = interval - now.timeIntervalSince(lastTime)
            workItem = DispatchWorkItem {
                if let value = pendingValue {
                    action(value)
                    lastExecutionTime = Date()
                    pendingValue = nil
                }
            }

            DispatchQueue.main.asyncAfter(
                deadline: .now() + remainingTime,
                execute: workItem!
            )
        } else {
            // 超出间隔，立即执行
            action(value)
            lastExecutionTime = now
            pendingValue = nil
        }
    }
}

// 使用示例
let debouncedSearch = debounce(delay: 0.3) { (query: String) in
    print("搜索: \(query)")
}

// 快速调用多次，只有最后一次会执行
debouncedSearch("S")
debouncedSearch("Sw")
debouncedSearch("Swi")
debouncedSearch("Swift")  // 只有这次会执行

let throttledUpdate = throttle(interval: 1.0) { (position: CGPoint) in
    print("更新位置: \(position)")
}

// 频繁调用，但每秒最多执行一次
for i in 0..<100 {
    throttledUpdate(CGPoint(x: i, y: i))
}
```

### 场景5：状态机

```swift
enum AppState {
    case idle
    case loading
    case loaded(data: [String])
    case error(Error)
}

class StateMachine<State> {
    private(set) var currentState: State
    private var observers: [(State, State) -> Void] = []

    init(initialState: State) {
        self.currentState = initialState
    }

    func transition(to newState: State) {
        let oldState = currentState
        currentState = newState

        observers.forEach { observer in
            observer(oldState, newState)
        }
    }

    func observe(_ handler: @escaping (State, State) -> Void) {
        observers.append(handler)
    }

    // 条件转换
    func transition<T>(
        to newState: State,
        if condition: @autoclosure () -> Bool,
        then action: @escaping (State) -> T
    ) -> T? {
        guard condition() else { return nil }
        transition(to: newState)
        return action(newState)
    }
}

// 使用示例
let stateMachine = StateMachine<AppState>(initialState: .idle)

stateMachine.observe { oldState, newState in
    print("状态变化: \(oldState) -> \(newState)")
}

stateMachine.transition(to: .loading)
stateMachine.transition(to: .loaded(data: ["项目1", "项目2"]))
```

## 面试要点

### 什么是闭包？与函数有什么区别？

**标准答案：**
闭包是自包含的功能代码块，可以捕获和存储其所在上下文中的常量和变量。Swift 中函数实际上是闭包的特殊形式。主要区别在于：
- 函数有名字，闭包通常是匿名的
- 函数通常在模块级别定义，闭包通常内联定义
- 闭包有更灵活的语法糖（尾随闭包、参数简写等）

### 解释逃逸闭包和非逃逸闭包

**标准答案：**
- **非逃逸闭包**（默认）：闭包在函数返回之前执行完毕
- **逃逸闭包**（`@escaping`）：闭包可能在函数返回之后执行，通常用于异步操作或存储闭包

```swift
// 非逃逸：同步执行
func syncOperation(closure: () -> Void) {
    closure()
}

// 逃逸：异步执行
func asyncOperation(closure: @escaping () -> Void) {
    DispatchQueue.main.async {
        closure()
    }
}
```

### 如何避免闭包中的循环引用？

**标准答案：**
使用捕获列表：
- `[weak self]`：self 变为可选类型，可能为 nil
- `[unowned self]`：假设 self 不会为 nil，如果为 nil 会崩溃

```swift
// weak self - 大多数情况的首选
someAsyncOperation { [weak self] in
    guard let self = self else { return }
    self.doSomething()
}

// unowned self - 确保 self 生命周期更长时使用
button.tapHandler = { [unowned self] in
    self.handleTap()
}
```

### 什么是自动闭包？有什么用途？

**标准答案：**
`@autoclosure` 将表达式自动包装成闭包，主要用于：
- 延迟求值（表达式直到调用时才执行）
- 简化调用语法（无需写闭包花括号）

典型应用：`assert`、`??` 运算符、日志函数

```swift
func log(_ message: @autoclosure () -> String) {
    #if DEBUG
    print(message())  // 只在 DEBUG 时执行
    #endif
}

log(expensiveComputation())  // 生产环境不会执行
```

### 闭包捕获值是捕获引用还是值？

**标准答案：**
默认情况下，闭包以**引用**方式捕获变量，这意味着：
- 闭包可以修改捕获的变量
- 变量的后续变化对闭包可见

使用捕获列表 `[value]` 可以改为**值捕获**（复制当前值）。

### 编程题：实现 curry 函数

```swift
func curry<A, B, C>(_ f: @escaping (A, B) -> C) -> (A) -> (B) -> C {
    return { a in
        return { b in
            return f(a, b)
        }
    }
}

// 测试
func add(_ a: Int, _ b: Int) -> Int { a + b }
let curriedAdd = curry(add)
let addFive = curriedAdd(5)
print(addFive(3))  // 8
```

### 编程题：实现 memoize 函数

```swift
func memoize<Input: Hashable, Output>(
    _ function: @escaping (Input) -> Output
) -> (Input) -> Output {
    var cache: [Input: Output] = [:]

    return { input in
        if let cached = cache[input] {
            return cached
        }
        let result = function(input)
        cache[input] = result
        return result
    }
}

// 测试
let slowSquare = memoize { (n: Int) -> Int in
    print("计算 \(n) 的平方...")
    return n * n
}

print(slowSquare(5))  // 计算 5 的平方... 25
print(slowSquare(5))  // 25（直接返回缓存）
```

### 分析以下代码的输出

```swift
var funcs: [() -> Int] = []

for i in 0..<3 {
    funcs.append { i }
}

for f in funcs {
    print(f())
}
```

**答案：** 输出 0, 1, 2。在 Swift 中，`for` 循环的循环变量在每次迭代中都是新的常量，所以每个闭包捕获的是不同的值。

（注意：这与某些其他语言不同，如 JavaScript 使用 `var` 时会输出 3, 3, 3）

## 延伸阅读

### 官方文档
- [The Swift Programming Language - Closures](https://docs.swift.org/swift-book/LanguageGuide/Closures.html)
- [Swift Standard Library - Higher-Order Functions](https://developer.apple.com/documentation/swift/array)

### 推荐书籍
- 《Swift 进阶》（Advanced Swift）- objc.io 著
- 《函数式 Swift》（Functional Swift）- objc.io 著
- 《Swift in Depth》- Tjeerd in 't Veen 著

### 相关概念
- **函数式编程**：闭包是函数式编程的核心概念
- **高阶函数**：接受或返回函数的函数，如 `map`、`filter`、`reduce`
- **内存管理（ARC）**：理解闭包的内存管理对于避免内存泄漏至关重要
- **Swift Concurrency**：`async/await` 与闭包的结合使用

### 进阶主题
- **响应式编程**：Combine 框架大量使用闭包
- **SwiftUI**：视图修饰符和手势处理中的闭包
- **Property Wrappers**：`@State`、`@Binding` 等的闭包应用

### 社区资源
- [Swift by Sundell - Closures](https://www.swiftbysundell.com/basics/closures/)
- [Hacking with Swift - Closures](https://www.hackingwithswift.com/sixty/6/1/creating-basic-closures)
- [Ray Wenderlich - Swift Closures Tutorial](https://www.raywenderlich.com/)
