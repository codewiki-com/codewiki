---
title: Combine框架
description: Swift Combine完全指南，响应式编程、发布者与订阅者
track: swift
section: concurrency
difficulty: advanced
tags:
  - Swift
  - Combine
  - 响应式
  - Publisher
status: imported
origin: old/src/content/docs/swift/combine.zh.md
divergence: 0.181
issues: []
legacy:
  category: Swift
  subcategory: 响应式编程
  order: 8
  lastUpdated: 2026-01-07
---

Combine 是 Apple 在 WWDC 2019 推出的响应式编程框架，它提供了一种声明式的方式来处理随时间变化的值。通过 Publisher（发布者）和 Subscriber（订阅者）模式，Combine 让异步事件处理变得更加优雅和可组合。

## Combine 核心概念

### 响应式编程简介

响应式编程是一种以数据流和变化传播为核心的编程范式。在 Combine 中，数据通过发布者流向订阅者，中间可以经过多个操作符进行转换和处理。

```swift
import Combine

// 基本的 Combine 流程示例
let publisher = [1, 2, 3, 4, 5].publisher

let subscription = publisher
    .filter { $0 % 2 == 0 }  // 过滤偶数
    .map { $0 * 10 }         // 乘以 10
    .sink { value in
        print("接收到值：\(value)")
    }

// 输出：
// 接收到值：20
// 接收到值：40
```

### 三大核心组件

Combine 框架的核心由三个主要组件构成：

1. **Publisher（发布者）**：产生值的来源
2. **Operator（操作符）**：转换和处理值的中间环节
3. **Subscriber（订阅者）**：接收并消费值的终点

```swift
// Publisher -> Operator -> Operator -> Subscriber
URLSession.shared.dataTaskPublisher(for: url)  // Publisher
    .map { $0.data }                            // Operator
    .decode(type: User.self, decoder: JSONDecoder())  // Operator
    .sink(                                      // Subscriber
        receiveCompletion: { completion in
            switch completion {
            case .finished:
                print("请求完成")
            case .failure(let error):
                print("错误：\(error)")
            }
        },
        receiveValue: { user in
            print("用户：\(user.name)")
        }
    )
```

## Publishers 发布者

### Publisher 协议

`Publisher` 是 Combine 的核心协议，定义了发布者的基本行为。

```swift
protocol Publisher {
    associatedtype Output  // 发布的值类型
    associatedtype Failure: Error  // 可能的错误类型

    func receive<S>(subscriber: S) where S: Subscriber,
        Self.Failure == S.Failure,
        Self.Output == S.Input
}
```

### 内置发布者

#### Just

发布单个值然后完成的发布者。

```swift
let justPublisher = Just("Hello, Combine!")

justPublisher.sink { value in
    print(value)  // 输出：Hello, Combine!
}
```

#### Future

表示一个异步操作，最终会产生单个值或失败。

```swift
func fetchUser(id: String) -> Future<User, Error> {
    return Future { promise in
        // 模拟网络请求
        DispatchQueue.global().asyncAfter(deadline: .now() + 1) {
            let user = User(id: id, name: "张三")
            promise(.success(user))
        }
    }
}

let cancellable = fetchUser(id: "123")
    .sink(
        receiveCompletion: { completion in
            if case .failure(let error) = completion {
                print("错误：\(error)")
            }
        },
        receiveValue: { user in
            print("用户名：\(user.name)")
        }
    )
```

#### Empty

不发布任何值，可选择立即完成。

```swift
let emptyPublisher = Empty<Int, Never>(completeImmediately: true)

emptyPublisher.sink(
    receiveCompletion: { _ in print("完成") },
    receiveValue: { _ in print("这不会被调用") }
)
// 输出：完成
```

#### Fail

立即以错误终止的发布者。

```swift
enum MyError: Error {
    case somethingWentWrong
}

let failPublisher = Fail<Int, MyError>(error: .somethingWentWrong)

failPublisher.sink(
    receiveCompletion: { completion in
        if case .failure(let error) = completion {
            print("错误：\(error)")
        }
    },
    receiveValue: { _ in }
)
// 输出：错误：somethingWentWrong
```

#### Deferred

延迟创建发布者，直到有订阅者订阅时才创建。

```swift
let deferredPublisher = Deferred {
    Future<String, Never> { promise in
        print("Future 创建于：\(Date())")
        promise(.success("延迟的值"))
    }
}

// 此时 Future 还未创建
print("订阅前：\(Date())")

DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
    deferredPublisher.sink { value in
        print("接收到：\(value)")
    }
}
```

#### Sequence Publisher

将序列转换为发布者。

```swift
let arrayPublisher = [1, 2, 3, 4, 5].publisher

arrayPublisher
    .sink { print($0) }
// 依次输出：1, 2, 3, 4, 5
```

#### Timer Publisher

创建定时发布值的发布者。

```swift
let timerPublisher = Timer.publish(every: 1.0, on: .main, in: .common)
    .autoconnect()

let cancellable = timerPublisher
    .sink { date in
        print("当前时间：\(date)")
    }

// 每秒输出一次当前时间
// 取消订阅
DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
    cancellable.cancel()
}
```

#### NotificationCenter Publisher

监听系统通知。

```swift
let notificationPublisher = NotificationCenter.default
    .publisher(for: UIApplication.didBecomeActiveNotification)

let cancellable = notificationPublisher
    .sink { notification in
        print("应用变为活跃状态")
    }
```

### @Published 属性包装器

`@Published` 可以将属性转换为发布者，每当属性值改变时自动发布新值。

```swift
class UserViewModel: ObservableObject {
    @Published var username: String = ""
    @Published var isValid: Bool = false

    private var cancellables = Set<AnyCancellable>()

    init() {
        // 监听 username 变化，验证有效性
        $username
            .map { $0.count >= 3 }
            .assign(to: &$isValid)
    }
}

let viewModel = UserViewModel()

viewModel.$username
    .sink { print("用户名更新为：\($0)") }
    .store(in: &viewModel.cancellables)

viewModel.username = "Tom"  // 输出：用户名更新为：Tom
```

## Subscribers 订阅者

### Subscriber 协议

```swift
protocol Subscriber {
    associatedtype Input
    associatedtype Failure: Error

    func receive(subscription: Subscription)
    func receive(_ input: Input) -> Subscribers.Demand
    func receive(completion: Subscribers.Completion<Failure>)
}
```

### sink 订阅者

最常用的订阅方式，通过闭包处理值和完成事件。

```swift
let publisher = [1, 2, 3].publisher

// 只处理值
let cancellable1 = publisher.sink { value in
    print("值：\(value)")
}

// 处理值和完成事件
let cancellable2 = publisher.sink(
    receiveCompletion: { completion in
        switch completion {
        case .finished:
            print("正常完成")
        case .failure(let error):
            print("错误：\(error)")
        }
    },
    receiveValue: { value in
        print("值：\(value)")
    }
)
```

### assign 订阅者

将发布的值直接赋给对象的属性。

```swift
class ViewModel {
    var text: String = "" {
        didSet {
            print("text 更新为：\(text)")
        }
    }
}

let viewModel = ViewModel()
let publisher = ["Hello", "World", "!"].publisher

// 使用 assign(to:on:) - 需要手动管理内存
let cancellable = publisher
    .assign(to: \.text, on: viewModel)

// 使用 assign(to:) 配合 @Published - 自动管理内存
class BetterViewModel: ObservableObject {
    @Published var text: String = ""
}

let betterVM = BetterViewModel()
["Hello", "World"].publisher
    .assign(to: &betterVM.$text)  // 注意 & 和 $
```

### 自定义订阅者

```swift
class IntSubscriber: Subscriber {
    typealias Input = Int
    typealias Failure = Never

    func receive(subscription: Subscription) {
        print("订阅开始")
        subscription.request(.max(3))  // 请求最多 3 个值
    }

    func receive(_ input: Int) -> Subscribers.Demand {
        print("接收到值：\(input)")
        return .none  // 不再请求更多值
    }

    func receive(completion: Subscribers.Completion<Never>) {
        print("完成：\(completion)")
    }
}

let publisher = [1, 2, 3, 4, 5].publisher
let subscriber = IntSubscriber()

publisher.subscribe(subscriber)
// 输出：
// 订阅开始
// 接收到值：1
// 接收到值：2
// 接收到值：3
```

### 背压（Backpressure）

背压是 Combine 处理发布者和订阅者速度不匹配的机制。

```swift
class ControlledSubscriber: Subscriber {
    typealias Input = Int
    typealias Failure = Never

    private var subscription: Subscription?

    func receive(subscription: Subscription) {
        self.subscription = subscription
        // 初始只请求一个值
        subscription.request(.max(1))
    }

    func receive(_ input: Int) -> Subscribers.Demand {
        print("处理值：\(input)")

        // 模拟耗时处理
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            // 处理完成后请求下一个值
            self.subscription?.request(.max(1))
        }

        return .none
    }

    func receive(completion: Subscribers.Completion<Never>) {
        print("完成")
    }
}
```

## Operators 操作符

操作符是 Combine 的核心，用于转换、过滤和组合数据流。

### 转换操作符

#### map

转换每个发布的值。

```swift
[1, 2, 3].publisher
    .map { $0 * 2 }
    .sink { print($0) }
// 输出：2, 4, 6
```

#### tryMap

可能抛出错误的 map。

```swift
enum ParseError: Error {
    case invalidInput
}

["1", "2", "three", "4"].publisher
    .tryMap { str -> Int in
        guard let num = Int(str) else {
            throw ParseError.invalidInput
        }
        return num
    }
    .sink(
        receiveCompletion: { print("完成：\($0)") },
        receiveValue: { print("值：\($0)") }
    )
// 输出：
// 值：1
// 值：2
// 完成：failure(ParseError.invalidInput)
```

#### flatMap

将每个值转换为新的发布者，并将所有发布者的输出扁平化。

```swift
struct User {
    let id: Int
    let name: String
}

func fetchUser(id: Int) -> AnyPublisher<User, Never> {
    Just(User(id: id, name: "用户\(id)"))
        .delay(for: .seconds(Double.random(in: 0.1...0.5)), scheduler: DispatchQueue.main)
        .eraseToAnyPublisher()
}

[1, 2, 3].publisher
    .flatMap { id in
        fetchUser(id: id)
    }
    .sink { user in
        print("获取到用户：\(user.name)")
    }
```

#### flatMap(maxPublishers:)

限制并发的 flatMap。

```swift
[1, 2, 3, 4, 5].publisher
    .flatMap(maxPublishers: .max(2)) { id in
        // 最多同时处理 2 个请求
        fetchUser(id: id)
    }
    .sink { user in
        print("用户：\(user.name)")
    }
```

#### compactMap

过滤 nil 值并解包。

```swift
["1", "two", "3", "four", "5"].publisher
    .compactMap { Int($0) }
    .sink { print($0) }
// 输出：1, 3, 5
```

#### scan

累加操作，类似 reduce 但发布每个中间结果。

```swift
[1, 2, 3, 4, 5].publisher
    .scan(0) { accumulator, value in
        accumulator + value
    }
    .sink { print($0) }
// 输出：1, 3, 6, 10, 15
```

### 过滤操作符

#### filter

根据条件过滤值。

```swift
(1...10).publisher
    .filter { $0 % 2 == 0 }
    .sink { print($0) }
// 输出：2, 4, 6, 8, 10
```

#### removeDuplicates

移除连续重复的值。

```swift
[1, 1, 2, 2, 2, 3, 3, 1].publisher
    .removeDuplicates()
    .sink { print($0) }
// 输出：1, 2, 3, 1
```

#### first / last

只取第一个或最后一个值。

```swift
[1, 2, 3, 4, 5].publisher
    .first()
    .sink { print("第一个：\($0)") }
// 输出：第一个：1

[1, 2, 3, 4, 5].publisher
    .last()
    .sink { print("最后一个：\($0)") }
// 输出：最后一个：5
```

#### first(where:) / last(where:)

取满足条件的第一个或最后一个值。

```swift
[1, 2, 3, 4, 5].publisher
    .first { $0 > 3 }
    .sink { print("第一个大于3的：\($0)") }
// 输出：第一个大于3的：4
```

#### dropFirst / prefix

跳过或只取前 n 个值。

```swift
[1, 2, 3, 4, 5].publisher
    .dropFirst(2)
    .sink { print($0) }
// 输出：3, 4, 5

[1, 2, 3, 4, 5].publisher
    .prefix(3)
    .sink { print($0) }
// 输出：1, 2, 3
```

#### drop(while:) / prefix(while:)

根据条件跳过或获取值。

```swift
[1, 2, 3, 4, 5, 1, 2].publisher
    .drop(while: { $0 < 3 })
    .sink { print($0) }
// 输出：3, 4, 5, 1, 2

[1, 2, 3, 4, 5].publisher
    .prefix(while: { $0 < 4 })
    .sink { print($0) }
// 输出：1, 2, 3
```

### 组合操作符

#### combineLatest

组合多个发布者，当任一发布者发布新值时，发布所有最新值的组合。

```swift
let publisher1 = PassthroughSubject<Int, Never>()
let publisher2 = PassthroughSubject<String, Never>()

publisher1
    .combineLatest(publisher2)
    .sink { int, string in
        print("组合：\(int), \(string)")
    }

publisher1.send(1)           // 无输出，等待 publisher2
publisher2.send("A")         // 输出：组合：1, A
publisher1.send(2)           // 输出：组合：2, A
publisher2.send("B")         // 输出：组合：2, B
```

#### merge

合并多个相同类型的发布者。

```swift
let publisher1 = PassthroughSubject<Int, Never>()
let publisher2 = PassthroughSubject<Int, Never>()

publisher1
    .merge(with: publisher2)
    .sink { print($0) }

publisher1.send(1)  // 输出：1
publisher2.send(2)  // 输出：2
publisher1.send(3)  // 输出：3
```

#### zip

配对多个发布者的值，按顺序一一对应。

```swift
let publisher1 = [1, 2, 3].publisher
let publisher2 = ["A", "B", "C", "D"].publisher

publisher1
    .zip(publisher2)
    .sink { int, string in
        print("配对：\(int), \(string)")
    }
// 输出：
// 配对：1, A
// 配对：2, B
// 配对：3, C
// 注意："D" 没有配对，因为 publisher1 只有 3 个值
```

### 时间操作符

#### debounce

在指定时间内没有新值时才发布最后一个值（防抖）。

```swift
let subject = PassthroughSubject<String, Never>()

subject
    .debounce(for: .milliseconds(500), scheduler: DispatchQueue.main)
    .sink { print("搜索：\($0)") }

// 模拟用户快速输入
subject.send("S")
subject.send("Sw")
subject.send("Swi")
subject.send("Swif")
subject.send("Swift")

// 500毫秒后只输出：搜索：Swift
```

#### throttle

在指定时间间隔内只发布第一个或最后一个值（节流）。

```swift
let subject = PassthroughSubject<Int, Never>()

subject
    .throttle(for: .seconds(1), scheduler: DispatchQueue.main, latest: true)
    .sink { print("节流值：\($0)") }

// 快速发送多个值，每秒只处理最后一个
```

#### delay

延迟发布值。

```swift
Just("延迟的消息")
    .delay(for: .seconds(2), scheduler: DispatchQueue.main)
    .sink { print($0) }
// 2秒后输出：延迟的消息
```

#### timeout

设置超时时间。

```swift
let subject = PassthroughSubject<Int, Error>()

subject
    .timeout(.seconds(3), scheduler: DispatchQueue.main)
    .sink(
        receiveCompletion: { print("完成：\($0)") },
        receiveValue: { print("值：\($0)") }
    )

// 如果3秒内没有值，会以 finished 完成
// 使用自定义错误：
subject
    .timeout(.seconds(3), scheduler: DispatchQueue.main, customError: { URLError(.timedOut) })
    .sink(
        receiveCompletion: { print("完成：\($0)") },
        receiveValue: { print("值：\($0)") }
    )
```

#### measureInterval

测量值之间的时间间隔。

```swift
let subject = PassthroughSubject<Int, Never>()

subject
    .measureInterval(using: DispatchQueue.main)
    .sink { interval in
        print("间隔：\(interval)")
    }

subject.send(1)
DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
    subject.send(2)
}
```

### 调试操作符

#### print

打印所有事件。

```swift
[1, 2, 3].publisher
    .print("调试")
    .sink { _ in }
// 输出：
// 调试: receive subscription: ([1, 2, 3])
// 调试: request unlimited
// 调试: receive value: (1)
// 调试: receive value: (2)
// 调试: receive value: (3)
// 调试: receive finished
```

#### handleEvents

在各个事件点插入副作用。

```swift
[1, 2, 3].publisher
    .handleEvents(
        receiveSubscription: { _ in print("订阅开始") },
        receiveOutput: { print("输出：\($0)") },
        receiveCompletion: { _ in print("完成") },
        receiveCancel: { print("取消") },
        receiveRequest: { print("请求：\($0)") }
    )
    .sink { _ in }
```

#### breakpoint

在条件满足时触发调试器断点。

```swift
[1, 2, 3, 4, 5].publisher
    .breakpoint(receiveOutput: { $0 > 3 })  // 当值大于3时暂停调试器
    .sink { print($0) }
```

## Subjects 主题

Subject 是一种特殊的发布者，可以通过 `send()` 方法手动发送值。

### PassthroughSubject

不保存值，只将接收到的值传递给订阅者。

```swift
let subject = PassthroughSubject<String, Never>()

// 订阅1
let subscription1 = subject.sink { print("订阅1收到：\($0)") }

subject.send("Hello")  // 订阅1收到：Hello

// 订阅2
let subscription2 = subject.sink { print("订阅2收到：\($0)") }

subject.send("World")
// 订阅1收到：World
// 订阅2收到：World

// 完成
subject.send(completion: .finished)
```

### CurrentValueSubject

保存当前值，新订阅者会立即收到当前值。

```swift
let subject = CurrentValueSubject<Int, Never>(0)

print("初始值：\(subject.value)")  // 初始值：0

let subscription = subject.sink { print("收到：\($0)") }
// 立即输出：收到：0

subject.send(1)  // 收到：1
subject.send(2)  // 收到：2

print("当前值：\(subject.value)")  // 当前值：2

// 直接修改 value 属性
subject.value = 3  // 收到：3
```

### Subject 实战示例

```swift
class SearchViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var searchResults: [String] = []

    private let searchSubject = PassthroughSubject<String, Never>()
    private var cancellables = Set<AnyCancellable>()

    init() {
        // 将 searchText 变化转发到 subject
        $searchText
            .sink { [weak self] text in
                self?.searchSubject.send(text)
            }
            .store(in: &cancellables)

        // 处理搜索请求
        searchSubject
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .removeDuplicates()
            .filter { !$0.isEmpty }
            .flatMap { [weak self] query -> AnyPublisher<[String], Never> in
                self?.performSearch(query: query) ?? Just([]).eraseToAnyPublisher()
            }
            .receive(on: DispatchQueue.main)
            .assign(to: &$searchResults)
    }

    private func performSearch(query: String) -> AnyPublisher<[String], Never> {
        // 模拟搜索
        Just(["结果1: \(query)", "结果2: \(query)", "结果3: \(query)"])
            .delay(for: .milliseconds(500), scheduler: DispatchQueue.global())
            .eraseToAnyPublisher()
    }
}
```

## 错误处理

### 错误类型

```swift
enum NetworkError: Error {
    case invalidURL
    case requestFailed
    case decodingFailed
}

// 发布者的 Failure 类型必须遵循 Error 协议
let publisher: AnyPublisher<Data, NetworkError> = /* ... */
```

### catch

捕获错误并返回替代发布者。

```swift
let publisher = Fail<Int, Error>(error: URLError(.badURL))

publisher
    .catch { error -> Just<Int> in
        print("捕获错误：\(error)")
        return Just(-1)  // 返回默认值
    }
    .sink { print("值：\($0)") }
// 输出：
// 捕获错误：Error Domain=NSURLErrorDomain Code=-1000 ...
// 值：-1
```

### tryCatch

捕获错误并可能抛出新错误。

```swift
enum AppError: Error {
    case networkError
    case unknown
}

let publisher = Fail<Int, URLError>(error: URLError(.notConnectedToInternet))

publisher
    .tryCatch { error -> Just<Int> in
        if error.code == .notConnectedToInternet {
            throw AppError.networkError
        }
        return Just(-1)
    }
    .sink(
        receiveCompletion: { print("完成：\($0)") },
        receiveValue: { print("值：\($0)") }
    )
```

### retry

发生错误时重试。

```swift
var attempt = 0

let publisher = Deferred {
    Future<Int, Error> { promise in
        attempt += 1
        print("尝试次数：\(attempt)")

        if attempt < 3 {
            promise(.failure(URLError(.timedOut)))
        } else {
            promise(.success(42))
        }
    }
}

publisher
    .retry(3)  // 最多重试3次
    .sink(
        receiveCompletion: { print("完成：\($0)") },
        receiveValue: { print("值：\($0)") }
    )
// 输出：
// 尝试次数：1
// 尝试次数：2
// 尝试次数：3
// 值：42
// 完成：finished
```

### replaceError

用默认值替换错误。

```swift
let publisher = Fail<Int, Error>(error: URLError(.badURL))

publisher
    .replaceError(with: 0)
    .sink { print("值：\($0)") }
// 输出：值：0
```

### mapError

转换错误类型。

```swift
enum AppError: Error {
    case networkFailed(URLError)
    case unknown
}

URLSession.shared.dataTaskPublisher(for: url)
    .mapError { urlError -> AppError in
        .networkFailed(urlError)
    }
    .sink(
        receiveCompletion: { completion in
            if case .failure(let error) = completion {
                switch error {
                case .networkFailed(let urlError):
                    print("网络错误：\(urlError)")
                case .unknown:
                    print("未知错误")
                }
            }
        },
        receiveValue: { data, response in
            print("收到数据")
        }
    )
```

### setFailureType

为 Never 失败类型的发布者设置失败类型。

```swift
let justPublisher = Just("Hello")  // Just<String, Never>

let errorPublisher: AnyPublisher<String, Error> = justPublisher
    .setFailureType(to: Error.self)
    .eraseToAnyPublisher()
```

## 组合发布者

### Publishers.CombineLatest

组合多个发布者（最多4个）。

```swift
let name = CurrentValueSubject<String, Never>("")
let age = CurrentValueSubject<Int, Never>(0)
let email = CurrentValueSubject<String, Never>("")

Publishers.CombineLatest3(name, age, email)
    .map { name, age, email -> Bool in
        !name.isEmpty && age >= 18 && email.contains("@")
    }
    .sink { isValid in
        print("表单有效：\(isValid)")
    }

name.send("张三")
age.send(25)
email.send("zhangsan@example.com")
// 最终输出：表单有效：true
```

### Publishers.Merge

合并多个发布者（最多8个）。

```swift
let buttonTap = PassthroughSubject<Void, Never>()
let keyboardEnter = PassthroughSubject<Void, Never>()
let gestureRecognized = PassthroughSubject<Void, Never>()

Publishers.Merge3(buttonTap, keyboardEnter, gestureRecognized)
    .sink { _ in
        print("触发搜索")
    }
```

### Publishers.Zip

配对多个发布者的值。

```swift
let ids = [1, 2, 3].publisher
let names = ["Alice", "Bob", "Charlie"].publisher
let ages = [25, 30, 35].publisher

Publishers.Zip3(ids, names, ages)
    .map { User(id: $0, name: $1, age: $2) }
    .sink { user in
        print("用户：\(user)")
    }
```

### switchToLatest

切换到最新的内部发布者，取消之前的订阅。

```swift
let outerSubject = PassthroughSubject<PassthroughSubject<Int, Never>, Never>()

outerSubject
    .switchToLatest()
    .sink { print("值：\($0)") }

let inner1 = PassthroughSubject<Int, Never>()
let inner2 = PassthroughSubject<Int, Never>()

outerSubject.send(inner1)
inner1.send(1)  // 值：1
inner1.send(2)  // 值：2

outerSubject.send(inner2)  // 切换到 inner2
inner1.send(3)  // 不会输出，inner1 已被取消
inner2.send(4)  // 值：4
```

### 实用的组合模式

```swift
// 搜索场景：输入变化 + 按钮点击都触发搜索
class SearchController {
    let searchText = CurrentValueSubject<String, Never>("")
    let searchButtonTapped = PassthroughSubject<Void, Never>()

    private var cancellables = Set<AnyCancellable>()

    init() {
        // 文字变化自动搜索（防抖）
        let textSearch = searchText
            .debounce(for: .milliseconds(500), scheduler: DispatchQueue.main)
            .filter { !$0.isEmpty }

        // 按钮点击立即搜索
        let buttonSearch = searchButtonTapped
            .map { [weak self] in self?.searchText.value ?? "" }
            .filter { !$0.isEmpty }

        // 合并两种触发方式
        Publishers.Merge(textSearch, buttonSearch)
            .removeDuplicates()
            .flatMap { query in
                self.performSearch(query: query)
            }
            .receive(on: DispatchQueue.main)
            .sink { results in
                print("搜索结果：\(results)")
            }
            .store(in: &cancellables)
    }

    private func performSearch(query: String) -> AnyPublisher<[String], Never> {
        // 实现搜索逻辑
        Just(["结果1", "结果2"]).eraseToAnyPublisher()
    }
}
```

## 内存管理

### AnyCancellable

`AnyCancellable` 是管理订阅生命周期的关键。

```swift
class MyViewController {
    private var cancellable: AnyCancellable?

    func setupSubscription() {
        cancellable = somePublisher
            .sink { value in
                print(value)
            }
    }

    deinit {
        cancellable?.cancel()  // 取消订阅
    }
}
```

### Set<AnyCancellable>

使用 Set 管理多个订阅。

```swift
class ViewModel {
    private var cancellables = Set<AnyCancellable>()

    init() {
        publisher1
            .sink { _ in }
            .store(in: &cancellables)

        publisher2
            .sink { _ in }
            .store(in: &cancellables)

        publisher3
            .sink { _ in }
            .store(in: &cancellables)
    }
    // ViewModel 销毁时，所有订阅自动取消
}
```

### 避免循环引用

```swift
class DataManager {
    @Published var data: String = ""
    private var cancellables = Set<AnyCancellable>()

    init() {
        // 错误：可能造成循环引用
        $data
            .sink { value in
                self.processData(value)  // 强引用 self
            }
            .store(in: &cancellables)

        // 正确：使用 [weak self]
        $data
            .sink { [weak self] value in
                self?.processData(value)
            }
            .store(in: &cancellables)
    }

    private func processData(_ value: String) {
        print("处理数据：\(value)")
    }
}
```

### assign(to:) vs assign(to:on:)

```swift
class ViewModel: ObservableObject {
    @Published var text: String = ""
    private var cancellables = Set<AnyCancellable>()

    init() {
        // 不推荐：可能造成循环引用
        somePublisher
            .assign(to: \.text, on: self)
            .store(in: &cancellables)

        // 推荐：自动管理内存，避免循环引用
        somePublisher
            .assign(to: &$text)  // 注意不需要 store
    }
}
```

### share() 操作符

避免多次订阅导致副作用多次执行。

```swift
let publisher = URLSession.shared.dataTaskPublisher(for: url)
    .map(\.data)
    .share()  // 共享订阅

// 多个订阅者共享同一个网络请求
publisher
    .sink { _ in print("订阅者1") }
    .store(in: &cancellables)

publisher
    .sink { _ in print("订阅者2") }
    .store(in: &cancellables)

// 没有 share()，会发起两次网络请求
```

### multicast 和 ConnectablePublisher

更精细地控制共享行为。

```swift
let subject = PassthroughSubject<Int, Never>()
let publisher = [1, 2, 3].publisher
    .multicast(subject: subject)

// 设置订阅
publisher
    .sink { print("订阅者1：\($0)") }
    .store(in: &cancellables)

publisher
    .sink { print("订阅者2：\($0)") }
    .store(in: &cancellables)

// 手动启动发布
let connection = publisher.connect()

// 稍后取消连接
connection.cancel()
```

## 实战应用

### 网络请求封装

```swift
struct APIClient {
    private let baseURL: URL
    private let session: URLSession

    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    func request<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil
    ) -> AnyPublisher<T, Error> {
        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            return Fail(error: URLError(.badURL))
                .eraseToAnyPublisher()
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        return session.dataTaskPublisher(for: request)
            .tryMap { data, response -> Data in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw URLError(.badServerResponse)
                }

                guard (200...299).contains(httpResponse.statusCode) else {
                    throw URLError(.badServerResponse)
                }

                return data
            }
            .decode(type: T.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
}

// 使用示例
struct User: Codable {
    let id: Int
    let name: String
    let email: String
}

let client = APIClient(baseURL: URL(string: "https://api.example.com")!)

client.request(endpoint: "/users/1")
    .sink(
        receiveCompletion: { completion in
            if case .failure(let error) = completion {
                print("请求失败：\(error)")
            }
        },
        receiveValue: { (user: User) in
            print("用户：\(user.name)")
        }
    )
    .store(in: &cancellables)
```

### 表单验证

```swift
class RegistrationViewModel: ObservableObject {
    // 输入
    @Published var username = ""
    @Published var email = ""
    @Published var password = ""
    @Published var confirmPassword = ""

    // 输出
    @Published var usernameError: String?
    @Published var emailError: String?
    @Published var passwordError: String?
    @Published var isFormValid = false

    private var cancellables = Set<AnyCancellable>()

    init() {
        // 验证用户名
        let usernameValid = $username
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .map { username -> String? in
                if username.isEmpty { return nil }
                if username.count < 3 { return "用户名至少3个字符" }
                if username.count > 20 { return "用户名最多20个字符" }
                return nil
            }

        usernameValid
            .assign(to: &$usernameError)

        // 验证邮箱
        let emailValid = $email
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .map { email -> String? in
                if email.isEmpty { return nil }
                let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"
                let predicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
                return predicate.evaluate(with: email) ? nil : "邮箱格式不正确"
            }

        emailValid
            .assign(to: &$emailError)

        // 验证密码
        let passwordValid = Publishers.CombineLatest($password, $confirmPassword)
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .map { password, confirm -> String? in
                if password.isEmpty { return nil }
                if password.count < 8 { return "密码至少8个字符" }
                if password != confirm { return "两次密码不一致" }
                return nil
            }

        passwordValid
            .assign(to: &$passwordError)

        // 整体表单验证
        Publishers.CombineLatest4(
            $username.map { !$0.isEmpty && $0.count >= 3 && $0.count <= 20 },
            $email.map { !$0.isEmpty && $0.contains("@") },
            $password.map { $0.count >= 8 },
            Publishers.CombineLatest($password, $confirmPassword).map { $0 == $1 }
        )
        .map { $0 && $1 && $2 && $3 }
        .assign(to: &$isFormValid)
    }
}
```

### 分页加载

```swift
class PaginatedListViewModel<Item: Decodable>: ObservableObject {
    @Published var items: [Item] = []
    @Published var isLoading = false
    @Published var hasMorePages = true
    @Published var error: Error?

    private var currentPage = 0
    private let pageSize = 20
    private var cancellables = Set<AnyCancellable>()

    private let loadMoreSubject = PassthroughSubject<Void, Never>()
    private let fetchItems: (Int, Int) -> AnyPublisher<[Item], Error>

    init(fetchItems: @escaping (Int, Int) -> AnyPublisher<[Item], Error>) {
        self.fetchItems = fetchItems

        loadMoreSubject
            .filter { [weak self] in
                guard let self = self else { return false }
                return !self.isLoading && self.hasMorePages
            }
            .handleEvents(receiveOutput: { [weak self] _ in
                self?.isLoading = true
            })
            .flatMap { [weak self] _ -> AnyPublisher<[Item], Error> in
                guard let self = self else {
                    return Empty().eraseToAnyPublisher()
                }
                return self.fetchItems(self.currentPage, self.pageSize)
            }
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.error = error
                    }
                },
                receiveValue: { [weak self] newItems in
                    guard let self = self else { return }
                    self.items.append(contentsOf: newItems)
                    self.currentPage += 1
                    self.hasMorePages = newItems.count >= self.pageSize
                    self.isLoading = false
                }
            )
            .store(in: &cancellables)
    }

    func loadMore() {
        loadMoreSubject.send()
    }

    func refresh() {
        currentPage = 0
        items = []
        hasMorePages = true
        error = nil
        loadMore()
    }
}
```

### Combine 与 SwiftUI 集成

```swift
struct ContentView: View {
    @StateObject private var viewModel = ContentViewModel()

    var body: some View {
        VStack {
            TextField("搜索", text: $viewModel.searchText)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()

            if viewModel.isLoading {
                ProgressView()
            } else {
                List(viewModel.results, id: \.self) { result in
                    Text(result)
                }
            }
        }
        .alert("错误", isPresented: .constant(viewModel.error != nil)) {
            Button("确定") {
                viewModel.error = nil
            }
        } message: {
            Text(viewModel.error?.localizedDescription ?? "")
        }
    }
}

class ContentViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var results: [String] = []
    @Published var isLoading = false
    @Published var error: Error?

    private var cancellables = Set<AnyCancellable>()

    init() {
        $searchText
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .removeDuplicates()
            .handleEvents(receiveOutput: { [weak self] _ in
                self?.isLoading = true
            })
            .flatMap { [weak self] query -> AnyPublisher<[String], Never> in
                guard !query.isEmpty else {
                    return Just([]).eraseToAnyPublisher()
                }
                return self?.search(query: query) ?? Just([]).eraseToAnyPublisher()
            }
            .receive(on: DispatchQueue.main)
            .sink { [weak self] results in
                self?.results = results
                self?.isLoading = false
            }
            .store(in: &cancellables)
    }

    private func search(query: String) -> AnyPublisher<[String], Never> {
        // 模拟搜索
        Just(["结果1: \(query)", "结果2: \(query)", "结果3: \(query)"])
            .delay(for: .seconds(0.5), scheduler: DispatchQueue.global())
            .eraseToAnyPublisher()
    }
}
```

### 与 async/await 互操作

```swift
// Combine 转 async/await
extension Publisher where Failure == Never {
    func asyncValue() async -> Output {
        await withCheckedContinuation { continuation in
            var cancellable: AnyCancellable?
            cancellable = first()
                .sink { value in
                    continuation.resume(returning: value)
                    cancellable?.cancel()
                }
        }
    }
}

extension Publisher where Failure: Error {
    func asyncThrowingValue() async throws -> Output {
        try await withCheckedThrowingContinuation { continuation in
            var cancellable: AnyCancellable?
            cancellable = first()
                .sink(
                    receiveCompletion: { completion in
                        switch completion {
                        case .finished:
                            break
                        case .failure(let error):
                            continuation.resume(throwing: error)
                        }
                        cancellable?.cancel()
                    },
                    receiveValue: { value in
                        continuation.resume(returning: value)
                    }
                )
        }
    }
}

// async/await 转 Combine
func fetchData() async throws -> Data {
    // 异步操作
    return Data()
}

let publisher = Deferred {
    Future<Data, Error> { promise in
        Task {
            do {
                let data = try await fetchData()
                promise(.success(data))
            } catch {
                promise(.failure(error))
            }
        }
    }
}
```

## 最佳实践

### 使用类型擦除

```swift
// 使用 AnyPublisher 隐藏具体类型
func fetchUser(id: String) -> AnyPublisher<User, Error> {
    URLSession.shared.dataTaskPublisher(for: userURL)
        .map(\.data)
        .decode(type: User.self, decoder: JSONDecoder())
        .eraseToAnyPublisher()  // 类型擦除
}
```

### 合理使用调度器

```swift
somePublisher
    .subscribe(on: DispatchQueue.global())  // 在后台线程订阅
    .receive(on: DispatchQueue.main)        // 在主线程接收
    .sink { value in
        // 更新 UI
    }
```

### 处理可选值

```swift
$optionalValue
    .compactMap { $0 }  // 过滤 nil
    .sink { nonOptionalValue in
        print(nonOptionalValue)
    }
```

### 避免嵌套订阅

```swift
// 不推荐
publisher1.sink { value1 in
    publisher2.sink { value2 in
        // 嵌套订阅难以管理
    }
}

// 推荐
publisher1
    .flatMap { value1 in
        publisher2.map { value2 in
            (value1, value2)
        }
    }
    .sink { value1, value2 in
        // 扁平化处理
    }
```

### 测试 Combine 代码

```swift
import XCTest
import Combine

class CombineTests: XCTestCase {
    var cancellables = Set<AnyCancellable>()

    func testPublisher() {
        let expectation = XCTestExpectation(description: "接收值")
        var receivedValues: [Int] = []

        [1, 2, 3].publisher
            .sink(
                receiveCompletion: { _ in
                    expectation.fulfill()
                },
                receiveValue: { value in
                    receivedValues.append(value)
                }
            )
            .store(in: &cancellables)

        wait(for: [expectation], timeout: 1.0)
        XCTAssertEqual(receivedValues, [1, 2, 3])
    }

    func testDebounce() {
        let expectation = XCTestExpectation(description: "防抖")
        let subject = PassthroughSubject<String, Never>()
        var result: String?

        subject
            .debounce(for: .milliseconds(100), scheduler: DispatchQueue.main)
            .sink { value in
                result = value
                expectation.fulfill()
            }
            .store(in: &cancellables)

        subject.send("a")
        subject.send("ab")
        subject.send("abc")

        wait(for: [expectation], timeout: 1.0)
        XCTAssertEqual(result, "abc")
    }
}
```

### 使用 Combine 的替代方案

根据场景选择合适的工具：

| 场景 | 推荐方案 |
|------|---------|
| 简单异步操作 | async/await |
| 复杂数据流转换 | Combine |
| UI 绑定 | @Published + SwiftUI |
| 事件流处理 | Combine |
| 单次网络请求 | async/await |
| 实时数据推送 | Combine |

## 总结

Combine 是一个强大的响应式编程框架，它通过发布者-订阅者模式提供了优雅的异步数据流处理方式。掌握 Combine 的关键在于：

1. **理解核心概念**：Publisher、Subscriber、Operator 的角色和关系
2. **熟悉常用操作符**：map、filter、flatMap、combineLatest 等
3. **正确处理错误**：使用 catch、retry、replaceError 等操作符
4. **管理好内存**：使用 AnyCancellable 和 [weak self] 避免内存泄漏
5. **选择合适场景**：结合 async/await 使用，发挥各自优势

随着 Swift 并发的发展，Combine 与 async/await 形成了互补关系。在处理复杂的数据流和事件流时，Combine 仍然是不可或缺的工具。
