---
title: PHP Namespaces
description: Learn PHP namespaces to organize code, avoid naming conflicts and implement autoloading
track: php
section: basics
difficulty: intermediate
tags:
  - PHP
  - namespaces
  - autoloading
status: imported
origin: old/src/content/docs/php/namespaces.en.md
divergence: 0.218
issues: []
legacy:
  category: PHP
  subcategory: Core Concepts
  order: 11
  lastUpdated: 2026-01-07
---

Namespaces are an important feature introduced in PHP 5.3.0 to solve naming conflicts between classes, functions, and constants in your code. This article comprehensively covers the usage and best practices of PHP namespaces.

## What Are Namespaces

A namespace can be thought of as a container that encapsulates related classes, interfaces, functions, and constants. Like directories in a file system, namespaces allow classes with the same name to exist in different "directories," thereby avoiding naming conflicts.

### Why Do We Need Namespaces

In large projects or when using third-party libraries, you often encounter the following problems:

1. **Naming conflicts**: Different libraries may define classes with the same name
2. **Code organization**: Need a way to logically organize code
3. **Autoloading**: Need to automatically load corresponding files based on class names

```php
<?php
// Without namespaces, all classes are in the global space
class User {}          // User in global space
class User {}          // Error! Class name conflict

// With namespaces
namespace App\Models;
class User {}          // App\Models\User

namespace App\Http\Controllers;
class User {}          // App\Http\Controllers\User (completely different class)
```

### What Can Namespaces Encapsulate

PHP namespaces can encapsulate the following elements:

- **Classes** (including abstract classes and traits)
- **Interfaces**
- **Enums** (PHP 8.1+)
- **Functions**
- **Constants**

```php
<?php
namespace App\Utils;

// Class
class Helper {}

// Interface
interface Exportable {}

// Trait
trait Loggable {}

// Enum (PHP 8.1+)
enum Status: string {
    case Active = 'active';
    case Inactive = 'inactive';
}

// Function
function formatDate($date) {
    return date('Y-m-d', strtotime($date));
}

// Constant
const VERSION = '1.0.0';
```

## Namespace Basics

### Defining Namespaces

Use the `namespace` keyword to define a namespace, which must be placed at the very beginning of the file (except for `declare` statements):

```php
<?php
declare(strict_types=1);  // declare statement can come before namespace

namespace App\Models;

// Namespace declaration must come before any other code
// The following are all errors:
// echo "hello";           // Error!
// $x = 1;                 // Error!
// function test() {}      // Error!

class User
{
    private string $name;
    private string $email;

    public function __construct(string $name, string $email)
    {
        $this->name = $name;
        $this->email = $email;
    }

    public function getName(): string
    {
        return $this->name;
    }
}
```

### Namespace Hierarchy

Namespaces can define multi-level structures using the backslash `\`:

```php
<?php
namespace App\Services\Payment;

class PaymentProcessor
{
    public function process(float $amount): bool
    {
        // Payment processing logic
        return true;
    }
}
```

```php
<?php
namespace App\Services\Payment\Providers;

class AlipayProvider
{
    public function pay(float $amount): array
    {
        return [
            'provider' => 'alipay',
            'amount' => $amount,
            'status' => 'success'
        ];
    }
}
```

### Defining Multiple Namespaces in One File

Although not recommended, you can define multiple namespaces in a single file:

```php
<?php
// Method 1: Simple combination syntax (not recommended)
namespace App\Models;

class User {}

namespace App\Services;

class UserService {}
```

```php
<?php
// Method 2: Bracketed syntax (slightly better but still not recommended)
namespace App\Models {
    class User
    {
        public string $name;
    }
}

namespace App\Services {
    class UserService
    {
        public function getUser(): \App\Models\User
        {
            return new \App\Models\User();
        }
    }
}

// Best practice: one file, one namespace, one class
```

## The use Statement for Imports

### Fully Qualified Names

Access classes using the complete namespace path:

```php
<?php
namespace App\Controllers;

class UserController
{
    public function show(int $id)
    {
        // Using fully qualified names
        $user = new \App\Models\User('John', 'john@example.com');
        $service = new \App\Services\UserService();

        return $service->format($user);
    }
}
```

### Basic Import

Use the `use` keyword to import classes from namespaces, making code more concise:

```php
<?php
namespace App\Controllers;

use App\Models\User;
use App\Services\UserService;
use App\Repositories\UserRepository;

class UserController
{
    private UserService $userService;
    private UserRepository $userRepository;

    public function __construct()
    {
        $this->userService = new UserService();
        $this->userRepository = new UserRepository();
    }

    public function index(): array
    {
        return $this->userRepository->findAll();
    }

    public function store(array $data): User
    {
        $user = new User($data['name'], $data['email']);
        return $this->userRepository->save($user);
    }
}
```

### Importing Functions and Constants

PHP 5.6+ supports importing functions and constants:

```php
<?php
namespace App\Helpers;

// Define functions and constants
const VERSION = '1.0.0';
const MAX_RETRY = 3;

function formatDate(string $date): string
{
    return date('Y-m-d', strtotime($date));
}

function formatMoney(float $amount): string
{
    return number_format($amount, 2, '.', ',');
}
```

```php
<?php
namespace App\Controllers;

// Import class
use App\Models\User;

// Import functions
use function App\Helpers\formatDate;
use function App\Helpers\formatMoney;

// Import constants
use const App\Helpers\VERSION;
use const App\Helpers\MAX_RETRY;

class HomeController
{
    public function index(): array
    {
        return [
            'version' => VERSION,
            'max_retry' => MAX_RETRY,
            'date' => formatDate('2026-01-07'),
            'price' => formatMoney(1234.5)
        ];
    }
}
```

### Group Use Declarations (PHP 7.0+)

PHP 7.0 introduced group use declarations syntax for more concise imports from the same namespace:

```php
<?php
namespace App\Controllers;

// Group import classes
use App\Models\{
    User,
    Post,
    Comment
};

// Group import mixing classes, functions, and constants
use App\Helpers\{
    StringHelper,
    function formatDate,
    function formatMoney,
    const VERSION
};

// You can also use aliases in groups
use App\Services\{
    UserService as US,
    PostService as PS,
    CommentService as CS
};

class BlogController
{
    private US $userService;
    private PS $postService;

    public function __construct()
    {
        $this->userService = new US();
        $this->postService = new PS();
    }
}
```

## Aliasing

When imported class names conflict with class names in the current namespace, or when class names are too long, you can use aliases.

### Class Aliases

```php
<?php
namespace App\Controllers;

use App\Models\User as UserModel;
use App\Services\User as UserService;
use App\External\ThirdParty\VeryLongClassName as ShortName;

class UserController
{
    private UserService $service;

    public function __construct()
    {
        $this->service = new UserService();
    }

    public function show(int $id): UserModel
    {
        return $this->service->findById($id);
    }

    public function process(): void
    {
        $handler = new ShortName();
        $handler->execute();
    }
}
```

### Namespace Aliases

You can create aliases for entire namespaces:

```php
<?php
namespace App\Controllers;

use App\Models as M;
use App\Services as S;
use App\External\ThirdParty\Payment as PaymentLib;

class OrderController
{
    public function create(): void
    {
        $user = new M\User('John', 'john@example.com');
        $order = new M\Order();
        $service = new S\OrderService();

        $payment = new PaymentLib\Processor();
        $payment->charge($order->total);
    }
}
```

### Resolving Naming Conflicts

```php
<?php
namespace App\Services;

// Two Logger classes from different libraries
use Monolog\Logger as MonologLogger;
use App\Logging\Logger as AppLogger;

// Two different Exception classes
use App\Exceptions\ValidationException;
use Symfony\Component\Validator\Exception\ValidationFailedException;

class LoggingService
{
    private MonologLogger $monolog;
    private AppLogger $appLogger;

    public function __construct()
    {
        // With aliases, code is clear and unambiguous
        $this->monolog = new MonologLogger('app');
        $this->appLogger = new AppLogger();
    }

    public function log(string $message): void
    {
        // Use Monolog
        $this->monolog->info($message);

        // Use custom Logger
        $this->appLogger->write($message);
    }
}
```

## The Global Namespace

Code without a namespace declaration belongs to the global namespace. When accessing global classes, functions, or constants from within a namespace, you need to use a backslash prefix.

### Accessing Global Classes

```php
<?php
namespace App\Services;

class DateService
{
    public function getCurrentTime(): \DateTime
    {
        // DateTime is a PHP built-in class in the global namespace
        return new \DateTime();
    }

    public function formatDate(\DateTime $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    public function handleException(): void
    {
        try {
            // Some operation
        } catch (\Exception $e) {
            // Exception is a global class
            echo $e->getMessage();
        }
    }
}
```

### Fallback Mechanism for Functions and Constants

For functions and constants (not classes), if not found in the current namespace, PHP will automatically look in the global namespace:

```php
<?php
namespace App\Utils;

// Define a function with the same name as a global one
function strlen($str)
{
    echo "Custom strlen called\n";
    return \strlen($str);  // Call global strlen
}

const PHP_VERSION = 'custom';

class Helper
{
    public function example(): void
    {
        // Function: first looks for App\Utils\strlen, uses it if found
        echo strlen('hello');    // Calls App\Utils\strlen

        // Constant: first looks for App\Utils\PHP_VERSION, uses it if found
        echo PHP_VERSION;        // Output: custom

        // Explicitly use global versions
        echo \strlen('hello');   // Call global strlen
        echo \PHP_VERSION;       // Output: 8.x.x (global version)

        // Undefined functions fall back to global space
        $time = time();          // Calls global time() (since App\Utils\time is not defined)

        // But for clarity and performance, adding backslash is recommended
        $time = \time();
        $arr = \array_merge([1, 2], [3, 4]);
    }
}
```

### Classes Do Not Fall Back

```php
<?php
namespace App\Services;

class DataProcessor
{
    public function process()
    {
        // Error: DateTime not found in current namespace, and classes don't fall back
        $date = new DateTime();  // Fatal error: Class 'App\Services\DateTime' not found

        // Correct: use fully qualified name
        $date = new \DateTime();

        // Or import at the top of the file
        // use DateTime;
        // $date = new DateTime();
    }
}
```

## PSR-4 Autoloading

PSR-4 is an autoloading standard established by PHP-FIG that defines the mapping relationship between namespaces and file paths.

### PSR-4 Specification Key Points

1. Fully qualified class name format: `\<NamespaceName>(\<SubNamespaceNames>)*\<ClassName>`
2. Namespace prefix corresponds to a base directory
3. Sub-namespaces correspond to subdirectories under the base directory
4. Class name corresponds to file name (with `.php` suffix)

### Directory Structure Example

```
project-root/
├── composer.json
├── src/
│   ├── Controllers/
│   │   ├── UserController.php
│   │   └── PostController.php
│   ├── Models/
│   │   ├── User.php
│   │   └── Post.php
│   ├── Services/
│   │   ├── UserService.php
│   │   └── PostService.php
│   └── Repositories/
│       ├── UserRepository.php
│       └── PostRepository.php
└── tests/
    └── Unit/
        └── UserTest.php
```

### Composer Configuration

Configure PSR-4 autoloading in `composer.json`:

```json
{
    "name": "myapp/example",
    "autoload": {
        "psr-4": {
            "App\\": "src/",
            "Tests\\": "tests/"
        },
        "files": [
            "src/Helpers/helpers.php"
        ]
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    }
}
```

After configuration, run `composer dump-autoload` to generate the autoload files.

### Using Composer Autoloading

```php
<?php
// index.php or entry file
require_once __DIR__ . '/vendor/autoload.php';

use App\Controllers\UserController;
use App\Services\UserService;

$controller = new UserController();
$users = $controller->index();
```

### Implementing PSR-4 Autoloader Manually

Understanding the autoloading principle:

```php
<?php
spl_autoload_register(function (string $class): void {
    // Project namespace prefix
    $prefix = 'App\\';

    // Base directory corresponding to the namespace prefix
    $baseDir = __DIR__ . '/src/';

    // Check if the class uses this namespace prefix
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        // Not our namespace, let other autoloaders handle it
        return;
    }

    // Get the relative class name
    $relativeClass = substr($class, $len);

    // Replace namespace separators with directory separators, add .php suffix
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    // If the file exists, load it
    if (file_exists($file)) {
        require $file;
    }
});
```

### Multiple Namespace Prefix Configuration

```php
<?php
class Autoloader
{
    private array $prefixes = [];

    public function register(): void
    {
        spl_autoload_register([$this, 'loadClass']);
    }

    public function addNamespace(string $prefix, string $baseDir): void
    {
        // Normalize the namespace prefix
        $prefix = trim($prefix, '\\') . '\\';

        // Normalize the base directory
        $baseDir = rtrim($baseDir, DIRECTORY_SEPARATOR) . '/';

        // Initialize the namespace prefix array
        if (!isset($this->prefixes[$prefix])) {
            $this->prefixes[$prefix] = [];
        }

        // Add the base directory to the namespace prefix
        $this->prefixes[$prefix][] = $baseDir;
    }

    public function loadClass(string $class): bool
    {
        // Current namespace prefix
        $prefix = $class;

        // Find the namespace prefix from the fully qualified class name
        while (($pos = strrpos($prefix, '\\')) !== false) {
            // Keep the namespace separator
            $prefix = substr($class, 0, $pos + 1);

            // Relative class name
            $relativeClass = substr($class, $pos + 1);

            // Try to load the mapped file
            $mappedFile = $this->loadMappedFile($prefix, $relativeClass);
            if ($mappedFile) {
                return true;
            }

            // Remove the trailing namespace separator and continue the loop
            $prefix = rtrim($prefix, '\\');
        }

        return false;
    }

    private function loadMappedFile(string $prefix, string $relativeClass): bool
    {
        if (!isset($this->prefixes[$prefix])) {
            return false;
        }

        foreach ($this->prefixes[$prefix] as $baseDir) {
            $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

            if ($this->requireFile($file)) {
                return true;
            }
        }

        return false;
    }

    private function requireFile(string $file): bool
    {
        if (file_exists($file)) {
            require $file;
            return true;
        }
        return false;
    }
}

// Using the autoloader
$loader = new Autoloader();
$loader->register();
$loader->addNamespace('App', __DIR__ . '/src');
$loader->addNamespace('Vendor\\Package', __DIR__ . '/vendor/package/src');
```

### Autoloading Optimization

```php
<?php
// Composer's classmap optimization
// Run: composer dump-autoload --optimize or composer dump-autoload -o

// This generates an optimized classmap, converting PSR-4 autoloading to classmap
// Significantly reduces filesystem operations, improving loading speed
```

```json
// Enable auto-optimization in composer.json
{
    "config": {
        "optimize-autoloader": true,
        "classmap-authoritative": true
    }
}
```

## Namespace Resolution Rules

Understanding how PHP resolves class names is crucial.

### Three Ways to Reference Class Names

```php
<?php
namespace App\Controllers;

use App\Models\User;
use App\Services\UserService as Service;

class ExampleController
{
    public function example(): void
    {
        // 1. Unqualified name
        // Looks in the current namespace
        $user = new User();  // Actually App\Models\User (because of use)

        // 2. Qualified name
        // Relative to the current namespace
        $model = new Models\Post();  // Actually App\Controllers\Models\Post

        // 3. Fully qualified name
        // Starts from the global namespace
        $post = new \App\Models\Post();  // Explicitly specifies complete path
    }
}
```

### The namespace Keyword and __NAMESPACE__ Constant

```php
<?php
namespace App\Services;

class ServiceFactory
{
    public function createFromSameNamespace(string $className): object
    {
        // Use the magic constant to get the current namespace name
        echo __NAMESPACE__;  // Output: App\Services

        // Dynamically build class name
        $class = __NAMESPACE__ . '\\' . $className;
        return new $class();
    }

    public function example(): void
    {
        // Use namespace keyword to reference the current namespace
        $service = new namespace\UserService();  // App\Services\UserService
    }
}
```

### Notes on Dynamic Class Names

```php
<?php
namespace App\Services;

use App\Models\User;

class DynamicLoader
{
    public function load(string $class): object
    {
        // Class names in strings don't automatically resolve namespaces
        return new $class();  // $class must be a fully qualified name
    }

    public function example(): void
    {
        // Error: string 'User' won't resolve to App\Models\User
        $this->load('User');  // Will look for global \User

        // Correct: use ::class to get fully qualified name
        $this->load(User::class);  // App\Models\User

        // Or manually specify the complete name
        $this->load('App\\Models\\User');
    }
}
```

## Best Practices

### Follow PSR-4 Standards

```php
<?php
// Namespace strictly corresponds to directory structure
// File path: src/Services/Payment/PaymentGateway.php
namespace App\Services\Payment;

class PaymentGateway
{
    // Class name matches file name (PaymentGateway.php)
}
```

### Define Only One Class Per File

```php
<?php
// Good practice: one file, one class
// src/Models/User.php
namespace App\Models;

class User
{
    // Class definition
}
```

### Use Meaningful Namespace Structures

```php
<?php
// Good namespace design
namespace App\Domain\Order\Services;      // Domain-driven design
namespace App\Infrastructure\Persistence; // Infrastructure layer
namespace App\Application\UseCases;       // Application layer use cases

// Organize by functionality
namespace App\Services\Authentication;     // Authentication service
namespace App\Services\Payment;            // Payment service
namespace App\Http\Controllers\Api\V1;     // API v1 controllers
```

### Avoid Deep Nesting

```php
<?php
// Not recommended: too many levels
namespace App\Modules\Core\Base\Abstract\Services\User\Admin\Reports;

// Recommended: keep reasonable levels
namespace App\Services\Reports;
```

### Organizing Import Statements

```php
<?php
namespace App\Controllers;

// 1. PHP built-in classes
use DateTime;
use Exception;
use InvalidArgumentException;

// 2. Third-party libraries
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Monolog\Logger;

// 3. Project internal classes
use App\Models\User;
use App\Services\UserService;
use App\Repositories\UserRepository;

class UserController
{
    // Controller code
}
```

### Organizing Interfaces and Implementations

```php
<?php
// Interfaces in Contracts namespace
// File: src/Contracts/PaymentGatewayInterface.php
namespace App\Contracts;

interface PaymentGatewayInterface
{
    public function charge(float $amount): bool;
    public function refund(string $transactionId): bool;
}
```

```php
<?php
// Implementation classes in corresponding namespaces
// File: src/Services/Payment/StripeGateway.php
namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;

class StripeGateway implements PaymentGatewayInterface
{
    public function charge(float $amount): bool
    {
        // Stripe payment implementation
        return true;
    }

    public function refund(string $transactionId): bool
    {
        // Stripe refund implementation
        return true;
    }
}
```

```php
<?php
// File: src/Services/Payment/AlipayGateway.php
namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;

class AlipayGateway implements PaymentGatewayInterface
{
    public function charge(float $amount): bool
    {
        // Alipay implementation
        return true;
    }

    public function refund(string $transactionId): bool
    {
        // Alipay refund implementation
        return true;
    }
}
```

### Using Imported Classes in Type Declarations

```php
<?php
namespace App\Services;

use App\Models\User;
use App\Contracts\UserRepositoryInterface;
use DateTimeInterface;

class UserService
{
    // Use imported types
    public function __construct(
        private UserRepositoryInterface $repository
    ) {}

    // Return type uses imported class
    public function find(int $id): ?User
    {
        return $this->repository->find($id);
    }

    // For global classes, import then use
    public function getCreatedAt(): DateTimeInterface
    {
        return new \DateTime();
    }
}
```

## Common Issues and Solutions

### Class Not Found Errors

```php
<?php
namespace App\Services;

// Error: Class 'User' not found
$user = new User();

// Solution 1: use fully qualified name
$user = new \App\Models\User();

// Solution 2: add use statement
use App\Models\User;
$user = new User();
```

### Namespace Conflicts

```php
<?php
namespace App\Controllers;

// Two classes with same name from different namespaces
use App\Models\User;
use App\External\User;  // Error: duplicate import

// Solution: use aliases
use App\Models\User;
use App\External\User as ExternalUser;

$user = new User();
$externalUser = new ExternalUser();
```

### Scope of use Statements

```php
<?php
namespace App\Controllers;

use App\Models\User;  // use is only valid in the current file

class UserController
{
    public function getUser()
    {
        return new User();  // Correct
    }
}

// In another file
namespace App\Controllers;

class AdminController
{
    public function getUser()
    {
        return new User();  // Error! This file doesn't have use App\Models\User
    }
}
```

### Namespaces in Anonymous Functions

```php
<?php
namespace App\Services;

use App\Models\User;

class UserProcessor
{
    public function process(): void
    {
        // Anonymous functions inherit use imports from the current file
        $callback = function ($id) {
            return User::find($id);  // Correct, can use imported User
        };

        // But dynamic class names don't auto-resolve
        $className = 'User';
        $user = new $className();  // Error! Looks for global User

        // Correct approach
        $className = User::class;  // Get fully qualified name
        $user = new $className();  // Correct
    }
}
```

## Practical Example: Complete Project Structure

Below is a complete project example using namespaces.

### Directory Structure

```
myapp/
├── composer.json
├── public/
│   └── index.php
├── src/
│   ├── Contracts/
│   │   └── RepositoryInterface.php
│   ├── Models/
│   │   └── User.php
│   ├── Repositories/
│   │   ├── AbstractRepository.php
│   │   └── UserRepository.php
│   ├── Services/
│   │   └── UserService.php
│   └── Controllers/
│       └── UserController.php
└── tests/
    └── UserServiceTest.php
```

### composer.json

```json
{
    "name": "myapp/example",
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    }
}
```

### Interface Definition

```php
<?php
// src/Contracts/RepositoryInterface.php
namespace App\Contracts;

interface RepositoryInterface
{
    public function find(int $id): ?object;
    public function findAll(): array;
    public function save(object $entity): object;
    public function delete(int $id): bool;
}
```

### Model Class

```php
<?php
// src/Models/User.php
namespace App\Models;

class User
{
    private ?int $id = null;

    public function __construct(
        private string $name,
        private string $email
    ) {}

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): self
    {
        $this->id = $id;
        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email
        ];
    }
}
```

### Repository Classes

```php
<?php
// src/Repositories/AbstractRepository.php
namespace App\Repositories;

use App\Contracts\RepositoryInterface;

abstract class AbstractRepository implements RepositoryInterface
{
    protected array $storage = [];
    protected int $nextId = 1;

    abstract protected function getEntityClass(): string;

    public function find(int $id): ?object
    {
        return $this->storage[$id] ?? null;
    }

    public function findAll(): array
    {
        return array_values($this->storage);
    }

    public function delete(int $id): bool
    {
        if (isset($this->storage[$id])) {
            unset($this->storage[$id]);
            return true;
        }
        return false;
    }
}
```

```php
<?php
// src/Repositories/UserRepository.php
namespace App\Repositories;

use App\Models\User;
use InvalidArgumentException;

class UserRepository extends AbstractRepository
{
    protected function getEntityClass(): string
    {
        return User::class;
    }

    public function save(object $entity): object
    {
        if (!$entity instanceof User) {
            throw new InvalidArgumentException('Entity must be of type User');
        }

        if ($entity->getId() === null) {
            $entity->setId($this->nextId++);
        }

        $this->storage[$entity->getId()] = $entity;
        return $entity;
    }

    public function findByEmail(string $email): ?User
    {
        foreach ($this->storage as $user) {
            if ($user->getEmail() === $email) {
                return $user;
            }
        }
        return null;
    }
}
```

### Service Class

```php
<?php
// src/Services/UserService.php
namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;
use InvalidArgumentException;

class UserService
{
    public function __construct(
        private UserRepository $repository
    ) {}

    public function createUser(string $name, string $email): User
    {
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email address');
        }

        // Check if email already exists
        if ($this->repository->findByEmail($email) !== null) {
            throw new InvalidArgumentException('Email already registered');
        }

        $user = new User($name, $email);
        return $this->repository->save($user);
    }

    public function getUserById(int $id): ?User
    {
        return $this->repository->find($id);
    }

    public function getAllUsers(): array
    {
        return $this->repository->findAll();
    }

    public function deleteUser(int $id): bool
    {
        return $this->repository->delete($id);
    }
}
```

### Controller Class

```php
<?php
// src/Controllers/UserController.php
namespace App\Controllers;

use App\Services\UserService;
use App\Repositories\UserRepository;
use InvalidArgumentException;

class UserController
{
    private UserService $userService;

    public function __construct()
    {
        $repository = new UserRepository();
        $this->userService = new UserService($repository);
    }

    public function index(): array
    {
        $users = $this->userService->getAllUsers();
        return [
            'status' => 'success',
            'data' => array_map(fn($user) => $user->toArray(), $users)
        ];
    }

    public function store(array $data): array
    {
        try {
            $user = $this->userService->createUser(
                $data['name'] ?? '',
                $data['email'] ?? ''
            );

            return [
                'status' => 'success',
                'data' => $user->toArray()
            ];
        } catch (InvalidArgumentException $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    public function show(int $id): array
    {
        $user = $this->userService->getUserById($id);

        if ($user === null) {
            return [
                'status' => 'error',
                'message' => 'User not found'
            ];
        }

        return [
            'status' => 'success',
            'data' => $user->toArray()
        ];
    }
}
```

### Entry File

```php
<?php
// public/index.php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Controllers\UserController;

$controller = new UserController();

// Create user
$result = $controller->store([
    'name' => 'John Doe',
    'email' => 'john@example.com'
]);
echo "Create user: " . json_encode($result) . "\n";

// Get all users
$result = $controller->index();
echo "All users: " . json_encode($result) . "\n";

// Get single user
$result = $controller->show(1);
echo "User details: " . json_encode($result) . "\n";
```

### Test Class

```php
<?php
// tests/UserServiceTest.php
namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Services\UserService;
use App\Repositories\UserRepository;
use App\Models\User;

class UserServiceTest extends TestCase
{
    private UserService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $repository = new UserRepository();
        $this->service = new UserService($repository);
    }

    public function testCreateUserReturnsUser(): void
    {
        $user = $this->service->createUser('Test User', 'test@example.com');

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('Test User', $user->getName());
        $this->assertEquals('test@example.com', $user->getEmail());
    }

    public function testCreateUserWithInvalidEmail(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email address');

        $this->service->createUser('Test User', 'invalid-email');
    }
}
```

## Summary

PHP namespaces are fundamental to modern PHP development. Mastering them is crucial for writing maintainable and extensible code. We covered the following core topics:

1. **Basic concepts**: Understanding the purpose and definition of namespaces
2. **use statements**: Importing classes, functions, constants, and group imports
3. **Aliasing mechanism**: Resolving naming conflicts and simplifying long class names
4. **Global namespace**: Accessing PHP built-in classes and functions, understanding the fallback mechanism
5. **PSR-4 autoloading**: Standardized file organization and autoloading configuration
6. **Resolution rules**: Differences between fully qualified names, qualified names, and unqualified names
7. **Best practices**: Code organization, naming conventions, project structure

By following these principles and practices, you will be able to better organize PHP code, seamlessly integrate with third-party libraries, and build large, complex applications. In real projects, we recommend always following PSR-4 standards, organizing namespace hierarchies reasonably, and making good use of Composer's autoloading optimization features.
