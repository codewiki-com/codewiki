---
title: CodeIgniter Framework Guide
description: Complete guide to CodeIgniter PHP framework covering MVC architecture, routing, database operations, and rapid application development
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - CodeIgniter
  - MVC
  - Web Framework
  - Rapid Development
status: imported
origin: old/src/content/docs/php/codeigniter.en.md
divergence: 0.228
issues: []
legacy:
  category: PHP
  subcategory: Web Frameworks
  order: 21
  lastUpdated: 2026-01-22
---

CodeIgniter is a lightweight, high-performance PHP framework known for its small footprint, minimal configuration, and straightforward approach to web development. Originally created by EllisLab and now maintained by the British Columbia Institute of Technology, CodeIgniter provides a simple yet powerful toolkit for building full-featured web applications with exceptional performance.

## Concept Explanation

CodeIgniter follows the Model-View-Controller (MVC) architectural pattern while maintaining flexibility for developers who prefer alternative approaches. Unlike heavier frameworks, CodeIgniter prioritizes simplicity and speed, offering a nearly zero-configuration experience out of the box.

The framework excels at providing essential tools without imposing rigid structures. It includes libraries for database abstraction, session management, form validation, email sending, and more, while allowing developers to use plain PHP when preferred. CodeIgniter 4, the current major version, introduces modern PHP features including namespaces, PSR-4 autoloading, and improved security mechanisms.

CodeIgniter's philosophy centers on giving developers freedom rather than forcing conventions. This makes it ideal for projects requiring rapid development, legacy system integration, or teams transitioning from procedural PHP to object-oriented frameworks.

## Core Principles

### The MVC Architecture in CodeIgniter

CodeIgniter implements a loosely coupled MVC pattern that separates application logic from presentation:

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
            'title' => 'My Blog',
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

### The Request-Response Lifecycle

CodeIgniter processes requests through a clean pipeline:

```php
// public/index.php - Entry point
// The framework bootstraps and routes the request

// app/Config/Routes.php - Define routes
$routes->get('/', 'Home::index');
$routes->get('blog', 'Blog::index');
$routes->get('blog/(:num)', 'Blog::show/$1');
$routes->post('blog/create', 'Blog::create');

// Controller receives request
// Model interacts with database
// View renders response
// Response sent to client
```

### Services Container

CodeIgniter 4 includes a simple services container for dependency management:

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

// Usage
$gateway = \Config\Services::paymentGateway();
$gateway->charge($amount);
```

## Key Concepts

### Installation and Project Setup

```bash
# Create new CodeIgniter 4 project via Composer
composer create-project codeigniter4/appstarter my-project

# Navigate to project directory
cd my-project

# Set up environment file
cp env .env

# Edit .env for development
# CI_ENVIRONMENT = development
# database.default.hostname = localhost
# database.default.database = myapp
# database.default.username = root
# database.default.password = secret

# Start development server
php spark serve
```

### Project Structure

```
my-project/
├── app/
│   ├── Config/              # Configuration files
│   │   ├── App.php          # Application config
│   │   ├── Database.php     # Database config
│   │   ├── Routes.php       # Route definitions
│   │   └── Services.php     # Services container
│   ├── Controllers/         # Controller classes
│   ├── Database/
│   │   ├── Migrations/      # Database migrations
│   │   └── Seeds/           # Database seeders
│   ├── Filters/             # HTTP filters (middleware)
│   ├── Helpers/             # Helper functions
│   ├── Libraries/           # Custom libraries
│   ├── Models/              # Model classes
│   └── Views/               # View templates
├── public/
│   └── index.php            # Front controller
├── tests/                   # Test files
├── writable/
│   ├── cache/               # Cache files
│   ├── logs/                # Log files
│   └── session/             # Session files
├── vendor/                  # Composer dependencies
├── .env                     # Environment variables
├── composer.json
└── spark                    # CLI tool
```

### Routing System

```php
// app/Config/Routes.php
namespace Config;

$routes = Services::routes();

// Basic routing
$routes->get('/', 'Home::index');
$routes->get('about', 'Pages::about');

// Route with parameters
$routes->get('users/(:num)', 'Users::show/$1');
$routes->get('posts/(:segment)', 'Posts::show/$1');

// Multiple HTTP methods
$routes->match(['get', 'post'], 'contact', 'Contact::index');

// Resource routing (RESTful)
$routes->resource('products');
// Creates:
// GET    /products           -> Products::index
// GET    /products/new       -> Products::new
// POST   /products           -> Products::create
// GET    /products/(:num)    -> Products::show/$1
// GET    /products/(:num)/edit -> Products::edit/$1
// PUT    /products/(:num)    -> Products::update/$1
// DELETE /products/(:num)    -> Products::delete/$1

// Route groups
$routes->group('admin', ['filter' => 'auth'], static function ($routes) {
    $routes->get('dashboard', 'Admin\Dashboard::index');
    $routes->get('users', 'Admin\Users::index');
    $routes->resource('posts', ['controller' => 'Admin\Posts']);
});

// API versioning
$routes->group('api/v1', ['namespace' => 'App\Controllers\Api\V1'], static function ($routes) {
    $routes->resource('users');
    $routes->resource('products');
});

// Named routes
$routes->get('user/profile', 'Users::profile', ['as' => 'user.profile']);
// Use: route_to('user.profile')

// Placeholder patterns
$routes->addPlaceholder('uuid', '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
$routes->get('orders/(:uuid)', 'Orders::show/$1');
```

### Controllers

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
            'title' => 'User List',
            'users' => $this->userModel->paginate(20),
            'pager' => $this->userModel->pager
        ];

        return view('users/index', $data);
    }

    public function show(int $id): string
    {
        $user = $this->userModel->find($id);

        if (!$user) {
            throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound("User not found");
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
        // Validation rules
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

        return redirect()->to('/users')->with('success', 'User created successfully');
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

        return redirect()->to("/users/{$id}")->with('success', 'User updated successfully');
    }

    public function delete(int $id): RedirectResponse
    {
        $this->userModel->delete($id);
        return redirect()->to('/users')->with('success', 'User deleted successfully');
    }
}
```

## Code Examples

### Model Layer with Query Builder

```php
// app/Models/UserModel.php
namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table            = 'users';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array'; // or 'object' or Entity class
    protected $useSoftDeletes   = true;
    protected $allowedFields    = ['username', 'email', 'password', 'status', 'role'];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Validation
    protected $validationRules = [
        'username' => 'required|min_length[3]|max_length[50]',
        'email'    => 'required|valid_email',
        'password' => 'required|min_length[8]'
    ];
    protected $validationMessages = [
        'username' => [
            'required' => 'Username is required',
            'min_length' => 'Username must be at least 3 characters'
        ]
    ];
    protected $skipValidation = false;

    // Callbacks
    protected $beforeInsert = ['hashPassword'];
    protected $beforeUpdate = ['hashPassword'];

    protected function hashPassword(array $data): array
    {
        if (isset($data['data']['password'])) {
            $data['data']['password'] = password_hash($data['data']['password'], PASSWORD_DEFAULT);
        }
        return $data;
    }

    // Custom methods
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

### Using Entities

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

    // Mutators
    public function setPassword(string $password): self
    {
        $this->attributes['password'] = password_hash($password, PASSWORD_DEFAULT);
        return $this;
    }

    // Accessors
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

// Update UserModel to use Entity
class UserModel extends Model
{
    protected $returnType = User::class;
    // ... rest of model
}

// Usage in controller
$user = $userModel->find(1);
echo $user->username;
echo $user->getFullName();

if ($user->verifyPassword($inputPassword)) {
    // Login successful
}
```

### Database Migrations

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

// Run migrations
// php spark migrate
// php spark migrate:rollback
// php spark migrate:status
```

### Filters (Middleware)

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
                           ->with('error', 'Please login to access this page');
        }

        // Role-based access
        if ($arguments !== null) {
            $userRole = $session->get('role');
            if (!in_array($userRole, $arguments)) {
                return redirect()->to('/dashboard')
                               ->with('error', 'Insufficient permissions');
            }
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // Post-processing if needed
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
                ->setJSON(['error' => 'No token provided'])
                ->setStatusCode(401);
        }

        $token = str_replace('Bearer ', '', $token);

        try {
            $decoded = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key(getenv('JWT_SECRET'), 'HS256'));
            $request->user = $decoded;
        } catch (\Exception $e) {
            return \Config\Services::response()
                ->setJSON(['error' => 'Invalid token'])
                ->setStatusCode(401);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // Add CORS headers for API
        return $response->setHeader('Access-Control-Allow-Origin', '*')
                       ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
}

// Register in app/Config/Filters.php
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

### RESTful API Controller

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
            return $this->failNotFound('Product not found');
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
            return $this->failServerError('Failed to create product');
        }

        $product = $this->model->find($id);

        return $this->respondCreated([
            'message' => 'Product created successfully',
            'data' => $product
        ]);
    }

    public function update($id = null)
    {
        $product = $this->model->find($id);

        if (!$product) {
            return $this->failNotFound('Product not found');
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
            'message' => 'Product updated successfully',
            'data' => $this->model->find($id)
        ]);
    }

    public function delete($id = null)
    {
        $product = $this->model->find($id);

        if (!$product) {
            return $this->failNotFound('Product not found');
        }

        $this->model->delete($id);

        return $this->respondDeleted(['message' => 'Product deleted successfully']);
    }
}
```

## Best Practices

### Service Layer Pattern

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
            // Calculate total and validate stock
            $total = 0;
            $orderItems = [];

            foreach ($items as $item) {
                $product = $this->productModel->find($item['product_id']);

                if (!$product) {
                    throw new \RuntimeException("Product {$item['product_id']} not found");
                }

                if ($product['stock'] < $item['quantity']) {
                    throw new \RuntimeException("Insufficient stock for {$product['name']}");
                }

                $subtotal = $product['price'] * $item['quantity'];
                $total += $subtotal;

                $orderItems[] = [
                    'product_id' => $product['id'],
                    'quantity'   => $item['quantity'],
                    'price'      => $product['price'],
                    'subtotal'   => $subtotal
                ];

                // Decrement stock
                $this->productModel->update($product['id'], [
                    'stock' => $product['stock'] - $item['quantity']
                ]);
            }

            // Create order
            $orderId = $this->orderModel->insert([
                'user_id'    => $userId,
                'total'      => $total,
                'status'     => 'pending',
                'created_at' => date('Y-m-d H:i:s')
            ]);

            // Create order items
            foreach ($orderItems as &$orderItem) {
                $orderItem['order_id'] = $orderId;
            }
            $this->orderItemModel->insertBatch($orderItems);

            $this->db->transComplete();

            if ($this->db->transStatus() === false) {
                throw new DatabaseException('Transaction failed');
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

        // Restore stock
        $items = $this->orderItemModel->where('order_id', $orderId)->findAll();
        foreach ($items as $item) {
            $this->productModel->builder()
                ->where('id', $item['product_id'])
                ->set('stock', "stock + {$item['quantity']}", false)
                ->update();
        }

        // Update order status
        $this->orderModel->update($orderId, ['status' => 'cancelled']);

        $this->db->transComplete();

        return $this->db->transStatus();
    }
}
```

### Configuration Management

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
    public array $supportedCurrencies = ['USD', 'EUR', 'GBP'];

    public function __construct()
    {
        parent::__construct();

        // Load from environment
        $this->apiKey = getenv('PAYMENT_API_KEY') ?: '';
        $this->secretKey = getenv('PAYMENT_SECRET_KEY') ?: '';
        $this->sandboxMode = getenv('CI_ENVIRONMENT') !== 'production';
    }
}

// Usage
$config = config('Payment');
echo $config->apiKey;
```

### Helper Functions

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
    function format_currency(float $amount, string $currency = 'USD'): string
    {
        $formatter = new NumberFormatter('en_US', NumberFormatter::CURRENCY);
        return $formatter->formatCurrency($amount, $currency);
    }
}

if (!function_exists('time_ago')) {
    function time_ago(string $datetime): string
    {
        $time = strtotime($datetime);
        $diff = time() - $time;

        if ($diff < 60) return 'just now';
        if ($diff < 3600) return floor($diff / 60) . ' minutes ago';
        if ($diff < 86400) return floor($diff / 3600) . ' hours ago';
        if ($diff < 604800) return floor($diff / 86400) . ' days ago';

        return date('M j, Y', $time);
    }
}

// Load helper
helper('string');
// Or autoload in app/Config/Autoload.php
public $helpers = ['string', 'url', 'form'];
```

## Common Pitfalls

### Incorrect Request Handling

```php
// WRONG: Using superglobals directly
$username = $_POST['username'];
$id = $_GET['id'];

// CORRECT: Use CodeIgniter's Request object
$username = $this->request->getPost('username');
$id = $this->request->getGet('id');

// With sanitization
$username = $this->request->getPost('username', FILTER_SANITIZE_STRING);
$email = $this->request->getPost('email', FILTER_SANITIZE_EMAIL);

// JSON body
$data = $this->request->getJSON(true); // true for array, false for object
```

### Mass Assignment Vulnerabilities

```php
// WRONG: Inserting all POST data directly
$this->userModel->insert($this->request->getPost());

// CORRECT: Only allow specific fields (defined in model)
class UserModel extends Model
{
    protected $allowedFields = ['username', 'email', 'password'];
    // 'role' and 'status' are NOT in allowedFields for security
}

// Or explicitly specify fields
$this->userModel->insert([
    'username' => $this->request->getPost('username'),
    'email'    => $this->request->getPost('email'),
    'password' => $this->request->getPost('password')
]);
```

### Session Security Issues

```php
// WRONG: Storing sensitive data in session
$session->set('password', $password);
$session->set('creditCard', $cardNumber);

// CORRECT: Store only necessary identifiers
$session->set([
    'user_id'     => $user['id'],
    'username'    => $user['username'],
    'isLoggedIn'  => true,
    'role'        => $user['role']
]);

// Regenerate session ID after login to prevent fixation
$session->regenerate();

// Configure secure sessions in app/Config/Session.php
public string $driver = 'CodeIgniter\Session\Handlers\DatabaseHandler';
public string $savePath = 'ci_sessions';
public bool $matchIP = true;
public int $timeToUpdate = 300;
```

### N+1 Query Problem

```php
// WRONG: Queries in loop
$posts = $postModel->findAll();
foreach ($posts as $post) {
    $author = $userModel->find($post['user_id']); // N additional queries!
    echo $author['username'];
}

// CORRECT: Use joins or eager loading
$posts = $postModel->select('posts.*, users.username as author_name')
                   ->join('users', 'users.id = posts.user_id')
                   ->findAll();

foreach ($posts as $post) {
    echo $post['author_name']; // No additional queries
}
```

## Performance Considerations

### Query Optimization

```php
// Enable query profiling in development
$db = \Config\Database::connect();
$db->query("SET profiling = 1");

// Use specific columns instead of SELECT *
$users = $userModel->select('id, username, email')
                   ->where('status', 'active')
                   ->findAll();

// Use pagination for large datasets
$users = $userModel->paginate(20);
$pager = $userModel->pager;

// Cache expensive queries
$cache = \Config\Services::cache();
$cacheKey = 'active_users_count';

if (!$count = $cache->get($cacheKey)) {
    $count = $userModel->where('status', 'active')->countAllResults();
    $cache->save($cacheKey, $count, 3600); // Cache for 1 hour
}

// Use database-level caching
$builder = $db->table('products');
$builder->where('category_id', $categoryId);
$query = $builder->get();
$query->cache(3600, 'products_category_' . $categoryId);
```

### Response Caching

```php
// Page caching
class Products extends BaseController
{
    public function index()
    {
        // Cache this page for 5 minutes
        $this->cachePage(300);

        $data['products'] = $this->productModel->findAll();
        return view('products/index', $data);
    }
}

// Fragment caching in views
<?php if (!$cachedSidebar = cache('sidebar')): ?>
    <?php $cachedSidebar = view('partials/sidebar', $sidebarData); ?>
    <?php cache()->save('sidebar', $cachedSidebar, 3600); ?>
<?php endif; ?>
<?= $cachedSidebar ?>

// API response caching
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

### Autoloading Optimization

```php
// Generate optimized autoloader for production
// composer dump-autoload --optimize --classmap-authoritative

// Preload critical classes in app/Config/Autoload.php
public $classmap = [
    'App\Models\UserModel' => APPPATH . 'Models/UserModel.php',
    'App\Models\ProductModel' => APPPATH . 'Models/ProductModel.php'
];

// Use Composer's classmap in production
// composer.json
{
    "autoload": {
        "classmap": ["app/"]
    }
}
```

## Real-World Scenarios

### Authentication System

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
                           ->with('error', 'Invalid credentials');
        }

        if ($user['status'] !== 'active') {
            return redirect()->back()
                           ->with('error', 'Account is not active');
        }

        // Set session
        session()->set([
            'user_id'     => $user['id'],
            'username'    => $user['username'],
            'email'       => $user['email'],
            'role'        => $user['role'],
            'isLoggedIn'  => true
        ]);

        session()->regenerate();

        // Update last login
        $this->userModel->update($user['id'], [
            'last_login' => date('Y-m-d H:i:s')
        ]);

        return redirect()->to('/dashboard')
                        ->with('success', 'Welcome back, ' . $user['username']);
    }

    public function logout()
    {
        session()->destroy();
        return redirect()->to('/login')
                        ->with('success', 'You have been logged out');
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
            'password' => $this->request->getPost('password'), // Hashed by model callback
            'status'   => 'active',
            'role'     => 'user'
        ]);

        return redirect()->to('/login')
                        ->with('success', 'Registration successful. Please login.');
    }
}
```

### File Upload Handling

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
                'max_size[image,2048]', // 2MB max
                'max_dims[image,2000,2000]'
            ]
        ];

        if (!$this->validate($validationRules)) {
            return redirect()->back()->with('errors', $this->validator->getErrors());
        }

        $file = $this->request->getFile('image');

        if ($file->isValid() && !$file->hasMoved()) {
            // Generate unique filename
            $newName = $file->getRandomName();

            // Move to uploads directory
            $file->move(WRITEPATH . 'uploads/images', $newName);

            // Save to database
            $this->imageModel->insert([
                'filename'     => $newName,
                'original_name' => $file->getClientName(),
                'file_type'    => $file->getClientMimeType(),
                'file_size'    => $file->getSize(),
                'user_id'      => session()->get('user_id')
            ]);

            return redirect()->back()->with('success', 'Image uploaded successfully');
        }

        return redirect()->back()->with('error', 'Upload failed');
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

## Interview Key Points

1. **What are the key differences between CodeIgniter 3 and CodeIgniter 4?**
   - CI4 uses namespaces and PSR-4 autoloading, requires PHP 7.4+, has a completely rewritten core, supports environment-based configuration, includes a new CLI tool (Spark), and implements modern PHP practices.

2. **How does CodeIgniter handle security?**
   - Built-in CSRF protection, XSS filtering, SQL injection prevention through Query Builder, input validation, output escaping, secure session handling, and password hashing utilities.

3. **Explain the CodeIgniter request lifecycle.**
   - Request enters through public/index.php, bootstrap loads, routing determines controller/method, filters run (before), controller executes, response generated, filters run (after), response sent.

4. **What are Filters in CodeIgniter and how do they differ from hooks?**
   - Filters are the CI4 equivalent of middleware, replacing CI3 hooks. They can modify requests before controllers and responses after, implementing FilterInterface with before() and after() methods.

5. **How would you optimize a CodeIgniter application?**
   - Enable caching (page, database, query), optimize database queries, use pagination, implement proper indexing, enable OPcache, use CDN for assets, minimize autoloading, and configure production environment settings.

6. **Explain the Model layer in CodeIgniter 4.**
   - Models extend CodeIgniter\Model, provide CRUD operations, support validation rules, callbacks, soft deletes, timestamps, and can return arrays, objects, or Entity instances.

7. **How does CodeIgniter handle database migrations?**
   - Through the Migration class and Spark CLI. Migrations track schema changes, support up/down operations, enable version control of database structure, and facilitate team collaboration.

## Further Reading

- [CodeIgniter 4 Official Documentation](https://codeigniter.com/user_guide/)
- [CodeIgniter 4 GitHub Repository](https://github.com/codeigniter4/CodeIgniter4)
- [CodeIgniter Forums](https://forum.codeigniter.com/)
- [CodeIgniter 4 From Scratch Video Series](https://www.youtube.com/results?search_query=codeigniter+4+tutorial)
- [CI4 Best Practices Guide](https://codeigniter4.github.io/userguide/concepts/index.html)
- [Query Builder Documentation](https://codeigniter.com/user_guide/database/query_builder.html)
- [Spark CLI Reference](https://codeigniter.com/user_guide/cli/spark_commands.html)
