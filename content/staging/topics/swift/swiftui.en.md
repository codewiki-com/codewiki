---
title: SwiftUI
description: Complete guide to SwiftUI, declarative UI, view composition and state management
track: swift
section: swiftui
difficulty: intermediate
tags:
  - Swift
  - SwiftUI
  - UI
  - Declarative
status: imported
origin: old/src/content/docs/swift/swiftui.en.md
divergence: 0.112
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Swift
  subcategory: UI Frameworks
  order: 4
  lastUpdated: 2026-01-07
---

SwiftUI is Apple's modern declarative framework for building user interfaces across all Apple platforms. Introduced at WWDC 2019, it represents a fundamental shift from the imperative UIKit approach, enabling developers to describe what the UI should look like rather than how to construct it step by step. SwiftUI automatically manages view updates, state synchronization, and layout calculations.

## Introduction to Declarative UI

### What is Declarative UI?

In declarative programming, you describe the desired outcome rather than the steps to achieve it. SwiftUI automatically handles the underlying implementation details, including view updates when data changes.

**Imperative Approach (UIKit):**
```swift
let label = UILabel()
label.text = "Hello, World!"
label.textColor = .blue
label.font = UIFont.systemFont(ofSize: 24)
view.addSubview(label)

// Later, to update:
label.text = "Updated text"
```

**Declarative Approach (SwiftUI):**
```swift
Text("Hello, World!")
    .foregroundColor(.blue)
    .font(.system(size: 24))
```

With SwiftUI, when the data changes, the UI automatically reflects those changes without manual intervention.

### Core Principles

1. **Views are functions of state**: UI automatically updates when state changes
2. **Composition over inheritance**: Build complex views from simple, reusable components
3. **Single source of truth**: Data flows in one direction with clear ownership
4. **Automatic dependency tracking**: SwiftUI tracks what affects each view and optimizes updates

### Your First SwiftUI View

Every SwiftUI view conforms to the `View` protocol and must provide a `body` property:

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Text("Welcome to SwiftUI")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("Building UIs has never been easier")
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

// Preview provider for Xcode canvas
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
```

## Views and View Composition

### Built-in Views

SwiftUI provides a rich set of built-in views for common UI elements.

#### Text and Images

```swift
struct BasicViewsExample: View {
    var body: some View {
        VStack(spacing: 20) {
            // Basic text
            Text("Standard Text")

            // Styled text
            Text("Bold and Large")
                .font(.title)
                .fontWeight(.bold)

            // Custom font and color
            Text("Custom Styled")
                .font(.custom("Helvetica", size: 18))
                .foregroundColor(.purple)
                .italic()

            // Multiline text
            Text("This is a longer text that will wrap to multiple lines automatically when needed")
                .multilineTextAlignment(.center)
                .lineLimit(3)

            // SF Symbols
            Image(systemName: "star.fill")
                .font(.system(size: 50))
                .foregroundColor(.yellow)

            // Async image loading from URL
            AsyncImage(url: URL(string: "https://example.com/image.jpg")) { phase in
                switch phase {
                case .empty:
                    ProgressView()
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                case .failure:
                    Image(systemName: "photo")
                        .foregroundColor(.gray)
                @unknown default:
                    EmptyView()
                }
            }
            .frame(width: 200, height: 200)
        }
    }
}
```

#### Buttons and Controls

```swift
struct ControlsExample: View {
    @State private var isOn = false
    @State private var sliderValue = 0.5
    @State private var textInput = ""

    var body: some View {
        VStack(spacing: 20) {
            // Button with action
            Button("Tap Me") {
                print("Button tapped")
            }
            .buttonStyle(.borderedProminent)

            // Button with custom label
            Button {
                print("Custom button tapped")
            } label: {
                HStack {
                    Image(systemName: "heart.fill")
                    Text("Like")
                }
                .padding()
                .background(Color.red)
                .foregroundColor(.white)
                .cornerRadius(10)
            }

            // Toggle
            Toggle("Enable Feature", isOn: $isOn)
                .padding()

            // Slider
            VStack {
                Slider(value: $sliderValue, in: 0...1)
                Text("Value: \(sliderValue, specifier: "%.2f")")
            }
            .padding()

            // TextField
            TextField("Enter text", text: $textInput)
                .textFieldStyle(.roundedBorder)
                .padding()
        }
    }
}
```

### Layout Containers

SwiftUI provides several layout containers to organize views:

```swift
struct LayoutExample: View {
    var body: some View {
        VStack(spacing: 30) {
            // VStack: Vertical arrangement
            VStack(alignment: .leading, spacing: 10) {
                Text("Vertical Stack")
                    .font(.headline)
                Text("Items arranged vertically")
                Text("With leading alignment")
            }
            .padding()
            .background(Color.blue.opacity(0.1))

            // HStack: Horizontal arrangement
            HStack(alignment: .top, spacing: 20) {
                Text("Left")
                Text("Center")
                Text("Right")
            }
            .padding()
            .background(Color.green.opacity(0.1))

            // ZStack: Depth/overlay arrangement
            ZStack(alignment: .bottomTrailing) {
                Rectangle()
                    .fill(Color.blue)
                    .frame(width: 200, height: 150)

                Text("Overlay")
                    .foregroundColor(.white)
                    .padding(8)
                    .background(Color.black.opacity(0.5))
            }

            // Grid layout (iOS 16+)
            Grid(alignment: .leading, horizontalSpacing: 20, verticalSpacing: 10) {
                GridRow {
                    Text("Name:")
                    Text("John Doe")
                }
                GridRow {
                    Text("Email:")
                    Text("john@example.com")
                }
                GridRow {
                    Text("Phone:")
                    Text("+1 234 567 8900")
                }
            }
        }
    }
}
```

### Spacer and Divider

```swift
struct SpacerDividerExample: View {
    var body: some View {
        VStack {
            Text("Top Content")

            Spacer() // Expands to fill available space

            Divider() // Horizontal line separator

            HStack {
                Text("Left")
                Spacer() // Pushes items apart
                Text("Right")
            }
            .padding()

            Spacer()

            Text("Bottom Content")
        }
        .padding()
    }
}
```

### Custom View Composition

Break down complex views into smaller, reusable components:

```swift
struct UserCard: View {
    let name: String
    let role: String
    let avatarColor: Color

    var body: some View {
        HStack(spacing: 15) {
            AvatarView(name: name, color: avatarColor)
            UserInfoView(name: name, role: role)
            Spacer()
            ActionButton()
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(radius: 4)
    }
}

struct AvatarView: View {
    let name: String
    let color: Color

    var body: some View {
        Circle()
            .fill(color)
            .frame(width: 50, height: 50)
            .overlay(
                Text(String(name.prefix(1)))
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            )
    }
}

struct UserInfoView: View {
    let name: String
    let role: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(name)
                .font(.headline)
            Text(role)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
}

struct ActionButton: View {
    var body: some View {
        Button {
            // Handle action
        } label: {
            Image(systemName: "chevron.right")
                .foregroundColor(.gray)
        }
    }
}
```

## View Modifiers

View modifiers transform views and can be chained to create complex styling effects. Each modifier returns a new view wrapping the original.

### Common Modifiers

```swift
struct ModifierExamples: View {
    var body: some View {
        VStack(spacing: 20) {
            // Frame and background
            Text("Styled Box")
                .frame(width: 200, height: 80)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)

            // Padding and borders
            Text("With Border")
                .padding()
                .border(Color.red, width: 2)

            // Multiple padding layers
            Text("Layered")
                .padding()
                .background(Color.yellow)
                .padding()
                .background(Color.orange)
                .padding()
                .background(Color.red)

            // Shadow effects
            Text("Shadowed")
                .padding()
                .background(Color.white)
                .cornerRadius(8)
                .shadow(color: .gray.opacity(0.5), radius: 5, x: 0, y: 2)

            // Transformations
            Text("Transformed")
                .rotationEffect(.degrees(15))
                .scaleEffect(1.2)

            // Opacity
            Text("Semi-transparent")
                .opacity(0.5)

            // Clipping to shape
            Image(systemName: "person.fill")
                .font(.system(size: 60))
                .frame(width: 100, height: 100)
                .background(Color.blue)
                .foregroundColor(.white)
                .clipShape(Circle())
        }
    }
}
```

### Creating Custom View Modifiers

Encapsulate reusable styling in custom modifiers:

```swift
struct CardModifier: ViewModifier {
    var backgroundColor: Color = .white
    var cornerRadius: CGFloat = 12
    var shadowRadius: CGFloat = 5

    func body(content: Content) -> some View {
        content
            .padding()
            .background(backgroundColor)
            .cornerRadius(cornerRadius)
            .shadow(color: .gray.opacity(0.3), radius: shadowRadius, x: 0, y: 2)
    }
}

struct PrimaryButtonModifier: ViewModifier {
    var isDisabled: Bool = false

    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(isDisabled ? Color.gray : Color.blue)
            .foregroundColor(.white)
            .cornerRadius(8)
            .opacity(isDisabled ? 0.6 : 1.0)
    }
}

// Extension for cleaner syntax
extension View {
    func cardStyle(
        backgroundColor: Color = .white,
        cornerRadius: CGFloat = 12,
        shadowRadius: CGFloat = 5
    ) -> some View {
        modifier(CardModifier(
            backgroundColor: backgroundColor,
            cornerRadius: cornerRadius,
            shadowRadius: shadowRadius
        ))
    }

    func primaryButtonStyle(isDisabled: Bool = false) -> some View {
        modifier(PrimaryButtonModifier(isDisabled: isDisabled))
    }
}

// Usage
struct CustomModifierExample: View {
    var body: some View {
        VStack(spacing: 20) {
            Text("Card Content")
                .cardStyle()

            VStack(alignment: .leading) {
                Text("Title")
                    .font(.headline)
                Text("Description goes here")
                    .font(.body)
            }
            .cardStyle(backgroundColor: .blue.opacity(0.1))

            Button("Submit") {
                // Handle action
            }
            .primaryButtonStyle()

            Button("Disabled") {
                // Handle action
            }
            .primaryButtonStyle(isDisabled: true)
        }
        .padding()
    }
}
```

### Conditional Modifiers

Apply modifiers based on conditions:

```swift
struct ConditionalModifierExample: View {
    @State private var isHighlighted = false
    @State private var isLarge = false

    var body: some View {
        VStack(spacing: 20) {
            Text("Toggle Me")
                .padding()
                .background(isHighlighted ? Color.yellow : Color.gray.opacity(0.2))
                .foregroundColor(isHighlighted ? .black : .primary)
                .fontWeight(isHighlighted ? .bold : .regular)
                .cornerRadius(8)
                .onTapGesture {
                    withAnimation {
                        isHighlighted.toggle()
                    }
                }

            // Using ternary for simple conditions
            Text("Resizable Text")
                .font(isLarge ? .title : .body)
                .animation(.spring(), value: isLarge)

            Toggle("Large Text", isOn: $isLarge)
                .padding()
        }
    }
}

// Extension for conditional modifier application
extension View {
    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}

// Usage of conditional extension
struct ConditionalExtensionExample: View {
    @State private var applyStyle = false

    var body: some View {
        Text("Conditional Style")
            .if(applyStyle) { view in
                view
                    .bold()
                    .foregroundColor(.red)
            }
    }
}
```

## State Management

State management is fundamental to SwiftUI. Different property wrappers serve different purposes for managing data flow.

### @State: Local View State

`@State` is used for simple, private state that belongs to a single view. SwiftUI manages the storage and triggers view updates when the value changes.

```swift
struct CounterView: View {
    @State private var count = 0
    @State private var isShowingAlert = false

    var body: some View {
        VStack(spacing: 20) {
            Text("Count: \(count)")
                .font(.largeTitle)
                .fontWeight(.bold)

            HStack(spacing: 15) {
                Button("Decrement") {
                    count -= 1
                }
                .buttonStyle(.bordered)

                Button("Reset") {
                    count = 0
                }
                .buttonStyle(.bordered)

                Button("Increment") {
                    count += 1
                }
                .buttonStyle(.borderedProminent)
            }

            Button("Show Alert") {
                isShowingAlert = true
            }
            .alert("Current Count", isPresented: $isShowingAlert) {
                Button("OK", role: .cancel) { }
            } message: {
                Text("The count is \(count)")
            }
        }
        .padding()
    }
}
```

Key points about `@State`:
- Always mark as `private` since state is owned by the view
- Use for simple value types (Int, String, Bool, etc.)
- SwiftUI manages the storage across view updates

### @Binding: Two-Way Data Flow

`@Binding` creates a two-way connection to state owned by a parent view. It allows child views to read and modify the parent's state.

```swift
struct ParentView: View {
    @State private var isPlaying = false
    @State private var volume: Double = 0.5

    var body: some View {
        VStack(spacing: 30) {
            Text("Parent controls the state")
                .font(.headline)

            Text("Playing: \(isPlaying ? "Yes" : "No")")
            Text("Volume: \(Int(volume * 100))%")

            Divider()

            // Pass binding to child
            PlayButton(isPlaying: $isPlaying)

            VolumeSlider(volume: $volume)
        }
        .padding()
    }
}

struct PlayButton: View {
    @Binding var isPlaying: Bool

    var body: some View {
        Button {
            isPlaying.toggle()
        } label: {
            Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.blue)
        }
    }
}

struct VolumeSlider: View {
    @Binding var volume: Double

    var body: some View {
        VStack {
            HStack {
                Image(systemName: "speaker.fill")
                Slider(value: $volume, in: 0...1)
                Image(systemName: "speaker.wave.3.fill")
            }
            .padding()
        }
    }
}
```

The `$` prefix accesses the binding's projected value, creating a two-way connection.

### @StateObject: Owned Observable Objects

`@StateObject` creates and owns an `ObservableObject` instance. Use it when a view is responsible for creating the object. SwiftUI ensures the object persists across view updates.

```swift
class DataModel: ObservableObject {
    @Published var name = "Some Name"
    @Published var isEnabled = false
}

struct MyView: View {
    @StateObject private var model = DataModel()

    var body: some View {
        VStack {
            Text(model.name)

            MySubView()
                .environmentObject(model)
        }
    }
}
```

A more complete example with a ViewModel:

```swift
class ProductViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    func fetchProducts() {
        isLoading = true
        errorMessage = nil

        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.products = [
                Product(id: UUID(), name: "iPhone", price: 999.00),
                Product(id: UUID(), name: "MacBook", price: 1999.00),
                Product(id: UUID(), name: "iPad", price: 799.00)
            ]
            self.isLoading = false
        }
    }

    func addProduct(_ product: Product) {
        products.append(product)
    }
}

struct Product: Identifiable {
    let id: UUID
    let name: String
    let price: Double
}

struct ProductListView: View {
    @StateObject private var viewModel = ProductViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView("Loading products...")
                } else if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                } else {
                    List(viewModel.products) { product in
                        ProductRow(product: product)
                    }
                }
            }
            .navigationTitle("Products")
            .onAppear {
                viewModel.fetchProducts()
            }
        }
    }
}

struct ProductRow: View {
    let product: Product

    var body: some View {
        HStack {
            Text(product.name)
            Spacer()
            Text("$\(product.price, specifier: "%.2f")")
                .foregroundColor(.secondary)
        }
    }
}
```

### @ObservedObject: External Observable Objects

`@ObservedObject` is used for `ObservableObject` instances passed into a view from outside. The view observes the object but does not own it.

```swift
class UserViewModel: ObservableObject {
    @Published var name = ""
    @Published var email = ""
    @Published var age = 0

    func reset() {
        name = ""
        email = ""
        age = 0
    }
}

struct UserProfileView: View {
    @ObservedObject var viewModel: UserViewModel

    var body: some View {
        Form {
            Section("Personal Information") {
                TextField("Name", text: $viewModel.name)
                TextField("Email", text: $viewModel.email)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                Stepper("Age: \(viewModel.age)", value: $viewModel.age, in: 0...120)
            }

            Section {
                Button("Reset", role: .destructive) {
                    viewModel.reset()
                }
            }
        }
    }
}

// Parent creates and owns the viewModel
struct ParentProfileView: View {
    @StateObject private var viewModel = UserViewModel()

    var body: some View {
        UserProfileView(viewModel: viewModel)
    }
}
```

**When to use @StateObject vs @ObservedObject:**
- `@StateObject`: View creates and owns the object
- `@ObservedObject`: Object is passed in from outside (parent creates it)

### @EnvironmentObject: Shared Data Across Views

`@EnvironmentObject` allows sharing data across many views without passing it explicitly through each view's initializer. Objects are injected into the environment and available to all descendant views.

```swift
class AppSettings: ObservableObject {
    @Published var isDarkMode = false
    @Published var fontSize: Double = 16
    @Published var language = "en"
    @Published var notificationsEnabled = true
}

@main
struct MyApp: App {
    @StateObject private var settings = AppSettings()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(settings)
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var settings: AppSettings

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Toggle("Dark Mode", isOn: $settings.isDarkMode)

                HStack {
                    Text("Font Size: \(Int(settings.fontSize))")
                    Slider(value: $settings.fontSize, in: 12...24)
                }

                NavigationLink("Go to Settings") {
                    SettingsDetailView()
                }
            }
            .padding()
            .navigationTitle("Home")
        }
    }
}

struct SettingsDetailView: View {
    @EnvironmentObject var settings: AppSettings

    var body: some View {
        Form {
            Section("Display") {
                Toggle("Dark Mode", isOn: $settings.isDarkMode)

                HStack {
                    Text("Font Size")
                    Slider(value: $settings.fontSize, in: 12...24)
                    Text("\(Int(settings.fontSize))")
                }
            }

            Section("Notifications") {
                Toggle("Enable Notifications", isOn: $settings.notificationsEnabled)
            }

            Section("Language") {
                Picker("Language", selection: $settings.language) {
                    Text("English").tag("en")
                    Text("Spanish").tag("es")
                    Text("French").tag("fr")
                }
            }
        }
        .navigationTitle("Settings")
    }
}
```

Access the shared object using the `$` operator for bindings:

```swift
struct MySubView: View {
    @EnvironmentObject var model: DataModel

    var body: some View {
        Toggle("Enabled", isOn: $model.isEnabled)
    }
}
```

### State Management Summary

| Property Wrapper | Use Case | Ownership |
|-----------------|----------|-----------|
| `@State` | Simple, local view state | View owns |
| `@Binding` | Two-way connection to parent state | Parent owns |
| `@StateObject` | View creates observable object | View owns |
| `@ObservedObject` | External observable object | Parent owns |
| `@EnvironmentObject` | Shared app-wide state | Ancestor owns |

## Navigation

### NavigationStack (iOS 16+)

`NavigationStack` is the modern navigation container that supports both simple and programmatic navigation:

```swift
struct NavigationExample: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink("Mint Color") {
                    ColorDetail(color: .mint, text: "Mint")
                }

                NavigationLink("Red Color") {
                    ColorDetail(color: .red, text: "Red")
                }

                NavigationLink("Blue Color") {
                    ColorDetail(color: .blue, text: "Blue")
                }
            }
            .navigationTitle("Colors")
        }
    }
}

struct ColorDetail: View {
    var color: Color
    var text: String

    var body: some View {
        VStack {
            Text(text)
                .font(.largeTitle)
                .fontWeight(.bold)

            color
                .frame(height: 200)
                .cornerRadius(12)
                .padding()
        }
        .navigationTitle(text)
        .navigationBarTitleDisplayMode(.inline)
    }
}
```

### Value-Based Navigation

Use `navigationDestination(for:destination:)` to define destinations based on data types:

```swift
struct Park: Hashable, Identifiable {
    let id = UUID()
    let name: String
    let state: String
    let established: Int
}

struct ParkListView: View {
    let parks = [
        Park(name: "Yellowstone", state: "Wyoming", established: 1872),
        Park(name: "Yosemite", state: "California", established: 1890),
        Park(name: "Grand Canyon", state: "Arizona", established: 1919)
    ]

    var body: some View {
        NavigationStack {
            List(parks) { park in
                NavigationLink(park.name, value: park)
            }
            .navigationTitle("National Parks")
            .navigationDestination(for: Park.self) { park in
                ParkDetailView(park: park)
            }
        }
    }
}

struct ParkDetailView: View {
    let park: Park

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text(park.name)
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("State: \(park.state)")
                .font(.title2)

            Text("Established: \(park.established)")
                .font(.title3)
                .foregroundColor(.secondary)

            Spacer()
        }
        .padding()
        .navigationBarTitleDisplayMode(.inline)
    }
}
```

### Programmatic Navigation with NavigationPath

Control navigation state programmatically using `NavigationPath`:

```swift
class NavigationManager: ObservableObject {
    @Published var path = NavigationPath()

    func navigateToColor(_ color: Color) {
        path.append(color)
    }

    func popToRoot() {
        path.removeLast(path.count)
    }

    func pop() {
        if !path.isEmpty {
            path.removeLast()
        }
    }
}

struct ProgrammaticNavigationExample: View {
    @StateObject private var navigationManager = NavigationManager()

    var body: some View {
        NavigationStack(path: $navigationManager.path) {
            VStack(spacing: 20) {
                Button("Go to Mint") {
                    navigationManager.navigateToColor(.mint)
                }

                Button("Go to Pink") {
                    navigationManager.navigateToColor(.pink)
                }
            }
            .navigationTitle("Home")
            .navigationDestination(for: Color.self) { color in
                VStack {
                    color
                        .frame(width: 200, height: 200)
                        .cornerRadius(12)

                    Button("Go Deeper") {
                        navigationManager.navigateToColor(.purple)
                    }

                    Button("Pop to Root") {
                        navigationManager.popToRoot()
                    }
                }
            }
        }
    }
}
```

### TabView

Create tabbed interfaces with `TabView`:

```swift
struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)

            SearchView()
                .tabItem {
                    Label("Search", systemImage: "magnifyingglass")
                }
                .tag(1)

            NotificationsView()
                .tabItem {
                    Label("Alerts", systemImage: "bell.fill")
                }
                .badge(5)
                .tag(2)

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(3)
        }
    }
}

struct HomeView: View {
    var body: some View {
        NavigationStack {
            Text("Home Content")
                .navigationTitle("Home")
        }
    }
}

struct SearchView: View {
    var body: some View {
        NavigationStack {
            Text("Search Content")
                .navigationTitle("Search")
        }
    }
}

struct NotificationsView: View {
    var body: some View {
        NavigationStack {
            Text("Notifications")
                .navigationTitle("Alerts")
        }
    }
}

struct ProfileView: View {
    var body: some View {
        NavigationStack {
            Text("Profile Content")
                .navigationTitle("Profile")
        }
    }
}
```

### Modal Presentations

Present content modally using sheets and full-screen covers:

```swift
struct ModalExample: View {
    @State private var showSheet = false
    @State private var showFullScreen = false
    @State private var selectedItem: Item?

    struct Item: Identifiable {
        let id = UUID()
        let name: String
    }

    var body: some View {
        VStack(spacing: 20) {
            // Basic sheet
            Button("Show Sheet") {
                showSheet = true
            }
            .sheet(isPresented: $showSheet) {
                SheetContentView()
            }

            // Full screen cover
            Button("Show Full Screen") {
                showFullScreen = true
            }
            .fullScreenCover(isPresented: $showFullScreen) {
                FullScreenContentView()
            }

            // Sheet with item binding
            Button("Show Item Sheet") {
                selectedItem = Item(name: "Selected Item")
            }
            .sheet(item: $selectedItem) { item in
                ItemDetailSheet(item: item)
            }
        }
    }
}

struct SheetContentView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Text("Sheet Content")
                .navigationTitle("Sheet")
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") {
                            dismiss()
                        }
                    }
                }
        }
    }
}

struct FullScreenContentView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 20) {
                Text("Full Screen Content")
                    .font(.largeTitle)
                    .foregroundColor(.white)

                Button("Dismiss") {
                    dismiss()
                }
                .foregroundColor(.white)
            }
        }
    }
}

struct ItemDetailSheet: View {
    let item: ModalExample.Item
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack {
            Text(item.name)
                .font(.title)

            Button("Close") {
                dismiss()
            }
        }
    }
}
```

## Lists and Dynamic Content

### Basic List

```swift
struct SimpleListView: View {
    let fruits = ["Apple", "Banana", "Cherry", "Date", "Elderberry"]

    var body: some View {
        NavigationStack {
            List(fruits, id: \.self) { fruit in
                Text(fruit)
            }
            .navigationTitle("Fruits")
        }
    }
}
```

### ForEach for Dynamic Content

Use `ForEach` to create views from collections:

```swift
struct ForEachExample: View {
    let colors: [Color] = [.red, .green, .blue, .orange, .purple]

    struct Person: Identifiable {
        let id = UUID()
        let name: String
        let age: Int
    }

    let people = [
        Person(name: "Alice", age: 30),
        Person(name: "Bob", age: 25),
        Person(name: "Charlie", age: 35)
    ]

    var body: some View {
        VStack(spacing: 30) {
            // ForEach with range
            HStack {
                ForEach(0..<5, id: \.self) { index in
                    Circle()
                        .fill(colors[index])
                        .frame(width: 40, height: 40)
                }
            }

            // ForEach with Identifiable items
            VStack(alignment: .leading) {
                ForEach(people) { person in
                    HStack {
                        Text(person.name)
                            .font(.headline)
                        Spacer()
                        Text("Age: \(person.age)")
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding()
    }
}
```

### List with Sections

```swift
struct SectionedListView: View {
    struct Category: Identifiable {
        let id = UUID()
        let name: String
        let items: [String]
    }

    let categories = [
        Category(name: "Fruits", items: ["Apple", "Banana", "Cherry"]),
        Category(name: "Vegetables", items: ["Carrot", "Broccoli", "Spinach"]),
        Category(name: "Grains", items: ["Rice", "Wheat", "Oats"])
    ]

    var body: some View {
        NavigationStack {
            List {
                ForEach(categories) { category in
                    Section(category.name) {
                        ForEach(category.items, id: \.self) { item in
                            Text(item)
                        }
                    }
                }
            }
            .navigationTitle("Groceries")
            .listStyle(.insetGrouped)
        }
    }
}
```

### Editable Lists

Support adding, deleting, and reordering items:

```swift
struct EditableListView: View {
    @State private var tasks = ["Task 1", "Task 2", "Task 3", "Task 4"]
    @State private var newTask = ""

    var body: some View {
        NavigationStack {
            VStack {
                HStack {
                    TextField("New task", text: $newTask)
                        .textFieldStyle(.roundedBorder)

                    Button("Add") {
                        guard !newTask.isEmpty else { return }
                        withAnimation {
                            tasks.append(newTask)
                            newTask = ""
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(newTask.isEmpty)
                }
                .padding()

                List {
                    ForEach(tasks, id: \.self) { task in
                        Text(task)
                    }
                    .onDelete(perform: deleteTasks)
                    .onMove(perform: moveTasks)
                }
            }
            .navigationTitle("Tasks")
            .toolbar {
                EditButton()
            }
        }
    }

    func deleteTasks(at offsets: IndexSet) {
        withAnimation {
            tasks.remove(atOffsets: offsets)
        }
    }

    func moveTasks(from source: IndexSet, to destination: Int) {
        withAnimation {
            tasks.move(fromOffsets: source, toOffset: destination)
        }
    }
}
```

### Custom List Rows

```swift
struct Contact: Identifiable {
    let id = UUID()
    let name: String
    let email: String
    let phone: String
    let avatarColor: Color
}

struct ContactListView: View {
    let contacts = [
        Contact(name: "John Doe", email: "john@example.com", phone: "555-1234", avatarColor: .blue),
        Contact(name: "Jane Smith", email: "jane@example.com", phone: "555-5678", avatarColor: .green),
        Contact(name: "Bob Johnson", email: "bob@example.com", phone: "555-9012", avatarColor: .orange)
    ]

    var body: some View {
        NavigationStack {
            List(contacts) { contact in
                ContactRow(contact: contact)
            }
            .navigationTitle("Contacts")
        }
    }
}

struct ContactRow: View {
    let contact: Contact

    var body: some View {
        HStack(spacing: 15) {
            Circle()
                .fill(contact.avatarColor)
                .frame(width: 50, height: 50)
                .overlay(
                    Text(String(contact.name.prefix(1)))
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(contact.name)
                    .font(.headline)

                Text(contact.email)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Text(contact.phone)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }
}
```

### Searchable Lists

Add search functionality using the `.searchable` modifier:

```swift
struct SearchableListView: View {
    let allItems = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry",
                    "Cranberry", "Date", "Elderberry", "Fig", "Grape",
                    "Honeydew", "Kiwi", "Lemon", "Mango", "Orange"]

    @State private var searchText = ""

    var filteredItems: [String] {
        if searchText.isEmpty {
            return allItems
        } else {
            return allItems.filter { $0.localizedCaseInsensitiveContains(searchText) }
        }
    }

    var body: some View {
        NavigationStack {
            List(filteredItems, id: \.self) { item in
                Text(item)
            }
            .navigationTitle("Fruits")
            .searchable(text: $searchText, prompt: "Search fruits")
        }
    }
}
```

### Lazy Stacks for Performance

Use `LazyVStack` and `LazyHStack` for large collections:

```swift
struct LazyStackExample: View {
    let items = Array(1...1000)

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 10) {
                ForEach(items, id: \.self) { item in
                    Text("Item \(item)")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                }
            }
            .padding()
        }
    }
}
```

## Forms and User Input

### Basic Form

```swift
struct RegistrationForm: View {
    @State private var username = ""
    @State private var email = ""
    @State private var password = ""
    @State private var birthDate = Date()
    @State private var receiveNewsletter = false
    @State private var selectedCountry = "USA"
    @State private var accountType = 0

    let countries = ["USA", "Canada", "UK", "Australia", "Germany", "France", "Japan"]
    let accountTypes = ["Personal", "Business", "Enterprise"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Account Information") {
                    TextField("Username", text: $username)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    TextField("Email", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)

                    SecureField("Password", text: $password)
                }

                Section("Personal Details") {
                    DatePicker("Birth Date",
                              selection: $birthDate,
                              displayedComponents: .date)

                    Picker("Country", selection: $selectedCountry) {
                        ForEach(countries, id: \.self) { country in
                            Text(country).tag(country)
                        }
                    }
                }

                Section("Account Type") {
                    Picker("Type", selection: $accountType) {
                        ForEach(0..<accountTypes.count, id: \.self) { index in
                            Text(accountTypes[index])
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section {
                    Toggle("Receive Newsletter", isOn: $receiveNewsletter)
                }

                Section {
                    Button("Create Account") {
                        createAccount()
                    }
                    .frame(maxWidth: .infinity)
                    .disabled(!isFormValid)
                }
            }
            .navigationTitle("Registration")
        }
    }

    var isFormValid: Bool {
        !username.isEmpty && !email.isEmpty && !password.isEmpty && password.count >= 6
    }

    func createAccount() {
        print("Creating account for \(username)")
    }
}
```

### Form Validation

```swift
struct ValidatedFormExample: View {
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""

    var emailError: String? {
        if email.isEmpty { return nil }
        let emailRegex = #"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
        let isValid = email.range(of: emailRegex, options: .regularExpression) != nil
        return isValid ? nil : "Invalid email format"
    }

    var passwordError: String? {
        if password.isEmpty { return nil }
        if password.count < 8 { return "Password must be at least 8 characters" }
        return nil
    }

    var confirmPasswordError: String? {
        if confirmPassword.isEmpty { return nil }
        return password == confirmPassword ? nil : "Passwords do not match"
    }

    var isFormValid: Bool {
        !email.isEmpty &&
        !password.isEmpty &&
        !confirmPassword.isEmpty &&
        emailError == nil &&
        passwordError == nil &&
        confirmPasswordError == nil
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)

                    if let error = emailError {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }

                Section {
                    SecureField("Password", text: $password)

                    if let error = passwordError {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }

                    SecureField("Confirm Password", text: $confirmPassword)

                    if let error = confirmPasswordError {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }

                Section {
                    Button("Submit") {
                        // Handle submission
                    }
                    .disabled(!isFormValid)
                }
            }
            .navigationTitle("Sign Up")
        }
    }
}
```

### Picker Styles

```swift
struct PickerStylesExample: View {
    @State private var selectedFruit = "Apple"
    @State private var selectedColor = "Red"
    @State private var selectedSize = 1

    let fruits = ["Apple", "Banana", "Cherry", "Date"]
    let colors = ["Red", "Green", "Blue", "Yellow"]

    var body: some View {
        Form {
            Section("Default Picker") {
                Picker("Fruit", selection: $selectedFruit) {
                    ForEach(fruits, id: \.self) { Text($0) }
                }
            }

            Section("Segmented Picker") {
                Picker("Color", selection: $selectedColor) {
                    ForEach(colors, id: \.self) { Text($0) }
                }
                .pickerStyle(.segmented)
            }

            Section("Wheel Picker") {
                Picker("Size", selection: $selectedSize) {
                    ForEach(1...10, id: \.self) { Text("Size \($0)") }
                }
                .pickerStyle(.wheel)
                .frame(height: 100)
            }

            Section("Inline Picker") {
                Picker("Fruit", selection: $selectedFruit) {
                    ForEach(fruits, id: \.self) { Text($0) }
                }
                .pickerStyle(.inline)
            }
        }
    }
}
```

## Best Practices

### View Composition

Break complex views into smaller, focused components:

```swift
// Avoid: Large monolithic views
struct BadProductView: View {
    var body: some View {
        // Hundreds of lines of code...
    }
}

// Prefer: Composed smaller views
struct ProductView: View {
    let product: Product

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ProductImageSection(imageURL: product.imageURL)
            ProductInfoSection(product: product)
            ProductPriceSection(price: product.price)
            AddToCartButton(product: product)
        }
        .padding()
        .cardStyle()
    }
}
```

### Proper State Ownership

Choose the right property wrapper for your use case:

```swift
struct StateOwnershipExample: View {
    // Local UI state - use @State
    @State private var isExpanded = false

    // View creates the object - use @StateObject
    @StateObject private var viewModel = MyViewModel()

    // Object passed from parent - use @ObservedObject
    // @ObservedObject var externalModel: SomeModel

    // Shared app state - use @EnvironmentObject
    @EnvironmentObject var settings: AppSettings

    var body: some View {
        // ...
    }
}
```

### Performance Optimization

```swift
struct PerformanceExample: View {
    let items: [Item]

    var body: some View {
        ScrollView {
            // Use LazyVStack for large lists
            LazyVStack(spacing: 10) {
                ForEach(items) { item in
                    ItemRow(item: item)
                }
            }
        }
    }
}

// Extract expensive computations
struct ExpensiveView: View {
    let data: [DataPoint]

    // Cache computed values
    private var processedData: [ProcessedPoint] {
        data.map { ProcessedPoint(from: $0) }
    }

    var body: some View {
        ForEach(processedData) { point in
            PointView(point: point)
        }
    }
}
```

### Error Handling Pattern

```swift
enum LoadingState<T> {
    case idle
    case loading
    case success(T)
    case failure(Error)
}

struct AsyncContentView<T, Content: View, Placeholder: View, ErrorView: View>: View {
    let state: LoadingState<T>
    let content: (T) -> Content
    let placeholder: () -> Placeholder
    let errorView: (Error) -> ErrorView

    var body: some View {
        switch state {
        case .idle:
            placeholder()
        case .loading:
            ProgressView()
        case .success(let data):
            content(data)
        case .failure(let error):
            errorView(error)
        }
    }
}

// Usage
struct DataView: View {
    @State private var loadingState: LoadingState<[String]> = .idle

    var body: some View {
        AsyncContentView(
            state: loadingState,
            content: { items in
                List(items, id: \.self) { Text($0) }
            },
            placeholder: {
                Button("Load Data") { loadData() }
            },
            errorView: { error in
                VStack {
                    Text("Error: \(error.localizedDescription)")
                    Button("Retry") { loadData() }
                }
            }
        )
    }

    func loadData() {
        loadingState = .loading
        // Perform async operation...
    }
}
```

### Accessibility

```swift
struct AccessibleView: View {
    @State private var isLiked = false

    var body: some View {
        VStack {
            // Provide accessibility labels
            Image(systemName: isLiked ? "heart.fill" : "heart")
                .foregroundColor(isLiked ? .red : .gray)
                .accessibilityLabel(isLiked ? "Liked" : "Not liked")

            // Combine related elements
            HStack {
                Text("Rating:")
                Text("4.5 stars")
            }
            .accessibilityElement(children: .combine)

            // Add hints for interactive elements
            Button("Submit") {
                // Action
            }
            .accessibilityHint("Submits the form and creates your account")

            // Support Dynamic Type
            Text("Responsive Text")
                .font(.body)
                .dynamicTypeSize(...DynamicTypeSize.accessibility3)
        }
    }
}
```

### Preview Provider Best Practices

```swift
struct UserCard_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Default preview
            UserCard(user: .preview)
                .previewDisplayName("Default")

            // Dark mode
            UserCard(user: .preview)
                .preferredColorScheme(.dark)
                .previewDisplayName("Dark Mode")

            // Large text
            UserCard(user: .preview)
                .environment(\.sizeCategory, .accessibilityLarge)
                .previewDisplayName("Large Text")

            // Different device
            UserCard(user: .preview)
                .previewDevice("iPhone SE (3rd generation)")
                .previewDisplayName("iPhone SE")
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}

// Preview data extension
extension User {
    static var preview: User {
        User(name: "John Doe", email: "john@example.com")
    }
}
```

## Conclusion

SwiftUI represents a modern, powerful approach to building user interfaces across Apple platforms. Key takeaways from this guide:

1. **Declarative Paradigm**: Describe what the UI should look like, and SwiftUI handles the how
2. **State Management**: Choose the appropriate property wrapper (`@State`, `@Binding`, `@StateObject`, `@ObservedObject`, `@EnvironmentObject`) based on data ownership and scope
3. **View Composition**: Build complex UIs from small, focused, reusable components
4. **Modifiers**: Chain modifiers to style and transform views declaratively
5. **Navigation**: Use `NavigationStack` for modern, flexible navigation with programmatic control
6. **Lists**: Leverage `List`, `ForEach`, and lazy stacks for efficient dynamic content display
7. **Forms**: Create data entry interfaces with built-in validation support

SwiftUI continues to evolve with each platform release, adding new features and improving performance. The framework's declarative nature, combined with Swift's type safety and expressiveness, makes it an excellent choice for building modern applications across iOS, macOS, watchOS, and tvOS.

## Further Resources

- [Apple's SwiftUI Documentation](https://developer.apple.com/documentation/swiftui/)
- [SwiftUI Tutorials by Apple](https://developer.apple.com/tutorials/swiftui)
- [Hacking with Swift - SwiftUI](https://www.hackingwithswift.com/quick-start/swiftui)
- [Swift by Sundell - SwiftUI Articles](https://www.swiftbysundell.com/tags/swiftui/)
- [WWDC Videos on SwiftUI](https://developer.apple.com/videos/swiftui)

---

*Last updated: January 7, 2026*
