---
title: Swift Property Wrappers
description: Learn Swift property wrappers including built-in wrappers, custom wrappers and SwiftUI applications
track: swift
section: optionals-protocols
difficulty: intermediate
tags:
  - Swift
  - property wrappers
  - SwiftUI
status: imported
origin: old/src/content/docs/swift/property-wrappers.en.md
divergence: 0.42
issues:
  - divergent
legacy:
  category: Swift
  subcategory: Advanced Features
  order: 11
  lastUpdated: 2026-01-07
---

Property wrappers are a powerful Swift feature that allows you to encapsulate common property patterns into reusable abstractions. Introduced in Swift 5.1, they enable you to define custom logic that runs whenever a property is accessed or modified. We'll cover everything from understanding the basics to creating sophisticated custom wrappers and leveraging them in SwiftUI applications.

## What Are Property Wrappers?

A property wrapper is a type that wraps a value and provides additional behavior or logic around accessing and storing that value. Think of it as a layer of abstraction that sits between your code and the actual stored property.

### The Problem Property Wrappers Solve

Before property wrappers, implementing common patterns like lazy initialization, thread-safe access, or value validation required repetitive boilerplate code:

```swift
// Without property wrappers - repetitive pattern
class UserSettings {
    private var _fontSize: Int = 14
    var fontSize: Int {
        get { return _fontSize }
        set {
            _fontSize = max(8, min(newValue, 72)) // Clamp between 8 and 72
        }
    }

    private var _volume: Int = 50
    var volume: Int {
        get { return _volume }
        set {
            _volume = max(0, min(newValue, 100)) // Clamp between 0 and 100
        }
    }

    // More properties with similar patterns...
}
```

With property wrappers, you can extract this pattern into a reusable component:

```swift
// With property wrappers - clean and reusable
@propertyWrapper
struct Clamped {
    private var value: Int
    let range: ClosedRange<Int>

    var wrappedValue: Int {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }

    init(wrappedValue: Int, _ range: ClosedRange<Int>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }
}

class UserSettings {
    @Clamped(8...72) var fontSize: Int = 14
    @Clamped(0...100) var volume: Int = 50
}
```

### Basic Syntax

To create a property wrapper, you define a type (struct, class, or enum) with the `@propertyWrapper` attribute and implement a `wrappedValue` property:

```swift
@propertyWrapper
struct Wrapper {
    var wrappedValue: SomeType {
        get { /* return the value */ }
        set { /* store the value */ }
    }
}
```

To use a property wrapper, you apply it to a property using the `@` syntax:

```swift
struct Example {
    @Wrapper var property: SomeType
}
```

## Creating Custom Property Wrappers

Let's explore how to create property wrappers from simple to more complex implementations.

### A Simple Trimmed String Wrapper

This wrapper automatically trims whitespace from strings:

```swift
@propertyWrapper
struct Trimmed {
    private var value: String = ""

    var wrappedValue: String {
        get { value }
        set { value = newValue.trimmingCharacters(in: .whitespacesAndNewlines) }
    }

    init(wrappedValue: String) {
        self.wrappedValue = wrappedValue
    }
}

struct User {
    @Trimmed var username: String
    @Trimmed var email: String
}

var user = User(username: "  john_doe  ", email: "  john@example.com  ")
print(user.username) // "john_doe"
print(user.email)    // "john@example.com"

user.username = "  new_username  "
print(user.username) // "new_username"
```

### A Validated Property Wrapper

Create a wrapper that validates values before storing them:

```swift
@propertyWrapper
struct Validated<Value> {
    private var value: Value
    private let validation: (Value) -> Bool
    private let defaultValue: Value

    var wrappedValue: Value {
        get { value }
        set {
            if validation(newValue) {
                value = newValue
            } else {
                print("Validation failed, keeping current value")
            }
        }
    }

    init(wrappedValue: Value, validation: @escaping (Value) -> Bool, defaultValue: Value) {
        self.validation = validation
        self.defaultValue = defaultValue

        if validation(wrappedValue) {
            self.value = wrappedValue
        } else {
            self.value = defaultValue
        }
    }
}

struct Account {
    @Validated(
        validation: { $0 >= 0 },
        defaultValue: 0
    )
    var balance: Double = 0

    @Validated(
        validation: { $0.count >= 3 && $0.count <= 20 },
        defaultValue: "user"
    )
    var username: String = "user"
}

var account = Account()
account.balance = 100.0
print(account.balance) // 100.0

account.balance = -50.0  // Validation failed
print(account.balance)   // 100.0 (unchanged)

account.username = "ab"  // Validation failed (too short)
print(account.username)  // "user" (unchanged)
```

### A Logging Property Wrapper

Track property access and modifications for debugging:

```swift
@propertyWrapper
struct Logged<Value> {
    private var value: Value
    private let name: String

    var wrappedValue: Value {
        get {
            print("[\(name)] Get: \(value)")
            return value
        }
        set {
            print("[\(name)] Set: \(value) -> \(newValue)")
            value = newValue
        }
    }

    init(wrappedValue: Value, name: String) {
        self.value = wrappedValue
        self.name = name
        print("[\(name)] Initialized with: \(wrappedValue)")
    }
}

struct Configuration {
    @Logged(name: "theme") var theme: String = "light"
    @Logged(name: "language") var language: String = "en"
}

var config = Configuration()
// Output: [theme] Initialized with: light
// Output: [language] Initialized with: en

_ = config.theme
// Output: [theme] Get: light

config.language = "es"
// Output: [language] Set: en -> es
```

## The Wrapped Value and Projected Value

Property wrappers have two special values: the wrapped value and an optional projected value.

### Wrapped Value

The `wrappedValue` is the primary value that the wrapper manages. When you access the property directly, you get the wrapped value:

```swift
@propertyWrapper
struct Uppercase {
    private var value: String = ""

    var wrappedValue: String {
        get { value }
        set { value = newValue.uppercased() }
    }

    init(wrappedValue: String) {
        self.wrappedValue = wrappedValue
    }
}

struct Message {
    @Uppercase var title: String
}

var message = Message(title: "hello")
print(message.title) // "HELLO" - accessing wrappedValue
```

### Projected Value

The `projectedValue` provides access to additional functionality. Access it using the `$` prefix:

```swift
@propertyWrapper
struct SmallNumber {
    private var number: Int
    private(set) var projectedValue: Bool  // Indicates if clamping occurred

    var wrappedValue: Int {
        get { number }
        set {
            if newValue > 12 {
                number = 12
                projectedValue = true
            } else {
                number = newValue
                projectedValue = false
            }
        }
    }

    init() {
        self.number = 0
        self.projectedValue = false
    }
}

struct SomeStructure {
    @SmallNumber var someNumber: Int
}

var someStructure = SomeStructure()
someStructure.someNumber = 4
print(someStructure.someNumber)   // 4
print(someStructure.$someNumber)  // false - no clamping

someStructure.someNumber = 55
print(someStructure.someNumber)   // 12 (clamped)
print(someStructure.$someNumber)  // true - clamping occurred
```

### Practical Projected Value Example

A common pattern is to use projected value to provide a binding or additional metadata:

```swift
@propertyWrapper
struct Published<Value> {
    private var value: Value
    private let onChange: (Value) -> Void

    var wrappedValue: Value {
        get { value }
        set {
            value = newValue
            onChange(newValue)
        }
    }

    var projectedValue: Publisher {
        Publisher(value: value, onChange: onChange)
    }

    init(wrappedValue: Value, onChange: @escaping (Value) -> Void = { _ in }) {
        self.value = wrappedValue
        self.onChange = onChange
    }

    struct Publisher {
        let value: Value
        let onChange: (Value) -> Void

        func subscribe(_ handler: @escaping (Value) -> Void) -> Subscription {
            return Subscription(handler: handler, onChange: onChange)
        }
    }

    struct Subscription {
        let handler: (Value) -> Void
        let onChange: (Value) -> Void
    }
}
```

## Initialization Patterns

Property wrappers support multiple initialization patterns to provide flexibility.

### Default Initialization

The simplest form uses `init(wrappedValue:)`:

```swift
@propertyWrapper
struct NonEmpty {
    private var value: String

    var wrappedValue: String {
        get { value }
        set { value = newValue.isEmpty ? "default" : newValue }
    }

    init(wrappedValue: String) {
        self.value = wrappedValue.isEmpty ? "default" : wrappedValue
    }
}

struct Document {
    @NonEmpty var title: String = "Untitled"  // Uses init(wrappedValue:)
}
```

### Custom Parameters

Add additional parameters to the initializer:

```swift
@propertyWrapper
struct Capped {
    private var value: Int
    private let maximum: Int

    var wrappedValue: Int {
        get { value }
        set { value = min(newValue, maximum) }
    }

    init(wrappedValue: Int, maximum: Int) {
        self.maximum = maximum
        self.value = min(wrappedValue, maximum)
    }
}

struct Player {
    @Capped(maximum: 100) var health: Int = 100
    @Capped(maximum: 50) var shield: Int = 0
}

var player = Player()
player.health = 150
print(player.health) // 100 (capped at maximum)
```

### Multiple Initializers

Property wrappers can have multiple initializers for different use cases:

```swift
@propertyWrapper
struct Defaulted<Value> {
    private var value: Value?
    private let defaultValue: Value

    var wrappedValue: Value {
        get { value ?? defaultValue }
        set { value = newValue }
    }

    // Initialize with just a default
    init(defaultValue: Value) {
        self.defaultValue = defaultValue
        self.value = nil
    }

    // Initialize with both value and default
    init(wrappedValue: Value, defaultValue: Value) {
        self.defaultValue = defaultValue
        self.value = wrappedValue
    }
}

struct Settings {
    @Defaulted(defaultValue: "light") var theme: String
    @Defaulted(defaultValue: 14) var fontSize: Int = 16
}

var settings = Settings()
print(settings.theme)    // "light" (using default)
print(settings.fontSize) // 16 (using provided value)
```

### Initialization Without Initial Value

Some wrappers do not require an initial value:

```swift
@propertyWrapper
struct Later<Value> {
    private var value: Value?

    var wrappedValue: Value {
        get {
            guard let value = value else {
                fatalError("Property accessed before being initialized")
            }
            return value
        }
        set {
            value = newValue
        }
    }

    init() {
        self.value = nil
    }
}

class ViewController {
    @Later var tableView: UITableView

    func setup() {
        tableView = UITableView()  // Set later
    }
}
```

## Built-in Property Wrappers

Swift and its frameworks provide several built-in property wrappers.

### @State (SwiftUI)

Manages local, mutable state within a SwiftUI view:

```swift
import SwiftUI

struct CounterView: View {
    @State private var count = 0

    var body: some View {
        VStack {
            Text("Count: \(count)")
            Button("Increment") {
                count += 1
            }
        }
    }
}
```

### @Binding (SwiftUI)

Creates a two-way connection to state owned by a parent view:

```swift
struct ToggleView: View {
    @Binding var isOn: Bool

    var body: some View {
        Toggle("Toggle", isOn: $isOn)
    }
}

struct ParentView: View {
    @State private var isEnabled = false

    var body: some View {
        VStack {
            ToggleView(isOn: $isEnabled)
            Text(isEnabled ? "Enabled" : "Disabled")
        }
    }
}
```

### @Published

Publishes changes to properties in an ObservableObject:

```swift
import Combine

class UserViewModel: ObservableObject {
    @Published var username: String = ""
    @Published var email: String = ""
    @Published var isLoggedIn: Bool = false
}
```

### @Environment (SwiftUI)

Reads values from the SwiftUI environment:

```swift
struct ContentView: View {
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.horizontalSizeClass) var sizeClass

    var body: some View {
        Text("Current mode: \(colorScheme == .dark ? "Dark" : "Light")")
    }
}
```

### @AppStorage

Reads and writes values from UserDefaults:

```swift
struct SettingsView: View {
    @AppStorage("username") var username: String = "Guest"
    @AppStorage("notifications_enabled") var notificationsEnabled: Bool = true
    @AppStorage("font_size") var fontSize: Double = 14.0

    var body: some View {
        Form {
            TextField("Username", text: $username)
            Toggle("Enable Notifications", isOn: $notificationsEnabled)
            Slider(value: $fontSize, in: 10...24) {
                Text("Font Size: \(Int(fontSize))")
            }
        }
    }
}
```

### @SceneStorage

Persists state specific to a scene (restored across app launches):

```swift
struct EditorView: View {
    @SceneStorage("draft_text") var draftText: String = ""
    @SceneStorage("selected_tab") var selectedTab: Int = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            TextEditor(text: $draftText)
                .tabItem { Label("Editor", systemImage: "doc") }
                .tag(0)

            Text("Settings")
                .tabItem { Label("Settings", systemImage: "gear") }
                .tag(1)
        }
    }
}
```

### @FocusState

Tracks and controls focus state in forms:

```swift
struct LoginForm: View {
    enum Field {
        case username, password
    }

    @State private var username = ""
    @State private var password = ""
    @FocusState private var focusedField: Field?

    var body: some View {
        Form {
            TextField("Username", text: $username)
                .focused($focusedField, equals: .username)

            SecureField("Password", text: $password)
                .focused($focusedField, equals: .password)

            Button("Login") {
                if username.isEmpty {
                    focusedField = .username
                } else if password.isEmpty {
                    focusedField = .password
                } else {
                    // Perform login
                }
            }
        }
    }
}
```

## SwiftUI Property Wrappers

SwiftUI uses property wrappers extensively for state management and data flow.

### @StateObject vs @ObservedObject

Understanding when to use each is crucial for correct behavior:

```swift
class DataModel: ObservableObject {
    @Published var items: [String] = []

    func addItem(_ item: String) {
        items.append(item)
    }
}

// Use @StateObject when creating the object
struct ParentView: View {
    @StateObject private var model = DataModel()  // Created and owned here

    var body: some View {
        VStack {
            ChildView(model: model)
            Button("Add Item") {
                model.addItem("New Item")
            }
        }
    }
}

// Use @ObservedObject when receiving the object
struct ChildView: View {
    @ObservedObject var model: DataModel  // Passed in, not owned

    var body: some View {
        List(model.items, id: \.self) { item in
            Text(item)
        }
    }
}
```

Key difference: `@StateObject` ensures the object persists across view updates, while `@ObservedObject` does not guarantee persistence.

### @EnvironmentObject

Share data across many views without passing through initializers:

```swift
class AppState: ObservableObject {
    @Published var currentUser: User?
    @Published var settings: AppSettings = AppSettings()
    @Published var cart: ShoppingCart = ShoppingCart()
}

@main
struct MyApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

// Any descendant view can access appState
struct ProductView: View {
    @EnvironmentObject var appState: AppState
    let product: Product

    var body: some View {
        VStack {
            Text(product.name)
            Button("Add to Cart") {
                appState.cart.add(product)
            }
        }
    }
}
```

### @Namespace and @Namespace.ID

Coordinate animations across views:

```swift
struct HeroAnimationExample: View {
    @Namespace private var animation
    @State private var isExpanded = false

    var body: some View {
        VStack {
            if isExpanded {
                ExpandedView(namespace: animation)
                    .onTapGesture {
                        withAnimation(.spring()) {
                            isExpanded = false
                        }
                    }
            } else {
                CollapsedView(namespace: animation)
                    .onTapGesture {
                        withAnimation(.spring()) {
                            isExpanded = true
                        }
                    }
            }
        }
    }
}

struct ExpandedView: View {
    var namespace: Namespace.ID

    var body: some View {
        RoundedRectangle(cornerRadius: 20)
            .fill(Color.blue)
            .matchedGeometryEffect(id: "shape", in: namespace)
            .frame(width: 300, height: 300)
    }
}

struct CollapsedView: View {
    var namespace: Namespace.ID

    var body: some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(Color.blue)
            .matchedGeometryEffect(id: "shape", in: namespace)
            .frame(width: 100, height: 100)
    }
}
```

### @GestureState

Track transient state during gestures:

```swift
struct DraggableView: View {
    @GestureState private var dragOffset: CGSize = .zero
    @State private var position: CGSize = .zero

    var body: some View {
        Circle()
            .fill(Color.blue)
            .frame(width: 100, height: 100)
            .offset(x: position.width + dragOffset.width,
                    y: position.height + dragOffset.height)
            .gesture(
                DragGesture()
                    .updating($dragOffset) { value, state, _ in
                        state = value.translation
                    }
                    .onEnded { value in
                        position.width += value.translation.width
                        position.height += value.translation.height
                    }
            )
    }
}
```

### @Query (SwiftData)

Fetch data from SwiftData:

```swift
import SwiftData

@Model
class Task {
    var title: String
    var isCompleted: Bool
    var dueDate: Date?

    init(title: String, isCompleted: Bool = false, dueDate: Date? = nil) {
        self.title = title
        self.isCompleted = isCompleted
        self.dueDate = dueDate
    }
}

struct TaskListView: View {
    @Query(sort: \Task.dueDate) var tasks: [Task]
    @Environment(\.modelContext) var modelContext

    var body: some View {
        List {
            ForEach(tasks) { task in
                TaskRow(task: task)
            }
            .onDelete(perform: deleteTasks)
        }
    }

    func deleteTasks(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(tasks[index])
        }
    }
}
```

## Advanced Patterns

### Composing Property Wrappers

You can stack multiple property wrappers on a single property:

```swift
@propertyWrapper
struct Capitalized {
    private var value: String = ""

    var wrappedValue: String {
        get { value }
        set { value = newValue.capitalized }
    }

    init(wrappedValue: String) {
        self.wrappedValue = wrappedValue
    }
}

@propertyWrapper
struct MaxLength {
    private var value: String = ""
    let maxLength: Int

    var wrappedValue: String {
        get { value }
        set { value = String(newValue.prefix(maxLength)) }
    }

    init(wrappedValue: String, maxLength: Int) {
        self.maxLength = maxLength
        self.wrappedValue = wrappedValue
    }
}

struct Profile {
    @Capitalized @MaxLength(maxLength: 20) var displayName: String = ""
}

var profile = Profile()
profile.displayName = "john doe is a very long name"
print(profile.displayName) // "John Doe Is A Very L" (capitalized and truncated)
```

Note: When stacking wrappers, they are applied from inner to outer. The outer wrapper sees the result of the inner wrapper.

### Reference Type Wrapper for Value Semantics

Create a wrapper that provides reference semantics to value types:

```swift
@propertyWrapper
class Box<Value> {
    var wrappedValue: Value

    init(wrappedValue: Value) {
        self.wrappedValue = wrappedValue
    }
}

struct SharedState {
    @Box var counter: Int = 0
}

var state1 = SharedState()
var state2 = state1  // Copies the struct, but Box is shared

state1.counter = 10
print(state2.counter) // 10 - both point to the same Box
```

### Thread-Safe Property Wrapper

Ensure thread-safe access to properties:

```swift
@propertyWrapper
class Atomic<Value> {
    private var value: Value
    private let lock = NSLock()

    var wrappedValue: Value {
        get {
            lock.lock()
            defer { lock.unlock() }
            return value
        }
        set {
            lock.lock()
            defer { lock.unlock() }
            value = newValue
        }
    }

    init(wrappedValue: Value) {
        self.value = wrappedValue
    }
}

class Counter {
    @Atomic var count: Int = 0

    func increment() {
        count += 1
    }
}
```

### Lazy Initialization with Reset

A property wrapper that supports lazy initialization and can be reset:

```swift
@propertyWrapper
struct ResettableLazy<Value> {
    private var storage: Value?
    private let initializer: () -> Value

    var wrappedValue: Value {
        mutating get {
            if storage == nil {
                storage = initializer()
            }
            return storage!
        }
        set {
            storage = newValue
        }
    }

    var projectedValue: Self {
        get { self }
        set { self = newValue }
    }

    init(wrappedValue: @autoclosure @escaping () -> Value) {
        self.initializer = wrappedValue
    }

    mutating func reset() {
        storage = nil
    }
}

struct DataManager {
    @ResettableLazy var expensiveData: [String] = {
        print("Computing expensive data...")
        return ["item1", "item2", "item3"]
    }()

    mutating func clearCache() {
        $expensiveData.reset()
    }
}

var manager = DataManager()
print(manager.expensiveData) // "Computing expensive data..." then prints data
print(manager.expensiveData) // Just prints data (cached)
manager.clearCache()
print(manager.expensiveData) // "Computing expensive data..." again
```

### Property Wrapper with Dependencies

Create a wrapper that accesses external dependencies:

```swift
@propertyWrapper
struct UserDefault<Value> {
    let key: String
    let defaultValue: Value
    let storage: UserDefaults

    var wrappedValue: Value {
        get {
            storage.object(forKey: key) as? Value ?? defaultValue
        }
        set {
            storage.set(newValue, forKey: key)
        }
    }

    init(wrappedValue: Value, key: String, storage: UserDefaults = .standard) {
        self.key = key
        self.defaultValue = wrappedValue
        self.storage = storage
    }
}

struct AppPreferences {
    @UserDefault(key: "has_completed_onboarding")
    var hasCompletedOnboarding: Bool = false

    @UserDefault(key: "preferred_theme")
    var preferredTheme: String = "system"

    @UserDefault(key: "notifications_enabled")
    var notificationsEnabled: Bool = true
}
```

### Codable Property Wrapper

A wrapper that handles JSON encoding/decoding with a custom date format:

```swift
@propertyWrapper
struct ISO8601Date: Codable {
    var wrappedValue: Date

    init(wrappedValue: Date) {
        self.wrappedValue = wrappedValue
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let dateString = try container.decode(String.self)

        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: dateString) else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Invalid date format"
            )
        }
        wrappedValue = date
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        let formatter = ISO8601DateFormatter()
        try container.encode(formatter.string(from: wrappedValue))
    }
}

struct Event: Codable {
    let name: String
    @ISO8601Date var startDate: Date
    @ISO8601Date var endDate: Date
}

// JSON: {"name": "Conference", "startDate": "2024-06-15T09:00:00Z", "endDate": "2024-06-17T18:00:00Z"}
```

## Best Practices

### Keep Wrappers Focused

Each property wrapper should have a single responsibility:

```swift
// Good: Single responsibility
@propertyWrapper
struct NonNegative {
    private var value: Int

    var wrappedValue: Int {
        get { value }
        set { value = max(0, newValue) }
    }

    init(wrappedValue: Int) {
        self.value = max(0, wrappedValue)
    }
}

// Avoid: Multiple responsibilities
@propertyWrapper
struct NumberProcessor {
    private var value: Int

    var wrappedValue: Int {
        get { value }
        set {
            // Doing too many things
            let clamped = max(0, min(100, newValue))
            let rounded = (clamped / 5) * 5
            value = rounded
            UserDefaults.standard.set(rounded, forKey: "number")
            NotificationCenter.default.post(name: .numberChanged, object: nil)
        }
    }
}
```

### Document Behavior Clearly

Property wrappers hide implementation details, so documentation is essential:

```swift
/// A property wrapper that clamps values to a specified range.
///
/// Use this wrapper to ensure a property's value always stays within bounds:
///
///     @Clamped(0...100) var percentage: Int = 50
///
/// - Important: Values outside the range are silently clamped, not rejected.
/// - Note: The initial value is also clamped if outside the range.
@propertyWrapper
struct Clamped<Value: Comparable> {
    // Implementation...
}
```

### Consider Thread Safety

Be explicit about thread safety requirements:

```swift
/// A thread-safe property wrapper using a lock.
///
/// - Warning: This wrapper uses NSLock and may impact performance
///   in high-contention scenarios. Consider using actor isolation
///   for new Swift concurrency code.
@propertyWrapper
class ThreadSafe<Value> {
    private var value: Value
    private let lock = NSLock()

    var wrappedValue: Value {
        get {
            lock.lock()
            defer { lock.unlock() }
            return value
        }
        set {
            lock.lock()
            defer { lock.unlock() }
            value = newValue
        }
    }

    init(wrappedValue: Value) {
        self.value = wrappedValue
    }
}
```

### Use Struct for Value Semantics

Prefer struct for property wrappers when possible:

```swift
// Preferred: Struct wrapper has value semantics
@propertyWrapper
struct Uppercased {
    private var value: String = ""

    var wrappedValue: String {
        get { value }
        set { value = newValue.uppercased() }
    }

    init(wrappedValue: String) {
        self.wrappedValue = wrappedValue
    }
}

// Use class only when reference semantics are required
@propertyWrapper
class Shared<Value> {
    var wrappedValue: Value

    init(wrappedValue: Value) {
        self.wrappedValue = wrappedValue
    }
}
```

### Provide Meaningful Projected Values

Use projected values to expose useful additional functionality:

```swift
@propertyWrapper
struct Validated<Value> {
    private var value: Value
    private var lastError: ValidationError?
    private let validator: (Value) -> ValidationError?

    var wrappedValue: Value {
        get { value }
        set {
            lastError = validator(newValue)
            if lastError == nil {
                value = newValue
            }
        }
    }

    // Projected value provides validation state
    var projectedValue: ValidationState {
        ValidationState(
            isValid: lastError == nil,
            error: lastError
        )
    }

    struct ValidationState {
        let isValid: Bool
        let error: ValidationError?
    }

    struct ValidationError: Error {
        let message: String
    }

    init(wrappedValue: Value, validator: @escaping (Value) -> ValidationError?) {
        self.value = wrappedValue
        self.validator = validator
        self.lastError = nil
    }
}

struct RegistrationForm {
    @Validated(validator: { email in
        let pattern = #"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
        let isValid = email.range(of: pattern, options: .regularExpression) != nil
        return isValid ? nil : Validated<String>.ValidationError(message: "Invalid email")
    })
    var email: String = ""
}

var form = RegistrationForm()
form.email = "invalid-email"
print(form.$email.isValid)  // false
print(form.$email.error?.message)  // "Invalid email"

form.email = "valid@example.com"
print(form.$email.isValid)  // true
```

### Test Property Wrappers Thoroughly

Write comprehensive tests for property wrappers:

```swift
import XCTest

final class ClampedTests: XCTestCase {
    func testInitialValueWithinRange() {
        @Clamped(0...100) var value: Int = 50
        XCTAssertEqual(value, 50)
    }

    func testInitialValueBelowRange() {
        @Clamped(0...100) var value: Int = -10
        XCTAssertEqual(value, 0)
    }

    func testInitialValueAboveRange() {
        @Clamped(0...100) var value: Int = 150
        XCTAssertEqual(value, 100)
    }

    func testSettingValueWithinRange() {
        @Clamped(0...100) var value: Int = 50
        value = 75
        XCTAssertEqual(value, 75)
    }

    func testSettingValueOutsideRange() {
        @Clamped(0...100) var value: Int = 50
        value = 200
        XCTAssertEqual(value, 100)
    }
}
```

## Summary

Property wrappers are a powerful abstraction mechanism in Swift that enable you to:

- **Encapsulate common patterns**: Extract repetitive property logic into reusable components
- **Improve code clarity**: Replace boilerplate with declarative annotations
- **Manage state effectively**: Leverage SwiftUI's property wrappers for reactive UI development
- **Create domain-specific solutions**: Build custom wrappers tailored to your application's needs

Key points to remember:

1. **Wrapped Value**: The primary value managed by the wrapper, accessed directly through the property
2. **Projected Value**: Optional additional functionality accessed via the `$` prefix
3. **Initialization**: Multiple initializer patterns support various use cases
4. **Composition**: Property wrappers can be stacked for combined behavior
5. **SwiftUI Integration**: Many SwiftUI patterns rely on built-in property wrappers like `@State`, `@Binding`, `@StateObject`, and `@EnvironmentObject`

Property wrappers strike a balance between abstraction and transparency, making your code more expressive while maintaining type safety. When used thoughtfully, they can significantly reduce boilerplate and make patterns more discoverable across your codebase.

## Further Resources

- [Swift Documentation - Property Wrappers](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/properties/#Property-Wrappers)
- [SE-0258: Property Wrappers](https://github.com/apple/swift-evolution/blob/main/proposals/0258-property-wrappers.zh.md)
- [Apple Developer - SwiftUI State Management](https://developer.apple.com/documentation/swiftui/state-and-data-flow)
- [WWDC Videos on Property Wrappers](https://developer.apple.com/videos/)

---

*Last updated: January 7, 2026*
