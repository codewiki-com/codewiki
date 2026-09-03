---
title: OperationQueue 任务队列
description: iOS/macOS OperationQueue 和 Operation 完全指南：涵盖依赖关系、优先级、自定义操作和复杂任务管理
track: swift
section: concurrency
difficulty: intermediate
tags:
  - Swift
  - iOS
  - OperationQueue
  - 并发
  - 多线程
  - 任务
status: imported
origin: old/src/content/docs/swift/operation-queue.zh.md
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

OperationQueue 是构建在 GCD 之上的高级抽象，提供操作依赖、优先级和取消等额外功能。它非常适合需要对执行顺序和状态进行细粒度控制的复杂任务管理。

## 概念解释

虽然 GCD 专注于简单的任务提交，但 OperationQueue 提供了面向对象的并发方法。每个 Operation 都是一个可以被观察、取消和与其他操作协调的对象。这使得构建复杂的工作流程变得更容易。

相对于 GCD 的主要优势：
- **依赖关系**：按特定顺序执行操作
- **取消**：单独或批量取消操作
- **可观察性**：使用 KVO 监控操作状态
- **可重用性**：子类化 Operation 创建可重用任务
- **优先级**：每个操作的细粒度优先级控制

```swift
import Foundation

// 简单用法
let queue = OperationQueue()

queue.addOperation {
    print("简单的块操作")
}

// 带依赖关系
let downloadOp = BlockOperation { print("下载") }
let processOp = BlockOperation { print("处理") }
let saveOp = BlockOperation { print("保存") }

processOp.addDependency(downloadOp)
saveOp.addDependency(processOp)

queue.addOperations([downloadOp, processOp, saveOp], waitUntilFinished: false)
```

## 核心原理

### 操作状态

```
                    ┌─────────┐
                    │  就绪   │
                    └────┬────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             │             │
    ┌──────────┐         │      ┌──────┴─────┐
    │  已取消  │         │      │   执行中   │
    └──────────┘         │      └──────┬─────┘
                         │             │
                         │      ┌──────▼─────┐
                         │      │   已完成   │
                         │      └────────────┘
                         │
               （如果在执行开始前取消）
```

### 队列配置

```swift
let queue = OperationQueue()

// 设置最大并发操作数
queue.maxConcurrentOperationCount = 4

// 串行队列
queue.maxConcurrentOperationCount = 1

// 系统决定（默认）
queue.maxConcurrentOperationCount = OperationQueue.defaultMaxConcurrentOperationCount

// 用于调试的名称
queue.name = "com.myapp.imageProcessing"

// 服务质量
queue.qualityOfService = .userInitiated

// 暂停/恢复
queue.isSuspended = true
// ... 在暂停时添加操作
queue.isSuspended = false  // 恢复执行
```

## 关键概念

### BlockOperation

```swift
// 简单的块操作
let operation = BlockOperation {
    print("第一个块")
}

// 向同一操作添加多个块
operation.addExecutionBlock {
    print("第二个块")
}

operation.addExecutionBlock {
    print("第三个块")
}

// 完成处理器
operation.completionBlock = {
    print("所有块已完成")
}

// 注意：BlockOperation 中的块可能并发运行
```

### 自定义 Operation 子类

```swift
class AsyncImageDownloadOperation: Operation {

    let url: URL
    private(set) var downloadedImage: UIImage?
    private(set) var error: Error?

    // 为异步操作重写状态管理
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

// 用法
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

### 依赖关系

```swift
class DataPipeline {

    private let queue = OperationQueue()

    func execute() {
        // 定义操作
        let fetchOp = BlockOperation {
            print("1. 从网络获取数据")
            Thread.sleep(forTimeInterval: 1)
        }

        let parseOp = BlockOperation {
            print("2. 解析数据")
            Thread.sleep(forTimeInterval: 0.5)
        }

        let validateOp = BlockOperation {
            print("3. 验证数据")
            Thread.sleep(forTimeInterval: 0.3)
        }

        let saveOp = BlockOperation {
            print("4. 保存到数据库")
            Thread.sleep(forTimeInterval: 0.5)
        }

        let notifyOp = BlockOperation {
            print("5. 通知完成")
        }

        // 设置依赖关系
        parseOp.addDependency(fetchOp)
        validateOp.addDependency(parseOp)
        saveOp.addDependency(validateOp)
        notifyOp.addDependency(saveOp)

        // 添加所有操作
        queue.addOperations(
            [fetchOp, parseOp, validateOp, saveOp, notifyOp],
            waitUntilFinished: false
        )
    }
}

// 带共享依赖的并行
func parallelDownload() {
    let queue = OperationQueue()
    queue.maxConcurrentOperationCount = 4

    // 设置操作
    let setupOp = BlockOperation {
        print("设置完成")
    }

    // 多个并行下载
    let downloadOps = (0..<10).map { index in
        BlockOperation {
            print("下载项目 \(index)")
            Thread.sleep(forTimeInterval: Double.random(in: 0.5...1.5))
        }
    }

    // 所有下载依赖于设置
    for op in downloadOps {
        op.addDependency(setupOp)
    }

    // 完成依赖于所有下载
    let completionOp = BlockOperation {
        print("所有下载完成")
    }
    for op in downloadOps {
        completionOp.addDependency(op)
    }

    queue.addOperation(setupOp)
    queue.addOperations(downloadOps, waitUntilFinished: false)
    queue.addOperation(completionOp)
}
```

## 代码示例

### 图像处理管道

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
```

### 带进度的操作

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

// 用法
let progressOp = ProgressOperation()
progressOp.progressHandler = { progress in
    DispatchQueue.main.async {
        self.progressView.progress = Float(progress)
    }
}
queue.addOperation(progressOp)
```

## 最佳实践

### 1. 频繁检查取消状态

```swift
class LongRunningOperation: Operation {

    override func main() {
        let items = loadItems()

        for (index, item) in items.enumerated() {
            // 在长循环中频繁检查
            guard !isCancelled else {
                cleanup()
                return
            }

            process(item)

            // 更新进度
            let progress = Double(index + 1) / Double(items.count)
            reportProgress(progress)
        }
    }
}
```

### 2. 使用适当的队列配置

```swift
class QueueManager {

    // UI 相关操作
    static let uiQueue: OperationQueue = {
        let queue = OperationQueue()
        queue.qualityOfService = .userInteractive
        queue.maxConcurrentOperationCount = 1
        return queue
    }()

    // 网络操作
    static let networkQueue: OperationQueue = {
        let queue = OperationQueue()
        queue.qualityOfService = .utility
        queue.maxConcurrentOperationCount = 6
        return queue
    }()

    // 后台处理
    static let backgroundQueue: OperationQueue = {
        let queue = OperationQueue()
        queue.qualityOfService = .background
        queue.maxConcurrentOperationCount = 2
        return queue
    }()
}
```

### 3. 避免循环依赖

```swift
// 错误：循环依赖导致死锁
let opA = BlockOperation()
let opB = BlockOperation()
opA.addDependency(opB)
opB.addDependency(opA)  // 死锁！

// 正确：线性依赖
let opA = BlockOperation()
let opB = BlockOperation()
let opC = BlockOperation()
opB.addDependency(opA)
opC.addDependency(opB)
```

## 常见陷阱

### 1. 不正确处理异步操作

```swift
// 错误：操作在异步工作完成前结束
class WrongAsyncOperation: Operation {
    override func main() {
        URLSession.shared.dataTask(with: url) { data, _, _ in
            // 这在 main() 返回后运行！
            self.process(data)
        }.resume()
    }  // 操作在这里被标记为完成，但工作还没完成
}

// 正确：重写状态管理
class CorrectAsyncOperation: Operation {
    override var isAsynchronous: Bool { true }
    // ... 实现带 KVO 的 isExecuting/isFinished
}
```

### 2. 阻塞主队列

```swift
// 错误：在主线程上等待
DispatchQueue.main.async {
    queue.waitUntilAllOperationsAreFinished()  // 阻塞 UI！
}

// 正确：使用完成操作
let completionOp = BlockOperation {
    DispatchQueue.main.async {
        self.updateUI()
    }
}
// 添加依赖
queue.addOperation(completionOp)
```

### 3. 不清理资源

```swift
class ResourceOperation: Operation {

    private var connection: DatabaseConnection?

    override func main() {
        connection = openConnection()
        defer { cleanup() }  // 始终清理

        guard !isCancelled else { return }

        // 执行工作
    }

    override func cancel() {
        super.cancel()
        cleanup()  // 取消时也要清理
    }

    private func cleanup() {
        connection?.close()
        connection = nil
    }
}
```

## 性能考虑

### 批量操作

```swift
// 高效地添加多个操作
let operations = (0..<100).map { index in
    BlockOperation {
        self.process(index)
    }
}

// 一次性添加所有
queue.addOperations(operations, waitUntilFinished: false)
```

### 限制并发操作

```swift
// 防止资源耗尽
queue.maxConcurrentOperationCount = 4

// 根据设备能力调整
let processorCount = ProcessInfo.processInfo.activeProcessorCount
queue.maxConcurrentOperationCount = max(1, processorCount - 1)
```

## 面试要点

1. **OperationQueue 和 GCD 有什么区别？**
   - OperationQueue：面向对象，支持依赖、取消
   - GCD：更底层，更简单，更适合快速任务

2. **如何创建异步 Operation？**
   - 重写 isAsynchronous 返回 true
   - 使用 KVO 管理 isExecuting/isFinished

3. **什么是操作依赖？**
   - 定义操作之间的执行顺序
   - 操作在所有依赖完成前不会开始

4. **如何处理取消？**
   - 在 main() 中频繁检查 isCancelled
   - 在 cancel() 重写中清理资源

5. **何时使用 OperationQueue vs GCD？**
   - OperationQueue：复杂工作流、依赖关系、可重用任务
   - GCD：简单异步任务、一次性工作

## 延伸阅读

- [Apple Operation 文档](https://developer.apple.com/documentation/foundation/operation)
- [Apple OperationQueue 文档](https://developer.apple.com/documentation/foundation/operationqueue)
- [高级 NSOperations - WWDC 2015](https://developer.apple.com/videos/play/wwdc2015/226/)
- [并发编程指南](https://developer.apple.com/library/archive/documentation/General/Conceptual/ConcurrencyProgrammingGuide/)
