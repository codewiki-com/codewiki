---
title: Session Management
description: Complete guide to PHP session management, sessions, cookies and user authentication
track: php
section: performance-security
difficulty: intermediate
tags:
  - PHP
  - Session
  - Cookie
  - Authentication
status: imported
origin: old/src/content/docs/php/sessions.en.md
divergence: 0.245
issues: []
legacy:
  category: PHP
  subcategory: Web Development
  order: 7
  lastUpdated: 2026-01-07
---

HTTP is a stateless protocol, meaning each request is independent and carries no memory of previous interactions. Sessions solve this fundamental limitation by allowing you to persist data across multiple page requests for the same user. We'll cover everything you need to know about PHP session management, from basic usage to advanced security techniques.

## Understanding Sessions

A session creates a unique identifier for each visitor, stored either in a cookie or passed via URL. This identifier links the user's browser to server-side data storage, enabling personalized experiences, shopping carts, user authentication, and more.

### How Sessions Work

1. When a session starts, PHP generates a unique session ID (typically 26-32 characters)
2. This ID is sent to the client as a cookie (by default named `PHPSESSID`)
3. On subsequent requests, the browser sends this cookie back to the server
4. PHP uses the session ID to retrieve the associated data from server storage

## Starting a Session

The `session_start()` function initializes a session or resumes an existing one. It must be called before any output is sent to the browser.

```php
<?php
// Must be called at the very beginning of the script
session_start();

// Now you can use session variables
$_SESSION['username'] = 'john_doe';
$_SESSION['user_id'] = 123;
$_SESSION['login_time'] = time();
```

### Common Pitfall: Headers Already Sent

```php
<?php
echo "Hello"; // Output sent to browser

session_start(); // Error: Cannot modify header information
```

To avoid this error, ensure `session_start()` is called before any HTML, whitespace, or `echo` statements.

### Configuring Session Start

You can pass configuration options directly to `session_start()`:

```php
<?php
session_start([
    'cookie_lifetime' => 86400,      // Cookie expires in 24 hours
    'cookie_secure' => true,          // Only send cookie over HTTPS
    'cookie_httponly' => true,        // Prevent JavaScript access
    'cookie_samesite' => 'Strict',    // CSRF protection
    'use_strict_mode' => true,        // Reject uninitialized session IDs
    'use_only_cookies' => true,       // Prevent session fixation via URL
]);
```

## Working with Session Variables

Session data is stored in the `$_SESSION` superglobal array. You can store strings, numbers, arrays, and even objects.

### Storing Data

```php
<?php
session_start();

// Store simple values
$_SESSION['user_name'] = 'Alice';
$_SESSION['user_role'] = 'admin';
$_SESSION['login_attempts'] = 0;

// Store arrays
$_SESSION['cart'] = [
    ['product_id' => 101, 'quantity' => 2, 'price' => 29.99],
    ['product_id' => 205, 'quantity' => 1, 'price' => 49.99],
];

// Store objects (class must be defined before session_start)
$_SESSION['user'] = new User($userId);
```

### Reading Data

```php
<?php
session_start();

// Check if a session variable exists
if (isset($_SESSION['user_name'])) {
    echo "Welcome back, " . htmlspecialchars($_SESSION['user_name']);
}

// Using null coalescing operator for default values
$role = $_SESSION['user_role'] ?? 'guest';
$cartCount = count($_SESSION['cart'] ?? []);
```

### Modifying and Removing Data

```php
<?php
session_start();

// Modify existing values
$_SESSION['login_attempts']++;
$_SESSION['last_activity'] = time();

// Remove a specific session variable
unset($_SESSION['temporary_data']);

// Clear all session variables (keeps session active)
$_SESSION = [];
```

## Destroying a Session

Properly destroying a session involves multiple steps to ensure complete cleanup:

```php
<?php
session_start();

// Step 1: Clear all session variables
$_SESSION = [];

// Step 2: Delete the session cookie
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}

// Step 3: Destroy the session data on the server
session_destroy();

// Redirect to prevent resubmission
header('Location: /login.php');
exit;
```

## Session Security

Session security is critical for protecting user data and preventing unauthorized access. Here are essential security practices.

### Regenerate Session ID

Regenerating the session ID prevents session fixation attacks, especially after privilege changes:

```php
<?php
session_start();

function loginUser(int $userId, string $username): void
{
    // Regenerate session ID to prevent session fixation
    session_regenerate_id(true); // true = delete old session file

    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
    $_SESSION['logged_in'] = true;
    $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'];
    $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];
    $_SESSION['created_at'] = time();
}
```

### Validate Session Integrity

Detect potential session hijacking by validating client fingerprints:

```php
<?php
session_start();

function validateSession(): bool
{
    // Check if session exists
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        return false;
    }

    // Validate IP address (be cautious with mobile users)
    if ($_SESSION['ip_address'] !== $_SERVER['REMOTE_ADDR']) {
        // Log potential hijacking attempt
        error_log("Session IP mismatch for user {$_SESSION['user_id']}");
        return false;
    }

    // Validate user agent
    if ($_SESSION['user_agent'] !== $_SERVER['HTTP_USER_AGENT']) {
        error_log("Session user agent mismatch for user {$_SESSION['user_id']}");
        return false;
    }

    return true;
}

if (!validateSession()) {
    session_destroy();
    header('Location: /login.php?error=session_invalid');
    exit;
}
```

### Session Timeout

Implement automatic session expiration for inactive users:

```php
<?php
session_start();

define('SESSION_TIMEOUT', 1800); // 30 minutes

function checkSessionTimeout(): void
{
    if (isset($_SESSION['last_activity'])) {
        $inactive_time = time() - $_SESSION['last_activity'];

        if ($inactive_time > SESSION_TIMEOUT) {
            // Session expired
            session_unset();
            session_destroy();
            header('Location: /login.php?error=session_expired');
            exit;
        }
    }

    // Update last activity time
    $_SESSION['last_activity'] = time();
}

// Call on every protected page
checkSessionTimeout();
```

### Secure Session Configuration

Configure PHP for secure sessions in `php.ini` or at runtime:

```php
<?php
// Before session_start()
ini_set('session.cookie_httponly', 1);    // Prevent XSS access to cookie
ini_set('session.cookie_secure', 1);       // HTTPS only
ini_set('session.use_only_cookies', 1);    // Prevent session ID in URLs
ini_set('session.use_strict_mode', 1);     // Reject uninitialized IDs
ini_set('session.cookie_samesite', 'Lax'); // CSRF protection

// Use stronger session ID entropy
ini_set('session.sid_length', 48);
ini_set('session.sid_bits_per_character', 6);

session_start();
```

## Working with Cookies

Cookies are small pieces of data stored in the user's browser. While sessions use cookies for the session ID, you can also set custom cookies for various purposes.

### Setting Cookies

```php
<?php
// Basic cookie (expires when browser closes)
setcookie('theme', 'dark');

// Cookie with expiration (7 days)
setcookie('language', 'en', time() + (7 * 24 * 60 * 60));

// Secure cookie with all options
setcookie('user_preference', 'value', [
    'expires' => time() + 86400 * 30,  // 30 days
    'path' => '/',                      // Available across entire site
    'domain' => '.example.com',         // Include subdomains
    'secure' => true,                   // HTTPS only
    'httponly' => true,                 // No JavaScript access
    'samesite' => 'Strict',             // CSRF protection
]);
```

### Reading Cookies

```php
<?php
// Check if cookie exists
if (isset($_COOKIE['theme'])) {
    $theme = $_COOKIE['theme'];
} else {
    $theme = 'light'; // Default value
}

// Using null coalescing
$language = $_COOKIE['language'] ?? 'en';
```

### Deleting Cookies

```php
<?php
// Set expiration to a time in the past
setcookie('theme', '', time() - 3600);

// With all original parameters for proper deletion
setcookie('user_preference', '', [
    'expires' => time() - 3600,
    'path' => '/',
    'domain' => '.example.com',
    'secure' => true,
    'httponly' => true,
]);
```

## Implementing "Remember Me" Functionality

A secure "remember me" feature requires careful implementation to avoid security vulnerabilities.

### Database Schema

```sql
CREATE TABLE auth_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    selector CHAR(24) NOT NULL,
    hashed_validator CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_selector (selector),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_expires (expires_at)
);
```

### Creating a Remember Me Token

```php
<?php
class RememberMe
{
    private PDO $db;
    private const COOKIE_NAME = 'remember_me';
    private const EXPIRY_DAYS = 30;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function createToken(int $userId): void
    {
        // Generate cryptographically secure tokens
        $selector = bin2hex(random_bytes(12));  // 24 chars
        $validator = bin2hex(random_bytes(32)); // 64 chars

        $expires = new DateTime('+' . self::EXPIRY_DAYS . ' days');

        // Store hashed validator in database
        $stmt = $this->db->prepare('
            INSERT INTO auth_tokens (user_id, selector, hashed_validator, expires_at)
            VALUES (:user_id, :selector, :validator, :expires)
        ');

        $stmt->execute([
            'user_id' => $userId,
            'selector' => $selector,
            'validator' => hash('sha256', $validator),
            'expires' => $expires->format('Y-m-d H:i:s'),
        ]);

        // Set cookie with selector:validator
        $cookieValue = $selector . ':' . $validator;

        setcookie(self::COOKIE_NAME, $cookieValue, [
            'expires' => $expires->getTimestamp(),
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    public function validateToken(): ?int
    {
        if (!isset($_COOKIE[self::COOKIE_NAME])) {
            return null;
        }

        $parts = explode(':', $_COOKIE[self::COOKIE_NAME]);
        if (count($parts) !== 2) {
            $this->clearCookie();
            return null;
        }

        [$selector, $validator] = $parts;

        // Find token by selector
        $stmt = $this->db->prepare('
            SELECT id, user_id, hashed_validator, expires_at
            FROM auth_tokens
            WHERE selector = :selector
        ');

        $stmt->execute(['selector' => $selector]);
        $token = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$token) {
            $this->clearCookie();
            return null;
        }

        // Check expiration
        if (new DateTime($token['expires_at']) < new DateTime()) {
            $this->deleteToken($token['id']);
            $this->clearCookie();
            return null;
        }

        // Validate using timing-safe comparison
        if (!hash_equals($token['hashed_validator'], hash('sha256', $validator))) {
            // Possible token theft - delete all user tokens
            $this->deleteAllUserTokens($token['user_id']);
            $this->clearCookie();
            return null;
        }

        // Token is valid - rotate it for security
        $this->deleteToken($token['id']);
        $this->createToken($token['user_id']);

        return $token['user_id'];
    }

    public function deleteToken(int $tokenId): void
    {
        $stmt = $this->db->prepare('DELETE FROM auth_tokens WHERE id = :id');
        $stmt->execute(['id' => $tokenId]);
    }

    public function deleteAllUserTokens(int $userId): void
    {
        $stmt = $this->db->prepare('DELETE FROM auth_tokens WHERE user_id = :user_id');
        $stmt->execute(['user_id' => $userId]);
    }

    private function clearCookie(): void
    {
        setcookie(self::COOKIE_NAME, '', [
            'expires' => time() - 3600,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
        ]);
    }
}
```

### Using Remember Me in Login Flow

```php
<?php
session_start();

$db = new PDO('mysql:host=localhost;dbname=myapp', 'user', 'password');
$rememberMe = new RememberMe($db);

// Check for existing session
if (isset($_SESSION['user_id'])) {
    // User is logged in
    $userId = $_SESSION['user_id'];
} elseif ($userId = $rememberMe->validateToken()) {
    // Valid remember me token - create session
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
    $_SESSION['logged_in'] = true;
} else {
    // Not logged in
    header('Location: /login.php');
    exit;
}

// Login form processing
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $remember = isset($_POST['remember_me']);

    // Authenticate user (simplified)
    $user = authenticateUser($username, $password);

    if ($user) {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['logged_in'] = true;

        if ($remember) {
            $rememberMe->createToken($user['id']);
        }

        header('Location: /dashboard.php');
        exit;
    }
}
```

## Custom Session Handlers

PHP allows you to store session data in custom backends like databases, Redis, or Memcached using the `SessionHandlerInterface`.

### Database Session Handler

```php
<?php
class DatabaseSessionHandler implements SessionHandlerInterface
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function open(string $path, string $name): bool
    {
        return true;
    }

    public function close(): bool
    {
        return true;
    }

    public function read(string $id): string|false
    {
        $stmt = $this->db->prepare('
            SELECT data FROM sessions
            WHERE id = :id AND expires_at > NOW()
        ');

        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $row['data'] : '';
    }

    public function write(string $id, string $data): bool
    {
        $expires = date('Y-m-d H:i:s', time() + (int) ini_get('session.gc_maxlifetime'));

        $stmt = $this->db->prepare('
            INSERT INTO sessions (id, data, expires_at)
            VALUES (:id, :data, :expires)
            ON DUPLICATE KEY UPDATE
                data = VALUES(data),
                expires_at = VALUES(expires_at)
        ');

        return $stmt->execute([
            'id' => $id,
            'data' => $data,
            'expires' => $expires,
        ]);
    }

    public function destroy(string $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM sessions WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function gc(int $max_lifetime): int|false
    {
        $stmt = $this->db->prepare('DELETE FROM sessions WHERE expires_at < NOW()');
        $stmt->execute();
        return $stmt->rowCount();
    }
}

// Required database table
/*
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;
*/

// Usage
$db = new PDO('mysql:host=localhost;dbname=myapp', 'user', 'password');
$handler = new DatabaseSessionHandler($db);

session_set_save_handler($handler, true);
session_start();
```

### Redis Session Handler

```php
<?php
class RedisSessionHandler implements SessionHandlerInterface
{
    private Redis $redis;
    private int $ttl;
    private string $prefix = 'session:';

    public function __construct(Redis $redis, int $ttl = 1800)
    {
        $this->redis = $redis;
        $this->ttl = $ttl;
    }

    public function open(string $path, string $name): bool
    {
        return true;
    }

    public function close(): bool
    {
        return true;
    }

    public function read(string $id): string|false
    {
        $data = $this->redis->get($this->prefix . $id);
        return $data !== false ? $data : '';
    }

    public function write(string $id, string $data): bool
    {
        return $this->redis->setex(
            $this->prefix . $id,
            $this->ttl,
            $data
        );
    }

    public function destroy(string $id): bool
    {
        $this->redis->del($this->prefix . $id);
        return true;
    }

    public function gc(int $max_lifetime): int|false
    {
        // Redis handles expiration automatically
        return 0;
    }
}

// Usage
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);

$handler = new RedisSessionHandler($redis);
session_set_save_handler($handler, true);
session_start();
```

## Complete Authentication Example

The following comprehensive example brings together sessions, security, and remember me functionality:

```php
<?php
// auth.php - Authentication class

class Auth
{
    private PDO $db;
    private RememberMe $rememberMe;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->rememberMe = new RememberMe($db);
    }

    public function login(string $email, string $password, bool $remember = false): bool
    {
        $stmt = $this->db->prepare('
            SELECT id, password_hash, is_active
            FROM users
            WHERE email = :email
        ');

        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !$user['is_active']) {
            return false;
        }

        if (!password_verify($password, $user['password_hash'])) {
            $this->logFailedAttempt($email);
            return false;
        }

        // Check if password needs rehashing
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            $this->updatePasswordHash($user['id'], $password);
        }

        $this->createSession($user['id']);

        if ($remember) {
            $this->rememberMe->createToken($user['id']);
        }

        $this->logSuccessfulLogin($user['id']);

        return true;
    }

    public function logout(): void
    {
        if (isset($_SESSION['user_id'])) {
            $this->rememberMe->deleteAllUserTokens($_SESSION['user_id']);
        }

        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();
    }

    public function check(): bool
    {
        // Check session first
        if (isset($_SESSION['user_id']) && $this->validateSession()) {
            return true;
        }

        // Try remember me token
        $userId = $this->rememberMe->validateToken();
        if ($userId) {
            $this->createSession($userId);
            return true;
        }

        return false;
    }

    public function user(): ?array
    {
        if (!isset($_SESSION['user_id'])) {
            return null;
        }

        $stmt = $this->db->prepare('
            SELECT id, email, name, role, created_at
            FROM users
            WHERE id = :id AND is_active = 1
        ');

        $stmt->execute(['id' => $_SESSION['user_id']]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    private function createSession(int $userId): void
    {
        session_regenerate_id(true);

        $_SESSION['user_id'] = $userId;
        $_SESSION['logged_in'] = true;
        $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'];
        $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];
        $_SESSION['created_at'] = time();
        $_SESSION['last_activity'] = time();
    }

    private function validateSession(): bool
    {
        // Check for session timeout (30 minutes)
        if (time() - ($_SESSION['last_activity'] ?? 0) > 1800) {
            return false;
        }

        // Validate fingerprint
        if ($_SESSION['user_agent'] !== $_SERVER['HTTP_USER_AGENT']) {
            return false;
        }

        $_SESSION['last_activity'] = time();

        // Regenerate session ID periodically (every 15 minutes)
        if (time() - ($_SESSION['created_at'] ?? 0) > 900) {
            session_regenerate_id(true);
            $_SESSION['created_at'] = time();
        }

        return true;
    }

    private function logFailedAttempt(string $email): void
    {
        $stmt = $this->db->prepare('
            INSERT INTO login_attempts (email, ip_address, attempted_at)
            VALUES (:email, :ip, NOW())
        ');

        $stmt->execute([
            'email' => $email,
            'ip' => $_SERVER['REMOTE_ADDR'],
        ]);
    }

    private function logSuccessfulLogin(int $userId): void
    {
        $stmt = $this->db->prepare('
            UPDATE users
            SET last_login_at = NOW(), last_login_ip = :ip
            WHERE id = :id
        ');

        $stmt->execute([
            'id' => $userId,
            'ip' => $_SERVER['REMOTE_ADDR'],
        ]);
    }

    private function updatePasswordHash(int $userId, string $password): void
    {
        $stmt = $this->db->prepare('
            UPDATE users SET password_hash = :hash WHERE id = :id
        ');

        $stmt->execute([
            'id' => $userId,
            'hash' => password_hash($password, PASSWORD_DEFAULT),
        ]);
    }
}
```

### Usage in Application

```php
<?php
// bootstrap.php
session_start([
    'cookie_lifetime' => 0,
    'cookie_secure' => true,
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
    'use_strict_mode' => true,
]);

$db = new PDO(
    'mysql:host=localhost;dbname=myapp;charset=utf8mb4',
    'user',
    'password',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$auth = new Auth($db);

// login.php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'] ?? '';
    $remember = isset($_POST['remember']);

    if ($auth->login($email, $password, $remember)) {
        header('Location: /dashboard.php');
        exit;
    }

    $error = 'Invalid email or password';
}

// dashboard.php (protected page)
if (!$auth->check()) {
    header('Location: /login.php');
    exit;
}

$user = $auth->user();
echo "Welcome, " . htmlspecialchars($user['name']);

// logout.php
$auth->logout();
header('Location: /login.php');
exit;
```

## Best Practices Summary

1. **Always use `session_start()` before any output** - Place it at the very beginning of your scripts

2. **Regenerate session IDs** - After login, logout, and privilege changes to prevent session fixation

3. **Use secure cookie settings** - Enable `httponly`, `secure`, and `samesite` attributes

4. **Implement session timeouts** - Expire inactive sessions to limit exposure window

5. **Validate session integrity** - Check user agent and optionally IP address

6. **Store minimal data in sessions** - Keep only essential information; fetch sensitive data from the database when needed

7. **Use HTTPS exclusively** - Never transmit session cookies over unencrypted connections

8. **Implement proper logout** - Clear session data, delete cookies, and destroy the session

9. **For "Remember Me" functionality** - Use secure tokens with selectors, store hashed validators, and rotate tokens on use

10. **Consider custom session handlers** - Use Redis or database storage for better scalability and control

## Conclusion

Proper session management is fundamental to building secure PHP applications. By understanding how sessions work and implementing the security measures outlined in this guide, you can create robust authentication systems that protect your users' data. Always stay updated on security best practices and regularly audit your session handling code for potential vulnerabilities.
