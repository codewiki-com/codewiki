---
title: Doctrine ORM 深入解析
description: PHP Doctrine ORM 完整指南，涵盖实体映射、关系、查询和高级特性
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - Doctrine
  - ORM
  - 数据库
  - 实体
  - DQL
status: imported
origin: old/src/content/docs/php/doctrine.zh.md
divergence: 0.209
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: PHP
  subcategory: ""
  order: 2
  lastUpdated: 2026-01-21
---

Doctrine ORM 是 PHP 最强大和灵活的对象关系映射器。它为 PHP 对象提供透明的持久化，实现了数据映射器模式，使你的领域模型保持干净且与数据库关注点解耦。

## 概念解释

Doctrine ORM 将 PHP 对象（实体）映射到数据库表。与 Active Record 模式不同，Doctrine 中的实体是普通的 PHP 对象（POPO），没有数据库感知能力 - EntityManager 处理所有的持久化操作。

```php
<?php

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'users')]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $email;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct(string $email, string $name)
    {
        $this->email = $email;
        $this->name = $name;
        $this->createdAt = new \DateTimeImmutable();
    }

    // Getters 和 setters...
    public function getId(): ?int { return $this->id; }
    public function getEmail(): string { return $this->email; }
    public function getName(): string { return $this->name; }
}

// 使用 EntityManager
$user = new User('john@example.com', 'John Doe');
$entityManager->persist($user);
$entityManager->flush();

// 查找实体
$user = $entityManager->find(User::class, 1);
$user = $entityManager->getRepository(User::class)->findOneBy(['email' => 'john@example.com']);
```

## 核心原理

### 实体生命周期

```php
<?php

// Doctrine 中的实体状态：
// 1. NEW - 实体已创建但尚未持久化
// 2. MANAGED - 实体由 EntityManager 管理
// 3. DETACHED - 实体曾被管理但现在已断开连接
// 4. REMOVED - 实体计划删除

// NEW 状态
$user = new User('test@example.com', 'Test');

// 转换到 MANAGED
$entityManager->persist($user);

// 保存到数据库
$entityManager->flush();

// 仍然是 MANAGED - 变更被追踪
$user->setName('Updated Name');
$entityManager->flush(); // 自动检测并保存变更

// 转换到 DETACHED
$entityManager->detach($user);
// 或者
$entityManager->clear(); // 分离所有实体

// 重新附加分离的实体
$managedUser = $entityManager->merge($user);

// 转换到 REMOVED
$entityManager->remove($user);
$entityManager->flush(); // 执行 DELETE

// 从数据库刷新
$entityManager->refresh($user); // 从数据库重新加载，丢弃变更
```

### 列类型和映射

```php
<?php

use Doctrine\ORM\Mapping as ORM;
use Doctrine\DBAL\Types\Types;

#[ORM\Entity]
#[ORM\Table(name: 'products')]
class Product
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'AUTO')]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    // 字符串类型
    #[ORM\Column(type: Types::STRING, length: 255, unique: true)]
    private string $sku;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    // 数字类型
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private string $price;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $quantity = 0;

    #[ORM\Column(type: Types::FLOAT)]
    private float $weight;

    // 布尔值
    #[ORM\Column(type: Types::BOOLEAN)]
    private bool $isActive = true;

    // 日期/时间类型
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private \DateTime $updatedAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTime $releaseDate = null;

    // JSON 和数组类型
    #[ORM\Column(type: Types::JSON)]
    private array $metadata = [];

    #[ORM\Column(type: Types::SIMPLE_ARRAY, nullable: true)]
    private ?array $tags = null;

    // 枚举类型（PHP 8.1+）
    #[ORM\Column(type: Types::STRING, enumType: ProductStatus::class)]
    private ProductStatus $status;

    // GUID/UUID
    #[ORM\Column(type: Types::GUID, unique: true)]
    private string $uuid;
}

enum ProductStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}
```

## 核心要点

### 实体关系

```php
<?php

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

// 一对多 / 多对一
#[ORM\Entity]
class Author
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string')]
    private string $name;

    // 一个作者有多本书（反向端）
    #[ORM\OneToMany(targetEntity: Book::class, mappedBy: 'author', cascade: ['persist', 'remove'])]
    private Collection $books;

    public function __construct(string $name)
    {
        $this->name = $name;
        $this->books = new ArrayCollection();
    }

    public function addBook(Book $book): self
    {
        if (!$this->books->contains($book)) {
            $this->books->add($book);
            $book->setAuthor($this);
        }
        return $this;
    }

    public function removeBook(Book $book): self
    {
        if ($this->books->removeElement($book)) {
            if ($book->getAuthor() === $this) {
                $book->setAuthor(null);
            }
        }
        return $this;
    }

    public function getBooks(): Collection { return $this->books; }
}

#[ORM\Entity]
class Book
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string')]
    private string $title;

    // 多本书属于一个作者（拥有端）
    #[ORM\ManyToOne(targetEntity: Author::class, inversedBy: 'books')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Author $author = null;

    public function getAuthor(): ?Author { return $this->author; }
    public function setAuthor(?Author $author): self
    {
        $this->author = $author;
        return $this;
    }
}

// 多对多
#[ORM\Entity]
class Student
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string')]
    private string $name;

    // 多对多的拥有端
    #[ORM\ManyToMany(targetEntity: Course::class, inversedBy: 'students')]
    #[ORM\JoinTable(name: 'student_courses')]
    private Collection $courses;

    public function __construct(string $name)
    {
        $this->name = $name;
        $this->courses = new ArrayCollection();
    }

    public function enrollInCourse(Course $course): self
    {
        if (!$this->courses->contains($course)) {
            $this->courses->add($course);
            $course->addStudent($this);
        }
        return $this;
    }
}

#[ORM\Entity]
class Course
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string')]
    private string $title;

    // 多对多的反向端
    #[ORM\ManyToMany(targetEntity: Student::class, mappedBy: 'courses')]
    private Collection $students;

    public function __construct(string $title)
    {
        $this->title = $title;
        $this->students = new ArrayCollection();
    }

    public function addStudent(Student $student): self
    {
        if (!$this->students->contains($student)) {
            $this->students->add($student);
        }
        return $this;
    }
}

// 一对一
#[ORM\Entity]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    // 拥有端
    #[ORM\OneToOne(targetEntity: Profile::class, cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: true)]
    private ?Profile $profile = null;
}

#[ORM\Entity]
class Profile
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    // 反向端（可选）
    #[ORM\OneToOne(targetEntity: User::class, mappedBy: 'profile')]
    private ?User $user = null;
}
```

### DQL（Doctrine 查询语言）

```php
<?php

// DQL - 面向对象的查询语言

// 简单查询
$query = $entityManager->createQuery(
    'SELECT u FROM App\Entity\User u WHERE u.status = :status'
);
$query->setParameter('status', 'active');
$users = $query->getResult();

// 部分对象（选择特定字段）
$query = $entityManager->createQuery(
    'SELECT PARTIAL u.{id, email, name} FROM App\Entity\User u'
);

// 连接
$query = $entityManager->createQuery(
    'SELECT u, p FROM App\Entity\User u
     JOIN u.profile p
     WHERE p.country = :country'
);
$query->setParameter('country', 'US');

// 左连接
$query = $entityManager->createQuery(
    'SELECT a, b FROM App\Entity\Author a
     LEFT JOIN a.books b
     WHERE a.name LIKE :name'
);
$query->setParameter('name', '%Smith%');

// 聚合函数
$query = $entityManager->createQuery(
    'SELECT COUNT(u.id) as userCount, u.status
     FROM App\Entity\User u
     GROUP BY u.status'
);

// 子查询
$query = $entityManager->createQuery(
    'SELECT u FROM App\Entity\User u
     WHERE u.id IN (
         SELECT IDENTITY(o.user) FROM App\Entity\Order o
         WHERE o.total > :minTotal
     )'
);
$query->setParameter('minTotal', 1000);

// ORDER BY, LIMIT
$query = $entityManager->createQuery(
    'SELECT u FROM App\Entity\User u
     ORDER BY u.createdAt DESC'
);
$query->setMaxResults(10);
$query->setFirstResult(20); // 偏移量

// 结果类型
$query->getResult();        // 实体数组
$query->getArrayResult();   // 数组的数组
$query->getScalarResult();  // 扁平数组
$query->getSingleResult();  // 单个实体（如果不是恰好一个则抛出异常）
$query->getOneOrNullResult(); // 单个实体或 null
```

### 查询构建器

```php
<?php

use Doctrine\ORM\QueryBuilder;

// 查询构建器提供流式接口
$qb = $entityManager->createQueryBuilder();

$qb->select('u')
   ->from(User::class, 'u')
   ->where('u.status = :status')
   ->andWhere('u.createdAt > :date')
   ->orderBy('u.name', 'ASC')
   ->setParameter('status', 'active')
   ->setParameter('date', new \DateTime('-30 days'));

$users = $qb->getQuery()->getResult();

// 复杂查询构建
$qb = $entityManager->createQueryBuilder();

$qb->select('u', 'COUNT(o.id) as orderCount')
   ->from(User::class, 'u')
   ->leftJoin('u.orders', 'o')
   ->groupBy('u.id')
   ->having('COUNT(o.id) > :minOrders')
   ->setParameter('minOrders', 5);

// 条件查询构建
$qb = $entityManager->createQueryBuilder()
    ->select('p')
    ->from(Product::class, 'p');

if ($category !== null) {
    $qb->andWhere('p.category = :category')
       ->setParameter('category', $category);
}

if ($minPrice !== null) {
    $qb->andWhere('p.price >= :minPrice')
       ->setParameter('minPrice', $minPrice);
}

if ($maxPrice !== null) {
    $qb->andWhere('p.price <= :maxPrice')
       ->setParameter('maxPrice', $maxPrice);
}

// 表达式构建器用于复杂条件
$qb = $entityManager->createQueryBuilder();
$expr = $qb->expr();

$qb->select('u')
   ->from(User::class, 'u')
   ->where(
       $expr->orX(
           $expr->eq('u.role', ':admin'),
           $expr->andX(
               $expr->eq('u.status', ':active'),
               $expr->gt('u.score', ':minScore')
           )
       )
   )
   ->setParameter('admin', 'ROLE_ADMIN')
   ->setParameter('active', 'active')
   ->setParameter('minScore', 100);
```

## 代码示例

### 仓储模式

```php
<?php

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

#[ORM\Entity(repositoryClass: UserRepository::class)]
class User
{
    // ... 实体定义
}

class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * 查找最近 N 天创建的活跃用户
     *
     * @return User[]
     */
    public function findRecentActiveUsers(int $days = 30): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.status = :status')
            ->andWhere('u.createdAt > :date')
            ->setParameter('status', 'active')
            ->setParameter('date', new \DateTime("-{$days} days"))
            ->orderBy('u.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * 按名称或邮箱搜索用户
     */
    public function search(string $term): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.name LIKE :term OR u.email LIKE :term')
            ->setParameter('term', "%{$term}%")
            ->getQuery()
            ->getResult();
    }

    /**
     * 获取用户及其所有相关数据
     */
    public function findWithRelations(int $id): ?User
    {
        return $this->createQueryBuilder('u')
            ->leftJoin('u.profile', 'p')
            ->addSelect('p')
            ->leftJoin('u.orders', 'o')
            ->addSelect('o')
            ->where('u.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * 分页结果
     */
    public function findPaginated(int $page, int $limit): Paginator
    {
        $query = $this->createQueryBuilder('u')
            ->orderBy('u.id', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery();

        return new Paginator($query);
    }
}
```

### 实体生命周期回调

```php
<?php

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\HasLifecycleCallbacks]
class Article
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string')]
    private string $title;

    #[ORM\Column(type: 'string', unique: true)]
    private string $slug;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->slug = $this->generateSlug($this->title);
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PostLoad]
    public function onPostLoad(): void
    {
        // 从数据库加载实体后调用
    }

    #[ORM\PostPersist]
    public function onPostPersist(): void
    {
        // INSERT 后调用
    }

    #[ORM\PostUpdate]
    public function onPostUpdate(): void
    {
        // UPDATE 后调用
    }

    #[ORM\PreRemove]
    public function onPreRemove(): void
    {
        // DELETE 前调用
    }

    #[ORM\PostRemove]
    public function onPostRemove(): void
    {
        // DELETE 后调用
    }

    private function generateSlug(string $title): string
    {
        return strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($title)));
    }
}
```

### 继承映射

```php
<?php

use Doctrine\ORM\Mapping as ORM;

// 单表继承
#[ORM\Entity]
#[ORM\InheritanceType('SINGLE_TABLE')]
#[ORM\DiscriminatorColumn(name: 'type', type: 'string')]
#[ORM\DiscriminatorMap(['employee' => Employee::class, 'manager' => Manager::class])]
abstract class Person
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    protected ?int $id = null;

    #[ORM\Column(type: 'string')]
    protected string $name;
}

#[ORM\Entity]
class Employee extends Person
{
    #[ORM\Column(type: 'string', nullable: true)]
    private ?string $department = null;
}

#[ORM\Entity]
class Manager extends Person
{
    #[ORM\Column(type: 'integer')]
    private int $teamSize;
}

// 类表继承
#[ORM\Entity]
#[ORM\InheritanceType('JOINED')]
#[ORM\DiscriminatorColumn(name: 'type', type: 'string')]
#[ORM\DiscriminatorMap(['car' => Car::class, 'truck' => Truck::class])]
abstract class Vehicle
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    protected ?int $id = null;

    #[ORM\Column(type: 'string')]
    protected string $brand;
}

#[ORM\Entity]
class Car extends Vehicle
{
    #[ORM\Column(type: 'integer')]
    private int $seats;
}

#[ORM\Entity]
class Truck extends Vehicle
{
    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $loadCapacity;
}
```

## 最佳实践

### 1. 使用事务

```php
<?php

// 手动事务管理
$entityManager->beginTransaction();
try {
    $user = new User('test@example.com', 'Test');
    $entityManager->persist($user);

    $profile = new Profile();
    $profile->setUser($user);
    $entityManager->persist($profile);

    $entityManager->flush();
    $entityManager->commit();
} catch (\Exception $e) {
    $entityManager->rollback();
    throw $e;
}

// 事务辅助方法
$entityManager->wrapInTransaction(function($em) {
    $user = new User('test@example.com', 'Test');
    $em->persist($user);
    // 不需要显式 flush - 自动完成
});
```

### 2. 优化获取

```php
<?php

// 使用 fetch joins 进行预加载
$qb = $entityManager->createQueryBuilder();
$qb->select('u', 'o', 'p')
   ->from(User::class, 'u')
   ->leftJoin('u.orders', 'o')
   ->leftJoin('u.profile', 'p')
   ->where('u.id = :id')
   ->setParameter('id', $userId);

// 大数据集的批量处理
$batchSize = 100;
$i = 0;

$query = $entityManager->createQuery('SELECT u FROM App\Entity\User u');
foreach ($query->toIterable() as $user) {
    // 处理用户
    $user->setProcessedAt(new \DateTime());

    if (($i % $batchSize) === 0) {
        $entityManager->flush();
        $entityManager->clear(); // 分离所有实体
    }
    $i++;
}
$entityManager->flush();
```

### 3. 索引定义

```php
<?php

#[ORM\Entity]
#[ORM\Table(name: 'orders')]
#[ORM\Index(columns: ['status', 'created_at'], name: 'idx_status_created')]
#[ORM\Index(columns: ['user_id'], name: 'idx_user')]
#[ORM\UniqueConstraint(columns: ['order_number'], name: 'uniq_order_number')]
class Order
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 50)]
    private string $status;

    #[ORM\Column(type: 'string', length: 20)]
    private string $orderNumber;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;
}
```

## 常见陷阱

### 1. N+1 查询问题

```php
<?php

// 错误：N+1 查询
$authors = $entityManager->getRepository(Author::class)->findAll();
foreach ($authors as $author) {
    // 每次迭代都触发一个获取书籍的查询！
    foreach ($author->getBooks() as $book) {
        echo $book->getTitle();
    }
}

// 正确：Fetch join
$authors = $entityManager->createQueryBuilder()
    ->select('a', 'b')
    ->from(Author::class, 'a')
    ->leftJoin('a.books', 'b')
    ->getQuery()
    ->getResult();
```

### 2. 分离实体问题

```php
<?php

// 问题：实体变为分离状态
$user = $entityManager->find(User::class, 1);
$entityManager->clear(); // User 现在是分离的

$user->setName('New Name');
$entityManager->flush(); // 变更不会被保存！

// 解决方案：合并或重新获取
$user = $entityManager->merge($user);
$entityManager->flush();

// 或者
$user = $entityManager->find(User::class, 1);
$user->setName('New Name');
$entityManager->flush();
```

### 3. 错误的级联设置

```php
<?php

// 错误：缺少级联
#[ORM\OneToMany(targetEntity: OrderItem::class, mappedBy: 'order')]
private Collection $items;

// 删除订单时，项目变成孤儿！
$entityManager->remove($order);

// 正确：适当的级联和孤儿删除
#[ORM\OneToMany(
    targetEntity: OrderItem::class,
    mappedBy: 'order',
    cascade: ['persist', 'remove'],
    orphanRemoval: true
)]
private Collection $items;
```

## 性能考量

### 二级缓存

```php
<?php

// 在配置中启用
$config = new \Doctrine\ORM\Configuration();
$config->setSecondLevelCacheEnabled(true);

// 实体缓存
#[ORM\Entity]
#[ORM\Cache(usage: 'READ_ONLY')]
class Country
{
    // 很少变化的数据
}

#[ORM\Entity]
#[ORM\Cache(usage: 'NONSTRICT_READ_WRITE')]
class Product
{
    // 更频繁更新的数据
}

// 关系缓存
#[ORM\ManyToMany(targetEntity: Tag::class)]
#[ORM\Cache(usage: 'READ_ONLY')]
private Collection $tags;
```

### 查询结果缓存

```php
<?php

$query = $entityManager->createQuery(
    'SELECT c FROM App\Entity\Country c ORDER BY c.name'
);

// 结果缓存
$query->enableResultCache(3600, 'countries_list');
$countries = $query->getResult();

// 查询缓存（缓存 DQL 解析）
$config->setQueryCache($cacheDriver);
```

## 面试要点

1. **实体状态**：NEW、MANAGED、DETACHED、REMOVED

2. **关系**：
   - 拥有端 vs 反向端
   - 级联选项：persist、remove、merge、detach、refresh
   - orphanRemoval 用于自动子级删除

3. **查询方法**：
   - DQL 用于复杂查询
   - QueryBuilder 用于动态查询
   - 需要时使用原生 SQL

4. **性能**：
   - Fetch joins 避免 N+1
   - 使用 clear() 进行批量处理
   - 二级缓存

5. **工作单元**：追踪变更并计算最小 SQL

## 延伸阅读

- [Doctrine ORM 文档](https://www.doctrine-project.org/projects/orm.html)
- [Doctrine 最佳实践](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/best-practices.html)
- [性能优化](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/improving-performance.html)
