---
title: Symfony Framework Guide
description: Complete guide to the Symfony PHP framework covering components, bundles, dependency injection, routing, and enterprise application development
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
origin: old/src/content/docs/php/symfony.en.md
divergence: 0.2
issues: []
legacy:
  category: PHP
  subcategory: Web Frameworks
  order: 20
  lastUpdated: 2026-01-21
---

Symfony is a robust, enterprise-grade PHP framework and a set of reusable PHP components. Created by SensioLabs, Symfony has become the foundation for many other frameworks including Laravel, Drupal, and countless enterprise applications. It emphasizes best practices, standardization, and interoperability.

## Concept Explanation

Symfony operates on the principle that a web framework should be a collection of decoupled, reusable components. Unlike monolithic frameworks, Symfony allows you to use only what you need, from individual components to the full-stack framework.

The framework implements several design patterns including Model-View-Controller (MVC), Dependency Injection, Front Controller, and Repository patterns. Symfony strictly follows PHP Standards Recommendations (PSR), making it highly interoperable with other PHP libraries.

At its core, Symfony transforms HTTP requests into HTTP responses through a structured pipeline of routing, controllers, services, and views. This request-response lifecycle is managed by the HttpKernel component, which serves as the heart of the framework.

## Core Principles

### The Component Architecture

Symfony is built from over 50 standalone components that can be used independently:

```php
// Using Symfony components standalone
require 'vendor/autoload.php';

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

// Create a request from globals
$request = Request::createFromGlobals();

// Create a response
$response = new Response(
    'Hello, World!',
    Response::HTTP_OK,
    ['Content-Type' => 'text/plain']
);

$response->send();
```

### Bundles: The Plugin System

Bundles are Symfony's plugin system, packaging related functionality together:

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

### Dependency Injection Container

The service container is central to Symfony's architecture:

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

## Key Concepts

### Installation and Project Setup

```bash
# Create a new Symfony project (full-stack)
composer create-project symfony/skeleton:"7.0.*" my-project
cd my-project

# Install the webapp recipe for full-stack features
composer require webapp

# Or create a minimal API project
composer create-project symfony/skeleton:"7.0.*" my-api
cd my-api
composer require api
```

### Project Structure

```
my-project/
├── bin/
│   └── console              # CLI tool
├── config/
│   ├── packages/            # Package configurations
│   ├── routes/              # Route configurations
│   ├── bundles.php          # Registered bundles
│   ├── routes.yaml          # Main routes
│   └── services.yaml        # Service definitions
├── public/
│   └── index.php            # Front controller
├── src/
│   ├── Controller/          # Controllers
│   ├── Entity/              # Doctrine entities
│   ├── Repository/          # Doctrine repositories
│   ├── Service/             # Business logic services
│   └── Kernel.php           # Application kernel
├── templates/               # Twig templates
├── tests/                   # Test files
├── var/
│   ├── cache/               # Cache files
│   └── log/                 # Log files
├── vendor/                  # Dependencies
├── .env                     # Environment variables
└── composer.json
```

### Routing

Symfony supports multiple routing configuration formats:

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
        // Handle form submission
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'PUT'])]
    public function edit(int $id): Response
    {
        // Handle edit
    }
}
```

### Controllers and Responses

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
        // ParamConverter automatically fetches the entity
        return $this->render('article/show.html.twig', [
            'article' => $article,
        ]);
    }
}
```

## Code Examples

### Service Layer Pattern

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
                    throw new \RuntimeException("Product unavailable: {$item['product_id']}");
                }

                $order->addItem($product, $item['quantity']);
                $total += $product->getPrice() * $item['quantity'];

                $product->decrementStock($item['quantity']);
            }

            $order->setTotal($total);

            $this->entityManager->persist($order);
            $this->entityManager->flush();
            $this->entityManager->commit();

            // Dispatch event
            $this->eventDispatcher->dispatch(
                new OrderCreatedEvent($order),
                OrderCreatedEvent::NAME
            );

            $this->logger->info('Order created', ['order_id' => $order->getId()]);

            return $order;

        } catch (\Exception $e) {
            $this->entityManager->rollback();
            $this->logger->error('Order creation failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
```

### Event System

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
        // Notify warehouse system
    }
}
```

### Forms and Validation

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
                        'message' => 'Username can only contain letters, numbers, and underscores',
                    ]),
                ],
            ])
            ->add('password', RepeatedType::class, [
                'type' => PasswordType::class,
                'first_options' => ['label' => 'Password'],
                'second_options' => ['label' => 'Confirm Password'],
                'constraints' => [
                    new Assert\NotBlank(),
                    new Assert\Length(['min' => 8]),
                    new Assert\Regex([
                        'pattern' => '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
                        'message' => 'Password must contain uppercase, lowercase, and number',
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

// Controller usage
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

### Security Configuration

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

### Custom Authenticator

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

## Best Practices

### Service Design

```php
// Use interfaces for flexibility
interface PaymentGatewayInterface
{
    public function charge(Money $amount, PaymentMethod $method): PaymentResult;
    public function refund(string $transactionId, Money $amount): RefundResult;
}

// Implement specific gateways
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
            $this->logger->error('Stripe charge failed', ['error' => $e->getMessage()]);
            return PaymentResult::failure($e->getMessage());
        }
    }

    // ...
}

// Register in services.yaml
// services:
//     App\Payment\PaymentGatewayInterface:
//         alias: App\Payment\StripeGateway
```

### Configuration Management

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
                                ->thenInvalid('Invalid payment provider %s')
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

### Command Bus Pattern

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

// Usage in controller
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

## Common Pitfalls

### Circular Dependencies

```php
// WRONG: Circular dependency between services
class ServiceA
{
    public function __construct(private ServiceB $serviceB) {}
}

class ServiceB
{
    public function __construct(private ServiceA $serviceA) {}
}

// CORRECT: Break cycle with lazy loading or events
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

// Or use setter injection
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

### Doctrine Entity Mistakes

```php
// WRONG: Exposing entity directly
#[Route('/users/{id}')]
public function show(User $user): JsonResponse
{
    return $this->json($user); // Exposes password, internal fields
}

// CORRECT: Use DTOs or serialization groups
#[Route('/users/{id}')]
public function show(User $user): JsonResponse
{
    return $this->json($user, 200, [], [
        'groups' => ['user:read']
    ]);
}

// Or use a DTO
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

### Session and Cache Issues

```php
// WRONG: Storing entities in session
$session->set('current_user', $user); // Entity becomes detached

// CORRECT: Store only identifiers
$session->set('current_user_id', $user->getId());

// Then fetch fresh entity when needed
$user = $this->userRepository->find($session->get('current_user_id'));

// WRONG: Not considering cache invalidation
$cache->set('user_' . $userId, $user); // Never invalidated

// CORRECT: Use cache tags for invalidation
$cache->get('user_' . $userId, function (ItemInterface $item) use ($userId) {
    $item->expiresAfter(3600);
    $item->tag(['user', 'user_' . $userId]);

    return $this->userRepository->find($userId);
});

// Invalidate when user is updated
$cache->invalidateTags(['user_' . $userId]);
```

## Performance Considerations

### Optimizing Doctrine Queries

```php
// Use DQL with partial hydration for read-only operations
$query = $this->entityManager->createQuery(
    'SELECT partial u.{id, username, email} FROM App\Entity\User u WHERE u.active = true'
);
$query->setHint(Query::HINT_READ_ONLY, true);
$users = $query->getResult();

// Use Query Builder with select for specific fields
$qb = $this->userRepository->createQueryBuilder('u')
    ->select('u.id', 'u.username', 'u.email', 'COUNT(o.id) as orderCount')
    ->leftJoin('u.orders', 'o')
    ->groupBy('u.id')
    ->setMaxResults(100);

// Enable result caching
$query = $qb->getQuery();
$query->enableResultCache(3600, 'users_with_order_count');
$results = $query->getResult();
```

### HTTP Cache Headers

```php
use Symfony\Component\HttpFoundation\Response;

#[Route('/products/{id}')]
public function show(Product $product): Response
{
    $response = $this->render('product/show.html.twig', [
        'product' => $product,
    ]);

    // Set cache headers
    $response->setPublic();
    $response->setMaxAge(3600);
    $response->setSharedMaxAge(3600);

    // ETag validation
    $response->setEtag(md5($product->getUpdatedAt()->format('U')));
    $response->isNotModified($this->container->get('request_stack')->getCurrentRequest());

    return $response;
}

// For API responses
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

### Messenger for Async Processing

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

// Usage
$this->bus->dispatch(new SendEmailMessage(
    to: 'user@example.com',
    subject: 'Welcome!',
    template: 'emails/welcome.html.twig',
    context: ['user' => $user]
));
```

## Real-World Scenarios

### Building a REST API

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

### Multi-tenant Application

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

## Interview Key Points

1. **What is the Symfony Kernel and how does it work?**
   - The Kernel bootstraps the framework, registers bundles, manages configuration, and handles the request-response lifecycle through the HttpKernel component.

2. **Explain Dependency Injection in Symfony.**
   - Symfony uses a compiled DI container that autowires services based on type hints. Services are configured in YAML, XML, or PHP, and the container is compiled for production.

3. **What are Symfony Events and how do they differ from Middleware?**
   - Events provide hook points throughout the request lifecycle (kernel.request, kernel.response, etc.). Unlike middleware, events allow multiple listeners with priority ordering and can stop propagation.

4. **How does Symfony handle security?**
   - Through firewalls, authenticators, voters, and access control. The security component supports authentication (who you are) and authorization (what you can do) separately.

5. **What are Symfony Flex and Recipes?**
   - Flex is a Composer plugin that automates package configuration. Recipes are instructions for installing and configuring bundles, creating directories, and updating configuration files.

6. **Explain the Form component workflow.**
   - Forms are objects that handle data transformation, validation, and rendering. The workflow: create form type, handle request, validate, and process data.

7. **How would you optimize a Symfony application?**
   - Enable OPcache, use HTTP caching, configure Doctrine caching, use the Messenger for async processing, optimize autoloading, and use production environment settings.

## Further Reading

- [Symfony Official Documentation](https://symfony.com/doc/current/index.html)
- [Symfony Best Practices](https://symfony.com/doc/current/best_practices.html)
- [The Symfony Framework Best Practices Book](https://symfony.com/doc/current/the-fast-track/en/index.html)
- [Symfony Components Documentation](https://symfony.com/doc/current/components/index.html)
- [API Platform (Built on Symfony)](https://api-platform.com/docs/)
- [Doctrine ORM Documentation](https://www.doctrine-project.org/projects/orm.html)
- [SymfonyCasts Tutorials](https://symfonycasts.com/)
