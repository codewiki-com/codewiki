---
title: Keychain Secure Storage
description: Complete guide to iOS Keychain Services for secure data storage, including passwords, keys, certificates, and sensitive user data
track: security
section: auth-crypto
difficulty: intermediate
tags:
  - Swift
  - iOS
  - Keychain
  - Security
  - Storage
  - Encryption
status: imported
origin: old/src/content/docs/swift/keychain.en.md
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

The iOS Keychain is a secure, encrypted container for storing sensitive information like passwords, cryptographic keys, and certificates. It provides hardware-backed security and persists data across app reinstalls, making it essential for storing credentials and other sensitive data.

## Concept Explanation

Unlike UserDefaults, which stores data in plain text, the Keychain encrypts data at rest and provides secure access control. The Keychain survives app deletion and reinstallation, and can be configured to share data between apps from the same developer or sync across devices via iCloud.

Key characteristics:
- **Encryption**: Data is encrypted using the device's Secure Enclave
- **Persistence**: Survives app reinstalls and system restores
- **Access Control**: Fine-grained control over when data can be accessed
- **Sharing**: Can share data between apps via Keychain Groups

```swift
import Security

// Basic Keychain operations
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

## Core Principles

### Keychain Item Classes

The Keychain supports different types of items:

| Class | Description | Use Case |
|-------|-------------|----------|
| kSecClassGenericPassword | Generic password | App passwords, tokens |
| kSecClassInternetPassword | Internet password | Website credentials |
| kSecClassCertificate | X.509 certificate | SSL certificates |
| kSecClassKey | Cryptographic key | Encryption keys |
| kSecClassIdentity | Identity (cert + key) | Client authentication |

### Access Control

```swift
import Security
import LocalAuthentication

// Different accessibility levels
enum KeychainAccessibility {
    case whenUnlocked          // Default - available when device is unlocked
    case afterFirstUnlock      // Available after first unlock since boot
    case whenPasscodeSetThis   // Only if passcode is set
    case whenUnlockedThisDevice // Not synced, unlocked only
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

## Key Concepts

### Complete Keychain Wrapper

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

    // MARK: - Save

    func save(_ data: Data, for key: String) throws {
        var query = baseQuery(for: key)
        query[kSecValueData as String] = data

        let status = SecItemAdd(query as CFDictionary, nil)

        if status == errSecDuplicateItem {
            // Item exists, update it
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

    // MARK: - Read

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

    // MARK: - Update

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

    // MARK: - Delete

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

    // MARK: - Helpers

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

### Biometric Authentication

```swift
import LocalAuthentication

class BiometricKeychain {

    private let keychain: KeychainWrapper

    init(service: String) {
        self.keychain = KeychainWrapper(service: service)
    }

    func saveWithBiometrics(_ data: Data, for key: String) throws {
        // Create access control requiring biometrics
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

        // Delete existing item
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

    // Check biometric availability
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

## Code Examples

### Storing Credentials

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

### Keychain Sharing Between Apps

```swift
// In your app's Entitlements file, add:
// <key>keychain-access-groups</key>
// <array>
//     <string>$(AppIdentifierPrefix)com.yourcompany.shared</string>
// </array>

class SharedKeychain {

    // Access group format: <TeamID>.<AccessGroupID>
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

### Internet Password Storage

```swift
class InternetPasswordManager {

    func save(
        password: String,
        server: String,
        account: String,
        protocol: CFString = kSecAttrProtocolHTTPS
    ) throws {
        guard let passwordData = password.data(using: .utf8) else {
            throw KeychainError.encodingFailed
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassInternetPassword,
            kSecAttrServer as String: server,
            kSecAttrAccount as String: account,
            kSecAttrProtocol as String: `protocol`,
            kSecValueData as String: passwordData
        ]

        // Delete existing
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.unhandledError(status: status)
        }
    }

    func getPassword(server: String, account: String) throws -> String {
        let query: [String: Any] = [
            kSecClass as String: kSecClassInternetPassword,
            kSecAttrServer as String: server,
            kSecAttrAccount as String: account,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let password = String(data: data, encoding: .utf8) else {
            throw KeychainError.itemNotFound
        }

        return password
    }

    func listAccounts(for server: String) throws -> [String] {
        let query: [String: Any] = [
            kSecClass as String: kSecClassInternetPassword,
            kSecAttrServer as String: server,
            kSecMatchLimit as String: kSecMatchLimitAll,
            kSecReturnAttributes as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let items = result as? [[String: Any]] else {
            return []
        }

        return items.compactMap { $0[kSecAttrAccount as String] as? String }
    }
}
```

### Secure Enclave Keys

```swift
import CryptoKit

@available(iOS 13.0, *)
class SecureEnclaveManager {

    private let keyTag = "com.myapp.secureenclave.key"

    func generateKey() throws -> SecKey {
        // Check if Secure Enclave is available
        guard SecureEnclave.isAvailable else {
            throw NSError(domain: "SecureEnclave", code: -1,
                         userInfo: [NSLocalizedDescriptionKey: "Secure Enclave not available"])
        }

        var error: Unmanaged<CFError>?
        guard let accessControl = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            [.privateKeyUsage, .biometryCurrentSet],
            &error
        ) else {
            throw error!.takeRetainedValue() as Error
        }

        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: true,
                kSecAttrApplicationTag as String: keyTag.data(using: .utf8)!,
                kSecAttrAccessControl as String: accessControl
            ]
        ]

        guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
            throw error!.takeRetainedValue() as Error
        }

        return privateKey
    }

    func getKey() throws -> SecKey? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: keyTag.data(using: .utf8)!,
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecReturnRef as String: true
        ]

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                return nil
            }
            throw KeychainError.unhandledError(status: status)
        }

        return (result as! SecKey)
    }

    func sign(data: Data, with privateKey: SecKey) throws -> Data {
        var error: Unmanaged<CFError>?

        guard let signature = SecKeyCreateSignature(
            privateKey,
            .ecdsaSignatureMessageX962SHA256,
            data as CFData,
            &error
        ) else {
            throw error!.takeRetainedValue() as Error
        }

        return signature as Data
    }
}
```

## Best Practices

### 1. Use Appropriate Access Control

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
        // Use reasonable default
        query[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    }

    // Delete existing and add new
    SecItemDelete(query as CFDictionary)
    let status = SecItemAdd(query as CFDictionary, nil)

    guard status == errSecSuccess else {
        throw KeychainError.unhandledError(status: status)
    }
}
```

### 2. Handle Errors Properly

```swift
extension KeychainError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .duplicateItem:
            return "Item already exists in Keychain"
        case .itemNotFound:
            return "Item not found in Keychain"
        case .unexpectedPasswordData:
            return "Unexpected password data format"
        case .encodingFailed:
            return "Failed to encode data"
        case .unhandledError(let status):
            if let message = SecCopyErrorMessageString(status, nil) {
                return message as String
            }
            return "Keychain error: \(status)"
        }
    }
}

// Usage with proper error handling
func securelyStoreToken(_ token: String) {
    do {
        try keychain.save(token, for: "auth_token")
    } catch KeychainError.duplicateItem {
        // Update existing item
        do {
            try keychain.update(token.data(using: .utf8)!, for: "auth_token")
        } catch {
            print("Failed to update: \(error.localizedDescription)")
        }
    } catch {
        print("Keychain error: \(error.localizedDescription)")
    }
}
```

### 3. Clean Up on Logout

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
        // Clear all sensitive data
        for key in sensitiveKeys {
            try? keychain.delete(for: key)
        }

        // Clear user defaults (non-sensitive cached data)
        UserDefaults.standard.removePersistentDomain(
            forName: Bundle.main.bundleIdentifier!
        )
    }
}
```

## Common Pitfalls

### 1. Forgetting iCloud Sync Settings

```swift
// Items sync to iCloud by default with certain accessibility levels
// Use ThisDeviceOnly variants to prevent syncing

// WRONG: May sync sensitive data to iCloud
query[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlocked

// CORRECT: Never syncs to iCloud
query[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
```

### 2. Not Handling Keychain Errors

```swift
// WRONG: Ignoring errors
func save(password: String) {
    let query = [/*...*/]
    SecItemAdd(query as CFDictionary, nil) // Status ignored!
}

// CORRECT: Handle all cases
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

### 3. Storing Large Data

```swift
// WRONG: Storing large files in Keychain
// Keychain is not designed for large data storage

// CORRECT: Store encryption key in Keychain, encrypted data in file
class SecureFileStorage {

    private let keychain = KeychainWrapper(service: "com.myapp.files")

    func saveSecurely(_ data: Data, filename: String) throws {
        // Generate or retrieve encryption key
        let key = try getOrCreateEncryptionKey()

        // Encrypt data
        let encryptedData = try encrypt(data, with: key)

        // Save encrypted data to file
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

## Performance Considerations

### Batch Operations

```swift
// Query multiple items at once
func getAllPasswords() throws -> [(account: String, password: String)] {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecMatchLimit as String: kSecMatchLimitAll,
        kSecReturnAttributes as String: true,
        kSecReturnData as String: true
    ]

    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)

    guard status == errSecSuccess,
          let items = result as? [[String: Any]] else {
        return []
    }

    return items.compactMap { item in
        guard let account = item[kSecAttrAccount as String] as? String,
              let data = item[kSecValueData as String] as? Data,
              let password = String(data: data, encoding: .utf8) else {
            return nil
        }
        return (account, password)
    }
}
```

## Real-World Scenarios

### OAuth Token Management

```swift
struct OAuthTokens: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: TimeInterval
    let tokenType: String
    let issuedAt: Date

    var isExpired: Bool {
        Date() > issuedAt.addingTimeInterval(expiresIn - 60) // 60s buffer
    }
}

class OAuthTokenManager {

    private let keychain = KeychainWrapper(service: "com.myapp.oauth")
    private let tokenKey = "oauth_tokens"

    func save(tokens: OAuthTokens) throws {
        let data = try JSONEncoder().encode(tokens)
        try keychain.save(data, for: tokenKey)
    }

    func getTokens() throws -> OAuthTokens? {
        guard let data = try? keychain.read(for: tokenKey) else {
            return nil
        }
        return try JSONDecoder().decode(OAuthTokens.self, from: data)
    }

    func getValidAccessToken() async throws -> String {
        guard var tokens = try getTokens() else {
            throw AuthError.notAuthenticated
        }

        if tokens.isExpired {
            tokens = try await refreshTokens(using: tokens.refreshToken)
            try save(tokens: tokens)
        }

        return tokens.accessToken
    }

    private func refreshTokens(using refreshToken: String) async throws -> OAuthTokens {
        // Make network request to refresh tokens
        // ...
        fatalError("Implement token refresh")
    }
}
```

## Interview Key Points

1. **What is the Keychain and when should you use it?**
   - Encrypted storage for sensitive data
   - Passwords, tokens, cryptographic keys
   - Data persists across app reinstalls

2. **What are the different Keychain item classes?**
   - GenericPassword, InternetPassword, Certificate, Key, Identity
   - Each optimized for specific use cases

3. **How does accessibility affect Keychain items?**
   - Controls when items can be accessed
   - ThisDeviceOnly variants prevent iCloud sync
   - Biometric options for additional security

4. **How do you share Keychain items between apps?**
   - Keychain Access Groups in entitlements
   - Same team ID required
   - Explicit access group in queries

5. **What's the difference between Keychain and UserDefaults?**
   - Keychain: encrypted, secure, persists across installs
   - UserDefaults: plain text, for non-sensitive preferences

## Further Reading

- [Apple Keychain Services Documentation](https://developer.apple.com/documentation/security/keychain_services)
- [Storing Keys in the Keychain](https://developer.apple.com/documentation/security/certificate_key_and_trust_services/keys/storing_keys_in_the_keychain)
- [Restricting Keychain Item Accessibility](https://developer.apple.com/documentation/security/keychain_services/keychain_items/restricting_keychain_item_accessibility)
- [Sharing Access to Keychain Items](https://developer.apple.com/documentation/security/keychain_services/keychain_items/sharing_access_to_keychain_items_among_a_collection_of_apps)
