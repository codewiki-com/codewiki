---
title: SwiftData Persistence
description: Master SwiftData, Apple's modern data persistence framework for Swift, featuring declarative modeling, automatic CloudKit sync, and seamless SwiftUI integration
track: backend
section: databases
difficulty: intermediate
tags:
  - Swift
  - iOS
  - SwiftData
  - Persistence
  - Core Data
  - Database
status: imported
origin: old/src/content/docs/swift/swiftdata.en.md
divergence: 0.215
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - h1-in-body
legacy:
  category: Swift
  subcategory: ""
  order: 3
  lastUpdated: 2026-01-21
---

## Concept Explanation

SwiftData is Apple's modern data persistence framework introduced in iOS 17, macOS 14, and other 2023 platform releases. Built on top of Core Data, it provides a Swift-native, declarative approach to data modeling and persistence that integrates seamlessly with SwiftUI.

Unlike Core Data's separate model editor and code generation, SwiftData uses Swift macros to define models directly in code. The `@Model` macro transforms regular Swift classes into persistent objects, automatically generating the schema, relationships, and required boilerplate.

Key advantages over Core Data:
- **Pure Swift**: No Objective-C runtime, no NSManagedObject subclassing
- **Declarative**: Models defined with Swift macros
- **Type-safe**: Full compile-time checking of model properties
- **SwiftUI Integration**: Native support for `@Query` and environment injection
- **Automatic Schema Migration**: Lightweight migrations handled automatically
- **CloudKit Ready**: Built-in iCloud sync support

## Core Principles

### Model Definition with @Model

The `@Model` macro is the foundation of SwiftData:

```swift
import SwiftData

@Model
final class Task {
    var title: String
    var notes: String
    var dueDate: Date?
    var isCompleted: Bool
    var priority: Int

    // Relationships are automatically inferred
    var category: Category?

    // Computed properties are not persisted
    var isOverdue: Bool {
        guard let dueDate else { return false }
        return !isCompleted && dueDate < Date()
    }

    init(title: String, notes: String = "", dueDate: Date? = nil, priority: Int = 0) {
        self.title = title
        self.notes = notes
        self.dueDate = dueDate
        self.isCompleted = false
        self.priority = priority
    }
}

@Model
final class Category {
    var name: String
    var color: String

    // Inverse relationship - SwiftData manages this automatically
    @Relationship(deleteRule: .cascade, inverse: \Task.category)
    var tasks: [Task]

    init(name: String, color: String = "blue") {
        self.name = name
        self.color = color
        self.tasks = []
    }
}
```

### ModelContainer and ModelContext

SwiftData uses containers and contexts for data management:

```swift
// ModelContainer: Manages the schema and storage
// ModelContext: Handles CRUD operations and tracks changes

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Task.self, Category.self])
    }
}

// Custom container configuration
let config = ModelConfiguration(
    schema: Schema([Task.self, Category.self]),
    isStoredInMemoryOnly: false,
    allowsSave: true,
    groupContainer: .automatic,
    cloudKitDatabase: .automatic
)

let container = try ModelContainer(
    for: Task.self, Category.self,
    configurations: config
)
```

### Property Wrappers

SwiftData provides several property wrappers:

```swift
@Model
final class Article {
    // Standard property - persisted and indexed
    var title: String

    // Unique constraint
    @Attribute(.unique)
    var slug: String

    // External storage for large data
    @Attribute(.externalStorage)
    var imageData: Data?

    // Transient - not persisted
    @Transient
    var cachedHTML: String?

    // Spotlight indexing
    @Attribute(.spotlight)
    var searchableContent: String

    // Encryption (requires proper entitlements)
    @Attribute(.allowsCloudEncryption)
    var sensitiveNotes: String?

    // Original name for migration compatibility
    @Attribute(originalName: "body")
    var content: String

    init(title: String, slug: String, content: String) {
        self.title = title
        self.slug = slug
        self.content = content
    }
}
```

## Key Concepts

### 1. Relationships

SwiftData supports various relationship types:

```swift
@Model
final class Author {
    var name: String

    // One-to-many relationship
    @Relationship(deleteRule: .cascade)
    var books: [Book]

    // One-to-one relationship
    @Relationship(deleteRule: .nullify)
    var profile: AuthorProfile?

    init(name: String) {
        self.name = name
        self.books = []
    }
}

@Model
final class Book {
    var title: String
    var publishedDate: Date

    // Inverse relationship (to-one)
    var author: Author?

    // Many-to-many relationship
    @Relationship
    var genres: [Genre]

    init(title: String, publishedDate: Date = Date()) {
        self.title = title
        self.publishedDate = publishedDate
        self.genres = []
    }
}

@Model
final class Genre {
    var name: String

    @Relationship(inverse: \Book.genres)
    var books: [Book]

    init(name: String) {
        self.name = name
        self.books = []
    }
}

@Model
final class AuthorProfile {
    var bio: String
    var website: URL?

    @Relationship(inverse: \Author.profile)
    var author: Author?

    init(bio: String, website: URL? = nil) {
        self.bio = bio
        self.website = website
    }
}
```

Delete rules:
- `.cascade`: Delete related objects
- `.nullify`: Set relationship to nil (default)
- `.deny`: Prevent deletion if relationships exist
- `.noAction`: Do nothing (manual cleanup required)

### 2. Querying with @Query

SwiftUI integration through the `@Query` property wrapper:

```swift
struct TaskListView: View {
    // Basic query - fetches all tasks
    @Query private var tasks: [Task]

    // Sorted query
    @Query(sort: \Task.dueDate) private var sortedTasks: [Task]

    // Filtered and sorted
    @Query(
        filter: #Predicate<Task> { !$0.isCompleted },
        sort: [SortDescriptor(\Task.priority, order: .reverse)]
    )
    private var pendingTasks: [Task]

    // Complex predicate
    @Query(
        filter: #Predicate<Task> { task in
            task.priority > 5 && task.dueDate != nil
        },
        sort: \Task.dueDate
    )
    private var highPriorityTasks: [Task]

    var body: some View {
        List(tasks) { task in
            TaskRow(task: task)
        }
    }
}

// Dynamic queries based on state
struct FilterableTaskList: View {
    @State private var showCompleted = false
    @State private var sortOrder = SortOrder.dueDate

    enum SortOrder {
        case dueDate, priority, title
    }

    var body: some View {
        TaskListContent(
            showCompleted: showCompleted,
            sortOrder: sortOrder
        )
    }
}

struct TaskListContent: View {
    @Query private var tasks: [Task]

    init(showCompleted: Bool, sortOrder: FilterableTaskList.SortOrder) {
        let predicate = showCompleted
            ? #Predicate<Task> { _ in true }
            : #Predicate<Task> { !$0.isCompleted }

        let sortDescriptor: SortDescriptor<Task> = switch sortOrder {
        case .dueDate: SortDescriptor(\Task.dueDate)
        case .priority: SortDescriptor(\Task.priority, order: .reverse)
        case .title: SortDescriptor(\Task.title)
        }

        _tasks = Query(filter: predicate, sort: [sortDescriptor])
    }

    var body: some View {
        List(tasks) { task in
            TaskRow(task: task)
        }
    }
}
```

### 3. CRUD Operations

Basic data manipulation:

```swift
struct TaskManager: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var tasks: [Task]

    var body: some View {
        List {
            ForEach(tasks) { task in
                TaskRow(task: task)
            }
            .onDelete(perform: deleteTasks)
        }
        .toolbar {
            Button("Add", action: addTask)
        }
    }

    // Create
    private func addTask() {
        let newTask = Task(title: "New Task", priority: 1)
        modelContext.insert(newTask)

        // Explicit save (usually automatic)
        try? modelContext.save()
    }

    // Update
    private func updateTask(_ task: Task) {
        task.isCompleted = true
        task.title = "Updated Title"
        // Changes are tracked automatically
    }

    // Delete
    private func deleteTasks(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(tasks[index])
        }
    }
}
```

### 4. Fetching Without @Query

Programmatic fetching for non-SwiftUI contexts:

```swift
class TaskService {
    private let modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func fetchAllTasks() throws -> [Task] {
        let descriptor = FetchDescriptor<Task>(
            sortBy: [SortDescriptor(\Task.dueDate)]
        )
        return try modelContext.fetch(descriptor)
    }

    func fetchPendingTasks() throws -> [Task] {
        let predicate = #Predicate<Task> { !$0.isCompleted }
        var descriptor = FetchDescriptor(predicate: predicate)
        descriptor.sortBy = [SortDescriptor(\Task.priority, order: .reverse)]
        return try modelContext.fetch(descriptor)
    }

    func fetchTasks(matching searchText: String) throws -> [Task] {
        let predicate = #Predicate<Task> { task in
            task.title.localizedStandardContains(searchText) ||
            task.notes.localizedStandardContains(searchText)
        }
        let descriptor = FetchDescriptor(predicate: predicate)
        return try modelContext.fetch(descriptor)
    }

    func fetchTaskCount() throws -> Int {
        let descriptor = FetchDescriptor<Task>()
        return try modelContext.fetchCount(descriptor)
    }

    func fetchPaginatedTasks(page: Int, pageSize: Int) throws -> [Task] {
        var descriptor = FetchDescriptor<Task>(
            sortBy: [SortDescriptor(\Task.dueDate)]
        )
        descriptor.fetchLimit = pageSize
        descriptor.fetchOffset = page * pageSize
        return try modelContext.fetch(descriptor)
    }
}
```

## Code Examples

### Complete Task Management App

```swift
import SwiftUI
import SwiftData

// MARK: - Models

@Model
final class Project {
    var name: String
    var createdAt: Date

    @Relationship(deleteRule: .cascade, inverse: \ProjectTask.project)
    var tasks: [ProjectTask]

    var completionPercentage: Double {
        guard !tasks.isEmpty else { return 0 }
        let completed = tasks.filter { $0.isCompleted }.count
        return Double(completed) / Double(tasks.count) * 100
    }

    init(name: String) {
        self.name = name
        self.createdAt = Date()
        self.tasks = []
    }
}

@Model
final class ProjectTask {
    var title: String
    var isCompleted: Bool
    var dueDate: Date?
    var project: Project?

    init(title: String, dueDate: Date? = nil) {
        self.title = title
        self.isCompleted = false
        self.dueDate = dueDate
    }
}

// MARK: - App Entry

@main
struct ProjectManagerApp: App {
    var body: some Scene {
        WindowGroup {
            ProjectListView()
        }
        .modelContainer(for: [Project.self, ProjectTask.self])
    }
}

// MARK: - Views

struct ProjectListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Project.createdAt, order: .reverse) private var projects: [Project]
    @State private var showingAddProject = false

    var body: some View {
        NavigationStack {
            List {
                ForEach(projects) { project in
                    NavigationLink(value: project) {
                        ProjectRow(project: project)
                    }
                }
                .onDelete(perform: deleteProjects)
            }
            .navigationTitle("Projects")
            .navigationDestination(for: Project.self) { project in
                ProjectDetailView(project: project)
            }
            .toolbar {
                Button {
                    showingAddProject = true
                } label: {
                    Image(systemName: "plus")
                }
            }
            .sheet(isPresented: $showingAddProject) {
                AddProjectView()
            }
        }
    }

    private func deleteProjects(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(projects[index])
        }
    }
}

struct ProjectRow: View {
    let project: Project

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(project.name)
                .font(.headline)

            HStack {
                Text("\(project.tasks.count) tasks")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Spacer()

                ProgressView(value: project.completionPercentage, total: 100)
                    .frame(width: 60)
            }
        }
        .padding(.vertical, 4)
    }
}

struct ProjectDetailView: View {
    @Bindable var project: Project
    @Environment(\.modelContext) private var modelContext
    @State private var newTaskTitle = ""

    var body: some View {
        List {
            Section("Tasks") {
                ForEach(project.tasks) { task in
                    TaskRowView(task: task)
                }
                .onDelete(perform: deleteTasks)
            }

            Section("Add Task") {
                HStack {
                    TextField("Task title", text: $newTaskTitle)

                    Button("Add") {
                        addTask()
                    }
                    .disabled(newTaskTitle.isEmpty)
                }
            }
        }
        .navigationTitle(project.name)
    }

    private func addTask() {
        let task = ProjectTask(title: newTaskTitle)
        project.tasks.append(task)
        newTaskTitle = ""
    }

    private func deleteTasks(at offsets: IndexSet) {
        for index in offsets {
            let task = project.tasks[index]
            modelContext.delete(task)
        }
    }
}

struct TaskRowView: View {
    @Bindable var task: ProjectTask

    var body: some View {
        HStack {
            Button {
                task.isCompleted.toggle()
            } label: {
                Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(task.isCompleted ? .green : .gray)
            }
            .buttonStyle(.plain)

            Text(task.title)
                .strikethrough(task.isCompleted)
                .foregroundStyle(task.isCompleted ? .secondary : .primary)
        }
    }
}

struct AddProjectView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""

    var body: some View {
        NavigationStack {
            Form {
                TextField("Project Name", text: $name)
            }
            .navigationTitle("New Project")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        let project = Project(name: name)
                        modelContext.insert(project)
                        dismiss()
                    }
                    .disabled(name.isEmpty)
                }
            }
        }
    }
}
```

### Background Processing

```swift
import SwiftData

actor DataSyncService {
    private let modelContainer: ModelContainer

    init(modelContainer: ModelContainer) {
        self.modelContainer = modelContainer
    }

    func syncFromServer(_ serverData: [ServerTask]) async throws {
        let modelContext = ModelContext(modelContainer)

        for serverTask in serverData {
            let predicate = #Predicate<Task> { $0.id == serverTask.id }
            let descriptor = FetchDescriptor(predicate: predicate)

            if let existingTask = try modelContext.fetch(descriptor).first {
                // Update existing
                existingTask.title = serverTask.title
                existingTask.isCompleted = serverTask.isCompleted
            } else {
                // Create new
                let newTask = Task(
                    title: serverTask.title,
                    priority: serverTask.priority
                )
                modelContext.insert(newTask)
            }
        }

        try modelContext.save()
    }

    func exportTasks() async throws -> [TaskExport] {
        let modelContext = ModelContext(modelContainer)
        let descriptor = FetchDescriptor<Task>()
        let tasks = try modelContext.fetch(descriptor)

        return tasks.map { task in
            TaskExport(
                id: task.id,
                title: task.title,
                isCompleted: task.isCompleted
            )
        }
    }
}

// Usage in SwiftUI
struct SyncButton: View {
    @Environment(\.modelContext) private var modelContext
    @State private var isSyncing = false

    var body: some View {
        Button {
            Task {
                await performSync()
            }
        } label: {
            if isSyncing {
                ProgressView()
            } else {
                Image(systemName: "arrow.triangle.2.circlepath")
            }
        }
        .disabled(isSyncing)
    }

    private func performSync() async {
        isSyncing = true
        defer { isSyncing = false }

        guard let container = modelContext.container else { return }
        let syncService = DataSyncService(modelContainer: container)

        do {
            let serverData = try await fetchServerData()
            try await syncService.syncFromServer(serverData)
        } catch {
            print("Sync failed: \(error)")
        }
    }
}
```

### Schema Migration

```swift
// Version 1 schema
enum SchemaV1: VersionedSchema {
    static var versionIdentifier = Schema.Version(1, 0, 0)

    static var models: [any PersistentModel.Type] {
        [TaskV1.self]
    }

    @Model
    final class TaskV1 {
        var title: String
        var isCompleted: Bool

        init(title: String) {
            self.title = title
            self.isCompleted = false
        }
    }
}

// Version 2 schema - added priority
enum SchemaV2: VersionedSchema {
    static var versionIdentifier = Schema.Version(2, 0, 0)

    static var models: [any PersistentModel.Type] {
        [Task.self]
    }

    @Model
    final class Task {
        var title: String
        var isCompleted: Bool
        var priority: Int // New property

        init(title: String, priority: Int = 0) {
            self.title = title
            self.isCompleted = false
            self.priority = priority
        }
    }
}

// Migration plan
enum TaskMigrationPlan: SchemaMigrationPlan {
    static var schemas: [any VersionedSchema.Type] {
        [SchemaV1.self, SchemaV2.self]
    }

    static var stages: [MigrationStage] {
        [migrateV1toV2]
    }

    static let migrateV1toV2 = MigrationStage.lightweight(
        fromVersion: SchemaV1.self,
        toVersion: SchemaV2.self
    )
}

// Custom migration for complex changes
enum ComplexMigrationPlan: SchemaMigrationPlan {
    static var schemas: [any VersionedSchema.Type] {
        [SchemaV1.self, SchemaV2.self]
    }

    static var stages: [MigrationStage] {
        [migrateV1toV2]
    }

    static let migrateV1toV2 = MigrationStage.custom(
        fromVersion: SchemaV1.self,
        toVersion: SchemaV2.self
    ) { context in
        let tasks = try context.fetch(FetchDescriptor<SchemaV1.TaskV1>())

        for task in tasks {
            // Custom migration logic
            // Set default priority based on some criteria
            let newTask = SchemaV2.Task(
                title: task.title,
                priority: task.isCompleted ? 0 : 5
            )
            newTask.isCompleted = task.isCompleted
            context.insert(newTask)
            context.delete(task)
        }
    }
}

// Using migration in app
@main
struct MigratingApp: App {
    let container: ModelContainer

    init() {
        do {
            container = try ModelContainer(
                for: SchemaV2.Task.self,
                migrationPlan: TaskMigrationPlan.self
            )
        } catch {
            fatalError("Failed to initialize: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(container)
    }
}
```

## Best Practices

### 1. Model Design

```swift
// DO: Use value types where appropriate
@Model
final class UserSettings {
    var theme: Theme // Enum with Codable
    var notificationPreferences: NotificationPrefs // Struct with Codable

    init(theme: Theme = .system) {
        self.theme = theme
        self.notificationPreferences = NotificationPrefs()
    }
}

enum Theme: String, Codable {
    case light, dark, system
}

struct NotificationPrefs: Codable {
    var pushEnabled: Bool = true
    var emailEnabled: Bool = false
    var frequency: String = "daily"
}

// DO: Keep models focused
@Model
final class User {
    @Attribute(.unique) var email: String
    var displayName: String
    var createdAt: Date

    // Relationships separated by concern
    @Relationship(deleteRule: .cascade)
    var posts: [Post]

    @Relationship(deleteRule: .nullify)
    var settings: UserSettings?

    init(email: String, displayName: String) {
        self.email = email
        self.displayName = displayName
        self.createdAt = Date()
        self.posts = []
    }
}

// DON'T: Create overly complex models
// @Model
// final class EverythingModel {
//     var userData: Data
//     var preferences: Data
//     var history: Data
//     // Too generic, hard to query
// }
```

### 2. Efficient Querying

```swift
struct OptimizedTaskList: View {
    // DO: Use specific predicates
    @Query(
        filter: #Predicate<Task> { !$0.isCompleted && $0.priority > 3 },
        sort: \Task.dueDate
    )
    private var urgentTasks: [Task]

    // DO: Limit fetch results when appropriate
    @Query(sort: \Task.createdAt, order: .reverse)
    private var recentTasks: [Task]

    init() {
        var descriptor = FetchDescriptor<Task>(
            sortBy: [SortDescriptor(\Task.createdAt, order: .reverse)]
        )
        descriptor.fetchLimit = 10
        _recentTasks = Query(descriptor)
    }

    var body: some View {
        // View implementation
    }
}

// DO: Use fetchCount for existence checks
func hasUnreadNotifications(context: ModelContext) -> Bool {
    let predicate = #Predicate<Notification> { !$0.isRead }
    let descriptor = FetchDescriptor(predicate: predicate)
    return (try? context.fetchCount(descriptor)) ?? 0 > 0
}
```

### 3. Error Handling

```swift
enum DataError: Error {
    case saveFailed(underlying: Error)
    case fetchFailed(underlying: Error)
    case validationFailed(message: String)
}

class TaskRepository {
    private let modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func createTask(title: String, priority: Int) throws -> Task {
        // Validation
        guard !title.trimmingCharacters(in: .whitespaces).isEmpty else {
            throw DataError.validationFailed(message: "Title cannot be empty")
        }

        guard (0...10).contains(priority) else {
            throw DataError.validationFailed(message: "Priority must be 0-10")
        }

        let task = Task(title: title, priority: priority)
        modelContext.insert(task)

        do {
            try modelContext.save()
            return task
        } catch {
            modelContext.rollback()
            throw DataError.saveFailed(underlying: error)
        }
    }

    func fetchTasks(predicate: Predicate<Task>? = nil) throws -> [Task] {
        do {
            let descriptor = FetchDescriptor(predicate: predicate)
            return try modelContext.fetch(descriptor)
        } catch {
            throw DataError.fetchFailed(underlying: error)
        }
    }
}
```

### 4. Testing with In-Memory Storage

```swift
@testable import MyApp
import XCTest
import SwiftData

final class TaskTests: XCTestCase {
    var container: ModelContainer!
    var context: ModelContext!

    override func setUp() {
        super.setUp()

        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        container = try! ModelContainer(
            for: Task.self, Category.self,
            configurations: config
        )
        context = ModelContext(container)
    }

    override func tearDown() {
        container = nil
        context = nil
        super.tearDown()
    }

    func testTaskCreation() throws {
        let task = Task(title: "Test Task", priority: 5)
        context.insert(task)
        try context.save()

        let fetchedTasks = try context.fetch(FetchDescriptor<Task>())
        XCTAssertEqual(fetchedTasks.count, 1)
        XCTAssertEqual(fetchedTasks.first?.title, "Test Task")
    }

    func testTaskCompletion() throws {
        let task = Task(title: "Complete Me")
        context.insert(task)

        task.isCompleted = true
        try context.save()

        let predicate = #Predicate<Task> { $0.isCompleted }
        let descriptor = FetchDescriptor(predicate: predicate)
        let completedTasks = try context.fetch(descriptor)

        XCTAssertEqual(completedTasks.count, 1)
    }

    func testCascadeDelete() throws {
        let category = Category(name: "Work")
        let task = Task(title: "Work Task")
        task.category = category
        category.tasks.append(task)

        context.insert(category)
        try context.save()

        context.delete(category)
        try context.save()

        let tasks = try context.fetch(FetchDescriptor<Task>())
        XCTAssertTrue(tasks.isEmpty, "Tasks should be deleted with category")
    }
}
```

## Common Pitfalls

### 1. Forgetting to Insert Before Accessing Relationships

```swift
// WRONG - Crash when accessing relationship
let task = Task(title: "New Task")
task.category = someCategory // May crash if category isn't in same context

// CORRECT - Insert first
let task = Task(title: "New Task")
modelContext.insert(task)
task.category = someCategory
```

### 2. Modifying Objects from Different Contexts

```swift
// WRONG - Cross-context modification
func transferTask(_ task: Task, toCategory category: Category) {
    // task and category might be from different contexts
    task.category = category // Undefined behavior
}

// CORRECT - Ensure same context
func transferTask(_ task: Task, toCategory category: Category, in context: ModelContext) {
    guard task.modelContext === context,
          category.modelContext === context else {
        fatalError("Objects must be from the same context")
    }
    task.category = category
}
```

### 3. Blocking Main Thread with Large Fetches

```swift
// WRONG - Large fetch on main thread
struct BadView: View {
    @Query private var allItems: [LargeItem] // Could be millions

    var body: some View {
        List(allItems) { item in
            ItemRow(item: item)
        }
    }
}

// CORRECT - Paginate and limit
struct GoodView: View {
    @Query private var items: [LargeItem]
    @State private var page = 0
    private let pageSize = 50

    init() {
        var descriptor = FetchDescriptor<LargeItem>(
            sortBy: [SortDescriptor(\LargeItem.createdAt, order: .reverse)]
        )
        descriptor.fetchLimit = 50
        _items = Query(descriptor)
    }

    var body: some View {
        List(items) { item in
            ItemRow(item: item)
        }
    }
}
```

### 4. Not Handling Optional Relationships

```swift
// WRONG - Force unwrapping relationship
struct TaskDetail: View {
    let task: Task

    var body: some View {
        Text(task.category!.name) // Crash if nil
    }
}

// CORRECT - Handle optionality
struct TaskDetail: View {
    let task: Task

    var body: some View {
        if let category = task.category {
            Text(category.name)
        } else {
            Text("Uncategorized")
                .foregroundStyle(.secondary)
        }
    }
}
```

## Performance Considerations

### 1. Batch Operations

```swift
extension ModelContext {
    func batchInsert<T: PersistentModel>(_ objects: [T]) throws {
        for object in objects {
            insert(object)
        }
        try save()
    }

    func batchDelete<T: PersistentModel>(
        _ type: T.Type,
        predicate: Predicate<T>
    ) throws {
        let descriptor = FetchDescriptor(predicate: predicate)
        let objects = try fetch(descriptor)

        for object in objects {
            delete(object)
        }
        try save()
    }
}

// Usage
func importTasks(_ taskData: [TaskDTO]) async throws {
    let context = ModelContext(container)

    let tasks = taskData.map { dto in
        Task(title: dto.title, priority: dto.priority)
    }

    try context.batchInsert(tasks)
}
```

### 2. Lazy Loading Relationships

```swift
@Model
final class Post {
    var title: String

    // Large relationship loaded on demand
    @Relationship(deleteRule: .cascade)
    var comments: [Comment]

    init(title: String) {
        self.title = title
        self.comments = []
    }
}

// Access comments only when needed
struct PostCell: View {
    let post: Post
    @State private var showComments = false

    var body: some View {
        VStack {
            Text(post.title)

            if showComments {
                // Comments loaded only when expanded
                ForEach(post.comments) { comment in
                    CommentRow(comment: comment)
                }
            }

            Button(showComments ? "Hide" : "Show Comments") {
                showComments.toggle()
            }
        }
    }
}
```

### 3. Index Important Properties

```swift
@Model
final class SearchableItem {
    // Indexed for fast lookups
    @Attribute(.unique)
    var identifier: String

    // Indexed for search
    @Attribute(.spotlight)
    var searchableText: String

    // Not indexed - rarely queried directly
    var metadata: String

    init(identifier: String, searchableText: String) {
        self.identifier = identifier
        self.searchableText = searchableText
        self.metadata = ""
    }
}
```

## Real-World Scenarios

### Offline-First App with Sync

```swift
@Model
final class SyncableNote {
    @Attribute(.unique) var remoteId: String?
    var localId: UUID
    var content: String
    var lastModified: Date
    var syncStatus: SyncStatus

    enum SyncStatus: String, Codable {
        case synced, pendingUpload, pendingDelete, conflict
    }

    init(content: String) {
        self.localId = UUID()
        self.content = content
        self.lastModified = Date()
        self.syncStatus = .pendingUpload
    }
}

actor SyncManager {
    private let container: ModelContainer
    private let apiClient: APIClient

    init(container: ModelContainer, apiClient: APIClient) {
        self.container = container
        self.apiClient = apiClient
    }

    func syncPendingChanges() async throws {
        let context = ModelContext(container)

        // Upload pending
        let pendingPredicate = #Predicate<SyncableNote> {
            $0.syncStatus == .pendingUpload
        }
        let pendingNotes = try context.fetch(
            FetchDescriptor(predicate: pendingPredicate)
        )

        for note in pendingNotes {
            do {
                let remoteId = try await apiClient.uploadNote(note)
                note.remoteId = remoteId
                note.syncStatus = .synced
            } catch {
                // Handle specific error
                print("Failed to sync: \(error)")
            }
        }

        // Delete pending
        let deletePredicate = #Predicate<SyncableNote> {
            $0.syncStatus == .pendingDelete
        }
        let toDelete = try context.fetch(
            FetchDescriptor(predicate: deletePredicate)
        )

        for note in toDelete {
            if let remoteId = note.remoteId {
                try await apiClient.deleteNote(remoteId)
            }
            context.delete(note)
        }

        try context.save()
    }
}
```

## Interview Key Points

1. **@Model Macro**: Explain how it transforms classes into persistent models

2. **ModelContainer vs ModelContext**: Container manages storage and schema; context handles CRUD operations

3. **@Query Property Wrapper**: Describe how it provides reactive data binding in SwiftUI

4. **Relationship Types**: Explain one-to-one, one-to-many, many-to-many and delete rules

5. **Predicates**: Show how to use #Predicate for type-safe filtering

6. **Schema Migration**: Describe lightweight vs custom migrations

7. **SwiftData vs Core Data**: Discuss when to use each (new projects vs legacy)

8. **Background Processing**: Explain how to safely work with data on background threads

9. **Performance**: Discuss fetch limits, pagination, and indexing strategies

10. **Testing**: Describe in-memory container configuration for unit tests

## Further Reading

- [Apple SwiftData Documentation](https://developer.apple.com/documentation/swiftdata)
- [WWDC 2023: Meet SwiftData](https://developer.apple.com/videos/play/wwdc2023/10187/)
- [WWDC 2023: Model Your Schema with SwiftData](https://developer.apple.com/videos/play/wwdc2023/10195/)
- [WWDC 2023: Dive Deeper into SwiftData](https://developer.apple.com/videos/play/wwdc2023/10196/)
- [Migrating from Core Data to SwiftData](https://developer.apple.com/documentation/coredata/migratingtocoredata)
- [SwiftData Sample Code](https://developer.apple.com/documentation/swiftdata/building-a-document-based-app-using-swiftdata)
