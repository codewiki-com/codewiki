---
title: Security Best Practices
description: Complete guide to PHP security, SQL injection, XSS, CSRF protection and password handling
track: php
section: performance-security
difficulty: intermediate
tags:
  - PHP
  - Security
  - SQL Injection
  - XSS
status: imported
origin: old/src/content/docs/php/security.en.md
divergence: 0.337
issues: []
legacy:
  category: PHP
  subcategory: Security
  order: 6
  lastUpdated: 2026-01-07
---

Security is one of the most critical aspects of web application development. PHP applications are frequent targets for attackers due to the language's widespread use. This comprehensive guide covers essential security practices every PHP developer must implement to protect their applications and users.

## Understanding the Security Mindset

Before diving into specific techniques, it's crucial to adopt the right mindset: **never trust user input**. Every piece of data coming from external sources (forms, URLs, cookies, headers, APIs) must be treated as potentially malicious.

The core principles of application security include:
- **Defense in Depth**: Apply multiple layers of security
- **Principle of Least Privilege**: Grant only the minimum permissions necessary
- **Fail Securely**: When errors occur, fail in a way that doesn't expose sensitive information
- **Keep It Simple**: Complex code is harder to secure

## SQL Injection Prevention

SQL injection remains one of the most dangerous and common vulnerabilities in web applications. It occurs when user input is incorrectly included in SQL queries, allowing attackers to manipulate database operations.

### The Vulnerable Pattern

Here's an example of code vulnerable to SQL injection:

```php
// NEVER DO THIS - Vulnerable to SQL injection!
$username = $_POST['username'];
$password = $_POST['password'];

$query = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
$result = mysqli_query($connection, $query);
```

An attacker could input `admin' OR '1'='1' --` as the username, transforming the query into:

```sql
SELECT * FROM users WHERE username = 'admin' OR '1'='1' --' AND password = ''
```

This would bypass authentication entirely.

### Solution 1: Prepared Statements with PDO

PDO (PHP Data Objects) provides the cleanest approach to database security:

```php
class DatabaseConnection
{
    private PDO $pdo;

    public function __construct(string $dsn, string $username, string $password)
    {
        $this->pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false, // Use native prepared statements
        ]);
    }

    public function getConnection(): PDO
    {
        return $this->pdo;
    }
}

class UserRepository
{
    private PDO $pdo;

    public function __construct(DatabaseConnection $db)
    {
        $this->pdo = $db->getConnection();
    }

    public function findByCredentials(string $username, string $password): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, username, password_hash FROM users WHERE username = :username'
        );
        $stmt->execute(['username' => $username]);

        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']); // Never expose password hashes
            return $user;
        }

        return null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT id, username, email FROM users WHERE id = :id');
        $stmt->execute(['id' => $id]);

        return $stmt->fetch() ?: null;
    }

    public function searchUsers(string $term, int $limit = 10): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, username FROM users WHERE username LIKE :term LIMIT :limit'
        );
        $stmt->bindValue('term', '%' . $term . '%', PDO::PARAM_STR);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
```

### Solution 2: Prepared Statements with MySQLi

If you prefer MySQLi:

```php
class UserService
{
    private mysqli $connection;

    public function __construct(mysqli $connection)
    {
        $this->connection = $connection;
    }

    public function getUserByEmail(string $email): ?array
    {
        $stmt = $this->connection->prepare(
            'SELECT id, username, email FROM users WHERE email = ?'
        );

        if ($stmt === false) {
            throw new RuntimeException('Prepare failed: ' . $this->connection->error);
        }

        $stmt->bind_param('s', $email);
        $stmt->execute();

        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        $stmt->close();

        return $user ?: null;
    }

    public function createUser(string $username, string $email, string $passwordHash): int
    {
        $stmt = $this->connection->prepare(
            'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())'
        );

        $stmt->bind_param('sss', $username, $email, $passwordHash);
        $stmt->execute();

        $insertId = $stmt->insert_id;
        $stmt->close();

        return $insertId;
    }
}
```

### Dynamic Query Building Safely

When you need dynamic queries, use whitelisting:

```php
class ProductRepository
{
    private PDO $pdo;

    private const ALLOWED_SORT_COLUMNS = ['name', 'price', 'created_at', 'stock'];
    private const ALLOWED_SORT_DIRECTIONS = ['ASC', 'DESC'];

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findProducts(
        ?string $category = null,
        ?float $minPrice = null,
        ?float $maxPrice = null,
        string $sortBy = 'name',
        string $sortDirection = 'ASC',
        int $limit = 20,
        int $offset = 0
    ): array {
        // Whitelist validation for column names (cannot be parameterized)
        if (!in_array($sortBy, self::ALLOWED_SORT_COLUMNS, true)) {
            $sortBy = 'name';
        }

        if (!in_array(strtoupper($sortDirection), self::ALLOWED_SORT_DIRECTIONS, true)) {
            $sortDirection = 'ASC';
        }

        $conditions = [];
        $params = [];

        if ($category !== null) {
            $conditions[] = 'category = :category';
            $params['category'] = $category;
        }

        if ($minPrice !== null) {
            $conditions[] = 'price >= :min_price';
            $params['min_price'] = $minPrice;
        }

        if ($maxPrice !== null) {
            $conditions[] = 'price <= :max_price';
            $params['max_price'] = $maxPrice;
        }

        $sql = 'SELECT * FROM products';

        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        // Column names are whitelisted, so safe to interpolate
        $sql .= " ORDER BY {$sortBy} {$sortDirection}";
        $sql .= ' LIMIT :limit OFFSET :offset';

        $stmt = $this->pdo->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);

        $stmt->execute();

        return $stmt->fetchAll();
    }
}
```

## Cross-Site Scripting (XSS) Prevention

XSS attacks occur when malicious scripts are injected into web pages viewed by other users. There are three main types:
- **Stored XSS**: Malicious script is permanently stored on the target server
- **Reflected XSS**: Script is reflected off a web server in error messages or search results
- **DOM-based XSS**: The vulnerability exists in client-side code

### Output Encoding

Always encode data before displaying it:

```php
class OutputEncoder
{
    /**
     * Encode for HTML context
     */
    public static function html(?string $data): string
    {
        if ($data === null) {
            return '';
        }

        return htmlspecialchars($data, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * Encode for use in JavaScript strings
     */
    public static function javascript(?string $data): string
    {
        if ($data === null) {
            return '';
        }

        return json_encode($data, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);
    }

    /**
     * Encode for URL parameters
     */
    public static function url(?string $data): string
    {
        if ($data === null) {
            return '';
        }

        return rawurlencode($data);
    }

    /**
     * Encode for CSS context
     */
    public static function css(?string $data): string
    {
        if ($data === null) {
            return '';
        }

        // Remove any characters that could break out of CSS context
        return preg_replace('/[^a-zA-Z0-9\-_]/', '', $data);
    }
}

// Usage in templates
$username = $_GET['username'] ?? '';
$searchTerm = $_GET['q'] ?? '';
?>

<!-- HTML context -->
<p>Welcome, <?= OutputEncoder::html($username) ?></p>

<!-- Attribute context -->
<input type="text" value="<?= OutputEncoder::html($searchTerm) ?>">

<!-- URL context -->
<a href="/search?q=<?= OutputEncoder::url($searchTerm) ?>">Search again</a>

<!-- JavaScript context -->
<script>
    const userData = <?= OutputEncoder::javascript($username) ?>;
    console.log('User:', userData);
</script>
```

### Content Security Policy (CSP)

Implement CSP headers to prevent XSS even if encoding fails:

```php
class SecurityHeaders
{
    public static function apply(): void
    {
        // Content Security Policy
        $csp = implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'strict-dynamic'",
            "style-src 'self' 'unsafe-inline'", // Consider using nonces for inline styles
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]);

        header("Content-Security-Policy: {$csp}");

        // Prevent MIME type sniffing
        header('X-Content-Type-Options: nosniff');

        // Enable XSS filter in older browsers
        header('X-XSS-Protection: 1; mode=block');

        // Prevent clickjacking
        header('X-Frame-Options: DENY');

        // Enforce HTTPS
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

        // Control referrer information
        header('Referrer-Policy: strict-origin-when-cross-origin');

        // Permissions policy
        header("Permissions-Policy: geolocation=(), microphone=(), camera=()");
    }
}

// Call early in your application bootstrap
SecurityHeaders::apply();
```

### Using Nonces for Inline Scripts

For applications that require inline scripts:

```php
class NonceGenerator
{
    private static ?string $nonce = null;

    public static function generate(): string
    {
        if (self::$nonce === null) {
            self::$nonce = base64_encode(random_bytes(16));
        }

        return self::$nonce;
    }

    public static function getScriptAttribute(): string
    {
        return 'nonce="' . self::generate() . '"';
    }
}

// In your header
$nonce = NonceGenerator::generate();
$csp = "script-src 'self' 'nonce-{$nonce}'";
header("Content-Security-Policy: {$csp}");
?>

<!-- In your HTML -->
<script <?= NonceGenerator::getScriptAttribute() ?>>
    // This inline script will execute because it has the correct nonce
    console.log('Secure inline script');
</script>
```

### Sanitizing HTML Input

When you must accept HTML content (like rich text editors):

```php
// Using HTML Purifier library
use HTMLPurifier;
use HTMLPurifier_Config;

class HtmlSanitizer
{
    private HTMLPurifier $purifier;

    public function __construct()
    {
        $config = HTMLPurifier_Config::createDefault();
        $config->set('HTML.Allowed', 'p,br,b,i,u,a[href],ul,ol,li,blockquote,h2,h3,h4');
        $config->set('URI.AllowedSchemes', ['http' => true, 'https' => true, 'mailto' => true]);
        $config->set('Attr.AllowedFrameTargets', ['_blank']);
        $config->set('HTML.Nofollow', true);
        $config->set('Cache.SerializerPath', '/tmp/htmlpurifier');

        $this->purifier = new HTMLPurifier($config);
    }

    public function sanitize(string $dirtyHtml): string
    {
        return $this->purifier->purify($dirtyHtml);
    }
}

// Usage
$sanitizer = new HtmlSanitizer();
$userContent = $_POST['content'];
$cleanHtml = $sanitizer->sanitize($userContent);
```

## CSRF (Cross-Site Request Forgery) Protection

CSRF attacks trick authenticated users into performing unintended actions. Protection involves validating that requests originate from your own application.

### Token-Based CSRF Protection

```php
class CsrfProtection
{
    private const TOKEN_NAME = 'csrf_token';
    private const TOKEN_LENGTH = 32;

    public static function generateToken(): string
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            throw new RuntimeException('Session must be started before generating CSRF token');
        }

        $token = bin2hex(random_bytes(self::TOKEN_LENGTH));
        $_SESSION[self::TOKEN_NAME] = $token;
        $_SESSION[self::TOKEN_NAME . '_time'] = time();

        return $token;
    }

    public static function getToken(): string
    {
        if (!isset($_SESSION[self::TOKEN_NAME])) {
            return self::generateToken();
        }

        return $_SESSION[self::TOKEN_NAME];
    }

    public static function validateToken(?string $token, int $maxAge = 3600): bool
    {
        if ($token === null || !isset($_SESSION[self::TOKEN_NAME])) {
            return false;
        }

        // Check token age
        $tokenTime = $_SESSION[self::TOKEN_NAME . '_time'] ?? 0;
        if (time() - $tokenTime > $maxAge) {
            self::invalidateToken();
            return false;
        }

        // Use timing-safe comparison
        return hash_equals($_SESSION[self::TOKEN_NAME], $token);
    }

    public static function invalidateToken(): void
    {
        unset($_SESSION[self::TOKEN_NAME], $_SESSION[self::TOKEN_NAME . '_time']);
    }

    public static function getHiddenInput(): string
    {
        $token = htmlspecialchars(self::getToken(), ENT_QUOTES, 'UTF-8');
        return '<input type="hidden" name="' . self::TOKEN_NAME . '" value="' . $token . '">';
    }

    public static function getMetaTag(): string
    {
        $token = htmlspecialchars(self::getToken(), ENT_QUOTES, 'UTF-8');
        return '<meta name="csrf-token" content="' . $token . '">';
    }
}

// Middleware for validating CSRF tokens
class CsrfMiddleware
{
    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    public function handle(callable $next): mixed
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        // Skip validation for safe methods
        if (in_array($method, self::SAFE_METHODS, true)) {
            return $next();
        }

        // Get token from form data or header
        $token = $_POST['csrf_token']
            ?? $_SERVER['HTTP_X_CSRF_TOKEN']
            ?? null;

        if (!CsrfProtection::validateToken($token)) {
            http_response_code(403);
            throw new RuntimeException('CSRF token validation failed');
        }

        return $next();
    }
}
```

### Using CSRF Protection in Forms

```php
session_start();
?>
<!DOCTYPE html>
<html>
<head>
    <?= CsrfProtection::getMetaTag() ?>
</head>
<body>
    <form method="POST" action="/account/update">
        <?= CsrfProtection::getHiddenInput() ?>

        <label for="email">Email:</label>
        <input type="email" name="email" id="email" required>

        <button type="submit">Update Email</button>
    </form>

    <script>
        // For AJAX requests, include the token in headers
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

        fetch('/api/endpoint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ data: 'value' })
        });
    </script>
</body>
</html>
```

### Double Submit Cookie Pattern

An alternative approach that doesn't require server-side storage:

```php
class DoubleSubmitCsrf
{
    private const COOKIE_NAME = 'csrf_cookie';
    private const TOKEN_LENGTH = 32;

    public static function setToken(): string
    {
        $token = bin2hex(random_bytes(self::TOKEN_LENGTH));

        setcookie(self::COOKIE_NAME, $token, [
            'expires' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => true,
            'httponly' => false, // Must be readable by JavaScript
            'samesite' => 'Strict',
        ]);

        return $token;
    }

    public static function validate(): bool
    {
        $cookieToken = $_COOKIE[self::COOKIE_NAME] ?? null;
        $headerToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? null;

        if ($cookieToken === null || $headerToken === null) {
            return false;
        }

        return hash_equals($cookieToken, $headerToken);
    }
}
```

## Password Handling

Proper password handling is essential for protecting user accounts.

### Password Hashing

Always use PHP's built-in password functions:

```php
class PasswordService
{
    /**
     * Hash a password for storage
     */
    public function hash(string $password): string
    {
        // PASSWORD_DEFAULT uses bcrypt, but will automatically upgrade
        // to stronger algorithms as they become available
        return password_hash($password, PASSWORD_DEFAULT, [
            'cost' => 12, // Adjust based on server capability
        ]);
    }

    /**
     * Verify a password against a hash
     */
    public function verify(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Check if a hash needs to be rehashed (e.g., after algorithm upgrade)
     */
    public function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, PASSWORD_DEFAULT, [
            'cost' => 12,
        ]);
    }
}

class AuthenticationService
{
    private PDO $pdo;
    private PasswordService $passwordService;

    public function __construct(PDO $pdo, PasswordService $passwordService)
    {
        $this->pdo = $pdo;
        $this->passwordService = $passwordService;
    }

    public function authenticate(string $username, string $password): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, username, email, password_hash FROM users WHERE username = :username'
        );
        $stmt->execute(['username' => $username]);
        $user = $stmt->fetch();

        if (!$user) {
            // Perform dummy hash to prevent timing attacks
            $this->passwordService->hash('dummy_password');
            return null;
        }

        if (!$this->passwordService->verify($password, $user['password_hash'])) {
            return null;
        }

        // Rehash if needed (algorithm or cost upgrade)
        if ($this->passwordService->needsRehash($user['password_hash'])) {
            $this->updatePasswordHash($user['id'], $password);
        }

        unset($user['password_hash']);
        return $user;
    }

    private function updatePasswordHash(int $userId, string $password): void
    {
        $newHash = $this->passwordService->hash($password);

        $stmt = $this->pdo->prepare(
            'UPDATE users SET password_hash = :hash WHERE id = :id'
        );
        $stmt->execute(['hash' => $newHash, 'id' => $userId]);
    }
}
```

### Password Strength Validation

```php
class PasswordValidator
{
    private int $minLength = 12;
    private bool $requireUppercase = true;
    private bool $requireLowercase = true;
    private bool $requireDigit = true;
    private bool $requireSpecial = true;

    private array $commonPasswords = [
        'password123', '123456789', 'qwerty123', 'letmein123',
        // In production, load from a comprehensive list
    ];

    public function validate(string $password, ?string $username = null): array
    {
        $errors = [];

        if (strlen($password) < $this->minLength) {
            $errors[] = "Password must be at least {$this->minLength} characters long";
        }

        if ($this->requireUppercase && !preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter';
        }

        if ($this->requireLowercase && !preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter';
        }

        if ($this->requireDigit && !preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain at least one digit';
        }

        if ($this->requireSpecial && !preg_match('/[^a-zA-Z0-9]/', $password)) {
            $errors[] = 'Password must contain at least one special character';
        }

        if ($username !== null && stripos($password, $username) !== false) {
            $errors[] = 'Password cannot contain your username';
        }

        if (in_array(strtolower($password), $this->commonPasswords, true)) {
            $errors[] = 'This password is too common';
        }

        return $errors;
    }

    public function isValid(string $password, ?string $username = null): bool
    {
        return empty($this->validate($password, $username));
    }
}
```

### Secure Password Reset

```php
class PasswordResetService
{
    private PDO $pdo;
    private PasswordService $passwordService;

    private const TOKEN_EXPIRY = 3600; // 1 hour

    public function __construct(PDO $pdo, PasswordService $passwordService)
    {
        $this->pdo = $pdo;
        $this->passwordService = $passwordService;
    }

    public function createResetToken(string $email): ?string
    {
        // Find user
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = :email');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if (!$user) {
            // Return null but don't reveal whether email exists
            return null;
        }

        // Generate secure token
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expiresAt = date('Y-m-d H:i:s', time() + self::TOKEN_EXPIRY);

        // Invalidate any existing tokens for this user
        $stmt = $this->pdo->prepare(
            'DELETE FROM password_resets WHERE user_id = :user_id'
        );
        $stmt->execute(['user_id' => $user['id']]);

        // Store hashed token
        $stmt = $this->pdo->prepare(
            'INSERT INTO password_resets (user_id, token_hash, expires_at)
             VALUES (:user_id, :token_hash, :expires_at)'
        );
        $stmt->execute([
            'user_id' => $user['id'],
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
        ]);

        return $token; // Send this token in the reset email
    }

    public function resetPassword(string $token, string $newPassword): bool
    {
        $tokenHash = hash('sha256', $token);

        // Find valid token
        $stmt = $this->pdo->prepare(
            'SELECT user_id FROM password_resets
             WHERE token_hash = :token_hash AND expires_at > NOW()'
        );
        $stmt->execute(['token_hash' => $tokenHash]);
        $reset = $stmt->fetch();

        if (!$reset) {
            return false;
        }

        // Update password
        $passwordHash = $this->passwordService->hash($newPassword);

        $stmt = $this->pdo->prepare(
            'UPDATE users SET password_hash = :hash WHERE id = :id'
        );
        $stmt->execute(['hash' => $passwordHash, 'id' => $reset['user_id']]);

        // Delete used token
        $stmt = $this->pdo->prepare(
            'DELETE FROM password_resets WHERE user_id = :user_id'
        );
        $stmt->execute(['user_id' => $reset['user_id']]);

        return true;
    }
}
```

## Input Validation and Sanitization

Proper input validation prevents many security vulnerabilities and ensures data integrity.

### Comprehensive Input Validator

```php
class InputValidator
{
    private array $errors = [];
    private array $validated = [];

    public function validate(array $rules, array $data): bool
    {
        $this->errors = [];
        $this->validated = [];

        foreach ($rules as $field => $ruleString) {
            $value = $data[$field] ?? null;
            $fieldRules = explode('|', $ruleString);

            foreach ($fieldRules as $rule) {
                $params = [];

                if (str_contains($rule, ':')) {
                    [$rule, $paramString] = explode(':', $rule, 2);
                    $params = explode(',', $paramString);
                }

                $method = 'validate' . ucfirst($rule);

                if (!method_exists($this, $method)) {
                    throw new InvalidArgumentException("Unknown validation rule: {$rule}");
                }

                $result = $this->$method($field, $value, $params, $data);

                if ($result === false) {
                    break; // Stop validating this field on first error
                }
            }

            if (!isset($this->errors[$field])) {
                $this->validated[$field] = $value;
            }
        }

        return empty($this->errors);
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getValidated(): array
    {
        return $this->validated;
    }

    protected function validateRequired(string $field, mixed $value): bool
    {
        if ($value === null || $value === '' || $value === []) {
            $this->errors[$field][] = "{$field} is required";
            return false;
        }
        return true;
    }

    protected function validateEmail(string $field, mixed $value): bool
    {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field][] = "{$field} must be a valid email address";
            return false;
        }
        return true;
    }

    protected function validateMin(string $field, mixed $value, array $params): bool
    {
        $min = (int) ($params[0] ?? 0);

        if (is_string($value) && strlen($value) < $min) {
            $this->errors[$field][] = "{$field} must be at least {$min} characters";
            return false;
        }

        if (is_numeric($value) && $value < $min) {
            $this->errors[$field][] = "{$field} must be at least {$min}";
            return false;
        }

        return true;
    }

    protected function validateMax(string $field, mixed $value, array $params): bool
    {
        $max = (int) ($params[0] ?? PHP_INT_MAX);

        if (is_string($value) && strlen($value) > $max) {
            $this->errors[$field][] = "{$field} must not exceed {$max} characters";
            return false;
        }

        if (is_numeric($value) && $value > $max) {
            $this->errors[$field][] = "{$field} must not exceed {$max}";
            return false;
        }

        return true;
    }

    protected function validateNumeric(string $field, mixed $value): bool
    {
        if ($value !== null && $value !== '' && !is_numeric($value)) {
            $this->errors[$field][] = "{$field} must be numeric";
            return false;
        }
        return true;
    }

    protected function validateInteger(string $field, mixed $value): bool
    {
        if ($value !== null && $value !== '' && filter_var($value, FILTER_VALIDATE_INT) === false) {
            $this->errors[$field][] = "{$field} must be an integer";
            return false;
        }
        return true;
    }

    protected function validateAlpha(string $field, mixed $value): bool
    {
        if ($value !== null && $value !== '' && !ctype_alpha($value)) {
            $this->errors[$field][] = "{$field} must contain only letters";
            return false;
        }
        return true;
    }

    protected function validateAlphanumeric(string $field, mixed $value): bool
    {
        if ($value !== null && $value !== '' && !ctype_alnum($value)) {
            $this->errors[$field][] = "{$field} must contain only letters and numbers";
            return false;
        }
        return true;
    }

    protected function validateUrl(string $field, mixed $value): bool
    {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_URL)) {
            $this->errors[$field][] = "{$field} must be a valid URL";
            return false;
        }
        return true;
    }

    protected function validateRegex(string $field, mixed $value, array $params): bool
    {
        $pattern = $params[0] ?? '';

        if ($value !== null && $value !== '' && !preg_match($pattern, $value)) {
            $this->errors[$field][] = "{$field} format is invalid";
            return false;
        }
        return true;
    }

    protected function validateIn(string $field, mixed $value, array $params): bool
    {
        if ($value !== null && $value !== '' && !in_array($value, $params, true)) {
            $allowed = implode(', ', $params);
            $this->errors[$field][] = "{$field} must be one of: {$allowed}";
            return false;
        }
        return true;
    }

    protected function validateConfirmed(string $field, mixed $value, array $params, array $data): bool
    {
        $confirmationField = $field . '_confirmation';
        $confirmationValue = $data[$confirmationField] ?? null;

        if ($value !== $confirmationValue) {
            $this->errors[$field][] = "{$field} confirmation does not match";
            return false;
        }
        return true;
    }
}

// Usage example
$validator = new InputValidator();

$rules = [
    'username' => 'required|alphanumeric|min:3|max:20',
    'email' => 'required|email',
    'age' => 'integer|min:18|max:120',
    'password' => 'required|min:12|confirmed',
    'role' => 'required|in:user,admin,moderator',
];

if ($validator->validate($rules, $_POST)) {
    $validData = $validator->getValidated();
    // Process valid data
} else {
    $errors = $validator->getErrors();
    // Show errors to user
}
```

### Type-Safe Input Retrieval

```php
class Input
{
    public static function get(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    public static function post(string $key, mixed $default = null): mixed
    {
        return $_POST[$key] ?? $default;
    }

    public static function getString(string $key, string $default = '', string $source = 'post'): string
    {
        $data = $source === 'get' ? $_GET : $_POST;
        $value = $data[$key] ?? $default;

        return is_string($value) ? trim($value) : $default;
    }

    public static function getInt(string $key, int $default = 0, string $source = 'post'): int
    {
        $data = $source === 'get' ? $_GET : $_POST;
        $value = $data[$key] ?? null;

        if ($value === null) {
            return $default;
        }

        $filtered = filter_var($value, FILTER_VALIDATE_INT);
        return $filtered !== false ? $filtered : $default;
    }

    public static function getFloat(string $key, float $default = 0.0, string $source = 'post'): float
    {
        $data = $source === 'get' ? $_GET : $_POST;
        $value = $data[$key] ?? null;

        if ($value === null) {
            return $default;
        }

        $filtered = filter_var($value, FILTER_VALIDATE_FLOAT);
        return $filtered !== false ? $filtered : $default;
    }

    public static function getBool(string $key, bool $default = false, string $source = 'post'): bool
    {
        $data = $source === 'get' ? $_GET : $_POST;
        $value = $data[$key] ?? null;

        if ($value === null) {
            return $default;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    public static function getEmail(string $key, string $source = 'post'): ?string
    {
        $data = $source === 'get' ? $_GET : $_POST;
        $value = $data[$key] ?? null;

        if ($value === null) {
            return null;
        }

        $filtered = filter_var($value, FILTER_VALIDATE_EMAIL);
        return $filtered !== false ? $filtered : null;
    }

    public static function getArray(string $key, array $default = [], string $source = 'post'): array
    {
        $data = $source === 'get' ? $_GET : $_POST;
        $value = $data[$key] ?? $default;

        return is_array($value) ? $value : $default;
    }
}

// Usage
$userId = Input::getInt('user_id', source: 'get');
$email = Input::getEmail('email');
$isActive = Input::getBool('active');
$tags = Input::getArray('tags');
```

## File Upload Security

File uploads are one of the most dangerous features to implement. They can lead to remote code execution, denial of service, and other attacks.

### Secure File Upload Handler

```php
class SecureFileUpload
{
    private string $uploadDirectory;
    private array $allowedMimeTypes;
    private array $allowedExtensions;
    private int $maxFileSize;

    private const DANGEROUS_EXTENSIONS = [
        'php', 'php3', 'php4', 'php5', 'phtml', 'phar',
        'sh', 'bat', 'cmd', 'com',
        'htaccess', 'htpasswd',
    ];

    public function __construct(
        string $uploadDirectory,
        array $allowedMimeTypes = [],
        array $allowedExtensions = [],
        int $maxFileSize = 5242880 // 5MB
    ) {
        $this->uploadDirectory = rtrim($uploadDirectory, '/');
        $this->allowedMimeTypes = $allowedMimeTypes;
        $this->allowedExtensions = array_map('strtolower', $allowedExtensions);
        $this->maxFileSize = $maxFileSize;

        $this->ensureUploadDirectory();
    }

    private function ensureUploadDirectory(): void
    {
        if (!is_dir($this->uploadDirectory)) {
            if (!mkdir($this->uploadDirectory, 0750, true)) {
                throw new RuntimeException('Failed to create upload directory');
            }
        }

        // Ensure the directory is not web-accessible or has proper .htaccess
        $htaccessPath = $this->uploadDirectory . '/.htaccess';
        if (!file_exists($htaccessPath)) {
            file_put_contents($htaccessPath, "Deny from all\n");
        }
    }

    public function upload(array $file, ?string $customName = null): UploadResult
    {
        // Validate upload
        $error = $this->validateUpload($file);
        if ($error !== null) {
            return new UploadResult(false, null, $error);
        }

        // Validate file extension
        $originalExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (in_array($originalExtension, self::DANGEROUS_EXTENSIONS, true)) {
            return new UploadResult(false, null, 'File type not allowed');
        }

        if (!empty($this->allowedExtensions) && !in_array($originalExtension, $this->allowedExtensions, true)) {
            return new UploadResult(false, null, 'File extension not allowed');
        }

        // Validate MIME type using fileinfo (not trusting the client)
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detectedMimeType = $finfo->file($file['tmp_name']);

        if (!empty($this->allowedMimeTypes) && !in_array($detectedMimeType, $this->allowedMimeTypes, true)) {
            return new UploadResult(false, null, 'File type not allowed');
        }

        // Additional image validation for image uploads
        if (str_starts_with($detectedMimeType, 'image/')) {
            if (!$this->isValidImage($file['tmp_name'])) {
                return new UploadResult(false, null, 'Invalid image file');
            }
        }

        // Generate secure filename
        $safeExtension = $this->getSafeExtension($originalExtension, $detectedMimeType);
        $newFilename = $customName ?? $this->generateSecureFilename($safeExtension);
        $destinationPath = $this->uploadDirectory . '/' . $newFilename;

        // Prevent directory traversal in custom name
        if ($customName !== null && str_contains($customName, '..')) {
            return new UploadResult(false, null, 'Invalid filename');
        }

        // Move the file
        if (!move_uploaded_file($file['tmp_name'], $destinationPath)) {
            return new UploadResult(false, null, 'Failed to move uploaded file');
        }

        // Set secure permissions
        chmod($destinationPath, 0640);

        return new UploadResult(true, $newFilename);
    }

    private function validateUpload(array $file): ?string
    {
        if (!isset($file['error']) || is_array($file['error'])) {
            return 'Invalid upload parameters';
        }

        switch ($file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return 'File exceeds maximum size';
            case UPLOAD_ERR_PARTIAL:
                return 'File was only partially uploaded';
            case UPLOAD_ERR_NO_FILE:
                return 'No file was uploaded';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'Server configuration error';
            case UPLOAD_ERR_CANT_WRITE:
                return 'Failed to write file';
            default:
                return 'Unknown upload error';
        }

        if ($file['size'] > $this->maxFileSize) {
            return 'File exceeds maximum allowed size';
        }

        return null;
    }

    private function isValidImage(string $path): bool
    {
        $imageInfo = @getimagesize($path);

        if ($imageInfo === false) {
            return false;
        }

        // Check for valid image type
        $validTypes = [IMAGETYPE_GIF, IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP];

        return in_array($imageInfo[2], $validTypes, true);
    }

    private function generateSecureFilename(string $extension): string
    {
        return bin2hex(random_bytes(16)) . '.' . $extension;
    }

    private function getSafeExtension(string $originalExtension, string $mimeType): string
    {
        // Map MIME types to safe extensions
        $mimeToExtension = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'application/pdf' => 'pdf',
            'text/plain' => 'txt',
            'application/zip' => 'zip',
        ];

        // Use MIME-based extension if available
        if (isset($mimeToExtension[$mimeType])) {
            return $mimeToExtension[$mimeType];
        }

        // Filter the original extension
        return preg_replace('/[^a-z0-9]/', '', $originalExtension) ?: 'bin';
    }
}

class UploadResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?string $filename = null,
        public readonly ?string $error = null
    ) {}
}

// Image-specific upload handler
class ImageUploader extends SecureFileUpload
{
    public function __construct(string $uploadDirectory, int $maxFileSize = 10485760)
    {
        parent::__construct(
            $uploadDirectory,
            ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            $maxFileSize
        );
    }

    public function uploadAndResize(array $file, int $maxWidth, int $maxHeight): UploadResult
    {
        $result = parent::upload($file);

        if (!$result->success) {
            return $result;
        }

        $path = $this->uploadDirectory . '/' . $result->filename;

        // Resize if necessary
        $this->resizeImage($path, $maxWidth, $maxHeight);

        // Strip EXIF data for privacy
        $this->stripExifData($path);

        return $result;
    }

    private function resizeImage(string $path, int $maxWidth, int $maxHeight): void
    {
        $imageInfo = getimagesize($path);

        if ($imageInfo === false) {
            return;
        }

        [$width, $height, $type] = $imageInfo;

        if ($width <= $maxWidth && $height <= $maxHeight) {
            return;
        }

        // Calculate new dimensions
        $ratio = min($maxWidth / $width, $maxHeight / $height);
        $newWidth = (int) ($width * $ratio);
        $newHeight = (int) ($height * $ratio);

        // Create image resource based on type
        $source = match ($type) {
            IMAGETYPE_JPEG => imagecreatefromjpeg($path),
            IMAGETYPE_PNG => imagecreatefrompng($path),
            IMAGETYPE_GIF => imagecreatefromgif($path),
            IMAGETYPE_WEBP => imagecreatefromwebp($path),
            default => null,
        };

        if ($source === null) {
            return;
        }

        // Create resized image
        $resized = imagecreatetruecolor($newWidth, $newHeight);

        // Preserve transparency for PNG and GIF
        if ($type === IMAGETYPE_PNG || $type === IMAGETYPE_GIF) {
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
        }

        imagecopyresampled($resized, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        // Save resized image
        match ($type) {
            IMAGETYPE_JPEG => imagejpeg($resized, $path, 85),
            IMAGETYPE_PNG => imagepng($resized, $path, 8),
            IMAGETYPE_GIF => imagegif($resized, $path),
            IMAGETYPE_WEBP => imagewebp($resized, $path, 85),
            default => null,
        };

        imagedestroy($source);
        imagedestroy($resized);
    }

    private function stripExifData(string $path): void
    {
        $imageInfo = getimagesize($path);

        if ($imageInfo === false || $imageInfo[2] !== IMAGETYPE_JPEG) {
            return;
        }

        $image = imagecreatefromjpeg($path);

        if ($image === false) {
            return;
        }

        imagejpeg($image, $path, 85);
        imagedestroy($image);
    }
}

// Usage
$uploader = new ImageUploader('/var/uploads/images');

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['avatar'])) {
    $result = $uploader->uploadAndResize($_FILES['avatar'], 500, 500);

    if ($result->success) {
        echo "Upload successful: " . $result->filename;
    } else {
        echo "Upload failed: " . $result->error;
    }
}
```

## Session Security

Proper session management is crucial for maintaining user authentication securely.

```php
class SecureSession
{
    private const SESSION_LIFETIME = 3600; // 1 hour
    private const REGENERATION_INTERVAL = 300; // 5 minutes

    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        // Configure secure session settings
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_samesite', 'Strict');

        if (self::isSecure()) {
            ini_set('session.cookie_secure', '1');
        }

        session_set_cookie_params([
            'lifetime' => self::SESSION_LIFETIME,
            'path' => '/',
            'domain' => '',
            'secure' => self::isSecure(),
            'httponly' => true,
            'samesite' => 'Strict',
        ]);

        session_start();

        // Validate and regenerate session
        self::validateSession();
    }

    private static function isSecure(): bool
    {
        return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || ($_SERVER['SERVER_PORT'] ?? 80) == 443;
    }

    private static function validateSession(): void
    {
        $now = time();

        // Check if session has expired
        if (isset($_SESSION['_last_activity']) &&
            ($now - $_SESSION['_last_activity']) > self::SESSION_LIFETIME) {
            self::destroy();
            self::start();
            return;
        }

        // Regenerate session ID periodically
        if (!isset($_SESSION['_created'])) {
            $_SESSION['_created'] = $now;
        } elseif ($now - $_SESSION['_created'] > self::REGENERATION_INTERVAL) {
            self::regenerate();
        }

        // Update last activity
        $_SESSION['_last_activity'] = $now;

        // Validate client fingerprint
        $fingerprint = self::generateFingerprint();

        if (!isset($_SESSION['_fingerprint'])) {
            $_SESSION['_fingerprint'] = $fingerprint;
        } elseif (!hash_equals($_SESSION['_fingerprint'], $fingerprint)) {
            // Possible session hijacking attempt
            self::destroy();
            throw new RuntimeException('Session validation failed');
        }
    }

    private static function generateFingerprint(): string
    {
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $acceptLanguage = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '';

        return hash('sha256', $userAgent . $acceptLanguage);
    }

    public static function regenerate(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
            $_SESSION['_created'] = time();
        }
    }

    public static function destroy(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];

            if (isset($_COOKIE[session_name()])) {
                setcookie(session_name(), '', [
                    'expires' => time() - 3600,
                    'path' => '/',
                    'domain' => '',
                    'secure' => self::isSecure(),
                    'httponly' => true,
                    'samesite' => 'Strict',
                ]);
            }

            session_destroy();
        }
    }

    public static function set(string $key, mixed $value): void
    {
        $_SESSION[$key] = $value;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return $_SESSION[$key] ?? $default;
    }

    public static function has(string $key): bool
    {
        return isset($_SESSION[$key]);
    }

    public static function remove(string $key): void
    {
        unset($_SESSION[$key]);
    }

    public static function flash(string $key, mixed $value): void
    {
        $_SESSION['_flash'][$key] = $value;
    }

    public static function getFlash(string $key, mixed $default = null): mixed
    {
        $value = $_SESSION['_flash'][$key] ?? $default;
        unset($_SESSION['_flash'][$key]);
        return $value;
    }
}

// Usage
SecureSession::start();

// Login
if ($user = $authService->authenticate($username, $password)) {
    SecureSession::regenerate(); // Always regenerate on privilege change
    SecureSession::set('user_id', $user['id']);
    SecureSession::set('user_role', $user['role']);
    SecureSession::flash('message', 'Login successful');
}

// Check authentication
if (!SecureSession::has('user_id')) {
    header('Location: /login');
    exit;
}

// Logout
SecureSession::destroy();
```

## Rate Limiting

Protect against brute force and denial-of-service attacks:

```php
class RateLimiter
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->createTableIfNotExists();
    }

    private function createTableIfNotExists(): void
    {
        $this->pdo->exec('
            CREATE TABLE IF NOT EXISTS rate_limits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                identifier VARCHAR(255) NOT NULL,
                action VARCHAR(100) NOT NULL,
                attempts INT DEFAULT 1,
                first_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_identifier_action (identifier, action),
                INDEX idx_last_attempt (last_attempt)
            )
        ');
    }

    public function attempt(
        string $identifier,
        string $action,
        int $maxAttempts,
        int $decaySeconds
    ): RateLimitResult {
        $this->cleanupOldEntries($decaySeconds);

        $record = $this->getRecord($identifier, $action, $decaySeconds);

        if ($record === null) {
            $this->createRecord($identifier, $action);
            return new RateLimitResult(true, $maxAttempts - 1, 0);
        }

        if ($record['attempts'] >= $maxAttempts) {
            $retryAfter = $decaySeconds - (time() - strtotime($record['first_attempt']));
            return new RateLimitResult(false, 0, $retryAfter);
        }

        $this->incrementRecord($record['id']);

        return new RateLimitResult(
            true,
            $maxAttempts - $record['attempts'] - 1,
            0
        );
    }

    public function isBlocked(string $identifier, string $action, int $maxAttempts, int $decaySeconds): bool
    {
        $record = $this->getRecord($identifier, $action, $decaySeconds);
        return $record !== null && $record['attempts'] >= $maxAttempts;
    }

    public function reset(string $identifier, string $action): void
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM rate_limits WHERE identifier = :identifier AND action = :action'
        );
        $stmt->execute(['identifier' => $identifier, 'action' => $action]);
    }

    private function getRecord(string $identifier, string $action, int $decaySeconds): ?array
    {
        $stmt = $this->pdo->prepare('
            SELECT * FROM rate_limits
            WHERE identifier = :identifier
            AND action = :action
            AND first_attempt > DATE_SUB(NOW(), INTERVAL :decay SECOND)
        ');
        $stmt->execute([
            'identifier' => $identifier,
            'action' => $action,
            'decay' => $decaySeconds,
        ]);

        return $stmt->fetch() ?: null;
    }

    private function createRecord(string $identifier, string $action): void
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO rate_limits (identifier, action) VALUES (:identifier, :action)
        ');
        $stmt->execute(['identifier' => $identifier, 'action' => $action]);
    }

    private function incrementRecord(int $id): void
    {
        $stmt = $this->pdo->prepare('
            UPDATE rate_limits SET attempts = attempts + 1, last_attempt = NOW() WHERE id = :id
        ');
        $stmt->execute(['id' => $id]);
    }

    private function cleanupOldEntries(int $decaySeconds): void
    {
        $this->pdo->exec("
            DELETE FROM rate_limits
            WHERE last_attempt < DATE_SUB(NOW(), INTERVAL {$decaySeconds} SECOND)
        ");
    }
}

class RateLimitResult
{
    public function __construct(
        public readonly bool $allowed,
        public readonly int $remainingAttempts,
        public readonly int $retryAfter
    ) {}
}

// Usage for login attempts
$rateLimiter = new RateLimiter($pdo);
$identifier = $_SERVER['REMOTE_ADDR'];

$result = $rateLimiter->attempt($identifier, 'login', maxAttempts: 5, decaySeconds: 900);

if (!$result->allowed) {
    http_response_code(429);
    header("Retry-After: {$result->retryAfter}");
    die("Too many login attempts. Please try again in {$result->retryAfter} seconds.");
}

// Proceed with authentication
if ($authService->authenticate($username, $password)) {
    $rateLimiter->reset($identifier, 'login'); // Reset on successful login
    // ...
}
```

## Security Checklist

When developing PHP applications, use this checklist to ensure comprehensive security:

### Database Security
- [ ] Use prepared statements for all database queries
- [ ] Never interpolate user input into SQL
- [ ] Use least privilege database accounts
- [ ] Encrypt sensitive data at rest
- [ ] Regularly backup and test restore procedures

### Input/Output Security
- [ ] Validate all input on the server side
- [ ] Use type-safe input retrieval
- [ ] Encode all output for the appropriate context
- [ ] Implement Content Security Policy
- [ ] Set appropriate security headers

### Authentication & Authorization
- [ ] Use password_hash() and password_verify()
- [ ] Implement rate limiting on login
- [ ] Use secure session configuration
- [ ] Regenerate session ID on privilege changes
- [ ] Implement proper password reset flows

### CSRF Protection
- [ ] Generate cryptographically secure tokens
- [ ] Validate tokens on all state-changing requests
- [ ] Use SameSite cookie attribute
- [ ] Implement double-submit cookie for APIs

### File Security
- [ ] Validate file type using fileinfo
- [ ] Whitelist allowed extensions
- [ ] Generate random filenames
- [ ] Store uploads outside web root
- [ ] Scan uploads for malware

### Configuration
- [ ] Disable display_errors in production
- [ ] Set appropriate error_reporting
- [ ] Use HTTPS everywhere
- [ ] Keep PHP and dependencies updated
- [ ] Remove unnecessary PHP extensions

## Conclusion

Security is not a feature to add at the end of development - it must be integrated into every aspect of your application from the start. The practices covered in this guide form the foundation of secure PHP development:

1. **Never trust user input** - validate and sanitize everything
2. **Use prepared statements** - prevent SQL injection consistently
3. **Encode output appropriately** - prevent XSS in all contexts
4. **Implement CSRF protection** - secure all state-changing operations
5. **Hash passwords securely** - use password_hash() and password_verify()
6. **Secure file uploads** - validate, sanitize, and store safely
7. **Configure sessions securely** - use proper session settings
8. **Apply defense in depth** - multiple security layers are essential

Remember that security is an ongoing process. Stay informed about new vulnerabilities, keep your dependencies updated, and regularly audit your code for security issues. Consider using static analysis tools and having security professionals review critical applications.
