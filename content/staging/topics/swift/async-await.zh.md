---
title: Swift async/await 完全指南
description: 深入理解 Swift 并发编程中的 async/await 语法、Task、TaskGroup、AsyncSequence 和 MainActor
track: swift
section: concurrency
difficulty: intermediate
tags:
  - Swift
  - async/await
  - 并发
  - Task
  - Actor
  - AsyncSequence
status: imported
origin: old/src/content/docs/swift/async-await.zh.md
divergence: 0.19
issues:
  - title-lang-en
  - title-language
legacy:
  category: Swift
  subcategory: 并发
  order: 3
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 async/await

`async/await` 是 Swift 5.5 引入的现代并发编程模型的核心语法。它提供了一种直观、安全的方式来编写异步代码，让异步操作的代码看起来和同步代码一样清晰易读。

- **async**: 标记一个函数、方法或闭包可能会暂停执行
- **await**: 标记代码中可能暂停的位置，等待异步操作完成

```swift
// 传统回调方式
func fetchUser(id: String, completion: @escaping (Result<User, Error>) -> Void) {
    URLSession.shared.dataTask(with: url) { data, response, error in
        // 处理结果...
        completion(.success(user))
    }.resume()
}

// async/await 方式
func fetchUser(id: String) async throws -> User {
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}
```

### 历史背景

Swift 并发模型的发展历程:

1. **Swift 1-4**: 依赖 GCD (Grand Central Dispatch) 和回调函数
2. **Swift 5.0**: 引入 Result 类型，改善错误处理
3. **Swift 5.5 (2021)**: 引入 async/await、Actor、结构化并发
4. **Swift 5.9**: 添加自定义 Actor 执行器
5. **Swift 6.0**: 严格并发检查成为默认设置

### 解决什么问题

async/await 解决了传统异步编程中的多个痛点:

1. **回调地狱 (Callback Hell)**: 嵌套回调导致代码难以阅读和维护
2. **错误处理复杂**: 回调中的错误处理容易遗漏
3. **控制流混乱**: 难以实现条件执行、循环等控制流
4. **资源泄漏**: 回调中容易忘记释放资源
5. **调试困难**: 回调栈难以追踪

```swift
// 回调地狱示例
fetchUser(id: userId) { userResult in
    switch userResult {
    case .success(let user):
        fetchOrders(for: user) { ordersResult in
            switch ordersResult {
            case .success(let orders):
                fetchProducts(for: orders) { productsResult in
                    // 继续嵌套...
                }
            case .failure(let error):
                handleError(error)
            }
        }
    case .failure(let error):
        handleError(error)
    }
}

// async/await 简洁解决方案
do {
    let user = try await fetchUser(id: userId)
    let orders = try await fetchOrders(for: user)
    let products = try await fetchProducts(for: orders)
    // 清晰的线性流程
} catch {
    handleError(error)
}
```

## 核心原理

### 协程与挂起点

Swift 的 async/await 基于协程 (Coroutine) 实现。协程是一种可以暂停和恢复执行的函数。

```swift
func processData() async -> Data {
    print("开始处理")           // 1. 同步执行
    let data = await fetchData() // 2. 挂起点 - 函数暂停，线程可执行其他任务
    print("处理完成")           // 3. 恢复执行
    return data
}
```

**挂起点的特征:**
- `await` 关键字标记潜在的挂起点
- 挂起时，当前线程被释放，可以执行其他任务
- 恢复时，可能在不同的线程上继续执行
- 编译器保证状态正确恢复

### 执行模型

Swift 并发使用协作式调度:

```
┌─────────────────────────────────────────────────────────────┐
│                     Cooperative Thread Pool                  │
├─────────────────────────────────────────────────────────────┤
│  Thread 1    │  Thread 2    │  Thread 3    │  Thread N      │
│  ┌────────┐  │  ┌────────┐  │  ┌────────┐  │  ┌────────┐   │
│  │ Task A │  │  │ Task C │  │  │ Task E │  │  │ Task G │   │
│  └───┬────┘  │  └───┬────┘  │  └───┬────┘  │  └───┬────┘   │
│      │await  │      │await  │      │       │      │        │
│  ┌───▼────┐  │  ┌───▼────┐  │  ┌───▼────┐  │  ┌───▼────┐   │
│  │ Task B │  │  │ Task D │  │  │ Task F │  │  │ Task H │   │
│  └────────┘  │  └────────┘  │  └────────┘  │  └────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**关键概念:**
- **任务 (Task)**: 异步执行的工作单元
- **执行器 (Executor)**: 决定任务在哪里执行
- **协作式调度**: 任务主动让出控制权而非被强制中断

### 内存模型与 Continuation

编译器将 async 函数转换为状态机:

```swift
// 原始代码
func example() async -> Int {
    let a = await step1()
    let b = await step2(a)
    return a + b
}

// 编译器内部转换 (概念示意)
enum ExampleState {
    case start
    case afterStep1(a: Int)
    case afterStep2(a: Int, b: Int)
}

struct ExampleContinuation {
    var state: ExampleState

    mutating func resume() -> Int? {
        switch state {
        case .start:
            // 调用 step1，保存状态
            return nil
        case .afterStep1(let a):
            // 调用 step2，保存状态
            return nil
        case .afterStep2(let a, let b):
            return a + b
        }
    }
}
```

### 与 GCD 的关系

async/await 与 GCD 可以共存，但有本质区别:

| 特性 | GCD | async/await |
|------|-----|-------------|
| 调度模型 | 基于队列 | 基于任务 |
| 线程管理 | 可能创建大量线程 | 协作式线程池 |
| 错误处理 | 回调中手动处理 | 原生 throws 支持 |
| 取消机制 | 手动实现 | 内置协作式取消 |
| 代码可读性 | 嵌套回调 | 线性流程 |

## 核心要点

### async 函数

```swift
// 基本 async 函数
func fetchData() async -> Data {
    // 异步操作
}

// async throws 函数
func fetchUser() async throws -> User {
    // 可能抛出错误的异步操作
}

// async 计算属性 (只读)
var config: Configuration {
    get async throws {
        try await loadConfiguration()
    }
}

// async 下标
subscript(index: Int) -> Item {
    get async {
        await loadItem(at: index)
    }
}
```

### await 表达式

```swift
// 基本 await
let result = await someAsyncFunction()

// try await 组合
let user = try await fetchUser()

// 可选链中的 await
let name = await user?.fetchProfile()?.name

// 表达式中的 await
let total = await price1 + await price2
```

### Task 创建与管理

```swift
// 创建非结构化任务
let task = Task {
    await performWork()
}

// 带返回值的任务
let task = Task<String, Error> {
    try await fetchString()
}
let result = try await task.value

// 带优先级的任务
Task(priority: .high) {
    await criticalWork()
}

// 分离任务 - 不继承父任务上下文
Task.detached {
    await independentWork()
}

// 取消任务
task.cancel()
```

### TaskGroup 并发执行

```swift
// 基本 TaskGroup
func fetchAllUsers(ids: [String]) async throws -> [User] {
    try await withThrowingTaskGroup(of: User.self) { group in
        for id in ids {
            group.addTask {
                try await fetchUser(id: id)
            }
        }

        var users: [User] = []
        for try await user in group {
            users.append(user)
        }
        return users
    }
}

// 使用 reduce 收集结果
func sumValues() async -> Int {
    await withTaskGroup(of: Int.self) { group in
        for i in 1...10 {
            group.addTask { await computeValue(i) }
        }
        return await group.reduce(0, +)
    }
}
```

### AsyncSequence

```swift
// 使用 AsyncSequence
for try await line in fileHandle.bytes.lines {
    process(line)
}

// AsyncStream 创建
let stream = AsyncStream<Int> { continuation in
    for i in 1...10 {
        continuation.yield(i)
    }
    continuation.finish()
}

// AsyncThrowingStream
let throwingStream = AsyncThrowingStream<Data, Error> { continuation in
    do {
        let data = try await fetchData()
        continuation.yield(data)
        continuation.finish()
    } catch {
        continuation.finish(throwing: error)
    }
}
```

### MainActor

```swift
// 标记整个类型
@MainActor
class ViewModel: ObservableObject {
    @Published var data: [Item] = []

    func loadData() async {
        data = try? await fetchItems()
    }
}

// 标记单个方法
class Service {
    @MainActor
    func updateUI(with data: Data) {
        // 确保在主线程执行
    }
}

// 显式切换到主线程
await MainActor.run {
    label.text = "Updated"
}
```

## 代码示例

### 示例一：基础网络请求

```swift
import Foundation

// 定义数据模型
struct User: Codable {
    let id: Int
    let name: String
    let email: String
}

// 定义错误类型
enum NetworkError: Error {
    case invalidURL
    case invalidResponse
    case decodingFailed
}

// 异步网络请求
func fetchUser(id: Int) async throws -> User {
    guard let url = URL(string: "https://api.example.com/users/\(id)") else {
        throw NetworkError.invalidURL
    }

    // await 点 - 网络请求期间函数挂起
    let (data, response) = try await URLSession.shared.data(from: url)

    guard let httpResponse = response as? HTTPURLResponse,
          (200...299).contains(httpResponse.statusCode) else {
        throw NetworkError.invalidResponse
    }

    do {
        return try JSONDecoder().decode(User.self, from: data)
    } catch {
        throw NetworkError.decodingFailed
    }
}

// 调用示例
Task {
    do {
        let user = try await fetchUser(id: 1)
        print("用户名: \(user.name)")
    } catch {
        print("获取用户失败: \(error)")
    }
}
```

### 示例二：并发请求与 async let

```swift
struct Dashboard {
    let user: User
    let posts: [Post]
    let notifications: [Notification]
}

func loadDashboard() async throws -> Dashboard {
    // 三个请求并发执行
    async let user = fetchUser()
    async let posts = fetchPosts()
    async let notifications = fetchNotifications()

    // 等待所有结果 (顺序不影响并发)
    return try await Dashboard(
        user: user,
        posts: posts,
        notifications: notifications
    )
}

// 条件并发
func loadOptionalData(includeAnalytics: Bool) async throws -> DashboardData {
    async let user = fetchUser()
    async let posts = fetchPosts()

    // 条件性并发请求
    let analytics: Analytics?
    if includeAnalytics {
        analytics = try await fetchAnalytics()
    } else {
        analytics = nil
    }

    return try await DashboardData(
        user: user,
        posts: posts,
        analytics: analytics
    )
}
```

### 示例三：TaskGroup 批量处理

```swift
func downloadImages(urls: [URL]) async -> [URL: UIImage] {
    await withTaskGroup(of: (URL, UIImage?).self) { group in
        // 添加所有下载任务
        for url in urls {
            group.addTask {
                do {
                    let (data, _) = try await URLSession.shared.data(from: url)
                    let image = UIImage(data: data)
                    return (url, image)
                } catch {
                    return (url, nil)
                }
            }
        }

        // 收集结果
        var results: [URL: UIImage] = [:]
        for await (url, image) in group {
            if let image = image {
                results[url] = image
            }
        }
        return results
    }
}

// 带并发限制的批量处理
func downloadWithLimit(urls: [URL], maxConcurrent: Int) async -> [Data] {
    var results: [Data] = []

    await withTaskGroup(of: Data?.self) { group in
        var iterator = urls.makeIterator()

        // 初始填充
        for _ in 0..<min(maxConcurrent, urls.count) {
            if let url = iterator.next() {
                group.addTask {
                    try? await URLSession.shared.data(from: url).0
                }
            }
        }

        // 完成一个添加一个
        for await data in group {
            if let data = data {
                results.append(data)
            }

            if let url = iterator.next() {
                group.addTask {
                    try? await URLSession.shared.data(from: url).0
                }
            }
        }
    }

    return results
}
```

### 示例四：自定义 AsyncSequence

```swift
// 计时器 AsyncSequence
struct AsyncTimerSequence: AsyncSequence {
    typealias Element = Date

    let interval: TimeInterval
    let count: Int?

    struct AsyncIterator: AsyncIteratorProtocol {
        let interval: TimeInterval
        var remaining: Int?

        mutating func next() async -> Date? {
            // 检查是否还有剩余次数
            if let remaining = remaining {
                guard remaining > 0 else { return nil }
                self.remaining = remaining - 1
            }

            // 检查取消
            guard !Task.isCancelled else { return nil }

            // 等待间隔
            try? await Task.sleep(for: .seconds(interval))

            return Date()
        }
    }

    func makeAsyncIterator() -> AsyncIterator {
        AsyncIterator(interval: interval, remaining: count)
    }
}

// 使用示例
let timer = AsyncTimerSequence(interval: 1.0, count: 5)
for await date in timer {
    print("Tick: \(date)")
}

// 结合 map 等操作符
for await formattedDate in timer.map({ DateFormatter.localizedString(from: $0, dateStyle: .none, timeStyle: .medium) }) {
    print(formattedDate)
}
```

### 示例五：Actor 保护共享状态

```swift
actor ImageCache {
    private var cache: [URL: UIImage] = [:]
    private var inProgress: [URL: Task<UIImage, Error>] = [:]

    func image(for url: URL) async throws -> UIImage {
        // 检查缓存
        if let cached = cache[url] {
            return cached
        }

        // 复用进行中的任务
        if let existingTask = inProgress[url] {
            return try await existingTask.value
        }

        // 创建新任务
        let task = Task<UIImage, Error> {
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let image = UIImage(data: data) else {
                throw ImageError.invalidData
            }
            return image
        }

        inProgress[url] = task

        do {
            let image = try await task.value
            cache[url] = image
            inProgress[url] = nil
            return image
        } catch {
            inProgress[url] = nil
            throw error
        }
    }

    func clearCache() {
        cache.removeAll()
    }

    var cacheSize: Int {
        cache.count
    }
}

// 使用
let cache = ImageCache()
let image = try await cache.image(for: imageURL)
```

### 示例六：ViewModel 与 MainActor

```swift
import SwiftUI

@MainActor
class SearchViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var results: [SearchResult] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private var searchTask: Task<Void, Never>?
    private let searchService: SearchService

    init(searchService: SearchService = SearchService()) {
        self.searchService = searchService
    }

    func search() {
        // 取消之前的搜索
        searchTask?.cancel()

        let query = searchText.trimmingCharacters(in: .whitespaces)
        guard !query.isEmpty else {
            results = []
            return
        }

        searchTask = Task {
            isLoading = true
            errorMessage = nil

            // 防抖
            try? await Task.sleep(for: .milliseconds(300))
            guard !Task.isCancelled else {
                isLoading = false
                return
            }

            do {
                let searchResults = try await searchService.search(query)
                guard !Task.isCancelled else { return }
                results = searchResults
            } catch {
                guard !Task.isCancelled else { return }
                errorMessage = error.localizedDescription
            }

            isLoading = false
        }
    }
}

// SwiftUI 视图
struct SearchView: View {
    @StateObject private var viewModel = SearchViewModel()

    var body: some View {
        VStack {
            TextField("搜索", text: $viewModel.searchText)
                .onChange(of: viewModel.searchText) { _ in
                    viewModel.search()
                }

            if viewModel.isLoading {
                ProgressView()
            }

            if let error = viewModel.errorMessage {
                Text(error).foregroundColor(.red)
            }

            List(viewModel.results) { result in
                Text(result.title)
            }
        }
    }
}
```

## 最佳实践

### 优先使用结构化并发

```swift
// 推荐: 结构化并发 - 自动处理取消和错误
func loadData() async throws -> CompleteData {
    async let users = fetchUsers()
    async let products = fetchProducts()
    return try await CompleteData(users: users, products: products)
}

// 避免: 非结构化任务 - 需要手动管理
func loadDataBad() {
    Task {
        let users = try await fetchUsers()
        // 如果这里失败，无法自动取消其他任务
    }
    Task {
        let products = try await fetchProducts()
    }
}
```

### 正确处理任务取消

```swift
func processItems(_ items: [Item]) async throws -> [Result] {
    var results: [Result] = []

    for item in items {
        // 在每次迭代开始时检查取消
        try Task.checkCancellation()

        let result = try await process(item)
        results.append(result)
    }

    return results
}

// 使用 withTaskCancellationHandler 进行清理
func downloadFile(url: URL) async throws -> Data {
    let handle = try FileHandle(forWritingTo: tempURL)

    return try await withTaskCancellationHandler {
        try await performDownload(to: handle)
    } onCancel: {
        // 清理临时文件
        try? FileManager.default.removeItem(at: tempURL)
    }
}
```

### 合理使用 Actor

```swift
// 推荐: 使用 Actor 保护共享状态
actor Counter {
    private var value = 0

    func increment() -> Int {
        value += 1
        return value
    }
}

// 批量操作减少 Actor 跳转
actor BetterCounter {
    private var value = 0

    // 单次跳转完成批量操作
    func incrementBy(_ amount: Int) -> Int {
        value += amount
        return value
    }
}
```

### 避免在 async 函数中阻塞

```swift
// 错误: 在 async 函数中使用阻塞调用
func badExample() async -> Data {
    // 这会阻塞线程!
    return synchronousNetworkCall()
}

// 正确: 使用 async API
func goodExample() async throws -> Data {
    let (data, _) = try await URLSession.shared.data(from: url)
    return data
}

// 如果必须使用同步代码，使用 Task.detached
func workaround() async -> Data {
    await Task.detached(priority: .background) {
        return synchronousNetworkCall()
    }.value
}
```

### MainActor 使用原则

```swift
// 推荐: 只标记需要主线程的部分
class DataManager {
    func fetchData() async throws -> [Item] {
        // 后台执行
        return try await networkService.fetch()
    }

    @MainActor
    func updateUI(with items: [Item]) {
        // 仅 UI 更新在主线程
        tableView.reloadData()
    }
}

// 避免: 整个类标记为 MainActor 但包含耗时操作
@MainActor
class BadManager {
    func processHugeData() async {
        // 这会阻塞主线程!
    }
}
```

## 常见陷阱

### 隐式 await 顺序执行

```swift
// 陷阱: 顺序执行，总耗时 = 3秒
func sequentialMistake() async -> (A, B, C) {
    let a = await fetchA() // 1秒
    let b = await fetchB() // 1秒
    let c = await fetchC() // 1秒
    return (a, b, c)
}

// 正确: 并发执行，总耗时 = 1秒
func concurrent() async -> (A, B, C) {
    async let a = fetchA()
    async let b = fetchB()
    async let c = fetchC()
    return await (a, b, c)
}
```

### 忘记检查取消

```swift
// 陷阱: 任务被取消但继续执行
func longRunningTask(items: [Item]) async {
    for item in items {
        await process(item) // 即使取消也会继续
    }
}

// 正确: 定期检查取消
func respectfulTask(items: [Item]) async throws {
    for item in items {
        try Task.checkCancellation()
        await process(item)
    }
}
```

### Actor 重入问题

```swift
actor BankAccount {
    var balance: Decimal = 1000

    // 陷阱: await 后状态可能已改变
    func transferUnsafe(amount: Decimal, to other: BankAccount) async {
        guard balance >= amount else { return }
        balance -= amount           // 扣款
        await other.deposit(amount) // await 期间其他任务可能修改 balance!
    }

    // 正确: 在 await 后重新验证状态
    func transferSafe(amount: Decimal, to other: BankAccount) async throws {
        guard balance >= amount else {
            throw TransferError.insufficientFunds
        }

        // 先尝试存入
        await other.deposit(amount)

        // await 后重新检查
        guard balance >= amount else {
            await other.withdraw(amount) // 回滚
            throw TransferError.insufficientFunds
        }

        balance -= amount
    }
}
```

### Sendable 违规

```swift
// 陷阱: 非 Sendable 类型跨并发边界
class MutableData {
    var value = 0
}

func badConcurrency() async {
    let data = MutableData()

    Task {
        data.value = 1 // 警告: 非 Sendable 类型
    }

    Task {
        print(data.value) // 数据竞争!
    }
}

// 正确: 使用值类型或 Actor
actor SafeData {
    var value = 0
}

func goodConcurrency() async {
    let data = SafeData()

    await withTaskGroup(of: Void.self) { group in
        group.addTask { await data.setValue(1) }
        group.addTask { print(await data.value) }
    }
}
```

### 在同步上下文调用 async

```swift
// 错误: 不能直接调用
func syncFunction() {
    let result = await asyncFunction() // 编译错误!
}

// 正确: 创建 Task
func syncFunction() {
    Task {
        let result = await asyncFunction()
        // 处理结果
    }
}

// 或使用 async 入口点
@main
struct MyApp {
    static func main() async {
        let result = await asyncFunction()
    }
}
```

### async let 隐式取消

```swift
// 陷阱: 提前返回导致隐式取消
func loadData() async throws -> User {
    async let user = fetchUser()
    async let settings = fetchSettings()

    if someCondition {
        return try await user // settings 被隐式取消!
    }

    let (u, s) = try await (user, settings)
    return u
}
```

## 性能考量

### 任务创建开销

```swift
// 避免: 为小操作创建任务
for item in items {
    Task {
        await tinyOperation(item) // 任务创建开销 > 操作本身
    }
}

// 推荐: 批量处理
await withTaskGroup(of: Void.self) { group in
    for chunk in items.chunked(into: 100) {
        group.addTask {
            for item in chunk {
                await tinyOperation(item)
            }
        }
    }
}
```

### Actor 跳转成本

```swift
// 避免: 频繁小操作
actor Counter {
    var count = 0
    func increment() { count += 1 }
}

// 每次调用都有 Actor 切换开销
for _ in 0..<10000 {
    await counter.increment()
}

// 推荐: 批量操作
actor Counter {
    var count = 0
    func add(_ value: Int) { count += value }
}

await counter.add(10000)
```

### 并发度控制

```swift
// 问题: 无限并发可能耗尽资源
func downloadAll(urls: [URL]) async {
    await withTaskGroup(of: Void.self) { group in
        for url in urls { // 可能有1000个URL
            group.addTask {
                await download(url) // 同时1000个请求!
            }
        }
    }
}

// 优化: 限制并发数
func downloadAllLimited(urls: [URL], maxConcurrent: Int = 10) async {
    await withTaskGroup(of: Void.self) { group in
        var pending = urls.makeIterator()

        // 初始批次
        for _ in 0..<maxConcurrent {
            guard let url = pending.next() else { break }
            group.addTask { await download(url) }
        }

        // 完成一个启动一个
        for await _ in group {
            if let url = pending.next() {
                group.addTask { await download(url) }
            }
        }
    }
}
```

### 避免不必要的 await

```swift
// 避免: 不必要的 await
func unnecessary() async -> Int {
    return await Task { 1 + 1 }.value // 完全没必要
}

// 推荐: 直接返回
func direct() -> Int {
    return 1 + 1
}

// 注意: 返回已有 async 结果时不需要 await
func forward() async -> Data {
    return await fetchData() // 可以简化
}

func forwardBetter() async -> Data {
    await fetchData() // 隐式返回
}
```

### 内存使用

```swift
// 问题: 大量中间结果占用内存
func processAllBad(urls: [URL]) async -> [Data] {
    var allData: [Data] = []

    await withTaskGroup(of: Data.self) { group in
        for url in urls {
            group.addTask {
                await download(url) // 所有数据同时在内存
            }
        }

        for await data in group {
            allData.append(data)
        }
    }

    return allData
}

// 优化: 流式处理
func processAllStreaming(urls: [URL]) async {
    await withTaskGroup(of: Void.self) { group in
        for url in urls {
            group.addTask {
                let data = await download(url)
                await process(data) // 立即处理
                // data 可以被释放
            }
        }
    }
}
```

## 实战场景

### 场景一：分页加载

```swift
@MainActor
class PaginatedListViewModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var isLoading = false
    @Published var hasMorePages = true

    private var currentPage = 0
    private var loadTask: Task<Void, Never>?
    private let pageSize = 20

    func loadNextPage() {
        guard !isLoading, hasMorePages else { return }

        loadTask?.cancel()
        loadTask = Task {
            isLoading = true
            defer { isLoading = false }

            do {
                let newItems = try await fetchItems(page: currentPage, size: pageSize)

                guard !Task.isCancelled else { return }

                items.append(contentsOf: newItems)
                currentPage += 1
                hasMorePages = newItems.count == pageSize
            } catch {
                print("加载失败: \(error)")
            }
        }
    }

    func refresh() {
        loadTask?.cancel()
        items = []
        currentPage = 0
        hasMorePages = true
        loadNextPage()
    }
}
```

### 场景二：多步骤表单提交

```swift
actor FormSubmissionManager {
    enum SubmissionState {
        case idle
        case validating
        case uploading(progress: Double)
        case submitting
        case completed(Result<Receipt, Error>)
    }

    private(set) var state: SubmissionState = .idle

    func submit(form: FormData, attachments: [Attachment]) async throws -> Receipt {
        // 验证
        state = .validating
        try await validate(form)

        // 上传附件
        for (index, attachment) in attachments.enumerated() {
            let progress = Double(index) / Double(attachments.count)
            state = .uploading(progress: progress)
            try await upload(attachment)
        }

        // 提交表单
        state = .submitting
        let receipt = try await submitForm(form)

        state = .completed(.success(receipt))
        return receipt
    }

    private func validate(_ form: FormData) async throws {
        // 验证逻辑
    }

    private func upload(_ attachment: Attachment) async throws {
        // 上传逻辑
    }

    private func submitForm(_ form: FormData) async throws -> Receipt {
        // 提交逻辑
    }
}
```

### 场景三：WebSocket 消息处理

```swift
actor WebSocketManager {
    private var continuation: AsyncStream<Message>.Continuation?
    private var webSocketTask: URLSessionWebSocketTask?

    var messages: AsyncStream<Message> {
        AsyncStream { continuation in
            self.continuation = continuation

            continuation.onTermination = { @Sendable _ in
                Task { await self.disconnect() }
            }
        }
    }

    func connect(to url: URL) async throws {
        let task = URLSession.shared.webSocketTask(with: url)
        webSocketTask = task
        task.resume()

        // 开始接收消息
        Task {
            await receiveMessages()
        }
    }

    private func receiveMessages() async {
        guard let task = webSocketTask else { return }

        do {
            while task.state == .running {
                let wsMessage = try await task.receive()

                switch wsMessage {
                case .string(let text):
                    if let message = Message(from: text) {
                        continuation?.yield(message)
                    }
                case .data(let data):
                    if let message = try? JSONDecoder().decode(Message.self, from: data) {
                        continuation?.yield(message)
                    }
                @unknown default:
                    break
                }
            }
        } catch {
            continuation?.finish()
        }
    }

    func send(_ message: Message) async throws {
        let data = try JSONEncoder().encode(message)
        try await webSocketTask?.send(.data(data))
    }

    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        continuation?.finish()
    }
}

// 使用
let manager = WebSocketManager()
try await manager.connect(to: serverURL)

Task {
    for await message in await manager.messages {
        print("收到消息: \(message)")
    }
}
```

### 场景四：后台数据同步

```swift
actor DataSyncEngine {
    private var syncQueue: [SyncOperation] = []
    private var isSyncing = false

    func enqueue(_ operation: SyncOperation) {
        syncQueue.append(operation)

        if !isSyncing {
            Task { await startSync() }
        }
    }

    private func startSync() async {
        guard !isSyncing else { return }
        isSyncing = true
        defer { isSyncing = false }

        while !syncQueue.isEmpty {
            let batch = Array(syncQueue.prefix(10))
            syncQueue.removeFirst(min(10, syncQueue.count))

            do {
                try await syncBatch(batch)
            } catch {
                // 失败的操作重新入队
                syncQueue.insert(contentsOf: batch, at: 0)

                // 等待后重试
                try? await Task.sleep(for: .seconds(5))
            }
        }
    }

    private func syncBatch(_ operations: [SyncOperation]) async throws {
        try await withThrowingTaskGroup(of: Void.self) { group in
            for operation in operations {
                group.addTask {
                    try await self.perform(operation)
                }
            }
            try await group.waitForAll()
        }
    }

    private func perform(_ operation: SyncOperation) async throws {
        // 执行同步操作
    }
}
```

## 面试要点

### 常见面试问题

#### async/await 与 GCD 的区别是什么?

**答案要点:**
- GCD 基于队列调度，async/await 基于任务调度
- GCD 可能创建大量线程，async/await 使用协作式线程池
- async/await 原生支持 throws 错误处理
- async/await 有内置的协作式取消机制
- async/await 代码更线性易读，GCD 需要嵌套回调

#### 什么是结构化并发?

**答案要点:**
- 结构化并发确保子任务的生命周期不超过父任务
- 使用 `async let` 和 `TaskGroup` 实现
- 自动传播取消到子任务
- 错误会自动向上传播
- 保证所有子任务完成后才返回

```swift
// 结构化并发示例
func loadAll() async throws -> Data {
    async let a = fetchA()
    async let b = fetchB()
    return try await combine(a, b)
} // a 和 b 必定在此完成或取消
```

#### Actor 如何保证线程安全?

**答案要点:**
- Actor 通过隔离 (isolation) 保护内部状态
- 同一时间只有一个任务可以访问 Actor 内部
- 外部访问需要使用 await
- Actor 方法是串行执行的
- 但 Actor 是可重入的 (在 await 点可以插入其他调用)

#### MainActor 的作用是什么?

**答案要点:**
- MainActor 确保代码在主线程执行
- 用于 UI 更新，因为 UIKit/SwiftUI 要求主线程
- 可以标记整个类型或单个方法
- 从非 MainActor 上下文访问需要 await

```swift
@MainActor
class ViewModel: ObservableObject {
    @Published var data: [Item] = [] // 自动在主线程更新
}
```

#### 如何处理 async 函数中的错误?

```swift
// 方式一: try/catch
do {
    let result = try await fetchData()
} catch {
    handleError(error)
}

// 方式二: try?
let result = try? await fetchData()

// 方式三: Result
let result = await Task {
    try await fetchData()
}.result // Result<Data, Error>
```

#### Task 和 Task.detached 的区别?

**答案要点:**
- Task 继承父任务的上下文 (优先级、Actor 隔离等)
- Task.detached 完全独立，不继承任何上下文
- Task 会继承父任务的取消状态
- Task.detached 需要手动管理生命周期

#### 什么是 Sendable?

**答案要点:**
- Sendable 标记类型可以安全地跨并发边界传递
- 值类型通常自动满足 (如果属性都是 Sendable)
- 不可变类可以是 Sendable
- Actor 自动是 Sendable
- `@unchecked Sendable` 用于手动保证线程安全的类型

### 编码题示例

**题目: 实现一个带超时的异步操作**

```swift
func withTimeout<T>(
    seconds: TimeInterval,
    operation: @escaping () async throws -> T
) async throws -> T {
    try await withThrowingTaskGroup(of: T.self) { group in
        // 添加实际操作
        group.addTask {
            try await operation()
        }

        // 添加超时任务
        group.addTask {
            try await Task.sleep(for: .seconds(seconds))
            throw TimeoutError()
        }

        // 返回第一个完成的结果
        guard let result = try await group.next() else {
            throw TimeoutError()
        }

        // 取消另一个任务
        group.cancelAll()

        return result
    }
}

struct TimeoutError: Error {}

// 使用
let data = try await withTimeout(seconds: 5) {
    try await fetchLargeData()
}
```

## 延伸阅读

### 官方资源
- [Swift 官方并发文档](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/)
- [SE-0296: Async/await](https://github.com/apple/swift-evolution/blob/main/proposals/0296-async-await.zh.md)
- [SE-0302: Sendable](https://github.com/apple/swift-evolution/blob/main/proposals/0302-concurrent-value-and-concurrent-closures.zh.md)
- [SE-0306: Actors](https://github.com/apple/swift-evolution/blob/main/proposals/0306-actors.zh.md)

### WWDC 视频
- [Meet async/await in Swift (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10132/)
- [Explore structured concurrency in Swift (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10134/)
- [Protect mutable state with Swift actors (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10133/)
- [Swift concurrency: Behind the scenes (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10254/)
- [Eliminate data races using Swift Concurrency (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/110351/)

### 推荐书籍
- 《Swift Concurrency》 by Matt Massicotte
- 《Modern Concurrency in Swift》 by Marin Todorov (raywenderlich.com)

### 社区资源
- [Swift by Sundell - Concurrency](https://www.swiftbysundell.com/discover/concurrency/)
- [Hacking with Swift - Concurrency](https://www.hackingwithswift.com/swift/5.5/async-await)
- [Point-Free - Concurrency](https://www.pointfree.co/collections/concurrency)

---

*最后更新: 2026-01-07*
