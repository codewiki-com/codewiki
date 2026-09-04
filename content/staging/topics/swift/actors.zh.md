---
title: Swift Actor 模型
description: 深入理解 Swift Actor 并发模型，包括 Actor 隔离、nonisolated、@MainActor 与 Sendable 协议
track: swift
section: concurrency
difficulty: advanced
tags:
  - Swift
  - Actor
  - 并发
  - Sendable
  - MainActor
  - 线程安全
status: imported
origin: old/src/content/docs/swift/actors.zh.md
divergence: 0.193
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

### 什么是 Actor

Actor 是 Swift 5.5 引入的一种新的引用类型，专门用于解决并发编程中最棘手的问题：**共享可变状态的数据竞争**。在传统的多线程编程中，当多个线程同时访问和修改同一块数据时，如果没有适当的同步机制，就会产生数据竞争（Data Race），导致程序行为不可预测甚至崩溃。

Actor 通过一种称为 **Actor 隔离（Actor Isolation）** 的机制来解决这个问题。每个 Actor 实例都拥有自己的隔离域（isolated context），同一时间只允许一个任务访问 Actor 的内部状态。这种设计保证了数据访问的串行化，从根本上消除了数据竞争的可能性。

```swift
// Actor 定义语法与 class 非常相似
actor BankAccount {
    private var balance: Decimal

    init(initialBalance: Decimal) {
        self.balance = initialBalance
    }

    func deposit(amount: Decimal) {
        balance += amount
    }

    func withdraw(amount: Decimal) throws -> Decimal {
        guard balance >= amount else {
            throw BankError.insufficientFunds
        }
        balance -= amount
        return amount
    }

    func getBalance() -> Decimal {
        return balance
    }
}
```

### Actor 模型的历史背景

Actor 模型最早由 Carl Hewitt 于 1973 年提出，是一种用于并发计算的数学模型。这个模型的核心思想是将计算看作是由若干独立的 Actor 组成，每个 Actor 都有自己的状态，只能通过消息传递与其他 Actor 通信。

许多编程语言已经实现了 Actor 模型：
- **Erlang/Elixir**：Actor 是语言的核心并发原语
- **Scala/Akka**：通过库实现的 Actor 系统
- **Rust**：Actix 框架提供 Actor 支持

Swift 的 Actor 实现借鉴了这些先驱的经验，但又有其独特之处：它与 Swift 的类型系统深度集成，在编译时就能检测出潜在的并发问题。

### Actor 解决的问题

在没有 Actor 的传统并发编程中，我们需要手动管理锁和同步：

```swift
// 传统方式：使用锁保护共享状态
class TraditionalBankAccount {
    private var balance: Decimal
    private let lock = NSLock()

    init(initialBalance: Decimal) {
        self.balance = initialBalance
    }

    func deposit(amount: Decimal) {
        lock.lock()
        defer { lock.unlock() }
        balance += amount
    }

    func withdraw(amount: Decimal) throws -> Decimal {
        lock.lock()
        defer { lock.unlock() }
        guard balance >= amount else {
            throw BankError.insufficientFunds
        }
        balance -= amount
        return amount
    }
}
```

这种方式存在几个问题：
1. **容易遗忘加锁**：开发者可能忘记在某些方法中加锁
2. **死锁风险**：多个锁的使用可能导致死锁
3. **性能开销**：锁的获取和释放有运行时开销
4. **无法编译时检查**：编译器无法验证锁的正确使用

Actor 将这些责任转移给了编译器和运行时，开发者只需要声明 `actor` 关键字，Swift 就会自动保证线程安全。

## 核心原理

### Actor 隔离机制

Actor 隔离是 Swift Actor 模型的核心。当你将一个类型声明为 `actor` 时，编译器会自动对该类型施加以下约束：

1. **外部访问必须异步**：从 Actor 外部访问其属性或方法必须使用 `await`
2. **内部访问同步执行**：在 Actor 内部，方法可以直接访问其他成员，无需 `await`
3. **串行执行队列**：每个 Actor 实例维护一个逻辑上的串行队列，确保同一时间只有一个任务访问其状态

```swift
actor Counter {
    private var count = 0

    func increment() {
        // 内部访问：直接访问 count，无需 await
        count += 1
    }

    func getCount() -> Int {
        return count
    }
}

// 外部访问：必须使用 await
let counter = Counter()
await counter.increment()
let value = await counter.getCount()
```

### 编译时隔离检查

Swift 编译器会在编译时检查 Actor 隔离规则的遵守情况。如果你尝试在不使用 `await` 的情况下访问 Actor 成员，编译器会报错：

```swift
func badExample(counter: Counter) {
    // 编译错误：Actor-isolated property 'count' can not be referenced from a non-isolated context
    // counter.increment()

    // 正确做法：在异步上下文中使用 await
    Task {
        await counter.increment()
    }
}
```

### Actor 执行器（Executor）

每个 Actor 都有一个关联的执行器（Executor），负责调度和执行 Actor 上的任务。默认情况下，Swift 使用协作式任务调度器来管理 Actor 的执行。

```swift
// Actor 的执行模型（概念性描述）
actor MyActor {
    // Swift 运行时为每个 Actor 维护一个任务队列
    // 任务按照 FIFO 顺序执行
    // 同一时间只有一个任务在执行

    private var state = 0

    func modify() {
        // 当这个方法执行时，其他任务会等待
        state += 1
    }
}
```

### 自定义执行器（Swift 5.9+）

从 Swift 5.9 开始，你可以为 Actor 指定自定义执行器：

```swift
actor CustomExecutorActor {
    // 使用自定义执行器
    nonisolated var unownedExecutor: UnownedSerialExecutor {
        return myCustomExecutor.asUnownedSerialExecutor()
    }

    private var data: [String] = []

    func process(_ item: String) {
        data.append(item)
    }
}
```

## 核心要点

### Actor 与 Class 的区别

| 特性 | Actor | Class |
|------|-------|-------|
| 引用类型 | 是 | 是 |
| 继承 | 不支持（可遵循协议） | 支持 |
| 外部访问 | 需要 await | 直接访问 |
| 线程安全 | 自动保证 | 需手动实现 |
| 初始化 | 类似 class | 类似 actor |
| deinit | 支持 | 支持 |

### Actor 的访问控制

Actor 内部成员的访问遵循特殊规则：

```swift
actor DataManager {
    // 私有状态：只能在 Actor 内部访问
    private var cache: [String: Data] = [:]

    // 公开方法：外部可以调用（需要 await）
    func getData(for key: String) -> Data? {
        return cache[key]
    }

    // 内部方法可以直接访问私有状态
    func updateCache(key: String, data: Data) {
        cache[key] = data
        validateCache()  // 内部调用无需 await
    }

    private func validateCache() {
        // 验证缓存逻辑
    }
}
```

### Actor 的可重入性

Actor 方法是**可重入的（Reentrant）**，这意味着当一个方法在 `await` 点挂起时，其他任务可以开始执行该 Actor 的其他方法：

```swift
actor ImageLoader {
    private var cache: [URL: UIImage] = [:]

    func loadImage(from url: URL) async throws -> UIImage {
        // 检查缓存
        if let cached = cache[url] {
            return cached
        }

        // await 点：此时其他任务可能会执行
        let (data, _) = try await URLSession.shared.data(from: url)

        // await 之后，状态可能已经改变！
        // 另一个任务可能已经将图片放入缓存
        if let cached = cache[url] {
            return cached
        }

        guard let image = UIImage(data: data) else {
            throw ImageError.invalidData
        }

        cache[url] = image
        return image
    }
}
```

### Actor 协议遵循

Actor 可以遵循协议，但有一些限制：

```swift
protocol DataProvider {
    func fetchData() async -> Data
}

// Actor 可以遵循协议
actor NetworkDataProvider: DataProvider {
    func fetchData() async -> Data {
        // 实现...
        return Data()
    }
}

// Actor 自动遵循 Sendable
actor SafeCounter: Sendable {
    private var count = 0
    // ...
}
```

### Actor 与值类型

Actor 内部可以存储值类型，值类型在传出 Actor 时会被复制：

```swift
actor UserManager {
    private var users: [User] = []  // User 是 struct

    func addUser(_ user: User) {
        users.append(user)  // user 被复制进来
    }

    func getAllUsers() -> [User] {
        return users  // 返回数组的副本
    }
}
```

## 代码示例

### 基础 Actor 示例

```swift
// 线程安全的计数器
actor Counter {
    private var value = 0

    func increment() -> Int {
        value += 1
        return value
    }

    func decrement() -> Int {
        value -= 1
        return value
    }

    var currentValue: Int {
        return value
    }
}

// 使用计数器
func demonstrateCounter() async {
    let counter = Counter()

    // 并发增加计数
    await withTaskGroup(of: Int.self) { group in
        for _ in 0..<1000 {
            group.addTask {
                await counter.increment()
            }
        }
    }

    // 最终值一定是 1000，因为 Actor 保证了线程安全
    let finalValue = await counter.currentValue
    print("Final value: \(finalValue)")  // 输出：Final value: 1000
}
```

### nonisolated 关键字

使用 `nonisolated` 标记不需要 Actor 隔离的成员：

```swift
actor Configuration {
    // 不可变属性可以标记为 nonisolated
    nonisolated let appName: String
    nonisolated let version: String

    // 可变状态需要隔离保护
    private var settings: [String: Any] = [:]

    init(appName: String, version: String) {
        self.appName = appName
        self.version = version
    }

    // nonisolated 方法不能访问可变状态
    nonisolated func getAppInfo() -> String {
        return "\(appName) v\(version)"
    }

    // nonisolated 计算属性
    nonisolated var description: String {
        return "App: \(appName), Version: \(version)"
    }

    // 需要访问可变状态的方法保持隔离
    func getSetting(key: String) -> Any? {
        return settings[key]
    }

    func updateSetting(key: String, value: Any) {
        settings[key] = value
    }
}

// 使用 nonisolated 成员
let config = Configuration(appName: "MyApp", version: "1.0")

// 不需要 await，因为是 nonisolated
let info = config.getAppInfo()
print(config.description)

// 需要 await，因为访问隔离状态
let setting = await config.getSetting(key: "theme")
```

### @MainActor 示例

`@MainActor` 是一个特殊的全局 Actor，保证代码在主线程执行：

```swift
// 整个类型标记为 @MainActor
@MainActor
class ViewModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service = DataService()

    func loadItems() async {
        isLoading = true
        errorMessage = nil

        do {
            // service.fetchItems() 可能在后台线程执行
            // 但返回后，更新 items 在主线程（因为 @MainActor）
            items = try await service.fetchItems()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

// 单个方法标记为 @MainActor
class DataProcessor {
    func processData() async -> ProcessedData {
        // 后台处理
        let result = await heavyComputation()

        // 切换到主线程更新 UI
        await updateUI(with: result)

        return result
    }

    @MainActor
    func updateUI(with data: ProcessedData) {
        // 保证在主线程执行
        NotificationCenter.default.post(
            name: .dataUpdated,
            object: data
        )
    }
}

// MainActor.run 动态切换到主线程
func fetchAndDisplay() async {
    let data = await fetchDataFromNetwork()

    await MainActor.run {
        // 这个闭包在主线程执行
        displayData(data)
    }
}
```

### Sendable 协议示例

`Sendable` 标记类型可以安全地跨并发域传递：

```swift
// 值类型自动满足 Sendable（如果所有成员都是 Sendable）
struct Point: Sendable {
    var x: Double
    var y: Double
}

// 不可变类可以是 Sendable
final class ImmutableUser: Sendable {
    let id: String
    let name: String

    init(id: String, name: String) {
        self.id = id
        self.name = name
    }
}

// 使用 @unchecked Sendable 手动保证线程安全
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

// @Sendable 闭包
func performAsync(operation: @escaping @Sendable () async -> Void) {
    Task {
        await operation()
    }
}

// 泛型的 Sendable 约束
struct Container<T: Sendable>: Sendable {
    let value: T
}

// 条件 Sendable
struct Wrapper<T> {
    var wrapped: T
}

extension Wrapper: Sendable where T: Sendable {}
```

### 全局 Actor 示例

创建自定义的全局 Actor：

```swift
// 定义数据库操作的全局 Actor
@globalActor
actor DatabaseActor {
    static let shared = DatabaseActor()

    private init() {}
}

// 使用全局 Actor 标记类型
@DatabaseActor
class DatabaseManager {
    private var connection: DatabaseConnection?

    func connect() async throws {
        connection = try await DatabaseConnection.open()
    }

    func execute(_ query: String) async throws -> [Row] {
        guard let conn = connection else {
            throw DatabaseError.notConnected
        }
        return try await conn.execute(query)
    }

    func close() async {
        await connection?.close()
        connection = nil
    }
}

// 使用全局 Actor 标记单个方法
class UserRepository {
    private let dbManager: DatabaseManager

    init(dbManager: DatabaseManager) {
        self.dbManager = dbManager
    }

    @DatabaseActor
    func saveUser(_ user: User) async throws {
        let query = "INSERT INTO users VALUES ('\(user.id)', '\(user.name)')"
        _ = try await dbManager.execute(query)
    }

    @DatabaseActor
    func fetchUser(id: String) async throws -> User? {
        let query = "SELECT * FROM users WHERE id = '\(id)'"
        let rows = try await dbManager.execute(query)
        return rows.first.map { User(row: $0) }
    }
}
```

### 复杂 Actor 示例：图片缓存

```swift
actor ImageCache {
    static let shared = ImageCache()

    private var memoryCache: [URL: UIImage] = [:]
    private var downloadTasks: [URL: Task<UIImage, Error>] = [:]
    private let maxCacheSize = 100

    private init() {}

    func image(for url: URL) async throws -> UIImage {
        // 1. 检查内存缓存
        if let cached = memoryCache[url] {
            return cached
        }

        // 2. 检查是否有正在进行的下载
        if let existingTask = downloadTasks[url] {
            return try await existingTask.value
        }

        // 3. 开始新下载
        let task = Task<UIImage, Error> {
            let (data, response) = try await URLSession.shared.data(from: url)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw ImageCacheError.downloadFailed
            }

            guard let image = UIImage(data: data) else {
                throw ImageCacheError.invalidImageData
            }

            return image
        }

        downloadTasks[url] = task

        do {
            let image = try await task.value

            // 缓存管理
            if memoryCache.count >= maxCacheSize {
                // 简单的 LRU：移除第一个元素
                if let firstKey = memoryCache.keys.first {
                    memoryCache.removeValue(forKey: firstKey)
                }
            }

            memoryCache[url] = image
            downloadTasks.removeValue(forKey: url)

            return image
        } catch {
            downloadTasks.removeValue(forKey: url)
            throw error
        }
    }

    func prefetch(urls: [URL]) {
        for url in urls {
            Task {
                _ = try? await image(for: url)
            }
        }
    }

    func clearCache() {
        memoryCache.removeAll()
    }

    nonisolated var cacheDescription: String {
        return "ImageCache with max size: \(maxCacheSize)"
    }
}

enum ImageCacheError: Error {
    case downloadFailed
    case invalidImageData
}
```

## 最佳实践

### 最小化 Actor 边界跨越

每次跨越 Actor 边界都有性能开销，应该批量处理操作：

```swift
// 不推荐：多次跨越 Actor 边界
actor BadCounter {
    private var count = 0
    func increment() { count += 1 }
    func getCount() -> Int { count }
}

func badUsage(counter: BadCounter) async {
    for _ in 0..<1000 {
        await counter.increment()  // 1000 次 Actor 跳转！
    }
}

// 推荐：批量操作
actor GoodCounter {
    private var count = 0

    func incrementBy(_ amount: Int) {
        count += amount
    }

    func getCount() -> Int { count }
}

func goodUsage(counter: GoodCounter) async {
    await counter.incrementBy(1000)  // 只有 1 次 Actor 跳转
}
```

### 正确使用 nonisolated

只有真正不需要保护的成员才应该标记为 `nonisolated`：

```swift
actor UserSession {
    // 不可变数据：安全地使用 nonisolated
    nonisolated let sessionId: String
    nonisolated let createdAt: Date

    // 可变数据：需要 Actor 保护
    private var accessToken: String
    private var lastAccessTime: Date

    init(sessionId: String, accessToken: String) {
        self.sessionId = sessionId
        self.createdAt = Date()
        self.accessToken = accessToken
        self.lastAccessTime = Date()
    }

    // nonisolated 方法只能访问 nonisolated 成员
    nonisolated func getSessionInfo() -> String {
        return "Session \(sessionId) created at \(createdAt)"
    }

    // 访问可变状态的方法保持隔离
    func refreshToken(newToken: String) {
        accessToken = newToken
        lastAccessTime = Date()
    }
}
```

### 处理 Actor 重入

在 `await` 点后重新验证状态：

```swift
actor ShoppingCart {
    private var items: [CartItem] = []
    private var isCheckingOut = false

    func checkout() async throws -> Order {
        // 防止重复结账
        guard !isCheckingOut else {
            throw CartError.alreadyCheckingOut
        }

        isCheckingOut = true
        defer { isCheckingOut = false }

        // 记录结账时的商品
        let itemsToCheckout = items

        guard !itemsToCheckout.isEmpty else {
            throw CartError.emptyCart
        }

        // await 点：可能发生重入
        let order = try await OrderService.createOrder(items: itemsToCheckout)

        // 重新验证：确保商品没有在 await 期间被修改
        guard items == itemsToCheckout else {
            try await OrderService.cancelOrder(order)
            throw CartError.cartModifiedDuringCheckout
        }

        items.removeAll()
        return order
    }

    func addItem(_ item: CartItem) throws {
        guard !isCheckingOut else {
            throw CartError.cannotModifyDuringCheckout
        }
        items.append(item)
    }
}
```

### 优先使用 @MainActor 而非 DispatchQueue.main

```swift
// 不推荐：混用 GCD
class OldStyleViewModel {
    var data: [String] = []

    func loadData() async {
        let result = await fetchData()
        DispatchQueue.main.async {
            self.data = result  // 可能存在数据竞争
        }
    }
}

// 推荐：使用 @MainActor
@MainActor
class ModernViewModel {
    var data: [String] = []

    func loadData() async {
        let result = await fetchData()
        data = result  // 自动在主线程执行，类型安全
    }
}
```

### 为 Sendable 检查做好准备

Swift 6 将启用严格的 Sendable 检查，现在就应该注意：

```swift
// 确保跨 Actor 边界传递的类型是 Sendable
struct Message: Sendable {
    let id: UUID
    let content: String
    let timestamp: Date
}

actor MessageQueue {
    private var messages: [Message] = []

    func enqueue(_ message: Message) {  // Message 是 Sendable
        messages.append(message)
    }

    func dequeue() -> Message? {
        guard !messages.isEmpty else { return nil }
        return messages.removeFirst()
    }
}
```

## 常见陷阱

### 陷阱一：忽视 Actor 重入性

```swift
actor BankAccount {
    private var balance: Decimal = 1000

    // 危险：假设余额不会在 await 期间改变
    func transferUnsafe(amount: Decimal, to other: BankAccount) async throws {
        guard balance >= amount else {
            throw BankError.insufficientFunds
        }

        balance -= amount  // 扣款
        await other.deposit(amount)  // await 期间余额可能被其他操作修改！
    }

    // 安全：使用事务性思维
    func transferSafe(amount: Decimal, to other: BankAccount) async throws {
        let currentBalance = balance
        guard currentBalance >= amount else {
            throw BankError.insufficientFunds
        }

        // 先尝试存款（可能失败）
        do {
            await other.deposit(amount)
        } catch {
            throw TransferError.depositFailed
        }

        // 只有存款成功后才扣款
        // 再次检查余额（防止 await 期间被修改）
        guard balance >= amount else {
            // 回滚
            await other.withdraw(amount)
            throw BankError.insufficientFunds
        }

        balance -= amount
    }

    func deposit(_ amount: Decimal) {
        balance += amount
    }

    func withdraw(_ amount: Decimal) throws -> Decimal {
        guard balance >= amount else {
            throw BankError.insufficientFunds
        }
        balance -= amount
        return amount
    }
}
```

### 陷阱二：在 Actor 中持有非 Sendable 引用类型

```swift
// 危险：持有非 Sendable 的引用类型
class UnsafeData {
    var value = 0
}

actor DangerousActor {
    var unsafeRef: UnsafeData?  // 编译器会警告！

    func setData(_ data: UnsafeData) {
        unsafeRef = data
    }
}

// 安全：使用 Sendable 类型
struct SafeData: Sendable {
    var value: Int
}

actor SafeActor {
    var safeData: SafeData?

    func setData(_ data: SafeData) {
        safeData = data
    }
}
```

### 陷阱三：死锁风险

虽然单个 Actor 内部不会死锁，但多个 Actor 之间仍然可能：

```swift
actor ActorA {
    func doSomething(with b: ActorB) async {
        // 持有 ActorA 的隔离
        await b.callBack(to: self)  // 等待 ActorB
    }

    func callback() {
        print("ActorA callback")
    }
}

actor ActorB {
    func callBack(to a: ActorA) async {
        // 持有 ActorB 的隔离
        await a.callback()  // 如果 ActorA 正在等待我们...
    }
}

// 潜在死锁场景
// 1. TaskA 调用 actorA.doSomething(with: actorB)
// 2. TaskB 同时调用 actorB.callBack(to: actorA)
// 3. 两个任务互相等待

// 解决方案：避免循环依赖，或使用非隔离的回调
```

### 陷阱四：误用 @unchecked Sendable

```swift
// 危险：不正确地使用 @unchecked Sendable
final class BrokenSendable: @unchecked Sendable {
    var counter = 0  // 没有同步保护！

    func increment() {
        counter += 1  // 数据竞争！
    }
}

// 正确：使用 @unchecked Sendable 必须手动保证线程安全
final class CorrectSendable: @unchecked Sendable {
    private var _counter = 0
    private let lock = NSLock()

    var counter: Int {
        lock.lock()
        defer { lock.unlock() }
        return _counter
    }

    func increment() {
        lock.lock()
        defer { lock.unlock() }
        _counter += 1
    }
}
```

### 陷阱五：在 nonisolated 中访问隔离状态

```swift
actor DataStore {
    private var cache: [String: Data] = [:]

    // 编译错误：nonisolated 方法不能访问隔离属性
    // nonisolated func badMethod() {
    //     print(cache.count)  // 错误！
    // }

    // 正确：nonisolated 只能访问 nonisolated 成员
    nonisolated let maxSize = 1000

    nonisolated func goodMethod() {
        print("Max cache size: \(maxSize)")  // OK
    }
}
```

## 性能考量

### Actor 跳转开销

每次跨越 Actor 边界都涉及任务调度，有一定开销：

```swift
// 性能测试示例
actor PerformanceTest {
    private var count = 0

    func increment() {
        count += 1
    }

    func incrementBatch(_ times: Int) {
        for _ in 0..<times {
            count += 1
        }
    }

    func getCount() -> Int { count }
}

func measurePerformance() async {
    let actor = PerformanceTest()

    // 慢：10000 次 Actor 跳转
    let slowStart = Date()
    for _ in 0..<10000 {
        await actor.increment()
    }
    let slowDuration = Date().timeIntervalSince(slowStart)

    // 快：只有 1 次 Actor 跳转
    let fastStart = Date()
    await actor.incrementBatch(10000)
    let fastDuration = Date().timeIntervalSince(fastStart)

    print("Slow: \(slowDuration)s, Fast: \(fastDuration)s")
    // 批量操作通常快 10-100 倍
}
```

### 内存开销

每个 Actor 实例都有额外的运行时开销：

- Actor 执行器状态
- 任务队列管理
- 隔离上下文信息

对于需要创建大量实例的场景，考虑是否真的需要 Actor：

```swift
// 不推荐：为每个数据项创建 Actor
actor ExpensiveItem {
    var value: Int
    init(value: Int) { self.value = value }
}

// 推荐：使用单个 Actor 管理多个数据
actor ItemManager {
    private var items: [Int: Int] = [:]

    func setValue(_ value: Int, for id: Int) {
        items[id] = value
    }

    func getValue(for id: Int) -> Int? {
        return items[id]
    }
}
```

### 选择合适的并发工具

| 场景 | 推荐方案 |
|------|----------|
| 共享可变状态 | Actor |
| UI 更新 | @MainActor |
| 只读数据 | struct（值类型） |
| 不可变引用类型 | final class + Sendable |
| 简单计数器 | 原子操作 |
| 遗留代码兼容 | NSLock + @unchecked Sendable |

## 实战场景

### 场景一：网络请求管理器

```swift
actor NetworkManager {
    static let shared = NetworkManager()

    private var activeTasks: [URL: Task<Data, Error>] = [:]
    private let session: URLSession
    private var requestCount = 0

    private init() {
        let config = URLSessionConfiguration.default
        config.httpMaximumConnectionsPerHost = 6
        session = URLSession(configuration: config)
    }

    func fetchData(from url: URL) async throws -> Data {
        requestCount += 1

        // 请求去重
        if let existingTask = activeTasks[url] {
            return try await existingTask.value
        }

        let task = Task<Data, Error> {
            defer {
                Task { await self.removeTask(for: url) }
            }

            let (data, response) = try await session.data(from: url)

            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                throw NetworkError.invalidResponse
            }

            return data
        }

        activeTasks[url] = task
        return try await task.value
    }

    private func removeTask(for url: URL) {
        activeTasks.removeValue(forKey: url)
    }

    nonisolated var description: String {
        return "NetworkManager"
    }

    func getRequestCount() -> Int {
        return requestCount
    }
}

// 使用示例
func loadUserProfile(userId: String) async throws -> UserProfile {
    let url = URL(string: "https://api.example.com/users/\(userId)")!
    let data = try await NetworkManager.shared.fetchData(from: url)
    return try JSONDecoder().decode(UserProfile.self, from: data)
}
```

### 场景二：状态管理器

```swift
@MainActor
class AppStateManager: ObservableObject {
    static let shared = AppStateManager()

    @Published private(set) var currentUser: User?
    @Published private(set) var isAuthenticated = false
    @Published private(set) var settings: AppSettings = .default

    private let authService = AuthService()
    private let settingsStore = SettingsStore()

    private init() {}

    func login(email: String, password: String) async throws {
        let user = try await authService.login(email: email, password: password)
        currentUser = user
        isAuthenticated = true

        // 加载用户设置
        settings = await settingsStore.loadSettings(for: user.id)
    }

    func logout() async {
        await authService.logout()
        currentUser = nil
        isAuthenticated = false
        settings = .default
    }

    func updateSettings(_ newSettings: AppSettings) async {
        settings = newSettings
        if let userId = currentUser?.id {
            await settingsStore.saveSettings(newSettings, for: userId)
        }
    }
}

actor SettingsStore {
    private var cache: [String: AppSettings] = [:]

    func loadSettings(for userId: String) -> AppSettings {
        if let cached = cache[userId] {
            return cached
        }

        // 从持久化存储加载
        let settings = loadFromDisk(userId: userId) ?? .default
        cache[userId] = settings
        return settings
    }

    func saveSettings(_ settings: AppSettings, for userId: String) {
        cache[userId] = settings
        saveToDisk(settings, userId: userId)
    }

    private func loadFromDisk(userId: String) -> AppSettings? {
        // 实现磁盘读取
        return nil
    }

    private func saveToDisk(_ settings: AppSettings, userId: String) {
        // 实现磁盘写入
    }
}
```

### 场景三：实时数据同步

```swift
actor RealtimeSync {
    private var pendingChanges: [Change] = []
    private var isSyncing = false
    private var syncTask: Task<Void, Never>?
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func scheduleChange(_ change: Change) {
        pendingChanges.append(change)
        startSyncIfNeeded()
    }

    private func startSyncIfNeeded() {
        guard syncTask == nil else { return }

        syncTask = Task {
            await performSync()
            syncTask = nil
        }
    }

    private func performSync() async {
        while !pendingChanges.isEmpty {
            isSyncing = true

            let batch = Array(pendingChanges.prefix(10))
            pendingChanges.removeFirst(min(10, pendingChanges.count))

            do {
                try await syncBatch(batch)
            } catch {
                // 失败的变更重新加入队列
                pendingChanges.insert(contentsOf: batch, at: 0)

                // 指数退避重试
                try? await Task.sleep(for: .seconds(5))
            }
        }

        isSyncing = false
    }

    private func syncBatch(_ changes: [Change]) async throws {
        try await withThrowingTaskGroup(of: Void.self) { group in
            for change in changes {
                group.addTask {
                    try await self.apiClient.sync(change)
                }
            }
            try await group.waitForAll()
        }
    }

    func cancelPendingChanges() {
        pendingChanges.removeAll()
        syncTask?.cancel()
        syncTask = nil
    }

    var hasPendingChanges: Bool {
        return !pendingChanges.isEmpty
    }
}
```

## 面试要点

### 什么是 Actor，它解决了什么问题？

**答案要点**：
- Actor 是 Swift 5.5 引入的引用类型，用于保护共享可变状态
- 通过 Actor 隔离机制，保证同一时间只有一个任务可以访问 Actor 的内部状态
- 解决了并发编程中的数据竞争问题
- 编译器在编译时强制执行隔离规则

### Actor 与 Class 的主要区别是什么？

**答案要点**：
- Actor 不支持继承（但可以遵循协议）
- Actor 的外部访问必须是异步的（需要 await）
- Actor 自动提供线程安全保证
- Actor 自动遵循 Sendable 协议

### 解释 nonisolated 关键字的作用

**答案要点**：
- 标记不需要 Actor 隔离保护的成员
- 可以在同步上下文中访问，无需 await
- 只能访问其他 nonisolated 成员或常量
- 常用于只读属性和不涉及可变状态的方法

### @MainActor 的作用是什么？

**答案要点**：
- 确保代码在主线程执行
- 用于 UI 更新和 UI 相关的逻辑
- 可以标记类型、方法或属性
- 是一个全局 Actor，整个应用共享

### 什么是 Sendable，为什么重要？

**答案要点**：
- Sendable 标记类型可以安全地跨并发边界传递
- 值类型（如果成员都是 Sendable）自动满足
- 不可变类可以是 Sendable
- 对于可变类，需要使用 @unchecked Sendable 并手动保证线程安全
- Swift 6 将强制执行 Sendable 检查

### 什么是 Actor 重入性？如何处理？

**答案要点**：
- Actor 方法在 await 点可以被其他任务"重入"
- await 期间，其他任务可能修改 Actor 状态
- 需要在 await 后重新验证状态
- 使用局部变量捕获关键状态
- 考虑使用标志位防止并发操作

### 如何在 Actor 中实现批量操作以提高性能？

```swift
actor OptimizedStore {
    private var data: [String: Data] = [:]

    // 单个操作
    func set(_ key: String, value: Data) {
        data[key] = value
    }

    // 批量操作 - 减少 Actor 跳转
    func setMultiple(_ items: [(String, Data)]) {
        for (key, value) in items {
            data[key] = value
        }
    }
}
```

### 编写一个线程安全的单例 Actor

```swift
actor ConfigurationManager {
    static let shared = ConfigurationManager()

    private var config: [String: Any] = [:]

    private init() {
        loadDefaultConfig()
    }

    private func loadDefaultConfig() {
        config = [
            "apiEndpoint": "https://api.example.com",
            "timeout": 30
        ]
    }

    func get(_ key: String) -> Any? {
        return config[key]
    }

    func set(_ key: String, value: Any) {
        config[key] = value
    }
}
```

## 延伸阅读

### 官方文档

- [Swift 官方文档 - Concurrency](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/)
- [SE-0306: Actors](https://github.com/apple/swift-evolution/blob/main/proposals/0306-actors.zh.md)
- [SE-0302: Sendable and @Sendable closures](https://github.com/apple/swift-evolution/blob/main/proposals/0302-concurrent-value-and-concurrent-closures.zh.md)
- [SE-0316: Global actors](https://github.com/apple/swift-evolution/blob/main/proposals/0316-global-actors.zh.md)
- [SE-0337: Incremental migration to concurrency checking](https://github.com/apple/swift-evolution/blob/main/proposals/0337-support-incremental-migration-to-concurrency-checking.md)

### WWDC 视频

- [WWDC21: Protect mutable state with Swift actors](https://developer.apple.com/videos/play/wwdc2021/10133/)
- [WWDC21: Swift concurrency: Behind the scenes](https://developer.apple.com/videos/play/wwdc2021/10254/)
- [WWDC22: Eliminate data races using Swift Concurrency](https://developer.apple.com/videos/play/wwdc2022/110351/)
- [WWDC23: Beyond the basics of structured concurrency](https://developer.apple.com/videos/play/wwdc2023/10170/)

### 深入文章

- [Swift.org - Concurrency](https://www.swift.org/documentation/concurrency/)
- [Hacking with Swift - What are actors?](https://www.hackingwithswift.com/swift/5.5/actors)
- [Swift by Sundell - Actors in Swift](https://www.swiftbysundell.com/articles/swift-actors/)
- [Point-Free - Concurrency](https://www.pointfree.co/collections/concurrency)

### 相关话题

- [Swift 并发编程完全指南](/swift/concurrency) - 本站 async/await 与 Task 详解
- [Swift 内存管理 (ARC)](/swift/arc) - 理解引用计数与循环引用
- [Swift Combine 框架](/swift/combine) - 响应式编程与并发

---

*最后更新：2026-01-07*
