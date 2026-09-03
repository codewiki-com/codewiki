---
title: PHPUnit Unit Testing
description: Master the core concepts, assertion methods, data providers, mock objects, and test doubles in the PHPUnit testing framework
track: php
section: tooling
difficulty: intermediate
tags:
  - PHPUnit
  - Unit Testing
  - TDD
  - Mock
  - Test Doubles
status: imported
origin: old/src/content/docs/php/phpunit.en.md
divergence: 0.199
issues: []
legacy:
  category: PHP
  subcategory: Testing
  order: 20
  lastUpdated: 2026-01-07
---

## Concept Explanation

PHPUnit is the most widely used unit testing framework in the PHP ecosystem, created and maintained by Sebastian Bergmann. It follows the xUnit architecture and provides PHP developers with a complete set of testing tools to help ensure code quality and reliability.

### What is Unit Testing?

Unit testing is a software testing method that verifies whether the behavior of the smallest testable unit of code (typically a function or method) meets expectations. The core principles of unit testing include:

- **Isolation**: Each test should run independently, not relying on the execution results of other tests
- **Repeatability**: Tests should produce the same results in any environment
- **Automation**: Tests can be executed automatically without manual intervention
- **Fast Feedback**: Tests execute quickly and can identify problems rapidly

### History and Evolution of PHPUnit

PHPUnit was born in 2004, inspired by Java's JUnit framework. After years of development, PHPUnit has become the de facto standard testing framework in the PHP community. Major version evolution:

- PHPUnit 9.x: Supports PHP 7.3+, introduced new assertion methods
- PHPUnit 10.x: Supports PHP 8.1+, refactored the event system
- PHPUnit 11.x: Supports PHP 8.2+, further modernization

### Why Do We Need Unit Testing?

Unit testing solves the following problems:

- **Regression Testing**: Ensures new code doesn't break existing functionality
- **Documentation**: Test cases demonstrate the expected usage of code
- **Design Improvement**: Writing tests prompts developers to think about interface design
- **Refactoring Confidence**: Code with test coverage can be refactored with confidence
- **Continuous Integration**: Automated testing is the foundation of CI/CD

## Core Principles

### Test Lifecycle

PHPUnit tests follow a specific lifecycle:

```
setUpBeforeClass() → setUp() → test method → tearDown() → tearDownAfterClass()
```

```php
<?php
use PHPUnit\Framework\TestCase;

class LifecycleTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        // Executed once before all test methods
        // Suitable for initializing database connections, loading configurations, etc.
        echo "Test class started\n";
    }

    protected function setUp(): void
    {
        // Executed before each test method
        // Suitable for initializing test objects, resetting state, etc.
        echo "Test method started\n";
    }

    public function testExample(): void
    {
        echo "Executing test\n";
        $this->assertTrue(true);
    }

    protected function tearDown(): void
    {
        // Executed after each test method
        // Suitable for cleaning up resources, resetting state, etc.
        echo "Test method ended\n";
    }

    public static function tearDownAfterClass(): void
    {
        // Executed once after all test methods
        // Suitable for closing connections, cleaning up temporary files, etc.
        echo "Test class ended\n";
    }
}
```

### Assertion Mechanism Principles

PHPUnit assertions are a verification mechanism based on conditional judgment. When an assertion fails, it throws an `AssertionFailedError` exception, which the testing framework catches and marks the test as failed.

```php
<?php
// Basic working principle of assertions
class AssertionMechanism
{
    public function assertEquals($expected, $actual, string $message = ''): void
    {
        if ($expected !== $actual) {
            throw new AssertionFailedError(
                $message ?: "Assertion failed: expected $expected, got $actual"
            );
        }
    }
}
```

### Test Isolation Principles

PHPUnit ensures test isolation through the following mechanisms:

1. **Independent Processes**: Can be configured to run each test in an independent process
2. **State Reset**: Executes setUp/tearDown before and after each test
3. **Global State Backup**: Optionally backs up and restores global variables
4. **Mock Objects**: Uses test doubles to isolate external dependencies

## Core Essentials

### Installation and Configuration

Install PHPUnit via Composer:

```bash
# Install as a development dependency
composer require --dev phpunit/phpunit

# Check version
./vendor/bin/phpunit --version
```

Create the configuration file `phpunit.xml`:

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

### Test Case Structure

A standard test class structure:

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

### Test Naming Conventions

PHPUnit recognizes test methods in two ways:

1. **Method Name Prefix**: Method name starts with `test`
2. **Annotation Method**: Uses `@test` annotation or PHP 8 attributes

```php
<?php
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

class NamingConventionTest extends TestCase
{
    // Method 1: test prefix
    public function testUserCanBeCreated(): void
    {
        $this->assertTrue(true);
    }

    // Method 2: @test annotation
    /**
     * @test
     */
    public function user_can_be_deleted(): void
    {
        $this->assertTrue(true);
    }

    // Method 3: PHP 8 attributes (PHPUnit 10+)
    #[Test]
    public function userCanBeUpdated(): void
    {
        $this->assertTrue(true);
    }
}
```

## Code Examples

### Basic Assertion Methods

```php
<?php
use PHPUnit\Framework\TestCase;

class AssertionsTest extends TestCase
{
    // ==================== Equality Assertions ====================

    public function testEquality(): void
    {
        // assertEquals - compares if values are equal (using ==)
        $this->assertEquals(5, '5');  // Passes, equal after type conversion

        // assertSame - strict comparison (using ===)
        $this->assertSame(5, 5);      // Passes
        // $this->assertSame(5, '5'); // Fails, different types

        // assertNotEquals / assertNotSame
        $this->assertNotEquals(5, 10);
        $this->assertNotSame(5, '5');
    }

    // ==================== Boolean Assertions ====================

    public function testBoolean(): void
    {
        $isValid = true;
        $isEmpty = false;

        $this->assertTrue($isValid);
        $this->assertFalse($isEmpty);

        // Check expression results
        $this->assertTrue(1 + 1 === 2);
        $this->assertFalse(1 > 2);
    }

    // ==================== Null Assertions ====================

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

    // ==================== Array Assertions ====================

    public function testArrays(): void
    {
        $fruits = ['apple', 'banana', 'orange'];
        $user = ['name' => 'John', 'age' => 30, 'email' => 'john@example.com'];

        // Check if array contains a value
        $this->assertContains('banana', $fruits);
        $this->assertNotContains('grape', $fruits);

        // Check if array has a key
        $this->assertArrayHasKey('name', $user);
        $this->assertArrayNotHasKey('password', $user);

        // Check array element count
        $this->assertCount(3, $fruits);

        // Check if it's an array
        $this->assertIsArray($fruits);
    }

    // ==================== Type Assertions ====================

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

    // ==================== String Assertions ====================

    public function testStrings(): void
    {
        $message = 'Hello, World!';

        // String contains
        $this->assertStringContainsString('World', $message);
        $this->assertStringNotContainsString('Goodbye', $message);

        // String starts/ends with
        $this->assertStringStartsWith('Hello', $message);
        $this->assertStringEndsWith('!', $message);

        // Regex matching
        $this->assertMatchesRegularExpression('/^Hello/', $message);
        $this->assertDoesNotMatchRegularExpression('/^\d+/', $message);
    }

    // ==================== Object Assertions ====================

    public function testObjects(): void
    {
        $user = new class {
            public string $name = 'John';
            public int $age = 30;
        };

        // Check instance type
        $this->assertInstanceOf(stdClass::class, new stdClass());

        // Check object properties
        $this->assertObjectHasProperty('name', $user);
        $this->assertObjectNotHasProperty('email', $user);
    }

    // ==================== Exception Assertions ====================

    public function testExceptions(): void
    {
        // Expect a specific exception to be thrown
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

    // ==================== File Assertions ====================

    public function testFiles(): void
    {
        $existingFile = __FILE__;
        $nonExistentFile = '/path/to/nonexistent.txt';

        $this->assertFileExists($existingFile);
        $this->assertFileDoesNotExist($nonExistentFile);
        $this->assertFileIsReadable($existingFile);
    }

    // ==================== JSON Assertions ====================

    public function testJson(): void
    {
        $json = '{"name": "John", "age": 30}';

        $this->assertJson($json);

        $expectedJson = '{"name": "John", "age": 30}';
        $this->assertJsonStringEqualsJsonString($expectedJson, $json);
    }
}
```

### Data Providers

Data providers allow running the same test with different data sets:

```php
<?php
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;

class DataProviderTest extends TestCase
{
    // ==================== Basic Data Provider ====================

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

    // ==================== PHP 8 Attribute Syntax ====================

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

    // ==================== Generator Data Provider ====================

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

    // ==================== Complex Data Structures ====================

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

    // ==================== Multiple Data Providers Combined ====================

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

### Mock Objects and Test Doubles

Mock objects are used to isolate the tested code from external dependencies:

```php
<?php
use PHPUnit\Framework\TestCase;

// Hypothetical interfaces and classes
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

        // Process payment
        $paymentResult = $this->paymentGateway->charge($total, 'USD');

        if (!$paymentResult) {
            return ['success' => false, 'error' => 'Payment failed'];
        }

        // Send confirmation email
        $this->emailService->send(
            $order['email'],
            'Order Confirmation',
            "Your order has been successfully processed. Amount: \${$total}"
        );

        return ['success' => true, 'orderId' => uniqid('ORD_')];
    }
}

class MockTest extends TestCase
{
    // ==================== Basic Mock Creation ====================

    public function testBasicMock(): void
    {
        // Create a mock object
        $paymentGateway = $this->createMock(PaymentGatewayInterface::class);

        // Configure mock behavior
        $paymentGateway->method('charge')
            ->willReturn(true);

        // Use the mock
        $result = $paymentGateway->charge(100.00, 'USD');
        $this->assertTrue($result);
    }

    // ==================== Expect Method Calls ====================

    public function testExpectMethodCall(): void
    {
        $emailService = $this->createMock(EmailServiceInterface::class);

        // Expect send method to be called once
        $emailService->expects($this->once())
            ->method('send')
            ->with(
                $this->equalTo('user@example.com'),
                $this->equalTo('Order Confirmation'),
                $this->stringContains('successfully processed')
            )
            ->willReturn(true);

        // Actual call
        $result = $emailService->send(
            'user@example.com',
            'Order Confirmation',
            'Your order has been successfully processed'
        );

        $this->assertTrue($result);
    }

    // ==================== Verify Method Call Count ====================

    public function testMethodCallCount(): void
    {
        $mock = $this->createMock(PaymentGatewayInterface::class);

        // never - never called
        // once - called once
        // exactly(n) - called n times
        // atLeast(n) - called at least n times
        // atMost(n) - called at most n times
        // any - any number of times

        $mock->expects($this->exactly(3))
            ->method('getBalance')
            ->willReturn(1000.00);

        // Call three times
        $mock->getBalance();
        $mock->getBalance();
        $mock->getBalance();
    }

    // ==================== Return Different Values Based on Arguments ====================

    public function testReturnValueMap(): void
    {
        $mock = $this->createMock(PaymentGatewayInterface::class);

        // Use returnValueMap
        $mock->method('charge')
            ->willReturnMap([
                [100.00, 'USD', true],
                [200.00, 'USD', true],
                [1000000.00, 'USD', false], // Large payment fails
            ]);

        $this->assertTrue($mock->charge(100.00, 'USD'));
        $this->assertTrue($mock->charge(200.00, 'USD'));
        $this->assertFalse($mock->charge(1000000.00, 'USD'));
    }

    // ==================== Return Values Using Callbacks ====================

    public function testReturnCallback(): void
    {
        $mock = $this->createMock(PaymentGatewayInterface::class);

        $mock->method('charge')
            ->willReturnCallback(function (float $amount, string $currency): bool {
                // Simulate business logic: fail if amount exceeds 10000
                return $amount <= 10000;
            });

        $this->assertTrue($mock->charge(5000, 'USD'));
        $this->assertFalse($mock->charge(15000, 'USD'));
    }

    // ==================== Consecutive Return Values ====================

    public function testConsecutiveReturns(): void
    {
        $mock = $this->createMock(PaymentGatewayInterface::class);

        $mock->method('getBalance')
            ->willReturnOnConsecutiveCalls(1000.00, 900.00, 800.00);

        $this->assertEquals(1000.00, $mock->getBalance());
        $this->assertEquals(900.00, $mock->getBalance());
        $this->assertEquals(800.00, $mock->getBalance());
    }

    // ==================== Throw Exceptions ====================

    public function testThrowException(): void
    {
        $mock = $this->createMock(PaymentGatewayInterface::class);

        $mock->method('charge')
            ->willThrowException(new \RuntimeException('Payment gateway connection failed'));

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Payment gateway connection failed');

        $mock->charge(100.00, 'USD');
    }

    // ==================== Complete Integration Test Example ====================

    public function testOrderProcessingSuccess(): void
    {
        // Create mocks
        $paymentGateway = $this->createMock(PaymentGatewayInterface::class);
        $emailService = $this->createMock(EmailServiceInterface::class);

        // Configure payment gateway mock
        $paymentGateway->expects($this->once())
            ->method('charge')
            ->with(299.99, 'USD')
            ->willReturn(true);

        // Configure email service mock
        $emailService->expects($this->once())
            ->method('send')
            ->with(
                'customer@example.com',
                'Order Confirmation',
                $this->stringContains('299.99')
            )
            ->willReturn(true);

        // Test order service
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

        // Simulate payment failure
        $paymentGateway->method('charge')->willReturn(false);

        // Email should not be sent
        $emailService->expects($this->never())->method('send');

        $orderService = new OrderService($paymentGateway, $emailService);
        $result = $orderService->processOrder([
            'total' => 999.99,
            'email' => 'customer@example.com'
        ]);

        $this->assertFalse($result['success']);
        $this->assertEquals('Payment failed', $result['error']);
    }
}
```

### Test Double Types

PHPUnit provides several types of test doubles:

```php
<?php
use PHPUnit\Framework\TestCase;

interface LoggerInterface
{
    public function log(string $level, string $message): void;
}

class TestDoubleTypesTest extends TestCase
{
    // ==================== Dummy (Empty Object) ====================
    // Used to fill parameters, behavior is not important

    public function testDummy(): void
    {
        // Dummy object is just a placeholder
        $logger = $this->createMock(LoggerInterface::class);

        // Configure no behavior, just pass to constructor
        $service = new SomeService($logger);

        // Test methods that don't involve the logger
        $this->assertInstanceOf(SomeService::class, $service);
    }

    // ==================== Stub ====================
    // Provides predefined return values

    public function testStub(): void
    {
        $repository = $this->createStub(UserRepository::class);

        // Stub only cares about return values, doesn't verify calls
        $repository->method('find')
            ->willReturn(new User(1, 'John'));

        $user = $repository->find(1);
        $this->assertEquals('John', $user->getName());
    }

    // ==================== Mock ====================
    // Can verify method calls and arguments

    public function testMock(): void
    {
        $logger = $this->createMock(LoggerInterface::class);

        // Mock can verify calls
        $logger->expects($this->once())
            ->method('log')
            ->with('error', 'An error occurred');

        // Trigger the call
        $logger->log('error', 'An error occurred');
    }

    // ==================== Spy ====================
    // Wrapper around real object, records calls

    public function testSpy(): void
    {
        // Use MockBuilder to create partial mock
        $calculator = $this->getMockBuilder(Calculator::class)
            ->onlyMethods(['log']) // Only mock the log method
            ->getMock();

        $calculator->method('log')->willReturn(null);

        // add method uses real implementation
        $result = $calculator->add(2, 3);
        $this->assertEquals(5, $result);
    }

    // ==================== Fake ====================
    // Simplified working implementation

    public function testFake(): void
    {
        // Create a fake in-memory repository
        $repository = new InMemoryUserRepository();

        // Use fake object for testing
        $repository->save(new User(1, 'John'));
        $user = $repository->find(1);

        $this->assertEquals('John', $user->getName());
    }
}

// Fake implementation example
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

### Testing Private Methods and Properties

```php
<?php
use PHPUnit\Framework\TestCase;

class PrivateAccessTest extends TestCase
{
    // ==================== Access Private Methods Using Reflection ====================

    public function testPrivateMethod(): void
    {
        $calculator = new Calculator();

        // Get private method
        $reflection = new \ReflectionClass($calculator);
        $method = $reflection->getMethod('calculateTax');
        $method->setAccessible(true);

        // Call private method
        $result = $method->invokeArgs($calculator, [100.0, 0.1]);

        $this->assertEquals(10.0, $result);
    }

    // ==================== Access Private Properties Using Reflection ====================

    public function testPrivateProperty(): void
    {
        $user = new User(1, 'John');

        $reflection = new \ReflectionClass($user);
        $property = $reflection->getProperty('secretKey');
        $property->setAccessible(true);

        // Read private property
        $value = $property->getValue($user);
        $this->assertNotEmpty($value);

        // Set private property
        $property->setValue($user, 'new-secret');
        $this->assertEquals('new-secret', $property->getValue($user));
    }

    // ==================== Recommended: Test Public Behavior ====================

    public function testPublicBehaviorInsteadOfPrivate(): void
    {
        // Better approach: test through public interface
        $calculator = new Calculator();

        // Don't test calculateTax directly, test public method that uses it
        $result = $calculator->calculateTotal(100.0);

        // Verify final result includes tax calculation
        $this->assertEquals(110.0, $result);
    }
}
```

### Testing Exceptions and Errors

```php
<?php
use PHPUnit\Framework\TestCase;

class ExceptionTest extends TestCase
{
    // ==================== Basic Exception Testing ====================

    public function testThrowsException(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $calculator = new Calculator();
        $calculator->divide(10, 0);
    }

    // ==================== Verify Exception Message ====================

    public function testExceptionMessage(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Divisor cannot be zero');

        $calculator = new Calculator();
        $calculator->divide(10, 0);
    }

    // ==================== Verify Exception Message Regex ====================

    public function testExceptionMessageRegex(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/User \d+ not found/');

        $userService = new UserService();
        $userService->getUser(999);
    }

    // ==================== Verify Exception Code ====================

    public function testExceptionCode(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);

        throw new \DomainException('Resource not found', 404);
    }

    // ==================== Verify Exception Using Callback ====================

    public function testExceptionWithCallback(): void
    {
        try {
            $userService = new UserService();
            $userService->createUser(['name' => '']);
            $this->fail('Should have thrown an exception');
        } catch (\InvalidArgumentException $e) {
            $this->assertStringContainsString('name', $e->getMessage());
            $this->assertGreaterThan(0, $e->getCode());
        }
    }

    // ==================== Test No Exception Thrown ====================

    public function testNoExceptionThrown(): void
    {
        $calculator = new Calculator();

        // Expect no exception to be thrown
        $result = $calculator->divide(10, 2);

        $this->assertEquals(5, $result);
        // If we reach here, no exception was thrown
    }

    // ==================== Test PHP Errors ====================

    public function testTriggersError(): void
    {
        $this->expectWarning();
        $this->expectWarningMessage('Division by zero');

        // PHP 8+ throws DivisionByZeroError
        // PHP 7 triggers a warning
        $result = 1 / 0;
    }

    // ==================== Test Deprecation Warnings ====================

    public function testDeprecation(): void
    {
        $this->expectDeprecation();
        $this->expectDeprecationMessage('This method is deprecated');

        $service = new LegacyService();
        $service->deprecatedMethod();
    }
}
```

## Best Practices

### Test Naming and Organization

```php
<?php
use PHPUnit\Framework\TestCase;

/**
 * Best Practice: Clear test naming that expresses intent
 */
class UserServiceTest extends TestCase
{
    // Good naming: describes behavior and expected outcome
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

    // BDD style using underscores
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

### AAA Pattern (Arrange-Act-Assert)

```php
<?php
use PHPUnit\Framework\TestCase;

class AAAPatternTest extends TestCase
{
    public function testUserRegistration(): void
    {
        // ========== Arrange (Setup) ==========
        $userRepository = $this->createMock(UserRepositoryInterface::class);
        $emailService = $this->createMock(EmailServiceInterface::class);

        $userRepository->method('save')->willReturn(true);
        $emailService->method('send')->willReturn(true);

        $registrationService = new RegistrationService($userRepository, $emailService);

        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'secure123'
        ];

        // ========== Act (Execute) ==========
        $result = $registrationService->register($userData);

        // ========== Assert (Verify) ==========
        $this->assertTrue($result->isSuccess());
        $this->assertNotNull($result->getUser());
        $this->assertEquals('John Doe', $result->getUser()->getName());
    }

    public function testCalculateOrderTotal(): void
    {
        // Arrange
        $order = new Order();
        $order->addItem(new OrderItem('Product A', 100, 2));
        $order->addItem(new OrderItem('Product B', 50, 3));

        $calculator = new OrderCalculator();

        // Act
        $total = $calculator->calculateTotal($order);

        // Assert
        $this->assertEquals(350, $total);
    }
}
```

### Testing Boundary Conditions

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

    // ========== Boundary Value Testing ==========

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

    // ========== Empty and Null Testing ==========

    public function testEmptyCollection(): void
    {
        $paginator = new Paginator(totalItems: 0, itemsPerPage: 10);

        $this->assertEquals(0, $paginator->getTotalPages());
        $this->assertEmpty($paginator->getPage(1)->getItems());
    }

    // ========== Edge Case Testing ==========

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

### Test Code Coverage

```bash
# Generate code coverage report
./vendor/bin/phpunit --coverage-html coverage/

# Generate text report
./vendor/bin/phpunit --coverage-text

# Set minimum coverage requirement
./vendor/bin/phpunit --coverage-text --coverage-min=80
```

Configure `phpunit.xml` coverage:

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

## Common Pitfalls

### Testing Implementation Instead of Behavior

```php
<?php
// Wrong: Over-focusing on implementation details
public function testUserCreationBadExample(): void
{
    $repository = $this->createMock(UserRepository::class);

    // Over-verifying internal call order
    $repository->expects($this->at(0))->method('beginTransaction');
    $repository->expects($this->at(1))->method('insert');
    $repository->expects($this->at(2))->method('commit');

    // If implementation changes, test will fail
}

// Correct: Focus on behavior and results
public function testUserCreationGoodExample(): void
{
    $repository = $this->createMock(UserRepository::class);
    $repository->method('save')->willReturn(true);

    $service = new UserService($repository);
    $user = $service->createUser(['name' => 'John']);

    // Only verify results, don't care about internal implementation
    $this->assertInstanceOf(User::class, $user);
    $this->assertEquals('John', $user->getName());
}
```

### Dependencies Between Tests

```php
<?php
// Wrong: Tests depend on shared state
class BadTestDependencyTest extends TestCase
{
    private static $user; // Static shared state

    public function testCreateUser(): void
    {
        self::$user = new User(1, 'John');
        $this->assertNotNull(self::$user);
    }

    public function testDeleteUser(): void
    {
        // Depends on user created by previous test
        $this->assertNotNull(self::$user); // If previous test fails, this will also fail
    }
}

// Correct: Each test is independent
class GoodTestIndependenceTest extends TestCase
{
    public function testCreateUser(): void
    {
        $user = new User(1, 'John');
        $this->assertNotNull($user);
    }

    public function testDeleteUser(): void
    {
        // Create its own test data
        $user = new User(1, 'John');
        $service = new UserService();

        $result = $service->delete($user);
        $this->assertTrue($result);
    }
}
```

### Over-Mocking

```php
<?php
// Wrong: Too much mocking makes tests fragile and meaningless
public function testTooMuchMocking(): void
{
    $user = $this->createMock(User::class);
    $user->method('getName')->willReturn('John');
    $user->method('getEmail')->willReturn('john@example.com');
    $user->method('isActive')->willReturn(true);

    // Basically testing mock behavior, not real code
    $this->assertEquals('John', $user->getName());
}

// Correct: Only mock external dependencies
public function testOnlyMockExternalDependencies(): void
{
    // Use real value objects
    $user = new User(1, 'John', 'john@example.com');

    // Only mock external services
    $emailService = $this->createMock(EmailServiceInterface::class);
    $emailService->expects($this->once())
        ->method('send')
        ->willReturn(true);

    $notificationService = new NotificationService($emailService);
    $result = $notificationService->notifyUser($user, 'Welcome!');

    $this->assertTrue($result);
}
```

### Ignoring Test Cleanup

```php
<?php
// Wrong: No cleanup after test
class NoCleanupTest extends TestCase
{
    public function testFileCreation(): void
    {
        file_put_contents('/tmp/test.txt', 'test data');
        // Test completes but file still exists
        $this->assertFileExists('/tmp/test.txt');
    }
}

// Correct: Use tearDown for cleanup
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

### Time Dependencies in Tests

```php
<?php
// Wrong: Directly depends on current time
class TimeDependentBadTest extends TestCase
{
    public function testTokenExpiration(): void
    {
        $token = new Token();
        // This test may fail depending on execution timing
        $this->assertFalse($token->isExpired());

        sleep(2); // Wait for expiration
        $this->assertTrue($token->isExpired());
    }
}

// Correct: Inject time dependency
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

## Performance Considerations

### Test Execution Optimization

```php
<?php
use PHPUnit\Framework\TestCase;

class PerformanceOptimizedTest extends TestCase
{
    // Use setUpBeforeClass to initialize expensive resources
    private static ?\PDO $pdo = null;

    public static function setUpBeforeClass(): void
    {
        // Create database connection only once
        self::$pdo = new \PDO('sqlite::memory:');
        self::$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    }

    public static function tearDownAfterClass(): void
    {
        self::$pdo = null;
    }

    protected function setUp(): void
    {
        // Clear data before each test instead of recreating connection
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

### Use Data Providers Instead of Loops

```php
<?php
// Bad: Multiple assertions in a loop
public function testMultipleInputsBad(): void
{
    $inputs = [1, 2, 3, 4, 5];
    foreach ($inputs as $input) {
        $result = $this->calculator->square($input);
        $this->assertEquals($input * $input, $result);
    }
    // If the first fails, the rest won't execute
}

// Good: Use data providers
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

### Parallel Test Execution

```xml
<!-- phpunit.xml -->
<phpunit>
    <!-- PHPUnit 10+ supports parallel execution -->
    <coverage>
        <!-- ... -->
    </coverage>
</phpunit>
```

```bash
# Use paratest for parallel execution
composer require --dev brianium/paratest
./vendor/bin/paratest -p 4 # 4 parallel processes

# Or use PHPUnit built-in parallel (PHPUnit 10+)
./vendor/bin/phpunit --process-isolation
```

### Using In-Memory Databases

```php
<?php
// Use SQLite in-memory database to speed up tests
class DatabaseTestCase extends TestCase
{
    protected static ?\PDO $db = null;

    public static function setUpBeforeClass(): void
    {
        self::$db = new \PDO('sqlite::memory:');
        self::$db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

        // Load schema
        self::$db->exec(file_get_contents(__DIR__ . '/fixtures/schema.sql'));
    }
}
```

## Practical Scenarios

### Scenario 1: Testing REST API Controllers

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
        // Prepare request data
        $requestData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'secure123'
        ];

        // Configure validator to pass
        $this->validator->method('validate')->willReturn([]);

        // Configure service to return new user
        $expectedUser = new User(1, 'John Doe', 'john@example.com');
        $this->userService->expects($this->once())
            ->method('createUser')
            ->with($requestData)
            ->willReturn($expectedUser);

        // Execute
        $response = $this->controller->create($requestData);

        // Verify
        $this->assertEquals(201, $response->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            json_encode(['id' => 1, 'name' => 'John Doe', 'email' => 'john@example.com']),
            $response->getContent()
        );
    }

    public function testCreateUserValidationFailure(): void
    {
        $requestData = ['name' => '', 'email' => 'invalid'];

        // Configure validation failure
        $this->validator->method('validate')->willReturn([
            'name' => 'Name cannot be empty',
            'email' => 'Email format is invalid'
        ]);

        // Service should not be called
        $this->userService->expects($this->never())->method('createUser');

        // Execute
        $response = $this->controller->create($requestData);

        // Verify
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

### Scenario 2: Testing Event-Driven Systems

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

        // Configure inventory check to pass
        $this->inventoryService->method('checkAvailability')->willReturn(true);

        // Configure order save
        $this->orderRepository->method('save')->willReturnCallback(
            function (Order $order) {
                $order->setId(1);
                return $order;
            }
        );

        // Verify event is dispatched
        $this->eventDispatcher->expects($this->once())
            ->method('dispatch')
            ->with($this->callback(function ($event) {
                return $event instanceof OrderCreatedEvent
                    && $event->getOrderId() === 1
                    && $event->getUserId() === 1;
            }));

        // Execute
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

        $this->orderService->cancelOrder(1, 'User cancelled');
    }
}
```

### Scenario 3: Testing Async Queue Processing

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
            'subject' => 'Welcome',
            'body' => 'Welcome to our platform!'
        ]);

        // Configure successful email send
        $this->emailSender->expects($this->once())
            ->method('send')
            ->with('user@example.com', 'Welcome', 'Welcome to our platform!')
            ->willReturn(true);

        // Verify job is acknowledged
        $this->queueConnection->expects($this->once())
            ->method('ack')
            ->with($job);

        // Log success
        $this->logger->expects($this->once())
            ->method('info')
            ->with($this->stringContains('Email sent successfully'));

        $this->processor->process($job);
    }

    public function testProcessEmailJobRetryOnFailure(): void
    {
        $job = new EmailJob([
            'to' => 'user@example.com',
            'subject' => 'Test',
            'body' => 'Content'
        ]);
        $job->setAttempts(1);
        $job->setMaxAttempts(3);

        // Simulate send failure
        $this->emailSender->method('send')
            ->willThrowException(new \RuntimeException('SMTP connection failed'));

        // Should requeue instead of acknowledge
        $this->queueConnection->expects($this->never())->method('ack');
        $this->queueConnection->expects($this->once())
            ->method('requeue')
            ->with($job, 60); // Retry after 60 seconds

        // Log warning
        $this->logger->expects($this->once())
            ->method('warning')
            ->with($this->stringContains('retry'));

        $this->processor->process($job);
    }

    public function testProcessEmailJobMoveToDLQAfterMaxRetries(): void
    {
        $job = new EmailJob([
            'to' => 'user@example.com',
            'subject' => 'Test',
            'body' => 'Content'
        ]);
        $job->setAttempts(3);
        $job->setMaxAttempts(3);

        $this->emailSender->method('send')
            ->willThrowException(new \RuntimeException('Persistent failure'));

        // Move to dead letter queue
        $this->queueConnection->expects($this->once())
            ->method('moveToDLQ')
            ->with($job);

        $this->logger->expects($this->once())
            ->method('error')
            ->with($this->stringContains('moved to dead letter queue'));

        $this->processor->process($job);
    }
}
```

### Scenario 4: Testing Cache Strategies

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

        // Cache hit
        $this->cache->method('get')
            ->with('user:1')
            ->willReturn($cachedUser);

        // Inner repository should not be called
        $this->innerRepository->expects($this->never())->method('findById');

        $result = $this->repository->findById(1);

        $this->assertSame($cachedUser, $result);
    }

    public function testFindByIdFetchesFromDatabaseOnCacheMiss(): void
    {
        $user = new User(1, 'John');

        // Cache miss
        $this->cache->method('get')
            ->with('user:1')
            ->willReturn(null);

        // Fetch from database
        $this->innerRepository->expects($this->once())
            ->method('findById')
            ->with(1)
            ->willReturn($user);

        // Write to cache
        $this->cache->expects($this->once())
            ->method('set')
            ->with('user:1', $user, 3600);

        $result = $this->repository->findById(1);

        $this->assertEquals($user, $result);
    }

    public function testSaveInvalidatesCache(): void
    {
        $user = new User(1, 'John Updated');

        // Save to database
        $this->innerRepository->expects($this->once())
            ->method('save')
            ->with($user);

        // Delete cache
        $this->cache->expects($this->once())
            ->method('delete')
            ->with('user:1');

        $this->repository->save($user);
    }

    public function testDeleteRemovesFromCacheAndDatabase(): void
    {
        // Delete cache
        $this->cache->expects($this->once())
            ->method('delete')
            ->with('user:1');

        // Delete from database
        $this->innerRepository->expects($this->once())
            ->method('delete')
            ->with(1);

        $this->repository->delete(1);
    }
}
```

## Interview Key Points

### Common Interview Questions

**1. What is unit testing? How is it different from integration testing?**

Unit testing tests the smallest testable unit of code (typically a function or method), emphasizing isolation and fast execution. Integration testing tests the ability of multiple components to work together, potentially involving real databases, file systems, or external services.

```php
<?php
// Unit test: Isolated test of a single class
class CalculatorUnitTest extends TestCase
{
    public function testAdd(): void
    {
        $calculator = new Calculator();
        $this->assertEquals(5, $calculator->add(2, 3));
    }
}

// Integration test: Testing multiple components working together
class UserServiceIntegrationTest extends TestCase
{
    public function testCreateUserSavesToDatabase(): void
    {
        // Use real database connection
        $pdo = new PDO('mysql:host=localhost;dbname=test', 'user', 'pass');
        $repository = new UserRepository($pdo);
        $service = new UserService($repository);

        $user = $service->createUser(['name' => 'John']);

        // Verify data was actually written to database
        $stmt = $pdo->query("SELECT * FROM users WHERE name = 'John'");
        $this->assertNotEmpty($stmt->fetch());
    }
}
```

**2. Explain the difference between Mock, Stub, and Fake**

- **Stub**: Object that provides predefined return values, doesn't verify calls
- **Mock**: Object that can verify method call count and arguments
- **Fake**: Simplified working implementation (e.g., in-memory database)

**3. What is a Test Double?**

Test doubles are objects used to replace real dependencies, with the purpose of isolating the code being tested. They include Dummy, Stub, Mock, Spy, and Fake.

**4. How do you test private methods?**

Best practice is to test private methods indirectly through public methods. If direct testing is necessary, you can use reflection, but this usually indicates the design needs refactoring.

**5. What is code coverage? What does 100% coverage mean?**

Code coverage measures the proportion of code executed by tests. 100% coverage means all lines of code have been executed, but it doesn't guarantee the code is correct or all edge cases have been tested.

**6. Explain the AAA Pattern**

- **Arrange**: Prepare test data and dependencies
- **Act**: Execute the behavior being tested
- **Assert**: Verify results meet expectations

**7. How do you handle time dependencies in tests?**

Inject a time/clock interface and use a mock in tests to provide a fixed time.

**8. What are data providers? When should you use them?**

Data providers allow running the same test method with multiple sets of data. Use them when testing multiple input/output combinations, as they're clearer than loops and each data set is reported independently.

**9. How do you ensure tests are independent of each other?**

- Use setUp/tearDown to reset state
- Avoid using static variables to store test data
- Each test creates its own required data
- Use transaction rollback for database changes

**10. What is Test-Driven Development (TDD)?**

TDD is a development approach where tests are written before implementation code. It follows the Red-Green-Refactor cycle: first write a failing test (Red), then write minimal code to make it pass (Green), finally refactor to improve code quality.

## Further Reading

### Official Resources

- [PHPUnit Official Documentation](https://phpunit.de/documentation.html)
- [PHPUnit GitHub Repository](https://github.com/sebastianbergmann/phpunit)
- [PHPUnit Best Practices](https://phpunit.de/documentation.html#best-practices)

### Recommended Books

- "Test-Driven Development with PHP 8"
- "PHPUnit Essentials"
- "Working Effectively with Legacy Code"

### Related Tools

- **Pest PHP**: Elegant PHP testing framework, built on PHPUnit
- **Mockery**: Powerful mock object framework
- **Faker**: Generate fake test data
- **ParaTest**: PHPUnit parallel test runner
- **Infection**: PHP mutation testing framework
- **PHPStan/Psalm**: Static analysis tools that complement testing

### Advanced Topics

- Mutation Testing
- Contract Testing
- Property-Based Testing
- Snapshot Testing
- BDD Testing (Behat, Codeception)
