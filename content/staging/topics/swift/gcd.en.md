---
title: GCD Concurrency Programming
description: Complete guide to Grand Central Dispatch (GCD) for iOS and macOS, covering dispatch queues, async/sync operations, groups, semaphores, and concurrent programming patterns
track: swift
section: concurrency
difficulty: intermediate
tags:
  - Swift
  - iOS
  - GCD
  - Concurrency
  - Threading
  - Dispatch
status: imported
origin: old/src/content/docs/swift/gcd.en.md
divergence: 0.257
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Swift
  subcategory: ""
  order: 3
  lastUpdated: 2026-01-22
---

Grand Central Dispatch (GCD) is Apple's low-level API for managing concurrent operations. It provides a simple and efficient way to execute tasks asynchronously without managing threads directly. GCD automatically optimizes thread usage based on system resources and workload.

## Concept Explanation

GCD abstracts thread management by using dispatch queues. Instead of creating and managing threads, you submit work to queues, and GCD handles the underlying thread pool. This approach is more efficient and less error-prone than manual thread management.

Key concepts:
- **Dispatch Queues**: FIFO queues that execute tasks
- **Serial Queues**: Execute tasks one at a time
- **Concurrent Queues**: Execute multiple tasks simultaneously
- **Main Queue**: Serial queue for UI updates (main thread)
- **Work Items**: Encapsulated units of work

```swift
import Dispatch

// Execute on background queue
DispatchQueue.global().async {
    let result = performHeavyComputation()

    // Update UI on main queue
    DispatchQueue.main.async {
        self.updateUI(with: result)
    }
}
```

## Core Principles

### Queue Types

```swift
// Main Queue - Serial, for UI
let mainQueue = DispatchQueue.main

// Global Queues - Concurrent, system-provided
let backgroundQueue = DispatchQueue.global(qos: .background)
let userInitiatedQueue = DispatchQueue.global(qos: .userInitiated)
let utilityQueue = DispatchQueue.global(qos: .utility)

// Custom Serial Queue
let serialQueue = DispatchQueue(label: "com.myapp.serial")

// Custom Concurrent Queue
let concurrentQueue = DispatchQueue(
    label: "com.myapp.concurrent",
    attributes: .concurrent
)
```

### Quality of Service (QoS)

```swift
// QoS levels from highest to lowest priority
enum QualityOfService {
    case userInteractive  // UI animations, event handling
    case userInitiated    // User-initiated actions requiring immediate results
    case `default`        // Default priority
    case utility          // Long-running tasks with progress indicators
    case background       // Tasks not visible to user
    case unspecified      // System decides
}

// Example usage
DispatchQueue.global(qos: .userInitiated).async {
    // High-priority task triggered by user action
}

DispatchQueue.global(qos: .background).async {
    // Low-priority background task
}
```

## Key Concepts

### Sync vs Async

```swift
let queue = DispatchQueue(label: "com.example.queue")

// Async - Returns immediately, work executes later
queue.async {
    print("1. Async work")
}
print("2. After async call")
// Output: "2. After async call" then "1. Async work"

// Sync - Blocks until work completes
queue.sync {
    print("3. Sync work")
}
print("4. After sync call")
// Output: "3. Sync work" then "4. After sync call"
```

### Dispatch Groups

```swift
let group = DispatchGroup()
let queue = DispatchQueue.global()

// Method 1: Enter/Leave manually
group.enter()
fetchUserData { user in
    self.user = user
    group.leave()
}

group.enter()
fetchPosts { posts in
    self.posts = posts
    group.leave()
}

// Method 2: Use with async
queue.async(group: group) {
    self.fetchComments()
}

// Wait for all tasks to complete
group.notify(queue: .main) {
    print("All tasks completed")
    self.updateUI()
}

// Or block current thread (use sparingly)
// group.wait()

// With timeout
let result = group.wait(timeout: .now() + 10)
switch result {
case .success:
    print("All tasks completed")
case .timedOut:
    print("Timeout waiting for tasks")
}
```

### Work Items

```swift
// Create a work item
let workItem = DispatchWorkItem {
    print("Performing work")
}

// Execute on queue
DispatchQueue.global().async(execute: workItem)

// Cancel work item (if not started)
workItem.cancel()

// Check if cancelled in long-running task
let longWorkItem = DispatchWorkItem {
    for i in 0..<1000 {
        if Thread.current.isCancelled {
            return
        }
        // Do work
    }
}

// Notify on completion
workItem.notify(queue: .main) {
    print("Work completed")
}

// Wait for completion
workItem.wait()
```

## Code Examples

### Image Processing Pipeline

```swift
class ImageProcessor {

    private let processingQueue = DispatchQueue(
        label: "com.myapp.imageprocessing",
        qos: .userInitiated,
        attributes: .concurrent
    )

    func processImages(_ urls: [URL], completion: @escaping ([UIImage]) -> Void) {
        let group = DispatchGroup()
        var processedImages: [Int: UIImage] = [:]
        let lock = NSLock()

        for (index, url) in urls.enumerated() {
            group.enter()

            processingQueue.async {
                defer { group.leave() }

                guard let data = try? Data(contentsOf: url),
                      let image = UIImage(data: data) else {
                    return
                }

                // Apply filters
                let processed = self.applyFilters(to: image)

                // Thread-safe storage
                lock.lock()
                processedImages[index] = processed
                lock.unlock()
            }
        }

        group.notify(queue: .main) {
            // Return images in original order
            let sortedImages = processedImages.sorted { $0.key < $1.key }
                .map { $0.value }
            completion(sortedImages)
        }
    }

    private func applyFilters(to image: UIImage) -> UIImage {
        // Image processing logic
        return image
    }
}
```

### Semaphores for Rate Limiting

```swift
class RateLimitedDownloader {

    private let maxConcurrentDownloads = 3
    private let semaphore: DispatchSemaphore
    private let downloadQueue = DispatchQueue(
        label: "com.myapp.downloads",
        attributes: .concurrent
    )

    init() {
        semaphore = DispatchSemaphore(value: maxConcurrentDownloads)
    }

    func download(urls: [URL], completion: @escaping ([Data]) -> Void) {
        var results: [Int: Data] = [:]
        let lock = NSLock()
        let group = DispatchGroup()

        for (index, url) in urls.enumerated() {
            group.enter()

            downloadQueue.async {
                // Wait for semaphore (blocks if max concurrent reached)
                self.semaphore.wait()
                defer {
                    self.semaphore.signal()
                    group.leave()
                }

                // Perform download
                if let data = try? Data(contentsOf: url) {
                    lock.lock()
                    results[index] = data
                    lock.unlock()
                }
            }
        }

        group.notify(queue: .main) {
            let sortedResults = results.sorted { $0.key < $1.key }
                .map { $0.value }
            completion(sortedResults)
        }
    }
}
```

### Barriers for Thread-Safe Access

```swift
class ThreadSafeCache<Key: Hashable, Value> {

    private var cache: [Key: Value] = [:]
    private let queue = DispatchQueue(
        label: "com.myapp.cache",
        attributes: .concurrent
    )

    func get(_ key: Key) -> Value? {
        queue.sync {
            cache[key]
        }
    }

    func set(_ key: Key, value: Value) {
        // Barrier ensures exclusive access during write
        queue.async(flags: .barrier) {
            self.cache[key] = value
        }
    }

    func remove(_ key: Key) {
        queue.async(flags: .barrier) {
            self.cache.removeValue(forKey: key)
        }
    }

    func clear() {
        queue.async(flags: .barrier) {
            self.cache.removeAll()
        }
    }

    var count: Int {
        queue.sync {
            cache.count
        }
    }
}
```

### Delayed Execution

```swift
// Execute after delay
DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
    print("Executed after 2 seconds")
}

// Debouncing implementation
class Debouncer {

    private var workItem: DispatchWorkItem?
    private let queue: DispatchQueue
    private let delay: TimeInterval

    init(delay: TimeInterval, queue: DispatchQueue = .main) {
        self.delay = delay
        self.queue = queue
    }

    func debounce(action: @escaping () -> Void) {
        workItem?.cancel()

        let newWorkItem = DispatchWorkItem(block: action)
        workItem = newWorkItem

        queue.asyncAfter(deadline: .now() + delay, execute: newWorkItem)
    }
}

// Throttling implementation
class Throttler {

    private var lastExecutionTime: DispatchTime = .distantPast
    private let interval: TimeInterval
    private let queue: DispatchQueue

    init(interval: TimeInterval, queue: DispatchQueue = .main) {
        self.interval = interval
        self.queue = queue
    }

    func throttle(action: @escaping () -> Void) {
        let now = DispatchTime.now()
        let elapsed = Double(now.uptimeNanoseconds - lastExecutionTime.uptimeNanoseconds) / 1_000_000_000

        if elapsed >= interval {
            lastExecutionTime = now
            queue.async(execute: action)
        }
    }
}
```

### Dispatch Sources

```swift
// Timer using DispatchSourceTimer
class GCDTimer {

    private var timer: DispatchSourceTimer?
    private let queue: DispatchQueue

    init(queue: DispatchQueue = .main) {
        self.queue = queue
    }

    func start(interval: TimeInterval, handler: @escaping () -> Void) {
        stop()

        timer = DispatchSource.makeTimerSource(queue: queue)
        timer?.schedule(deadline: .now(), repeating: interval)
        timer?.setEventHandler(handler: handler)
        timer?.resume()
    }

    func stop() {
        timer?.cancel()
        timer = nil
    }

    deinit {
        stop()
    }
}

// File monitoring
class FileMonitor {

    private var source: DispatchSourceFileSystemObject?

    func monitor(path: String, handler: @escaping (DispatchSource.FileSystemEvent) -> Void) {
        let fileDescriptor = open(path, O_EVTONLY)
        guard fileDescriptor != -1 else { return }

        source = DispatchSource.makeFileSystemObjectSource(
            fileDescriptor: fileDescriptor,
            eventMask: [.write, .delete, .rename],
            queue: .main
        )

        source?.setEventHandler { [weak self] in
            guard let event = self?.source?.data else { return }
            handler(event)
        }

        source?.setCancelHandler {
            close(fileDescriptor)
        }

        source?.resume()
    }

    func stop() {
        source?.cancel()
        source = nil
    }
}
```

## Best Practices

### 1. Avoid Deadlocks

```swift
// WRONG: Deadlock - sync on main from main
DispatchQueue.main.sync {  // Will deadlock!
    print("Never executes")
}

// WRONG: Deadlock - sync to same queue
let queue = DispatchQueue(label: "com.example.queue")
queue.sync {
    queue.sync {  // Deadlock!
        print("Never executes")
    }
}

// CORRECT: Use async or different queues
DispatchQueue.global().async {
    let result = self.computeValue()
    DispatchQueue.main.async {
        self.updateUI(with: result)
    }
}
```

### 2. Use Appropriate QoS

```swift
// Match QoS to task importance
class TaskManager {

    func performUserInitiatedTask(_ task: @escaping () -> Void) {
        // User is waiting for this
        DispatchQueue.global(qos: .userInitiated).async(execute: task)
    }

    func performBackgroundSync(_ task: @escaping () -> Void) {
        // Not visible to user
        DispatchQueue.global(qos: .background).async(execute: task)
    }

    func performTimeConstrainedTask(
        _ task: @escaping () -> Void,
        timeout: TimeInterval,
        completion: @escaping (Bool) -> Void
    ) {
        let workItem = DispatchWorkItem(block: task)

        DispatchQueue.global(qos: .userInitiated).async(execute: workItem)

        let result = workItem.wait(timeout: .now() + timeout)
        completion(result == .success)
    }
}
```

### 3. Prefer Higher-Level APIs

```swift
// For async/await (iOS 13+), prefer structured concurrency
func modernApproach() async {
    let result = await withCheckedContinuation { continuation in
        DispatchQueue.global().async {
            let value = self.computeValue()
            continuation.resume(returning: value)
        }
    }

    // Use result
}
```

## Common Pitfalls

### 1. Main Thread Blocking

```swift
// WRONG: Blocking main thread
func fetchData() {
    let data = URLSession.shared.dataTask(with: url).wait() // Blocks!
    updateUI(with: data)
}

// CORRECT: Async with callback
func fetchData() {
    URLSession.shared.dataTask(with: url) { data, _, _ in
        DispatchQueue.main.async {
            self.updateUI(with: data)
        }
    }.resume()
}
```

### 2. Retain Cycles in Closures

```swift
// WRONG: Strong reference cycle
class ViewController: UIViewController {
    func loadData() {
        DispatchQueue.global().async {
            let data = self.fetchData()  // Strong self capture
            DispatchQueue.main.async {
                self.display(data)  // May leak
            }
        }
    }
}

// CORRECT: Weak self
class ViewController: UIViewController {
    func loadData() {
        DispatchQueue.global().async { [weak self] in
            guard let self = self else { return }
            let data = self.fetchData()
            DispatchQueue.main.async { [weak self] in
                self?.display(data)
            }
        }
    }
}
```

### 3. Race Conditions

```swift
// WRONG: Race condition
var counter = 0
for _ in 0..<1000 {
    DispatchQueue.global().async {
        counter += 1  // Data race!
    }
}

// CORRECT: Use synchronization
var counter = 0
let lock = NSLock()
for _ in 0..<1000 {
    DispatchQueue.global().async {
        lock.lock()
        counter += 1
        lock.unlock()
    }
}

// Or use barrier with concurrent queue
let queue = DispatchQueue(label: "counter", attributes: .concurrent)
var counter = 0
for _ in 0..<1000 {
    queue.async(flags: .barrier) {
        counter += 1
    }
}
```

## Performance Considerations

### Minimize Queue Switching

```swift
// WRONG: Excessive queue switching
func processItems(_ items: [Item]) {
    for item in items {
        DispatchQueue.global().async {
            let processed = self.process(item)
            DispatchQueue.main.async {
                self.update(processed)  // Many main queue dispatches
            }
        }
    }
}

// CORRECT: Batch updates
func processItems(_ items: [Item]) {
    DispatchQueue.global().async {
        let processed = items.map { self.process($0) }

        DispatchQueue.main.async {
            self.updateAll(processed)  // Single main queue dispatch
        }
    }
}
```

## Real-World Scenarios

### Image Loading with Caching

```swift
class ImageLoader {

    static let shared = ImageLoader()

    private let cache = ThreadSafeCache<URL, UIImage>()
    private let loadingQueue = DispatchQueue(
        label: "com.myapp.imageloader",
        qos: .utility,
        attributes: .concurrent
    )
    private var pendingRequests: [URL: [((UIImage?) -> Void)]] = [:]
    private let pendingLock = NSLock()

    func loadImage(from url: URL, completion: @escaping (UIImage?) -> Void) {
        // Check cache
        if let cached = cache.get(url) {
            DispatchQueue.main.async {
                completion(cached)
            }
            return
        }

        // Check pending requests
        pendingLock.lock()
        if var pending = pendingRequests[url] {
            pending.append(completion)
            pendingRequests[url] = pending
            pendingLock.unlock()
            return
        }
        pendingRequests[url] = [completion]
        pendingLock.unlock()

        // Load image
        loadingQueue.async { [weak self] in
            guard let data = try? Data(contentsOf: url),
                  let image = UIImage(data: data) else {
                self?.completeRequest(url: url, image: nil)
                return
            }

            self?.cache.set(url, value: image)
            self?.completeRequest(url: url, image: image)
        }
    }

    private func completeRequest(url: URL, image: UIImage?) {
        pendingLock.lock()
        let completions = pendingRequests.removeValue(forKey: url) ?? []
        pendingLock.unlock()

        DispatchQueue.main.async {
            completions.forEach { $0(image) }
        }
    }
}
```

## Interview Key Points

1. **What is GCD and why use it?**
   - Low-level concurrency API from Apple
   - Manages thread pool automatically
   - Simpler than manual thread management

2. **Difference between sync and async?**
   - Sync blocks until work completes
   - Async returns immediately

3. **What are QoS levels?**
   - Priority hints for the scheduler
   - userInteractive > userInitiated > default > utility > background

4. **How to avoid deadlocks?**
   - Never sync to current queue
   - Be careful with nested sync calls
   - Use async when possible

5. **What are barriers?**
   - Ensure exclusive access during writes
   - Used with concurrent queues for thread-safe read/write

## Further Reading

- [Apple GCD Documentation](https://developer.apple.com/documentation/dispatch)
- [Concurrency Programming Guide](https://developer.apple.com/library/archive/documentation/General/Conceptual/ConcurrencyProgrammingGuide/)
- [WWDC: Modernizing Grand Central Dispatch Usage](https://developer.apple.com/videos/play/wwdc2017/706/)
- [Swift Concurrency Manifesto](https://gist.github.com/lattner/31ed37682ef1576b16bca1432ea9f782)
