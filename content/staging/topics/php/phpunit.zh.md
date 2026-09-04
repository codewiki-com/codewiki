---
title: PHPUnit 单元测试
description: 深入掌握 PHPUnit 测试框架的核心概念、断言方法、数据提供者、Mock 对象与测试替身
track: php
section: tooling
difficulty: intermediate
tags:
  - PHPUnit
  - 单元测试
  - TDD
  - Mock
  - 测试替身
status: imported
origin: old/src/content/docs/php/phpunit.zh.md
divergence: 0.199
issues: []
legacy:
  category: PHP
  subcategory: 测试
  order: 20
  lastUpdated: 2026-01-07
---

## 概念解释

PHPUnit 是 PHP 生态系统中最广泛使用的单元测试框架,由 Sebastian Bergmann 创建并维护。它遵循 xUnit 架构,为 PHP 开发者提供了一套完整的测试工具,帮助确保代码质量和可靠性。

### 什么是单元测试?

单元测试是一种软件测试方法,通过测试代码的最小可测试单元(通常是函数或方法)来验证其行为是否符合预期。单元测试的核心理念包括:

- **隔离性**: 每个测试应该独立运行,不依赖其他测试的执行结果
- **可重复性**: 测试在任何环境下都应该产生相同的结果
- **自动化**: 测试可以自动执行,无需人工干预
- **快速反馈**: 测试执行速度快,能够快速发现问题

### PHPUnit 的历史与发展

PHPUnit 诞生于 2004 年,灵感来源于 Java 的 JUnit 框架。经过多年发展,PHPUnit 已成为 PHP 社区的事实标准测试框架。主要版本演进:

- PHPUnit 9.x: 支持 PHP 7.3+,引入了新的断言方法
- PHPUnit 10.x: 支持 PHP 8.1+,重构了事件系统
- PHPUnit 11.x: 支持 PHP 8.2+,进一步现代化

### 为什么需要单元测试?

单元测试解决了以下问题:

- **回归测试**: 确保新代码不会破坏现有功能
- **文档作用**: 测试用例展示了代码的预期使用方式
- **设计改进**: 编写测试促使开发者思考接口设计
- **重构信心**: 有测试覆盖的代码可以放心重构
- **持续集成**: 自动化测试是 CI/CD 的基础

## 核心原理

### 测试生命周期

PHPUnit 测试遵循特定的生命周期:

```
setUpBeforeClass() → setUp() → 测试方法 → tearDown() → tearDownAfterClass()
```

```php
<?php
use PHPUnit\Framework\TestCase;

class LifecycleTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        // 在所有测试方法之前执行一次
        // 适合初始化数据库连接、加载配置等
        echo "测试类开始\n";
    }

    protected function setUp(): void
    {
        // 在每个测试方法之前执行
        // 适合初始化测试对象、重置状态等
        echo "测试方法开始\n";
    }

    public function testExample(): void
    {
        echo "执行测试\n";
        $this->assertTrue(true);
    }

    protected function tearDown(): void
    {
        // 在每个测试方法之后执行
        // 适合清理资源、重置状态等
        echo "测试方法结束\n";
    }

    public static function tearDownAfterClass(): void
    {
        // 在所有测试方法之后执行一次
        // 适合关闭连接、清理临时文件等
        echo "测试类结束\n";
    }
}
```

### 断言机制原理

PHPUnit 的断言是基于条件判断的验证机制。当断言失败时,会抛出 `AssertionFailedError` 异常,测试框架捕获该异常并标记测试失败。

```php
<?php
// 断言的基本工作原理
class AssertionMechanism
{
    public function assertEquals($expected, $actual, string $message = ''): void
    {
        if ($expected !== $actual) {
            throw new AssertionFailedError(
                $message ?: "断言失败: 预期 $expected, 实际 $actual"
            );
        }
    }
}
```

### 测试隔离原理

PHPUnit 通过以下机制确保测试隔离:

1. **独立进程**: 可配置每个测试在独立进程中运行
2. **状态重置**: 每次测试前后执行 setUp/tearDown
3. **全局状态备份**: 可选择备份和恢复全局变量
4. **Mock 对象**: 使用测试替身隔离外部依赖

## 核心要点

### 安装与配置

通过 Composer 安装 PHPUnit:

```bash
# 安装为开发依赖
composer require --dev phpunit/phpunit

# 查看版本
./vendor/bin/phpunit --version
```

创建配置文件 `phpunit.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
         verbose="true"
         stopOnFailure="false">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
    </testsuites>
    <coverage>
        <include>
            <directory suffix=".php">src</directory>
        </include>
    </coverage>
</phpunit>
```

### 测试用例结构

一个标准的测试类结构:

```php
<?php
namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Calculator;

class CalculatorTest extends TestCase
{
    private Calculator $calculator;

    protected function setUp(): void
    {
        $this->calculator = new Calculator();
    }

    /**
     * @test
     */
    public function it_can_add_two_numbers(): void
    {
        $result = $this->calculator->add(2, 3);

        $this->assertEquals(5, $result);
    }

    public function testSubtraction(): void
    {
        $result = $this->calculator->subtract(10, 4);

        $this->assertEquals(6, $result);
    }
}
```

### 测试命名规范

PHPUnit 识别测试方法的两种方式:

1. **方法名前缀**: 方法名以 `test` 开头
2. **注解方式**: 使用 `@test` 注解或 PHP 8 属性

```php
<?php
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

class NamingConventionTest extends TestCase
{
    // 方式1: test 前缀
    public function testUserCanBeCreated(): void
    {
        $this->assertTrue(true);
    }

    // 方式2: @test 注解
    /**
     * @test
     */
    public function user_can_be_deleted(): void
    {
        $this->assertTrue(true);
    }

    // 方式3: PHP 8 属性 (PHPUnit 10+)
    #[Test]
    public function userCanBeUpdated(): void
    {
        $this->assertTrue(true);
    }
}
```

## 代码示例

### 基本断言方法

```php
<?php
use PHPUnit\Framework\TestCase;

class AssertionsTest extends TestCase
{
    // ==================== 相等性断言 ====================

    public function testEquality(): void
    {
        // assertEquals - 比较值是否相等 (使用 ==)
        $this->assertEquals(5, '5');  // 通过,类型转换后相等

        // assertSame - 严格比较 (使用 ===)
        $this->assertSame(5, 5);      // 通过
        // $this->assertSame(5, '5'); // 失败,类型不同

        // assertNotEquals / assertNotSame
        $this->assertNotEquals(5, 10);
        $this->assertNotSame(5, '5');
    }

    // ==================== 布尔断言 ====================

    public function testBoolean(): void
    {
        $isValid = true;
        $isEmpty = false;

        $this->assertTrue($isValid);
        $this->assertFalse($isEmpty);

        // 判断表达式结果
        $this->assertTrue(1 + 1 === 2);
        $this->assertFalse(1 > 2);
    }

    // ==================== 空值断言 ====================

    public function testNull(): void
    {
        $nullValue = null;
        $emptyString = '';
        $emptyArray = [];

        $this->assertNull($nullValue);
        $this->assertNotNull($emptyString);

        $this->assertEmpty($emptyString);
        $this->assertEmpty($emptyArray);
        $this->assertNotEmpty(['item']);
    }

    // ==================== 数组断言 ====================

    public function testArrays(): void
    {
        $fruits = ['apple', 'banana', 'orange'];
        $user = ['name' => 'John', 'age' => 30, 'email' => 'john@example.com'];

        // 检查数组是否包含某个值
        $this->assertContains('banana', $fruits);
        $this->assertNotContains('grape', $fruits);

        // 检查数组是否有某个键
        $this->assertArrayHasKey('name', $user);
        $this->assertArrayNotHasKey('password', $user);

        // 检查数组元素数量
        $this->assertCount(3, $fruits);

        // 检查是否为数组
        $this->assertIsArray($fruits);
    }

    // ==================== 类型断言 ====================

    public function testTypes(): void
    {
        $this->assertIsInt(42);
        $this->assertIsFloat(3.14);
        $this->assertIsString('hello');
        $this->assertIsBool(true);
        $this->assertIsArray([1, 2, 3]);
        $this->assertIsObject(new stdClass());
        $this->assertIsCallable(function() {});
        $this->assertIsNumeric('123');
    }

    // ==================== 字符串断言 ====================

    public function testStrings(): void
    {
        $message = 'Hello, World!';

        // 字符串包含
        $this->assertStringContainsString('World', $message);
        $this->assertStringNotContainsString('Goodbye', $message);

        // 字符串开头结尾
        $this->assertStringStartsWith('Hello', $message);
        $this->assertStringEndsWith('!', $message);

        // 正则匹配
        $this->assertMatchesRegularExpression('/^Hello/', $message);
        $this->assertDoesNotMatchRegularExpression('/^\d+/', $message);
    }

    // ==================== 对象断言 ====================

    public function testObjects(): void
    {
        $user = new class {
            public string $name = 'John';
            public int $age = 30;
        };

        // 检查实例类型
        $this->assertInstanceOf(stdClass::class, new stdClass());

        // 检查对象属性
        $this->assertObjectHasProperty('name', $user);
        $this->assertObjectNotHasProperty('email', $user);
    }

    // ==================== 异常断言 ====================

    public function testExceptions(): void
    {
        // 期望抛出特定异常
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid value');
        $this->expectExceptionCode(100);

        throw new InvalidArgumentException('Invalid value', 100);
    }

    public function testExceptionWithCallback(): void
    {
        $exception = null;

        try {
            throw new RuntimeException('Something went wrong');
        } catch (RuntimeException $e) {
            $exception = $e;
        }

        $this->assertInstanceOf(RuntimeException::class, $exception);
        $this->assertStringContainsString('wrong', $exception->getMessage());
    }

    // ==================== 文件断言 ====================

    public function testFiles(): void
    {
        $existingFile = __FILE__;
        $nonExistentFile = '/path/to/nonexistent.txt';

        $this->assertFileExists($existingFile);
        $this->assertFileDoesNotExist($nonExistentFile);
        $this->assertFileIsReadable($existingFile);
    }

    // ==================== JSON 断言 ====================

    public function testJson(): void
    {
        $json = '{"name": "John", "age": 30}';

        $this->assertJson($json);

        $expectedJson = '{"name": "John", "age": 30}';
        $this->assertJsonStringEqualsJsonString($expectedJson, $json);
    }
}
```

### 数据提供者 (Data Providers)

数据提供者允许使用不同的数据集运行同一个测试:

```php
<?php
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;

class DataProviderTest extends TestCase
{
    // ==================== 基本数据提供者 ====================

    /**
     * @dataProvider additionProvider
     */
    public function testAddition(int $a, int $b, int $expected): void
    {
        $calculator = new Calculator();
        $this->assertEquals($expected, $calculator->add($a, $b));
    }

    public static function additionProvider(): array
    {
        return [
            'positive numbers' => [1, 2, 3],
            'negative numbers' => [-1, -2, -3],
            'mixed numbers' => [-1, 2, 1],
            'zeros' => [0, 0, 0],
            'large numbers' => [1000000, 2000000, 3000000],
        ];
    }

    // ==================== PHP 8 属性语法 ====================

    #[DataProvider('multiplicationProvider')]
    public function testMultiplication(int $a, int $b, int $expected): void
    {
        $this->assertEquals($expected, $a * $b);
    }

    public static function multiplicationProvider(): array
    {
        return [
            [2, 3, 6],
            [5, 5, 25],
            [0, 100, 0],
            [-2, 3, -6],
        ];
    }

    // ==================== 生成器数据提供者 ====================

    /**
     * @dataProvider rangeProvider
     */
    public function testSquare(int $number): void
    {
        $this->assertEquals($number * $number, pow($number, 2));
    }

    public static function rangeProvider(): \Generator
    {
        for ($i = 1; $i <= 10; $i++) {
            yield "number $i" => [$i];
        }
    }

    // ==================== 复杂数据结构 ====================

    /**
     * @dataProvider userValidationProvider
     */
    public function testUserValidation(array $userData, bool $expectedValid, string $expectedError = ''): void
    {
        $validator = new UserValidator();
        $result = $validator->validate($userData);

        $this->assertEquals($expectedValid, $result->isValid());
        if (!$expectedValid) {
            $this->assertStringContainsString($expectedError, $result->getErrorMessage());
        }
    }

    public static function userValidationProvider(): array
    {
        return [
            'valid user' => [
                ['name' => 'John', 'email' => 'john@example.com', 'age' => 25],
                true
            ],
            'missing name' => [
                ['email' => 'john@example.com', 'age' => 25],
                false,
                'name is required'
            ],
            'invalid email' => [
                ['name' => 'John', 'email' => 'invalid-email', 'age' => 25],
                false,
                'email is invalid'
            ],
            'underage user' => [
                ['name' => 'John', 'email' => 'john@example.com', 'age' => 15],
                false,
                'must be 18 or older'
            ],
        ];
    }

    // ==================== 多个数据提供者组合 ====================

    /**
     * @dataProvider operandProvider
     * @dataProvider negativeOperandProvider
     */
    public function testAbsoluteValue(int $input, int $expected): void
    {
        $this->assertEquals($expected, abs($input));
    }

    public static function operandProvider(): array
    {
        return [
            [1, 1],
            [5, 5],
            [0, 0],
        ];
    }

    public static function negativeOperandProvider(): array
    {
        return [
            [-1, 1],
            [-5, 5],
            [-100, 100],
        ];
    }
}
```

### Mock 对象与测试替身

Mock 对象用于隔离被测试代码与外部依赖:

```php
<?php
use PHPUnit\Framework\TestCase;

// 假设的接口和类
interface PaymentGatewayInterface
{
    public function charge(float $amount, string $currency): bool;
    public function refund(string $transactionId): bool;
    public function getBalance(): float;
}

interface EmailServiceInterface
{
    public function send(string $to, string $subject, string $body): bool;
}

class OrderService
{
    public function __construct(
        private PaymentGatewayInterface $paymentGateway,
        private EmailServiceInterface $emailService
    ) {}

    public function processOrder(array $order): array
    {
        $total = $order['total'];

        // 处理支付
        $paymentResult = $this->paymentGateway->charge($total, 'CNY');

        if (!$paymentResult) {
            return ['success' => false, 'error' => '支付失败'];
        }

        // 发送确认邮件
        $this->emailService->send(
            $order['email'],
            '订单确认',
            "您的订单已成功处理,金额: ¥{$total}"
        );

        return ['success' => true, 'orderId' => uniqid('ORD_')];
    }
}

class MockTest extends TestCase
{
    // ==================== 基本 Mock 创建 ====================

    public function testBasicMock(): void
    {
        // 创建 Mock 对象
        $paymentGateway = $this->createMock(PaymentGatewayInterface::class);

        // 配置 Mock 行为
        $paymentGateway->method('charge')
            ->willReturn(true);

        // 使用 Mock
        $result = $paymentGateway->charge(100.00, 'CNY');
        $this->assertTrue($result);
    }

    // ==================== 期望方法调用 ====================

    public function testExpectMethodCall(): void
    {
        $emailService = $this->createMock(EmailServiceInterface::class);

        // 期望 send 方法被调用一次
        $emailService->expects($this->once())
            ->method('send')
            ->with(
                $this->equalTo('user@example.com'),
                $this->equalTo('订单确认'),
                $this->stringContains('订单已成功')
            )
            ->willReturn(true);

        // 实际调用
        $result = $emailService->send(
            'user@example.com',
            '订单确认',
            '您的订单已成功处理'
        );

        $this->assertTrue($result);
    }

    // ==================== 方法调用次数验证 ====================

    public function testMethodCallCount(): void
    {
        $mock = $this->createMock(PaymentGatewayInterface::class);

        // never - 从不调用
        // once - 调用一次
        // exactly(n) - 调用 n 次
        // atLeast(n) - 至少调用 n 次
        // atMost(n) - 最多调用 n 次
        // any - 任意次数

        $mock->expects($this->exactly(3))
            ->method('getBalance')
            ->willReturn(1000.00);

        // 调用三次
        $mock->getBalance();
        $mock->getBalance();
        $mock->getBalance();
    }

    // ==================== 根据参数返回不同值 ====================

    public function testReturnValueMap(): void
    {
        $mock = $this->createMock(PaymentGatewayInterface::class);

        // 使用 returnValueMap
        $mock->method('charge')
            ->willReturnMap([
                [100.00, 'CNY', true],
                [200.00, 'CNY', true],
                [1000000.00, 'CNY', false], // 大额支付失败
            ]);

        $this->assertTrue($mock->charge(100.00, 'CNY'));
        $this->assertTrue($mock->charge(200.00, 'CNY'));
        $this->assertFalse($mock->charge(1000000.00, 'CNY'));
    }

    // ==================== 使用回调返回值 ====================

    public function testReturnCallback(): void
    {
        $mock = $this->createMock(PaymentGatewayInterface::class);

        $mock->method('charge')
            ->willReturnCallback(function (float $amount, string $currency): bool {
                // 模拟业务逻辑: 金额超过 10000 则失败
                return $amount <= 10000;
            });

        $this->assertTrue($mock->charge(5000, 'CNY'));
        $this->assertFalse($mock->charge(15000, 'CNY'));
    }

    // ==================== 连续返回不同值 ====================

    public function testConsecutiveReturns(): void
    {
        $mock = $this->createMock(PaymentGatewayInterface::class);

        $mock->method('getBalance')
            ->willReturnOnConsecutiveCalls(1000.00, 900.00, 800.00);

        $this->assertEquals(1000.00, $mock->getBalance());
        $this->assertEquals(900.00, $mock->getBalance());
        $this->assertEquals(800.00, $mock->getBalance());
    }

    // ==================== 抛出异常 ====================

    public function testThrowException(): void
    {
        $mock = $this->createMock(PaymentGatewayInterface::class);

        $mock->method('charge')
            ->willThrowException(new \RuntimeException('支付网关连接失败'));

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('支付网关连接失败');

        $mock->charge(100.00, 'CNY');
    }

    // ==================== 完整集成测试示例 ====================

    public function testOrderProcessingSuccess(): void
    {
        // 创建 Mock
        $paymentGateway = $this->createMock(PaymentGatewayInterface::class);
        $emailService = $this->createMock(EmailServiceInterface::class);

        // 配置支付网关 Mock
        $paymentGateway->expects($this->once())
            ->method('charge')
            ->with(299.99, 'CNY')
            ->willReturn(true);

        // 配置邮件服务 Mock
        $emailService->expects($this->once())
            ->method('send')
            ->with(
                'customer@example.com',
                '订单确认',
                $this->stringContains('299.99')
            )
            ->willReturn(true);

        // 测试订单服务
        $orderService = new OrderService($paymentGateway, $emailService);
        $result = $orderService->processOrder([
            'total' => 299.99,
            'email' => 'customer@example.com'
        ]);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('orderId', $result);
    }

    public function testOrderProcessingPaymentFailure(): void
    {
        $paymentGateway = $this->createMock(PaymentGatewayInterface::class);
        $emailService = $this->createMock(EmailServiceInterface::class);

        // 模拟支付失败
        $paymentGateway->method('charge')->willReturn(false);

        // 邮件不应该被发送
        $emailService->expects($this->never())->method('send');

        $orderService = new OrderService($paymentGateway, $emailService);
        $result = $orderService->processOrder([
            'total' => 999.99,
            'email' => 'customer@example.com'
        ]);

        $this->assertFalse($result['success']);
        $this->assertEquals('支付失败', $result['error']);
    }
}
```

### 测试替身类型

PHPUnit 提供多种测试替身:

```php
<?php
use PHPUnit\Framework\TestCase;

interface LoggerInterface
{
    public function log(string $level, string $message): void;
}

class TestDoubleTypesTest extends TestCase
{
    // ==================== Dummy (空对象) ====================
    // 用于填充参数,不关心其行为

    public function testDummy(): void
    {
        // Dummy 对象只是占位符
        $logger = $this->createMock(LoggerInterface::class);

        // 不配置任何行为,只是传入构造函数
        $service = new SomeService($logger);

        // 测试不涉及 logger 的方法
        $this->assertInstanceOf(SomeService::class, $service);
    }

    // ==================== Stub (桩对象) ====================
    // 提供预设的返回值

    public function testStub(): void
    {
        $repository = $this->createStub(UserRepository::class);

        // Stub 只关注返回值,不验证调用
        $repository->method('find')
            ->willReturn(new User(1, 'John'));

        $user = $repository->find(1);
        $this->assertEquals('John', $user->getName());
    }

    // ==================== Mock (模拟对象) ====================
    // 可以验证方法调用和参数

    public function testMock(): void
    {
        $logger = $this->createMock(LoggerInterface::class);

        // Mock 可以验证调用
        $logger->expects($this->once())
            ->method('log')
            ->with('error', '发生错误');

        // 触发调用
        $logger->log('error', '发生错误');
    }

    // ==================== Spy (间谍对象) ====================
    // 真实对象的包装器,记录调用

    public function testSpy(): void
    {
        // 使用 MockBuilder 创建部分 Mock
        $calculator = $this->getMockBuilder(Calculator::class)
            ->onlyMethods(['log']) // 只 Mock log 方法
            ->getMock();

        $calculator->method('log')->willReturn(null);

        // add 方法使用真实实现
        $result = $calculator->add(2, 3);
        $this->assertEquals(5, $result);
    }

    // ==================== Fake (伪对象) ====================
    // 简化的工作实现

    public function testFake(): void
    {
        // 创建一个假的内存存储库
        $repository = new InMemoryUserRepository();

        // 使用假对象进行测试
        $repository->save(new User(1, 'John'));
        $user = $repository->find(1);

        $this->assertEquals('John', $user->getName());
    }
}

// Fake 实现示例
class InMemoryUserRepository implements UserRepositoryInterface
{
    private array $users = [];

    public function save(User $user): void
    {
        $this->users[$user->getId()] = $user;
    }

    public function find(int $id): ?User
    {
        return $this->users[$id] ?? null;
    }

    public function findAll(): array
    {
        return array_values($this->users);
    }
}
```

### 测试私有方法和属性

```php
<?php
use PHPUnit\Framework\TestCase;

class PrivateAccessTest extends TestCase
{
    // ==================== 使用反射访问私有方法 ====================

    public function testPrivateMethod(): void
    {
        $calculator = new Calculator();

        // 获取私有方法
        $reflection = new \ReflectionClass($calculator);
        $method = $reflection->getMethod('calculateTax');
        $method->setAccessible(true);

        // 调用私有方法
        $result = $method->invokeArgs($calculator, [100.0, 0.1]);

        $this->assertEquals(10.0, $result);
    }

    // ==================== 使用反射访问私有属性 ====================

    public function testPrivateProperty(): void
    {
        $user = new User(1, 'John');

        $reflection = new \ReflectionClass($user);
        $property = $reflection->getProperty('secretKey');
        $property->setAccessible(true);

        // 读取私有属性
        $value = $property->getValue($user);
        $this->assertNotEmpty($value);

        // 设置私有属性
        $property->setValue($user, 'new-secret');
        $this->assertEquals('new-secret', $property->getValue($user));
    }

    // ==================== 推荐: 测试公共行为 ====================

    public function testPublicBehaviorInsteadOfPrivate(): void
    {
        // 更好的做法: 通过公共接口测试
        $calculator = new Calculator();

        // 不直接测试 calculateTax,而是测试使用它的公共方法
        $result = $calculator->calculateTotal(100.0);

        // 验证最终结果包含税费计算
        $this->assertEquals(110.0, $result);
    }
}
```

### 测试异常和错误

```php
<?php
use PHPUnit\Framework\TestCase;

class ExceptionTest extends TestCase
{
    // ==================== 基本异常测试 ====================

    public function testThrowsException(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $calculator = new Calculator();
        $calculator->divide(10, 0);
    }

    // ==================== 验证异常消息 ====================

    public function testExceptionMessage(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('除数不能为零');

        $calculator = new Calculator();
        $calculator->divide(10, 0);
    }

    // ==================== 验证异常消息正则 ====================

    public function testExceptionMessageRegex(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/用户 \d+ 不存在/');

        $userService = new UserService();
        $userService->getUser(999);
    }

    // ==================== 验证异常代码 ====================

    public function testExceptionCode(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);

        throw new \DomainException('未找到资源', 404);
    }

    // ==================== 使用回调验证异常 ====================

    public function testExceptionWithCallback(): void
    {
        try {
            $userService = new UserService();
            $userService->createUser(['name' => '']);
            $this->fail('应该抛出异常');
        } catch (\InvalidArgumentException $e) {
            $this->assertStringContainsString('name', $e->getMessage());
            $this->assertGreaterThan(0, $e->getCode());
        }
    }

    // ==================== 测试不抛出异常 ====================

    public function testNoExceptionThrown(): void
    {
        $calculator = new Calculator();

        // 期望不抛出异常
        $result = $calculator->divide(10, 2);

        $this->assertEquals(5, $result);
        // 如果执行到这里,说明没有异常
    }

    // ==================== 测试 PHP 错误 ====================

    public function testTriggersError(): void
    {
        $this->expectWarning();
        $this->expectWarningMessage('Division by zero');

        // PHP 8+ 会抛出 DivisionByZeroError
        // PHP 7 会触发 warning
        $result = 1 / 0;
    }

    // ==================== 测试弃用警告 ====================

    public function testDeprecation(): void
    {
        $this->expectDeprecation();
        $this->expectDeprecationMessage('此方法已弃用');

        $service = new LegacyService();
        $service->deprecatedMethod();
    }
}
```

## 最佳实践

### 测试命名与组织

```php
<?php
use PHPUnit\Framework\TestCase;

/**
 * 最佳实践: 测试命名清晰表达意图
 */
class UserServiceTest extends TestCase
{
    // 好的命名: 描述行为和预期结果
    public function testCreateUserWithValidDataReturnsUser(): void
    {
        // ...
    }

    public function testCreateUserWithInvalidEmailThrowsException(): void
    {
        // ...
    }

    public function testDeleteUserWhenUserExistsReturnsTrue(): void
    {
        // ...
    }

    public function testDeleteUserWhenUserNotFoundReturnsFalse(): void
    {
        // ...
    }

    // 使用下划线分隔的 BDD 风格
    /**
     * @test
     */
    public function it_should_send_welcome_email_after_registration(): void
    {
        // ...
    }

    /**
     * @test
     */
    public function it_should_hash_password_before_saving(): void
    {
        // ...
    }
}
```

### AAA 模式 (Arrange-Act-Assert)

```php
<?php
use PHPUnit\Framework\TestCase;

class AAAPatternTest extends TestCase
{
    public function testUserRegistration(): void
    {
        // ========== Arrange (准备) ==========
        $userRepository = $this->createMock(UserRepositoryInterface::class);
        $emailService = $this->createMock(EmailServiceInterface::class);

        $userRepository->method('save')->willReturn(true);
        $emailService->method('send')->willReturn(true);

        $registrationService = new RegistrationService($userRepository, $emailService);

        $userData = [
            'name' => '张三',
            'email' => 'zhangsan@example.com',
            'password' => 'secure123'
        ];

        // ========== Act (执行) ==========
        $result = $registrationService->register($userData);

        // ========== Assert (断言) ==========
        $this->assertTrue($result->isSuccess());
        $this->assertNotNull($result->getUser());
        $this->assertEquals('张三', $result->getUser()->getName());
    }

    public function testCalculateOrderTotal(): void
    {
        // Arrange
        $order = new Order();
        $order->addItem(new OrderItem('商品A', 100, 2));
        $order->addItem(new OrderItem('商品B', 50, 3));

        $calculator = new OrderCalculator();

        // Act
        $total = $calculator->calculateTotal($order);

        // Assert
        $this->assertEquals(350, $total);
    }
}
```

### 测试边界条件

```php
<?php
use PHPUnit\Framework\TestCase;

class BoundaryTest extends TestCase
{
    private Paginator $paginator;

    protected function setUp(): void
    {
        $this->paginator = new Paginator(totalItems: 100, itemsPerPage: 10);
    }

    // ========== 边界值测试 ==========

    public function testFirstPage(): void
    {
        $page = $this->paginator->getPage(1);

        $this->assertEquals(1, $page->getCurrentPage());
        $this->assertFalse($page->hasPreviousPage());
        $this->assertTrue($page->hasNextPage());
    }

    public function testLastPage(): void
    {
        $page = $this->paginator->getPage(10);

        $this->assertEquals(10, $page->getCurrentPage());
        $this->assertTrue($page->hasPreviousPage());
        $this->assertFalse($page->hasNextPage());
    }

    public function testPageZeroThrowsException(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->paginator->getPage(0);
    }

    public function testNegativePageThrowsException(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->paginator->getPage(-1);
    }

    public function testPageBeyondTotalThrowsException(): void
    {
        $this->expectException(\OutOfRangeException::class);
        $this->paginator->getPage(11);
    }

    // ========== 空值和空集合测试 ==========

    public function testEmptyCollection(): void
    {
        $paginator = new Paginator(totalItems: 0, itemsPerPage: 10);

        $this->assertEquals(0, $paginator->getTotalPages());
        $this->assertEmpty($paginator->getPage(1)->getItems());
    }

    // ========== 极端值测试 ==========

    public function testSingleItemPage(): void
    {
        $paginator = new Paginator(totalItems: 1, itemsPerPage: 10);

        $this->assertEquals(1, $paginator->getTotalPages());
    }

    public function testExactPageBoundary(): void
    {
        $paginator = new Paginator(totalItems: 10, itemsPerPage: 10);

        $this->assertEquals(1, $paginator->getTotalPages());
    }

    public function testOneOverPageBoundary(): void
    {
        $paginator = new Paginator(totalItems: 11, itemsPerPage: 10);

        $this->assertEquals(2, $paginator->getTotalPages());
    }
}
```

### 测试代码覆盖率

```bash
# 生成代码覆盖率报告
./vendor/bin/phpunit --coverage-html coverage/

# 生成文本报告
./vendor/bin/phpunit --coverage-text

# 设置最低覆盖率要求
./vendor/bin/phpunit --coverage-text --coverage-min=80
```

配置 `phpunit.xml` 覆盖率:

```xml
<phpunit>
    <coverage>
        <include>
            <directory suffix=".php">src</directory>
        </include>
        <exclude>
            <directory>src/Migrations</directory>
            <file>src/Kernel.php</file>
        </exclude>
        <report>
            <html outputDirectory="coverage"/>
            <text outputFile="coverage.txt"/>
            <clover outputFile="coverage.xml"/>
        </report>
    </coverage>
</phpunit>
```

## 常见陷阱

### 测试实现而非行为

```php
<?php
// 错误: 过度关注实现细节
public function testUserCreationBadExample(): void
{
    $repository = $this->createMock(UserRepository::class);

    // 过度验证内部调用顺序
    $repository->expects($this->at(0))->method('beginTransaction');
    $repository->expects($this->at(1))->method('insert');
    $repository->expects($this->at(2))->method('commit');

    // 如果实现改变,测试就会失败
}

// 正确: 关注行为和结果
public function testUserCreationGoodExample(): void
{
    $repository = $this->createMock(UserRepository::class);
    $repository->method('save')->willReturn(true);

    $service = new UserService($repository);
    $user = $service->createUser(['name' => 'John']);

    // 只验证结果,不关心内部实现
    $this->assertInstanceOf(User::class, $user);
    $this->assertEquals('John', $user->getName());
}
```

### 测试之间的依赖

```php
<?php
// 错误: 测试依赖共享状态
class BadTestDependencyTest extends TestCase
{
    private static $user; // 静态共享状态

    public function testCreateUser(): void
    {
        self::$user = new User(1, 'John');
        $this->assertNotNull(self::$user);
    }

    public function testDeleteUser(): void
    {
        // 依赖上一个测试创建的用户
        $this->assertNotNull(self::$user); // 如果上个测试失败,这里也会失败
    }
}

// 正确: 每个测试独立
class GoodTestIndependenceTest extends TestCase
{
    public function testCreateUser(): void
    {
        $user = new User(1, 'John');
        $this->assertNotNull($user);
    }

    public function testDeleteUser(): void
    {
        // 自己创建所需的测试数据
        $user = new User(1, 'John');
        $service = new UserService();

        $result = $service->delete($user);
        $this->assertTrue($result);
    }
}
```

### 过度 Mock

```php
<?php
// 错误: Mock 太多导致测试脆弱且无意义
public function testTooMuchMocking(): void
{
    $user = $this->createMock(User::class);
    $user->method('getName')->willReturn('John');
    $user->method('getEmail')->willReturn('john@example.com');
    $user->method('isActive')->willReturn(true);

    // 基本上在测试 Mock 的行为,而不是真实代码
    $this->assertEquals('John', $user->getName());
}

// 正确: 只 Mock 外部依赖
public function testOnlyMockExternalDependencies(): void
{
    // 使用真实的值对象
    $user = new User(1, 'John', 'john@example.com');

    // 只 Mock 外部服务
    $emailService = $this->createMock(EmailServiceInterface::class);
    $emailService->expects($this->once())
        ->method('send')
        ->willReturn(true);

    $notificationService = new NotificationService($emailService);
    $result = $notificationService->notifyUser($user, 'Welcome!');

    $this->assertTrue($result);
}
```

### 忽略测试清理

```php
<?php
// 错误: 测试后不清理
class NoCleanupTest extends TestCase
{
    public function testFileCreation(): void
    {
        file_put_contents('/tmp/test.txt', 'test data');
        // 测试完成但文件仍然存在
        $this->assertFileExists('/tmp/test.txt');
    }
}

// 正确: 使用 tearDown 清理
class ProperCleanupTest extends TestCase
{
    private string $testFile = '/tmp/test.txt';

    protected function tearDown(): void
    {
        if (file_exists($this->testFile)) {
            unlink($this->testFile);
        }
    }

    public function testFileCreation(): void
    {
        file_put_contents($this->testFile, 'test data');
        $this->assertFileExists($this->testFile);
    }
}
```

### 测试中的时间依赖

```php
<?php
// 错误: 直接依赖当前时间
class TimeDependentBadTest extends TestCase
{
    public function testTokenExpiration(): void
    {
        $token = new Token();
        // 这个测试可能因为执行时机不同而失败
        $this->assertFalse($token->isExpired());

        sleep(2); // 等待过期
        $this->assertTrue($token->isExpired());
    }
}

// 正确: 注入时间依赖
class TimeDependentGoodTest extends TestCase
{
    public function testTokenNotExpired(): void
    {
        $clock = $this->createMock(ClockInterface::class);
        $clock->method('now')->willReturn(new \DateTimeImmutable('2024-01-01 12:00:00'));

        $token = new Token($clock);
        $token->setExpiresAt(new \DateTimeImmutable('2024-01-01 13:00:00'));

        $this->assertFalse($token->isExpired());
    }

    public function testTokenExpired(): void
    {
        $clock = $this->createMock(ClockInterface::class);
        $clock->method('now')->willReturn(new \DateTimeImmutable('2024-01-01 14:00:00'));

        $token = new Token($clock);
        $token->setExpiresAt(new \DateTimeImmutable('2024-01-01 13:00:00'));

        $this->assertTrue($token->isExpired());
    }
}
```

## 性能考量

### 测试执行优化

```php
<?php
use PHPUnit\Framework\TestCase;

class PerformanceOptimizedTest extends TestCase
{
    // 使用 setUpBeforeClass 初始化昂贵资源
    private static ?\PDO $pdo = null;

    public static function setUpBeforeClass(): void
    {
        // 只创建一次数据库连接
        self::$pdo = new \PDO('sqlite::memory:');
        self::$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    }

    public static function tearDownAfterClass(): void
    {
        self::$pdo = null;
    }

    protected function setUp(): void
    {
        // 每个测试前清空数据,而不是重建连接
        self::$pdo->exec('DELETE FROM users');
    }

    public function testInsertUser(): void
    {
        self::$pdo->exec("INSERT INTO users (name) VALUES ('John')");

        $count = self::$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        $this->assertEquals(1, $count);
    }
}
```

### 使用数据提供者替代循环

```php
<?php
// 不好: 循环中的多个断言
public function testMultipleInputsBad(): void
{
    $inputs = [1, 2, 3, 4, 5];
    foreach ($inputs as $input) {
        $result = $this->calculator->square($input);
        $this->assertEquals($input * $input, $result);
    }
    // 如果第一个失败,后面的都不会执行
}

// 好: 使用数据提供者
/**
 * @dataProvider squareProvider
 */
public function testSquareGood(int $input, int $expected): void
{
    $result = $this->calculator->square($input);
    $this->assertEquals($expected, $result);
}

public static function squareProvider(): array
{
    return [
        [1, 1],
        [2, 4],
        [3, 9],
        [4, 16],
        [5, 25],
    ];
}
```

### 并行测试执行

```xml
<!-- phpunit.xml -->
<phpunit>
    <!-- PHPUnit 10+ 支持并行执行 -->
    <coverage>
        <!-- ... -->
    </coverage>
</phpunit>
```

```bash
# 使用 paratest 并行运行
composer require --dev brianium/paratest
./vendor/bin/paratest -p 4 # 4 个进程并行

# 或使用 phpunit 内置并行 (PHPUnit 10+)
./vendor/bin/phpunit --process-isolation
```

### 使用内存数据库

```php
<?php
// 使用 SQLite 内存数据库加速测试
class DatabaseTestCase extends TestCase
{
    protected static ?\PDO $db = null;

    public static function setUpBeforeClass(): void
    {
        self::$db = new \PDO('sqlite::memory:');
        self::$db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

        // 加载 schema
        self::$db->exec(file_get_contents(__DIR__ . '/fixtures/schema.sql'));
    }
}
```

## 实战场景

### 场景1: 测试 REST API 控制器

```php
<?php
use PHPUnit\Framework\TestCase;

class UserControllerTest extends TestCase
{
    private UserController $controller;
    private $userService;
    private $validator;

    protected function setUp(): void
    {
        $this->userService = $this->createMock(UserServiceInterface::class);
        $this->validator = $this->createMock(ValidatorInterface::class);

        $this->controller = new UserController(
            $this->userService,
            $this->validator
        );
    }

    public function testCreateUserSuccess(): void
    {
        // 准备请求数据
        $requestData = [
            'name' => '张三',
            'email' => 'zhangsan@example.com',
            'password' => 'secure123'
        ];

        // 配置验证器通过
        $this->validator->method('validate')->willReturn([]);

        // 配置服务返回新用户
        $expectedUser = new User(1, '张三', 'zhangsan@example.com');
        $this->userService->expects($this->once())
            ->method('createUser')
            ->with($requestData)
            ->willReturn($expectedUser);

        // 执行
        $response = $this->controller->create($requestData);

        // 验证
        $this->assertEquals(201, $response->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            json_encode(['id' => 1, 'name' => '张三', 'email' => 'zhangsan@example.com']),
            $response->getContent()
        );
    }

    public function testCreateUserValidationFailure(): void
    {
        $requestData = ['name' => '', 'email' => 'invalid'];

        // 配置验证失败
        $this->validator->method('validate')->willReturn([
            'name' => '名称不能为空',
            'email' => '邮箱格式无效'
        ]);

        // 服务不应该被调用
        $this->userService->expects($this->never())->method('createUser');

        // 执行
        $response = $this->controller->create($requestData);

        // 验证
        $this->assertEquals(400, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('errors', $responseData);
    }

    public function testGetUserNotFound(): void
    {
        $this->userService->method('findById')
            ->with(999)
            ->willReturn(null);

        $response = $this->controller->show(999);

        $this->assertEquals(404, $response->getStatusCode());
    }
}
```

### 场景2: 测试事件驱动系统

```php
<?php
use PHPUnit\Framework\TestCase;

class OrderEventTest extends TestCase
{
    private OrderService $orderService;
    private $eventDispatcher;
    private $orderRepository;
    private $inventoryService;

    protected function setUp(): void
    {
        $this->eventDispatcher = $this->createMock(EventDispatcherInterface::class);
        $this->orderRepository = $this->createMock(OrderRepositoryInterface::class);
        $this->inventoryService = $this->createMock(InventoryServiceInterface::class);

        $this->orderService = new OrderService(
            $this->orderRepository,
            $this->inventoryService,
            $this->eventDispatcher
        );
    }

    public function testOrderCreatedEventDispatched(): void
    {
        $orderData = [
            'userId' => 1,
            'items' => [
                ['productId' => 100, 'quantity' => 2],
                ['productId' => 101, 'quantity' => 1],
            ]
        ];

        // 配置库存检查通过
        $this->inventoryService->method('checkAvailability')->willReturn(true);

        // 配置订单保存
        $this->orderRepository->method('save')->willReturnCallback(
            function (Order $order) {
                $order->setId(1);
                return $order;
            }
        );

        // 验证事件被分发
        $this->eventDispatcher->expects($this->once())
            ->method('dispatch')
            ->with($this->callback(function ($event) {
                return $event instanceof OrderCreatedEvent
                    && $event->getOrderId() === 1
                    && $event->getUserId() === 1;
            }));

        // 执行
        $order = $this->orderService->createOrder($orderData);

        $this->assertInstanceOf(Order::class, $order);
        $this->assertEquals(1, $order->getId());
    }

    public function testOrderCancelledEventDispatched(): void
    {
        $order = new Order(1);
        $order->setStatus('confirmed');

        $this->orderRepository->method('find')->with(1)->willReturn($order);
        $this->orderRepository->method('save')->willReturn($order);

        $this->eventDispatcher->expects($this->once())
            ->method('dispatch')
            ->with($this->isInstanceOf(OrderCancelledEvent::class));

        $this->orderService->cancelOrder(1, '用户取消');
    }
}
```

### 场景3: 测试异步队列处理

```php
<?php
use PHPUnit\Framework\TestCase;

class EmailQueueProcessorTest extends TestCase
{
    private EmailQueueProcessor $processor;
    private $queueConnection;
    private $emailSender;
    private $logger;

    protected function setUp(): void
    {
        $this->queueConnection = $this->createMock(QueueConnectionInterface::class);
        $this->emailSender = $this->createMock(EmailSenderInterface::class);
        $this->logger = $this->createMock(LoggerInterface::class);

        $this->processor = new EmailQueueProcessor(
            $this->queueConnection,
            $this->emailSender,
            $this->logger
        );
    }

    public function testProcessEmailJobSuccess(): void
    {
        $job = new EmailJob([
            'to' => 'user@example.com',
            'subject' => '欢迎',
            'body' => '欢迎加入!'
        ]);

        // 配置邮件发送成功
        $this->emailSender->expects($this->once())
            ->method('send')
            ->with('user@example.com', '欢迎', '欢迎加入!')
            ->willReturn(true);

        // 验证任务被确认
        $this->queueConnection->expects($this->once())
            ->method('ack')
            ->with($job);

        // 记录成功日志
        $this->logger->expects($this->once())
            ->method('info')
            ->with($this->stringContains('邮件发送成功'));

        $this->processor->process($job);
    }

    public function testProcessEmailJobRetryOnFailure(): void
    {
        $job = new EmailJob([
            'to' => 'user@example.com',
            'subject' => '测试',
            'body' => '内容'
        ]);
        $job->setAttempts(1);
        $job->setMaxAttempts(3);

        // 模拟发送失败
        $this->emailSender->method('send')
            ->willThrowException(new \RuntimeException('SMTP 连接失败'));

        // 应该重新入队而不是确认
        $this->queueConnection->expects($this->never())->method('ack');
        $this->queueConnection->expects($this->once())
            ->method('requeue')
            ->with($job, 60); // 60秒后重试

        // 记录错误日志
        $this->logger->expects($this->once())
            ->method('warning')
            ->with($this->stringContains('重试'));

        $this->processor->process($job);
    }

    public function testProcessEmailJobMoveToDLQAfterMaxRetries(): void
    {
        $job = new EmailJob([
            'to' => 'user@example.com',
            'subject' => '测试',
            'body' => '内容'
        ]);
        $job->setAttempts(3);
        $job->setMaxAttempts(3);

        $this->emailSender->method('send')
            ->willThrowException(new \RuntimeException('持续失败'));

        // 移动到死信队列
        $this->queueConnection->expects($this->once())
            ->method('moveToDLQ')
            ->with($job);

        $this->logger->expects($this->once())
            ->method('error')
            ->with($this->stringContains('移动到死信队列'));

        $this->processor->process($job);
    }
}
```

### 场景4: 测试缓存策略

```php
<?php
use PHPUnit\Framework\TestCase;

class CachedUserRepositoryTest extends TestCase
{
    private CachedUserRepository $repository;
    private $cache;
    private $innerRepository;

    protected function setUp(): void
    {
        $this->cache = $this->createMock(CacheInterface::class);
        $this->innerRepository = $this->createMock(UserRepositoryInterface::class);

        $this->repository = new CachedUserRepository(
            $this->innerRepository,
            $this->cache,
            ttl: 3600
        );
    }

    public function testFindByIdReturnsFromCacheWhenExists(): void
    {
        $cachedUser = new User(1, 'John');

        // 缓存命中
        $this->cache->method('get')
            ->with('user:1')
            ->willReturn($cachedUser);

        // 不应该调用内部仓库
        $this->innerRepository->expects($this->never())->method('findById');

        $result = $this->repository->findById(1);

        $this->assertSame($cachedUser, $result);
    }

    public function testFindByIdFetchesFromDatabaseOnCacheMiss(): void
    {
        $user = new User(1, 'John');

        // 缓存未命中
        $this->cache->method('get')
            ->with('user:1')
            ->willReturn(null);

        // 从数据库获取
        $this->innerRepository->expects($this->once())
            ->method('findById')
            ->with(1)
            ->willReturn($user);

        // 写入缓存
        $this->cache->expects($this->once())
            ->method('set')
            ->with('user:1', $user, 3600);

        $result = $this->repository->findById(1);

        $this->assertEquals($user, $result);
    }

    public function testSaveInvalidatesCache(): void
    {
        $user = new User(1, 'John Updated');

        // 保存到数据库
        $this->innerRepository->expects($this->once())
            ->method('save')
            ->with($user);

        // 删除缓存
        $this->cache->expects($this->once())
            ->method('delete')
            ->with('user:1');

        $this->repository->save($user);
    }

    public function testDeleteRemovesFromCacheAndDatabase(): void
    {
        // 删除缓存
        $this->cache->expects($this->once())
            ->method('delete')
            ->with('user:1');

        // 从数据库删除
        $this->innerRepository->expects($this->once())
            ->method('delete')
            ->with(1);

        $this->repository->delete(1);
    }
}
```

## 面试要点

### 常见面试问题

**1. 什么是单元测试?与集成测试有什么区别?**

单元测试测试代码的最小可测试单元(通常是函数或方法),强调隔离性和快速执行。集成测试测试多个组件协同工作的能力,可能涉及真实的数据库、文件系统或外部服务。

```php
<?php
// 单元测试: 隔离测试单个类
class CalculatorUnitTest extends TestCase
{
    public function testAdd(): void
    {
        $calculator = new Calculator();
        $this->assertEquals(5, $calculator->add(2, 3));
    }
}

// 集成测试: 测试多个组件协作
class UserServiceIntegrationTest extends TestCase
{
    public function testCreateUserSavesToDatabase(): void
    {
        // 使用真实数据库连接
        $pdo = new PDO('mysql:host=localhost;dbname=test', 'user', 'pass');
        $repository = new UserRepository($pdo);
        $service = new UserService($repository);

        $user = $service->createUser(['name' => 'John']);

        // 验证数据确实写入了数据库
        $stmt = $pdo->query("SELECT * FROM users WHERE name = 'John'");
        $this->assertNotEmpty($stmt->fetch());
    }
}
```

**2. 解释 Mock、Stub 和 Fake 的区别**

- **Stub**: 提供预设返回值的对象,不验证调用
- **Mock**: 可以验证方法调用次数和参数的对象
- **Fake**: 有实际工作实现的简化版本(如内存数据库)

**3. 什么是测试替身(Test Double)?**

测试替身是用于替换真实依赖的对象,目的是隔离被测试的代码。包括 Dummy、Stub、Mock、Spy 和 Fake。

**4. 如何测试私有方法?**

最佳实践是通过测试公共方法间接测试私有方法。如果必须直接测试,可以使用反射,但这通常意味着设计需要重构。

**5. 什么是代码覆盖率?100% 覆盖率意味着什么?**

代码覆盖率衡量测试执行的代码比例。100% 覆盖率意味着所有代码行都被执行过,但不保证代码是正确的或所有边界情况都被测试。

**6. 解释 AAA 模式**

- **Arrange**: 准备测试数据和依赖
- **Act**: 执行被测试的行为
- **Assert**: 验证结果符合预期

**7. 如何处理测试中的时间依赖?**

注入时间/时钟接口,在测试中使用 Mock 提供固定时间。

**8. 什么是数据提供者?什么时候使用?**

数据提供者允许使用多组数据运行同一个测试方法。当需要测试多个输入输出组合时使用,比使用循环更清晰且每个数据集独立报告。

**9. 如何确保测试之间相互独立?**

- 使用 setUp/tearDown 重置状态
- 避免使用静态变量存储测试数据
- 每个测试创建自己需要的数据
- 使用事务回滚数据库更改

**10. 什么是测试驱动开发(TDD)?**

TDD 是一种开发方法,先写测试再写实现代码。遵循红-绿-重构循环:先写失败的测试(红),再写使测试通过的最小代码(绿),最后重构改进代码质量。

## 延伸阅读

### 官方资源

- [PHPUnit 官方文档](https://phpunit.de/documentation.html)
- [PHPUnit GitHub 仓库](https://github.com/sebastianbergmann/phpunit)
- [PHPUnit 最佳实践](https://phpunit.de/documentation.html#best-practices)

### 推荐书籍

- 《Test-Driven Development with PHP 8》
- 《PHPUnit Essentials》
- 《Working Effectively with Legacy Code》

### 相关工具

- **Pest PHP**: 优雅的 PHP 测试框架,基于 PHPUnit
- **Mockery**: 强大的 Mock 对象框架
- **Faker**: 生成测试用假数据
- **ParaTest**: PHPUnit 并行测试运行器
- **Infection**: PHP 变异测试框架
- **PHPStan/Psalm**: 静态分析工具,与测试配合使用

### 进阶主题

- 变异测试 (Mutation Testing)
- 契约测试 (Contract Testing)
- 属性测试 (Property-Based Testing)
- 快照测试 (Snapshot Testing)
- BDD 测试 (Behat, Codeception)
