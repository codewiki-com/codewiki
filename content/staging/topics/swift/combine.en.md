---
title: Combine Framework
description: Complete guide to Swift Combine, reactive programming, publishers and subscribers
track: swift
section: concurrency
difficulty: advanced
tags:
  - Swift
  - Combine
  - Reactive
  - Publisher
status: imported
origin: old/src/content/docs/swift/combine.en.md
divergence: 0.181
issues: []
legacy:
  category: Swift
  subcategory: Reactive Programming
  order: 8
  lastUpdated: 2026-01-07
---

Combine is Apple's declarative Swift framework for processing values over time, introduced in iOS 13, macOS 10.15, and watchOS 6. It provides a unified approach to handling asynchronous events, whether they originate from network requests, user interface interactions, notifications, or any other event source. Combine embraces functional reactive programming paradigms, enabling developers to write cleaner, more maintainable code for complex asynchronous workflows.

## Core Concepts

Combine is built around three fundamental concepts: Publishers, Subscribers, and Operators. Understanding how these components interact forms the foundation for effective use of the framework.

### The Publisher-Subscriber Pattern

At its core, Combine implements a publish-subscribe pattern where publishers emit values over time and subscribers receive and process those values.

```swift
import Combine

// A simple example demonstrating the flow
let publisher = [1, 2, 3, 4, 5].publisher

let subscription = publisher.sink { completion in
    switch completion {
    case .finished:
        print("Completed successfully")
    case .failure(let error):
        print("Failed with error: \(error)")
    }
} receiveValue: { value in
    print("Received: \(value)")
}

// Output:
// Received: 1
// Received: 2
// Received: 3
// Received: 4
// Received: 5
// Completed successfully
```

### The Subscription Lifecycle

Understanding the subscription lifecycle is essential for proper resource management:

1. **Subscription Creation**: When a subscriber subscribes to a publisher, a `Subscription` object is created
2. **Demand Request**: The subscriber requests values through the subscription using `Subscribers.Demand`
3. **Value Emission**: The publisher sends values to the subscriber
4. **Completion**: The publisher signals completion (either success or failure)
5. **Cancellation**: Either party can cancel the subscription at any time

```swift
class CustomSubscriber: Subscriber {
    typealias Input = Int
    typealias Failure = Never

    func receive(subscription: Subscription) {
        print("Subscription received")
        subscription.request(.max(3)) // Request only 3 values
    }

    func receive(_ input: Int) -> Subscribers.Demand {
        print("Received value: \(input)")
        return .none // Don't request additional values
    }

    func receive(completion: Subscribers.Completion<Never>) {
        print("Subscription completed")
    }
}

let numbers = [1, 2, 3, 4, 5].publisher
numbers.subscribe(CustomSubscriber())

// Output:
// Subscription received
// Received value: 1
// Received value: 2
// Received value: 3
// Subscription completed
```

## Publishers

Publishers are the heart of Combine. They declare that they can emit a sequence of values over time, along with the type of values and potential errors they might produce.

### Publisher Protocol

```swift
protocol Publisher {
    associatedtype Output
    associatedtype Failure: Error

    func receive<S>(subscriber: S) where S: Subscriber,
        Self.Failure == S.Failure,
        Self.Output == S.Input
}
```

### Built-in Publishers

Combine provides many built-in publishers for common use cases.

#### Just

Emits a single value and then completes.

```swift
let just = Just("Hello, Combine!")

just.sink { value in
    print(value) // "Hello, Combine!"
}
```

#### Future

Produces a single value asynchronously at some point in the future.

```swift
func fetchUser(id: String) -> Future<User, NetworkError> {
    Future { promise in
        APIClient.shared.fetchUser(id: id) { result in
            switch result {
            case .success(let user):
                promise(.success(user))
            case .failure(let error):
                promise(.failure(error))
            }
        }
    }
}

// Usage
let cancellable = fetchUser(id: "123")
    .sink { completion in
        if case .failure(let error) = completion {
            print("Error: \(error)")
        }
    } receiveValue: { user in
        print("User: \(user.name)")
    }
```

#### Deferred

Creates a new publisher for each subscriber, allowing lazy initialization.

```swift
var counter = 0

let deferred = Deferred {
    counter += 1
    return Just(counter)
}

deferred.sink { print($0) } // Prints: 1
deferred.sink { print($0) } // Prints: 2
deferred.sink { print($0) } // Prints: 3
```

#### Empty

A publisher that completes immediately without emitting any values.

```swift
let empty = Empty<Int, Never>()

empty.sink { completion in
    print("Completed: \(completion)")
} receiveValue: { value in
    print("Value: \(value)") // Never called
}
```

#### Fail

A publisher that immediately fails with a specified error.

```swift
enum ValidationError: Error {
    case invalidInput
}

let fail = Fail<String, ValidationError>(error: .invalidInput)

fail.sink { completion in
    if case .failure(let error) = completion {
        print("Failed: \(error)") // Failed: invalidInput
    }
} receiveValue: { _ in }
```

#### Sequence Publishers

Convert Swift sequences into publishers.

```swift
// Array publisher
let arrayPublisher = [1, 2, 3, 4, 5].publisher

// Range publisher
let rangePublisher = (1...10).publisher

// Set publisher
let setPublisher = Set([1, 2, 3]).publisher
```

#### Timer Publisher

Emit values at regular intervals.

```swift
let timerPublisher = Timer.publish(every: 1.0, on: .main, in: .common)
    .autoconnect()

let cancellable = timerPublisher
    .sink { date in
        print("Timer fired at: \(date)")
    }

// Don't forget to cancel when done
// cancellable.cancel()
```

#### NotificationCenter Publisher

Subscribe to system or custom notifications.

```swift
let notificationPublisher = NotificationCenter.default
    .publisher(for: UIApplication.didBecomeActiveNotification)

let cancellable = notificationPublisher
    .sink { notification in
        print("App became active")
    }
```

#### URLSession Data Task Publisher

Fetch data from a URL.

```swift
let url = URL(string: "https://api.example.com/data")!

let cancellable = URLSession.shared.dataTaskPublisher(for: url)
    .map(\.data)
    .decode(type: ResponseModel.self, decoder: JSONDecoder())
    .receive(on: DispatchQueue.main)
    .sink { completion in
        if case .failure(let error) = completion {
            print("Error: \(error)")
        }
    } receiveValue: { response in
        print("Received: \(response)")
    }
```

### Creating Custom Publishers

You can create custom publishers by conforming to the `Publisher` protocol.

```swift
struct CountdownPublisher: Publisher {
    typealias Output = Int
    typealias Failure = Never

    let start: Int

    func receive<S>(subscriber: S) where S: Subscriber, Failure == S.Failure, Output == S.Input {
        let subscription = CountdownSubscription(subscriber: subscriber, start: start)
        subscriber.receive(subscription: subscription)
    }
}

class CountdownSubscription<S: Subscriber>: Subscription where S.Input == Int, S.Failure == Never {
    private var subscriber: S?
    private var current: Int

    init(subscriber: S, start: Int) {
        self.subscriber = subscriber
        self.current = start
    }

    func request(_ demand: Subscribers.Demand) {
        guard let subscriber = subscriber else { return }

        var remaining = demand

        while remaining > .none && current >= 0 {
            remaining -= 1
            let newDemand = subscriber.receive(current)
            remaining += newDemand
            current -= 1
        }

        if current < 0 {
            subscriber.receive(completion: .finished)
        }
    }

    func cancel() {
        subscriber = nil
    }
}

// Usage
let countdown = CountdownPublisher(start: 5)
countdown.sink { value in
    print(value)
}
// Output: 5, 4, 3, 2, 1, 0
```

## Subscribers

Subscribers receive values from publishers and process them accordingly. Combine provides built-in subscribers and protocols for creating custom ones.

### The Subscriber Protocol

```swift
protocol Subscriber: CustomCombineIdentifierConvertible {
    associatedtype Input
    associatedtype Failure: Error

    func receive(subscription: Subscription)
    func receive(_ input: Self.Input) -> Subscribers.Demand
    func receive(completion: Subscribers.Completion<Self.Failure>)
}
```

### Built-in Subscribers

#### Sink

The most commonly used subscriber. It provides closures for handling values and completion.

```swift
let publisher = [1, 2, 3].publisher

// Full sink with completion handling
let cancellable1 = publisher.sink { completion in
    switch completion {
    case .finished:
        print("Done")
    case .failure(let error):
        print("Error: \(error)")
    }
} receiveValue: { value in
    print("Value: \(value)")
}

// Simplified sink for Never-failing publishers
let cancellable2 = publisher.sink { value in
    print("Value: \(value)")
}
```

#### Assign

Assigns received values directly to a property on an object using a key path.

```swift
class ViewModel: ObservableObject {
    @Published var userName: String = ""
    @Published var userScore: Int = 0
}

let viewModel = ViewModel()

// Assign to a property
let cancellable = Just("John Doe")
    .assign(to: \.userName, on: viewModel)

print(viewModel.userName) // "John Doe"

// Using assign(to:) with @Published (no memory leak concern)
Just(100)
    .assign(to: &viewModel.$userScore)
```

### Creating Custom Subscribers

```swift
class LoggingSubscriber<Input, Failure: Error>: Subscriber {
    private let prefix: String

    init(prefix: String = "") {
        self.prefix = prefix
    }

    func receive(subscription: Subscription) {
        print("\(prefix) Subscribed")
        subscription.request(.unlimited)
    }

    func receive(_ input: Input) -> Subscribers.Demand {
        print("\(prefix) Received: \(input)")
        return .none
    }

    func receive(completion: Subscribers.Completion<Failure>) {
        switch completion {
        case .finished:
            print("\(prefix) Completed successfully")
        case .failure(let error):
            print("\(prefix) Failed with: \(error)")
        }
    }
}

// Usage
let publisher = [1, 2, 3].publisher
publisher.subscribe(LoggingSubscriber(prefix: "[DEBUG]"))
```

## Operators

Operators are methods on publishers that return new publishers. They form the building blocks for constructing complex data processing pipelines.

### Transforming Operators

#### map

Transform each element.

```swift
let numbers = [1, 2, 3, 4, 5].publisher

numbers
    .map { $0 * 2 }
    .sink { print($0) }
// Output: 2, 4, 6, 8, 10
```

#### tryMap

Transform elements with potential errors.

```swift
let strings = ["1", "2", "three", "4"].publisher

strings
    .tryMap { str -> Int in
        guard let number = Int(str) else {
            throw ConversionError.invalidNumber
        }
        return number
    }
    .sink { completion in
        if case .failure(let error) = completion {
            print("Error: \(error)")
        }
    } receiveValue: { value in
        print(value)
    }
// Output: 1, 2, Error: invalidNumber
```

#### flatMap

Transform elements into publishers and flatten the results.

```swift
struct User {
    let id: String
    let name: String
}

func fetchPosts(for user: User) -> AnyPublisher<[Post], Error> {
    // Simulated network request
    Just([Post(title: "Post by \(user.name)")])
        .setFailureType(to: Error.self)
        .eraseToAnyPublisher()
}

let users = [User(id: "1", name: "Alice"), User(id: "2", name: "Bob")].publisher

users
    .setFailureType(to: Error.self)
    .flatMap { user in
        fetchPosts(for: user)
    }
    .sink { _ in } receiveValue: { posts in
        print(posts)
    }
```

#### compactMap

Transform and filter nil values.

```swift
let strings = ["1", "2", "three", "4", "five"].publisher

strings
    .compactMap { Int($0) }
    .sink { print($0) }
// Output: 1, 2, 4
```

#### scan

Accumulate values over time.

```swift
let numbers = [1, 2, 3, 4, 5].publisher

numbers
    .scan(0) { accumulator, value in
        accumulator + value
    }
    .sink { print($0) }
// Output: 1, 3, 6, 10, 15 (running sum)
```

### Filtering Operators

#### filter

Keep only elements matching a predicate.

```swift
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].publisher

numbers
    .filter { $0 % 2 == 0 }
    .sink { print($0) }
// Output: 2, 4, 6, 8, 10
```

#### removeDuplicates

Remove consecutive duplicate elements.

```swift
let values = [1, 1, 2, 2, 2, 3, 3, 1].publisher

values
    .removeDuplicates()
    .sink { print($0) }
// Output: 1, 2, 3, 1
```

#### first and last

Emit only the first or last element.

```swift
let numbers = [1, 2, 3, 4, 5].publisher

numbers
    .first()
    .sink { print($0) }
// Output: 1

numbers
    .last()
    .sink { print($0) }
// Output: 5

// With conditions
numbers
    .first { $0 > 3 }
    .sink { print($0) }
// Output: 4
```

#### dropFirst and prefix

Control how many elements to skip or take.

```swift
let numbers = [1, 2, 3, 4, 5].publisher

numbers
    .dropFirst(2)
    .sink { print($0) }
// Output: 3, 4, 5

numbers
    .prefix(3)
    .sink { print($0) }
// Output: 1, 2, 3
```

### Combining Operators

#### merge

Combine elements from multiple publishers of the same type.

```swift
let publisher1 = [1, 3, 5].publisher
let publisher2 = [2, 4, 6].publisher

publisher1
    .merge(with: publisher2)
    .sink { print($0) }
// Output: 1, 3, 5, 2, 4, 6 (order may vary with async publishers)
```

#### zip

Combine elements from publishers pairwise.

```swift
let names = ["Alice", "Bob", "Charlie"].publisher
let ages = [25, 30, 35].publisher

names
    .zip(ages)
    .sink { name, age in
        print("\(name) is \(age) years old")
    }
// Output:
// Alice is 25 years old
// Bob is 30 years old
// Charlie is 35 years old
```

#### combineLatest

Emit whenever any publisher emits, combining with latest values from others.

```swift
let username = PassthroughSubject<String, Never>()
let password = PassthroughSubject<String, Never>()

username
    .combineLatest(password)
    .map { user, pass in
        !user.isEmpty && pass.count >= 8
    }
    .sink { isValid in
        print("Form valid: \(isValid)")
    }

username.send("john")      // Form valid: false (no password yet)
password.send("12345678")  // Form valid: true
password.send("short")     // Form valid: false
```

### Timing Operators

#### debounce

Wait for a pause in emissions before publishing.

```swift
let searchText = PassthroughSubject<String, Never>()

searchText
    .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
    .sink { text in
        print("Search for: \(text)")
    }

// Rapid typing simulation
searchText.send("S")
searchText.send("Sw")
searchText.send("Swi")
searchText.send("Swif")
searchText.send("Swift")
// After 300ms pause: "Search for: Swift"
```

#### throttle

Emit at most one value per time interval.

```swift
let buttonTaps = PassthroughSubject<Void, Never>()

buttonTaps
    .throttle(for: .seconds(1), scheduler: RunLoop.main, latest: true)
    .sink { _ in
        print("Button action executed")
    }

// Even if tapped rapidly, executes at most once per second
```

#### delay

Delay emission of all elements.

```swift
let publisher = [1, 2, 3].publisher

publisher
    .delay(for: .seconds(2), scheduler: RunLoop.main)
    .sink { value in
        print("Received \(value) after 2 second delay")
    }
```

#### timeout

Complete with an error if no values arrive within a time limit.

```swift
let slowPublisher = PassthroughSubject<Int, Error>()

slowPublisher
    .timeout(.seconds(5), scheduler: RunLoop.main, customError: { TimeoutError() })
    .sink { completion in
        if case .failure = completion {
            print("Timed out!")
        }
    } receiveValue: { value in
        print("Received: \(value)")
    }
```

### Reducing Operators

#### reduce

Accumulate all values into a single result.

```swift
let numbers = [1, 2, 3, 4, 5].publisher

numbers
    .reduce(0, +)
    .sink { print($0) }
// Output: 15
```

#### collect

Collect all values into an array.

```swift
let numbers = [1, 2, 3, 4, 5].publisher

numbers
    .collect()
    .sink { print($0) }
// Output: [1, 2, 3, 4, 5]

// Collect in groups
numbers
    .collect(2)
    .sink { print($0) }
// Output: [1, 2], [3, 4], [5]
```

## Subjects

Subjects are special publishers that allow you to inject values imperatively. They act as both publisher and subscriber, making them useful for bridging imperative and reactive code.

### PassthroughSubject

Broadcasts values to subscribers without storing any state.

```swift
let subject = PassthroughSubject<String, Never>()

// First subscriber
let subscription1 = subject.sink { value in
    print("Subscriber 1: \(value)")
}

subject.send("Hello")   // Subscriber 1: Hello

// Second subscriber joins
let subscription2 = subject.sink { value in
    print("Subscriber 2: \(value)")
}

subject.send("World")
// Subscriber 1: World
// Subscriber 2: World

subject.send(completion: .finished)
```

### CurrentValueSubject

Stores and broadcasts the current value to new subscribers.

```swift
let subject = CurrentValueSubject<Int, Never>(0)

print("Initial value: \(subject.value)") // 0

let subscription1 = subject.sink { value in
    print("Subscriber 1: \(value)")
}
// Immediately prints: Subscriber 1: 0

subject.send(1)  // Subscriber 1: 1
subject.send(2)  // Subscriber 1: 2

print("Current value: \(subject.value)") // 2

// New subscriber receives current value immediately
let subscription2 = subject.sink { value in
    print("Subscriber 2: \(value)")
}
// Immediately prints: Subscriber 2: 2

subject.value = 3  // Alternative way to send
// Subscriber 1: 3
// Subscriber 2: 3
```

### Using Subjects in Practice

```swift
class SearchViewModel {
    // Input
    let searchText = PassthroughSubject<String, Never>()

    // Output
    @Published private(set) var results: [SearchResult] = []
    @Published private(set) var isLoading = false

    private var cancellables = Set<AnyCancellable>()

    init() {
        searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .removeDuplicates()
            .filter { !$0.isEmpty }
            .handleEvents(receiveOutput: { [weak self] _ in
                self?.isLoading = true
            })
            .flatMap { query in
                SearchService.search(query: query)
                    .catch { _ in Just([]) }
            }
            .receive(on: DispatchQueue.main)
            .sink { [weak self] results in
                self?.isLoading = false
                self?.results = results
            }
            .store(in: &cancellables)
    }
}
```

## Error Handling

Combine provides robust error handling mechanisms that ensure type safety while allowing flexible error recovery strategies.

### Error Types in Combine

Every publisher declares its `Failure` type. Publishers with `Never` as their failure type are guaranteed to never fail.

```swift
// A publisher that can fail with URLError
let urlPublisher: AnyPublisher<Data, URLError> = URLSession.shared
    .dataTaskPublisher(for: URL(string: "https://example.com")!)
    .map(\.data)
    .eraseToAnyPublisher()

// A publisher that never fails
let neverFailsPublisher: AnyPublisher<Int, Never> = Just(42)
    .eraseToAnyPublisher()
```

### catch

Replace errors with a fallback publisher.

```swift
let networkRequest = URLSession.shared
    .dataTaskPublisher(for: url)
    .map(\.data)
    .decode(type: User.self, decoder: JSONDecoder())
    .catch { error -> Just<User> in
        print("Error occurred: \(error)")
        return Just(User.default)
    }
    .sink { user in
        print("User: \(user)")
    }
```

### tryCatch

Attempt recovery that might also fail.

```swift
enum NetworkError: Error {
    case noConnection
    case serverError
    case unauthorized
}

let publisher = fetchData()
    .tryCatch { error -> AnyPublisher<Data, Error> in
        guard let networkError = error as? NetworkError else {
            throw error
        }

        switch networkError {
        case .unauthorized:
            return refreshToken()
                .flatMap { _ in fetchData() }
                .eraseToAnyPublisher()
        default:
            throw error
        }
    }
```

### retry

Automatically retry failed operations.

```swift
let publisher = URLSession.shared
    .dataTaskPublisher(for: url)
    .retry(3) // Retry up to 3 times on failure
    .map(\.data)
    .sink { completion in
        if case .failure(let error) = completion {
            print("Failed after retries: \(error)")
        }
    } receiveValue: { data in
        print("Success!")
    }
```

### replaceError

Replace any error with a default value.

```swift
let publisher = riskyOperation()
    .replaceError(with: defaultValue)
    .sink { value in
        print(value) // Always receives a value, never fails
    }
```

### mapError

Transform error types.

```swift
enum AppError: Error {
    case network(URLError)
    case parsing(DecodingError)
    case unknown(Error)
}

let publisher = URLSession.shared
    .dataTaskPublisher(for: url)
    .mapError { AppError.network($0) }
    .map(\.data)
    .decode(type: Response.self, decoder: JSONDecoder())
    .mapError { error -> AppError in
        if let decodingError = error as? DecodingError {
            return .parsing(decodingError)
        }
        return .unknown(error)
    }
```

### setFailureType

Change the failure type for publishers that cannot fail.

```swift
let neverFails = Just(42)
    .setFailureType(to: Error.self)
// Now compatible with other Error-typed publishers
```

### Comprehensive Error Handling Example

```swift
struct APIClient {
    enum APIError: Error {
        case invalidURL
        case networkError(Error)
        case decodingError(Error)
        case serverError(statusCode: Int)
    }

    func fetch<T: Decodable>(_ endpoint: String) -> AnyPublisher<T, APIError> {
        guard let url = URL(string: "https://api.example.com/\(endpoint)") else {
            return Fail(error: .invalidURL)
                .eraseToAnyPublisher()
        }

        return URLSession.shared
            .dataTaskPublisher(for: url)
            .mapError { APIError.networkError($0) }
            .flatMap { data, response -> AnyPublisher<Data, APIError> in
                guard let httpResponse = response as? HTTPURLResponse else {
                    return Fail(error: .serverError(statusCode: 0))
                        .eraseToAnyPublisher()
                }

                guard (200...299).contains(httpResponse.statusCode) else {
                    return Fail(error: .serverError(statusCode: httpResponse.statusCode))
                        .eraseToAnyPublisher()
                }

                return Just(data)
                    .setFailureType(to: APIError.self)
                    .eraseToAnyPublisher()
            }
            .decode(type: T.self, decoder: JSONDecoder())
            .mapError { error -> APIError in
                if let apiError = error as? APIError {
                    return apiError
                }
                return .decodingError(error)
            }
            .eraseToAnyPublisher()
    }
}
```

## Combining Publishers

Combine provides powerful operators for working with multiple publishers simultaneously.

### Publishers.Merge

Interleave emissions from multiple publishers.

```swift
let timer1 = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
let timer2 = Timer.publish(every: 1.5, on: .main, in: .common).autoconnect()

Publishers.Merge(timer1, timer2)
    .sink { date in
        print("Timer fired: \(date)")
    }

// For more than 2 publishers
Publishers.Merge3(pub1, pub2, pub3)
Publishers.Merge4(pub1, pub2, pub3, pub4)
// ... up to Merge8, or use MergeMany for collections
```

### Publishers.Zip

Wait for all publishers to emit before combining.

```swift
let firstName = Just("John")
let lastName = Just("Doe")
let age = Just(30)

Publishers.Zip3(firstName, lastName, age)
    .map { first, last, age in
        "\(first) \(last), age \(age)"
    }
    .sink { print($0) }
// Output: John Doe, age 30
```

### Publishers.CombineLatest

Emit when any publisher emits, using latest values from all.

```swift
let slider1 = PassthroughSubject<Float, Never>()
let slider2 = PassthroughSubject<Float, Never>()
let slider3 = PassthroughSubject<Float, Never>()

Publishers.CombineLatest3(slider1, slider2, slider3)
    .map { r, g, b in
        UIColor(red: CGFloat(r), green: CGFloat(g), blue: CGFloat(b), alpha: 1.0)
    }
    .sink { color in
        print("Color updated: \(color)")
    }

slider1.send(0.5)
slider2.send(0.7)
slider3.send(0.3)  // Color updated only after all three have values
```

### switchToLatest

Switch to the most recent inner publisher, canceling previous ones.

```swift
let searchText = PassthroughSubject<String, Never>()

searchText
    .map { query -> AnyPublisher<[SearchResult], Never> in
        performSearch(query: query)
            .catch { _ in Just([]) }
            .eraseToAnyPublisher()
    }
    .switchToLatest() // Cancel previous search when new query arrives
    .sink { results in
        print("Results: \(results)")
    }
```

### prepend and append

Add elements before or after a publisher's output.

```swift
let numbers = [3, 4, 5].publisher

numbers
    .prepend(1, 2)
    .append(6, 7)
    .sink { print($0) }
// Output: 1, 2, 3, 4, 5, 6, 7

// Prepend another publisher
let prefix = [0].publisher
let main = [1, 2, 3].publisher

main
    .prepend(prefix)
    .sink { print($0) }
// Output: 0, 1, 2, 3
```

## Scheduling and Threading

Combine uses schedulers to control when and where code executes.

### Scheduler Protocol

Schedulers define the context for executing work. Common schedulers include:

- `DispatchQueue`: For GCD-based scheduling
- `RunLoop`: For run loop-based scheduling
- `ImmediateScheduler`: Execute synchronously, immediately
- `OperationQueue`: For operation queue-based scheduling

### receive(on:)

Specify where downstream operators and subscribers receive values.

```swift
URLSession.shared
    .dataTaskPublisher(for: url)
    .map(\.data)
    .decode(type: Model.self, decoder: JSONDecoder())
    .receive(on: DispatchQueue.main) // Switch to main queue for UI updates
    .sink { completion in
        // Executes on main queue
    } receiveValue: { model in
        // Executes on main queue
        self.updateUI(with: model)
    }
```

### subscribe(on:)

Specify where the subscription and initial work happens.

```swift
heavyComputationPublisher()
    .subscribe(on: DispatchQueue.global(qos: .background))
    .receive(on: DispatchQueue.main)
    .sink { result in
        self.displayResult(result)
    }
```

### Scheduling Options

```swift
let scheduler = DispatchQueue.main

// Immediate execution on scheduler
publisher
    .receive(on: scheduler)
    .sink { value in }

// Delayed execution
publisher
    .delay(for: .seconds(2), scheduler: scheduler)
    .sink { value in }

// With specific options
publisher
    .receive(on: scheduler, options: .init(qos: .userInteractive))
    .sink { value in }
```

### Custom Scheduling Patterns

```swift
class DataManager {
    private let processingQueue = DispatchQueue(label: "com.app.processing", qos: .userInitiated)
    private var cancellables = Set<AnyCancellable>()

    func processData(_ data: Data) -> AnyPublisher<ProcessedData, Error> {
        Just(data)
            .subscribe(on: processingQueue) // Heavy processing on background
            .tryMap { data in
                try self.parseData(data)
            }
            .tryMap { parsed in
                try self.transformData(parsed)
            }
            .receive(on: DispatchQueue.main) // Results on main
            .eraseToAnyPublisher()
    }
}
```

## Memory Management

Proper memory management is crucial when working with Combine to avoid memory leaks and retain cycles.

### AnyCancellable and the Cancellables Set

Subscriptions return `AnyCancellable` objects that must be retained for the subscription to remain active.

```swift
class ViewModel {
    private var cancellables = Set<AnyCancellable>()

    func setupBindings() {
        publisher
            .sink { value in
                print(value)
            }
            .store(in: &cancellables)
    }

    deinit {
        // Cancellables are automatically canceled when the set is deallocated
        print("ViewModel deallocated, subscriptions canceled")
    }
}
```

### Avoiding Retain Cycles

Use `[weak self]` or `[unowned self]` to prevent retain cycles in closures.

```swift
class ViewController: UIViewController {
    private var cancellables = Set<AnyCancellable>()

    override func viewDidLoad() {
        super.viewDidLoad()

        // Correct: Using weak self
        publisher
            .sink { [weak self] value in
                self?.handleValue(value)
            }
            .store(in: &cancellables)

        // Also correct for methods that don't capture self strongly
        publisher
            .sink { [weak self] value in
                guard let self = self else { return }
                self.handleValue(value)
            }
            .store(in: &cancellables)
    }
}
```

### The assign(to:) Operator

When using `assign(to:on:)`, be careful of retain cycles:

```swift
class BadViewModel: ObservableObject {
    @Published var value: Int = 0
    private var cancellables = Set<AnyCancellable>()

    init() {
        // WARNING: This creates a retain cycle!
        // publisher -> subscription -> self -> cancellables -> subscription
        somePublisher
            .assign(to: \.value, on: self) // Retains self
            .store(in: &cancellables)
    }
}

class GoodViewModel: ObservableObject {
    @Published var value: Int = 0

    init() {
        // SAFE: assign(to:) with @Published doesn't create a retain cycle
        somePublisher
            .assign(to: &$value)
    }
}
```

### Manual Cancellation

```swift
class SearchController {
    private var searchCancellable: AnyCancellable?

    func search(query: String) {
        // Cancel any existing search
        searchCancellable?.cancel()

        // Start new search
        searchCancellable = searchService.search(query: query)
            .sink { [weak self] results in
                self?.displayResults(results)
            }
    }

    func cancelSearch() {
        searchCancellable?.cancel()
        searchCancellable = nil
    }
}
```

### Subscription Lifecycle Management

```swift
class DataService {
    private var cancellables = Set<AnyCancellable>()

    func startMonitoring() {
        // Long-running subscription
        NotificationCenter.default
            .publisher(for: .dataDidChange)
            .sink { [weak self] _ in
                self?.refreshData()
            }
            .store(in: &cancellables)
    }

    func stopMonitoring() {
        // Cancel all subscriptions
        cancellables.removeAll()
    }

    func pauseAndResume() {
        // Store cancellables temporarily
        let stored = cancellables
        cancellables.removeAll()

        // Resume later
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in
            self?.cancellables = stored
        }
    }
}
```

## Integration with SwiftUI

Combine integrates seamlessly with SwiftUI through property wrappers and the ObservableObject protocol.

### ObservableObject and @Published

```swift
class UserProfileViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let userService: UserService
    private var cancellables = Set<AnyCancellable>()

    init(userService: UserService = .shared) {
        self.userService = userService
    }

    func loadUser(id: String) {
        isLoading = true
        errorMessage = nil

        userService.fetchUser(id: id)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            } receiveValue: { [weak self] user in
                self?.user = user
            }
            .store(in: &cancellables)
    }
}

struct UserProfileView: View {
    @StateObject private var viewModel = UserProfileViewModel()
    let userId: String

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
            } else if let user = viewModel.user {
                UserDetailView(user: user)
            } else if let error = viewModel.errorMessage {
                ErrorView(message: error)
            }
        }
        .onAppear {
            viewModel.loadUser(id: userId)
        }
    }
}
```

### Binding Publishers to UI

```swift
class FormViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var isFormValid = false

    private var cancellables = Set<AnyCancellable>()

    init() {
        Publishers.CombineLatest($email, $password)
            .map { email, password in
                email.contains("@") && password.count >= 8
            }
            .assign(to: &$isFormValid)
    }
}

struct LoginForm: View {
    @StateObject private var viewModel = FormViewModel()

    var body: some View {
        Form {
            TextField("Email", text: $viewModel.email)
            SecureField("Password", text: $viewModel.password)
            Button("Login") {
                // Handle login
            }
            .disabled(!viewModel.isFormValid)
        }
    }
}
```

### onReceive Modifier

```swift
struct TimerView: View {
    @State private var currentTime = Date()

    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        Text(currentTime, style: .time)
            .onReceive(timer) { time in
                currentTime = time
            }
    }
}
```

## Practical Examples

### Network Layer with Combine

```swift
protocol NetworkServiceProtocol {
    func request<T: Decodable>(_ endpoint: Endpoint) -> AnyPublisher<T, NetworkError>
}

enum NetworkError: Error {
    case invalidURL
    case requestFailed(Error)
    case invalidResponse
    case decodingFailed(Error)
    case serverError(statusCode: Int, data: Data?)
}

struct Endpoint {
    let path: String
    let method: HTTPMethod
    let headers: [String: String]
    let body: Data?

    enum HTTPMethod: String {
        case get = "GET"
        case post = "POST"
        case put = "PUT"
        case delete = "DELETE"
    }
}

class NetworkService: NetworkServiceProtocol {
    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder

    init(baseURL: URL, session: URLSession = .shared, decoder: JSONDecoder = JSONDecoder()) {
        self.baseURL = baseURL
        self.session = session
        self.decoder = decoder
    }

    func request<T: Decodable>(_ endpoint: Endpoint) -> AnyPublisher<T, NetworkError> {
        guard let url = URL(string: endpoint.path, relativeTo: baseURL) else {
            return Fail(error: .invalidURL).eraseToAnyPublisher()
        }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.httpBody = endpoint.body
        endpoint.headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }

        return session.dataTaskPublisher(for: request)
            .mapError { NetworkError.requestFailed($0) }
            .flatMap { data, response -> AnyPublisher<Data, NetworkError> in
                guard let httpResponse = response as? HTTPURLResponse else {
                    return Fail(error: .invalidResponse).eraseToAnyPublisher()
                }

                guard (200...299).contains(httpResponse.statusCode) else {
                    return Fail(error: .serverError(statusCode: httpResponse.statusCode, data: data))
                        .eraseToAnyPublisher()
                }

                return Just(data)
                    .setFailureType(to: NetworkError.self)
                    .eraseToAnyPublisher()
            }
            .decode(type: T.self, decoder: decoder)
            .mapError { error -> NetworkError in
                if let networkError = error as? NetworkError {
                    return networkError
                }
                return .decodingFailed(error)
            }
            .eraseToAnyPublisher()
    }
}
```

### Real-time Search Implementation

```swift
class SearchViewModel: ObservableObject {
    @Published var searchQuery = ""
    @Published var results: [SearchResult] = []
    @Published var isSearching = false
    @Published var error: Error?

    private let searchService: SearchService
    private var cancellables = Set<AnyCancellable>()

    init(searchService: SearchService = .shared) {
        self.searchService = searchService
        setupSearch()
    }

    private func setupSearch() {
        $searchQuery
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .removeDuplicates()
            .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
            .handleEvents(receiveOutput: { [weak self] _ in
                self?.isSearching = true
                self?.error = nil
            })
            .map { [searchService] query in
                searchService.search(query: query)
                    .catch { error -> Just<[SearchResult]> in
                        DispatchQueue.main.async { [weak self] in
                            self?.error = error
                        }
                        return Just([])
                    }
            }
            .switchToLatest()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] results in
                self?.isSearching = false
                self?.results = results
            }
            .store(in: &cancellables)

        // Clear results when query is empty
        $searchQuery
            .filter { $0.trimmingCharacters(in: .whitespaces).isEmpty }
            .sink { [weak self] _ in
                self?.results = []
                self?.isSearching = false
            }
            .store(in: &cancellables)
    }
}
```

### Form Validation

```swift
class RegistrationViewModel: ObservableObject {
    // Inputs
    @Published var username = ""
    @Published var email = ""
    @Published var password = ""
    @Published var confirmPassword = ""

    // Outputs
    @Published var usernameError: String?
    @Published var emailError: String?
    @Published var passwordError: String?
    @Published var confirmPasswordError: String?
    @Published var isFormValid = false

    private var cancellables = Set<AnyCancellable>()

    init() {
        setupValidation()
    }

    private func setupValidation() {
        // Username validation
        let usernameValid = $username
            .debounce(for: .milliseconds(200), scheduler: RunLoop.main)
            .map { username -> String? in
                if username.isEmpty {
                    return "Username is required"
                }
                if username.count < 3 {
                    return "Username must be at least 3 characters"
                }
                if !username.allSatisfy({ $0.isLetter || $0.isNumber }) {
                    return "Username can only contain letters and numbers"
                }
                return nil
            }
            .share()

        usernameValid
            .assign(to: &$usernameError)

        // Email validation
        let emailValid = $email
            .debounce(for: .milliseconds(200), scheduler: RunLoop.main)
            .map { email -> String? in
                if email.isEmpty {
                    return "Email is required"
                }
                let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
                let predicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
                if !predicate.evaluate(with: email) {
                    return "Invalid email format"
                }
                return nil
            }
            .share()

        emailValid
            .assign(to: &$emailError)

        // Password validation
        let passwordValid = $password
            .debounce(for: .milliseconds(200), scheduler: RunLoop.main)
            .map { password -> String? in
                if password.isEmpty {
                    return "Password is required"
                }
                if password.count < 8 {
                    return "Password must be at least 8 characters"
                }
                return nil
            }
            .share()

        passwordValid
            .assign(to: &$passwordError)

        // Confirm password validation
        let confirmValid = Publishers.CombineLatest($password, $confirmPassword)
            .debounce(for: .milliseconds(200), scheduler: RunLoop.main)
            .map { password, confirm -> String? in
                if confirm.isEmpty {
                    return "Please confirm your password"
                }
                if password != confirm {
                    return "Passwords do not match"
                }
                return nil
            }
            .share()

        confirmValid
            .assign(to: &$confirmPasswordError)

        // Overall form validity
        Publishers.CombineLatest4(usernameValid, emailValid, passwordValid, confirmValid)
            .map { usernameErr, emailErr, passErr, confirmErr in
                usernameErr == nil && emailErr == nil && passErr == nil && confirmErr == nil
            }
            .assign(to: &$isFormValid)
    }
}
```

### Pagination with Combine

```swift
class PaginatedListViewModel<Item: Decodable & Identifiable>: ObservableObject {
    @Published var items: [Item] = []
    @Published var isLoading = false
    @Published var hasMorePages = true
    @Published var error: Error?

    private var currentPage = 0
    private let pageSize = 20
    private let fetchPage: (Int, Int) -> AnyPublisher<[Item], Error>
    private var cancellables = Set<AnyCancellable>()

    init(fetchPage: @escaping (Int, Int) -> AnyPublisher<[Item], Error>) {
        self.fetchPage = fetchPage
    }

    func loadFirstPage() {
        currentPage = 0
        items = []
        hasMorePages = true
        loadNextPage()
    }

    func loadNextPage() {
        guard !isLoading && hasMorePages else { return }

        isLoading = true
        error = nil

        fetchPage(currentPage, pageSize)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let err) = completion {
                    self?.error = err
                }
            } receiveValue: { [weak self] newItems in
                guard let self = self else { return }
                self.items.append(contentsOf: newItems)
                self.hasMorePages = newItems.count == self.pageSize
                self.currentPage += 1
            }
            .store(in: &cancellables)
    }

    func loadMoreIfNeeded(currentItem: Item) {
        guard let index = items.firstIndex(where: { $0.id == currentItem.id }) else { return }

        let thresholdIndex = items.index(items.endIndex, offsetBy: -5)
        if index >= thresholdIndex {
            loadNextPage()
        }
    }
}
```

### WebSocket with Combine

```swift
class WebSocketManager: ObservableObject {
    @Published var messages: [Message] = []
    @Published var connectionState: ConnectionState = .disconnected

    enum ConnectionState {
        case disconnected
        case connecting
        case connected
        case failed(Error)
    }

    private var webSocketTask: URLSessionWebSocketTask?
    private let messageSubject = PassthroughSubject<Message, Never>()
    private var cancellables = Set<AnyCancellable>()

    var messagePublisher: AnyPublisher<Message, Never> {
        messageSubject.eraseToAnyPublisher()
    }

    init() {
        messageSubject
            .receive(on: DispatchQueue.main)
            .sink { [weak self] message in
                self?.messages.append(message)
            }
            .store(in: &cancellables)
    }

    func connect(to url: URL) {
        connectionState = .connecting

        webSocketTask = URLSession.shared.webSocketTask(with: url)
        webSocketTask?.resume()

        connectionState = .connected
        receiveMessage()
    }

    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        connectionState = .disconnected
    }

    func send(_ message: Message) {
        guard let data = try? JSONEncoder().encode(message) else { return }

        let urlMessage = URLSessionWebSocketTask.Message.data(data)
        webSocketTask?.send(urlMessage) { [weak self] error in
            if let error = error {
                DispatchQueue.main.async {
                    self?.connectionState = .failed(error)
                }
            }
        }
    }

    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .data(let data):
                    if let decoded = try? JSONDecoder().decode(Message.self, from: data) {
                        self?.messageSubject.send(decoded)
                    }
                case .string(let text):
                    if let data = text.data(using: .utf8),
                       let decoded = try? JSONDecoder().decode(Message.self, from: data) {
                        self?.messageSubject.send(decoded)
                    }
                @unknown default:
                    break
                }
                self?.receiveMessage() // Continue listening

            case .failure(let error):
                DispatchQueue.main.async {
                    self?.connectionState = .failed(error)
                }
            }
        }
    }
}
```

## Best Practices

### Use Type Erasure Appropriately

Hide implementation details with `eraseToAnyPublisher()` at API boundaries.

```swift
// Good: Public API returns type-erased publisher
public func fetchUsers() -> AnyPublisher<[User], APIError> {
    URLSession.shared
        .dataTaskPublisher(for: usersURL)
        .map(\.data)
        .decode(type: [User].self, decoder: JSONDecoder())
        .mapError { _ in APIError.fetchFailed }
        .eraseToAnyPublisher()
}

// Bad: Exposing implementation details
public func fetchUsers() -> Publishers.MapError<Publishers.Decode<Publishers.Map<URLSession.DataTaskPublisher, Data>, [User], JSONDecoder>, APIError> {
    // Complex type exposed
}
```

### Handle Backpressure

Be mindful of demand and backpressure in high-throughput scenarios.

```swift
// Use buffer to handle bursts
publisher
    .buffer(size: 100, prefetch: .byRequest, whenFull: .dropOldest)
    .sink { value in
        // Process value
    }
```

### Prefer Composition Over Complexity

Break complex pipelines into smaller, testable components.

```swift
// Good: Composable operators
extension Publisher where Output == Data, Failure == URLError {
    func decode<T: Decodable>(as type: T.Type) -> AnyPublisher<T, Error> {
        self
            .mapError { $0 as Error }
            .decode(type: type, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
}

extension Publisher {
    func logEvents(prefix: String = "") -> Publishers.HandleEvents<Self> {
        handleEvents(
            receiveSubscription: { _ in print("\(prefix) Subscribed") },
            receiveOutput: { print("\(prefix) Output: \($0)") },
            receiveCompletion: { print("\(prefix) Completion: \($0)") },
            receiveCancel: { print("\(prefix) Cancelled") }
        )
    }
}
```

### Test Your Publishers

Create testable publisher pipelines.

```swift
class SearchViewModelTests: XCTestCase {
    var viewModel: SearchViewModel!
    var mockService: MockSearchService!
    var cancellables: Set<AnyCancellable>!

    override func setUp() {
        super.setUp()
        mockService = MockSearchService()
        viewModel = SearchViewModel(searchService: mockService)
        cancellables = Set<AnyCancellable>()
    }

    func testSearchReturnsResults() {
        let expectation = XCTestExpectation(description: "Search returns results")
        let expectedResults = [SearchResult(id: "1", title: "Test")]
        mockService.searchResults = expectedResults

        viewModel.$results
            .dropFirst() // Skip initial empty value
            .sink { results in
                XCTAssertEqual(results.count, 1)
                XCTAssertEqual(results.first?.title, "Test")
                expectation.fulfill()
            }
            .store(in: &cancellables)

        viewModel.searchQuery = "test"

        wait(for: [expectation], timeout: 1.0)
    }
}
```

### Use share() for Expensive Operations

Avoid redundant work when multiple subscribers exist.

```swift
let sharedPublisher = expensiveNetworkRequest()
    .share()

// Both subscribers share the same request
sharedPublisher.sink { value in }
sharedPublisher.sink { value in }
```

### Consider Using async/await for New Code

For iOS 15+ targets, consider using Swift concurrency with Combine bridges.

```swift
// Bridge Combine to async/await
extension Publisher {
    func firstValue() async throws -> Output {
        try await withCheckedThrowingContinuation { continuation in
            var cancellable: AnyCancellable?
            cancellable = first()
                .sink { completion in
                    switch completion {
                    case .failure(let error):
                        continuation.resume(throwing: error)
                    case .finished:
                        break
                    }
                    cancellable?.cancel()
                } receiveValue: { value in
                    continuation.resume(returning: value)
                }
        }
    }
}

// Usage
let user = try await userPublisher.firstValue()
```

### Document Complex Pipelines

Add comments explaining the purpose of complex operator chains.

```swift
$searchText
    // Wait for user to stop typing
    .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
    // Don't search for the same query twice
    .removeDuplicates()
    // Don't search for empty or whitespace-only queries
    .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
    // Cancel previous search when new query arrives
    .map { query in searchService.search(query: query) }
    .switchToLatest()
    // Update UI on main thread
    .receive(on: DispatchQueue.main)
    .sink { [weak self] results in
        self?.results = results
    }
    .store(in: &cancellables)
```

Combine provides a powerful, type-safe approach to handling asynchronous events in Swift applications. By understanding its core concepts and following best practices, you can build reactive, maintainable applications that handle complex data flows with elegance and reliability.
