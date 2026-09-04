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
origin: old/src/content/docs/swift/error-handling.zh.md
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

错误处理是编写健壮、可靠软件的核心技能。Swift 提供了一套强大且类型安全的错误处理机制，让开发者能够优雅地处理程序运行时可能出现的各种异常情况。本文将深入探讨 Swift 错误处理的各个方面，从基础概念到高级用法。

## Error 协议

Swift 中所有错误类型都必须遵循 `Error` 协议。这是一个空协议，主要用于标识某个类型可以作为错误被抛出。

### 定义自定义错误

最常见的做法是使用枚举来定义错误类型，因为枚举可以清晰地表达不同的错误情况：

```swift
enum NetworkError: Error {
    case invalidURL
    case noConnection
    case timeout
    case serverError(statusCode: Int)
    case decodingFailed(underlying: Error)
}
```

枚举的关联值可以携带额外的错误信息，使错误处理更加精确。

### 使用结构体定义错误

对于需要携带更多上下文信息的情况，可以使用结构体：

```swift
struct ValidationError: Error {
    let field: String
    let message: String
    let code: Int

    static let invalidEmail = ValidationError(
        field: "email",
        message: "邮箱格式不正确",
        code: 1001
    )

    static let passwordTooShort = ValidationError(
        field: "password",
        message: "密码长度不能少于8位",
        code: 1002
    )
}
```

### LocalizedError 协议

为了提供更好的错误描述，可以遵循 `LocalizedError` 协议：

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
            return "文件 '\(filename)' 不存在"
        case .permissionDenied:
            return "没有访问权限"
        case .corrupted:
            return "文件已损坏"
        }
    }

    var failureReason: String? {
        switch self {
        case .notFound:
            return "指定的文件路径无效或文件已被删除"
        case .permissionDenied:
            return "当前用户没有足够的权限访问此文件"
        case .corrupted:
            return "文件数据结构异常，无法正常读取"
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .notFound:
            return "请检查文件路径是否正确"
        case .permissionDenied:
            return "请联系管理员获取权限"
        case .corrupted:
            return "请尝试从备份中恢复文件"
        }
    }
}
```

## 抛出函数（Throwing Functions）

使用 `throws` 关键字标记可能抛出错误的函数：

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

### 抛出函数的类型

函数类型中 `throws` 是函数签名的一部分：

```swift
// 普通函数类型
let normalFunction: (Int) -> String

// 抛出函数类型
let throwingFunction: (Int) throws -> String

// 抛出函数可以赋值给普通函数变量（但反过来不行）
func safeOperation(_ value: Int) -> String {
    return String(value)
}

let operation: (Int) throws -> String = safeOperation  // 合法
```

### 初始化器也可以抛出错误

```swift
struct User {
    let id: Int
    let email: String

    init(id: Int, email: String) throws {
        guard id > 0 else {
            throw ValidationError(field: "id", message: "ID必须为正数", code: 1003)
        }

        guard email.contains("@") else {
            throw ValidationError.invalidEmail
        }

        self.id = id
        self.email = email
    }
}
```

## try、try? 和 try!

Swift 提供了三种方式来调用抛出函数：

### try - 标准错误传播

必须在 `do-catch` 块中使用，或者在另一个 `throws` 函数中使用：

```swift
func processUserData() throws {
    let config = try loadConfiguration(from: "config.json")
    let user = try User(id: config.userId, email: config.email)
    print("用户加载成功: \(user.email)")
}
```

### try? - 转换为可选值

将结果转换为可选值，错误时返回 `nil`：

```swift
// 错误被静默忽略，返回 nil
let config = try? loadConfiguration(from: "config.json")

// 常见用法：结合 nil 合并运算符
let config = try? loadConfiguration(from: "custom.json")
    ?? Configuration.default

// 结合 if let 使用
if let user = try? User(id: 1, email: "test@example.com") {
    print("用户创建成功")
} else {
    print("用户创建失败")
}

// 结合 guard 使用
func setupUser() -> User? {
    guard let user = try? User(id: 1, email: "test@example.com") else {
        return nil
    }
    return user
}
```

### try! - 强制解包

当你确定不会抛出错误时使用，否则程序会崩溃：

```swift
// 只有在100%确定不会出错时才使用
let bundlePath = Bundle.main.path(forResource: "DefaultConfig", ofType: "json")!
let config = try! loadConfiguration(from: bundlePath)

// 危险：如果抛出错误，程序会崩溃
// 应该只用于以下情况：
// 1. 加载应用程序内置资源
// 2. 编译时已知不会失败的操作
// 3. 测试代码中
```

## do-catch 语句

`do-catch` 是 Swift 中处理错误的主要方式：

### 基本语法

```swift
do {
    let config = try loadConfiguration(from: "config.json")
    let user = try User(id: config.userId, email: config.email)
    print("操作成功")
} catch {
    // error 是隐式绑定的错误变量
    print("发生错误: \(error)")
}
```

### 捕获特定错误类型

```swift
do {
    try performNetworkRequest()
} catch NetworkError.invalidURL {
    print("URL 格式错误")
} catch NetworkError.noConnection {
    print("网络未连接，请检查网络设置")
} catch NetworkError.timeout {
    print("请求超时，请重试")
} catch NetworkError.serverError(let statusCode) {
    print("服务器错误，状态码: \(statusCode)")
} catch {
    print("未知错误: \(error)")
}
```

### 使用 where 子句进行条件捕获

```swift
do {
    try performNetworkRequest()
} catch NetworkError.serverError(let statusCode) where statusCode >= 500 {
    print("服务器内部错误，请稍后重试")
} catch NetworkError.serverError(let statusCode) where statusCode >= 400 {
    print("客户端请求错误，状态码: \(statusCode)")
} catch {
    print("其他错误: \(error)")
}
```

### 捕获多种错误类型

```swift
do {
    try processData()
} catch is NetworkError, is FileError {
    print("IO 相关错误")
} catch let error as ValidationError {
    print("验证错误 - 字段: \(error.field), 消息: \(error.message)")
} catch {
    print("未处理的错误: \(error)")
}
```

### 嵌套 do-catch

```swift
func complexOperation() {
    do {
        let data = try fetchData()

        do {
            let result = try parseData(data)
            try saveResult(result)
        } catch {
            // 处理解析和保存错误
            print("数据处理失败: \(error)")
            try? saveErrorLog(error)
        }

    } catch {
        // 处理获取数据错误
        print("获取数据失败: \(error)")
    }
}
```

## Result 类型

`Result` 是 Swift 5 引入的泛型枚举，提供了一种不使用 `throws` 的错误处理方式：

```swift
enum Result<Success, Failure: Error> {
    case success(Success)
    case failure(Failure)
}
```

### 基本使用

```swift
func fetchUser(id: Int) -> Result<User, NetworkError> {
    guard id > 0 else {
        return .failure(.invalidURL)
    }

    // 模拟网络请求
    if let user = database.findUser(id: id) {
        return .success(user)
    } else {
        return .failure(.serverError(statusCode: 404))
    }
}

// 使用 switch 处理结果
let result = fetchUser(id: 42)
switch result {
case .success(let user):
    print("获取用户成功: \(user.email)")
case .failure(let error):
    print("获取用户失败: \(error)")
}
```

### Result 的便捷方法

```swift
let result = fetchUser(id: 42)

// get() - 获取成功值或抛出错误
do {
    let user = try result.get()
    print(user)
} catch {
    print(error)
}

// map - 转换成功值
let emailResult = result.map { $0.email }  // Result<String, NetworkError>

// mapError - 转换错误类型
let generalResult = result.mapError { error -> Error in
    return error as Error
}

// flatMap - 链式操作
func validateUser(_ user: User) -> Result<User, ValidationError> {
    guard user.email.contains("@") else {
        return .failure(.invalidEmail)
    }
    return .success(user)
}

// 注意：这需要错误类型统一
let validatedResult = result
    .mapError { _ in ValidationError.invalidEmail }
    .flatMap { validateUser($0) }
```

### Result 与 throws 互转

```swift
// throws 函数转 Result
func fetchDataThrowing() throws -> Data {
    // ...
}

let result = Result { try fetchDataThrowing() }

// Result 转 throws
func processResult(_ result: Result<Data, Error>) throws -> String {
    let data = try result.get()
    return String(data: data, encoding: .utf8) ?? ""
}
```

### 异步操作中使用 Result

```swift
func fetchUserAsync(id: Int, completion: @escaping (Result<User, NetworkError>) -> Void) {
    DispatchQueue.global().async {
        // 模拟网络延迟
        Thread.sleep(forTimeInterval: 1.0)

        if id > 0 {
            let user = User(id: id, email: "user@example.com")
            completion(.success(user))
        } else {
            completion(.failure(.invalidURL))
        }
    }
}

// 调用
fetchUserAsync(id: 42) { result in
    switch result {
    case .success(let user):
        print("异步获取用户成功: \(user)")
    case .failure(let error):
        print("异步获取用户失败: \(error)")
    }
}
```

## 重抛函数（Rethrows）

`rethrows` 关键字用于标记只有当参数闭包抛出错误时才会抛出错误的函数：

```swift
func performOperation<T>(
    _ operation: () throws -> T
) rethrows -> T {
    return try operation()
}

// 传入不抛出错误的闭包时，不需要 try
let result1 = performOperation { 42 }

// 传入抛出错误的闭包时，需要 try
let result2 = try performOperation {
    try riskyOperation()
}
```

### 标准库中的 rethrows 示例

```swift
// map 的实现使用了 rethrows
extension Sequence {
    func map<T>(_ transform: (Element) throws -> T) rethrows -> [T] {
        var result: [T] = []
        for element in self {
            result.append(try transform(element))
        }
        return result
    }
}

// 不抛出错误的闭包
let numbers = [1, 2, 3]
let doubled = numbers.map { $0 * 2 }  // 不需要 try

// 抛出错误的闭包
let parsed = try numbers.map { number -> Int in
    guard number > 0 else {
        throw ValidationError(field: "number", message: "必须为正数", code: 1)
    }
    return number * 2
}
```

### 自定义 rethrows 函数

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

    // 如果所有重试都失败，重新抛出最后一个错误
    throw lastError!
}

// 使用
let data = try retry(times: 3) {
    try fetchDataFromNetwork()
}
```

## 实践案例

### 案例一：网络请求错误处理

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
            return "无效的请求地址"
        case .networkFailure(let error):
            return "网络请求失败: \(error.localizedDescription)"
        case .invalidResponse:
            return "服务器响应无效"
        case .httpError(let code, let message):
            return "HTTP 错误 \(code): \(message)"
        case .decodingError:
            return "数据解析失败"
        case .unauthorized:
            return "未授权，请重新登录"
        case .rateLimited(let seconds):
            return "请求过于频繁，请在 \(Int(seconds)) 秒后重试"
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

// 使用示例
func fetchUserProfile() async {
    let client = APIClient()

    do {
        let profile: UserProfile = try await client.request(
            endpoint: "https://api.example.com/profile"
        )
        print("获取用户信息成功: \(profile.name)")
    } catch APIError.unauthorized {
        // 跳转到登录页面
        navigateToLogin()
    } catch APIError.rateLimited(let retryAfter) {
        // 显示重试提示
        showRetryAlert(after: retryAfter)
    } catch {
        // 显示通用错误
        showError(error.localizedDescription)
    }
}
```

### 案例二：文件操作错误处理

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

        // 检查文件格式
        guard data.starts(with: [0x50, 0x4B]) else {  // ZIP 文件头
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
        // 解析逻辑...
        return Document()
    }

    private func encodeDocument(_ document: Document) throws -> Data {
        // 编码逻辑...
        return Data()
    }
}

// 使用 Result 类型的版本
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

### 案例三：表单验证错误处理

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
            return "此字段为必填项"
        }
        return nil
    }
}

struct EmailRule: ValidationRule {
    func validate(_ value: String?) -> String? {
        guard let value = value else { return nil }
        let emailRegex = #"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$"#
        guard value.range(of: emailRegex, options: .regularExpression) != nil else {
            return "请输入有效的邮箱地址"
        }
        return nil
    }
}

struct MinLengthRule: ValidationRule {
    let minLength: Int

    func validate(_ value: String?) -> String? {
        guard let value = value else { return nil }
        guard value.count >= minLength else {
            return "长度不能少于 \(minLength) 个字符"
        }
        return nil
    }
}

// 使用示例
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

    // 验证通过，创建用户
    return User(email: email!, password: password!, name: name!)
}

// 处理验证错误
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

## 错误处理最佳实践

### 选择合适的错误处理方式

```swift
// 使用 throws：当调用者需要处理错误时
func loadUserData() throws -> UserData {
    // ...
}

// 使用 Result：异步回调或需要存储结果时
func fetchDataAsync(completion: @escaping (Result<Data, Error>) -> Void) {
    // ...
}

// 使用可选值：错误不重要或有合理默认值时
func findUser(byId id: Int) -> User? {
    // ...
}
```

### 提供有意义的错误信息

```swift
// 不好的做法
enum BadError: Error {
    case error1
    case error2
}

// 好的做法
enum GoodError: Error {
    case userNotFound(userId: Int)
    case insufficientBalance(required: Decimal, available: Decimal)
    case networkTimeout(url: URL, duration: TimeInterval)
}
```

### 不要过度使用 try!

```swift
// 避免
let data = try! JSONEncoder().encode(user)  // 可能崩溃

// 推荐
do {
    let data = try JSONEncoder().encode(user)
    // 使用 data
} catch {
    // 处理编码错误
    logger.error("Failed to encode user: \(error)")
}
```

### 错误传播与转换

```swift
// 将底层错误转换为领域错误
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

### 使用 defer 进行清理

```swift
func processFile(at path: String) throws -> ProcessedData {
    let file = try openFile(at: path)
    defer {
        file.close()  // 无论成功还是失败都会执行
    }

    let data = try file.readAll()
    return try process(data)
}
```

## 总结

Swift 的错误处理机制提供了多种工具来优雅地处理异常情况：

- **Error 协议**：定义类型安全的错误类型
- **throws/try**：同步错误传播机制
- **do-catch**：灵活的错误捕获和处理
- **try?/try!**：简化特定场景的错误处理
- **Result 类型**：适用于异步操作和需要存储结果的场景
- **rethrows**：优化高阶函数的错误传播

合理使用这些工具，可以编写出既安全又易于维护的代码。关键是根据具体场景选择合适的错误处理策略，并始终提供清晰、有意义的错误信息。
