---
title: CodeIgniter 框架指南
description: CodeIgniter PHP 框架完整指南，涵盖 MVC 架构、路由系统、数据库操作和快速应用开发
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - CodeIgniter
  - MVC
  - Web 框架
  - 快速开发
status: imported
origin: old/src/content/docs/php/codeigniter.zh.md
divergence: 0.228
issues: []
legacy:
  category: PHP
  subcategory: Web Frameworks
  order: 21
  lastUpdated: 2026-01-22
---

CodeIgniter 是一个轻量级、高性能的 PHP 框架，以其小巧的体积、最少的配置要求和简洁的开发方式而闻名。该框架最初由 EllisLab 创建，现由不列颠哥伦比亚理工学院维护，为构建功能完整的 Web 应用程序提供了简单而强大的工具集，同时保持卓越的性能表现。

## 概念解释

CodeIgniter 遵循模型-视图-控制器（MVC）架构模式，同时为偏好其他方法的开发者保留了灵活性。与重量级框架不同，CodeIgniter 优先考虑简洁性和速度，提供近乎零配置的开箱即用体验。

该框架擅长提供必要的工具而不强加严格的结构约束。它包含数据库抽象、会话管理、表单验证、邮件发送等库，同时允许开发者在需要时使用原生 PHP。CodeIgniter 4 作为当前主要版本，引入了现代 PHP 特性，包括命名空间、PSR-4 自动加载和改进的安全机制。

CodeIgniter 的理念核心是给予开发者自由而非强制约定。这使其非常适合需要快速开发、遗留系统集成或从过程式 PHP 过渡到面向对象框架的团队。

## 核心原理

### CodeIgniter 中的 MVC 架构

CodeIgniter 实现了松耦合的 MVC 模式，将应用逻辑与展示层分离：

```php
// app/Controllers/Blog.php
namespace App\Controllers;

use App\Models\PostModel;

class Blog extends BaseController
{
    protected PostModel $postModel;

    public function __construct()
    {
        $this->postModel = new PostModel();
    }

    public function index(): string
    {
        $data = [
            'title' => '我的博客',
            'posts' => $this->postModel->findAll()
        ];

        return view('blog/index', $data);
    }

    public function show(int $id): string
    {
        $post = $this->postModel->find($id);

        if (!$post) {
            throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound();
        }

        return view('blog/show', ['post' => $post]);
    }
}
```

### 请求-响应生命周期

CodeIgniter 通过清晰的管道处理请求：

```php
// public/index.php - 入口点
// 框架引导并路由请求

// app/Config/Routes.php - 定义路由
$routes->get('/', 'Home::index');
$routes->get('blog', 'Blog::index');
$routes->get('blog/(:num)', 'Blog::show/$1');
$routes->post('blog/create', 'Blog::create');

// 控制器接收请求
// 模型与数据库交互
// 视图渲染响应
// 响应发送给客户端
```

### 服务容器

CodeIgniter 4 包含一个简单的服务容器用于依赖管理：

```php
// app/Config/Services.php
namespace Config;

use CodeIgniter\Config\BaseService;

class Services extends BaseService
{
    public static function paymentGateway(bool $getShared = true)
    {
        if ($getShared) {
            return static::getSharedInstance('paymentGateway');
        }

        return new \App\Libraries\StripeGateway(
            config('Payment')->apiKey
        );
    }
}

// 使用方式
$gateway = \Config\Services::paymentGateway();
$gateway->charge($amount);
```

## 核心要点

### 安装和项目设置

```bash
# 通过 Composer 创建新的 CodeIgniter 4 项目
composer create-project codeigniter4/appstarter my-project

# 进入项目目录
cd my-project

# 设置环境文件
cp env .env

# 编辑 .env 用于开发环境
# CI_ENVIRONMENT = development
# database.default.hostname = localhost
# database.default.database = myapp
# database.default.username = root
# database.default.password = secret

# 启动开发服务器
php spark serve
```

### 项目结构

```
my-project/
├── app/
│   ├── Config/              # 配置文件
│   │   ├── App.php          # 应用配置
│   │   ├── Database.php     # 数据库配置
│   │   ├── Routes.php       # 路由定义
│   │   └── Services.php     # 服务容器
│   ├── Controllers/         # 控制器类
│   ├── Database/
│   │   ├── Migrations/      # 数据库迁移
│   │   └── Seeds/           # 数据库填充
│   ├── Filters/             # HTTP 过滤器（中间件）
│   ├── Helpers/             # 辅助函数
│   ├── Libraries/           # 自定义库
│   ├── Models/              # 模型类
│   └── Views/               # 视图模板
├── public/
│   └── index.php            # 前端控制器
├── tests/                   # 测试文件
├── writable/
│   ├── cache/               # 缓存文件
│   ├── logs/                # 日志文件
│   └── session/             # 会话文件
├── vendor/                  # Composer 依赖
├── .env                     # 环境变量
├── composer.json
└── spark                    # CLI 工具
```

### 路由系统

```php
// app/Config/Routes.php
namespace Config;

$routes = Services::routes();

// 基本路由
$routes->get('/', 'Home::index');
$routes->get('about', 'Pages::about');

// 带参数的路由
$routes->get('users/(:num)', 'Users::show/$1');
$routes->get('posts/(:segment)', 'Posts::show/$1');

// 多 HTTP 方法
$routes->match(['get', 'post'], 'contact', 'Contact::index');

// 资源路由（RESTful）
$routes->resource('products');
// 创建：
// GET    /products           -> Products::index
// GET    /products/new       -> Products::new
// POST   /products           -> Products::create
// GET    /products/(:num)    -> Products::show/$1
// GET    /products/(:num)/edit -> Products::edit/$1
// PUT    /products/(:num)    -> Products::update/$1
// DELETE /products/(:num)    -> Products::delete/$1

// 路由分组
$routes->group('admin', ['filter' => 'auth'], static function ($routes) {
    $routes->get('dashboard', 'Admin\Dashboard::index');
    $routes->get('users', 'Admin\Users::index');
    $routes->resource('posts', ['controller' => 'Admin\Posts']);
});

// API 版本控制
$routes->group('api/v1', ['namespace' => 'App\Controllers\Api\V1'], static function ($routes) {
    $routes->resource('users');
    $routes->resource('products');
});

// 命名路由
$routes->get('user/profile', 'Users::profile', ['as' => 'user.profile']);
// 使用：route_to('user.profile')

// 占位符模式
$routes->addPlaceholder('uuid', '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
$routes->get('orders/(:uuid)', 'Orders::show/$1');
```

### 控制器

```php
// app/Controllers/Users.php
namespace App\Controllers;

use App\Models\UserModel;
use CodeIgniter\HTTP\RedirectResponse;
use CodeIgniter\HTTP\ResponseInterface;

class Users extends BaseController
{
    protected UserModel $userModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
        helper(['form', 'url']);
    }

    public function index(): string
    {
        $data = [
            'title' => '用户列表',
            'users' => $this->userModel->paginate(20),
            'pager' => $this->userModel->pager
        ];

        return view('users/index', $data);
    }

    public function show(int $id): string
    {
        $user = $this->userModel->find($id);

        if (!$user) {
            throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound("用户未找到");
        }

        return view('users/show', ['user' => $user]);
    }

    public function create(): string
    {
        return view('users/create', [
            'validation' => \Config\Services::validation()
        ]);
    }

    public function store(): RedirectResponse
    {
        // 验证规则
        $rules = [
            'username' => 'required|min_length[3]|max_length[50]|is_unique[users.username]',
            'email'    => 'required|valid_email|is_unique[users.email]',
            'password' => 'required|min_length[8]',
            'confirm'  => 'required|matches[password]'
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $this->userModel->insert([
            'username' => $this->request->getPost('username'),
            'email'    => $this->request->getPost('email'),
            'password' => password_hash($this->request->getPost('password'), PASSWORD_DEFAULT),
            'created_at' => date('Y-m-d H:i:s')
        ]);

        return redirect()->to('/users')->with('success', '用户创建成功');
    }

    public function edit(int $id): string
    {
        $user = $this->userModel->find($id);

        if (!$user) {
            throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound();
        }

        return view('users/edit', [
            'user' => $user,
            'validation' => \Config\Services::validation()
        ]);
    }

    public function update(int $id): RedirectResponse
    {
        $rules = [
            'username' => "required|min_length[3]|is_unique[users.username,id,{$id}]",
            'email'    => "required|valid_email|is_unique[users.email,id,{$id}]"
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $this->userModel->update($id, [
            'username' => $this->request->getPost('username'),
            'email'    => $this->request->getPost('email'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        return redirect()->to("/users/{$id}")->with('success', '用户更新成功');
    }

    public function delete(int $id): RedirectResponse
    {
        $this->userModel->delete($id);
        return redirect()->to('/users')->with('success', '用户删除成功');
    }
}
```

## 代码示例

### 模型层与查询构建器

```php
// app/Models/UserModel.php
namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table            = 'users';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array'; // 或 'object' 或 Entity 类
    protected $useSoftDeletes   = true;
    protected $allowedFields    = ['username', 'email', 'password', 'status', 'role'];

    // 日期设置
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // 验证规则
    protected $validationRules = [
        'username' => 'required|min_length[3]|max_length[50]',
        'email'    => 'required|valid_email',
        'password' => 'required|min_length[8]'
    ];
    protected $validationMessages = [
        'username' => [
            'required' => '用户名必填',
            'min_length' => '用户名至少需要3个字符'
        ]
    ];
    protected $skipValidation = false;

    // 回调
    protected $beforeInsert = ['hashPassword'];
    protected $beforeUpdate = ['hashPassword'];

    protected function hashPassword(array $data): array
    {
        if (isset($data['data']['password'])) {
            $data['data']['password'] = password_hash($data['data']['password'], PASSWORD_DEFAULT);
        }
        return $data;
    }

    // 自定义方法
    public function findByEmail(string $email): ?array
    {
        return $this->where('email', $email)->first();
    }

    public function getActiveUsers(): array
    {
        return $this->where('status', 'active')
                    ->orderBy('created_at', 'DESC')
                    ->findAll();
    }

    public function getUsersWithPosts(): array
    {
        return $this->select('users.*, COUNT(posts.id) as post_count')
                    ->join('posts', 'posts.user_id = users.id', 'left')
                    ->groupBy('users.id')
                    ->findAll();
    }

    public function searchUsers(string $term): array
    {
        return $this->like('username', $term)
                    ->orLike('email', $term)
                    ->findAll();
    }
}
```

### 使用实体

```php
// app/Entities/User.php
namespace App\Entities;

use CodeIgniter\Entity\Entity;

class User extends Entity
{
    protected $attributes = [
        'id'         => null,
        'username'   => null,
        'email'      => null,
        'password'   => null,
        'status'     => 'pending',
        'role'       => 'user',
        'created_at' => null,
        'updated_at' => null,
    ];

    protected $casts = [
        'id'         => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $datamap = [];

    // 修改器
    public function setPassword(string $password): self
    {
        $this->attributes['password'] = password_hash($password, PASSWORD_DEFAULT);
        return $this;
    }

    // 访问器
    public function getFullName(): string
    {
        return $this->attributes['first_name'] . ' ' . $this->attributes['last_name'];
    }

    public function isAdmin(): bool
    {
        return $this->attributes['role'] === 'admin';
    }

    public function isActive(): bool
    {
        return $this->attributes['status'] === 'active';
    }

    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->attributes['password']);
    }
}

// 更新 UserModel 以使用 Entity
class UserModel extends Model
{
    protected $returnType = User::class;
    // ... 模型其余部分
}

// 在控制器中使用
$user = $userModel->find(1);
echo $user->username;
echo $user->getFullName();

if ($user->verifyPassword($inputPassword)) {
    // 登录成功
}
```

### 数据库迁移

```php
// app/Database/Migrations/2024-01-15-100000_CreateUsersTable.php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateUsersTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'username' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'unique'     => true,
            ],
            'email' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'unique'     => true,
            ],
            'password' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['pending', 'active', 'suspended'],
                'default'    => 'pending',
            ],
            'role' => [
                'type'       => 'ENUM',
                'constraint' => ['user', 'moderator', 'admin'],
                'default'    => 'user',
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'deleted_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('status');
        $this->forge->addKey('created_at');

        $this->forge->createTable('users');
    }

    public function down()
    {
        $this->forge->dropTable('users');
    }
}

// 运行迁移
// php spark migrate
// php spark migrate:rollback
// php spark migrate:status
```

### 过滤器（中间件）

```php
// app/Filters/AuthFilter.php
namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $session = session();

        if (!$session->get('isLoggedIn')) {
            return redirect()->to('/login')
                           ->with('error', '请登录后访问此页面');
        }

        // 基于角色的访问控制
        if ($arguments !== null) {
            $userRole = $session->get('role');
            if (!in_array($userRole, $arguments)) {
                return redirect()->to('/dashboard')
                               ->with('error', '权限不足');
            }
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // 后处理（如需要）
    }
}

// app/Filters/ApiAuthFilter.php
class ApiAuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $token = $request->getHeaderLine('Authorization');

        if (empty($token)) {
            return \Config\Services::response()
                ->setJSON(['error' => '未提供令牌'])
                ->setStatusCode(401);
        }

        $token = str_replace('Bearer ', '', $token);

        try {
            $decoded = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key(getenv('JWT_SECRET'), 'HS256'));
            $request->user = $decoded;
        } catch (\Exception $e) {
            return \Config\Services::response()
                ->setJSON(['error' => '无效令牌'])
                ->setStatusCode(401);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // 为 API 添加 CORS 头
        return $response->setHeader('Access-Control-Allow-Origin', '*')
                       ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
}

// 在 app/Config/Filters.php 中注册
public array $aliases = [
    'auth'    => \App\Filters\AuthFilter::class,
    'apiauth' => \App\Filters\ApiAuthFilter::class,
    'csrf'    => \CodeIgniter\Filters\CSRF::class,
];

public array $filters = [
    'auth'    => ['before' => ['admin/*', 'dashboard/*']],
    'apiauth' => ['before' => ['api/*']],
];
```

### RESTful API 控制器

```php
// app/Controllers/Api/ProductController.php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;
use App\Models\ProductModel;

class ProductController extends ResourceController
{
    use ResponseTrait;

    protected $modelName = 'App\Models\ProductModel';
    protected $format    = 'json';

    public function index()
    {
        $page = $this->request->getGet('page') ?? 1;
        $limit = $this->request->getGet('limit') ?? 20;
        $category = $this->request->getGet('category');

        $builder = $this->model->builder();

        if ($category) {
            $builder->where('category_id', $category);
        }

        $total = $builder->countAllResults(false);
        $products = $builder->limit($limit, ($page - 1) * $limit)->get()->getResultArray();

        return $this->respond([
            'data' => $products,
            'meta' => [
                'page' => (int) $page,
                'limit' => (int) $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    public function show($id = null)
    {
        $product = $this->model->find($id);

        if (!$product) {
            return $this->failNotFound('产品未找到');
        }

        return $this->respond(['data' => $product]);
    }

    public function create()
    {
        $data = $this->request->getJSON(true);

        if (!$this->validate([
            'name'     => 'required|min_length[3]',
            'price'    => 'required|numeric|greater_than[0]',
            'category_id' => 'required|integer'
        ])) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $id = $this->model->insert($data);

        if (!$id) {
            return $this->failServerError('产品创建失败');
        }

        $product = $this->model->find($id);

        return $this->respondCreated([
            'message' => '产品创建成功',
            'data' => $product
        ]);
    }

    public function update($id = null)
    {
        $product = $this->model->find($id);

        if (!$product) {
            return $this->failNotFound('产品未找到');
        }

        $data = $this->request->getJSON(true);

        if (!$this->validate([
            'name'  => 'permit_empty|min_length[3]',
            'price' => 'permit_empty|numeric|greater_than[0]'
        ])) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $this->model->update($id, $data);

        return $this->respond([
            'message' => '产品更新成功',
            'data' => $this->model->find($id)
        ]);
    }

    public function delete($id = null)
    {
        $product = $this->model->find($id);

        if (!$product) {
            return $this->failNotFound('产品未找到');
        }

        $this->model->delete($id);

        return $this->respondDeleted(['message' => '产品删除成功']);
    }
}
```

## 最佳实践

### 服务层模式

```php
// app/Libraries/Services/OrderService.php
namespace App\Libraries\Services;

use App\Models\OrderModel;
use App\Models\ProductModel;
use App\Models\OrderItemModel;
use CodeIgniter\Database\Exceptions\DatabaseException;

class OrderService
{
    protected OrderModel $orderModel;
    protected ProductModel $productModel;
    protected OrderItemModel $orderItemModel;
    protected $db;

    public function __construct()
    {
        $this->orderModel = new OrderModel();
        $this->productModel = new ProductModel();
        $this->orderItemModel = new OrderItemModel();
        $this->db = \Config\Database::connect();
    }

    public function createOrder(int $userId, array $items): array
    {
        $this->db->transStart();

        try {
            // 计算总价并验证库存
            $total = 0;
            $orderItems = [];

            foreach ($items as $item) {
                $product = $this->productModel->find($item['product_id']);

                if (!$product) {
                    throw new \RuntimeException("产品 {$item['product_id']} 未找到");
                }

                if ($product['stock'] < $item['quantity']) {
                    throw new \RuntimeException("{$product['name']} 库存不足");
                }

                $subtotal = $product['price'] * $item['quantity'];
                $total += $subtotal;

                $orderItems[] = [
                    'product_id' => $product['id'],
                    'quantity'   => $item['quantity'],
                    'price'      => $product['price'],
                    'subtotal'   => $subtotal
                ];

                // 减少库存
                $this->productModel->update($product['id'], [
                    'stock' => $product['stock'] - $item['quantity']
                ]);
            }

            // 创建订单
            $orderId = $this->orderModel->insert([
                'user_id'    => $userId,
                'total'      => $total,
                'status'     => 'pending',
                'created_at' => date('Y-m-d H:i:s')
            ]);

            // 创建订单项
            foreach ($orderItems as &$orderItem) {
                $orderItem['order_id'] = $orderId;
            }
            $this->orderItemModel->insertBatch($orderItems);

            $this->db->transComplete();

            if ($this->db->transStatus() === false) {
                throw new DatabaseException('事务失败');
            }

            return $this->orderModel->find($orderId);

        } catch (\Exception $e) {
            $this->db->transRollback();
            throw $e;
        }
    }

    public function cancelOrder(int $orderId): bool
    {
        $order = $this->orderModel->find($orderId);

        if (!$order || $order['status'] !== 'pending') {
            return false;
        }

        $this->db->transStart();

        // 恢复库存
        $items = $this->orderItemModel->where('order_id', $orderId)->findAll();
        foreach ($items as $item) {
            $this->productModel->builder()
                ->where('id', $item['product_id'])
                ->set('stock', "stock + {$item['quantity']}", false)
                ->update();
        }

        // 更新订单状态
        $this->orderModel->update($orderId, ['status' => 'cancelled']);

        $this->db->transComplete();

        return $this->db->transStatus();
    }
}
```

### 配置管理

```php
// app/Config/Payment.php
namespace Config;

use CodeIgniter\Config\BaseConfig;

class Payment extends BaseConfig
{
    public string $provider = 'stripe';
    public string $apiKey = '';
    public string $secretKey = '';
    public bool $sandboxMode = true;
    public array $supportedCurrencies = ['USD', 'EUR', 'CNY'];

    public function __construct()
    {
        parent::__construct();

        // 从环境变量加载
        $this->apiKey = getenv('PAYMENT_API_KEY') ?: '';
        $this->secretKey = getenv('PAYMENT_SECRET_KEY') ?: '';
        $this->sandboxMode = getenv('CI_ENVIRONMENT') !== 'production';
    }
}

// 使用方式
$config = config('Payment');
echo $config->apiKey;
```

### 辅助函数

```php
// app/Helpers/string_helper.php
if (!function_exists('generate_slug')) {
    function generate_slug(string $text): string
    {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        return strtolower($text);
    }
}

if (!function_exists('format_currency')) {
    function format_currency(float $amount, string $currency = 'CNY'): string
    {
        $formatter = new NumberFormatter('zh_CN', NumberFormatter::CURRENCY);
        return $formatter->formatCurrency($amount, $currency);
    }
}

if (!function_exists('time_ago')) {
    function time_ago(string $datetime): string
    {
        $time = strtotime($datetime);
        $diff = time() - $time;

        if ($diff < 60) return '刚刚';
        if ($diff < 3600) return floor($diff / 60) . ' 分钟前';
        if ($diff < 86400) return floor($diff / 3600) . ' 小时前';
        if ($diff < 604800) return floor($diff / 86400) . ' 天前';

        return date('Y年m月d日', $time);
    }
}

// 加载辅助函数
helper('string');
// 或在 app/Config/Autoload.php 中自动加载
public $helpers = ['string', 'url', 'form'];
```

## 常见陷阱

### 错误的请求处理

```php
// 错误：直接使用超全局变量
$username = $_POST['username'];
$id = $_GET['id'];

// 正确：使用 CodeIgniter 的 Request 对象
$username = $this->request->getPost('username');
$id = $this->request->getGet('id');

// 带过滤
$username = $this->request->getPost('username', FILTER_SANITIZE_STRING);
$email = $this->request->getPost('email', FILTER_SANITIZE_EMAIL);

// JSON 请求体
$data = $this->request->getJSON(true); // true 返回数组，false 返回对象
```

### 批量赋值漏洞

```php
// 错误：直接插入所有 POST 数据
$this->userModel->insert($this->request->getPost());

// 正确：只允许特定字段（在模型中定义）
class UserModel extends Model
{
    protected $allowedFields = ['username', 'email', 'password'];
    // 'role' 和 'status' 不在 allowedFields 中以保证安全
}

// 或显式指定字段
$this->userModel->insert([
    'username' => $this->request->getPost('username'),
    'email'    => $this->request->getPost('email'),
    'password' => $this->request->getPost('password')
]);
```

### 会话安全问题

```php
// 错误：在会话中存储敏感数据
$session->set('password', $password);
$session->set('creditCard', $cardNumber);

// 正确：只存储必要的标识符
$session->set([
    'user_id'     => $user['id'],
    'username'    => $user['username'],
    'isLoggedIn'  => true,
    'role'        => $user['role']
]);

// 登录后重新生成会话 ID 以防止固定攻击
$session->regenerate();

// 在 app/Config/Session.php 中配置安全会话
public string $driver = 'CodeIgniter\Session\Handlers\DatabaseHandler';
public string $savePath = 'ci_sessions';
public bool $matchIP = true;
public int $timeToUpdate = 300;
```

### N+1 查询问题

```php
// 错误：在循环中查询
$posts = $postModel->findAll();
foreach ($posts as $post) {
    $author = $userModel->find($post['user_id']); // N 次额外查询！
    echo $author['username'];
}

// 正确：使用 JOIN 或预加载
$posts = $postModel->select('posts.*, users.username as author_name')
                   ->join('users', 'users.id = posts.user_id')
                   ->findAll();

foreach ($posts as $post) {
    echo $post['author_name']; // 无额外查询
}
```

## 性能考量

### 查询优化

```php
// 在开发环境启用查询分析
$db = \Config\Database::connect();
$db->query("SET profiling = 1");

// 使用特定列而非 SELECT *
$users = $userModel->select('id, username, email')
                   ->where('status', 'active')
                   ->findAll();

// 对大数据集使用分页
$users = $userModel->paginate(20);
$pager = $userModel->pager;

// 缓存昂贵的查询
$cache = \Config\Services::cache();
$cacheKey = 'active_users_count';

if (!$count = $cache->get($cacheKey)) {
    $count = $userModel->where('status', 'active')->countAllResults();
    $cache->save($cacheKey, $count, 3600); // 缓存 1 小时
}

// 使用数据库级缓存
$builder = $db->table('products');
$builder->where('category_id', $categoryId);
$query = $builder->get();
$query->cache(3600, 'products_category_' . $categoryId);
```

### 响应缓存

```php
// 页面缓存
class Products extends BaseController
{
    public function index()
    {
        // 缓存此页面 5 分钟
        $this->cachePage(300);

        $data['products'] = $this->productModel->findAll();
        return view('products/index', $data);
    }
}

// 视图中的片段缓存
<?php if (!$cachedSidebar = cache('sidebar')): ?>
    <?php $cachedSidebar = view('partials/sidebar', $sidebarData); ?>
    <?php cache()->save('sidebar', $cachedSidebar, 3600); ?>
<?php endif; ?>
<?= $cachedSidebar ?>

// API 响应缓存
public function list()
{
    $cacheKey = 'api_products_' . md5(serialize($this->request->getGet()));

    if ($cached = cache($cacheKey)) {
        return $this->respond($cached);
    }

    $products = $this->model->findAll();
    $response = ['data' => $products, 'timestamp' => time()];

    cache()->save($cacheKey, $response, 600);

    return $this->respond($response);
}
```

### 自动加载优化

```php
// 为生产环境生成优化的自动加载器
// composer dump-autoload --optimize --classmap-authoritative

// 在 app/Config/Autoload.php 中预加载关键类
public $classmap = [
    'App\Models\UserModel' => APPPATH . 'Models/UserModel.php',
    'App\Models\ProductModel' => APPPATH . 'Models/ProductModel.php'
];

// 在生产环境使用 Composer 的类映射
// composer.json
{
    "autoload": {
        "classmap": ["app/"]
    }
}
```

## 实战场景

### 认证系统

```php
// app/Controllers/Auth.php
namespace App\Controllers;

use App\Models\UserModel;
use App\Libraries\Services\AuthService;

class Auth extends BaseController
{
    protected UserModel $userModel;
    protected AuthService $authService;

    public function __construct()
    {
        $this->userModel = new UserModel();
        $this->authService = new AuthService();
        helper(['form', 'url']);
    }

    public function login(): string
    {
        if (session()->get('isLoggedIn')) {
            return redirect()->to('/dashboard');
        }

        return view('auth/login');
    }

    public function attemptLogin()
    {
        $rules = [
            'email'    => 'required|valid_email',
            'password' => 'required|min_length[8]'
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()
                           ->with('errors', $this->validator->getErrors());
        }

        $email = $this->request->getPost('email');
        $password = $this->request->getPost('password');

        $user = $this->userModel->where('email', $email)->first();

        if (!$user || !password_verify($password, $user['password'])) {
            return redirect()->back()->withInput()
                           ->with('error', '凭据无效');
        }

        if ($user['status'] !== 'active') {
            return redirect()->back()
                           ->with('error', '账户未激活');
        }

        // 设置会话
        session()->set([
            'user_id'     => $user['id'],
            'username'    => $user['username'],
            'email'       => $user['email'],
            'role'        => $user['role'],
            'isLoggedIn'  => true
        ]);

        session()->regenerate();

        // 更新最后登录时间
        $this->userModel->update($user['id'], [
            'last_login' => date('Y-m-d H:i:s')
        ]);

        return redirect()->to('/dashboard')
                        ->with('success', '欢迎回来，' . $user['username']);
    }

    public function logout()
    {
        session()->destroy();
        return redirect()->to('/login')
                        ->with('success', '您已成功退出');
    }

    public function register(): string
    {
        return view('auth/register');
    }

    public function attemptRegister()
    {
        $rules = [
            'username' => 'required|min_length[3]|is_unique[users.username]',
            'email'    => 'required|valid_email|is_unique[users.email]',
            'password' => 'required|min_length[8]',
            'confirm'  => 'required|matches[password]'
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()
                           ->with('errors', $this->validator->getErrors());
        }

        $this->userModel->insert([
            'username' => $this->request->getPost('username'),
            'email'    => $this->request->getPost('email'),
            'password' => $this->request->getPost('password'), // 由模型回调加密
            'status'   => 'active',
            'role'     => 'user'
        ]);

        return redirect()->to('/login')
                        ->with('success', '注册成功，请登录。');
    }
}
```

### 文件上传处理

```php
// app/Controllers/Upload.php
namespace App\Controllers;

class Upload extends BaseController
{
    public function image()
    {
        $validationRules = [
            'image' => [
                'uploaded[image]',
                'is_image[image]',
                'mime_in[image,image/jpg,image/jpeg,image/png,image/webp]',
                'max_size[image,2048]', // 最大 2MB
                'max_dims[image,2000,2000]'
            ]
        ];

        if (!$this->validate($validationRules)) {
            return redirect()->back()->with('errors', $this->validator->getErrors());
        }

        $file = $this->request->getFile('image');

        if ($file->isValid() && !$file->hasMoved()) {
            // 生成唯一文件名
            $newName = $file->getRandomName();

            // 移动到上传目录
            $file->move(WRITEPATH . 'uploads/images', $newName);

            // 保存到数据库
            $this->imageModel->insert([
                'filename'     => $newName,
                'original_name' => $file->getClientName(),
                'file_type'    => $file->getClientMimeType(),
                'file_size'    => $file->getSize(),
                'user_id'      => session()->get('user_id')
            ]);

            return redirect()->back()->with('success', '图片上传成功');
        }

        return redirect()->back()->with('error', '上传失败');
    }

    public function multiple()
    {
        $files = $this->request->getFiles();
        $uploaded = [];

        foreach ($files['images'] as $file) {
            if ($file->isValid() && !$file->hasMoved()) {
                $newName = $file->getRandomName();
                $file->move(WRITEPATH . 'uploads', $newName);
                $uploaded[] = $newName;
            }
        }

        return $this->response->setJSON([
            'success' => true,
            'files' => $uploaded
        ]);
    }
}
```

## 面试要点

1. **CodeIgniter 3 和 CodeIgniter 4 的主要区别是什么？**
   - CI4 使用命名空间和 PSR-4 自动加载，要求 PHP 7.4+，完全重写了核心代码，支持基于环境的配置，包含新的 CLI 工具（Spark），并实现了现代 PHP 实践。

2. **CodeIgniter 如何处理安全问题？**
   - 内置 CSRF 保护、XSS 过滤、通过查询构建器防止 SQL 注入、输入验证、输出转义、安全的会话处理和密码哈希工具。

3. **解释 CodeIgniter 的请求生命周期。**
   - 请求通过 public/index.php 进入，引导加载，路由确定控制器/方法，过滤器运行（之前），控制器执行，生成响应，过滤器运行（之后），响应发送。

4. **CodeIgniter 中的过滤器是什么，与钩子有什么不同？**
   - 过滤器是 CI4 中的中间件等价物，取代了 CI3 的钩子。它们可以在控制器之前修改请求，在之后修改响应，实现 FilterInterface 的 before() 和 after() 方法。

5. **如何优化 CodeIgniter 应用程序？**
   - 启用缓存（页面、数据库、查询）、优化数据库查询、使用分页、实现适当的索引、启用 OPcache、使用 CDN 托管静态资源、最小化自动加载、配置生产环境设置。

6. **解释 CodeIgniter 4 中的模型层。**
   - 模型继承 CodeIgniter\Model，提供 CRUD 操作，支持验证规则、回调、软删除、时间戳，可以返回数组、对象或 Entity 实例。

7. **CodeIgniter 如何处理数据库迁移？**
   - 通过 Migration 类和 Spark CLI。迁移跟踪模式变更，支持 up/down 操作，实现数据库结构的版本控制，便于团队协作。

## 延伸阅读

- [CodeIgniter 4 官方文档](https://codeigniter.com/user_guide/)
- [CodeIgniter 4 GitHub 仓库](https://github.com/codeigniter4/CodeIgniter4)
- [CodeIgniter 论坛](https://forum.codeigniter.com/)
- [CodeIgniter 4 从零开始视频系列](https://www.youtube.com/results?search_query=codeigniter+4+tutorial)
- [CI4 最佳实践指南](https://codeigniter4.github.io/userguide/concepts/index.html)
- [查询构建器文档](https://codeigniter.com/user_guide/database/query_builder.html)
- [Spark CLI 参考](https://codeigniter.com/user_guide/cli/spark_commands.html)
