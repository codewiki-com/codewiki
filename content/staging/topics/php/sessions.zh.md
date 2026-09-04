---
title: 会话管理
description: PHP会话管理完全指南，session、cookie与用户认证
track: php
section: performance-security
difficulty: intermediate
tags:
  - PHP
  - Session
  - Cookie
  - 认证
status: imported
origin: old/src/content/docs/php/sessions.zh.md
divergence: 0.245
issues: []
legacy:
  category: PHP
  subcategory: Web开发
  order: 7
  lastUpdated: 2026-01-07
---

HTTP 协议是无状态的，这意味着服务器无法在多个请求之间识别同一用户。会话（Session）机制解决了这个问题，使我们能够在用户浏览网站时保持状态信息，如登录状态、购物车内容等。

## 会话的工作原理

当用户首次访问网站时，PHP 会：

1. 生成一个唯一的会话 ID（Session ID）
2. 在服务器端创建一个会话文件存储数据
3. 通过 Cookie 将会话 ID 发送给客户端浏览器

后续请求中，浏览器会自动携带这个 Cookie，服务器据此识别用户并读取对应的会话数据。

```
┌─────────────┐                      ┌─────────────┐
│   浏览器    │  ──── 首次请求 ────→  │   服务器    │
│             │                      │             │
│             │  ←── 响应+Cookie ──  │  创建Session │
│  存储Cookie │                      │  存储数据    │
│             │                      │             │
│             │  ── 携带Cookie请求 → │             │
│             │                      │  读取Session │
│             │  ←── 响应数据 ────   │             │
└─────────────┘                      └─────────────┘
```

## 启动会话：session_start()

使用会话之前，必须调用 `session_start()` 函数。这个函数必须在任何输出之前调用。

### 基本用法

```php
<?php
// 必须在任何 HTML 输出之前调用
session_start();

// 现在可以使用 $_SESSION 超全局变量
$_SESSION['username'] = '张三';
$_SESSION['login_time'] = time();
```

### 常见错误：Headers Already Sent

```php
<?php
echo "Hello"; // 这行会导致问题！

session_start(); // 错误：Cannot send session cookie - headers already sent
```

**解决方案：**

```php
<?php
// 方案1：确保 session_start() 在最前面
session_start();
echo "Hello";

// 方案2：使用输出缓冲
ob_start();
echo "Hello";
session_start(); // 现在可以工作了
ob_end_flush();
```

### 配置会话选项

`session_start()` 可以接受一个配置数组：

```php
<?php
session_start([
    'name' => 'MY_SESSION',           // 自定义会话名称
    'cookie_lifetime' => 86400,       // Cookie 生命周期（秒）
    'cookie_path' => '/',             // Cookie 路径
    'cookie_domain' => '.example.com', // Cookie 域名
    'cookie_secure' => true,          // 仅 HTTPS 传输
    'cookie_httponly' => true,        // 禁止 JavaScript 访问
    'cookie_samesite' => 'Strict',    // 防止 CSRF 攻击
    'use_strict_mode' => true,        // 严格模式
    'gc_maxlifetime' => 3600,         // 会话数据最大生命周期
]);
```

## 会话变量操作

### 设置会话变量

```php
<?php
session_start();

// 存储简单值
$_SESSION['user_id'] = 123;
$_SESSION['username'] = '李四';
$_SESSION['email'] = 'lisi@example.com';

// 存储数组
$_SESSION['cart'] = [
    ['product_id' => 1, 'name' => 'PHP入门', 'price' => 59.00, 'quantity' => 1],
    ['product_id' => 2, 'name' => 'MySQL精通', 'price' => 79.00, 'quantity' => 2],
];

// 存储对象（对象会被序列化）
class User {
    public $id;
    public $name;

    public function __construct($id, $name) {
        $this->id = $id;
        $this->name = $name;
    }
}

$_SESSION['user_object'] = new User(1, '王五');
```

### 读取会话变量

```php
<?php
session_start();

// 直接读取
$username = $_SESSION['username'];

// 安全读取（检查是否存在）
$username = $_SESSION['username'] ?? '游客';

// 使用 isset 检查
if (isset($_SESSION['user_id'])) {
    echo "用户已登录，ID：" . $_SESSION['user_id'];
} else {
    echo "用户未登录";
}

// 遍历所有会话变量
foreach ($_SESSION as $key => $value) {
    echo "$key: ";
    print_r($value);
    echo "<br>";
}
```

### 删除会话变量

```php
<?php
session_start();

// 删除单个变量
unset($_SESSION['cart']);

// 清空所有会话变量（但不销毁会话）
$_SESSION = [];

// 完全销毁会话
session_start();

// 1. 清空会话数组
$_SESSION = [];

// 2. 删除会话 Cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 3. 销毁会话
session_destroy();
```

## 实战：用户登录系统

下面是一个完整的用户登录系统示例。

### 数据库结构

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(64) NULL,
    token_expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);
```

### 会话管理类

```php
<?php
// SessionManager.php

class SessionManager
{
    private PDO $db;
    private int $sessionLifetime = 3600;      // 1小时
    private int $rememberLifetime = 2592000;  // 30天

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * 初始化会话
     */
    public function init(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start([
                'name' => 'SECURE_SESSION',
                'cookie_lifetime' => 0,  // 浏览器关闭时过期
                'cookie_secure' => isset($_SERVER['HTTPS']),
                'cookie_httponly' => true,
                'cookie_samesite' => 'Lax',
                'use_strict_mode' => true,
                'gc_maxlifetime' => $this->sessionLifetime,
            ]);
        }

        // 检查 "记住我" Cookie
        $this->checkRememberMe();

        // 会话安全：检测会话劫持
        $this->validateSession();
    }

    /**
     * 用户登录
     */
    public function login(string $username, string $password, bool $remember = false): bool
    {
        $stmt = $this->db->prepare(
            "SELECT id, username, password FROM users WHERE username = ? OR email = ?"
        );
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password'])) {
            return false;
        }

        // 重新生成会话ID，防止会话固定攻击
        session_regenerate_id(true);

        // 设置会话数据
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['login_time'] = time();
        $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'];
        $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];

        // 更新最后登录时间
        $this->db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")
                 ->execute([$user['id']]);

        // 处理"记住我"功能
        if ($remember) {
            $this->setRememberMe($user['id']);
        }

        return true;
    }

    /**
     * 用户登出
     */
    public function logout(): void
    {
        // 清除"记住我"令牌
        if (isset($_SESSION['user_id'])) {
            $this->db->prepare(
                "UPDATE users SET remember_token = NULL, token_expires_at = NULL WHERE id = ?"
            )->execute([$_SESSION['user_id']]);
        }

        // 删除"记住我"Cookie
        if (isset($_COOKIE['remember_me'])) {
            setcookie('remember_me', '', time() - 3600, '/', '', true, true);
        }

        // 清空会话
        $_SESSION = [];

        // 删除会话Cookie
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }

        session_destroy();
    }

    /**
     * 检查是否已登录
     */
    public function isLoggedIn(): bool
    {
        return isset($_SESSION['user_id']) && isset($_SESSION['login_time']);
    }

    /**
     * 获取当前用户ID
     */
    public function getUserId(): ?int
    {
        return $_SESSION['user_id'] ?? null;
    }

    /**
     * 设置"记住我"Cookie
     */
    private function setRememberMe(int $userId): void
    {
        // 生成安全的随机令牌
        $token = bin2hex(random_bytes(32));
        $hashedToken = hash('sha256', $token);
        $expiresAt = date('Y-m-d H:i:s', time() + $this->rememberLifetime);

        // 存储到数据库
        $stmt = $this->db->prepare(
            "UPDATE users SET remember_token = ?, token_expires_at = ? WHERE id = ?"
        );
        $stmt->execute([$hashedToken, $expiresAt, $userId]);

        // 设置Cookie（存储原始令牌）
        setcookie('remember_me', $userId . ':' . $token, [
            'expires' => time() + $this->rememberLifetime,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    /**
     * 检查"记住我"Cookie
     */
    private function checkRememberMe(): void
    {
        if ($this->isLoggedIn() || !isset($_COOKIE['remember_me'])) {
            return;
        }

        $parts = explode(':', $_COOKIE['remember_me'], 2);
        if (count($parts) !== 2) {
            return;
        }

        [$userId, $token] = $parts;
        $hashedToken = hash('sha256', $token);

        $stmt = $this->db->prepare(
            "SELECT id, username, remember_token, token_expires_at
             FROM users
             WHERE id = ? AND remember_token = ? AND token_expires_at > NOW()"
        );
        $stmt->execute([$userId, $hashedToken]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // 重新生成会话ID
            session_regenerate_id(true);

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['login_time'] = time();
            $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'];
            $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];

            // 令牌轮换：生成新令牌替换旧令牌
            $this->setRememberMe($user['id']);
        }
    }

    /**
     * 验证会话安全性
     */
    private function validateSession(): void
    {
        if (!$this->isLoggedIn()) {
            return;
        }

        // 检查会话是否过期
        if (time() - $_SESSION['login_time'] > $this->sessionLifetime) {
            $this->logout();
            return;
        }

        // 检测可能的会话劫持（IP或User-Agent变化）
        if ($_SESSION['ip_address'] !== $_SERVER['REMOTE_ADDR'] ||
            $_SESSION['user_agent'] !== $_SERVER['HTTP_USER_AGENT']) {
            // 可疑活动，销毁会话
            $this->logout();
            return;
        }

        // 定期重新生成会话ID（每30分钟）
        if (!isset($_SESSION['last_regeneration'])) {
            $_SESSION['last_regeneration'] = time();
        } elseif (time() - $_SESSION['last_regeneration'] > 1800) {
            session_regenerate_id(true);
            $_SESSION['last_regeneration'] = time();
        }
    }
}
```

### 登录页面

```php
<?php
// login.php

require_once 'SessionManager.php';
require_once 'database.php';  // 假设这里有数据库连接

$sessionManager = new SessionManager($pdo);
$sessionManager->init();

// 如果已登录，重定向到首页
if ($sessionManager->isLoggedIn()) {
    header('Location: /dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $remember = isset($_POST['remember']);

    // CSRF 令牌验证
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        $error = '无效的请求';
    } elseif (empty($username) || empty($password)) {
        $error = '请填写用户名和密码';
    } elseif ($sessionManager->login($username, $password, $remember)) {
        header('Location: /dashboard.php');
        exit;
    } else {
        $error = '用户名或密码错误';
    }
}

// 生成 CSRF 令牌
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>用户登录</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 400px;
        }
        h1 { text-align: center; margin-bottom: 1.5rem; color: #333; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; color: #555; }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 1rem;
        }
        input:focus { outline: none; border-color: #667eea; }
        .checkbox-group { display: flex; align-items: center; gap: 0.5rem; }
        .checkbox-group input { width: auto; }
        .btn {
            width: 100%;
            padding: 0.75rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 1rem;
        }
        .btn:hover { opacity: 0.9; }
        .error {
            background: #fee;
            color: #c00;
            padding: 0.75rem;
            border-radius: 5px;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>用户登录</h1>

        <?php if ($error): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form method="POST" action="">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">

            <div class="form-group">
                <label for="username">用户名 / 邮箱</label>
                <input type="text" id="username" name="username" required
                       value="<?= htmlspecialchars($_POST['username'] ?? '') ?>">
            </div>

            <div class="form-group">
                <label for="password">密码</label>
                <input type="password" id="password" name="password" required>
            </div>

            <div class="form-group checkbox-group">
                <input type="checkbox" id="remember" name="remember">
                <label for="remember">记住我（30天内免登录）</label>
            </div>

            <button type="submit" class="btn">登录</button>
        </form>
    </div>
</body>
</html>
```

### 受保护的页面

```php
<?php
// dashboard.php

require_once 'SessionManager.php';
require_once 'database.php';

$sessionManager = new SessionManager($pdo);
$sessionManager->init();

// 检查登录状态
if (!$sessionManager->isLoggedIn()) {
    header('Location: /login.php');
    exit;
}

// 获取用户信息
$userId = $sessionManager->getUserId();
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>控制面板</title>
</head>
<body>
    <h1>欢迎回来，<?= htmlspecialchars($user['username']) ?>！</h1>
    <p>上次登录时间：<?= $user['last_login'] ?></p>
    <p><a href="/logout.php">退出登录</a></p>
</body>
</html>
```

### 登出处理

```php
<?php
// logout.php

require_once 'SessionManager.php';
require_once 'database.php';

$sessionManager = new SessionManager($pdo);
$sessionManager->init();
$sessionManager->logout();

header('Location: /login.php?logged_out=1');
exit;
```

## Cookie 详解

Cookie 是存储在客户端浏览器中的小型文本数据，与会话配合使用可以实现更灵活的状态管理。

### 设置 Cookie

```php
<?php
// 基本用法
setcookie('username', '张三', time() + 86400);  // 1天后过期

// 完整参数
setcookie(
    'preferences',                // 名称
    json_encode(['theme' => 'dark', 'lang' => 'zh']),  // 值
    [
        'expires' => time() + 86400 * 30,  // 30天后过期
        'path' => '/',                      // 整个站点可访问
        'domain' => '.example.com',         // 所有子域名可访问
        'secure' => true,                   // 仅HTTPS
        'httponly' => true,                 // 禁止JavaScript访问
        'samesite' => 'Lax',               // 同站点策略
    ]
);
```

### 读取 Cookie

```php
<?php
// 读取单个Cookie
$username = $_COOKIE['username'] ?? '游客';

// 读取并解析JSON
if (isset($_COOKIE['preferences'])) {
    $prefs = json_decode($_COOKIE['preferences'], true);
    $theme = $prefs['theme'] ?? 'light';
}

// 遍历所有Cookie
foreach ($_COOKIE as $name => $value) {
    echo "$name: $value<br>";
}
```

### 删除 Cookie

```php
<?php
// 设置过期时间为过去
setcookie('username', '', time() - 3600, '/');

// 或者使用相同的参数
setcookie('preferences', '', [
    'expires' => time() - 3600,
    'path' => '/',
    'domain' => '.example.com',
    'secure' => true,
    'httponly' => true,
]);
```

### Cookie 与 Session 的区别

| 特性 | Cookie | Session |
|------|--------|---------|
| 存储位置 | 客户端浏览器 | 服务器端 |
| 安全性 | 较低（可被查看/修改） | 较高 |
| 存储容量 | 约4KB | 取决于服务器配置 |
| 生命周期 | 可设置很长 | 通常较短 |
| 性能影响 | 每次请求都传输 | 仅传输Session ID |

## 会话安全最佳实践

### 防止会话固定攻击

```php
<?php
// 登录成功后，立即重新生成会话ID
session_start();

if (loginSuccessful($username, $password)) {
    // 关键：删除旧会话，创建新会话
    session_regenerate_id(true);

    $_SESSION['user_id'] = $userId;
}
```

### 防止会话劫持

```php
<?php
session_start();

// 绑定会话到用户的浏览器指纹
$fingerprint = hash('sha256',
    $_SERVER['HTTP_USER_AGENT'] .
    $_SERVER['REMOTE_ADDR']
);

if (!isset($_SESSION['fingerprint'])) {
    $_SESSION['fingerprint'] = $fingerprint;
} elseif ($_SESSION['fingerprint'] !== $fingerprint) {
    // 指纹不匹配，可能是会话劫持
    session_destroy();
    die('会话无效，请重新登录');
}
```

### 设置安全的会话 Cookie

```php
<?php
// 在 php.ini 或代码中配置
ini_set('session.cookie_httponly', 1);    // 防止XSS窃取Cookie
ini_set('session.cookie_secure', 1);       // 仅HTTPS传输
ini_set('session.cookie_samesite', 'Lax'); // 防止CSRF
ini_set('session.use_strict_mode', 1);     // 拒绝未初始化的会话ID
ini_set('session.use_only_cookies', 1);    // 仅通过Cookie传递会话ID
```

### 实现会话超时

```php
<?php
session_start();

$timeout = 1800; // 30分钟

if (isset($_SESSION['last_activity'])) {
    $inactive = time() - $_SESSION['last_activity'];

    if ($inactive >= $timeout) {
        session_unset();
        session_destroy();
        header('Location: /login.php?timeout=1');
        exit;
    }
}

$_SESSION['last_activity'] = time();
```

### CSRF 令牌保护

```php
<?php
session_start();

// 生成CSRF令牌
function generateCsrfToken(): string
{
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// 验证CSRF令牌
function validateCsrfToken(string $token): bool
{
    return isset($_SESSION['csrf_token']) &&
           hash_equals($_SESSION['csrf_token'], $token);
}

// 在表单中使用
?>
<form method="POST">
    <input type="hidden" name="csrf_token" value="<?= generateCsrfToken() ?>">
    <!-- 其他表单字段 -->
</form>

<?php
// 处理表单提交
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        die('CSRF验证失败');
    }
    // 处理表单...
}
```

## 自定义会话处理器

PHP 默认将会话数据存储在文件中，但在分布式环境中，我们需要将会话存储到数据库或 Redis 等共享存储中。

### 数据库会话处理器

```php
<?php
// DatabaseSessionHandler.php

class DatabaseSessionHandler implements SessionHandlerInterface
{
    private PDO $db;
    private int $lifetime;

    public function __construct(PDO $db, int $lifetime = 3600)
    {
        $this->db = $db;
        $this->lifetime = $lifetime;
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
        $stmt = $this->db->prepare(
            "SELECT data FROM sessions WHERE id = ? AND expires_at > NOW()"
        );
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ? $result['data'] : '';
    }

    public function write(string $id, string $data): bool
    {
        $expiresAt = date('Y-m-d H:i:s', time() + $this->lifetime);

        $stmt = $this->db->prepare(
            "INSERT INTO sessions (id, data, expires_at) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE data = VALUES(data), expires_at = VALUES(expires_at)"
        );

        return $stmt->execute([$id, $data, $expiresAt]);
    }

    public function destroy(string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM sessions WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function gc(int $max_lifetime): int|false
    {
        $stmt = $this->db->prepare("DELETE FROM sessions WHERE expires_at < NOW()");
        $stmt->execute();
        return $stmt->rowCount();
    }
}

// 数据库表结构
/*
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;
*/

// 使用自定义处理器
$handler = new DatabaseSessionHandler($pdo);
session_set_save_handler($handler, true);
session_start();
```

### Redis 会话处理器

```php
<?php
// RedisSessionHandler.php

class RedisSessionHandler implements SessionHandlerInterface
{
    private Redis $redis;
    private int $lifetime;
    private string $prefix = 'session:';

    public function __construct(Redis $redis, int $lifetime = 3600)
    {
        $this->redis = $redis;
        $this->lifetime = $lifetime;
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
            $this->lifetime,
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
        // Redis 自动处理过期，无需手动清理
        return 0;
    }
}

// 使用 Redis 会话处理器
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);
$redis->auth('your-password');  // 如果有密码

$handler = new RedisSessionHandler($redis);
session_set_save_handler($handler, true);
session_start();
```

## Flash 消息

Flash 消息是一种只显示一次的会话消息，常用于表单提交后的反馈。

```php
<?php
// FlashMessage.php

class FlashMessage
{
    public static function set(string $type, string $message): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $_SESSION['flash_messages'][$type][] = $message;
    }

    public static function success(string $message): void
    {
        self::set('success', $message);
    }

    public static function error(string $message): void
    {
        self::set('error', $message);
    }

    public static function warning(string $message): void
    {
        self::set('warning', $message);
    }

    public static function info(string $message): void
    {
        self::set('info', $message);
    }

    public static function get(string $type = null): array
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if ($type === null) {
            $messages = $_SESSION['flash_messages'] ?? [];
            unset($_SESSION['flash_messages']);
            return $messages;
        }

        $messages = $_SESSION['flash_messages'][$type] ?? [];
        unset($_SESSION['flash_messages'][$type]);
        return $messages;
    }

    public static function has(string $type = null): bool
    {
        if ($type === null) {
            return !empty($_SESSION['flash_messages']);
        }
        return !empty($_SESSION['flash_messages'][$type]);
    }

    public static function render(): string
    {
        $html = '';
        $messages = self::get();

        foreach ($messages as $type => $typeMessages) {
            foreach ($typeMessages as $message) {
                $html .= sprintf(
                    '<div class="alert alert-%s">%s</div>',
                    htmlspecialchars($type),
                    htmlspecialchars($message)
                );
            }
        }

        return $html;
    }
}

// 使用示例
// 设置消息
FlashMessage::success('文章发布成功！');
FlashMessage::error('用户名已存在');

// 在页面中显示
echo FlashMessage::render();
```

## 常见问题排查

### 会话不工作

```php
<?php
// 检查会话状态
echo "会话状态: " . session_status();
// 0 = PHP_SESSION_DISABLED（会话被禁用）
// 1 = PHP_SESSION_NONE（会话未启动）
// 2 = PHP_SESSION_ACTIVE（会话已激活）

// 检查会话保存路径
echo "会话保存路径: " . session_save_path();
echo "路径是否可写: " . (is_writable(session_save_path()) ? '是' : '否');

// 检查会话ID
echo "会话ID: " . session_id();
```

### 会话数据丢失

```php
<?php
// 确保每个页面都调用 session_start()
session_start();

// 检查是否意外销毁了会话
// 避免在不需要时调用 session_destroy()

// 检查 session.gc_maxlifetime 设置
echo "GC最大生命周期: " . ini_get('session.gc_maxlifetime');

// 检查 session.gc_probability 和 session.gc_divisor
echo "GC概率: " . ini_get('session.gc_probability') . "/" . ini_get('session.gc_divisor');
```

### 多服务器环境会话问题

```php
<?php
// 问题：多台服务器时，会话文件不共享
// 解决方案1：使用数据库存储会话
// 解决方案2：使用Redis存储会话
// 解决方案3：配置负载均衡器使用会话粘性（Session Stickiness）

// 使用 PHP 内置的 Redis 会话处理（如果安装了 redis 扩展）
ini_set('session.save_handler', 'redis');
ini_set('session.save_path', 'tcp://127.0.0.1:6379?auth=password');
```

## 性能优化建议

### 减少会话数据量

```php
<?php
// 不好的做法：存储大量数据
$_SESSION['user'] = $largeUserObject;  // 包含很多不需要的字段

// 好的做法：只存储必要的数据
$_SESSION['user_id'] = $user->id;
$_SESSION['username'] = $user->username;
$_SESSION['role'] = $user->role;
```

### 延迟会话启动

```php
<?php
// 只在需要时启动会话
function ensureSession(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

// 不需要会话的页面（如静态内容）不调用 session_start()
```

### 只读会话优化

```php
<?php
// 如果只是读取会话，可以在读取后立即关闭
session_start();
$userId = $_SESSION['user_id'];
session_write_close();  // 释放会话锁

// 继续处理其他逻辑...
// 这样其他请求可以同时访问会话
```

## 总结

本文详细介绍了 PHP 会话管理的各个方面：

1. **会话基础**：`session_start()`、会话变量的读写删除
2. **安全实践**：防止会话固定、会话劫持、CSRF 攻击
3. **Cookie 操作**：设置、读取、删除 Cookie
4. **记住我功能**：安全的持久登录实现
5. **自定义会话处理器**：数据库和 Redis 存储
6. **Flash 消息**：一次性消息的实现

在实际开发中，建议使用成熟的框架（如 Laravel、Symfony）提供的会话管理功能，它们已经处理好了大部分安全问题。如果必须自己实现，请务必遵循本文介绍的安全最佳实践。
