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
origin: old/src/content/docs/swift/actors.en.md
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

## Concept Explanation

### What is an Actor

Actor is a new reference type introduced in Swift 5.5, specifically designed to solve the most challenging problem in concurrent programming: **data races with shared mutable state**. In traditional multi-threaded programming, when multiple threads access and modify the same data simultaneously without proper synchronization mechanisms, data races occur, leading to unpredictable program behavior or even crashes.

Actor solves this problem through a mechanism called **Actor Isolation**. Each Actor instance has its own isolated context, and only one task is allowed to access the Actor's internal state at a time. This design guarantees serialized data access, fundamentally eliminating the possibility of data races.

```swift
// Actor definition syntax is very similar to class
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

### Historical Background of the Actor Model

The Actor model was first proposed by Carl Hewitt in 1973 as a mathematical model for concurrent computation. The core idea of this model is to view computation as consisting of several independent Actors, where each Actor has its own state and can only communicate with other Actors through message passing.

Many programming languages have implemented the Actor model:
- **Erlang/Elixir**: Actors are the core concurrency primitive of the language
- **Scala/Akka**: Actor system implemented through libraries
- **Rust**: Actix framework provides Actor support

Swift's Actor implementation draws from the experience of these predecessors but has its unique characteristics: it deeply integrates with Swift's type system and can detect potential concurrency issues at compile time.

### Problems Solved by Actors

In traditional concurrent programming without Actors, we need to manually manage locks and synchronization:

```swift
// Traditional approach: using locks to protect shared state
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

This approach has several problems:
1. **Easy to forget locking**: Developers might forget to lock in certain methods
2. **Deadlock risk**: Using multiple locks can lead to deadlocks
3. **Performance overhead**: Lock acquisition and release have runtime overhead
4. **No compile-time checking**: The compiler cannot verify correct lock usage

Actors transfer these responsibilities to the compiler and runtime. Developers only need to declare the `actor` keyword, and Swift will automatically guarantee thread safety.

## Core Principles

### Actor Isolation Mechanism

Actor isolation is the core of the Swift Actor model. When you declare a type as `actor`, the compiler automatically enforces the following constraints on that type:

1. **External access must be asynchronous**: Accessing Actor properties or methods from outside the Actor must use `await`
2. **Internal access executes synchronously**: Within an Actor, methods can directly access other members without `await`
3. **Serial execution queue**: Each Actor instance maintains a logical serial queue, ensuring only one task accesses its state at a time

```swift
actor Counter {
    private var count = 0

    func increment() {
        // Internal access: directly access count, no await needed
        count += 1
    }

    func getCount() -> Int {
        return count
    }
}

// External access: must use await
let counter = Counter()
await counter.increment()
let value = await counter.getCount()
```

### Compile-time Isolation Checking

The Swift compiler checks Actor isolation rule compliance at compile time. If you try to access Actor members without using `await`, the compiler will report an error:

```swift
func badExample(counter: Counter) {
    // Compile error: Actor-isolated property 'count' can not be referenced from a non-isolated context
    // counter.increment()

    // Correct approach: use await in an asynchronous context
    Task {
        await counter.increment()
    }
}
```

### Actor Executor

Each Actor has an associated executor responsible for scheduling and executing tasks on the Actor. By default, Swift uses a cooperative task scheduler to manage Actor execution.

```swift
// Actor execution model (conceptual description)
actor MyActor {
    // Swift runtime maintains a task queue for each Actor
    // Tasks execute in FIFO order
    // Only one task executes at a time

    private var state = 0

    func modify() {
        // When this method executes, other tasks wait
        state += 1
    }
}
```

### Custom Executors (Swift 5.9+)

Starting from Swift 5.9, you can specify custom executors for Actors:

```swift
actor CustomExecutorActor {
    // Use custom executor
    nonisolated var unownedExecutor: UnownedSerialExecutor {
        return myCustomExecutor.asUnownedSerialExecutor()
    }

    private var data: [String] = []

    func process(_ item: String) {
        data.append(item)
    }
}
```

## Key Points

### Differences Between Actor and Class

| Feature | Actor | Class |
|---------|-------|-------|
| Reference type | Yes | Yes |
| Inheritance | Not supported (can conform to protocols) | Supported |
| External access | Requires await | Direct access |
| Thread safety | Automatically guaranteed | Must implement manually |
| Initialization | Similar to class | Similar to actor |
| deinit | Supported | Supported |

### Actor Access Control

Access to Actor internal members follows special rules:

```swift
actor DataManager {
    // Private state: only accessible within the Actor
    private var cache: [String: Data] = [:]

    // Public method: can be called externally (requires await)
    func getData(for key: String) -> Data? {
        return cache[key]
    }

    // Internal methods can directly access private state
    func updateCache(key: String, data: Data) {
        cache[key] = data
        validateCache()  // Internal call without await
    }

    private func validateCache() {
        // Cache validation logic
    }
}
```

### Actor Reentrancy

Actor methods are **reentrant**, meaning when a method suspends at an `await` point, other tasks can start executing other methods of that Actor:

```swift
actor ImageLoader {
    private var cache: [URL: UIImage] = [:]

    func loadImage(from url: URL) async throws -> UIImage {
        // Check cache
        if let cached = cache[url] {
            return cached
        }

        // await point: other tasks may execute at this time
        let (data, _) = try await URLSession.shared.data(from: url)

        // After await, state may have changed!
        // Another task might have already put the image in cache
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

### Actor Protocol Conformance

Actors can conform to protocols with some restrictions:

```swift
protocol DataProvider {
    func fetchData() async -> Data
}

// Actor can conform to protocols
actor NetworkDataProvider: DataProvider {
    func fetchData() async -> Data {
        // Implementation...
        return Data()
    }
}

// Actors automatically conform to Sendable
actor SafeCounter: Sendable {
    private var count = 0
    // ...
}
```

### Actors and Value Types

Actors can store value types internally; value types are copied when passed out of the Actor:

```swift
actor UserManager {
    private var users: [User] = []  // User is a struct

    func addUser(_ user: User) {
        users.append(user)  // user is copied in
    }

    func getAllUsers() -> [User] {
        return users  // Returns a copy of the array
    }
}
```

## Code Examples

### Basic Actor Example

```swift
// Thread-safe counter
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

// Using the counter
func demonstrateCounter() async {
    let counter = Counter()

    // Concurrently increment
    await withTaskGroup(of: Int.self) { group in
        for _ in 0..<1000 {
            group.addTask {
                await counter.increment()
            }
        }
    }

    // Final value is definitely 1000 because Actor guarantees thread safety
    let finalValue = await counter.currentValue
    print("Final value: \(finalValue)")  // Output: Final value: 1000
}
```

### nonisolated Keyword

Use `nonisolated` to mark members that don't need Actor isolation:

```swift
actor Configuration {
    // Immutable properties can be marked as nonisolated
    nonisolated let appName: String
    nonisolated let version: String

    // Mutable state needs isolation protection
    private var settings: [String: Any] = [:]

    init(appName: String, version: String) {
        self.appName = appName
        self.version = version
    }

    // nonisolated methods cannot access mutable state
    nonisolated func getAppInfo() -> String {
        return "\(appName) v\(version)"
    }

    // nonisolated computed property
    nonisolated var description: String {
        return "App: \(appName), Version: \(version)"
    }

    // Methods that need to access mutable state remain isolated
    func getSetting(key: String) -> Any? {
        return settings[key]
    }

    func updateSetting(key: String, value: Any) {
        settings[key] = value
    }
}

// Using nonisolated members
let config = Configuration(appName: "MyApp", version: "1.0")

// No await needed because it's nonisolated
let info = config.getAppInfo()
print(config.description)

// Await needed because accessing isolated state
let setting = await config.getSetting(key: "theme")
```

### @MainActor Example

`@MainActor` is a special global Actor that ensures code executes on the main thread:

```swift
// Entire type marked as @MainActor
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
            // service.fetchItems() may execute on a background thread
            // But after returning, updating items is on the main thread (because of @MainActor)
            items = try await service.fetchItems()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

// Single method marked as @MainActor
class DataProcessor {
    func processData() async -> ProcessedData {
        // Background processing
        let result = await heavyComputation()

        // Switch to main thread to update UI
        await updateUI(with: result)

        return result
    }

    @MainActor
    func updateUI(with data: ProcessedData) {
        // Guaranteed to execute on main thread
        NotificationCenter.default.post(
            name: .dataUpdated,
            object: data
        )
    }
}

// MainActor.run dynamically switches to main thread
func fetchAndDisplay() async {
    let data = await fetchDataFromNetwork()

    await MainActor.run {
        // This closure executes on the main thread
        displayData(data)
    }
}
```

### Sendable Protocol Example

`Sendable` marks types that can be safely passed across concurrency domains:

```swift
// Value types automatically satisfy Sendable (if all members are Sendable)
struct Point: Sendable {
    var x: Double
    var y: Double
}

// Immutable classes can be Sendable
final class ImmutableUser: Sendable {
    let id: String
    let name: String

    init(id: String, name: String) {
        self.id = id
        self.name = name
    }
}

// Using @unchecked Sendable to manually guarantee thread safety
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

// @Sendable closures
func performAsync(operation: @escaping @Sendable () async -> Void) {
    Task {
        await operation()
    }
}

// Generic Sendable constraints
struct Container<T: Sendable>: Sendable {
    let value: T
}

// Conditional Sendable
struct Wrapper<T> {
    var wrapped: T
}

extension Wrapper: Sendable where T: Sendable {}
```

### Global Actor Example

Creating custom global Actors:

```swift
// Define a global Actor for database operations
@globalActor
actor DatabaseActor {
    static let shared = DatabaseActor()

    private init() {}
}

// Use global Actor to mark types
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

// Use global Actor to mark individual methods
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

### Complex Actor Example: Image Cache

```swift
actor ImageCache {
    static let shared = ImageCache()

    private var memoryCache: [URL: UIImage] = [:]
    private var downloadTasks: [URL: Task<UIImage, Error>] = [:]
    private let maxCacheSize = 100

    private init() {}

    func image(for url: URL) async throws -> UIImage {
        // 1. Check memory cache
        if let cached = memoryCache[url] {
            return cached
        }

        // 2. Check if there's an ongoing download
        if let existingTask = downloadTasks[url] {
            return try await existingTask.value
        }

        // 3. Start new download
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

            // Cache management
            if memoryCache.count >= maxCacheSize {
                // Simple LRU: remove first element
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

## Best Practices

### Minimize Actor Boundary Crossings

Each Actor boundary crossing has performance overhead; batch operations should be used:

```swift
// Not recommended: multiple Actor boundary crossings
actor BadCounter {
    private var count = 0
    func increment() { count += 1 }
    func getCount() -> Int { count }
}

func badUsage(counter: BadCounter) async {
    for _ in 0..<1000 {
        await counter.increment()  // 1000 Actor hops!
    }
}

// Recommended: batch operations
actor GoodCounter {
    private var count = 0

    func incrementBy(_ amount: Int) {
        count += amount
    }

    func getCount() -> Int { count }
}

func goodUsage(counter: GoodCounter) async {
    await counter.incrementBy(1000)  // Only 1 Actor hop
}
```

### Use nonisolated Correctly

Only members that truly don't need protection should be marked as `nonisolated`:

```swift
actor UserSession {
    // Immutable data: safe to use nonisolated
    nonisolated let sessionId: String
    nonisolated let createdAt: Date

    // Mutable data: needs Actor protection
    private var accessToken: String
    private var lastAccessTime: Date

    init(sessionId: String, accessToken: String) {
        self.sessionId = sessionId
        self.createdAt = Date()
        self.accessToken = accessToken
        self.lastAccessTime = Date()
    }

    // nonisolated methods can only access nonisolated members
    nonisolated func getSessionInfo() -> String {
        return "Session \(sessionId) created at \(createdAt)"
    }

    // Methods accessing mutable state remain isolated
    func refreshToken(newToken: String) {
        accessToken = newToken
        lastAccessTime = Date()
    }
}
```

### Handle Actor Reentrancy

Re-validate state after `await` points:

```swift
actor ShoppingCart {
    private var items: [CartItem] = []
    private var isCheckingOut = false

    func checkout() async throws -> Order {
        // Prevent duplicate checkout
        guard !isCheckingOut else {
            throw CartError.alreadyCheckingOut
        }

        isCheckingOut = true
        defer { isCheckingOut = false }

        // Record items at checkout time
        let itemsToCheckout = items

        guard !itemsToCheckout.isEmpty else {
            throw CartError.emptyCart
        }

        // await point: reentrancy may occur
        let order = try await OrderService.createOrder(items: itemsToCheckout)

        // Re-validate: ensure items weren't modified during await
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

### Prefer @MainActor Over DispatchQueue.main

```swift
// Not recommended: mixing GCD
class OldStyleViewModel {
    var data: [String] = []

    func loadData() async {
        let result = await fetchData()
        DispatchQueue.main.async {
            self.data = result  // Potential data race
        }
    }
}

// Recommended: use @MainActor
@MainActor
class ModernViewModel {
    var data: [String] = []

    func loadData() async {
        let result = await fetchData()
        data = result  // Automatically executes on main thread, type-safe
    }
}
```

### Prepare for Sendable Checking

Swift 6 will enable strict Sendable checking, so you should pay attention now:

```swift
// Ensure types passed across Actor boundaries are Sendable
struct Message: Sendable {
    let id: UUID
    let content: String
    let timestamp: Date
}

actor MessageQueue {
    private var messages: [Message] = []

    func enqueue(_ message: Message) {  // Message is Sendable
        messages.append(message)
    }

    func dequeue() -> Message? {
        guard !messages.isEmpty else { return nil }
        return messages.removeFirst()
    }
}
```

## Common Pitfalls

### Pitfall 1: Ignoring Actor Reentrancy

```swift
actor BankAccount {
    private var balance: Decimal = 1000

    // Dangerous: assumes balance won't change during await
    func transferUnsafe(amount: Decimal, to other: BankAccount) async throws {
        guard balance >= amount else {
            throw BankError.insufficientFunds
        }

        balance -= amount  // Deduct
        await other.deposit(amount)  // Balance might be modified by other operations during await!
    }

    // Safe: use transactional thinking
    func transferSafe(amount: Decimal, to other: BankAccount) async throws {
        let currentBalance = balance
        guard currentBalance >= amount else {
            throw BankError.insufficientFunds
        }

        // Try deposit first (might fail)
        do {
            await other.deposit(amount)
        } catch {
            throw TransferError.depositFailed
        }

        // Only deduct after successful deposit
        // Check balance again (in case it was modified during await)
        guard balance >= amount else {
            // Rollback
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

### Pitfall 2: Holding Non-Sendable Reference Types in Actors

```swift
// Dangerous: holding non-Sendable reference types
class UnsafeData {
    var value = 0
}

actor DangerousActor {
    var unsafeRef: UnsafeData?  // Compiler will warn!

    func setData(_ data: UnsafeData) {
        unsafeRef = data
    }
}

// Safe: use Sendable types
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

### Pitfall 3: Deadlock Risk

Although a single Actor cannot deadlock internally, deadlocks can still occur between multiple Actors:

```swift
actor ActorA {
    func doSomething(with b: ActorB) async {
        // Holding ActorA's isolation
        await b.callBack(to: self)  // Waiting for ActorB
    }

    func callback() {
        print("ActorA callback")
    }
}

actor ActorB {
    func callBack(to a: ActorA) async {
        // Holding ActorB's isolation
        await a.callback()  // If ActorA is waiting for us...
    }
}

// Potential deadlock scenario
// 1. TaskA calls actorA.doSomething(with: actorB)
// 2. TaskB simultaneously calls actorB.callBack(to: actorA)
// 3. Both tasks are waiting for each other

// Solution: avoid circular dependencies, or use non-isolated callbacks
```

### Pitfall 4: Misusing @unchecked Sendable

```swift
// Dangerous: incorrectly using @unchecked Sendable
final class BrokenSendable: @unchecked Sendable {
    var counter = 0  // No synchronization protection!

    func increment() {
        counter += 1  // Data race!
    }
}

// Correct: must manually guarantee thread safety when using @unchecked Sendable
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

### Pitfall 5: Accessing Isolated State in nonisolated

```swift
actor DataStore {
    private var cache: [String: Data] = [:]

    // Compile error: nonisolated methods cannot access isolated properties
    // nonisolated func badMethod() {
    //     print(cache.count)  // Error!
    // }

    // Correct: nonisolated can only access nonisolated members
    nonisolated let maxSize = 1000

    nonisolated func goodMethod() {
        print("Max cache size: \(maxSize)")  // OK
    }
}
```

## Performance Considerations

### Actor Hop Overhead

Each Actor boundary crossing involves task scheduling with some overhead:

```swift
// Performance test example
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

    // Slow: 10000 Actor hops
    let slowStart = Date()
    for _ in 0..<10000 {
        await actor.increment()
    }
    let slowDuration = Date().timeIntervalSince(slowStart)

    // Fast: only 1 Actor hop
    let fastStart = Date()
    await actor.incrementBatch(10000)
    let fastDuration = Date().timeIntervalSince(fastStart)

    print("Slow: \(slowDuration)s, Fast: \(fastDuration)s")
    // Batch operations are typically 10-100 times faster
}
```

### Memory Overhead

Each Actor instance has additional runtime overhead:

- Actor executor state
- Task queue management
- Isolation context information

For scenarios requiring many instances, consider whether you really need Actors:

```swift
// Not recommended: creating an Actor for each data item
actor ExpensiveItem {
    var value: Int
    init(value: Int) { self.value = value }
}

// Recommended: use a single Actor to manage multiple data items
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

### Choosing the Right Concurrency Tool

| Scenario | Recommended Approach |
|----------|---------------------|
| Shared mutable state | Actor |
| UI updates | @MainActor |
| Read-only data | struct (value type) |
| Immutable reference types | final class + Sendable |
| Simple counters | Atomic operations |
| Legacy code compatibility | NSLock + @unchecked Sendable |

## Real-World Scenarios

### Scenario 1: Network Request Manager

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

        // Request deduplication
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

// Usage example
func loadUserProfile(userId: String) async throws -> UserProfile {
    let url = URL(string: "https://api.example.com/users/\(userId)")!
    let data = try await NetworkManager.shared.fetchData(from: url)
    return try JSONDecoder().decode(UserProfile.self, from: data)
}
```

### Scenario 2: State Manager

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

        // Load user settings
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

        // Load from persistent storage
        let settings = loadFromDisk(userId: userId) ?? .default
        cache[userId] = settings
        return settings
    }

    func saveSettings(_ settings: AppSettings, for userId: String) {
        cache[userId] = settings
        saveToDisk(settings, userId: userId)
    }

    private func loadFromDisk(userId: String) -> AppSettings? {
        // Implement disk reading
        return nil
    }

    private func saveToDisk(_ settings: AppSettings, userId: String) {
        // Implement disk writing
    }
}
```

### Scenario 3: Real-time Data Synchronization

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
                // Failed changes rejoin the queue
                pendingChanges.insert(contentsOf: batch, at: 0)

                // Exponential backoff retry
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

## Interview Key Points

### What is an Actor, and what problems does it solve?

**Key Points**:
- Actor is a reference type introduced in Swift 5.5 to protect shared mutable state
- Through the Actor isolation mechanism, it ensures only one task can access the Actor's internal state at a time
- It solves the data race problem in concurrent programming
- The compiler enforces isolation rules at compile time

### What are the main differences between Actor and Class?

**Key Points**:
- Actors don't support inheritance (but can conform to protocols)
- External access to Actors must be asynchronous (requires await)
- Actors automatically provide thread safety guarantees
- Actors automatically conform to the Sendable protocol

### Explain the purpose of the nonisolated keyword

**Key Points**:
- Marks members that don't need Actor isolation protection
- Can be accessed in synchronous context without await
- Can only access other nonisolated members or constants
- Commonly used for read-only properties and methods that don't involve mutable state

### What is the purpose of @MainActor?

**Key Points**:
- Ensures code executes on the main thread
- Used for UI updates and UI-related logic
- Can mark types, methods, or properties
- Is a global Actor shared across the entire application

### What is Sendable, and why is it important?

**Key Points**:
- Sendable marks types that can be safely passed across concurrency boundaries
- Value types (if all members are Sendable) automatically satisfy it
- Immutable classes can be Sendable
- For mutable classes, @unchecked Sendable must be used with manual thread safety guarantees
- Swift 6 will enforce Sendable checking

### What is Actor reentrancy? How do you handle it?

**Key Points**:
- Actor methods can be "reentered" by other tasks at await points
- During await, other tasks may modify Actor state
- Need to re-validate state after await
- Use local variables to capture critical state
- Consider using flags to prevent concurrent operations

### How do you implement batch operations in Actors to improve performance?

```swift
actor OptimizedStore {
    private var data: [String: Data] = [:]

    // Single operation
    func set(_ key: String, value: Data) {
        data[key] = value
    }

    // Batch operation - reduces Actor hops
    func setMultiple(_ items: [(String, Data)]) {
        for (key, value) in items {
            data[key] = value
        }
    }
}
```

### Write a thread-safe singleton Actor

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

## Further Reading

### Official Documentation

- [Swift Official Documentation - Concurrency](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/)
- [SE-0306: Actors](https://github.com/apple/swift-evolution/blob/main/proposals/0306-actors.zh.md)
- [SE-0302: Sendable and @Sendable closures](https://github.com/apple/swift-evolution/blob/main/proposals/0302-concurrent-value-and-concurrent-closures.zh.md)
- [SE-0316: Global actors](https://github.com/apple/swift-evolution/blob/main/proposals/0316-global-actors.zh.md)
- [SE-0337: Incremental migration to concurrency checking](https://github.com/apple/swift-evolution/blob/main/proposals/0337-support-incremental-migration-to-concurrency-checking.md)

### WWDC Videos

- [WWDC21: Protect mutable state with Swift actors](https://developer.apple.com/videos/play/wwdc2021/10133/)
- [WWDC21: Swift concurrency: Behind the scenes](https://developer.apple.com/videos/play/wwdc2021/10254/)
- [WWDC22: Eliminate data races using Swift Concurrency](https://developer.apple.com/videos/play/wwdc2022/110351/)
- [WWDC23: Beyond the basics of structured concurrency](https://developer.apple.com/videos/play/wwdc2023/10170/)

### In-depth Articles

- [Swift.org - Concurrency](https://www.swift.org/documentation/concurrency/)
- [Hacking with Swift - What are actors?](https://www.hackingwithswift.com/swift/5.5/actors)
- [Swift by Sundell - Actors in Swift](https://www.swiftbysundell.com/articles/swift-actors/)
- [Point-Free - Concurrency](https://www.pointfree.co/collections/concurrency)

### Related Topics

- [Swift Concurrency Complete Guide](/swift/concurrency) - Detailed async/await and Task explanation on this site
- [Swift Memory Management (ARC)](/swift/arc) - Understanding reference counting and retain cycles
- [Swift Combine Framework](/swift/combine) - Reactive programming and concurrency

---

*Last updated: 2026-01-07*
