---
title: SwiftUI
description: SwiftUI完全指南，声明式UI、视图组合与状态管理
track: swift
section: swiftui
difficulty: intermediate
tags:
  - Swift
  - SwiftUI
  - UI
  - 声明式
status: imported
origin: old/src/content/docs/swift/swiftui.zh.md
divergence: 0.112
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Swift
  subcategory: UI框架
  order: 4
  lastUpdated: 2026-01-07
---

SwiftUI 是 Apple 于 2019 年推出的革命性声明式 UI 框架，支持 iOS、macOS、watchOS 和 tvOS 跨平台开发。本指南将系统性地介绍 SwiftUI 的核心概念、视图系统、状态管理和实战技巧。

## 声明式 UI 基础

### 声明式 vs 命令式

声明式编程关注"是什么"，命令式编程关注"怎么做"。SwiftUI 采用声明式范式，让开发者描述 UI 的最终状态，框架自动处理渲染和更新。

```swift
// UIKit 命令式方式
let label = UILabel()
label.text = "Hello, World!"
label.textColor = .systemBlue
label.font = .preferredFont(forTextStyle: .headline)
view.addSubview(label)
label.translatesAutoresizingMaskIntoConstraints = false
NSLayoutConstraint.activate([
    label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
    label.centerYAnchor.constraint(equalTo: view.centerYAnchor)
])

// SwiftUI 声明式方式
Text("Hello, World!")
    .foregroundColor(.blue)
    .font(.headline)
```

### View 协议

SwiftUI 中所有视图都遵循 `View` 协议，只需实现 `body` 属性。

```swift
struct WelcomeView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "swift")
                .font(.system(size: 80))
                .foregroundColor(.orange)

            Text("欢迎使用 SwiftUI")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("构建美观的跨平台应用")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
}
```

## 核心视图组件

### 文本视图

```swift
struct TextExamples: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 基础文本
            Text("普通文本")

            // 样式化文本
            Text("粗体文本")
                .fontWeight(.bold)

            Text("斜体文本")
                .italic()

            Text("下划线文本")
                .underline()

            // 组合样式
            Text("自定义样式")
                .font(.title2)
                .foregroundColor(.purple)
                .fontWeight(.semibold)

            // 多行文本
            Text("这是一段很长的文本，展示了 SwiftUI 中文本的自动换行功能。你可以使用 lineLimit 来限制行数。")
                .lineLimit(2)
                .truncationMode(.tail)

            // 富文本
            Text("Hello, ") + Text("SwiftUI").bold().foregroundColor(.blue) + Text("!")
        }
        .padding()
    }
}
```

### 图片视图

```swift
struct ImageExamples: View {
    var body: some View {
        VStack(spacing: 20) {
            // SF Symbols
            Image(systemName: "star.fill")
                .font(.largeTitle)
                .foregroundColor(.yellow)

            // 调整大小
            Image(systemName: "heart.fill")
                .resizable()
                .frame(width: 50, height: 50)
                .foregroundColor(.red)

            // 保持宽高比
            Image(systemName: "photo")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(height: 100)

            // 圆形裁剪
            Image(systemName: "person.circle.fill")
                .resizable()
                .frame(width: 80, height: 80)
                .clipShape(Circle())
                .foregroundColor(.blue)

            // 异步加载网络图片 (iOS 15+)
            AsyncImage(url: URL(string: "https://example.com/image.jpg")) { phase in
                switch phase {
                case .empty:
                    ProgressView()
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                case .failure:
                    Image(systemName: "photo")
                        .foregroundColor(.gray)
                @unknown default:
                    EmptyView()
                }
            }
            .frame(width: 100, height: 100)
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
    }
}
```

### 按钮与交互

```swift
struct ButtonExamples: View {
    @State private var count = 0

    var body: some View {
        VStack(spacing: 20) {
            // 基础按钮
            Button("点击我") {
                count += 1
            }

            // 带图标的按钮
            Button {
                count += 1
            } label: {
                Label("添加", systemImage: "plus.circle")
            }

            // 不同按钮样式
            Button("Bordered") { }
                .buttonStyle(.bordered)

            Button("Bordered Prominent") { }
                .buttonStyle(.borderedProminent)

            Button("删除", role: .destructive) { }
                .buttonStyle(.borderedProminent)

            // 自定义按钮
            Button {
                count += 1
            } label: {
                HStack {
                    Image(systemName: "hand.tap")
                    Text("自定义按钮")
                }
                .padding()
                .foregroundColor(.white)
                .background(
                    LinearGradient(
                        colors: [.blue, .purple],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(12)
            }

            Text("点击次数: \(count)")
                .font(.headline)
        }
        .padding()
    }
}
```

### 输入控件

```swift
struct InputExamples: View {
    @State private var username = ""
    @State private var password = ""
    @State private var bio = ""
    @State private var agreeToTerms = false
    @State private var volume: Double = 50
    @State private var selectedColor = "红色"

    let colors = ["红色", "绿色", "蓝色", "黄色"]

    var body: some View {
        Form {
            Section("文本输入") {
                TextField("用户名", text: $username)
                    .textContentType(.username)
                    .autocapitalization(.none)

                SecureField("密码", text: $password)
                    .textContentType(.password)

                TextEditor(text: $bio)
                    .frame(height: 100)
            }

            Section("选择控件") {
                Toggle("同意用户协议", isOn: $agreeToTerms)

                Slider(value: $volume, in: 0...100) {
                    Text("音量")
                } minimumValueLabel: {
                    Image(systemName: "speaker.fill")
                } maximumValueLabel: {
                    Image(systemName: "speaker.wave.3.fill")
                }

                Picker("颜色", selection: $selectedColor) {
                    ForEach(colors, id: \.self) { color in
                        Text(color).tag(color)
                    }
                }
                .pickerStyle(.menu)
            }

            Section("日期选择") {
                DatePicker(
                    "选择日期",
                    selection: .constant(Date()),
                    displayedComponents: [.date, .hourAndMinute]
                )
            }
        }
    }
}
```

## 布局系统

### Stack 布局

SwiftUI 提供三种基础堆叠布局：VStack（垂直）、HStack（水平）、ZStack（层叠）。

```swift
struct StackLayouts: View {
    var body: some View {
        VStack(spacing: 30) {
            // VStack 垂直布局
            VStack(alignment: .leading, spacing: 8) {
                Text("VStack 示例")
                    .font(.headline)
                Text("第一行")
                Text("第二行")
                Text("第三行")
            }
            .padding()
            .background(Color.blue.opacity(0.1))
            .cornerRadius(8)

            // HStack 水平布局
            HStack(spacing: 12) {
                ForEach(0..<4) { index in
                    Circle()
                        .fill(Color.green)
                        .frame(width: 40, height: 40)
                        .overlay(Text("\(index + 1)").foregroundColor(.white))
                }
            }

            // ZStack 层叠布局
            ZStack {
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.purple.opacity(0.3))
                    .frame(width: 200, height: 100)

                RoundedRectangle(cornerRadius: 15)
                    .fill(Color.purple.opacity(0.5))
                    .frame(width: 150, height: 75)

                Text("层叠效果")
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }

            // 对齐方式
            ZStack(alignment: .bottomTrailing) {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 150, height: 100)

                Text("右下角")
                    .padding(8)
                    .background(Color.orange)
                    .cornerRadius(6)
            }
        }
        .padding()
    }
}
```

### Grid 网格布局

```swift
struct GridLayouts: View {
    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 30) {
                // LazyVGrid - 垂直网格
                Text("LazyVGrid 示例")
                    .font(.headline)

                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(1...12, id: \.self) { number in
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.blue.opacity(0.6))
                            .frame(height: 80)
                            .overlay(
                                Text("\(number)")
                                    .foregroundColor(.white)
                                    .font(.title2)
                            )
                    }
                }

                Divider()

                // 自适应网格
                Text("自适应网格")
                    .font(.headline)

                LazyVGrid(columns: [
                    GridItem(.adaptive(minimum: 80, maximum: 120))
                ], spacing: 12) {
                    ForEach(1...8, id: \.self) { number in
                        Circle()
                            .fill(Color.green.opacity(0.7))
                            .frame(height: 60)
                            .overlay(Text("\(number)").foregroundColor(.white))
                    }
                }

                // iOS 16+ Grid
                Text("Grid 布局 (iOS 16+)")
                    .font(.headline)

                Grid(horizontalSpacing: 12, verticalSpacing: 12) {
                    GridRow {
                        Color.red.opacity(0.5)
                        Color.green.opacity(0.5)
                        Color.blue.opacity(0.5)
                    }
                    .frame(height: 50)

                    GridRow {
                        Color.yellow.opacity(0.5)
                            .gridCellColumns(2) // 占两列
                        Color.purple.opacity(0.5)
                    }
                    .frame(height: 50)
                }
                .frame(height: 120)
            }
            .padding()
        }
    }
}
```

### Spacer 与对齐

```swift
struct SpacerAlignment: View {
    var body: some View {
        VStack(spacing: 30) {
            // Spacer 推开元素
            HStack {
                Text("左边")
                Spacer()
                Text("右边")
            }
            .padding()
            .background(Color.gray.opacity(0.1))

            // 多个 Spacer
            HStack {
                Text("左")
                Spacer()
                Text("中")
                Spacer()
                Text("右")
            }
            .padding()
            .background(Color.gray.opacity(0.1))

            // 垂直 Spacer
            VStack {
                Text("顶部")
                Spacer()
                Text("底部")
            }
            .frame(height: 100)
            .padding()
            .background(Color.gray.opacity(0.1))

            // Frame 对齐
            Text("左上角对齐")
                .frame(maxWidth: .infinity, maxHeight: 60, alignment: .topLeading)
                .background(Color.blue.opacity(0.1))

            Text("居中对齐")
                .frame(maxWidth: .infinity, maxHeight: 60, alignment: .center)
                .background(Color.green.opacity(0.1))

            Text("右下角对齐")
                .frame(maxWidth: .infinity, maxHeight: 60, alignment: .bottomTrailing)
                .background(Color.orange.opacity(0.1))
        }
        .padding()
    }
}
```

## 视图修饰符

### 常用修饰符

```swift
struct CommonModifiers: View {
    var body: some View {
        VStack(spacing: 20) {
            // 字体与颜色
            Text("样式文本")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.blue)
                .italic()

            // 内边距与背景
            Text("带背景的文本")
                .padding()
                .padding(.horizontal, 20)
                .background(Color.yellow.opacity(0.3))
                .cornerRadius(10)

            // 边框
            Text("带边框的文本")
                .padding()
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.blue, lineWidth: 2)
                )

            // 阴影
            Text("带阴影的文本")
                .padding()
                .background(Color.white)
                .cornerRadius(10)
                .shadow(color: .black.opacity(0.2), radius: 5, x: 0, y: 3)

            // 渐变背景
            Text("渐变背景")
                .font(.headline)
                .foregroundColor(.white)
                .padding()
                .frame(maxWidth: .infinity)
                .background(
                    LinearGradient(
                        gradient: Gradient(colors: [.purple, .blue, .cyan]),
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(12)

            // 模糊效果
            ZStack {
                Image(systemName: "photo.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.gray)

                Rectangle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 100, height: 50)
            }
        }
        .padding()
    }
}
```

### 自定义修饰符

```swift
// 自定义卡片修饰符
struct CardModifier: ViewModifier {
    var backgroundColor: Color
    var cornerRadius: CGFloat
    var shadowRadius: CGFloat

    func body(content: Content) -> some View {
        content
            .padding()
            .background(backgroundColor)
            .cornerRadius(cornerRadius)
            .shadow(
                color: Color.black.opacity(0.1),
                radius: shadowRadius,
                x: 0,
                y: 2
            )
    }
}

// 扩展 View 以便链式调用
extension View {
    func cardStyle(
        backgroundColor: Color = .white,
        cornerRadius: CGFloat = 12,
        shadowRadius: CGFloat = 8
    ) -> some View {
        modifier(CardModifier(
            backgroundColor: backgroundColor,
            cornerRadius: cornerRadius,
            shadowRadius: shadowRadius
        ))
    }
}

// 主题按钮修饰符
struct PrimaryButtonModifier: ViewModifier {
    var isEnabled: Bool

    func body(content: Content) -> some View {
        content
            .font(.headline)
            .foregroundColor(.white)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(isEnabled ? Color.blue : Color.gray)
            .cornerRadius(10)
            .opacity(isEnabled ? 1.0 : 0.6)
    }
}

extension View {
    func primaryButton(isEnabled: Bool = true) -> some View {
        modifier(PrimaryButtonModifier(isEnabled: isEnabled))
    }
}

// 使用示例
struct CustomModifiersDemo: View {
    @State private var isEnabled = true

    var body: some View {
        VStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("产品名称")
                    .font(.headline)
                Text("这是产品描述，介绍产品的特点和优势。")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .cardStyle()

            VStack(alignment: .leading, spacing: 8) {
                Text("自定义背景")
                    .font(.headline)
                Text("使用浅蓝色背景的卡片样式")
                    .font(.subheadline)
            }
            .cardStyle(backgroundColor: Color.blue.opacity(0.1))

            Button("主要按钮") { }
                .primaryButton()

            Button("禁用按钮") { }
                .primaryButton(isEnabled: false)

            Toggle("启用按钮", isOn: $isEnabled)
                .padding()
        }
        .padding()
    }
}
```

## 状态管理

### @State - 视图内部状态

`@State` 用于管理视图内部的简单值类型状态，当状态改变时视图自动重新渲染。

```swift
struct StateExample: View {
    @State private var counter = 0
    @State private var name = ""
    @State private var isExpanded = false

    var body: some View {
        VStack(spacing: 24) {
            // 计数器
            VStack(spacing: 12) {
                Text("计数器: \(counter)")
                    .font(.title)

                HStack(spacing: 16) {
                    Button("-") { counter -= 1 }
                        .buttonStyle(.bordered)

                    Button("+") { counter += 1 }
                        .buttonStyle(.bordered)

                    Button("重置") { counter = 0 }
                        .buttonStyle(.borderedProminent)
                }
            }

            Divider()

            // 文本输入
            VStack(alignment: .leading, spacing: 8) {
                TextField("输入你的名字", text: $name)
                    .textFieldStyle(.roundedBorder)

                if !name.isEmpty {
                    Text("你好, \(name)!")
                        .font(.headline)
                        .foregroundColor(.green)
                }
            }

            Divider()

            // 展开/折叠
            VStack {
                Button(isExpanded ? "收起详情" : "展开详情") {
                    withAnimation(.spring()) {
                        isExpanded.toggle()
                    }
                }
                .buttonStyle(.bordered)

                if isExpanded {
                    Text("这是详细内容，点击按钮可以展开或收起。SwiftUI 会自动添加动画效果。")
                        .padding()
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                        .transition(.opacity.combined(with: .scale))
                }
            }
        }
        .padding()
    }
}
```

### @Binding - 双向绑定

`@Binding` 创建对其他视图状态的引用，实现父子视图间的数据同步。

```swift
// 评分组件 - 使用 Binding 接收外部状态
struct RatingView: View {
    @Binding var rating: Int
    var maxRating = 5
    var label = ""
    var onColor = Color.yellow
    var offColor = Color.gray.opacity(0.3)

    var body: some View {
        HStack {
            if !label.isEmpty {
                Text(label)
                    .font(.subheadline)
            }

            ForEach(1...maxRating, id: \.self) { number in
                Image(systemName: number <= rating ? "star.fill" : "star")
                    .foregroundColor(number <= rating ? onColor : offColor)
                    .onTapGesture {
                        rating = number
                    }
            }
        }
    }
}

// 父视图
struct BindingExample: View {
    @State private var productRating = 3
    @State private var serviceRating = 4
    @State private var isOn = false

    var body: some View {
        VStack(spacing: 24) {
            // 评分组件
            VStack(alignment: .leading, spacing: 16) {
                RatingView(rating: $productRating, label: "产品质量:")
                RatingView(rating: $serviceRating, label: "服务态度:")

                Text("平均评分: \(Double(productRating + serviceRating) / 2.0, specifier: "%.1f")")
                    .font(.headline)
            }
            .padding()
            .cardStyle()

            Divider()

            // 自定义开关
            CustomToggle(isOn: $isOn, label: "启用通知")

            Text("通知状态: \(isOn ? "已开启" : "已关闭")")
                .foregroundColor(isOn ? .green : .red)
        }
        .padding()
    }
}

// 自定义开关组件
struct CustomToggle: View {
    @Binding var isOn: Bool
    var label: String

    var body: some View {
        HStack {
            Text(label)
            Spacer()

            RoundedRectangle(cornerRadius: 16)
                .fill(isOn ? Color.green : Color.gray.opacity(0.3))
                .frame(width: 50, height: 30)
                .overlay(
                    Circle()
                        .fill(Color.white)
                        .padding(3)
                        .offset(x: isOn ? 10 : -10)
                )
                .onTapGesture {
                    withAnimation(.spring()) {
                        isOn.toggle()
                    }
                }
        }
        .padding()
    }
}
```

### @ObservedObject - 观察外部对象

`@ObservedObject` 用于观察符合 `ObservableObject` 协议的外部对象。适合接收从父视图传入的对象。

```swift
// 数据模型
class UserViewModel: ObservableObject {
    @Published var username = ""
    @Published var email = ""
    @Published var isLoggedIn = false
    @Published var loginError: String?

    func login() {
        guard !username.isEmpty else {
            loginError = "请输入用户名"
            return
        }
        guard !email.isEmpty else {
            loginError = "请输入邮箱"
            return
        }

        loginError = nil
        isLoggedIn = true
    }

    func logout() {
        username = ""
        email = ""
        isLoggedIn = false
        loginError = nil
    }
}

// 主视图
struct ObservedObjectExample: View {
    @StateObject private var viewModel = UserViewModel()

    var body: some View {
        NavigationView {
            if viewModel.isLoggedIn {
                ProfileView(viewModel: viewModel)
            } else {
                LoginFormView(viewModel: viewModel)
            }
        }
    }
}

// 登录表单 - 使用 @ObservedObject
struct LoginFormView: View {
    @ObservedObject var viewModel: UserViewModel

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.blue)

            VStack(spacing: 12) {
                TextField("用户名", text: $viewModel.username)
                    .textFieldStyle(.roundedBorder)
                    .autocapitalization(.none)

                TextField("邮箱", text: $viewModel.email)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
            }
            .padding(.horizontal)

            if let error = viewModel.loginError {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }

            Button("登录") {
                viewModel.login()
            }
            .buttonStyle(.borderedProminent)
            .disabled(viewModel.username.isEmpty || viewModel.email.isEmpty)
        }
        .padding()
        .navigationTitle("登录")
    }
}

// 个人资料页
struct ProfileView: View {
    @ObservedObject var viewModel: UserViewModel

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)

            Text("欢迎回来!")
                .font(.largeTitle)
                .fontWeight(.bold)

            VStack(alignment: .leading, spacing: 8) {
                Label(viewModel.username, systemImage: "person")
                Label(viewModel.email, systemImage: "envelope")
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(10)

            Button("退出登录") {
                viewModel.logout()
            }
            .buttonStyle(.borderedProminent)
            .tint(.red)
        }
        .padding()
        .navigationTitle("个人资料")
    }
}
```

### @StateObject - 视图拥有的对象

`@StateObject` 用于在视图内部创建并拥有 `ObservableObject` 实例。它确保对象在视图生命周期内保持稳定，不会因视图刷新而重建。

```swift
// 计时器 ViewModel
class StopwatchViewModel: ObservableObject {
    @Published var elapsedTime: TimeInterval = 0
    @Published var isRunning = false

    private var timer: Timer?
    private var startTime: Date?

    func start() {
        guard !isRunning else { return }
        isRunning = true
        startTime = Date()

        timer = Timer.scheduledTimer(withTimeInterval: 0.01, repeats: true) { [weak self] _ in
            guard let self = self, let startTime = self.startTime else { return }
            self.elapsedTime = Date().timeIntervalSince(startTime)
        }
    }

    func pause() {
        isRunning = false
        timer?.invalidate()
        timer = nil
    }

    func reset() {
        pause()
        elapsedTime = 0
    }

    var formattedTime: String {
        let minutes = Int(elapsedTime) / 60
        let seconds = Int(elapsedTime) % 60
        let milliseconds = Int((elapsedTime.truncatingRemainder(dividingBy: 1)) * 100)
        return String(format: "%02d:%02d.%02d", minutes, seconds, milliseconds)
    }
}

struct StateObjectExample: View {
    // 使用 @StateObject 确保 ViewModel 只创建一次
    @StateObject private var stopwatch = StopwatchViewModel()

    var body: some View {
        VStack(spacing: 30) {
            // 时间显示
            Text(stopwatch.formattedTime)
                .font(.system(size: 60, weight: .thin, design: .monospaced))

            // 控制按钮
            HStack(spacing: 20) {
                Button(stopwatch.isRunning ? "暂停" : "开始") {
                    if stopwatch.isRunning {
                        stopwatch.pause()
                    } else {
                        stopwatch.start()
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(stopwatch.isRunning ? .orange : .green)

                Button("重置") {
                    stopwatch.reset()
                }
                .buttonStyle(.bordered)
                .disabled(stopwatch.elapsedTime == 0)
            }

            // 圈数记录示例
            LapRecorder(stopwatch: stopwatch)
        }
        .padding()
    }
}

// 圈数记录组件 - 使用 @ObservedObject 接收
struct LapRecorder: View {
    @ObservedObject var stopwatch: StopwatchViewModel
    @State private var laps: [TimeInterval] = []

    var body: some View {
        VStack {
            Button("记录圈数") {
                laps.append(stopwatch.elapsedTime)
            }
            .buttonStyle(.bordered)
            .disabled(!stopwatch.isRunning)

            if !laps.isEmpty {
                List {
                    ForEach(laps.indices, id: \.self) { index in
                        HStack {
                            Text("圈 \(index + 1)")
                            Spacer()
                            Text(formatTime(laps[index]))
                                .font(.system(.body, design: .monospaced))
                        }
                    }
                }
                .listStyle(.plain)
                .frame(height: 200)
            }
        }
    }

    func formatTime(_ time: TimeInterval) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        let ms = Int((time.truncatingRemainder(dividingBy: 1)) * 100)
        return String(format: "%02d:%02d.%02d", minutes, seconds, ms)
    }
}
```

### @EnvironmentObject - 环境对象

`@EnvironmentObject` 用于在视图层级中共享数据，避免多层手动传递。

```swift
// 全局设置
class AppSettings: ObservableObject {
    @Published var colorScheme: ColorScheme? = nil
    @Published var fontSize: Double = 16
    @Published var accentColor: Color = .blue
    @Published var notificationsEnabled = true
    @Published var language = "中文"

    static let languages = ["中文", "English", "日本語"]
}

// 购物车
class ShoppingCart: ObservableObject {
    @Published var items: [CartItem] = []

    struct CartItem: Identifiable {
        let id = UUID()
        let name: String
        let price: Double
        var quantity: Int
    }

    var totalPrice: Double {
        items.reduce(0) { $0 + ($1.price * Double($1.quantity)) }
    }

    var itemCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }

    func addItem(name: String, price: Double) {
        if let index = items.firstIndex(where: { $0.name == name }) {
            items[index].quantity += 1
        } else {
            items.append(CartItem(name: name, price: price, quantity: 1))
        }
    }

    func removeItem(_ item: CartItem) {
        items.removeAll { $0.id == item.id }
    }
}

// 根视图 - 注入环境对象
struct EnvironmentObjectExample: View {
    @StateObject private var settings = AppSettings()
    @StateObject private var cart = ShoppingCart()

    var body: some View {
        TabView {
            ProductListView()
                .tabItem {
                    Label("商品", systemImage: "bag")
                }

            CartView()
                .tabItem {
                    Label("购物车", systemImage: "cart")
                }
                .badge(cart.itemCount)

            SettingsView()
                .tabItem {
                    Label("设置", systemImage: "gear")
                }
        }
        .environmentObject(settings)
        .environmentObject(cart)
        .preferredColorScheme(settings.colorScheme)
        .accentColor(settings.accentColor)
    }
}

// 商品列表
struct ProductListView: View {
    @EnvironmentObject var cart: ShoppingCart
    @EnvironmentObject var settings: AppSettings

    let products = [
        ("iPhone 15", 6999.0),
        ("MacBook Pro", 14999.0),
        ("AirPods Pro", 1899.0),
        ("Apple Watch", 2999.0)
    ]

    var body: some View {
        NavigationView {
            List(products, id: \.0) { product in
                HStack {
                    VStack(alignment: .leading) {
                        Text(product.0)
                            .font(.system(size: settings.fontSize))
                        Text("¥\(product.1, specifier: "%.0f")")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    Button {
                        cart.addItem(name: product.0, price: product.1)
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                }
            }
            .navigationTitle("商品列表")
        }
    }
}

// 购物车视图
struct CartView: View {
    @EnvironmentObject var cart: ShoppingCart

    var body: some View {
        NavigationView {
            VStack {
                if cart.items.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "cart")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        Text("购物车是空的")
                            .foregroundColor(.secondary)
                    }
                } else {
                    List {
                        ForEach(cart.items) { item in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(item.name)
                                    Text("¥\(item.price, specifier: "%.0f") x \(item.quantity)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                Text("¥\(item.price * Double(item.quantity), specifier: "%.0f")")
                                    .fontWeight(.semibold)
                            }
                        }
                        .onDelete { indexSet in
                            indexSet.forEach { cart.items.remove(at: $0) }
                        }
                    }

                    HStack {
                        Text("总计:")
                            .font(.headline)
                        Spacer()
                        Text("¥\(cart.totalPrice, specifier: "%.0f")")
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                    .padding()

                    Button("结算") { }
                        .buttonStyle(.borderedProminent)
                        .padding()
                }
            }
            .navigationTitle("购物车")
        }
    }
}

// 设置视图
struct SettingsView: View {
    @EnvironmentObject var settings: AppSettings

    var body: some View {
        NavigationView {
            Form {
                Section("外观") {
                    Picker("颜色模式", selection: $settings.colorScheme) {
                        Text("跟随系统").tag(nil as ColorScheme?)
                        Text("浅色").tag(ColorScheme.light as ColorScheme?)
                        Text("深色").tag(ColorScheme.dark as ColorScheme?)
                    }

                    ColorPicker("主题色", selection: $settings.accentColor)

                    VStack(alignment: .leading) {
                        Text("字体大小: \(Int(settings.fontSize))")
                        Slider(value: $settings.fontSize, in: 12...24, step: 1)
                    }
                }

                Section("通用") {
                    Toggle("启用通知", isOn: $settings.notificationsEnabled)

                    Picker("语言", selection: $settings.language) {
                        ForEach(AppSettings.languages, id: \.self) { lang in
                            Text(lang).tag(lang)
                        }
                    }
                }

                Section("预览") {
                    Text("示例文本")
                        .font(.system(size: settings.fontSize))
                }
            }
            .navigationTitle("设置")
        }
    }
}
```

### 状态管理对比

| 属性包装器 | 用途 | 数据所有权 | 使用场景 |
|-----------|------|-----------|---------|
| `@State` | 视图内部简单状态 | 视图拥有 | Bool、String、Int 等值类型 |
| `@Binding` | 对其他状态的引用 | 引用外部 | 子组件修改父组件状态 |
| `@StateObject` | 创建并拥有 ObservableObject | 视图拥有 | 视图内创建 ViewModel |
| `@ObservedObject` | 观察外部 ObservableObject | 外部拥有 | 接收传入的 ViewModel |
| `@EnvironmentObject` | 环境中的共享对象 | 环境拥有 | 跨层级共享数据 |

## 导航系统

### NavigationStack (iOS 16+)

`NavigationStack` 是 iOS 16 引入的新导航容器，提供了更强大的编程式导航能力。

```swift
struct NavigationStackExample: View {
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            List {
                Section("基础导航") {
                    NavigationLink("查看详情", value: "detail")
                    NavigationLink("设置页面", value: "settings")
                }

                Section("数据驱动导航") {
                    ForEach(1...5, id: \.self) { number in
                        NavigationLink("项目 \(number)", value: number)
                    }
                }
            }
            .navigationTitle("首页")
            .navigationDestination(for: String.self) { value in
                switch value {
                case "detail":
                    DetailPageView(path: $path)
                case "settings":
                    Text("设置页面")
                        .navigationTitle("设置")
                default:
                    Text("未知页面")
                }
            }
            .navigationDestination(for: Int.self) { number in
                NumberDetailView(number: number, path: $path)
            }
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("重置") {
                        path = NavigationPath()
                    }
                }
            }
        }
    }
}

struct DetailPageView: View {
    @Binding var path: NavigationPath

    var body: some View {
        VStack(spacing: 20) {
            Text("详情页面")
                .font(.largeTitle)

            Button("跳转到项目 3") {
                path.append(3)
            }
            .buttonStyle(.bordered)

            Button("返回首页") {
                path.removeLast(path.count)
            }
            .buttonStyle(.borderedProminent)
        }
        .navigationTitle("详情")
    }
}

struct NumberDetailView: View {
    let number: Int
    @Binding var path: NavigationPath

    var body: some View {
        VStack(spacing: 20) {
            Text("项目 \(number)")
                .font(.largeTitle)

            if number < 5 {
                Button("下一项") {
                    path.append(number + 1)
                }
                .buttonStyle(.bordered)
            }

            Button("返回首页") {
                path.removeLast(path.count)
            }
            .buttonStyle(.borderedProminent)
        }
        .navigationTitle("项目 \(number)")
    }
}
```

### Sheet 与 FullScreenCover

```swift
struct ModalPresentationExample: View {
    @State private var showSheet = false
    @State private var showFullScreen = false
    @State private var showConfirmation = false
    @State private var selectedItem: String?

    var body: some View {
        VStack(spacing: 20) {
            Button("显示 Sheet") {
                showSheet = true
            }
            .buttonStyle(.bordered)

            Button("显示全屏") {
                showFullScreen = true
            }
            .buttonStyle(.borderedProminent)

            Button("显示确认对话框") {
                showConfirmation = true
            }
            .buttonStyle(.bordered)

            Button("选择项目") {
                selectedItem = "选中的项目"
            }
            .buttonStyle(.bordered)
        }
        // Sheet
        .sheet(isPresented: $showSheet) {
            SheetContentView()
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        // 全屏
        .fullScreenCover(isPresented: $showFullScreen) {
            FullScreenContentView(isPresented: $showFullScreen)
        }
        // 确认对话框
        .confirmationDialog(
            "请选择操作",
            isPresented: $showConfirmation,
            titleVisibility: .visible
        ) {
            Button("保存") { }
            Button("不保存") { }
            Button("取消", role: .cancel) { }
        }
        // 基于 item 的 Sheet
        .sheet(item: $selectedItem.toBinding()) { item in
            Text("选中: \(item)")
                .padding()
        }
    }
}

// 辅助扩展
extension Optional where Wrapped == String {
    func toBinding() -> Binding<IdentifiableString?> {
        Binding(
            get: { self.map { IdentifiableString(value: $0) } },
            set: { _ in }
        )
    }
}

struct IdentifiableString: Identifiable {
    let id = UUID()
    let value: String
}

struct SheetContentView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("这是一个 Sheet")
                    .font(.title)

                Text("可以上下拖动调整大小")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Sheet")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("完成") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct FullScreenContentView: View {
    @Binding var isPresented: Bool

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [.purple, .blue],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 20) {
                Text("全屏模式")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

                Text("这是一个全屏覆盖视图")
                    .foregroundColor(.white.opacity(0.8))

                Button("关闭") {
                    isPresented = false
                }
                .buttonStyle(.bordered)
                .tint(.white)
            }
        }
    }
}
```

### TabView

```swift
struct TabViewExample: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeTabView()
                .tabItem {
                    Label("首页", systemImage: "house.fill")
                }
                .tag(0)

            DiscoverTabView()
                .tabItem {
                    Label("发现", systemImage: "safari.fill")
                }
                .tag(1)

            NotificationTabView()
                .tabItem {
                    Label("通知", systemImage: "bell.fill")
                }
                .badge(5)
                .tag(2)

            ProfileTabView()
                .tabItem {
                    Label("我的", systemImage: "person.fill")
                }
                .tag(3)
        }
    }
}

struct HomeTabView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(1...10, id: \.self) { index in
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.blue.opacity(0.1))
                            .frame(height: 100)
                            .overlay(Text("内容 \(index)"))
                    }
                }
                .padding()
            }
            .navigationTitle("首页")
        }
    }
}

struct DiscoverTabView: View {
    var body: some View {
        NavigationView {
            Text("发现页面")
                .navigationTitle("发现")
        }
    }
}

struct NotificationTabView: View {
    var body: some View {
        NavigationView {
            List(1...5, id: \.self) { index in
                HStack {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 8, height: 8)
                    Text("通知 \(index)")
                }
            }
            .navigationTitle("通知")
        }
    }
}

struct ProfileTabView: View {
    var body: some View {
        NavigationView {
            Text("个人资料")
                .navigationTitle("我的")
        }
    }
}
```

## 列表与数据

### List 基础用法

```swift
struct ListBasicsExample: View {
    let fruits = ["苹果", "香蕉", "橙子", "葡萄", "西瓜", "草莓"]

    var body: some View {
        NavigationView {
            List {
                // 静态内容
                Section("推荐") {
                    Label("每日精选", systemImage: "star.fill")
                    Label("新品上市", systemImage: "sparkles")
                }

                // 动态内容
                Section("水果列表") {
                    ForEach(fruits, id: \.self) { fruit in
                        NavigationLink(fruit) {
                            Text("\(fruit)详情页")
                        }
                    }
                }

                // 自定义行
                Section("自定义") {
                    HStack {
                        Image(systemName: "heart.fill")
                            .foregroundColor(.red)
                        Text("收藏夹")
                        Spacer()
                        Text("3")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("列表示例")
        }
    }
}
```

### 可编辑列表

```swift
struct EditableListExample: View {
    struct TodoItem: Identifiable {
        let id = UUID()
        var title: String
        var isCompleted: Bool
        var priority: Priority

        enum Priority: String, CaseIterable {
            case low = "低"
            case medium = "中"
            case high = "高"

            var color: Color {
                switch self {
                case .low: return .green
                case .medium: return .orange
                case .high: return .red
                }
            }
        }
    }

    @State private var todos = [
        TodoItem(title: "学习 SwiftUI", isCompleted: false, priority: .high),
        TodoItem(title: "完成项目文档", isCompleted: true, priority: .medium),
        TodoItem(title: "代码审查", isCompleted: false, priority: .medium),
        TodoItem(title: "团队会议", isCompleted: false, priority: .low)
    ]
    @State private var newTodoTitle = ""
    @State private var editMode: EditMode = .inactive

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // 添加新项目
                HStack {
                    TextField("添加新任务...", text: $newTodoTitle)
                        .textFieldStyle(.roundedBorder)

                    Button {
                        addTodo()
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                    .disabled(newTodoTitle.isEmpty)
                }
                .padding()

                List {
                    ForEach($todos) { $todo in
                        HStack {
                            Button {
                                todo.isCompleted.toggle()
                            } label: {
                                Image(systemName: todo.isCompleted ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(todo.isCompleted ? .green : .gray)
                            }
                            .buttonStyle(.plain)

                            VStack(alignment: .leading) {
                                Text(todo.title)
                                    .strikethrough(todo.isCompleted)
                                    .foregroundColor(todo.isCompleted ? .secondary : .primary)

                                Text(todo.priority.rawValue)
                                    .font(.caption)
                                    .foregroundColor(todo.priority.color)
                            }

                            Spacer()

                            Circle()
                                .fill(todo.priority.color)
                                .frame(width: 8, height: 8)
                        }
                    }
                    .onDelete(perform: deleteTodos)
                    .onMove(perform: moveTodos)
                }
            }
            .navigationTitle("待办事项")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    EditButton()
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button("清除已完成") {
                            todos.removeAll { $0.isCompleted }
                        }
                        Button("全部标记完成") {
                            for index in todos.indices {
                                todos[index].isCompleted = true
                            }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .environment(\.editMode, $editMode)
        }
    }

    func addTodo() {
        let todo = TodoItem(title: newTodoTitle, isCompleted: false, priority: .medium)
        todos.insert(todo, at: 0)
        newTodoTitle = ""
    }

    func deleteTodos(at offsets: IndexSet) {
        todos.remove(atOffsets: offsets)
    }

    func moveTodos(from source: IndexSet, to destination: Int) {
        todos.move(fromOffsets: source, toOffset: destination)
    }
}
```

### 搜索与过滤

```swift
struct SearchableListExample: View {
    struct Contact: Identifiable {
        let id = UUID()
        let name: String
        let phone: String
        let department: String
    }

    let allContacts = [
        Contact(name: "张三", phone: "138-0000-0001", department: "技术部"),
        Contact(name: "李四", phone: "138-0000-0002", department: "市场部"),
        Contact(name: "王五", phone: "138-0000-0003", department: "技术部"),
        Contact(name: "赵六", phone: "138-0000-0004", department: "人事部"),
        Contact(name: "钱七", phone: "138-0000-0005", department: "市场部")
    ]

    @State private var searchText = ""
    @State private var selectedDepartment: String?

    var departments: [String] {
        Array(Set(allContacts.map { $0.department })).sorted()
    }

    var filteredContacts: [Contact] {
        var result = allContacts

        if let department = selectedDepartment {
            result = result.filter { $0.department == department }
        }

        if !searchText.isEmpty {
            result = result.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.phone.contains(searchText)
            }
        }

        return result
    }

    var body: some View {
        NavigationView {
            List {
                // 部门筛选
                Section {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            FilterChip(
                                title: "全部",
                                isSelected: selectedDepartment == nil
                            ) {
                                selectedDepartment = nil
                            }

                            ForEach(departments, id: \.self) { dept in
                                FilterChip(
                                    title: dept,
                                    isSelected: selectedDepartment == dept
                                ) {
                                    selectedDepartment = dept
                                }
                            }
                        }
                        .padding(.horizontal, 4)
                    }
                }
                .listRowInsets(EdgeInsets())
                .listRowBackground(Color.clear)

                // 联系人列表
                Section("联系人 (\(filteredContacts.count))") {
                    ForEach(filteredContacts) { contact in
                        HStack {
                            Circle()
                                .fill(Color.blue.opacity(0.2))
                                .frame(width: 40, height: 40)
                                .overlay(
                                    Text(String(contact.name.prefix(1)))
                                        .fontWeight(.semibold)
                                )

                            VStack(alignment: .leading) {
                                Text(contact.name)
                                    .font(.headline)
                                Text(contact.phone)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            Spacer()

                            Text(contact.department)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(4)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("通讯录")
            .searchable(text: $searchText, prompt: "搜索姓名或电话")
        }
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.blue : Color.gray.opacity(0.1))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(16)
        }
    }
}
```

## 动画与过渡

### 隐式动画

```swift
struct ImplicitAnimationExample: View {
    @State private var isExpanded = false
    @State private var rotation: Double = 0

    var body: some View {
        VStack(spacing: 40) {
            // 大小和颜色动画
            RoundedRectangle(cornerRadius: isExpanded ? 30 : 10)
                .fill(isExpanded ? Color.blue : Color.red)
                .frame(
                    width: isExpanded ? 200 : 100,
                    height: isExpanded ? 200 : 100
                )
                .animation(.spring(response: 0.5, dampingFraction: 0.6), value: isExpanded)
                .onTapGesture {
                    isExpanded.toggle()
                }

            // 旋转动画
            Image(systemName: "gear")
                .font(.system(size: 50))
                .rotationEffect(.degrees(rotation))
                .animation(.linear(duration: 2).repeatForever(autoreverses: false), value: rotation)
                .onAppear {
                    rotation = 360
                }

            Button(isExpanded ? "收缩" : "展开") {
                isExpanded.toggle()
            }
            .buttonStyle(.borderedProminent)
        }
    }
}
```

### 显式动画

```swift
struct ExplicitAnimationExample: View {
    @State private var scale: CGFloat = 1.0
    @State private var opacity: Double = 1.0
    @State private var offset: CGFloat = 0

    var body: some View {
        VStack(spacing: 30) {
            // 缩放动画
            Circle()
                .fill(Color.purple)
                .frame(width: 100, height: 100)
                .scaleEffect(scale)
                .opacity(opacity)

            HStack(spacing: 20) {
                Button("弹跳") {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.3)) {
                        scale = 1.3
                    }
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.3).delay(0.1)) {
                        scale = 1.0
                    }
                }
                .buttonStyle(.bordered)

                Button("淡入淡出") {
                    withAnimation(.easeInOut(duration: 0.5)) {
                        opacity = 0.3
                    }
                    withAnimation(.easeInOut(duration: 0.5).delay(0.5)) {
                        opacity = 1.0
                    }
                }
                .buttonStyle(.bordered)
            }

            Divider()

            // 位移动画
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.orange)
                .frame(width: 60, height: 60)
                .offset(x: offset)

            HStack {
                Button("左移") {
                    withAnimation(.easeOut) {
                        offset = -100
                    }
                }
                .buttonStyle(.bordered)

                Button("居中") {
                    withAnimation(.spring()) {
                        offset = 0
                    }
                }
                .buttonStyle(.borderedProminent)

                Button("右移") {
                    withAnimation(.easeOut) {
                        offset = 100
                    }
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
    }
}
```

### 过渡效果

```swift
struct TransitionExample: View {
    @State private var showCard = false
    @State private var items = [1, 2, 3]

    var body: some View {
        VStack(spacing: 30) {
            // 卡片过渡
            Button(showCard ? "隐藏卡片" : "显示卡片") {
                withAnimation(.spring()) {
                    showCard.toggle()
                }
            }
            .buttonStyle(.borderedProminent)

            if showCard {
                VStack(spacing: 12) {
                    Text("欢迎!")
                        .font(.title)
                        .fontWeight(.bold)

                    Text("这是一个带有过渡动画的卡片")
                        .foregroundColor(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(16)
                .transition(.asymmetric(
                    insertion: .scale.combined(with: .opacity),
                    removal: .slide.combined(with: .opacity)
                ))
            }

            Divider()

            // 列表项过渡
            VStack {
                HStack {
                    Button("添加") {
                        withAnimation {
                            items.append(items.count + 1)
                        }
                    }
                    .buttonStyle(.bordered)

                    Button("移除") {
                        withAnimation {
                            if !items.isEmpty {
                                items.removeLast()
                            }
                        }
                    }
                    .buttonStyle(.bordered)
                    .disabled(items.isEmpty)
                }

                VStack(spacing: 8) {
                    ForEach(items, id: \.self) { item in
                        HStack {
                            Text("项目 \(item)")
                            Spacer()
                        }
                        .padding()
                        .background(Color.green.opacity(0.1))
                        .cornerRadius(8)
                        .transition(.move(edge: .trailing).combined(with: .opacity))
                    }
                }
            }
        }
        .padding()
    }
}
```

### 自定义过渡

```swift
struct CustomTransition: ViewModifier {
    let isActive: Bool

    func body(content: Content) -> some View {
        content
            .scaleEffect(isActive ? 1 : 0.5)
            .opacity(isActive ? 1 : 0)
            .rotation3DEffect(
                .degrees(isActive ? 0 : 90),
                axis: (x: 1, y: 0, z: 0)
            )
    }
}

extension AnyTransition {
    static var flip: AnyTransition {
        .modifier(
            active: CustomTransition(isActive: false),
            identity: CustomTransition(isActive: true)
        )
    }
}

struct CustomTransitionExample: View {
    @State private var showContent = false

    var body: some View {
        VStack(spacing: 30) {
            Button("切换") {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                    showContent.toggle()
                }
            }
            .buttonStyle(.borderedProminent)

            if showContent {
                VStack {
                    Image(systemName: "star.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.yellow)

                    Text("自定义翻转过渡")
                        .font(.headline)
                }
                .padding()
                .background(Color.purple.opacity(0.1))
                .cornerRadius(16)
                .transition(.flip)
            }
        }
        .frame(height: 300)
    }
}
```

## 实战项目：笔记应用

```swift
// 数据模型
class NotesViewModel: ObservableObject {
    struct Note: Identifiable, Codable {
        var id = UUID()
        var title: String
        var content: String
        var createdAt: Date
        var updatedAt: Date
        var isPinned: Bool
        var color: NoteColor

        enum NoteColor: String, Codable, CaseIterable {
            case white, yellow, green, blue, purple

            var color: Color {
                switch self {
                case .white: return .white
                case .yellow: return .yellow.opacity(0.3)
                case .green: return .green.opacity(0.3)
                case .blue: return .blue.opacity(0.3)
                case .purple: return .purple.opacity(0.3)
                }
            }
        }
    }

    @Published var notes: [Note] = []
    @Published var searchText = ""

    var filteredNotes: [Note] {
        let sorted = notes.sorted { note1, note2 in
            if note1.isPinned != note2.isPinned {
                return note1.isPinned
            }
            return note1.updatedAt > note2.updatedAt
        }

        if searchText.isEmpty {
            return sorted
        }

        return sorted.filter {
            $0.title.localizedCaseInsensitiveContains(searchText) ||
            $0.content.localizedCaseInsensitiveContains(searchText)
        }
    }

    func addNote() -> Note {
        let note = Note(
            title: "",
            content: "",
            createdAt: Date(),
            updatedAt: Date(),
            isPinned: false,
            color: .white
        )
        notes.insert(note, at: 0)
        return note
    }

    func updateNote(_ note: Note) {
        if let index = notes.firstIndex(where: { $0.id == note.id }) {
            var updatedNote = note
            updatedNote.updatedAt = Date()
            notes[index] = updatedNote
        }
    }

    func deleteNote(_ note: Note) {
        notes.removeAll { $0.id == note.id }
    }

    func togglePin(_ note: Note) {
        if let index = notes.firstIndex(where: { $0.id == note.id }) {
            notes[index].isPinned.toggle()
        }
    }
}

// 主视图
struct NotesApp: View {
    @StateObject private var viewModel = NotesViewModel()
    @State private var selectedNote: NotesViewModel.Note?
    @State private var showingNewNote = false

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.filteredNotes) { note in
                    NoteRowView(note: note)
                        .onTapGesture {
                            selectedNote = note
                        }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                withAnimation {
                                    viewModel.deleteNote(note)
                                }
                            } label: {
                                Label("删除", systemImage: "trash")
                            }
                        }
                        .swipeActions(edge: .leading) {
                            Button {
                                withAnimation {
                                    viewModel.togglePin(note)
                                }
                            } label: {
                                Label(
                                    note.isPinned ? "取消置顶" : "置顶",
                                    systemImage: note.isPinned ? "pin.slash" : "pin"
                                )
                            }
                            .tint(.orange)
                        }
                }
            }
            .listStyle(.plain)
            .navigationTitle("我的笔记")
            .searchable(text: $viewModel.searchText, prompt: "搜索笔记")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        let note = viewModel.addNote()
                        selectedNote = note
                    } label: {
                        Image(systemName: "square.and.pencil")
                    }
                }
            }
            .sheet(item: $selectedNote) { note in
                NoteEditorView(viewModel: viewModel, note: note)
            }
        }
    }
}

// 笔记行视图
struct NoteRowView: View {
    let note: NotesViewModel.Note

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            if note.isPinned {
                Image(systemName: "pin.fill")
                    .font(.caption)
                    .foregroundColor(.orange)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(note.title.isEmpty ? "无标题" : note.title)
                    .font(.headline)
                    .lineLimit(1)

                Text(note.content.isEmpty ? "无内容" : note.content)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)

                Text(note.updatedAt, style: .relative)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding(.vertical, 4)
        .listRowBackground(note.color.color)
    }
}

// 笔记编辑器
struct NoteEditorView: View {
    @ObservedObject var viewModel: NotesViewModel
    @State var note: NotesViewModel.Note
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                TextField("标题", text: $note.title)
                    .font(.title2)
                    .fontWeight(.semibold)
                    .padding()

                Divider()

                TextEditor(text: $note.content)
                    .padding()

                // 颜色选择器
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(NotesViewModel.Note.NoteColor.allCases, id: \.self) { color in
                            Circle()
                                .fill(color.color)
                                .frame(width: 30, height: 30)
                                .overlay(
                                    Circle()
                                        .stroke(Color.gray, lineWidth: 1)
                                )
                                .overlay(
                                    Image(systemName: "checkmark")
                                        .font(.caption)
                                        .opacity(note.color == color ? 1 : 0)
                                )
                                .onTapGesture {
                                    note.color = color
                                }
                        }
                    }
                    .padding()
                }
                .background(Color.gray.opacity(0.1))
            }
            .background(note.color.color)
            .navigationTitle("编辑笔记")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("取消") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("保存") {
                        viewModel.updateNote(note)
                        dismiss()
                    }
                }
            }
        }
    }
}
```

## 最佳实践

### 性能优化

```swift
// 1. 使用 Lazy 容器处理大量数据
struct OptimizedList: View {
    let items = Array(1...10000)

    var body: some View {
        ScrollView {
            LazyVStack {
                ForEach(items, id: \.self) { item in
                    Text("Item \(item)")
                        .padding()
                }
            }
        }
    }
}

// 2. 使用 Equatable 避免不必要的重绘
struct OptimizedRow: View, Equatable {
    let title: String
    let subtitle: String

    static func == (lhs: OptimizedRow, rhs: OptimizedRow) -> Bool {
        lhs.title == rhs.title && lhs.subtitle == rhs.subtitle
    }

    var body: some View {
        VStack(alignment: .leading) {
            Text(title)
            Text(subtitle).foregroundColor(.secondary)
        }
    }
}

// 3. 提取子视图减少重绘范围
struct ParentView: View {
    @State private var counter = 0

    var body: some View {
        VStack {
            // 只有这部分会因 counter 变化而重绘
            Text("Counter: \(counter)")
            Button("Increment") { counter += 1 }

            // 这是独立的子视图，不会因 counter 变化重绘
            ExpensiveChildView()
        }
    }
}

struct ExpensiveChildView: View {
    var body: some View {
        // 复杂的视图内容
        Text("This view is expensive")
    }
}
```

### 代码组织

```swift
// 按功能模块组织代码
// Features/
//   Home/
//     HomeView.swift
//     HomeViewModel.swift
//   Profile/
//     ProfileView.swift
//     ProfileViewModel.swift
// Components/
//   Buttons/
//     PrimaryButton.swift
//   Cards/
//     ProductCard.swift
// Models/
//   User.swift
//   Product.swift
// Services/
//   NetworkService.swift
//   StorageService.swift

// 使用扩展分离视图逻辑
struct ComplexView: View {
    @StateObject private var viewModel = ComplexViewModel()

    var body: some View {
        VStack {
            headerSection
            contentSection
            footerSection
        }
    }
}

// 分离各部分
private extension ComplexView {
    var headerSection: some View {
        HStack {
            Text("Header")
            Spacer()
            Button("Action") { }
        }
        .padding()
    }

    var contentSection: some View {
        ScrollView {
            // 内容
        }
    }

    var footerSection: some View {
        HStack {
            // 底部内容
        }
    }
}
```

## 总结

SwiftUI 是 Apple 平台开发的未来方向，它带来了革命性的声明式编程体验。本文涵盖了：

- **声明式 UI 基础**: 理解声明式编程范式和 View 协议
- **核心视图组件**: 文本、图片、按钮和输入控件
- **布局系统**: Stack、Grid、Spacer 的灵活运用
- **视图修饰符**: 常用修饰符和自定义修饰符
- **状态管理**: @State、@Binding、@ObservedObject、@StateObject、@EnvironmentObject 的正确使用
- **导航系统**: NavigationStack、Sheet、TabView 的实现
- **列表与数据**: List 的各种用法和数据绑定
- **动画与过渡**: 隐式动画、显式动画和自定义过渡

掌握这些核心概念后，你将能够构建出色的跨平台应用。SwiftUI 的学习曲线虽然存在，但其带来的开发效率提升和代码质量改进是非常值得的。持续实践和探索将帮助你成为 SwiftUI 开发专家。
