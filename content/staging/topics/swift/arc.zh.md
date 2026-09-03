---
title: 自动引用计数(ARC)
description: Swift ARC完全指南，内存管理、循环引用与weak/unowned
track: swift
section: basics
difficulty: intermediate
tags:
  - Swift
  - ARC
  - 内存管理
  - 引用循环
status: imported
origin: old/src/content/docs/swift/arc.zh.md
divergence: 0.191
issues:
  - title-lang-en
  - title-language
legacy:
  category: Swift
  subcategory: 内存管理
  order: 5
  lastUpdated: 2026-01-07
---

自动引用计数（Automatic Reference Counting，简称 ARC）是 Swift 用于管理应用程序内存的机制。ARC 会自动跟踪和管理类实例的内存使用情况，确保在实例不再被需要时释放其占用的内存。

## ARC 的工作原理

每当你创建一个类的新实例时，ARC 会分配一块内存来存储该实例的信息。当实例不再被需要时，ARC 会释放该实例所占用的内存，使这些内存可以被重新利用。

ARC 通过跟踪每个类实例被多少属性、常量和变量所引用来工作。只要存在至少一个活跃的引用，ARC 就不会释放该实例。

```swift
class Person {
    let name: String

    init(name: String) {
        self.name = name
        print("\(name) 被初始化")
    }

    deinit {
        print("\(name) 被释放")
    }
}

// 创建实例
var person1: Person? = Person(name: "张三")
// 输出: 张三 被初始化

// 此时引用计数为 1
var person2 = person1  // 引用计数变为 2
var person3 = person1  // 引用计数变为 3

person1 = nil  // 引用计数变为 2
person2 = nil  // 引用计数变为 1
person3 = nil  // 引用计数变为 0
// 输出: 张三 被释放
```

### ARC 只适用于类

需要注意的是，ARC 只适用于类的实例。结构体（struct）和枚举（enum）是值类型，不需要引用计数，因为它们在赋值时会被复制而不是共享引用。

```swift
struct Point {
    var x: Int
    var y: Int
}

var point1 = Point(x: 10, y: 20)
var point2 = point1  // 值被复制，不是引用
point1.x = 100       // 不影响 point2
print(point2.x)      // 输出: 10
```

## 强引用（Strong Reference）

默认情况下，Swift 中的引用都是强引用。当你将一个类实例赋值给属性、常量或变量时，该引用就是强引用。强引用会阻止 ARC 释放被引用的实例。

```swift
class Department {
    let name: String
    var employees: [Employee] = []

    init(name: String) {
        self.name = name
    }

    func addEmployee(_ employee: Employee) {
        employees.append(employee)
    }

    deinit {
        print("部门 \(name) 被释放")
    }
}

class Employee {
    let name: String
    var department: Department?  // 强引用

    init(name: String) {
        self.name = name
    }

    deinit {
        print("员工 \(name) 被释放")
    }
}

var dept: Department? = Department(name: "技术部")
var emp: Employee? = Employee(name: "李四")

emp?.department = dept  // emp 强引用 dept

dept = nil  // Department 实例不会被释放，因为 emp 仍然持有它的强引用
emp = nil   // 现在两个实例都会被释放
```

## 循环强引用（Retain Cycle）

当两个类实例互相持有对方的强引用时，就会产生循环强引用。这会导致内存泄漏，因为两个实例的引用计数永远不会降为零。

```swift
class Teacher {
    let name: String
    var student: Student?  // 强引用

    init(name: String) {
        self.name = name
        print("Teacher \(name) 被初始化")
    }

    deinit {
        print("Teacher \(name) 被释放")
    }
}

class Student {
    let name: String
    var teacher: Teacher?  // 强引用 - 这会导致循环引用！

    init(name: String) {
        self.name = name
        print("Student \(name) 被初始化")
    }

    deinit {
        print("Student \(name) 被释放")
    }
}

var teacher: Teacher? = Teacher(name: "王老师")
var student: Student? = Student(name: "小明")

teacher?.student = student
student?.teacher = teacher

// 即使将两个变量都设为 nil，实例也不会被释放
teacher = nil
student = nil
// 没有任何 deinit 输出 - 内存泄漏！
```

### 循环引用的可视化

```
┌─────────────────┐         ┌─────────────────┐
│    Teacher      │         │    Student      │
│   (王老师)       │         │   (小明)        │
├─────────────────┤         ├─────────────────┤
│ student ────────┼────────▶│                 │
│                 │◀────────┼──── teacher     │
└─────────────────┘         └─────────────────┘
     引用计数: 1                  引用计数: 1

外部引用设为 nil 后:
     引用计数: 1 (来自 Student)  引用计数: 1 (来自 Teacher)
     无法释放！                   无法释放！
```

## 弱引用（Weak Reference）

弱引用不会阻止 ARC 释放被引用的实例。当被引用的实例被释放时，弱引用会自动变为 `nil`。因此，弱引用必须声明为可选类型的变量。

### weak 的特点

- 必须声明为可选类型（Optional）
- 必须声明为变量（var），不能是常量（let）
- 当被引用的实例被释放时，ARC 会自动将弱引用设置为 `nil`
- 线程安全：弱引用的置 nil 操作是原子的

### 使用场景

弱引用适用于引用的实例生命周期可能比当前实例更短的情况。

```swift
class Apartment {
    let unit: String
    weak var tenant: Tenant?  // 弱引用

    init(unit: String) {
        self.unit = unit
        print("Apartment \(unit) 被初始化")
    }

    deinit {
        print("Apartment \(unit) 被释放")
    }
}

class Tenant {
    let name: String
    var apartment: Apartment?  // 强引用

    init(name: String) {
        self.name = name
        print("Tenant \(name) 被初始化")
    }

    deinit {
        print("Tenant \(name) 被释放")
    }
}

var apartment: Apartment? = Apartment(unit: "101")
var tenant: Tenant? = Tenant(name: "赵六")

apartment?.tenant = tenant
tenant?.apartment = apartment

tenant = nil
// 输出: Tenant 赵六 被释放
// apartment?.tenant 现在自动变为 nil

apartment = nil
// 输出: Apartment 101 被释放
```

### 实际应用：委托模式

弱引用在委托模式中非常常见：

```swift
protocol DataManagerDelegate: AnyObject {
    func dataDidUpdate(_ data: [String])
    func dataDidFailToLoad(error: Error)
}

class DataManager {
    weak var delegate: DataManagerDelegate?  // 弱引用避免循环引用

    private var data: [String] = []

    func fetchData() {
        // 模拟异步数据获取
        DispatchQueue.global().async { [weak self] in
            // 模拟网络延迟
            Thread.sleep(forTimeInterval: 1)

            DispatchQueue.main.async {
                guard let self = self else { return }
                self.data = ["项目1", "项目2", "项目3"]
                self.delegate?.dataDidUpdate(self.data)
            }
        }
    }
}

class ViewController: DataManagerDelegate {
    let dataManager = DataManager()

    init() {
        dataManager.delegate = self
    }

    func dataDidUpdate(_ data: [String]) {
        print("收到数据更新: \(data)")
    }

    func dataDidFailToLoad(error: Error) {
        print("加载失败: \(error)")
    }

    deinit {
        print("ViewController 被释放")
    }
}

var viewController: ViewController? = ViewController()
viewController?.dataManager.fetchData()
viewController = nil
// 输出: ViewController 被释放
```

### 委托必须使用 AnyObject

注意委托协议需要继承自 `AnyObject`（或使用 `class` 关键字），这样才能将其声明为 `weak`：

```swift
// 正确：可以使用 weak
protocol MyDelegate: AnyObject {
    func didComplete()
}

// 或者使用 class 关键字（旧语法，但仍有效）
protocol MyOtherDelegate: class {
    func didComplete()
}

class Handler {
    weak var delegate: MyDelegate?  // 可以使用 weak
}
```

## 无主引用（Unowned Reference）

无主引用与弱引用类似，也不会强持有被引用的实例。但是，无主引用假定被引用的实例永远不会为 `nil`。如果你试图访问一个已被释放的无主引用，程序会崩溃。

### unowned 的特点

- 不需要声明为可选类型
- 假定被引用的实例永远有效
- 当被引用的实例被释放后访问会导致运行时崩溃
- 性能略优于 weak（不需要可选值的管理开销）

### 使用场景

无主引用适用于引用的实例生命周期与当前实例相同或更长的情况。

```swift
class Customer {
    let name: String
    var card: CreditCard?

    init(name: String) {
        self.name = name
        print("Customer \(name) 被初始化")
    }

    deinit {
        print("Customer \(name) 被释放")
    }
}

class CreditCard {
    let number: UInt64
    unowned let customer: Customer  // 无主引用

    init(number: UInt64, customer: Customer) {
        self.number = number
        self.customer = customer
        print("CreditCard \(number) 被初始化")
    }

    deinit {
        print("CreditCard \(number) 被释放")
    }
}

var customer: Customer? = Customer(name: "钱七")
customer?.card = CreditCard(number: 1234_5678_9012_3456, customer: customer!)

customer = nil
// 输出:
// Customer 钱七 被释放
// CreditCard 1234567890123456 被释放
```

在这个例子中，`CreditCard` 使用 `unowned` 引用 `Customer` 是安全的，因为：
1. 信用卡不能独立于客户存在
2. 客户被释放时，信用卡也会被释放
3. 信用卡的生命周期不会超过客户

### 隐式解包的无主可选引用

在某些情况下，你可能需要一个可以为 `nil` 的无主引用。Swift 5.0+ 支持 `unowned(unsafe)` 和可选的 `unowned` 引用：

```swift
class Country {
    let name: String
    var capitalCity: City!  // 隐式解包可选类型

    init(name: String, capitalName: String) {
        self.name = name
        self.capitalCity = City(name: capitalName, country: self)
    }

    deinit {
        print("Country \(name) 被释放")
    }
}

class City {
    let name: String
    unowned let country: Country

    init(name: String, country: Country) {
        self.name = name
        self.country = country
    }

    deinit {
        print("City \(name) 被释放")
    }
}

var country: Country? = Country(name: "中国", capitalName: "北京")
print("\(country!.capitalCity.name) 是 \(country!.name) 的首都")
// 输出: 北京 是 中国 的首都

country = nil
// 输出:
// Country 中国 被释放
// City 北京 被释放
```

## weak 与 unowned 的选择

| 特性 | weak | unowned |
|------|------|---------|
| 是否可以为 nil | 是（可选类型） | 否（非可选类型） |
| 引用被释放后 | 自动变为 nil | 访问会崩溃 |
| 性能 | 略低（需要管理可选值） | 略高 |
| 适用场景 | 被引用对象可能先被释放 | 被引用对象生命周期相同或更长 |
| 使用复杂度 | 需要解包 | 直接使用 |

### 选择指南

```swift
// 使用 weak 的情况：不确定引用对象的生命周期
class Parent {
    var child: Child?
}

class Child {
    weak var parent: Parent?  // 父对象可能先被释放
}

// 使用 unowned 的情况：确定引用对象生命周期更长
class Order {
    let id: String
    var items: [OrderItem] = []

    init(id: String) {
        self.id = id
    }

    func addItem(_ name: String) {
        items.append(OrderItem(name: name, order: self))
    }
}

class OrderItem {
    let name: String
    unowned let order: Order  // OrderItem 不会比 Order 存在更久

    init(name: String, order: Order) {
        self.name = name
        self.order = order
    }
}
```

### 安全建议

当不确定时，优先使用 `weak`。虽然性能略低，但更安全：

```swift
// 安全的选择
class SafeExample {
    weak var reference: SomeClass?  // 安全，即使对象被释放也不会崩溃

    func doSomething() {
        // 需要检查是否为 nil
        guard let ref = reference else {
            print("引用已失效")
            return
        }
        ref.performAction()
    }
}
```

## 闭包中的循环强引用

闭包也是引用类型，当闭包捕获类实例时，也可能产生循环强引用。

### 问题示例

```swift
class HTMLElement {
    let name: String
    let text: String?

    lazy var asHTML: () -> String = {
        // 闭包捕获了 self，形成循环引用
        if let text = self.text {
            return "<\(self.name)>\(text)</\(self.name)>"
        } else {
            return "<\(self.name) />"
        }
    }

    init(name: String, text: String? = nil) {
        self.name = name
        self.text = text
    }

    deinit {
        print("\(name) 被释放")
    }
}

var heading: HTMLElement? = HTMLElement(name: "h1", text: "标题")
print(heading!.asHTML())
// 输出: <h1>标题</h1>

heading = nil
// 没有 deinit 输出 - 内存泄漏！
```

### 循环引用的形成

```
┌─────────────────┐         ┌─────────────────┐
│  HTMLElement    │         │    Closure      │
│    实例         │         │   (asHTML)      │
├─────────────────┤         ├─────────────────┤
│ asHTML ─────────┼────────▶│                 │
│                 │◀────────┼──── self        │
└─────────────────┘         └─────────────────┘
```

## 闭包捕获列表（Capture List）

使用捕获列表可以解决闭包中的循环强引用问题。捕获列表定义了闭包如何捕获一个或多个引用类型。

### 语法

```swift
// 无参数闭包
lazy var someClosure: () -> String = { [weak self] in
    // 闭包体
}

// 带参数的闭包
lazy var anotherClosure: (Int, String) -> String = { [weak self] index, name in
    // 闭包体
}

// 捕获多个引用
lazy var complexClosure = { [weak self, unowned otherInstance] in
    // 闭包体
}
```

### 使用 weak self 解决循环引用

```swift
class HTMLElement {
    let name: String
    let text: String?

    lazy var asHTML: () -> String = { [weak self] in
        guard let self = self else {
            return ""
        }
        if let text = self.text {
            return "<\(self.name)>\(text)</\(self.name)>"
        } else {
            return "<\(self.name) />"
        }
    }

    init(name: String, text: String? = nil) {
        self.name = name
        self.text = text
    }

    deinit {
        print("\(name) 被释放")
    }
}

var paragraph: HTMLElement? = HTMLElement(name: "p", text: "段落内容")
print(paragraph!.asHTML())
// 输出: <p>段落内容</p>

paragraph = nil
// 输出: p 被释放
```

### 使用 unowned self 解决循环引用

当确定闭包和它捕获的实例总是同时销毁时，可以使用 `unowned`：

```swift
class NetworkManager {
    let baseURL: String
    var completionHandler: (() -> Void)?

    lazy var fetchData: () -> Void = { [unowned self] in
        print("从 \(self.baseURL) 获取数据")
        self.completionHandler?()
    }

    init(baseURL: String) {
        self.baseURL = baseURL
    }

    deinit {
        print("NetworkManager 被释放")
    }
}

var manager: NetworkManager? = NetworkManager(baseURL: "https://api.example.com")
manager?.fetchData()
// 输出: 从 https://api.example.com 获取数据

manager = nil
// 输出: NetworkManager 被释放
```

### 捕获列表的值语义

捕获列表还可以捕获值类型的副本：

```swift
class Counter {
    var count = 0

    func createIncrementers() -> [() -> Int] {
        var incrementers: [() -> Int] = []

        for i in 1...3 {
            // 使用捕获列表捕获 i 的值
            let incrementer = { [capturedI = i] () -> Int in
                self.count += capturedI
                return self.count
            }
            incrementers.append(incrementer)
        }

        return incrementers
    }
}

let counter = Counter()
let incrementers = counter.createIncrementers()

print(incrementers[0]())  // 输出: 1
print(incrementers[1]())  // 输出: 3
print(incrementers[2]())  // 输出: 6
```

## 实际应用场景

### 场景一：异步网络请求

```swift
class UserService {
    var currentUser: User?

    func fetchUser(id: Int, completion: @escaping (Result<User, Error>) -> Void) {
        let url = URL(string: "https://api.example.com/users/\(id)")!

        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            // 使用 weak self 避免循环引用
            guard let self = self else {
                print("UserService 已被释放")
                return
            }

            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NetworkError.noData))
                return
            }

            do {
                let user = try JSONDecoder().decode(User.self, from: data)
                self.currentUser = user
                completion(.success(user))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    deinit {
        print("UserService 被释放")
    }
}

enum NetworkError: Error {
    case noData
}

struct User: Codable {
    let id: Int
    let name: String
}
```

### 场景二：定时器

```swift
class TimerManager {
    var timer: Timer?
    var count = 0
    let maxCount: Int
    var onComplete: (() -> Void)?

    init(maxCount: Int) {
        self.maxCount = maxCount
    }

    func startTimer() {
        // 使用闭包形式的定时器，需要注意循环引用
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            self.count += 1
            print("计数: \(self.count)")

            if self.count >= self.maxCount {
                self.stopTimer()
                self.onComplete?()
            }
        }
    }

    func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    deinit {
        stopTimer()
        print("TimerManager 被释放")
    }
}

var timerManager: TimerManager? = TimerManager(maxCount: 5)
timerManager?.onComplete = {
    print("计时完成！")
}
timerManager?.startTimer()

// 5秒后...
// timerManager = nil  // 可以安全释放
```

### 场景三：通知观察者

```swift
class NotificationObserver {
    let name: String
    private var observers: [NSObjectProtocol] = []

    init(name: String) {
        self.name = name
        setupObservers()
    }

    private func setupObservers() {
        // 使用闭包观察通知时需要弱引用 self
        let observer = NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let self = self else { return }
            self.handleAppBecameActive(notification)
        }
        observers.append(observer)

        let backgroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didEnterBackgroundNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleAppEnteredBackground()
        }
        observers.append(backgroundObserver)
    }

    private func handleAppBecameActive(_ notification: Notification) {
        print("\(name) 收到应用激活通知")
    }

    private func handleAppEnteredBackground() {
        print("\(name) 收到应用进入后台通知")
    }

    deinit {
        observers.forEach { NotificationCenter.default.removeObserver($0) }
        print("NotificationObserver \(name) 被释放")
    }
}
```

### 场景四：父子视图关系

```swift
class ParentView {
    let name: String
    var children: [ChildView] = []

    init(name: String) {
        self.name = name
    }

    func addChild(_ child: ChildView) {
        children.append(child)
        child.parent = self
    }

    func removeChild(_ child: ChildView) {
        children.removeAll { $0 === child }
        child.parent = nil
    }

    deinit {
        print("ParentView \(name) 被释放")
    }
}

class ChildView {
    let name: String
    weak var parent: ParentView?  // 使用 weak 避免循环引用

    var onClick: (() -> Void)?

    init(name: String) {
        self.name = name
    }

    func setupAction() {
        // 闭包中也需要使用 weak
        onClick = { [weak self, weak parent] in
            guard let self = self else { return }
            if let parent = parent {
                print("\(self.name) 被点击，父视图是 \(parent.name)")
            } else {
                print("\(self.name) 被点击，没有父视图")
            }
        }
    }

    deinit {
        print("ChildView \(name) 被释放")
    }
}

var parent: ParentView? = ParentView(name: "容器")
let child = ChildView(name: "按钮")
parent?.addChild(child)
child.setupAction()
child.onClick?()

parent = nil
// 输出:
// ParentView 容器 被释放
// ChildView 按钮 被释放
```

### 场景五：Combine 订阅

```swift
import Combine

class DataViewModel {
    @Published var data: [String] = []
    private var cancellables = Set<AnyCancellable>()

    func subscribeToUpdates(publisher: AnyPublisher<[String], Never>) {
        publisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] newData in
                guard let self = self else { return }
                self.data = newData
                self.processData()
            }
            .store(in: &cancellables)
    }

    private func processData() {
        print("处理数据: \(data.count) 条")
    }

    deinit {
        print("DataViewModel 被释放")
    }
}
```

### 场景六：SwiftUI 中的异步操作

```swift
import SwiftUI

class ContentViewModel: ObservableObject {
    @Published var items: [String] = []
    @Published var isLoading = false

    func loadItems() {
        isLoading = true

        Task { [weak self] in
            // 模拟网络请求
            try? await Task.sleep(nanoseconds: 2_000_000_000)

            await MainActor.run { [weak self] in
                guard let self = self else { return }
                self.items = ["项目 1", "项目 2", "项目 3"]
                self.isLoading = false
            }
        }
    }

    deinit {
        print("ContentViewModel 被释放")
    }
}
```

## 调试内存问题

### 使用 deinit 验证

添加 `deinit` 方法来验证对象是否被正确释放：

```swift
class DebugClass {
    let id: Int
    static var instanceCount = 0

    init(id: Int) {
        self.id = id
        DebugClass.instanceCount += 1
        print("DebugClass \(id) 被创建，当前实例数: \(DebugClass.instanceCount)")
    }

    deinit {
        DebugClass.instanceCount -= 1
        print("DebugClass \(id) 被释放，剩余实例数: \(DebugClass.instanceCount)")
    }
}

// 测试
func testMemory() {
    let obj1 = DebugClass(id: 1)
    let obj2 = DebugClass(id: 2)
    print("函数结束前")
}

testMemory()
print("函数结束后")

// 输出:
// DebugClass 1 被创建，当前实例数: 1
// DebugClass 2 被创建，当前实例数: 2
// 函数结束前
// DebugClass 2 被释放，剩余实例数: 1
// DebugClass 1 被释放，剩余实例数: 0
// 函数结束后
```

### Xcode 内存图调试器

在 Xcode 中，你可以使用内存图调试器来可视化对象之间的引用关系：

1. 在调试过程中，点击 Debug Navigator
2. 选择 "Debug Memory Graph" 按钮（内存图标）
3. 查看对象之间的引用关系，找出循环引用
4. 紫色感叹号表示潜在的内存泄漏

### Instruments 工具

使用 Xcode 的 Instruments 工具可以帮助发现内存泄漏：

1. **Leaks**：检测内存泄漏
2. **Allocations**：跟踪内存分配
3. **VM Tracker**：监控虚拟内存使用

```
Product -> Profile (Cmd+I) -> 选择 Leaks 或 Allocations
```

### 常见内存问题检查清单

```swift
// 检查清单
class MemoryCheckList {
    // 1. 委托是否使用 weak？
    weak var delegate: SomeDelegate?  // 正确

    // 2. 闭包属性是否会捕获 self？
    lazy var handler: () -> Void = { [weak self] in
        self?.doSomething()  // 正确
    }

    // 3. 异步回调是否使用 weak self？
    func asyncTask() {
        DispatchQueue.main.async { [weak self] in
            self?.updateUI()  // 正确
        }
    }

    // 4. 定时器回调是否使用 weak self？
    func setupTimer() {
        Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.tick()  // 正确
        }
    }

    // 5. NotificationCenter 观察者是否正确移除？
    var observer: NSObjectProtocol?

    deinit {
        if let observer = observer {
            NotificationCenter.default.removeObserver(observer)
        }
    }
}
```

## 最佳实践总结

### 默认使用强引用

只有在需要打破循环引用时才使用 `weak` 或 `unowned`：

```swift
class Container {
    var items: [Item] = []  // 强引用是默认且正确的选择
}
```

### 优先使用 weak

当不确定被引用对象的生命周期时，使用 `weak` 更安全：

```swift
class SafeHandler {
    weak var target: SomeClass?  // 安全的选择
}
```

### 谨慎使用 unowned

只有在确定被引用对象不会先被释放时才使用 `unowned`：

```swift
class CreditCard {
    unowned let owner: Customer  // 只在确定 owner 不会先释放时使用
}
```

### 委托模式使用 weak

委托属性几乎总是应该声明为 `weak`：

```swift
protocol ViewDelegate: AnyObject {
    func viewDidLoad()
}

class CustomView {
    weak var delegate: ViewDelegate?
}
```

### 闭包捕获使用捕获列表

在可能产生循环引用的闭包中使用 `[weak self]` 或 `[unowned self]`：

```swift
class ViewModel {
    var onUpdate: (() -> Void)?

    func setup() {
        onUpdate = { [weak self] in
            guard let self = self else { return }
            self.performUpdate()
        }
    }
}
```

### 使用 guard let 解包

在闭包中使用 `guard let self = self else { return }` 安全地解包弱引用：

```swift
someAsyncOperation { [weak self] result in
    guard let self = self else {
        print("对象已释放，取消操作")
        return
    }
    self.handleResult(result)
}
```

### 定期检查 deinit

确保对象在预期的时候被释放：

```swift
class MonitoredClass {
    deinit {
        print("MonitoredClass 正确释放")
    }
}
```

### 使用工具调试

善用 Xcode 的内存图调试器和 Instruments 来发现内存问题。

### 完整的最佳实践示例

```swift
protocol ServiceDelegate: AnyObject {
    func serviceDidComplete(result: String)
}

class BestPracticeService {
    // 委托使用 weak
    weak var delegate: ServiceDelegate?

    // 子对象使用强引用（默认）
    private let processor = DataProcessor()

    // 闭包属性使用捕获列表
    private lazy var completionHandler: (String) -> Void = { [weak self] result in
        self?.handleCompletion(result)
    }

    // 取消令牌
    private var cancellables = Set<AnyCancellable>()

    func performAsyncTask() {
        // 异步操作中使用 [weak self]
        DispatchQueue.global().async { [weak self] in
            guard let self = self else { return }

            let result = self.processor.process()

            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.delegate?.serviceDidComplete(result: result)
            }
        }
    }

    func setupTimer() -> Timer {
        // 定时器使用 [weak self]
        return Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.tick()
        }
    }

    private func handleCompletion(_ result: String) {
        print("完成: \(result)")
    }

    private func tick() {
        print("定时器触发")
    }

    deinit {
        print("BestPracticeService 被正确释放")
    }
}

class DataProcessor {
    func process() -> String {
        return "处理结果"
    }
}
```

## 总结

通过理解和正确使用 ARC、强引用、弱引用、无主引用以及闭包捕获列表，你可以有效地管理 Swift 应用程序的内存，避免内存泄漏，构建高效稳定的应用程序。

关键要点：

1. **ARC 自动管理内存**：但需要开发者避免循环引用
2. **强引用是默认的**：用于大多数正常的对象关系
3. **weak 用于可选的、可能先释放的引用**：如委托
4. **unowned 用于非可选的、生命周期不短于当前对象的引用**：如信用卡对持卡人的引用
5. **闭包捕获列表**：解决闭包中的循环引用问题
6. **调试工具**：使用 deinit、内存图和 Instruments 发现问题

记住：当不确定时，使用 `weak` 是更安全的选择。性能的微小损失远比内存泄漏导致的问题要小得多。
