---
title: PHP 8.1 Fibers 和协程
description: PHP 8.1 Fibers 完整指南，用于构建协作式多任务和异步应用
track: php
section: performance-security
difficulty: advanced
tags:
  - PHP
  - Fibers
  - 异步
  - 协程
  - 并发
  - PHP 8.1
status: imported
origin: old/src/content/docs/php/fibers.zh.md
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

PHP 8.1 引入了 Fibers，这是一种实现轻量级协作式并发的底层机制。Fibers 支持可中断的函数，可以暂停和恢复，为异步框架和协程奠定了基础。

## 概念解释

Fiber 是一个可以在任何点暂停的代码块，保留其整个执行状态（调用栈、局部变量）。与线程不同，Fibers 不是抢占式调度的 - 它们必须显式让出控制权。

```php
<?php

// 基本 Fiber 示例
$fiber = new Fiber(function(): void {
    echo "1. Fiber 已启动\n";

    // 暂停 fiber 并返回一个值
    $value = Fiber::suspend('suspended');

    echo "3. Fiber 恢复，收到：$value\n";
});

// 启动 fiber
$result = $fiber->start();
echo "2. 主程序收到：$result\n";

// 恢复 fiber 并传入一个值
$fiber->resume('hello');

echo "4. 完成\n";

// 输出：
// 1. Fiber 已启动
// 2. 主程序收到：suspended
// 3. Fiber 恢复，收到：hello
// 4. 完成
```

Fibers 与生成器的区别：
- 生成器只能从生成器函数本身 yield
- Fibers 可以从调用栈的任何位置暂停
- Fibers 保持完整的执行上下文

## 核心原理

### Fiber 生命周期

```php
<?php

$fiber = new Fiber(function(): string {
    echo "启动中...\n";
    $input = Fiber::suspend('paused');
    return "完成，收到：$input";
});

// Fiber 状态
// start() 之前：未启动
echo $fiber->isStarted() ? '已启动' : '未启动'; // 未启动
echo $fiber->isSuspended() ? '已暂停' : '运行中'; // 运行中（false）
echo $fiber->isTerminated() ? '已完成' : '活动中'; // 活动中

// 启动 fiber
$suspended = $fiber->start();
echo "暂停值：$suspended\n";

// 暂停后
echo $fiber->isStarted() ? '已启动' : '未启动'; // 已启动
echo $fiber->isSuspended() ? '已暂停' : '运行中'; // 已暂停

// 恢复并传值
$result = $fiber->resume('data');
echo "结果：$result\n";

// 完成后
echo $fiber->isTerminated() ? '已完成' : '活动中'; // 已完成

// 获取返回值
echo $fiber->getReturn(); // "完成，收到：data"
```

### 异常处理

```php
<?php

// 向 fiber 抛出异常
$fiber = new Fiber(function(): void {
    try {
        echo "Fiber 运行中\n";
        Fiber::suspend();
        echo "这不会打印\n";
    } catch (Exception $e) {
        echo "在 fiber 中捕获：" . $e->getMessage() . "\n";
    }
});

$fiber->start();
$fiber->throw(new Exception("来自主程序的错误"));

// 从 fiber 到主程序的异常
$fiber = new Fiber(function(): void {
    Fiber::suspend();
    throw new RuntimeException("Fiber 错误");
});

$fiber->start();
try {
    $fiber->resume();
} catch (RuntimeException $e) {
    echo "从 fiber 捕获：" . $e->getMessage() . "\n";
}
```

### 获取当前 Fiber

```php
<?php

function deepFunction(): void
{
    $fiber = Fiber::getCurrent();
    if ($fiber !== null) {
        echo "在 fiber 内部！\n";
        Fiber::suspend('from deep');
    } else {
        echo "不在 fiber 中\n";
    }
}

// 在 fiber 外部调用
deepFunction(); // "不在 fiber 中"

// 在 fiber 内部调用
$fiber = new Fiber(function(): void {
    deepFunction();
});
$fiber->start(); // "在 fiber 内部！"
```

## 核心要点

### 构建事件循环

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
            // 处理延迟回调
            while ($callback = array_shift($this->deferred)) {
                $callback();
            }

            // 处理定时器
            $now = microtime(true);
            foreach ($this->timers as $id => $timer) {
                if ($timer['time'] <= $now) {
                    ($timer['callback'])();
                    unset($this->timers[$id]);
                }
            }

            // 检查 I/O
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

### Async/Await 模式

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
     * 运行异步函数
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
     * 暂停当前 fiber 直到 promise 解决
     */
    public static function await(Promise $promise): mixed
    {
        $fiber = Fiber::getCurrent();
        if ($fiber === null) {
            throw new LogicException('await() 必须在异步上下文中调用');
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
     * 非阻塞睡眠
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

// Promise 实现
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

// 使用
Async::run(function() {
    echo "开始...\n";

    Async::sleep(1);
    echo "1 秒后\n";

    Async::sleep(0.5);
    echo "再过 0.5 秒后\n";
});
```

### 非阻塞 HTTP 客户端

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
            $promise->reject(new RuntimeException("连接失败：$errstr"));
            return $promise;
        }

        stream_set_blocking($socket, false);

        $request = "GET $path HTTP/1.1\r\n";
        $request .= "Host: $host\r\n";
        $request .= "Connection: close\r\n\r\n";

        $response = '';
        $connected = false;

        // 等待连接
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

                        // 解析响应
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

// 与 Fibers 一起使用
Async::run(function() {
    $client = new AsyncHttpClient(Async::getLoop());

    echo "获取中...\n";
    $body = Async::await($client->get('http://example.com'));
    echo "响应长度：" . strlen($body) . "\n";
});
```

## 代码示例

### 并发任务执行

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
        // 启动所有任务
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

        // 恢复暂停的任务
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
                usleep(1000); // 小延迟
            }
        }

        return $this->results;
    }
}

// 使用示例
$scheduler = new TaskScheduler();

$scheduler->add('task1', function(): string {
    for ($i = 0; $i < 3; $i++) {
        echo "任务 1：步骤 $i\n";
        Fiber::suspend();
    }
    return "任务 1 完成";
});

$scheduler->add('task2', function(): string {
    for ($i = 0; $i < 2; $i++) {
        echo "任务 2：步骤 $i\n";
        Fiber::suspend();
    }
    return "任务 2 完成";
});

$results = $scheduler->run();
print_r($results);
```

### 数据库连接池

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
        // 返回可用连接
        if (!empty($this->available)) {
            return array_pop($this->available);
        }

        // 如果未达上限则创建新连接
        if ($this->created < $this->size) {
            $this->created++;
            return ($this->factory)();
        }

        // 等待连接释放
        $fiber = Fiber::getCurrent();
        if ($fiber === null) {
            throw new RuntimeException('必须在 Fiber 中调用');
        }

        $this->waiting[] = $fiber;
        return Fiber::suspend();
    }

    public function release(mixed $connection): void
    {
        // 给等待的 fiber 或返回池中
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

// 使用
$pool = new ConnectionPool(5, function() {
    return new PDO('mysql:host=localhost;dbname=test', 'user', 'pass');
});

// 在 fiber 上下文中
$result = $pool->withConnection(function($pdo) {
    return $pdo->query('SELECT * FROM users')->fetchAll();
});
```

### 基于通道的通信

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
        // 如果有接收者等待，直接给
        if (!empty($this->receivers)) {
            $fiber = array_shift($this->receivers);
            $fiber->resume($value);
            return;
        }

        // 如果缓冲区有空间，加入缓冲区
        if ($this->capacity > 0 && count($this->buffer) < $this->capacity) {
            $this->buffer[] = $value;
            return;
        }

        // 阻塞发送者
        $fiber = Fiber::getCurrent();
        if ($fiber === null) {
            throw new RuntimeException('必须在 Fiber 中调用');
        }

        $this->senders[] = [$fiber, $value];
        Fiber::suspend();
    }

    public function receive(): mixed
    {
        // 如果缓冲区有数据，从缓冲区返回
        if (!empty($this->buffer)) {
            $value = array_shift($this->buffer);

            // 如果有发送者，解除阻塞
            if (!empty($this->senders)) {
                [$fiber, $senderValue] = array_shift($this->senders);
                $this->buffer[] = $senderValue;
                $fiber->resume();
            }

            return $value;
        }

        // 如果有发送者等待，从发送者接收
        if (!empty($this->senders)) {
            [$fiber, $value] = array_shift($this->senders);
            $fiber->resume();
            return $value;
        }

        // 阻塞接收者
        $fiber = Fiber::getCurrent();
        if ($fiber === null) {
            throw new RuntimeException('必须在 Fiber 中调用');
        }

        $this->receivers[] = $fiber;
        return Fiber::suspend();
    }

    public function close(): void
    {
        // 恢复所有等待的接收者并返回 null
        while (!empty($this->receivers)) {
            $fiber = array_shift($this->receivers);
            $fiber->resume(null);
        }
    }
}

// 使用
$channel = new Channel(1);

$producer = new Fiber(function() use ($channel) {
    for ($i = 1; $i <= 3; $i++) {
        echo "发送：$i\n";
        $channel->send($i);
    }
    $channel->close();
});

$consumer = new Fiber(function() use ($channel) {
    while (($value = $channel->receive()) !== null) {
        echo "接收：$value\n";
    }
    echo "通道已关闭\n";
});

// 运行两个 fiber
$producer->start();
$consumer->start();

while (!$producer->isTerminated() || !$consumer->isTerminated()) {
    if ($producer->isSuspended()) $producer->resume();
    if ($consumer->isSuspended()) $consumer->resume();
}
```

## 最佳实践

### 1. 始终检查 Fiber 状态

```php
<?php

function safeFiberResume(Fiber $fiber, mixed $value = null): mixed
{
    if ($fiber->isTerminated()) {
        throw new LogicException('无法恢复已终止的 fiber');
    }

    if (!$fiber->isStarted()) {
        return $fiber->start($value);
    }

    if (!$fiber->isSuspended()) {
        throw new LogicException('Fiber 未暂停');
    }

    return $fiber->resume($value);
}
```

### 2. 清理资源管理

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
                    // 记录但不重新抛出
                    error_log("清理错误：" . $e->getMessage());
                }
            }
        }
    }
}

// 使用
$scope = new FiberScope();
$scope->run(function($scope) {
    $file = fopen('data.txt', 'r');
    $scope->defer(fn() => fclose($file));

    // 使用文件...
    // 即使发生异常，文件也会被关闭
});
```

### 3. 超时支持

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
            $fiber->throw(new TimeoutException("操作超时"));
        }
    });

    try {
        return $callback();
    } finally {
        // 如果未触发则取消定时器
        if (!$timedOut) {
            Async::getLoop()->cancelTimer($timerId);
        }
    }
}
```

## 常见陷阱

### 1. 忘记恢复 Fiber

```php
<?php

// 错误：Fiber 永远保持暂停
$fiber = new Fiber(function() {
    Fiber::suspend();
    echo "永远不会执行\n";
});
$fiber->start();
// 忘记恢复！

// 正确：跟踪并确保完成
$activeFibers = new SplObjectStorage();
// ... 正确的生命周期管理
```

### 2. Fiber 中的阻塞操作

```php
<?php

// 错误：阻塞调用阻塞一切
$fiber = new Fiber(function() {
    file_get_contents('http://slow-api.com'); // 阻塞！
    Fiber::suspend();
});

// 正确：使用非阻塞 I/O
$fiber = new Fiber(function() {
    $result = Async::await($httpClient->get('http://slow-api.com'));
    Fiber::suspend();
});
```

### 3. 共享状态问题

```php
<?php

// 错误：竞态条件
$counter = 0;
$fibers = [];

for ($i = 0; $i < 10; $i++) {
    $fibers[] = new Fiber(function() use (&$counter) {
        $temp = $counter;
        Fiber::suspend();
        $counter = $temp + 1;
    });
}

// 正确：使用适当的同步
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

## 性能考量

```php
<?php

// Fibers 是轻量级的但不是免费的
// 内存：每个 fiber 约 8KB 用于栈
// 创建：相对较快但避免过多创建

// 好：用池复用 fibers
class FiberPool
{
    private array $idle = [];

    public function get(callable $task): Fiber
    {
        // 复用逻辑...
    }

    public function release(Fiber $fiber): void
    {
        // 返回池中...
    }
}
```

## 面试要点

1. **什么是 Fibers**：可中断的函数，保留状态

2. **vs 线程**：协作式（显式让出）vs 抢占式，单线程

3. **vs 生成器**：可从调用栈任何位置暂停，完整上下文

4. **用例**：
   - 异步 I/O 框架
   - 协程
   - 协作式多任务

5. **关键方法**：`start()`、`suspend()`、`resume()`、`throw()`、`getReturn()`

## 延伸阅读

- [PHP RFC: Fibers](https://wiki.php.net/rfc/fibers)
- [Revolt 事件循环](https://revolt.run/)
- [AMPHP](https://amphp.org/)
- [ReactPHP](https://reactphp.org/)
