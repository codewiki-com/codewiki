---
title: Symfony 框架指南
description: Symfony PHP 框架完整指南，涵盖组件、Bundle、依赖注入、路由和企业应用开发
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - Symfony
  - MVC
  - Enterprise
  - Components
status: imported
origin: old/src/content/docs/php/symfony.zh.md
divergence: 0.2
issues: []
legacy:
  category: PHP
  subcategory: Web Frameworks
  order: 20
  lastUpdated: 2026-01-21
---

Symfony 是一个强大的企业级 PHP 框架和一组可重用的 PHP 组件。由 SensioLabs 创建，Symfony 已成为许多其他框架的基础，包括 Laravel、Drupal 和无数的企业应用。它强调最佳实践、标准化和互操作性。

## 概念解释

Symfony 基于这样的原则运作：Web 框架应该是一系列解耦、可重用组件的集合。与单体框架不同，Symfony 允许你只使用你需要的部分，从单独的组件到全栈框架。

该框架实现了多种设计模式，包括模型-视图-控制器（MVC）、依赖注入、前端控制器和仓储模式。Symfony 严格遵循 PHP 标准建议（PSR），使其与其他 PHP 库具有高度的互操作性。

在其核心，Symfony 通过一个由路由、控制器、服务和视图组成的结构化管道将 HTTP 请求转换为 HTTP 响应。这个请求-响应生命周期由 HttpKernel 组件管理，它是框架的心脏。

## 核心原理

### 组件架构

Symfony 由 50 多个独立组件构建，可以单独使用：

```php
// 独立使用 Symfony 组件
require 'vendor/autoload.php';

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

// 从全局变量创建请求
$request = Request::createFromGlobals();

// 创建响应
$response = new Response(
    'Hello, World!',
    Response::HTTP_OK,
    ['Content-Type' => 'text/plain']
);

$response->send();
```

### Bundle：插件系统

Bundle 是 Symfony 的插件系统，将相关功能打包在一起：

```php
// src/Kernel.php
namespace App;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    public function registerBundles(): iterable
    {
        $contents = require $this->getBundlesPath();
        foreach ($contents as $class => $envs) {
            if ($envs[$this->environment] ?? $envs['all'] ?? false) {
                yield new $class();
            }
        }
    }
}
```

### 依赖注入容器

服务容器是 Symfony 架构的核心：

```yaml
# config/services.yaml
services:
    _defaults:
        autowire: true
        autoconfigure: true

    App\:
        resource: '../src/'
        exclude:
            - '../src/DependencyInjection/'
            - '../src/Entity/'
            - '../src/Kernel.php'

    App\Service\PaymentProcessor:
        arguments:
            $apiKey: '%env(PAYMENT_API_KEY)%'
```

## 关键概念

### 安装和项目设置

```bash
# 创建新的 Symfony 项目（全栈）
composer create-project symfony/skeleton:"7.0.*" my-project
cd my-project

# 安装 webapp recipe 以获得全栈功能
composer require webapp

# 或创建一个最小的 API 项目
composer create-project symfony/skeleton:"7.0.*" my-api
cd my-api
composer require api
```

### 项目结构

```
my-project/
├── bin/
│   └── console              # CLI 工具
├── config/
│   ├── packages/            # 包配置
│   ├── routes/              # 路由配置
│   ├── bundles.php          # 已注册的 bundle
│   ├── routes.yaml          # 主路由
│   └── services.yaml        # 服务定义
├── public/
│   └── index.php            # 前端控制器
├── src/
│   ├── Controller/          # 控制器
│   ├── Entity/              # Doctrine 实体
│   ├── Repository/          # Doctrine 仓储
│   ├── Service/             # 业务逻辑服务
│   └── Kernel.php           # 应用内核
├── templates/               # Twig 模板
├── tests/                   # 测试文件
├── var/
│   ├── cache/               # 缓存文件
│   └── log/                 # 日志文件
├── vendor/                  # 依赖
├── .env                     # 环境变量
└── composer.json
```

### 路由

Symfony 支持多种路由配置格式：

```php
// src/Controller/ProductController.php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/products', name: 'product_')]
class ProductController extends AbstractController
{
    #[Route('/', name: 'index', methods: ['GET'])]
    public function index(): Response
    {
        return $this->render('product/index.html.twig', [
            'products' => $this->getProducts(),
        ]);
    }

    #[Route('/{id}', name: 'show', requirements: ['id' => '\d+'])]
    public function show(int $id): Response
    {
        return $this->render('product/show.html.twig', [
            'product' => $this->getProduct($id),
        ]);
    }

    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function new(): Response
    {
        // 处理表单提交
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'PUT'])]
    public function edit(int $id): Response
    {
        // 处理编辑
    }
}
```

### 控制器和响应

```php
namespace App\Controller;

use App\Entity\Article;
use App\Repository\ArticleRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ArticleController extends AbstractController
{
    public function __construct(
        private ArticleRepository $articleRepository
    ) {}

    #[Route('/api/articles', name: 'api_articles_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $articles = $this->articleRepository->findAll();

        return $this->json($articles, Response::HTTP_OK, [], [
            'groups' => ['article:read']
        ]);
    }

    #[Route('/api/articles', name: 'api_articles_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $article = new Article();
        $article->setTitle($data['title']);
        $article->setContent($data['content']);

        $this->articleRepository->save($article, true);

        return $this->json($article, Response::HTTP_CREATED, [], [
            'groups' => ['article:read']
        ]);
    }

    #[Route('/articles/{slug}', name: 'article_show')]
    public function show(Article $article): Response
    {
        // ParamConverter 自动获取实体
        return $this->render('article/show.html.twig', [
            'article' => $article,
        ]);
    }
}
```

## 代码示例

### 服务层模式

```php
// src/Service/OrderService.php
namespace App\Service;

use App\Entity\Order;
use App\Entity\User;
use App\Event\OrderCreatedEvent;
use App\Repository\OrderRepository;
use App\Repository\ProductRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;

class OrderService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private OrderRepository $orderRepository,
        private ProductRepository $productRepository,
        private EventDispatcherInterface $eventDispatcher,
        private LoggerInterface $logger,
        private string $defaultCurrency = 'USD'
    ) {}

    public function createOrder(User $user, array $items): Order
    {
        $this->entityManager->beginTransaction();

        try {
            $order = new Order();
            $order->setUser($user);
            $order->setCurrency($this->defaultCurrency);
            $order->setStatus(Order::STATUS_PENDING);

            $total = 0;
            foreach ($items as $item) {
                $product = $this->productRepository->find($item['product_id']);

                if (!$product || $product->getStock() < $item['quantity']) {
                    throw new \RuntimeException("产品不可用: {$item['product_id']}");
                }

                $order->addItem($product, $item['quantity']);
                $total += $product->getPrice() * $item['quantity'];

                $product->decrementStock($item['quantity']);
            }

            $order->setTotal($total);

            $this->entityManager->persist($order);
            $this->entityManager->flush();
            $this->entityManager->commit();

            // 分发事件
            $this->eventDispatcher->dispatch(
                new OrderCreatedEvent($order),
                OrderCreatedEvent::NAME
            );

            $this->logger->info('订单已创建', ['order_id' => $order->getId()]);

            return $order;

        } catch (\Exception $e) {
            $this->entityManager->rollback();
            $this->logger->error('订单创建失败', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
```

### 事件系统

```php
// src/Event/OrderCreatedEvent.php
namespace App\Event;

use App\Entity\Order;
use Symfony\Contracts\EventDispatcher\Event;

class OrderCreatedEvent extends Event
{
    public const NAME = 'order.created';

    public function __construct(
        private Order $order
    ) {}

    public function getOrder(): Order
    {
        return $this->order;
    }
}

// src/EventSubscriber/OrderSubscriber.php
namespace App\EventSubscriber;

use App\Event\OrderCreatedEvent;
use App\Service\EmailService;
use App\Service\InventoryService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class OrderSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private EmailService $emailService,
        private InventoryService $inventoryService
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            OrderCreatedEvent::NAME => [
                ['sendConfirmationEmail', 10],
                ['updateInventory', 5],
                ['notifyWarehouse', 0],
            ],
        ];
    }

    public function sendConfirmationEmail(OrderCreatedEvent $event): void
    {
        $order = $event->getOrder();
        $this->emailService->sendOrderConfirmation($order);
    }

    public function updateInventory(OrderCreatedEvent $event): void
    {
        $this->inventoryService->processOrder($event->getOrder());
    }

    public function notifyWarehouse(OrderCreatedEvent $event): void
    {
        // 通知仓库系统
    }
}
```

### 表单和验证

```php
// src/Form/RegistrationType.php
namespace App\Form;

use App\Entity\User;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\RepeatedType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints as Assert;

class RegistrationType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('email', EmailType::class, [
                'constraints' => [
                    new Assert\NotBlank(),
                    new Assert\Email(),
                ],
            ])
            ->add('username', TextType::class, [
                'constraints' => [
                    new Assert\NotBlank(),
                    new Assert\Length(['min' => 3, 'max' => 50]),
                    new Assert\Regex([
                        'pattern' => '/^[a-zA-Z0-9_]+$/',
                        'message' => '用户名只能包含字母、数字和下划线',
                    ]),
                ],
            ])
            ->add('password', RepeatedType::class, [
                'type' => PasswordType::class,
                'first_options' => ['label' => '密码'],
                'second_options' => ['label' => '确认密码'],
                'constraints' => [
                    new Assert\NotBlank(),
                    new Assert\Length(['min' => 8]),
                    new Assert\Regex([
                        'pattern' => '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
                        'message' => '密码必须包含大写字母、小写字母和数字',
                    ]),
                ],
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => User::class,
        ]);
    }
}

// 控制器使用
#[Route('/register', name: 'app_register')]
public function register(Request $request, UserPasswordHasherInterface $hasher): Response
{
    $user = new User();
    $form = $this->createForm(RegistrationType::class, $user);
    $form->handleRequest($request);

    if ($form->isSubmitted() && $form->isValid()) {
        $user->setPassword(
            $hasher->hashPassword($user, $form->get('password')->getData())
        );

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $this->redirectToRoute('app_login');
    }

    return $this->render('registration/register.html.twig', [
        'registrationForm' => $form->createView(),
    ]);
}
```

### 安全配置

```yaml
# config/packages/security.yaml
security:
    password_hashers:
        Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface: 'auto'

    providers:
        app_user_provider:
            entity:
                class: App\Entity\User
                property: email

    firewalls:
        dev:
            pattern: ^/(_(profiler|wdt)|css|images|js)/
            security: false

        api:
            pattern: ^/api
            stateless: true
            jwt: ~

        main:
            lazy: true
            provider: app_user_provider
            custom_authenticator: App\Security\LoginFormAuthenticator
            logout:
                path: app_logout
            remember_me:
                secret: '%kernel.secret%'
                lifetime: 604800

    access_control:
        - { path: ^/api/login, roles: PUBLIC_ACCESS }
        - { path: ^/api, roles: ROLE_USER }
        - { path: ^/admin, roles: ROLE_ADMIN }
        - { path: ^/profile, roles: ROLE_USER }
```

### 自定义认证器

```php
// src/Security/LoginFormAuthenticator.php
namespace App\Security;

use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractLoginFormAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\CsrfTokenBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\RememberMeBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Credentials\PasswordCredentials;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Util\TargetPathTrait;

class LoginFormAuthenticator extends AbstractLoginFormAuthenticator
{
    use TargetPathTrait;

    public const LOGIN_ROUTE = 'app_login';

    public function __construct(
        private UrlGeneratorInterface $urlGenerator,
        private UserRepository $userRepository
    ) {}

    public function authenticate(Request $request): Passport
    {
        $email = $request->request->get('email', '');
        $request->getSession()->set('_security.last_username', $email);

        return new Passport(
            new UserBadge($email, fn($identifier) => $this->userRepository->findByEmail($identifier)),
            new PasswordCredentials($request->request->get('password', '')),
            [
                new CsrfTokenBadge('authenticate', $request->request->get('_csrf_token')),
                new RememberMeBadge(),
            ]
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        if ($targetPath = $this->getTargetPath($request->getSession(), $firewallName)) {
            return new RedirectResponse($targetPath);
        }

        return new RedirectResponse($this->urlGenerator->generate('app_dashboard'));
    }

    protected function getLoginUrl(Request $request): string
    {
        return $this->urlGenerator->generate(self::LOGIN_ROUTE);
    }
}
```

## 最佳实践

### 服务设计

```php
// 使用接口以获得灵活性
interface PaymentGatewayInterface
{
    public function charge(Money $amount, PaymentMethod $method): PaymentResult;
    public function refund(string $transactionId, Money $amount): RefundResult;
}

// 实现具体的网关
class StripeGateway implements PaymentGatewayInterface
{
    public function __construct(
        private StripeClient $client,
        private LoggerInterface $logger
    ) {}

    public function charge(Money $amount, PaymentMethod $method): PaymentResult
    {
        try {
            $charge = $this->client->charges->create([
                'amount' => $amount->getAmountInCents(),
                'currency' => $amount->getCurrency(),
                'source' => $method->getToken(),
            ]);

            return PaymentResult::success($charge->id);
        } catch (StripeException $e) {
            $this->logger->error('Stripe 收费失败', ['error' => $e->getMessage()]);
            return PaymentResult::failure($e->getMessage());
        }
    }

    // ...
}

// 在 services.yaml 中注册
// services:
//     App\Payment\PaymentGatewayInterface:
//         alias: App\Payment\StripeGateway
```

### 配置管理

```php
// src/DependencyInjection/Configuration.php
namespace App\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

class Configuration implements ConfigurationInterface
{
    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder('app');

        $treeBuilder->getRootNode()
            ->children()
                ->arrayNode('payment')
                    ->children()
                        ->scalarNode('provider')
                            ->defaultValue('stripe')
                            ->validate()
                                ->ifNotInArray(['stripe', 'paypal', 'braintree'])
                                ->thenInvalid('无效的支付提供商 %s')
                            ->end()
                        ->end()
                        ->booleanNode('sandbox_mode')
                            ->defaultTrue()
                        ->end()
                        ->arrayNode('currencies')
                            ->scalarPrototype()->end()
                            ->defaultValue(['USD', 'EUR', 'GBP'])
                        ->end()
                    ->end()
                ->end()
            ->end();

        return $treeBuilder;
    }
}
```

### 命令总线模式

```php
// src/Command/CreateUserCommand.php
namespace App\Command;

class CreateUserCommand
{
    public function __construct(
        public readonly string $email,
        public readonly string $username,
        public readonly string $password,
        public readonly array $roles = ['ROLE_USER']
    ) {}
}

// src/CommandHandler/CreateUserHandler.php
namespace App\CommandHandler;

use App\Command\CreateUserCommand;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsMessageHandler]
class CreateUserHandler
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher
    ) {}

    public function __invoke(CreateUserCommand $command): User
    {
        $user = new User();
        $user->setEmail($command->email);
        $user->setUsername($command->username);
        $user->setPassword($this->passwordHasher->hashPassword($user, $command->password));
        $user->setRoles($command->roles);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }
}

// 在控制器中使用
#[Route('/users', methods: ['POST'])]
public function create(Request $request, MessageBusInterface $bus): Response
{
    $data = json_decode($request->getContent(), true);

    $command = new CreateUserCommand(
        email: $data['email'],
        username: $data['username'],
        password: $data['password']
    );

    $user = $bus->dispatch($command);

    return $this->json($user, Response::HTTP_CREATED);
}
```

## 常见陷阱

### 循环依赖

```php
// 错误：服务之间的循环依赖
class ServiceA
{
    public function __construct(private ServiceB $serviceB) {}
}

class ServiceB
{
    public function __construct(private ServiceA $serviceA) {}
}

// 正确：使用延迟加载或事件打破循环
class ServiceA
{
    public function __construct(
        private ContainerInterface $container
    ) {}

    private function getServiceB(): ServiceB
    {
        return $this->container->get(ServiceB::class);
    }
}

// 或使用 setter 注入
class ServiceB
{
    private ?ServiceA $serviceA = null;

    #[Required]
    public function setServiceA(ServiceA $serviceA): void
    {
        $this->serviceA = $serviceA;
    }
}
```

### Doctrine 实体错误

```php
// 错误：直接暴露实体
#[Route('/users/{id}')]
public function show(User $user): JsonResponse
{
    return $this->json($user); // 暴露密码、内部字段
}

// 正确：使用 DTO 或序列化组
#[Route('/users/{id}')]
public function show(User $user): JsonResponse
{
    return $this->json($user, 200, [], [
        'groups' => ['user:read']
    ]);
}

// 或使用 DTO
class UserDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $email,
        public readonly string $username
    ) {}

    public static function fromEntity(User $user): self
    {
        return new self(
            id: $user->getId(),
            email: $user->getEmail(),
            username: $user->getUsername()
        );
    }
}
```

### Session 和缓存问题

```php
// 错误：在 session 中存储实体
$session->set('current_user', $user); // 实体变成分离状态

// 正确：只存储标识符
$session->set('current_user_id', $user->getId());

// 需要时获取新鲜的实体
$user = $this->userRepository->find($session->get('current_user_id'));

// 错误：不考虑缓存失效
$cache->set('user_' . $userId, $user); // 永不失效

// 正确：使用缓存标签进行失效
$cache->get('user_' . $userId, function (ItemInterface $item) use ($userId) {
    $item->expiresAfter(3600);
    $item->tag(['user', 'user_' . $userId]);

    return $this->userRepository->find($userId);
});

// 用户更新时失效
$cache->invalidateTags(['user_' . $userId]);
```

## 性能考虑

### 优化 Doctrine 查询

```php
// 对只读操作使用带部分水合的 DQL
$query = $this->entityManager->createQuery(
    'SELECT partial u.{id, username, email} FROM App\Entity\User u WHERE u.active = true'
);
$query->setHint(Query::HINT_READ_ONLY, true);
$users = $query->getResult();

// 使用 Query Builder 选择特定字段
$qb = $this->userRepository->createQueryBuilder('u')
    ->select('u.id', 'u.username', 'u.email', 'COUNT(o.id) as orderCount')
    ->leftJoin('u.orders', 'o')
    ->groupBy('u.id')
    ->setMaxResults(100);

// 启用结果缓存
$query = $qb->getQuery();
$query->enableResultCache(3600, 'users_with_order_count');
$results = $query->getResult();
```

### HTTP 缓存头

```php
use Symfony\Component\HttpFoundation\Response;

#[Route('/products/{id}')]
public function show(Product $product): Response
{
    $response = $this->render('product/show.html.twig', [
        'product' => $product,
    ]);

    // 设置缓存头
    $response->setPublic();
    $response->setMaxAge(3600);
    $response->setSharedMaxAge(3600);

    // ETag 验证
    $response->setEtag(md5($product->getUpdatedAt()->format('U')));
    $response->isNotModified($this->container->get('request_stack')->getCurrentRequest());

    return $response;
}

// 对于 API 响应
#[Route('/api/products')]
public function list(): JsonResponse
{
    $products = $this->productRepository->findActive();

    $response = $this->json($products);
    $response->setCache([
        'public' => true,
        'max_age' => 600,
        's_maxage' => 600,
        'stale_while_revalidate' => 86400,
    ]);

    return $response;
}
```

### 使用 Messenger 进行异步处理

```php
// config/packages/messenger.yaml
framework:
    messenger:
        transports:
            async:
                dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
                retry_strategy:
                    max_retries: 3
                    delay: 1000
                    multiplier: 2

            failed: 'doctrine://default?queue_name=failed'

        routing:
            App\Message\SendEmailMessage: async
            App\Message\ProcessImageMessage: async

// src/Message/SendEmailMessage.php
class SendEmailMessage
{
    public function __construct(
        public readonly string $to,
        public readonly string $subject,
        public readonly string $template,
        public readonly array $context = []
    ) {}
}

// src/MessageHandler/SendEmailHandler.php
#[AsMessageHandler]
class SendEmailHandler
{
    public function __construct(private MailerInterface $mailer) {}

    public function __invoke(SendEmailMessage $message): void
    {
        $email = (new TemplatedEmail())
            ->to($message->to)
            ->subject($message->subject)
            ->htmlTemplate($message->template)
            ->context($message->context);

        $this->mailer->send($email);
    }
}

// 使用
$this->bus->dispatch(new SendEmailMessage(
    to: 'user@example.com',
    subject: '欢迎！',
    template: 'emails/welcome.html.twig',
    context: ['user' => $user]
));
```

## 实际场景

### 构建 REST API

```php
// src/Controller/Api/ProductApiController.php
namespace App\Controller\Api;

use App\Entity\Product;
use App\Repository\ProductRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/products', name: 'api_product_')]
class ProductApiController extends AbstractController
{
    public function __construct(
        private ProductRepository $productRepository,
        private EntityManagerInterface $entityManager,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', 20);
        $category = $request->query->get('category');

        $qb = $this->productRepository->createQueryBuilder('p')
            ->where('p.active = true');

        if ($category) {
            $qb->andWhere('p.category = :category')
               ->setParameter('category', $category);
        }

        $qb->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        $products = $qb->getQuery()->getResult();
        $total = $this->productRepository->count(['active' => true]);

        return $this->json([
            'data' => $products,
            'meta' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit),
            ],
        ], 200, [], ['groups' => ['product:list']]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(Product $product): JsonResponse
    {
        return $this->json($product, 200, [], ['groups' => ['product:read']]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $product = $this->serializer->deserialize(
            $request->getContent(),
            Product::class,
            'json',
            ['groups' => ['product:write']]
        );

        $errors = $this->validator->validate($product);
        if (count($errors) > 0) {
            return $this->json(['errors' => (string) $errors], Response::HTTP_BAD_REQUEST);
        }

        $this->entityManager->persist($product);
        $this->entityManager->flush();

        return $this->json($product, Response::HTTP_CREATED, [], ['groups' => ['product:read']]);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(Request $request, Product $product): JsonResponse
    {
        $this->serializer->deserialize(
            $request->getContent(),
            Product::class,
            'json',
            [
                'object_to_populate' => $product,
                'groups' => ['product:write']
            ]
        );

        $errors = $this->validator->validate($product);
        if (count($errors) > 0) {
            return $this->json(['errors' => (string) $errors], Response::HTTP_BAD_REQUEST);
        }

        $this->entityManager->flush();

        return $this->json($product, 200, [], ['groups' => ['product:read']]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(Product $product): JsonResponse
    {
        $this->entityManager->remove($product);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
```

### 多租户应用

```php
// src/EventListener/TenantListener.php
namespace App\EventListener;

use App\Entity\TenantAwareInterface;
use App\Service\TenantContext;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Events;

#[AsDoctrineListener(event: Events::prePersist)]
class TenantListener
{
    public function __construct(private TenantContext $tenantContext) {}

    public function prePersist(PrePersistEventArgs $args): void
    {
        $entity = $args->getObject();

        if ($entity instanceof TenantAwareInterface) {
            $entity->setTenant($this->tenantContext->getCurrentTenant());
        }
    }
}

// src/Repository/TenantAwareRepository.php
namespace App\Repository;

use App\Service\TenantContext;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;

abstract class TenantAwareRepository extends ServiceEntityRepository
{
    protected TenantContext $tenantContext;

    #[Required]
    public function setTenantContext(TenantContext $tenantContext): void
    {
        $this->tenantContext = $tenantContext;
    }

    public function createQueryBuilder($alias, $indexBy = null): QueryBuilder
    {
        return parent::createQueryBuilder($alias, $indexBy)
            ->andWhere("$alias.tenant = :tenant")
            ->setParameter('tenant', $this->tenantContext->getCurrentTenant());
    }
}
```

## 面试要点

1. **什么是 Symfony Kernel，它是如何工作的？**
   - Kernel 引导框架，注册 bundle，管理配置，通过 HttpKernel 组件处理请求-响应生命周期。

2. **解释 Symfony 中的依赖注入。**
   - Symfony 使用编译的 DI 容器，根据类型提示自动装配服务。服务在 YAML、XML 或 PHP 中配置，容器为生产环境编译。

3. **什么是 Symfony 事件，它与中间件有何不同？**
   - 事件在整个请求生命周期中提供钩子点（kernel.request、kernel.response 等）。与中间件不同，事件允许多个具有优先级排序的监听器，并可以停止传播。

4. **Symfony 如何处理安全？**
   - 通过防火墙、认证器、投票器和访问控制。安全组件分别支持身份验证（你是谁）和授权（你能做什么）。

5. **什么是 Symfony Flex 和 Recipes？**
   - Flex 是一个自动化包配置的 Composer 插件。Recipes 是安装和配置 bundle、创建目录和更新配置文件的指令。

6. **解释 Form 组件工作流程。**
   - 表单是处理数据转换、验证和渲染的对象。工作流程：创建表单类型，处理请求，验证，处理数据。

7. **如何优化 Symfony 应用？**
   - 启用 OPcache，使用 HTTP 缓存，配置 Doctrine 缓存，使用 Messenger 进行异步处理，优化自动加载，使用生产环境设置。

## 进一步阅读

- [Symfony 官方文档](https://symfony.com/doc/current/index.html)
- [Symfony 最佳实践](https://symfony.com/doc/current/best_practices.html)
- [Symfony 框架最佳实践书籍](https://symfony.com/doc/current/the-fast-track/en/index.html)
- [Symfony 组件文档](https://symfony.com/doc/current/components/index.html)
- [API Platform（基于 Symfony 构建）](https://api-platform.com/docs/)
- [Doctrine ORM 文档](https://www.doctrine-project.org/projects/orm.html)
- [SymfonyCasts 教程](https://symfonycasts.com/)
