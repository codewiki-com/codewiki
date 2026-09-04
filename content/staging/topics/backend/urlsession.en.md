---
title: URLSession Networking Deep Dive
description: Comprehensive guide to URLSession for iOS networking, covering data tasks, uploads, downloads, authentication, caching, and modern async/await patterns
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Swift
  - iOS
  - URLSession
  - Networking
  - HTTP
  - REST API
status: imported
origin: old/src/content/docs/swift/urlsession.en.md
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

## Concept Explanation

URLSession is Apple's foundational networking API for iOS, macOS, and other Apple platforms. It provides a rich set of features for making HTTP/HTTPS requests, handling uploads and downloads, managing authentication, and working with WebSockets.

Unlike third-party libraries, URLSession is built into the system, offering optimal performance, security updates through OS releases, and deep integration with iOS features like Background App Refresh and cellular data management.

Key capabilities:
- **Data Tasks**: Fetch data in memory (API calls, JSON fetching)
- **Upload Tasks**: Send data to servers with progress tracking
- **Download Tasks**: Download files with background support
- **WebSocket Tasks**: Real-time bidirectional communication
- **Stream Tasks**: Low-level socket communication

URLSession works with a session configuration that defines behavior like caching, cookies, and connection limits, and delegates that provide fine-grained control over the request lifecycle.

## Core Principles

### URLSession Architecture

```
URLSession
├── URLSessionConfiguration
│   ├── .default (persistent cache, cookies, credentials)
│   ├── .ephemeral (no persistent storage)
│   └── .background (continues when app is suspended)
│
├── URLSessionDelegate (optional)
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

### Creating Sessions

```swift
// Shared singleton (suitable for simple requests)
let sharedSession = URLSession.shared

// Custom configuration
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

// Session with delegate
let delegateSession = URLSession(
    configuration: configuration,
    delegate: self,
    delegateQueue: .main
)

// Background session (must have unique identifier)
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

### URLRequest Configuration

```swift
var request = URLRequest(url: URL(string: "https://api.example.com/data")!)

// HTTP method
request.httpMethod = "POST"

// Headers
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
request.addValue("gzip", forHTTPHeaderField: "Accept-Encoding")

// Body
let body = ["key": "value"]
request.httpBody = try? JSONEncoder().encode(body)

// Caching
request.cachePolicy = .reloadIgnoringLocalCacheData

// Timeout
request.timeoutInterval = 30

// Allow cellular
request.allowsCellularAccess = true
```

## Key Concepts

### 1. Modern Async/Await API

iOS 15+ provides native async/await support:

```swift
class NetworkService {
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    // Basic data fetch
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

    // Typed response
    func fetch<T: Decodable>(_ type: T.Type, from url: URL) async throws -> T {
        let data = try await fetchData(from: url)
        return try JSONDecoder().decode(T.self, from: data)
    }

    // With request
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

### 2. Completion Handler Pattern (Legacy)

For iOS 14 and earlier compatibility:

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

        task.resume() // Don't forget to start the task!
    }

    // With continuation for async/await bridge
    func fetchDataBridged(from url: URL) async throws -> Data {
        try await withCheckedThrowingContinuation { continuation in
            fetchData(from: url) { result in
                continuation.resume(with: result)
            }
        }
    }
}
```

### 3. Upload Tasks

```swift
class UploadService {
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    // Upload data
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

    // Upload file
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

    // Multipart form upload
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

        // Add text fields
        for (key, value) in additionalFields {
            body.append("--\(boundary)\r\n")
            body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n")
            body.append("\(value)\r\n")
        }

        // Add images
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

### 4. Download Tasks

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

    // Simple download
    func download(from url: URL) async throws -> URL {
        let (localURL, response) = try await session.download(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.downloadFailed
        }

        // Move to permanent location
        let documentsURL = FileManager.default.urls(
            for: .documentDirectory,
            in: .userDomainMask
        )[0]
        let destinationURL = documentsURL.appendingPathComponent(url.lastPathComponent)

        try? FileManager.default.removeItem(at: destinationURL)
        try FileManager.default.moveItem(at: localURL, to: destinationURL)

        return destinationURL
    }

    // Download with progress
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

## Code Examples

### Complete API Client

```swift
import Foundation

// MARK: - API Client

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

        // Configure decoder for common date formats
        self.decoder.dateDecodingStrategy = .iso8601
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase

        self.encoder.dateEncodingStrategy = .iso8601
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
    }

    // MARK: - Public Methods

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

    // MARK: - Private Methods

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

// MARK: - Errors

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
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .unauthorized:
            return "Authentication required"
        case .forbidden:
            return "Access denied"
        case .notFound:
            return "Resource not found"
        case .validationError:
            return "Validation failed"
        case .serverError(let code):
            return "Server error: \(code)"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .decodingError(let error):
            return "Decoding failed: \(error.localizedDescription)"
        }
    }
}

// MARK: - Usage Example

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

### Authentication Handler

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
                // Token expired, try to refresh
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
            // Wait for refresh to complete
            return try await withCheckedThrowingContinuation { continuation in
                pendingRequests.append(continuation)
            }
        }

        isRefreshing = true
        defer { isRefreshing = false }

        do {
            try await refreshAccessToken()

            // Retry original request
            let data = try await executeWithAuth(
                path: path,
                method: method,
                body: body
            )

            // Resume pending requests
            for continuation in pendingRequests {
                continuation.resume(returning: data)
            }
            pendingRequests.removeAll()

            return data
        } catch {
            // Fail all pending requests
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

### Retry Logic and Exponential Backoff

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
        // Add jitter to prevent thundering herd
        let jitter = Double.random(in: 0...0.3) * delay
        try? await Task.sleep(nanoseconds: UInt64((delay + jitter) * 1_000_000_000))
    }
}
```

## Best Practices

### 1. Centralized Network Configuration

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

// Usage
let client = APIClient(
    baseURL: NetworkConfiguration.baseURL,
    session: NetworkConfiguration.defaultSession
)
```

### 2. Request Logging

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

// Register in debug builds
#if DEBUG
URLProtocol.registerClass(LoggingURLProtocol.self)
#endif
```

### 3. Cancellation Support

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

## Common Pitfalls

### 1. Forgetting to Resume Tasks

```swift
// WRONG - Task never starts
let task = session.dataTask(with: url) { data, response, error in
    // This closure is never called
}
// Missing: task.resume()

// CORRECT
let task = session.dataTask(with: url) { data, response, error in
    // Handle response
}
task.resume() // Don't forget this!
```

### 2. Retain Cycles in Closures

```swift
// WRONG - Potential memory leak
class NetworkManager {
    var data: Data?

    func fetchData(from url: URL) {
        URLSession.shared.dataTask(with: url) { data, _, _ in
            self.data = data // Strong reference to self
        }.resume()
    }
}

// CORRECT - Use capture list
class NetworkManager {
    var data: Data?

    func fetchData(from url: URL) {
        URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            self?.data = data
        }.resume()
    }
}
```

### 3. Not Handling All Error Cases

```swift
// WRONG - Missing error handling
let (data, _) = try await session.data(from: url)
let user = try JSONDecoder().decode(User.self, from: data)

// CORRECT - Comprehensive error handling
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
    // Handle decoding errors specifically
    print("Decoding failed: \(error)")
} catch let error as URLError {
    // Handle URL/network errors
    print("Network error: \(error)")
} catch {
    // Handle other errors
    print("Unknown error: \(error)")
}
```

### 4. Main Thread Violations

```swift
// WRONG - Completion handler may be called on background thread
session.dataTask(with: url) { data, _, _ in
    self.label.text = "Done" // UI update on background thread!
}.resume()

// CORRECT - Dispatch to main thread
session.dataTask(with: url) { data, _, _ in
    DispatchQueue.main.async {
        self.label.text = "Done"
    }
}.resume()

// BETTER - Use async/await with @MainActor
@MainActor
func fetchAndUpdateUI() async {
    let data = try? await session.data(from: url)
    label.text = "Done" // Already on main thread
}
```

## Performance Considerations

### 1. Connection Pooling

```swift
// URLSession automatically pools connections
// Configure the session once and reuse it

class NetworkService {
    // Singleton session - connections are reused
    static let shared = NetworkService()

    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.httpMaximumConnectionsPerHost = 6 // Default is 6
        config.timeoutIntervalForRequest = 30
        session = URLSession(configuration: config)
    }
}
```

### 2. Caching Strategy

```swift
// Configure cache
let config = URLSessionConfiguration.default
config.urlCache = URLCache(
    memoryCapacity: 50 * 1024 * 1024,  // 50 MB memory
    diskCapacity: 200 * 1024 * 1024    // 200 MB disk
)

// Per-request cache policy
var request = URLRequest(url: url)
request.cachePolicy = .returnCacheDataElseLoad // Use cache if available

// Force network
request.cachePolicy = .reloadIgnoringLocalCacheData

// Custom ETag handling
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
            // Use cached data
            if let cachedResponse = URLCache.shared.cachedResponse(for: request) {
                return cachedResponse.data
            }
        }

        // Store ETag for future requests
        if let etag = httpResponse.value(forHTTPHeaderField: "ETag") {
            etags[url] = etag
        }

        return data
    }
}
```

### 3. Request Deduplication

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

## Real-World Scenarios

### Offline-First with Sync Queue

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

                // Remove successful request
                pendingRequests.removeAll { $0.id == request.id }
                savePendingRequests()
            } catch {
                // Keep in queue for retry
                print("Sync failed for \(request.id): \(error)")
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

## Interview Key Points

1. **URLSession vs URLConnection**: URLSession is the modern API; URLConnection is deprecated

2. **Session Configurations**: Explain default, ephemeral, and background configurations

3. **Task Types**: Data tasks (in-memory), download tasks (file-based), upload tasks

4. **Async/Await vs Completion Handlers**: Modern syntax benefits and bridging patterns

5. **Thread Safety**: URLSession callbacks on arbitrary queues; use MainActor for UI

6. **Caching**: URL cache configuration and cache policies

7. **Authentication**: Challenge-based authentication with delegates

8. **Background Downloads**: Background session requirements and limitations

9. **Error Handling**: URLError codes and HTTP status handling

10. **Memory Management**: Weak self in closures, task cancellation

## Further Reading

- [Apple URLSession Documentation](https://developer.apple.com/documentation/foundation/urlsession)
- [WWDC 2021: Use async/await with URLSession](https://developer.apple.com/videos/play/wwdc2021/10095/)
- [URL Loading System Guide](https://developer.apple.com/documentation/foundation/url_loading_system)
- [HTTP Live Streaming](https://developer.apple.com/documentation/http-live-streaming)
- [Background Execution](https://developer.apple.com/documentation/uikit/app_and_environment/scenes/preparing_your_ui_to_run_in_the_background)
- [Network Framework](https://developer.apple.com/documentation/network) for lower-level networking
