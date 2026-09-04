---
title: Keychain 安全存储
description: iOS Keychain Services 完全指南：安全数据存储，包括密码、密钥、证书和敏感用户数据
track: security
section: auth-crypto
difficulty: intermediate
tags:
  - Swift
  - iOS
  - Keychain
  - 安全
  - 存储
  - 加密
status: imported
origin: old/src/content/docs/swift/keychain.zh.md
divergence: 0.321
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Swift
  subcategory: ""
  order: 2
  lastUpdated: 2026-01-22
---

iOS Keychain 是用于存储敏感信息（如密码、加密密钥和证书）的安全加密容器。它提供硬件支持的安全性，数据在应用重新安装后仍然保留，是存储凭据和其他敏感数据的必备工具。

## 概念解释

与以明文存储数据的 UserDefaults 不同，Keychain 在静态时加密数据并提供安全的访问控制。Keychain 在应用删除和重新安装后仍然存在，可以配置为在同一开发者的应用之间共享数据，或通过 iCloud 跨设备同步。

关键特性：
- **加密**：使用设备的 Secure Enclave 加密数据
- **持久性**：在应用重新安装和系统恢复后仍然存在
- **访问控制**：对数据何时可以访问进行细粒度控制
- **共享**：可以通过 Keychain Groups 在应用之间共享数据

```swift
import Security

// 基本 Keychain 操作
class KeychainManager {
    static let shared = KeychainManager()

    func save(password: String, for account: String) throws {
        guard let data = password.data(using: .utf8) else {
            throw KeychainError.encodingFailed
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecValueData as String: data
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.unhandledError(status: status)
        }
    }
}
```

## 核心原理

### Keychain 项目类别

Keychain 支持不同类型的项目：

| 类别 | 描述 | 用例 |
|------|------|------|
| kSecClassGenericPassword | 通用密码 | 应用密码、令牌 |
| kSecClassInternetPassword | 互联网密码 | 网站凭据 |
| kSecClassCertificate | X.509 证书 | SSL 证书 |
| kSecClassKey | 加密密钥 | 加密密钥 |
| kSecClassIdentity | 身份（证书+密钥） | 客户端认证 |

### 访问控制

```swift
import Security
import LocalAuthentication

// 不同的可访问性级别
enum KeychainAccessibility {
    case whenUnlocked          // 默认 - 设备解锁时可用
    case afterFirstUnlock      // 启动后首次解锁后可用
    case whenPasscodeSetThis   // 仅当设置了密码时
    case whenUnlockedThisDevice // 不同步，仅在解锁时
}

func accessibilityAttribute(for level: KeychainAccessibility) -> CFString {
    switch level {
    case .whenUnlocked:
        return kSecAttrAccessibleWhenUnlocked
    case .afterFirstUnlock:
        return kSecAttrAccessibleAfterFirstUnlock
    case .whenPasscodeSetThis:
        return kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly
    case .whenUnlockedThisDevice:
        return kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    }
}
```

## 关键概念

### 完整的 Keychain 包装器

```swift
import Foundation
import Security

enum KeychainError: Error {
    case duplicateItem
    case itemNotFound
    case unexpectedPasswordData
    case unhandledError(status: OSStatus)
    case encodingFailed
}

class KeychainWrapper {

    let service: String
    let accessGroup: String?

    init(service: String, accessGroup: String? = nil) {
        self.service = service
        self.accessGroup = accessGroup
    }

    // MARK: - 保存

    func save(_ data: Data, for key: String) throws {
        var query = baseQuery(for: key)
        query[kSecValueData as String] = data

        let status = SecItemAdd(query as CFDictionary, nil)

        if status == errSecDuplicateItem {
            // 项目已存在，更新它
            try update(data, for: key)
        } else if status != errSecSuccess {
            throw KeychainError.unhandledError(status: status)
        }
    }

    func save(_ string: String, for key: String) throws {
        guard let data = string.data(using: .utf8) else {
            throw KeychainError.encodingFailed
        }
        try save(data, for: key)
    }

    // MARK: - 读取

    func read(for key: String) throws -> Data {
        var query = baseQuery(for: key)
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        query[kSecReturnData as String] = true

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                throw KeychainError.itemNotFound
            }
            throw KeychainError.unhandledError(status: status)
        }

        guard let data = result as? Data else {
            throw KeychainError.unexpectedPasswordData
        }

        return data
    }

    func readString(for key: String) throws -> String {
        let data = try read(for: key)
        guard let string = String(data: data, encoding: .utf8) else {
            throw KeychainError.unexpectedPasswordData
        }
        return string
    }

    // MARK: - 更新

    func update(_ data: Data, for key: String) throws {
        let query = baseQuery(for: key)
        let updateQuery: [String: Any] = [kSecValueData as String: data]

        let status = SecItemUpdate(query as CFDictionary, updateQuery as CFDictionary)

        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                throw KeychainError.itemNotFound
            }
            throw KeychainError.unhandledError(status: status)
        }
    }

    // MARK: - 删除

    func delete(for key: String) throws {
        let query = baseQuery(for: key)
        let status = SecItemDelete(query as CFDictionary)

        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unhandledError(status: status)
        }
    }

    func deleteAll() throws {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service
        ]

        if let accessGroup = accessGroup {
            query[kSecAttrAccessGroup as String] = accessGroup
        }

        let status = SecItemDelete(query as CFDictionary)

        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unhandledError(status: status)
        }
    }

    // MARK: - 辅助方法

    private func baseQuery(for key: String) -> [String: Any] {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]

        if let accessGroup = accessGroup {
            query[kSecAttrAccessGroup as String] = accessGroup
        }

        return query
    }
}
```

### 生物识别认证

```swift
import LocalAuthentication

class BiometricKeychain {

    private let keychain: KeychainWrapper

    init(service: String) {
        self.keychain = KeychainWrapper(service: service)
    }

    func saveWithBiometrics(_ data: Data, for key: String) throws {
        // 创建需要生物识别的访问控制
        var error: Unmanaged<CFError>?
        guard let accessControl = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
            .biometryCurrentSet,
            &error
        ) else {
            throw error!.takeRetainedValue() as Error
        }

        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychain.service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessControl as String: accessControl
        ]

        // 删除现有项目
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.unhandledError(status: status)
        }
    }

    func readWithBiometrics(for key: String, reason: String) throws -> Data {
        let context = LAContext()
        context.localizedReason = reason

        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychain.service,
            kSecAttrAccount as String: key,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecReturnData as String: true,
            kSecUseAuthenticationContext as String: context
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                throw KeychainError.itemNotFound
            }
            throw KeychainError.unhandledError(status: status)
        }

        guard let data = result as? Data else {
            throw KeychainError.unexpectedPasswordData
        }

        return data
    }

    // 检查生物识别可用性
    func canUseBiometrics() -> (available: Bool, type: LABiometryType) {
        let context = LAContext()
        var error: NSError?

        let available = context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        )

        return (available, context.biometryType)
    }
}
```

## 代码示例

### 存储凭据

```swift
import Foundation

struct Credentials: Codable {
    let username: String
    let password: String
    let token: String?
    let expiresAt: Date?
}

class CredentialManager {

    private let keychain = KeychainWrapper(service: "com.myapp.credentials")
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    func save(credentials: Credentials, for account: String) throws {
        let data = try encoder.encode(credentials)
        try keychain.save(data, for: account)
    }

    func getCredentials(for account: String) throws -> Credentials {
        let data = try keychain.read(for: account)
        return try decoder.decode(Credentials.self, from: data)
    }

    func updateToken(_ token: String, for account: String) throws {
        var credentials = try getCredentials(for: account)
        credentials = Credentials(
            username: credentials.username,
            password: credentials.password,
            token: token,
            expiresAt: Date().addingTimeInterval(3600)
        )
        try save(credentials: credentials, for: account)
    }

    func deleteCredentials(for account: String) throws {
        try keychain.delete(for: account)
    }

    func hasCredentials(for account: String) -> Bool {
        do {
            _ = try keychain.read(for: account)
            return true
        } catch {
            return false
        }
    }
}
```

### 应用间 Keychain 共享

```swift
// 在应用的 Entitlements 文件中添加：
// <key>keychain-access-groups</key>
// <array>
//     <string>$(AppIdentifierPrefix)com.yourcompany.shared</string>
// </array>

class SharedKeychain {

    // 访问组格式：<TeamID>.<AccessGroupID>
    private let keychain = KeychainWrapper(
        service: "com.yourcompany.shared",
        accessGroup: "ABCD1234.com.yourcompany.shared"
    )

    func shareData(_ data: Data, key: String) throws {
        try keychain.save(data, for: key)
    }

    func readSharedData(key: String) throws -> Data {
        return try keychain.read(for: key)
    }
}
```

## 最佳实践

### 1. 使用适当的访问控制

```swift
func saveSecureItem(_ data: Data, key: String, requiresBiometric: Bool) throws {
    var accessControl: SecAccessControl?

    if requiresBiometric {
        var error: Unmanaged<CFError>?
        accessControl = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
            .biometryCurrentSet,
            &error
        )

        if let error = error {
            throw error.takeRetainedValue() as Error
        }
    }

    var query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccount as String: key,
        kSecValueData as String: data
    ]

    if let accessControl = accessControl {
        query[kSecAttrAccessControl as String] = accessControl
    } else {
        // 使用合理的默认值
        query[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    }

    // 删除现有的并添加新的
    SecItemDelete(query as CFDictionary)
    let status = SecItemAdd(query as CFDictionary, nil)

    guard status == errSecSuccess else {
        throw KeychainError.unhandledError(status: status)
    }
}
```

### 2. 正确处理错误

```swift
extension KeychainError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .duplicateItem:
            return "Keychain 中已存在该项目"
        case .itemNotFound:
            return "Keychain 中未找到该项目"
        case .unexpectedPasswordData:
            return "意外的密码数据格式"
        case .encodingFailed:
            return "数据编码失败"
        case .unhandledError(let status):
            if let message = SecCopyErrorMessageString(status, nil) {
                return message as String
            }
            return "Keychain 错误: \(status)"
        }
    }
}

// 正确错误处理的用法
func securelyStoreToken(_ token: String) {
    do {
        try keychain.save(token, for: "auth_token")
    } catch KeychainError.duplicateItem {
        // 更新现有项目
        do {
            try keychain.update(token.data(using: .utf8)!, for: "auth_token")
        } catch {
            print("更新失败: \(error.localizedDescription)")
        }
    } catch {
        print("Keychain 错误: \(error.localizedDescription)")
    }
}
```

### 3. 登出时清理

```swift
class AuthenticationManager {

    private let keychain = KeychainWrapper(service: "com.myapp.auth")

    private let sensitiveKeys = [
        "access_token",
        "refresh_token",
        "user_credentials",
        "encryption_key"
    ]

    func logout() {
        // 清除所有敏感数据
        for key in sensitiveKeys {
            try? keychain.delete(for: key)
        }

        // 清除 UserDefaults（非敏感缓存数据）
        UserDefaults.standard.removePersistentDomain(
            forName: Bundle.main.bundleIdentifier!
        )
    }
}
```

## 常见陷阱

### 1. 忘记 iCloud 同步设置

```swift
// 某些可访问性级别下，项目默认会同步到 iCloud
// 使用 ThisDeviceOnly 变体来防止同步

// 错误：可能会将敏感数据同步到 iCloud
query[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlocked

// 正确：永不同步到 iCloud
query[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
```

### 2. 不处理 Keychain 错误

```swift
// 错误：忽略错误
func save(password: String) {
    let query = [/*...*/]
    SecItemAdd(query as CFDictionary, nil) // 状态被忽略！
}

// 正确：处理所有情况
func save(password: String) throws {
    let query = [/*...*/]
    let status = SecItemAdd(query as CFDictionary, nil)

    switch status {
    case errSecSuccess:
        return
    case errSecDuplicateItem:
        try update(password)
    case errSecAuthFailed:
        throw KeychainError.authenticationFailed
    default:
        throw KeychainError.unhandledError(status: status)
    }
}
```

### 3. 存储大数据

```swift
// 错误：在 Keychain 中存储大文件
// Keychain 不是为大数据存储设计的

// 正确：在 Keychain 中存储加密密钥，在文件中存储加密数据
class SecureFileStorage {

    private let keychain = KeychainWrapper(service: "com.myapp.files")

    func saveSecurely(_ data: Data, filename: String) throws {
        // 生成或检索加密密钥
        let key = try getOrCreateEncryptionKey()

        // 加密数据
        let encryptedData = try encrypt(data, with: key)

        // 将加密数据保存到文件
        let url = getDocumentsDirectory().appendingPathComponent(filename)
        try encryptedData.write(to: url)
    }

    private func getOrCreateEncryptionKey() throws -> SymmetricKey {
        if let keyData = try? keychain.read(for: "encryption_key") {
            return SymmetricKey(data: keyData)
        }

        let key = SymmetricKey(size: .bits256)
        try keychain.save(key.withUnsafeBytes { Data($0) }, for: "encryption_key")
        return key
    }
}
```

## 面试要点

1. **什么是 Keychain，什么时候应该使用它？**
   - 用于敏感数据的加密存储
   - 密码、令牌、加密密钥
   - 数据在应用重新安装后仍然保留

2. **Keychain 项目类别有哪些？**
   - GenericPassword、InternetPassword、Certificate、Key、Identity
   - 每种都针对特定用例进行了优化

3. **可访问性如何影响 Keychain 项目？**
   - 控制项目何时可以访问
   - ThisDeviceOnly 变体防止 iCloud 同步
   - 生物识别选项提供额外安全性

4. **如何在应用之间共享 Keychain 项目？**
   - 在 entitlements 中设置 Keychain Access Groups
   - 需要相同的 Team ID
   - 在查询中指定显式访问组

5. **Keychain 和 UserDefaults 有什么区别？**
   - Keychain：加密、安全、跨安装持久化
   - UserDefaults：明文，用于非敏感偏好设置

## 延伸阅读

- [Apple Keychain Services 文档](https://developer.apple.com/documentation/security/keychain_services)
- [在 Keychain 中存储密钥](https://developer.apple.com/documentation/security/certificate_key_and_trust_services/keys/storing_keys_in_the_keychain)
- [限制 Keychain 项目可访问性](https://developer.apple.com/documentation/security/keychain_services/keychain_items/restricting_keychain_item_accessibility)
- [在应用集合中共享 Keychain 项目访问](https://developer.apple.com/documentation/security/keychain_services/keychain_items/sharing_access_to_keychain_items_among_a_collection_of_apps)
