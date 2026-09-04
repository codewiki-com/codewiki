---
title: GCD 并发编程详解
description: Grand Central Dispatch (GCD) iOS/macOS 完全指南：涵盖调度队列、异步/同步操作、组、信号量和并发编程模式
track: swift
section: concurrency
difficulty: intermediate
tags:
  - Swift
  - iOS
  - GCD
  - 并发
  - 多线程
  - Dispatch
status: imported
origin: old/src/content/docs/swift/gcd.zh.md
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

Grand Central Dispatch (GCD) 是 Apple 用于管理并发操作的底层 API。它提供了一种简单高效的方式来异步执行任务，无需直接管理线程。GCD 根据系统资源和工作负载自动优化线程使用。

## 概念解释

GCD 通过使用调度队列来抽象线程管理。你不需要创建和管理线程，而是将工作提交到队列，GCD 处理底层线程池。这种方法比手动线程管理更高效，更不容易出错。

关键概念：
- **调度队列**：执行任务的 FIFO 队列
- **串行队列**：一次执行一个任务
- **并发队列**：同时执行多个任务
- **主队列**：用于 UI 更新的串行队列（主线程）
- **工作项**：封装的工作单元

```swift
import Dispatch

// 在后台队列执行
DispatchQueue.global().async {
    let result = performHeavyComputation()

    // 在主队列更新 UI
    DispatchQueue.main.async {
        self.updateUI(with: result)
    }
}
```

## 核心原理

### 队列类型

```swift
// 主队列 - 串行，用于 UI
let mainQueue = DispatchQueue.main

// 全局队列 - 并发，系统提供
let backgroundQueue = DispatchQueue.global(qos: .background)
let userInitiatedQueue = DispatchQueue.global(qos: .userInitiated)
let utilityQueue = DispatchQueue.global(qos: .utility)

// 自定义串行队列
let serialQueue = DispatchQueue(label: "com.myapp.serial")

// 自定义并发队列
let concurrentQueue = DispatchQueue(
    label: "com.myapp.concurrent",
    attributes: .concurrent
)
```

### 服务质量 (QoS)

```swift
// QoS 级别从最高到最低优先级
enum QualityOfService {
    case userInteractive  // UI 动画、事件处理
    case userInitiated    // 需要即时结果的用户发起操作
    case `default`        // 默认优先级
    case utility          // 带进度指示器的长时间运行任务
    case background       // 用户不可见的任务
    case unspecified      // 系统决定
}

// 使用示例
DispatchQueue.global(qos: .userInitiated).async {
    // 用户操作触发的高优先级任务
}

DispatchQueue.global(qos: .background).async {
    // 低优先级后台任务
}
```

## 关键概念

### 同步 vs 异步

```swift
let queue = DispatchQueue(label: "com.example.queue")

// Async - 立即返回，工作稍后执行
queue.async {
    print("1. 异步工作")
}
print("2. async 调用之后")
// 输出: "2. async 调用之后" 然后 "1. 异步工作"

// Sync - 阻塞直到工作完成
queue.sync {
    print("3. 同步工作")
}
print("4. sync 调用之后")
// 输出: "3. 同步工作" 然后 "4. sync 调用之后"
```

### 调度组

```swift
let group = DispatchGroup()
let queue = DispatchQueue.global()

// 方法 1：手动 Enter/Leave
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

// 方法 2：与 async 一起使用
queue.async(group: group) {
    self.fetchComments()
}

// 等待所有任务完成
group.notify(queue: .main) {
    print("所有任务已完成")
    self.updateUI()
}

// 或阻塞当前线程（谨慎使用）
// group.wait()

// 带超时
let result = group.wait(timeout: .now() + 10)
switch result {
case .success:
    print("所有任务已完成")
case .timedOut:
    print("等待任务超时")
}
```

### 工作项

```swift
// 创建工作项
let workItem = DispatchWorkItem {
    print("执行工作")
}

// 在队列上执行
DispatchQueue.global().async(execute: workItem)

// 取消工作项（如果尚未开始）
workItem.cancel()

// 在长时间运行的任务中检查是否取消
let longWorkItem = DispatchWorkItem {
    for i in 0..<1000 {
        if Thread.current.isCancelled {
            return
        }
        // 执行工作
    }
}

// 完成时通知
workItem.notify(queue: .main) {
    print("工作已完成")
}

// 等待完成
workItem.wait()
```

## 代码示例

### 图像处理管道

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

                // 应用滤镜
                let processed = self.applyFilters(to: image)

                // 线程安全存储
                lock.lock()
                processedImages[index] = processed
                lock.unlock()
            }
        }

        group.notify(queue: .main) {
            // 按原始顺序返回图像
            let sortedImages = processedImages.sorted { $0.key < $1.key }
                .map { $0.value }
            completion(sortedImages)
        }
    }

    private func applyFilters(to image: UIImage) -> UIImage {
        // 图像处理逻辑
        return image
    }
}
```

### 信号量用于速率限制

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
                // 等待信号量（如果达到最大并发则阻塞）
                self.semaphore.wait()
                defer {
                    self.semaphore.signal()
                    group.leave()
                }

                // 执行下载
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

### 屏障用于线程安全访问

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
        // 屏障确保写入时的独占访问
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

### 延迟执行

```swift
// 延迟后执行
DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
    print("2 秒后执行")
}

// 防抖实现
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

// 节流实现
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

## 最佳实践

### 1. 避免死锁

```swift
// 错误：从主线程同步到主线程会死锁
DispatchQueue.main.sync {  // 会死锁！
    print("永远不会执行")
}

// 错误：同步到同一队列会死锁
let queue = DispatchQueue(label: "com.example.queue")
queue.sync {
    queue.sync {  // 死锁！
        print("永远不会执行")
    }
}

// 正确：使用 async 或不同的队列
DispatchQueue.global().async {
    let result = self.computeValue()
    DispatchQueue.main.async {
        self.updateUI(with: result)
    }
}
```

### 2. 使用适当的 QoS

```swift
// 将 QoS 与任务重要性匹配
class TaskManager {

    func performUserInitiatedTask(_ task: @escaping () -> Void) {
        // 用户正在等待这个
        DispatchQueue.global(qos: .userInitiated).async(execute: task)
    }

    func performBackgroundSync(_ task: @escaping () -> Void) {
        // 用户不可见
        DispatchQueue.global(qos: .background).async(execute: task)
    }
}
```

### 3. 优先使用更高级的 API

```swift
// 对于 async/await（iOS 13+），优先使用结构化并发
func modernApproach() async {
    let result = await withCheckedContinuation { continuation in
        DispatchQueue.global().async {
            let value = self.computeValue()
            continuation.resume(returning: value)
        }
    }

    // 使用结果
}
```

## 常见陷阱

### 1. 主线程阻塞

```swift
// 错误：阻塞主线程
func fetchData() {
    let data = URLSession.shared.dataTask(with: url).wait() // 阻塞！
    updateUI(with: data)
}

// 正确：带回调的异步
func fetchData() {
    URLSession.shared.dataTask(with: url) { data, _, _ in
        DispatchQueue.main.async {
            self.updateUI(with: data)
        }
    }.resume()
}
```

### 2. 闭包中的循环引用

```swift
// 错误：强引用循环
class ViewController: UIViewController {
    func loadData() {
        DispatchQueue.global().async {
            let data = self.fetchData()  // 强引用 self
            DispatchQueue.main.async {
                self.display(data)  // 可能泄漏
            }
        }
    }
}

// 正确：弱引用 self
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

### 3. 竞态条件

```swift
// 错误：竞态条件
var counter = 0
for _ in 0..<1000 {
    DispatchQueue.global().async {
        counter += 1  // 数据竞争！
    }
}

// 正确：使用同步
var counter = 0
let lock = NSLock()
for _ in 0..<1000 {
    DispatchQueue.global().async {
        lock.lock()
        counter += 1
        lock.unlock()
    }
}

// 或者使用带并发队列的屏障
let queue = DispatchQueue(label: "counter", attributes: .concurrent)
var counter = 0
for _ in 0..<1000 {
    queue.async(flags: .barrier) {
        counter += 1
    }
}
```

## 性能考虑

### 最小化队列切换

```swift
// 错误：过度的队列切换
func processItems(_ items: [Item]) {
    for item in items {
        DispatchQueue.global().async {
            let processed = self.process(item)
            DispatchQueue.main.async {
                self.update(processed)  // 很多主队列调度
            }
        }
    }
}

// 正确：批量更新
func processItems(_ items: [Item]) {
    DispatchQueue.global().async {
        let processed = items.map { self.process($0) }

        DispatchQueue.main.async {
            self.updateAll(processed)  // 单次主队列调度
        }
    }
}
```

## 面试要点

1. **什么是 GCD，为什么使用它？**
   - Apple 的底层并发 API
   - 自动管理线程池
   - 比手动线程管理更简单

2. **sync 和 async 的区别？**
   - Sync 阻塞直到工作完成
   - Async 立即返回

3. **QoS 级别是什么？**
   - 调度器的优先级提示
   - userInteractive > userInitiated > default > utility > background

4. **如何避免死锁？**
   - 永远不要同步到当前队列
   - 小心嵌套的同步调用
   - 尽可能使用 async

5. **屏障是什么？**
   - 确保写入时的独占访问
   - 与并发队列一起使用实现线程安全的读/写

## 延伸阅读

- [Apple GCD 文档](https://developer.apple.com/documentation/dispatch)
- [并发编程指南](https://developer.apple.com/library/archive/documentation/General/Conceptual/ConcurrencyProgrammingGuide/)
- [WWDC: 现代化 Grand Central Dispatch 使用](https://developer.apple.com/videos/play/wwdc2017/706/)
- [Swift 并发宣言](https://gist.github.com/lattner/31ed37682ef1576b16bca1432ea9f782)
