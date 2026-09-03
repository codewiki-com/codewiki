---
title: Criterion 基准测试
description: 深入理解 Rust Criterion 基准测试框架，掌握性能分析、统计方法和优化实践
track: rust
section: cargo-tooling
difficulty: intermediate
tags:
  - Rust
  - Criterion
  - 基准测试
  - 性能优化
  - 统计分析
status: imported
origin: old/src/content/docs/rust/criterion.zh.md
divergence: 0.217
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 测试与性能
  order: 13
  lastUpdated: 2026-01-07
---

基准测试是性能优化的基石。Criterion 是 Rust 生态系统中最强大的基准测试框架，它提供统计分析、HTML 报告生成、回归检测等高级功能。本文将全面介绍如何使用 Criterion 进行科学、可靠的性能测量。

## 概念解释

### 什么是基准测试

基准测试（Benchmarking）是一种通过运行代码片段并测量其执行时间来评估性能的方法。与单元测试验证代码正确性不同，基准测试关注的是代码的执行效率。

### 为什么需要 Criterion

Rust 标准库提供了 `#[bench]` 属性进行基准测试，但存在以下局限：

1. **仅在 nightly 版本可用**：稳定版 Rust 无法使用内置基准测试
2. **统计分析不足**：只提供简单的平均时间
3. **缺乏变化检测**：无法自动检测性能回归
4. **报告功能有限**：没有可视化报告

Criterion 解决了这些问题：

- **稳定版兼容**：在 stable Rust 上正常工作
- **统计严谨性**：使用统计方法确保测量结果可靠
- **回归检测**：自动与历史数据比较，检测性能变化
- **丰富报告**：生成详细的 HTML 报告和图表
- **灵活配置**：支持自定义测量时间、样本数量等参数

### Criterion 的统计基础

Criterion 使用以下统计概念：

- **样本（Sample）**：单次测量的执行时间
- **迭代（Iteration）**：在一个样本内执行被测代码的次数
- **置信区间（Confidence Interval）**：结果的可信范围
- **标准差（Standard Deviation）**：测量结果的离散程度
- **中位数（Median）**：所有样本的中间值，比平均值更抗干扰

## 核心原理

### 测量机制

Criterion 的测量过程分为几个阶段：

```
1. 预热阶段（Warmup）
   └─> 运行代码若干次，让 CPU 缓存和分支预测稳定

2. 样本收集阶段
   └─> 收集多个样本，每个样本包含多次迭代

3. 统计分析阶段
   └─> 计算统计指标，生成置信区间

4. 比较阶段（可选）
   └─> 与之前的基线比较，检测回归
```

### 统计分析方法

Criterion 使用 bootstrap 重采样方法估计统计量的置信区间：

1. 从原始样本中有放回地抽取新样本
2. 对每个新样本计算统计量
3. 重复多次（默认 100,000 次）
4. 从结果分布中确定置信区间

这种方法不依赖数据分布的假设，更加稳健。

### 变化检测原理

当比较两次运行时，Criterion 会：

1. 计算效果大小（effect size）：新旧结果差异的标准化度量
2. 应用阈值判断：
   - 变化小于 1%：无显著变化
   - 变化 1-5%：小幅变化
   - 变化 5-10%：中等变化
   - 变化超过 10%：大幅变化

## 核心要点

### 基本概念

| 概念 | 说明 |
|------|------|
| `Criterion` | 主配置结构，管理基准测试的执行 |
| `BenchmarkGroup` | 相关基准测试的分组 |
| `BenchmarkId` | 带参数的基准测试标识符 |
| `black_box` | 防止编译器优化掉被测代码 |
| `iter` | 基准测试迭代器，测量闭包执行时间 |

### 关键 API

```rust
// 基本基准测试
c.bench_function("name", |b| b.iter(|| code_to_measure()));

// 带参数的基准测试
c.bench_with_input(BenchmarkId::new("name", param), &input, |b, i| {
    b.iter(|| code_to_measure(i))
});

// 分组基准测试
let mut group = c.benchmark_group("group_name");
group.bench_function("test1", |b| b.iter(|| ...));
group.bench_function("test2", |b| b.iter(|| ...));
group.finish();
```

### 配置选项

```rust
Criterion::default()
    .sample_size(100)           // 样本数量
    .measurement_time(Duration::from_secs(5))  // 测量时间
    .warm_up_time(Duration::from_secs(3))      // 预热时间
    .confidence_level(0.95)     // 置信水平
    .significance_level(0.05)   // 显著性水平
    .noise_threshold(0.05)      // 噪声阈值
```

## 代码示例

### 项目配置

首先，在 `Cargo.toml` 中添加依赖：

```toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[[bench]]
name = "my_benchmark"
harness = false
```

### 基本基准测试

创建 `benches/my_benchmark.rs`：

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

// 被测函数：计算斐波那契数列
fn fibonacci_recursive(n: u64) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2),
    }
}

fn fibonacci_iterative(n: u64) -> u64 {
    if n == 0 {
        return 0;
    }
    let mut a = 0u64;
    let mut b = 1u64;
    for _ in 1..n {
        let temp = a + b;
        a = b;
        b = temp;
    }
    b
}

fn fibonacci_benchmark(c: &mut Criterion) {
    // 基本基准测试
    c.bench_function("fib_recursive_20", |b| {
        b.iter(|| fibonacci_recursive(black_box(20)))
    });

    c.bench_function("fib_iterative_20", |b| {
        b.iter(|| fibonacci_iterative(black_box(20)))
    });
}

criterion_group!(benches, fibonacci_benchmark);
criterion_main!(benches);
```

运行基准测试：

```bash
cargo bench
```

### black_box 的重要性

`black_box` 函数防止编译器对基准测试代码进行过度优化：

```rust
use criterion::black_box;

// 错误示例：编译器可能优化掉整个计算
c.bench_function("bad_bench", |b| {
    b.iter(|| {
        let result = expensive_calculation(42);
        // result 未使用，编译器可能删除整个计算
    })
});

// 正确示例：使用 black_box 防止优化
c.bench_function("good_bench", |b| {
    b.iter(|| {
        let result = expensive_calculation(black_box(42));
        black_box(result);  // 或直接返回 result
    })
});

// 最简洁的写法
c.bench_function("best_bench", |b| {
    b.iter(|| expensive_calculation(black_box(42)))
});
```

### 带参数的基准测试

```rust
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};

fn sort_vec(v: &mut Vec<i32>) {
    v.sort();
}

fn bench_sorting(c: &mut Criterion) {
    let mut group = c.benchmark_group("sorting");

    // 测试不同大小的输入
    for size in [100, 1000, 10000].iter() {
        group.bench_with_input(
            BenchmarkId::new("sort", size),
            size,
            |b, &size| {
                b.iter_batched(
                    || {
                        // 设置：生成随机数据
                        let mut rng = rand::thread_rng();
                        (0..size).map(|_| rng.gen()).collect::<Vec<i32>>()
                    },
                    |mut data| {
                        // 被测代码
                        sort_vec(&mut data);
                        black_box(data)
                    },
                    criterion::BatchSize::SmallInput,
                )
            },
        );
    }

    group.finish();
}

criterion_group!(benches, bench_sorting);
criterion_main!(benches);
```

### 分组基准测试与比较

```rust
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use std::collections::{HashMap, BTreeMap};

fn bench_map_operations(c: &mut Criterion) {
    let mut group = c.benchmark_group("map_insert");

    for size in [100, 1000, 10000].iter() {
        // 测试 HashMap 插入
        group.bench_with_input(
            BenchmarkId::new("HashMap", size),
            size,
            |b, &size| {
                b.iter(|| {
                    let mut map = HashMap::new();
                    for i in 0..size {
                        map.insert(black_box(i), black_box(i * 2));
                    }
                    map
                })
            },
        );

        // 测试 BTreeMap 插入
        group.bench_with_input(
            BenchmarkId::new("BTreeMap", size),
            size,
            |b, &size| {
                b.iter(|| {
                    let mut map = BTreeMap::new();
                    for i in 0..size {
                        map.insert(black_box(i), black_box(i * 2));
                    }
                    map
                })
            },
        );
    }

    group.finish();
}

criterion_group!(benches, bench_map_operations);
criterion_main!(benches);
```

### 迭代器变体

Criterion 提供多种迭代器方法适应不同场景：

```rust
use criterion::{black_box, criterion_group, criterion_main, BatchSize, Criterion};

fn bench_iterators(c: &mut Criterion) {
    // 1. iter: 最基本的迭代器
    c.bench_function("iter_basic", |b| {
        b.iter(|| {
            // 每次迭代执行的代码
            black_box(calculate_something())
        })
    });

    // 2. iter_with_setup: 每次迭代前执行设置
    c.bench_function("iter_with_setup", |b| {
        b.iter_with_setup(
            || create_test_data(),  // 设置，不计入时间
            |data| process(data),    // 被测代码
        )
    });

    // 3. iter_batched: 批量执行，适合需要设置/清理的场景
    c.bench_function("iter_batched", |b| {
        b.iter_batched(
            || create_expensive_resource(),  // 设置
            |resource| use_resource(resource), // 被测代码
            BatchSize::SmallInput,            // 批量大小策略
        )
    });

    // 4. iter_batched_ref: 设置函数返回引用
    c.bench_function("iter_batched_ref", |b| {
        b.iter_batched_ref(
            || vec![1, 2, 3, 4, 5],
            |data| {
                data.sort();
                black_box(data.len())
            },
            BatchSize::SmallInput,
        )
    });

    // 5. iter_with_large_drop: 大对象析构不计入时间
    c.bench_function("iter_with_large_drop", |b| {
        b.iter_with_large_drop(|| {
            create_large_data_structure()
        })
    });

    // 6. iter_custom: 完全自定义迭代逻辑
    c.bench_function("iter_custom", |b| {
        b.iter_custom(|iters| {
            let start = std::time::Instant::now();
            for _ in 0..iters {
                black_box(do_work());
            }
            start.elapsed()
        })
    });
}

criterion_group!(benches, bench_iterators);
criterion_main!(benches);
```

### BatchSize 策略

```rust
use criterion::BatchSize;

// SmallInput: 适合小数据，一次准备多个输入
BatchSize::SmallInput

// LargeInput: 适合大数据，每次只准备一个输入
BatchSize::LargeInput

// NumBatches(n): 精确控制批次数量
BatchSize::NumBatches(100)

// NumIterations(n): 精确控制每批迭代次数
BatchSize::NumIterations(1000)

// PerIteration: 每次迭代单独设置
BatchSize::PerIteration
```

### 自定义测量

```rust
use criterion::{criterion_group, criterion_main, Criterion, Throughput};

fn bench_throughput(c: &mut Criterion) {
    let data = vec![0u8; 1024 * 1024]; // 1 MB 数据

    let mut group = c.benchmark_group("throughput");

    // 设置吞吐量元素数量
    group.throughput(Throughput::Bytes(data.len() as u64));

    group.bench_function("process_1mb", |b| {
        b.iter(|| {
            process_data(&data)
        })
    });

    group.finish();
}

fn bench_elements_throughput(c: &mut Criterion) {
    let items: Vec<i32> = (0..10000).collect();

    let mut group = c.benchmark_group("element_throughput");
    group.throughput(Throughput::Elements(items.len() as u64));

    group.bench_function("sum_10000_elements", |b| {
        b.iter(|| {
            items.iter().sum::<i32>()
        })
    });

    group.finish();
}

criterion_group!(benches, bench_throughput, bench_elements_throughput);
criterion_main!(benches);
```

### 配置采样参数

```rust
use criterion::{criterion_group, criterion_main, Criterion, SamplingMode};
use std::time::Duration;

fn custom_criterion() -> Criterion {
    Criterion::default()
        // 样本数量（默认 100）
        .sample_size(200)
        // 测量时间（默认 5 秒）
        .measurement_time(Duration::from_secs(10))
        // 预热时间（默认 3 秒）
        .warm_up_time(Duration::from_secs(5))
        // 置信水平（默认 0.95）
        .confidence_level(0.99)
        // 显著性水平（默认 0.05）
        .significance_level(0.01)
        // 噪声阈值（默认 0.01）
        .noise_threshold(0.03)
}

fn bench_with_custom_config(c: &mut Criterion) {
    c.bench_function("custom_configured", |b| {
        b.iter(|| {
            // 被测代码
        })
    });
}

criterion_group! {
    name = benches;
    config = custom_criterion();
    targets = bench_with_custom_config
}

criterion_main!(benches);
```

### 分组配置

```rust
use criterion::{criterion_group, criterion_main, Criterion, PlotConfiguration, AxisScale};
use std::time::Duration;

fn bench_with_group_config(c: &mut Criterion) {
    let mut group = c.benchmark_group("configured_group");

    // 设置采样模式
    group.sampling_mode(criterion::SamplingMode::Flat);

    // 设置样本数量
    group.sample_size(50);

    // 设置测量时间
    group.measurement_time(Duration::from_secs(3));

    // 设置预热时间
    group.warm_up_time(Duration::from_secs(1));

    // 配置图表
    group.plot_config(
        PlotConfiguration::default()
            .summary_scale(AxisScale::Logarithmic)
    );

    // 添加基准测试
    for i in [10, 100, 1000].iter() {
        group.bench_with_input(
            criterion::BenchmarkId::new("test", i),
            i,
            |b, &i| {
                b.iter(|| {
                    (0..i).sum::<i32>()
                })
            },
        );
    }

    group.finish();
}

criterion_group!(benches, bench_with_group_config);
criterion_main!(benches);
```

## 最佳实践

### 始终使用 black_box

```rust
// 输入参数使用 black_box
b.iter(|| function(black_box(input)));

// 或者对结果使用 black_box（通过返回值）
b.iter(|| black_box(function(input)));
```

### 测量稳定的代码

确保被测代码没有外部依赖（如网络、文件系统）：

```rust
// 不好：依赖文件系统
c.bench_function("bad", |b| {
    b.iter(|| std::fs::read_to_string("file.txt"))
});

// 好：使用内存数据
c.bench_function("good", |b| {
    let data = std::fs::read_to_string("file.txt").unwrap();
    b.iter(|| parse_data(black_box(&data)))
});
```

### 分离设置代码

```rust
// 不好：设置代码包含在测量中
c.bench_function("bad", |b| {
    b.iter(|| {
        let data = generate_large_data();  // 这也被测量了
        process(data)
    })
});

// 好：使用 iter_batched 分离设置
c.bench_function("good", |b| {
    b.iter_batched(
        || generate_large_data(),  // 设置，不测量
        |data| process(data),       // 只测量这部分
        BatchSize::SmallInput,
    )
});
```

### 合理设置样本数量

```rust
use std::time::Duration;

let mut group = c.benchmark_group("fast_function");
// 快速函数：增加样本数量
group.sample_size(500);
group.measurement_time(Duration::from_secs(10));
group.bench_function("fast", |b| b.iter(|| fast_function()));
group.finish();

let mut group = c.benchmark_group("slow_function");
// 慢速函数：减少样本数量
group.sample_size(20);
group.measurement_time(Duration::from_secs(30));
group.bench_function("slow", |b| b.iter(|| slow_function()));
group.finish();
```

### 使用有意义的基准测试名称

```rust
// 不好
c.bench_function("test1", |b| ...);

// 好：包含算法名称和参数
c.bench_function("quicksort_random_10000", |b| ...);
c.bench_function("mergesort_sorted_10000", |b| ...);
```

### 比较多种实现

```rust
fn bench_string_concat(c: &mut Criterion) {
    let mut group = c.benchmark_group("string_concat");

    let strings: Vec<String> = (0..1000)
        .map(|i| format!("string_{}", i))
        .collect();

    // 方法1: + 运算符
    group.bench_function("plus_operator", |b| {
        b.iter(|| {
            let mut result = String::new();
            for s in &strings {
                result = result + s;
            }
            result
        })
    });

    // 方法2: push_str
    group.bench_function("push_str", |b| {
        b.iter(|| {
            let mut result = String::new();
            for s in &strings {
                result.push_str(s);
            }
            result
        })
    });

    // 方法3: 预分配 + push_str
    group.bench_function("preallocated", |b| {
        b.iter(|| {
            let total_len: usize = strings.iter().map(|s| s.len()).sum();
            let mut result = String::with_capacity(total_len);
            for s in &strings {
                result.push_str(s);
            }
            result
        })
    });

    // 方法4: collect + join
    group.bench_function("join", |b| {
        b.iter(|| {
            strings.join("")
        })
    });

    group.finish();
}
```

### 建立基线并追踪回归

```bash
# 保存基线
cargo bench -- --save-baseline main

# 切换分支后与基线比较
cargo bench -- --baseline main

# 只显示回归的测试
cargo bench -- --baseline main --load-baseline new
```

## 常见陷阱

### 忘记使用 black_box

```rust
// 错误：编译器可能优化掉整个计算
c.bench_function("optimized_away", |b| {
    b.iter(|| {
        let x = expensive_calculation();
        // x 未使用
    })
});

// 正确
c.bench_function("measured", |b| {
    b.iter(|| black_box(expensive_calculation()))
});
```

### 测量了设置代码

```rust
// 错误：Vec 创建被包含在测量中
c.bench_function("includes_setup", |b| {
    b.iter(|| {
        let v: Vec<i32> = (0..10000).collect();
        v.iter().sum::<i32>()
    })
});

// 正确：设置在外部
c.bench_function("correct", |b| {
    let v: Vec<i32> = (0..10000).collect();
    b.iter(|| v.iter().sum::<i32>())
});
```

### 基准测试相互干扰

```rust
// 错误：共享可变状态
let mut shared_data = vec![1, 2, 3];

c.bench_function("test1", |b| {
    b.iter(|| {
        shared_data.push(4);  // 修改共享数据
        shared_data.len()
    })
});

c.bench_function("test2", |b| {
    b.iter(|| {
        shared_data.pop();  // 也修改共享数据
    })
});

// 正确：每个测试独立数据
c.bench_function("test1", |b| {
    b.iter_batched(
        || vec![1, 2, 3],
        |mut data| {
            data.push(4);
            data.len()
        },
        BatchSize::SmallInput,
    )
});
```

### 测试太短导致结果不稳定

```rust
// 可能不稳定：操作太快
c.bench_function("too_fast", |b| {
    b.iter(|| 1 + 1)
});

// 更好：增加工作量或调整配置
let mut group = c.benchmark_group("fast_ops");
group.sample_size(1000);
group.bench_function("addition", |b| {
    b.iter(|| {
        let mut sum = 0i64;
        for i in 0..1000 {
            sum += black_box(i);
        }
        sum
    })
});
group.finish();
```

### 忽略预热的重要性

```rust
// CPU 缓存未预热可能导致第一次运行较慢
// Criterion 默认预热 3 秒，但对某些场景可能不够

let mut group = c.benchmark_group("cache_sensitive");
group.warm_up_time(Duration::from_secs(10));  // 增加预热时间
group.bench_function("cache_test", |b| {
    b.iter(|| cache_sensitive_operation())
});
group.finish();
```

### 不一致的输入数据

```rust
// 错误：每次迭代使用不同的随机数据
c.bench_function("inconsistent", |b| {
    b.iter(|| {
        let data: Vec<i32> = (0..1000).map(|_| rand::random()).collect();
        sort(data)
    })
});

// 正确：使用固定的随机种子
c.bench_function("consistent", |b| {
    use rand::{SeedableRng, rngs::StdRng};
    b.iter_batched(
        || {
            let mut rng = StdRng::seed_from_u64(42);  // 固定种子
            (0..1000).map(|_| rng.gen()).collect::<Vec<i32>>()
        },
        |data| sort(data),
        BatchSize::SmallInput,
    )
});
```

## 性能考量

### 理解 Criterion 报告

Criterion 输出示例：

```
sorting/sort/1000       time:   [45.123 us 45.456 us 45.789 us]
                        change: [-2.1234% -1.5678% -0.9876%] (p = 0.02 < 0.05)
                        Performance has improved.
Found 3 outliers among 100 measurements (3.00%)
  2 (2.00%) high mild
  1 (1.00%) high severe
```

**字段解释：**

- **time**: `[下限 中位数 上限]` 置信区间
- **change**: 与基线比较的变化百分比
- **p**: p 值，小于 0.05 表示变化显著
- **outliers**: 异常值数量和类型

### 减少测量噪声

```rust
// 1. 增加样本数量
group.sample_size(500);

// 2. 增加测量时间
group.measurement_time(Duration::from_secs(20));

// 3. 使用平坦采样模式（对快速函数更准确）
group.sampling_mode(criterion::SamplingMode::Flat);

// 4. 调整噪声阈值
Criterion::default().noise_threshold(0.03);
```

### 处理异常值

Criterion 自动检测异常值，但你可以：

```rust
// 查看详细的异常值报告
// 在 target/criterion/<benchmark>/report/index.html 中

// 或者使用命令行选项
// cargo bench -- --verbose
```

### 环境一致性

为获得可靠结果：

1. **关闭其他程序**：减少 CPU 竞争
2. **固定 CPU 频率**：禁用 CPU 节能模式
3. **使用发布模式**：`cargo bench` 默认使用发布模式
4. **多次运行**：确认结果一致性
5. **检查后台进程**：避免系统任务干扰

```bash
# Linux: 设置 CPU 为性能模式
sudo cpupower frequency-set -g performance

# 运行基准测试
cargo bench

# 恢复节能模式
sudo cpupower frequency-set -g powersave
```

## 实战场景

### 场景一：比较算法实现

```rust
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};

// 三种排序算法
fn bubble_sort<T: Ord>(arr: &mut [T]) {
    let n = arr.len();
    for i in 0..n {
        for j in 0..n - 1 - i {
            if arr[j] > arr[j + 1] {
                arr.swap(j, j + 1);
            }
        }
    }
}

fn insertion_sort<T: Ord>(arr: &mut [T]) {
    for i in 1..arr.len() {
        let mut j = i;
        while j > 0 && arr[j - 1] > arr[j] {
            arr.swap(j - 1, j);
            j -= 1;
        }
    }
}

fn quick_sort<T: Ord>(arr: &mut [T]) {
    if arr.len() <= 1 {
        return;
    }
    let pivot = partition(arr);
    quick_sort(&mut arr[..pivot]);
    quick_sort(&mut arr[pivot + 1..]);
}

fn partition<T: Ord>(arr: &mut [T]) -> usize {
    let len = arr.len();
    let pivot = len - 1;
    let mut i = 0;
    for j in 0..len - 1 {
        if arr[j] <= arr[pivot] {
            arr.swap(i, j);
            i += 1;
        }
    }
    arr.swap(i, pivot);
    i
}

fn bench_sorting_algorithms(c: &mut Criterion) {
    let mut group = c.benchmark_group("sorting_algorithms");

    for size in [100, 500, 1000, 2000].iter() {
        // 生成测试数据
        let data: Vec<i32> = (0..*size).rev().collect();  // 逆序，最坏情况

        group.bench_with_input(
            BenchmarkId::new("bubble_sort", size),
            &data,
            |b, data| {
                b.iter_batched(
                    || data.clone(),
                    |mut arr| {
                        bubble_sort(&mut arr);
                        arr
                    },
                    criterion::BatchSize::SmallInput,
                )
            },
        );

        group.bench_with_input(
            BenchmarkId::new("insertion_sort", size),
            &data,
            |b, data| {
                b.iter_batched(
                    || data.clone(),
                    |mut arr| {
                        insertion_sort(&mut arr);
                        arr
                    },
                    criterion::BatchSize::SmallInput,
                )
            },
        );

        group.bench_with_input(
            BenchmarkId::new("quick_sort", size),
            &data,
            |b, data| {
                b.iter_batched(
                    || data.clone(),
                    |mut arr| {
                        quick_sort(&mut arr);
                        arr
                    },
                    criterion::BatchSize::SmallInput,
                )
            },
        );
    }

    group.finish();
}

criterion_group!(benches, bench_sorting_algorithms);
criterion_main!(benches);
```

### 场景二：数据结构性能测试

```rust
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion, Throughput};
use std::collections::{HashMap, BTreeMap, LinkedList, VecDeque};

fn bench_collections(c: &mut Criterion) {
    // 测试插入性能
    {
        let mut group = c.benchmark_group("insert");

        for size in [1000, 10000, 100000].iter() {
            group.throughput(Throughput::Elements(*size as u64));

            group.bench_with_input(
                BenchmarkId::new("Vec", size),
                size,
                |b, &size| {
                    b.iter(|| {
                        let mut v = Vec::with_capacity(size);
                        for i in 0..size {
                            v.push(black_box(i));
                        }
                        v
                    })
                },
            );

            group.bench_with_input(
                BenchmarkId::new("VecDeque", size),
                size,
                |b, &size| {
                    b.iter(|| {
                        let mut v = VecDeque::with_capacity(size);
                        for i in 0..size {
                            v.push_back(black_box(i));
                        }
                        v
                    })
                },
            );

            group.bench_with_input(
                BenchmarkId::new("HashMap", size),
                size,
                |b, &size| {
                    b.iter(|| {
                        let mut m = HashMap::with_capacity(size);
                        for i in 0..size {
                            m.insert(black_box(i), black_box(i * 2));
                        }
                        m
                    })
                },
            );

            group.bench_with_input(
                BenchmarkId::new("BTreeMap", size),
                size,
                |b, &size| {
                    b.iter(|| {
                        let mut m = BTreeMap::new();
                        for i in 0..size {
                            m.insert(black_box(i), black_box(i * 2));
                        }
                        m
                    })
                },
            );
        }

        group.finish();
    }

    // 测试查找性能
    {
        let mut group = c.benchmark_group("lookup");

        for size in [1000, 10000, 100000].iter() {
            let vec: Vec<i32> = (0..*size as i32).collect();
            let hashmap: HashMap<i32, i32> = (0..*size as i32).map(|i| (i, i * 2)).collect();
            let btreemap: BTreeMap<i32, i32> = (0..*size as i32).map(|i| (i, i * 2)).collect();

            let search_key = (*size / 2) as i32;

            group.bench_with_input(
                BenchmarkId::new("Vec_linear", size),
                &vec,
                |b, vec| {
                    b.iter(|| vec.iter().find(|&&x| x == black_box(search_key)))
                },
            );

            group.bench_with_input(
                BenchmarkId::new("Vec_binary", size),
                &vec,
                |b, vec| {
                    b.iter(|| vec.binary_search(&black_box(search_key)))
                },
            );

            group.bench_with_input(
                BenchmarkId::new("HashMap", size),
                &hashmap,
                |b, map| {
                    b.iter(|| map.get(&black_box(search_key)))
                },
            );

            group.bench_with_input(
                BenchmarkId::new("BTreeMap", size),
                &btreemap,
                |b, map| {
                    b.iter(|| map.get(&black_box(search_key)))
                },
            );
        }

        group.finish();
    }
}

criterion_group!(benches, bench_collections);
criterion_main!(benches);
```

### 场景三：解析器性能测试

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion, Throughput};

// 简单的 JSON 数字解析器
fn parse_number_naive(s: &str) -> Option<i64> {
    s.parse().ok()
}

fn parse_number_manual(s: &str) -> Option<i64> {
    let bytes = s.as_bytes();
    if bytes.is_empty() {
        return None;
    }

    let mut result: i64 = 0;
    let mut negative = false;
    let mut start = 0;

    if bytes[0] == b'-' {
        negative = true;
        start = 1;
    } else if bytes[0] == b'+' {
        start = 1;
    }

    for &b in &bytes[start..] {
        if b < b'0' || b > b'9' {
            return None;
        }
        result = result.checked_mul(10)?.checked_add((b - b'0') as i64)?;
    }

    if negative {
        Some(-result)
    } else {
        Some(result)
    }
}

fn bench_parsing(c: &mut Criterion) {
    let test_cases = vec![
        ("small", "42"),
        ("medium", "1234567890"),
        ("large", "9223372036854775807"),
        ("negative", "-9223372036854775808"),
    ];

    let mut group = c.benchmark_group("number_parsing");

    for (name, input) in test_cases {
        group.throughput(Throughput::Bytes(input.len() as u64));

        group.bench_function(
            format!("naive/{}", name),
            |b| b.iter(|| parse_number_naive(black_box(input))),
        );

        group.bench_function(
            format!("manual/{}", name),
            |b| b.iter(|| parse_number_manual(black_box(input))),
        );
    }

    group.finish();
}

criterion_group!(benches, bench_parsing);
criterion_main!(benches);
```

### 场景四：并发性能测试

```rust
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use std::sync::{Arc, Mutex, RwLock};
use std::sync::atomic::{AtomicU64, Ordering};

fn bench_synchronization(c: &mut Criterion) {
    let mut group = c.benchmark_group("synchronization");

    // 单线程基准
    group.bench_function("baseline", |b| {
        let mut counter = 0u64;
        b.iter(|| {
            counter += 1;
            black_box(counter)
        })
    });

    // Mutex
    group.bench_function("mutex", |b| {
        let counter = Arc::new(Mutex::new(0u64));
        b.iter(|| {
            let mut guard = counter.lock().unwrap();
            *guard += 1;
            black_box(*guard)
        })
    });

    // RwLock（写）
    group.bench_function("rwlock_write", |b| {
        let counter = Arc::new(RwLock::new(0u64));
        b.iter(|| {
            let mut guard = counter.write().unwrap();
            *guard += 1;
            black_box(*guard)
        })
    });

    // RwLock（读）
    group.bench_function("rwlock_read", |b| {
        let counter = Arc::new(RwLock::new(0u64));
        b.iter(|| {
            let guard = counter.read().unwrap();
            black_box(*guard)
        })
    });

    // 原子操作
    group.bench_function("atomic", |b| {
        let counter = AtomicU64::new(0);
        b.iter(|| {
            let val = counter.fetch_add(1, Ordering::SeqCst);
            black_box(val)
        })
    });

    // 原子操作（Relaxed）
    group.bench_function("atomic_relaxed", |b| {
        let counter = AtomicU64::new(0);
        b.iter(|| {
            let val = counter.fetch_add(1, Ordering::Relaxed);
            black_box(val)
        })
    });

    group.finish();
}

criterion_group!(benches, bench_synchronization);
criterion_main!(benches);
```

## HTML 报告

### 生成报告

启用 HTML 报告功能：

```toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }
```

运行基准测试后，报告位于：

```
target/criterion/<benchmark_name>/report/index.html
```

### 报告内容

HTML 报告包含：

1. **概览页面**：所有基准测试的汇总
2. **详细页面**：每个基准测试的详细统计
3. **图表**：
   - PDF（概率密度函数）图
   - 迭代时间图
   - 回归分析图
   - 比较图（如果有基线）

### 自定义报告

```rust
use criterion::{criterion_group, criterion_main, Criterion, PlotConfiguration, AxisScale};

fn custom_reports(c: &mut Criterion) {
    let mut group = c.benchmark_group("custom_plots");

    // 配置图表
    group.plot_config(
        PlotConfiguration::default()
            .summary_scale(AxisScale::Logarithmic)  // 对数刻度
    );

    // 添加基准测试
    for i in [10, 100, 1000, 10000].iter() {
        group.bench_with_input(
            criterion::BenchmarkId::new("exponential", i),
            i,
            |b, &i| {
                b.iter(|| {
                    (0..i).fold(0u64, |acc, x| acc.wrapping_add(x))
                })
            },
        );
    }

    group.finish();
}

criterion_group!(benches, custom_reports);
criterion_main!(benches);
```

## 面试要点

### 高频面试题

**1. 为什么需要使用 black_box？**

`black_box` 防止编译器优化：
- 阻止常量折叠
- 防止死代码消除
- 确保测量的是实际执行时间

**2. Criterion 如何保证测量结果的统计可靠性？**

- 使用 bootstrap 重采样计算置信区间
- 自动检测和报告异常值
- 预热阶段消除冷启动影响
- 多次采样获得稳定结果

**3. iter_batched 和 iter 的区别是什么？**

- `iter`：每次迭代直接执行闭包
- `iter_batched`：分离设置和被测代码，设置代码不计入测量时间

**4. 如何检测性能回归？**

```bash
# 保存基线
cargo bench -- --save-baseline before

# 修改代码后与基线比较
cargo bench -- --baseline before
```

**5. 基准测试结果中的置信区间表示什么？**

`[lower median upper]` 表示在给定置信水平（默认 95%）下，真实值有 95% 的概率落在这个区间内。

**6. 如何比较不同算法的性能？**

```rust
let mut group = c.benchmark_group("comparison");
group.bench_function("algorithm_a", |b| b.iter(|| algo_a()));
group.bench_function("algorithm_b", |b| b.iter(|| algo_b()));
group.finish();
```

### 实战技巧

1. **始终在发布模式下运行**：`cargo bench` 默认发布模式
2. **关闭 CPU 节能**：确保测试环境一致
3. **多次运行确认**：单次结果可能有波动
4. **使用基线比较**：追踪性能变化
5. **分离设置代码**：只测量关心的部分

## 延伸阅读

### 官方资源

- [Criterion.rs 官方文档](https://bheisler.github.io/criterion.rs/book/)
- [Criterion.rs GitHub](https://github.com/bheisler/criterion.rs)
- [Rust 性能手册](https://nnethercote.github.io/perf-book/)

### 相关工具

- **cargo-flamegraph**：生成火焰图分析性能瓶颈
- **perf**：Linux 性能分析工具
- **dhat**：堆分析器
- **cargo-asm**：查看生成的汇编代码

### 进阶主题

- **采样分析 vs 检测分析**：理解不同性能分析方法
- **CPU 缓存优化**：理解缓存对性能的影响
- **SIMD 优化**：使用向量化指令
- **内存分配优化**：减少堆分配

### 推荐阅读

- 《Rust 性能之书》
- 《Systems Performance》by Brendan Gregg
- 《计算机体系结构：量化研究方法》

## 总结

Criterion 是 Rust 生态系统中进行严谨性能测量的标准工具。掌握 Criterion 需要理解：

**核心概念：**
- 统计采样和置信区间
- 预热和测量阶段
- 回归检测机制

**关键技能：**
- 正确使用 `black_box` 防止优化
- 使用 `iter_batched` 分离设置代码
- 配置采样参数获得可靠结果
- 使用基准测试组比较实现

**最佳实践：**
- 保持测试环境一致
- 使用基线追踪性能变化
- 生成 HTML 报告便于分析
- 关注异常值和噪声

性能优化是一个持续的过程。使用 Criterion 建立可靠的基准测试，可以帮助你自信地做出优化决策，避免性能回归，持续改进代码质量。
