---
title: PHP 8.1 Fibers and Coroutines
description: Complete guide to PHP 8.1 Fibers for building cooperative multitasking and asynchronous applications
track: php
section: performance-security
difficulty: advanced
tags:
  - PHP
  - Fibers
  - Async
  - Coroutines
  - Concurrency
  - PHP 8.1
status: imported
origin: old/src/content/docs/php/fibers.en.md
divergence: 0.214
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: PHP
  subcategory: ""
  order: 4
  lastUpdated: 2026-01-21
---

PHP 8.1 introduced Fibers, a low-level mechanism for implementing lightweight cooperative concurrency. Fibers enable interruptible functions that can be suspended and resumed, forming the foundation for async frameworks and coroutines.

## Concept Explanation

A Fiber is a code block that can be suspended at any point, preserving its entire execution state (call stack, local variables). Unlike threads, Fibers are not preemptively scheduled - they must explicitly yield control.

```php
<?php

// Basic Fiber example
$fiber = new Fiber(function(): void {
    echo "1. Fiber started\n";

    // Suspend the fiber and return a value
    $value = Fiber::suspend('suspended');

    echo "3. Fiber resumed with: $value\n";
});

// Start the fiber
$result = $fiber->start();
echo "2. Main received: $result\n";

// Resume the fiber with a value
$fiber->resume('hello');

echo "4. Done\n";

// Output:
// 1. Fiber started
// 2. Main received: suspended
// 3. Fiber resumed with: hello
// 4. Done
```

Fibers differ from generators:
- Generators can only yield from the generator function itself
- Fibers can suspend from anywhere in the call stack
- Fibers maintain full execution context

## Core Principles

### Fiber Lifecycle

```php
<?php

$fiber = new Fiber(function(): string {
    echo "Starting...\n";
    $input = Fiber::suspend('paused');
    return "Finished with: $input";
});

// Fiber states
// Before start(): not started
echo $fiber->isStarted() ? 'started' : 'not started'; // not started
echo $fiber->isSuspended() ? 'suspended' : 'running'; // running (false)
echo $fiber->isTerminated() ? 'done' : 'active'; // active

// Start the fiber
$suspended = $fiber->start();
echo "Suspended value: $suspended\n";

// After suspend
echo $fiber->isStarted() ? 'started' : 'not started'; // started
echo $fiber->isSuspended() ? 'suspended' : 'running'; // suspended

// Resume with value
$result = $fiber->resume('data');
echo "Result: $result\n";

// After completion
echo $fiber->isTerminated() ? 'done' : 'active'; // done

// Get return value
echo $fiber->getReturn(); // "Finished with: data"
```

### Exception Handling

```php
<?php

// Throwing exceptions into fibers
$fiber = new Fiber(function(): void {
    try {
        echo "Fiber running\n";
        Fiber::suspend();
        echo "This won't print\n";
    } catch (Exception $e) {
        echo "Caught in fiber: " . $e->getMessage() . "\n";
    }
});

$fiber->start();
$fiber->throw(new Exception("Error from main"));

// Exceptions from fiber to main
$fiber = new Fiber(function(): void {
    Fiber::suspend();
    throw new RuntimeException("Fiber error");
});

$fiber->start();
try {
    $fiber->resume();
} catch (RuntimeException $e) {
    echo "Caught from fiber: " . $e->getMessage() . "\n";
}
```

### Getting Current Fiber

```php
<?php

function deepFunction(): void
{
    $fiber = Fiber::getCurrent();
    if ($fiber !== null) {
        echo "Inside a fiber!\n";
        Fiber::suspend('from deep');
    } else {
        echo "Not in a fiber\n";
    }
}

// Called outside fiber
deepFunction(); // "Not in a fiber"

// Called inside fiber
$fiber = new Fiber(function(): void {
    deepFunction();
});
$fiber->start(); // "Inside a fiber!"
```

## Key Concepts

### Building an Event Loop

```php
<?php

class EventLoop
{
    private array $readCallbacks = [];
    private array $writeCallbacks = [];
    private array $timers = [];
    private array $deferred = [];
    private bool $running = false;

    public function addReadStream($stream, callable $callback): void
    {
        $this->readCallbacks[(int)$stream] = [$stream, $callback];
    }

    public function addWriteStream($stream, callable $callback): void
    {
        $this->writeCallbacks[(int)$stream] = [$stream, $callback];
    }

    public function removeReadStream($stream): void
    {
        unset($this->readCallbacks[(int)$stream]);
    }

    public function removeWriteStream($stream): void
    {
        unset($this->writeCallbacks[(int)$stream]);
    }

    public function addTimer(float $interval, callable $callback): string
    {
        $id = uniqid('timer_');
        $this->timers[$id] = [
            'time' => microtime(true) + $interval,
            'callback' => $callback,
        ];
        return $id;
    }

    public function defer(callable $callback): void
    {
        $this->deferred[] = $callback;
    }

    public function run(): void
    {
        $this->running = true;

        while ($this->running) {
            // Process deferred callbacks
            while ($callback = array_shift($this->deferred)) {
                $callback();
            }

            // Process timers
            $now = microtime(true);
            foreach ($this->timers as $id => $timer) {
                if ($timer['time'] <= $now) {
                    ($timer['callback'])();
                    unset($this->timers[$id]);
                }
            }

            // Check for I/O
            if (empty($this->readCallbacks) && empty($this->writeCallbacks)) {
                if (empty($this->timers) && empty($this->deferred)) {
                    break;
                }
                usleep(1000);
                continue;
            }

            $read = array_column($this->readCallbacks, 0);
            $write = array_column($this->writeCallbacks, 0);
            $except = [];

            $timeout = $this->getNextTimeout();

            if (stream_select($read, $write, $except, 0, (int)($timeout * 1000000))) {
                foreach ($read as $stream) {
                    $key = (int)$stream;
                    if (isset($this->readCallbacks[$key])) {
                        ($this->readCallbacks[$key][1])($stream);
                    }
                }
                foreach ($write as $stream) {
                    $key = (int)$stream;
                    if (isset($this->writeCallbacks[$key])) {
                        ($this->writeCallbacks[$key][1])($stream);
                    }
                }
            }
        }
    }

    public function stop(): void
    {
        $this->running = false;
    }

    private function getNextTimeout(): float
    {
        if (empty($this->timers)) {
            return 1.0;
        }
        $next = min(array_column($this->timers, 'time'));
        return max(0, $next - microtime(true));
    }
}
```

### Async/Await Pattern

```php
<?php

class Async
{
    private static ?EventLoop $loop = null;
    private static array $suspendedFibers = [];

    public static function getLoop(): EventLoop
    {
        return self::$loop ??= new EventLoop();
    }

    /**
     * Run async function
     */
    public static function run(callable $callback): mixed
    {
        $fiber = new Fiber($callback);
        $result = $fiber->start();

        self::getLoop()->run();

        if ($fiber->isTerminated()) {
            return $fiber->getReturn();
        }

        return $result;
    }

    /**
     * Suspend current fiber until promise resolves
     */
    public static function await(Promise $promise): mixed
    {
        $fiber = Fiber::getCurrent();
        if ($fiber === null) {
            throw new LogicException('await() must be called within async context');
        }

        $resolved = false;
        $result = null;
        $error = null;

        $promise->then(
            function($value) use ($fiber, &$resolved, &$result) {
                $resolved = true;
                $result = $value;
                if ($fiber->isSuspended()) {
                    $fiber->resume($value);
                }
            },
            function($e) use ($fiber, &$resolved, &$error) {
                $resolved = true;
                $error = $e;
                if ($fiber->isSuspended()) {
                    $fiber->throw($e);
                }
            }
        );

        if (!$resolved) {
            Fiber::suspend();
        }

        if ($error !== null) {
            throw $error;
        }

        return $result;
    }

    /**
     * Sleep without blocking
     */
    public static function sleep(float $seconds): void
    {
        $fiber = Fiber::getCurrent();
        if ($fiber === null) {
            sleep((int)$seconds);
            return;
        }

        self::getLoop()->addTimer($seconds, function() use ($fiber) {
            if ($fiber->isSuspended()) {
                $fiber->resume();
            }
        });

        Fiber::suspend();
    }
}

// Promise implementation
class Promise
{
    private mixed $value = null;
    private ?Throwable $error = null;
    private bool $resolved = false;
    private array $handlers = [];

    public function then(callable $onFulfilled, ?callable $onRejected = null): self
    {
        if ($this->resolved) {
            if ($this->error !== null) {
                $onRejected && $onRejected($this->error);
            } else {
                $onFulfilled($this->value);
            }
        } else {
            $this->handlers[] = [$onFulfilled, $onRejected];
        }
        return $this;
    }

    public function resolve(mixed $value): void
    {
        if ($this->resolved) return;
        $this->resolved = true;
        $this->value = $value;
        foreach ($this->handlers as [$onFulfilled, $onRejected]) {
            $onFulfilled($value);
        }
    }

    public function reject(Throwable $error): void
    {
        if ($this->resolved) return;
        $this->resolved = true;
        $this->error = $error;
        foreach ($this->handlers as [$onFulfilled, $onRejected]) {
            $onRejected && $onRejected($error);
        }
    }
}

// Usage
Async::run(function() {
    echo "Starting...\n";

    Async::sleep(1);
    echo "After 1 second\n";

    Async::sleep(0.5);
    echo "After 0.5 more seconds\n";
});
```

### Non-Blocking HTTP Client

```php
<?php

class AsyncHttpClient
{
    private EventLoop $loop;

    public function __construct(EventLoop $loop)
    {
        $this->loop = $loop;
    }

    public function get(string $url): Promise
    {
        $promise = new Promise();

        $parsed = parse_url($url);
        $host = $parsed['host'];
        $port = $parsed['port'] ?? ($parsed['scheme'] === 'https' ? 443 : 80);
        $path = $parsed['path'] ?? '/';

        $socket = @stream_socket_client(
            "tcp://$host:$port",
            $errno,
            $errstr,
            0,
            STREAM_CLIENT_ASYNC_CONNECT
        );

        if (!$socket) {
            $promise->reject(new RuntimeException("Connection failed: $errstr"));
            return $promise;
        }

        stream_set_blocking($socket, false);

        $request = "GET $path HTTP/1.1\r\n";
        $request .= "Host: $host\r\n";
        $request .= "Connection: close\r\n\r\n";

        $response = '';
        $connected = false;

        // Wait for connection
        $this->loop->addWriteStream($socket, function($stream) use (
            &$connected, &$request, &$response, $promise
        ) {
            if (!$connected) {
                $connected = true;
                fwrite($stream, $request);
                $this->loop->removeWriteStream($stream);
                $this->loop->addReadStream($stream, function($stream) use (
                    &$response, $promise
                ) {
                    $chunk = fread($stream, 8192);
                    if ($chunk === false || $chunk === '') {
                        $this->loop->removeReadStream($stream);
                        fclose($stream);

                        // Parse response
                        [$headers, $body] = explode("\r\n\r\n", $response, 2);
                        $promise->resolve($body);
                    } else {
                        $response .= $chunk;
                    }
                });
            }
        });

        return $promise;
    }
}

// Usage with Fibers
Async::run(function() {
    $client = new AsyncHttpClient(Async::getLoop());

    echo "Fetching...\n";
    $body = Async::await($client->get('http://example.com'));
    echo "Response length: " . strlen($body) . "\n";
});
```

## Code Examples

### Concurrent Task Execution

```php
<?php

class TaskScheduler
{
    private array $tasks = [];
    private array $results = [];

    public function add(string $name, callable $task): self
    {
        $this->tasks[$name] = new Fiber($task);
        return $this;
    }

    public function run(): array
    {
        // Start all tasks
        foreach ($this->tasks as $name => $fiber) {
            try {
                $result = $fiber->start();
                if ($fiber->isTerminated()) {
                    $this->results[$name] = $fiber->getReturn();
                    unset($this->tasks[$name]);
                }
            } catch (Throwable $e) {
                $this->results[$name] = $e;
                unset($this->tasks[$name]);
            }
        }

        // Resume suspended tasks
        while (!empty($this->tasks)) {
            foreach ($this->tasks as $name => $fiber) {
                if (!$fiber->isSuspended()) {
                    continue;
                }

                try {
                    $fiber->resume();
                    if ($fiber->isTerminated()) {
                        $this->results[$name] = $fiber->getReturn();
                        unset($this->tasks[$name]);
                    }
                } catch (Throwable $e) {
                    $this->results[$name] = $e;
                    unset($this->tasks[$name]);
                }
            }

            if (!empty($this->tasks)) {
                usleep(1000); // Small delay
            }
        }

        return $this->results;
    }
}

// Example usage
$scheduler = new TaskScheduler();

$scheduler->add('task1', function(): string {
    for ($i = 0; $i < 3; $i++) {
        echo "Task 1: step $i\n";
        Fiber::suspend();
    }
    return "Task 1 done";
});

$scheduler->add('task2', function(): string {
    for ($i = 0; $i < 2; $i++) {
        echo "Task 2: step $i\n";
        Fiber::suspend();
    }
    return "Task 2 done";
});

$results = $scheduler->run();
print_r($results);
```

### Database Connection Pool

```php
<?php

class ConnectionPool
{
    private array $available = [];
    private array $waiting = [];
    private int $size;
    private int $created = 0;
    private callable $factory;

    public function __construct(int $size, callable $factory)
    {
        $this->size = $size;
        $this->factory = $factory;
    }

    public function acquire(): mixed
    {
        // Return available connection
        if (!empty($this->available)) {
            return array_pop($this->available);
        }

        // Create new connection if under limit
        if ($this->created < $this->size) {
            $this->created++;
            return ($this->factory)();
        }

        // Wait for connection to be released
        $fiber = Fiber::getCurrent();
        if ($fiber === null) {
            throw new RuntimeException('Must be called within a Fiber');
        }

        $this->waiting[] = $fiber;
        return Fiber::suspend();
    }

    public function release(mixed $connection): void
    {
        // Give to waiting fiber or return to pool
        if (!empty($this->waiting)) {
            $fiber = array_shift($this->waiting);
            $fiber->resume($connection);
        } else {
            $this->available[] = $connection;
        }
    }

    public function withConnection(callable $callback): mixed
    {
        $connection = $this->acquire();
        try {
            return $callback($connection);
        } finally {
            $this->release($connection);
        }
    }
}

// Usage
$pool = new ConnectionPool(5, function() {
    return new PDO('mysql:host=localhost;dbname=test', 'user', 'pass');
});

// In a fiber context
$result = $pool->withConnection(function($pdo) {
    return $pdo->query('SELECT * FROM users')->fetchAll();
});
```

### Channel-based Communication

```php
<?php

class Channel
{
    private array $buffer = [];
    private int $capacity;
    private array $senders = [];
    private array $receivers = [];

    public function __construct(int $capacity = 0)
    {
        $this->capacity = $capacity;
    }

    public function send(mixed $value): void
    {
        // If receiver waiting, give directly
        if (!empty($this->receivers)) {
            $fiber = array_shift($this->receivers);
            $fiber->resume($value);
            return;
        }

        // If buffer has space, add to buffer
        if ($this->capacity > 0 && count($this->buffer) < $this->capacity) {
            $this->buffer[] = $value;
            return;
        }

        // Block sender
        $fiber = Fiber::getCurrent();
        if ($fiber === null) {
            throw new RuntimeException('Must be called within a Fiber');
        }

        $this->senders[] = [$fiber, $value];
        Fiber::suspend();
    }

    public function receive(): mixed
    {
        // If buffer has data, return from buffer
        if (!empty($this->buffer)) {
            $value = array_shift($this->buffer);

            // Unblock a sender if any
            if (!empty($this->senders)) {
                [$fiber, $senderValue] = array_shift($this->senders);
                $this->buffer[] = $senderValue;
                $fiber->resume();
            }

            return $value;
        }

        // If sender waiting, receive from sender
        if (!empty($this->senders)) {
            [$fiber, $value] = array_shift($this->senders);
            $fiber->resume();
            return $value;
        }

        // Block receiver
        $fiber = Fiber::getCurrent();
        if ($fiber === null) {
            throw new RuntimeException('Must be called within a Fiber');
        }

        $this->receivers[] = $fiber;
        return Fiber::suspend();
    }

    public function close(): void
    {
        // Resume all waiting receivers with null
        while (!empty($this->receivers)) {
            $fiber = array_shift($this->receivers);
            $fiber->resume(null);
        }
    }
}

// Usage
$channel = new Channel(1);

$producer = new Fiber(function() use ($channel) {
    for ($i = 1; $i <= 3; $i++) {
        echo "Sending: $i\n";
        $channel->send($i);
    }
    $channel->close();
});

$consumer = new Fiber(function() use ($channel) {
    while (($value = $channel->receive()) !== null) {
        echo "Received: $value\n";
    }
    echo "Channel closed\n";
});

// Run both fibers
$producer->start();
$consumer->start();

while (!$producer->isTerminated() || !$consumer->isTerminated()) {
    if ($producer->isSuspended()) $producer->resume();
    if ($consumer->isSuspended()) $consumer->resume();
}
```

## Best Practices

### 1. Always Check Fiber State

```php
<?php

function safeFiberResume(Fiber $fiber, mixed $value = null): mixed
{
    if ($fiber->isTerminated()) {
        throw new LogicException('Cannot resume terminated fiber');
    }

    if (!$fiber->isStarted()) {
        return $fiber->start($value);
    }

    if (!$fiber->isSuspended()) {
        throw new LogicException('Fiber is not suspended');
    }

    return $fiber->resume($value);
}
```

### 2. Clean Resource Management

```php
<?php

class FiberScope
{
    private array $cleanup = [];

    public function defer(callable $callback): void
    {
        $this->cleanup[] = $callback;
    }

    public function run(callable $callback): mixed
    {
        try {
            return $callback($this);
        } finally {
            while ($cleanup = array_pop($this->cleanup)) {
                try {
                    $cleanup();
                } catch (Throwable $e) {
                    // Log but don't rethrow
                    error_log("Cleanup error: " . $e->getMessage());
                }
            }
        }
    }
}

// Usage
$scope = new FiberScope();
$scope->run(function($scope) {
    $file = fopen('data.txt', 'r');
    $scope->defer(fn() => fclose($file));

    // Work with file...
    // File will be closed even if exception occurs
});
```

### 3. Timeout Support

```php
<?php

class TimeoutException extends RuntimeException {}

function withTimeout(callable $callback, float $seconds): mixed
{
    $fiber = Fiber::getCurrent();
    $timedOut = false;

    $timerId = Async::getLoop()->addTimer($seconds, function() use ($fiber, &$timedOut) {
        $timedOut = true;
        if ($fiber->isSuspended()) {
            $fiber->throw(new TimeoutException("Operation timed out"));
        }
    });

    try {
        return $callback();
    } finally {
        // Cancel timer if not triggered
        if (!$timedOut) {
            Async::getLoop()->cancelTimer($timerId);
        }
    }
}
```

## Common Pitfalls

### 1. Forgetting to Resume Fibers

```php
<?php

// BAD: Fiber left suspended forever
$fiber = new Fiber(function() {
    Fiber::suspend();
    echo "Never executed\n";
});
$fiber->start();
// Forgot to resume!

// GOOD: Track and ensure completion
$activeFibers = new SplObjectStorage();
// ... proper lifecycle management
```

### 2. Blocking Operations in Fibers

```php
<?php

// BAD: Blocking call blocks everything
$fiber = new Fiber(function() {
    file_get_contents('http://slow-api.com'); // Blocks!
    Fiber::suspend();
});

// GOOD: Use non-blocking I/O
$fiber = new Fiber(function() {
    $result = Async::await($httpClient->get('http://slow-api.com'));
    Fiber::suspend();
});
```

### 3. Shared State Issues

```php
<?php

// BAD: Race condition
$counter = 0;
$fibers = [];

for ($i = 0; $i < 10; $i++) {
    $fibers[] = new Fiber(function() use (&$counter) {
        $temp = $counter;
        Fiber::suspend();
        $counter = $temp + 1;
    });
}

// GOOD: Use proper synchronization
class Mutex
{
    private bool $locked = false;
    private array $waiting = [];

    public function lock(): void
    {
        if (!$this->locked) {
            $this->locked = true;
            return;
        }

        $fiber = Fiber::getCurrent();
        $this->waiting[] = $fiber;
        Fiber::suspend();
    }

    public function unlock(): void
    {
        if (!empty($this->waiting)) {
            $fiber = array_shift($this->waiting);
            $fiber->resume();
        } else {
            $this->locked = false;
        }
    }
}
```

## Performance Considerations

```php
<?php

// Fibers are lightweight but not free
// Memory: ~8KB per fiber for stack
// Creation: Relatively fast but avoid excessive creation

// Good: Reuse fibers with pools
class FiberPool
{
    private array $idle = [];

    public function get(callable $task): Fiber
    {
        // Reuse logic...
    }

    public function release(Fiber $fiber): void
    {
        // Return to pool...
    }
}
```

## Interview Key Points

1. **What are Fibers**: Interruptible functions with preserved state

2. **vs Threads**: Cooperative (explicit yield) vs preemptive, single-threaded

3. **vs Generators**: Can suspend from anywhere in call stack, full context

4. **Use cases**:
   - Async I/O frameworks
   - Coroutines
   - Cooperative multitasking

5. **Key methods**: `start()`, `suspend()`, `resume()`, `throw()`, `getReturn()`

## Further Reading

- [PHP RFC: Fibers](https://wiki.php.net/rfc/fibers)
- [Revolt Event Loop](https://revolt.run/)
- [AMPHP](https://amphp.org/)
- [ReactPHP](https://reactphp.org/)
