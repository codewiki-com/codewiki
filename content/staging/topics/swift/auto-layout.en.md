---
title: Auto Layout System
description: Master iOS Auto Layout for building adaptive, constraint-based user interfaces that work across all Apple devices and screen sizes
track: swift
section: swiftui
difficulty: intermediate
tags:
  - Swift
  - iOS
  - Auto Layout
  - UIKit
  - Constraints
  - Adaptive UI
status: imported
origin: old/src/content/docs/swift/auto-layout.en.md
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

## Concept Explanation

Auto Layout is Apple's constraint-based layout system that automatically calculates the size and position of views based on mathematical relationships (constraints) you define. Unlike frame-based layouts where you manually specify exact coordinates, Auto Layout enables you to create flexible interfaces that adapt to different screen sizes, orientations, and dynamic content.

The system works by solving a system of linear equations where each constraint represents a relationship between view attributes. When the layout engine receives constraints, it calculates the optimal solution that satisfies all requirements, producing the final frames for each view.

Key characteristics:
- **Declarative**: You describe relationships, not exact positions
- **Dynamic**: Layouts automatically update when content or bounds change
- **Adaptive**: Same layout works across devices and orientations
- **Priority-based**: Conflicts are resolved through constraint priorities

## Core Principles

### Constraint Anatomy

Every constraint represents a linear equation:

```
item1.attribute1 = multiplier * item2.attribute2 + constant
```

For example, a constraint stating "button's leading edge is 20 points from container's leading edge":

```swift
button.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 20)
// button.leading = 1.0 * container.leading + 20
```

### Constraint Attributes

Views have multiple constrainable attributes:

```
Position Anchors:
- leadingAnchor, trailingAnchor (respects RTL languages)
- leftAnchor, rightAnchor (absolute, rarely used)
- topAnchor, bottomAnchor
- centerXAnchor, centerYAnchor

Dimension Anchors:
- widthAnchor, heightAnchor

Baseline Anchors:
- firstBaselineAnchor (top of text)
- lastBaselineAnchor (bottom of text)
```

### Layout Guides

Layout guides provide layout anchors without rendering content:

```swift
// Safe Area - avoids notches, home indicators, navigation bars
view.safeAreaLayoutGuide.topAnchor

// Layout Margins - respects system-defined margins
view.layoutMarginsGuide.leadingAnchor

// Readable Content Guide - optimal reading width
view.readableContentGuide.widthAnchor

// Keyboard Layout Guide (iOS 15+)
view.keyboardLayoutGuide.topAnchor
```

### Intrinsic Content Size

Some views have natural sizes based on their content:

```swift
// UILabel: fits its text
// UIButton: fits title + image + padding
// UIImageView: matches image dimensions
// UISwitch: fixed system size

class CustomView: UIView {
    override var intrinsicContentSize: CGSize {
        // Return natural size based on content
        return CGSize(width: 100, height: 50)
    }

    func contentChanged() {
        // Notify system that intrinsic size changed
        invalidateIntrinsicContentSize()
    }
}
```

## Key Concepts

### 1. Content Hugging and Compression Resistance

These priorities control how views resist being stretched or compressed:

```swift
// Content Hugging: Resistance to being LARGER than intrinsic size
// Higher priority = stronger resistance to stretching
label.setContentHuggingPriority(.defaultHigh, for: .horizontal)

// Compression Resistance: Resistance to being SMALLER than intrinsic size
// Higher priority = stronger resistance to compression
label.setContentCompressionResistancePriority(.required, for: .horizontal)
```

Example: Two labels side by side - which one stretches?

```swift
class TwoLabelCell: UITableViewCell {
    let titleLabel = UILabel()
    let valueLabel = UILabel()

    func setupConstraints() {
        // Title should hug content (not stretch)
        titleLabel.setContentHuggingPriority(.defaultHigh, for: .horizontal)

        // Value can stretch to fill remaining space
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

### 2. Constraint Priorities

Priorities range from 1 to 1000:

```swift
// System-defined priorities
UILayoutPriority.required       // 1000 - must be satisfied
UILayoutPriority.defaultHigh    // 750
UILayoutPriority.defaultLow     // 250
UILayoutPriority.fittingSizeLevel // 50

// Custom priority
let customPriority = UILayoutPriority(rawValue: 999)
```

Creating optional constraints:

```swift
let minWidthConstraint = button.widthAnchor.constraint(greaterThanOrEqualToConstant: 100)
minWidthConstraint.priority = .required

let preferredWidthConstraint = button.widthAnchor.constraint(equalToConstant: 200)
preferredWidthConstraint.priority = .defaultHigh // Can be broken if needed

NSLayoutConstraint.activate([minWidthConstraint, preferredWidthConstraint])
```

### 3. Ambiguity and Conflicts

**Ambiguous Layout**: Multiple valid solutions exist (under-constrained)

```swift
// Ambiguous: No horizontal position defined
label.translatesAutoresizingMaskIntoConstraints = false
NSLayoutConstraint.activate([
    label.topAnchor.constraint(equalTo: view.topAnchor),
    label.widthAnchor.constraint(equalToConstant: 100)
    // Missing: leading, trailing, or centerX constraint
])

// Debug ambiguity
view.hasAmbiguousLayout // true if ambiguous
view.exerciseAmbiguityInLayout() // Animates between valid solutions
```

**Conflicting Constraints**: No valid solution exists (over-constrained)

```swift
// Conflict: Can't satisfy both width constraints
NSLayoutConstraint.activate([
    view.widthAnchor.constraint(equalToConstant: 100),
    view.widthAnchor.constraint(equalToConstant: 200) // Conflict!
])
```

### 4. Stack Views

UIStackView simplifies common layout patterns:

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

        // Add arranged subviews
        let nameField = createTextField(placeholder: "Name")
        let emailField = createTextField(placeholder: "Email")
        let submitButton = createButton(title: "Submit")

        stackView.addArrangedSubview(nameField)
        stackView.addArrangedSubview(emailField)
        stackView.addArrangedSubview(submitButton)

        // Custom spacing after specific view
        stackView.setCustomSpacing(32, after: emailField)
    }

    func toggleFieldVisibility(_ field: UIView, visible: Bool) {
        UIView.animate(withDuration: 0.3) {
            field.isHidden = !visible
            // Stack view automatically updates layout
        }
    }
}
```

## Code Examples

### Programmatic Constraints with Anchors

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
        button.setTitle("Follow", for: .normal)
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
        // Store constraints for potential animation
        NSLayoutConstraint.activate([
            // Avatar: centered horizontally, fixed size, near top
            avatarImageView.topAnchor.constraint(
                equalTo: view.safeAreaLayoutGuide.topAnchor,
                constant: 32
            ),
            avatarImageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            avatarImageView.widthAnchor.constraint(equalToConstant: 120),
            avatarImageView.heightAnchor.constraint(equalTo: avatarImageView.widthAnchor),

            // Name: below avatar, horizontally padded
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

            // Bio: below name, same horizontal constraints
            bioLabel.topAnchor.constraint(
                equalTo: nameLabel.bottomAnchor,
                constant: 8
            ),
            bioLabel.leadingAnchor.constraint(equalTo: nameLabel.leadingAnchor),
            bioLabel.trailingAnchor.constraint(equalTo: nameLabel.trailingAnchor),

            // Button: below bio, fixed height, horizontally padded
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
        // Round avatar after layout
        avatarImageView.layer.cornerRadius = avatarImageView.bounds.width / 2
    }
}
```

### Dynamic Constraint Changes with Animation

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

        // Collapsed height constraint (active by default)
        heightConstraint = heightAnchor.constraint(equalToConstant: 80)

        // Details bottom constraint (inactive when collapsed)
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
            // Deactivate fixed height, activate bottom constraint
            heightConstraint.isActive = false
            detailsBottomConstraint.isActive = true
        } else {
            // Deactivate bottom constraint, activate fixed height
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

### Self-Sizing Table View Cells

```swift
class ArticleCell: UITableViewCell {

    private let titleLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: 18, weight: .semibold)
        label.numberOfLines = 0 // Multi-line support
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
            // Thumbnail: fixed size, leading edge
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

            // Title: next to thumbnail
            titleLabel.leadingAnchor.constraint(
                equalTo: thumbnailImageView.trailingAnchor,
                constant: 12
            ),
            titleLabel.trailingAnchor.constraint(
                equalTo: contentView.trailingAnchor,
                constant: -16
            ),
            titleLabel.topAnchor.constraint(equalTo: thumbnailImageView.topAnchor),

            // Excerpt: below title
            excerptLabel.leadingAnchor.constraint(equalTo: titleLabel.leadingAnchor),
            excerptLabel.trailingAnchor.constraint(equalTo: titleLabel.trailingAnchor),
            excerptLabel.topAnchor.constraint(
                equalTo: titleLabel.bottomAnchor,
                constant: 4
            ),

            // Bottom constraint for self-sizing
            // Use greaterThanOrEqualTo with thumbnail and excerpt
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

// Table View Configuration
class ArticleListViewController: UIViewController {

    private let tableView = UITableView()

    override func viewDidLoad() {
        super.viewDidLoad()

        // Enable self-sizing cells
        tableView.rowHeight = UITableView.automaticDimension
        tableView.estimatedRowHeight = 100

        tableView.register(ArticleCell.self, forCellReuseIdentifier: "ArticleCell")
    }
}
```

### Keyboard Avoidance with Layout Guide

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

        // iOS 15+ Keyboard Layout Guide
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

    // Fallback for iOS < 15
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

## Best Practices

### 1. Organize Constraints Logically

```swift
class WellOrganizedView: UIView {

    private func setupConstraints() {
        // Group by view, activate all at once
        var constraints: [NSLayoutConstraint] = []

        // Header constraints
        constraints += [
            headerView.topAnchor.constraint(equalTo: topAnchor),
            headerView.leadingAnchor.constraint(equalTo: leadingAnchor),
            headerView.trailingAnchor.constraint(equalTo: trailingAnchor),
            headerView.heightAnchor.constraint(equalToConstant: 60)
        ]

        // Content constraints
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

### 2. Use Constraint Identifiers for Debugging

```swift
let widthConstraint = view.widthAnchor.constraint(equalToConstant: 100)
widthConstraint.identifier = "ProfileImage.width"

let heightConstraint = view.heightAnchor.constraint(equalTo: view.widthAnchor)
heightConstraint.identifier = "ProfileImage.aspectRatio"

// In console: "Unable to simultaneously satisfy constraints... ProfileImage.width"
```

### 3. Prefer Anchors Over Visual Format Language

```swift
// PREFERRED: Anchor syntax - type-safe, clear intent
NSLayoutConstraint.activate([
    label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
    label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
    label.topAnchor.constraint(equalTo: view.topAnchor, constant: 8)
])

// AVOID: Visual Format Language - string-based, error-prone
NSLayoutConstraint.constraints(
    withVisualFormat: "H:|-16-[label]-16-|",
    options: [],
    metrics: nil,
    views: ["label": label]
)
```

### 4. Create Reusable Constraint Helpers

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

// Usage
imageView.pinToEdges(of: containerView, padding: 8)
button.centerInSuperview()
avatar.setSize(width: 44, height: 44)
```

## Common Pitfalls

### 1. Forgetting translatesAutoresizingMaskIntoConstraints

```swift
// WRONG - View still uses autoresizing mask
let label = UILabel()
view.addSubview(label)
NSLayoutConstraint.activate([
    label.centerXAnchor.constraint(equalTo: view.centerXAnchor)
])
// Conflicting constraints from autoresizing mask!

// CORRECT - Disable autoresizing mask translation
let label = UILabel()
label.translatesAutoresizingMaskIntoConstraints = false
view.addSubview(label)
NSLayoutConstraint.activate([
    label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
    label.centerYAnchor.constraint(equalTo: view.centerYAnchor)
])
```

### 2. Activating Constraints Before Adding to View Hierarchy

```swift
// WRONG - Crashes: view has no common ancestor with superview
let button = UIButton()
button.translatesAutoresizingMaskIntoConstraints = false
NSLayoutConstraint.activate([
    button.centerXAnchor.constraint(equalTo: view.centerXAnchor)
])
view.addSubview(button) // Too late!

// CORRECT - Add to hierarchy first
let button = UIButton()
button.translatesAutoresizingMaskIntoConstraints = false
view.addSubview(button)
NSLayoutConstraint.activate([
    button.centerXAnchor.constraint(equalTo: view.centerXAnchor),
    button.centerYAnchor.constraint(equalTo: view.centerYAnchor)
])
```

### 3. Modifying Constraints Instead of Constants

```swift
// WRONG - Deactivating and creating new constraints repeatedly
func updateHeight(_ height: CGFloat) {
    NSLayoutConstraint.deactivate([heightConstraint])
    heightConstraint = view.heightAnchor.constraint(equalToConstant: height)
    NSLayoutConstraint.activate([heightConstraint])
}

// CORRECT - Modify the constant
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

### 4. Creating Retain Cycles with Constraint References

```swift
// WRONG - Strong reference in closure can cause retain cycle
class BadViewController: UIViewController {
    var updateLayout: (() -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        let constraint = label.widthAnchor.constraint(equalToConstant: 100)
        updateLayout = {
            constraint.constant = 200
            self.view.layoutIfNeeded() // Strong self reference
        }
    }
}

// CORRECT - Use weak self
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

## Performance Considerations

### 1. Minimize Constraint Changes

```swift
// AVOID - Multiple layout passes
func updateMultipleViews() {
    constraint1.constant = 10
    view.layoutIfNeeded() // Layout pass 1

    constraint2.constant = 20
    view.layoutIfNeeded() // Layout pass 2

    constraint3.constant = 30
    view.layoutIfNeeded() // Layout pass 3
}

// BETTER - Single layout pass
func updateMultipleViews() {
    constraint1.constant = 10
    constraint2.constant = 20
    constraint3.constant = 30
    view.layoutIfNeeded() // Single layout pass
}
```

### 2. Use setNeedsLayout for Batched Updates

```swift
func updateConstraintsFromMultipleSources() {
    // Multiple constraint updates throughout method
    updateHeaderConstraints()
    updateContentConstraints()
    updateFooterConstraints()

    // Request layout once at the end
    view.setNeedsLayout()
    // Layout happens on next run loop iteration
}

// For immediate layout (e.g., animations)
func animateConstraintChanges() {
    UIView.animate(withDuration: 0.3) {
        self.constraint.constant = 100
        self.view.layoutIfNeeded() // Forces immediate layout
    }
}
```

### 3. Avoid Complex Constraint Relationships

```swift
// AVOID - Complex multiplier relationships
NSLayoutConstraint.activate([
    view1.widthAnchor.constraint(equalTo: view2.widthAnchor, multiplier: 0.333),
    view2.widthAnchor.constraint(equalTo: view3.widthAnchor, multiplier: 1.5),
    view3.widthAnchor.constraint(equalTo: container.widthAnchor, multiplier: 0.8)
])

// BETTER - Use UIStackView for distribution
let stackView = UIStackView(arrangedSubviews: [view1, view2, view3])
stackView.distribution = .fillEqually // or .fillProportionally
```

### 4. Profile with Instruments

```swift
// Enable constraint debugging in scheme
// Arguments: -UIViewLayoutFeedbackLoopDebuggingThreshold 100

// Or programmatically
#if DEBUG
func debugLayoutIssues() {
    // Print constraint issues
    for subview in view.subviews {
        if subview.hasAmbiguousLayout {
            print("Ambiguous layout: \(subview)")
            print("Constraints: \(subview.constraints)")
        }
    }
}
#endif
```

## Real-World Scenarios

### Adaptive Layout for iPad and iPhone

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

        // Regular width (iPad landscape, large iPhones landscape)
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

        // Compact width (iPhone portrait)
        compactConstraints = [
            sidebarView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            sidebarView.topAnchor.constraint(equalTo: view.topAnchor),
            sidebarView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            sidebarView.heightAnchor.constraint(equalToConstant: 0), // Hidden

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

### Dynamic Type Support

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

        // Enable Dynamic Type
        titleLabel.font = .preferredFont(forTextStyle: .headline)
        titleLabel.adjustsFontForContentSizeCategory = true
        titleLabel.numberOfLines = 0

        subtitleLabel.font = .preferredFont(forTextStyle: .subheadline)
        subtitleLabel.adjustsFontForContentSizeCategory = true
        subtitleLabel.numberOfLines = 0

        contentView.addSubview(titleLabel)
        contentView.addSubview(subtitleLabel)

        // Standard layout: side by side
        standardConstraints = [
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            titleLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 12),
            titleLabel.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -12),
            titleLabel.widthAnchor.constraint(equalTo: contentView.widthAnchor, multiplier: 0.5, constant: -24),

            subtitleLabel.leadingAnchor.constraint(equalTo: titleLabel.trailingAnchor, constant: 8),
            subtitleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            subtitleLabel.centerYAnchor.constraint(equalTo: titleLabel.centerYAnchor)
        ]

        // Accessibility layout: stacked vertically
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

## Interview Key Points

1. **Constraint Equation**: Explain the linear equation relationship (item1.attribute = multiplier * item2.attribute + constant)

2. **Intrinsic Content Size**: Describe what it is and which views have it (labels, buttons, image views)

3. **Content Hugging vs Compression Resistance**: Explain the difference and when to use each

4. **Priorities**: Describe how priorities resolve conflicts and when to use non-required priorities

5. **Ambiguity vs Conflicts**: Explain the difference between under-constrained and over-constrained layouts

6. **Safe Area**: Describe its purpose and how it handles notches, home indicators, and navigation bars

7. **Stack Views**: Explain how they simplify common layout patterns and their distribution options

8. **Performance**: Discuss layoutIfNeeded vs setNeedsLayout and batching constraint changes

9. **Trait Collections**: Explain how to create adaptive layouts for different size classes

10. **Debugging**: Describe tools for finding constraint issues (identifiers, hasAmbiguousLayout, visual debugger)

## Further Reading

- [Apple Auto Layout Guide](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/AutolayoutPG/)
- [WWDC 2018: High Performance Auto Layout](https://developer.apple.com/videos/play/wwdc2018/220/)
- [WWDC 2019: Making Apps More Accessible With Custom Actions](https://developer.apple.com/videos/play/wwdc2019/250/)
- [UIKit Layout Guide Documentation](https://developer.apple.com/documentation/uikit/uilayoutguide)
- [NSLayoutConstraint Documentation](https://developer.apple.com/documentation/uikit/nslayoutconstraint)
- [Debugging Auto Layout](https://developer.apple.com/documentation/uikit/uiview/1622517-hasambiguouslayout)
