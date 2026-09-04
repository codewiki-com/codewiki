---
title: Concurrency
description: Complete guide to Swift concurrency, async/await, Actors and structured concurrency
track: swift
section: concurrency
difficulty: advanced
tags:
  - Swift
  - Concurrency
  - async/await
  - Actor
status: imported
origin: old/src/content/docs/swift/concurrency.en.md
divergence: 0.208
issues: []
legacy:
  category: Swift
  subcategory: Concurrency
  order: 2
  lastUpdated: 2026-01-07
---

Swift concurrency is a comprehensive system for writing asynchronous and parallel code introduced in Swift 5.5 and significantly enhanced in Swift 6. It provides compile-time safety guarantees against data races while offering a clean, expressive syntax that makes concurrent code easier to write and reason about.

## Async/Await

The `async`/`await` pattern is the foundation of Swift concurrency. Functions marked with `async` can suspend execution without blocking a thread, allowing other work to proceed while waiting for asynchronous operations to complete.

### Declaring Async Functions

```swift
// Basic async function
func fetchUserProfile(id: String) async throws -> UserProfile {
    let url = URL(string: "https://api.example.com/users/\(id)")!
    let (data, response) = try await URLSession.shared.data(from: url)

    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw NetworkError.invalidResponse
    }

    return try JSONDecoder().decode(UserProfile.self, from: data)
}

// Calling async functions
func displayUserProfile() async {
    do {
        let profile = try await fetchUserProfile(id: "12345")
        print("User: \(profile.name)")
    } catch {
        print("Failed to fetch profile: \(error)")
    }
}
```

### Async Properties

Properties can also be asynchronous, though they must be read-only.

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

// Usage
let config = RemoteConfiguration()
let settings = try await config.settings
```

### Async Closures and Higher-Order Functions

```swift
// Async closure type
let fetchData: () async throws -> Data = {
    let url = URL(string: "https://example.com/data")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return data
}

// Using async closures with higher-order functions
func processItems(_ items: [Item], transform: (Item) async throws -> ProcessedItem) async throws -> [ProcessedItem] {
    var results: [ProcessedItem] = []
    for item in items {
        let processed = try await transform(item)
        results.append(processed)
    }
    return results
}
```

### Sequential vs Parallel Execution

Understanding when operations run sequentially versus in parallel is crucial for performance.

```swift
// Sequential execution - each await completes before the next begins
func fetchDataSequentially() async throws -> (User, [Post], [Comment]) {
    let user = try await fetchUser()           // Waits for completion
    let posts = try await fetchPosts()         // Then waits for this
    let comments = try await fetchComments()   // Then waits for this
    return (user, posts, comments)
}

// Parallel execution with async let - all start immediately
func fetchDataInParallel() async throws -> (User, [Post], [Comment]) {
    async let user = fetchUser()           // Starts immediately
    async let posts = fetchPosts()         // Starts immediately
    async let comments = fetchComments()   // Starts immediately

    // All three operations run concurrently
    return try await (user, posts, comments)
}
```

### Continuation APIs for Legacy Code

When working with callback-based APIs, use continuations to bridge to async/await.

```swift
// Wrapping a completion handler API
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

// For delegate-based APIs
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

Tasks are the fundamental unit of asynchronous work in Swift concurrency. They represent a single unit of work that can run concurrently with other tasks.

### Creating Tasks

```swift
// Unstructured task - inherits priority and actor context
Task {
    let data = await fetchData()
    await processData(data)
}

// Task with explicit priority
Task(priority: .high) {
    await performUrgentWork()
}

// Detached task - does NOT inherit actor context or priority
Task.detached {
    await performIndependentWork()
}

Task.detached(priority: .background) {
    await performBackgroundCleanup()
}
```

### Task Return Values

```swift
// Task that returns a value
let task = Task<String, Never> {
    await performComputation()
    return "Result"
}

// Get the result
let result = await task.value

// Task that can throw
let throwingTask = Task<Data, Error> {
    try await fetchData()
}

do {
    let data = try await throwingTask.value
} catch {
    print("Task failed: \(error)")
}
```

### Task Cancellation

Cancellation in Swift is cooperative - tasks must check for and respond to cancellation.

```swift
class DataLoader {
    private var currentTask: Task<[Item], Error>?

    func loadItems() {
        // Cancel any existing task
        currentTask?.cancel()

        currentTask = Task {
            var items: [Item] = []

            for id in itemIDs {
                // Check if task was cancelled
                try Task.checkCancellation()

                // Alternative: check manually
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

### Task Sleep and Delays

```swift
// Sleep for a duration (Swift 5.7+)
try await Task.sleep(for: .seconds(2))
try await Task.sleep(for: .milliseconds(500))

// Sleep until a specific instant
try await Task.sleep(until: .now + .seconds(5), clock: .continuous)

// Legacy nanoseconds API
try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
```

### Task Local Values

Task local values allow you to pass contextual information down the task hierarchy.

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
    // Access task local values anywhere in the call stack
    guard let requestID = RequestContext.requestID else {
        return
    }

    if RequestContext.traceEnabled {
        print("Processing request \(requestID) for user \(RequestContext.userID ?? "unknown")")
    }

    await performDatabaseQuery()
}

func performDatabaseQuery() async {
    // Task locals are inherited by child tasks
    print("DB query for request: \(RequestContext.requestID ?? "none")")
}
```

## TaskGroup

Task groups enable dynamic, parallel execution of multiple child tasks with automatic lifecycle management.

### Basic TaskGroup Usage

```swift
func fetchAllUserData(userIDs: [String]) async throws -> [UserData] {
    try await withThrowingTaskGroup(of: UserData.self) { group in
        // Add tasks dynamically
        for id in userIDs {
            group.addTask {
                try await fetchUserData(id: id)
            }
        }

        // Collect results as they complete
        var results: [UserData] = []
        for try await userData in group {
            results.append(userData)
        }

        return results
    }
}
```

### TaskGroup with Different Result Types

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

### Limiting Concurrency

```swift
func processImagesWithLimit(images: [UIImage], maxConcurrent: Int) async -> [ProcessedImage] {
    await withTaskGroup(of: ProcessedImage.self) { group in
        var results: [ProcessedImage] = []
        var iterator = images.makeIterator()

        // Start initial batch
        for _ in 0..<maxConcurrent {
            if let image = iterator.next() {
                group.addTask {
                    await processImage(image)
                }
            }
        }

        // As each task completes, start a new one
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

### Cancellation in TaskGroups

```swift
func fetchFirstSuccessful(urls: [URL]) async throws -> Data {
    try await withThrowingTaskGroup(of: Data.self) { group in
        for url in urls {
            group.addTask {
                try await URLSession.shared.data(from: url).0
            }
        }

        // Return the first successful result
        // This automatically cancels remaining tasks
        guard let firstResult = try await group.next() else {
            throw FetchError.noResults
        }

        // Cancel all remaining tasks explicitly
        group.cancelAll()

        return firstResult
    }
}
```

### Discarding TaskGroup

For fire-and-forget scenarios where you do not need results.

```swift
func sendNotifications(to users: [User], message: String) async {
    await withDiscardingTaskGroup { group in
        for user in users {
            group.addTask {
                await sendNotification(to: user, message: message)
            }
        }
        // Group waits for all tasks but discards results
    }
}
```

## Actors

Actors are reference types that protect their mutable state by ensuring only one task can access that state at a time. They are the primary tool for preventing data races in Swift.

### Defining Actors

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

// Usage - all access is async from outside the actor
let account = BankAccount(accountNumber: "12345", initialBalance: 1000)
await account.deposit(amount: 500)
let balance = await account.balance
```

### Actor Isolation

```swift
actor DataCache {
    private var cache: [String: Data] = [:]
    private var lastAccess: [String: Date] = [:]

    // Synchronous access within the actor is safe
    func store(_ data: Data, forKey key: String) {
        cache[key] = data
        lastAccess[key] = Date()
        pruneOldEntries() // Can call synchronously
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

### Nonisolated Members

Some members do not need actor isolation and can be accessed synchronously.

```swift
actor ImageProcessor {
    private var processedCount = 0
    let identifier: UUID

    // Constant properties are automatically nonisolated
    // identifier can be accessed without await

    // Explicitly nonisolated computed property
    nonisolated var description: String {
        "ImageProcessor(\(identifier))"
    }

    // Nonisolated method that doesn't access mutable state
    nonisolated func supportedFormats() -> [String] {
        ["png", "jpg", "heic", "webp"]
    }

    // Isolated method that accesses mutable state
    func process(_ image: Image) async -> ProcessedImage {
        processedCount += 1
        return await performProcessing(image)
    }

    // Nonisolated async method - runs outside actor context
    nonisolated func heavyComputation(_ data: Data) async -> Data {
        // CPU-intensive work that doesn't need isolation
        await performHeavyWork(data)
    }
}
```

### Actor Reentrancy

Actors can be reentered at suspension points, which is important to understand.

```swift
actor AccountManager {
    private var accounts: [String: BankAccount] = [:]

    func transfer(amount: Decimal, from sourceID: String, to destID: String) async throws {
        guard let source = accounts[sourceID],
              let dest = accounts[destID] else {
            throw TransferError.accountNotFound
        }

        // CAUTION: Actor state might change during these awaits
        let sourceBalance = await source.balance

        // Another task could modify accounts here!
        // Always re-validate after suspension

        guard sourceBalance >= amount else {
            throw TransferError.insufficientFunds
        }

        // Perform atomic operations together when possible
        try await source.withdraw(amount: amount)
        await dest.deposit(amount: amount)
    }
}

// Safer pattern - minimize suspension points
actor SafeAccountManager {
    private var accounts: [String: Decimal] = [:]

    func transfer(amount: Decimal, from sourceID: String, to destID: String) throws {
        // No suspension points - entire operation is atomic
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

### Custom Actor Executors (Swift 5.9+)

```swift
actor DatabaseActor {
    private let connection: DatabaseConnection

    // Custom executor for specific threading requirements
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

The `@MainActor` attribute ensures code runs on the main thread, which is essential for UI updates.

### Using MainActor

```swift
// Entire class isolated to main actor
@MainActor
class ViewModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    func loadItems() async {
        isLoading = true
        errorMessage = nil

        do {
            // Fetch runs on background, result assignment on main
            let newItems = try await ItemService.fetchItems()
            items = newItems
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

// Individual method on main actor
class DataProcessor {
    func process() async -> ProcessedData {
        let data = await fetchData()
        let result = await transform(data)

        // Update UI on main actor
        await MainActor.run {
            updateUI(with: result)
        }

        return result
    }

    @MainActor
    func updateUI(with data: ProcessedData) {
        // Guaranteed to run on main thread
        NotificationCenter.default.post(name: .dataUpdated, object: data)
    }
}
```

### MainActor.run

```swift
func fetchAndDisplay() async {
    let data = await networkService.fetchData()

    // Run closure on main actor
    await MainActor.run {
        self.displayData(data)
        self.refreshUI()
    }

    // Or with a return value
    let processedCount = await MainActor.run {
        self.processItems(data.items)
        return self.itemCount
    }
}
```

### MainActor in SwiftUI

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
            state = .error("Failed to delete user")
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

The `Sendable` protocol marks types that can safely be passed across concurrency boundaries. It is fundamental to Swift's compile-time data race safety.

### Sendable Types

```swift
// Value types with Sendable properties are implicitly Sendable
struct Point: Sendable {
    var x: Double
    var y: Double
}

// Explicitly marking as Sendable
struct Configuration: Sendable {
    let apiKey: String
    let environment: Environment
    let timeout: TimeInterval
}

// Enums are Sendable when associated values are Sendable
enum Result<Success: Sendable, Failure: Error>: Sendable {
    case success(Success)
    case failure(Failure)
}
```

### Making Classes Sendable

```swift
// Final class with immutable state
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

// Class with synchronized access
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

### Sendable Closures

```swift
// @Sendable closures can be passed across concurrency boundaries
func performAsync(_ work: @Sendable @escaping () async -> Void) {
    Task {
        await work()
    }
}

// Example showing capture requirements
func processItems(_ items: [Item]) {
    let immutableData = items.map { $0.id } // [String] is Sendable

    Task {
        // OK - captures Sendable value
        for id in immutableData {
            await process(id)
        }
    }

    // This would be an error:
    // var mutableCount = 0
    // Task {
    //     mutableCount += 1 // Error: mutable capture in @Sendable closure
    // }
}
```

### Generic Sendable Constraints

```swift
// Container that requires Sendable elements
struct SendableContainer<Value: Sendable>: Sendable {
    let value: Value
}

// Actor method accepting Sendable types
actor DataStore {
    private var items: [String: any Sendable] = [:]

    func store<T: Sendable>(_ value: T, forKey key: String) {
        items[key] = value
    }

    func retrieve<T: Sendable>(forKey key: String, as type: T.Type) -> T? {
        items[key] as? T
    }
}

// Task group with Sendable constraint
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

### Sendable Checking in Swift 6

```swift
// Enable strict concurrency checking
// In Package.swift:
// swiftSettings: [.enableExperimentalFeature("StrictConcurrency")]

// Or use Swift 6 language mode
// swiftSettings: [.swiftLanguageVersion(.v6)]

// Common patterns for Sendable compliance

// 1. Use actors for shared mutable state
actor SharedState {
    var data: [String: Int] = [:]

    func update(_ key: String, value: Int) {
        data[key] = value
    }
}

// 2. Make classes Sendable with proper synchronization
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

// 3. Use value types
struct ImmutableConfig: Sendable {
    let settings: [String: String]
    let flags: Set<String>
}
```

## Structured Concurrency

Structured concurrency ensures that child tasks cannot outlive their parent scope, preventing common issues like task leaks and orphaned operations.

### Task Hierarchies

```swift
func processOrder(_ order: Order) async throws {
    // All child tasks must complete before this function returns
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

        // Wait for all tasks - if any throws, others are cancelled
        try await group.waitForAll()
    }

    // All child tasks guaranteed complete here
    await sendConfirmation(order)
}
```

### Automatic Cancellation Propagation

```swift
func fetchAllData() async throws -> CompleteData {
    try await withThrowingTaskGroup(of: PartialData.self) { group in
        group.addTask { try await fetchUserData() }
        group.addTask { try await fetchProductData() }
        group.addTask { try await fetchOrderHistory() }

        var results: [PartialData] = []

        // If any task throws, all others are automatically cancelled
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

### Async Let Bindings

```swift
func loadUserDashboard(userID: String) async throws -> Dashboard {
    // All three start concurrently
    async let profile = fetchProfile(userID)
    async let preferences = fetchPreferences(userID)
    async let notifications = fetchNotifications(userID)

    // Wait for all and combine
    let dashboard = try await Dashboard(
        profile: profile,
        preferences: preferences,
        notifications: notifications
    )

    // If we exit early (throw or return), pending async lets are cancelled
    return dashboard
}

// Conditional async let
func loadContent(includeComments: Bool) async throws -> Content {
    async let article = fetchArticle()
    async let author = fetchAuthor()

    // Conditionally start comment fetch
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

## AsyncSequence and AsyncStream

AsyncSequence enables iteration over values that arrive asynchronously over time.

### Creating AsyncSequence

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

// Usage
for await number in Countdown(start: 5) {
    print(number) // 5, 4, 3, 2, 1
}
```

### AsyncStream

```swift
// Basic AsyncStream
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

// Usage
for await timestamp in heartbeat(interval: .seconds(1)) {
    print("Heartbeat: \(timestamp)")
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

### AsyncSequence Operators

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

// Combining with reduce
let sum = await numbers.reduce(0, +)

// First element matching condition
let firstEven = await numbers.first { $0 % 2 == 0 }

// Contains
let hasNegative = await numbers.contains { $0 < 0 }

// Collect all into array
let allValues = try await stream.reduce(into: []) { $0.append($1) }
```

### Real-World AsyncStream Example

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

## Advanced Patterns

### Actor-Based State Machine

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

### Debouncing with Tasks

```swift
@MainActor
class SearchViewModel: ObservableObject {
    @Published var query = ""
    @Published var results: [SearchResult] = []

    private var searchTask: Task<Void, Never>?

    func search(_ query: String) {
        // Cancel previous search
        searchTask?.cancel()

        guard !query.isEmpty else {
            results = []
            return
        }

        searchTask = Task {
            // Debounce
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

### Retry Pattern

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

// Usage
let data = try await withRetry(maxAttempts: 3) {
    try await fetchDataFromServer()
}
```

### Timeout Pattern

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

// Usage
let result = try await withTimeout(.seconds(10)) {
    try await longRunningOperation()
}
```

### Resource Pool Actor

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

        // Wait for available connection
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

## Migration from GCD

### Converting Completion Handlers

```swift
// Before: GCD with completion handler
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

// After: Async/await
func fetchData() async throws -> Data {
    try await withCheckedThrowingContinuation { continuation in
        fetchDataLegacy { result in
            continuation.resume(with: result)
        }
    }
}

// Or rewrite completely
func fetchDataModern() async throws -> Data {
    try loadDataFromDisk()
}
```

### Converting DispatchGroup

```swift
// Before: DispatchGroup
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

// After: TaskGroup
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

### Converting Serial Queues

```swift
// Before: Serial DispatchQueue for synchronization
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

// After: Actor
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

## Best Practices

### Prefer Structured Concurrency

```swift
// Preferred: Structured - tasks cannot outlive parent
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

// Avoid: Unstructured - potential task leaks
func processAllItemsUnstructured(_ items: [Item]) {
    for item in items {
        Task {
            try? await process(item)
            // These tasks continue after function returns
        }
    }
}
```

### Use Actors for Shared Mutable State

```swift
// Preferred: Actor provides automatic synchronization
actor Statistics {
    private var values: [Double] = []

    func add(_ value: Double) {
        values.append(value)
    }

    var average: Double {
        values.isEmpty ? 0 : values.reduce(0, +) / Double(values.count)
    }
}

// Avoid: Manual synchronization is error-prone
class UnsafeStatistics {
    private var values: [Double] = []
    // Missing synchronization = data race!
}
```

### Handle Cancellation Appropriately

```swift
func longRunningOperation() async throws -> Result {
    var partialResults: [PartialResult] = []

    for chunk in dataChunks {
        // Check cancellation regularly
        try Task.checkCancellation()

        let result = try await process(chunk)
        partialResults.append(result)
    }

    return Result(partialResults)
}

// With cleanup
func operationWithCleanup() async throws -> Data {
    let tempFile = createTempFile()

    return try await withTaskCancellationHandler {
        try await processFile(tempFile)
    } onCancel: {
        // Clean up even on cancellation
        try? FileManager.default.removeItem(at: tempFile)
    }
}
```

### Minimize Actor Hopping

```swift
// Inefficient: Multiple actor hops
func updateMultiple() async {
    await actor.updateA()  // Hop to actor
    await actor.updateB()  // Hop again
    await actor.updateC()  // Hop again
}

// Better: Single method that does multiple updates
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

### Use async let for Independent Parallel Work

```swift
// When operations are independent, use async let
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

### Avoid Blocking in Async Contexts

```swift
// Bad: Blocking call in async context
func processAsync() async {
    let result = expensiveBlockingOperation() // Blocks the cooperative thread pool
}

// Better: Move to detached task or wrap appropriately
func processAsync() async {
    let result = await Task.detached(priority: .userInitiated) {
        expensiveBlockingOperation()
    }.value
}
```

### Use MainActor for UI Code

```swift
@MainActor
class ViewController: UIViewController {
    @Published var data: [Item] = []

    func loadData() async {
        // Fetch on background
        let newData = await DataService.fetchItems()

        // Update UI - already on main actor
        data = newData
        tableView.reloadData()
    }
}
```

### Design APIs with Sendable in Mind

```swift
// Good: Sendable-aware API design
struct Request: Sendable {
    let id: UUID
    let parameters: [String: String]
}

actor RequestHandler {
    func handle(_ request: Request) async -> Response {
        // Request is safely passed to actor
    }
}

// Collection of async work
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

## Summary

Swift concurrency provides a comprehensive toolkit for writing safe, efficient concurrent code:

- **Async/await** transforms asynchronous code into readable, sequential-looking code
- **Task** represents units of concurrent work with built-in cancellation support
- **TaskGroup** enables dynamic parallel execution with automatic lifecycle management
- **Actors** protect mutable state from data races through isolation
- **MainActor** ensures UI updates happen on the main thread
- **Sendable** provides compile-time safety for data crossing concurrency boundaries
- **Structured concurrency** prevents task leaks and simplifies resource management
- **AsyncSequence** enables elegant handling of asynchronous data streams

The combination of these features, backed by compiler enforcement, makes it significantly harder to write concurrent code with data races while making correct concurrent code easier to write and understand. As Swift continues to evolve, the concurrency model will become even more powerful and integrated into the language.
