---
title: Slim Microframework Guide
description: Complete guide to the Slim PHP microframework covering routing, middleware, dependency injection, and building lightweight APIs
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - Slim
  - Microframework
  - API
  - REST
  - PSR-7
status: imported
origin: old/src/content/docs/php/slim.en.md
divergence: 0.213
issues: []
legacy:
  category: PHP
  subcategory: Web Frameworks
  order: 22
  lastUpdated: 2026-01-22
---

Slim is a PHP microframework that helps you quickly write simple yet powerful web applications and APIs. At its core, Slim is a dispatcher that receives an HTTP request, invokes an appropriate callback routine, and returns an HTTP response. It embraces the PSR-7 standard for HTTP message interfaces and PSR-15 for middleware, making it highly interoperable with other PHP components.

## Concept Explanation

Slim follows the microframework philosophy: provide only the essential tools needed to build web applications without imposing unnecessary structure or bloat. Unlike full-stack frameworks, Slim gives you routing, middleware, and dependency injection out of the box, leaving architectural decisions to the developer.

The framework is built around PSR standards, particularly PSR-7 (HTTP Message Interface), PSR-11 (Container Interface), PSR-15 (HTTP Server Request Handlers), and PSR-17 (HTTP Factories). This standards-based approach means Slim components can be swapped with any PSR-compatible implementation.

Slim is ideal for building REST APIs, microservices, and small to medium-sized applications where you want full control over your stack without the overhead of a larger framework. It also serves as an excellent foundation for learning modern PHP practices.

## Core Principles

### Request-Response Cycle

Slim processes HTTP requests through a middleware pipeline and returns HTTP responses:

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

### PSR-7 HTTP Messages

Slim uses PSR-7 request and response objects that are immutable:

```php
// Request object provides access to HTTP request data
$app->get('/users', function (Request $request, Response $response) {
    // Query parameters
    $params = $request->getQueryParams();
    $page = $params['page'] ?? 1;

    // Headers
    $contentType = $request->getHeaderLine('Content-Type');

    // Body (for POST/PUT)
    $body = $request->getParsedBody();

    // Attributes (set by middleware or route)
    $userId = $request->getAttribute('userId');

    // Response is immutable - methods return new instances
    $response = $response
        ->withHeader('Content-Type', 'application/json')
        ->withStatus(200);

    $response->getBody()->write(json_encode(['page' => $page]));

    return $response;
});
```

### Middleware Architecture

Middleware wraps the application and can modify requests and responses:

```php
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

// Class-based middleware
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

// Add middleware to app
$app->add(new JsonBodyParserMiddleware());

// Closure middleware
$app->add(function (Request $request, RequestHandlerInterface $handler): Response {
    // Before
    $response = $handler->handle($request);
    // After
    return $response->withHeader('X-Custom-Header', 'value');
});
```

## Key Concepts

### Installation and Project Setup

```bash
# Create project directory
mkdir my-slim-app && cd my-slim-app

# Initialize Composer
composer init

# Install Slim and PSR-7 implementation
composer require slim/slim:"4.*"
composer require slim/psr7

# Optional: Install useful packages
composer require php-di/php-di          # Dependency injection
composer require slim/http              # Extended request/response
composer require monolog/monolog        # Logging
composer require vlucas/phpdotenv       # Environment variables

# Create directory structure
mkdir -p public src/{Controllers,Middleware,Services} config
```

### Project Structure

```
my-slim-app/
├── config/
│   ├── container.php       # DI container configuration
│   ├── middleware.php      # Middleware registration
│   ├── routes.php          # Route definitions
│   └── settings.php        # Application settings
├── public/
│   └── index.php           # Front controller
├── src/
│   ├── Controllers/        # Request handlers
│   ├── Middleware/         # Custom middleware
│   ├── Services/           # Business logic
│   └── Repositories/       # Data access
├── templates/              # View templates (if using)
├── var/
│   ├── cache/              # Cache files
│   └── logs/               # Log files
├── vendor/                 # Composer dependencies
├── .env                    # Environment variables
└── composer.json
```

### Basic Application Bootstrap

```php
// public/index.php
<?php

declare(strict_types=1);

use DI\ContainerBuilder;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Build DI Container
$containerBuilder = new ContainerBuilder();
$containerBuilder->addDefinitions(__DIR__ . '/../config/container.php');
$container = $containerBuilder->build();

// Create app with container
AppFactory::setContainer($container);
$app = AppFactory::create();

// Get settings
$settings = $container->get('settings');

// Add error middleware
$app->addErrorMiddleware(
    $settings['displayErrorDetails'],
    $settings['logErrors'],
    $settings['logErrorDetails']
);

// Register middleware
(require __DIR__ . '/../config/middleware.php')($app);

// Register routes
(require __DIR__ . '/../config/routes.php')($app);

$app->run();
```

### Routing

```php
// config/routes.php
<?php

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use App\Controllers\UserController;
use App\Controllers\ProductController;
use App\Middleware\AuthMiddleware;

return function (App $app) {
    // Basic routes
    $app->get('/', function ($request, $response) {
        $response->getBody()->write('Welcome to Slim!');
        return $response;
    });

    // Route with parameters
    $app->get('/users/{id}', function ($request, $response, array $args) {
        $response->getBody()->write("User ID: " . $args['id']);
        return $response;
    });

    // Route with optional parameter
    $app->get('/posts[/{id}]', function ($request, $response, array $args) {
        $id = $args['id'] ?? 'all';
        $response->getBody()->write("Posts: " . $id);
        return $response;
    });

    // Route with regex constraint
    $app->get('/articles/{id:[0-9]+}', function ($request, $response, array $args) {
        return $response;
    });

    // Named routes
    $app->get('/profile', function ($request, $response) {
        return $response;
    })->setName('user.profile');

    // Controller-based routes
    $app->get('/users', [UserController::class, 'index']);
    $app->get('/users/{id}', [UserController::class, 'show']);
    $app->post('/users', [UserController::class, 'create']);
    $app->put('/users/{id}', [UserController::class, 'update']);
    $app->delete('/users/{id}', [UserController::class, 'delete']);

    // Route groups
    $app->group('/api', function (RouteCollectorProxy $group) {
        $group->get('/users', [UserController::class, 'index']);
        $group->get('/products', [ProductController::class, 'index']);
    });

    // Group with middleware
    $app->group('/admin', function (RouteCollectorProxy $group) {
        $group->get('/dashboard', [AdminController::class, 'dashboard']);
        $group->get('/users', [AdminController::class, 'users']);
    })->add(AuthMiddleware::class);

    // API versioning
    $app->group('/api/v1', function (RouteCollectorProxy $group) {
        $group->get('/users', [Api\V1\UserController::class, 'index']);
    });

    $app->group('/api/v2', function (RouteCollectorProxy $group) {
        $group->get('/users', [Api\V2\UserController::class, 'index']);
    });
};
```

### Dependency Injection Container

```php
// config/container.php
<?php

use DI\Container;
use Psr\Container\ContainerInterface;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

return [
    // Settings
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

    // Logger
    LoggerInterface::class => function (ContainerInterface $c) {
        $logger = new Logger('app');
        $logger->pushHandler(new StreamHandler(
            __DIR__ . '/../var/logs/app.log',
            Logger::DEBUG
        ));
        return $logger;
    },

    // PDO Database
    PDO::class => function (ContainerInterface $c) {
        $settings = $c->get('settings')['db'];
        $dsn = "mysql:host={$settings['host']};dbname={$settings['database']};charset=utf8mb4";
        return new PDO($dsn, $settings['username'], $settings['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    },

    // Repositories
    UserRepository::class => function (ContainerInterface $c) {
        return new UserRepository($c->get(PDO::class));
    },

    // Services
    UserService::class => function (ContainerInterface $c) {
        return new UserService(
            $c->get(UserRepository::class),
            $c->get(LoggerInterface::class)
        );
    },

    // Controllers (auto-wired by PHP-DI)
    UserController::class => DI\autowire()
        ->constructorParameter('logger', DI\get(LoggerInterface::class)),
];
```

## Code Examples

### Controller Implementation

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
            $response->getBody()->write(json_encode(['error' => 'User not found']));
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

        // Validation
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
            $this->logger->info('User created', ['user_id' => $user['id']]);

            $response->getBody()->write(json_encode([
                'message' => 'User created successfully',
                'data' => $user
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(201);

        } catch (\Exception $e) {
            $this->logger->error('User creation failed', ['error' => $e->getMessage()]);

            $response->getBody()->write(json_encode(['error' => 'Failed to create user']));
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
            $response->getBody()->write(json_encode(['error' => 'User not found']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(404);
        }

        $updated = $this->userService->update($id, $data);

        $response->getBody()->write(json_encode([
            'message' => 'User updated successfully',
            'data' => $updated
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int) $args['id'];

        if (!$this->userService->find($id)) {
            $response->getBody()->write(json_encode(['error' => 'User not found']));
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
        // Simple validation logic
        foreach ($rules as $field => $ruleString) {
            $fieldRules = explode('|', $ruleString);
            foreach ($fieldRules as $rule) {
                if ($rule === 'required' && empty($data[$field])) {
                    $errors[$field][] = "$field is required";
                }
                if (str_starts_with($rule, 'min:')) {
                    $min = (int) substr($rule, 4);
                    if (isset($data[$field]) && strlen($data[$field]) < $min) {
                        $errors[$field][] = "$field must be at least $min characters";
                    }
                }
                if ($rule === 'email' && !filter_var($data[$field] ?? '', FILTER_VALIDATE_EMAIL)) {
                    $errors[$field][] = "$field must be a valid email";
                }
            }
        }
        return $errors;
    }
}
```

### Middleware Examples

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
            return $this->unauthorized('No token provided');
        }

        if (!str_starts_with($authHeader, 'Bearer ')) {
            return $this->unauthorized('Invalid token format');
        }

        $token = substr($authHeader, 7);

        try {
            $payload = $this->validateToken($token);
            $request = $request->withAttribute('userId', $payload['user_id']);
            $request = $request->withAttribute('userRole', $payload['role']);
        } catch (\Exception $e) {
            return $this->unauthorized('Invalid token');
        }

        return $handler->handle($request);
    }

    private function validateToken(string $token): array
    {
        // JWT validation logic
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
        // Handle preflight OPTIONS request
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
                'error' => 'Rate limit exceeded',
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

### Repository Pattern

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

## Best Practices

### Error Handling

```php
// Custom error handler
use Slim\Exception\HttpNotFoundException;
use Slim\Exception\HttpMethodNotAllowedException;

$errorMiddleware = $app->addErrorMiddleware(true, true, true);

// Custom error handler
$errorMiddleware->setDefaultErrorHandler(function (
    Request $request,
    \Throwable $exception,
    bool $displayErrorDetails,
    bool $logErrors,
    bool $logErrorDetails
) use ($app) {
    $statusCode = 500;
    $error = [
        'error' => 'Internal Server Error',
        'message' => 'An unexpected error occurred'
    ];

    if ($exception instanceof HttpNotFoundException) {
        $statusCode = 404;
        $error = ['error' => 'Not Found', 'message' => 'Resource not found'];
    } elseif ($exception instanceof HttpMethodNotAllowedException) {
        $statusCode = 405;
        $error = ['error' => 'Method Not Allowed'];
    } elseif ($exception instanceof ValidationException) {
        $statusCode = 422;
        $error = ['error' => 'Validation Error', 'details' => $exception->getErrors()];
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

### Response Factory Pattern

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

// Usage in controller
public function index(Request $request, Response $response): Response
{
    $users = $this->userService->getAll();
    return JsonResponse::success($users);
}
```

### Service Layer

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
        // Check for existing email
        if ($this->repository->findByEmail($data['email'])) {
            throw new ValidationException(['email' => 'Email already exists']);
        }

        $user = $this->repository->create($data);

        $this->logger->info('User created', ['user_id' => $user['id']]);

        return $user;
    }

    public function update(int $id, array $data): array
    {
        $existing = $this->repository->findById($id);
        if (!$existing) {
            throw new \RuntimeException('User not found');
        }

        // Check email uniqueness
        if (isset($data['email']) && $data['email'] !== $existing['email']) {
            if ($this->repository->findByEmail($data['email'])) {
                throw new ValidationException(['email' => 'Email already exists']);
            }
        }

        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        $result = $this->repository->delete($id);
        $this->logger->info('User deleted', ['user_id' => $id]);
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

## Common Pitfalls

### Forgetting Response Immutability

```php
// WRONG: Response methods don't modify in place
$app->get('/test', function ($request, $response) {
    $response->withHeader('X-Custom', 'value'); // Returns new object, discarded!
    $response->getBody()->write('Hello');
    return $response; // Missing header
});

// CORRECT: Capture the returned response
$app->get('/test', function ($request, $response) {
    $response = $response->withHeader('X-Custom', 'value');
    $response->getBody()->write('Hello');
    return $response;
});

// Or chain methods
$app->get('/test', function ($request, $response) {
    $response->getBody()->write('Hello');
    return $response
        ->withHeader('X-Custom', 'value')
        ->withHeader('Content-Type', 'text/plain');
});
```

### Middleware Order Issues

```php
// Middleware executes in LIFO order (last added runs first for request, last for response)

// WRONG order for typical needs
$app->add(new AuthMiddleware());      // Runs first (before error handling)
$app->addErrorMiddleware(...);        // Errors in auth won't be caught

// CORRECT order
$app->addErrorMiddleware(...);        // Catches all errors
$app->add(new CorsMiddleware());      // CORS headers added early
$app->add(new AuthMiddleware());      // Auth runs after CORS
$app->add(new RateLimitMiddleware()); // Rate limit runs first

// Visual flow:
// Request:  RateLimit -> Auth -> CORS -> ErrorMiddleware -> Route
// Response: Route -> ErrorMiddleware -> CORS -> Auth -> RateLimit
```

### Not Using Dependency Injection

```php
// WRONG: Creating dependencies inside controllers
class UserController
{
    public function index($request, $response)
    {
        $pdo = new PDO(...); // Hard to test, no reuse
        $repo = new UserRepository($pdo);
        $users = $repo->findAll();
        // ...
    }
}

// CORRECT: Inject dependencies
class UserController
{
    public function __construct(private UserRepository $repo) {}

    public function index($request, $response)
    {
        $users = $this->repo->findAll();
        // ...
    }
}

// Register in container
$container->set(UserController::class, function ($c) {
    return new UserController($c->get(UserRepository::class));
});
```

## Performance Considerations

### Route Caching

```php
// Enable route caching in production
$routeCollector = $app->getRouteCollector();
$routeCollector->setCacheFile(__DIR__ . '/../var/cache/routes.cache');

// Clear cache when routes change
// rm var/cache/routes.cache
```

### Lazy Loading Services

```php
// config/container.php
use DI\Container;

return [
    // Lazy load expensive services
    HeavyService::class => DI\factory(function (ContainerInterface $c) {
        return new HeavyService(
            $c->get(PDO::class),
            $c->get(LoggerInterface::class)
        );
    })->lazy(),

    // Or use PHP-DI's autowiring with lazy
    ExpensiveService::class => DI\autowire()->lazy(),
];
```

### Response Compression

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

            if (strlen($body) > 1024) { // Only compress if worth it
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

### Database Connection Pooling

```php
// Use persistent connections
$container->set(PDO::class, function () {
    $dsn = "mysql:host=localhost;dbname=myapp;charset=utf8mb4";
    return new PDO($dsn, 'user', 'pass', [
        PDO::ATTR_PERSISTENT => true,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
});
```

## Real-World Scenarios

### JWT Authentication API

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
                'error' => 'Email and password are required'
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(400);
        }

        $user = $this->userService->authenticate($data['email'], $data['password']);

        if (!$user) {
            $response->getBody()->write(json_encode([
                'error' => 'Invalid credentials'
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

// Routes
$app->post('/auth/login', [AuthController::class, 'login']);
$app->group('/auth', function (RouteCollectorProxy $group) {
    $group->post('/refresh', [AuthController::class, 'refresh']);
    $group->get('/me', [AuthController::class, 'me']);
})->add(AuthMiddleware::class);
```

### File Upload API

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
            $response->getBody()->write(json_encode(['error' => 'No file uploaded']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(400);
        }

        /** @var UploadedFileInterface $uploadedFile */
        $uploadedFile = $uploadedFiles['file'];

        // Validate upload error
        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            $response->getBody()->write(json_encode([
                'error' => 'Upload failed',
                'code' => $uploadedFile->getError()
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(400);
        }

        // Validate file type
        $mimeType = $uploadedFile->getClientMediaType();
        if (!in_array($mimeType, $this->allowedTypes)) {
            $response->getBody()->write(json_encode([
                'error' => 'Invalid file type',
                'allowed' => $this->allowedTypes
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(400);
        }

        // Validate file size
        if ($uploadedFile->getSize() > $this->maxSize) {
            $response->getBody()->write(json_encode([
                'error' => 'File too large',
                'max_size' => $this->maxSize
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(400);
        }

        // Generate unique filename
        $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
        $basename = bin2hex(random_bytes(16));
        $filename = sprintf('%s.%s', $basename, $extension);

        // Move uploaded file
        $uploadedFile->moveTo($this->uploadDir . '/' . $filename);

        $response->getBody()->write(json_encode([
            'message' => 'File uploaded successfully',
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

## Interview Key Points

1. **What is Slim Framework and when should you use it?**
   - Slim is a PHP microframework for building APIs and small applications. Use it when you need full control over architecture, building microservices, or want minimal overhead without framework opinions.

2. **Explain PSR-7 and why Slim uses it.**
   - PSR-7 defines interfaces for HTTP messages (Request/Response). Slim uses it for interoperability, allowing any PSR-7 implementation. Messages are immutable - methods return new instances.

3. **How does middleware work in Slim?**
   - Middleware wraps the application in layers. Each middleware can process the request before passing to the next, and modify the response on the way back. Implements PSR-15 MiddlewareInterface.

4. **What's the difference between route middleware and application middleware?**
   - Application middleware runs for every request. Route middleware only runs for specific routes or groups. Route middleware is added via `->add()` on routes/groups.

5. **How would you implement authentication in Slim?**
   - Create AuthMiddleware implementing PSR-15 MiddlewareInterface. Extract token from Authorization header, validate it (e.g., JWT), attach user data to request attributes, or return 401 response.

6. **Explain dependency injection in Slim 4.**
   - Slim 4 uses PSR-11 containers. Configure services in container definition, inject via constructor. PHP-DI supports autowiring. Container passed to AppFactory::create().

7. **How do you handle errors in Slim?**
   - Use `$app->addErrorMiddleware()` with custom error handler. Catches exceptions, returns appropriate responses. Configure display settings for dev/prod environments.

## Further Reading

- [Slim Framework Official Documentation](https://www.slimframework.com/docs/v4/)
- [Slim Framework GitHub Repository](https://github.com/slimphp/Slim)
- [PSR-7 HTTP Message Interface](https://www.php-fig.org/psr/psr-7/)
- [PSR-15 HTTP Server Request Handlers](https://www.php-fig.org/psr/psr-15/)
- [PHP-DI Container Documentation](https://php-di.org/doc/)
- [Slim Skeleton Application](https://github.com/slimphp/Slim-Skeleton)
- [Building APIs with Slim](https://www.slimframework.com/docs/v4/cookbook/action-domain-responder.html)
