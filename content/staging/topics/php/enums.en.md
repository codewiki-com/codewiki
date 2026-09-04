---
title: PHP 8.1 Enums Complete Guide
description: Deep dive into PHP 8.1 enum types, including pure enums, backed enums, enum methods, Trait usage, and UnitEnum interface
track: php
section: basics
difficulty: intermediate
tags:
  - PHP
  - PHP 8.1
  - Enums
  - Enum
  - Type System
status: imported
origin: old/src/content/docs/php/enums.en.md
divergence: 0.225
issues: []
legacy:
  category: PHP
  subcategory: Language Features
  order: 5
  lastUpdated: 2026-01-07
---

Enums are an important new feature introduced in PHP 8.1, providing a type-safe way to define a fixed set of constant values. Enumerations have existed in many programming languages for years, and PHP finally introduced this long-awaited feature in version 8.1. We'll cover all aspects of PHP enums, from fundamental concepts to advanced applications, to help you master this powerful feature comprehensively.

## Conceptual Explanation

### What Are Enums

An enumeration is a special data type used to define a named set of constants. Compared to using class constants or magic strings, enums provide stronger type safety and better code readability.

Before PHP 8.1, developers typically simulated enums using the following approach:

```php
<?php
// Simulating enums using class constants (PHP 8.0 and earlier)
class OrderStatus
{
    public const PENDING = 'pending';
    public const PROCESSING = 'processing';
    public const SHIPPED = 'shipped';
    public const DELIVERED = 'delivered';
    public const CANCELLED = 'cancelled';
}

// Manual validation required when using
function processOrder(string $status): void
{
    // Cannot guarantee $status is a valid value at the type level
    if (!in_array($status, [
        OrderStatus::PENDING,
        OrderStatus::PROCESSING,
        OrderStatus::SHIPPED,
        OrderStatus::DELIVERED,
        OrderStatus::CANCELLED
    ])) {
        throw new InvalidArgumentException("Invalid order status");
    }
    // Process order...
}

// Invalid values can be passed at call time
processOrder('invalid_status'); // Error discovered at runtime
processOrder(OrderStatus::PENDING); // Correct
```

PHP 8.1's native enums solve these problems:

```php
<?php
// PHP 8.1+ native enums
enum OrderStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
}

// Type-safe: only accepts OrderStatus enum values
function processOrder(OrderStatus $status): void
{
    // $status is guaranteed to be a valid enum value
    match ($status) {
        OrderStatus::Pending => handlePending(),
        OrderStatus::Processing => handleProcessing(),
        OrderStatus::Shipped => handleShipped(),
        OrderStatus::Delivered => handleDelivered(),
        OrderStatus::Cancelled => handleCancelled(),
    };
}

// Errors caught at compile time
// processOrder('invalid_status'); // TypeError
processOrder(OrderStatus::Pending); // Correct
```

### Problems Enums Solve

1. **Type Safety**: Enum values are a distinct type that cannot be confused with other types
2. **Auto-completion**: IDEs can provide auto-completion for enum values
3. **Exhaustiveness Checking**: Combined with `match` expressions, ensures all possible values are handled
4. **Readability**: Code intent is clearer, reduces magic string usage
5. **Maintainability**: Type checking helps discover all places needing updates when modifying enum values

### Two Types of Enums

PHP supports two types of enums:

1. **Pure Enum**: Enums without associated values, each case is an independent value
2. **Backed Enum**: Each case is associated with a scalar value (string or int)

```php
<?php
// Pure Enum: suitable for scenarios requiring only state distinction
enum Suit
{
    case Hearts;
    case Diamonds;
    case Clubs;
    case Spades;
}

// Backed Enum: suitable for scenarios requiring interaction with external systems (database storage, API returns)
enum Status: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}

enum HttpCode: int
{
    case Ok = 200;
    case Created = 201;
    case BadRequest = 400;
    case NotFound = 404;
    case ServerError = 500;
}
```

## Core Principles

### Enum Implementation

PHP enums are implemented as special classes internally. Each enum type implements the `UnitEnum` interface, while backed enums also implement the `BackedEnum` interface.

```php
<?php
// Enum interfaces defined internally by PHP
interface UnitEnum
{
    /**
     * Returns all cases of the enum
     * @return static[]
     */
    public static function cases(): array;
}

interface BackedEnum extends UnitEnum
{
    /**
     * Create enum instance from value, throws exception if value doesn't exist
     */
    public static function from(int|string $value): static;

    /**
     * Create enum instance from value, returns null if value doesn't exist
     */
    public static function tryFrom(int|string $value): ?static;
}
```

### Singleton Nature of Enum Instances

Each enum case is a singleton, meaning only one instance of each case exists during the entire program execution:

```php
<?php
enum Color
{
    case Red;
    case Green;
    case Blue;
}

$red1 = Color::Red;
$red2 = Color::Red;

// Strict equality, pointing to the same instance
var_dump($red1 === $red2); // true

// Can use === for comparison
if ($red1 === Color::Red) {
    echo "Color is red\n";
}
```

### Differences Between Enums and Classes

Although enums resemble classes, they have these important differences:

```php
<?php
enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';

    // 1. Enums cannot have constructors (backed enum values are specified at definition)
    // public function __construct() {} // Error

    // 2. Enums cannot have properties (except readonly properties)
    // public string $description; // Error

    // 3. Enums can have methods
    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Inactive => 'Inactive',
        };
    }

    // 4. Enums can have static methods
    public static function default(): self
    {
        return self::Active;
    }

    // 5. Enums can have constants
    public const DEFAULT_STATUS = self::Active;

    // 6. Enums can implement interfaces
    // 7. Enums can use Traits
}

// Enums cannot be instantiated
// $status = new Status(); // Error

// Enums cannot be inherited
// class ExtendedStatus extends Status {} // Error
```

## Core Concepts

### Pure Enums

Pure enums are the simplest form of enumerations, where each case is an independent value:

```php
<?php
// Define a pure enum
enum CardSuit
{
    case Hearts;   // Hearts
    case Diamonds; // Diamonds
    case Clubs;    // Clubs
    case Spades;   // Spades
}

// Use pure enum
function getCardSymbol(CardSuit $suit): string
{
    return match ($suit) {
        CardSuit::Hearts => '♥',
        CardSuit::Diamonds => '♦',
        CardSuit::Clubs => '♣',
        CardSuit::Spades => '♠',
    };
}

echo getCardSymbol(CardSuit::Hearts); // ♥

// Get all cases
$suits = CardSuit::cases();
foreach ($suits as $suit) {
    echo $suit->name . ': ' . getCardSymbol($suit) . "\n";
}
// Output:
// Hearts: ♥
// Diamonds: ♦
// Clubs: ♣
// Spades: ♠

// The name property of enum
$suit = CardSuit::Hearts;
echo $suit->name; // "Hearts"
```

### Backed Enums

Backed enums associate each case with a scalar value, suitable for scenarios requiring interaction with databases, APIs, and other external systems:

```php
<?php
// String type backed enum
enum UserRole: string
{
    case Admin = 'admin';
    case Editor = 'editor';
    case Author = 'author';
    case Subscriber = 'subscriber';
}

// Integer type backed enum
enum Priority: int
{
    case Low = 1;
    case Medium = 2;
    case High = 3;
    case Critical = 4;
}

// Get associated value using value property
$role = UserRole::Admin;
echo $role->name;  // "Admin"
echo $role->value; // "admin"

$priority = Priority::High;
echo $priority->name;  // "High"
echo $priority->value; // 3
```

### from() and tryFrom() Methods

Backed enums provide two static methods for creating enum instances from values:

```php
<?php
enum HttpStatus: int
{
    case Ok = 200;
    case Created = 201;
    case Accepted = 202;
    case BadRequest = 400;
    case Unauthorized = 401;
    case Forbidden = 403;
    case NotFound = 404;
    case MethodNotAllowed = 405;
    case InternalServerError = 500;
    case ServiceUnavailable = 503;
}

// from() - throws ValueError if value doesn't exist
try {
    $status = HttpStatus::from(200);
    echo $status->name; // "Ok"

    $invalid = HttpStatus::from(999); // Throws ValueError
} catch (ValueError $e) {
    echo "Invalid status code: " . $e->getMessage();
}

// tryFrom() - returns null if value doesn't exist (recommended for user input)
$status = HttpStatus::tryFrom(404);
if ($status !== null) {
    echo $status->name; // "NotFound"
}

$invalid = HttpStatus::tryFrom(999);
var_dump($invalid); // null

// Practical application: handling API responses
function handleResponse(int $code): string
{
    $status = HttpStatus::tryFrom($code);

    return match ($status) {
        HttpStatus::Ok, HttpStatus::Created, HttpStatus::Accepted
            => 'Request successful',
        HttpStatus::BadRequest, HttpStatus::MethodNotAllowed
            => 'Request error, please check parameters',
        HttpStatus::Unauthorized, HttpStatus::Forbidden
            => 'Insufficient permissions',
        HttpStatus::NotFound
            => 'Resource not found',
        HttpStatus::InternalServerError, HttpStatus::ServiceUnavailable
            => 'Server error, please try again later',
        null
            => 'Unknown status code: ' . $code,
    };
}
```

### cases() Method

All enums implement the `UnitEnum` interface, providing the `cases()` static method that returns all cases:

```php
<?php
enum Weekday: int
{
    case Monday = 1;
    case Tuesday = 2;
    case Wednesday = 3;
    case Thursday = 4;
    case Friday = 5;
    case Saturday = 6;
    case Sunday = 7;
}

// Get all enum values
$days = Weekday::cases();

// Build dropdown options
function buildOptions(array $cases): string
{
    $options = [];
    foreach ($cases as $case) {
        $options[] = sprintf(
            '<option value="%s">%s</option>',
            $case->value,
            $case->name
        );
    }
    return implode("\n", $options);
}

echo buildOptions(Weekday::cases());

// Build mapping array
$dayNames = [];
foreach (Weekday::cases() as $day) {
    $dayNames[$day->value] = $day->name;
}
// [1 => 'Monday', 2 => 'Tuesday', ...]
```

### Enum Methods

Enums can define instance and static methods, allowing them to encapsulate behavior related to their values:

```php
<?php
enum PaymentStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Completed = 'completed';
    case Failed = 'failed';
    case Refunded = 'refunded';
    case Cancelled = 'cancelled';

    // Instance method: get localized label
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Processing => 'Processing',
            self::Completed => 'Completed',
            self::Failed => 'Failed',
            self::Refunded => 'Refunded',
            self::Cancelled => 'Cancelled',
        };
    }

    // Instance method: get status color
    public function color(): string
    {
        return match ($this) {
            self::Pending => 'yellow',
            self::Processing => 'blue',
            self::Completed => 'green',
            self::Failed => 'red',
            self::Refunded => 'purple',
            self::Cancelled => 'gray',
        };
    }

    // Instance method: check if final status
    public function isFinal(): bool
    {
        return match ($this) {
            self::Completed, self::Failed, self::Refunded, self::Cancelled => true,
            default => false,
        };
    }

    // Instance method: get allowed next status transitions
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Processing, self::Cancelled],
            self::Processing => [self::Completed, self::Failed],
            self::Completed => [self::Refunded],
            self::Failed => [self::Pending], // Allow retry
            self::Refunded, self::Cancelled => [], // Final states
        };
    }

    // Instance method: check if can transition to specified status
    public function canTransitionTo(self $newStatus): bool
    {
        return in_array($newStatus, $this->allowedTransitions(), true);
    }

    // Static method: get default status
    public static function default(): self
    {
        return self::Pending;
    }

    // Static method: get all active statuses
    public static function activeStatuses(): array
    {
        return [self::Pending, self::Processing];
    }

    // Static method: create from database value (with default)
    public static function fromDatabase(?string $value): self
    {
        if ($value === null) {
            return self::default();
        }
        return self::tryFrom($value) ?? self::default();
    }
}

// Use enum methods
$status = PaymentStatus::Processing;

echo $status->label();    // Processing
echo $status->color();    // blue
echo $status->isFinal();  // false

// Check status transitions
if ($status->canTransitionTo(PaymentStatus::Completed)) {
    echo "Can transition to completed status\n";
}

// Get allowed next statuses
foreach ($status->allowedTransitions() as $nextStatus) {
    echo "Can transition to: {$nextStatus->label()}\n";
}

// Use static methods
$defaultStatus = PaymentStatus::default();
$activeStatuses = PaymentStatus::activeStatuses();
```

### Enums and Traits

Enums can use Traits to reuse code, but Traits cannot contain properties:

```php
<?php
// Define a Trait for use by enums
trait EnumHelper
{
    // Get all names as a list
    public static function names(): array
    {
        return array_column(self::cases(), 'name');
    }

    // Get all values as a list (only for backed enums)
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    // Get a random enum value
    public static function random(): self
    {
        $cases = self::cases();
        return $cases[array_rand($cases)];
    }

    // Check if a value is valid
    public static function isValid(int|string $value): bool
    {
        return self::tryFrom($value) !== null;
    }

    // Convert to select options array
    public static function toSelectOptions(): array
    {
        $options = [];
        foreach (self::cases() as $case) {
            $options[] = [
                'value' => $case->value,
                'label' => method_exists($case, 'label') ? $case->label() : $case->name,
            ];
        }
        return $options;
    }
}

// Another Trait: provides JSON serialization support
trait JsonSerializableEnum
{
    public function jsonSerialize(): mixed
    {
        return [
            'name' => $this->name,
            'value' => $this->value ?? null,
            'label' => method_exists($this, 'label') ? $this->label() : $this->name,
        ];
    }
}

// Enum using Traits
enum ArticleStatus: string implements \JsonSerializable
{
    use EnumHelper;
    use JsonSerializableEnum;

    case Draft = 'draft';
    case Review = 'review';
    case Published = 'published';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Review => 'Under Review',
            self::Published => 'Published',
            self::Archived => 'Archived',
        };
    }
}

// Use methods provided by Trait
print_r(ArticleStatus::names());   // ['Draft', 'Review', 'Published', 'Archived']
print_r(ArticleStatus::values());  // ['draft', 'review', 'published', 'archived']

$randomStatus = ArticleStatus::random();
echo "Random status: {$randomStatus->label()}\n";

if (ArticleStatus::isValid('draft')) {
    echo "draft is a valid value\n";
}

// Get options list
$options = ArticleStatus::toSelectOptions();
print_r($options);
// [
//     ['value' => 'draft', 'label' => 'Draft'],
//     ['value' => 'review', 'label' => 'Under Review'],
//     ['value' => 'published', 'label' => 'Published'],
//     ['value' => 'archived', 'label' => 'Archived'],
// ]

// JSON serialization
echo json_encode(ArticleStatus::Published);
// {"name":"Published","value":"published","label":"Published"}
```

### UnitEnum and BackedEnum Interfaces

Understanding these two interfaces is crucial for writing generic enum handling code:

```php
<?php
// UnitEnum interface - all enums implement this
interface UnitEnum
{
    public static function cases(): array;
}

// BackedEnum interface - only backed enums implement this
interface BackedEnum extends UnitEnum
{
    public static function from(int|string $value): static;
    public static function tryFrom(int|string $value): ?static;
}

// Write functions that accept any enum
function printEnumInfo(UnitEnum $enum): void
{
    echo "Enum name: {$enum->name}\n";

    // Check if it's a backed enum
    if ($enum instanceof BackedEnum) {
        echo "Enum value: {$enum->value}\n";
    }
}

// Write functions that accept any enum class
function printAllCases(string $enumClass): void
{
    // Validate if it's an enum class
    if (!enum_exists($enumClass)) {
        throw new InvalidArgumentException("{$enumClass} is not an enum class");
    }

    echo "Enum class: {$enumClass}\n";
    echo "All cases:\n";

    foreach ($enumClass::cases() as $case) {
        $info = "  - {$case->name}";
        if ($case instanceof BackedEnum) {
            $info .= " = {$case->value}";
        }
        echo $info . "\n";
    }
}

// Usage examples
enum Color
{
    case Red;
    case Green;
    case Blue;
}

enum Size: string
{
    case Small = 'S';
    case Medium = 'M';
    case Large = 'L';
}

printEnumInfo(Color::Red);
// Enum name: Red

printEnumInfo(Size::Medium);
// Enum name: Medium
// Enum value: M

printAllCases(Size::class);
// Enum class: Size
// All cases:
//   - Small = S
//   - Medium = M
//   - Large = L

// Check if enum exists
var_dump(enum_exists(Color::class));    // true
var_dump(enum_exists('NonExistent'));   // false
```

### Enums Implementing Interfaces

Enums can implement interfaces, providing greater flexibility:

```php
<?php
// Define interfaces
interface Labelable
{
    public function label(): string;
}

interface Colorable
{
    public function color(): string;
}

interface Describable
{
    public function description(): string;
}

// Enum implementing multiple interfaces
enum TaskPriority: int implements Labelable, Colorable, Describable
{
    case Low = 1;
    case Medium = 2;
    case High = 3;
    case Urgent = 4;

    public function label(): string
    {
        return match ($this) {
            self::Low => 'Low',
            self::Medium => 'Medium',
            self::High => 'High',
            self::Urgent => 'Urgent',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Low => '#808080',      // Gray
            self::Medium => '#0066cc',   // Blue
            self::High => '#ff9900',     // Orange
            self::Urgent => '#cc0000',   // Red
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Low => 'Tasks that can be handled later',
            self::Medium => 'Normal priority tasks',
            self::High => 'Tasks that need to be handled soon',
            self::Urgent => 'Urgent tasks requiring immediate attention',
        };
    }
}

// Use interface type hints
function displayPriority(Labelable&Colorable $item): void
{
    echo "<span style=\"color: {$item->color()}\">{$item->label()}</span>\n";
}

displayPriority(TaskPriority::Urgent);

// Use with other classes implementing the same interfaces
class CustomLabel implements Labelable, Colorable
{
    public function __construct(
        private string $label,
        private string $color
    ) {}

    public function label(): string
    {
        return $this->label;
    }

    public function color(): string
    {
        return $this->color;
    }
}

displayPriority(new CustomLabel('Custom', '#00ff00'));
```

## Code Examples

### Practical Application: Order State Machine

```php
<?php
enum OrderStatus: string
{
    case Created = 'created';
    case Paid = 'paid';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';

    /**
     * Get localized label
     */
    public function label(): string
    {
        return match ($this) {
            self::Created => 'Created',
            self::Paid => 'Paid',
            self::Processing => 'Processing',
            self::Shipped => 'Shipped',
            self::Delivered => 'Delivered',
            self::Cancelled => 'Cancelled',
            self::Refunded => 'Refunded',
        };
    }

    /**
     * Get status icon
     */
    public function icon(): string
    {
        return match ($this) {
            self::Created => 'clock',
            self::Paid => 'credit-card',
            self::Processing => 'cog',
            self::Shipped => 'truck',
            self::Delivered => 'check-circle',
            self::Cancelled => 'x-circle',
            self::Refunded => 'arrow-left',
        };
    }

    /**
     * Get status color (for UI)
     */
    public function colorClass(): string
    {
        return match ($this) {
            self::Created => 'bg-gray-100 text-gray-800',
            self::Paid => 'bg-blue-100 text-blue-800',
            self::Processing => 'bg-yellow-100 text-yellow-800',
            self::Shipped => 'bg-purple-100 text-purple-800',
            self::Delivered => 'bg-green-100 text-green-800',
            self::Cancelled => 'bg-red-100 text-red-800',
            self::Refunded => 'bg-orange-100 text-orange-800',
        };
    }

    /**
     * Is this a final status
     */
    public function isFinal(): bool
    {
        return in_array($this, [self::Delivered, self::Cancelled, self::Refunded], true);
    }

    /**
     * Can this order be cancelled
     */
    public function canCancel(): bool
    {
        return in_array($this, [self::Created, self::Paid], true);
    }

    /**
     * Can this order be refunded
     */
    public function canRefund(): bool
    {
        return in_array($this, [self::Paid, self::Delivered], true);
    }

    /**
     * Get allowed status transitions
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Created => [self::Paid, self::Cancelled],
            self::Paid => [self::Processing, self::Cancelled, self::Refunded],
            self::Processing => [self::Shipped],
            self::Shipped => [self::Delivered],
            self::Delivered => [self::Refunded],
            self::Cancelled, self::Refunded => [],
        };
    }

    /**
     * Validate if status transition is valid
     */
    public function canTransitionTo(self $newStatus): bool
    {
        return in_array($newStatus, $this->allowedTransitions(), true);
    }

    /**
     * Execute status transition
     */
    public function transitionTo(self $newStatus): self
    {
        if (!$this->canTransitionTo($newStatus)) {
            throw new InvalidArgumentException(
                "Cannot transition from {$this->label()} to {$newStatus->label()}"
            );
        }
        return $newStatus;
    }

    /**
     * Get progress percentage
     */
    public function progressPercentage(): int
    {
        return match ($this) {
            self::Created => 0,
            self::Paid => 20,
            self::Processing => 40,
            self::Shipped => 70,
            self::Delivered => 100,
            self::Cancelled, self::Refunded => 0,
        };
    }
}

// Order class
class Order
{
    public function __construct(
        public readonly string $id,
        private OrderStatus $status = OrderStatus::Created,
        private array $statusHistory = []
    ) {
        $this->recordStatusChange($status);
    }

    public function getStatus(): OrderStatus
    {
        return $this->status;
    }

    public function changeStatus(OrderStatus $newStatus): void
    {
        $this->status = $this->status->transitionTo($newStatus);
        $this->recordStatusChange($newStatus);
    }

    private function recordStatusChange(OrderStatus $status): void
    {
        $this->statusHistory[] = [
            'status' => $status,
            'timestamp' => new DateTimeImmutable(),
        ];
    }

    public function getStatusHistory(): array
    {
        return $this->statusHistory;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'statusLabel' => $this->status->label(),
            'statusColor' => $this->status->colorClass(),
            'progress' => $this->status->progressPercentage(),
            'canCancel' => $this->status->canCancel(),
            'canRefund' => $this->status->canRefund(),
            'isFinal' => $this->status->isFinal(),
        ];
    }
}

// Usage example
$order = new Order('ORD-001');
echo "Initial status: {$order->getStatus()->label()}\n";

try {
    $order->changeStatus(OrderStatus::Paid);
    echo "After payment: {$order->getStatus()->label()}\n";

    $order->changeStatus(OrderStatus::Processing);
    echo "After processing: {$order->getStatus()->label()}\n";

    $order->changeStatus(OrderStatus::Shipped);
    echo "After shipping: {$order->getStatus()->label()}\n";

    // Attempt invalid transition
    // $order->changeStatus(OrderStatus::Paid); // Would throw exception
} catch (InvalidArgumentException $e) {
    echo "Error: {$e->getMessage()}\n";
}

print_r($order->toArray());
```

### Practical Application: Permission System

```php
<?php
// Permission enum
enum Permission: string
{
    // User permissions
    case UserView = 'user:view';
    case UserCreate = 'user:create';
    case UserEdit = 'user:edit';
    case UserDelete = 'user:delete';

    // Article permissions
    case ArticleView = 'article:view';
    case ArticleCreate = 'article:create';
    case ArticleEdit = 'article:edit';
    case ArticleDelete = 'article:delete';
    case ArticlePublish = 'article:publish';

    // System permissions
    case SystemSettings = 'system:settings';
    case SystemLogs = 'system:logs';
    case SystemBackup = 'system:backup';

    /**
     * Get permission description
     */
    public function description(): string
    {
        return match ($this) {
            self::UserView => 'View users',
            self::UserCreate => 'Create users',
            self::UserEdit => 'Edit users',
            self::UserDelete => 'Delete users',
            self::ArticleView => 'View articles',
            self::ArticleCreate => 'Create articles',
            self::ArticleEdit => 'Edit articles',
            self::ArticleDelete => 'Delete articles',
            self::ArticlePublish => 'Publish articles',
            self::SystemSettings => 'System settings',
            self::SystemLogs => 'System logs',
            self::SystemBackup => 'System backup',
        };
    }

    /**
     * Get permission group
     */
    public function group(): string
    {
        return match (true) {
            str_starts_with($this->value, 'user:') => 'User Management',
            str_starts_with($this->value, 'article:') => 'Article Management',
            str_starts_with($this->value, 'system:') => 'System Management',
            default => 'Other',
        };
    }

    /**
     * Get permissions by group
     */
    public static function byGroup(): array
    {
        $groups = [];
        foreach (self::cases() as $permission) {
            $group = $permission->group();
            $groups[$group][] = $permission;
        }
        return $groups;
    }
}

// Role enum
enum Role: string
{
    case Admin = 'admin';
    case Editor = 'editor';
    case Author = 'author';
    case Viewer = 'viewer';

    /**
     * Get role label
     */
    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::Editor => 'Editor',
            self::Author => 'Author',
            self::Viewer => 'Viewer',
        };
    }

    /**
     * Get role permissions
     */
    public function permissions(): array
    {
        return match ($this) {
            self::Admin => Permission::cases(), // Admin has all permissions
            self::Editor => [
                Permission::UserView,
                Permission::ArticleView,
                Permission::ArticleCreate,
                Permission::ArticleEdit,
                Permission::ArticleDelete,
                Permission::ArticlePublish,
            ],
            self::Author => [
                Permission::UserView,
                Permission::ArticleView,
                Permission::ArticleCreate,
                Permission::ArticleEdit,
            ],
            self::Viewer => [
                Permission::UserView,
                Permission::ArticleView,
            ],
        };
    }

    /**
     * Check if role has specified permission
     */
    public function hasPermission(Permission $permission): bool
    {
        return in_array($permission, $this->permissions(), true);
    }

    /**
     * Get role priority (for permission inheritance)
     */
    public function priority(): int
    {
        return match ($this) {
            self::Admin => 100,
            self::Editor => 50,
            self::Author => 25,
            self::Viewer => 10,
        };
    }
}

// User class
class User
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        private Role $role,
        private array $additionalPermissions = []
    ) {}

    public function getRole(): Role
    {
        return $this->role;
    }

    /**
     * Check if user has permission
     */
    public function can(Permission $permission): bool
    {
        // First check role permissions
        if ($this->role->hasPermission($permission)) {
            return true;
        }

        // Then check additional permissions
        return in_array($permission, $this->additionalPermissions, true);
    }

    /**
     * Grant additional permission
     */
    public function grantPermission(Permission $permission): void
    {
        if (!in_array($permission, $this->additionalPermissions, true)) {
            $this->additionalPermissions[] = $permission;
        }
    }

    /**
     * Get all permissions
     */
    public function allPermissions(): array
    {
        return array_unique(
            array_merge($this->role->permissions(), $this->additionalPermissions)
        );
    }
}

// Usage example
$admin = new User(1, 'Administrator', Role::Admin);
$editor = new User(2, 'Editor', Role::Editor);
$author = new User(3, 'Author', Role::Author);

// Check permissions
echo $admin->can(Permission::SystemSettings) ? "Yes\n" : "No\n";  // Yes
echo $editor->can(Permission::SystemSettings) ? "Yes\n" : "No\n"; // No
echo $author->can(Permission::ArticleEdit) ? "Yes\n" : "No\n";    // Yes

// Grant additional permissions
$author->grantPermission(Permission::ArticlePublish);
echo $author->can(Permission::ArticlePublish) ? "Yes\n" : "No\n"; // Yes

// Display permissions by group
foreach (Permission::byGroup() as $group => $permissions) {
    echo "\n{$group}:\n";
    foreach ($permissions as $permission) {
        echo "  - {$permission->description()} ({$permission->value})\n";
    }
}
```

### Practical Application: Form Validation

```php
<?php
// Validation rule enum
enum ValidationRule: string
{
    case Required = 'required';
    case Email = 'email';
    case Url = 'url';
    case MinLength = 'min_length';
    case MaxLength = 'max_length';
    case Min = 'min';
    case Max = 'max';
    case Numeric = 'numeric';
    case Alpha = 'alpha';
    case AlphaNumeric = 'alpha_numeric';
    case Regex = 'regex';
    case In = 'in';
    case NotIn = 'not_in';
    case Confirmed = 'confirmed';
    case Date = 'date';
    case DateFormat = 'date_format';
    case Before = 'before';
    case After = 'after';

    /**
     * Get error message template
     */
    public function errorMessage(string $field, mixed $param = null): string
    {
        return match ($this) {
            self::Required => "{$field} is required",
            self::Email => "{$field} must be a valid email address",
            self::Url => "{$field} must be a valid URL",
            self::MinLength => "{$field} must be at least {$param} characters",
            self::MaxLength => "{$field} must not exceed {$param} characters",
            self::Min => "{$field} must be at least {$param}",
            self::Max => "{$field} must not exceed {$param}",
            self::Numeric => "{$field} must be numeric",
            self::Alpha => "{$field} must contain only letters",
            self::AlphaNumeric => "{$field} must contain only letters and numbers",
            self::Regex => "{$field} format is invalid",
            self::In => "{$field} must be one of: {$param}",
            self::NotIn => "{$field} must not be one of: {$param}",
            self::Confirmed => "{$field} confirmation does not match",
            self::Date => "{$field} must be a valid date",
            self::DateFormat => "{$field} must match format {$param}",
            self::Before => "{$field} must be before {$param}",
            self::After => "{$field} must be after {$param}",
        };
    }

    /**
     * Validate value
     */
    public function validate(mixed $value, mixed $param = null, array $data = []): bool
    {
        return match ($this) {
            self::Required => $value !== null && $value !== '',
            self::Email => filter_var($value, FILTER_VALIDATE_EMAIL) !== false,
            self::Url => filter_var($value, FILTER_VALIDATE_URL) !== false,
            self::MinLength => is_string($value) && mb_strlen($value) >= $param,
            self::MaxLength => is_string($value) && mb_strlen($value) <= $param,
            self::Min => is_numeric($value) && $value >= $param,
            self::Max => is_numeric($value) && $value <= $param,
            self::Numeric => is_numeric($value),
            self::Alpha => preg_match('/^[a-zA-Z]+$/', $value) === 1,
            self::AlphaNumeric => preg_match('/^[a-zA-Z0-9]+$/', $value) === 1,
            self::Regex => preg_match($param, $value) === 1,
            self::In => in_array($value, explode(',', $param), true),
            self::NotIn => !in_array($value, explode(',', $param), true),
            self::Confirmed => isset($data["{$param}_confirmation"])
                && $value === $data["{$param}_confirmation"],
            self::Date => strtotime($value) !== false,
            self::DateFormat => DateTime::createFromFormat($param, $value) !== false,
            self::Before => strtotime($value) < strtotime($param),
            self::After => strtotime($value) > strtotime($param),
        };
    }
}

// Validator class
class Validator
{
    private array $errors = [];

    public function validate(array $data, array $rules): bool
    {
        $this->errors = [];

        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;

            foreach ($fieldRules as $rule) {
                // Parse rule and parameters
                if (is_array($rule)) {
                    $ruleEnum = $rule[0];
                    $param = $rule[1] ?? null;
                } else {
                    $ruleEnum = $rule;
                    $param = null;
                }

                // If not required and value is empty, skip other validations
                if ($ruleEnum !== ValidationRule::Required && ($value === null || $value === '')) {
                    continue;
                }

                // Validate
                if (!$ruleEnum->validate($value, $param, $data)) {
                    $this->errors[$field][] = $ruleEnum->errorMessage($field, $param);
                }
            }
        }

        return empty($this->errors);
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getFirstError(string $field): ?string
    {
        return $this->errors[$field][0] ?? null;
    }
}

// Usage example
$validator = new Validator();

$data = [
    'username' => 'john',
    'email' => 'invalid-email',
    'password' => '123',
    'password_confirmation' => '456',
    'age' => 15,
];

$rules = [
    'username' => [
        ValidationRule::Required,
        [ValidationRule::MinLength, 3],
        [ValidationRule::MaxLength, 20],
        ValidationRule::AlphaNumeric,
    ],
    'email' => [
        ValidationRule::Required,
        ValidationRule::Email,
    ],
    'password' => [
        ValidationRule::Required,
        [ValidationRule::MinLength, 8],
        [ValidationRule::Confirmed, 'password'],
    ],
    'age' => [
        ValidationRule::Required,
        ValidationRule::Numeric,
        [ValidationRule::Min, 18],
    ],
];

if (!$validator->validate($data, $rules)) {
    echo "Validation failed:\n";
    foreach ($validator->getErrors() as $field => $errors) {
        foreach ($errors as $error) {
            echo "  - {$error}\n";
        }
    }
}
// Output:
// Validation failed:
//   - email must be a valid email address
//   - password must be at least 8 characters
//   - password confirmation does not match
//   - age must be at least 18
```

## Best Practices

### Use Backed Enums for Database Interaction

```php
<?php
// Recommended: use string values for better readability and maintainability
enum ArticleStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}

// Use in Entity or Model
class Article
{
    public function __construct(
        public readonly int $id,
        public string $title,
        public string $content,
        private ArticleStatus $status = ArticleStatus::Draft
    ) {}

    public function getStatus(): ArticleStatus
    {
        return $this->status;
    }

    public function setStatus(ArticleStatus $status): void
    {
        $this->status = $status;
    }

    // For database storage
    public function toDatabase(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'status' => $this->status->value, // Store value not enum
        ];
    }

    // Create from database record
    public static function fromDatabase(array $row): self
    {
        return new self(
            id: $row['id'],
            title: $row['title'],
            content: $row['content'],
            status: ArticleStatus::from($row['status'])
        );
    }
}
```

### Encapsulate Business Logic in Enum Methods

```php
<?php
enum SubscriptionPlan: string
{
    case Free = 'free';
    case Basic = 'basic';
    case Pro = 'pro';
    case Enterprise = 'enterprise';

    // Encapsulate related business logic in enum
    public function monthlyPrice(): int
    {
        return match ($this) {
            self::Free => 0,
            self::Basic => 9,
            self::Pro => 29,
            self::Enterprise => 99,
        };
    }

    public function annualPrice(): int
    {
        // Annual billing gets 2 months free
        return $this->monthlyPrice() * 10;
    }

    public function maxProjects(): int
    {
        return match ($this) {
            self::Free => 3,
            self::Basic => 10,
            self::Pro => 50,
            self::Enterprise => PHP_INT_MAX, // Unlimited
        };
    }

    public function maxTeamMembers(): int
    {
        return match ($this) {
            self::Free => 1,
            self::Basic => 5,
            self::Pro => 25,
            self::Enterprise => PHP_INT_MAX,
        };
    }

    public function hasFeature(string $feature): bool
    {
        $features = match ($this) {
            self::Free => ['basic_analytics'],
            self::Basic => ['basic_analytics', 'email_support', 'api_access'],
            self::Pro => [
                'basic_analytics', 'advanced_analytics',
                'email_support', 'priority_support',
                'api_access', 'webhooks',
            ],
            self::Enterprise => [
                'basic_analytics', 'advanced_analytics', 'custom_analytics',
                'email_support', 'priority_support', '24/7_support',
                'api_access', 'webhooks', 'sso', 'audit_logs',
            ],
        };

        return in_array($feature, $features, true);
    }

    public function canUpgradeTo(self $plan): bool
    {
        $order = [self::Free, self::Basic, self::Pro, self::Enterprise];
        return array_search($plan, $order) > array_search($this, $order);
    }
}
```

### Use Traits to Provide Common Functionality

```php
<?php
trait EnumToArray
{
    /**
     * Convert to associative array [value => label]
     */
    public static function toArray(): array
    {
        $result = [];
        foreach (self::cases() as $case) {
            $key = $case instanceof BackedEnum ? $case->value : $case->name;
            $label = method_exists($case, 'label') ? $case->label() : $case->name;
            $result[$key] = $label;
        }
        return $result;
    }

    /**
     * Convert to options array
     */
    public static function toOptions(): array
    {
        return array_map(
            fn($case) => [
                'value' => $case instanceof BackedEnum ? $case->value : $case->name,
                'label' => method_exists($case, 'label') ? $case->label() : $case->name,
            ],
            self::cases()
        );
    }
}

trait EnumValidation
{
    /**
     * Check if value is valid
     */
    public static function isValid(mixed $value): bool
    {
        foreach (self::cases() as $case) {
            if ($case instanceof BackedEnum && $case->value === $value) {
                return true;
            }
            if ($case->name === $value) {
                return true;
            }
        }
        return false;
    }
}

// Apply Traits
enum Country: string
{
    use EnumToArray;
    use EnumValidation;

    case China = 'CN';
    case Japan = 'JP';
    case Korea = 'KR';
    case UnitedStates = 'US';

    public function label(): string
    {
        return match ($this) {
            self::China => 'China',
            self::Japan => 'Japan',
            self::Korea => 'Korea',
            self::UnitedStates => 'United States',
        };
    }
}

// Usage
print_r(Country::toArray());
// ['CN' => 'China', 'JP' => 'Japan', 'KR' => 'Korea', 'US' => 'United States']

print_r(Country::toOptions());
// [['value' => 'CN', 'label' => 'China'], ...]

var_dump(Country::isValid('CN'));  // true
var_dump(Country::isValid('XX'));  // false
```

### Implement Exhaustiveness Checking with match Expressions

```php
<?php
enum NotificationType: string
{
    case Email = 'email';
    case SMS = 'sms';
    case Push = 'push';
    case Webhook = 'webhook';
}

class NotificationService
{
    public function send(NotificationType $type, string $message, string $recipient): void
    {
        // match expression ensures all types are handled
        // If a new enum value is added but not handled, compile error occurs
        match ($type) {
            NotificationType::Email => $this->sendEmail($message, $recipient),
            NotificationType::SMS => $this->sendSMS($message, $recipient),
            NotificationType::Push => $this->sendPush($message, $recipient),
            NotificationType::Webhook => $this->sendWebhook($message, $recipient),
        };
    }

    private function sendEmail(string $message, string $recipient): void
    {
        echo "Send email to {$recipient}: {$message}\n";
    }

    private function sendSMS(string $message, string $recipient): void
    {
        echo "Send SMS to {$recipient}: {$message}\n";
    }

    private function sendPush(string $message, string $recipient): void
    {
        echo "Send push notification to {$recipient}: {$message}\n";
    }

    private function sendWebhook(string $message, string $recipient): void
    {
        echo "Send webhook to {$recipient}: {$message}\n";
    }
}
```

## Common Pitfalls

### Misusing Pure Enums for Database Storage

```php
<?php
// Wrong: pure enums don't have persistence-friendly values
enum Status
{
    case Active;
    case Inactive;
}

// Attempting to store will have problems
$status = Status::Active;
// $dbValue = $status->value; // Error! Pure enums don't have value property

// Correct approach: use backed enums
enum StatusCorrect: string
{
    case Active = 'active';
    case Inactive = 'inactive';
}

$status = StatusCorrect::Active;
$dbValue = $status->value; // 'active' - can be stored in database
```

### Defining Properties in Traits

```php
<?php
// Wrong: Trait contains properties, enum cannot use it
trait HasProperties
{
    private string $description; // Enums don't support properties

    public function getDescription(): string
    {
        return $this->description;
    }
}

// Correct approach: use methods instead of properties
trait DescribableEnum
{
    public function description(): string
    {
        // Implement in concrete enum
        return match ($this) {
            // ...
        };
    }
}
```

### Forgetting to Handle tryFrom Returning null

```php
<?php
enum UserType: string
{
    case Admin = 'admin';
    case User = 'user';
}

// Wrong: not handling null case
function getUserTypeLabel(string $type): string
{
    $userType = UserType::tryFrom($type);
    return $userType->name; // Will error if $type is invalid
}

// Correct approach: handle null case
function getUserTypeLabelSafe(string $type): string
{
    $userType = UserType::tryFrom($type);

    if ($userType === null) {
        return 'Unknown type';
    }

    return $userType->name;
}

// Or use null coalescing operator
function getUserTypeLabelAlt(string $type): string
{
    return UserType::tryFrom($type)?->name ?? 'Unknown type';
}
```

### Confusing name and value

```php
<?php
enum HttpMethod: string
{
    case Get = 'GET';
    case Post = 'POST';
    case Put = 'PUT';
    case Delete = 'DELETE';
}

$method = HttpMethod::Get;

// name is the enum case identifier name
echo $method->name;  // "Get"

// value is the associated value (only backed enums have this)
echo $method->value; // "GET"

// When using for API requests, use value
$request = [
    'method' => $method->value, // Use "GET" not "Get"
];

// When creating enum from external input, use from/tryFrom (based on value)
$method = HttpMethod::from('GET');     // Correct
// $method = HttpMethod::from('Get');  // ValueError, because 'Get' is not a valid value
```

### Losing Enum Type During Serialization

```php
<?php
enum Priority: int
{
    case Low = 1;
    case Medium = 2;
    case High = 3;
}

class Task
{
    public function __construct(
        public string $title,
        public Priority $priority
    ) {}
}

$task = new Task('Complete report', Priority::High);

// Direct json_encode loses enum information
echo json_encode($task);
// {"title":"Complete report","priority":{}}  - Enum serialized as empty object!

// Correct approach: implement JsonSerializable
class TaskSerializable implements JsonSerializable
{
    public function __construct(
        public string $title,
        public Priority $priority
    ) {}

    public function jsonSerialize(): array
    {
        return [
            'title' => $this->title,
            'priority' => $this->priority->value,
        ];
    }
}

$task = new TaskSerializable('Complete report', Priority::High);
echo json_encode($task);
// {"title":"Complete report","priority":3}
```

## Performance Considerations

### Enum Instances Are Singletons

Each enum case exists as only one instance in memory, which means:

```php
<?php
enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';
}

// Multiple accesses to the same case don't create new objects
$status1 = Status::Active;
$status2 = Status::Active;

// They are the exact same object
var_dump($status1 === $status2); // true

// This makes enum comparison very fast (pointer comparison)
function isActive(Status $status): bool
{
    return $status === Status::Active; // Very fast comparison
}
```

### from() vs tryFrom() Performance

```php
<?php
enum Color: string
{
    case Red = 'red';
    case Green = 'green';
    case Blue = 'blue';
}

// from() - throws exception if value is invalid
// Use when: confident value is valid, or want immediate failure on invalid
$color = Color::from('red'); // Fast, no extra overhead

// tryFrom() - returns null if value is invalid
// Use when: handling user input, need graceful degradation
$color = Color::tryFrom('invalid'); // Slightly slower, needs to check and return null

// Performance recommendations:
// 1. In internal code where values are certainly valid, use from()
// 2. When handling external input, use tryFrom()
// 3. Don't repeatedly call from/tryFrom in loops, validate first then use

// Optimization example
function processColors(array $colorValues): array
{
    $validColors = [];

    foreach ($colorValues as $value) {
        // Avoid repeatedly creating exceptions in loop
        $color = Color::tryFrom($value);
        if ($color !== null) {
            $validColors[] = $color;
        }
    }

    return $validColors;
}
```

### cases() Method Caching

```php
<?php
enum LargeEnum: int
{
    case Option1 = 1;
    case Option2 = 2;
    // ... assume many options
    case Option100 = 100;
}

// Array returned by cases() is cached internally by PHP
// Multiple calls don't rebuild the array
$cases1 = LargeEnum::cases();
$cases2 = LargeEnum::cases(); // Returns same cached array

// But if you need frequent iteration, consider caching the result
class EnumCache
{
    private static array $cache = [];

    public static function getCases(string $enumClass): array
    {
        if (!isset(self::$cache[$enumClass])) {
            self::$cache[$enumClass] = $enumClass::cases();
        }
        return self::$cache[$enumClass];
    }
}
```

### Enum and match Expression Optimization

```php
<?php
enum Operation: string
{
    case Add = 'add';
    case Subtract = 'subtract';
    case Multiply = 'multiply';
    case Divide = 'divide';
}

// match expressions are optimized at compile time
// For enums, this typically generates a jump table, performance close to O(1)
function calculate(float $a, float $b, Operation $op): float
{
    return match ($op) {
        Operation::Add => $a + $b,
        Operation::Subtract => $a - $b,
        Operation::Multiply => $a * $b,
        Operation::Divide => $a / $b,
    };
}

// Faster and more readable than using if-else chains
```

## Real-World Scenarios

### API Status Response

```php
<?php
enum ApiResponseStatus: string
{
    case Success = 'success';
    case Error = 'error';
    case ValidationError = 'validation_error';
    case AuthenticationError = 'authentication_error';
    case AuthorizationError = 'authorization_error';
    case NotFound = 'not_found';
    case RateLimited = 'rate_limited';
    case ServerError = 'server_error';

    public function httpCode(): int
    {
        return match ($this) {
            self::Success => 200,
            self::Error => 400,
            self::ValidationError => 422,
            self::AuthenticationError => 401,
            self::AuthorizationError => 403,
            self::NotFound => 404,
            self::RateLimited => 429,
            self::ServerError => 500,
        };
    }

    public function isSuccess(): bool
    {
        return $this === self::Success;
    }

    public function isClientError(): bool
    {
        return in_array($this, [
            self::Error,
            self::ValidationError,
            self::AuthenticationError,
            self::AuthorizationError,
            self::NotFound,
            self::RateLimited,
        ], true);
    }
}

class ApiResponse implements JsonSerializable
{
    public function __construct(
        private ApiResponseStatus $status,
        private mixed $data = null,
        private ?string $message = null,
        private array $errors = []
    ) {}

    public static function success(mixed $data = null, ?string $message = null): self
    {
        return new self(ApiResponseStatus::Success, $data, $message);
    }

    public static function error(
        ApiResponseStatus $status,
        string $message,
        array $errors = []
    ): self {
        return new self($status, null, $message, $errors);
    }

    public function getHttpCode(): int
    {
        return $this->status->httpCode();
    }

    public function jsonSerialize(): array
    {
        $response = [
            'status' => $this->status->value,
        ];

        if ($this->data !== null) {
            $response['data'] = $this->data;
        }

        if ($this->message !== null) {
            $response['message'] = $this->message;
        }

        if (!empty($this->errors)) {
            $response['errors'] = $this->errors;
        }

        return $response;
    }

    public function send(): never
    {
        http_response_code($this->getHttpCode());
        header('Content-Type: application/json');
        echo json_encode($this);
        exit;
    }
}

// Usage examples
// ApiResponse::success(['user' => $user], 'User created successfully')->send();

// ApiResponse::error(
//     ApiResponseStatus::ValidationError,
//     'Validation failed',
//     ['email' => 'Invalid email format']
// )->send();
```

### Configuration Management

```php
<?php
enum Environment: string
{
    case Local = 'local';
    case Development = 'development';
    case Staging = 'staging';
    case Production = 'production';

    public function isLocal(): bool
    {
        return $this === self::Local;
    }

    public function isProduction(): bool
    {
        return $this === self::Production;
    }

    public function shouldShowErrors(): bool
    {
        return in_array($this, [self::Local, self::Development], true);
    }

    public function logLevel(): string
    {
        return match ($this) {
            self::Local, self::Development => 'debug',
            self::Staging => 'info',
            self::Production => 'warning',
        };
    }

    public function cacheDriver(): string
    {
        return match ($this) {
            self::Local => 'array',
            self::Development => 'file',
            self::Staging, self::Production => 'redis',
        };
    }

    public function databaseConfig(): array
    {
        return match ($this) {
            self::Local => [
                'host' => 'localhost',
                'database' => 'app_local',
                'username' => 'root',
                'password' => '',
            ],
            self::Development => [
                'host' => 'dev-db.example.com',
                'database' => 'app_dev',
                'username' => 'dev_user',
                'password' => getenv('DEV_DB_PASSWORD'),
            ],
            self::Staging => [
                'host' => 'staging-db.example.com',
                'database' => 'app_staging',
                'username' => 'staging_user',
                'password' => getenv('STAGING_DB_PASSWORD'),
            ],
            self::Production => [
                'host' => 'prod-db.example.com',
                'database' => 'app_production',
                'username' => 'prod_user',
                'password' => getenv('PROD_DB_PASSWORD'),
            ],
        };
    }

    public static function current(): self
    {
        $env = getenv('APP_ENV') ?: 'local';
        return self::tryFrom($env) ?? self::Local;
    }
}

// Usage
$env = Environment::current();

if ($env->shouldShowErrors()) {
    ini_set('display_errors', '1');
}

$dbConfig = $env->databaseConfig();
$cacheDriver = $env->cacheDriver();
```

### Multi-language Support

```php
<?php
enum Language: string
{
    case Chinese = 'zh-CN';
    case English = 'en-US';
    case Japanese = 'ja-JP';
    case Korean = 'ko-KR';

    public function displayName(): string
    {
        return match ($this) {
            self::Chinese => 'Simplified Chinese',
            self::English => 'English',
            self::Japanese => 'Japanese',
            self::Korean => 'Korean',
        };
    }

    public function direction(): string
    {
        return 'ltr'; // All supported languages are left-to-right
    }

    public function dateFormat(): string
    {
        return match ($this) {
            self::Chinese, self::Japanese, self::Korean => 'Y-m-d',
            self::English => 'F j, Y',
        };
    }

    public function numberFormat(): array
    {
        return match ($this) {
            self::Chinese, self::Japanese, self::Korean => [
                'decimal' => '.',
                'thousands' => ',',
            ],
            self::English => [
                'decimal' => '.',
                'thousands' => ',',
            ],
        };
    }

    public static function default(): self
    {
        return self::English;
    }

    public static function fromAcceptHeader(string $header): self
    {
        $languages = explode(',', $header);

        foreach ($languages as $lang) {
            $code = trim(explode(';', $lang)[0]);

            // Try exact match
            $match = self::tryFrom($code);
            if ($match !== null) {
                return $match;
            }

            // Try matching language prefix
            $prefix = substr($code, 0, 2);
            foreach (self::cases() as $case) {
                if (str_starts_with($case->value, $prefix)) {
                    return $case;
                }
            }
        }

        return self::default();
    }
}

// Usage example
$acceptLanguage = 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7';
$language = Language::fromAcceptHeader($acceptLanguage);

echo $language->displayName(); // Japanese
echo date($language->dateFormat()); // 2026-01-07
```

## Interview Key Points

### Common Interview Questions

**1. What is the difference between PHP enums and class constants?**

```php
<?php
// Class constants approach
class StatusConstants
{
    public const ACTIVE = 'active';
    public const INACTIVE = 'inactive';
}

// Enum approach
enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';
}

// Main differences:
// 1. Type safety: Enums are independent types, functions can restrict to Status type only
// 2. Singleton: Each enum case is a singleton, can compare with ===
// 3. Method support: Enums can have methods, encapsulating related business logic
// 4. Interface implementation: Enums can implement interfaces
// 5. Reflection support: Can get all values via cases()
// 6. IDE support: Better auto-completion and type checking
```

**2. What is the difference between Pure Enum and Backed Enum?**

```php
<?php
// Pure Enum: no associated value
enum Suit
{
    case Hearts;   // No value property
    case Diamonds;
}

// Backed Enum: has associated scalar value
enum Color: string  // Must specify type: string or int
{
    case Red = 'red';   // Has value property
    case Blue = 'blue';
}

// Differences:
// 1. Pure Enum has no value property, Backed Enum has
// 2. Pure Enum has no from/tryFrom methods
// 3. Backed Enum must specify value for each case
// 4. Backed Enum is suitable for external system interaction (database, API)
```

**3. How to create an enum instance from a string?**

```php
<?php
enum Priority: int
{
    case Low = 1;
    case Medium = 2;
    case High = 3;
}

// from() - throws ValueError if value is invalid
$priority = Priority::from(2); // Priority::Medium

// tryFrom() - returns null if value is invalid
$priority = Priority::tryFrom(999); // null

// Only Backed Enums have these two methods
```

**4. Can enums be inherited?**

```php
<?php
enum Base: string
{
    case A = 'a';
}

// Error! Enums cannot be inherited
// enum Extended extends Base {}

// But enums can implement interfaces
interface Labelable
{
    public function label(): string;
}

enum Status: string implements Labelable
{
    case Active = 'active';

    public function label(): string
    {
        return 'Active';
    }
}
```

**5. How are enums serialized?**

```php
<?php
enum Status: string
{
    case Active = 'active';
}

$status = Status::Active;

// Serialization
$serialized = serialize($status);
// O:6:"Status":0:{}

// Deserialization
$unserialized = unserialize($serialized);
var_dump($unserialized === Status::Active); // true

// JSON serialization needs customization
$json = json_encode($status);
// {} - Default serializes to empty object

// Correct approach: implement JsonSerializable or use value
$json = json_encode($status->value);
// "active"
```

### Practical Coding Problem

**Problem: Design an order status enum that supports state transition validation**

```php
<?php
enum OrderStatus: string
{
    case Created = 'created';
    case Paid = 'paid';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';

    public function canTransitionTo(self $newStatus): bool
    {
        $transitions = match ($this) {
            self::Created => [self::Paid, self::Cancelled],
            self::Paid => [self::Shipped, self::Cancelled],
            self::Shipped => [self::Delivered],
            self::Delivered, self::Cancelled => [],
        };

        return in_array($newStatus, $transitions, true);
    }

    public function transition(self $newStatus): self
    {
        if (!$this->canTransitionTo($newStatus)) {
            throw new InvalidArgumentException(
                "Cannot transition from {$this->value} to {$newStatus->value}"
            );
        }
        return $newStatus;
    }
}

// Test
$status = OrderStatus::Created;
$status = $status->transition(OrderStatus::Paid);     // OK
$status = $status->transition(OrderStatus::Shipped);  // OK
// $status = $status->transition(OrderStatus::Created); // Exception
```

## Further Reading

### Official Documentation

- [PHP Official Documentation - Enumerations](https://www.php.net/manual/en/language.enumerations.php)
- [PHP 8.1 Release Notes](https://www.php.net/releases/8.1/en.php)
- [RFC: Enumerations](https://wiki.php.net/rfc/enumerations)

### Related Features

- [Match Expressions](https://www.php.net/manual/en/control-structures.match.php) - Best companion for enums
- [Attributes](https://www.php.net/manual/en/language.attributes.php) - Can add metadata to enums
- [Readonly Properties](https://www.php.net/manual/en/language.oop5.properties.php#language.oop5.properties.readonly-properties) - Feature introduced alongside PHP 8.1

### Best Practice Resources

- [Laravel Enum Best Practices](https://laravel.com/docs/eloquent#enum-casting)
- [Symfony Enum Handling](https://symfony.com/doc/current/doctrine.html#enum-type)
- [PHPStan Enum Support](https://phpstan.org/writing-php-code/phpdoc-types#enums)

### Related Tools

- **myclabs/php-enum**: Enum simulation library for pre-PHP 8.1
- **spatie/laravel-enum**: Laravel enum extension
- **bensampo/laravel-enum**: Another popular Laravel enum package

### Summary

PHP 8.1 enums are a powerful language feature providing:

1. **Type Safety**: Compile-time checking, reduces runtime errors
2. **Code Clarity**: Self-documenting, reduces magic strings
3. **Rich Features**: Methods, Trait support, interface implementation
4. **Excellent Performance**: Singleton pattern, efficient comparisons
5. **Interoperability**: from/tryFrom for external data interaction

Enums significantly improve code quality and maintainability. In real projects, we recommend:

- Replace state constants with enums
- Encapsulate related business logic in enum methods
- Use match expressions for exhaustiveness checking
- Use backed enums for database and API interaction
