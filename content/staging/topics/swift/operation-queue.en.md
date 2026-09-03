---
title: OperationQueue Task Queue
description: Complete guide to OperationQueue and Operation for iOS and macOS, covering dependencies, priorities, custom operations, and complex task management
track: swift
section: concurrency
difficulty: intermediate
tags:
  - Swift
  - iOS
  - OperationQueue
  - Concurrency
  - Threading
  - Tasks
status: imported
origin: old/src/content/docs/swift/operation-queue.en.md
divergence: 0.266
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Swift
  subcategory: ""
  order: 4
  lastUpdated: 2026-01-22
---

OperationQueue is a high-level abstraction built on top of GCD that provides additional features like operation dependencies, priorities, and cancellation. It's ideal for complex task management where you need fine-grained control over execution order and state.

## Concept Explanation

While GCD focuses on simple task submission, OperationQueue provides an object-oriented approach to concurrency. Each Operation is an object that can be observed, cancelled, and coordinated with other operations. This makes it easier to build complex workflows.

Key advantages over GCD:
- **Dependencies**: Execute operations in specific order
- **Cancellation**: Cancel operations individually or in bulk
- **Observability**: Monitor operation state with KVO
- **Reusability**: Subclass Operation for reusable tasks
- **Priorities**: Fine-grained priority control per operation

```swift
import Foundation

// Simple usage
let queue = OperationQueue()

queue.addOperation {
    print("Simple block operation")
}

// With dependencies
let downloadOp = BlockOperation { print("Download") }
let processOp = BlockOperation { print("Process") }
let saveOp = BlockOperation { print("Save") }

processOp.addDependency(downloadOp)
saveOp.addDependency(processOp)

queue.addOperations([downloadOp, processOp, saveOp], waitUntilFinished: false)
```

## Core Principles

### Operation States

```
                    ┌─────────┐
                    │  Ready  │
                    └────┬────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             │             │
    ┌──────────┐         │      ┌──────┴─────┐
    │ Cancelled│         │      │  Executing │
    └──────────┘         │      └──────┬─────┘
                         │             │
                         │      ┌──────▼─────┐
                         │      │  Finished  │
                         │      └────────────┘
                         │
                 (If cancelled before
                    execution starts)
```

### Queue Configuration

```swift
let queue = OperationQueue()

// Set maximum concurrent operations
queue.maxConcurrentOperationCount = 4

// Serial queue
queue.maxConcurrentOperationCount = 1

// System decides (default)
queue.maxConcurrentOperationCount = OperationQueue.defaultMaxConcurrentOperationCount

// Name for debugging
queue.name = "com.myapp.imageProcessing"

// Quality of service
queue.qualityOfService = .userInitiated

// Suspend/resume
queue.isSuspended = true
// ... add operations while suspended
queue.isSuspended = false  // Resume execution
```

## Key Concepts

### BlockOperation

```swift
// Simple block operation
let operation = BlockOperation {
    print("First block")
}

// Add multiple blocks to same operation
operation.addExecutionBlock {
    print("Second block")
}

operation.addExecutionBlock {
    print("Third block")
}

// Completion handler
operation.completionBlock = {
    print("All blocks completed")
}

// Note: Blocks within BlockOperation may run concurrently
```

### Custom Operation Subclass

```swift
class AsyncImageDownloadOperation: Operation {

    let url: URL
    private(set) var downloadedImage: UIImage?
    private(set) var error: Error?

    // Override state management for async operations
    private var _isExecuting = false
    private var _isFinished = false

    override var isAsynchronous: Bool { true }

    override var isExecuting: Bool {
        get { _isExecuting }
        set {
            willChangeValue(forKey: "isExecuting")
            _isExecuting = newValue
            didChangeValue(forKey: "isExecuting")
        }
    }

    override var isFinished: Bool {
        get { _isFinished }
        set {
            willChangeValue(forKey: "isFinished")
            _isFinished = newValue
            didChangeValue(forKey: "isFinished")
        }
    }

    init(url: URL) {
        self.url = url
        super.init()
    }

    override func start() {
        guard !isCancelled else {
            finish()
            return
        }

        isExecuting = true

        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            guard let self = self else { return }

            defer { self.finish() }

            if self.isCancelled { return }

            if let error = error {
                self.error = error
                return
            }

            guard let data = data,
                  let image = UIImage(data: data) else {
                self.error = NSError(domain: "ImageDownload", code: -1)
                return
            }

            self.downloadedImage = image
        }.resume()
    }

    private func finish() {
        isExecuting = false
        isFinished = true
    }
}

// Usage
let downloadOp = AsyncImageDownloadOperation(url: imageURL)
downloadOp.completionBlock = {
    if let image = downloadOp.downloadedImage {
        DispatchQueue.main.async {
            self.imageView.image = image
        }
    }
}
queue.addOperation(downloadOp)
```

### Dependencies

```swift
class DataPipeline {

    private let queue = OperationQueue()

    func execute() {
        // Define operations
        let fetchOp = BlockOperation {
            print("1. Fetching data from network")
            Thread.sleep(forTimeInterval: 1)
        }

        let parseOp = BlockOperation {
            print("2. Parsing data")
            Thread.sleep(forTimeInterval: 0.5)
        }

        let validateOp = BlockOperation {
            print("3. Validating data")
            Thread.sleep(forTimeInterval: 0.3)
        }

        let saveOp = BlockOperation {
            print("4. Saving to database")
            Thread.sleep(forTimeInterval: 0.5)
        }

        let notifyOp = BlockOperation {
            print("5. Notifying completion")
        }

        // Set up dependencies
        parseOp.addDependency(fetchOp)
        validateOp.addDependency(parseOp)
        saveOp.addDependency(validateOp)
        notifyOp.addDependency(saveOp)

        // Add all operations
        queue.addOperations(
            [fetchOp, parseOp, validateOp, saveOp, notifyOp],
            waitUntilFinished: false
        )
    }
}

// Parallel with shared dependency
func parallelDownload() {
    let queue = OperationQueue()
    queue.maxConcurrentOperationCount = 4

    // Setup operation
    let setupOp = BlockOperation {
        print("Setup complete")
    }

    // Multiple parallel downloads
    let downloadOps = (0..<10).map { index in
        BlockOperation {
            print("Downloading item \(index)")
            Thread.sleep(forTimeInterval: Double.random(in: 0.5...1.5))
        }
    }

    // All downloads depend on setup
    for op in downloadOps {
        op.addDependency(setupOp)
    }

    // Completion depends on all downloads
    let completionOp = BlockOperation {
        print("All downloads complete")
    }
    for op in downloadOps {
        completionOp.addDependency(op)
    }

    queue.addOperation(setupOp)
    queue.addOperations(downloadOps, waitUntilFinished: false)
    queue.addOperation(completionOp)
}
```

## Code Examples

### Image Processing Pipeline

```swift
class ImageProcessingPipeline {

    private let queue: OperationQueue

    init(maxConcurrent: Int = 4) {
        queue = OperationQueue()
        queue.maxConcurrentOperationCount = maxConcurrent
        queue.qualityOfService = .userInitiated
    }

    func process(
        imageURLs: [URL],
        completion: @escaping ([ProcessedImage]) -> Void
    ) {
        var results: [Int: ProcessedImage] = [:]
        let lock = NSLock()

        let operations = imageURLs.enumerated().map { index, url -> Operation in
            return ImageProcessingOperation(url: url, index: index) { result in
                lock.lock()
                results[index] = result
                lock.unlock()
            }
        }

        let completionOp = BlockOperation {
            let sorted = results.sorted { $0.key < $1.key }.map { $0.value }
            DispatchQueue.main.async {
                completion(sorted)
            }
        }

        operations.forEach { completionOp.addDependency($0) }

        queue.addOperations(operations, waitUntilFinished: false)
        queue.addOperation(completionOp)
    }

    func cancel() {
        queue.cancelAllOperations()
    }
}

class ImageProcessingOperation: Operation {

    let url: URL
    let index: Int
    let completionHandler: (ProcessedImage) -> Void

    init(url: URL, index: Int, completion: @escaping (ProcessedImage) -> Void) {
        self.url = url
        self.index = index
        self.completionHandler = completion
        super.init()
    }

    override func main() {
        guard !isCancelled else { return }

        // Download
        guard let data = try? Data(contentsOf: url),
              let image = UIImage(data: data) else {
            completionHandler(ProcessedImage(original: nil, processed: nil, error: .downloadFailed))
            return
        }

        guard !isCancelled else { return }

        // Process
        let processed = applyFilters(to: image)

        guard !isCancelled else { return }

        completionHandler(ProcessedImage(original: image, processed: processed, error: nil))
    }

    private func applyFilters(to image: UIImage) -> UIImage {
        // Apply image processing
        return image
    }
}

struct ProcessedImage {
    let original: UIImage?
    let processed: UIImage?
    let error: ProcessingError?
}

enum ProcessingError: Error {
    case downloadFailed
    case processingFailed
}
```

### Network Request Manager

```swift
class NetworkOperationManager {

    static let shared = NetworkOperationManager()

    private let queue: OperationQueue
    private var operations: [String: Operation] = [:]
    private let lock = NSLock()

    init() {
        queue = OperationQueue()
        queue.maxConcurrentOperationCount = 6
        queue.name = "com.myapp.network"
    }

    @discardableResult
    func request<T: Decodable>(
        _ request: URLRequest,
        id: String = UUID().uuidString,
        priority: Operation.QueuePriority = .normal,
        completion: @escaping (Result<T, Error>) -> Void
    ) -> String {

        let operation = NetworkOperation<T>(request: request) { [weak self] result in
            self?.removeOperation(id: id)
            DispatchQueue.main.async {
                completion(result)
            }
        }

        operation.queuePriority = priority

        lock.lock()
        operations[id] = operation
        lock.unlock()

        queue.addOperation(operation)

        return id
    }

    func cancel(id: String) {
        lock.lock()
        operations[id]?.cancel()
        operations.removeValue(forKey: id)
        lock.unlock()
    }

    func cancelAll() {
        queue.cancelAllOperations()
        lock.lock()
        operations.removeAll()
        lock.unlock()
    }

    private func removeOperation(id: String) {
        lock.lock()
        operations.removeValue(forKey: id)
        lock.unlock()
    }
}

class NetworkOperation<T: Decodable>: Operation {

    private let request: URLRequest
    private let completion: (Result<T, Error>) -> Void

    private var _isExecuting = false
    private var _isFinished = false
    private var task: URLSessionTask?

    override var isAsynchronous: Bool { true }

    override var isExecuting: Bool {
        get { _isExecuting }
        set {
            willChangeValue(forKey: "isExecuting")
            _isExecuting = newValue
            didChangeValue(forKey: "isExecuting")
        }
    }

    override var isFinished: Bool {
        get { _isFinished }
        set {
            willChangeValue(forKey: "isFinished")
            _isFinished = newValue
            didChangeValue(forKey: "isFinished")
        }
    }

    init(request: URLRequest, completion: @escaping (Result<T, Error>) -> Void) {
        self.request = request
        self.completion = completion
        super.init()
    }

    override func start() {
        guard !isCancelled else {
            finish(with: .failure(CancellationError()))
            return
        }

        isExecuting = true

        task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self, !self.isCancelled else {
                self?.finish(with: .failure(CancellationError()))
                return
            }

            if let error = error {
                self.finish(with: .failure(error))
                return
            }

            guard let data = data else {
                self.finish(with: .failure(NetworkError.noData))
                return
            }

            do {
                let decoded = try JSONDecoder().decode(T.self, from: data)
                self.finish(with: .success(decoded))
            } catch {
                self.finish(with: .failure(error))
            }
        }

        task?.resume()
    }

    override func cancel() {
        task?.cancel()
        super.cancel()
    }

    private func finish(with result: Result<T, Error>) {
        completion(result)
        isExecuting = false
        isFinished = true
    }
}

struct CancellationError: Error {}
enum NetworkError: Error {
    case noData
}
```

### Operation with Progress

```swift
class ProgressOperation: Operation {

    let progress: Progress
    var progressHandler: ((Double) -> Void)?

    override init() {
        progress = Progress(totalUnitCount: 100)
        super.init()

        progress.addObserver(self, forKeyPath: "fractionCompleted", options: .new, context: nil)
    }

    deinit {
        progress.removeObserver(self, forKeyPath: "fractionCompleted")
    }

    override func observeValue(
        forKeyPath keyPath: String?,
        of object: Any?,
        change: [NSKeyValueChangeKey : Any]?,
        context: UnsafeMutableRawPointer?
    ) {
        if keyPath == "fractionCompleted" {
            progressHandler?(progress.fractionCompleted)
        }
    }

    override func main() {
        for i in 0...100 {
            guard !isCancelled else { break }

            Thread.sleep(forTimeInterval: 0.05)
            progress.completedUnitCount = Int64(i)
        }
    }
}

// Usage
let progressOp = ProgressOperation()
progressOp.progressHandler = { progress in
    DispatchQueue.main.async {
        self.progressView.progress = Float(progress)
    }
}
queue.addOperation(progressOp)
```

## Best Practices

### 1. Check for Cancellation Frequently

```swift
class LongRunningOperation: Operation {

    override func main() {
        let items = loadItems()

        for (index, item) in items.enumerated() {
            // Check frequently in long loops
            guard !isCancelled else {
                cleanup()
                return
            }

            process(item)

            // Update progress
            let progress = Double(index + 1) / Double(items.count)
            reportProgress(progress)
        }
    }
}
```

### 2. Use Appropriate Queue Configuration

```swift
class QueueManager {

    // UI-related operations
    static let uiQueue: OperationQueue = {
        let queue = OperationQueue()
        queue.qualityOfService = .userInteractive
        queue.maxConcurrentOperationCount = 1
        return queue
    }()

    // Network operations
    static let networkQueue: OperationQueue = {
        let queue = OperationQueue()
        queue.qualityOfService = .utility
        queue.maxConcurrentOperationCount = 6
        return queue
    }()

    // Background processing
    static let backgroundQueue: OperationQueue = {
        let queue = OperationQueue()
        queue.qualityOfService = .background
        queue.maxConcurrentOperationCount = 2
        return queue
    }()
}
```

### 3. Avoid Circular Dependencies

```swift
// WRONG: Circular dependency causes deadlock
let opA = BlockOperation()
let opB = BlockOperation()
opA.addDependency(opB)
opB.addDependency(opA)  // Deadlock!

// CORRECT: Linear dependencies
let opA = BlockOperation()
let opB = BlockOperation()
let opC = BlockOperation()
opB.addDependency(opA)
opC.addDependency(opB)
```

## Common Pitfalls

### 1. Not Handling Async Operations Properly

```swift
// WRONG: Operation finishes before async work completes
class WrongAsyncOperation: Operation {
    override func main() {
        URLSession.shared.dataTask(with: url) { data, _, _ in
            // This runs after main() returns!
            self.process(data)
        }.resume()
    }  // Operation marked finished here, but work isn't done
}

// CORRECT: Override state management
class CorrectAsyncOperation: Operation {
    override var isAsynchronous: Bool { true }
    // ... implement isExecuting/isFinished with KVO
}
```

### 2. Blocking Main Queue

```swift
// WRONG: Waiting on main thread
DispatchQueue.main.async {
    queue.waitUntilAllOperationsAreFinished()  // Blocks UI!
}

// CORRECT: Use completion operation
let completionOp = BlockOperation {
    DispatchQueue.main.async {
        self.updateUI()
    }
}
// Add dependencies
queue.addOperation(completionOp)
```

### 3. Not Cleaning Up Resources

```swift
class ResourceOperation: Operation {

    private var connection: DatabaseConnection?

    override func main() {
        connection = openConnection()
        defer { cleanup() }  // Always clean up

        guard !isCancelled else { return }

        // Do work
    }

    override func cancel() {
        super.cancel()
        cleanup()  // Also clean up on cancel
    }

    private func cleanup() {
        connection?.close()
        connection = nil
    }
}
```

## Performance Considerations

### Batch Operations

```swift
// Add multiple operations efficiently
let operations = (0..<100).map { index in
    BlockOperation {
        self.process(index)
    }
}

// Add all at once
queue.addOperations(operations, waitUntilFinished: false)
```

### Limit Concurrent Operations

```swift
// Prevent resource exhaustion
queue.maxConcurrentOperationCount = 4

// Adjust based on device capabilities
let processorCount = ProcessInfo.processInfo.activeProcessorCount
queue.maxConcurrentOperationCount = max(1, processorCount - 1)
```

## Real-World Scenarios

### File Sync Manager

```swift
class FileSyncManager {

    private let queue: OperationQueue
    private var syncOperations: [String: SyncOperation] = [:]

    init() {
        queue = OperationQueue()
        queue.maxConcurrentOperationCount = 3
        queue.qualityOfService = .utility
    }

    func sync(files: [File], completion: @escaping (Result<Void, Error>) -> Void) {
        let operations = files.map { file -> SyncOperation in
            let op = SyncOperation(file: file)
            syncOperations[file.id] = op
            return op
        }

        let completionOp = BlockOperation { [weak self] in
            self?.syncOperations.removeAll()

            let failed = operations.filter { $0.error != nil }
            if let firstError = failed.first?.error {
                DispatchQueue.main.async { completion(.failure(firstError)) }
            } else {
                DispatchQueue.main.async { completion(.success(())) }
            }
        }

        operations.forEach { completionOp.addDependency($0) }

        queue.addOperations(operations, waitUntilFinished: false)
        queue.addOperation(completionOp)
    }

    func cancelSync(for fileId: String) {
        syncOperations[fileId]?.cancel()
    }

    func cancelAll() {
        queue.cancelAllOperations()
    }
}
```

## Interview Key Points

1. **What's the difference between OperationQueue and GCD?**
   - OperationQueue: Object-oriented, supports dependencies, cancellation
   - GCD: Lower-level, simpler, better for quick tasks

2. **How do you make an async Operation?**
   - Override isAsynchronous to return true
   - Manage isExecuting/isFinished with KVO

3. **What are operation dependencies?**
   - Define execution order between operations
   - Operation won't start until all dependencies finish

4. **How to handle cancellation?**
   - Check isCancelled frequently in main()
   - Clean up resources in cancel() override

5. **When to use OperationQueue vs GCD?**
   - OperationQueue: Complex workflows, dependencies, reusable tasks
   - GCD: Simple async tasks, one-off work

## Further Reading

- [Apple Operation Documentation](https://developer.apple.com/documentation/foundation/operation)
- [Apple OperationQueue Documentation](https://developer.apple.com/documentation/foundation/operationqueue)
- [Advanced NSOperations - WWDC 2015](https://developer.apple.com/videos/play/wwdc2015/226/)
- [Concurrency Programming Guide](https://developer.apple.com/library/archive/documentation/General/Conceptual/ConcurrencyProgrammingGuide/)
