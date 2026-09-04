---
title: PHP 命名空间
description: 学习 PHP 命名空间组织代码，避免命名冲突和实现自动加载
track: php
section: basics
difficulty: intermediate
tags:
  - PHP
  - 命名空间
  - 自动加载
status: imported
origin: old/src/content/docs/php/namespaces.zh.md
divergence: 0.218
issues: []
legacy:
  category: PHP
  subcategory: 核心概念
  order: 11
  lastUpdated: 2026-01-07
---

命名空间（Namespace）是 PHP 5.3.0 引入的重要特性，用于解决代码中类名、函数名和常量名的冲突问题。本文将全面介绍 PHP 命名空间的使用方法和最佳实践。

## 什么是命名空间

命名空间可以理解为一个容器，用于封装相关的类、接口、函数和常量。就像文件系统中的目录一样，命名空间允许同名的类存在于不同的"目录"中，从而避免命名冲突。

### 为什么需要命名空间

在大型项目或使用第三方库时，经常会遇到以下问题：

1. **命名冲突**：不同库可能定义了同名的类
2. **代码组织**：需要一种方式来逻辑地组织代码
3. **自动加载**：需要根据类名自动加载对应的文件

```php
<?php
// 没有命名空间时，所有类都在全局空间
class User {}          // 全局空间的 User
class User {}          // 错误！类名冲突

// 使用命名空间后
namespace App\Models;
class User {}          // App\Models\User

namespace App\Http\Controllers;
class User {}          // App\Http\Controllers\User（完全不同的类）
```

### 命名空间可以封装什么

PHP 命名空间可以封装以下元素：

- **类**（包括抽象类和 trait）
- **接口**
- **枚举**（PHP 8.1+）
- **函数**
- **常量**

```php
<?php
namespace App\Utils;

// 类
class Helper {}

// 接口
interface Exportable {}

// Trait
trait Loggable {}

// 枚举（PHP 8.1+）
enum Status: string {
    case Active = 'active';
    case Inactive = 'inactive';
}

// 函数
function formatDate($date) {
    return date('Y-m-d', strtotime($date));
}

// 常量
const VERSION = '1.0.0';
```

## 命名空间基础

### 定义命名空间

使用 `namespace` 关键字定义命名空间，必须放在文件的最开头（除了 `declare` 语句）：

```php
<?php
declare(strict_types=1);  // declare 语句可以在命名空间之前

namespace App\Models;

// 命名空间声明必须在任何其他代码之前
// 以下都是错误的：
// echo "hello";           // 错误！
// $x = 1;                 // 错误！
// function test() {}      // 错误！

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

### 命名空间的层级结构

命名空间可以使用反斜杠 `\` 来定义多层结构：

```php
<?php
namespace App\Services\Payment;

class PaymentProcessor
{
    public function process(float $amount): bool
    {
        // 处理支付逻辑
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

### 在同一文件中定义多个命名空间

虽然不推荐，但可以在同一文件中定义多个命名空间：

```php
<?php
// 方式一：简单组合语法（不推荐）
namespace App\Models;

class User {}

namespace App\Services;

class UserService {}
```

```php
<?php
// 方式二：大括号语法（稍好但仍不推荐）
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

// 最佳实践：一个文件一个命名空间一个类
```

## use 语句导入

### 完全限定名称

使用完整的命名空间路径访问类：

```php
<?php
namespace App\Controllers;

class UserController
{
    public function show(int $id)
    {
        // 使用完全限定名称
        $user = new \App\Models\User('张三', 'zhangsan@example.com');
        $service = new \App\Services\UserService();

        return $service->format($user);
    }
}
```

### 基本导入

使用 `use` 关键字导入命名空间中的类，使代码更简洁：

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

### 导入函数和常量

PHP 5.6+ 支持导入函数和常量：

```php
<?php
namespace App\Helpers;

// 定义函数和常量
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

// 导入类
use App\Models\User;

// 导入函数
use function App\Helpers\formatDate;
use function App\Helpers\formatMoney;

// 导入常量
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

### 分组导入（PHP 7.0+）

PHP 7.0 引入了分组导入语法，可以更简洁地导入同一命名空间下的多个元素：

```php
<?php
namespace App\Controllers;

// 分组导入类
use App\Models\{
    User,
    Post,
    Comment
};

// 分组导入并混合类、函数、常量
use App\Helpers\{
    StringHelper,
    function formatDate,
    function formatMoney,
    const VERSION
};

// 也可以在分组中使用别名
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

## 别名（Aliasing）

当导入的类名与当前命名空间中的类名冲突，或者类名太长时，可以使用别名。

### 类别名

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

### 命名空间别名

可以为整个命名空间创建别名：

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
        $user = new M\User('李四', 'lisi@example.com');
        $order = new M\Order();
        $service = new S\OrderService();

        $payment = new PaymentLib\Processor();
        $payment->charge($order->total);
    }
}
```

### 解决命名冲突

```php
<?php
namespace App\Services;

// 两个不同库的 Logger 类
use Monolog\Logger as MonologLogger;
use App\Logging\Logger as AppLogger;

// 两个不同的 Exception 类
use App\Exceptions\ValidationException;
use Symfony\Component\Validator\Exception\ValidationFailedException;

class LoggingService
{
    private MonologLogger $monolog;
    private AppLogger $appLogger;

    public function __construct()
    {
        // 使用别名后，代码清晰明了
        $this->monolog = new MonologLogger('app');
        $this->appLogger = new AppLogger();
    }

    public function log(string $message): void
    {
        // 使用 Monolog
        $this->monolog->info($message);

        // 使用自定义 Logger
        $this->appLogger->write($message);
    }
}
```

## 全局命名空间

没有定义命名空间的代码属于全局命名空间。在命名空间中访问全局类、函数或常量时，需要使用反斜杠前缀。

### 访问全局类

```php
<?php
namespace App\Services;

class DateService
{
    public function getCurrentTime(): \DateTime
    {
        // DateTime 是 PHP 内置类，属于全局命名空间
        return new \DateTime();
    }

    public function formatDate(\DateTime $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    public function handleException(): void
    {
        try {
            // 某些操作
        } catch (\Exception $e) {
            // Exception 是全局类
            echo $e->getMessage();
        }
    }
}
```

### 函数和常量的回退机制

对于函数和常量（不是类），如果在当前命名空间中找不到，PHP 会自动在全局命名空间中查找：

```php
<?php
namespace App\Utils;

// 定义与全局同名的函数
function strlen($str)
{
    echo "自定义 strlen 被调用\n";
    return \strlen($str);  // 调用全局 strlen
}

const PHP_VERSION = 'custom';

class Helper
{
    public function example(): void
    {
        // 函数：先查找 App\Utils\strlen，找到则使用
        echo strlen('hello');    // 调用 App\Utils\strlen

        // 常量：先查找 App\Utils\PHP_VERSION，找到则使用
        echo PHP_VERSION;        // 输出: custom

        // 明确使用全局版本
        echo \strlen('hello');   // 调用全局 strlen
        echo \PHP_VERSION;       // 输出: 8.x.x（全局版本）

        // 未定义的函数会回退到全局空间
        $time = time();          // 调用全局 time()（因为没有定义 App\Utils\time）

        // 但为了代码清晰和性能，建议加上反斜杠
        $time = \time();
        $arr = \array_merge([1, 2], [3, 4]);
    }
}
```

### 类不会回退

```php
<?php
namespace App\Services;

class DataProcessor
{
    public function process()
    {
        // 错误：DateTime 在当前命名空间找不到，且类不会回退
        $date = new DateTime();  // Fatal error: Class 'App\Services\DateTime' not found

        // 正确：使用完全限定名称
        $date = new \DateTime();

        // 或者在文件顶部导入
        // use DateTime;
        // $date = new DateTime();
    }
}
```

## PSR-4 自动加载

PSR-4 是 PHP-FIG 制定的自动加载标准，它定义了命名空间与文件路径的映射关系。

### PSR-4 规范要点

1. 完全限定类名格式：`\<NamespaceName>(\<SubNamespaceNames>)*\<ClassName>`
2. 命名空间前缀对应一个基础目录
3. 子命名空间对应基础目录下的子目录
4. 类名对应文件名（加 `.php` 后缀）

### 目录结构示例

```
项目根目录/
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

### Composer 配置

在 `composer.json` 中配置 PSR-4 自动加载：

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

配置后运行 `composer dump-autoload` 生成自动加载文件。

### 使用 Composer 自动加载

```php
<?php
// index.php 或入口文件
require_once __DIR__ . '/vendor/autoload.php';

use App\Controllers\UserController;
use App\Services\UserService;

$controller = new UserController();
$users = $controller->index();
```

### 手动实现 PSR-4 自动加载器

理解自动加载原理：

```php
<?php
spl_autoload_register(function (string $class): void {
    // 项目命名空间前缀
    $prefix = 'App\\';

    // 命名空间前缀对应的基础目录
    $baseDir = __DIR__ . '/src/';

    // 检查类是否使用此命名空间前缀
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        // 不是我们的命名空间，交给其他自动加载器处理
        return;
    }

    // 获取相对类名
    $relativeClass = substr($class, $len);

    // 将命名空间分隔符替换为目录分隔符，添加 .php 后缀
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    // 如果文件存在，加载它
    if (file_exists($file)) {
        require $file;
    }
});
```

### 多命名空间前缀配置

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
        // 规范化命名空间前缀
        $prefix = trim($prefix, '\\') . '\\';

        // 规范化基础目录
        $baseDir = rtrim($baseDir, DIRECTORY_SEPARATOR) . '/';

        // 初始化命名空间前缀数组
        if (!isset($this->prefixes[$prefix])) {
            $this->prefixes[$prefix] = [];
        }

        // 将基础目录添加到命名空间前缀
        $this->prefixes[$prefix][] = $baseDir;
    }

    public function loadClass(string $class): bool
    {
        // 当前命名空间前缀
        $prefix = $class;

        // 从完全限定类名中查找命名空间前缀
        while (($pos = strrpos($prefix, '\\')) !== false) {
            // 保留命名空间分隔符
            $prefix = substr($class, 0, $pos + 1);

            // 相对类名
            $relativeClass = substr($class, $pos + 1);

            // 尝试加载映射的文件
            $mappedFile = $this->loadMappedFile($prefix, $relativeClass);
            if ($mappedFile) {
                return true;
            }

            // 移除末尾的命名空间分隔符，继续循环
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

// 使用自动加载器
$loader = new Autoloader();
$loader->register();
$loader->addNamespace('App', __DIR__ . '/src');
$loader->addNamespace('Vendor\\Package', __DIR__ . '/vendor/package/src');
```

### 自动加载优化

```php
<?php
// Composer 的类映射优化
// 执行 composer dump-autoload --optimize 或 composer dump-autoload -o

// 这会生成优化的类映射，将 PSR-4 自动加载转换为类映射
// 大幅减少文件系统操作，提升加载速度
```

```json
// composer.json 中启用自动优化
{
    "config": {
        "optimize-autoloader": true,
        "classmap-authoritative": true
    }
}
```

## 命名空间解析规则

理解 PHP 如何解析类名非常重要。

### 三种类名引用方式

```php
<?php
namespace App\Controllers;

use App\Models\User;
use App\Services\UserService as Service;

class ExampleController
{
    public function example(): void
    {
        // 1. 非限定名称（Unqualified name）
        // 在当前命名空间中查找
        $user = new User();  // 实际是 App\Models\User（因为有 use）

        // 2. 限定名称（Qualified name）
        // 相对于当前命名空间
        $model = new Models\Post();  // 实际是 App\Controllers\Models\Post

        // 3. 完全限定名称（Fully qualified name）
        // 从全局命名空间开始
        $post = new \App\Models\Post();  // 明确指定完整路径
    }
}
```

### namespace 关键字和 __NAMESPACE__ 常量

```php
<?php
namespace App\Services;

class ServiceFactory
{
    public function createFromSameNamespace(string $className): object
    {
        // 使用魔术常量获取当前命名空间名称
        echo __NAMESPACE__;  // 输出: App\Services

        // 动态构建类名
        $class = __NAMESPACE__ . '\\' . $className;
        return new $class();
    }

    public function example(): void
    {
        // 使用 namespace 关键字引用当前命名空间
        $service = new namespace\UserService();  // App\Services\UserService
    }
}
```

### 动态类名的注意事项

```php
<?php
namespace App\Services;

use App\Models\User;

class DynamicLoader
{
    public function load(string $class): object
    {
        // 字符串中的类名不会自动解析命名空间
        return new $class();  // $class 必须是完全限定名
    }

    public function example(): void
    {
        // 错误：字符串 'User' 不会解析为 App\Models\User
        $this->load('User');  // 会查找全局 \User

        // 正确：使用 ::class 获取完全限定名
        $this->load(User::class);  // App\Models\User

        // 或者手动指定完整名称
        $this->load('App\\Models\\User');
    }
}
```

## 最佳实践

### 遵循 PSR-4 标准

```php
<?php
// 命名空间与目录结构严格对应
// 文件路径: src/Services/Payment/PaymentGateway.php
namespace App\Services\Payment;

class PaymentGateway
{
    // 类名与文件名一致（PaymentGateway.php）
}
```

### 每个文件只定义一个类

```php
<?php
// 好的做法：一个文件一个类
// src/Models/User.php
namespace App\Models;

class User
{
    // 类定义
}
```

### 使用有意义的命名空间结构

```php
<?php
// 好的命名空间设计
namespace App\Domain\Order\Services;      // 领域驱动设计
namespace App\Infrastructure\Persistence; // 基础设施层
namespace App\Application\UseCases;       // 应用层用例

// 按功能组织
namespace App\Services\Authentication;     // 认证服务
namespace App\Services\Payment;            // 支付服务
namespace App\Http\Controllers\Api\V1;     // API v1 控制器
```

### 避免过深的嵌套

```php
<?php
// 不推荐：层级过深
namespace App\Modules\Core\Base\Abstract\Services\User\Admin\Reports;

// 推荐：保持合理的层级
namespace App\Services\Reports;
```

### 导入语句的组织

```php
<?php
namespace App\Controllers;

// 1. PHP 内置类
use DateTime;
use Exception;
use InvalidArgumentException;

// 2. 第三方库
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Monolog\Logger;

// 3. 项目内部类
use App\Models\User;
use App\Services\UserService;
use App\Repositories\UserRepository;

class UserController
{
    // 控制器代码
}
```

### 接口和实现的组织

```php
<?php
// 接口放在 Contracts 命名空间
// 文件: src/Contracts/PaymentGatewayInterface.php
namespace App\Contracts;

interface PaymentGatewayInterface
{
    public function charge(float $amount): bool;
    public function refund(string $transactionId): bool;
}
```

```php
<?php
// 实现类放在对应的命名空间
// 文件: src/Services/Payment/StripeGateway.php
namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;

class StripeGateway implements PaymentGatewayInterface
{
    public function charge(float $amount): bool
    {
        // Stripe 支付实现
        return true;
    }

    public function refund(string $transactionId): bool
    {
        // Stripe 退款实现
        return true;
    }
}
```

```php
<?php
// 文件: src/Services/Payment/AlipayGateway.php
namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;

class AlipayGateway implements PaymentGatewayInterface
{
    public function charge(float $amount): bool
    {
        // 支付宝实现
        return true;
    }

    public function refund(string $transactionId): bool
    {
        // 支付宝退款实现
        return true;
    }
}
```

### 类型声明中使用导入的类

```php
<?php
namespace App\Services;

use App\Models\User;
use App\Contracts\UserRepositoryInterface;
use DateTimeInterface;

class UserService
{
    // 使用导入的类型
    public function __construct(
        private UserRepositoryInterface $repository
    ) {}

    // 返回类型使用导入的类
    public function find(int $id): ?User
    {
        return $this->repository->find($id);
    }

    // 对于全局类，可以导入后使用
    public function getCreatedAt(): DateTimeInterface
    {
        return new \DateTime();
    }
}
```

## 常见问题与解决方案

### 类未找到错误

```php
<?php
namespace App\Services;

// 错误：Class 'User' not found
$user = new User();

// 解决方案1：使用完全限定名称
$user = new \App\Models\User();

// 解决方案2：添加 use 语句
use App\Models\User;
$user = new User();
```

### 命名空间冲突

```php
<?php
namespace App\Controllers;

// 两个同名类来自不同命名空间
use App\Models\User;
use App\External\User;  // 错误：重复导入

// 解决方案：使用别名
use App\Models\User;
use App\External\User as ExternalUser;

$user = new User();
$externalUser = new ExternalUser();
```

### use 语句的作用域

```php
<?php
namespace App\Controllers;

use App\Models\User;  // use 只在当前文件有效

class UserController
{
    public function getUser()
    {
        return new User();  // 正确
    }
}

// 在另一个文件中
namespace App\Controllers;

class AdminController
{
    public function getUser()
    {
        return new User();  // 错误！这个文件没有 use App\Models\User
    }
}
```

### 匿名函数中的命名空间

```php
<?php
namespace App\Services;

use App\Models\User;

class UserProcessor
{
    public function process(): void
    {
        // 匿名函数继承当前文件的 use 导入
        $callback = function ($id) {
            return User::find($id);  // 正确，可以使用导入的 User
        };

        // 但动态类名不会自动解析
        $className = 'User';
        $user = new $className();  // 错误！查找全局 User

        // 正确做法
        $className = User::class;  // 获取完整类名
        $user = new $className();  // 正确
    }
}
```

## 实战示例：完整的项目结构

以下是一个使用命名空间的完整项目示例。

### 目录结构

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

### 接口定义

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

### 模型类

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

### 仓库类

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
            throw new InvalidArgumentException('实体必须是 User 类型');
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

### 服务类

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
        // 验证邮箱格式
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('无效的邮箱地址');
        }

        // 检查邮箱是否已存在
        if ($this->repository->findByEmail($email) !== null) {
            throw new InvalidArgumentException('邮箱已被注册');
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

### 控制器类

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
                'message' => '用户不存在'
            ];
        }

        return [
            'status' => 'success',
            'data' => $user->toArray()
        ];
    }
}
```

### 入口文件

```php
<?php
// public/index.php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Controllers\UserController;

$controller = new UserController();

// 创建用户
$result = $controller->store([
    'name' => '张三',
    'email' => 'zhangsan@example.com'
]);
echo "创建用户: " . json_encode($result, JSON_UNESCAPED_UNICODE) . "\n";

// 获取所有用户
$result = $controller->index();
echo "所有用户: " . json_encode($result, JSON_UNESCAPED_UNICODE) . "\n";

// 获取单个用户
$result = $controller->show(1);
echo "用户详情: " . json_encode($result, JSON_UNESCAPED_UNICODE) . "\n";
```

### 测试类

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
        $user = $this->service->createUser('测试用户', 'test@example.com');

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('测试用户', $user->getName());
        $this->assertEquals('test@example.com', $user->getEmail());
    }

    public function testCreateUserWithInvalidEmail(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('无效的邮箱地址');

        $this->service->createUser('测试用户', 'invalid-email');
    }
}
```

## 总结

PHP 命名空间是现代 PHP 开发的基础，掌握它对于编写可维护、可扩展的代码至关重要。本文涵盖了以下核心内容：

1. **基本概念**：理解命名空间的作用和定义方式
2. **use 语句**：导入类、函数、常量，以及分组导入
3. **别名机制**：解决命名冲突，简化长类名
4. **全局命名空间**：访问 PHP 内置类和函数，理解回退机制
5. **PSR-4 自动加载**：标准化的文件组织和自动加载配置
6. **解析规则**：完全限定名称、限定名称、非限定名称的区别
7. **最佳实践**：代码组织、命名约定、项目结构

遵循这些原则和实践，你将能够更好地组织 PHP 代码，与第三方库无缝集成，并构建大型、复杂的应用程序。在实际项目中，建议始终遵循 PSR-4 规范，合理组织命名空间层级，并善用 Composer 的自动加载优化功能。
