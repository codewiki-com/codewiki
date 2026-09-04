---
title: 并发
description: Swift 并发完整指南，包括 async/await、Actor 和结构化并发
track: swift
section: concurrency
difficulty: advanced
tags:
  - Swift
  - Concurrency
  - async/await
  - Actor
status: imported
origin: old/src/content/docs/swift/concurrency.zh.md
divergence: 0.208
issues: []
legacy:
  category: Swift
  subcategory: Concurrency
  order: 2
  lastUpdated: 2026-01-07
---

Swift 并发是一个用于编写异步和并行代码的综合系统，在 Swift 5.5 中引入，并在 Swift 6 中得到显著增强。它提供编译时的数据竞争安全保证，同时提供简洁、富有表达力的语法，使并发代码更容易编写和理解。

## Async/Await

`async`/`await` 模式是 Swift 并发的基础。标记为 `async` 的函数可以在不阻塞线程的情况下暂停执行，允许其他工作在等待异步操作完成时继续进行。

### 声明异步函数

```swift
// 基本异步函数
func fetchUserProfile(id: String) async throws -> UserProfile {
    let url = URL(string: "https://api.example.com/users/\(id)")!
    let (data, response) = try await URLSession.shared.data(from: url)

    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw NetworkError.invalidResponse
    }

    return try JSONDecoder().decode(UserProfile.self, from: data)
}

// 调用异步函数
func displayUserProfile() async {
    do {
        let profile = try await fetchUserProfile(id: "12345")
        print("用户: \(profile.name)")
    } catch {
        print("获取用户资料失败: \(error)")
    }
}
```

### 异步属性

属性也可以是异步的，但必须是只读的。

```swift
struct RemoteConfiguration {
    var settings: Settings {
        get async throws {
            let url = URL(string: "https://api.example.com/config")!
            let (data, _) = try await URLSession.shared.data(from: url)
            return try JSONDecoder().decode(Settings.self, from: data)
        }
    }
}

// 使用
let config = RemoteConfiguration()
let settings = try await config.settings
```

### 异步闭包和高阶函数

```swift
// 异步闭包类型
let fetchData: () async throws -> Data = {
    let url = URL(string: "https://example.com/data")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return data
}

// 在高阶函数中使用异步闭包
func processItems(_ items: [Item], transform: (Item) async throws -> ProcessedItem) async throws -> [ProcessedItem] {
    var results: [ProcessedItem] = []
    for item in items {
        let processed = try await transform(item)
        results.append(processed)
    }
    return results
}
```

### 顺序执行 vs 并行执行

理解操作何时顺序运行与并行运行对于性能至关重要。

```swift
// 顺序执行 - 每个 await 在下一个开始前完成
func fetchDataSequentially() async throws -> (User, [Post], [Comment]) {
    let user = try await fetchUser()           // 等待完成
    let posts = try await fetchPosts()         // 然后等待这个
    let comments = try await fetchComments()   // 然后等待这个
    return (user, posts, comments)
}

// 使用 async let 并行执行 - 全部立即开始
func fetchDataInParallel() async throws -> (User, [Post], [Comment]) {
    async let user = fetchUser()           // 立即开始
    async let posts = fetchPosts()         // 立即开始
    async let comments = fetchComments()   // 立即开始

    // 三个操作并发运行
    return try await (user, posts, comments)
}
```

### 用于遗留代码的 Continuation API

当使用基于回调的 API 时，使用 continuation 来桥接到 async/await。

```swift
// 包装完成处理器 API
func fetchImage(from url: URL) async throws -> UIImage {
    try await withCheckedThrowingContinuation { continuation in
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                continuation.resume(throwing: error)
                return
            }

            guard let data = data,
                  let image = UIImage(data: data) else {
                continuation.resume(throwing: ImageError.invalidData)
                return
            }

            continuation.resume(returning: image)
        }.resume()
    }
}

// 用于基于代理的 API
class LocationFetcher: NSObject, CLLocationManagerDelegate {
    private var continuation: CheckedContinuation<CLLocation, Error>?
    private let manager = CLLocationManager()

    func getCurrentLocation() async throws -> CLLocation {
        try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            manager.delegate = self
            manager.requestLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        continuation?.resume(returning: locations.first!)
        continuation = nil
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        continuation?.resume(throwing: error)
        continuation = nil
    }
}
```

## Task

Task 是 Swift 并发中异步工作的基本单元。它们代表可以与其他任务并发运行的单个工作单元。

### 创建 Task

```swift
// 非结构化任务 - 继承优先级和 actor 上下文
Task {
    let data = await fetchData()
    await processData(data)
}

// 带显式优先级的任务
Task(priority: .high) {
    await performUrgentWork()
}

// 分离任务 - 不继承 actor 上下文或优先级
Task.detached {
    await performIndependentWork()
}

Task.detached(priority: .background) {
    await performBackgroundCleanup()
}
```

### Task 返回值

```swift
// 返回值的 Task
let task = Task<String, Never> {
    await performComputation()
    return "结果"
}

// 获取结果
let result = await task.value

// 可能抛出错误的 Task
let throwingTask = Task<Data, Error> {
    try await fetchData()
}

do {
    let data = try await throwingTask.value
} catch {
    print("任务失败: \(error)")
}
```

### Task 取消

Swift 中的取消是协作式的 - 任务必须检查并响应取消。

```swift
class DataLoader {
    private var currentTask: Task<[Item], Error>?

    func loadItems() {
        // 取消任何现有任务
        currentTask?.cancel()

        currentTask = Task {
            var items: [Item] = []

            for id in itemIDs {
                // 检查任务是否被取消
                try Task.checkCancellation()

                // 替代方案：手动检查
                if Task.isCancelled {
                    throw CancellationError()
                }

                let item = try await fetchItem(id: id)
                items.append(item)
            }

            return items
        }
    }

    func cancel() {
        currentTask?.cancel()
    }
}
```

### Task 休眠和延迟

```swift
// 休眠一段时间（Swift 5.7+）
try await Task.sleep(for: .seconds(2))
try await Task.sleep(for: .milliseconds(500))

// 休眠到特定时刻
try await Task.sleep(until: .now + .seconds(5), clock: .continuous)

// 遗留的纳秒 API
try await Task.sleep(nanoseconds: 1_000_000_000) // 1 秒
```

### Task 本地值

Task 本地值允许您在任务层次结构中向下传递上下文信息。

```swift
enum RequestContext {
    @TaskLocal static var requestID: String?
    @TaskLocal static var userID: String?
    @TaskLocal static var traceEnabled: Bool = false
}

func handleRequest(id: String, userID: String) async {
    await RequestContext.$requestID.withValue(id) {
        await RequestContext.$userID.withValue(userID) {
            await processRequest()
        }
    }
}

func processRequest() async {
    // 在调用栈的任何位置访问 task 本地值
    guard let requestID = RequestContext.requestID else {
        return
    }

    if RequestContext.traceEnabled {
        print("正在处理请求 \(requestID)，用户 \(RequestContext.userID ?? "未知")")
    }

    await performDatabaseQuery()
}

func performDatabaseQuery() async {
    // Task 本地值被子任务继承
    print("请求的数据库查询: \(RequestContext.requestID ?? "无")")
}
```

## TaskGroup

Task 组支持动态、并行执行多个子任务，并自动管理生命周期。

### 基本 TaskGroup 用法

```swift
func fetchAllUserData(userIDs: [String]) async throws -> [UserData] {
    try await withThrowingTaskGroup(of: UserData.self) { group in
        // 动态添加任务
        for id in userIDs {
            group.addTask {
                try await fetchUserData(id: id)
            }
        }

        // 在完成时收集结果
        var results: [UserData] = []
        for try await userData in group {
            results.append(userData)
        }

        return results
    }
}
```

### 不同结果类型的 TaskGroup

```swift
func loadDashboard() async throws -> Dashboard {
    try await withThrowingTaskGroup(of: DashboardComponent.self) { group in
        group.addTask {
            .profile(try await fetchProfile())
        }

        group.addTask {
            .statistics(try await fetchStatistics())
        }

        group.addTask {
            .recentActivity(try await fetchRecentActivity())
        }

        var profile: UserProfile?
        var statistics: Statistics?
        var activity: [Activity] = []

        for try await component in group {
            switch component {
            case .profile(let p):
                profile = p
            case .statistics(let s):
                statistics = s
            case .recentActivity(let a):
                activity = a
            }
        }

        guard let profile = profile, let statistics = statistics else {
            throw DashboardError.missingData
        }

        return Dashboard(profile: profile, statistics: statistics, activity: activity)
    }
}

enum DashboardComponent {
    case profile(UserProfile)
    case statistics(Statistics)
    case recentActivity([Activity])
}
```

### 限制并发数

```swift
func processImagesWithLimit(images: [UIImage], maxConcurrent: Int) async -> [ProcessedImage] {
    await withTaskGroup(of: ProcessedImage.self) { group in
        var results: [ProcessedImage] = []
        var iterator = images.makeIterator()

        // 启动初始批次
        for _ in 0..<maxConcurrent {
            if let image = iterator.next() {
                group.addTask {
                    await processImage(image)
                }
            }
        }

        // 每个任务完成时，启动新任务
        for await result in group {
            results.append(result)

            if let image = iterator.next() {
                group.addTask {
                    await processImage(image)
                }
            }
        }

        return results
    }
}
```

### TaskGroup 中的取消

```swift
func fetchFirstSuccessful(urls: [URL]) async throws -> Data {
    try await withThrowingTaskGroup(of: Data.self) { group in
        for url in urls {
            group.addTask {
                try await URLSession.shared.data(from: url).0
            }
        }

        // 返回第一个成功的结果
        // 这会自动取消剩余任务
        guard let firstResult = try await group.next() else {
            throw FetchError.noResults
        }

        // 显式取消所有剩余任务
        group.cancelAll()

        return firstResult
    }
}
```

### 丢弃型 TaskGroup

用于不需要结果的即发即忘场景。

```swift
func sendNotifications(to users: [User], message: String) async {
    await withDiscardingTaskGroup { group in
        for user in users {
            group.addTask {
                await sendNotification(to: user, message: message)
            }
        }
        // 组等待所有任务但丢弃结果
    }
}
```

## Actors

Actor 是引用类型，通过确保一次只有一个任务可以访问其状态来保护其可变状态。它们是 Swift 中防止数据竞争的主要工具。

### 定义 Actor

```swift
actor BankAccount {
    let accountNumber: String
    private(set) var balance: Decimal
    private var transactionHistory: [Transaction] = []

    init(accountNumber: String, initialBalance: Decimal) {
        self.accountNumber = accountNumber
        self.balance = initialBalance
    }

    func deposit(amount: Decimal) -> Transaction {
        balance += amount
        let transaction = Transaction(type: .deposit, amount: amount, date: Date())
        transactionHistory.append(transaction)
        return transaction
    }

    func withdraw(amount: Decimal) throws -> Transaction {
        guard balance >= amount else {
            throw BankError.insufficientFunds
        }
        balance -= amount
        let transaction = Transaction(type: .withdrawal, amount: amount, date: Date())
        transactionHistory.append(transaction)
        return transaction
    }

    func getTransactionHistory() -> [Transaction] {
        transactionHistory
    }
}

// 使用 - 从 actor 外部的所有访问都是异步的
let account = BankAccount(accountNumber: "12345", initialBalance: 1000)
await account.deposit(amount: 500)
let balance = await account.balance
```

### Actor 隔离

```swift
actor DataCache {
    private var cache: [String: Data] = [:]
    private var lastAccess: [String: Date] = [:]

    // actor 内的同步访问是安全的
    func store(_ data: Data, forKey key: String) {
        cache[key] = data
        lastAccess[key] = Date()
        pruneOldEntries() // 可以同步调用
    }

    func retrieve(forKey key: String) -> Data? {
        lastAccess[key] = Date()
        return cache[key]
    }

    private func pruneOldEntries() {
        let threshold = Date().addingTimeInterval(-3600)
        for (key, date) in lastAccess where date < threshold {
            cache.removeValue(forKey: key)
            lastAccess.removeValue(forKey: key)
        }
    }
}
```

### 非隔离成员

某些成员不需要 actor 隔离，可以同步访问。

```swift
actor ImageProcessor {
    private var processedCount = 0
    let identifier: UUID

    // 常量属性自动是非隔离的
    // identifier 可以不使用 await 访问

    // 显式非隔离计算属性
    nonisolated var description: String {
        "ImageProcessor(\(identifier))"
    }

    // 不访问可变状态的非隔离方法
    nonisolated func supportedFormats() -> [String] {
        ["png", "jpg", "heic", "webp"]
    }

    // 访问可变状态的隔离方法
    func process(_ image: Image) async -> ProcessedImage {
        processedCount += 1
        return await performProcessing(image)
    }

    // 非隔离异步方法 - 在 actor 上下文外运行
    nonisolated func heavyComputation(_ data: Data) async -> Data {
        // 不需要隔离的 CPU 密集型工作
        await performHeavyWork(data)
    }
}
```

### Actor 重入

Actor 可以在挂起点重新进入，这一点很重要需要理解。

```swift
actor AccountManager {
    private var accounts: [String: BankAccount] = [:]

    func transfer(amount: Decimal, from sourceID: String, to destID: String) async throws {
        guard let source = accounts[sourceID],
              let dest = accounts[destID] else {
            throw TransferError.accountNotFound
        }

        // 注意：Actor 状态可能在这些 await 期间改变
        let sourceBalance = await source.balance

        // 另一个任务可能在这里修改 accounts！
        // 总是在挂起后重新验证

        guard sourceBalance >= amount else {
            throw TransferError.insufficientFunds
        }

        // 尽可能将原子操作放在一起执行
        try await source.withdraw(amount: amount)
        await dest.deposit(amount: amount)
    }
}

// 更安全的模式 - 最小化挂起点
actor SafeAccountManager {
    private var accounts: [String: Decimal] = [:]

    func transfer(amount: Decimal, from sourceID: String, to destID: String) throws {
        // 没有挂起点 - 整个操作是原子的
        guard var sourceBalance = accounts[sourceID],
              accounts[destID] != nil else {
            throw TransferError.accountNotFound
        }

        guard sourceBalance >= amount else {
            throw TransferError.insufficientFunds
        }

        accounts[sourceID] = sourceBalance - amount
        accounts[destID]! += amount
    }
}
```

### 自定义 Actor 执行器（Swift 5.9+）

```swift
actor DatabaseActor {
    private let connection: DatabaseConnection

    // 用于特定线程要求的自定义执行器
    nonisolated var unownedExecutor: UnownedSerialExecutor {
        connection.executor.asUnownedSerialExecutor()
    }

    init(connection: DatabaseConnection) {
        self.connection = connection
    }

    func query(_ sql: String) throws -> [Row] {
        try connection.execute(sql)
    }
}
```

## MainActor

`@MainActor` 属性确保代码在主线程上运行，这对于 UI 更新至关重要。

### 使用 MainActor

```swift
// 整个类隔离到主 actor
@MainActor
class ViewModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    func loadItems() async {
        isLoading = true
        errorMessage = nil

        do {
            // 在后台获取，在主线程分配结果
            let newItems = try await ItemService.fetchItems()
            items = newItems
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

// 单个方法在主 actor 上
class DataProcessor {
    func process() async -> ProcessedData {
        let data = await fetchData()
        let result = await transform(data)

        // 在主 actor 上更新 UI
        await MainActor.run {
            updateUI(with: result)
        }

        return result
    }

    @MainActor
    func updateUI(with data: ProcessedData) {
        // 保证在主线程上运行
        NotificationCenter.default.post(name: .dataUpdated, object: data)
    }
}
```

### MainActor.run

```swift
func fetchAndDisplay() async {
    let data = await networkService.fetchData()

    // 在主 actor 上运行闭包
    await MainActor.run {
        self.displayData(data)
        self.refreshUI()
    }

    // 或者带返回值
    let processedCount = await MainActor.run {
        self.processItems(data.items)
        return self.itemCount
    }
}
```

### SwiftUI 中的 MainActor

```swift
@MainActor
final class ContentViewModel: ObservableObject {
    @Published private(set) var users: [User] = []
    @Published private(set) var state: LoadingState = .idle

    enum LoadingState {
        case idle, loading, loaded, error(String)
    }

    func fetchUsers() async {
        state = .loading

        do {
            users = try await UserService.fetchAllUsers()
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func deleteUser(_ user: User) async {
        do {
            try await UserService.delete(user)
            users.removeAll { $0.id == user.id }
        } catch {
            state = .error("删除用户失败")
        }
    }
}

struct ContentView: View {
    @StateObject private var viewModel = ContentViewModel()

    var body: some View {
        List(viewModel.users) { user in
            UserRow(user: user)
        }
        .task {
            await viewModel.fetchUsers()
        }
    }
}
```

## Sendable

`Sendable` 协议标记可以安全跨并发边界传递的类型。它是 Swift 编译时数据竞争安全的基础。

### Sendable 类型

```swift
// 具有 Sendable 属性的值类型隐式是 Sendable
struct Point: Sendable {
    var x: Double
    var y: Double
}

// 显式标记为 Sendable
struct Configuration: Sendable {
    let apiKey: String
    let environment: Environment
    let timeout: TimeInterval
}

// 当关联值是 Sendable 时，枚举是 Sendable
enum Result<Success: Sendable, Failure: Error>: Sendable {
    case success(Success)
    case failure(Failure)
}
```

### 使类成为 Sendable

```swift
// 具有不可变状态的 final 类
final class ImmutableUser: Sendable {
    let id: String
    let name: String
    let email: String

    init(id: String, name: String, email: String) {
        self.id = id
        self.name = name
        self.email = email
    }
}

// 具有同步访问的类
final class ThreadSafeCounter: @unchecked Sendable {
    private var _count = 0
    private let lock = NSLock()

    var count: Int {
        lock.lock()
        defer { lock.unlock() }
        return _count
    }

    func increment() {
        lock.lock()
        defer { lock.unlock() }
        _count += 1
    }
}
```

### Sendable 闭包

```swift
// @Sendable 闭包可以跨并发边界传递
func performAsync(_ work: @Sendable @escaping () async -> Void) {
    Task {
        await work()
    }
}

// 展示捕获要求的示例
func processItems(_ items: [Item]) {
    let immutableData = items.map { $0.id } // [String] 是 Sendable

    Task {
        // OK - 捕获 Sendable 值
        for id in immutableData {
            await process(id)
        }
    }

    // 这会是一个错误：
    // var mutableCount = 0
    // Task {
    //     mutableCount += 1 // 错误：在 @Sendable 闭包中可变捕获
    // }
}
```

### 泛型 Sendable 约束

```swift
// 需要 Sendable 元素的容器
struct SendableContainer<Value: Sendable>: Sendable {
    let value: Value
}

// 接受 Sendable 类型的 Actor 方法
actor DataStore {
    private var items: [String: any Sendable] = [:]

    func store<T: Sendable>(_ value: T, forKey key: String) {
        items[key] = value
    }

    func retrieve<T: Sendable>(forKey key: String, as type: T.Type) -> T? {
        items[key] as? T
    }
}

// 带 Sendable 约束的 Task 组
func processInParallel<T: Sendable, R: Sendable>(
    items: [T],
    transform: @Sendable (T) async throws -> R
) async throws -> [R] {
    try await withThrowingTaskGroup(of: R.self) { group in
        for item in items {
            group.addTask {
                try await transform(item)
            }
        }

        var results: [R] = []
        for try await result in group {
            results.append(result)
        }
        return results
    }
}
```

### Swift 6 中的 Sendable 检查

```swift
// 启用严格并发检查
// 在 Package.swift 中：
// swiftSettings: [.enableExperimentalFeature("StrictConcurrency")]

// 或使用 Swift 6 语言模式
// swiftSettings: [.swiftLanguageVersion(.v6)]

// Sendable 合规的常见模式

// 1. 使用 actor 处理共享可变状态
actor SharedState {
    var data: [String: Int] = [:]

    func update(_ key: String, value: Int) {
        data[key] = value
    }
}

// 2. 使用适当的同步使类成为 Sendable
final class SynchronizedCache: @unchecked Sendable {
    private let queue = DispatchQueue(label: "cache.queue")
    private var storage: [String: Data] = [:]

    func get(_ key: String) -> Data? {
        queue.sync { storage[key] }
    }

    func set(_ key: String, value: Data) {
        queue.sync { storage[key] = value }
    }
}

// 3. 使用值类型
struct ImmutableConfig: Sendable {
    let settings: [String: String]
    let flags: Set<String>
}
```

## 结构化并发

结构化并发确保子任务不能比其父作用域存活更久，防止常见问题如任务泄漏和孤立操作。

### 任务层次结构

```swift
func processOrder(_ order: Order) async throws {
    // 所有子任务必须在此函数返回前完成
    try await withThrowingTaskGroup(of: Void.self) { group in
        group.addTask {
            try await validateInventory(order)
        }

        group.addTask {
            try await processPayment(order)
        }

        group.addTask {
            try await reserveShipping(order)
        }

        // 等待所有任务 - 如果任何一个抛出错误，其他的被取消
        try await group.waitForAll()
    }

    // 所有子任务保证在这里完成
    await sendConfirmation(order)
}
```

### 自动取消传播

```swift
func fetchAllData() async throws -> CompleteData {
    try await withThrowingTaskGroup(of: PartialData.self) { group in
        group.addTask { try await fetchUserData() }
        group.addTask { try await fetchProductData() }
        group.addTask { try await fetchOrderHistory() }

        var results: [PartialData] = []

        // 如果任何任务抛出错误，所有其他任务自动被取消
        for try await data in group {
            results.append(data)
        }

        return CompleteData(parts: results)
    }
}
```

### withTaskCancellationHandler

```swift
func downloadLargeFile(url: URL) async throws -> Data {
    let downloadTask = URLSession.shared.downloadTask(with: url)

    return try await withTaskCancellationHandler {
        try await withCheckedThrowingContinuation { continuation in
            downloadTask.completionHandler = { localURL, response, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else if let localURL = localURL {
                    do {
                        let data = try Data(contentsOf: localURL)
                        continuation.resume(returning: data)
                    } catch {
                        continuation.resume(throwing: error)
                    }
                }
            }
            downloadTask.resume()
        }
    } onCancel: {
        downloadTask.cancel()
    }
}
```

### Async Let 绑定

```swift
func loadUserDashboard(userID: String) async throws -> Dashboard {
    // 三个都并发开始
    async let profile = fetchProfile(userID)
    async let preferences = fetchPreferences(userID)
    async let notifications = fetchNotifications(userID)

    // 等待所有并组合
    let dashboard = try await Dashboard(
        profile: profile,
        preferences: preferences,
        notifications: notifications
    )

    // 如果提前退出（抛出或返回），待处理的 async let 被取消
    return dashboard
}

// 条件 async let
func loadContent(includeComments: Bool) async throws -> Content {
    async let article = fetchArticle()
    async let author = fetchAuthor()

    // 条件性启动评论获取
    let comments: [Comment]
    if includeComments {
        comments = try await fetchComments()
    } else {
        comments = []
    }

    return try await Content(
        article: article,
        author: author,
        comments: comments
    )
}
```

## AsyncSequence 和 AsyncStream

AsyncSequence 支持对随时间异步到达的值进行迭代。

### 创建 AsyncSequence

```swift
struct Countdown: AsyncSequence {
    typealias Element = Int
    let start: Int

    struct AsyncIterator: AsyncIteratorProtocol {
        var current: Int

        mutating func next() async -> Int? {
            guard current > 0 else { return nil }

            try? await Task.sleep(for: .seconds(1))
            let value = current
            current -= 1
            return value
        }
    }

    func makeAsyncIterator() -> AsyncIterator {
        AsyncIterator(current: start)
    }
}

// 使用
for await number in Countdown(start: 5) {
    print(number) // 5, 4, 3, 2, 1
}
```

### AsyncStream

```swift
// 基本 AsyncStream
func heartbeat(interval: Duration) -> AsyncStream<Date> {
    AsyncStream { continuation in
        let task = Task {
            while !Task.isCancelled {
                continuation.yield(Date())
                try? await Task.sleep(for: interval)
            }
            continuation.finish()
        }

        continuation.onTermination = { _ in
            task.cancel()
        }
    }
}

// 使用
for await timestamp in heartbeat(interval: .seconds(1)) {
    print("心跳: \(timestamp)")
}
```

### AsyncThrowingStream

```swift
func fetchPaginatedResults<T: Decodable>(
    endpoint: String,
    type: T.Type
) -> AsyncThrowingStream<T, Error> {
    AsyncThrowingStream { continuation in
        Task {
            var page = 1
            var hasMore = true

            while hasMore && !Task.isCancelled {
                do {
                    let url = URL(string: "\(endpoint)?page=\(page)")!
                    let (data, _) = try await URLSession.shared.data(from: url)
                    let response = try JSONDecoder().decode(PaginatedResponse<T>.self, from: data)

                    for item in response.items {
                        continuation.yield(item)
                    }

                    hasMore = response.hasNextPage
                    page += 1
                } catch {
                    continuation.finish(throwing: error)
                    return
                }
            }

            continuation.finish()
        }
    }
}
```

### AsyncSequence 操作符

```swift
// Map
let doubled = numbers.map { $0 * 2 }

// Filter
let positive = numbers.filter { $0 > 0 }

// Prefix
let firstFive = numbers.prefix(5)

// Drop
let afterFirst = numbers.dropFirst(3)

// Compacted
let nonNil = optionalNumbers.compactMap { $0 }

// 使用 reduce 组合
let sum = await numbers.reduce(0, +)

// 匹配条件的第一个元素
let firstEven = await numbers.first { $0 % 2 == 0 }

// Contains
let hasNegative = await numbers.contains { $0 < 0 }

// 收集所有到数组
let allValues = try await stream.reduce(into: []) { $0.append($1) }
```

### 实际 AsyncStream 示例

```swift
actor WebSocketManager {
    private var webSocket: URLSessionWebSocketTask?
    private var continuation: AsyncThrowingStream<Message, Error>.Continuation?

    func messages() -> AsyncThrowingStream<Message, Error> {
        AsyncThrowingStream { continuation in
            self.continuation = continuation

            continuation.onTermination = { [weak self] _ in
                Task { await self?.disconnect() }
            }
        }
    }

    func connect(to url: URL) async throws {
        let session = URLSession.shared
        webSocket = session.webSocketTask(with: url)
        webSocket?.resume()

        await receiveMessages()
    }

    private func receiveMessages() async {
        guard let webSocket = webSocket else { return }

        do {
            while true {
                let message = try await webSocket.receive()

                switch message {
                case .string(let text):
                    let decoded = try JSONDecoder().decode(Message.self, from: Data(text.utf8))
                    continuation?.yield(decoded)
                case .data(let data):
                    let decoded = try JSONDecoder().decode(Message.self, from: data)
                    continuation?.yield(decoded)
                @unknown default:
                    break
                }
            }
        } catch {
            continuation?.finish(throwing: error)
        }
    }

    func disconnect() {
        webSocket?.cancel(with: .normalClosure, reason: nil)
        continuation?.finish()
    }
}
```

## 高级模式

### 基于 Actor 的状态机

```swift
actor ConnectionStateMachine {
    enum State: Sendable {
        case disconnected
        case connecting
        case connected(Connection)
        case disconnecting
    }

    private var state: State = .disconnected

    func connect() async throws {
        switch state {
        case .disconnected:
            state = .connecting
            let connection = try await establishConnection()
            state = .connected(connection)

        case .connecting:
            throw ConnectionError.alreadyConnecting

        case .connected:
            throw ConnectionError.alreadyConnected

        case .disconnecting:
            throw ConnectionError.disconnecting
        }
    }

    func disconnect() async {
        guard case .connected(let connection) = state else { return }

        state = .disconnecting
        await connection.close()
        state = .disconnected
    }

    func send(_ message: Message) async throws {
        guard case .connected(let connection) = state else {
            throw ConnectionError.notConnected
        }

        try await connection.send(message)
    }
}
```

### 使用 Task 的防抖

```swift
@MainActor
class SearchViewModel: ObservableObject {
    @Published var query = ""
    @Published var results: [SearchResult] = []

    private var searchTask: Task<Void, Never>?

    func search(_ query: String) {
        // 取消之前的搜索
        searchTask?.cancel()

        guard !query.isEmpty else {
            results = []
            return
        }

        searchTask = Task {
            // 防抖
            try? await Task.sleep(for: .milliseconds(300))

            guard !Task.isCancelled else { return }

            do {
                let searchResults = try await SearchService.search(query)

                guard !Task.isCancelled else { return }

                results = searchResults
            } catch {
                if !Task.isCancelled {
                    results = []
                }
            }
        }
    }
}
```

### 重试模式

```swift
func withRetry<T>(
    maxAttempts: Int = 3,
    delay: Duration = .seconds(1),
    operation: () async throws -> T
) async throws -> T {
    var lastError: Error?

    for attempt in 1...maxAttempts {
        do {
            return try await operation()
        } catch {
            lastError = error

            if attempt < maxAttempts {
                let backoff = Duration.seconds(pow(2.0, Double(attempt - 1)))
                try? await Task.sleep(for: backoff)
            }
        }
    }

    throw lastError!
}

// 使用
let data = try await withRetry(maxAttempts: 3) {
    try await fetchDataFromServer()
}
```

### 超时模式

```swift
func withTimeout<T: Sendable>(
    _ duration: Duration,
    operation: @Sendable () async throws -> T
) async throws -> T {
    try await withThrowingTaskGroup(of: T.self) { group in
        group.addTask {
            try await operation()
        }

        group.addTask {
            try await Task.sleep(for: duration)
            throw TimeoutError()
        }

        guard let result = try await group.next() else {
            throw TimeoutError()
        }

        group.cancelAll()
        return result
    }
}

// 使用
let result = try await withTimeout(.seconds(10)) {
    try await longRunningOperation()
}
```

### 资源池 Actor

```swift
actor ConnectionPool {
    private var available: [Connection] = []
    private var inUse: Set<Connection> = []
    private let maxConnections: Int
    private var waiters: [CheckedContinuation<Connection, Error>] = []

    init(maxConnections: Int) {
        self.maxConnections = maxConnections
    }

    func acquire() async throws -> Connection {
        if let connection = available.popLast() {
            inUse.insert(connection)
            return connection
        }

        if inUse.count < maxConnections {
            let connection = try await createConnection()
            inUse.insert(connection)
            return connection
        }

        // 等待可用连接
        return try await withCheckedThrowingContinuation { continuation in
            waiters.append(continuation)
        }
    }

    func release(_ connection: Connection) {
        inUse.remove(connection)

        if let waiter = waiters.first {
            waiters.removeFirst()
            inUse.insert(connection)
            waiter.resume(returning: connection)
        } else {
            available.append(connection)
        }
    }

    func withConnection<T>(_ operation: (Connection) async throws -> T) async throws -> T {
        let connection = try await acquire()
        defer { release(connection) }
        return try await operation(connection)
    }
}
```

## 从 GCD 迁移

### 转换完成处理器

```swift
// 之前：带完成处理器的 GCD
func fetchDataLegacy(completion: @escaping (Result<Data, Error>) -> Void) {
    DispatchQueue.global().async {
        do {
            let data = try loadDataFromDisk()
            DispatchQueue.main.async {
                completion(.success(data))
            }
        } catch {
            DispatchQueue.main.async {
                completion(.failure(error))
            }
        }
    }
}

// 之后：Async/await
func fetchData() async throws -> Data {
    try await withCheckedThrowingContinuation { continuation in
        fetchDataLegacy { result in
            continuation.resume(with: result)
        }
    }
}

// 或完全重写
func fetchDataModern() async throws -> Data {
    try loadDataFromDisk()
}
```

### 转换 DispatchGroup

```swift
// 之前：DispatchGroup
func loadAllResourcesLegacy(completion: @escaping ([Resource]) -> Void) {
    let group = DispatchGroup()
    var resources: [Resource] = []
    let lock = NSLock()

    for url in resourceURLs {
        group.enter()
        loadResource(from: url) { resource in
            lock.lock()
            resources.append(resource)
            lock.unlock()
            group.leave()
        }
    }

    group.notify(queue: .main) {
        completion(resources)
    }
}

// 之后：TaskGroup
func loadAllResources() async -> [Resource] {
    await withTaskGroup(of: Resource.self) { group in
        for url in resourceURLs {
            group.addTask {
                await loadResource(from: url)
            }
        }

        var resources: [Resource] = []
        for await resource in group {
            resources.append(resource)
        }
        return resources
    }
}
```

### 转换串行队列

```swift
// 之前：用于同步的串行 DispatchQueue
class LegacyCache {
    private let queue = DispatchQueue(label: "cache.queue")
    private var storage: [String: Data] = [:]

    func get(_ key: String) -> Data? {
        queue.sync { storage[key] }
    }

    func set(_ key: String, value: Data) {
        queue.sync { storage[key] = value }
    }
}

// 之后：Actor
actor ModernCache {
    private var storage: [String: Data] = [:]

    func get(_ key: String) -> Data? {
        storage[key]
    }

    func set(_ key: String, value: Data) {
        storage[key] = value
    }
}
```

## 最佳实践

### 优先使用结构化并发

```swift
// 推荐：结构化 - 任务不能比父任务存活更久
func processAllItems(_ items: [Item]) async throws {
    try await withThrowingTaskGroup(of: Void.self) { group in
        for item in items {
            group.addTask {
                try await process(item)
            }
        }
        try await group.waitForAll()
    }
}

// 避免：非结构化 - 潜在的任务泄漏
func processAllItemsUnstructured(_ items: [Item]) {
    for item in items {
        Task {
            try? await process(item)
            // 这些任务在函数返回后继续
        }
    }
}
```

### 使用 Actor 处理共享可变状态

```swift
// 推荐：Actor 提供自动同步
actor Statistics {
    private var values: [Double] = []

    func add(_ value: Double) {
        values.append(value)
    }

    var average: Double {
        values.isEmpty ? 0 : values.reduce(0, +) / Double(values.count)
    }
}

// 避免：手动同步容易出错
class UnsafeStatistics {
    private var values: [Double] = []
    // 缺少同步 = 数据竞争！
}
```

### 适当处理取消

```swift
func longRunningOperation() async throws -> Result {
    var partialResults: [PartialResult] = []

    for chunk in dataChunks {
        // 定期检查取消
        try Task.checkCancellation()

        let result = try await process(chunk)
        partialResults.append(result)
    }

    return Result(partialResults)
}

// 带清理
func operationWithCleanup() async throws -> Data {
    let tempFile = createTempFile()

    return try await withTaskCancellationHandler {
        try await processFile(tempFile)
    } onCancel: {
        // 即使取消也清理
        try? FileManager.default.removeItem(at: tempFile)
    }
}
```

### 最小化 Actor 切换

```swift
// 低效：多次 actor 切换
func updateMultiple() async {
    await actor.updateA()  // 切换到 actor
    await actor.updateB()  // 再次切换
    await actor.updateC()  // 再次切换
}

// 更好：执行多次更新的单个方法
actor DataManager {
    func updateAll() {
        updateA()
        updateB()
        updateC()
    }

    private func updateA() { /* ... */ }
    private func updateB() { /* ... */ }
    private func updateC() { /* ... */ }
}
```

### 对独立并行工作使用 async let

```swift
// 当操作独立时，使用 async let
func loadDashboard() async throws -> Dashboard {
    async let user = fetchUser()
    async let posts = fetchPosts()
    async let notifications = fetchNotifications()

    return try await Dashboard(
        user: user,
        posts: posts,
        notifications: notifications
    )
}
```

### 避免在异步上下文中阻塞

```swift
// 不好：在异步上下文中阻塞调用
func processAsync() async {
    let result = expensiveBlockingOperation() // 阻塞协作线程池
}

// 更好：移到分离任务或适当包装
func processAsync() async {
    let result = await Task.detached(priority: .userInitiated) {
        expensiveBlockingOperation()
    }.value
}
```

### 对 UI 代码使用 MainActor

```swift
@MainActor
class ViewController: UIViewController {
    @Published var data: [Item] = []

    func loadData() async {
        // 在后台获取
        let newData = await DataService.fetchItems()

        // 更新 UI - 已经在主 actor 上
        data = newData
        tableView.reloadData()
    }
}
```

### 设计考虑 Sendable 的 API

```swift
// 好：Sendable 感知的 API 设计
struct Request: Sendable {
    let id: UUID
    let parameters: [String: String]
}

actor RequestHandler {
    func handle(_ request: Request) async -> Response {
        // Request 安全地传递给 actor
    }
}

// 异步工作集合
func processRequests(_ requests: [Request]) async -> [Response] {
    await withTaskGroup(of: Response.self) { group in
        for request in requests {
            group.addTask {
                await handler.handle(request)
            }
        }

        return await group.reduce(into: []) { $0.append($1) }
    }
}
```

## 总结

Swift 并发提供了一个用于编写安全、高效并发代码的综合工具包：

- **Async/await** 将异步代码转换为可读的、看起来像顺序执行的代码
- **Task** 代表具有内置取消支持的并发工作单元
- **TaskGroup** 支持动态并行执行并自动管理生命周期
- **Actors** 通过隔离保护可变状态免受数据竞争
- **MainActor** 确保 UI 更新发生在主线程
- **Sendable** 为跨并发边界的数据提供编译时安全
- **结构化并发** 防止任务泄漏并简化资源管理
- **AsyncSequence** 支持优雅地处理异步数据流

这些特性的组合，加上编译器的强制执行，使得编写有数据竞争的并发代码变得更加困难，同时使正确的并发代码更容易编写和理解。随着 Swift 的持续发展，并发模型将变得更加强大并与语言深度集成。
