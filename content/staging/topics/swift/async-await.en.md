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
origin: old/src/content/docs/swift/async-await.en.md
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

## Concept Overview

### What is async/await

`async/await` is the core syntax of the modern concurrency programming model introduced in Swift 5.5. It provides an intuitive and safe way to write asynchronous code, making asynchronous operations as clear and readable as synchronous code.

- **async**: Marks a function, method, or closure that may suspend execution
- **await**: Marks a potential suspension point in the code, waiting for an asynchronous operation to complete

```swift
// Traditional callback approach
func fetchUser(id: String, completion: @escaping (Result<User, Error>) -> Void) {
    URLSession.shared.dataTask(with: url) { data, response, error in
        // Handle result...
        completion(.success(user))
    }.resume()
}

// async/await approach
func fetchUser(id: String) async throws -> User {
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}
```

### Historical Background

The evolution of Swift's concurrency model:

1. **Swift 1-4**: Relied on GCD (Grand Central Dispatch) and callback functions
2. **Swift 5.0**: Introduced Result type for improved error handling
3. **Swift 5.5 (2021)**: Introduced async/await, Actors, and structured concurrency
4. **Swift 5.9**: Added custom Actor executors
5. **Swift 6.0**: Strict concurrency checking became the default

### Problems It Solves

async/await addresses multiple pain points in traditional asynchronous programming:

1. **Callback Hell**: Nested callbacks make code difficult to read and maintain
2. **Complex Error Handling**: Error handling in callbacks is easy to overlook
3. **Confusing Control Flow**: Difficult to implement conditional execution, loops, and other control flows
4. **Resource Leaks**: Easy to forget to release resources in callbacks
5. **Debugging Difficulties**: Callback stacks are hard to trace

```swift
// Callback hell example
fetchUser(id: userId) { userResult in
    switch userResult {
    case .success(let user):
        fetchOrders(for: user) { ordersResult in
            switch ordersResult {
            case .success(let orders):
                fetchProducts(for: orders) { productsResult in
                    // Continue nesting...
                }
            case .failure(let error):
                handleError(error)
            }
        }
    case .failure(let error):
        handleError(error)
    }
}

// Clean async/await solution
do {
    let user = try await fetchUser(id: userId)
    let orders = try await fetchOrders(for: user)
    let products = try await fetchProducts(for: orders)
    // Clear linear flow
} catch {
    handleError(error)
}
```

## Core Principles

### Coroutines and Suspension Points

Swift's async/await is implemented based on coroutines. A coroutine is a function that can suspend and resume execution.

```swift
func processData() async -> Data {
    print("Starting processing")      // 1. Synchronous execution
    let data = await fetchData()      // 2. Suspension point - function suspends, thread can execute other tasks
    print("Processing complete")      // 3. Resume execution
    return data
}
```

**Characteristics of Suspension Points:**
- The `await` keyword marks potential suspension points
- When suspended, the current thread is released and can execute other tasks
- When resumed, execution may continue on a different thread
- The compiler guarantees correct state restoration

### Execution Model

Swift concurrency uses cooperative scheduling:

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

**Key Concepts:**
- **Task**: A unit of asynchronous work
- **Executor**: Determines where tasks execute
- **Cooperative Scheduling**: Tasks voluntarily yield control rather than being forcibly interrupted

### Memory Model and Continuation

The compiler transforms async functions into state machines:

```swift
// Original code
func example() async -> Int {
    let a = await step1()
    let b = await step2(a)
    return a + b
}

// Compiler internal transformation (conceptual illustration)
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
            // Call step1, save state
            return nil
        case .afterStep1(let a):
            // Call step2, save state
            return nil
        case .afterStep2(let a, let b):
            return a + b
        }
    }
}
```

### Relationship with GCD

async/await can coexist with GCD, but there are fundamental differences:

| Feature | GCD | async/await |
|---------|-----|-------------|
| Scheduling Model | Queue-based | Task-based |
| Thread Management | May create many threads | Cooperative thread pool |
| Error Handling | Manual handling in callbacks | Native throws support |
| Cancellation | Manual implementation | Built-in cooperative cancellation |
| Code Readability | Nested callbacks | Linear flow |

## Key Concepts

### async Functions

```swift
// Basic async function
func fetchData() async -> Data {
    // Async operation
}

// async throws function
func fetchUser() async throws -> User {
    // Async operation that may throw errors
}

// async computed property (read-only)
var config: Configuration {
    get async throws {
        try await loadConfiguration()
    }
}

// async subscript
subscript(index: Int) -> Item {
    get async {
        await loadItem(at: index)
    }
}
```

### await Expressions

```swift
// Basic await
let result = await someAsyncFunction()

// try await combination
let user = try await fetchUser()

// await in optional chaining
let name = await user?.fetchProfile()?.name

// await in expressions
let total = await price1 + await price2
```

### Task Creation and Management

```swift
// Create unstructured task
let task = Task {
    await performWork()
}

// Task with return value
let task = Task<String, Error> {
    try await fetchString()
}
let result = try await task.value

// Task with priority
Task(priority: .high) {
    await criticalWork()
}

// Detached task - does not inherit parent task context
Task.detached {
    await independentWork()
}

// Cancel task
task.cancel()
```

### TaskGroup for Concurrent Execution

```swift
// Basic TaskGroup
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

// Using reduce to collect results
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
// Using AsyncSequence
for try await line in fileHandle.bytes.lines {
    process(line)
}

// AsyncStream creation
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
// Mark entire type
@MainActor
class ViewModel: ObservableObject {
    @Published var data: [Item] = []

    func loadData() async {
        data = try? await fetchItems()
    }
}

// Mark single method
class Service {
    @MainActor
    func updateUI(with data: Data) {
        // Ensures execution on main thread
    }
}

// Explicitly switch to main thread
await MainActor.run {
    label.text = "Updated"
}
```

## Code Examples

### Example 1: Basic Network Request

```swift
import Foundation

// Define data model
struct User: Codable {
    let id: Int
    let name: String
    let email: String
}

// Define error types
enum NetworkError: Error {
    case invalidURL
    case invalidResponse
    case decodingFailed
}

// Async network request
func fetchUser(id: Int) async throws -> User {
    guard let url = URL(string: "https://api.example.com/users/\(id)") else {
        throw NetworkError.invalidURL
    }

    // await point - function suspends during network request
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

// Usage example
Task {
    do {
        let user = try await fetchUser(id: 1)
        print("Username: \(user.name)")
    } catch {
        print("Failed to fetch user: \(error)")
    }
}
```

### Example 2: Concurrent Requests with async let

```swift
struct Dashboard {
    let user: User
    let posts: [Post]
    let notifications: [Notification]
}

func loadDashboard() async throws -> Dashboard {
    // Three requests execute concurrently
    async let user = fetchUser()
    async let posts = fetchPosts()
    async let notifications = fetchNotifications()

    // Wait for all results (order doesn't affect concurrency)
    return try await Dashboard(
        user: user,
        posts: posts,
        notifications: notifications
    )
}

// Conditional concurrency
func loadOptionalData(includeAnalytics: Bool) async throws -> DashboardData {
    async let user = fetchUser()
    async let posts = fetchPosts()

    // Conditional concurrent request
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

### Example 3: TaskGroup for Batch Processing

```swift
func downloadImages(urls: [URL]) async -> [URL: UIImage] {
    await withTaskGroup(of: (URL, UIImage?).self) { group in
        // Add all download tasks
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

        // Collect results
        var results: [URL: UIImage] = [:]
        for await (url, image) in group {
            if let image = image {
                results[url] = image
            }
        }
        return results
    }
}

// Batch processing with concurrency limit
func downloadWithLimit(urls: [URL], maxConcurrent: Int) async -> [Data] {
    var results: [Data] = []

    await withTaskGroup(of: Data?.self) { group in
        var iterator = urls.makeIterator()

        // Initial batch
        for _ in 0..<min(maxConcurrent, urls.count) {
            if let url = iterator.next() {
                group.addTask {
                    try? await URLSession.shared.data(from: url).0
                }
            }
        }

        // Add one as each completes
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

### Example 4: Custom AsyncSequence

```swift
// Timer AsyncSequence
struct AsyncTimerSequence: AsyncSequence {
    typealias Element = Date

    let interval: TimeInterval
    let count: Int?

    struct AsyncIterator: AsyncIteratorProtocol {
        let interval: TimeInterval
        var remaining: Int?

        mutating func next() async -> Date? {
            // Check if there are remaining iterations
            if let remaining = remaining {
                guard remaining > 0 else { return nil }
                self.remaining = remaining - 1
            }

            // Check for cancellation
            guard !Task.isCancelled else { return nil }

            // Wait for interval
            try? await Task.sleep(for: .seconds(interval))

            return Date()
        }
    }

    func makeAsyncIterator() -> AsyncIterator {
        AsyncIterator(interval: interval, remaining: count)
    }
}

// Usage example
let timer = AsyncTimerSequence(interval: 1.0, count: 5)
for await date in timer {
    print("Tick: \(date)")
}

// Combining with map and other operators
for await formattedDate in timer.map({ DateFormatter.localizedString(from: $0, dateStyle: .none, timeStyle: .medium) }) {
    print(formattedDate)
}
```

### Example 5: Actor Protecting Shared State

```swift
actor ImageCache {
    private var cache: [URL: UIImage] = [:]
    private var inProgress: [URL: Task<UIImage, Error>] = [:]

    func image(for url: URL) async throws -> UIImage {
        // Check cache
        if let cached = cache[url] {
            return cached
        }

        // Reuse in-progress task
        if let existingTask = inProgress[url] {
            return try await existingTask.value
        }

        // Create new task
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

// Usage
let cache = ImageCache()
let image = try await cache.image(for: imageURL)
```

### Example 6: ViewModel with MainActor

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
        // Cancel previous search
        searchTask?.cancel()

        let query = searchText.trimmingCharacters(in: .whitespaces)
        guard !query.isEmpty else {
            results = []
            return
        }

        searchTask = Task {
            isLoading = true
            errorMessage = nil

            // Debounce
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

// SwiftUI View
struct SearchView: View {
    @StateObject private var viewModel = SearchViewModel()

    var body: some View {
        VStack {
            TextField("Search", text: $viewModel.searchText)
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

## Best Practices

### Prefer Structured Concurrency

```swift
// Recommended: Structured concurrency - automatic cancellation and error handling
func loadData() async throws -> CompleteData {
    async let users = fetchUsers()
    async let products = fetchProducts()
    return try await CompleteData(users: users, products: products)
}

// Avoid: Unstructured tasks - require manual management
func loadDataBad() {
    Task {
        let users = try await fetchUsers()
        // If this fails, other tasks cannot be automatically cancelled
    }
    Task {
        let products = try await fetchProducts()
    }
}
```

### Handle Task Cancellation Properly

```swift
func processItems(_ items: [Item]) async throws -> [Result] {
    var results: [Result] = []

    for item in items {
        // Check for cancellation at the start of each iteration
        try Task.checkCancellation()

        let result = try await process(item)
        results.append(result)
    }

    return results
}

// Using withTaskCancellationHandler for cleanup
func downloadFile(url: URL) async throws -> Data {
    let handle = try FileHandle(forWritingTo: tempURL)

    return try await withTaskCancellationHandler {
        try await performDownload(to: handle)
    } onCancel: {
        // Clean up temporary file
        try? FileManager.default.removeItem(at: tempURL)
    }
}
```

### Use Actors Appropriately

```swift
// Recommended: Use Actor to protect shared state
actor Counter {
    private var value = 0

    func increment() -> Int {
        value += 1
        return value
    }
}

// Batch operations to reduce Actor hops
actor BetterCounter {
    private var value = 0

    // Single hop completes batch operation
    func incrementBy(_ amount: Int) -> Int {
        value += amount
        return value
    }
}
```

### Avoid Blocking in async Functions

```swift
// Wrong: Using blocking calls in async functions
func badExample() async -> Data {
    // This blocks the thread!
    return synchronousNetworkCall()
}

// Correct: Use async APIs
func goodExample() async throws -> Data {
    let (data, _) = try await URLSession.shared.data(from: url)
    return data
}

// If you must use synchronous code, use Task.detached
func workaround() async -> Data {
    await Task.detached(priority: .background) {
        return synchronousNetworkCall()
    }.value
}
```

### MainActor Usage Guidelines

```swift
// Recommended: Only mark the parts that need the main thread
class DataManager {
    func fetchData() async throws -> [Item] {
        // Executes in background
        return try await networkService.fetch()
    }

    @MainActor
    func updateUI(with items: [Item]) {
        // Only UI updates on main thread
        tableView.reloadData()
    }
}

// Avoid: Entire class marked as MainActor but contains time-consuming operations
@MainActor
class BadManager {
    func processHugeData() async {
        // This blocks the main thread!
    }
}
```

## Common Pitfalls

### Implicit await Sequential Execution

```swift
// Pitfall: Sequential execution, total time = 3 seconds
func sequentialMistake() async -> (A, B, C) {
    let a = await fetchA() // 1 second
    let b = await fetchB() // 1 second
    let c = await fetchC() // 1 second
    return (a, b, c)
}

// Correct: Concurrent execution, total time = 1 second
func concurrent() async -> (A, B, C) {
    async let a = fetchA()
    async let b = fetchB()
    async let c = fetchC()
    return await (a, b, c)
}
```

### Forgetting to Check Cancellation

```swift
// Pitfall: Task is cancelled but continues executing
func longRunningTask(items: [Item]) async {
    for item in items {
        await process(item) // Continues even if cancelled
    }
}

// Correct: Regularly check for cancellation
func respectfulTask(items: [Item]) async throws {
    for item in items {
        try Task.checkCancellation()
        await process(item)
    }
}
```

### Actor Reentrancy Issues

```swift
actor BankAccount {
    var balance: Decimal = 1000

    // Pitfall: State may have changed after await
    func transferUnsafe(amount: Decimal, to other: BankAccount) async {
        guard balance >= amount else { return }
        balance -= amount           // Deduct
        await other.deposit(amount) // During await, other tasks may modify balance!
    }

    // Correct: Re-validate state after await
    func transferSafe(amount: Decimal, to other: BankAccount) async throws {
        guard balance >= amount else {
            throw TransferError.insufficientFunds
        }

        // Try to deposit first
        await other.deposit(amount)

        // Re-check after await
        guard balance >= amount else {
            await other.withdraw(amount) // Rollback
            throw TransferError.insufficientFunds
        }

        balance -= amount
    }
}
```

### Sendable Violations

```swift
// Pitfall: Non-Sendable type crossing concurrency boundaries
class MutableData {
    var value = 0
}

func badConcurrency() async {
    let data = MutableData()

    Task {
        data.value = 1 // Warning: non-Sendable type
    }

    Task {
        print(data.value) // Data race!
    }
}

// Correct: Use value types or Actors
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

### Calling async from Synchronous Context

```swift
// Error: Cannot call directly
func syncFunction() {
    let result = await asyncFunction() // Compile error!
}

// Correct: Create a Task
func syncFunction() {
    Task {
        let result = await asyncFunction()
        // Handle result
    }
}

// Or use async entry point
@main
struct MyApp {
    static func main() async {
        let result = await asyncFunction()
    }
}
```

### Implicit Cancellation with async let

```swift
// Pitfall: Early return causes implicit cancellation
func loadData() async throws -> User {
    async let user = fetchUser()
    async let settings = fetchSettings()

    if someCondition {
        return try await user // settings is implicitly cancelled!
    }

    let (u, s) = try await (user, settings)
    return u
}
```

## Performance Considerations

### Task Creation Overhead

```swift
// Avoid: Creating tasks for small operations
for item in items {
    Task {
        await tinyOperation(item) // Task creation overhead > operation itself
    }
}

// Recommended: Batch processing
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

### Actor Hop Cost

```swift
// Avoid: Frequent small operations
actor Counter {
    var count = 0
    func increment() { count += 1 }
}

// Each call has Actor switching overhead
for _ in 0..<10000 {
    await counter.increment()
}

// Recommended: Batch operations
actor Counter {
    var count = 0
    func add(_ value: Int) { count += value }
}

await counter.add(10000)
```

### Concurrency Control

```swift
// Problem: Unlimited concurrency may exhaust resources
func downloadAll(urls: [URL]) async {
    await withTaskGroup(of: Void.self) { group in
        for url in urls { // Could be 1000 URLs
            group.addTask {
                await download(url) // 1000 simultaneous requests!
            }
        }
    }
}

// Optimized: Limit concurrency
func downloadAllLimited(urls: [URL], maxConcurrent: Int = 10) async {
    await withTaskGroup(of: Void.self) { group in
        var pending = urls.makeIterator()

        // Initial batch
        for _ in 0..<maxConcurrent {
            guard let url = pending.next() else { break }
            group.addTask { await download(url) }
        }

        // Start one as each completes
        for await _ in group {
            if let url = pending.next() {
                group.addTask { await download(url) }
            }
        }
    }
}
```

### Avoid Unnecessary await

```swift
// Avoid: Unnecessary await
func unnecessary() async -> Int {
    return await Task { 1 + 1 }.value // Completely unnecessary
}

// Recommended: Return directly
func direct() -> Int {
    return 1 + 1
}

// Note: No need for await when returning existing async result
func forward() async -> Data {
    return await fetchData() // Can be simplified
}

func forwardBetter() async -> Data {
    await fetchData() // Implicit return
}
```

### Memory Usage

```swift
// Problem: Large intermediate results consume memory
func processAllBad(urls: [URL]) async -> [Data] {
    var allData: [Data] = []

    await withTaskGroup(of: Data.self) { group in
        for url in urls {
            group.addTask {
                await download(url) // All data simultaneously in memory
            }
        }

        for await data in group {
            allData.append(data)
        }
    }

    return allData
}

// Optimized: Stream processing
func processAllStreaming(urls: [URL]) async {
    await withTaskGroup(of: Void.self) { group in
        for url in urls {
            group.addTask {
                let data = await download(url)
                await process(data) // Process immediately
                // data can be released
            }
        }
    }
}
```

## Real-World Scenarios

### Scenario 1: Paginated Loading

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
                print("Loading failed: \(error)")
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

### Scenario 2: Multi-Step Form Submission

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
        // Validation
        state = .validating
        try await validate(form)

        // Upload attachments
        for (index, attachment) in attachments.enumerated() {
            let progress = Double(index) / Double(attachments.count)
            state = .uploading(progress: progress)
            try await upload(attachment)
        }

        // Submit form
        state = .submitting
        let receipt = try await submitForm(form)

        state = .completed(.success(receipt))
        return receipt
    }

    private func validate(_ form: FormData) async throws {
        // Validation logic
    }

    private func upload(_ attachment: Attachment) async throws {
        // Upload logic
    }

    private func submitForm(_ form: FormData) async throws -> Receipt {
        // Submit logic
    }
}
```

### Scenario 3: WebSocket Message Handling

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

        // Start receiving messages
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

// Usage
let manager = WebSocketManager()
try await manager.connect(to: serverURL)

Task {
    for await message in await manager.messages {
        print("Received message: \(message)")
    }
}
```

### Scenario 4: Background Data Synchronization

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
                // Re-queue failed operations
                syncQueue.insert(contentsOf: batch, at: 0)

                // Wait before retrying
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
        // Execute sync operation
    }
}
```

## Interview Topics

### Common Interview Questions

#### What are the differences between async/await and GCD?

**Key Points:**
- GCD is queue-based scheduling, async/await is task-based scheduling
- GCD may create many threads, async/await uses a cooperative thread pool
- async/await has native throws support for error handling
- async/await has built-in cooperative cancellation mechanism
- async/await code is more linear and readable, GCD requires nested callbacks

#### What is structured concurrency?

**Key Points:**
- Structured concurrency ensures child task lifetimes don't exceed parent tasks
- Implemented using `async let` and `TaskGroup`
- Automatically propagates cancellation to child tasks
- Errors automatically propagate upward
- Guarantees all child tasks complete before returning

```swift
// Structured concurrency example
func loadAll() async throws -> Data {
    async let a = fetchA()
    async let b = fetchB()
    return try await combine(a, b)
} // a and b must complete or cancel here
```

#### How does Actor ensure thread safety?

**Key Points:**
- Actors protect internal state through isolation
- Only one task can access Actor internals at a time
- External access requires using await
- Actor methods execute serially
- However, Actors are reentrant (other calls can be inserted at await points)

#### What is the purpose of MainActor?

**Key Points:**
- MainActor ensures code executes on the main thread
- Used for UI updates because UIKit/SwiftUI require the main thread
- Can mark entire types or individual methods
- Accessing from non-MainActor context requires await

```swift
@MainActor
class ViewModel: ObservableObject {
    @Published var data: [Item] = [] // Automatically updates on main thread
}
```

#### How do you handle errors in async functions?

```swift
// Method 1: try/catch
do {
    let result = try await fetchData()
} catch {
    handleError(error)
}

// Method 2: try?
let result = try? await fetchData()

// Method 3: Result
let result = await Task {
    try await fetchData()
}.result // Result<Data, Error>
```

#### What's the difference between Task and Task.detached?

**Key Points:**
- Task inherits parent task context (priority, Actor isolation, etc.)
- Task.detached is completely independent, doesn't inherit any context
- Task inherits parent task's cancellation state
- Task.detached requires manual lifecycle management

#### What is Sendable?

**Key Points:**
- Sendable marks types that can be safely passed across concurrency boundaries
- Value types usually conform automatically (if all properties are Sendable)
- Immutable classes can be Sendable
- Actors are automatically Sendable
- `@unchecked Sendable` is used for manually guaranteed thread-safe types

### Coding Exercise Example

**Problem: Implement an async operation with timeout**

```swift
func withTimeout<T>(
    seconds: TimeInterval,
    operation: @escaping () async throws -> T
) async throws -> T {
    try await withThrowingTaskGroup(of: T.self) { group in
        // Add the actual operation
        group.addTask {
            try await operation()
        }

        // Add timeout task
        group.addTask {
            try await Task.sleep(for: .seconds(seconds))
            throw TimeoutError()
        }

        // Return the first completed result
        guard let result = try await group.next() else {
            throw TimeoutError()
        }

        // Cancel the other task
        group.cancelAll()

        return result
    }
}

struct TimeoutError: Error {}

// Usage
let data = try await withTimeout(seconds: 5) {
    try await fetchLargeData()
}
```

## Further Reading

### Official Resources
- [Swift Official Concurrency Documentation](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/)
- [SE-0296: Async/await](https://github.com/apple/swift-evolution/blob/main/proposals/0296-async-await.zh.md)
- [SE-0302: Sendable](https://github.com/apple/swift-evolution/blob/main/proposals/0302-concurrent-value-and-concurrent-closures.zh.md)
- [SE-0306: Actors](https://github.com/apple/swift-evolution/blob/main/proposals/0306-actors.zh.md)

### WWDC Videos
- [Meet async/await in Swift (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10132/)
- [Explore structured concurrency in Swift (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10134/)
- [Protect mutable state with Swift actors (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10133/)
- [Swift concurrency: Behind the scenes (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10254/)
- [Eliminate data races using Swift Concurrency (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/110351/)

### Recommended Books
- "Swift Concurrency" by Matt Massicotte
- "Modern Concurrency in Swift" by Marin Todorov (raywenderlich.com)

### Community Resources
- [Swift by Sundell - Concurrency](https://www.swiftbysundell.com/discover/concurrency/)
- [Hacking with Swift - Concurrency](https://www.hackingwithswift.com/swift/5.5/async-await)
- [Point-Free - Concurrency](https://www.pointfree.co/collections/concurrency)

---

*Last updated: 2026-01-07*
