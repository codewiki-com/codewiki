---
title: 自动引用计数(ARC)
description: Swift ARC完全指南，内存管理、循环引用与weak/unowned
track: swift
section: basics
difficulty: intermediate
tags:
  - Swift
  - ARC
  - 内存管理
  - 引用循环
status: imported
origin: old/src/content/docs/swift/arc.en.md
divergence: 0.191
issues:
  - title-lang-en
  - title-language
legacy:
  category: Swift
  subcategory: 内存管理
  order: 5
  lastUpdated: 2026-01-07
---

Automatic Reference Counting (ARC) is the mechanism Swift uses to manage your application's memory. ARC automatically tracks and manages the memory usage of class instances, ensuring that memory occupied by instances is freed when they are no longer needed.

## How ARC Works

Every time you create a new instance of a class, ARC allocates a chunk of memory to store information about that instance. When an instance is no longer needed, ARC frees the memory occupied by that instance so it can be reused.

ARC works by tracking how many properties, constants, and variables are referencing each class instance. As long as at least one active reference exists, ARC will not deallocate that instance.

```swift
class Person {
    let name: String

    init(name: String) {
        self.name = name
        print("\(name) is being initialized")
    }

    deinit {
        print("\(name) is being deinitialized")
    }
}

// Create an instance
var person1: Person? = Person(name: "John")
// Output: John is being initialized

// Reference count is now 1
var person2 = person1  // Reference count becomes 2
var person3 = person1  // Reference count becomes 3

person1 = nil  // Reference count becomes 2
person2 = nil  // Reference count becomes 1
person3 = nil  // Reference count becomes 0
// Output: John is being deinitialized
```

### ARC Only Applies to Classes

It's important to note that ARC only applies to instances of classes. Structures (struct) and enumerations (enum) are value types and don't need reference counting because they are copied rather than shared when assigned.

```swift
struct Point {
    var x: Int
    var y: Int
}

var point1 = Point(x: 10, y: 20)
var point2 = point1  // Value is copied, not referenced
point1.x = 100       // Doesn't affect point2
print(point2.x)      // Output: 10
```

## Strong Reference

By default, all references in Swift are strong references. When you assign a class instance to a property, constant, or variable, that reference is a strong reference. Strong references prevent ARC from deallocating the referenced instance.

```swift
class Department {
    let name: String
    var employees: [Employee] = []

    init(name: String) {
        self.name = name
    }

    func addEmployee(_ employee: Employee) {
        employees.append(employee)
    }

    deinit {
        print("Department \(name) is being deinitialized")
    }
}

class Employee {
    let name: String
    var department: Department?  // Strong reference

    init(name: String) {
        self.name = name
    }

    deinit {
        print("Employee \(name) is being deinitialized")
    }
}

var dept: Department? = Department(name: "Engineering")
var emp: Employee? = Employee(name: "Alice")

emp?.department = dept  // emp strongly references dept

dept = nil  // Department instance won't be deallocated because emp still holds a strong reference to it
emp = nil   // Now both instances will be deallocated
```

## Strong Reference Cycle (Retain Cycle)

When two class instances hold strong references to each other, a strong reference cycle is created. This leads to memory leaks because the reference count of both instances can never drop to zero.

```swift
class Teacher {
    let name: String
    var student: Student?  // Strong reference

    init(name: String) {
        self.name = name
        print("Teacher \(name) is being initialized")
    }

    deinit {
        print("Teacher \(name) is being deinitialized")
    }
}

class Student {
    let name: String
    var teacher: Teacher?  // Strong reference - this causes a reference cycle!

    init(name: String) {
        self.name = name
        print("Student \(name) is being initialized")
    }

    deinit {
        print("Student \(name) is being deinitialized")
    }
}

var teacher: Teacher? = Teacher(name: "Mr. Wang")
var student: Student? = Student(name: "Mike")

teacher?.student = student
student?.teacher = teacher

// Even setting both variables to nil won't deallocate the instances
teacher = nil
student = nil
// No deinit output - memory leak!
```

### Visualizing a Reference Cycle

```
┌─────────────────┐         ┌─────────────────┐
│    Teacher      │         │    Student      │
│   (Mr. Wang)    │         │    (Mike)       │
├─────────────────┤         ├─────────────────┤
│ student ────────┼────────▶│                 │
│                 │◀────────┼──── teacher     │
└─────────────────┘         └─────────────────┘
     Ref count: 1                Ref count: 1

After external references are set to nil:
     Ref count: 1 (from Student)  Ref count: 1 (from Teacher)
     Cannot deallocate!            Cannot deallocate!
```

## Weak Reference

A weak reference doesn't prevent ARC from deallocating the referenced instance. When the referenced instance is deallocated, the weak reference automatically becomes `nil`. Therefore, weak references must be declared as optional type variables.

### Characteristics of weak

- Must be declared as an Optional type
- Must be declared as a variable (var), not a constant (let)
- When the referenced instance is deallocated, ARC automatically sets the weak reference to `nil`
- Thread-safe: the nil-setting operation for weak references is atomic

### Use Cases

Weak references are suitable when the referenced instance might have a shorter lifetime than the current instance.

```swift
class Apartment {
    let unit: String
    weak var tenant: Tenant?  // Weak reference

    init(unit: String) {
        self.unit = unit
        print("Apartment \(unit) is being initialized")
    }

    deinit {
        print("Apartment \(unit) is being deinitialized")
    }
}

class Tenant {
    let name: String
    var apartment: Apartment?  // Strong reference

    init(name: String) {
        self.name = name
        print("Tenant \(name) is being initialized")
    }

    deinit {
        print("Tenant \(name) is being deinitialized")
    }
}

var apartment: Apartment? = Apartment(unit: "101")
var tenant: Tenant? = Tenant(name: "Bob")

apartment?.tenant = tenant
tenant?.apartment = apartment

tenant = nil
// Output: Tenant Bob is being deinitialized
// apartment?.tenant now automatically becomes nil

apartment = nil
// Output: Apartment 101 is being deinitialized
```

### Practical Application: Delegation Pattern

Weak references are very common in the delegation pattern:

```swift
protocol DataManagerDelegate: AnyObject {
    func dataDidUpdate(_ data: [String])
    func dataDidFailToLoad(error: Error)
}

class DataManager {
    weak var delegate: DataManagerDelegate?  // Weak reference to avoid reference cycle

    private var data: [String] = []

    func fetchData() {
        // Simulate asynchronous data fetching
        DispatchQueue.global().async { [weak self] in
            // Simulate network delay
            Thread.sleep(forTimeInterval: 1)

            DispatchQueue.main.async {
                guard let self = self else { return }
                self.data = ["Item 1", "Item 2", "Item 3"]
                self.delegate?.dataDidUpdate(self.data)
            }
        }
    }
}

class ViewController: DataManagerDelegate {
    let dataManager = DataManager()

    init() {
        dataManager.delegate = self
    }

    func dataDidUpdate(_ data: [String]) {
        print("Received data update: \(data)")
    }

    func dataDidFailToLoad(error: Error) {
        print("Failed to load: \(error)")
    }

    deinit {
        print("ViewController is being deinitialized")
    }
}

var viewController: ViewController? = ViewController()
viewController?.dataManager.fetchData()
viewController = nil
// Output: ViewController is being deinitialized
```

### Delegates Must Use AnyObject

Note that delegate protocols need to inherit from `AnyObject` (or use the `class` keyword) to be declared as `weak`:

```swift
// Correct: can use weak
protocol MyDelegate: AnyObject {
    func didComplete()
}

// Or use the class keyword (older syntax, but still valid)
protocol MyOtherDelegate: class {
    func didComplete()
}

class Handler {
    weak var delegate: MyDelegate?  // Can use weak
}
```

## Unowned Reference

An unowned reference, like a weak reference, doesn't hold a strong reference to the instance it refers to. However, an unowned reference assumes that the referenced instance will never be `nil`. If you try to access an unowned reference after the instance has been deallocated, your program will crash.

### Characteristics of unowned

- Doesn't need to be declared as an optional type
- Assumes the referenced instance is always valid
- Accessing it after the referenced instance is deallocated causes a runtime crash
- Slightly better performance than weak (no optional value management overhead)

### Use Cases

Unowned references are suitable when the referenced instance has a lifetime equal to or longer than the current instance.

```swift
class Customer {
    let name: String
    var card: CreditCard?

    init(name: String) {
        self.name = name
        print("Customer \(name) is being initialized")
    }

    deinit {
        print("Customer \(name) is being deinitialized")
    }
}

class CreditCard {
    let number: UInt64
    unowned let customer: Customer  // Unowned reference

    init(number: UInt64, customer: Customer) {
        self.number = number
        self.customer = customer
        print("CreditCard \(number) is being initialized")
    }

    deinit {
        print("CreditCard \(number) is being deinitialized")
    }
}

var customer: Customer? = Customer(name: "Charlie")
customer?.card = CreditCard(number: 1234_5678_9012_3456, customer: customer!)

customer = nil
// Output:
// Customer Charlie is being deinitialized
// CreditCard 1234567890123456 is being deinitialized
```

In this example, using `unowned` for `CreditCard`'s reference to `Customer` is safe because:
1. A credit card cannot exist independently of a customer
2. When the customer is deallocated, the credit card is also deallocated
3. The credit card's lifetime never exceeds that of the customer

### Implicitly Unwrapped Unowned Optional Reference

In some cases, you might need an unowned reference that can be `nil`. Swift 5.0+ supports `unowned(unsafe)` and optional `unowned` references:

```swift
class Country {
    let name: String
    var capitalCity: City!  // Implicitly unwrapped optional type

    init(name: String, capitalName: String) {
        self.name = name
        self.capitalCity = City(name: capitalName, country: self)
    }

    deinit {
        print("Country \(name) is being deinitialized")
    }
}

class City {
    let name: String
    unowned let country: Country

    init(name: String, country: Country) {
        self.name = name
        self.country = country
    }

    deinit {
        print("City \(name) is being deinitialized")
    }
}

var country: Country? = Country(name: "China", capitalName: "Beijing")
print("\(country!.capitalCity.name) is the capital of \(country!.name)")
// Output: Beijing is the capital of China

country = nil
// Output:
// Country China is being deinitialized
// City Beijing is being deinitialized
```

## Choosing Between weak and unowned

| Feature | weak | unowned |
|---------|------|---------|
| Can be nil | Yes (optional type) | No (non-optional type) |
| After reference is deallocated | Automatically becomes nil | Accessing causes crash |
| Performance | Slightly lower (optional value management) | Slightly higher |
| Use case | Referenced object might be deallocated first | Referenced object has same or longer lifetime |
| Complexity | Requires unwrapping | Direct use |

### Selection Guide

```swift
// Use weak: when uncertain about referenced object's lifetime
class Parent {
    var child: Child?
}

class Child {
    weak var parent: Parent?  // Parent might be deallocated first
}

// Use unowned: when certain referenced object has longer lifetime
class Order {
    let id: String
    var items: [OrderItem] = []

    init(id: String) {
        self.id = id
    }

    func addItem(_ name: String) {
        items.append(OrderItem(name: name, order: self))
    }
}

class OrderItem {
    let name: String
    unowned let order: Order  // OrderItem won't outlive Order

    init(name: String, order: Order) {
        self.name = name
        self.order = order
    }
}
```

### Safety Recommendation

When in doubt, prefer using `weak`. Although performance is slightly lower, it's safer:

```swift
// The safe choice
class SafeExample {
    weak var reference: SomeClass?  // Safe, won't crash even if object is deallocated

    func doSomething() {
        // Need to check for nil
        guard let ref = reference else {
            print("Reference is no longer valid")
            return
        }
        ref.performAction()
    }
}
```

## Strong Reference Cycles in Closures

Closures are also reference types, and when a closure captures a class instance, a strong reference cycle can occur.

### Problem Example

```swift
class HTMLElement {
    let name: String
    let text: String?

    lazy var asHTML: () -> String = {
        // Closure captures self, creating a reference cycle
        if let text = self.text {
            return "<\(self.name)>\(text)</\(self.name)>"
        } else {
            return "<\(self.name) />"
        }
    }

    init(name: String, text: String? = nil) {
        self.name = name
        self.text = text
    }

    deinit {
        print("\(name) is being deinitialized")
    }
}

var heading: HTMLElement? = HTMLElement(name: "h1", text: "Title")
print(heading!.asHTML())
// Output: <h1>Title</h1>

heading = nil
// No deinit output - memory leak!
```

### How the Reference Cycle Forms

```
┌─────────────────┐         ┌─────────────────┐
│  HTMLElement    │         │    Closure      │
│    Instance     │         │   (asHTML)      │
├─────────────────┤         ├─────────────────┤
│ asHTML ─────────┼────────▶│                 │
│                 │◀────────┼──── self        │
└─────────────────┘         └─────────────────┘
```

## Closure Capture Lists

Capture lists can be used to resolve strong reference cycles in closures. A capture list defines how a closure captures one or more reference types.

### Syntax

```swift
// Closure with no parameters
lazy var someClosure: () -> String = { [weak self] in
    // Closure body
}

// Closure with parameters
lazy var anotherClosure: (Int, String) -> String = { [weak self] index, name in
    // Closure body
}

// Capturing multiple references
lazy var complexClosure = { [weak self, unowned otherInstance] in
    // Closure body
}
```

### Resolving Reference Cycles with weak self

```swift
class HTMLElement {
    let name: String
    let text: String?

    lazy var asHTML: () -> String = { [weak self] in
        guard let self = self else {
            return ""
        }
        if let text = self.text {
            return "<\(self.name)>\(text)</\(self.name)>"
        } else {
            return "<\(self.name) />"
        }
    }

    init(name: String, text: String? = nil) {
        self.name = name
        self.text = text
    }

    deinit {
        print("\(name) is being deinitialized")
    }
}

var paragraph: HTMLElement? = HTMLElement(name: "p", text: "Paragraph content")
print(paragraph!.asHTML())
// Output: <p>Paragraph content</p>

paragraph = nil
// Output: p is being deinitialized
```

### Resolving Reference Cycles with unowned self

When you're certain that the closure and the instance it captures will always be deallocated at the same time, you can use `unowned`:

```swift
class NetworkManager {
    let baseURL: String
    var completionHandler: (() -> Void)?

    lazy var fetchData: () -> Void = { [unowned self] in
        print("Fetching data from \(self.baseURL)")
        self.completionHandler?()
    }

    init(baseURL: String) {
        self.baseURL = baseURL
    }

    deinit {
        print("NetworkManager is being deinitialized")
    }
}

var manager: NetworkManager? = NetworkManager(baseURL: "https://api.example.com")
manager?.fetchData()
// Output: Fetching data from https://api.example.com

manager = nil
// Output: NetworkManager is being deinitialized
```

### Value Semantics in Capture Lists

Capture lists can also capture copies of value types:

```swift
class Counter {
    var count = 0

    func createIncrementers() -> [() -> Int] {
        var incrementers: [() -> Int] = []

        for i in 1...3 {
            // Use capture list to capture the value of i
            let incrementer = { [capturedI = i] () -> Int in
                self.count += capturedI
                return self.count
            }
            incrementers.append(incrementer)
        }

        return incrementers
    }
}

let counter = Counter()
let incrementers = counter.createIncrementers()

print(incrementers[0]())  // Output: 1
print(incrementers[1]())  // Output: 3
print(incrementers[2]())  // Output: 6
```

## Practical Application Scenarios

### Scenario 1: Asynchronous Network Requests

```swift
class UserService {
    var currentUser: User?

    func fetchUser(id: Int, completion: @escaping (Result<User, Error>) -> Void) {
        let url = URL(string: "https://api.example.com/users/\(id)")!

        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            // Use weak self to avoid reference cycle
            guard let self = self else {
                print("UserService has been deallocated")
                return
            }

            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NetworkError.noData))
                return
            }

            do {
                let user = try JSONDecoder().decode(User.self, from: data)
                self.currentUser = user
                completion(.success(user))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    deinit {
        print("UserService is being deinitialized")
    }
}

enum NetworkError: Error {
    case noData
}

struct User: Codable {
    let id: Int
    let name: String
}
```

### Scenario 2: Timers

```swift
class TimerManager {
    var timer: Timer?
    var count = 0
    let maxCount: Int
    var onComplete: (() -> Void)?

    init(maxCount: Int) {
        self.maxCount = maxCount
    }

    func startTimer() {
        // When using closure-based timers, be aware of reference cycles
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            self.count += 1
            print("Count: \(self.count)")

            if self.count >= self.maxCount {
                self.stopTimer()
                self.onComplete?()
            }
        }
    }

    func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    deinit {
        stopTimer()
        print("TimerManager is being deinitialized")
    }
}

var timerManager: TimerManager? = TimerManager(maxCount: 5)
timerManager?.onComplete = {
    print("Timer complete!")
}
timerManager?.startTimer()

// After 5 seconds...
// timerManager = nil  // Can be safely deallocated
```

### Scenario 3: Notification Observers

```swift
class NotificationObserver {
    let name: String
    private var observers: [NSObjectProtocol] = []

    init(name: String) {
        self.name = name
        setupObservers()
    }

    private func setupObservers() {
        // When observing notifications with closures, weak reference to self is needed
        let observer = NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let self = self else { return }
            self.handleAppBecameActive(notification)
        }
        observers.append(observer)

        let backgroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didEnterBackgroundNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleAppEnteredBackground()
        }
        observers.append(backgroundObserver)
    }

    private func handleAppBecameActive(_ notification: Notification) {
        print("\(name) received app became active notification")
    }

    private func handleAppEnteredBackground() {
        print("\(name) received app entered background notification")
    }

    deinit {
        observers.forEach { NotificationCenter.default.removeObserver($0) }
        print("NotificationObserver \(name) is being deinitialized")
    }
}
```

### Scenario 4: Parent-Child View Relationships

```swift
class ParentView {
    let name: String
    var children: [ChildView] = []

    init(name: String) {
        self.name = name
    }

    func addChild(_ child: ChildView) {
        children.append(child)
        child.parent = self
    }

    func removeChild(_ child: ChildView) {
        children.removeAll { $0 === child }
        child.parent = nil
    }

    deinit {
        print("ParentView \(name) is being deinitialized")
    }
}

class ChildView {
    let name: String
    weak var parent: ParentView?  // Use weak to avoid reference cycle

    var onClick: (() -> Void)?

    init(name: String) {
        self.name = name
    }

    func setupAction() {
        // weak is also needed in closures
        onClick = { [weak self, weak parent] in
            guard let self = self else { return }
            if let parent = parent {
                print("\(self.name) was clicked, parent view is \(parent.name)")
            } else {
                print("\(self.name) was clicked, no parent view")
            }
        }
    }

    deinit {
        print("ChildView \(name) is being deinitialized")
    }
}

var parent: ParentView? = ParentView(name: "Container")
let child = ChildView(name: "Button")
parent?.addChild(child)
child.setupAction()
child.onClick?()

parent = nil
// Output:
// ParentView Container is being deinitialized
// ChildView Button is being deinitialized
```

### Scenario 5: Combine Subscriptions

```swift
import Combine

class DataViewModel {
    @Published var data: [String] = []
    private var cancellables = Set<AnyCancellable>()

    func subscribeToUpdates(publisher: AnyPublisher<[String], Never>) {
        publisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] newData in
                guard let self = self else { return }
                self.data = newData
                self.processData()
            }
            .store(in: &cancellables)
    }

    private func processData() {
        print("Processing data: \(data.count) items")
    }

    deinit {
        print("DataViewModel is being deinitialized")
    }
}
```

### Scenario 6: Async Operations in SwiftUI

```swift
import SwiftUI

class ContentViewModel: ObservableObject {
    @Published var items: [String] = []
    @Published var isLoading = false

    func loadItems() {
        isLoading = true

        Task { [weak self] in
            // Simulate network request
            try? await Task.sleep(nanoseconds: 2_000_000_000)

            await MainActor.run { [weak self] in
                guard let self = self else { return }
                self.items = ["Item 1", "Item 2", "Item 3"]
                self.isLoading = false
            }
        }
    }

    deinit {
        print("ContentViewModel is being deinitialized")
    }
}
```

## Debugging Memory Issues

### Using deinit for Verification

Add a `deinit` method to verify that objects are being properly deallocated:

```swift
class DebugClass {
    let id: Int
    static var instanceCount = 0

    init(id: Int) {
        self.id = id
        DebugClass.instanceCount += 1
        print("DebugClass \(id) created, current instance count: \(DebugClass.instanceCount)")
    }

    deinit {
        DebugClass.instanceCount -= 1
        print("DebugClass \(id) deallocated, remaining instances: \(DebugClass.instanceCount)")
    }
}

// Test
func testMemory() {
    let obj1 = DebugClass(id: 1)
    let obj2 = DebugClass(id: 2)
    print("Before function ends")
}

testMemory()
print("After function ends")

// Output:
// DebugClass 1 created, current instance count: 1
// DebugClass 2 created, current instance count: 2
// Before function ends
// DebugClass 2 deallocated, remaining instances: 1
// DebugClass 1 deallocated, remaining instances: 0
// After function ends
```

### Xcode Memory Graph Debugger

In Xcode, you can use the Memory Graph Debugger to visualize reference relationships between objects:

1. During debugging, click on the Debug Navigator
2. Select the "Debug Memory Graph" button (memory icon)
3. View reference relationships between objects to find reference cycles
4. Purple exclamation marks indicate potential memory leaks

### Instruments Tool

Using Xcode's Instruments tool can help discover memory leaks:

1. **Leaks**: Detects memory leaks
2. **Allocations**: Tracks memory allocations
3. **VM Tracker**: Monitors virtual memory usage

```
Product -> Profile (Cmd+I) -> Select Leaks or Allocations
```

### Common Memory Issue Checklist

```swift
// Checklist
class MemoryCheckList {
    // 1. Is delegate using weak?
    weak var delegate: SomeDelegate?  // Correct

    // 2. Does closure property capture self?
    lazy var handler: () -> Void = { [weak self] in
        self?.doSomething()  // Correct
    }

    // 3. Does async callback use weak self?
    func asyncTask() {
        DispatchQueue.main.async { [weak self] in
            self?.updateUI()  // Correct
        }
    }

    // 4. Does timer callback use weak self?
    func setupTimer() {
        Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.tick()  // Correct
        }
    }

    // 5. Are NotificationCenter observers properly removed?
    var observer: NSObjectProtocol?

    deinit {
        if let observer = observer {
            NotificationCenter.default.removeObserver(observer)
        }
    }
}
```

## Best Practices Summary

### Use Strong References by Default

Only use `weak` or `unowned` when you need to break a reference cycle:

```swift
class Container {
    var items: [Item] = []  // Strong reference is the default and correct choice
}
```

### Prefer weak

When uncertain about the referenced object's lifetime, using `weak` is safer:

```swift
class SafeHandler {
    weak var target: SomeClass?  // The safe choice
}
```

### Use unowned Carefully

Only use `unowned` when you're certain the referenced object won't be deallocated first:

```swift
class CreditCard {
    unowned let owner: Customer  // Only use when certain owner won't be deallocated first
}
```

### Use weak for Delegation Pattern

Delegate properties should almost always be declared as `weak`:

```swift
protocol ViewDelegate: AnyObject {
    func viewDidLoad()
}

class CustomView {
    weak var delegate: ViewDelegate?
}
```

### Use Capture Lists in Closures

In closures that might create reference cycles, use `[weak self]` or `[unowned self]`:

```swift
class ViewModel {
    var onUpdate: (() -> Void)?

    func setup() {
        onUpdate = { [weak self] in
            guard let self = self else { return }
            self.performUpdate()
        }
    }
}
```

### Use guard let for Unwrapping

In closures, use `guard let self = self else { return }` to safely unwrap weak references:

```swift
someAsyncOperation { [weak self] result in
    guard let self = self else {
        print("Object has been deallocated, canceling operation")
        return
    }
    self.handleResult(result)
}
```

### Regularly Check deinit

Ensure objects are deallocated when expected:

```swift
class MonitoredClass {
    deinit {
        print("MonitoredClass properly deallocated")
    }
}
```

### Use Debugging Tools

Use Xcode's Memory Graph Debugger and Instruments to discover memory issues.

### Complete Best Practices Example

```swift
protocol ServiceDelegate: AnyObject {
    func serviceDidComplete(result: String)
}

class BestPracticeService {
    // Use weak for delegate
    weak var delegate: ServiceDelegate?

    // Use strong reference for child objects (default)
    private let processor = DataProcessor()

    // Use capture list for closure properties
    private lazy var completionHandler: (String) -> Void = { [weak self] result in
        self?.handleCompletion(result)
    }

    // Cancellation tokens
    private var cancellables = Set<AnyCancellable>()

    func performAsyncTask() {
        // Use [weak self] in async operations
        DispatchQueue.global().async { [weak self] in
            guard let self = self else { return }

            let result = self.processor.process()

            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.delegate?.serviceDidComplete(result: result)
            }
        }
    }

    func setupTimer() -> Timer {
        // Use [weak self] for timers
        return Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.tick()
        }
    }

    private func handleCompletion(_ result: String) {
        print("Complete: \(result)")
    }

    private func tick() {
        print("Timer triggered")
    }

    deinit {
        print("BestPracticeService properly deallocated")
    }
}

class DataProcessor {
    func process() -> String {
        return "Processing result"
    }
}
```

## Summary

By understanding and correctly using ARC, strong references, weak references, unowned references, and closure capture lists, you can effectively manage memory in your Swift applications, avoid memory leaks, and build efficient and stable applications.

Key takeaways:

1. **ARC manages memory automatically**: But developers need to avoid reference cycles
2. **Strong references are the default**: Used for most normal object relationships
3. **weak is for optional references that might be deallocated first**: Such as delegates
4. **unowned is for non-optional references with lifetime not shorter than the current object**: Such as a credit card's reference to its cardholder
5. **Closure capture lists**: Resolve reference cycles in closures
6. **Debugging tools**: Use deinit, Memory Graph, and Instruments to discover issues

Remember: When in doubt, using `weak` is the safer choice. The minor performance cost is far less significant than the problems caused by memory leaks.
