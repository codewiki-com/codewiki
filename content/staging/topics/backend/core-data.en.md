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
origin: old/src/content/docs/swift/core-data.en.md
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

Core Data is a powerful object graph and persistence framework provided by Apple for managing model layer objects in applications. It is not just a database, but a complete object lifecycle management solution that provides object persistence, undo/redo, data validation, change tracking, and more.

## Concept Explanation

### What is Core Data

Core Data is a framework for managing model layer objects in applications. It provides the following core features:

- **Persistence**: Save object data to disk (SQLite, XML, Binary, or Memory)
- **Object Graph Management**: Manage relationships and dependencies between objects
- **Change Tracking**: Automatically track object modifications
- **Undo/Redo**: Built-in undo manager support
- **Memory Optimization**: Lazy loading and Faulting mechanisms to reduce memory usage
- **Data Validation**: Built-in data validation mechanisms

### Difference Between Core Data and Databases

Many developers mistakenly think Core Data is a database, but they are fundamentally different:

| Feature | Core Data | Traditional Database |
|---------|-----------|---------------------|
| Core Concept | Object Graph Management | Tables and Records |
| Query Method | Object Properties | SQL Statements |
| Relationship Management | Automatic Handling | Manual Foreign Key Management |
| Data Storage | Optional (SQLite/XML/Binary/Memory) | Fixed Format |
| Primary Use | Object Persistence and Management | Data Storage and Querying |

### Core Components Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │ NSManagedObject │    │ NSManagedObjectContext       │   │
│  │ (Managed Object)│◄──►│ (Managed Object Context)     │   │
│  └─────────────────┘    └──────────────────────────────┘   │
│           │                          │                      │
│           ▼                          ▼                      │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │ NSEntityDescrip-│    │ NSPersistentStoreCoordinator │   │
│  │     tion        │◄──►│ (Persistent Store            │   │
│  │(Entity Descript)│    │        Coordinator)          │   │
│  └─────────────────┘    └──────────────────────────────┘   │
│           │                          │                      │
│           │                          ▼                      │
│           │             ┌──────────────────────────────┐   │
│           │             │   NSPersistentStore          │   │
│           ▼             │   (Persistent Store)         │   │
│  ┌─────────────────┐    └──────────────────────────────┘   │
│  │ NSManagedObject │                 │                      │
│  │     Model       │                 ▼                      │
│  │(Managed Object  │    ┌──────────────────────────────┐   │
│  │     Model)      │    │     SQLite/XML/Binary        │   │
│  └─────────────────┘    │        (Store File)          │   │
│                         └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Principles

### Core Data Stack

The Core Data Stack is the core of the Core Data architecture, consisting of the following components:

#### NSManagedObjectModel

The managed object model defines the application's data structure, including Entities, Attributes, and Relationships.

```swift
// Load data model
let modelURL = Bundle.main.url(forResource: "MyApp", withExtension: "momd")!
let managedObjectModel = NSManagedObjectModel(contentsOf: modelURL)!

// Or load by name
let model = NSManagedObjectModel.mergedModel(from: [Bundle.main])!
```

#### NSPersistentStoreCoordinator

The persistent store coordinator is responsible for coordinating the relationship between the model and storage, managing one or more persistent stores.

```swift
let coordinator = NSPersistentStoreCoordinator(managedObjectModel: model)

// Add SQLite store
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
    fatalError("Unable to add persistent store: \(error)")
}
```

#### NSManagedObjectContext

The managed object context is the main interface for application interaction with Core Data, responsible for managing the lifecycle of managed objects.

```swift
let context = NSManagedObjectContext(concurrencyType: .mainQueueConcurrencyType)
context.persistentStoreCoordinator = coordinator

// Or use NSPersistentContainer (recommended)
```

#### NSPersistentContainer

NSPersistentContainer, introduced in iOS 10+, simplifies Core Data Stack creation:

```swift
class CoreDataStack {
    static let shared = CoreDataStack()

    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "MyApp")

        container.loadPersistentStores { storeDescription, error in
            if let error = error as NSError? {
                fatalError("Unable to load persistent stores: \(error), \(error.userInfo)")
            }

            // Configuration options
            storeDescription.shouldMigrateStoreAutomatically = true
            storeDescription.shouldInferMappingModelAutomatically = true
        }

        // Configure context
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
                print("Save failed: \(nsError), \(nsError.userInfo)")
            }
        }
    }
}
```

### Faulting Mechanism

Core Data uses the Faulting mechanism to optimize memory usage. When fetching objects, Core Data may only create a "fault" object, and only loads the data when its properties are accessed.

```swift
// Fetched object may be in fault state
let person = try context.existingObject(with: objectID) as! Person

// Check if it's a fault
if person.isFault {
    print("Object not fully loaded yet")
}

// Accessing properties triggers fault fulfillment
print(person.name)  // Data is loaded from storage at this point

// Force fault fulfillment
context.refresh(person, mergeChanges: true)
```

### Change Tracking

Core Data automatically tracks changes to managed objects:

```swift
// Check if context has changes
if context.hasChanges {
    print("There are unsaved changes")
}

// Get inserted, updated, and deleted objects
let insertedObjects = context.insertedObjects
let updatedObjects = context.updatedObjects
let deletedObjects = context.deletedObjects

// Check changes on a single object
if person.hasChanges {
    let changedValues = person.changedValues()
    for (key, value) in changedValues {
        print("Property \(key) changed to \(value)")
    }
}

// Rollback changes for a single object
context.refresh(person, mergeChanges: false)

// Rollback all changes
context.rollback()
```

---

## Key Points

### Data Model Design

#### Creating Entities

Create entities in Xcode's Data Model Editor, or define through code:

```swift
// Code-based entity description creation (typically use .xcdatamodeld file)
let personEntity = NSEntityDescription()
personEntity.name = "Person"
personEntity.managedObjectClassName = "Person"

// Add attributes
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

#### Attribute Types

Core Data supports various attribute types:

| Type | Swift Type | Description |
|------|-----------|-------------|
| Integer 16/32/64 | Int16/Int32/Int64 | Integer types |
| Decimal | NSDecimalNumber | Precise decimal |
| Double | Double | Double precision float |
| Float | Float | Single precision float |
| String | String | String |
| Boolean | Bool | Boolean value |
| Date | Date | Date and time |
| Binary Data | Data | Binary data |
| UUID | UUID | Unique identifier |
| URI | URL | Uniform resource identifier |
| Transformable | Any | Transformable type |

### NSManagedObject Subclasses

#### Auto-generation vs Manual Definition

Xcode can automatically generate NSManagedObject subclasses. Set Codegen in Data Model Inspector:

- **Manual/None**: Fully manual creation
- **Class Definition**: Automatically generate class definition
- **Category/Extension**: Only generate extensions

```swift
// Manually define NSManagedObject subclass
@objc(Person)
public class Person: NSManagedObject {
    @NSManaged public var name: String
    @NSManaged public var age: Int16
    @NSManaged public var email: String?
    @NSManaged public var createdAt: Date
    @NSManaged public var department: Department?
    @NSManaged public var tasks: NSSet?
}

// Extension for convenience methods
extension Person {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Person> {
        return NSFetchRequest<Person>(entityName: "Person")
    }

    // Computed property
    var displayName: String {
        return "\(name) (\(age) years old)"
    }

    // Convenience initializer
    convenience init(name: String, age: Int16, context: NSManagedObjectContext) {
        let entity = NSEntityDescription.entity(forEntityName: "Person", in: context)!
        self.init(entity: entity, insertInto: context)
        self.name = name
        self.age = age
        self.createdAt = Date()
    }
}
```

#### @NSManaged Property Wrapper

`@NSManaged` tells the compiler that these properties are provided by Core Data at runtime:

```swift
@objc(Task)
public class Task: NSManagedObject {
    @NSManaged public var title: String
    @NSManaged public var isCompleted: Bool
    @NSManaged public var dueDate: Date?
    @NSManaged public var priority: Int16
    @NSManaged public var assignee: Person?

    // Override accessor for custom logic
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

## Code Examples

### CRUD Operations

#### Create Objects

```swift
class PersonRepository {
    let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
    }

    // Create single object
    func createPerson(name: String, age: Int16, email: String?) -> Person {
        let person = Person(context: context)
        person.name = name
        person.age = age
        person.email = email
        person.createdAt = Date()
        return person
    }

    // Batch create
    func createPeople(_ data: [(name: String, age: Int16)]) -> [Person] {
        return data.map { item in
            let person = Person(context: context)
            person.name = item.name
            person.age = item.age
            person.createdAt = Date()
            return person
        }
    }

    // Save changes
    func save() throws {
        if context.hasChanges {
            try context.save()
        }
    }
}

// Usage example
let repository = PersonRepository(context: CoreDataStack.shared.viewContext)
let person = repository.createPerson(name: "John Smith", age: 25, email: "john@example.com")

do {
    try repository.save()
    print("Created successfully, ID: \(person.objectID)")
} catch {
    print("Save failed: \(error)")
}
```

#### Read Objects

```swift
extension PersonRepository {
    // Fetch all people
    func fetchAll() throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Person.name, ascending: true)]
        return try context.fetch(request)
    }

    // Fetch with conditions
    func fetchPeople(minAge: Int16, maxAge: Int16) throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.predicate = NSPredicate(format: "age >= %d AND age <= %d", minAge, maxAge)
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Person.age, ascending: true)]
        return try context.fetch(request)
    }

    // Search by name
    func searchByName(_ keyword: String) throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.predicate = NSPredicate(format: "name CONTAINS[cd] %@", keyword)
        return try context.fetch(request)
    }

    // Paginated fetch
    func fetchPaged(page: Int, pageSize: Int) throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.fetchOffset = page * pageSize
        request.fetchLimit = pageSize
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Person.createdAt, ascending: false)]
        return try context.fetch(request)
    }

    // Get count only
    func count() throws -> Int {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        return try context.count(for: request)
    }

    // Fetch by ObjectID
    func fetchById(_ objectID: NSManagedObjectID) throws -> Person? {
        return try context.existingObject(with: objectID) as? Person
    }
}
```

#### Update Objects

```swift
extension PersonRepository {
    // Update single object
    func updatePerson(_ person: Person, name: String? = nil, age: Int16? = nil) {
        if let name = name {
            person.name = name
        }
        if let age = age {
            person.age = age
        }
    }

    // Batch update (iOS 13+)
    func updateAllAges(increment: Int16) throws -> Int {
        let batchUpdate = NSBatchUpdateRequest(entityName: "Person")
        batchUpdate.propertiesToUpdate = ["age": NSExpression(format: "age + %d", increment)]
        batchUpdate.resultType = .updatedObjectsCountResultType

        let result = try context.execute(batchUpdate) as! NSBatchUpdateResult
        let count = result.result as! Int

        // Refresh objects in context
        context.refreshAllObjects()

        return count
    }

    // Batch update with condition
    func markAsAdult() throws -> Int {
        let batchUpdate = NSBatchUpdateRequest(entityName: "Person")
        batchUpdate.predicate = NSPredicate(format: "age >= 18")
        batchUpdate.propertiesToUpdate = ["isAdult": true]
        batchUpdate.resultType = .updatedObjectsCountResultType

        let result = try context.execute(batchUpdate) as! NSBatchUpdateResult
        return result.result as! Int
    }
}

// Usage example
let people = try repository.fetchAll()
if let person = people.first {
    repository.updatePerson(person, name: "Jane Doe", age: 30)
    try repository.save()
}
```

#### Delete Objects

```swift
extension PersonRepository {
    // Delete single object
    func delete(_ person: Person) {
        context.delete(person)
    }

    // Delete multiple objects
    func deleteAll(_ people: [Person]) {
        people.forEach { context.delete($0) }
    }

    // Batch delete (better performance)
    func batchDelete(olderThan date: Date) throws -> Int {
        let request = NSFetchRequest<NSFetchRequestResult>(entityName: "Person")
        request.predicate = NSPredicate(format: "createdAt < %@", date as NSDate)

        let batchDelete = NSBatchDeleteRequest(fetchRequest: request)
        batchDelete.resultType = .resultTypeCount

        let result = try context.execute(batchDelete) as! NSBatchDeleteResult
        let count = result.result as! Int

        // Refresh context
        context.refreshAllObjects()

        return count
    }

    // Delete all data
    func deleteAllPeople() throws {
        let request = NSFetchRequest<NSFetchRequestResult>(entityName: "Person")
        let batchDelete = NSBatchDeleteRequest(fetchRequest: request)
        try context.execute(batchDelete)
        context.refreshAllObjects()
    }
}
```

### NSFetchRequest Detailed

```swift
class FetchRequestExamples {
    let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
    }

    // Basic fetch
    func basicFetch() throws -> [Person] {
        let request = NSFetchRequest<Person>(entityName: "Person")
        return try context.fetch(request)
    }

    // Complex predicate
    func complexPredicate() throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()

        // Combined conditions
        let agePredicate = NSPredicate(format: "age >= %d", 18)
        let namePredicate = NSPredicate(format: "name BEGINSWITH %@", "J")
        let emailPredicate = NSPredicate(format: "email != nil")

        request.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [
            agePredicate,
            namePredicate,
            emailPredicate
        ])

        return try context.fetch(request)
    }

    // Common predicate syntax
    func predicateExamples() {
        // Equals
        _ = NSPredicate(format: "name == %@", "John")

        // Not equals
        _ = NSPredicate(format: "age != %d", 0)

        // Comparison
        _ = NSPredicate(format: "age > %d AND age < %d", 18, 60)

        // Contains (case sensitive)
        _ = NSPredicate(format: "name CONTAINS %@", "John")

        // Contains (case and diacritic insensitive)
        _ = NSPredicate(format: "name CONTAINS[cd] %@", "john")

        // Begins/Ends with
        _ = NSPredicate(format: "name BEGINSWITH %@", "J")
        _ = NSPredicate(format: "email ENDSWITH %@", "@example.com")

        // Regular expression
        _ = NSPredicate(format: "email MATCHES %@", "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}")

        // IN operation
        _ = NSPredicate(format: "name IN %@", ["John", "Jane", "Bob"])

        // BETWEEN
        _ = NSPredicate(format: "age BETWEEN %@", [18, 60])

        // NULL check
        _ = NSPredicate(format: "email == nil")
        _ = NSPredicate(format: "email != nil")

        // Relationship queries
        _ = NSPredicate(format: "department.name == %@", "Engineering")
        _ = NSPredicate(format: "ANY tasks.isCompleted == YES")
        _ = NSPredicate(format: "ALL tasks.isCompleted == YES")
        _ = NSPredicate(format: "tasks.@count > %d", 5)
    }

    // Sorting
    func sortedFetch() throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Person.age, ascending: false),
            NSSortDescriptor(keyPath: \Person.name, ascending: true)
        ]
        return try context.fetch(request)
    }

    // Fetch only specific properties (reduce memory usage)
    func fetchProperties() throws -> [[String: Any]] {
        let request = NSFetchRequest<NSDictionary>(entityName: "Person")
        request.resultType = .dictionaryResultType
        request.propertiesToFetch = ["name", "age"]

        let results = try context.fetch(request)
        return results as! [[String: Any]]
    }

    // Grouping and aggregation
    func fetchGroupedByAge() throws -> [[String: Any]] {
        let request = NSFetchRequest<NSDictionary>(entityName: "Person")
        request.resultType = .dictionaryResultType

        // Grouping
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

    // Async fetch (iOS 15+)
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

### Relationship Management

#### One-to-Many Relationships

```swift
// Data model definition
// Department: One department has many employees
// Person: One employee belongs to one department

@objc(Department)
public class Department: NSManagedObject {
    @NSManaged public var name: String
    @NSManaged public var employees: NSSet?  // One-to-many relationship
}

extension Department {
    // Type-safe accessor
    var employeeArray: [Person] {
        let set = employees as? Set<Person> ?? []
        return Array(set).sorted { $0.name < $1.name }
    }

    // Add employee
    func addEmployee(_ person: Person) {
        let mutableSet = mutableSetValue(forKey: "employees")
        mutableSet.add(person)
    }

    // Remove employee
    func removeEmployee(_ person: Person) {
        let mutableSet = mutableSetValue(forKey: "employees")
        mutableSet.remove(person)
    }

    // Add multiple employees
    @objc(addEmployeesObject:)
    @NSManaged public func addToEmployees(_ value: Person)

    @objc(removeEmployeesObject:)
    @NSManaged public func removeFromEmployees(_ value: Person)

    @objc(addEmployees:)
    @NSManaged public func addToEmployees(_ values: NSSet)

    @objc(removeEmployees:)
    @NSManaged public func removeFromEmployees(_ values: NSSet)
}

// Usage example
let department = Department(context: context)
department.name = "Engineering"

let person1 = Person(context: context)
person1.name = "John"
person1.department = department  // Set relationship

let person2 = Person(context: context)
person2.name = "Jane"
department.addEmployee(person2)  // Alternative method

try context.save()

// Access relationships
print("Department employees: \(department.employeeArray.map { $0.name })")
print("John's department: \(person1.department?.name ?? "None")")
```

#### Many-to-Many Relationships

```swift
// Data model definition
// Person can have multiple Projects
// Project can have multiple Persons

@objc(Project)
public class Project: NSManagedObject {
    @NSManaged public var name: String
    @NSManaged public var members: NSSet?  // Many-to-many relationship
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
    @NSManaged public var projects: NSSet?  // Inverse relationship

    var projectArray: [Project] {
        let set = projects as? Set<Project> ?? []
        return Array(set).sorted { $0.name < $1.name }
    }
}

// Usage example
let project = Project(context: context)
project.name = "New Project"

let developer1 = try context.fetch(Person.fetchRequest()).first!
project.addMember(developer1)

try context.save()

// Bidirectional access
print("Project members: \(project.memberArray.map { $0.name })")
print("Developer's projects: \(developer1.projectArray.map { $0.name })")
```

#### Ordered Relationships

```swift
// Use NSOrderedSet to maintain order
@objc(Playlist)
public class Playlist: NSManagedObject {
    @NSManaged public var name: String
    @NSManaged public var songs: NSOrderedSet?  // Ordered relationship
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

### Data Migration

#### Lightweight Migration

Lightweight migration can automatically handle simple model changes:

```swift
let container = NSPersistentContainer(name: "MyApp")

// Enable automatic migration
let description = NSPersistentStoreDescription()
description.shouldMigrateStoreAutomatically = true
description.shouldInferMappingModelAutomatically = true
container.persistentStoreDescriptions = [description]

container.loadPersistentStores { _, error in
    if let error = error {
        fatalError("Migration failed: \(error)")
    }
}
```

Supported automatic migration operations:
- Add new attributes (with default values)
- Delete attributes
- Rename attributes (requires setting Renaming ID)
- Add new entities
- Delete entities
- Modify attribute types (in some cases)
- Add/Delete relationships

#### Custom Migration

For complex model changes, you need to create mapping models:

```swift
class MigrationManager {

    func migrateStore(at sourceURL: URL, to destinationURL: URL) throws {
        // Get source model
        guard let sourceModel = NSManagedObjectModel.modelVersions(at: sourceURL).first,
              let destinationModel = NSManagedObjectModel(contentsOf: Bundle.main.url(
                  forResource: "MyApp", withExtension: "momd")!) else {
            throw MigrationError.modelNotFound
        }

        // Find or create mapping model
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

        // Execute migration
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

#### Progressive Migration

When migrating across multiple versions:

```swift
class ProgressiveMigrationManager {

    func migrate(storeURL: URL) throws {
        let fileManager = FileManager.default
        let tempURL = storeURL.deletingLastPathComponent()
            .appendingPathComponent("Migration_\(UUID().uuidString).sqlite")

        // Get all model versions
        let modelVersions = getOrderedModelVersions()

        var currentURL = storeURL

        for i in 0..<(modelVersions.count - 1) {
            let sourceModel = modelVersions[i]
            let destinationModel = modelVersions[i + 1]

            // Check if this step needs migration
            guard !isStore(at: currentURL, compatibleWith: destinationModel) else {
                continue
            }

            // Execute migration
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

            // Replace original file
            try fileManager.removeItem(at: currentURL)
            try fileManager.moveItem(at: tempURL, to: currentURL)
        }
    }

    private func getOrderedModelVersions() -> [NSManagedObjectModel] {
        // Return all model versions in order
        // Implement according to your project
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

## Best Practices

### Use Background Context for Time-Consuming Operations

```swift
class DataService {
    let persistentContainer: NSPersistentContainer

    init(container: NSPersistentContainer) {
        self.persistentContainer = container
    }

    // Import large data in background
    func importData(_ items: [DataItem], completion: @escaping (Result<Int, Error>) -> Void) {
        persistentContainer.performBackgroundTask { context in
            context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy

            var importedCount = 0

            for item in items {
                let entity = Entity(context: context)
                entity.configure(with: item)
                importedCount += 1

                // Batch save to avoid memory pressure
                if importedCount % 1000 == 0 {
                    do {
                        try context.save()
                        context.reset()  // Clear context to release memory
                    } catch {
                        DispatchQueue.main.async {
                            completion(.failure(error))
                        }
                        return
                    }
                }
            }

            // Save remaining data
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

### Handle Concurrency Correctly

```swift
class ConcurrencyBestPractices {
    let viewContext: NSManagedObjectContext
    let backgroundContext: NSManagedObjectContext

    init(container: NSPersistentContainer) {
        self.viewContext = container.viewContext
        self.backgroundContext = container.newBackgroundContext()

        // Configure auto-merge
        viewContext.automaticallyMergesChangesFromParent = true
        backgroundContext.automaticallyMergesChangesFromParent = true
    }

    // Execute operations on the correct queue
    func safelyAccessContext() {
        // Main context - use on main thread
        DispatchQueue.main.async {
            // Use viewContext directly
            let people = try? self.viewContext.fetch(Person.fetchRequest())
            // Update UI
        }

        // Background context - use perform
        backgroundContext.perform {
            // Safely access on background thread
            let request: NSFetchRequest<Person> = Person.fetchRequest()
            let people = try? self.backgroundContext.fetch(request)
            // Process data
        }
    }

    // Pass objects between contexts
    func passObjectBetweenContexts(person: Person) {
        let objectID = person.objectID

        backgroundContext.perform {
            // Use ObjectID to get object in another context
            guard let personInBackground = try? self.backgroundContext.existingObject(with: objectID) as? Person else {
                return
            }

            // Modify object
            personInBackground.name = "New Name"

            try? self.backgroundContext.save()
        }
    }
}
```

### Use Batch Operations Wisely

```swift
extension PersonRepository {
    // Batch insert (iOS 13+)
    func batchInsert(_ data: [(name: String, age: Int16)]) throws {
        let insertRequest = NSBatchInsertRequest(
            entity: Person.entity(),
            objects: data.map { ["name": $0.name, "age": $0.age, "createdAt": Date()] }
        )
        insertRequest.resultType = .count

        let result = try context.execute(insertRequest) as! NSBatchInsertResult
        print("Inserted \(result.result ?? 0) records")

        // Refresh context
        context.refreshAllObjects()
    }

    // Batch update
    func batchUpdate() throws {
        let updateRequest = NSBatchUpdateRequest(entityName: "Person")
        updateRequest.predicate = NSPredicate(format: "age < 18")
        updateRequest.propertiesToUpdate = ["isMinor": true]
        updateRequest.resultType = .updatedObjectIDsResultType

        let result = try context.execute(updateRequest) as! NSBatchUpdateResult
        let objectIDs = result.result as! [NSManagedObjectID]

        // Update objects in memory
        let changes = [NSUpdatedObjectsKey: objectIDs]
        NSManagedObjectContext.mergeChanges(fromRemoteContextSave: changes, into: [context])
    }
}
```

### Use NSFetchedResultsController

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

        // Sectioning
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
            print("Fetch failed: \(error)")
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

### SwiftUI Integration

```swift
import SwiftUI

// Environment object injection
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

// Using @FetchRequest
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
            .navigationTitle("People List")
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
            newPerson.name = "New Member"
            newPerson.age = 25
            newPerson.createdAt = Date()

            do {
                try viewContext.save()
            } catch {
                print("Save failed: \(error)")
            }
        }
    }

    private func deletePeople(offsets: IndexSet) {
        withAnimation {
            offsets.map { people[$0] }.forEach(viewContext.delete)

            do {
                try viewContext.save()
            } catch {
                print("Delete failed: \(error)")
            }
        }
    }
}

// Dynamic query
struct DynamicFetchView: View {
    @State private var searchText = ""

    var body: some View {
        VStack {
            TextField("Search", text: $searchText)
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

## Common Pitfalls

### Accessing Context on Wrong Thread

```swift
// Wrong: Accessing main context on background thread
DispatchQueue.global().async {
    let context = CoreDataStack.shared.viewContext
    let people = try? context.fetch(Person.fetchRequest())  // Crash!
}

// Correct: Use perform or performAndWait
CoreDataStack.shared.viewContext.perform {
    let people = try? CoreDataStack.shared.viewContext.fetch(Person.fetchRequest())
}

// Or use background context
CoreDataStack.shared.persistentContainer.performBackgroundTask { context in
    let people = try? context.fetch(Person.fetchRequest())
}
```

### Using Objects Across Contexts

```swift
// Wrong: Using object in another context
let person = try viewContext.fetch(Person.fetchRequest()).first!

backgroundContext.perform {
    person.name = "New Name"  // Wrong! person belongs to viewContext
    try? backgroundContext.save()
}

// Correct: Use ObjectID
let objectID = person.objectID

backgroundContext.perform {
    guard let personInBackground = try? backgroundContext.existingObject(with: objectID) as? Person else {
        return
    }
    personInBackground.name = "New Name"
    try? backgroundContext.save()
}
```

### Forgetting to Save Changes

```swift
// Wrong: Forgetting to save after modification
let person = Person(context: context)
person.name = "John"
// Didn't call save(), data won't persist

// Correct: Make sure to save
let person = Person(context: context)
person.name = "John"
do {
    try context.save()
} catch {
    print("Save failed: \(error)")
}
```

### Not Refreshing Context After Batch Operations

```swift
// Wrong: Objects in memory not updated after batch update
let batchUpdate = NSBatchUpdateRequest(entityName: "Person")
batchUpdate.propertiesToUpdate = ["age": 30]
try context.execute(batchUpdate)
// Person objects in memory still have old values

// Correct: Refresh objects
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

### Retain Cycles Causing Memory Leaks

```swift
// Wrong: Closure capturing self causes retain cycle
class ViewModel {
    var fetchedResultsController: NSFetchedResultsController<Person>?

    func setup() {
        // delegate holds self, fetchedResultsController holds delegate
        fetchedResultsController?.delegate = self
    }
}

// Correct: Use weak self or clean up at appropriate time
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

### Overusing Faulting

```swift
// Problem: Multiple accesses cause N+1 query problem
let departments = try context.fetch(Department.fetchRequest())
for department in departments {
    // Each access to employees triggers a database query
    print("Department \(department.name) has \(department.employees?.count ?? 0) people")
}

// Optimization: Use prefetching
let request: NSFetchRequest<Department> = Department.fetchRequest()
request.relationshipKeyPathsForPrefetching = ["employees"]
let departments = try context.fetch(request)
// Now employees are preloaded, no additional queries triggered
```

---

## Performance Considerations

### Use Appropriate Fetch Strategies

```swift
class PerformanceOptimization {
    let context: NSManagedObjectContext

    // Fetch only needed properties
    func fetchOnlyNames() throws -> [String] {
        let request = NSFetchRequest<NSDictionary>(entityName: "Person")
        request.resultType = .dictionaryResultType
        request.propertiesToFetch = ["name"]

        let results = try context.fetch(request)
        return results.compactMap { $0["name"] as? String }
    }

    // Use fetchLimit to limit results
    func fetchTopTen() throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.fetchLimit = 10
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Person.createdAt, ascending: false)]
        return try context.fetch(request)
    }

    // Use fetchBatchSize to optimize memory
    func fetchWithBatching() throws -> [Person] {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.fetchBatchSize = 20  // Load 20 objects per batch
        return try context.fetch(request)
    }

    // Prefetch relationships to avoid N+1 problem
    func fetchWithPrefetching() throws -> [Department] {
        let request: NSFetchRequest<Department> = Department.fetchRequest()
        request.relationshipKeyPathsForPrefetching = ["employees", "employees.tasks"]
        return try context.fetch(request)
    }

    // Use countResultType to get count only
    func countPeople() throws -> Int {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        return try context.count(for: request)
    }
}
```

### Index Optimization

Add indexes for frequently queried fields in the data model editor:

```swift
// Set Indexed = YES in .xcdatamodeld
// Or set via code
let nameAttribute = NSAttributeDescription()
nameAttribute.name = "name"
nameAttribute.attributeType = .stringAttributeType
nameAttribute.isIndexed = true  // Add index
```

### Large Data Handling

```swift
class LargeDataHandler {
    let context: NSManagedObjectContext

    // Process large datasets in batches
    func processLargeDataset() throws {
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.fetchBatchSize = 100

        let people = try context.fetch(request)
        var processedCount = 0

        for person in people {
            // Process each person
            processData(person)
            processedCount += 1

            // Periodically save and reset context to release memory
            if processedCount % 500 == 0 {
                try context.save()
                context.reset()
            }
        }

        // Process remaining data
        if context.hasChanges {
            try context.save()
        }
    }

    // Use NSAsynchronousFetchRequest
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
            print("Async fetch failed: \(error)")
        }
    }
}
```

### Storage Type Selection

| Storage Type | Pros | Cons | Use Case |
|--------------|------|------|----------|
| SQLite | Efficient, supports large data | More complex | Most applications |
| Binary | Fast read/write | Loads entirely into memory | Small data |
| In-Memory | Fastest | Not persistent | Cache, testing |
| XML | Human readable | Poor performance | Debugging |

```swift
// Configure different storage types
let description = NSPersistentStoreDescription()

// SQLite (default)
description.type = NSSQLiteStoreType

// In-memory store (good for testing)
description.type = NSInMemoryStoreType

// Configure SQLite performance options
description.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
description.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
```

---

## Real-World Scenarios

### Scenario 1: List with Search and Filtering

```swift
class SearchableListViewModel: ObservableObject {
    @Published var people: [Person] = []
    @Published var searchText = ""
    @Published var ageFilter: AgeFilter = .all

    private let context: NSManagedObjectContext
    private var fetchedResultsController: NSFetchedResultsController<Person>?

    enum AgeFilter: String, CaseIterable {
        case all = "All"
        case young = "Young (18-30)"
        case middle = "Middle-aged (31-50)"
        case senior = "Senior (51+)"

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

        // Search condition
        if !searchText.isEmpty {
            predicates.append(NSPredicate(format: "name CONTAINS[cd] %@", searchText))
        }

        // Age filter
        if let agePredicate = ageFilter.predicate {
            predicates.append(agePredicate)
        }

        // Combine predicates
        let compoundPredicate = predicates.isEmpty ? nil :
            NSCompoundPredicate(andPredicateWithSubpredicates: predicates)

        fetchedResultsController?.fetchRequest.predicate = compoundPredicate

        do {
            try fetchedResultsController?.performFetch()
            people = fetchedResultsController?.fetchedObjects ?? []
        } catch {
            print("Search failed: \(error)")
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

### Scenario 2: Offline Data Synchronization

```swift
class SyncManager {
    let localContext: NSManagedObjectContext
    let apiClient: APIClient

    init(context: NSManagedObjectContext, apiClient: APIClient) {
        self.localContext = context
        self.apiClient = apiClient
    }

    // Sync remote data to local
    func syncFromServer() async throws {
        // Fetch remote data
        let remoteData = try await apiClient.fetchAllPeople()

        // Process in background context
        let backgroundContext = CoreDataStack.shared.newBackgroundContext()
        backgroundContext.mergePolicy = NSMergeByPropertyStoreTrumpMergePolicy

        try await backgroundContext.perform {
            for item in remoteData {
                // Find or create local object
                let request: NSFetchRequest<Person> = Person.fetchRequest()
                request.predicate = NSPredicate(format: "remoteId == %@", item.id)

                let person: Person
                if let existing = try backgroundContext.fetch(request).first {
                    person = existing
                } else {
                    person = Person(context: backgroundContext)
                    person.remoteId = item.id
                }

                // Update properties
                person.name = item.name
                person.age = Int16(item.age)
                person.lastSyncedAt = Date()
            }

            try backgroundContext.save()
        }
    }

    // Sync local changes to server
    func syncToServer() async throws {
        // Get unsynced objects
        let request: NSFetchRequest<Person> = Person.fetchRequest()
        request.predicate = NSPredicate(format: "needsSync == YES")

        let pendingSync = try localContext.fetch(request)

        for person in pendingSync {
            do {
                // Upload to server
                let response = try await apiClient.updatePerson(
                    id: person.remoteId ?? "",
                    name: person.name,
                    age: Int(person.age)
                )

                // Update local state
                person.remoteId = response.id
                person.needsSync = false
                person.lastSyncedAt = Date()
            } catch {
                print("Sync failed: \(person.name), error: \(error)")
            }
        }

        try localContext.save()
    }
}
```

### Scenario 3: Data Import/Export

```swift
class DataExporter {
    let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
    }

    // Export to JSON
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

    // Import from JSON
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

## Interview Key Points

### Common Interview Questions

**1. What's the difference between Core Data and SQLite?**

Core Data is not a database, but an object graph management framework. It can use SQLite as underlying storage, but also supports other formats. Key differences:
- Core Data manages object lifecycle and relationships
- Core Data provides change tracking and undo functionality
- Core Data has Faulting mechanism for memory optimization
- SQLite is a pure relational database

**2. What is Faulting and what is its purpose?**

Faulting is Core Data's memory optimization mechanism. When fetching objects, Core Data may only create a placeholder (fault), and only loads data from storage when properties are accessed. This reduces memory usage and initial load time.

**3. How do you solve Core Data concurrency issues?**

- Use `perform` or `performAndWait` to execute operations on the correct queue
- Use `NSManagedObjectID` to pass object references across contexts
- Configure `automaticallyMergesChangesFromParent`
- Use appropriate merge policies

**4. What is NSFetchedResultsController for?**

NSFetchedResultsController monitors data changes and automatically updates UI. It's particularly suited for use with UITableView/UICollectionView:
- Automatically monitors data changes
- Provides section support
- Caches query results

**5. What types of Core Data migration are there?**

- Lightweight migration: Automatically handles simple model changes
- Custom migration: Uses mapping models for complex changes
- Progressive migration: Migrates version by version for multi-version upgrades

**6. How do you optimize Core Data performance?**

- Use appropriate fetchBatchSize
- Prefetch relationships to avoid N+1 problem
- Use batch operations for large data
- Add indexes for frequently queried fields
- Process time-consuming operations in background context
- Use Faulting wisely

---

## Further Reading

### Official Resources

- [Core Data Programming Guide](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CoreData/index.html)
- [Core Data Framework Reference](https://developer.apple.com/documentation/coredata)
- [WWDC Core Data Related Videos](https://developer.apple.com/videos/frameworks/core-data)

### Recommended Books

- "Core Data by Tutorials" - raywenderlich.com
- "Core Data" - Marcus Zarra
- "Pro Core Data for iOS" - Michael Privat, Robert Warner

### Related Frameworks

- **SwiftData**: iOS 17+ new generation persistence framework based on Swift macros
- **Realm**: Cross-platform mobile database alternative
- **GRDB**: Swift database library based on SQLite
- **CloudKit**: Cloud sync solution integrated with Core Data

### Advanced Topics

- Core Data + CloudKit Sync
- Sharing Data Between Core Data and Widgets
- Core Data Performance Analysis and Tuning
- Custom Transformable Types
- Using Persistent History Tracking

---

## Summary

Core Data is a powerful data persistence framework in iOS/macOS development. By now, you should have mastered:

1. **Core Concepts**: Understanding the components of Core Data Stack and their roles
2. **Data Models**: Designing entities, attributes, and relationships
3. **CRUD Operations**: Creating, reading, updating, and deleting data
4. **NSFetchRequest**: Flexible query mechanisms
5. **Relationship Management**: One-to-one, one-to-many, many-to-many relationships
6. **Data Migration**: Lightweight and custom migration
7. **Concurrency Handling**: Correctly handling multi-threaded scenarios
8. **Performance Optimization**: Faulting, batch operations, indexes, etc.
9. **SwiftUI Integration**: @FetchRequest and environment objects

Remember: Core Data is not just a database, it's a complete object lifecycle management solution. Properly leveraging its features can greatly simplify data layer development.
