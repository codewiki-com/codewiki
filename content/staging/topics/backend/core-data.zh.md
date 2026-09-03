---
title: Core Data 数据持久化
description: 深入理解Swift Core Data框架，掌握数据模型、NSManagedObject、查询请求、关系管理与数据迁移
track: backend
section: databases
difficulty: advanced
tags:
  - Swift
  - Core Data
  - 数据持久化
  - iOS开发
  - 数据库
status: imported
origin: old/src/content/docs/swift/core-data.zh.md
divergence: 0.215
issues:
  - title-lang-en
  - title-language
legacy:
  category: Swift
  subcategory: 数据持久化
  order: 15
  lastUpdated: 2026-01-07
---

Core Data 是 Apple 提供的强大对象图和持久化框架，用于管理应用程序中的模型层对象。它不仅仅是一个数据库，而是一个完整的对象生命周期管理解决方案，提供了对象持久化、撤销/重做、数据验证、变更跟踪等功能。

## 概念解释

### 什么是 Core Data

Core Data 是一个用于管理应用程序中模型层对象的框架。它提供了以下核心功能：

- **持久化**：将对象数据保存到磁盘（SQLite、XML、二进制或内存）
- **对象图管理**：管理对象之间的关系和依赖
- **变更跟踪**：自动追踪对象的修改
- **撤销/重做**：内置的撤销管理器支持
- **内存优化**：懒加载和 Faulting 机制减少内存占用
- **数据验证**：内置的数据验证机制

### Core Data 与数据库的区别

很多开发者误认为 Core Data 就是数据库，但实际上它们有本质区别：

| 特性 | Core Data | 传统数据库 |
|------|-----------|------------|
| 核心概念 | 对象图管理 | 表格和记录 |
| 查询方式 | 对象属性 | SQL 语句 |
| 关系管理 | 自动处理 | 需要手动管理外键 |
| 数据存储 | 可选（SQLite/XML/Binary/Memory） | 固定格式 |
| 主要用途 | 对象持久化和管理 | 数据存储和查询 |

### 核心组件概览

```
┌─────────────────────────────────────────────────────────────┐
│                     应用程序层                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │ NSManagedObject │    │ NSManagedObjectContext       │   │
│  │   (托管对象)     │◄──►│   (托管对象上下文)            │   │
│  └─────────────────┘    └──────────────────────────────┘   │
│           │                          │                      │
│           ▼                          ▼                      │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │ NSEntityDescrip-│    │ NSPersistentStoreCoordinator │   │
│  │     tion        │◄──►│   (持久化存储协调器)          │   │
│  │   (实体描述)     │    └──────────────────────────────┘   │
│  └─────────────────┘                 │                      │
│           │                          ▼                      │
│           │             ┌──────────────────────────────┐   │
│           │             │   NSPersistentStore          │   │
│           ▼             │   (持久化存储)                │   │
│  ┌─────────────────┐    └──────────────────────────────┘   │
│  │ NSManagedObject │                 │                      │
│  │     Model       │                 ▼                      │
│  │  (托管对象模型)  │    ┌──────────────────────────────┐   │
│  └─────────────────┘    │     SQLite/XML/Binary        │   │
│                         │        (存储文件)              │   │
│                         └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心原理

### Core Data Stack（核心数据栈）

Core Data Stack 是 Core Data 架构的核心，由以下组件组成：

#### NSManagedObjectModel（托管对象模型）

托管对象模型定义了应用程序的数据结构，包括实体（Entity）、属性（Attribute）和关系（Relationship）。

```swift
// 加载数据模型
let modelURL = Bundle.main.url(forResource: "MyApp", withExtension: "momd")!
let managedObjectModel = NSManagedObjectModel(contentsOf: modelURL)!

// 或通过名称加载
let model = NSManagedObjectModel.mergedModel(from: [Bundle.main])!
```

#### NSPersistentStoreCoordinator（持久化存储协调器）

持久化存储协调器负责协调模型和存储之间的关系，管理一个或多个持久化存储。

```swift
let coordinator = NSPersistentStoreCoordinator(managedObjectModel: model)

// 添加 SQLite 存储
let storeURL = FileManager.default
    .urls(for: .documentDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("MyApp.sqlite")

do {
    try coordinator.addPersistentStore(
        ofType: NSSQLiteStoreType,
        configurationName: nil,
        at: storeURL,
        options: nil
    )
} catch {
    fatalError("无法添加持久化存储: \(error)")
}
```

#### NSManagedObjectContext（托管对象上下文）

托管对象上下文是应用程序与 Core Data 交互的主要接口，负责管理托管对象的生命周期。

```swift
let context = NSManagedObjectContext(concurrencyType: .mainQueueConcurrencyType)
context.persistentStoreCoordinator = coordinator

// 或使用 NSPersistentContainer（推荐）
```

#### NSPersistentContainer（持久化容器）

iOS 10+ 引入的 NSPersistentContainer 简化了 Core Data Stack 的创建：

```swift
class CoreDataStack {
    static let shared = CoreDataStack()

    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "MyApp")

        container.loadPersistentStores { storeDescription, error in
            if let error = error as NSError? {
                fatalError("无法加载持久化存储: \(error), \(error.userInfo)")
            }

            // 配置选项
            storeDescription.shouldMigrateStoreAutomatically = true
            storeDescription.shouldInferMappingModelAutomatically = true
        }

        // 配置上下文
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy

        return container
    }()

    var viewContext: NSManagedObjectContext {
        return persistentContainer.viewContext
    }

    func newBackgroundContext() -> NSManagedObjectContext {
        return persistentContainer.newBackgroundContext()
    }

    func saveContext() {
        let context = persistentContainer.viewContext
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let nsError = error as NSError
                print("保存失败: \(nsError), \(nsError.userInfo)")
            }
        }
    }
}
```

### Faulting 机制

Core Data 使用 Faulting（故障）机制来优化内存使用。当获取对象时，Core Data 可能只创建一个"故障"对象，只有在访问其属性时才真正加载数据。

```swift
// 获取的对象可能是 fault 状态
let person = try context.existingObject(with: objectID) as! Person

// 检查是否是 fault
if person.isFault {
    print("对象尚未完全加载")
}

// 访问属性会触发 fault 填充
print(person.name)  // 此时会从存储中加载数据

// 强制填充 fault
context.refresh(person, mergeChanges: true)
```

### 变更跟踪

Core Data 自动跟踪托管对象的变更：

```swift
// 检查上下文是否有变更
if context.hasChanges {
    print("有未保存的变更")
}

// 获取已插入、已更新、已删除的对象
let insertedObjects = context.insertedObjects
let updatedObjects = context.updatedObjects
let deletedObjects = context.deletedObjects

// 检查单个对象的变更
if person.hasChanges {
    let changedValues = person.changedValues()
    for (key, value) in changedValues {
        print("属性 \(key) 变更为 \(value)")
    }
}

// 回滚单个对象的变更
context.refresh(person, mergeChanges: false)

// 回滚所有变更
context.rollback()
```

---

## 核心要点

### 数据模型设计

#### 创建实体（Entity）

在 Xcode 的 Data Model Editor 中创建实体，或通过代码定义：

```swift
// 代码方式创建实体描述（通常使用 .xcdatamodeld 文件）
let personEntity = NSEntityDescription()
personEntity.name = "Person"
personEntity.managedObjectClassName = "Person"

// 添加属性
let nameAttribute = NSAttributeDescription()
nameAttribute.name = "name"
nameAttribute.attributeType = .stringAttributeType
nameAttribute.isOptional = false

let ageAttribute = NSAttributeDescription()
ageAttribute.name = "age"
ageAttribute.attributeType = .integer16AttributeType
ageAttribute.defaultValue = 0

personEntity.properties = [nameAttribute, ageAttribute]
```

#### 属性类型

Core Data 支持多种属性类型：

| 类型 | Swift 类型 | 说明 |
|------|-----------|------|
| Integer 16/32/64 | Int16/Int32/Int64 | 整数类型 |
| Decimal | NSDecimalNumber | 精确小数 |
| Double | Double | 双精度浮点 |
| Float | Float | 单精度浮点 |
| String | String | 字符串 |
| Boolean | Bool | 布尔值 |
| Date | Date | 日期时间 |
| Binary Data | Data | 二进制数据 |
| UUID | UUID | 唯一标识符 |
| URI | URL | 统一资源标识符 |
| Transformable | Any | 可转换类型 |

### NSManagedObject 子类

#### 自动生成与手动定义

Xcode 可以自动生成 NSManagedObject 子类。在 Data Model Inspector 中设置 Codegen：

- **Manual/None**：完全手动创建
- **Class Definition**：自动生成类定义
- **Category/Extension**：只生成扩展

```swift
// 手动定义 NSManagedObject 子类
@objc(Person)
public class Person: NSManagedObject {
    @NSManaged public var name: String
    @NSManaged public var age: Int16
    @NSManaged public var email: String?
    @NSManaged public var createdAt: Date
    @NSManaged public var department: Department?
    @NSManaged public var tasks: NSSet?
}

// 扩展添加便捷方法
extension Person {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Person> {
        return NSFetchRequest<Person>(entityName: "Person")
    }

    // 计算属性
    var displayName: String {
        return "\(name) (\(age)岁)"
    }

    // 便捷初始化
    convenience init(name: String, age: Int16, context: NSManagedObjectContext) {
        let entity = NSEntityDescription.entity(forEntityName: "Person", in: context)!
        self.init(entity: entity, insertInto: context)
        self.name = name
        self.age = age
        self.createdAt = Date()
    }
}
```

#### @NSManaged 属性包装器

`@NSManaged` 告诉编译器这些属性由 Core Data 在运行时提供实现：

```swift
@objc(Task)
public class Task: NSManagedObject {
    @NSManaged public var title: String
    @NSManaged public var isCompleted: Bool
    @NSManaged public var dueDate: Date?
    @NSManaged public var priority: Int16
    @NSManaged public var assignee: Person?

    // 重写访问器实现自定义逻辑
    @NSManaged private var primitiveTitle: String

    public var title: String {
        get {
            willAccessValue(forKey: "title")
            let value = primitiveTitle
            didAccessValue(forKey: "title")
            return value
        }
        set {
            willChangeValue(forKey: "title")
            primitiveTitle = newValue.trimmingCharacters(in: .whitespaces)
            didChangeValue(forKey: "title")
        }
    }
}
```

---

## 代码示例

### CRUD 操作

#### 创建对象（Create）

```swift
class PersonRepository {
    let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
    }

    // 创建单个对象
    func createPerson(name: String, age: Int16, email: String?) -> Person {
        let person = Person(context: context)
        person.name = name
        person.age = age
        person.email = email
        person.createdAt = Date()
        return person
    }

    // 批量创建
    func createPeople(_ data: [(name: String, age: Int16)]) -> [Person] {
        return data.map { item in
            let person = Person(context: context)
            person.name = item.name
            person.age = item.age
            person.createdAt = Date()
            return person
        }
    }

    // 保存变更
    func save() throws {
        if context.hasChanges {
            try context.save()
        }
    }
}

// 使用示例
let repository = PersonRepository(context: CoreDataStack.shared.viewContext)
let person = repository.createPerson(name: "张三", age: 25, email: "zhangsan@example.com")

do {
    try repository.save()
    print("创建成功，ID: \(person.objectID)")
} catch {
    print("保存失败: \(error)")
}
```

#### 查询对象（Read）

```swift
extension PersonRepository {
    // 获取所有人员
    func fetchAll() throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Person.name, ascending: true)]
        return try context.fetch(request)
    }

    // 根据条件查询
    func fetchPeople(minAge: Int16, maxAge: Int16) throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.predicate = NSPredicate(format: "age >= %d AND age <= %d", minAge, maxAge)
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Person.age, ascending: true)]
        return try context.fetch(request)
    }

    // 根据名称搜索
    func searchByName(_ keyword: String) throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.predicate = NSPredicate(format: "name CONTAINS[cd] %@", keyword)
        return try context.fetch(request)
    }

    // 分页查询
    func fetchPaged(page: Int, pageSize: Int) throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.fetchOffset = page * pageSize
        request.fetchLimit = pageSize
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Person.createdAt, ascending: false)]
        return try context.fetch(request)
    }

    // 只获取计数
    func count() throws -> Int {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        return try context.count(for: request)
    }

    // 根据 ObjectID 获取
    func fetchById(_ objectID: NSManagedObjectID) throws -> Person? {
        return try context.existingObject(with: objectID) as? Person
    }
}
```

#### 更新对象（Update）

```swift
extension PersonRepository {
    // 更新单个对象
    func updatePerson(_ person: Person, name: String? = nil, age: Int16? = nil) {
        if let name = name {
            person.name = name
        }
        if let age = age {
            person.age = age
        }
    }

    // 批量更新（iOS 13+）
    func updateAllAges(increment: Int16) throws -> Int {
        let batchUpdate = NSBatchUpdateRequest(entityName: "Person")
        batchUpdate.propertiesToUpdate = ["age": NSExpression(format: "age + %d", increment)]
        batchUpdate.resultType = .updatedObjectsCountResultType

        let result = try context.execute(batchUpdate) as! NSBatchUpdateResult
        let count = result.result as! Int

        // 刷新上下文中的对象
        context.refreshAllObjects()

        return count
    }

    // 根据条件批量更新
    func markAsAdult() throws -> Int {
        let batchUpdate = NSBatchUpdateRequest(entityName: "Person")
        batchUpdate.predicate = NSPredicate(format: "age >= 18")
        batchUpdate.propertiesToUpdate = ["isAdult": true]
        batchUpdate.resultType = .updatedObjectsCountResultType

        let result = try context.execute(batchUpdate) as! NSBatchUpdateResult
        return result.result as! Int
    }
}

// 使用示例
let people = try repository.fetchAll()
if let person = people.first {
    repository.updatePerson(person, name: "李四", age: 30)
    try repository.save()
}
```

#### 删除对象（Delete）

```swift
extension PersonRepository {
    // 删除单个对象
    func delete(_ person: Person) {
        context.delete(person)
    }

    // 删除多个对象
    func deleteAll(_ people: [Person]) {
        people.forEach { context.delete($0) }
    }

    // 批量删除（性能更好）
    func batchDelete(olderThan date: Date) throws -> Int {
        let request = NSFetchRequest<NSFetchRequestResult>(entityName: "Person")
        request.predicate = NSPredicate(format: "createdAt < %@", date as NSDate)

        let batchDelete = NSBatchDeleteRequest(fetchRequest: request)
        batchDelete.resultType = .resultTypeCount

        let result = try context.execute(batchDelete) as! NSBatchDeleteResult
        let count = result.result as! Int

        // 刷新上下文
        context.refreshAllObjects()

        return count
    }

    // 删除所有数据
    func deleteAllPeople() throws {
        let request = NSFetchRequest<NSFetchRequestResult>(entityName: "Person")
        let batchDelete = NSBatchDeleteRequest(fetchRequest: request)
        try context.execute(batchDelete)
        context.refreshAllObjects()
    }
}
```

### NSFetchRequest 详解

```swift
class FetchRequestExamples {
    let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
    }

    // 基本查询
    func basicFetch() throws -> [Person] {
        let request = NSFetchRequest<Person>(entityName: "Person")
        return try context.fetch(request)
    }

    // 复杂谓词
    func complexPredicate() throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()

        // 组合条件
        let agePredicate = NSPredicate(format: "age >= %d", 18)
        let namePredicate = NSPredicate(format: "name BEGINSWITH %@", "张")
        let emailPredicate = NSPredicate(format: "email != nil")

        request.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [
            agePredicate,
            namePredicate,
            emailPredicate
        ])

        return try context.fetch(request)
    }

    // 常用谓词语法
    func predicateExamples() {
        // 等于
        _ = NSPredicate(format: "name == %@", "张三")

        // 不等于
        _ = NSPredicate(format: "age != %d", 0)

        // 比较
        _ = NSPredicate(format: "age > %d AND age < %d", 18, 60)

        // 包含（区分大小写）
        _ = NSPredicate(format: "name CONTAINS %@", "张")

        // 包含（不区分大小写和变音符号）
        _ = NSPredicate(format: "name CONTAINS[cd] %@", "zhang")

        // 开头/结尾
        _ = NSPredicate(format: "name BEGINSWITH %@", "张")
        _ = NSPredicate(format: "email ENDSWITH %@", "@example.com")

        // 正则表达式
        _ = NSPredicate(format: "email MATCHES %@", "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}")

        // IN 操作
        _ = NSPredicate(format: "name IN %@", ["张三", "李四", "王五"])

        // BETWEEN
        _ = NSPredicate(format: "age BETWEEN %@", [18, 60])

        // NULL 检查
        _ = NSPredicate(format: "email == nil")
        _ = NSPredicate(format: "email != nil")

        // 关系查询
        _ = NSPredicate(format: "department.name == %@", "技术部")
        _ = NSPredicate(format: "ANY tasks.isCompleted == YES")
        _ = NSPredicate(format: "ALL tasks.isCompleted == YES")
        _ = NSPredicate(format: "tasks.@count > %d", 5)
    }

    // 排序
    func sortedFetch() throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Person.age, ascending: false),
            NSSortDescriptor(keyPath: \Person.name, ascending: true)
        ]
        return try context.fetch(request)
    }

    // 只获取特定属性（减少内存使用）
    func fetchProperties() throws -> [[String: Any]] {
        let request = NSFetchRequest<NSDictionary>(entityName: "Person")
        request.resultType = .dictionaryResultType
        request.propertiesToFetch = ["name", "age"]

        let results = try context.fetch(request)
        return results as! [[String: Any]]
    }

    // 分组和聚合
    func fetchGroupedByAge() throws -> [[String: Any]] {
        let request = NSFetchRequest<NSDictionary>(entityName: "Person")
        request.resultType = .dictionaryResultType

        // 分组
        let ageExpression = NSExpression(forKeyPath: "age")
        let countExpression = NSExpression(forFunction: "count:", arguments: [ageExpression])

        let countDescription = NSExpressionDescription()
        countDescription.name = "count"
        countDescription.expression = countExpression
        countDescription.expressionResultType = .integer64AttributeType

        request.propertiesToFetch = ["age", countDescription]
        request.propertiesToGroupBy = ["age"]

        let results = try context.fetch(request)
        return results as! [[String: Any]]
    }

    // 异步查询（iOS 15+）
    @available(iOS 15.0, *)
    func asyncFetch() async throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Person.name, ascending: true)]

        return try await context.perform {
            try self.context.fetch(request)
        }
    }
}
```

### 关系管理

#### 一对多关系

```swift
// 数据模型定义
// Department: 一个部门有多个员工
// Person: 一个员工属于一个部门

@objc(Department)
public class Department: NSManagedObject {
    @NSManaged public var name: String
    @NSManaged public var employees: NSSet?  // 一对多关系
}

extension Department {
    // 类型安全的访问器
    var employeeArray: [Person] {
        let set = employees as? Set<Person> ?? []
        return Array(set).sorted { $0.name < $1.name }
    }

    // 添加员工
    func addEmployee(_ person: Person) {
        let mutableSet = mutableSetValue(forKey: "employees")
        mutableSet.add(person)
    }

    // 移除员工
    func removeEmployee(_ person: Person) {
        let mutableSet = mutableSetValue(forKey: "employees")
        mutableSet.remove(person)
    }

    // 添加多个员工
    @objc(addEmployeesObject:)
    @NSManaged public func addToEmployees(_ value: Person)

    @objc(removeEmployeesObject:)
    @NSManaged public func removeFromEmployees(_ value: Person)

    @objc(addEmployees:)
    @NSManaged public func addToEmployees(_ values: NSSet)

    @objc(removeEmployees:)
    @NSManaged public func removeFromEmployees(_ values: NSSet)
}

// 使用示例
let department = Department(context: context)
department.name = "技术部"

let person1 = Person(context: context)
person1.name = "张三"
person1.department = department  // 设置关系

let person2 = Person(context: context)
person2.name = "李四"
department.addEmployee(person2)  // 另一种方式

try context.save()

// 访问关系
print("部门员工: \(department.employeeArray.map { $0.name })")
print("张三所属部门: \(person1.department?.name ?? "无")")
```

#### 多对多关系

```swift
// 数据模型定义
// Person 可以有多个 Project
// Project 可以有多个 Person

@objc(Project)
public class Project: NSManagedObject {
    @NSManaged public var name: String
    @NSManaged public var members: NSSet?  // 多对多关系
}

extension Project {
    var memberArray: [Person] {
        let set = members as? Set<Person> ?? []
        return Array(set).sorted { $0.name < $1.name }
    }

    func addMember(_ person: Person) {
        let mutableSet = mutableSetValue(forKey: "members")
        mutableSet.add(person)
    }
}

extension Person {
    @NSManaged public var projects: NSSet?  // 反向关系

    var projectArray: [Project] {
        let set = projects as? Set<Project> ?? []
        return Array(set).sorted { $0.name < $1.name }
    }
}

// 使用示例
let project = Project(context: context)
project.name = "新项目"

let developer1 = try context.fetch(Person.fetchRequest()).first!
project.addMember(developer1)

try context.save()

// 双向访问
print("项目成员: \(project.memberArray.map { $0.name })")
print("开发者参与的项目: \(developer1.projectArray.map { $0.name })")
```

#### 有序关系

```swift
// 使用 NSOrderedSet 保持顺序
@objc(Playlist)
public class Playlist: NSManagedObject {
    @NSManaged public var name: String
    @NSManaged public var songs: NSOrderedSet?  // 有序关系
}

extension Playlist {
    var songArray: [Song] {
        return songs?.array as? [Song] ?? []
    }

    func addSong(_ song: Song) {
        let mutableOrderedSet = mutableOrderedSetValue(forKey: "songs")
        mutableOrderedSet.add(song)
    }

    func insertSong(_ song: Song, at index: Int) {
        let mutableOrderedSet = mutableOrderedSetValue(forKey: "songs")
        mutableOrderedSet.insert(song, at: index)
    }

    func moveSong(from sourceIndex: Int, to destinationIndex: Int) {
        let mutableOrderedSet = mutableOrderedSetValue(forKey: "songs")
        mutableOrderedSet.moveObjects(at: IndexSet(integer: sourceIndex), to: destinationIndex)
    }
}
```

### 数据迁移

#### 轻量级迁移

轻量级迁移可以自动处理简单的模型变更：

```swift
let container = NSPersistentContainer(name: "MyApp")

// 启用自动迁移
let description = NSPersistentStoreDescription()
description.shouldMigrateStoreAutomatically = true
description.shouldInferMappingModelAutomatically = true
container.persistentStoreDescriptions = [description]

container.loadPersistentStores { _, error in
    if let error = error {
        fatalError("迁移失败: \(error)")
    }
}
```

支持的自动迁移操作：
- 添加新属性（带默认值）
- 删除属性
- 重命名属性（需要设置 Renaming ID）
- 添加新实体
- 删除实体
- 修改属性类型（某些情况）
- 添加/删除关系

#### 自定义迁移

对于复杂的模型变更，需要创建映射模型：

```swift
class MigrationManager {

    func migrateStore(at sourceURL: URL, to destinationURL: URL) throws {
        // 获取源模型
        guard let sourceModel = NSManagedObjectModel.modelVersions(at: sourceURL).first,
              let destinationModel = NSManagedObjectModel(contentsOf: Bundle.main.url(
                  forResource: "MyApp", withExtension: "momd")!) else {
            throw MigrationError.modelNotFound
        }

        // 查找或创建映射模型
        let mappingModel: NSMappingModel
        if let inferredModel = try? NSMappingModel.inferredMappingModel(
            forSourceModel: sourceModel,
            destinationModel: destinationModel) {
            mappingModel = inferredModel
        } else if let customModel = NSMappingModel(
            from: [Bundle.main],
            forSourceModel: sourceModel,
            destinationModel: destinationModel) {
            mappingModel = customModel
        } else {
            throw MigrationError.mappingModelNotFound
        }

        // 执行迁移
        let migrationManager = NSMigrationManager(
            sourceModel: sourceModel,
            destinationModel: destinationModel
        )

        try migrationManager.migrateStore(
            from: sourceURL,
            sourceType: NSSQLiteStoreType,
            options: nil,
            with: mappingModel,
            toDestinationURL: destinationURL,
            destinationType: NSSQLiteStoreType,
            destinationOptions: nil
        )
    }
}

enum MigrationError: Error {
    case modelNotFound
    case mappingModelNotFound
}
```

#### 渐进式迁移

当需要跨越多个版本迁移时：

```swift
class ProgressiveMigrationManager {

    func migrate(storeURL: URL) throws {
        let fileManager = FileManager.default
        let tempURL = storeURL.deletingLastPathComponent()
            .appendingPathComponent("Migration_\(UUID().uuidString).sqlite")

        // 获取所有模型版本
        let modelVersions = getOrderedModelVersions()

        var currentURL = storeURL

        for i in 0..<(modelVersions.count - 1) {
            let sourceModel = modelVersions[i]
            let destinationModel = modelVersions[i + 1]

            // 检查是否需要迁移这一步
            guard !isStore(at: currentURL, compatibleWith: destinationModel) else {
                continue
            }

            // 执行迁移
            let mappingModel = try getMappingModel(
                from: sourceModel,
                to: destinationModel
            )

            let migrationManager = NSMigrationManager(
                sourceModel: sourceModel,
                destinationModel: destinationModel
            )

            try migrationManager.migrateStore(
                from: currentURL,
                sourceType: NSSQLiteStoreType,
                options: nil,
                with: mappingModel,
                toDestinationURL: tempURL,
                destinationType: NSSQLiteStoreType,
                destinationOptions: nil
            )

            // 替换原文件
            try fileManager.removeItem(at: currentURL)
            try fileManager.moveItem(at: tempURL, to: currentURL)
        }
    }

    private func getOrderedModelVersions() -> [NSManagedObjectModel] {
        // 返回按顺序排列的所有模型版本
        // 需要根据实际项目实现
        return []
    }

    private func isStore(at url: URL, compatibleWith model: NSManagedObjectModel) -> Bool {
        do {
            let metadata = try NSPersistentStoreCoordinator.metadataForPersistentStore(
                ofType: NSSQLiteStoreType,
                at: url,
                options: nil
            )
            return model.isConfiguration(withName: nil, compatibleWithStoreMetadata: metadata)
        } catch {
            return false
        }
    }

    private func getMappingModel(
        from source: NSManagedObjectModel,
        to destination: NSManagedObjectModel
    ) throws -> NSMappingModel {
        if let inferred = try? NSMappingModel.inferredMappingModel(
            forSourceModel: source,
            destinationModel: destination
        ) {
            return inferred
        }

        guard let custom = NSMappingModel(
            from: [Bundle.main],
            forSourceModel: source,
            destinationModel: destination
        ) else {
            throw MigrationError.mappingModelNotFound
        }

        return custom
    }
}
```

---

## 最佳实践

### 使用后台上下文进行耗时操作

```swift
class DataService {
    let persistentContainer: NSPersistentContainer

    init(container: NSPersistentContainer) {
        self.persistentContainer = container
    }

    // 后台导入大量数据
    func importData(_ items: [DataItem], completion: @escaping (Result<Int, Error>) -> Void) {
        persistentContainer.performBackgroundTask { context in
            context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy

            var importedCount = 0

            for item in items {
                let entity = Entity(context: context)
                entity.configure(with: item)
                importedCount += 1

                // 分批保存，避免内存压力
                if importedCount % 1000 == 0 {
                    do {
                        try context.save()
                        context.reset()  // 清空上下文释放内存
                    } catch {
                        DispatchQueue.main.async {
                            completion(.failure(error))
                        }
                        return
                    }
                }
            }

            // 保存剩余数据
            do {
                if context.hasChanges {
                    try context.save()
                }
                DispatchQueue.main.async {
                    completion(.success(importedCount))
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
            }
        }
    }
}
```

### 正确处理并发

```swift
class ConcurrencyBestPractices {
    let viewContext: NSManagedObjectContext
    let backgroundContext: NSManagedObjectContext

    init(container: NSPersistentContainer) {
        self.viewContext = container.viewContext
        self.backgroundContext = container.newBackgroundContext()

        // 配置自动合并
        viewContext.automaticallyMergesChangesFromParent = true
        backgroundContext.automaticallyMergesChangesFromParent = true
    }

    // 在正确的队列上执行操作
    func safelyAccessContext() {
        // 主上下文 - 在主线程使用
        DispatchQueue.main.async {
            // 直接使用 viewContext
            let people = try? self.viewContext.fetch(Person.fetchRequest())
            // 更新 UI
        }

        // 后台上下文 - 使用 perform
        backgroundContext.perform {
            // 在后台线程安全地访问
            let request: NSFetchRequest<Person> = Person.fetchRequest()
            let people = try? self.backgroundContext.fetch(request)
            // 处理数据
        }
    }

    // 跨上下文传递对象
    func passObjectBetweenContexts(person: Person) {
        let objectID = person.objectID

        backgroundContext.perform {
            // 使用 ObjectID 在其他上下文获取对象
            guard let personInBackground = try? self.backgroundContext.existingObject(with: objectID) as? Person else {
                return
            }

            // 修改对象
            personInBackground.name = "新名字"

            try? self.backgroundContext.save()
        }
    }
}
```

### 合理使用批量操作

```swift
extension PersonRepository {
    // 批量插入（iOS 13+）
    func batchInsert(_ data: [(name: String, age: Int16)]) throws {
        let insertRequest = NSBatchInsertRequest(
            entity: Person.entity(),
            objects: data.map { ["name": $0.name, "age": $0.age, "createdAt": Date()] }
        )
        insertRequest.resultType = .count

        let result = try context.execute(insertRequest) as! NSBatchInsertResult
        print("插入了 \(result.result ?? 0) 条记录")

        // 刷新上下文
        context.refreshAllObjects()
    }

    // 批量更新
    func batchUpdate() throws {
        let updateRequest = NSBatchUpdateRequest(entityName: "Person")
        updateRequest.predicate = NSPredicate(format: "age < 18")
        updateRequest.propertiesToUpdate = ["isMinor": true]
        updateRequest.resultType = .updatedObjectIDsResultType

        let result = try context.execute(updateRequest) as! NSBatchUpdateResult
        let objectIDs = result.result as! [NSManagedObjectID]

        // 更新内存中的对象
        let changes = [NSUpdatedObjectsKey: objectIDs]
        NSManagedObjectContext.mergeChanges(fromRemoteContextSave: changes, into: [context])
    }
}
```

### 使用 NSFetchedResultsController

```swift
class PeopleViewController: UIViewController {
    var fetchedResultsController: NSFetchedResultsController<Person>!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupFetchedResultsController()
    }

    func setupFetchedResultsController() {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Person.department?.name, ascending: true),
            NSSortDescriptor(keyPath: \Person.name, ascending: true)
        ]

        // 分组
        fetchedResultsController = NSFetchedResultsController(
            fetchRequest: request,
            managedObjectContext: CoreDataStack.shared.viewContext,
            sectionNameKeyPath: "department.name",
            cacheName: "PeopleCache"
        )

        fetchedResultsController.delegate = self

        do {
            try fetchedResultsController.performFetch()
        } catch {
            print("获取失败: \(error)")
        }
    }
}

// MARK: - NSFetchedResultsControllerDelegate
extension PeopleViewController: NSFetchedResultsControllerDelegate {
    func controllerWillChangeContent(_ controller: NSFetchedResultsController<NSFetchRequestResult>) {
        tableView.beginUpdates()
    }

    func controller(_ controller: NSFetchedResultsController<NSFetchRequestResult>,
                    didChange anObject: Any,
                    at indexPath: IndexPath?,
                    for type: NSFetchedResultsChangeType,
                    newIndexPath: IndexPath?) {
        switch type {
        case .insert:
            if let newIndexPath = newIndexPath {
                tableView.insertRows(at: [newIndexPath], with: .automatic)
            }
        case .delete:
            if let indexPath = indexPath {
                tableView.deleteRows(at: [indexPath], with: .automatic)
            }
        case .update:
            if let indexPath = indexPath {
                tableView.reloadRows(at: [indexPath], with: .automatic)
            }
        case .move:
            if let indexPath = indexPath, let newIndexPath = newIndexPath {
                tableView.deleteRows(at: [indexPath], with: .automatic)
                tableView.insertRows(at: [newIndexPath], with: .automatic)
            }
        @unknown default:
            fatalError()
        }
    }

    func controllerDidChangeContent(_ controller: NSFetchedResultsController<NSFetchRequestResult>) {
        tableView.endUpdates()
    }
}
```

### SwiftUI 集成

```swift
import SwiftUI

// 环境对象注入
@main
struct MyApp: App {
    let coreDataStack = CoreDataStack.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, coreDataStack.viewContext)
        }
    }
}

// 使用 @FetchRequest
struct PeopleListView: View {
    @Environment(\.managedObjectContext) private var viewContext

    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Person.name, ascending: true)],
        predicate: NSPredicate(format: "age >= %d", 18),
        animation: .default
    )
    private var people: FetchedResults<Person>

    var body: some View {
        NavigationView {
            List {
                ForEach(people) { person in
                    PersonRow(person: person)
                }
                .onDelete(perform: deletePeople)
            }
            .navigationTitle("人员列表")
            .toolbar {
                ToolbarItem {
                    Button(action: addPerson) {
                        Image(systemName: "plus")
                    }
                }
            }
        }
    }

    private func addPerson() {
        withAnimation {
            let newPerson = Person(context: viewContext)
            newPerson.name = "新成员"
            newPerson.age = 25
            newPerson.createdAt = Date()

            do {
                try viewContext.save()
            } catch {
                print("保存失败: \(error)")
            }
        }
    }

    private func deletePeople(offsets: IndexSet) {
        withAnimation {
            offsets.map { people[$0] }.forEach(viewContext.delete)

            do {
                try viewContext.save()
            } catch {
                print("删除失败: \(error)")
            }
        }
    }
}

// 动态查询
struct DynamicFetchView: View {
    @State private var searchText = ""

    var body: some View {
        VStack {
            TextField("搜索", text: $searchText)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()

            FilteredList(filter: searchText)
        }
    }
}

struct FilteredList: View {
    @FetchRequest var people: FetchedResults<Person>

    init(filter: String) {
        let predicate: NSPredicate?
        if filter.isEmpty {
            predicate = nil
        } else {
            predicate = NSPredicate(format: "name CONTAINS[cd] %@", filter)
        }

        _people = FetchRequest(
            entity: Person.entity(),
            sortDescriptors: [NSSortDescriptor(keyPath: \Person.name, ascending: true)],
            predicate: predicate
        )
    }

    var body: some View {
        List(people) { person in
            Text(person.name)
        }
    }
}
```

---

## 常见陷阱

### 在错误的线程访问上下文

```swift
// 错误：在后台线程访问主上下文
DispatchQueue.global().async {
    let context = CoreDataStack.shared.viewContext
    let people = try? context.fetch(Person.fetchRequest())  // 崩溃！
}

// 正确：使用 perform 或 performAndWait
CoreDataStack.shared.viewContext.perform {
    let people = try? CoreDataStack.shared.viewContext.fetch(Person.fetchRequest())
}

// 或使用后台上下文
CoreDataStack.shared.persistentContainer.performBackgroundTask { context in
    let people = try? context.fetch(Person.fetchRequest())
}
```

### 跨上下文使用对象

```swift
// 错误：在其他上下文使用对象
let person = try viewContext.fetch(Person.fetchRequest()).first!

backgroundContext.perform {
    person.name = "新名字"  // 错误！person 属于 viewContext
    try? backgroundContext.save()
}

// 正确：使用 ObjectID
let objectID = person.objectID

backgroundContext.perform {
    guard let personInBackground = try? backgroundContext.existingObject(with: objectID) as? Person else {
        return
    }
    personInBackground.name = "新名字"
    try? backgroundContext.save()
}
```

### 忘记保存变更

```swift
// 错误：修改后忘记保存
let person = Person(context: context)
person.name = "张三"
// 没有调用 save()，数据不会持久化

// 正确：确保保存
let person = Person(context: context)
person.name = "张三"
do {
    try context.save()
} catch {
    print("保存失败: \(error)")
}
```

### 批量操作后不刷新上下文

```swift
// 错误：批量更新后内存中的对象未更新
let batchUpdate = NSBatchUpdateRequest(entityName: "Person")
batchUpdate.propertiesToUpdate = ["age": 30]
try context.execute(batchUpdate)
// 内存中的 Person 对象仍然是旧值

// 正确：刷新对象
let batchUpdate = NSBatchUpdateRequest(entityName: "Person")
batchUpdate.propertiesToUpdate = ["age": 30]
batchUpdate.resultType = .updatedObjectIDsResultType
let result = try context.execute(batchUpdate) as! NSBatchUpdateResult
let objectIDs = result.result as! [NSManagedObjectID]

NSManagedObjectContext.mergeChanges(
    fromRemoteContextSave: [NSUpdatedObjectsKey: objectIDs],
    into: [context]
)
```

### 循环引用导致内存泄漏

```swift
// 错误：闭包捕获 self 导致循环引用
class ViewModel {
    var fetchedResultsController: NSFetchedResultsController<Person>?

    func setup() {
        // delegate 持有 self，fetchedResultsController 持有 delegate
        fetchedResultsController?.delegate = self
    }
}

// 正确：使用 weak self 或在适当时机清理
class ViewModel {
    var fetchedResultsController: NSFetchedResultsController<Person>?

    func cleanup() {
        fetchedResultsController?.delegate = nil
    }

    deinit {
        cleanup()
    }
}
```

### 过度使用 Faulting

```swift
// 问题：大量访问导致 N+1 查询问题
let departments = try context.fetch(Department.fetchRequest())
for department in departments {
    // 每次访问 employees 都会触发一次数据库查询
    print("部门 \(department.name) 有 \(department.employees?.count ?? 0) 人")
}

// 优化：使用预取
let request: NSFetchRequest<Department> = Department.fetchRequest()
request.relationshipKeyPathsForPrefetching = ["employees"]
let departments = try context.fetch(request)
// 现在 employees 已经预加载，不会触发额外查询
```

---

## 性能考量

### 使用适当的获取策略

```swift
class PerformanceOptimization {
    let context: NSManagedObjectContext

    // 只获取需要的属性
    func fetchOnlyNames() throws -> [String] {
        let request = NSFetchRequest<NSDictionary>(entityName: "Person")
        request.resultType = .dictionaryResultType
        request.propertiesToFetch = ["name"]

        let results = try context.fetch(request)
        return results.compactMap { $0["name"] as? String }
    }

    // 使用 fetchLimit 限制结果
    func fetchTopTen() throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.fetchLimit = 10
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Person.createdAt, ascending: false)]
        return try context.fetch(request)
    }

    // 使用 fetchBatchSize 优化内存
    func fetchWithBatching() throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.fetchBatchSize = 20  // 每批加载 20 个对象
        return try context.fetch(request)
    }

    // 预取关系避免 N+1 问题
    func fetchWithPrefetching() throws -> [Department] {
        let request: NSFetchRequest<Department> = Department.fetchRequest()
        request.relationshipKeyPathsForPrefetching = ["employees", "employees.tasks"]
        return try context.fetch(request)
    }

    // 使用 countResultType 只获取计数
    func countPeople() throws -> Int {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        return try context.count(for: request)
    }
}
```

### 索引优化

在数据模型编辑器中为常用查询字段添加索引：

```swift
// 在 .xcdatamodeld 中设置 Indexed = YES
// 或通过代码设置
let nameAttribute = NSAttributeDescription()
nameAttribute.name = "name"
nameAttribute.attributeType = .stringAttributeType
nameAttribute.isIndexed = true  // 添加索引
```

### 大数据处理

```swift
class LargeDataHandler {
    let context: NSManagedObjectContext

    // 分批处理大量数据
    func processLargeDataset() throws {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.fetchBatchSize = 100

        let people = try context.fetch(request)
        var processedCount = 0

        for person in people {
            // 处理每个人
            processData(person)
            processedCount += 1

            // 定期保存并重置上下文释放内存
            if processedCount % 500 == 0 {
                try context.save()
                context.reset()
            }
        }

        // 处理剩余数据
        if context.hasChanges {
            try context.save()
        }
    }

    // 使用 NSAsynchronousFetchRequest
    func asyncFetch(completion: @escaping ([Person]) -> Void) {
        let request: NSFetchRequest<Person> = Person.fetchRequest()

        let asyncRequest = NSAsynchronousFetchRequest(fetchRequest: request) { result in
            guard let people = result.finalResult else { return }
            DispatchQueue.main.async {
                completion(people)
            }
        }

        do {
            try context.execute(asyncRequest)
        } catch {
            print("异步获取失败: \(error)")
        }
    }
}
```

### 存储类型选择

| 存储类型 | 优点 | 缺点 | 适用场景 |
|---------|------|------|---------|
| SQLite | 高效、支持大数据量 | 复杂度较高 | 大多数应用 |
| Binary | 快速读写 | 加载时全部进内存 | 小数据量 |
| In-Memory | 最快 | 不持久化 | 缓存、测试 |
| XML | 可读性好 | 性能较差 | 调试 |

```swift
// 配置不同存储类型
let description = NSPersistentStoreDescription()

// SQLite（默认）
description.type = NSSQLiteStoreType

// 内存存储（适合测试）
description.type = NSInMemoryStoreType

// 配置 SQLite 性能选项
description.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
description.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
```

---

## 实战场景

### 场景一：带搜索和筛选的列表

```swift
class SearchableListViewModel: ObservableObject {
    @Published var people: [Person] = []
    @Published var searchText = ""
    @Published var ageFilter: AgeFilter = .all

    private let context: NSManagedObjectContext
    private var fetchedResultsController: NSFetchedResultsController<Person>?

    enum AgeFilter: String, CaseIterable {
        case all = "全部"
        case young = "青年(18-30)"
        case middle = "中年(31-50)"
        case senior = "老年(51+)"

        var predicate: NSPredicate? {
            switch self {
            case .all: return nil
            case .young: return NSPredicate(format: "age >= 18 AND age <= 30")
            case .middle: return NSPredicate(format: "age >= 31 AND age <= 50")
            case .senior: return NSPredicate(format: "age >= 51")
            }
        }
    }

    init(context: NSManagedObjectContext) {
        self.context = context
        setupFetchedResultsController()
    }

    func search() {
        var predicates: [NSPredicate] = []

        // 搜索条件
        if !searchText.isEmpty {
            predicates.append(NSPredicate(format: "name CONTAINS[cd] %@", searchText))
        }

        // 年龄筛选
        if let agePredicate = ageFilter.predicate {
            predicates.append(agePredicate)
        }

        // 组合谓词
        let compoundPredicate = predicates.isEmpty ? nil :
            NSCompoundPredicate(andPredicateWithSubpredicates: predicates)

        fetchedResultsController?.fetchRequest.predicate = compoundPredicate

        do {
            try fetchedResultsController?.performFetch()
            people = fetchedResultsController?.fetchedObjects ?? []
        } catch {
            print("搜索失败: \(error)")
        }
    }

    private func setupFetchedResultsController() {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Person.name, ascending: true)]
        request.fetchBatchSize = 20

        fetchedResultsController = NSFetchedResultsController(
            fetchRequest: request,
            managedObjectContext: context,
            sectionNameKeyPath: nil,
            cacheName: nil
        )

        try? fetchedResultsController?.performFetch()
        people = fetchedResultsController?.fetchedObjects ?? []
    }
}
```

### 场景二：离线数据同步

```swift
class SyncManager {
    let localContext: NSManagedObjectContext
    let apiClient: APIClient

    init(context: NSManagedObjectContext, apiClient: APIClient) {
        self.localContext = context
        self.apiClient = apiClient
    }

    // 同步远程数据到本地
    func syncFromServer() async throws {
        // 获取远程数据
        let remoteData = try await apiClient.fetchAllPeople()

        // 在后台上下文处理
        let backgroundContext = CoreDataStack.shared.newBackgroundContext()
        backgroundContext.mergePolicy = NSMergeByPropertyStoreTrumpMergePolicy

        try await backgroundContext.perform {
            for item in remoteData {
                // 查找或创建本地对象
                let request: NSFetchRequest<Person> = Person.fetchRequest()
                request.predicate = NSPredicate(format: "remoteId == %@", item.id)

                let person: Person
                if let existing = try backgroundContext.fetch(request).first {
                    person = existing
                } else {
                    person = Person(context: backgroundContext)
                    person.remoteId = item.id
                }

                // 更新属性
                person.name = item.name
                person.age = Int16(item.age)
                person.lastSyncedAt = Date()
            }

            try backgroundContext.save()
        }
    }

    // 同步本地变更到服务器
    func syncToServer() async throws {
        // 获取未同步的对象
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.predicate = NSPredicate(format: "needsSync == YES")

        let pendingSync = try localContext.fetch(request)

        for person in pendingSync {
            do {
                // 上传到服务器
                let response = try await apiClient.updatePerson(
                    id: person.remoteId ?? "",
                    name: person.name,
                    age: Int(person.age)
                )

                // 更新本地状态
                person.remoteId = response.id
                person.needsSync = false
                person.lastSyncedAt = Date()
            } catch {
                print("同步失败: \(person.name), 错误: \(error)")
            }
        }

        try localContext.save()
    }
}
```

### 场景三：数据导入导出

```swift
class DataExporter {
    let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
    }

    // 导出为 JSON
    func exportToJSON() throws -> Data {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        let people = try context.fetch(request)

        let exportData = people.map { person -> [String: Any] in
            return [
                "name": person.name,
                "age": person.age,
                "email": person.email ?? "",
                "createdAt": ISO8601DateFormatter().string(from: person.createdAt)
            ]
        }

        return try JSONSerialization.data(withJSONObject: exportData, options: .prettyPrinted)
    }

    // 从 JSON 导入
    func importFromJSON(_ data: Data) throws -> Int {
        guard let items = try JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            throw ImportError.invalidFormat
        }

        var importedCount = 0
        let dateFormatter = ISO8601DateFormatter()

        for item in items {
            guard let name = item["name"] as? String,
                  let age = item["age"] as? Int else {
                continue
            }

            let person = Person(context: context)
            person.name = name
            person.age = Int16(age)
            person.email = item["email"] as? String

            if let dateString = item["createdAt"] as? String,
               let date = dateFormatter.date(from: dateString) {
                person.createdAt = date
            } else {
                person.createdAt = Date()
            }

            importedCount += 1
        }

        try context.save()
        return importedCount
    }
}

enum ImportError: Error {
    case invalidFormat
}
```

---

## 面试要点

### 常见面试问题

**1. Core Data 和 SQLite 有什么区别？**

Core Data 不是数据库，而是对象图管理框架。它可以使用 SQLite 作为底层存储，但也支持其他存储格式。主要区别：
- Core Data 管理对象生命周期和关系
- Core Data 提供变更跟踪和撤销功能
- Core Data 有 Faulting 机制优化内存
- SQLite 是纯粹的关系数据库

**2. 什么是 Faulting？它有什么作用？**

Faulting 是 Core Data 的内存优化机制。当获取对象时，Core Data 可能只创建一个占位符（fault），只有在访问属性时才真正从存储加载数据。这减少了内存使用和初始加载时间。

**3. 如何解决 Core Data 的并发问题？**

- 使用 `perform` 或 `performAndWait` 在正确的队列执行操作
- 使用 `NSManagedObjectID` 跨上下文传递对象引用
- 配置 `automaticallyMergesChangesFromParent`
- 使用适当的合并策略（Merge Policy）

**4. NSFetchedResultsController 的作用是什么？**

NSFetchedResultsController 用于监听数据变化并自动更新 UI。它特别适合与 UITableView/UICollectionView 配合使用，可以：
- 自动监听数据变化
- 提供分组（Section）支持
- 缓存查询结果

**5. Core Data 迁移有哪些类型？**

- 轻量级迁移：自动处理简单的模型变更
- 自定义迁移：使用映射模型处理复杂变更
- 渐进式迁移：逐版本迁移，处理跨多版本升级

**6. 如何优化 Core Data 性能？**

- 使用适当的 fetchBatchSize
- 预取关系避免 N+1 问题
- 使用批量操作处理大量数据
- 为常用查询字段添加索引
- 在后台上下文处理耗时操作
- 合理使用 Faulting

---

## 延伸阅读

### 官方资源

- [Core Data Programming Guide](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CoreData/index.html)
- [Core Data Framework Reference](https://developer.apple.com/documentation/coredata)
- [WWDC Core Data 相关视频](https://developer.apple.com/videos/frameworks/core-data)

### 推荐书籍

- 《Core Data by Tutorials》- raywenderlich.com
- 《Core Data》- Marcus Zarra
- 《Pro Core Data for iOS》- Michael Privat, Robert Warner

### 相关框架

- **SwiftData**：iOS 17+ 新一代数据持久化框架，基于 Swift 宏
- **Realm**：跨平台移动数据库替代方案
- **GRDB**：基于 SQLite 的 Swift 数据库库
- **CloudKit**：与 Core Data 集成的云同步解决方案

### 进阶主题

- Core Data + CloudKit 同步
- Core Data 与 Widget 共享数据
- Core Data 性能分析与调优
- 自定义 Transformable 类型
- 使用 Persistent History Tracking

---

## 总结

Core Data 是 iOS/macOS 开发中强大的数据持久化框架。通过本文，你应该掌握了：

1. **核心概念**：理解 Core Data Stack 的各个组件及其作用
2. **数据模型**：设计实体、属性和关系
3. **CRUD 操作**：创建、读取、更新、删除数据
4. **NSFetchRequest**：灵活的查询机制
5. **关系管理**：一对一、一对多、多对多关系
6. **数据迁移**：轻量级和自定义迁移
7. **并发处理**：正确处理多线程场景
8. **性能优化**：Faulting、批量操作、索引等
9. **SwiftUI 集成**：@FetchRequest 和环境对象

记住：Core Data 不仅仅是数据库，它是一个完整的对象生命周期管理解决方案。合理利用其特性，可以大大简化数据层的开发工作。
