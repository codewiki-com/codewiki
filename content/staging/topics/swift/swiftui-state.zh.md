---
title: SwiftUI 状态管理完全指南
description: 深入理解SwiftUI状态管理机制，包括@State、@Binding、@ObservedObject、@StateObject、@EnvironmentObject和@Published的原理与最佳实践
track: swift
section: swiftui
difficulty: intermediate
tags:
  - Swift
  - SwiftUI
  - 状态管理
  - 响应式编程
status: imported
origin: old/src/content/docs/swift/swiftui-state.zh.md
divergence: 0.186
issues:
  - title-lang-en
  - title-language
legacy:
  category: Swift
  subcategory: SwiftUI
  order: 5
  lastUpdated: 2026-01-07
---

状态管理是 SwiftUI 应用开发的核心。SwiftUI 采用数据驱动的声明式编程范式，通过一套精心设计的属性包装器实现视图与数据的自动同步。本文将深入剖析 SwiftUI 中的各种状态管理机制，帮助你构建响应式、可维护的 iOS 应用。

## 概念解释

### 什么是状态管理

在传统的 UIKit 开发中，开发者需要手动同步 UI 与数据状态。当数据发生变化时，必须显式地更新对应的 UI 元素。这种命令式的方式容易导致状态不一致和难以追踪的 Bug。

SwiftUI 引入了响应式编程模型：**当状态改变时，视图自动重新渲染**。开发者只需声明视图与状态之间的关系，框架自动处理更新逻辑。

```swift
// UIKit：手动同步状态与UI
class CounterViewController: UIViewController {
    var count = 0 {
        didSet {
            countLabel.text = "\(count)"  // 手动更新UI
        }
    }
    @IBOutlet weak var countLabel: UILabel!
}

// SwiftUI：声明式绑定，自动同步
struct CounterView: View {
    @State private var count = 0

    var body: some View {
        Text("\(count)")  // 状态改变时自动更新
    }
}
```

### 状态管理属性包装器概览

SwiftUI 提供了多个属性包装器来处理不同场景的状态管理：

| 属性包装器 | 数据所有权 | 数据类型 | 使用场景 |
|-----------|-----------|---------|---------|
| `@State` | 视图拥有 | 值类型 | 视图内部的简单状态 |
| `@Binding` | 外部拥有 | 值类型 | 子视图读写父视图的状态 |
| `@StateObject` | 视图拥有 | 引用类型(ObservableObject) | 视图创建并拥有的可观察对象 |
| `@ObservedObject` | 外部拥有 | 引用类型(ObservableObject) | 外部传入的可观察对象 |
| `@EnvironmentObject` | 环境拥有 | 引用类型(ObservableObject) | 跨多层视图共享的状态 |
| `@Published` | 对象拥有 | 任意类型 | ObservableObject 中需要触发更新的属性 |

## 核心原理

### SwiftUI 的视图更新机制

SwiftUI 视图是**值类型**（结构体），每次状态改变都会创建新的视图实例。但这不意味着整个 UI 会重建——SwiftUI 使用**差异算法**只更新实际变化的部分。

```swift
struct ContentView: View {
    @State private var count = 0

    var body: some View {
        VStack {
            Text("计数器")        // 静态内容，不会重建
            Text("\(count)")     // 依赖状态，状态变化时更新
            Button("增加") {
                count += 1       // 触发状态变化
            }
        }
    }
}
```

状态变化时的更新流程：

1. 状态（`count`）发生改变
2. SwiftUI 检测到 `@State` 包装的值变化
3. 调用 `body` 属性获取新的视图描述
4. 将新视图与旧视图进行差异比较
5. 只更新实际变化的 UI 元素

### 属性包装器的本质

属性包装器是 Swift 5.1 引入的特性，它将属性的存储和访问逻辑封装到一个类型中。以 `@State` 为例：

```swift
// @State 的简化实现原理
@propertyWrapper
struct State<Value> {
    private var storage: Value

    var wrappedValue: Value {
        get { storage }
        nonmutating set {
            storage = newValue
            // 通知 SwiftUI 重新渲染
        }
    }

    var projectedValue: Binding<Value> {
        Binding(
            get: { wrappedValue },
            set: { wrappedValue = $0 }
        )
    }
}
```

关键点：
- `wrappedValue`：访问属性时实际获取和设置的值
- `projectedValue`：通过 `$` 前缀访问的投影值（对于 `@State` 是 `Binding`）
- `nonmutating set`：允许在结构体中修改存储，因为实际存储在 SwiftUI 管理的内存中

## 核心要点

### @State：视图内部状态

`@State` 用于管理视图内部的简单值类型状态。SwiftUI 在视图生命周期内为 `@State` 属性分配持久化存储。

**核心特性：**
- 只能用于值类型（`Int`、`String`、`Bool`、结构体等）
- 应该标记为 `private`，因为状态归视图所有
- 状态存储在视图外部，视图重建时状态保持

```swift
struct ToggleExample: View {
    @State private var isOn = false
    @State private var sliderValue = 0.5
    @State private var username = ""

    var body: some View {
        Form {
            Toggle("开关", isOn: $isOn)
            Slider(value: $sliderValue)
            TextField("用户名", text: $username)
        }
    }
}
```

### @Binding：双向数据绑定

`@Binding` 创建对其他视图拥有的状态的引用，实现父子视图间的双向数据流。

**核心特性：**
- 不拥有数据，只是对外部数据的引用
- 修改 `@Binding` 会更新原始数据源
- 通过 `$` 前缀从 `@State` 获取 `Binding`

```swift
struct ParentView: View {
    @State private var isPlaying = false

    var body: some View {
        VStack {
            Text(isPlaying ? "正在播放" : "已暂停")
            PlayButton(isPlaying: $isPlaying)  // 传递Binding
        }
    }
}

struct PlayButton: View {
    @Binding var isPlaying: Bool  // 接收Binding

    var body: some View {
        Button(isPlaying ? "暂停" : "播放") {
            isPlaying.toggle()  // 修改会反映到父视图
        }
    }
}
```

### @Published：可观察属性

`@Published` 用于 `ObservableObject` 类中，标记需要触发视图更新的属性。

**核心特性：**
- 只能用于类的属性
- 属性变化时自动发送通知
- 使用 Combine 框架的 Publisher 机制

```swift
class UserSettings: ObservableObject {
    @Published var username = ""
    @Published var notificationsEnabled = true
    @Published var fontSize: Double = 14.0

    // 非 @Published 属性变化不会触发视图更新
    var lastLoginDate: Date?
}
```

### @StateObject：创建可观察对象

`@StateObject` 用于在视图中创建并拥有 `ObservableObject` 实例。SwiftUI 保证对象只创建一次，且在视图生命周期内保持存活。

**核心特性：**
- 对象只在视图首次创建时实例化一次
- 视图重建时对象保持不变
- 适用于视图拥有的复杂状态或业务逻辑

```swift
class TimerManager: ObservableObject {
    @Published var secondsElapsed = 0
    private var timer: Timer?

    func start() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.secondsElapsed += 1
        }
    }

    func stop() {
        timer?.invalidate()
        timer = nil
    }

    deinit {
        stop()
        print("TimerManager 被释放")
    }
}

struct TimerView: View {
    @StateObject private var timerManager = TimerManager()

    var body: some View {
        VStack {
            Text("已过 \(timerManager.secondsElapsed) 秒")
            HStack {
                Button("开始") { timerManager.start() }
                Button("停止") { timerManager.stop() }
            }
        }
    }
}
```

### @ObservedObject：观察外部对象

`@ObservedObject` 用于观察从外部传入的 `ObservableObject`。与 `@StateObject` 不同，它不拥有对象的生命周期。

**核心特性：**
- 不负责创建对象，只负责观察
- 对象必须从外部注入
- 视图重建时不会重新创建对象（因为对象在外部管理）

```swift
class BookStore: ObservableObject {
    @Published var books: [Book] = []

    func addBook(_ book: Book) {
        books.append(book)
    }
}

struct BookListView: View {
    @ObservedObject var store: BookStore  // 从外部接收

    var body: some View {
        List(store.books) { book in
            BookRowView(book: book)
        }
    }
}

// 父视图拥有并传递 BookStore
struct LibraryView: View {
    @StateObject private var bookStore = BookStore()

    var body: some View {
        NavigationStack {
            BookListView(store: bookStore)  // 传递给子视图
        }
    }
}
```

### @EnvironmentObject：环境级别共享

`@EnvironmentObject` 用于跨多层视图层级共享状态，避免逐层传递。

**核心特性：**
- 通过 `.environmentObject()` 修饰符注入
- 子视图自动继承父视图的环境对象
- 访问未注入的环境对象会导致运行时崩溃

```swift
class AppState: ObservableObject {
    @Published var currentUser: User?
    @Published var theme: AppTheme = .light
    @Published var language: Language = .chinese
}

struct RootView: View {
    @StateObject private var appState = AppState()

    var body: some View {
        ContentView()
            .environmentObject(appState)  // 注入环境
    }
}

struct ContentView: View {
    var body: some View {
        NavigationStack {
            SettingsView()  // 不需要显式传递 appState
        }
    }
}

struct SettingsView: View {
    @EnvironmentObject var appState: AppState  // 从环境获取

    var body: some View {
        Form {
            Section("用户信息") {
                if let user = appState.currentUser {
                    Text("欢迎，\(user.name)")
                }
            }
            Section("偏好设置") {
                Picker("主题", selection: $appState.theme) {
                    Text("浅色").tag(AppTheme.light)
                    Text("深色").tag(AppTheme.dark)
                }
            }
        }
    }
}
```

## 代码示例

### 完整的计数器示例

展示 `@State`、`@Binding` 和 `@ObservedObject` 的协作：

```swift
// MARK: - 数据模型
class CounterModel: ObservableObject {
    @Published var value = 0
    @Published var step = 1
    @Published var history: [Int] = []

    func increment() {
        value += step
        history.append(value)
    }

    func decrement() {
        value -= step
        history.append(value)
    }

    func reset() {
        value = 0
        history.removeAll()
    }
}

// MARK: - 主视图
struct CounterDemoView: View {
    @StateObject private var counter = CounterModel()
    @State private var showHistory = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // 显示当前值
                CounterDisplayView(value: counter.value)

                // 控制按钮
                CounterControlsView(counter: counter)

                // 步长设置
                StepperView(step: $counter.step)

                // 历史记录开关
                Toggle("显示历史", isOn: $showHistory)
                    .padding(.horizontal)

                if showHistory {
                    HistoryListView(history: counter.history)
                }

                Spacer()
            }
            .navigationTitle("计数器")
            .toolbar {
                Button("重置") {
                    counter.reset()
                }
            }
        }
    }
}

// MARK: - 显示组件
struct CounterDisplayView: View {
    let value: Int

    var body: some View {
        Text("\(value)")
            .font(.system(size: 72, weight: .bold, design: .rounded))
            .foregroundColor(value >= 0 ? .primary : .red)
            .contentTransition(.numericText())
            .animation(.spring, value: value)
    }
}

// MARK: - 控制组件
struct CounterControlsView: View {
    @ObservedObject var counter: CounterModel

    var body: some View {
        HStack(spacing: 40) {
            Button {
                counter.decrement()
            } label: {
                Image(systemName: "minus.circle.fill")
                    .font(.system(size: 48))
            }

            Button {
                counter.increment()
            } label: {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 48))
            }
        }
    }
}

// MARK: - 步长设置组件
struct StepperView: View {
    @Binding var step: Int

    var body: some View {
        HStack {
            Text("步长：")
            Stepper("\(step)", value: $step, in: 1...10)
        }
        .padding(.horizontal)
    }
}

// MARK: - 历史记录组件
struct HistoryListView: View {
    let history: [Int]

    var body: some View {
        List {
            ForEach(Array(history.enumerated()), id: \.offset) { index, value in
                HStack {
                    Text("第 \(index + 1) 次")
                    Spacer()
                    Text("\(value)")
                        .fontWeight(.medium)
                }
            }
        }
        .frame(maxHeight: 200)
    }
}
```

### 用户认证状态管理

使用 `@EnvironmentObject` 实现全局认证状态：

```swift
// MARK: - 认证状态
enum AuthenticationState {
    case unauthenticated
    case authenticating
    case authenticated(User)
    case error(String)
}

class AuthManager: ObservableObject {
    @Published var state: AuthenticationState = .unauthenticated
    @Published var isLoading = false

    var currentUser: User? {
        if case .authenticated(let user) = state {
            return user
        }
        return nil
    }

    var isAuthenticated: Bool {
        if case .authenticated = state {
            return true
        }
        return false
    }

    func login(email: String, password: String) async {
        await MainActor.run {
            state = .authenticating
            isLoading = true
        }

        do {
            // 模拟网络请求
            try await Task.sleep(nanoseconds: 1_500_000_000)

            let user = User(id: UUID(), name: "测试用户", email: email)
            await MainActor.run {
                state = .authenticated(user)
                isLoading = false
            }
        } catch {
            await MainActor.run {
                state = .error("登录失败")
                isLoading = false
            }
        }
    }

    func logout() {
        state = .unauthenticated
    }
}

// MARK: - 根视图
struct AuthDemoApp: View {
    @StateObject private var authManager = AuthManager()

    var body: some View {
        Group {
            switch authManager.state {
            case .unauthenticated, .error:
                LoginView()
            case .authenticating:
                ProgressView("登录中...")
            case .authenticated:
                MainTabView()
            }
        }
        .environmentObject(authManager)
    }
}

// MARK: - 登录视图
struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("邮箱", text: $email)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)

                    SecureField("密码", text: $password)
                        .textContentType(.password)
                }

                Section {
                    Button("登录") {
                        Task {
                            await authManager.login(email: email, password: password)
                        }
                    }
                    .disabled(email.isEmpty || password.isEmpty)
                }

                if case .error(let message) = authManager.state {
                    Section {
                        Text(message)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("登录")
        }
    }
}

// MARK: - 主界面
struct MainTabView: View {
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("首页", systemImage: "house")
                }

            ProfileView()
                .tabItem {
                    Label("个人", systemImage: "person")
                }
        }
    }
}

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        NavigationStack {
            List {
                if let user = authManager.currentUser {
                    Section("用户信息") {
                        LabeledContent("姓名", value: user.name)
                        LabeledContent("邮箱", value: user.email)
                    }
                }

                Section {
                    Button("退出登录", role: .destructive) {
                        authManager.logout()
                    }
                }
            }
            .navigationTitle("个人中心")
        }
    }
}
```

### 购物车状态管理

复杂业务场景的状态管理示例：

```swift
// MARK: - 数据模型
struct Product: Identifiable, Equatable {
    let id: UUID
    let name: String
    let price: Decimal
    let imageURL: URL?
}

struct CartItem: Identifiable, Equatable {
    let id: UUID
    let product: Product
    var quantity: Int

    var subtotal: Decimal {
        product.price * Decimal(quantity)
    }
}

// MARK: - 购物车管理器
class CartManager: ObservableObject {
    @Published private(set) var items: [CartItem] = []

    var totalAmount: Decimal {
        items.reduce(0) { $0 + $1.subtotal }
    }

    var itemCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }

    var isEmpty: Bool {
        items.isEmpty
    }

    func addProduct(_ product: Product) {
        if let index = items.firstIndex(where: { $0.product.id == product.id }) {
            items[index].quantity += 1
        } else {
            let item = CartItem(id: UUID(), product: product, quantity: 1)
            items.append(item)
        }
    }

    func removeProduct(_ product: Product) {
        items.removeAll { $0.product.id == product.id }
    }

    func updateQuantity(for item: CartItem, quantity: Int) {
        guard let index = items.firstIndex(where: { $0.id == item.id }) else { return }

        if quantity <= 0 {
            items.remove(at: index)
        } else {
            items[index].quantity = quantity
        }
    }

    func clear() {
        items.removeAll()
    }
}

// MARK: - 商品列表视图
struct ProductListView: View {
    @EnvironmentObject var cart: CartManager

    let products: [Product] = [
        Product(id: UUID(), name: "iPhone 15 Pro", price: 8999, imageURL: nil),
        Product(id: UUID(), name: "MacBook Pro", price: 14999, imageURL: nil),
        Product(id: UUID(), name: "AirPods Pro", price: 1899, imageURL: nil)
    ]

    var body: some View {
        NavigationStack {
            List(products) { product in
                ProductRowView(product: product)
            }
            .navigationTitle("商品列表")
            .toolbar {
                NavigationLink {
                    CartView()
                } label: {
                    CartBadgeView(count: cart.itemCount)
                }
            }
        }
    }
}

struct ProductRowView: View {
    let product: Product
    @EnvironmentObject var cart: CartManager

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(product.name)
                    .font(.headline)
                Text("¥\(product.price as NSDecimalNumber)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button {
                cart.addProduct(product)
            } label: {
                Image(systemName: "plus.circle.fill")
                    .font(.title2)
            }
        }
        .padding(.vertical, 8)
    }
}

struct CartBadgeView: View {
    let count: Int

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Image(systemName: "cart")

            if count > 0 {
                Text("\(min(count, 99))")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(4)
                    .background(Color.red)
                    .clipShape(Circle())
                    .offset(x: 8, y: -8)
            }
        }
    }
}

// MARK: - 购物车视图
struct CartView: View {
    @EnvironmentObject var cart: CartManager

    var body: some View {
        Group {
            if cart.isEmpty {
                ContentUnavailableView(
                    "购物车为空",
                    systemImage: "cart",
                    description: Text("去添加一些商品吧")
                )
            } else {
                List {
                    ForEach(cart.items) { item in
                        CartItemRow(item: item)
                    }
                    .onDelete { indexSet in
                        for index in indexSet {
                            cart.removeProduct(cart.items[index].product)
                        }
                    }

                    Section {
                        HStack {
                            Text("总计")
                                .font(.headline)
                            Spacer()
                            Text("¥\(cart.totalAmount as NSDecimalNumber)")
                                .font(.title2)
                                .fontWeight(.bold)
                        }
                    }
                }
            }
        }
        .navigationTitle("购物车")
        .toolbar {
            if !cart.isEmpty {
                Button("清空") {
                    cart.clear()
                }
            }
        }
    }
}

struct CartItemRow: View {
    let item: CartItem
    @EnvironmentObject var cart: CartManager

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(item.product.name)
                    .font(.headline)
                Text("¥\(item.product.price as NSDecimalNumber) x \(item.quantity)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            HStack(spacing: 12) {
                Button {
                    cart.updateQuantity(for: item, quantity: item.quantity - 1)
                } label: {
                    Image(systemName: "minus.circle")
                }

                Text("\(item.quantity)")
                    .frame(minWidth: 24)

                Button {
                    cart.updateQuantity(for: item, quantity: item.quantity + 1)
                } label: {
                    Image(systemName: "plus.circle")
                }
            }
        }
    }
}
```

## 最佳实践

### 选择正确的属性包装器

```swift
// 简单的本地状态 -> @State
struct SimpleView: View {
    @State private var text = ""
    @State private var isEnabled = false
    var body: some View { /* ... */ }
}

// 需要双向绑定 -> @Binding
struct ChildView: View {
    @Binding var value: Int
    var body: some View { /* ... */ }
}

// 视图创建的复杂对象 -> @StateObject
struct OwnerView: View {
    @StateObject private var viewModel = ViewModel()
    var body: some View { /* ... */ }
}

// 外部传入的对象 -> @ObservedObject
struct ObserverView: View {
    @ObservedObject var viewModel: ViewModel
    var body: some View { /* ... */ }
}

// 全局共享状态 -> @EnvironmentObject
struct GlobalView: View {
    @EnvironmentObject var appState: AppState
    var body: some View { /* ... */ }
}
```

### 保持 @State 为私有

```swift
// 正确：@State 标记为 private
struct CorrectView: View {
    @State private var count = 0
    var body: some View { Text("\(count)") }
}

// 错误：@State 暴露给外部
struct IncorrectView: View {
    @State var count = 0  // 编译器警告
    var body: some View { Text("\(count)") }
}
```

### 使用 MVVM 架构

将业务逻辑与视图分离，提高可测试性：

```swift
// ViewModel
class ProfileViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let userService: UserServiceProtocol

    init(userService: UserServiceProtocol = UserService()) {
        self.userService = userService
    }

    @MainActor
    func loadUser() async {
        isLoading = true
        errorMessage = nil

        do {
            user = try await userService.fetchCurrentUser()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

// View
struct ProfileView: View {
    @StateObject private var viewModel = ProfileViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
            } else if let user = viewModel.user {
                UserInfoView(user: user)
            } else if let error = viewModel.errorMessage {
                ErrorView(message: error)
            }
        }
        .task {
            await viewModel.loadUser()
        }
    }
}
```

### 合理拆分视图

将大视图拆分为小组件，提高可维护性和性能：

```swift
// 不推荐：单一庞大视图
struct MassiveView: View {
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    // 更多状态...

    var body: some View {
        Form {
            // 所有表单字段
            // 所有验证逻辑
            // 所有UI逻辑
        }
    }
}

// 推荐：拆分为小组件
struct RegistrationForm: View {
    @StateObject private var formState = RegistrationFormState()

    var body: some View {
        Form {
            NameSection(name: $formState.name)
            EmailSection(email: $formState.email)
            PasswordSection(password: $formState.password)
            SubmitButton(isValid: formState.isValid) {
                formState.submit()
            }
        }
    }
}

struct NameSection: View {
    @Binding var name: String
    var body: some View {
        Section("姓名") {
            TextField("请输入姓名", text: $name)
        }
    }
}
```

### 使用 @Environment 访问系统值

```swift
struct AdaptiveView: View {
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dynamicTypeSize) var typeSize
    @Environment(\.dismiss) var dismiss
    @Environment(\.openURL) var openURL

    var body: some View {
        VStack {
            Text("当前主题：\(colorScheme == .dark ? "深色" : "浅色")")

            Button("关闭") {
                dismiss()
            }

            Button("打开链接") {
                openURL(URL(string: "https://apple.com")!)
            }
        }
    }
}
```

## 常见陷阱

### @StateObject vs @ObservedObject 误用

```swift
// 错误：使用 @ObservedObject 创建对象
struct ProblematicView: View {
    // 每次父视图刷新时都会创建新实例！
    @ObservedObject var viewModel = ViewModel()

    var body: some View {
        Text(viewModel.data)
    }
}

// 正确：使用 @StateObject 创建对象
struct CorrectView: View {
    @StateObject private var viewModel = ViewModel()

    var body: some View {
        Text(viewModel.data)
    }
}
```

### 在视图外部修改 @State

```swift
struct BadExample: View {
    @State private var count = 0

    var body: some View {
        Button("点击") {
            // 错误：在异步上下文中直接访问可能有问题
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                count += 1  // 可能导致问题
            }
        }
    }
}

struct GoodExample: View {
    @State private var count = 0

    var body: some View {
        Button("点击") {
            // 推荐：使用 Task
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                count += 1
            }
        }
    }
}
```

### 忘记注入 EnvironmentObject

```swift
// 运行时崩溃！
struct CrashingApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()  // 没有注入 environmentObject
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var settings: AppSettings  // 崩溃！
    var body: some View { /* ... */ }
}

// 正确做法
struct CorrectApp: App {
    @StateObject private var settings = AppSettings()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(settings)
        }
    }
}
```

### ObservableObject 中的嵌套对象不触发更新

```swift
class Parent: ObservableObject {
    @Published var child = Child()  // child 的属性变化不会触发 Parent 更新
}

class Child: ObservableObject {
    @Published var value = 0
}

// 解决方案1：手动订阅
class Parent: ObservableObject {
    @Published var child = Child()
    private var cancellable: AnyCancellable?

    init() {
        cancellable = child.objectWillChange.sink { [weak self] _ in
            self?.objectWillChange.send()
        }
    }
}

// 解决方案2：使用 @Observable（iOS 17+）
@Observable
class ModernParent {
    var child = ModernChild()
}

@Observable
class ModernChild {
    var value = 0
}
```

### 在 body 中执行副作用

```swift
// 错误：在 body 中执行网络请求
struct BadView: View {
    @State private var data: [Item] = []

    var body: some View {
        // 这会在每次渲染时调用！
        let _ = loadData()  // 错误！

        List(data) { item in
            Text(item.name)
        }
    }

    func loadData() {
        // 网络请求...
    }
}

// 正确：使用 task 修饰符
struct GoodView: View {
    @State private var data: [Item] = []

    var body: some View {
        List(data) { item in
            Text(item.name)
        }
        .task {
            await loadData()
        }
    }

    func loadData() async {
        // 异步网络请求...
    }
}
```

## 性能考量

### 避免不必要的视图刷新

```swift
// 问题：整个视图因为无关状态变化而刷新
struct IneffientView: View {
    @StateObject private var viewModel = ViewModel()

    var body: some View {
        VStack {
            // 这部分只关心 title
            Text(viewModel.title)

            // 这部分只关心 items
            List(viewModel.items) { item in
                ItemRow(item: item)
            }
        }
    }
}

// 优化：拆分为独立视图
struct EfficientView: View {
    @StateObject private var viewModel = ViewModel()

    var body: some View {
        VStack {
            TitleView(viewModel: viewModel)
            ItemListView(viewModel: viewModel)
        }
    }
}

struct TitleView: View {
    @ObservedObject var viewModel: ViewModel

    var body: some View {
        Text(viewModel.title)
    }
}

struct ItemListView: View {
    @ObservedObject var viewModel: ViewModel

    var body: some View {
        List(viewModel.items) { item in
            ItemRow(item: item)
        }
    }
}
```

### 使用 EquatableView

```swift
// 自定义相等性检查，减少不必要的渲染
struct ExpensiveView: View, Equatable {
    let item: Item
    let onTap: () -> Void

    var body: some View {
        // 复杂的渲染逻辑
    }

    static func == (lhs: ExpensiveView, rhs: ExpensiveView) -> Bool {
        lhs.item.id == rhs.item.id
    }
}

// 使用方式
ExpensiveView(item: item, onTap: { })
    .equatable()
```

### @Published 属性的精细化

```swift
// 不推荐：大对象作为 Published
class ViewModel: ObservableObject {
    @Published var state: AppState  // 任何改变都触发更新
}

// 推荐：细粒度的 Published 属性
class ViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var items: [Item] = []
    @Published var errorMessage: String?
}
```

### 使用 @Observable（iOS 17+）

`@Observable` 宏提供了更精细的依赖追踪：

```swift
// 传统方式：整个对象变化都触发更新
class OldViewModel: ObservableObject {
    @Published var name = ""
    @Published var age = 0
}

// iOS 17+：只追踪实际使用的属性
@Observable
class NewViewModel {
    var name = ""
    var age = 0
}

struct SmartView: View {
    var viewModel: NewViewModel

    var body: some View {
        // 只有 name 变化时才重新渲染
        Text(viewModel.name)
    }
}
```

## 实战场景

### 场景1：表单验证

```swift
class FormValidator: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var confirmPassword = ""

    var isEmailValid: Bool {
        email.contains("@") && email.contains(".")
    }

    var isPasswordValid: Bool {
        password.count >= 8
    }

    var doPasswordsMatch: Bool {
        password == confirmPassword && !password.isEmpty
    }

    var isFormValid: Bool {
        isEmailValid && isPasswordValid && doPasswordsMatch
    }

    var emailError: String? {
        email.isEmpty ? nil : (isEmailValid ? nil : "请输入有效的邮箱地址")
    }

    var passwordError: String? {
        password.isEmpty ? nil : (isPasswordValid ? nil : "密码至少需要8个字符")
    }

    var confirmPasswordError: String? {
        confirmPassword.isEmpty ? nil : (doPasswordsMatch ? nil : "两次密码不一致")
    }
}

struct RegistrationView: View {
    @StateObject private var validator = FormValidator()
    @State private var showSuccessAlert = false

    var body: some View {
        Form {
            Section {
                TextField("邮箱", text: $validator.email)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)

                if let error = validator.emailError {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }

            Section {
                SecureField("密码", text: $validator.password)
                    .textContentType(.newPassword)

                if let error = validator.passwordError {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }

                SecureField("确认密码", text: $validator.confirmPassword)

                if let error = validator.confirmPasswordError {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }

            Section {
                Button("注册") {
                    showSuccessAlert = true
                }
                .disabled(!validator.isFormValid)
            }
        }
        .alert("注册成功", isPresented: $showSuccessAlert) {
            Button("确定", role: .cancel) { }
        }
    }
}
```

### 场景2：分页加载列表

```swift
class PaginatedListViewModel: ObservableObject {
    @Published private(set) var items: [Item] = []
    @Published private(set) var isLoading = false
    @Published private(set) var hasMorePages = true

    private var currentPage = 0
    private let pageSize = 20

    @MainActor
    func loadInitial() async {
        guard !isLoading else { return }

        currentPage = 0
        isLoading = true

        do {
            items = try await fetchPage(0)
            hasMorePages = items.count >= pageSize
        } catch {
            // 处理错误
        }

        isLoading = false
    }

    @MainActor
    func loadMore() async {
        guard !isLoading && hasMorePages else { return }

        isLoading = true
        currentPage += 1

        do {
            let newItems = try await fetchPage(currentPage)
            items.append(contentsOf: newItems)
            hasMorePages = newItems.count >= pageSize
        } catch {
            currentPage -= 1
        }

        isLoading = false
    }

    private func fetchPage(_ page: Int) async throws -> [Item] {
        // 网络请求...
        try await Task.sleep(nanoseconds: 500_000_000)
        return (0..<pageSize).map { Item(id: UUID(), name: "Item \(page * pageSize + $0)") }
    }
}

struct PaginatedListView: View {
    @StateObject private var viewModel = PaginatedListViewModel()

    var body: some View {
        List {
            ForEach(viewModel.items) { item in
                Text(item.name)
                    .onAppear {
                        if item == viewModel.items.last {
                            Task {
                                await viewModel.loadMore()
                            }
                        }
                    }
            }

            if viewModel.isLoading {
                HStack {
                    Spacer()
                    ProgressView()
                    Spacer()
                }
            }
        }
        .refreshable {
            await viewModel.loadInitial()
        }
        .task {
            await viewModel.loadInitial()
        }
    }
}
```

### 场景3：多步骤向导

```swift
enum WizardStep: Int, CaseIterable {
    case personalInfo
    case contactInfo
    case confirmation

    var title: String {
        switch self {
        case .personalInfo: return "个人信息"
        case .contactInfo: return "联系方式"
        case .confirmation: return "确认"
        }
    }
}

class WizardState: ObservableObject {
    @Published var currentStep: WizardStep = .personalInfo
    @Published var name = ""
    @Published var age = ""
    @Published var email = ""
    @Published var phone = ""

    var canProceed: Bool {
        switch currentStep {
        case .personalInfo:
            return !name.isEmpty && !age.isEmpty
        case .contactInfo:
            return !email.isEmpty
        case .confirmation:
            return true
        }
    }

    func next() {
        guard let currentIndex = WizardStep.allCases.firstIndex(of: currentStep),
              currentIndex < WizardStep.allCases.count - 1 else { return }
        currentStep = WizardStep.allCases[currentIndex + 1]
    }

    func previous() {
        guard let currentIndex = WizardStep.allCases.firstIndex(of: currentStep),
              currentIndex > 0 else { return }
        currentStep = WizardStep.allCases[currentIndex - 1]
    }

    func submit() {
        // 提交数据
    }
}

struct WizardView: View {
    @StateObject private var state = WizardState()

    var body: some View {
        NavigationStack {
            VStack {
                // 进度指示器
                ProgressView(value: Double(state.currentStep.rawValue + 1),
                           total: Double(WizardStep.allCases.count))
                    .padding()

                // 当前步骤内容
                Group {
                    switch state.currentStep {
                    case .personalInfo:
                        PersonalInfoStep(state: state)
                    case .contactInfo:
                        ContactInfoStep(state: state)
                    case .confirmation:
                        ConfirmationStep(state: state)
                    }
                }
                .padding()

                Spacer()

                // 导航按钮
                HStack {
                    if state.currentStep != .personalInfo {
                        Button("上一步") {
                            state.previous()
                        }
                    }

                    Spacer()

                    if state.currentStep == .confirmation {
                        Button("提交") {
                            state.submit()
                        }
                        .buttonStyle(.borderedProminent)
                    } else {
                        Button("下一步") {
                            state.next()
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(!state.canProceed)
                    }
                }
                .padding()
            }
            .navigationTitle(state.currentStep.title)
        }
    }
}

struct PersonalInfoStep: View {
    @ObservedObject var state: WizardState

    var body: some View {
        Form {
            TextField("姓名", text: $state.name)
            TextField("年龄", text: $state.age)
                .keyboardType(.numberPad)
        }
    }
}

struct ContactInfoStep: View {
    @ObservedObject var state: WizardState

    var body: some View {
        Form {
            TextField("邮箱", text: $state.email)
                .textContentType(.emailAddress)
            TextField("电话", text: $state.phone)
                .textContentType(.telephoneNumber)
        }
    }
}

struct ConfirmationStep: View {
    @ObservedObject var state: WizardState

    var body: some View {
        List {
            LabeledContent("姓名", value: state.name)
            LabeledContent("年龄", value: state.age)
            LabeledContent("邮箱", value: state.email)
            LabeledContent("电话", value: state.phone.isEmpty ? "未填写" : state.phone)
        }
    }
}
```

## 面试要点

### 高频面试题

**1. @State 和 @StateObject 有什么区别？**

答：
- `@State` 用于值类型的简单状态，SwiftUI 自动管理其存储
- `@StateObject` 用于引用类型（ObservableObject），视图拥有其生命周期
- `@State` 适合布尔值、字符串等简单类型
- `@StateObject` 适合复杂对象、ViewModel 等

**2. @StateObject 和 @ObservedObject 如何选择？**

答：
- `@StateObject`：视图创建并拥有对象时使用
- `@ObservedObject`：对象从外部传入时使用
- 关键区别：`@StateObject` 保证对象只创建一次，`@ObservedObject` 每次视图重建都可能指向新对象

**3. @EnvironmentObject 和参数传递有什么优缺点？**

答：
优点：
- 避免逐层传递（prop drilling）
- 代码更简洁

缺点：
- 依赖关系不明显
- 忘记注入会导致运行时崩溃
- 降低组件的可复用性

**4. 为什么 @State 要标记为 private？**

答：
- `@State` 表示视图拥有的状态，外部不应直接访问
- 如果外部需要修改，应该使用 `@Binding`
- 暴露 `@State` 可能导致意外的状态修改和难以追踪的 Bug

**5. 如何在 ObservableObject 中处理异步操作？**

答：
```swift
class ViewModel: ObservableObject {
    @Published var data: [Item] = []
    @Published var isLoading = false

    @MainActor
    func loadData() async {
        isLoading = true
        defer { isLoading = false }

        do {
            data = try await api.fetchItems()
        } catch {
            // 处理错误
        }
    }
}
```

**6. SwiftUI 中的 @Observable 宏与 ObservableObject 有什么区别？**

答：
- `@Observable`（iOS 17+）使用宏实现，更简洁
- 自动追踪属性依赖，只在实际使用的属性变化时更新视图
- 不需要 `@Published`，所有 `var` 属性自动可观察
- 性能更好，减少不必要的视图更新

### 代码题

**实现一个带有撤销功能的计数器：**

```swift
class UndoableCounter: ObservableObject {
    @Published private(set) var value = 0
    private var history: [Int] = [0]
    private var historyIndex = 0

    var canUndo: Bool { historyIndex > 0 }
    var canRedo: Bool { historyIndex < history.count - 1 }

    func increment() {
        updateValue(value + 1)
    }

    func decrement() {
        updateValue(value - 1)
    }

    func undo() {
        guard canUndo else { return }
        historyIndex -= 1
        value = history[historyIndex]
    }

    func redo() {
        guard canRedo else { return }
        historyIndex += 1
        value = history[historyIndex]
    }

    private func updateValue(_ newValue: Int) {
        // 删除当前位置之后的历史
        history = Array(history.prefix(historyIndex + 1))
        history.append(newValue)
        historyIndex = history.count - 1
        value = newValue
    }
}

struct UndoableCounterView: View {
    @StateObject private var counter = UndoableCounter()

    var body: some View {
        VStack(spacing: 20) {
            Text("\(counter.value)")
                .font(.largeTitle)

            HStack {
                Button("-") { counter.decrement() }
                Button("+") { counter.increment() }
            }
            .font(.title)

            HStack {
                Button("撤销") { counter.undo() }
                    .disabled(!counter.canUndo)
                Button("重做") { counter.redo() }
                    .disabled(!counter.canRedo)
            }
        }
    }
}
```

## 延伸阅读

### 官方资源

- [Apple Developer Documentation - State and Data Flow](https://developer.apple.com/documentation/swiftui/state-and-data-flow)
- [Apple Developer Documentation - Managing Model Data in Your App](https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app)
- [WWDC 2019 - Data Flow Through SwiftUI](https://developer.apple.com/videos/play/wwdc2019/226/)
- [WWDC 2020 - Data Essentials in SwiftUI](https://developer.apple.com/videos/play/wwdc2020/10040/)
- [WWDC 2023 - Discover Observation in SwiftUI](https://developer.apple.com/videos/play/wwdc2023/10149/)

### 推荐书籍

- 《SwiftUI by Tutorials》 - raywenderlich.com
- 《Thinking in SwiftUI》 - objc.io
- 《SwiftUI Apprentice》 - raywenderlich.com

### 进阶主题

- **Combine 框架**：深入理解 `@Published` 背后的响应式编程
- **@Observable 宏**：iOS 17 引入的新观察机制
- **依赖注入**：构建可测试的 SwiftUI 应用
- **TCA 架构**：The Composable Architecture，函数式状态管理

### 相关工具

- **Xcode Previews**：实时预览视图和状态变化
- **Instruments**：性能分析，检测过度重渲染
- **SwiftUI Inspector**：Xcode 14+ 内置的 SwiftUI 调试工具

## 总结

SwiftUI 的状态管理是构建响应式应用的核心。掌握各种属性包装器的使用场景和原理，能够帮助你：

1. **选择正确的工具**：根据数据所有权和类型选择合适的属性包装器
2. **避免常见陷阱**：理解 `@StateObject` 和 `@ObservedObject` 的区别，防止意外的对象重建
3. **优化性能**：通过合理的视图拆分和状态设计减少不必要的重渲染
4. **构建可维护的架构**：使用 MVVM 等模式分离关注点

记住：**单一数据源原则**是状态管理的核心。确保每个状态都有明确的所有者，通过绑定和环境对象共享状态，而不是复制状态。
