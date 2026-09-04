---
title: URLSession 网络请求详解
description: iOS 网络请求 URLSession 全面指南，涵盖数据任务、上传、下载、认证、缓存和现代 async/await 模式
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Swift
  - iOS
  - URLSession
  - 网络
  - HTTP
  - REST API
status: imported
origin: old/src/content/docs/swift/urlsession.zh.md
divergence: 0.207
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - h1-in-body
legacy:
  category: Swift
  subcategory: ""
  order: 4
  lastUpdated: 2026-01-21
---

## 概念解释

URLSession 是 Apple 为 iOS、macOS 和其他 Apple 平台提供的基础网络 API。它提供了丰富的功能集，用于发起 HTTP/HTTPS 请求、处理上传和下载、管理认证以及使用 WebSocket。

与第三方库不同，URLSession 内置于系统中，提供最佳性能、通过系统更新获得安全补丁，并与 iOS 功能（如后台应用刷新和蜂窝数据管理）深度集成。

关键能力：
- **数据任务**：在内存中获取数据（API 调用、JSON 获取）
- **上传任务**：向服务器发送数据并支持进度跟踪
- **下载任务**：下载文件并支持后台下载
- **WebSocket 任务**：实时双向通信
- **流任务**：底层 socket 通信

URLSession 使用会话配置来定义缓存、cookie 和连接限制等行为，使用代理来提供对请求生命周期的细粒度控制。

## 核心原理

### URLSession 架构

```
URLSession
├── URLSessionConfiguration
│   ├── .default（持久化缓存、cookie、凭证）
│   ├── .ephemeral（无持久化存储）
│   └── .background（应用挂起时继续）
│
├── URLSessionDelegate（可选）
│   ├── URLSessionTaskDelegate
│   ├── URLSessionDataDelegate
│   ├── URLSessionDownloadDelegate
│   └── URLSessionWebSocketDelegate
│
└── URLSessionTask
    ├── URLSessionDataTask
    ├── URLSessionUploadTask
    ├── URLSessionDownloadTask
    └── URLSessionWebSocketTask
```

### 创建会话

```swift
// 共享单例（适合简单请求）
let sharedSession = URLSession.shared

// 自定义配置
let configuration = URLSessionConfiguration.default
configuration.timeoutIntervalForRequest = 30
configuration.timeoutIntervalForResource = 300
configuration.waitsForConnectivity = true
configuration.allowsCellularAccess = true
configuration.httpAdditionalHeaders = [
    "Accept": "application/json",
    "User-Agent": "MyApp/1.0"
]

let customSession = URLSession(configuration: configuration)

// 带代理的会话
let delegateSession = URLSession(
    configuration: configuration,
    delegate: self,
    delegateQueue: .main
)

// 后台会话（必须有唯一标识符）
let backgroundConfig = URLSessionConfiguration.background(
    withIdentifier: "com.myapp.background"
)
backgroundConfig.sessionSendsLaunchEvents = true
backgroundConfig.isDiscretionary = false

let backgroundSession = URLSession(
    configuration: backgroundConfig,
    delegate: self,
    delegateQueue: nil
)
```

### URLRequest 配置

```swift
var request = URLRequest(url: URL(string: "https://api.example.com/data")!)

// HTTP 方法
request.httpMethod = "POST"

// 请求头
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
request.addValue("gzip", forHTTPHeaderField: "Accept-Encoding")

// 请求体
let body = ["key": "value"]
request.httpBody = try? JSONEncoder().encode(body)

// 缓存
request.cachePolicy = .reloadIgnoringLocalCacheData

// 超时
request.timeoutInterval = 30

// 允许蜂窝网络
request.allowsCellularAccess = true
```

## 核心要点

### 1. 现代 Async/Await API

iOS 15+ 提供原生 async/await 支持：

```swift
class NetworkService {
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    // 基本数据获取
    func fetchData(from url: URL) async throws -> Data {
        let (data, response) = try await session.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.httpError(statusCode: httpResponse.statusCode)
        }

        return data
    }

    // 类型化响应
    func fetch<T: Decodable>(_ type: T.Type, from url: URL) async throws -> T {
        let data = try await fetchData(from: url)
        return try JSONDecoder().decode(T.self, from: data)
    }

    // 带请求
    func fetch<T: Decodable>(
        _ type: T.Type,
        request: URLRequest
    ) async throws -> T {
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.requestFailed
        }

        return try JSONDecoder().decode(T.self, from: data)
    }
}

enum NetworkError: Error {
    case invalidResponse
    case httpError(statusCode: Int)
    case requestFailed
    case decodingFailed
}
```

### 2. 完成处理器模式（旧版）

用于 iOS 14 及更早版本兼容：

```swift
class LegacyNetworkService {
    private let session = URLSession.shared

    func fetchData(
        from url: URL,
        completion: @escaping (Result<Data, Error>) -> Void
    ) {
        let task = session.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                completion(.failure(NetworkError.invalidResponse))
                return
            }

            guard let data = data else {
                completion(.failure(NetworkError.noData))
                return
            }

            completion(.success(data))
        }

        task.resume() // 别忘了启动任务！
    }

    // 使用 continuation 桥接 async/await
    func fetchDataBridged(from url: URL) async throws -> Data {
        try await withCheckedThrowingContinuation { continuation in
            fetchData(from: url) { result in
                continuation.resume(with: result)
            }
        }
    }
}
```

### 3. 上传任务

```swift
class UploadService {
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    // 上传数据
    func uploadData(_ data: Data, to url: URL) async throws -> Data {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")

        let (responseData, response) = try await session.upload(
            for: request,
            from: data
        )

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.uploadFailed
        }

        return responseData
    }

    // 上传文件
    func uploadFile(at fileURL: URL, to serverURL: URL) async throws -> Data {
        var request = URLRequest(url: serverURL)
        request.httpMethod = "POST"

        let (data, response) = try await session.upload(
            for: request,
            fromFile: fileURL
        )

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.uploadFailed
        }

        return data
    }

    // Multipart 表单上传
    func uploadMultipart(
        images: [Data],
        to url: URL,
        additionalFields: [String: String] = [:]
    ) async throws -> Data {
        let boundary = UUID().uuidString

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(
            "multipart/form-data; boundary=\(boundary)",
            forHTTPHeaderField: "Content-Type"
        )

        var body = Data()

        // 添加文本字段
        for (key, value) in additionalFields {
            body.append("--\(boundary)\r\n")
            body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n")
            body.append("\(value)\r\n")
        }

        // 添加图片
        for (index, imageData) in images.enumerated() {
            body.append("--\(boundary)\r\n")
            body.append("Content-Disposition: form-data; name=\"image\(index)\"; filename=\"image\(index).jpg\"\r\n")
            body.append("Content-Type: image/jpeg\r\n\r\n")
            body.append(imageData)
            body.append("\r\n")
        }

        body.append("--\(boundary)--\r\n")

        let (responseData, response) = try await session.upload(
            for: request,
            from: body
        )

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.uploadFailed
        }

        return responseData
    }
}

extension Data {
    mutating func append(_ string: String) {
        if let data = string.data(using: .utf8) {
            append(data)
        }
    }
}
```

### 4. 下载任务

```swift
class DownloadService: NSObject {
    private var session: URLSession!
    private var downloadContinuations: [URLSessionDownloadTask: CheckedContinuation<URL, Error>] = [:]
    private var progressHandlers: [URLSessionDownloadTask: (Double) -> Void] = [:]

    override init() {
        super.init()
        let configuration = URLSessionConfiguration.default
        session = URLSession(
            configuration: configuration,
            delegate: self,
            delegateQueue: .main
        )
    }

    // 简单下载
    func download(from url: URL) async throws -> URL {
        let (localURL, response) = try await session.download(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.downloadFailed
        }

        // 移动到永久位置
        let documentsURL = FileManager.default.urls(
            for: .documentDirectory,
            in: .userDomainMask
        )[0]
        let destinationURL = documentsURL.appendingPathComponent(url.lastPathComponent)

        try? FileManager.default.removeItem(at: destinationURL)
        try FileManager.default.moveItem(at: localURL, to: destinationURL)

        return destinationURL
    }

    // 带进度的下载
    func download(
        from url: URL,
        progress: @escaping (Double) -> Void
    ) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            let task = session.downloadTask(with: url)
            downloadContinuations[task] = continuation
            progressHandlers[task] = progress
            task.resume()
        }
    }
}

extension DownloadService: URLSessionDownloadDelegate {
    func urlSession(
        _ session: URLSession,
        downloadTask: URLSessionDownloadTask,
        didFinishDownloadingTo location: URL
    ) {
        guard let continuation = downloadContinuations.removeValue(forKey: downloadTask) else {
            return
        }

        do {
            let documentsURL = FileManager.default.urls(
                for: .documentDirectory,
                in: .userDomainMask
            )[0]
            let destinationURL = documentsURL.appendingPathComponent(
                downloadTask.originalRequest?.url?.lastPathComponent ?? "download"
            )

            try? FileManager.default.removeItem(at: destinationURL)
            try FileManager.default.moveItem(at: location, to: destinationURL)

            continuation.resume(returning: destinationURL)
        } catch {
            continuation.resume(throwing: error)
        }

        progressHandlers.removeValue(forKey: downloadTask)
    }

    func urlSession(
        _ session: URLSession,
        downloadTask: URLSessionDownloadTask,
        didWriteData bytesWritten: Int64,
        totalBytesWritten: Int64,
        totalBytesExpectedToWrite: Int64
    ) {
        let progress = Double(totalBytesWritten) / Double(totalBytesExpectedToWrite)
        progressHandlers[downloadTask]?(progress)
    }

    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didCompleteWithError error: Error?
    ) {
        if let error = error,
           let downloadTask = task as? URLSessionDownloadTask,
           let continuation = downloadContinuations.removeValue(forKey: downloadTask) {
            continuation.resume(throwing: error)
            progressHandlers.removeValue(forKey: downloadTask)
        }
    }
}
```

## 代码示例

### 完整的 API 客户端

```swift
import Foundation

// MARK: - API 客户端

actor APIClient {
    private let session: URLSession
    private let baseURL: URL
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(
        baseURL: URL,
        session: URLSession = .shared,
        decoder: JSONDecoder = JSONDecoder(),
        encoder: JSONEncoder = JSONEncoder()
    ) {
        self.baseURL = baseURL
        self.session = session
        self.decoder = decoder
        self.encoder = encoder

        // 为常见日期格式配置解码器
        self.decoder.dateDecodingStrategy = .iso8601
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase

        self.encoder.dateEncodingStrategy = .iso8601
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
    }

    // MARK: - 公共方法

    func get<T: Decodable>(
        _ path: String,
        queryItems: [URLQueryItem]? = nil,
        headers: [String: String]? = nil
    ) async throws -> T {
        let request = try buildRequest(
            path: path,
            method: "GET",
            queryItems: queryItems,
            headers: headers
        )
        return try await execute(request)
    }

    func post<T: Decodable, B: Encodable>(
        _ path: String,
        body: B,
        headers: [String: String]? = nil
    ) async throws -> T {
        var request = try buildRequest(
            path: path,
            method: "POST",
            headers: headers
        )
        request.httpBody = try encoder.encode(body)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return try await execute(request)
    }

    func put<T: Decodable, B: Encodable>(
        _ path: String,
        body: B,
        headers: [String: String]? = nil
    ) async throws -> T {
        var request = try buildRequest(
            path: path,
            method: "PUT",
            headers: headers
        )
        request.httpBody = try encoder.encode(body)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return try await execute(request)
    }

    func delete(
        _ path: String,
        headers: [String: String]? = nil
    ) async throws {
        let request = try buildRequest(
            path: path,
            method: "DELETE",
            headers: headers
        )
        let (_, response) = try await session.data(for: request)
        try validateResponse(response)
    }

    // MARK: - 私有方法

    private func buildRequest(
        path: String,
        method: String,
        queryItems: [URLQueryItem]? = nil,
        headers: [String: String]? = nil
    ) throws -> URLRequest {
        var components = URLComponents(
            url: baseURL.appendingPathComponent(path),
            resolvingAgainstBaseURL: true
        )
        components?.queryItems = queryItems

        guard let url = components?.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        headers?.forEach { key, value in
            request.setValue(value, forHTTPHeaderField: key)
        }

        return request
    }

    private func execute<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return try decoder.decode(T.self, from: data)
    }

    private func validateResponse(_ response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200...299:
            return
        case 401:
            throw APIError.unauthorized
        case 403:
            throw APIError.forbidden
        case 404:
            throw APIError.notFound
        case 422:
            throw APIError.validationError
        case 500...599:
            throw APIError.serverError(statusCode: httpResponse.statusCode)
        default:
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
    }
}

// MARK: - 错误

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case forbidden
    case notFound
    case validationError
    case serverError(statusCode: Int)
    case httpError(statusCode: Int)
    case decodingError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "无效的 URL"
        case .invalidResponse:
            return "服务器响应无效"
        case .unauthorized:
            return "需要身份验证"
        case .forbidden:
            return "访问被拒绝"
        case .notFound:
            return "资源未找到"
        case .validationError:
            return "验证失败"
        case .serverError(let code):
            return "服务器错误：\(code)"
        case .httpError(let code):
            return "HTTP 错误：\(code)"
        case .decodingError(let error):
            return "解码失败：\(error.localizedDescription)"
        }
    }
}

// MARK: - 使用示例

struct User: Codable {
    let id: Int
    let name: String
    let email: String
}

struct CreateUserRequest: Codable {
    let name: String
    let email: String
}

class UserService {
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func getUser(id: Int) async throws -> User {
        try await apiClient.get("/users/\(id)")
    }

    func getUsers(page: Int, limit: Int) async throws -> [User] {
        try await apiClient.get(
            "/users",
            queryItems: [
                URLQueryItem(name: "page", value: "\(page)"),
                URLQueryItem(name: "limit", value: "\(limit)")
            ]
        )
    }

    func createUser(name: String, email: String) async throws -> User {
        try await apiClient.post(
            "/users",
            body: CreateUserRequest(name: name, email: email)
        )
    }

    func deleteUser(id: Int) async throws {
        try await apiClient.delete("/users/\(id)")
    }
}
```

### 认证处理器

```swift
actor AuthenticatedAPIClient {
    private let session: URLSession
    private let baseURL: URL
    private var accessToken: String?
    private var refreshToken: String?
    private var isRefreshing = false
    private var pendingRequests: [CheckedContinuation<Data, Error>] = []

    init(baseURL: URL) {
        self.baseURL = baseURL

        let configuration = URLSessionConfiguration.default
        configuration.httpAdditionalHeaders = [
            "Accept": "application/json",
            "Content-Type": "application/json"
        ]
        self.session = URLSession(configuration: configuration)
    }

    func setTokens(access: String, refresh: String) {
        self.accessToken = access
        self.refreshToken = refresh
    }

    func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: Data? = nil
    ) async throws -> T {
        let data = try await executeWithAuth(path: path, method: method, body: body)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func executeWithAuth(
        path: String,
        method: String,
        body: Data?
    ) async throws -> Data {
        guard let token = accessToken else {
            throw APIError.unauthorized
        }

        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = method
        request.httpBody = body
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }

            if httpResponse.statusCode == 401 {
                // Token 过期，尝试刷新
                return try await handleTokenRefresh(
                    path: path,
                    method: method,
                    body: body
                )
            }

            guard (200...299).contains(httpResponse.statusCode) else {
                throw APIError.httpError(statusCode: httpResponse.statusCode)
            }

            return data
        } catch {
            throw error
        }
    }

    private func handleTokenRefresh(
        path: String,
        method: String,
        body: Data?
    ) async throws -> Data {
        if isRefreshing {
            // 等待刷新完成
            return try await withCheckedThrowingContinuation { continuation in
                pendingRequests.append(continuation)
            }
        }

        isRefreshing = true
        defer { isRefreshing = false }

        do {
            try await refreshAccessToken()

            // 重试原始请求
            let data = try await executeWithAuth(
                path: path,
                method: method,
                body: body
            )

            // 恢复待处理的请求
            for continuation in pendingRequests {
                continuation.resume(returning: data)
            }
            pendingRequests.removeAll()

            return data
        } catch {
            // 使所有待处理的请求失败
            for continuation in pendingRequests {
                continuation.resume(throwing: error)
            }
            pendingRequests.removeAll()
            throw error
        }
    }

    private func refreshAccessToken() async throws {
        guard let refreshToken = refreshToken else {
            throw APIError.unauthorized
        }

        var request = URLRequest(url: baseURL.appendingPathComponent("/auth/refresh"))
        request.httpMethod = "POST"
        request.httpBody = try JSONEncoder().encode(["refresh_token": refreshToken])

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.unauthorized
        }

        struct TokenResponse: Decodable {
            let accessToken: String
            let refreshToken: String
        }

        let tokens = try JSONDecoder().decode(TokenResponse.self, from: data)
        self.accessToken = tokens.accessToken
        self.refreshToken = tokens.refreshToken
    }
}
```

### 重试逻辑和指数退避

```swift
struct RetryConfiguration {
    let maxRetries: Int
    let baseDelay: TimeInterval
    let maxDelay: TimeInterval
    let retryableStatusCodes: Set<Int>

    static let `default` = RetryConfiguration(
        maxRetries: 3,
        baseDelay: 1.0,
        maxDelay: 30.0,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504]
    )
}

actor RetryingAPIClient {
    private let session: URLSession
    private let configuration: RetryConfiguration

    init(
        session: URLSession = .shared,
        configuration: RetryConfiguration = .default
    ) {
        self.session = session
        self.configuration = configuration
    }

    func execute(_ request: URLRequest) async throws -> Data {
        var lastError: Error?

        for attempt in 0..<configuration.maxRetries {
            do {
                let (data, response) = try await session.data(for: request)

                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }

                if configuration.retryableStatusCodes.contains(httpResponse.statusCode) {
                    lastError = APIError.httpError(statusCode: httpResponse.statusCode)
                    await delay(for: attempt)
                    continue
                }

                guard (200...299).contains(httpResponse.statusCode) else {
                    throw APIError.httpError(statusCode: httpResponse.statusCode)
                }

                return data
            } catch let error as URLError where isRetryable(error) {
                lastError = error
                await delay(for: attempt)
                continue
            } catch {
                throw error
            }
        }

        throw lastError ?? APIError.invalidResponse
    }

    private func isRetryable(_ error: URLError) -> Bool {
        switch error.code {
        case .timedOut, .networkConnectionLost, .notConnectedToInternet:
            return true
        default:
            return false
        }
    }

    private func delay(for attempt: Int) async {
        let delay = min(
            configuration.baseDelay * pow(2.0, Double(attempt)),
            configuration.maxDelay
        )
        // 添加抖动以防止惊群效应
        let jitter = Double.random(in: 0...0.3) * delay
        try? await Task.sleep(nanoseconds: UInt64((delay + jitter) * 1_000_000_000))
    }
}
```

## 最佳实践

### 1. 集中式网络配置

```swift
enum NetworkConfiguration {
    static let baseURL = URL(string: "https://api.example.com/v1")!

    static var defaultSession: URLSession {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        config.waitsForConnectivity = true
        config.httpAdditionalHeaders = defaultHeaders
        return URLSession(configuration: config)
    }

    static var defaultHeaders: [String: String] {
        [
            "Accept": "application/json",
            "Accept-Language": Locale.current.language.languageCode?.identifier ?? "en",
            "X-App-Version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0",
            "X-Platform": "iOS"
        ]
    }
}

// 使用
let client = APIClient(
    baseURL: NetworkConfiguration.baseURL,
    session: NetworkConfiguration.defaultSession
)
```

### 2. 请求日志

```swift
class LoggingURLProtocol: URLProtocol {
    private var dataTask: URLSessionDataTask?

    override class func canInit(with request: URLRequest) -> Bool {
        guard URLProtocol.property(forKey: "Logged", in: request) == nil else {
            return false
        }
        return true
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

    override func startLoading() {
        let mutableRequest = (request as NSURLRequest).mutableCopy() as! NSMutableURLRequest
        URLProtocol.setProperty(true, forKey: "Logged", in: mutableRequest)

        logRequest(mutableRequest as URLRequest)

        let session = URLSession(configuration: .default)
        dataTask = session.dataTask(with: mutableRequest as URLRequest) { [weak self] data, response, error in
            guard let self = self else { return }

            self.logResponse(response, data: data, error: error)

            if let error = error {
                self.client?.urlProtocol(self, didFailWithError: error)
            } else {
                if let response = response {
                    self.client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
                }
                if let data = data {
                    self.client?.urlProtocol(self, didLoad: data)
                }
                self.client?.urlProtocolDidFinishLoading(self)
            }
        }
        dataTask?.resume()
    }

    override func stopLoading() {
        dataTask?.cancel()
    }

    private func logRequest(_ request: URLRequest) {
        #if DEBUG
        print(">>> \(request.httpMethod ?? "GET") \(request.url?.absoluteString ?? "")")
        request.allHTTPHeaderFields?.forEach { key, value in
            print("    \(key): \(value)")
        }
        if let body = request.httpBody,
           let bodyString = String(data: body, encoding: .utf8) {
            print("    Body: \(bodyString)")
        }
        #endif
    }

    private func logResponse(_ response: URLResponse?, data: Data?, error: Error?) {
        #if DEBUG
        if let httpResponse = response as? HTTPURLResponse {
            print("<<< \(httpResponse.statusCode) \(response?.url?.absoluteString ?? "")")
        }
        if let data = data,
           let responseString = String(data: data, encoding: .utf8) {
            print("    Response: \(responseString.prefix(500))")
        }
        if let error = error {
            print("    Error: \(error.localizedDescription)")
        }
        #endif
    }
}

// 在调试构建中注册
#if DEBUG
URLProtocol.registerClass(LoggingURLProtocol.self)
#endif
```

### 3. 取消支持

```swift
class CancellableNetworkService {
    private var activeTasks: [UUID: URLSessionTask] = [:]
    private let session = URLSession.shared

    func fetch(from url: URL) async throws -> Data {
        let taskID = UUID()

        return try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { continuation in
                let task = session.dataTask(with: url) { data, response, error in
                    self.activeTasks.removeValue(forKey: taskID)

                    if let error = error {
                        continuation.resume(throwing: error)
                    } else if let data = data {
                        continuation.resume(returning: data)
                    } else {
                        continuation.resume(throwing: APIError.invalidResponse)
                    }
                }

                activeTasks[taskID] = task
                task.resume()
            }
        } onCancel: {
            self.activeTasks[taskID]?.cancel()
            self.activeTasks.removeValue(forKey: taskID)
        }
    }

    func cancelAll() {
        activeTasks.values.forEach { $0.cancel() }
        activeTasks.removeAll()
    }
}
```

## 常见陷阱

### 1. 忘记恢复任务

```swift
// 错误 - 任务永远不会启动
let task = session.dataTask(with: url) { data, response, error in
    // 这个闭包永远不会被调用
}
// 缺少：task.resume()

// 正确
let task = session.dataTask(with: url) { data, response, error in
    // 处理响应
}
task.resume() // 别忘了这个！
```

### 2. 闭包中的循环引用

```swift
// 错误 - 潜在的内存泄漏
class NetworkManager {
    var data: Data?

    func fetchData(from url: URL) {
        URLSession.shared.dataTask(with: url) { data, _, _ in
            self.data = data // 对 self 的强引用
        }.resume()
    }
}

// 正确 - 使用捕获列表
class NetworkManager {
    var data: Data?

    func fetchData(from url: URL) {
        URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            self?.data = data
        }.resume()
    }
}
```

### 3. 没有处理所有错误情况

```swift
// 错误 - 缺少错误处理
let (data, _) = try await session.data(from: url)
let user = try JSONDecoder().decode(User.self, from: data)

// 正确 - 全面的错误处理
do {
    let (data, response) = try await session.data(from: url)

    guard let httpResponse = response as? HTTPURLResponse else {
        throw NetworkError.invalidResponse
    }

    guard (200...299).contains(httpResponse.statusCode) else {
        throw NetworkError.httpError(statusCode: httpResponse.statusCode)
    }

    let user = try JSONDecoder().decode(User.self, from: data)
} catch let error as DecodingError {
    // 具体处理解码错误
    print("解码失败：\(error)")
} catch let error as URLError {
    // 处理 URL/网络错误
    print("网络错误：\(error)")
} catch {
    // 处理其他错误
    print("未知错误：\(error)")
}
```

### 4. 主线程违规

```swift
// 错误 - 完成处理器可能在后台线程调用
session.dataTask(with: url) { data, _, _ in
    self.label.text = "完成" // 在后台线程更新 UI！
}.resume()

// 正确 - 分发到主线程
session.dataTask(with: url) { data, _, _ in
    DispatchQueue.main.async {
        self.label.text = "完成"
    }
}.resume()

// 更好 - 使用 async/await 配合 @MainActor
@MainActor
func fetchAndUpdateUI() async {
    let data = try? await session.data(from: url)
    label.text = "完成" // 已经在主线程
}
```

## 性能考量

### 1. 连接池

```swift
// URLSession 自动池化连接
// 配置一次会话并重用它

class NetworkService {
    // 单例会话 - 连接被重用
    static let shared = NetworkService()

    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.httpMaximumConnectionsPerHost = 6 // 默认是 6
        config.timeoutIntervalForRequest = 30
        session = URLSession(configuration: config)
    }
}
```

### 2. 缓存策略

```swift
// 配置缓存
let config = URLSessionConfiguration.default
config.urlCache = URLCache(
    memoryCapacity: 50 * 1024 * 1024,  // 50 MB 内存
    diskCapacity: 200 * 1024 * 1024    // 200 MB 磁盘
)

// 每个请求的缓存策略
var request = URLRequest(url: url)
request.cachePolicy = .returnCacheDataElseLoad // 如果可用则使用缓存

// 强制网络
request.cachePolicy = .reloadIgnoringLocalCacheData

// 自定义 ETag 处理
class CachingService {
    private var etags: [URL: String] = [:]

    func fetch(url: URL) async throws -> Data {
        var request = URLRequest(url: url)

        if let etag = etags[url] {
            request.setValue(etag, forHTTPHeaderField: "If-None-Match")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        if httpResponse.statusCode == 304 {
            // 使用缓存数据
            if let cachedResponse = URLCache.shared.cachedResponse(for: request) {
                return cachedResponse.data
            }
        }

        // 存储 ETag 用于将来的请求
        if let etag = httpResponse.value(forHTTPHeaderField: "ETag") {
            etags[url] = etag
        }

        return data
    }
}
```

### 3. 请求去重

```swift
actor RequestDeduplicator {
    private var inFlightRequests: [URL: Task<Data, Error>] = [:]

    func fetch(url: URL, using session: URLSession) async throws -> Data {
        if let existingTask = inFlightRequests[url] {
            return try await existingTask.value
        }

        let task = Task<Data, Error> {
            let (data, _) = try await session.data(from: url)
            return data
        }

        inFlightRequests[url] = task

        defer {
            inFlightRequests.removeValue(forKey: url)
        }

        return try await task.value
    }
}
```

## 实战场景

### 带同步队列的离线优先

```swift
actor SyncQueue {
    private var pendingRequests: [PendingRequest] = []
    private let storage: UserDefaults
    private let apiClient: APIClient

    struct PendingRequest: Codable {
        let id: UUID
        let url: String
        let method: String
        let body: Data?
        let createdAt: Date
    }

    init(apiClient: APIClient, storage: UserDefaults = .standard) {
        self.apiClient = apiClient
        self.storage = storage
        loadPendingRequests()
    }

    func enqueue(url: URL, method: String, body: Data?) {
        let request = PendingRequest(
            id: UUID(),
            url: url.absoluteString,
            method: method,
            body: body,
            createdAt: Date()
        )
        pendingRequests.append(request)
        savePendingRequests()
    }

    func sync() async {
        for request in pendingRequests {
            do {
                var urlRequest = URLRequest(url: URL(string: request.url)!)
                urlRequest.httpMethod = request.method
                urlRequest.httpBody = request.body

                _ = try await URLSession.shared.data(for: urlRequest)

                // 移除成功的请求
                pendingRequests.removeAll { $0.id == request.id }
                savePendingRequests()
            } catch {
                // 保留在队列中以便重试
                print("\(request.id) 同步失败：\(error)")
            }
        }
    }

    private func loadPendingRequests() {
        if let data = storage.data(forKey: "pendingRequests"),
           let requests = try? JSONDecoder().decode([PendingRequest].self, from: data) {
            pendingRequests = requests
        }
    }

    private func savePendingRequests() {
        if let data = try? JSONEncoder().encode(pendingRequests) {
            storage.set(data, forKey: "pendingRequests")
        }
    }
}
```

## 面试要点

1. **URLSession vs URLConnection**：URLSession 是现代 API；URLConnection 已弃用

2. **会话配置**：解释 default、ephemeral 和 background 配置

3. **任务类型**：数据任务（内存中）、下载任务（基于文件）、上传任务

4. **Async/Await vs 完成处理器**：现代语法的优势和桥接模式

5. **线程安全**：URLSession 回调在任意队列；使用 MainActor 进行 UI

6. **缓存**：URL 缓存配置和缓存策略

7. **认证**：基于挑战的代理认证

8. **后台下载**：后台会话要求和限制

9. **错误处理**：URLError 代码和 HTTP 状态处理

10. **内存管理**：闭包中的 weak self、任务取消

## 延伸阅读

- [Apple URLSession 文档](https://developer.apple.com/documentation/foundation/urlsession)
- [WWDC 2021: 使用 async/await 和 URLSession](https://developer.apple.com/videos/play/wwdc2021/10095/)
- [URL 加载系统指南](https://developer.apple.com/documentation/foundation/url_loading_system)
- [HTTP 实时流](https://developer.apple.com/documentation/http-live-streaming)
- [后台执行](https://developer.apple.com/documentation/uikit/app_and_environment/scenes/preparing_your_ui_to_run_in_the_background)
- [Network Framework](https://developer.apple.com/documentation/network) 用于更底层的网络
