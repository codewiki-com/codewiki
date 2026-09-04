---
title: Auto Layout 布局系统
description: 掌握 iOS Auto Layout，构建适应所有 Apple 设备和屏幕尺寸的自适应、基于约束的用户界面
track: swift
section: swiftui
difficulty: intermediate
tags:
  - Swift
  - iOS
  - Auto Layout
  - UIKit
  - 约束
  - 自适应UI
status: imported
origin: old/src/content/docs/swift/auto-layout.zh.md
divergence: 0.225
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - h1-in-body
legacy:
  category: Swift
  subcategory: ""
  order: 2
  lastUpdated: 2026-01-21
---

## 概念解释

Auto Layout 是 Apple 的基于约束的布局系统，它根据你定义的数学关系（约束）自动计算视图的大小和位置。与需要手动指定精确坐标的 frame 布局不同，Auto Layout 使你能够创建灵活的界面，适应不同的屏幕尺寸、方向和动态内容。

该系统通过求解线性方程组来工作，其中每个约束代表视图属性之间的关系。当布局引擎接收到约束时，它会计算满足所有要求的最优解，从而为每个视图生成最终的 frame。

关键特性：
- **声明式**：你描述关系，而非精确位置
- **动态**：当内容或边界改变时布局自动更新
- **自适应**：相同的布局在不同设备和方向下都能工作
- **基于优先级**：通过约束优先级解决冲突

## 核心原理

### 约束解析

每个约束代表一个线性方程：

```
item1.attribute1 = multiplier * item2.attribute2 + constant
```

例如，一个表示"按钮的前边缘距离容器前边缘 20 点"的约束：

```swift
button.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 20)
// button.leading = 1.0 * container.leading + 20
```

### 约束属性

视图有多个可约束的属性：

```
位置锚点：
- leadingAnchor, trailingAnchor（尊重 RTL 语言）
- leftAnchor, rightAnchor（绝对位置，很少使用）
- topAnchor, bottomAnchor
- centerXAnchor, centerYAnchor

尺寸锚点：
- widthAnchor, heightAnchor

基线锚点：
- firstBaselineAnchor（文本顶部）
- lastBaselineAnchor（文本底部）
```

### 布局指南

布局指南提供布局锚点而不渲染内容：

```swift
// 安全区域 - 避开刘海、Home 指示器、导航栏
view.safeAreaLayoutGuide.topAnchor

// 布局边距 - 遵循系统定义的边距
view.layoutMarginsGuide.leadingAnchor

// 可读内容指南 - 最佳阅读宽度
view.readableContentGuide.widthAnchor

// 键盘布局指南（iOS 15+）
view.keyboardLayoutGuide.topAnchor
```

### 固有内容尺寸

某些视图根据其内容有自然尺寸：

```swift
// UILabel：适应其文本
// UIButton：适应标题 + 图片 + 内边距
// UIImageView：匹配图片尺寸
// UISwitch：固定系统尺寸

class CustomView: UIView {
    override var intrinsicContentSize: CGSize {
        // 根据内容返回自然尺寸
        return CGSize(width: 100, height: 50)
    }

    func contentChanged() {
        // 通知系统固有尺寸已改变
        invalidateIntrinsicContentSize()
    }
}
```

## 核心要点

### 1. 内容拥抱和压缩阻力

这些优先级控制视图如何抵抗被拉伸或压缩：

```swift
// 内容拥抱：抵抗变得比固有尺寸更大
// 优先级越高 = 抵抗拉伸的力度越强
label.setContentHuggingPriority(.defaultHigh, for: .horizontal)

// 压缩阻力：抵抗变得比固有尺寸更小
// 优先级越高 = 抵抗压缩的力度越强
label.setContentCompressionResistancePriority(.required, for: .horizontal)
```

示例：两个并排的标签 - 哪个会被拉伸？

```swift
class TwoLabelCell: UITableViewCell {
    let titleLabel = UILabel()
    let valueLabel = UILabel()

    func setupConstraints() {
        // 标题应该拥抱内容（不拉伸）
        titleLabel.setContentHuggingPriority(.defaultHigh, for: .horizontal)

        // 值可以拉伸以填充剩余空间
        valueLabel.setContentHuggingPriority(.defaultLow, for: .horizontal)

        NSLayoutConstraint.activate([
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            titleLabel.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),

            valueLabel.leadingAnchor.constraint(equalTo: titleLabel.trailingAnchor, constant: 8),
            valueLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            valueLabel.centerYAnchor.constraint(equalTo: contentView.centerYAnchor)
        ])
    }
}
```

### 2. 约束优先级

优先级范围从 1 到 1000：

```swift
// 系统定义的优先级
UILayoutPriority.required       // 1000 - 必须满足
UILayoutPriority.defaultHigh    // 750
UILayoutPriority.defaultLow     // 250
UILayoutPriority.fittingSizeLevel // 50

// 自定义优先级
let customPriority = UILayoutPriority(rawValue: 999)
```

创建可选约束：

```swift
let minWidthConstraint = button.widthAnchor.constraint(greaterThanOrEqualToConstant: 100)
minWidthConstraint.priority = .required

let preferredWidthConstraint = button.widthAnchor.constraint(equalToConstant: 200)
preferredWidthConstraint.priority = .defaultHigh // 如果需要可以被打破

NSLayoutConstraint.activate([minWidthConstraint, preferredWidthConstraint])
```

### 3. 歧义和冲突

**布局歧义**：存在多个有效解（约束不足）

```swift
// 歧义：没有定义水平位置
label.translatesAutoresizingMaskIntoConstraints = false
NSLayoutConstraint.activate([
    label.topAnchor.constraint(equalTo: view.topAnchor),
    label.widthAnchor.constraint(equalToConstant: 100)
    // 缺少：leading、trailing 或 centerX 约束
])

// 调试歧义
view.hasAmbiguousLayout // 如果有歧义则为 true
view.exerciseAmbiguityInLayout() // 在有效解之间动画
```

**约束冲突**：不存在有效解（约束过多）

```swift
// 冲突：无法同时满足两个宽度约束
NSLayoutConstraint.activate([
    view.widthAnchor.constraint(equalToConstant: 100),
    view.widthAnchor.constraint(equalToConstant: 200) // 冲突！
])
```

### 4. 栈视图

UIStackView 简化了常见的布局模式：

```swift
class FormStackView: UIView {

    private lazy var stackView: UIStackView = {
        let stack = UIStackView()
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 16
        stack.alignment = .fill
        stack.distribution = .fill
        return stack
    }()

    func setupForm() {
        addSubview(stackView)

        NSLayoutConstraint.activate([
            stackView.topAnchor.constraint(equalTo: safeAreaLayoutGuide.topAnchor, constant: 20),
            stackView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 20),
            stackView.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -20)
        ])

        // 添加排列的子视图
        let nameField = createTextField(placeholder: "姓名")
        let emailField = createTextField(placeholder: "邮箱")
        let submitButton = createButton(title: "提交")

        stackView.addArrangedSubview(nameField)
        stackView.addArrangedSubview(emailField)
        stackView.addArrangedSubview(submitButton)

        // 特定视图后的自定义间距
        stackView.setCustomSpacing(32, after: emailField)
    }

    func toggleFieldVisibility(_ field: UIView, visible: Bool) {
        UIView.animate(withDuration: 0.3) {
            field.isHidden = !visible
            // 栈视图自动更新布局
        }
    }
}
```

## 代码示例

### 使用锚点的纯代码约束

```swift
class ProfileViewController: UIViewController {

    private let avatarImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.backgroundColor = .systemGray5
        return imageView
    }()

    private let nameLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: 24, weight: .bold)
        label.textAlignment = .center
        return label
    }()

    private let bioLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: 16)
        label.textColor = .secondaryLabel
        label.numberOfLines = 0
        label.textAlignment = .center
        return label
    }()

    private let followButton: UIButton = {
        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.setTitle("关注", for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 16, weight: .semibold)
        button.backgroundColor = .systemBlue
        button.setTitleColor(.white, for: .normal)
        button.layer.cornerRadius = 8
        return button
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupViews()
        setupConstraints()
    }

    private func setupViews() {
        view.backgroundColor = .systemBackground
        view.addSubview(avatarImageView)
        view.addSubview(nameLabel)
        view.addSubview(bioLabel)
        view.addSubview(followButton)
    }

    private func setupConstraints() {
        // 存储约束以便后续动画
        NSLayoutConstraint.activate([
            // 头像：水平居中，固定尺寸，靠近顶部
            avatarImageView.topAnchor.constraint(
                equalTo: view.safeAreaLayoutGuide.topAnchor,
                constant: 32
            ),
            avatarImageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            avatarImageView.widthAnchor.constraint(equalToConstant: 120),
            avatarImageView.heightAnchor.constraint(equalTo: avatarImageView.widthAnchor),

            // 姓名：头像下方，水平有内边距
            nameLabel.topAnchor.constraint(
                equalTo: avatarImageView.bottomAnchor,
                constant: 16
            ),
            nameLabel.leadingAnchor.constraint(
                equalTo: view.readableContentGuide.leadingAnchor
            ),
            nameLabel.trailingAnchor.constraint(
                equalTo: view.readableContentGuide.trailingAnchor
            ),

            // 简介：姓名下方，相同的水平约束
            bioLabel.topAnchor.constraint(
                equalTo: nameLabel.bottomAnchor,
                constant: 8
            ),
            bioLabel.leadingAnchor.constraint(equalTo: nameLabel.leadingAnchor),
            bioLabel.trailingAnchor.constraint(equalTo: nameLabel.trailingAnchor),

            // 按钮：简介下方，固定高度，水平有内边距
            followButton.topAnchor.constraint(
                equalTo: bioLabel.bottomAnchor,
                constant: 24
            ),
            followButton.leadingAnchor.constraint(
                equalTo: view.leadingAnchor,
                constant: 40
            ),
            followButton.trailingAnchor.constraint(
                equalTo: view.trailingAnchor,
                constant: -40
            ),
            followButton.heightAnchor.constraint(equalToConstant: 44)
        ])
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // 布局后设置头像圆角
        avatarImageView.layer.cornerRadius = avatarImageView.bounds.width / 2
    }
}
```

### 带动画的动态约束变化

```swift
class ExpandableCardView: UIView {

    private var isExpanded = false
    private var heightConstraint: NSLayoutConstraint!
    private var detailsBottomConstraint: NSLayoutConstraint!

    private let headerView = UIView()
    private let detailsView = UIView()

    func setupConstraints() {
        headerView.translatesAutoresizingMaskIntoConstraints = false
        detailsView.translatesAutoresizingMaskIntoConstraints = false

        addSubview(headerView)
        addSubview(detailsView)

        // 折叠时的高度约束（默认激活）
        heightConstraint = heightAnchor.constraint(equalToConstant: 80)

        // 详情底部约束（折叠时不激活）
        detailsBottomConstraint = detailsView.bottomAnchor.constraint(
            equalTo: bottomAnchor,
            constant: -16
        )

        NSLayoutConstraint.activate([
            headerView.topAnchor.constraint(equalTo: topAnchor),
            headerView.leadingAnchor.constraint(equalTo: leadingAnchor),
            headerView.trailingAnchor.constraint(equalTo: trailingAnchor),
            headerView.heightAnchor.constraint(equalToConstant: 80),

            detailsView.topAnchor.constraint(equalTo: headerView.bottomAnchor),
            detailsView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            detailsView.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16),

            heightConstraint
        ])
    }

    func toggleExpansion() {
        isExpanded.toggle()

        if isExpanded {
            // 停用固定高度，激活底部约束
            heightConstraint.isActive = false
            detailsBottomConstraint.isActive = true
        } else {
            // 停用底部约束，激活固定高度
            detailsBottomConstraint.isActive = false
            heightConstraint.isActive = true
        }

        UIView.animate(
            withDuration: 0.3,
            delay: 0,
            usingSpringWithDamping: 0.8,
            initialSpringVelocity: 0,
            options: .curveEaseInOut
        ) {
            self.superview?.layoutIfNeeded()
            self.detailsView.alpha = self.isExpanded ? 1 : 0
        }
    }
}
```

### 自适应尺寸的表格单元格

```swift
class ArticleCell: UITableViewCell {

    private let titleLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: 18, weight: .semibold)
        label.numberOfLines = 0 // 支持多行
        return label
    }()

    private let excerptLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: 14)
        label.textColor = .secondaryLabel
        label.numberOfLines = 3
        return label
    }()

    private let thumbnailImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = 8
        return imageView
    }()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupCell()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupCell() {
        contentView.addSubview(thumbnailImageView)
        contentView.addSubview(titleLabel)
        contentView.addSubview(excerptLabel)

        NSLayoutConstraint.activate([
            // 缩略图：固定尺寸，前边缘
            thumbnailImageView.leadingAnchor.constraint(
                equalTo: contentView.leadingAnchor,
                constant: 16
            ),
            thumbnailImageView.topAnchor.constraint(
                equalTo: contentView.topAnchor,
                constant: 12
            ),
            thumbnailImageView.widthAnchor.constraint(equalToConstant: 80),
            thumbnailImageView.heightAnchor.constraint(equalToConstant: 80),

            // 标题：缩略图旁边
            titleLabel.leadingAnchor.constraint(
                equalTo: thumbnailImageView.trailingAnchor,
                constant: 12
            ),
            titleLabel.trailingAnchor.constraint(
                equalTo: contentView.trailingAnchor,
                constant: -16
            ),
            titleLabel.topAnchor.constraint(equalTo: thumbnailImageView.topAnchor),

            // 摘要：标题下方
            excerptLabel.leadingAnchor.constraint(equalTo: titleLabel.leadingAnchor),
            excerptLabel.trailingAnchor.constraint(equalTo: titleLabel.trailingAnchor),
            excerptLabel.topAnchor.constraint(
                equalTo: titleLabel.bottomAnchor,
                constant: 4
            ),

            // 自适应尺寸的底部约束
            // 对缩略图和摘要使用 greaterThanOrEqualTo
            contentView.bottomAnchor.constraint(
                greaterThanOrEqualTo: thumbnailImageView.bottomAnchor,
                constant: 12
            ),
            contentView.bottomAnchor.constraint(
                greaterThanOrEqualTo: excerptLabel.bottomAnchor,
                constant: 12
            )
        ])
    }

    func configure(title: String, excerpt: String, image: UIImage?) {
        titleLabel.text = title
        excerptLabel.text = excerpt
        thumbnailImageView.image = image
    }
}

// 表格视图配置
class ArticleListViewController: UIViewController {

    private let tableView = UITableView()

    override func viewDidLoad() {
        super.viewDidLoad()

        // 启用自适应尺寸的单元格
        tableView.rowHeight = UITableView.automaticDimension
        tableView.estimatedRowHeight = 100

        tableView.register(ArticleCell.self, forCellReuseIdentifier: "ArticleCell")
    }
}
```

### 使用布局指南的键盘避让

```swift
class ChatInputViewController: UIViewController {

    private let inputContainer = UIView()
    private let textField = UITextField()
    private let sendButton = UIButton(type: .system)

    private var inputBottomConstraint: NSLayoutConstraint!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupViews()
        setupConstraints()
    }

    private func setupConstraints() {
        inputContainer.translatesAutoresizingMaskIntoConstraints = false
        textField.translatesAutoresizingMaskIntoConstraints = false
        sendButton.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(inputContainer)
        inputContainer.addSubview(textField)
        inputContainer.addSubview(sendButton)

        // iOS 15+ 键盘布局指南
        if #available(iOS 15.0, *) {
            inputBottomConstraint = inputContainer.bottomAnchor.constraint(
                equalTo: view.keyboardLayoutGuide.topAnchor
            )
        } else {
            inputBottomConstraint = inputContainer.bottomAnchor.constraint(
                equalTo: view.safeAreaLayoutGuide.bottomAnchor
            )
        }

        NSLayoutConstraint.activate([
            inputContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            inputContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            inputBottomConstraint,
            inputContainer.heightAnchor.constraint(equalToConstant: 50),

            textField.leadingAnchor.constraint(
                equalTo: inputContainer.leadingAnchor,
                constant: 16
            ),
            textField.centerYAnchor.constraint(equalTo: inputContainer.centerYAnchor),

            sendButton.leadingAnchor.constraint(
                equalTo: textField.trailingAnchor,
                constant: 8
            ),
            sendButton.trailingAnchor.constraint(
                equalTo: inputContainer.trailingAnchor,
                constant: -16
            ),
            sendButton.centerYAnchor.constraint(equalTo: inputContainer.centerYAnchor),
            sendButton.widthAnchor.constraint(equalToConstant: 60)
        ])
    }

    // iOS 15 以下的回退方案
    private func setupKeyboardObservers() {
        guard #unavailable(iOS 15.0) else { return }

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(keyboardWillChangeFrame),
            name: UIResponder.keyboardWillChangeFrameNotification,
            object: nil
        )
    }

    @objc private func keyboardWillChangeFrame(_ notification: Notification) {
        guard let frame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
              let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double
        else { return }

        let keyboardHeight = view.bounds.height - frame.origin.y
        inputBottomConstraint.constant = -max(keyboardHeight - view.safeAreaInsets.bottom, 0)

        UIView.animate(withDuration: duration) {
            self.view.layoutIfNeeded()
        }
    }
}
```

## 最佳实践

### 1. 逻辑性地组织约束

```swift
class WellOrganizedView: UIView {

    private func setupConstraints() {
        // 按视图分组，一次性激活所有约束
        var constraints: [NSLayoutConstraint] = []

        // 头部约束
        constraints += [
            headerView.topAnchor.constraint(equalTo: topAnchor),
            headerView.leadingAnchor.constraint(equalTo: leadingAnchor),
            headerView.trailingAnchor.constraint(equalTo: trailingAnchor),
            headerView.heightAnchor.constraint(equalToConstant: 60)
        ]

        // 内容约束
        constraints += [
            contentView.topAnchor.constraint(equalTo: headerView.bottomAnchor),
            contentView.leadingAnchor.constraint(equalTo: leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: bottomAnchor)
        ]

        NSLayoutConstraint.activate(constraints)
    }
}
```

### 2. 使用约束标识符便于调试

```swift
let widthConstraint = view.widthAnchor.constraint(equalToConstant: 100)
widthConstraint.identifier = "ProfileImage.width"

let heightConstraint = view.heightAnchor.constraint(equalTo: view.widthAnchor)
heightConstraint.identifier = "ProfileImage.aspectRatio"

// 控制台输出："Unable to simultaneously satisfy constraints... ProfileImage.width"
```

### 3. 优先使用锚点而非可视化格式语言

```swift
// 推荐：锚点语法 - 类型安全，意图清晰
NSLayoutConstraint.activate([
    label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
    label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
    label.topAnchor.constraint(equalTo: view.topAnchor, constant: 8)
])

// 避免：可视化格式语言 - 基于字符串，容易出错
NSLayoutConstraint.constraints(
    withVisualFormat: "H:|-16-[label]-16-|",
    options: [],
    metrics: nil,
    views: ["label": label]
)
```

### 4. 创建可复用的约束辅助方法

```swift
extension UIView {
    func pinToEdges(of view: UIView, padding: CGFloat = 0) {
        translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            topAnchor.constraint(equalTo: view.topAnchor, constant: padding),
            leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: padding),
            trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -padding),
            bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -padding)
        ])
    }

    func pinToSafeArea(of view: UIView, padding: CGFloat = 0) {
        translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: padding),
            leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: padding),
            trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -padding),
            bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -padding)
        ])
    }

    func centerInSuperview() {
        guard let superview = superview else { return }
        translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            centerXAnchor.constraint(equalTo: superview.centerXAnchor),
            centerYAnchor.constraint(equalTo: superview.centerYAnchor)
        ])
    }

    func setSize(width: CGFloat? = nil, height: CGFloat? = nil) {
        translatesAutoresizingMaskIntoConstraints = false
        var constraints: [NSLayoutConstraint] = []
        if let width = width {
            constraints.append(widthAnchor.constraint(equalToConstant: width))
        }
        if let height = height {
            constraints.append(heightAnchor.constraint(equalToConstant: height))
        }
        NSLayoutConstraint.activate(constraints)
    }
}

// 使用
imageView.pinToEdges(of: containerView, padding: 8)
button.centerInSuperview()
avatar.setSize(width: 44, height: 44)
```

## 常见陷阱

### 1. 忘记设置 translatesAutoresizingMaskIntoConstraints

```swift
// 错误 - 视图仍然使用自动调整大小掩码
let label = UILabel()
view.addSubview(label)
NSLayoutConstraint.activate([
    label.centerXAnchor.constraint(equalTo: view.centerXAnchor)
])
// 来自自动调整大小掩码的约束冲突！

// 正确 - 禁用自动调整大小掩码转换
let label = UILabel()
label.translatesAutoresizingMaskIntoConstraints = false
view.addSubview(label)
NSLayoutConstraint.activate([
    label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
    label.centerYAnchor.constraint(equalTo: view.centerYAnchor)
])
```

### 2. 在添加到视图层级之前激活约束

```swift
// 错误 - 崩溃：视图与父视图没有共同祖先
let button = UIButton()
button.translatesAutoresizingMaskIntoConstraints = false
NSLayoutConstraint.activate([
    button.centerXAnchor.constraint(equalTo: view.centerXAnchor)
])
view.addSubview(button) // 太晚了！

// 正确 - 先添加到层级
let button = UIButton()
button.translatesAutoresizingMaskIntoConstraints = false
view.addSubview(button)
NSLayoutConstraint.activate([
    button.centerXAnchor.constraint(equalTo: view.centerXAnchor),
    button.centerYAnchor.constraint(equalTo: view.centerYAnchor)
])
```

### 3. 修改约束而非常量

```swift
// 错误 - 反复停用和创建新约束
func updateHeight(_ height: CGFloat) {
    NSLayoutConstraint.deactivate([heightConstraint])
    heightConstraint = view.heightAnchor.constraint(equalToConstant: height)
    NSLayoutConstraint.activate([heightConstraint])
}

// 正确 - 修改常量
private var heightConstraint: NSLayoutConstraint!

func setupConstraints() {
    heightConstraint = view.heightAnchor.constraint(equalToConstant: 100)
    NSLayoutConstraint.activate([heightConstraint])
}

func updateHeight(_ height: CGFloat) {
    heightConstraint.constant = height
    UIView.animate(withDuration: 0.3) {
        self.view.layoutIfNeeded()
    }
}
```

### 4. 约束引用导致的循环引用

```swift
// 错误 - 闭包中的强引用可能导致循环引用
class BadViewController: UIViewController {
    var updateLayout: (() -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        let constraint = label.widthAnchor.constraint(equalToConstant: 100)
        updateLayout = {
            constraint.constant = 200
            self.view.layoutIfNeeded() // 对 self 的强引用
        }
    }
}

// 正确 - 使用 weak self
class GoodViewController: UIViewController {
    var updateLayout: (() -> Void)?
    private var widthConstraint: NSLayoutConstraint!

    override func viewDidLoad() {
        super.viewDidLoad()
        widthConstraint = label.widthAnchor.constraint(equalToConstant: 100)
        updateLayout = { [weak self] in
            self?.widthConstraint.constant = 200
            self?.view.layoutIfNeeded()
        }
    }
}
```

## 性能考量

### 1. 最小化约束变化

```swift
// 避免 - 多次布局传递
func updateMultipleViews() {
    constraint1.constant = 10
    view.layoutIfNeeded() // 布局传递 1

    constraint2.constant = 20
    view.layoutIfNeeded() // 布局传递 2

    constraint3.constant = 30
    view.layoutIfNeeded() // 布局传递 3
}

// 更好 - 单次布局传递
func updateMultipleViews() {
    constraint1.constant = 10
    constraint2.constant = 20
    constraint3.constant = 30
    view.layoutIfNeeded() // 单次布局传递
}
```

### 2. 使用 setNeedsLayout 进行批量更新

```swift
func updateConstraintsFromMultipleSources() {
    // 方法中多次约束更新
    updateHeaderConstraints()
    updateContentConstraints()
    updateFooterConstraints()

    // 最后请求一次布局
    view.setNeedsLayout()
    // 布局在下一个运行循环迭代时发生
}

// 需要立即布局时（例如动画）
func animateConstraintChanges() {
    UIView.animate(withDuration: 0.3) {
        self.constraint.constant = 100
        self.view.layoutIfNeeded() // 强制立即布局
    }
}
```

### 3. 避免复杂的约束关系

```swift
// 避免 - 复杂的乘数关系
NSLayoutConstraint.activate([
    view1.widthAnchor.constraint(equalTo: view2.widthAnchor, multiplier: 0.333),
    view2.widthAnchor.constraint(equalTo: view3.widthAnchor, multiplier: 1.5),
    view3.widthAnchor.constraint(equalTo: container.widthAnchor, multiplier: 0.8)
])

// 更好 - 使用 UIStackView 进行分布
let stackView = UIStackView(arrangedSubviews: [view1, view2, view3])
stackView.distribution = .fillEqually // 或 .fillProportionally
```

### 4. 使用 Instruments 分析

```swift
// 在 scheme 中启用约束调试
// 参数：-UIViewLayoutFeedbackLoopDebuggingThreshold 100

// 或以编程方式
#if DEBUG
func debugLayoutIssues() {
    // 打印约束问题
    for subview in view.subviews {
        if subview.hasAmbiguousLayout {
            print("布局歧义：\(subview)")
            print("约束：\(subview.constraints)")
        }
    }
}
#endif
```

## 实战场景

### iPad 和 iPhone 的自适应布局

```swift
class AdaptiveViewController: UIViewController {

    private var regularConstraints: [NSLayoutConstraint] = []
    private var compactConstraints: [NSLayoutConstraint] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        setupViews()
        setupAdaptiveConstraints()
    }

    private func setupAdaptiveConstraints() {
        let sidebarView = UIView()
        let contentView = UIView()

        sidebarView.translatesAutoresizingMaskIntoConstraints = false
        contentView.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(sidebarView)
        view.addSubview(contentView)

        // 常规宽度（iPad 横屏，大屏 iPhone 横屏）
        regularConstraints = [
            sidebarView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            sidebarView.topAnchor.constraint(equalTo: view.topAnchor),
            sidebarView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            sidebarView.widthAnchor.constraint(equalToConstant: 320),

            contentView.leadingAnchor.constraint(equalTo: sidebarView.trailingAnchor),
            contentView.topAnchor.constraint(equalTo: view.topAnchor),
            contentView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ]

        // 紧凑宽度（iPhone 竖屏）
        compactConstraints = [
            sidebarView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            sidebarView.topAnchor.constraint(equalTo: view.topAnchor),
            sidebarView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            sidebarView.heightAnchor.constraint(equalToConstant: 0), // 隐藏

            contentView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            contentView.topAnchor.constraint(equalTo: view.topAnchor),
            contentView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ]

        updateLayoutForTraitCollection()
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)

        if traitCollection.horizontalSizeClass != previousTraitCollection?.horizontalSizeClass {
            updateLayoutForTraitCollection()
        }
    }

    private func updateLayoutForTraitCollection() {
        if traitCollection.horizontalSizeClass == .regular {
            NSLayoutConstraint.deactivate(compactConstraints)
            NSLayoutConstraint.activate(regularConstraints)
        } else {
            NSLayoutConstraint.deactivate(regularConstraints)
            NSLayoutConstraint.activate(compactConstraints)
        }
    }
}
```

### 动态字体支持

```swift
class AccessibleCell: UITableViewCell {

    private let titleLabel = UILabel()
    private let subtitleLabel = UILabel()

    private var standardConstraints: [NSLayoutConstraint] = []
    private var accessibilityConstraints: [NSLayoutConstraint] = []

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupCell()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupCell() {
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        subtitleLabel.translatesAutoresizingMaskIntoConstraints = false

        // 启用动态字体
        titleLabel.font = .preferredFont(forTextStyle: .headline)
        titleLabel.adjustsFontForContentSizeCategory = true
        titleLabel.numberOfLines = 0

        subtitleLabel.font = .preferredFont(forTextStyle: .subheadline)
        subtitleLabel.adjustsFontForContentSizeCategory = true
        subtitleLabel.numberOfLines = 0

        contentView.addSubview(titleLabel)
        contentView.addSubview(subtitleLabel)

        // 标准布局：并排
        standardConstraints = [
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            titleLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 12),
            titleLabel.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -12),
            titleLabel.widthAnchor.constraint(equalTo: contentView.widthAnchor, multiplier: 0.5, constant: -24),

            subtitleLabel.leadingAnchor.constraint(equalTo: titleLabel.trailingAnchor, constant: 8),
            subtitleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            subtitleLabel.centerYAnchor.constraint(equalTo: titleLabel.centerYAnchor)
        ]

        // 无障碍布局：垂直堆叠
        accessibilityConstraints = [
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            titleLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 12),

            subtitleLabel.leadingAnchor.constraint(equalTo: titleLabel.leadingAnchor),
            subtitleLabel.trailingAnchor.constraint(equalTo: titleLabel.trailingAnchor),
            subtitleLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 4),
            subtitleLabel.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -12)
        ]

        updateLayoutForContentSize()
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)

        if traitCollection.preferredContentSizeCategory != previousTraitCollection?.preferredContentSizeCategory {
            updateLayoutForContentSize()
        }
    }

    private func updateLayoutForContentSize() {
        let isAccessibilityCategory = traitCollection.preferredContentSizeCategory.isAccessibilityCategory

        if isAccessibilityCategory {
            NSLayoutConstraint.deactivate(standardConstraints)
            NSLayoutConstraint.activate(accessibilityConstraints)
        } else {
            NSLayoutConstraint.deactivate(accessibilityConstraints)
            NSLayoutConstraint.activate(standardConstraints)
        }
    }
}
```

## 面试要点

1. **约束方程**：解释线性方程关系（item1.attribute = multiplier * item2.attribute + constant）

2. **固有内容尺寸**：描述它是什么以及哪些视图具有它（标签、按钮、图片视图）

3. **内容拥抱 vs 压缩阻力**：解释区别以及何时使用每个

4. **优先级**：描述优先级如何解决冲突以及何时使用非必需优先级

5. **歧义 vs 冲突**：解释约束不足和约束过多布局之间的区别

6. **安全区域**：描述其用途以及如何处理刘海、Home 指示器和导航栏

7. **栈视图**：解释它们如何简化常见布局模式及其分布选项

8. **性能**：讨论 layoutIfNeeded vs setNeedsLayout 以及批量约束变化

9. **特征集合**：解释如何为不同尺寸类创建自适应布局

10. **调试**：描述查找约束问题的工具（标识符、hasAmbiguousLayout、可视化调试器）

## 延伸阅读

- [Apple Auto Layout 指南](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/AutolayoutPG/)
- [WWDC 2018: 高性能 Auto Layout](https://developer.apple.com/videos/play/wwdc2018/220/)
- [WWDC 2019: 使用自定义操作让应用更易于访问](https://developer.apple.com/videos/play/wwdc2019/250/)
- [UIKit 布局指南文档](https://developer.apple.com/documentation/uikit/uilayoutguide)
- [NSLayoutConstraint 文档](https://developer.apple.com/documentation/uikit/nslayoutconstraint)
- [调试 Auto Layout](https://developer.apple.com/documentation/uikit/uiview/1622517-hasambiguouslayout)
