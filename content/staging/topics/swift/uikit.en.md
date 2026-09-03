---
title: UIKit Fundamentals and Best Practices
description: A comprehensive guide to UIKit framework covering view hierarchy, view controllers, lifecycle management, and modern best practices for building iOS applications
track: swift
section: swiftui
difficulty: intermediate
tags:
  - UIKit
  - iOS
  - View Controllers
  - UI Development
  - MVC
status: imported
origin: old/src/content/docs/swift/uikit.en.md
divergence: 0.21
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - h1-in-body
legacy:
  category: Swift
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-21
---

## Concept Explanation

UIKit is Apple's foundational framework for building user interfaces on iOS, iPadOS, and tvOS. Despite the introduction of SwiftUI, UIKit remains essential for iOS development due to its maturity, extensive feature set, and the vast amount of existing codebases that rely on it.

UIKit follows the Model-View-Controller (MVC) architecture pattern, where:
- **Model**: Represents your app's data and business logic
- **View**: Displays the user interface (UIView and subclasses)
- **Controller**: Mediates between Model and View (UIViewController)

The framework provides a comprehensive set of components including views, controls, navigation patterns, and system integrations that enable developers to create polished, native iOS experiences.

## Core Principles

### View Hierarchy

Every UIKit application has a view hierarchy starting from the `UIWindow`:

```
UIWindow
└── UIViewController.view
    ├── UIView (container)
    │   ├── UILabel
    │   ├── UIButton
    │   └── UIImageView
    └── UITableView
```

Views are organized in a parent-child relationship where:
- Each view has exactly one superview (except the window)
- A view can have multiple subviews
- Subviews are drawn on top of their superviews
- Touch events propagate through the responder chain

### View Controller Lifecycle

Understanding the view controller lifecycle is crucial for proper resource management:

```swift
class MyViewController: UIViewController {

    // Called when the view is loaded into memory
    override func viewDidLoad() {
        super.viewDidLoad()
        // One-time setup: configure views, add subviews
        // View bounds are NOT yet finalized
    }

    // Called just before the view appears on screen
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // Start animations, refresh data
        // Good for updates that need to happen every time view appears
    }

    // Called after the view has appeared on screen
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        // Start timers, analytics tracking
        // View is now fully visible and interactive
    }

    // Called just before the view disappears
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        // Save state, pause ongoing tasks
    }

    // Called after the view has disappeared
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        // Stop timers, release resources not needed off-screen
    }

    // Called when view's bounds change (rotation, split view)
    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
        // Adjust layouts before Auto Layout runs
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // Final layout adjustments after Auto Layout
        // View bounds are now finalized
    }
}
```

### Responder Chain

The responder chain handles events and actions:

```swift
// Events propagate: View -> ViewController -> Parent VC -> Window -> Application

class CustomView: UIView {
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        // Handle touch or pass to next responder
        super.touchesBegan(touches, with: event)
    }

    // Determine if this view should handle the touch
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard isUserInteractionEnabled, !isHidden, alpha > 0.01 else {
            return nil
        }

        if self.point(inside: point, with: event) {
            for subview in subviews.reversed() {
                let convertedPoint = subview.convert(point, from: self)
                if let hitView = subview.hitTest(convertedPoint, with: event) {
                    return hitView
                }
            }
            return self
        }
        return nil
    }
}
```

## Key Concepts

### 1. Programmatic UI vs Storyboards

**Programmatic UI** offers better version control, reusability, and explicit code:

```swift
class ProfileViewController: UIViewController {

    private lazy var profileImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = 50
        return imageView
    }()

    private lazy var nameLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: 24, weight: .bold)
        label.textAlignment = .center
        return label
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupConstraints()
    }

    private func setupUI() {
        view.backgroundColor = .systemBackground
        view.addSubview(profileImageView)
        view.addSubview(nameLabel)
    }

    private func setupConstraints() {
        NSLayoutConstraint.activate([
            profileImageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            profileImageView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 40),
            profileImageView.widthAnchor.constraint(equalToConstant: 100),
            profileImageView.heightAnchor.constraint(equalToConstant: 100),

            nameLabel.topAnchor.constraint(equalTo: profileImageView.bottomAnchor, constant: 16),
            nameLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            nameLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
    }
}
```

### 2. Container View Controllers

```swift
class ContainerViewController: UIViewController {

    private var currentChild: UIViewController?

    func transition(to newChild: UIViewController) {
        // Remove old child
        currentChild?.willMove(toParent: nil)
        currentChild?.view.removeFromSuperview()
        currentChild?.removeFromParent()

        // Add new child
        addChild(newChild)
        newChild.view.frame = view.bounds
        newChild.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(newChild.view)
        newChild.didMove(toParent: self)

        currentChild = newChild
    }

    // Animated transition
    func animatedTransition(to newChild: UIViewController) {
        let oldChild = currentChild

        addChild(newChild)
        newChild.view.frame = view.bounds
        newChild.view.alpha = 0

        transition(
            from: oldChild ?? UIViewController(),
            to: newChild,
            duration: 0.3,
            options: .transitionCrossDissolve,
            animations: {
                newChild.view.alpha = 1
            },
            completion: { _ in
                oldChild?.removeFromParent()
                newChild.didMove(toParent: self)
                self.currentChild = newChild
            }
        )
    }
}
```

### 3. Custom Views

```swift
class GradientButton: UIButton {

    private let gradientLayer = CAGradientLayer()

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupGradient()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupGradient()
    }

    private func setupGradient() {
        gradientLayer.colors = [
            UIColor.systemBlue.cgColor,
            UIColor.systemPurple.cgColor
        ]
        gradientLayer.startPoint = CGPoint(x: 0, y: 0.5)
        gradientLayer.endPoint = CGPoint(x: 1, y: 0.5)
        gradientLayer.cornerRadius = 12
        layer.insertSublayer(gradientLayer, at: 0)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        gradientLayer.frame = bounds
    }

    // Intrinsic content size for Auto Layout
    override var intrinsicContentSize: CGSize {
        let superSize = super.intrinsicContentSize
        return CGSize(width: superSize.width + 40, height: superSize.height + 16)
    }
}
```

## Code Examples

### Modern Table View with Diffable Data Source

```swift
class ContactsViewController: UIViewController {

    enum Section {
        case favorites
        case all
    }

    struct Contact: Hashable {
        let id: UUID
        let name: String
        let isFavorite: Bool
    }

    private var tableView: UITableView!
    private var dataSource: UITableViewDiffableDataSource<Section, Contact>!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupTableView()
        configureDataSource()
        applyInitialSnapshot()
    }

    private func setupTableView() {
        tableView = UITableView(frame: view.bounds, style: .insetGrouped)
        tableView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "cell")
        view.addSubview(tableView)
    }

    private func configureDataSource() {
        dataSource = UITableViewDiffableDataSource<Section, Contact>(
            tableView: tableView
        ) { tableView, indexPath, contact in
            let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath)
            var content = cell.defaultContentConfiguration()
            content.text = contact.name
            content.image = UIImage(systemName: contact.isFavorite ? "star.fill" : "person")
            cell.contentConfiguration = content
            return cell
        }

        dataSource.defaultRowAnimation = .fade
    }

    private func applyInitialSnapshot() {
        var snapshot = NSDiffableDataSourceSnapshot<Section, Contact>()
        snapshot.appendSections([.favorites, .all])

        let favorites = [
            Contact(id: UUID(), name: "Alice", isFavorite: true),
            Contact(id: UUID(), name: "Bob", isFavorite: true)
        ]
        let all = [
            Contact(id: UUID(), name: "Charlie", isFavorite: false),
            Contact(id: UUID(), name: "Diana", isFavorite: false)
        ]

        snapshot.appendItems(favorites, toSection: .favorites)
        snapshot.appendItems(all, toSection: .all)

        dataSource.apply(snapshot, animatingDifferences: true)
    }

    func updateContacts(_ contacts: [Contact]) {
        var snapshot = NSDiffableDataSourceSnapshot<Section, Contact>()
        snapshot.appendSections([.favorites, .all])
        snapshot.appendItems(contacts.filter { $0.isFavorite }, toSection: .favorites)
        snapshot.appendItems(contacts.filter { !$0.isFavorite }, toSection: .all)
        dataSource.apply(snapshot, animatingDifferences: true)
    }
}
```

### Collection View with Compositional Layout

```swift
class GalleryViewController: UIViewController {

    enum Section: Int, CaseIterable {
        case featured
        case regular
    }

    private var collectionView: UICollectionView!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupCollectionView()
    }

    private func createLayout() -> UICollectionViewLayout {
        UICollectionViewCompositionalLayout { sectionIndex, environment in
            guard let section = Section(rawValue: sectionIndex) else { return nil }

            switch section {
            case .featured:
                return self.createFeaturedSection()
            case .regular:
                return self.createRegularSection(environment: environment)
            }
        }
    }

    private func createFeaturedSection() -> NSCollectionLayoutSection {
        let itemSize = NSCollectionLayoutSize(
            widthDimension: .fractionalWidth(1.0),
            heightDimension: .fractionalHeight(1.0)
        )
        let item = NSCollectionLayoutItem(layoutSize: itemSize)
        item.contentInsets = NSDirectionalEdgeInsets(top: 4, leading: 4, bottom: 4, trailing: 4)

        let groupSize = NSCollectionLayoutSize(
            widthDimension: .fractionalWidth(0.85),
            heightDimension: .absolute(250)
        )
        let group = NSCollectionLayoutGroup.horizontal(layoutSize: groupSize, subitems: [item])

        let section = NSCollectionLayoutSection(group: group)
        section.orthogonalScrollingBehavior = .groupPagingCentered
        section.contentInsets = NSDirectionalEdgeInsets(top: 16, leading: 0, bottom: 16, trailing: 0)

        return section
    }

    private func createRegularSection(environment: NSCollectionLayoutEnvironment) -> NSCollectionLayoutSection {
        let columns = environment.container.effectiveContentSize.width > 500 ? 3 : 2

        let itemSize = NSCollectionLayoutSize(
            widthDimension: .fractionalWidth(1.0 / CGFloat(columns)),
            heightDimension: .fractionalWidth(1.0 / CGFloat(columns))
        )
        let item = NSCollectionLayoutItem(layoutSize: itemSize)
        item.contentInsets = NSDirectionalEdgeInsets(top: 4, leading: 4, bottom: 4, trailing: 4)

        let groupSize = NSCollectionLayoutSize(
            widthDimension: .fractionalWidth(1.0),
            heightDimension: .estimated(200)
        )
        let group = NSCollectionLayoutGroup.horizontal(layoutSize: groupSize, subitems: [item])

        let section = NSCollectionLayoutSection(group: group)
        section.contentInsets = NSDirectionalEdgeInsets(top: 8, leading: 8, bottom: 8, trailing: 8)

        return section
    }

    private func setupCollectionView() {
        collectionView = UICollectionView(frame: view.bounds, collectionViewLayout: createLayout())
        collectionView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        collectionView.backgroundColor = .systemBackground
        view.addSubview(collectionView)
    }
}
```

### Custom Transitions

```swift
class SlideTransitionAnimator: NSObject, UIViewControllerAnimatedTransitioning {

    let isPresenting: Bool

    init(isPresenting: Bool) {
        self.isPresenting = isPresenting
        super.init()
    }

    func transitionDuration(using transitionContext: UIViewControllerContextTransitioning?) -> TimeInterval {
        return 0.4
    }

    func animateTransition(using transitionContext: UIViewControllerContextTransitioning) {
        let key: UITransitionContextViewControllerKey = isPresenting ? .to : .from
        guard let controller = transitionContext.viewController(forKey: key) else { return }

        let containerView = transitionContext.containerView

        if isPresenting {
            containerView.addSubview(controller.view)
            controller.view.frame = CGRect(
                x: containerView.bounds.width,
                y: 0,
                width: containerView.bounds.width,
                height: containerView.bounds.height
            )
        }

        let finalFrame = isPresenting ?
            transitionContext.finalFrame(for: controller) :
            CGRect(x: containerView.bounds.width, y: 0,
                   width: containerView.bounds.width, height: containerView.bounds.height)

        UIView.animate(
            withDuration: transitionDuration(using: transitionContext),
            delay: 0,
            usingSpringWithDamping: 0.8,
            initialSpringVelocity: 0.5,
            options: .curveEaseInOut,
            animations: {
                controller.view.frame = finalFrame
            },
            completion: { _ in
                transitionContext.completeTransition(!transitionContext.transitionWasCancelled)
            }
        )
    }
}

// Usage with UIViewControllerTransitioningDelegate
class PresentingViewController: UIViewController, UIViewControllerTransitioningDelegate {

    func presentDetail() {
        let detailVC = DetailViewController()
        detailVC.modalPresentationStyle = .custom
        detailVC.transitioningDelegate = self
        present(detailVC, animated: true)
    }

    func animationController(forPresented presented: UIViewController,
                           presenting: UIViewController,
                           source: UIViewController) -> UIViewControllerAnimatedTransitioning? {
        return SlideTransitionAnimator(isPresenting: true)
    }

    func animationController(forDismissed dismissed: UIViewController) -> UIViewControllerAnimatedTransitioning? {
        return SlideTransitionAnimator(isPresenting: false)
    }
}
```

## Best Practices

### 1. Dependency Injection

```swift
// Protocol for dependency
protocol UserServiceProtocol {
    func fetchUser(id: String) async throws -> User
}

// View Controller with injected dependency
class UserProfileViewController: UIViewController {

    private let userService: UserServiceProtocol
    private let userId: String

    // Inject dependencies through initializer
    init(userService: UserServiceProtocol, userId: String) {
        self.userService = userService
        self.userId = userId
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("Use init(userService:userId:) instead")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        loadUser()
    }

    private func loadUser() {
        Task {
            do {
                let user = try await userService.fetchUser(id: userId)
                updateUI(with: user)
            } catch {
                showError(error)
            }
        }
    }
}
```

### 2. Coordinator Pattern

```swift
protocol Coordinator: AnyObject {
    var childCoordinators: [Coordinator] { get set }
    var navigationController: UINavigationController { get }
    func start()
}

class AppCoordinator: Coordinator {
    var childCoordinators: [Coordinator] = []
    var navigationController: UINavigationController

    init(navigationController: UINavigationController) {
        self.navigationController = navigationController
    }

    func start() {
        let homeCoordinator = HomeCoordinator(navigationController: navigationController)
        homeCoordinator.parentCoordinator = self
        childCoordinators.append(homeCoordinator)
        homeCoordinator.start()
    }

    func childDidFinish(_ child: Coordinator) {
        childCoordinators.removeAll { $0 === child }
    }
}

class HomeCoordinator: Coordinator {
    var childCoordinators: [Coordinator] = []
    var navigationController: UINavigationController
    weak var parentCoordinator: AppCoordinator?

    init(navigationController: UINavigationController) {
        self.navigationController = navigationController
    }

    func start() {
        let homeVC = HomeViewController()
        homeVC.coordinator = self
        navigationController.pushViewController(homeVC, animated: false)
    }

    func showDetail(for item: Item) {
        let detailVC = DetailViewController(item: item)
        detailVC.coordinator = self
        navigationController.pushViewController(detailVC, animated: true)
    }
}
```

### 3. Memory Management

```swift
class MyViewController: UIViewController {

    // Weak delegate to avoid retain cycles
    weak var delegate: MyViewControllerDelegate?

    // Use [weak self] in closures
    private func setupActions() {
        button.addAction(UIAction { [weak self] _ in
            self?.handleButtonTap()
        }, for: .touchUpInside)
    }

    // Properly cancel tasks
    private var loadTask: Task<Void, Never>?

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        loadTask = Task { [weak self] in
            await self?.loadData()
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        loadTask?.cancel()
    }
}
```

## Common Pitfalls

### 1. Modifying UI from Background Thread

```swift
// WRONG - Crashes or undefined behavior
func loadData() {
    DispatchQueue.global().async {
        let data = self.fetchData()
        self.label.text = data.title // CRASH: UI update on background thread
    }
}

// CORRECT - Always update UI on main thread
func loadData() {
    DispatchQueue.global().async {
        let data = self.fetchData()
        DispatchQueue.main.async {
            self.label.text = data.title
        }
    }
}

// Modern approach with @MainActor
@MainActor
func updateUI(with data: Data) {
    label.text = data.title
}
```

### 2. Retain Cycles in Closures

```swift
// WRONG - Retain cycle
class ViewController: UIViewController {
    var handler: (() -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        handler = {
            self.doSomething() // Strong reference to self
        }
    }
}

// CORRECT - Capture list with weak self
class ViewController: UIViewController {
    var handler: (() -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        handler = { [weak self] in
            self?.doSomething()
        }
    }
}
```

### 3. Force Unwrapping IBOutlets Too Early

```swift
// WRONG - Crash if accessed before viewDidLoad
class ViewController: UIViewController {
    @IBOutlet weak var label: UILabel!

    func configure(text: String) {
        label.text = text // Crash if view not loaded
    }
}

// CORRECT - Ensure view is loaded
class ViewController: UIViewController {
    @IBOutlet weak var label: UILabel!
    private var pendingText: String?

    func configure(text: String) {
        if isViewLoaded {
            label.text = text
        } else {
            pendingText = text
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        if let text = pendingText {
            label.text = text
        }
    }
}
```

## Performance Considerations

### 1. Cell Reuse and Preparation

```swift
class OptimizedCell: UITableViewCell {

    override func prepareForReuse() {
        super.prepareForReuse()
        // Cancel any pending image loads
        imageLoadTask?.cancel()
        imageView?.image = nil
        // Reset to default state
        accessoryType = .none
    }

    private var imageLoadTask: Task<Void, Never>?

    func configure(with item: Item) {
        textLabel?.text = item.title

        imageLoadTask = Task {
            if let image = await ImageLoader.shared.load(item.imageURL) {
                // Check we haven't been reused
                guard !Task.isCancelled else { return }
                imageView?.image = image
            }
        }
    }
}
```

### 2. Layer Optimization

```swift
class OptimizedView: UIView {

    override init(frame: CGRect) {
        super.init(frame: frame)

        // Rasterize complex layer hierarchies
        layer.shouldRasterize = true
        layer.rasterizationScale = UIScreen.main.scale

        // Set opaque when possible for better compositing
        isOpaque = true
        backgroundColor = .white
    }

    // Avoid expensive operations in layoutSubviews
    override func layoutSubviews() {
        super.layoutSubviews()
        // Only update shadow path when bounds change
        layer.shadowPath = UIBezierPath(roundedRect: bounds, cornerRadius: 8).cgPath
    }
}
```

### 3. Prefetching

```swift
class PrefetchingViewController: UIViewController, UITableViewDataSourcePrefetching {

    func tableView(_ tableView: UITableView, prefetchRowsAt indexPaths: [IndexPath]) {
        for indexPath in indexPaths {
            let item = items[indexPath.row]
            // Start loading images before cells appear
            ImagePrefetcher.shared.prefetch(urls: [item.imageURL])
        }
    }

    func tableView(_ tableView: UITableView, cancelPrefetchingForRowsAt indexPaths: [IndexPath]) {
        for indexPath in indexPaths {
            let item = items[indexPath.row]
            // Cancel prefetch for cells that won't appear
            ImagePrefetcher.shared.cancel(urls: [item.imageURL])
        }
    }
}
```

## Real-World Scenarios

### Building a Chat Interface

```swift
class ChatViewController: UIViewController {

    private var collectionView: UICollectionView!
    private var dataSource: UICollectionViewDiffableDataSource<Section, Message>!
    private var keyboardHeight: CGFloat = 0

    enum Section { case messages }

    override func viewDidLoad() {
        super.viewDidLoad()
        setupCollectionView()
        setupKeyboardObservers()
        configureDataSource()
    }

    private func setupCollectionView() {
        let layout = createLayout()
        collectionView = UICollectionView(frame: view.bounds, collectionViewLayout: layout)
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        collectionView.keyboardDismissMode = .interactive
        view.addSubview(collectionView)
    }

    private func createLayout() -> UICollectionViewLayout {
        var config = UICollectionLayoutListConfiguration(appearance: .plain)
        config.showsSeparators = false
        return UICollectionViewCompositionalLayout.list(using: config)
    }

    private func setupKeyboardObservers() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(keyboardWillShow),
            name: UIResponder.keyboardWillShowNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(keyboardWillHide),
            name: UIResponder.keyboardWillHideNotification,
            object: nil
        )
    }

    @objc private func keyboardWillShow(_ notification: Notification) {
        guard let frame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
              let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double
        else { return }

        keyboardHeight = frame.height

        UIView.animate(withDuration: duration) {
            self.collectionView.contentInset.bottom = self.keyboardHeight
            self.collectionView.verticalScrollIndicatorInsets.bottom = self.keyboardHeight
        }

        scrollToBottom(animated: true)
    }

    @objc private func keyboardWillHide(_ notification: Notification) {
        guard let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double
        else { return }

        keyboardHeight = 0

        UIView.animate(withDuration: duration) {
            self.collectionView.contentInset.bottom = 0
            self.collectionView.verticalScrollIndicatorInsets.bottom = 0
        }
    }

    private func scrollToBottom(animated: Bool) {
        let lastSection = collectionView.numberOfSections - 1
        guard lastSection >= 0 else { return }
        let lastItem = collectionView.numberOfItems(inSection: lastSection) - 1
        guard lastItem >= 0 else { return }

        let indexPath = IndexPath(item: lastItem, section: lastSection)
        collectionView.scrollToItem(at: indexPath, at: .bottom, animated: animated)
    }
}
```

## Interview Key Points

1. **View Controller Lifecycle**: Explain the order and purpose of each lifecycle method (`viewDidLoad` -> `viewWillAppear` -> `viewDidAppear`, etc.)

2. **Responder Chain**: Describe how touch events and actions propagate through the view hierarchy

3. **Memory Management**: Demonstrate understanding of ARC, retain cycles in closures, and proper use of weak/unowned references

4. **Diffable Data Source**: Explain advantages over traditional data source (automatic diffing, no crashes from inconsistent state)

5. **Compositional Layout**: Describe how sections, groups, and items work together

6. **MVC vs Other Patterns**: Discuss the limitations of MVC and alternatives like MVVM, MVP, VIPER

7. **Main Thread Rule**: Explain why UI updates must happen on the main thread

8. **Container View Controllers**: Demonstrate proper child view controller management

9. **Custom Transitions**: Explain UIViewControllerAnimatedTransitioning protocol

10. **Performance**: Cell reuse, layer optimization, prefetching strategies

## Further Reading

- [Apple UIKit Documentation](https://developer.apple.com/documentation/uikit)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [View Controller Programming Guide](https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/)
- [Collection View Programming Guide](https://developer.apple.com/library/archive/documentation/WindowsViews/Conceptual/CollectionViewPGforIOS/)
- [WWDC Videos on Modern UIKit](https://developer.apple.com/videos/frameworks/uikit)
- [Advances in Collection View Layout - WWDC 2019](https://developer.apple.com/videos/play/wwdc2019/215/)
- [Advances in Diffable Data Sources - WWDC 2020](https://developer.apple.com/videos/play/wwdc2020/10045/)
