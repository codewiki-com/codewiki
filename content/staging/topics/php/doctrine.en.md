---
title: Doctrine ORM Deep Dive
description: Complete guide to Doctrine ORM in PHP, covering entity mapping, relationships, queries, and advanced features
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - Doctrine
  - ORM
  - Database
  - Entity
  - DQL
status: imported
origin: old/src/content/docs/php/doctrine.en.md
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

Doctrine ORM is the most powerful and flexible object-relational mapper for PHP. It provides transparent persistence for PHP objects and implements the Data Mapper pattern, keeping your domain models clean and decoupled from database concerns.

## Concept Explanation

Doctrine ORM maps PHP objects (entities) to database tables. Unlike Active Record patterns, entities in Doctrine are plain PHP objects (POPOs) with no database awareness - the EntityManager handles all persistence operations.

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

    // Getters and setters...
    public function getId(): ?int { return $this->id; }
    public function getEmail(): string { return $this->email; }
    public function getName(): string { return $this->name; }
}

// Using the EntityManager
$user = new User('john@example.com', 'John Doe');
$entityManager->persist($user);
$entityManager->flush();

// Finding entities
$user = $entityManager->find(User::class, 1);
$user = $entityManager->getRepository(User::class)->findOneBy(['email' => 'john@example.com']);
```

## Core Principles

### Entity Lifecycle

```php
<?php

// Entity states in Doctrine:
// 1. NEW - Entity created but not yet persisted
// 2. MANAGED - Entity is managed by EntityManager
// 3. DETACHED - Entity was managed but is now disconnected
// 4. REMOVED - Entity scheduled for deletion

// NEW state
$user = new User('test@example.com', 'Test');

// Transition to MANAGED
$entityManager->persist($user);

// Save to database
$entityManager->flush();

// Still MANAGED - changes are tracked
$user->setName('Updated Name');
$entityManager->flush(); // Automatically detects and saves changes

// Transition to DETACHED
$entityManager->detach($user);
// or
$entityManager->clear(); // Detaches all entities

// Re-attach a detached entity
$managedUser = $entityManager->merge($user);

// Transition to REMOVED
$entityManager->remove($user);
$entityManager->flush(); // Executes DELETE

// Refresh from database
$entityManager->refresh($user); // Reloads from DB, discarding changes
```

### Column Types and Mapping

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

    // String types
    #[ORM\Column(type: Types::STRING, length: 255, unique: true)]
    private string $sku;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    // Numeric types
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private string $price;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $quantity = 0;

    #[ORM\Column(type: Types::FLOAT)]
    private float $weight;

    // Boolean
    #[ORM\Column(type: Types::BOOLEAN)]
    private bool $isActive = true;

    // Date/Time types
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private \DateTime $updatedAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTime $releaseDate = null;

    // JSON and Array types
    #[ORM\Column(type: Types::JSON)]
    private array $metadata = [];

    #[ORM\Column(type: Types::SIMPLE_ARRAY, nullable: true)]
    private ?array $tags = null;

    // Enum type (PHP 8.1+)
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

## Key Concepts

### Entity Relationships

```php
<?php

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

// One-to-Many / Many-to-One
#[ORM\Entity]
class Author
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string')]
    private string $name;

    // One author has many books (inverse side)
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

    // Many books belong to one author (owning side)
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

// Many-to-Many
#[ORM\Entity]
class Student
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string')]
    private string $name;

    // Owning side of Many-to-Many
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

    // Inverse side of Many-to-Many
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

// One-to-One
#[ORM\Entity]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    // Owning side
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

    // Inverse side (optional)
    #[ORM\OneToOne(targetEntity: User::class, mappedBy: 'profile')]
    private ?User $user = null;
}
```

### DQL (Doctrine Query Language)

```php
<?php

// DQL - Object-oriented query language

// Simple queries
$query = $entityManager->createQuery(
    'SELECT u FROM App\Entity\User u WHERE u.status = :status'
);
$query->setParameter('status', 'active');
$users = $query->getResult();

// Partial objects (select specific fields)
$query = $entityManager->createQuery(
    'SELECT PARTIAL u.{id, email, name} FROM App\Entity\User u'
);

// Joins
$query = $entityManager->createQuery(
    'SELECT u, p FROM App\Entity\User u
     JOIN u.profile p
     WHERE p.country = :country'
);
$query->setParameter('country', 'US');

// Left joins
$query = $entityManager->createQuery(
    'SELECT a, b FROM App\Entity\Author a
     LEFT JOIN a.books b
     WHERE a.name LIKE :name'
);
$query->setParameter('name', '%Smith%');

// Aggregate functions
$query = $entityManager->createQuery(
    'SELECT COUNT(u.id) as userCount, u.status
     FROM App\Entity\User u
     GROUP BY u.status'
);

// Subqueries
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
$query->setFirstResult(20); // Offset

// Result types
$query->getResult();        // Array of entities
$query->getArrayResult();   // Array of arrays
$query->getScalarResult();  // Flat array
$query->getSingleResult();  // Single entity (throws if not exactly one)
$query->getOneOrNullResult(); // Single entity or null
```

### Query Builder

```php
<?php

use Doctrine\ORM\QueryBuilder;

// Query Builder provides fluent interface
$qb = $entityManager->createQueryBuilder();

$qb->select('u')
   ->from(User::class, 'u')
   ->where('u.status = :status')
   ->andWhere('u.createdAt > :date')
   ->orderBy('u.name', 'ASC')
   ->setParameter('status', 'active')
   ->setParameter('date', new \DateTime('-30 days'));

$users = $qb->getQuery()->getResult();

// Complex query building
$qb = $entityManager->createQueryBuilder();

$qb->select('u', 'COUNT(o.id) as orderCount')
   ->from(User::class, 'u')
   ->leftJoin('u.orders', 'o')
   ->groupBy('u.id')
   ->having('COUNT(o.id) > :minOrders')
   ->setParameter('minOrders', 5);

// Conditional query building
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

// Expression builder for complex conditions
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

## Code Examples

### Repository Pattern

```php
<?php

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

#[ORM\Entity(repositoryClass: UserRepository::class)]
class User
{
    // ... entity definition
}

class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * Find active users created in the last N days
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
     * Search users by name or email
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
     * Get user with all related data
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
     * Paginated results
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

### Entity Lifecycle Callbacks

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
        // Called after entity is loaded from database
    }

    #[ORM\PostPersist]
    public function onPostPersist(): void
    {
        // Called after INSERT
    }

    #[ORM\PostUpdate]
    public function onPostUpdate(): void
    {
        // Called after UPDATE
    }

    #[ORM\PreRemove]
    public function onPreRemove(): void
    {
        // Called before DELETE
    }

    #[ORM\PostRemove]
    public function onPostRemove(): void
    {
        // Called after DELETE
    }

    private function generateSlug(string $title): string
    {
        return strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($title)));
    }
}
```

### Inheritance Mapping

```php
<?php

use Doctrine\ORM\Mapping as ORM;

// Single Table Inheritance
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

// Class Table Inheritance
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

## Best Practices

### 1. Use Transactions

```php
<?php

// Manual transaction management
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

// Transactional helper
$entityManager->wrapInTransaction(function($em) {
    $user = new User('test@example.com', 'Test');
    $em->persist($user);
    // No need for explicit flush - done automatically
});
```

### 2. Optimize Fetching

```php
<?php

// Eager loading with fetch joins
$qb = $entityManager->createQueryBuilder();
$qb->select('u', 'o', 'p')
   ->from(User::class, 'u')
   ->leftJoin('u.orders', 'o')
   ->leftJoin('u.profile', 'p')
   ->where('u.id = :id')
   ->setParameter('id', $userId);

// Batch processing for large datasets
$batchSize = 100;
$i = 0;

$query = $entityManager->createQuery('SELECT u FROM App\Entity\User u');
foreach ($query->toIterable() as $user) {
    // Process user
    $user->setProcessedAt(new \DateTime());

    if (($i % $batchSize) === 0) {
        $entityManager->flush();
        $entityManager->clear(); // Detach all entities
    }
    $i++;
}
$entityManager->flush();
```

### 3. Index Definition

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

## Common Pitfalls

### 1. N+1 Query Problem

```php
<?php

// BAD: N+1 queries
$authors = $entityManager->getRepository(Author::class)->findAll();
foreach ($authors as $author) {
    // Each iteration triggers a query for books!
    foreach ($author->getBooks() as $book) {
        echo $book->getTitle();
    }
}

// GOOD: Fetch join
$authors = $entityManager->createQueryBuilder()
    ->select('a', 'b')
    ->from(Author::class, 'a')
    ->leftJoin('a.books', 'b')
    ->getQuery()
    ->getResult();
```

### 2. Detached Entity Issues

```php
<?php

// Problem: Entity becomes detached
$user = $entityManager->find(User::class, 1);
$entityManager->clear(); // User is now detached

$user->setName('New Name');
$entityManager->flush(); // Changes NOT saved!

// Solution: Merge or re-fetch
$user = $entityManager->merge($user);
$entityManager->flush();

// Or
$user = $entityManager->find(User::class, 1);
$user->setName('New Name');
$entityManager->flush();
```

### 3. Incorrect Cascade Settings

```php
<?php

// BAD: Missing cascade
#[ORM\OneToMany(targetEntity: OrderItem::class, mappedBy: 'order')]
private Collection $items;

// When removing order, items are orphaned!
$entityManager->remove($order);

// GOOD: Proper cascade and orphan removal
#[ORM\OneToMany(
    targetEntity: OrderItem::class,
    mappedBy: 'order',
    cascade: ['persist', 'remove'],
    orphanRemoval: true
)]
private Collection $items;
```

## Performance Considerations

### Second Level Cache

```php
<?php

// Enable in configuration
$config = new \Doctrine\ORM\Configuration();
$config->setSecondLevelCacheEnabled(true);

// Entity caching
#[ORM\Entity]
#[ORM\Cache(usage: 'READ_ONLY')]
class Country
{
    // Rarely changing data
}

#[ORM\Entity]
#[ORM\Cache(usage: 'NONSTRICT_READ_WRITE')]
class Product
{
    // More frequently updated
}

// Relationship caching
#[ORM\ManyToMany(targetEntity: Tag::class)]
#[ORM\Cache(usage: 'READ_ONLY')]
private Collection $tags;
```

### Query Result Caching

```php
<?php

$query = $entityManager->createQuery(
    'SELECT c FROM App\Entity\Country c ORDER BY c.name'
);

// Result cache
$query->enableResultCache(3600, 'countries_list');
$countries = $query->getResult();

// Query cache (caches DQL parsing)
$config->setQueryCache($cacheDriver);
```

## Interview Key Points

1. **Entity states**: NEW, MANAGED, DETACHED, REMOVED

2. **Relationships**:
   - Owning side vs Inverse side
   - Cascade options: persist, remove, merge, detach, refresh
   - orphanRemoval for automatic child deletion

3. **Query methods**:
   - DQL for complex queries
   - QueryBuilder for dynamic queries
   - Native SQL when needed

4. **Performance**:
   - Fetch joins to avoid N+1
   - Batch processing with clear()
   - Second level cache

5. **Unit of Work**: Tracks changes and computes minimal SQL

## Further Reading

- [Doctrine ORM Documentation](https://www.doctrine-project.org/projects/orm.html)
- [Doctrine Best Practices](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/best-practices.html)
- [Performance Optimization](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/improving-performance.html)
