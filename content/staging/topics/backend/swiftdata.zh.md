---
title: SwiftData 数据持久化
description: 掌握 SwiftData，Apple 的现代 Swift 数据持久化框架，具有声明式建模、自动 CloudKit 同步和无缝 SwiftUI 集成
track: backend
section: databases
difficulty: intermediate
tags:
  - Swift
  - iOS
  - SwiftData
  - 持久化
  - Core Data
  - 数据库
status: imported
origin: old/src/content/docs/swift/swiftdata.zh.md
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

## 概念解释

SwiftData 是 Apple 在 iOS 17、macOS 14 及其他 2023 年平台版本中引入的现代数据持久化框架。它构建在 Core Data 之上，提供了一种 Swift 原生的声明式数据建模和持久化方法，与 SwiftUI 无缝集成。

与 Core Data 分离的模型编辑器和代码生成不同，SwiftData 使用 Swift 宏直接在代码中定义模型。`@Model` 宏将普通的 Swift 类转换为持久化对象，自动生成 schema、关系和所需的样板代码。

相比 Core Data 的关键优势：
- **纯 Swift**：无需 Objective-C 运行时，无需继承 NSManagedObject
- **声明式**：使用 Swift 宏定义模型
- **类型安全**：模型属性完全编译时检查
- **SwiftUI 集成**：原生支持 `@Query` 和环境注入
- **自动 Schema 迁移**：轻量级迁移自动处理
- **CloudKit 就绪**：内置 iCloud 同步支持

## 核心原理

### 使用 @Model 定义模型

`@Model` 宏是 SwiftData 的基础：

```swift
import SwiftData

@Model
final class Task {
    var title: String
    var notes: String
    var dueDate: Date?
    var isCompleted: Bool
    var priority: Int

    // 关系会自动推断
    var category: Category?

    // 计算属性不会被持久化
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

    // 反向关系 - SwiftData 自动管理
    @Relationship(deleteRule: .cascade, inverse: \Task.category)
    var tasks: [Task]

    init(name: String, color: String = "blue") {
        self.name = name
        self.color = color
        self.tasks = []
    }
}
```

### ModelContainer 和 ModelContext

SwiftData 使用容器和上下文进行数据管理：

```swift
// ModelContainer：管理 schema 和存储
// ModelContext：处理 CRUD 操作并跟踪变化

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Task.self, Category.self])
    }
}

// 自定义容器配置
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

### 属性包装器

SwiftData 提供了多个属性包装器：

```swift
@Model
final class Article {
    // 标准属性 - 持久化并索引
    var title: String

    // 唯一约束
    @Attribute(.unique)
    var slug: String

    // 大数据的外部存储
    @Attribute(.externalStorage)
    var imageData: Data?

    // 临时属性 - 不持久化
    @Transient
    var cachedHTML: String?

    // Spotlight 索引
    @Attribute(.spotlight)
    var searchableContent: String

    // 加密（需要适当的权限）
    @Attribute(.allowsCloudEncryption)
    var sensitiveNotes: String?

    // 迁移兼容的原始名称
    @Attribute(originalName: "body")
    var content: String

    init(title: String, slug: String, content: String) {
        self.title = title
        self.slug = slug
        self.content = content
    }
}
```

## 核心要点

### 1. 关系

SwiftData 支持各种关系类型：

```swift
@Model
final class Author {
    var name: String

    // 一对多关系
    @Relationship(deleteRule: .cascade)
    var books: [Book]

    // 一对一关系
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

    // 反向关系（对一）
    var author: Author?

    // 多对多关系
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

删除规则：
- `.cascade`：删除关联对象
- `.nullify`：将关系设为 nil（默认）
- `.deny`：如果存在关系则阻止删除
- `.noAction`：不执行任何操作（需要手动清理）

### 2. 使用 @Query 查询

通过 `@Query` 属性包装器与 SwiftUI 集成：

```swift
struct TaskListView: View {
    // 基本查询 - 获取所有任务
    @Query private var tasks: [Task]

    // 排序查询
    @Query(sort: \Task.dueDate) private var sortedTasks: [Task]

    // 过滤和排序
    @Query(
        filter: #Predicate<Task> { !$0.isCompleted },
        sort: [SortDescriptor(\Task.priority, order: .reverse)]
    )
    private var pendingTasks: [Task]

    // 复杂谓词
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

// 基于状态的动态查询
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

### 3. CRUD 操作

基本数据操作：

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
            Button("添加", action: addTask)
        }
    }

    // 创建
    private func addTask() {
        let newTask = Task(title: "新任务", priority: 1)
        modelContext.insert(newTask)

        // 显式保存（通常是自动的）
        try? modelContext.save()
    }

    // 更新
    private func updateTask(_ task: Task) {
        task.isCompleted = true
        task.title = "更新后的标题"
        // 变化会自动跟踪
    }

    // 删除
    private func deleteTasks(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(tasks[index])
        }
    }
}
```

### 4. 不使用 @Query 的获取

非 SwiftUI 上下文的编程式获取：

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

## 代码示例

### 完整的任务管理应用

```swift
import SwiftUI
import SwiftData

// MARK: - 模型

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

// MARK: - 应用入口

@main
struct ProjectManagerApp: App {
    var body: some Scene {
        WindowGroup {
            ProjectListView()
        }
        .modelContainer(for: [Project.self, ProjectTask.self])
    }
}

// MARK: - 视图

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
            .navigationTitle("项目")
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
                Text("\(project.tasks.count) 个任务")
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
            Section("任务") {
                ForEach(project.tasks) { task in
                    TaskRowView(task: task)
                }
                .onDelete(perform: deleteTasks)
            }

            Section("添加任务") {
                HStack {
                    TextField("任务标题", text: $newTaskTitle)

                    Button("添加") {
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
                TextField("项目名称", text: $name)
            }
            .navigationTitle("新项目")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("创建") {
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

### 后台处理

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
                // 更新现有
                existingTask.title = serverTask.title
                existingTask.isCompleted = serverTask.isCompleted
            } else {
                // 创建新的
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

// 在 SwiftUI 中使用
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
            print("同步失败：\(error)")
        }
    }
}
```

### Schema 迁移

```swift
// 版本 1 schema
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

// 版本 2 schema - 添加了优先级
enum SchemaV2: VersionedSchema {
    static var versionIdentifier = Schema.Version(2, 0, 0)

    static var models: [any PersistentModel.Type] {
        [Task.self]
    }

    @Model
    final class Task {
        var title: String
        var isCompleted: Bool
        var priority: Int // 新属性

        init(title: String, priority: Int = 0) {
            self.title = title
            self.isCompleted = false
            self.priority = priority
        }
    }
}

// 迁移计划
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

// 复杂变更的自定义迁移
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
            // 自定义迁移逻辑
            // 根据某些条件设置默认优先级
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

// 在应用中使用迁移
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
            fatalError("初始化失败：\(error)")
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

## 最佳实践

### 1. 模型设计

```swift
// 推荐：适当使用值类型
@Model
final class UserSettings {
    var theme: Theme // 带 Codable 的枚举
    var notificationPreferences: NotificationPrefs // 带 Codable 的结构体

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

// 推荐：保持模型专注
@Model
final class User {
    @Attribute(.unique) var email: String
    var displayName: String
    var createdAt: Date

    // 按关注点分离的关系
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

// 不推荐：创建过于复杂的模型
// @Model
// final class EverythingModel {
//     var userData: Data
//     var preferences: Data
//     var history: Data
//     // 太通用，难以查询
// }
```

### 2. 高效查询

```swift
struct OptimizedTaskList: View {
    // 推荐：使用具体的谓词
    @Query(
        filter: #Predicate<Task> { !$0.isCompleted && $0.priority > 3 },
        sort: \Task.dueDate
    )
    private var urgentTasks: [Task]

    // 推荐：适当时限制获取结果
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
        // 视图实现
    }
}

// 推荐：使用 fetchCount 进行存在性检查
func hasUnreadNotifications(context: ModelContext) -> Bool {
    let predicate = #Predicate<Notification> { !$0.isRead }
    let descriptor = FetchDescriptor(predicate: predicate)
    return (try? context.fetchCount(descriptor)) ?? 0 > 0
}
```

### 3. 错误处理

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
        // 验证
        guard !title.trimmingCharacters(in: .whitespaces).isEmpty else {
            throw DataError.validationFailed(message: "标题不能为空")
        }

        guard (0...10).contains(priority) else {
            throw DataError.validationFailed(message: "优先级必须在 0-10 之间")
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

### 4. 使用内存存储进行测试

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
        let task = Task(title: "测试任务", priority: 5)
        context.insert(task)
        try context.save()

        let fetchedTasks = try context.fetch(FetchDescriptor<Task>())
        XCTAssertEqual(fetchedTasks.count, 1)
        XCTAssertEqual(fetchedTasks.first?.title, "测试任务")
    }

    func testTaskCompletion() throws {
        let task = Task(title: "完成我")
        context.insert(task)

        task.isCompleted = true
        try context.save()

        let predicate = #Predicate<Task> { $0.isCompleted }
        let descriptor = FetchDescriptor(predicate: predicate)
        let completedTasks = try context.fetch(descriptor)

        XCTAssertEqual(completedTasks.count, 1)
    }

    func testCascadeDelete() throws {
        let category = Category(name: "工作")
        let task = Task(title: "工作任务")
        task.category = category
        category.tasks.append(task)

        context.insert(category)
        try context.save()

        context.delete(category)
        try context.save()

        let tasks = try context.fetch(FetchDescriptor<Task>())
        XCTAssertTrue(tasks.isEmpty, "任务应该随分类一起被删除")
    }
}
```

## 常见陷阱

### 1. 在访问关系之前忘记插入

```swift
// 错误 - 访问关系时崩溃
let task = Task(title: "新任务")
task.category = someCategory // 如果 category 不在同一上下文中可能崩溃

// 正确 - 先插入
let task = Task(title: "新任务")
modelContext.insert(task)
task.category = someCategory
```

### 2. 修改来自不同上下文的对象

```swift
// 错误 - 跨上下文修改
func transferTask(_ task: Task, toCategory category: Category) {
    // task 和 category 可能来自不同的上下文
    task.category = category // 未定义行为
}

// 正确 - 确保相同上下文
func transferTask(_ task: Task, toCategory category: Category, in context: ModelContext) {
    guard task.modelContext === context,
          category.modelContext === context else {
        fatalError("对象必须来自同一上下文")
    }
    task.category = category
}
```

### 3. 大量获取阻塞主线程

```swift
// 错误 - 在主线程上进行大量获取
struct BadView: View {
    @Query private var allItems: [LargeItem] // 可能有数百万条

    var body: some View {
        List(allItems) { item in
            ItemRow(item: item)
        }
    }
}

// 正确 - 分页和限制
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

### 4. 没有处理可选关系

```swift
// 错误 - 强制解包关系
struct TaskDetail: View {
    let task: Task

    var body: some View {
        Text(task.category!.name) // 如果为 nil 会崩溃
    }
}

// 正确 - 处理可选性
struct TaskDetail: View {
    let task: Task

    var body: some View {
        if let category = task.category {
            Text(category.name)
        } else {
            Text("未分类")
                .foregroundStyle(.secondary)
        }
    }
}
```

## 性能考量

### 1. 批量操作

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

// 使用
func importTasks(_ taskData: [TaskDTO]) async throws {
    let context = ModelContext(container)

    let tasks = taskData.map { dto in
        Task(title: dto.title, priority: dto.priority)
    }

    try context.batchInsert(tasks)
}
```

### 2. 延迟加载关系

```swift
@Model
final class Post {
    var title: String

    // 按需加载的大型关系
    @Relationship(deleteRule: .cascade)
    var comments: [Comment]

    init(title: String) {
        self.title = title
        self.comments = []
    }
}

// 仅在需要时访问评论
struct PostCell: View {
    let post: Post
    @State private var showComments = false

    var body: some View {
        VStack {
            Text(post.title)

            if showComments {
                // 仅在展开时加载评论
                ForEach(post.comments) { comment in
                    CommentRow(comment: comment)
                }
            }

            Button(showComments ? "隐藏" : "显示评论") {
                showComments.toggle()
            }
        }
    }
}
```

### 3. 索引重要属性

```swift
@Model
final class SearchableItem {
    // 索引以进行快速查找
    @Attribute(.unique)
    var identifier: String

    // 索引以进行搜索
    @Attribute(.spotlight)
    var searchableText: String

    // 未索引 - 很少直接查询
    var metadata: String

    init(identifier: String, searchableText: String) {
        self.identifier = identifier
        self.searchableText = searchableText
        self.metadata = ""
    }
}
```

## 实战场景

### 带同步的离线优先应用

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

        // 上传待处理
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
                // 处理特定错误
                print("同步失败：\(error)")
            }
        }

        // 删除待处理
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

## 面试要点

1. **@Model 宏**：解释它如何将类转换为持久化模型

2. **ModelContainer vs ModelContext**：Container 管理存储和 schema；Context 处理 CRUD 操作

3. **@Query 属性包装器**：描述它如何在 SwiftUI 中提供响应式数据绑定

4. **关系类型**：解释一对一、一对多、多对多和删除规则

5. **谓词**：展示如何使用 #Predicate 进行类型安全的过滤

6. **Schema 迁移**：描述轻量级迁移与自定义迁移

7. **SwiftData vs Core Data**：讨论何时使用各自（新项目 vs 遗留项目）

8. **后台处理**：解释如何在后台线程安全地处理数据

9. **性能**：讨论获取限制、分页和索引策略

10. **测试**：描述用于单元测试的内存容器配置

## 延伸阅读

- [Apple SwiftData 文档](https://developer.apple.com/documentation/swiftdata)
- [WWDC 2023: 认识 SwiftData](https://developer.apple.com/videos/play/wwdc2023/10187/)
- [WWDC 2023: 使用 SwiftData 建模你的 Schema](https://developer.apple.com/videos/play/wwdc2023/10195/)
- [WWDC 2023: 深入了解 SwiftData](https://developer.apple.com/videos/play/wwdc2023/10196/)
- [从 Core Data 迁移到 SwiftData](https://developer.apple.com/documentation/coredata/migratingtocoredata)
- [SwiftData 示例代码](https://developer.apple.com/documentation/swiftdata/building-a-document-based-app-using-swiftdata)
