---
title: 错误处理
description: Swift错误处理完全指南，throws、try、Error协议与Result类型
track: swift
section: basics
difficulty: intermediate
tags:
  - Swift
  - 错误处理
  - throws
  - Result
status: imported
origin: old/src/content/docs/swift/error-handling.en.md
divergence: 0.208
issues:
  - title-lang-en
  - title-language
legacy:
  category: Swift
  subcategory: 核心概念
  order: 6
  lastUpdated: 2026-01-07
---

Error handling is a core skill for writing robust and reliable software. Swift provides a powerful and type-safe error handling mechanism that allows developers to gracefully handle various exceptional situations that may occur during program execution. We'll cover all aspects of Swift error handling in depth, from basic concepts to advanced usage.

## The Error Protocol

All error types in Swift must conform to the `Error` protocol. This is an empty protocol that primarily serves to identify that a type can be thrown as an error.

### Defining Custom Errors

The most common approach is to use enumerations to define error types, as enumerations can clearly express different error conditions:

```swift
enum NetworkError: Error {
    case invalidURL
    case noConnection
    case timeout
    case serverError(statusCode: Int)
    case decodingFailed(underlying: Error)
}
```

Enumeration associated values can carry additional error information, making error handling more precise.

### Using Structs to Define Errors

For situations that require carrying more contextual information, you can use structs:

```swift
struct ValidationError: Error {
    let field: String
    let message: String
    let code: Int

    static let invalidEmail = ValidationError(
        field: "email",
        message: "Invalid email format",
        code: 1001
    )

    static let passwordTooShort = ValidationError(
        field: "password",
        message: "Password must be at least 8 characters",
        code: 1002
    )
}
```

### The LocalizedError Protocol

To provide better error descriptions, you can conform to the `LocalizedError` protocol:

```swift
enum FileError: Error {
    case notFound(filename: String)
    case permissionDenied
    case corrupted
}

extension FileError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .notFound(let filename):
            return "File '\(filename)' does not exist"
        case .permissionDenied:
            return "Access permission denied"
        case .corrupted:
            return "File is corrupted"
        }
    }

    var failureReason: String? {
        switch self {
        case .notFound:
            return "The specified file path is invalid or the file has been deleted"
        case .permissionDenied:
            return "The current user does not have sufficient permissions to access this file"
        case .corrupted:
            return "The file data structure is abnormal and cannot be read properly"
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .notFound:
            return "Please check if the file path is correct"
        case .permissionDenied:
            return "Please contact the administrator to obtain permissions"
        case .corrupted:
            return "Please try to restore the file from a backup"
        }
    }
}
```

## Throwing Functions

Use the `throws` keyword to mark functions that may throw errors:

```swift
func loadConfiguration(from path: String) throws -> Configuration {
    guard FileManager.default.fileExists(atPath: path) else {
        throw FileError.notFound(filename: path)
    }

    guard let data = FileManager.default.contents(atPath: path) else {
        throw FileError.corrupted
    }

    do {
        let config = try JSONDecoder().decode(Configuration.self, from: data)
        return config
    } catch {
        throw NetworkError.decodingFailed(underlying: error)
    }
}
```

### Types of Throwing Functions

The `throws` keyword is part of the function signature in function types:

```swift
// Regular function type
let normalFunction: (Int) -> String

// Throwing function type
let throwingFunction: (Int) throws -> String

// A throwing function can be assigned to a regular function variable (but not vice versa)
func safeOperation(_ value: Int) -> String {
    return String(value)
}

let operation: (Int) throws -> String = safeOperation  // Valid
```

### Initializers Can Also Throw Errors

```swift
struct User {
    let id: Int
    let email: String

    init(id: Int, email: String) throws {
        guard id > 0 else {
            throw ValidationError(field: "id", message: "ID must be a positive number", code: 1003)
        }

        guard email.contains("@") else {
            throw ValidationError.invalidEmail
        }

        self.id = id
        self.email = email
    }
}
```

## try, try?, and try!

Swift provides three ways to call throwing functions:

### try - Standard Error Propagation

Must be used within a `do-catch` block or within another `throws` function:

```swift
func processUserData() throws {
    let config = try loadConfiguration(from: "config.json")
    let user = try User(id: config.userId, email: config.email)
    print("User loaded successfully: \(user.email)")
}
```

### try? - Convert to Optional

Converts the result to an optional value, returning `nil` on error:

```swift
// Error is silently ignored, returns nil
let config = try? loadConfiguration(from: "config.json")

// Common usage: combined with nil coalescing operator
let config = try? loadConfiguration(from: "custom.json")
    ?? Configuration.default

// Used with if let
if let user = try? User(id: 1, email: "test@example.com") {
    print("User created successfully")
} else {
    print("User creation failed")
}

// Used with guard
func setupUser() -> User? {
    guard let user = try? User(id: 1, email: "test@example.com") else {
        return nil
    }
    return user
}
```

### try! - Force Unwrap

Use when you are certain no error will be thrown; otherwise, the program will crash:

```swift
// Only use when you are 100% certain no error will occur
let bundlePath = Bundle.main.path(forResource: "DefaultConfig", ofType: "json")!
let config = try! loadConfiguration(from: bundlePath)

// Dangerous: if an error is thrown, the program will crash
// Should only be used in the following situations:
// 1. Loading application built-in resources
// 2. Operations known at compile time not to fail
// 3. In test code
```

## The do-catch Statement

`do-catch` is the primary way to handle errors in Swift:

### Basic Syntax

```swift
do {
    let config = try loadConfiguration(from: "config.json")
    let user = try User(id: config.userId, email: config.email)
    print("Operation successful")
} catch {
    // error is an implicitly bound error variable
    print("An error occurred: \(error)")
}
```

### Catching Specific Error Types

```swift
do {
    try performNetworkRequest()
} catch NetworkError.invalidURL {
    print("URL format is incorrect")
} catch NetworkError.noConnection {
    print("No network connection, please check your network settings")
} catch NetworkError.timeout {
    print("Request timed out, please retry")
} catch NetworkError.serverError(let statusCode) {
    print("Server error, status code: \(statusCode)")
} catch {
    print("Unknown error: \(error)")
}
```

### Using where Clauses for Conditional Catching

```swift
do {
    try performNetworkRequest()
} catch NetworkError.serverError(let statusCode) where statusCode >= 500 {
    print("Internal server error, please try again later")
} catch NetworkError.serverError(let statusCode) where statusCode >= 400 {
    print("Client request error, status code: \(statusCode)")
} catch {
    print("Other error: \(error)")
}
```

### Catching Multiple Error Types

```swift
do {
    try processData()
} catch is NetworkError, is FileError {
    print("IO-related error")
} catch let error as ValidationError {
    print("Validation error - Field: \(error.field), Message: \(error.message)")
} catch {
    print("Unhandled error: \(error)")
}
```

### Nested do-catch

```swift
func complexOperation() {
    do {
        let data = try fetchData()

        do {
            let result = try parseData(data)
            try saveResult(result)
        } catch {
            // Handle parsing and saving errors
            print("Data processing failed: \(error)")
            try? saveErrorLog(error)
        }

    } catch {
        // Handle data fetching errors
        print("Failed to fetch data: \(error)")
    }
}
```

## The Result Type

`Result` is a generic enumeration introduced in Swift 5, providing an alternative way to handle errors without using `throws`:

```swift
enum Result<Success, Failure: Error> {
    case success(Success)
    case failure(Failure)
}
```

### Basic Usage

```swift
func fetchUser(id: Int) -> Result<User, NetworkError> {
    guard id > 0 else {
        return .failure(.invalidURL)
    }

    // Simulate network request
    if let user = database.findUser(id: id) {
        return .success(user)
    } else {
        return .failure(.serverError(statusCode: 404))
    }
}

// Handle result using switch
let result = fetchUser(id: 42)
switch result {
case .success(let user):
    print("User fetched successfully: \(user.email)")
case .failure(let error):
    print("Failed to fetch user: \(error)")
}
```

### Convenience Methods of Result

```swift
let result = fetchUser(id: 42)

// get() - Get success value or throw error
do {
    let user = try result.get()
    print(user)
} catch {
    print(error)
}

// map - Transform success value
let emailResult = result.map { $0.email }  // Result<String, NetworkError>

// mapError - Transform error type
let generalResult = result.mapError { error -> Error in
    return error as Error
}

// flatMap - Chain operations
func validateUser(_ user: User) -> Result<User, ValidationError> {
    guard user.email.contains("@") else {
        return .failure(.invalidEmail)
    }
    return .success(user)
}

// Note: This requires unified error types
let validatedResult = result
    .mapError { _ in ValidationError.invalidEmail }
    .flatMap { validateUser($0) }
```

### Converting Between Result and throws

```swift
// Convert throws function to Result
func fetchDataThrowing() throws -> Data {
    // ...
}

let result = Result { try fetchDataThrowing() }

// Convert Result to throws
func processResult(_ result: Result<Data, Error>) throws -> String {
    let data = try result.get()
    return String(data: data, encoding: .utf8) ?? ""
}
```

### Using Result in Asynchronous Operations

```swift
func fetchUserAsync(id: Int, completion: @escaping (Result<User, NetworkError>) -> Void) {
    DispatchQueue.global().async {
        // Simulate network delay
        Thread.sleep(forTimeInterval: 1.0)

        if id > 0 {
            let user = User(id: id, email: "user@example.com")
            completion(.success(user))
        } else {
            completion(.failure(.invalidURL))
        }
    }
}

// Usage
fetchUserAsync(id: 42) { result in
    switch result {
    case .success(let user):
        print("Async user fetch successful: \(user)")
    case .failure(let error):
        print("Async user fetch failed: \(error)")
    }
}
```

## Rethrowing Functions

The `rethrows` keyword marks functions that only throw errors when their parameter closure throws:

```swift
func performOperation<T>(
    _ operation: () throws -> T
) rethrows -> T {
    return try operation()
}

// When passing a non-throwing closure, try is not needed
let result1 = performOperation { 42 }

// When passing a throwing closure, try is required
let result2 = try performOperation {
    try riskyOperation()
}
```

### Standard Library Examples of rethrows

```swift
// The map implementation uses rethrows
extension Sequence {
    func map<T>(_ transform: (Element) throws -> T) rethrows -> [T] {
        var result: [T] = []
        for element in self {
            result.append(try transform(element))
        }
        return result
    }
}

// Non-throwing closure
let numbers = [1, 2, 3]
let doubled = numbers.map { $0 * 2 }  // try not needed

// Throwing closure
let parsed = try numbers.map { number -> Int in
    guard number > 0 else {
        throw ValidationError(field: "number", message: "Must be positive", code: 1)
    }
    return number * 2
}
```

### Custom rethrows Functions

```swift
func retry<T>(
    times: Int,
    operation: () throws -> T
) rethrows -> T {
    var lastError: Error?

    for _ in 0..<times {
        do {
            return try operation()
        } catch {
            lastError = error
            continue
        }
    }

    // If all retries fail, rethrow the last error
    throw lastError!
}

// Usage
let data = try retry(times: 3) {
    try fetchDataFromNetwork()
}
```

## Practical Examples

### Example 1: Network Request Error Handling

```swift
enum APIError: Error {
    case invalidURL
    case networkFailure(underlying: Error)
    case invalidResponse
    case httpError(statusCode: Int, message: String)
    case decodingError(underlying: Error)
    case unauthorized
    case rateLimited(retryAfter: TimeInterval)
}

extension APIError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid request URL"
        case .networkFailure(let error):
            return "Network request failed: \(error.localizedDescription)"
        case .invalidResponse:
            return "Invalid server response"
        case .httpError(let code, let message):
            return "HTTP error \(code): \(message)"
        case .decodingError:
            return "Data parsing failed"
        case .unauthorized:
            return "Unauthorized, please log in again"
        case .rateLimited(let seconds):
            return "Too many requests, please retry in \(Int(seconds)) seconds"
        }
    }
}

class APIClient {
    func request<T: Decodable>(
        endpoint: String,
        method: String = "GET"
    ) async throws -> T {
        guard let url = URL(string: endpoint) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method

        let data: Data
        let response: URLResponse

        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError.networkFailure(underlying: error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200..<300:
            break
        case 401:
            throw APIError.unauthorized
        case 429:
            let retryAfter = httpResponse.value(forHTTPHeaderField: "Retry-After")
                .flatMap { Double($0) } ?? 60
            throw APIError.rateLimited(retryAfter: retryAfter)
        default:
            throw APIError.httpError(
                statusCode: httpResponse.statusCode,
                message: HTTPURLResponse.localizedString(forStatusCode: httpResponse.statusCode)
            )
        }

        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(underlying: error)
        }
    }
}

// Usage example
func fetchUserProfile() async {
    let client = APIClient()

    do {
        let profile: UserProfile = try await client.request(
            endpoint: "https://api.example.com/profile"
        )
        print("User profile fetched successfully: \(profile.name)")
    } catch APIError.unauthorized {
        // Navigate to login page
        navigateToLogin()
    } catch APIError.rateLimited(let retryAfter) {
        // Show retry alert
        showRetryAlert(after: retryAfter)
    } catch {
        // Show generic error
        showError(error.localizedDescription)
    }
}
```

### Example 2: File Operation Error Handling

```swift
enum DocumentError: Error {
    case fileNotFound(path: String)
    case accessDenied(path: String)
    case invalidFormat(expected: String, actual: String)
    case saveFailed(underlying: Error)
    case documentTooLarge(size: Int, maxSize: Int)
}

class DocumentManager {
    private let fileManager = FileManager.default
    private let maxFileSize = 10 * 1024 * 1024  // 10MB

    func loadDocument(at path: String) throws -> Document {
        guard fileManager.fileExists(atPath: path) else {
            throw DocumentError.fileNotFound(path: path)
        }

        guard fileManager.isReadableFile(atPath: path) else {
            throw DocumentError.accessDenied(path: path)
        }

        let attributes = try fileManager.attributesOfItem(atPath: path)
        if let size = attributes[.size] as? Int, size > maxFileSize {
            throw DocumentError.documentTooLarge(size: size, maxSize: maxFileSize)
        }

        guard let data = fileManager.contents(atPath: path) else {
            throw DocumentError.fileNotFound(path: path)
        }

        // Check file format
        guard data.starts(with: [0x50, 0x4B]) else {  // ZIP file header
            throw DocumentError.invalidFormat(expected: "docx", actual: "unknown")
        }

        return try parseDocument(from: data)
    }

    func saveDocument(_ document: Document, to path: String) throws {
        let data = try encodeDocument(document)

        do {
            try data.write(to: URL(fileURLWithPath: path))
        } catch {
            throw DocumentError.saveFailed(underlying: error)
        }
    }

    private func parseDocument(from data: Data) throws -> Document {
        // Parsing logic...
        return Document()
    }

    private func encodeDocument(_ document: Document) throws -> Data {
        // Encoding logic...
        return Data()
    }
}

// Version using Result type
extension DocumentManager {
    func loadDocumentResult(at path: String) -> Result<Document, DocumentError> {
        do {
            let document = try loadDocument(at: path)
            return .success(document)
        } catch let error as DocumentError {
            return .failure(error)
        } catch {
            return .failure(.saveFailed(underlying: error))
        }
    }
}
```

### Example 3: Form Validation Error Handling

```swift
struct FormValidationError: Error {
    let errors: [FieldError]

    struct FieldError {
        let field: String
        let messages: [String]
    }

    var isValid: Bool { errors.isEmpty }
}

class FormValidator {
    private var fieldErrors: [String: [String]] = [:]

    func validate(_ value: String?, for field: String, rules: [ValidationRule]) {
        var messages: [String] = []

        for rule in rules {
            if let error = rule.validate(value) {
                messages.append(error)
            }
        }

        if !messages.isEmpty {
            fieldErrors[field] = messages
        }
    }

    func finalize() throws {
        guard fieldErrors.isEmpty else {
            let errors = fieldErrors.map {
                FormValidationError.FieldError(field: $0.key, messages: $0.value)
            }
            throw FormValidationError(errors: errors)
        }
    }
}

protocol ValidationRule {
    func validate(_ value: String?) -> String?
}

struct RequiredRule: ValidationRule {
    func validate(_ value: String?) -> String? {
        guard let value = value, !value.isEmpty else {
            return "This field is required"
        }
        return nil
    }
}

struct EmailRule: ValidationRule {
    func validate(_ value: String?) -> String? {
        guard let value = value else { return nil }
        let emailRegex = #"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$"#
        guard value.range(of: emailRegex, options: .regularExpression) != nil else {
            return "Please enter a valid email address"
        }
        return nil
    }
}

struct MinLengthRule: ValidationRule {
    let minLength: Int

    func validate(_ value: String?) -> String? {
        guard let value = value else { return nil }
        guard value.count >= minLength else {
            return "Length must be at least \(minLength) characters"
        }
        return nil
    }
}

// Usage example
func registerUser(email: String?, password: String?, name: String?) throws -> User {
    let validator = FormValidator()

    validator.validate(email, for: "email", rules: [
        RequiredRule(),
        EmailRule()
    ])

    validator.validate(password, for: "password", rules: [
        RequiredRule(),
        MinLengthRule(minLength: 8)
    ])

    validator.validate(name, for: "name", rules: [
        RequiredRule(),
        MinLengthRule(minLength: 2)
    ])

    try validator.finalize()

    // Validation passed, create user
    return User(email: email!, password: password!, name: name!)
}

// Handling validation errors
do {
    let user = try registerUser(email: "invalid", password: "123", name: "")
} catch let error as FormValidationError {
    for fieldError in error.errors {
        print("\(fieldError.field):")
        for message in fieldError.messages {
            print("  - \(message)")
        }
    }
}
```

## Error Handling Best Practices

### Choose the Appropriate Error Handling Approach

```swift
// Use throws: When the caller needs to handle the error
func loadUserData() throws -> UserData {
    // ...
}

// Use Result: For async callbacks or when you need to store the result
func fetchDataAsync(completion: @escaping (Result<Data, Error>) -> Void) {
    // ...
}

// Use optionals: When the error is not important or there's a reasonable default
func findUser(byId id: Int) -> User? {
    // ...
}
```

### Provide Meaningful Error Information

```swift
// Bad practice
enum BadError: Error {
    case error1
    case error2
}

// Good practice
enum GoodError: Error {
    case userNotFound(userId: Int)
    case insufficientBalance(required: Decimal, available: Decimal)
    case networkTimeout(url: URL, duration: TimeInterval)
}
```

### Don't Overuse try!

```swift
// Avoid
let data = try! JSONEncoder().encode(user)  // May crash

// Recommended
do {
    let data = try JSONEncoder().encode(user)
    // Use data
} catch {
    // Handle encoding error
    logger.error("Failed to encode user: \(error)")
}
```

### Error Propagation and Transformation

```swift
// Convert low-level errors to domain errors
func loadProfile() throws -> Profile {
    do {
        let data = try networkClient.fetch(endpoint: "/profile")
        return try JSONDecoder().decode(Profile.self, from: data)
    } catch let error as NetworkError {
        throw ProfileError.networkFailure(error)
    } catch let error as DecodingError {
        throw ProfileError.invalidData(error)
    }
}
```

### Use defer for Cleanup

```swift
func processFile(at path: String) throws -> ProcessedData {
    let file = try openFile(at: path)
    defer {
        file.close()  // Executes whether success or failure
    }

    let data = try file.readAll()
    return try process(data)
}
```

## Summary

Swift's error handling mechanism provides various tools for gracefully handling exceptional situations:

- **Error Protocol**: Define type-safe error types
- **throws/try**: Synchronous error propagation mechanism
- **do-catch**: Flexible error catching and handling
- **try?/try!**: Simplified error handling for specific scenarios
- **Result Type**: Suitable for asynchronous operations and scenarios requiring result storage
- **rethrows**: Optimized error propagation for higher-order functions

By using these tools appropriately, you can write code that is both safe and maintainable. The key is to choose the appropriate error handling strategy for each specific scenario and always provide clear, meaningful error information.
