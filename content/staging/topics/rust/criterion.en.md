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
origin: old/src/content/docs/rust/criterion.en.md
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

Benchmarking is the cornerstone of performance optimization. Criterion is the most powerful benchmarking framework in the Rust ecosystem, providing advanced features such as statistical analysis, HTML report generation, and regression detection. We'll cover how to use Criterion for scientific and reliable performance measurement.

## Concept Explanation

### What is Benchmarking

Benchmarking is a method of evaluating performance by running code snippets and measuring their execution time. Unlike unit tests that verify code correctness, benchmarking focuses on code execution efficiency.

### Why Use Criterion

Rust's standard library provides the `#[bench]` attribute for benchmarking, but it has the following limitations:

1. **Only available in nightly**: Stable Rust cannot use built-in benchmarking
2. **Insufficient statistical analysis**: Only provides simple average time
3. **Lack of change detection**: Cannot automatically detect performance regressions
4. **Limited reporting**: No visualization reports

Criterion solves these problems:

- **Stable version compatible**: Works normally on stable Rust
- **Statistical rigor**: Uses statistical methods to ensure reliable measurement results
- **Regression detection**: Automatically compares with historical data to detect performance changes
- **Rich reports**: Generates detailed HTML reports and charts
- **Flexible configuration**: Supports customizing measurement time, sample count, and other parameters

### Statistical Foundation of Criterion

Criterion uses the following statistical concepts:

- **Sample**: Execution time of a single measurement
- **Iteration**: Number of times the tested code is executed within a sample
- **Confidence Interval**: Credible range of results
- **Standard Deviation**: Dispersion of measurement results
- **Median**: Middle value of all samples, more resistant to interference than the average

## Core Principles

### Measurement Mechanism

Criterion's measurement process is divided into several phases:

```
1. Warmup Phase
   └─> Run code several times to stabilize CPU cache and branch prediction

2. Sample Collection Phase
   └─> Collect multiple samples, each containing multiple iterations

3. Statistical Analysis Phase
   └─> Calculate statistical metrics, generate confidence intervals

4. Comparison Phase (optional)
   └─> Compare with previous baseline, detect regressions
```

### Statistical Analysis Methods

Criterion uses bootstrap resampling to estimate confidence intervals for statistics:

1. Draw new samples from the original sample with replacement
2. Calculate statistics for each new sample
3. Repeat many times (default 100,000 times)
4. Determine confidence intervals from the result distribution

This method does not rely on assumptions about data distribution and is more robust.

### Change Detection Principles

When comparing two runs, Criterion will:

1. Calculate effect size: standardized measure of the difference between old and new results
2. Apply threshold judgments:
   - Change less than 1%: No significant change
   - Change 1-5%: Small change
   - Change 5-10%: Medium change
   - Change over 10%: Large change

## Core Concepts

### Basic Concepts

| Concept | Description |
|---------|-------------|
| `Criterion` | Main configuration structure, manages benchmark execution |
| `BenchmarkGroup` | Grouping of related benchmarks |
| `BenchmarkId` | Benchmark identifier with parameters |
| `black_box` | Prevents compiler from optimizing away tested code |
| `iter` | Benchmark iterator, measures closure execution time |

### Key APIs

```rust
// Basic benchmark
c.bench_function("name", |b| b.iter(|| code_to_measure()));

// Benchmark with parameters
c.bench_with_input(BenchmarkId::new("name", param), &input, |b, i| {
    b.iter(|| code_to_measure(i))
});

// Grouped benchmarks
let mut group = c.benchmark_group("group_name");
group.bench_function("test1", |b| b.iter(|| ...));
group.bench_function("test2", |b| b.iter(|| ...));
group.finish();
```

### Configuration Options

```rust
Criterion::default()
    .sample_size(100)           // Sample count
    .measurement_time(Duration::from_secs(5))  // Measurement time
    .warm_up_time(Duration::from_secs(3))      // Warmup time
    .confidence_level(0.95)     // Confidence level
    .significance_level(0.05)   // Significance level
    .noise_threshold(0.05)      // Noise threshold
```

## Code Examples

### Project Configuration

First, add dependencies in `Cargo.toml`:

```toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[[bench]]
name = "my_benchmark"
harness = false
```

### Basic Benchmark

Create `benches/my_benchmark.rs`:

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

// Function under test: calculate Fibonacci sequence
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
    // Basic benchmark
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

Run the benchmark:

```bash
cargo bench
```

### The Importance of black_box

The `black_box` function prevents the compiler from over-optimizing benchmark code:

```rust
use criterion::black_box;

// Bad example: compiler may optimize away the entire calculation
c.bench_function("bad_bench", |b| {
    b.iter(|| {
        let result = expensive_calculation(42);
        // result is unused, compiler may delete the entire calculation
    })
});

// Good example: use black_box to prevent optimization
c.bench_function("good_bench", |b| {
    b.iter(|| {
        let result = expensive_calculation(black_box(42));
        black_box(result);  // or just return result
    })
});

// Most concise way
c.bench_function("best_bench", |b| {
    b.iter(|| expensive_calculation(black_box(42)))
});
```

### Parameterized Benchmarks

```rust
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};

fn sort_vec(v: &mut Vec<i32>) {
    v.sort();
}

fn bench_sorting(c: &mut Criterion) {
    let mut group = c.benchmark_group("sorting");

    // Test different input sizes
    for size in [100, 1000, 10000].iter() {
        group.bench_with_input(
            BenchmarkId::new("sort", size),
            size,
            |b, &size| {
                b.iter_batched(
                    || {
                        // Setup: generate random data
                        let mut rng = rand::thread_rng();
                        (0..size).map(|_| rng.gen()).collect::<Vec<i32>>()
                    },
                    |mut data| {
                        // Code under test
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

### Grouped Benchmarks and Comparisons

```rust
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use std::collections::{HashMap, BTreeMap};

fn bench_map_operations(c: &mut Criterion) {
    let mut group = c.benchmark_group("map_insert");

    for size in [100, 1000, 10000].iter() {
        // Test HashMap insertion
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

        // Test BTreeMap insertion
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

### Iterator Variants

Criterion provides multiple iterator methods for different scenarios:

```rust
use criterion::{black_box, criterion_group, criterion_main, BatchSize, Criterion};

fn bench_iterators(c: &mut Criterion) {
    // 1. iter: the most basic iterator
    c.bench_function("iter_basic", |b| {
        b.iter(|| {
            // Code executed each iteration
            black_box(calculate_something())
        })
    });

    // 2. iter_with_setup: execute setup before each iteration
    c.bench_function("iter_with_setup", |b| {
        b.iter_with_setup(
            || create_test_data(),  // Setup, not timed
            |data| process(data),    // Code under test
        )
    });

    // 3. iter_batched: batch execution, suitable for scenarios requiring setup/teardown
    c.bench_function("iter_batched", |b| {
        b.iter_batched(
            || create_expensive_resource(),  // Setup
            |resource| use_resource(resource), // Code under test
            BatchSize::SmallInput,            // Batch size strategy
        )
    });

    // 4. iter_batched_ref: setup function returns reference
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

    // 5. iter_with_large_drop: large object destruction not timed
    c.bench_function("iter_with_large_drop", |b| {
        b.iter_with_large_drop(|| {
            create_large_data_structure()
        })
    });

    // 6. iter_custom: fully custom iteration logic
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

### BatchSize Strategies

```rust
use criterion::BatchSize;

// SmallInput: suitable for small data, prepare multiple inputs at once
BatchSize::SmallInput

// LargeInput: suitable for large data, prepare only one input at a time
BatchSize::LargeInput

// NumBatches(n): precisely control number of batches
BatchSize::NumBatches(100)

// NumIterations(n): precisely control iterations per batch
BatchSize::NumIterations(1000)

// PerIteration: separate setup for each iteration
BatchSize::PerIteration
```

### Custom Measurements

```rust
use criterion::{criterion_group, criterion_main, Criterion, Throughput};

fn bench_throughput(c: &mut Criterion) {
    let data = vec![0u8; 1024 * 1024]; // 1 MB data

    let mut group = c.benchmark_group("throughput");

    // Set throughput element count
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

### Configuring Sampling Parameters

```rust
use criterion::{criterion_group, criterion_main, Criterion, SamplingMode};
use std::time::Duration;

fn custom_criterion() -> Criterion {
    Criterion::default()
        // Sample count (default 100)
        .sample_size(200)
        // Measurement time (default 5 seconds)
        .measurement_time(Duration::from_secs(10))
        // Warmup time (default 3 seconds)
        .warm_up_time(Duration::from_secs(5))
        // Confidence level (default 0.95)
        .confidence_level(0.99)
        // Significance level (default 0.05)
        .significance_level(0.01)
        // Noise threshold (default 0.01)
        .noise_threshold(0.03)
}

fn bench_with_custom_config(c: &mut Criterion) {
    c.bench_function("custom_configured", |b| {
        b.iter(|| {
            // Code under test
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

### Group Configuration

```rust
use criterion::{criterion_group, criterion_main, Criterion, PlotConfiguration, AxisScale};
use std::time::Duration;

fn bench_with_group_config(c: &mut Criterion) {
    let mut group = c.benchmark_group("configured_group");

    // Set sampling mode
    group.sampling_mode(criterion::SamplingMode::Flat);

    // Set sample count
    group.sample_size(50);

    // Set measurement time
    group.measurement_time(Duration::from_secs(3));

    // Set warmup time
    group.warm_up_time(Duration::from_secs(1));

    // Configure charts
    group.plot_config(
        PlotConfiguration::default()
            .summary_scale(AxisScale::Logarithmic)
    );

    // Add benchmarks
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

## Best Practices

### Always Use black_box

```rust
// Use black_box for input parameters
b.iter(|| function(black_box(input)));

// Or use black_box on the result (via return value)
b.iter(|| black_box(function(input)));
```

### Measure Stable Code

Ensure the tested code has no external dependencies (like network, file system):

```rust
// Bad: depends on file system
c.bench_function("bad", |b| {
    b.iter(|| std::fs::read_to_string("file.txt"))
});

// Good: use in-memory data
c.bench_function("good", |b| {
    let data = std::fs::read_to_string("file.txt").unwrap();
    b.iter(|| parse_data(black_box(&data)))
});
```

### Separate Setup Code

```rust
// Bad: setup code included in measurement
c.bench_function("bad", |b| {
    b.iter(|| {
        let data = generate_large_data();  // This is also measured
        process(data)
    })
});

// Good: use iter_batched to separate setup
c.bench_function("good", |b| {
    b.iter_batched(
        || generate_large_data(),  // Setup, not measured
        |data| process(data),       // Only measure this part
        BatchSize::SmallInput,
    )
});
```

### Set Sample Count Appropriately

```rust
use std::time::Duration;

let mut group = c.benchmark_group("fast_function");
// Fast function: increase sample count
group.sample_size(500);
group.measurement_time(Duration::from_secs(10));
group.bench_function("fast", |b| b.iter(|| fast_function()));
group.finish();

let mut group = c.benchmark_group("slow_function");
// Slow function: decrease sample count
group.sample_size(20);
group.measurement_time(Duration::from_secs(30));
group.bench_function("slow", |b| b.iter(|| slow_function()));
group.finish();
```

### Use Meaningful Benchmark Names

```rust
// Bad
c.bench_function("test1", |b| ...);

// Good: include algorithm name and parameters
c.bench_function("quicksort_random_10000", |b| ...);
c.bench_function("mergesort_sorted_10000", |b| ...);
```

### Compare Multiple Implementations

```rust
fn bench_string_concat(c: &mut Criterion) {
    let mut group = c.benchmark_group("string_concat");

    let strings: Vec<String> = (0..1000)
        .map(|i| format!("string_{}", i))
        .collect();

    // Method 1: + operator
    group.bench_function("plus_operator", |b| {
        b.iter(|| {
            let mut result = String::new();
            for s in &strings {
                result = result + s;
            }
            result
        })
    });

    // Method 2: push_str
    group.bench_function("push_str", |b| {
        b.iter(|| {
            let mut result = String::new();
            for s in &strings {
                result.push_str(s);
            }
            result
        })
    });

    // Method 3: preallocate + push_str
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

    // Method 4: collect + join
    group.bench_function("join", |b| {
        b.iter(|| {
            strings.join("")
        })
    });

    group.finish();
}
```

### Establish Baselines and Track Regressions

```bash
# Save baseline
cargo bench -- --save-baseline main

# Compare with baseline after switching branches
cargo bench -- --baseline main

# Show only regressed tests
cargo bench -- --baseline main --load-baseline new
```

## Common Pitfalls

### Forgetting to Use black_box

```rust
// Wrong: compiler may optimize away the entire calculation
c.bench_function("optimized_away", |b| {
    b.iter(|| {
        let x = expensive_calculation();
        // x is unused
    })
});

// Correct
c.bench_function("measured", |b| {
    b.iter(|| black_box(expensive_calculation()))
});
```

### Measuring Setup Code

```rust
// Wrong: Vec creation is included in measurement
c.bench_function("includes_setup", |b| {
    b.iter(|| {
        let v: Vec<i32> = (0..10000).collect();
        v.iter().sum::<i32>()
    })
});

// Correct: setup is external
c.bench_function("correct", |b| {
    let v: Vec<i32> = (0..10000).collect();
    b.iter(|| v.iter().sum::<i32>())
});
```

### Benchmarks Interfering with Each Other

```rust
// Wrong: shared mutable state
let mut shared_data = vec![1, 2, 3];

c.bench_function("test1", |b| {
    b.iter(|| {
        shared_data.push(4);  // Modifies shared data
        shared_data.len()
    })
});

c.bench_function("test2", |b| {
    b.iter(|| {
        shared_data.pop();  // Also modifies shared data
    })
});

// Correct: each test has independent data
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

### Tests Too Short Leading to Unstable Results

```rust
// May be unstable: operation too fast
c.bench_function("too_fast", |b| {
    b.iter(|| 1 + 1)
});

// Better: increase workload or adjust configuration
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

### Ignoring the Importance of Warmup

```rust
// CPU cache not warmed up may cause the first run to be slower
// Criterion defaults to 3 seconds warmup, but may not be enough for some scenarios

let mut group = c.benchmark_group("cache_sensitive");
group.warm_up_time(Duration::from_secs(10));  // Increase warmup time
group.bench_function("cache_test", |b| {
    b.iter(|| cache_sensitive_operation())
});
group.finish();
```

### Inconsistent Input Data

```rust
// Wrong: different random data for each iteration
c.bench_function("inconsistent", |b| {
    b.iter(|| {
        let data: Vec<i32> = (0..1000).map(|_| rand::random()).collect();
        sort(data)
    })
});

// Correct: use fixed random seed
c.bench_function("consistent", |b| {
    use rand::{SeedableRng, rngs::StdRng};
    b.iter_batched(
        || {
            let mut rng = StdRng::seed_from_u64(42);  // Fixed seed
            (0..1000).map(|_| rng.gen()).collect::<Vec<i32>>()
        },
        |data| sort(data),
        BatchSize::SmallInput,
    )
});
```

## Performance Considerations

### Understanding Criterion Reports

Criterion output example:

```
sorting/sort/1000       time:   [45.123 us 45.456 us 45.789 us]
                        change: [-2.1234% -1.5678% -0.9876%] (p = 0.02 < 0.05)
                        Performance has improved.
Found 3 outliers among 100 measurements (3.00%)
  2 (2.00%) high mild
  1 (1.00%) high severe
```

**Field explanations:**

- **time**: `[lower median upper]` confidence interval
- **change**: Percentage change compared to baseline
- **p**: p-value, less than 0.05 indicates significant change
- **outliers**: Number and type of outliers

### Reducing Measurement Noise

```rust
// 1. Increase sample count
group.sample_size(500);

// 2. Increase measurement time
group.measurement_time(Duration::from_secs(20));

// 3. Use flat sampling mode (more accurate for fast functions)
group.sampling_mode(criterion::SamplingMode::Flat);

// 4. Adjust noise threshold
Criterion::default().noise_threshold(0.03);
```

### Handling Outliers

Criterion automatically detects outliers, but you can:

```rust
// View detailed outlier reports
// In target/criterion/<benchmark>/report/index.html

// Or use command line options
// cargo bench -- --verbose
```

### Environmental Consistency

For reliable results:

1. **Close other programs**: Reduce CPU competition
2. **Fix CPU frequency**: Disable CPU power saving mode
3. **Use release mode**: `cargo bench` uses release mode by default
4. **Run multiple times**: Confirm result consistency
5. **Check background processes**: Avoid system task interference

```bash
# Linux: Set CPU to performance mode
sudo cpupower frequency-set -g performance

# Run benchmarks
cargo bench

# Restore power saving mode
sudo cpupower frequency-set -g powersave
```

## Practical Scenarios

### Scenario 1: Comparing Algorithm Implementations

```rust
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};

// Three sorting algorithms
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
        // Generate test data
        let data: Vec<i32> = (0..*size).rev().collect();  // Reverse order, worst case

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

### Scenario 2: Data Structure Performance Testing

```rust
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion, Throughput};
use std::collections::{HashMap, BTreeMap, LinkedList, VecDeque};

fn bench_collections(c: &mut Criterion) {
    // Test insertion performance
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

    // Test lookup performance
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

### Scenario 3: Parser Performance Testing

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion, Throughput};

// Simple JSON number parser
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

### Scenario 4: Concurrency Performance Testing

```rust
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use std::sync::{Arc, Mutex, RwLock};
use std::sync::atomic::{AtomicU64, Ordering};

fn bench_synchronization(c: &mut Criterion) {
    let mut group = c.benchmark_group("synchronization");

    // Single-threaded baseline
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

    // RwLock (write)
    group.bench_function("rwlock_write", |b| {
        let counter = Arc::new(RwLock::new(0u64));
        b.iter(|| {
            let mut guard = counter.write().unwrap();
            *guard += 1;
            black_box(*guard)
        })
    });

    // RwLock (read)
    group.bench_function("rwlock_read", |b| {
        let counter = Arc::new(RwLock::new(0u64));
        b.iter(|| {
            let guard = counter.read().unwrap();
            black_box(*guard)
        })
    });

    // Atomic operations
    group.bench_function("atomic", |b| {
        let counter = AtomicU64::new(0);
        b.iter(|| {
            let val = counter.fetch_add(1, Ordering::SeqCst);
            black_box(val)
        })
    });

    // Atomic operations (Relaxed)
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

## HTML Reports

### Generating Reports

Enable HTML report feature:

```toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }
```

After running benchmarks, reports are located at:

```
target/criterion/<benchmark_name>/report/index.html
```

### Report Contents

HTML reports include:

1. **Overview page**: Summary of all benchmarks
2. **Detail pages**: Detailed statistics for each benchmark
3. **Charts**:
   - PDF (Probability Density Function) chart
   - Iteration time chart
   - Regression analysis chart
   - Comparison chart (if baseline exists)

### Custom Reports

```rust
use criterion::{criterion_group, criterion_main, Criterion, PlotConfiguration, AxisScale};

fn custom_reports(c: &mut Criterion) {
    let mut group = c.benchmark_group("custom_plots");

    // Configure charts
    group.plot_config(
        PlotConfiguration::default()
            .summary_scale(AxisScale::Logarithmic)  // Logarithmic scale
    );

    // Add benchmarks
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

## Interview Key Points

### Frequently Asked Interview Questions

**1. Why do we need to use black_box?**

`black_box` prevents compiler optimization:
- Prevents constant folding
- Prevents dead code elimination
- Ensures we measure actual execution time

**2. How does Criterion ensure statistical reliability of measurements?**

- Uses bootstrap resampling to calculate confidence intervals
- Automatically detects and reports outliers
- Warmup phase eliminates cold start effects
- Multiple sampling for stable results

**3. What is the difference between iter_batched and iter?**

- `iter`: Directly executes the closure for each iteration
- `iter_batched`: Separates setup and tested code, setup time is not included in measurement

**4. How to detect performance regressions?**

```bash
# Save baseline
cargo bench -- --save-baseline before

# Compare with baseline after code changes
cargo bench -- --baseline before
```

**5. What does the confidence interval in benchmark results represent?**

`[lower median upper]` indicates that at the given confidence level (default 95%), there is a 95% probability that the true value falls within this interval.

**6. How to compare performance of different algorithms?**

```rust
let mut group = c.benchmark_group("comparison");
group.bench_function("algorithm_a", |b| b.iter(|| algo_a()));
group.bench_function("algorithm_b", |b| b.iter(|| algo_b()));
group.finish();
```

### Practical Tips

1. **Always run in release mode**: `cargo bench` defaults to release mode
2. **Disable CPU power saving**: Ensure consistent test environment
3. **Run multiple times to confirm**: Single results may fluctuate
4. **Use baseline comparison**: Track performance changes
5. **Separate setup code**: Only measure what you care about

## Further Reading

### Official Resources

- [Criterion.rs Official Documentation](https://bheisler.github.io/criterion.rs/book/)
- [Criterion.rs GitHub](https://github.com/bheisler/criterion.rs)
- [Rust Performance Book](https://nnethercote.github.io/perf-book/)

### Related Tools

- **cargo-flamegraph**: Generate flame graphs for performance bottleneck analysis
- **perf**: Linux performance analysis tool
- **dhat**: Heap profiler
- **cargo-asm**: View generated assembly code

### Advanced Topics

- **Sampling profiling vs Instrumentation profiling**: Understanding different performance analysis methods
- **CPU cache optimization**: Understanding cache impact on performance
- **SIMD optimization**: Using vectorized instructions
- **Memory allocation optimization**: Reducing heap allocations

### Recommended Reading

- "The Rust Performance Book"
- "Systems Performance" by Brendan Gregg
- "Computer Architecture: A Quantitative Approach"

## Summary

Criterion is the standard tool for rigorous performance measurement in the Rust ecosystem. Mastering Criterion requires understanding:

**Core Concepts:**
- Statistical sampling and confidence intervals
- Warmup and measurement phases
- Regression detection mechanism

**Key Skills:**
- Correctly using `black_box` to prevent optimization
- Using `iter_batched` to separate setup code
- Configuring sampling parameters for reliable results
- Using benchmark groups to compare implementations

**Best Practices:**
- Keep test environment consistent
- Use baselines to track performance changes
- Generate HTML reports for easy analysis
- Pay attention to outliers and noise

Performance optimization is an ongoing process. Using Criterion to establish reliable benchmarks helps you make optimization decisions with confidence, avoid performance regressions, and continuously improve code quality.
