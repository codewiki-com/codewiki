---
title: PHP 8.1 枚举完全指南
description: 深入理解PHP 8.1枚举类型，包括纯枚举、带值枚举、枚举方法、Trait使用和UnitEnum接口
track: php
section: basics
difficulty: intermediate
tags:
  - PHP
  - PHP 8.1
  - 枚举
  - Enum
  - 类型系统
status: imported
origin: old/src/content/docs/php/enums.zh.md
divergence: 0.225
issues: []
legacy:
  category: PHP
  subcategory: 语言特性
  order: 5
  lastUpdated: 2026-01-07
---

枚举（Enum）是 PHP 8.1 引入的重要新特性，它提供了一种类型安全的方式来定义一组固定的常量值。枚举在许多编程语言中早已存在，PHP 终于在 8.1 版本中引入了这一期待已久的功能。本文将深入探讨 PHP 枚举的各个方面，从基础概念到高级应用，帮助你全面掌握这一强大特性。

## 概念解释

### 什么是枚举

枚举是一种特殊的数据类型，用于定义一组命名的常量集合。与使用类常量或魔术字符串相比，枚举提供了更强的类型安全性和更好的代码可读性。

在 PHP 8.1 之前，开发者通常使用以下方式模拟枚举：

```php
<?php
// 使用类常量模拟枚举（PHP 8.0 及之前）
class OrderStatus
{
    public const PENDING = 'pending';
    public const PROCESSING = 'processing';
    public const SHIPPED = 'shipped';
    public const DELIVERED = 'delivered';
    public const CANCELLED = 'cancelled';
}

// 使用时需要手动验证
function processOrder(string $status): void
{
    // 无法在类型层面保证 $status 是有效的状态值
    if (!in_array($status, [
        OrderStatus::PENDING,
        OrderStatus::PROCESSING,
        OrderStatus::SHIPPED,
        OrderStatus::DELIVERED,
        OrderStatus::CANCELLED
    ])) {
        throw new InvalidArgumentException("无效的订单状态");
    }
    // 处理订单...
}

// 调用时可能传入无效值
processOrder('invalid_status'); // 运行时才会发现错误
processOrder(OrderStatus::PENDING); // 正确
```

PHP 8.1 引入的原生枚举解决了这些问题：

```php
<?php
// PHP 8.1+ 原生枚举
enum OrderStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
}

// 类型安全：只接受 OrderStatus 枚举值
function processOrder(OrderStatus $status): void
{
    // $status 保证是有效的枚举值
    match ($status) {
        OrderStatus::Pending => handlePending(),
        OrderStatus::Processing => handleProcessing(),
        OrderStatus::Shipped => handleShipped(),
        OrderStatus::Delivered => handleDelivered(),
        OrderStatus::Cancelled => handleCancelled(),
    };
}

// 编译时就能发现错误
// processOrder('invalid_status'); // TypeError
processOrder(OrderStatus::Pending); // 正确
```

### 枚举解决的问题

1. **类型安全**：枚举值是独立的类型，无法与其他类型混淆
2. **自动补全**：IDE 可以提供枚举值的自动补全
3. **穷尽性检查**：配合 `match` 表达式，可以确保处理了所有可能的值
4. **可读性**：代码意图更加清晰，减少魔术字符串的使用
5. **维护性**：修改枚举值时，类型检查能帮助发现所有需要更新的地方

### 枚举的两种类型

PHP 支持两种枚举类型：

1. **纯枚举（Pure Enum）**：没有关联值的枚举，每个 case 本身就是一个独立的值
2. **带值枚举（Backed Enum）**：每个 case 关联一个标量值（string 或 int）

```php
<?php
// 纯枚举：适用于仅需要区分状态的场景
enum Suit
{
    case Hearts;
    case Diamonds;
    case Clubs;
    case Spades;
}

// 带值枚举：适用于需要与外部系统交互的场景（如数据库存储、API 返回）
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

## 核心原理

### 枚举的底层实现

PHP 枚举在底层是通过特殊的类实现的。每个枚举类型都是 `UnitEnum` 接口的实现，而带值枚举还实现了 `BackedEnum` 接口。

```php
<?php
// PHP 内部定义的枚举接口
interface UnitEnum
{
    /**
     * 返回枚举的所有 case
     * @return static[]
     */
    public static function cases(): array;
}

interface BackedEnum extends UnitEnum
{
    /**
     * 从值创建枚举实例，值不存在时抛出异常
     */
    public static function from(int|string $value): static;

    /**
     * 从值创建枚举实例，值不存在时返回 null
     */
    public static function tryFrom(int|string $value): ?static;
}
```

### 枚举实例的单例特性

每个枚举 case 都是单例的，即同一个 case 在整个程序运行期间只存在一个实例：

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

// 严格相等，指向同一个实例
var_dump($red1 === $red2); // true

// 可以使用 === 进行比较
if ($red1 === Color::Red) {
    echo "颜色是红色\n";
}
```

### 枚举与类的区别

枚举虽然类似于类，但有以下重要区别：

```php
<?php
enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';

    // 1. 枚举不能有构造函数（带值枚举的值在定义时指定）
    // public function __construct() {} // 错误

    // 2. 枚举不能有属性（除了只读属性）
    // public string $description; // 错误

    // 3. 枚举可以有方法
    public function label(): string
    {
        return match ($this) {
            self::Active => '活跃',
            self::Inactive => '未激活',
        };
    }

    // 4. 枚举可以有静态方法
    public static function default(): self
    {
        return self::Active;
    }

    // 5. 枚举可以有常量
    public const DEFAULT_STATUS = self::Active;

    // 6. 枚举可以实现接口
    // 7. 枚举可以使用 Trait
}

// 枚举不能被实例化
// $status = new Status(); // 错误

// 枚举不能被继承
// class ExtendedStatus extends Status {} // 错误
```

## 核心要点

### 纯枚举（Pure Enum）

纯枚举是最简单的枚举形式，每个 case 本身就是一个独立的值：

```php
<?php
// 定义纯枚举
enum CardSuit
{
    case Hearts;   // 红桃
    case Diamonds; // 方块
    case Clubs;    // 梅花
    case Spades;   // 黑桃
}

// 使用纯枚举
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

// 获取所有 case
$suits = CardSuit::cases();
foreach ($suits as $suit) {
    echo $suit->name . ': ' . getCardSymbol($suit) . "\n";
}
// 输出：
// Hearts: ♥
// Diamonds: ♦
// Clubs: ♣
// Spades: ♠

// 枚举的 name 属性
$suit = CardSuit::Hearts;
echo $suit->name; // "Hearts"
```

### 带值枚举（Backed Enum）

带值枚举将每个 case 与一个标量值关联，适用于需要与数据库、API 等外部系统交互的场景：

```php
<?php
// 字符串类型的带值枚举
enum UserRole: string
{
    case Admin = 'admin';
    case Editor = 'editor';
    case Author = 'author';
    case Subscriber = 'subscriber';
}

// 整数类型的带值枚举
enum Priority: int
{
    case Low = 1;
    case Medium = 2;
    case High = 3;
    case Critical = 4;
}

// 使用 value 属性获取关联值
$role = UserRole::Admin;
echo $role->name;  // "Admin"
echo $role->value; // "admin"

$priority = Priority::High;
echo $priority->name;  // "High"
echo $priority->value; // 3
```

### from() 和 tryFrom() 方法

带值枚举提供了两个静态方法用于从值创建枚举实例：

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

// from() - 值不存在时抛出 ValueError
try {
    $status = HttpStatus::from(200);
    echo $status->name; // "Ok"

    $invalid = HttpStatus::from(999); // 抛出 ValueError
} catch (ValueError $e) {
    echo "无效的状态码: " . $e->getMessage();
}

// tryFrom() - 值不存在时返回 null（推荐用于用户输入）
$status = HttpStatus::tryFrom(404);
if ($status !== null) {
    echo $status->name; // "NotFound"
}

$invalid = HttpStatus::tryFrom(999);
var_dump($invalid); // null

// 实际应用：处理 API 响应
function handleResponse(int $code): string
{
    $status = HttpStatus::tryFrom($code);

    return match ($status) {
        HttpStatus::Ok, HttpStatus::Created, HttpStatus::Accepted
            => '请求成功',
        HttpStatus::BadRequest, HttpStatus::MethodNotAllowed
            => '请求错误，请检查参数',
        HttpStatus::Unauthorized, HttpStatus::Forbidden
            => '权限不足',
        HttpStatus::NotFound
            => '资源不存在',
        HttpStatus::InternalServerError, HttpStatus::ServiceUnavailable
            => '服务器错误，请稍后重试',
        null
            => '未知状态码: ' . $code,
    };
}
```

### cases() 方法

所有枚举都实现了 `UnitEnum` 接口，提供 `cases()` 静态方法返回所有 case：

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

// 获取所有枚举值
$days = Weekday::cases();

// 构建下拉选项
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

// 构建映射数组
$dayNames = [];
foreach (Weekday::cases() as $day) {
    $dayNames[$day->value] = $day->name;
}
// [1 => 'Monday', 2 => 'Tuesday', ...]
```

### 枚举方法

枚举可以定义实例方法和静态方法，这使得枚举可以封装与其值相关的行为：

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

    // 实例方法：获取本地化标签
    public function label(): string
    {
        return match ($this) {
            self::Pending => '待处理',
            self::Processing => '处理中',
            self::Completed => '已完成',
            self::Failed => '失败',
            self::Refunded => '已退款',
            self::Cancelled => '已取消',
        };
    }

    // 实例方法：获取状态颜色
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

    // 实例方法：检查是否为最终状态
    public function isFinal(): bool
    {
        return match ($this) {
            self::Completed, self::Failed, self::Refunded, self::Cancelled => true,
            default => false,
        };
    }

    // 实例方法：获取允许转换的下一状态
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Processing, self::Cancelled],
            self::Processing => [self::Completed, self::Failed],
            self::Completed => [self::Refunded],
            self::Failed => [self::Pending], // 允许重试
            self::Refunded, self::Cancelled => [], // 最终状态
        };
    }

    // 实例方法：检查是否可以转换到指定状态
    public function canTransitionTo(self $newStatus): bool
    {
        return in_array($newStatus, $this->allowedTransitions(), true);
    }

    // 静态方法：获取默认状态
    public static function default(): self
    {
        return self::Pending;
    }

    // 静态方法：获取所有活跃状态
    public static function activeStatuses(): array
    {
        return [self::Pending, self::Processing];
    }

    // 静态方法：从数据库值创建（带默认值）
    public static function fromDatabase(?string $value): self
    {
        if ($value === null) {
            return self::default();
        }
        return self::tryFrom($value) ?? self::default();
    }
}

// 使用枚举方法
$status = PaymentStatus::Processing;

echo $status->label();    // 处理中
echo $status->color();    // blue
echo $status->isFinal();  // false

// 检查状态转换
if ($status->canTransitionTo(PaymentStatus::Completed)) {
    echo "可以转换到已完成状态\n";
}

// 获取允许的下一状态
foreach ($status->allowedTransitions() as $nextStatus) {
    echo "可以转换到: {$nextStatus->label()}\n";
}

// 使用静态方法
$defaultStatus = PaymentStatus::default();
$activeStatuses = PaymentStatus::activeStatuses();
```

### 枚举与 Trait

枚举可以使用 Trait 来复用代码，但 Trait 不能包含属性：

```php
<?php
// 定义一个可被枚举使用的 Trait
trait EnumHelper
{
    // 获取所有 name 列表
    public static function names(): array
    {
        return array_column(self::cases(), 'name');
    }

    // 获取所有 value 列表（仅适用于带值枚举）
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    // 随机获取一个枚举值
    public static function random(): self
    {
        $cases = self::cases();
        return $cases[array_rand($cases)];
    }

    // 检查值是否有效
    public static function isValid(int|string $value): bool
    {
        return self::tryFrom($value) !== null;
    }

    // 转换为选项数组
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

// 另一个 Trait：提供 JSON 序列化支持
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

// 使用 Trait 的枚举
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
            self::Draft => '草稿',
            self::Review => '审核中',
            self::Published => '已发布',
            self::Archived => '已归档',
        };
    }
}

// 使用 Trait 提供的方法
print_r(ArticleStatus::names());   // ['Draft', 'Review', 'Published', 'Archived']
print_r(ArticleStatus::values());  // ['draft', 'review', 'published', 'archived']

$randomStatus = ArticleStatus::random();
echo "随机状态: {$randomStatus->label()}\n";

if (ArticleStatus::isValid('draft')) {
    echo "draft 是有效值\n";
}

// 获取选项列表
$options = ArticleStatus::toSelectOptions();
print_r($options);
// [
//     ['value' => 'draft', 'label' => '草稿'],
//     ['value' => 'review', 'label' => '审核中'],
//     ['value' => 'published', 'label' => '已发布'],
//     ['value' => 'archived', 'label' => '已归档'],
// ]

// JSON 序列化
echo json_encode(ArticleStatus::Published, JSON_UNESCAPED_UNICODE);
// {"name":"Published","value":"published","label":"已发布"}
```

### UnitEnum 与 BackedEnum 接口

理解这两个接口对于编写通用的枚举处理代码非常重要：

```php
<?php
// UnitEnum 接口 - 所有枚举都实现
interface UnitEnum
{
    public static function cases(): array;
}

// BackedEnum 接口 - 仅带值枚举实现
interface BackedEnum extends UnitEnum
{
    public static function from(int|string $value): static;
    public static function tryFrom(int|string $value): ?static;
}

// 编写接受任意枚举的函数
function printEnumInfo(UnitEnum $enum): void
{
    echo "枚举名称: {$enum->name}\n";

    // 检查是否为带值枚举
    if ($enum instanceof BackedEnum) {
        echo "枚举值: {$enum->value}\n";
    }
}

// 编写接受任意枚举类的函数
function printAllCases(string $enumClass): void
{
    // 验证是否为枚举类
    if (!enum_exists($enumClass)) {
        throw new InvalidArgumentException("{$enumClass} 不是枚举类");
    }

    echo "枚举类: {$enumClass}\n";
    echo "所有 case:\n";

    foreach ($enumClass::cases() as $case) {
        $info = "  - {$case->name}";
        if ($case instanceof BackedEnum) {
            $info .= " = {$case->value}";
        }
        echo $info . "\n";
    }
}

// 使用示例
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
// 枚举名称: Red

printEnumInfo(Size::Medium);
// 枚举名称: Medium
// 枚举值: M

printAllCases(Size::class);
// 枚举类: Size
// 所有 case:
//   - Small = S
//   - Medium = M
//   - Large = L

// 检查枚举是否存在
var_dump(enum_exists(Color::class));    // true
var_dump(enum_exists('NonExistent'));   // false
```

### 枚举实现接口

枚举可以实现接口，这为枚举提供了更大的灵活性：

```php
<?php
// 定义接口
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

// 枚举实现多个接口
enum TaskPriority: int implements Labelable, Colorable, Describable
{
    case Low = 1;
    case Medium = 2;
    case High = 3;
    case Urgent = 4;

    public function label(): string
    {
        return match ($this) {
            self::Low => '低',
            self::Medium => '中',
            self::High => '高',
            self::Urgent => '紧急',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Low => '#808080',      // 灰色
            self::Medium => '#0066cc',   // 蓝色
            self::High => '#ff9900',     // 橙色
            self::Urgent => '#cc0000',   // 红色
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Low => '可以稍后处理的任务',
            self::Medium => '正常优先级的任务',
            self::High => '需要尽快处理的任务',
            self::Urgent => '需要立即处理的紧急任务',
        };
    }
}

// 使用接口类型提示
function displayPriority(Labelable&Colorable $item): void
{
    echo "<span style=\"color: {$item->color()}\">{$item->label()}</span>\n";
}

displayPriority(TaskPriority::Urgent);

// 与其他实现相同接口的类一起使用
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

displayPriority(new CustomLabel('自定义', '#00ff00'));
```

## 代码示例

### 实际应用：订单状态机

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
     * 获取本地化标签
     */
    public function label(): string
    {
        return match ($this) {
            self::Created => '已创建',
            self::Paid => '已支付',
            self::Processing => '处理中',
            self::Shipped => '已发货',
            self::Delivered => '已送达',
            self::Cancelled => '已取消',
            self::Refunded => '已退款',
        };
    }

    /**
     * 获取状态图标
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
     * 获取状态颜色（用于 UI）
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
     * 是否为最终状态
     */
    public function isFinal(): bool
    {
        return in_array($this, [self::Delivered, self::Cancelled, self::Refunded], true);
    }

    /**
     * 是否可以取消
     */
    public function canCancel(): bool
    {
        return in_array($this, [self::Created, self::Paid], true);
    }

    /**
     * 是否可以退款
     */
    public function canRefund(): bool
    {
        return in_array($this, [self::Paid, self::Delivered], true);
    }

    /**
     * 获取允许的状态转换
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
     * 验证状态转换是否有效
     */
    public function canTransitionTo(self $newStatus): bool
    {
        return in_array($newStatus, $this->allowedTransitions(), true);
    }

    /**
     * 执行状态转换
     */
    public function transitionTo(self $newStatus): self
    {
        if (!$this->canTransitionTo($newStatus)) {
            throw new InvalidArgumentException(
                "无法从 {$this->label()} 转换到 {$newStatus->label()}"
            );
        }
        return $newStatus;
    }

    /**
     * 获取进度百分比
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

// 订单类
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

// 使用示例
$order = new Order('ORD-001');
echo "初始状态: {$order->getStatus()->label()}\n";

try {
    $order->changeStatus(OrderStatus::Paid);
    echo "支付后: {$order->getStatus()->label()}\n";

    $order->changeStatus(OrderStatus::Processing);
    echo "处理后: {$order->getStatus()->label()}\n";

    $order->changeStatus(OrderStatus::Shipped);
    echo "发货后: {$order->getStatus()->label()}\n";

    // 尝试无效转换
    // $order->changeStatus(OrderStatus::Paid); // 会抛出异常
} catch (InvalidArgumentException $e) {
    echo "错误: {$e->getMessage()}\n";
}

print_r($order->toArray());
```

### 实际应用：权限系统

```php
<?php
// 权限枚举
enum Permission: string
{
    // 用户权限
    case UserView = 'user:view';
    case UserCreate = 'user:create';
    case UserEdit = 'user:edit';
    case UserDelete = 'user:delete';

    // 文章权限
    case ArticleView = 'article:view';
    case ArticleCreate = 'article:create';
    case ArticleEdit = 'article:edit';
    case ArticleDelete = 'article:delete';
    case ArticlePublish = 'article:publish';

    // 系统权限
    case SystemSettings = 'system:settings';
    case SystemLogs = 'system:logs';
    case SystemBackup = 'system:backup';

    /**
     * 获取权限描述
     */
    public function description(): string
    {
        return match ($this) {
            self::UserView => '查看用户',
            self::UserCreate => '创建用户',
            self::UserEdit => '编辑用户',
            self::UserDelete => '删除用户',
            self::ArticleView => '查看文章',
            self::ArticleCreate => '创建文章',
            self::ArticleEdit => '编辑文章',
            self::ArticleDelete => '删除文章',
            self::ArticlePublish => '发布文章',
            self::SystemSettings => '系统设置',
            self::SystemLogs => '系统日志',
            self::SystemBackup => '系统备份',
        };
    }

    /**
     * 获取权限分组
     */
    public function group(): string
    {
        return match (true) {
            str_starts_with($this->value, 'user:') => '用户管理',
            str_starts_with($this->value, 'article:') => '文章管理',
            str_starts_with($this->value, 'system:') => '系统管理',
            default => '其他',
        };
    }

    /**
     * 按分组获取权限
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

// 角色枚举
enum Role: string
{
    case Admin = 'admin';
    case Editor = 'editor';
    case Author = 'author';
    case Viewer = 'viewer';

    /**
     * 获取角色标签
     */
    public function label(): string
    {
        return match ($this) {
            self::Admin => '管理员',
            self::Editor => '编辑',
            self::Author => '作者',
            self::Viewer => '访客',
        };
    }

    /**
     * 获取角色权限
     */
    public function permissions(): array
    {
        return match ($this) {
            self::Admin => Permission::cases(), // 管理员拥有所有权限
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
     * 检查角色是否拥有指定权限
     */
    public function hasPermission(Permission $permission): bool
    {
        return in_array($permission, $this->permissions(), true);
    }

    /**
     * 获取角色优先级（用于权限继承）
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

// 用户类
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
     * 检查用户是否拥有权限
     */
    public function can(Permission $permission): bool
    {
        // 首先检查角色权限
        if ($this->role->hasPermission($permission)) {
            return true;
        }

        // 然后检查额外权限
        return in_array($permission, $this->additionalPermissions, true);
    }

    /**
     * 添加额外权限
     */
    public function grantPermission(Permission $permission): void
    {
        if (!in_array($permission, $this->additionalPermissions, true)) {
            $this->additionalPermissions[] = $permission;
        }
    }

    /**
     * 获取所有权限
     */
    public function allPermissions(): array
    {
        return array_unique(
            array_merge($this->role->permissions(), $this->additionalPermissions)
        );
    }
}

// 使用示例
$admin = new User(1, '管理员', Role::Admin);
$editor = new User(2, '编辑', Role::Editor);
$author = new User(3, '作者', Role::Author);

// 检查权限
echo $admin->can(Permission::SystemSettings) ? "是\n" : "否\n";  // 是
echo $editor->can(Permission::SystemSettings) ? "是\n" : "否\n"; // 否
echo $author->can(Permission::ArticleEdit) ? "是\n" : "否\n";    // 是

// 授予额外权限
$author->grantPermission(Permission::ArticlePublish);
echo $author->can(Permission::ArticlePublish) ? "是\n" : "否\n"; // 是

// 按分组显示权限
foreach (Permission::byGroup() as $group => $permissions) {
    echo "\n{$group}:\n";
    foreach ($permissions as $permission) {
        echo "  - {$permission->description()} ({$permission->value})\n";
    }
}
```

### 实际应用：表单验证

```php
<?php
// 验证规则枚举
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
     * 获取错误消息模板
     */
    public function errorMessage(string $field, mixed $param = null): string
    {
        return match ($this) {
            self::Required => "{$field} 是必填项",
            self::Email => "{$field} 必须是有效的邮箱地址",
            self::Url => "{$field} 必须是有效的 URL",
            self::MinLength => "{$field} 长度不能少于 {$param} 个字符",
            self::MaxLength => "{$field} 长度不能超过 {$param} 个字符",
            self::Min => "{$field} 不能小于 {$param}",
            self::Max => "{$field} 不能大于 {$param}",
            self::Numeric => "{$field} 必须是数字",
            self::Alpha => "{$field} 只能包含字母",
            self::AlphaNumeric => "{$field} 只能包含字母和数字",
            self::Regex => "{$field} 格式不正确",
            self::In => "{$field} 必须是以下值之一: {$param}",
            self::NotIn => "{$field} 不能是以下值: {$param}",
            self::Confirmed => "{$field} 两次输入不一致",
            self::Date => "{$field} 必须是有效日期",
            self::DateFormat => "{$field} 日期格式必须是 {$param}",
            self::Before => "{$field} 必须早于 {$param}",
            self::After => "{$field} 必须晚于 {$param}",
        };
    }

    /**
     * 验证值
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

// 验证器类
class Validator
{
    private array $errors = [];

    public function validate(array $data, array $rules): bool
    {
        $this->errors = [];

        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;

            foreach ($fieldRules as $rule) {
                // 解析规则和参数
                if (is_array($rule)) {
                    $ruleEnum = $rule[0];
                    $param = $rule[1] ?? null;
                } else {
                    $ruleEnum = $rule;
                    $param = null;
                }

                // 如果不是必填且值为空，跳过其他验证
                if ($ruleEnum !== ValidationRule::Required && ($value === null || $value === '')) {
                    continue;
                }

                // 验证
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

// 使用示例
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
    echo "验证失败:\n";
    foreach ($validator->getErrors() as $field => $errors) {
        foreach ($errors as $error) {
            echo "  - {$error}\n";
        }
    }
}
// 输出：
// 验证失败:
//   - email 必须是有效的邮箱地址
//   - password 长度不能少于 8 个字符
//   - password 两次输入不一致
//   - age 不能小于 18
```

## 最佳实践

### 使用带值枚举与数据库交互

```php
<?php
// 推荐：使用字符串值，更具可读性和可维护性
enum ArticleStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}

// 在 Entity 或 Model 中使用
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

    // 用于数据库存储
    public function toDatabase(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'status' => $this->status->value, // 存储值而非枚举
        ];
    }

    // 从数据库记录创建
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

### 封装业务逻辑到枚举方法中

```php
<?php
enum SubscriptionPlan: string
{
    case Free = 'free';
    case Basic = 'basic';
    case Pro = 'pro';
    case Enterprise = 'enterprise';

    // 将相关业务逻辑封装在枚举中
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
        // 年付享受 2 个月免费
        return $this->monthlyPrice() * 10;
    }

    public function maxProjects(): int
    {
        return match ($this) {
            self::Free => 3,
            self::Basic => 10,
            self::Pro => 50,
            self::Enterprise => PHP_INT_MAX, // 无限
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

### 使用 Trait 提供通用功能

```php
<?php
trait EnumToArray
{
    /**
     * 转换为关联数组 [value => label]
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
     * 转换为选项数组
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
     * 检查值是否有效
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

// 应用 Trait
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
            self::China => '中国',
            self::Japan => '日本',
            self::Korea => '韩国',
            self::UnitedStates => '美国',
        };
    }
}

// 使用
print_r(Country::toArray());
// ['CN' => '中国', 'JP' => '日本', 'KR' => '韩国', 'US' => '美国']

print_r(Country::toOptions());
// [['value' => 'CN', 'label' => '中国'], ...]

var_dump(Country::isValid('CN'));  // true
var_dump(Country::isValid('XX'));  // false
```

### 配合 match 表达式实现穷尽性检查

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
        // match 表达式确保处理了所有类型
        // 如果添加新的枚举值但忘记处理，会产生编译时错误
        match ($type) {
            NotificationType::Email => $this->sendEmail($message, $recipient),
            NotificationType::SMS => $this->sendSMS($message, $recipient),
            NotificationType::Push => $this->sendPush($message, $recipient),
            NotificationType::Webhook => $this->sendWebhook($message, $recipient),
        };
    }

    private function sendEmail(string $message, string $recipient): void
    {
        echo "发送邮件到 {$recipient}: {$message}\n";
    }

    private function sendSMS(string $message, string $recipient): void
    {
        echo "发送短信到 {$recipient}: {$message}\n";
    }

    private function sendPush(string $message, string $recipient): void
    {
        echo "发送推送到 {$recipient}: {$message}\n";
    }

    private function sendWebhook(string $message, string $recipient): void
    {
        echo "发送 Webhook 到 {$recipient}: {$message}\n";
    }
}
```

## 常见陷阱

### 误用纯枚举进行数据库存储

```php
<?php
// 错误：纯枚举没有持久化友好的值
enum Status
{
    case Active;
    case Inactive;
}

// 尝试存储会有问题
$status = Status::Active;
// $dbValue = $status->value; // 错误！纯枚举没有 value 属性

// 正确做法：使用带值枚举
enum StatusCorrect: string
{
    case Active = 'active';
    case Inactive = 'inactive';
}

$status = StatusCorrect::Active;
$dbValue = $status->value; // 'active' - 可以存储到数据库
```

### 在 Trait 中定义属性

```php
<?php
// 错误：Trait 中包含属性，枚举无法使用
trait HasProperties
{
    private string $description; // 枚举不支持属性

    public function getDescription(): string
    {
        return $this->description;
    }
}

// 正确做法：使用方法代替属性
trait DescribableEnum
{
    public function description(): string
    {
        // 在具体枚举中实现
        return match ($this) {
            // ...
        };
    }
}
```

### 忘记处理 tryFrom 返回 null 的情况

```php
<?php
enum UserType: string
{
    case Admin = 'admin';
    case User = 'user';
}

// 错误：没有处理 null 情况
function getUserTypeLabel(string $type): string
{
    $userType = UserType::tryFrom($type);
    return $userType->name; // 如果 $type 无效，这里会报错
}

// 正确做法：处理 null 情况
function getUserTypeLabelSafe(string $type): string
{
    $userType = UserType::tryFrom($type);

    if ($userType === null) {
        return '未知类型';
    }

    return $userType->name;
}

// 或使用 null 合并运算符
function getUserTypeLabelAlt(string $type): string
{
    return UserType::tryFrom($type)?->name ?? '未知类型';
}
```

### 混淆 name 和 value

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

// name 是枚举 case 的标识符名称
echo $method->name;  // "Get"

// value 是关联的值（仅带值枚举有）
echo $method->value; // "GET"

// 用于 API 请求时应该使用 value
$request = [
    'method' => $method->value, // 使用 "GET" 而不是 "Get"
];

// 从外部输入创建枚举时使用 from/tryFrom（基于 value）
$method = HttpMethod::from('GET');     // 正确
// $method = HttpMethod::from('Get');  // ValueError，因为 'Get' 不是有效的 value
```

### 在序列化时丢失枚举类型

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

$task = new Task('完成报告', Priority::High);

// 直接 json_encode 会丢失枚举信息
echo json_encode($task);
// {"title":"完成报告","priority":{}}  - 枚举被序列化为空对象！

// 正确做法：实现 JsonSerializable
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

$task = new TaskSerializable('完成报告', Priority::High);
echo json_encode($task);
// {"title":"完成报告","priority":3}
```

## 性能考量

### 枚举实例是单例

每个枚举 case 在内存中只存在一个实例，这意味着：

```php
<?php
enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';
}

// 多次访问同一个 case 不会创建新对象
$status1 = Status::Active;
$status2 = Status::Active;

// 它们是完全相同的对象
var_dump($status1 === $status2); // true

// 这使得枚举比较非常快（指针比较）
function isActive(Status $status): bool
{
    return $status === Status::Active; // 非常快的比较
}
```

### from() vs tryFrom() 性能

```php
<?php
enum Color: string
{
    case Red = 'red';
    case Green = 'green';
    case Blue = 'blue';
}

// from() - 在值无效时抛出异常
// 适用于：确信值有效，或希望无效时立即失败
$color = Color::from('red'); // 快速，无额外开销

// tryFrom() - 在值无效时返回 null
// 适用于：处理用户输入，需要优雅降级
$color = Color::tryFrom('invalid'); // 稍慢，需要检查并返回 null

// 性能建议：
// 1. 在内部代码中，值确定有效时使用 from()
// 2. 在处理外部输入时使用 tryFrom()
// 3. 不要在循环中重复调用 from/tryFrom，可以先验证再使用

// 优化示例
function processColors(array $colorValues): array
{
    $validColors = [];

    foreach ($colorValues as $value) {
        // 避免在循环中反复创建异常
        $color = Color::tryFrom($value);
        if ($color !== null) {
            $validColors[] = $color;
        }
    }

    return $validColors;
}
```

### cases() 方法缓存

```php
<?php
enum LargeEnum: int
{
    case Option1 = 1;
    case Option2 = 2;
    // ... 假设有很多选项
    case Option100 = 100;
}

// cases() 返回的数组在 PHP 内部被缓存
// 多次调用不会重新构建数组
$cases1 = LargeEnum::cases();
$cases2 = LargeEnum::cases(); // 返回相同的缓存数组

// 但如果需要频繁遍历，可以考虑缓存结果
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

### 枚举与 match 表达式的优化

```php
<?php
enum Operation: string
{
    case Add = 'add';
    case Subtract = 'subtract';
    case Multiply = 'multiply';
    case Divide = 'divide';
}

// match 表达式在编译时会被优化
// 对于枚举，这通常会生成跳转表，性能接近 O(1)
function calculate(float $a, float $b, Operation $op): float
{
    return match ($op) {
        Operation::Add => $a + $b,
        Operation::Subtract => $a - $b,
        Operation::Multiply => $a * $b,
        Operation::Divide => $a / $b,
    };
}

// 比使用 if-else 链更快，更易读
```

## 实战场景

### API 状态响应

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
        echo json_encode($this, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 使用示例
// ApiResponse::success(['user' => $user], '用户创建成功')->send();

// ApiResponse::error(
//     ApiResponseStatus::ValidationError,
//     '验证失败',
//     ['email' => '邮箱格式不正确']
// )->send();
```

### 配置管理

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

// 使用
$env = Environment::current();

if ($env->shouldShowErrors()) {
    ini_set('display_errors', '1');
}

$dbConfig = $env->databaseConfig();
$cacheDriver = $env->cacheDriver();
```

### 多语言支持

```php
<?php
enum Language: string
{
    case Chinese = 'zh-CN';
    case English = 'en-US';
    case Japanese = 'ja-JP';
    case Korean = 'ko-KR';

    public function name(): string
    {
        return match ($this) {
            self::Chinese => '简体中文',
            self::English => 'English',
            self::Japanese => '日本語',
            self::Korean => '한국어',
        };
    }

    public function direction(): string
    {
        return 'ltr'; // 所有支持的语言都是从左到右
    }

    public function dateFormat(): string
    {
        return match ($this) {
            self::Chinese, self::Japanese, self::Korean => 'Y年m月d日',
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
        return self::Chinese;
    }

    public static function fromAcceptHeader(string $header): self
    {
        $languages = explode(',', $header);

        foreach ($languages as $lang) {
            $code = trim(explode(';', $lang)[0]);

            // 尝试精确匹配
            $match = self::tryFrom($code);
            if ($match !== null) {
                return $match;
            }

            // 尝试匹配语言前缀
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

// 使用示例
$acceptLanguage = 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7';
$language = Language::fromAcceptHeader($acceptLanguage);

echo $language->name(); // 日本語
echo date($language->dateFormat()); // 2026年01月07日
```

## 面试要点

### 常见面试问题

**1. PHP 枚举与类常量的区别是什么？**

```php
<?php
// 类常量方式
class StatusConstants
{
    public const ACTIVE = 'active';
    public const INACTIVE = 'inactive';
}

// 枚举方式
enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';
}

// 主要区别：
// 1. 类型安全：枚举是独立类型，函数可以限制只接受 Status 类型
// 2. 单例性：每个枚举 case 是单例，可以用 === 比较
// 3. 方法支持：枚举可以有方法，封装相关业务逻辑
// 4. 接口实现：枚举可以实现接口
// 5. 反射支持：可以通过 cases() 获取所有值
// 6. IDE 支持：更好的自动补全和类型检查
```

**2. Pure Enum 和 Backed Enum 的区别？**

```php
<?php
// Pure Enum：没有关联值
enum Suit
{
    case Hearts;   // 没有 value 属性
    case Diamonds;
}

// Backed Enum：有关联的标量值
enum Color: string  // 必须指定类型：string 或 int
{
    case Red = 'red';   // 有 value 属性
    case Blue = 'blue';
}

// 区别：
// 1. Pure Enum 没有 value 属性，Backed Enum 有
// 2. Pure Enum 没有 from/tryFrom 方法
// 3. Backed Enum 必须为每个 case 指定值
// 4. Backed Enum 适合与外部系统（数据库、API）交互
```

**3. 如何从字符串创建枚举实例？**

```php
<?php
enum Priority: int
{
    case Low = 1;
    case Medium = 2;
    case High = 3;
}

// from() - 值无效时抛出 ValueError
$priority = Priority::from(2); // Priority::Medium

// tryFrom() - 值无效时返回 null
$priority = Priority::tryFrom(999); // null

// 只有 Backed Enum 才有这两个方法
```

**4. 枚举可以继承吗？**

```php
<?php
enum Base: string
{
    case A = 'a';
}

// 错误！枚举不能被继承
// enum Extended extends Base {}

// 但枚举可以实现接口
interface Labelable
{
    public function label(): string;
}

enum Status: string implements Labelable
{
    case Active = 'active';

    public function label(): string
    {
        return '活跃';
    }
}
```

**5. 枚举如何序列化？**

```php
<?php
enum Status: string
{
    case Active = 'active';
}

$status = Status::Active;

// 序列化
$serialized = serialize($status);
// O:6:"Status":0:{}

// 反序列化
$unserialized = unserialize($serialized);
var_dump($unserialized === Status::Active); // true

// JSON 序列化需要自定义
$json = json_encode($status);
// {} - 默认序列化为空对象

// 正确做法：实现 JsonSerializable 或使用 value
$json = json_encode($status->value);
// "active"
```

### 实战编码题

**题目：设计一个订单状态枚举，支持状态转换验证**

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

// 测试
$status = OrderStatus::Created;
$status = $status->transition(OrderStatus::Paid);     // OK
$status = $status->transition(OrderStatus::Shipped);  // OK
// $status = $status->transition(OrderStatus::Created); // 异常
```

## 延伸阅读

### 官方文档

- [PHP 官方文档 - 枚举](https://www.php.net/manual/zh/language.enumerations.php)
- [PHP 8.1 发布说明](https://www.php.net/releases/8.1/zh.php)
- [RFC: Enumerations](https://wiki.php.net/rfc/enumerations)

### 相关特性

- [Match 表达式](https://www.php.net/manual/zh/control-structures.match.php) - 与枚举配合使用的最佳搭档
- [属性（Attributes）](https://www.php.net/manual/zh/language.attributes.php) - 可以为枚举添加元数据
- [只读属性](https://www.php.net/manual/zh/language.oop5.properties.php#language.oop5.properties.readonly-properties) - PHP 8.1 同期引入的特性

### 最佳实践资源

- [Laravel 枚举最佳实践](https://laravel.com/docs/eloquent#enum-casting)
- [Symfony 枚举处理](https://symfony.com/doc/current/doctrine.html#enum-type)
- [PHPStan 枚举支持](https://phpstan.org/writing-php-code/phpdoc-types#enums)

### 相关工具

- **myclabs/php-enum**：PHP 8.1 之前的枚举模拟库
- **spatie/laravel-enum**：Laravel 枚举扩展
- **bensampo/laravel-enum**：另一个流行的 Laravel 枚举包

### 总结

PHP 8.1 枚举是一个强大的语言特性，它提供了：

1. **类型安全**：编译时检查，减少运行时错误
2. **代码清晰**：自文档化，减少魔术字符串
3. **功能丰富**：支持方法、Trait、接口实现
4. **性能优秀**：单例模式，比较操作高效
5. **互操作性**：通过 from/tryFrom 与外部数据交互

掌握枚举的使用，能够显著提升代码质量和可维护性。在实际项目中，建议：

- 用枚举替代状态常量
- 在枚举中封装相关业务逻辑
- 配合 match 表达式实现穷尽性检查
- 使用带值枚举与数据库、API 交互
