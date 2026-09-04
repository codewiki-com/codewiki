---
title: Rust 线程详解
description: 深入理解 Rust 标准库线程模型：std::thread、spawn、join、move 闭包与作用域线程
track: rust
section: concurrency-async
difficulty: intermediate
tags:
  - Rust
  - 线程
  - 并发
  - std::thread
  - spawn
  - join
  - thread::scope
status: imported
origin: old/src/content/docs/rust/threads.zh.md
divergence: 0.221
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Rust
  subcategory: 并发
  order: 5
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是线程

线程是操作系统能够进行运算调度的最小单位，是进程中的实际执行单元。多线程编程允许程序同时执行多个任务，充分利用多核处理器的计算能力，提升程序的整体性能和响应速度。

Rust 通过标准库 `std::thread` 模块提供了 1:1 线程模型，即每个 Rust 线程直接对应一个操作系统线程。这种模型保证了最佳的系统集成性和可预测的性能特征。

### 历史背景

在 Rust 1.0 之前，曾经支持过 M:N 线程模型（绿色线程），但为了保持语言的简洁性和零成本抽象原则，最终选择了 1:1 模型。绿色线程虽然开销更小，但需要更大的运行时支持，这与 Rust 的设计理念相悖。

Rust 1.63（2022年8月发布）引入了作用域线程（`thread::scope`），这是线程 API 的重大改进，解决了传统 `spawn` 需要 `'static` 生命周期的限制。

### 解决什么问题

传统的多线程编程面临诸多挑战：

1. **数据竞争**：多个线程同时读写同一数据
2. **内存安全**：悬垂指针、use-after-free 等问题
3. **生命周期管理**：确保线程访问的数据在其存活期间有效

Rust 通过所有权系统和类型系统在编译时解决这些问题，将运行时错误转化为编译时错误。

## 核心原理

### 线程模型架构

```
┌─────────────────────────────────────────────────────┐
│                    Rust 程序                        │
├─────────────────────────────────────────────────────┤
│    std::thread API                                  │
│    ┌─────────┬─────────┬──────────┬───────────┐    │
│    │ spawn   │  join   │  scope   │  Builder  │    │
│    └─────────┴─────────┴──────────┴───────────┘    │
├─────────────────────────────────────────────────────┤
│    操作系统线程接口                                  │
│    (pthread / Windows Threads)                     │
├─────────────────────────────────────────────────────┤
│    硬件 (CPU 核心)                                  │
│    ┌────┐ ┌────┐ ┌────┐ ┌────┐                     │
│    │Core│ │Core│ │Core│ │Core│                     │
│    └────┘ └────┘ └────┘ └────┘                     │
└─────────────────────────────────────────────────────┘
```

### JoinHandle 机制

`thread::spawn` 返回一个 `JoinHandle<T>`，它是线程的句柄，具有以下特性：

- **所有权转移**：`JoinHandle` 拥有对应线程的所有权
- **阻塞等待**：调用 `join()` 会阻塞当前线程直到目标线程完成
- **返回值传递**：`join()` 返回 `Result<T, Box<dyn Any + Send>>`
- **自动分离**：如果 `JoinHandle` 被丢弃而未调用 `join()`，线程会自动分离（detach）

```
┌──────────────────┐         ┌──────────────────┐
│    主线程        │         │    子线程        │
├──────────────────┤         ├──────────────────┤
│ spawn() ─────────┼────────►│ 开始执行         │
│ 返回 JoinHandle  │         │  ...             │
│   ...            │         │  ...             │
│ join() ──────────┼─────────│ 完成执行         │
│ 阻塞等待         │◄────────┼─ 返回结果        │
│ 继续执行         │         │                  │
└──────────────────┘         └──────────────────┘
```

### move 闭包的所有权转移

当闭包捕获外部变量时，Rust 需要确定如何捕获：

- **借用**：默认方式，闭包借用变量
- **移动**：使用 `move` 关键字，闭包获取变量所有权

在线程中必须使用 `move`，因为编译器无法保证借用在线程生命周期内有效：

```
主线程栈帧:
┌─────────────────┐
│ data: Vec<i32>  │──── 所有权 ────┐
└─────────────────┘                │
                                   ▼
子线程:                   ┌──────────────────┐
┌─────────────────┐      │ 闭包环境         │
│ 执行闭包        │◄─────│ data: Vec<i32>   │
└─────────────────┘      └──────────────────┘
```

### 作用域线程原理

`thread::scope` 创建一个作用域，在该作用域内创建的线程：

1. 保证在作用域结束前完成
2. 可以安全借用栈上数据（无需 `'static`）
3. 自动 join 所有子线程

```
┌─────────────────────────────────────────┐
│ fn main() {                             │
│     let data = vec![1, 2, 3];           │
│     ┌─────────────────────────────────┐ │
│     │ thread::scope(|s| {             │ │
│     │     s.spawn(|| {                │ │
│     │         // 可以借用 data        │ │
│     │         println!("{:?}", data); │ │
│     │     });                         │ │
│     │     // 作用域结束时自动 join    │ │
│     │ });                             │ │
│     └─────────────────────────────────┘ │
│     // 保证线程已完成，可继续使用 data   │
│     data.push(4);                       │
│ }                                       │
└─────────────────────────────────────────┘
```

## 核心要点

### std::thread 模块概览

| 组件 | 说明 |
|------|------|
| `spawn` | 创建新线程，返回 `JoinHandle` |
| `JoinHandle` | 线程句柄，用于 join 和获取返回值 |
| `scope` | 创建作用域线程环境 |
| `Scope` | 作用域类型，提供 `spawn` 方法 |
| `ScopedJoinHandle` | 作用域线程句柄 |
| `Builder` | 线程配置构建器 |
| `current` | 获取当前线程句柄 |
| `sleep` | 线程休眠 |
| `yield_now` | 主动让出 CPU |
| `park` / `unpark` | 线程挂起与唤醒 |
| `available_parallelism` | 获取可用并行度 |

### spawn vs scope 对比

| 特性 | `spawn` | `scope` |
|------|---------|---------|
| 生命周期要求 | `'static` | 可借用局部变量 |
| join 方式 | 手动调用 `join()` | 自动 join |
| 返回句柄 | `JoinHandle<T>` | `ScopedJoinHandle<'scope, T>` |
| 线程分离 | 可分离 | 不可分离 |
| 使用场景 | 长时间运行的任务 | 临时并行计算 |

### 线程安全保证

Rust 通过以下机制保证线程安全：

1. **Send trait**：类型可安全地在线程间转移所有权
2. **Sync trait**：类型可安全地在线程间共享引用
3. **所有权系统**：编译时检查数据访问的合法性
4. **生命周期检查**：确保引用在使用期间有效

## 代码示例

### 基础线程创建与 join

```rust
use std::thread;
use std::time::Duration;

fn main() {
    println!("主线程开始");

    // spawn 返回 JoinHandle
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("子线程: 计数 {}", i);
            thread::sleep(Duration::from_millis(100));
        }
        "子线程完成" // 返回值
    });

    // 主线程继续执行
    for i in 1..=3 {
        println!("主线程: 计数 {}", i);
        thread::sleep(Duration::from_millis(150));
    }

    // join 等待子线程完成并获取返回值
    let result = handle.join().unwrap();
    println!("子线程返回: {}", result);

    println!("主线程结束");
}

// 输出示例:
// 主线程开始
// 主线程: 计数 1
// 子线程: 计数 1
// 子线程: 计数 2
// 主线程: 计数 2
// 子线程: 计数 3
// 主线程: 计数 3
// 子线程: 计数 4
// 子线程: 计数 5
// 子线程返回: 子线程完成
// 主线程结束
```

### move 闭包详解

```rust
use std::thread;

fn main() {
    // 示例1: 必须使用 move
    let numbers = vec![1, 2, 3, 4, 5];

    let handle = thread::spawn(move || {
        // numbers 的所有权已转移到此闭包
        let sum: i32 = numbers.iter().sum();
        println!("向量求和: {}", sum);
        sum
    });

    // 错误! numbers 已被移动
    // println!("{:?}", numbers);

    let result = handle.join().unwrap();
    println!("结果: {}", result);

    // 示例2: 克隆后再 move
    let data = String::from("Hello");
    let data_clone = data.clone();

    let handle = thread::spawn(move || {
        println!("线程中: {}", data_clone);
    });

    // 原始 data 仍可用
    println!("主线程: {}", data);
    handle.join().unwrap();

    // 示例3: 多个变量的 move
    let name = String::from("Rust");
    let version = 2021u32;
    let features = vec!["安全", "并发", "高效"];

    let handle = thread::spawn(move || {
        // 所有变量都被移动到闭包中
        println!("{} {} 的特性: {:?}", name, version, features);
    });

    handle.join().unwrap();
}
```

### 线程返回值与错误处理

```rust
use std::thread;

fn main() {
    // 正常返回
    let handle = thread::spawn(|| -> i32 {
        let mut sum = 0;
        for i in 1..=100 {
            sum += i;
        }
        sum
    });

    match handle.join() {
        Ok(result) => println!("计算结果: {}", result),
        Err(e) => println!("线程 panic: {:?}", e),
    }

    // 线程 panic 的处理
    let handle = thread::spawn(|| {
        panic!("子线程出错了!");
    });

    match handle.join() {
        Ok(_) => println!("线程正常完成"),
        Err(e) => {
            // 尝试将 panic 信息转换为字符串
            if let Some(msg) = e.downcast_ref::<&str>() {
                println!("线程 panic 信息: {}", msg);
            } else if let Some(msg) = e.downcast_ref::<String>() {
                println!("线程 panic 信息: {}", msg);
            } else {
                println!("线程发生未知 panic");
            }
        }
    }

    // 返回 Result 类型
    let handle = thread::spawn(|| -> Result<i32, String> {
        let value = 42;
        if value > 0 {
            Ok(value * 2)
        } else {
            Err("值必须为正数".to_string())
        }
    });

    match handle.join() {
        Ok(Ok(result)) => println!("成功: {}", result),
        Ok(Err(e)) => println!("业务错误: {}", e),
        Err(_) => println!("线程 panic"),
    }
}
```

### 作用域线程 (thread::scope)

```rust
use std::thread;

fn main() {
    let mut data = vec![1, 2, 3, 4, 5];
    let config = "处理配置";

    // scope 内的线程可以借用局部变量
    thread::scope(|s| {
        // 不可变借用
        s.spawn(|| {
            println!("线程1读取配置: {}", config);
            println!("线程1读取数据: {:?}", data);
        });

        // 另一个不可变借用
        s.spawn(|| {
            let sum: i32 = data.iter().sum();
            println!("线程2计算总和: {}", sum);
        });

        // 可以创建更多线程
        for i in 0..3 {
            s.spawn(move || {
                println!("工作线程 {} 执行", i);
            });
        }
    });
    // 所有线程在此自动 join

    // 可以继续使用和修改数据
    data.push(6);
    println!("最终数据: {:?}", data);
}
```

### 可变借用与作用域线程

```rust
use std::thread;

fn main() {
    let mut results = vec![0; 5];

    thread::scope(|s| {
        // 使用 iter_mut 分割可变借用
        for (i, result) in results.iter_mut().enumerate() {
            s.spawn(move || {
                // 每个线程独占一个元素的可变引用
                *result = (i + 1) * 10;
                println!("线程 {} 设置结果为 {}", i, *result);
            });
        }
    });

    println!("所有结果: {:?}", results);
    // 输出: 所有结果: [10, 20, 30, 40, 50]
}
```

### thread::Builder 高级配置

```rust
use std::thread;

fn main() {
    // 自定义线程名称和栈大小
    let builder = thread::Builder::new()
        .name("计算线程".to_string())
        .stack_size(4 * 1024 * 1024); // 4MB 栈

    let handle = builder.spawn(|| {
        let current = thread::current();
        println!("线程名称: {:?}", current.name());
        println!("线程 ID: {:?}", current.id());

        // 大量栈分配（需要大栈）
        let large_array = [0u8; 1024 * 1024]; // 1MB
        println!("分配了大数组，长度: {}", large_array.len());
    }).expect("线程创建失败");

    handle.join().unwrap();

    // 获取可用并行度
    match thread::available_parallelism() {
        Ok(count) => println!("可用并行度: {}", count),
        Err(e) => println!("无法获取并行度: {}", e),
    }
}
```

### 线程间数据共享模式

```rust
use std::thread;
use std::sync::Arc;

fn main() {
    // 使用 Arc 在多线程间共享不可变数据
    let shared_data = Arc::new(vec![1, 2, 3, 4, 5]);
    let mut handles = vec![];

    for i in 0..3 {
        // 克隆 Arc（仅增加引用计数）
        let data = Arc::clone(&shared_data);
        let handle = thread::spawn(move || {
            println!("线程 {} 读取数据: {:?}", i, data);
            let sum: i32 = data.iter().sum();
            println!("线程 {} 计算总和: {}", i, sum);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    // Arc 在所有线程结束后仍可用
    println!("共享数据引用计数: {}", Arc::strong_count(&shared_data));
}
```

### 线程控制：park 与 unpark

```rust
use std::thread;
use std::time::Duration;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

fn main() {
    let ready = Arc::new(AtomicBool::new(false));
    let ready_clone = Arc::clone(&ready);

    let handle = thread::spawn(move || {
        println!("工作线程: 等待信号...");

        // 挂起线程，等待被唤醒
        while !ready_clone.load(Ordering::Relaxed) {
            thread::park();
        }

        println!("工作线程: 收到信号，开始工作");
        thread::sleep(Duration::from_millis(100));
        println!("工作线程: 工作完成");
    });

    // 主线程准备
    println!("主线程: 准备数据...");
    thread::sleep(Duration::from_millis(500));

    // 设置就绪标志并唤醒工作线程
    ready.store(true, Ordering::Relaxed);
    handle.thread().unpark();

    println!("主线程: 已发送信号");
    handle.join().unwrap();
}
```

### 创建多个线程并收集结果

```rust
use std::thread;

fn main() {
    let input_data: Vec<i32> = (1..=10).collect();

    // 创建多个线程处理数据
    let handles: Vec<_> = input_data
        .into_iter()
        .map(|n| {
            thread::spawn(move || {
                // 模拟计算
                let result = n * n;
                println!("计算 {}^2 = {}", n, result);
                result
            })
        })
        .collect();

    // 收集所有结果
    let results: Vec<i32> = handles
        .into_iter()
        .map(|h| h.join().unwrap())
        .collect();

    println!("所有结果: {:?}", results);
    println!("结果总和: {}", results.iter().sum::<i32>());
}
```

### 使用 scope 进行并行分块处理

```rust
use std::thread;

fn main() {
    let data: Vec<i32> = (1..=100).collect();
    let chunk_size = 25;

    let mut partial_sums = vec![0i32; 4];

    thread::scope(|s| {
        for (chunk, sum) in data.chunks(chunk_size).zip(partial_sums.iter_mut()) {
            s.spawn(move || {
                *sum = chunk.iter().sum();
                println!("分块求和: {:?} = {}", chunk, *sum);
            });
        }
    });

    let total: i32 = partial_sums.iter().sum();
    println!("分块结果: {:?}", partial_sums);
    println!("总和: {}", total);
}
```

## 最佳实践

### 优先使用 scope 而非 spawn

```rust
use std::thread;

fn process_data(data: &[i32]) {
    // 推荐: 使用 scope，可以借用参数
    thread::scope(|s| {
        for chunk in data.chunks(10) {
            s.spawn(|| {
                println!("处理: {:?}", chunk);
            });
        }
    });
}

fn main() {
    let data: Vec<i32> = (1..=50).collect();
    process_data(&data);
    println!("处理完成，数据仍可用: {:?}", &data[..5]);
}
```

### 合理设置线程数量

```rust
use std::thread;

fn main() {
    // 获取推荐的并行度
    let num_threads = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4);

    println!("使用 {} 个工作线程", num_threads);

    let work_items: Vec<i32> = (0..100).collect();
    let chunk_size = (work_items.len() + num_threads - 1) / num_threads;

    thread::scope(|s| {
        for (i, chunk) in work_items.chunks(chunk_size).enumerate() {
            s.spawn(move || {
                println!("线程 {} 处理 {} 个项目", i, chunk.len());
            });
        }
    });
}
```

### 避免不必要的 clone

```rust
use std::thread;
use std::sync::Arc;

fn main() {
    // 好: 使用 Arc 共享大数据
    let large_data = Arc::new(vec![0u8; 1_000_000]);

    let handles: Vec<_> = (0..4)
        .map(|i| {
            let data = Arc::clone(&large_data); // 仅复制指针，O(1)
            thread::spawn(move || {
                println!("线程 {} 读取数据长度: {}", i, data.len());
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
}
```

### 正确处理线程 panic

```rust
use std::thread;

fn main() {
    let handles: Vec<_> = (0..5)
        .map(|i| {
            thread::spawn(move || {
                if i == 3 {
                    panic!("线程 {} 出错", i);
                }
                i * 10
            })
        })
        .collect();

    let mut results = Vec::new();
    let mut errors = Vec::new();

    for (i, handle) in handles.into_iter().enumerate() {
        match handle.join() {
            Ok(result) => results.push(result),
            Err(_) => errors.push(i),
        }
    }

    println!("成功结果: {:?}", results);
    println!("失败线程: {:?}", errors);
}
```

### 使用 Builder 命名线程便于调试

```rust
use std::thread;

fn main() {
    let handles: Vec<_> = ["数据处理", "日志记录", "网络请求"]
        .iter()
        .map(|name| {
            thread::Builder::new()
                .name(name.to_string())
                .spawn(|| {
                    let current = thread::current();
                    println!("[{}] 开始执行", current.name().unwrap_or("unknown"));
                    // 工作...
                    println!("[{}] 执行完成", current.name().unwrap_or("unknown"));
                })
                .unwrap()
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
}
```

## 常见陷阱

### 陷阱1: 忘记 join 导致程序提前退出

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // 错误: 不 join，主线程可能在子线程完成前退出
    thread::spawn(|| {
        thread::sleep(Duration::from_secs(1));
        println!("这可能不会被打印!");
    });

    println!("主线程结束");
    // 程序退出，子线程被强制终止
}
```

**解决方案**:
```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        thread::sleep(Duration::from_secs(1));
        println!("现在一定会被打印!");
    });

    println!("主线程等待子线程...");
    handle.join().unwrap();
    println!("主线程结束");
}
```

### 陷阱2: 忘记使用 move 关键字

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3];

    // 编译错误! 闭包可能比 data 活得更久
    // let handle = thread::spawn(|| {
    //     println!("{:?}", data);
    // });

    // 正确: 使用 move
    let handle = thread::spawn(move || {
        println!("{:?}", data);
    });

    handle.join().unwrap();
}
```

### 陷阱3: 在循环中错误地共享变量

```rust
use std::thread;
use std::sync::Arc;

fn main() {
    let data = Arc::new(vec![1, 2, 3]);

    // 错误: 在循环外创建 Arc，会多次移动同一个变量
    // for i in 0..3 {
    //     let data = Arc::clone(&data);  // 这里正确
    //     thread::spawn(move || {
    //         println!("{}: {:?}", i, data);
    //     });
    // }

    // 正确: 需要收集 handles 并 join
    let handles: Vec<_> = (0..3)
        .map(|i| {
            let data = Arc::clone(&data);
            thread::spawn(move || {
                println!("{}: {:?}", i, data);
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
}
```

### 陷阱4: scope 内 spawn 后尝试修改数据

```rust
use std::thread;

fn main() {
    let mut data = vec![1, 2, 3];

    thread::scope(|s| {
        // 不可变借用
        s.spawn(|| {
            println!("{:?}", data);
        });

        // 编译错误! data 已被借用
        // data.push(4);

        // 也不能在此创建可变借用的线程
        // s.spawn(|| {
        //     data.push(4);  // 错误: 与上面的不可变借用冲突
        // });
    });

    // scope 结束后可以修改
    data.push(4);
    println!("{:?}", data);
}
```

### 陷阱5: 过度使用线程

```rust
use std::thread;

fn main() {
    // 不好: 为每个小任务创建线程
    // let handles: Vec<_> = (0..10000)
    //     .map(|i| thread::spawn(move || i * 2))
    //     .collect();

    // 好: 批量处理
    let data: Vec<i32> = (0..10000).collect();
    let num_threads = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4);

    let chunk_size = (data.len() + num_threads - 1) / num_threads;

    let results: Vec<i32> = thread::scope(|s| {
        let handles: Vec<_> = data
            .chunks(chunk_size)
            .map(|chunk| {
                s.spawn(move || {
                    chunk.iter().map(|&x| x * 2).collect::<Vec<_>>()
                })
            })
            .collect();

        handles
            .into_iter()
            .flat_map(|h| h.join().unwrap())
            .collect()
    });

    println!("处理了 {} 个结果", results.len());
}
```

## 性能考量

### 线程创建开销

```rust
use std::thread;
use std::time::Instant;

fn main() {
    // 测试线程创建开销
    let iterations = 1000;

    let start = Instant::now();
    let handles: Vec<_> = (0..iterations)
        .map(|_| thread::spawn(|| {}))
        .collect();

    for h in handles {
        h.join().unwrap();
    }

    let duration = start.elapsed();
    println!(
        "创建并 join {} 个线程耗时: {:?}",
        iterations, duration
    );
    println!(
        "平均每个线程: {:?}",
        duration / iterations
    );

    // 典型结果: 每个线程约 10-100 微秒
    // 对于小任务，这个开销可能比任务本身还大
}
```

### scope vs spawn 性能对比

```rust
use std::thread;
use std::time::Instant;

fn main() {
    let data: Vec<i32> = (0..1000).collect();
    let iterations = 100;

    // 测试 spawn
    let start = Instant::now();
    for _ in 0..iterations {
        let data_clone = data.clone();
        let handle = thread::spawn(move || {
            data_clone.iter().sum::<i32>()
        });
        let _ = handle.join().unwrap();
    }
    println!("spawn {} 次耗时: {:?}", iterations, start.elapsed());

    // 测试 scope
    let start = Instant::now();
    for _ in 0..iterations {
        thread::scope(|s| {
            s.spawn(|| {
                data.iter().sum::<i32>()
            });
        });
    }
    println!("scope {} 次耗时: {:?}", iterations, start.elapsed());

    // scope 通常更快，因为:
    // 1. 不需要 clone 数据
    // 2. 编译器可能有更好的优化机会
}
```

### 栈大小对性能的影响

```rust
use std::thread;
use std::time::Instant;

fn main() {
    // 默认栈大小（通常 2MB-8MB）
    let start = Instant::now();
    let h = thread::spawn(|| {});
    h.join().unwrap();
    println!("默认栈: {:?}", start.elapsed());

    // 小栈
    let start = Instant::now();
    let h = thread::Builder::new()
        .stack_size(64 * 1024) // 64KB
        .spawn(|| {})
        .unwrap();
    h.join().unwrap();
    println!("64KB 栈: {:?}", start.elapsed());

    // 对于不需要大量栈空间的任务，
    // 小栈可以减少内存占用，但创建速度差异不大
}
```

### 并行度选择

```rust
use std::thread;
use std::time::Instant;

fn cpu_intensive_work(n: u64) -> u64 {
    (0..n).fold(0, |acc, x| acc.wrapping_add(x.wrapping_mul(x)))
}

fn main() {
    let work_size = 10_000_000u64;
    let total_work = work_size * 8;

    // 测试不同线程数
    for num_threads in [1, 2, 4, 8, 16] {
        let chunk_size = total_work / num_threads as u64;

        let start = Instant::now();

        thread::scope(|s| {
            let _handles: Vec<_> = (0..num_threads)
                .map(|_| {
                    s.spawn(move || {
                        cpu_intensive_work(chunk_size)
                    })
                })
                .collect();
        });

        println!(
            "{} 线程耗时: {:?}",
            num_threads,
            start.elapsed()
        );
    }

    // 通常在线程数等于 CPU 核心数时性能最佳
    // 超过后由于上下文切换开销，性能可能下降
}
```

## 实战场景

### 场景1: 并行文件处理

```rust
use std::thread;
use std::fs;
use std::path::Path;

fn count_lines(content: &str) -> usize {
    content.lines().count()
}

fn count_words(content: &str) -> usize {
    content.split_whitespace().count()
}

fn count_chars(content: &str) -> usize {
    content.chars().count()
}

fn main() {
    // 模拟文件内容
    let files = vec![
        ("file1.txt", "Hello World\nThis is Rust\nGreat language"),
        ("file2.txt", "Concurrent programming\nis fun\nand safe"),
        ("file3.txt", "Threads are\npowerful\nbut use wisely"),
    ];

    let results: Vec<_> = thread::scope(|s| {
        files
            .iter()
            .map(|(name, content)| {
                s.spawn(move || {
                    let lines = count_lines(content);
                    let words = count_words(content);
                    let chars = count_chars(content);
                    (*name, lines, words, chars)
                })
            })
            .collect::<Vec<_>>()
            .into_iter()
            .map(|h| h.join().unwrap())
            .collect()
    });

    println!("{:<15} {:>6} {:>6} {:>6}", "文件", "行数", "词数", "字符");
    println!("{}", "-".repeat(40));
    for (name, lines, words, chars) in results {
        println!("{:<15} {:>6} {:>6} {:>6}", name, lines, words, chars);
    }
}
```

### 场景2: 并行数据验证

```rust
use std::thread;

#[derive(Debug)]
struct ValidationResult {
    field: String,
    is_valid: bool,
    message: Option<String>,
}

fn validate_email(email: &str) -> ValidationResult {
    let is_valid = email.contains('@') && email.contains('.');
    ValidationResult {
        field: "email".to_string(),
        is_valid,
        message: if is_valid { None } else { Some("无效的邮箱格式".to_string()) },
    }
}

fn validate_phone(phone: &str) -> ValidationResult {
    let is_valid = phone.chars().filter(|c| c.is_numeric()).count() >= 10;
    ValidationResult {
        field: "phone".to_string(),
        is_valid,
        message: if is_valid { None } else { Some("电话号码太短".to_string()) },
    }
}

fn validate_password(password: &str) -> ValidationResult {
    let has_upper = password.chars().any(|c| c.is_uppercase());
    let has_lower = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_numeric());
    let long_enough = password.len() >= 8;

    let is_valid = has_upper && has_lower && has_digit && long_enough;
    ValidationResult {
        field: "password".to_string(),
        is_valid,
        message: if is_valid { None } else {
            Some("密码需要大小写字母和数字，至少8位".to_string())
        },
    }
}

fn main() {
    let email = "user@example.com";
    let phone = "1234567890";
    let password = "SecurePass123";

    // 并行执行所有验证
    let results = thread::scope(|s| {
        let email_result = s.spawn(|| validate_email(email));
        let phone_result = s.spawn(|| validate_phone(phone));
        let password_result = s.spawn(|| validate_password(password));

        vec![
            email_result.join().unwrap(),
            phone_result.join().unwrap(),
            password_result.join().unwrap(),
        ]
    });

    println!("验证结果:");
    for result in &results {
        let status = if result.is_valid { "OK" } else { "FAIL" };
        print!("  {}: {} ", result.field, status);
        if let Some(msg) = &result.message {
            print!("- {}", msg);
        }
        println!();
    }

    let all_valid = results.iter().all(|r| r.is_valid);
    println!("\n整体验证: {}", if all_valid { "通过" } else { "失败" });
}
```

### 场景3: 生产者-消费者模式（简化版）

```rust
use std::thread;
use std::sync::mpsc;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    // 生产者线程
    let producer = thread::spawn(move || {
        for i in 1..=10 {
            println!("[生产者] 生产任务 {}", i);
            tx.send(i).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
        println!("[生产者] 完成生产");
    });

    // 消费者线程
    let consumer = thread::spawn(move || {
        let mut total = 0;
        for received in rx {
            println!("[消费者] 处理任务 {}", received);
            total += received;
            thread::sleep(Duration::from_millis(50));
        }
        println!("[消费者] 处理完成，总和: {}", total);
        total
    });

    producer.join().unwrap();
    let result = consumer.join().unwrap();
    println!("最终结果: {}", result);
}
```

### 场景4: 超时任务执行

```rust
use std::thread;
use std::sync::mpsc;
use std::time::Duration;

fn run_with_timeout<F, T>(f: F, timeout: Duration) -> Option<T>
where
    F: FnOnce() -> T + Send + 'static,
    T: Send + 'static,
{
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let result = f();
        let _ = tx.send(result);
    });

    rx.recv_timeout(timeout).ok()
}

fn main() {
    // 快速任务
    let result = run_with_timeout(
        || {
            thread::sleep(Duration::from_millis(100));
            "快速任务完成"
        },
        Duration::from_secs(1),
    );
    println!("快速任务: {:?}", result);

    // 慢速任务（超时）
    let result = run_with_timeout(
        || {
            thread::sleep(Duration::from_secs(5));
            "慢速任务完成"
        },
        Duration::from_secs(1),
    );
    println!("慢速任务: {:?}", result);
}
```

## 面试要点

### spawn 和 scope 的区别是什么？

**答案要点**:
- `spawn` 创建的线程具有 `'static` 生命周期，必须拥有所有捕获数据的所有权
- `scope` 创建的线程可以借用局部变量，因为保证在作用域结束前完成
- `spawn` 需要手动 `join`，`scope` 会自动等待所有线程
- `spawn` 的线程可以被分离（detach），`scope` 的线程不能

### 为什么 spawn 需要 move 关键字？

**答案要点**:
```rust
// 编译器无法保证借用的生命周期
let data = vec![1, 2, 3];
// thread::spawn(|| println!("{:?}", data)); // 错误!

// move 将所有权转移给闭包
thread::spawn(move || println!("{:?}", data)); // 正确
```
编译器无法证明 `data` 会比线程活得更久，因此需要通过 `move` 转移所有权来保证安全。

### JoinHandle 的 join 方法返回什么？

**答案要点**:
- 返回 `Result<T, Box<dyn Any + Send>>`
- `Ok(T)`: 线程正常完成，T 是线程闭包的返回值
- `Err`: 线程发生 panic，可以尝试 downcast 获取 panic 信息

### 如何在多线程间共享数据？

**答案要点**:
- 不可变数据：使用 `Arc<T>` 共享引用计数指针
- 可变数据：使用 `Arc<Mutex<T>>` 或 `Arc<RwLock<T>>`
- 作用域线程：直接借用，无需包装
- 单向传递：使用 channel（`mpsc`）

### 什么是线程安全？Rust 如何保证？

**答案要点**:
- 线程安全意味着多线程并发访问时不会产生数据竞争
- Rust 通过 `Send` 和 `Sync` trait 在编译时保证线程安全
- `Send`: 类型可以安全地在线程间转移所有权
- `Sync`: 类型的引用可以安全地在线程间共享
- 大多数类型自动实现这些 trait，编译器会检查

### thread::scope 是如何保证借用安全的？

**答案要点**:
```rust
thread::scope(|s| {
    let data = vec![1, 2, 3];
    s.spawn(|| println!("{:?}", data));
    // 作用域结束时，所有线程必须完成
}); // <- 所有线程在此点完成
// data 可以安全释放
```
- `scope` 在返回前等待所有子线程完成
- 编译器知道线程生命周期不会超过作用域
- 因此可以安全借用作用域内的变量

## 延伸阅读

### 官方文档

- [std::thread 模块文档](https://doc.rust-lang.org/std/thread/)
- [The Rust Book - Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html)
- [Rust By Example - Threads](https://doc.rust-lang.org/rust-by-example/std_misc/threads.html)

### 相关 RFC

- [RFC 3151 - Scoped Threads](https://rust-lang.github.io/rfcs/3151-scoped-threads.html)
- [RFC 0243 - Thread Spawn Arguments](https://rust-lang.github.io/rfcs/0243-thread-spawn-arguments.html)

### 进阶资源

- [Rust Atomics and Locks](https://marabos.nl/atomics/) - Mara Bos 的并发编程权威指南
- [Programming Rust, 2nd Edition](https://www.oreilly.com/library/view/programming-rust-2nd/9781492052586/) - 第19章：并发
- [Rustonomicon - Concurrency](https://doc.rust-lang.org/nomicon/concurrency.html)

### 相关库

- [rayon](https://crates.io/crates/rayon) - 数据并行库
- [crossbeam](https://crates.io/crates/crossbeam) - 并发工具集
- [parking_lot](https://crates.io/crates/parking_lot) - 高性能同步原语
- [tokio](https://crates.io/crates/tokio) - 异步运行时（async/await）

---

掌握 Rust 线程是编写高性能并发程序的基础。虽然 Rust 的所有权系统增加了一些初始学习成本，但它在编译时就能捕获大多数并发错误，让你能够自信地编写安全的多线程代码。对于 CPU 密集型任务，结合 `thread::scope` 和 Rayon 可以实现优雅且高效的并行计算。
