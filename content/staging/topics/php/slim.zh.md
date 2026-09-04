---
title: Slim 微框架指南
description: Slim PHP 微框架完整指南，涵盖路由、中间件、依赖注入和轻量级 API 构建
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - Slim
  - 微框架
  - API
  - REST
  - PSR-7
status: imported
origin: old/src/content/docs/php/slim.zh.md
divergence: 0.213
issues: []
legacy:
  category: PHP
  subcategory: Web Frameworks
  order: 22
  lastUpdated: 2026-01-22
---

Slim 是一个 PHP 微框架，帮助你快速编写简单而强大的 Web 应用程序和 API。其核心是一个调度器，接收 HTTP 请求，调用适当的回调程序，并返回 HTTP 响应。它采用 PSR-7 标准的 HTTP 消息接口和 PSR-15 中间件标准，使其与其他 PHP 组件具有高度互操作性。

## 概念解释

Slim 遵循微框架哲学：仅提供构建 Web 应用程序所需的基本工具，而不强加不必要的结构或臃肿。与全栈框架不同，Slim 开箱即用地提供路由、中间件和依赖注入，将架构决策留给开发者。

该框架基于 PSR 标准构建，特别是 PSR-7（HTTP 消息接口）、PSR-11（容器接口）、PSR-15（HTTP 服务器请求处理器）和 PSR-17（HTTP 工厂）。这种基于标准的方法意味着 Slim 组件可以与任何 PSR 兼容的实现进行交换。

Slim 非常适合构建 REST API、微服务以及中小型应用程序，在这些场景中你希望完全控制技术栈而不承担大型框架的开销。它也是学习现代 PHP 实践的绝佳基础。

## 核心原理

### 请求-响应周期

Slim 通过中间件管道处理 HTTP 请求并返回 HTTP 响应：

```php
<?php
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();

$app->get('/', function (Request $request, Response $response, array $args) {
    $response->getBody()->write("Hello, World!");
    return $response;
});

$app->run();
```

### PSR-7 HTTP 消息

Slim 使用不可变的 PSR-7 请求和响应对象：

```php
// Request 对象提供对 HTTP 请求数据的访问
$app->get('/users', function (Request $request, Response $response) {
    // 查询参数
    $params = $request->getQueryParams();
    $page = $params['page'] ?? 1;

    // 请求头
    $contentType = $request->getHeaderLine('Content-Type');

    // 请求体（用于 POST/PUT）
    $body = $request->getParsedBody();

    // 属性（由中间件或路由设置）
    $userId = $request->getAttribute('userId');

    // Response 是不可变的 - 方法返回新实例
    $response = $response
        ->withHeader('Content-Type', 'application/json')
        ->withStatus(200);

    $response->getBody()->write(json_encode(['page' => $page]));

    return $response;
});
```

### 中间件架构

中间件包装应用程序，可以修改请求和响应：

```php
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

// 基于类的中间件
class JsonBodyParserMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        $contentType = $request->getHeaderLine('Content-Type');

        if (str_contains($contentType, 'application/json')) {
            $contents = json_decode(file_get_contents('php://input'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request = $request->withParsedBody($contents);
            }
        }

        return $handler->handle($request);
    }
}

// 添加中间件到应用
$app->add(new JsonBodyParserMiddleware());

// 闭包中间件
$app->add(function (Request $request, RequestHandlerInterface $handler): Response {
    // 请求前
    $response = $handler->handle($request);
    // 请求后
    return $response->withHeader('X-Custom-Header', 'value');
});
```

## 核心要点

### 安装和项目设置

```bash
# 创建项目目录
mkdir my-slim-app && cd my-slim-app

# 初始化 Composer
composer init

# 安装 Slim 和 PSR-7 实现
composer require slim/slim:"4.*"
composer require slim/psr7

# 可选：安装有用的包
composer require php-di/php-di          # 依赖注入
composer require slim/http              # 扩展的请求/响应
composer require monolog/monolog        # 日志
composer require vlucas/phpdotenv       # 环境变量

# 创建目录结构
mkdir -p public src/{Controllers,Middleware,Services} config
```

### 项目结构

```
my-slim-app/
├── config/
│   ├── container.php       # DI 容器配置
│   ├── middleware.php      # 中间件注册
│   ├── routes.php          # 路由定义
│   └── settings.php        # 应用设置
├── public/
│   └── index.php           # 前端控制器
├── src/
│   ├── Controllers/        # 请求处理器
│   ├── Middleware/         # 自定义中间件
│   ├── Services/           # 业务逻辑
│   └── Repositories/       # 数据访问
├── templates/              # 视图模板（如使用）
├── var/
│   ├── cache/              # 缓存文件
│   └── logs/               # 日志文件
├── vendor/                 # Composer 依赖
├── .env                    # 环境变量
└── composer.json
```

### 基本应用引导

```php
// public/index.php
<?php

declare(strict_types=1);

use DI\ContainerBuilder;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

// 加载环境变量
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// 构建 DI 容器
$containerBuilder = new ContainerBuilder();
$containerBuilder->addDefinitions(__DIR__ . '/../config/container.php');
$container = $containerBuilder->build();

// 使用容器创建应用
AppFactory::setContainer($container);
$app = AppFactory::create();

// 获取设置
$settings = $container->get('settings');

// 添加错误中间件
$app->addErrorMiddleware(
    $settings['displayErrorDetails'],
    $settings['logErrors'],
    $settings['logErrorDetails']
);

// 注册中间件
(require __DIR__ . '/../config/middleware.php')($app);

// 注册路由
(require __DIR__ . '/../config/routes.php')($app);

$app->run();
```

### 路由

```php
// config/routes.php
<?php

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use App\Controllers\UserController;
use App\Controllers\ProductController;
use App\Middleware\AuthMiddleware;

return function (App $app) {
    // 基本路由
    $app->get('/', function ($request, $response) {
        $response->getBody()->write('欢迎使用 Slim！');
        return $response;
    });

    // 带参数的路由
    $app->get('/users/{id}', function ($request, $response, array $args) {
        $response->getBody()->write("用户 ID: " . $args['id']);
        return $response;
    });

    // 带可选参数的路由
    $app->get('/posts[/{id}]', function ($request, $response, array $args) {
        $id = $args['id'] ?? 'all';
        $response->getBody()->write("文章: " . $id);
        return $response;
    });

    // 带正则约束的路由
    $app->get('/articles/{id:[0-9]+}', function ($request, $response, array $args) {
        return $response;
    });

    // 命名路由
    $app->get('/profile', function ($request, $response) {
        return $response;
    })->setName('user.profile');

    // 基于控制器的路由
    $app->get('/users', [UserController::class, 'index']);
    $app->get('/users/{id}', [UserController::class, 'show']);
    $app->post('/users', [UserController::class, 'create']);
    $app->put('/users/{id}', [UserController::class, 'update']);
    $app->delete('/users/{id}', [UserController::class, 'delete']);

    // 路由分组
    $app->group('/api', function (RouteCollectorProxy $group) {
        $group->get('/users', [UserController::class, 'index']);
        $group->get('/products', [ProductController::class, 'index']);
    });

    // 带中间件的分组
    $app->group('/admin', function (RouteCollectorProxy $group) {
        $group->get('/dashboard', [AdminController::class, 'dashboard']);
        $group->get('/users', [AdminController::class, 'users']);
    })->add(AuthMiddleware::class);

    // API 版本控制
    $app->group('/api/v1', function (RouteCollectorProxy $group) {
        $group->get('/users', [Api\V1\UserController::class, 'index']);
    });

    $app->group('/api/v2', function (RouteCollectorProxy $group) {
        $group->get('/users', [Api\V2\UserController::class, 'index']);
    });
};
```

### 依赖注入容器

```php
// config/container.php
<?php

use DI\Container;
use Psr\Container\ContainerInterface;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

return [
    // 设置
    'settings' => [
        'displayErrorDetails' => $_ENV['APP_DEBUG'] === 'true',
        'logErrors' => true,
        'logErrorDetails' => true,
        'db' => [
            'host' => $_ENV['DB_HOST'],
            'database' => $_ENV['DB_DATABASE'],
            'username' => $_ENV['DB_USERNAME'],
            'password' => $_ENV['DB_PASSWORD'],
        ],
    ],

    // 日志器
    LoggerInterface::class => function (ContainerInterface $c) {
        $logger = new Logger('app');
        $logger->pushHandler(new StreamHandler(
            __DIR__ . '/../var/logs/app.log',
            Logger::DEBUG
        ));
        return $logger;
    },

    // PDO 数据库
    PDO::class => function (ContainerInterface $c) {
        $settings = $c->get('settings')['db'];
        $dsn = "mysql:host={$settings['host']};dbname={$settings['database']};charset=utf8mb4";
        return new PDO($dsn, $settings['username'], $settings['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    },

    // 仓库
    UserRepository::class => function (ContainerInterface $c) {
        return new UserRepository($c->get(PDO::class));
    },

    // 服务
    UserService::class => function (ContainerInterface $c) {
        return new UserService(
            $c->get(UserRepository::class),
            $c->get(LoggerInterface::class)
        );
    },

    // 控制器（PHP-DI 自动装配）
    UserController::class => DI\autowire()
        ->constructorParameter('logger', DI\get(LoggerInterface::class)),
];
```

## 代码示例

### 控制器实现

```php
// src/Controllers/UserController.php
<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\UserService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class UserController
{
    public function __construct(
        private UserService $userService,
        private LoggerInterface $logger
    ) {}

    public function index(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = (int) ($params['page'] ?? 1);
        $limit = (int) ($params['limit'] ?? 20);

        $users = $this->userService->getPaginated($page, $limit);
        $total = $this->userService->count();

        $data = [
            'data' => $users,
            'meta' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ];

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        $id = (int) $args['id'];
        $user = $this->userService->find($id);

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => '用户未找到']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(404);
        }

        $response->getBody()->write(json_encode(['data' => $user]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // 验证
        $errors = $this->validate($data, [
            'email' => 'required|email',
            'username' => 'required|min:3',
            'password' => 'required|min:8'
        ]);

        if (!empty($errors)) {
            $response->getBody()->write(json_encode(['errors' => $errors]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(422);
        }

        try {
            $user = $this->userService->create($data);
            $this->logger->info('用户已创建', ['user_id' => $user['id']]);

            $response->getBody()->write(json_encode([
                'message' => '用户创建成功',
                'data' => $user
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(201);

        } catch (\Exception $e) {
            $this->logger->error('用户创建失败', ['error' => $e->getMessage()]);

            $response->getBody()->write(json_encode(['error' => '创建用户失败']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = (int) $args['id'];
        $data = $request->getParsedBody();

        $user = $this->userService->find($id);
        if (!$user) {
            $response->getBody()->write(json_encode(['error' => '用户未找到']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(404);
        }

        $updated = $this->userService->update($id, $data);

        $response->getBody()->write(json_encode([
            'message' => '用户更新成功',
            'data' => $updated
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int) $args['id'];

        if (!$this->userService->find($id)) {
            $response->getBody()->write(json_encode(['error' => '用户未找到']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(404);
        }

        $this->userService->delete($id);

        return $response->withStatus(204);
    }

    private function validate(array $data, array $rules): array
    {
        $errors = [];
        // 简单验证逻辑
        foreach ($rules as $field => $ruleString) {
            $fieldRules = explode('|', $ruleString);
            foreach ($fieldRules as $rule) {
                if ($rule === 'required' && empty($data[$field])) {
                    $errors[$field][] = "$field 是必填项";
                }
                if (str_starts_with($rule, 'min:')) {
                    $min = (int) substr($rule, 4);
                    if (isset($data[$field]) && strlen($data[$field]) < $min) {
                        $errors[$field][] = "$field 至少需要 $min 个字符";
                    }
                }
                if ($rule === 'email' && !filter_var($data[$field] ?? '', FILTER_VALIDATE_EMAIL)) {
                    $errors[$field][] = "$field 必须是有效的邮箱地址";
                }
            }
        }
        return $errors;
    }
}
```

### 中间件示例

```php
// src/Middleware/AuthMiddleware.php
<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response as SlimResponse;

class AuthMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader)) {
            return $this->unauthorized('未提供令牌');
        }

        if (!str_starts_with($authHeader, 'Bearer ')) {
            return $this->unauthorized('无效的令牌格式');
        }

        $token = substr($authHeader, 7);

        try {
            $payload = $this->validateToken($token);
            $request = $request->withAttribute('userId', $payload['user_id']);
            $request = $request->withAttribute('userRole', $payload['role']);
        } catch (\Exception $e) {
            return $this->unauthorized('无效令牌');
        }

        return $handler->handle($request);
    }

    private function validateToken(string $token): array
    {
        // JWT 验证逻辑
        $key = $_ENV['JWT_SECRET'];
        return \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key($key, 'HS256'));
    }

    private function unauthorized(string $message): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode(['error' => $message]));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}

// src/Middleware/CorsMiddleware.php
class CorsMiddleware implements MiddlewareInterface
{
    private array $options;

    public function __construct(array $options = [])
    {
        $this->options = array_merge([
            'origin' => '*',
            'methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            'headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
            'credentials' => true,
            'maxAge' => 86400,
        ], $options);
    }

    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        // 处理预检 OPTIONS 请求
        if ($request->getMethod() === 'OPTIONS') {
            $response = new SlimResponse();
            return $this->addCorsHeaders($response);
        }

        $response = $handler->handle($request);
        return $this->addCorsHeaders($response);
    }

    private function addCorsHeaders(Response $response): Response
    {
        return $response
            ->withHeader('Access-Control-Allow-Origin', $this->options['origin'])
            ->withHeader('Access-Control-Allow-Methods', implode(', ', $this->options['methods']))
            ->withHeader('Access-Control-Allow-Headers', implode(', ', $this->options['headers']))
            ->withHeader('Access-Control-Allow-Credentials', $this->options['credentials'] ? 'true' : 'false')
            ->withHeader('Access-Control-Max-Age', (string) $this->options['maxAge']);
    }
}

// src/Middleware/RateLimitMiddleware.php
class RateLimitMiddleware implements MiddlewareInterface
{
    public function __construct(
        private \Redis $redis,
        private int $maxRequests = 100,
        private int $windowSeconds = 60
    ) {}

    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        $ip = $request->getServerParams()['REMOTE_ADDR'] ?? 'unknown';
        $key = "rate_limit:{$ip}";

        $current = (int) $this->redis->get($key);

        if ($current >= $this->maxRequests) {
            $response = new SlimResponse();
            $response->getBody()->write(json_encode([
                'error' => '请求频率超限',
                'retry_after' => $this->redis->ttl($key)
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withHeader('X-RateLimit-Limit', (string) $this->maxRequests)
                ->withHeader('X-RateLimit-Remaining', '0')
                ->withStatus(429);
        }

        $this->redis->incr($key);
        if ($current === 0) {
            $this->redis->expire($key, $this->windowSeconds);
        }

        $response = $handler->handle($request);

        return $response
            ->withHeader('X-RateLimit-Limit', (string) $this->maxRequests)
            ->withHeader('X-RateLimit-Remaining', (string) ($this->maxRequests - $current - 1));
    }
}
```

### 仓库模式

```php
// src/Repositories/UserRepository.php
<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

class UserRepository
{
    public function __construct(private PDO $pdo) {}

    public function findAll(int $limit = 20, int $offset = 0): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT id, username, email, created_at FROM users LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            "SELECT id, username, email, created_at FROM users WHERE id = :id"
        );
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM users WHERE email = :email"
        );
        $stmt->execute(['email' => $email]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function create(array $data): array
    {
        $stmt = $this->pdo->prepare(
            "INSERT INTO users (username, email, password, created_at)
             VALUES (:username, :email, :password, NOW())"
        );
        $stmt->execute([
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => password_hash($data['password'], PASSWORD_DEFAULT)
        ]);

        return $this->findById((int) $this->pdo->lastInsertId());
    }

    public function update(int $id, array $data): array
    {
        $fields = [];
        $params = ['id' => $id];

        foreach (['username', 'email'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (!empty($fields)) {
            $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        return $this->findById($id);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare("DELETE FROM users WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    public function count(): int
    {
        return (int) $this->pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    }
}
```

## 最佳实践

### 错误处理

```php
// 自定义错误处理器
use Slim\Exception\HttpNotFoundException;
use Slim\Exception\HttpMethodNotAllowedException;

$errorMiddleware = $app->addErrorMiddleware(true, true, true);

// 自定义错误处理器
$errorMiddleware->setDefaultErrorHandler(function (
    Request $request,
    \Throwable $exception,
    bool $displayErrorDetails,
    bool $logErrors,
    bool $logErrorDetails
) use ($app) {
    $statusCode = 500;
    $error = [
        'error' => '内部服务器错误',
        'message' => '发生了意外错误'
    ];

    if ($exception instanceof HttpNotFoundException) {
        $statusCode = 404;
        $error = ['error' => '未找到', 'message' => '资源未找到'];
    } elseif ($exception instanceof HttpMethodNotAllowedException) {
        $statusCode = 405;
        $error = ['error' => '方法不允许'];
    } elseif ($exception instanceof ValidationException) {
        $statusCode = 422;
        $error = ['error' => '验证错误', 'details' => $exception->getErrors()];
    }

    if ($displayErrorDetails) {
        $error['debug'] = [
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString()
        ];
    }

    $response = $app->getResponseFactory()->createResponse($statusCode);
    $response->getBody()->write(json_encode($error));
    return $response->withHeader('Content-Type', 'application/json');
});
```

### 响应工厂模式

```php
// src/Http/JsonResponse.php
<?php

namespace App\Http;

use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Response;

class JsonResponse
{
    public static function create(
        mixed $data,
        int $status = 200,
        array $headers = []
    ): ResponseInterface {
        $response = new Response($status);

        foreach ($headers as $name => $value) {
            $response = $response->withHeader($name, $value);
        }

        $response->getBody()->write(json_encode($data, JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public static function success(mixed $data, int $status = 200): ResponseInterface
    {
        return self::create(['data' => $data], $status);
    }

    public static function error(string $message, int $status = 400, array $details = []): ResponseInterface
    {
        $payload = ['error' => $message];
        if (!empty($details)) {
            $payload['details'] = $details;
        }
        return self::create($payload, $status);
    }

    public static function paginated(
        array $items,
        int $total,
        int $page,
        int $perPage
    ): ResponseInterface {
        return self::create([
            'data' => $items,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => (int) ceil($total / $perPage)
            ]
        ]);
    }
}

// 在控制器中使用
public function index(Request $request, Response $response): Response
{
    $users = $this->userService->getAll();
    return JsonResponse::success($users);
}
```

### 服务层

```php
// src/Services/UserService.php
<?php

namespace App\Services;

use App\Repositories\UserRepository;
use App\Exceptions\ValidationException;
use Psr\Log\LoggerInterface;

class UserService
{
    public function __construct(
        private UserRepository $repository,
        private LoggerInterface $logger
    ) {}

    public function getPaginated(int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;
        return $this->repository->findAll($limit, $offset);
    }

    public function find(int $id): ?array
    {
        return $this->repository->findById($id);
    }

    public function count(): int
    {
        return $this->repository->count();
    }

    public function create(array $data): array
    {
        // 检查邮箱是否已存在
        if ($this->repository->findByEmail($data['email'])) {
            throw new ValidationException(['email' => '邮箱已存在']);
        }

        $user = $this->repository->create($data);

        $this->logger->info('用户已创建', ['user_id' => $user['id']]);

        return $user;
    }

    public function update(int $id, array $data): array
    {
        $existing = $this->repository->findById($id);
        if (!$existing) {
            throw new \RuntimeException('用户未找到');
        }

        // 检查邮箱唯一性
        if (isset($data['email']) && $data['email'] !== $existing['email']) {
            if ($this->repository->findByEmail($data['email'])) {
                throw new ValidationException(['email' => '邮箱已存在']);
            }
        }

        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        $result = $this->repository->delete($id);
        $this->logger->info('用户已删除', ['user_id' => $id]);
        return $result;
    }

    public function authenticate(string $email, string $password): ?array
    {
        $user = $this->repository->findByEmail($email);

        if (!$user || !password_verify($password, $user['password'])) {
            return null;
        }

        unset($user['password']);
        return $user;
    }
}
```

## 常见陷阱

### 忘记响应不可变性

```php
// 错误：Response 方法不会原地修改
$app->get('/test', function ($request, $response) {
    $response->withHeader('X-Custom', 'value'); // 返回新对象，被丢弃！
    $response->getBody()->write('Hello');
    return $response; // 缺少头部
});

// 正确：捕获返回的响应
$app->get('/test', function ($request, $response) {
    $response = $response->withHeader('X-Custom', 'value');
    $response->getBody()->write('Hello');
    return $response;
});

// 或链式调用方法
$app->get('/test', function ($request, $response) {
    $response->getBody()->write('Hello');
    return $response
        ->withHeader('X-Custom', 'value')
        ->withHeader('Content-Type', 'text/plain');
});
```

### 中间件顺序问题

```php
// 中间件以 LIFO 顺序执行（最后添加的对请求先运行，对响应后运行）

// 错误的顺序
$app->add(new AuthMiddleware());      // 先运行（在错误处理之前）
$app->addErrorMiddleware(...);        // 认证中的错误不会被捕获

// 正确的顺序
$app->addErrorMiddleware(...);        // 捕获所有错误
$app->add(new CorsMiddleware());      // CORS 头早期添加
$app->add(new AuthMiddleware());      // 认证在 CORS 之后运行
$app->add(new RateLimitMiddleware()); // 限流先运行

// 可视化流程：
// 请求：  限流 -> 认证 -> CORS -> 错误中间件 -> 路由
// 响应：  路由 -> 错误中间件 -> CORS -> 认证 -> 限流
```

### 不使用依赖注入

```php
// 错误：在控制器内部创建依赖
class UserController
{
    public function index($request, $response)
    {
        $pdo = new PDO(...); // 难以测试，无法复用
        $repo = new UserRepository($pdo);
        $users = $repo->findAll();
        // ...
    }
}

// 正确：注入依赖
class UserController
{
    public function __construct(private UserRepository $repo) {}

    public function index($request, $response)
    {
        $users = $this->repo->findAll();
        // ...
    }
}

// 在容器中注册
$container->set(UserController::class, function ($c) {
    return new UserController($c->get(UserRepository::class));
});
```

## 性能考量

### 路由缓存

```php
// 在生产环境启用路由缓存
$routeCollector = $app->getRouteCollector();
$routeCollector->setCacheFile(__DIR__ . '/../var/cache/routes.cache');

// 路由变更时清除缓存
// rm var/cache/routes.cache
```

### 延迟加载服务

```php
// config/container.php
use DI\Container;

return [
    // 延迟加载昂贵的服务
    HeavyService::class => DI\factory(function (ContainerInterface $c) {
        return new HeavyService(
            $c->get(PDO::class),
            $c->get(LoggerInterface::class)
        );
    })->lazy(),

    // 或使用 PHP-DI 的自动装配与延迟
    ExpensiveService::class => DI\autowire()->lazy(),
];
```

### 响应压缩

```php
// src/Middleware/CompressionMiddleware.php
class CompressionMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        $response = $handler->handle($request);

        $acceptEncoding = $request->getHeaderLine('Accept-Encoding');

        if (str_contains($acceptEncoding, 'gzip')) {
            $body = (string) $response->getBody();

            if (strlen($body) > 1024) { // 仅在值得时压缩
                $compressed = gzencode($body, 6);

                $stream = fopen('php://temp', 'r+');
                fwrite($stream, $compressed);
                rewind($stream);

                return $response
                    ->withHeader('Content-Encoding', 'gzip')
                    ->withHeader('Content-Length', (string) strlen($compressed))
                    ->withBody(new \Slim\Psr7\Stream($stream));
            }
        }

        return $response;
    }
}
```

### 数据库连接池

```php
// 使用持久连接
$container->set(PDO::class, function () {
    $dsn = "mysql:host=localhost;dbname=myapp;charset=utf8mb4";
    return new PDO($dsn, 'user', 'pass', [
        PDO::ATTR_PERSISTENT => true,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
});
```

## 实战场景

### JWT 认证 API

```php
// src/Controllers/AuthController.php
<?php

namespace App\Controllers;

use App\Services\UserService;
use Firebase\JWT\JWT;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AuthController
{
    public function __construct(
        private UserService $userService,
        private string $jwtSecret,
        private int $tokenExpiry = 3600
    ) {}

    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        if (empty($data['email']) || empty($data['password'])) {
            $response->getBody()->write(json_encode([
                'error' => '邮箱和密码为必填项'
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(400);
        }

        $user = $this->userService->authenticate($data['email'], $data['password']);

        if (!$user) {
            $response->getBody()->write(json_encode([
                'error' => '凭据无效'
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }

        $issuedAt = time();
        $payload = [
            'iat' => $issuedAt,
            'exp' => $issuedAt + $this->tokenExpiry,
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'] ?? 'user'
        ];

        $token = JWT::encode($payload, $this->jwtSecret, 'HS256');

        $response->getBody()->write(json_encode([
            'token' => $token,
            'expires_in' => $this->tokenExpiry,
            'user' => $user
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function refresh(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('userId');
        $user = $this->userService->find($userId);

        $issuedAt = time();
        $payload = [
            'iat' => $issuedAt,
            'exp' => $issuedAt + $this->tokenExpiry,
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'] ?? 'user'
        ];

        $token = JWT::encode($payload, $this->jwtSecret, 'HS256');

        $response->getBody()->write(json_encode([
            'token' => $token,
            'expires_in' => $this->tokenExpiry
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function me(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('userId');
        $user = $this->userService->find($userId);

        $response->getBody()->write(json_encode(['data' => $user]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}

// 路由
$app->post('/auth/login', [AuthController::class, 'login']);
$app->group('/auth', function (RouteCollectorProxy $group) {
    $group->post('/refresh', [AuthController::class, 'refresh']);
    $group->get('/me', [AuthController::class, 'me']);
})->add(AuthMiddleware::class);
```

### 文件上传 API

```php
// src/Controllers/FileController.php
<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\UploadedFileInterface;

class FileController
{
    private string $uploadDir;
    private array $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    private int $maxSize = 5 * 1024 * 1024; // 5MB

    public function __construct(string $uploadDir)
    {
        $this->uploadDir = $uploadDir;
    }

    public function upload(Request $request, Response $response): Response
    {
        $uploadedFiles = $request->getUploadedFiles();

        if (empty($uploadedFiles['file'])) {
            $response->getBody()->write(json_encode(['error' => '未上传文件']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(400);
        }

        /** @var UploadedFileInterface $uploadedFile */
        $uploadedFile = $uploadedFiles['file'];

        // 验证上传错误
        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            $response->getBody()->write(json_encode([
                'error' => '上传失败',
                'code' => $uploadedFile->getError()
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(400);
        }

        // 验证文件类型
        $mimeType = $uploadedFile->getClientMediaType();
        if (!in_array($mimeType, $this->allowedTypes)) {
            $response->getBody()->write(json_encode([
                'error' => '无效的文件类型',
                'allowed' => $this->allowedTypes
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(400);
        }

        // 验证文件大小
        if ($uploadedFile->getSize() > $this->maxSize) {
            $response->getBody()->write(json_encode([
                'error' => '文件过大',
                'max_size' => $this->maxSize
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(400);
        }

        // 生成唯一文件名
        $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
        $basename = bin2hex(random_bytes(16));
        $filename = sprintf('%s.%s', $basename, $extension);

        // 移动上传的文件
        $uploadedFile->moveTo($this->uploadDir . '/' . $filename);

        $response->getBody()->write(json_encode([
            'message' => '文件上传成功',
            'data' => [
                'filename' => $filename,
                'original_name' => $uploadedFile->getClientFilename(),
                'size' => $uploadedFile->getSize(),
                'type' => $mimeType
            ]
        ]));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(201);
    }
}
```

## 面试要点

1. **什么是 Slim 框架，何时应该使用它？**
   - Slim 是一个用于构建 API 和小型应用程序的 PHP 微框架。当你需要完全控制架构、构建微服务或想要最小开销而不受框架约束时使用它。

2. **解释 PSR-7 以及为什么 Slim 使用它。**
   - PSR-7 定义了 HTTP 消息（请求/响应）的接口。Slim 使用它来实现互操作性，允许使用任何 PSR-7 实现。消息是不可变的 - 方法返回新实例。

3. **Slim 中的中间件是如何工作的？**
   - 中间件以层的形式包装应用程序。每个中间件可以在传递给下一个之前处理请求，并在返回时修改响应。实现 PSR-15 MiddlewareInterface。

4. **路由中间件和应用中间件有什么区别？**
   - 应用中间件为每个请求运行。路由中间件仅为特定路由或分组运行。路由中间件通过路由/分组上的 `->add()` 添加。

5. **如何在 Slim 中实现认证？**
   - 创建实现 PSR-15 MiddlewareInterface 的 AuthMiddleware。从 Authorization 头提取令牌，验证它（例如 JWT），将用户数据附加到请求属性，或返回 401 响应。

6. **解释 Slim 4 中的依赖注入。**
   - Slim 4 使用 PSR-11 容器。在容器定义中配置服务，通过构造函数注入。PHP-DI 支持自动装配。容器传递给 AppFactory::create()。

7. **如何在 Slim 中处理错误？**
   - 使用带自定义错误处理器的 `$app->addErrorMiddleware()`。捕获异常，返回适当的响应。为开发/生产环境配置显示设置。

## 延伸阅读

- [Slim 框架官方文档](https://www.slimframework.com/docs/v4/)
- [Slim 框架 GitHub 仓库](https://github.com/slimphp/Slim)
- [PSR-7 HTTP 消息接口](https://www.php-fig.org/psr/psr-7/)
- [PSR-15 HTTP 服务器请求处理器](https://www.php-fig.org/psr/psr-15/)
- [PHP-DI 容器文档](https://php-di.org/doc/)
- [Slim 骨架应用](https://github.com/slimphp/Slim-Skeleton)
- [使用 Slim 构建 API](https://www.slimframework.com/docs/v4/cookbook/action-domain-responder.html)
