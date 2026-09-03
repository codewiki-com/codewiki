---
title: Swift 属性包装器完全指南
description: 深入理解 Swift 属性包装器的原理、使用方法、SwiftUI 集成和自定义包装器设计，掌握这一强大的元编程特性
track: swift
section: optionals-protocols
difficulty: intermediate
tags:
  - Swift
  - 属性包装器
  - Property Wrapper
  - SwiftUI
  - 元编程
status: imported
origin: old/src/content/docs/swift/property-wrappers.zh.md
divergence: 0.42
issues:
  - divergent
legacy:
  category: Swift
  subcategory: 高级特性
  order: 11
  lastUpdated: 2026-01-07
---

属性包装器（Property Wrapper）是 Swift 5.1 引入的强大特性，它允许你在属性的存储和定义之间添加一层分离的代码。通过属性包装器，你可以将重复的属性逻辑抽象出来，实现代码复用，让属性定义更加简洁和表达性强。SwiftUI 的状态管理机制正是建立在属性包装器之上。

## 概念解释

### 什么是属性包装器

属性包装器本质上是一个使用 `@propertyWrapper` 标记的类型（结构体、类或枚举），它通过包装另一个值来为属性添加行为。属性包装器将属性的存储方式与定义属性的代码分离，使得相同的逻辑可以在多个属性之间复用。

```swift
// 定义一个属性包装器
@propertyWrapper
struct TwelveOrLess {
    private var number = 0

    var wrappedValue: Int {
        get { return number }
        set { number = min(newValue, 12) }
    }
}

// 使用属性包装器
struct SmallRectangle {
    @TwelveOrLess var height: Int
    @TwelveOrLess var width: Int
}

var rectangle = SmallRectangle()
rectangle.height = 24
print(rectangle.height) // 12（被限制为最大值12）
```

### 历史背景与设计动机

在属性包装器出现之前，Swift 开发者需要依赖以下方式实现类似功能：

1. **计算属性 + 私有存储属性**：需要为每个属性编写重复的 getter/setter 逻辑
2. **Key-Value Observing (KVO)**：仅限于 Objective-C 兼容的类，且语法繁琐
3. **自定义类型封装**：增加了使用复杂度，破坏了属性的直观语义

属性包装器的引入解决了这些问题，提供了一种声明式的、可复用的属性行为定义方式。

### 解决的核心问题

1. **代码复用**：相同的属性逻辑可以在多个属性和类型之间共享
2. **关注点分离**：属性的业务含义与存储/访问逻辑分离
3. **声明式编程**：使用简洁的 `@Wrapper` 语法，代码意图一目了然
4. **SwiftUI 状态管理**：为 SwiftUI 的响应式编程模型提供了基础设施

## 核心原理

### @propertyWrapper 属性

`@propertyWrapper` 是一个编译器属性，它告诉 Swift 编译器该类型可以作为属性包装器使用。被标记的类型必须满足以下要求：

1. **必须是结构体、类或枚举**
2. **必须有一个名为 `wrappedValue` 的实例属性**

```swift
@propertyWrapper
struct Wrapper<Value> {
    var wrappedValue: Value

    init(wrappedValue: Value) {
        self.wrappedValue = wrappedValue
    }
}
```

### wrappedValue 机制

`wrappedValue` 是属性包装器的核心，它定义了被包装属性的实际存储和访问方式。当你访问或修改被包装的属性时，实际上是在访问或修改 `wrappedValue`。

```swift
@propertyWrapper
struct Capitalized {
    private var value: String = ""

    var wrappedValue: String {
        get { value }
        set { value = newValue.capitalized }
    }

    init(wrappedValue: String) {
        self.wrappedValue = wrappedValue
    }
}

struct Person {
    @Capitalized var name: String
}

// 编译器展开后等价于：
struct Person_Expanded {
    private var _name = Capitalized(wrappedValue: "")

    var name: String {
        get { _name.wrappedValue }
        set { _name.wrappedValue = newValue }
    }
}
```

### projectedValue 投影值

除了 `wrappedValue`，属性包装器还可以通过 `projectedValue` 提供额外的功能。投影值通过在属性名前加 `$` 符号访问。

```swift
@propertyWrapper
struct SmallNumber {
    private var maximum: Int
    private var number: Int

    var wrappedValue: Int {
        get { return number }
        set { number = min(newValue, maximum) }
    }

    // 投影值暴露该值是否被截断
    var projectedValue: Bool {
        return number == maximum
    }

    init(wrappedValue: Int, maximum: Int = 12) {
        self.maximum = maximum
        self.number = min(wrappedValue, maximum)
    }
}

struct SomeStructure {
    @SmallNumber(maximum: 10) var someNumber: Int = 0
}

var s = SomeStructure()
s.someNumber = 55
print(s.someNumber)  // 10
print(s.$someNumber) // true（值被截断了）
```

### 编译器转换过程

当编译器遇到属性包装器时，会进行以下转换：

```swift
// 原始代码
struct MyStruct {
    @Logged("count") var count: Int = 0
}

// 编译器转换后
struct MyStruct {
    private var _count: Logged<Int>

    var count: Int {
        get { _count.wrappedValue }
        set { _count.wrappedValue = newValue }
    }

    var $count: /* projectedValue 的类型 */ {
        get { _count.projectedValue }
        // 如果 projectedValue 是可变的，还会有 set
    }

    init() {
        _count = Logged(wrappedValue: 0, "count")
    }
}
```

### 初始化器规则

属性包装器支持多种初始化方式，编译器会根据使用方式选择合适的初始化器：

```swift
@propertyWrapper
struct Clamped<Value: Comparable> {
    private var value: Value
    private let range: ClosedRange<Value>

    var wrappedValue: Value {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }

    // 初始化器 1：带初始值和范围
    init(wrappedValue: Value, _ range: ClosedRange<Value>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }

    // 初始化器 2：仅带范围（需要默认值）
    init(_ range: ClosedRange<Value>) where Value: ExpressibleByIntegerLiteral {
        self.range = range
        self.value = range.lowerBound
    }
}

struct GameCharacter {
    // 使用初始化器 1：@Clamped(wrappedValue: 100, 0...100)
    @Clamped(0...100) var health: Int = 100

    // 使用初始化器 2：@Clamped(0...10)
    @Clamped(0...10) var level: Int
}
```

## 核心要点

### 属性包装器三要素

| 要素 | 说明 | 访问方式 |
|------|------|----------|
| `wrappedValue` | 被包装属性的实际值 | 直接通过属性名访问 |
| `projectedValue` | 包装器暴露的额外信息或功能 | 通过 `$` 前缀访问 |
| 包装器实例 | 包装器本身（私有） | 通过 `_` 前缀访问（仅在类型内部） |

### SwiftUI 内置属性包装器

| 包装器 | 用途 | 数据所有权 |
|--------|------|-----------|
| `@State` | 视图内部的简单状态 | 视图拥有 |
| `@Binding` | 对外部状态的双向绑定 | 外部拥有 |
| `@StateObject` | 视图创建的可观察对象 | 视图拥有 |
| `@ObservedObject` | 外部传入的可观察对象 | 外部拥有 |
| `@EnvironmentObject` | 环境中共享的可观察对象 | 环境拥有 |
| `@Environment` | 系统或自定义环境值 | 系统/父视图 |
| `@AppStorage` | UserDefaults 持久化 | UserDefaults |
| `@SceneStorage` | 场景级别状态恢复 | 系统 |
| `@FocusState` | 焦点状态管理 | 视图管理 |
| `@Published` | 触发 ObservableObject 更新 | 对象拥有 |

### projectedValue 常见类型

| 场景 | projectedValue 类型 | 示例 |
|------|---------------------|------|
| 双向绑定 | `Binding<Value>` | `@State`, `@AppStorage` |
| 状态信息 | `Bool` 或自定义类型 | 验证结果、截断标志 |
| 包装器本身 | `Self` | 提供额外方法调用 |
| Publisher | `Publisher` | Combine 集成 |

### 属性包装器与类型关系

```swift
// 属性包装器可以用于：
struct Example {
    // 1. 结构体属性
    @Wrapper var structProperty: Int

    // 2. 类属性
    // class ClassExample { @Wrapper var property: Int }

    // 3. 全局变量（有限制）
    // @Wrapper var globalVar: Int = 0

    // 4. 局部变量
    func test() {
        @Wrapper var localVar: Int = 0
        // 使用 localVar
    }
}

// 不能用于：
// 1. 计算属性
// 2. lazy 属性
// 3. @NSCopying, @NSManaged 等属性
// 4. 协议要求的属性（可以在实现中使用）
// 5. 属性观察器（willSet/didSet）与包装器不能同时使用
```

## 代码示例

### 基础示例：值限制包装器

```swift
@propertyWrapper
struct Clamped<Value: Comparable> {
    var value: Value
    let range: ClosedRange<Value>

    var wrappedValue: Value {
        get { value }
        set { value = min(max(range.lowerBound, newValue), range.upperBound) }
    }

    init(wrappedValue: Value, _ range: ClosedRange<Value>) {
        self.range = range
        self.value = min(max(range.lowerBound, wrappedValue), range.upperBound)
    }
}

struct ColorComponents {
    @Clamped(0.0...1.0) var red: Double = 0
    @Clamped(0.0...1.0) var green: Double = 0
    @Clamped(0.0...1.0) var blue: Double = 0
    @Clamped(0.0...1.0) var alpha: Double = 1
}

var color = ColorComponents()
color.red = 1.5   // 被限制为 1.0
color.green = -0.5 // 被限制为 0.0
print(color.red, color.green) // 1.0 0.0
```

### UserDefaults 包装器

```swift
@propertyWrapper
struct UserDefault<Value> {
    let key: String
    let defaultValue: Value
    let container: UserDefaults

    var wrappedValue: Value {
        get {
            container.object(forKey: key) as? Value ?? defaultValue
        }
        set {
            container.set(newValue, forKey: key)
        }
    }

    var projectedValue: Binding<Value> {
        Binding(
            get: { wrappedValue },
            set: { wrappedValue = $0 }
        )
    }

    init(wrappedValue: Value, _ key: String, container: UserDefaults = .standard) {
        self.key = key
        self.defaultValue = wrappedValue
        self.container = container
    }
}

// 使用
struct Settings {
    @UserDefault("has_seen_onboarding")
    static var hasSeenOnboarding: Bool = false

    @UserDefault("username")
    static var username: String = ""

    @UserDefault("font_size")
    static var fontSize: Int = 14
}

Settings.hasSeenOnboarding = true
print(Settings.hasSeenOnboarding) // true
```

### Codable UserDefaults 包装器

```swift
@propertyWrapper
struct CodableUserDefault<Value: Codable> {
    let key: String
    let defaultValue: Value
    let container: UserDefaults

    var wrappedValue: Value {
        get {
            guard let data = container.data(forKey: key) else {
                return defaultValue
            }
            return (try? JSONDecoder().decode(Value.self, from: data)) ?? defaultValue
        }
        set {
            let data = try? JSONEncoder().encode(newValue)
            container.set(data, forKey: key)
        }
    }

    init(wrappedValue: Value, _ key: String, container: UserDefaults = .standard) {
        self.key = key
        self.defaultValue = wrappedValue
        self.container = container
    }
}

// 存储复杂类型
struct UserProfile: Codable {
    var name: String
    var age: Int
    var email: String
}

struct AppData {
    @CodableUserDefault("user_profile")
    static var userProfile: UserProfile = UserProfile(name: "", age: 0, email: "")

    @CodableUserDefault("favorite_ids")
    static var favoriteIds: [Int] = []
}
```

### 线程安全包装器

```swift
@propertyWrapper
struct Atomic<Value> {
    private var value: Value
    private let lock = NSLock()

    var wrappedValue: Value {
        get {
            lock.lock()
            defer { lock.unlock() }
            return value
        }
        set {
            lock.lock()
            defer { lock.unlock() }
            value = newValue
        }
    }

    var projectedValue: Atomic<Value> {
        return self
    }

    init(wrappedValue: Value) {
        self.value = wrappedValue
    }

    mutating func modify(_ transform: (inout Value) -> Void) {
        lock.lock()
        defer { lock.unlock() }
        transform(&value)
    }
}

class Counter {
    @Atomic var count: Int = 0
}

let counter = Counter()

// 线程安全的并发访问
DispatchQueue.concurrentPerform(iterations: 1000) { _ in
    counter.count += 1
}
print(counter.count) // 1000
```

### 延迟初始化包装器

```swift
@propertyWrapper
struct Lazy<Value> {
    private var storage: Value?
    private let initializer: () -> Value

    var wrappedValue: Value {
        mutating get {
            if let value = storage {
                return value
            }
            let value = initializer()
            storage = value
            return value
        }
        set {
            storage = newValue
        }
    }

    init(wrappedValue: @autoclosure @escaping () -> Value) {
        self.initializer = wrappedValue
    }
}

struct ExpensiveComputation {
    @Lazy var result: [Int] = {
        print("执行耗时计算...")
        return (1...1000).map { $0 * $0 }
    }()
}

var computation = ExpensiveComputation()
print("准备获取结果")
print(computation.result.count) // 执行耗时计算... 1000
print(computation.result.first!) // 1（直接返回缓存值）
```

### 日志包装器

```swift
@propertyWrapper
struct Logged<Value> {
    private var value: Value
    private let propertyName: String

    var wrappedValue: Value {
        get {
            print("[\(propertyName)] 读取值: \(value)")
            return value
        }
        set {
            print("[\(propertyName)] 值从 \(value) 变更为 \(newValue)")
            value = newValue
        }
    }

    init(wrappedValue: Value, _ propertyName: String) {
        self.value = wrappedValue
        self.propertyName = propertyName
        print("[\(propertyName)] 初始化值: \(wrappedValue)")
    }
}

struct DebugableModel {
    @Logged("score") var score: Int = 0
    @Logged("name") var name: String = "Unknown"
}

var model = DebugableModel()
// [score] 初始化值: 0
// [name] 初始化值: Unknown

model.score = 100
// [score] 值从 0 变更为 100
```

### 表单验证包装器

```swift
@propertyWrapper
struct Validated<Value> {
    private var value: Value
    private let validator: (Value) -> Bool
    private(set) var lastValidationResult: Bool = true

    var wrappedValue: Value {
        get { value }
        set {
            value = newValue
            lastValidationResult = validator(newValue)
        }
    }

    var projectedValue: Validated<Value> {
        return self
    }

    var isValid: Bool {
        return lastValidationResult
    }

    init(wrappedValue: Value, validator: @escaping (Value) -> Bool) {
        self.value = wrappedValue
        self.validator = validator
        self.lastValidationResult = validator(wrappedValue)
    }
}

struct RegistrationForm {
    @Validated(validator: { $0.contains("@") && $0.contains(".") })
    var email: String = ""

    @Validated(validator: { $0.count >= 8 })
    var password: String = ""
}

var form = RegistrationForm()
form.email = "test@example.com"
print(form.$email.isValid) // true

form.password = "short"
print(form.$password.isValid) // false
```

### SwiftUI 状态管理示例

```swift
// @State 和 @Binding
struct ParentView: View {
    @State private var count = 0

    var body: some View {
        VStack {
            Text("Count: \(count)")
            ChildView(count: $count)
        }
    }
}

struct ChildView: View {
    @Binding var count: Int

    var body: some View {
        Button("Increment") {
            count += 1
        }
    }
}

// @StateObject 和 @ObservedObject
class TaskStore: ObservableObject {
    @Published var tasks: [String] = []

    func addTask(_ task: String) {
        tasks.append(task)
    }
}

struct TaskListView: View {
    @StateObject private var store = TaskStore()

    var body: some View {
        List(store.tasks, id: \.self) { task in
            Text(task)
        }
    }
}

// @EnvironmentObject
struct ContentView: View {
    @StateObject private var session = UserSession()

    var body: some View {
        MainView()
            .environmentObject(session)
    }
}

struct MainView: View {
    @EnvironmentObject var session: UserSession

    var body: some View {
        Text("Welcome, \(session.username)")
    }
}

// @AppStorage
struct PreferencesView: View {
    @AppStorage("username") var username = "Guest"
    @AppStorage("isDarkMode") var isDarkMode = false

    var body: some View {
        Form {
            TextField("Username", text: $username)
            Toggle("Dark Mode", isOn: $isDarkMode)
        }
    }
}

// @FocusState
struct LoginFormView: View {
    enum Field: Hashable {
        case username, password
    }

    @State private var username = ""
    @State private var password = ""
    @FocusState private var focusedField: Field?

    var body: some View {
        VStack {
            TextField("Username", text: $username)
                .focused($focusedField, equals: .username)
                .submitLabel(.next)
                .onSubmit { focusedField = .password }

            SecureField("Password", text: $password)
                .focused($focusedField, equals: .password)
                .submitLabel(.done)
        }
        .onAppear { focusedField = .username }
    }
}
```

### iOS 17+ @Observable 宏

```swift
import Observation

@Observable
class Book {
    var title: String
    var author: String
    var isAvailable: Bool

    init(title: String, author: String, isAvailable: Bool = true) {
        self.title = title
        self.author = author
        self.isAvailable = isAvailable
    }
}

struct BookDetailView: View {
    var book: Book

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(book.title)
                .font(.title)

            Text("作者: \(book.author)")
                .foregroundColor(.secondary)

            Toggle("可借阅", isOn: Bindable(book).isAvailable)
        }
        .padding()
    }
}

// 与环境配合使用
@Observable
class AppState {
    var currentUser: String?
    var theme: Theme = .system

    enum Theme { case light, dark, system }
}

struct MyApp: App {
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
        }
    }
}

struct SomeView: View {
    @Environment(AppState.self) var appState

    var body: some View {
        @Bindable var state = appState
        Toggle("通知", isOn: $state.notificationsEnabled)
    }
}
```

### 组合多个属性包装器

```swift
@propertyWrapper
struct Lowercased {
    private var value: String = ""

    var wrappedValue: String {
        get { value }
        set { value = newValue.lowercased() }
    }

    init(wrappedValue: String) {
        self.wrappedValue = wrappedValue
    }
}

@propertyWrapper
struct Trimmed {
    private var value: String = ""

    var wrappedValue: String {
        get { value }
        set { value = newValue.trimmingCharacters(in: .whitespacesAndNewlines) }
    }

    init(wrappedValue: String) {
        self.wrappedValue = wrappedValue
    }
}

struct EmailInput {
    // 从外到内应用：先 Trimmed，再 Lowercased
    @Trimmed @Lowercased var email: String = ""
}

var input = EmailInput()
input.email = "  HELLO@EXAMPLE.COM  "
print(input.email) // "hello@example.com"
```

## 最佳实践

### 何时使用属性包装器

**适合使用的场景：**

1. **重复的属性逻辑**：当多个属性有相同的访问控制逻辑时
2. **数据验证**：输入验证、范围限制、格式转换
3. **存储抽象**：UserDefaults、Keychain、数据库访问
4. **状态管理**：SwiftUI 中的各种状态包装器
5. **依赖注入**：服务定位、配置注入
6. **日志和调试**：属性访问追踪

**不适合使用的场景：**

1. 简单的一次性逻辑（增加不必要的复杂度）
2. 需要访问 `self` 的其他属性（初始化时 `self` 不可用）
3. 需要与 `lazy` 或属性观察器配合使用

### 设计原则

```swift
// 1. 保持单一职责
@propertyWrapper
struct Trimmed {
    private var value: String = ""

    var wrappedValue: String {
        get { value }
        set { value = newValue.trimmingCharacters(in: .whitespacesAndNewlines) }
    }

    init(wrappedValue: String) {
        self.wrappedValue = wrappedValue
    }
}

// 2. 提供合理的默认值
@propertyWrapper
struct DefaultEmpty<T: RangeReplaceableCollection> {
    var wrappedValue: T

    init() {
        self.wrappedValue = T()
    }

    init(wrappedValue: T) {
        self.wrappedValue = wrappedValue
    }
}

// 3. 使用泛型提高复用性
@propertyWrapper
struct Clamping<Value: Comparable> {
    var value: Value
    let range: ClosedRange<Value>

    var wrappedValue: Value {
        get { value }
        set { value = min(max(range.lowerBound, newValue), range.upperBound) }
    }

    init(wrappedValue: Value, _ range: ClosedRange<Value>) {
        self.range = range
        self.value = min(max(range.lowerBound, wrappedValue), range.upperBound)
    }
}

// 4. 使用 projectedValue 暴露有用的额外状态
@propertyWrapper
struct ValidatedField<Value> {
    private var value: Value
    private let validation: (Value) -> Bool

    var wrappedValue: Value {
        get { value }
        set { value = newValue }
    }

    var projectedValue: Bool {
        validation(value)
    }

    init(wrappedValue: Value, _ validation: @escaping (Value) -> Bool) {
        self.value = wrappedValue
        self.validation = validation
    }
}
```

### 命名规范

```swift
// 好的命名：描述行为或效果
@Clamped      // 限制范围
@Trimmed      // 去除空白
@Capitalized  // 首字母大写
@Logged       // 记录日志
@Validated    // 验证
@Persisted    // 持久化

// 避免的命名
@MyWrapper    // 不够具体
@Handler      // 含义不清
@Property     // 过于通用
```

### 与 Codable 配合

```swift
@propertyWrapper
struct ISO8601Date {
    var wrappedValue: Date

    init(wrappedValue: Date) {
        self.wrappedValue = wrappedValue
    }
}

extension ISO8601Date: Codable {
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let string = try container.decode(String.self)

        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: string) else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "无法解析 ISO8601 日期"
            )
        }
        self.wrappedValue = date
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        let formatter = ISO8601DateFormatter()
        try container.encode(formatter.string(from: wrappedValue))
    }
}

struct Event: Codable {
    var name: String
    @ISO8601Date var startDate: Date
    @ISO8601Date var endDate: Date
}
```

## 常见陷阱

### 初始化时机问题

```swift
// 错误：属性包装器在 self 可用之前初始化
struct BadExample {
    let multiplier: Int

    // 编译错误：不能在初始化器中访问 self
    @Clamped(0...multiplier) var value: Int = 0 // 错误！
}

// 正确：使用固定值或在 init 中设置
struct GoodExample {
    @Clamped(0...100) var value: Int = 0

    // 或者在 init 中配置
    init(maxValue: Int) {
        _value = Clamped(wrappedValue: 0, 0...maxValue)
    }
}
```

### 与属性观察器冲突

```swift
// 错误：属性包装器不能与 willSet/didSet 同时使用
struct BadExample {
    @Trimmed var name: String = "" {
        willSet { print("将要改变") } // 编译错误！
        didSet { print("已经改变") }  // 编译错误！
    }
}

// 解决方案：在包装器内部添加回调
@propertyWrapper
struct TrimmedWithCallback {
    private var value: String = ""
    var onChange: ((String, String) -> Void)?

    var wrappedValue: String {
        get { value }
        set {
            let oldValue = value
            value = newValue.trimmingCharacters(in: .whitespacesAndNewlines)
            onChange?(oldValue, value)
        }
    }
}
```

### 引用类型包装器的陷阱

```swift
// 问题：类作为包装器时，多个属性可能共享同一实例
@propertyWrapper
class SharedWrapper { // 危险！
    var wrappedValue: Int = 0
}

struct Example {
    @SharedWrapper var a: Int
    @SharedWrapper var b: Int
}

// 解决方案：使用结构体，或确保每次创建新实例
@propertyWrapper
struct SafeWrapper {
    var wrappedValue: Int = 0
}
```

### SwiftUI 中的常见错误

```swift
// 错误 1：在错误的地方使用 @StateObject 和 @ObservedObject
struct ParentView: View {
    // 正确：父视图使用 @StateObject 创建对象
    @StateObject private var viewModel = MyViewModel()

    var body: some View {
        ChildView(viewModel: viewModel)
    }
}

struct ChildView: View {
    // 正确：子视图使用 @ObservedObject 引用对象
    @ObservedObject var viewModel: MyViewModel

    // 错误：这会导致每次 ParentView 重渲染时创建新实例
    // @StateObject var viewModel: MyViewModel

    var body: some View {
        Text(viewModel.text)
    }
}

// 错误 2：忘记 @EnvironmentObject 需要注入
struct ContentView: View {
    @EnvironmentObject var session: UserSession

    var body: some View {
        Text(session.username)
    }
}

// 必须在父视图中注入：
// ContentView().environmentObject(UserSession())
```

### projectedValue 类型不一致

```swift
// 问题：projectedValue 在不同包装器中类型不同
struct Example {
    @State var stateValue = 0       // $stateValue: Binding<Int>
    @Published var published = 0    // $published: Published<Int>.Publisher
    @AppStorage("key") var storage = 0 // $storage: Binding<Int>
}

// 解决方案：查阅文档，了解每个包装器的 projectedValue 类型
```

### 多个包装器的应用顺序

```swift
// 注意：多个包装器从外到内应用
@propertyWrapper struct A {
    var wrappedValue: String
    init(wrappedValue: String) {
        print("A init")
        self.wrappedValue = wrappedValue
    }
}

@propertyWrapper struct B {
    var wrappedValue: A
    init(wrappedValue: A) {
        print("B init")
        self.wrappedValue = wrappedValue
    }
}

struct Test {
    // B 包装 A，A 包装 String
    // 赋值时：String -> A -> B
    // 读取时：B.wrappedValue -> A.wrappedValue -> String
    @B @A var value: String = "test"
}
// 输出：A init, B init
```

## 性能考量

### 内联和优化

```swift
// Swift 编译器通常会内联简单的属性包装器
@propertyWrapper
struct Inlinable {
    var wrappedValue: Int

    @inline(__always)
    init(wrappedValue: Int) {
        self.wrappedValue = wrappedValue
    }
}

// 对于更复杂的包装器，考虑添加 @inlinable
@propertyWrapper
struct OptimizedWrapper<Value> {
    var wrappedValue: Value

    @inlinable
    init(wrappedValue: Value) {
        self.wrappedValue = wrappedValue
    }
}
```

### 避免在 getter 中执行昂贵操作

```swift
// 不好：每次读取都执行计算
@propertyWrapper
struct Expensive {
    var rawValue: [Int]

    var wrappedValue: [Int] {
        get { rawValue.sorted() } // 每次读取都排序！
        set { rawValue = newValue }
    }
}

// 好：缓存计算结果
@propertyWrapper
struct Cached<Value> {
    private var computation: () -> Value
    private var cachedValue: Value?

    var wrappedValue: Value {
        mutating get {
            if let cached = cachedValue {
                return cached
            }
            let value = computation()
            cachedValue = value
            return value
        }
        set {
            cachedValue = newValue
        }
    }

    var projectedValue: Cached<Value> {
        get { self }
        set { self = newValue }
    }

    mutating func invalidate() {
        cachedValue = nil
    }

    init(wrappedValue: @autoclosure @escaping () -> Value) {
        self.computation = wrappedValue
    }
}
```

### 线程安全的性能开销

```swift
// 使用锁会有性能开销，仅在必要时使用
@propertyWrapper
struct Atomic<Value> {
    private var value: Value
    private let lock = NSLock() // 有一定开销

    var wrappedValue: Value {
        get {
            lock.lock()
            defer { lock.unlock() }
            return value
        }
        set {
            lock.lock()
            defer { lock.unlock() }
            value = newValue
        }
    }

    init(wrappedValue: Value) {
        self.value = wrappedValue
    }
}

// 对于简单值类型，考虑使用原子操作
import Foundation

@propertyWrapper
struct AtomicInt {
    private var value: Int32 = 0

    var wrappedValue: Int {
        get { Int(OSAtomicAdd32(0, &value)) }
        set { OSAtomicCompareAndSwap32(value, Int32(newValue), &value) }
    }

    init(wrappedValue: Int) {
        value = Int32(wrappedValue)
    }
}
```

### 内存占用

```swift
// 属性包装器会增加内存占用
struct WithWrapper {
    @Wrapper var value: Int // 包装器可能有额外字段
}

struct WithoutWrapper {
    var value: Int
}

// 检查实际大小
print(MemoryLayout<WithWrapper>.size)
print(MemoryLayout<WithoutWrapper>.size)

// 对于大量实例，考虑内存影响
// 例如：数组中存储百万个元素
```

## 实战场景

### 场景一：API 响应字段映射

```swift
@propertyWrapper
struct DefaultEmpty<T: RangeReplaceableCollection & Decodable>: Decodable {
    var wrappedValue: T

    init() {
        self.wrappedValue = T()
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        self.wrappedValue = (try? container.decode(T.self)) ?? T()
    }
}

@propertyWrapper
struct Default<Value: Decodable>: Decodable {
    var wrappedValue: Value

    init(wrappedValue: Value) {
        self.wrappedValue = wrappedValue
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        self.wrappedValue = (try? container.decode(Value.self)) ?? wrappedValue
    }
}

struct APIResponse: Decodable {
    @DefaultEmpty var items: [String]
    @Default var count: Int = 0
    @Default var message: String = "No message"
}

// 可以安全解析不完整的 JSON
let json = """
{
    "items": null,
    "count": null
}
"""
```

### 场景二：依赖注入容器

```swift
protocol StorageService {
    func save<T: Codable>(_ value: T, forKey key: String)
    func load<T: Codable>(forKey key: String) -> T?
}

class DependencyContainer {
    static let shared = DependencyContainer()

    private var services: [String: Any] = [:]

    func register<T>(_ type: T.Type, _ service: T) {
        let key = String(describing: type)
        services[key] = service
    }

    func resolve<T>(_ type: T.Type) -> T? {
        let key = String(describing: type)
        return services[key] as? T
    }
}

@propertyWrapper
struct Injected<Value> {
    private let type: Value.Type

    var wrappedValue: Value {
        guard let service = DependencyContainer.shared.resolve(type) else {
            fatalError("未注册的依赖: \(type)")
        }
        return service
    }

    init() {
        self.type = Value.self
    }
}

// 使用
class UserService {
    @Injected var storage: StorageService

    func saveUser(_ user: User) {
        storage.save(user, forKey: "current_user")
    }
}

// 注册依赖
DependencyContainer.shared.register(StorageService.self, DefaultStorageService())
```

### 场景三：网络请求状态管理

```swift
enum LoadingState<Value> {
    case idle
    case loading
    case loaded(Value)
    case failed(Error)

    var value: Value? {
        if case .loaded(let value) = self { return value }
        return nil
    }

    var isLoading: Bool {
        if case .loading = self { return true }
        return false
    }
}

@propertyWrapper
class NetworkRequest<Value>: ObservableObject {
    @Published private var state: LoadingState<Value> = .idle

    var wrappedValue: LoadingState<Value> {
        get { state }
        set { state = newValue }
    }

    var projectedValue: NetworkRequest<Value> { self }

    init(wrappedValue: LoadingState<Value> = .idle) {
        self.state = wrappedValue
    }

    func load(_ operation: @escaping () async throws -> Value) {
        state = .loading
        Task { @MainActor in
            do {
                let value = try await operation()
                state = .loaded(value)
            } catch {
                state = .failed(error)
            }
        }
    }
}

class UserViewModel: ObservableObject {
    @NetworkRequest var userState: LoadingState<User>

    func fetchUser(id: Int) {
        $userState.load {
            let url = URL(string: "https://api.example.com/users/\(id)")!
            let (data, _) = try await URLSession.shared.data(from: url)
            return try JSONDecoder().decode(User.self, from: data)
        }
    }
}
```

### 场景四：Feature Flag 系统

```swift
@propertyWrapper
struct FeatureFlag {
    let key: String
    let defaultValue: Bool

    var wrappedValue: Bool {
        get {
            FeatureFlagManager.shared.isEnabled(key) ?? defaultValue
        }
        set {
            FeatureFlagManager.shared.setOverride(key, enabled: newValue)
        }
    }

    init(_ key: String, default defaultValue: Bool = false) {
        self.key = key
        self.defaultValue = defaultValue
    }
}

class FeatureFlagManager {
    static let shared = FeatureFlagManager()

    private var remoteFlags: [String: Bool] = [:]
    private var overrides: [String: Bool] = [:]

    func isEnabled(_ key: String) -> Bool? {
        overrides[key] ?? remoteFlags[key]
    }

    func setOverride(_ key: String, enabled: Bool) {
        overrides[key] = enabled
    }

    func loadRemoteFlags() async {
        // 从服务器加载 feature flags
    }
}

struct Features {
    @FeatureFlag("new_checkout", default: false)
    static var newCheckout: Bool

    @FeatureFlag("dark_mode", default: true)
    static var darkMode: Bool

    @FeatureFlag("beta_features", default: false)
    static var betaFeatures: Bool
}
```

## 面试要点

### 高频面试题

**1. 什么是属性包装器？它解决了什么问题？**

属性包装器是 Swift 5.1 引入的特性，使用 `@propertyWrapper` 标记一个类型，使其可以作为属性的包装器。它解决了属性逻辑复用的问题，将重复的 getter/setter 逻辑抽象为可复用的组件。

**2. wrappedValue 和 projectedValue 有什么区别？**

- `wrappedValue`：被包装属性的实际值，通过属性名直接访问
- `projectedValue`：包装器暴露的额外信息，通过 `$` 前缀访问
- `wrappedValue` 是必需的，`projectedValue` 是可选的

**3. SwiftUI 中 @State 和 @StateObject 的区别？**

- `@State`：用于值类型（如 Int、String、struct），视图拥有此状态
- `@StateObject`：用于引用类型（遵守 ObservableObject 的 class），视图创建并拥有此对象
- `@State` 在视图重建时保持不变，`@StateObject` 在视图首次创建时初始化一次

**4. @ObservedObject 和 @EnvironmentObject 的使用场景？**

- `@ObservedObject`：从父视图传入的可观察对象，通过参数传递
- `@EnvironmentObject`：从环境中获取的可观察对象，无需显式传递
- `@EnvironmentObject` 适合需要跨多层视图共享的数据

**5. 如何自定义一个线程安全的属性包装器？**

```swift
@propertyWrapper
struct Atomic<Value> {
    private var value: Value
    private let lock = NSLock()

    var wrappedValue: Value {
        get {
            lock.lock()
            defer { lock.unlock() }
            return value
        }
        set {
            lock.lock()
            defer { lock.unlock() }
            value = newValue
        }
    }

    init(wrappedValue: Value) {
        self.value = wrappedValue
    }
}
```

**6. 属性包装器可以使用属性观察器（willSet/didSet）吗？**

不可以。属性包装器和属性观察器不能同时使用。如果需要在值变化时执行操作，应该在包装器的 `wrappedValue` setter 中实现。

**7. iOS 17 的 @Observable 宏与 ObservableObject 有什么区别？**

- `@Observable`：使用 Swift 宏实现，编译时生成代码，性能更好
- `ObservableObject`：运行时协议，需要手动标记 `@Published`
- `@Observable` 只追踪实际使用的属性，减少不必要的视图更新
- `@Observable` 不需要使用 `@StateObject` 或 `@ObservedObject`

### 实战技巧

1. **优先使用结构体作为包装器**：避免引用类型可能带来的共享状态问题
2. **合理设计 projectedValue**：提供有用的额外信息而不是暴露内部实现
3. **考虑线程安全**：在需要的场景下添加同步机制
4. **注意初始化顺序**：属性包装器在 `self` 可用之前初始化
5. **测试包装器行为**：为自定义包装器编写单元测试

## 延伸阅读

### 官方资源

- [Swift Language Guide - Properties](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/properties/#Property-Wrappers)
- [Swift Evolution SE-0258: Property Wrappers](https://github.com/apple/swift-evolution/blob/main/proposals/0258-property-wrappers.zh.md)
- [SwiftUI State Management](https://developer.apple.com/documentation/swiftui/state-and-data-flow)

### 推荐文章

- [Property Wrappers in Swift](https://www.swiftbysundell.com/articles/property-wrappers-in-swift/)
- [Understanding Property Wrappers in SwiftUI](https://www.hackingwithswift.com/quick-start/swiftui/understanding-property-wrappers-in-swiftui)
- [The Complete Guide to Property Wrappers in Swift 5](https://www.avanderlee.com/swift/property-wrappers/)

### 相关主题

- **Swift Macros (iOS 17+)**：了解 `@Observable` 和其他宏的实现原理
- **Combine Framework**：理解 `@Published` 如何与响应式编程配合
- **SwiftUI 数据流**：深入理解 SwiftUI 的状态管理机制
- **KeyPath**：属性包装器与 KeyPath 的结合使用

### 开源项目参考

- [ValidatedPropertyKit](https://github.com/SvenTiigi/ValidatedPropertyKit)：属性验证包装器集合
- [Defaults](https://github.com/sindresorhus/Defaults)：类型安全的 UserDefaults 包装器
- [KeychainAccess](https://github.com/kishikawakatsumi/KeychainAccess)：Keychain 包装器

## 总结

属性包装器是 Swift 中强大而灵活的特性，它允许我们：

1. **封装属性逻辑**：将重复的属性访问逻辑抽象为可复用的组件
2. **声明式语法**：使用简洁的 `@Wrapper` 语法装饰属性
3. **投影值机制**：通过 `$` 前缀访问额外功能
4. **SwiftUI 集成**：SwiftUI 大量使用属性包装器管理状态

掌握属性包装器不仅能让你写出更简洁、更具表达性的代码，还是理解 SwiftUI 状态管理机制的关键。在实际开发中，合理使用属性包装器可以显著提高代码的可维护性和可读性。

记住以下核心原则：

- **单一职责**：每个包装器只做一件事
- **合理设计**：使用泛型提高复用性，使用 projectedValue 暴露有用信息
- **性能意识**：避免在 getter 中执行昂贵操作
- **线程安全**：在必要时添加同步机制
- **测试驱动**：为自定义包装器编写测试用例
