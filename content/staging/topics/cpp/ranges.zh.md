---
title: C++20 Ranges 范围库
description: 深入掌握 C++20 Ranges 库：范围概念、视图、视图适配器、范围算法与惰性求值
track: cpp
section: modern-cpp
difficulty: advanced
tags:
  - C++
  - C++20
  - Ranges
  - 视图
  - 函数式编程
status: imported
origin: old/src/content/docs/cpp/ranges.zh.md
divergence: 0.265
issues:
  - missing-subcategory-en
legacy:
  category: Cpp
  subcategory: 现代C++
  order: 13
  lastUpdated: 2026-01-07
---

C++20 Ranges 库是对传统 STL 算法的现代化重构，它引入了范围（Range）的概念，提供了更优雅、更可组合、更安全的数据处理方式。Ranges 库通过惰性求值和管道操作符，让 C++ 的函数式编程风格达到了新的高度。

## 概念解释

### 什么是范围（Range）？

范围是一个抽象概念，表示一个可以迭代的元素序列。在 C++20 中，任何提供 `begin()` 和 `end()` 的对象都可以被视为范围。与传统的迭代器对（begin/end pair）相比，范围将两者封装为一个整体，使得代码更加简洁和安全。

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 传统 STL 方式：需要传递两个迭代器
    std::sort(vec.begin(), vec.end());

    // C++20 范围方式：直接传递容器
    std::ranges::sort(vec);

    // 范围就是一个可迭代的对象
    for (int n : vec) {
        std::cout << n << " ";
    }

    return 0;
}
```

### 为什么需要 Ranges？

传统 STL 算法存在以下问题：

1. **冗余的迭代器对**：每次调用算法都需要传递 `begin()` 和 `end()`
2. **类型不安全**：容易传递不匹配的迭代器对
3. **不支持组合**：多个算法串联需要中间容器
4. **即时求值**：所有操作立即执行，可能造成性能浪费

Ranges 库解决了这些问题：

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // 传统方式：需要中间容器，即时求值
    std::vector<int> evens;
    std::copy_if(numbers.begin(), numbers.end(),
                 std::back_inserter(evens),
                 [](int n) { return n % 2 == 0; });

    std::vector<int> squares;
    std::transform(evens.begin(), evens.end(),
                   std::back_inserter(squares),
                   [](int n) { return n * n; });

    // Ranges 方式：管道组合，惰性求值
    auto result = numbers
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; });

    // 只有在遍历时才会计算
    for (int n : result) {
        std::cout << n << " ";  // 4 16 36 64 100
    }

    return 0;
}
```

### Ranges 库的历史

Ranges 库源于 Eric Niebler 的 Range-v3 库，该库从 2013 年开始开发，经过多年迭代，最终在 C++20 中被标准化。Range-v3 的设计理念深刻影响了现代 C++ 的发展方向。

## 核心原理

### 范围概念（Range Concepts）

C++20 在 `<ranges>` 头文件中定义了一系列范围概念，用于描述不同类型范围的能力。

```cpp
#include <ranges>
#include <vector>
#include <list>
#include <forward_list>

// 范围概念层次结构
// range              : 最基本的范围，有 begin() 和 end()
// input_range        : 支持单遍输入迭代
// forward_range      : 支持多遍前向迭代
// bidirectional_range: 支持双向迭代
// random_access_range: 支持随机访问
// contiguous_range   : 元素在内存中连续存储
// sized_range        : 可在常数时间内获取大小
// common_range       : begin() 和 end() 返回相同类型

template<std::ranges::input_range R>
void process_input_range(R&& r) {
    for (auto&& elem : r) {
        // 处理元素
    }
}

template<std::ranges::random_access_range R>
void process_random_access_range(R&& r) {
    // 可以使用下标访问
    auto size = std::ranges::size(r);
    for (size_t i = 0; i < size; ++i) {
        // r[i] 访问
    }
}

int main() {
    std::vector<int> vec = {1, 2, 3};
    std::list<int> lst = {1, 2, 3};
    std::forward_list<int> flst = {1, 2, 3};

    // vector 满足所有范围概念
    static_assert(std::ranges::contiguous_range<std::vector<int>>);
    static_assert(std::ranges::random_access_range<std::vector<int>>);
    static_assert(std::ranges::sized_range<std::vector<int>>);

    // list 是双向范围但不是随机访问范围
    static_assert(std::ranges::bidirectional_range<std::list<int>>);
    static_assert(!std::ranges::random_access_range<std::list<int>>);

    // forward_list 只是前向范围
    static_assert(std::ranges::forward_range<std::forward_list<int>>);
    static_assert(!std::ranges::bidirectional_range<std::forward_list<int>>);

    return 0;
}
```

### 视图（View）的本质

视图是一种特殊的范围，具有以下特性：

1. **非拥有（Non-owning）**：视图不拥有其元素，只是底层数据的一个"窗口"
2. **惰性求值（Lazy Evaluation）**：只有在遍历时才计算结果
3. **轻量复制**：视图的复制是 O(1) 操作
4. **可组合**：多个视图可以通过管道操作符组合

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> data = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // 视图是惰性的 - 此时没有任何计算发生
    auto view = data
        | std::views::filter([](int n) {
            std::cout << "filter: " << n << std::endl;
            return n % 2 == 0;
        })
        | std::views::transform([](int n) {
            std::cout << "transform: " << n << std::endl;
            return n * n;
        });

    std::cout << "视图已创建，但尚未计算" << std::endl;

    // 只有在遍历时才会执行计算
    std::cout << "\n开始遍历:" << std::endl;
    for (int n : view) {
        std::cout << "结果: " << n << std::endl;
    }

    return 0;
}
```

输出：
```
视图已创建，但尚未计算

开始遍历:
filter: 1
filter: 2
transform: 2
结果: 4
filter: 3
filter: 4
transform: 4
结果: 16
...
```

### 管道操作符（Pipe Operator）

管道操作符 `|` 是 Ranges 库的核心语法糖，它允许将多个视图适配器以流式方式组合。

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // 以下三种写法等价

    // 方式1：管道操作符（推荐）
    auto result1 = numbers
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; })
        | std::views::take(3);

    // 方式2：嵌套调用
    auto result2 = std::views::take(
        std::views::transform(
            std::views::filter(numbers, [](int n) { return n % 2 == 0; }),
            [](int n) { return n * n; }
        ),
        3
    );

    // 方式3：函数调用语法
    auto filtered = std::views::filter(numbers, [](int n) { return n % 2 == 0; });
    auto transformed = std::views::transform(filtered, [](int n) { return n * n; });
    auto result3 = std::views::take(transformed, 3);

    // 管道操作符使代码更具可读性
    for (int n : result1) {
        std::cout << n << " ";  // 4 16 36
    }

    return 0;
}
```

## 核心要点

### 视图适配器分类

C++20 Ranges 库提供了丰富的视图适配器，按功能可分为以下几类：

| 分类 | 适配器 | 说明 |
|------|--------|------|
| 过滤 | `filter` | 按条件筛选元素 |
| 转换 | `transform` | 转换每个元素 |
| 截取 | `take`, `take_while` | 取前 N 个或满足条件的元素 |
| 跳过 | `drop`, `drop_while` | 跳过前 N 个或满足条件的元素 |
| 反转 | `reverse` | 反向遍历 |
| 展平 | `join` | 展平嵌套范围 |
| 分割 | `split` | 按分隔符分割 |
| 元素 | `elements`, `keys`, `values` | 提取元组/pair 的元素 |

### 范围工厂

范围工厂用于创建新的范围：

| 工厂 | 说明 |
|------|------|
| `iota` | 生成连续序列 |
| `single` | 单元素范围 |
| `empty` | 空范围 |
| `repeat` (C++23) | 重复元素 |

### 范围算法特点

范围版本的算法相比传统 STL 算法具有以下优势：

1. **接受范围作为参数**：无需传递迭代器对
2. **支持投影（Projection）**：可以指定要操作的成员
3. **更好的错误信息**：使用概念约束，编译错误更清晰
4. **统一的命名空间**：所有算法在 `std::ranges` 命名空间下

## 代码示例

### 视图适配器详解

#### filter - 过滤视图

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // 基本过滤
    auto evens = numbers | std::views::filter([](int n) {
        return n % 2 == 0;
    });

    std::cout << "偶数: ";
    for (int n : evens) {
        std::cout << n << " ";  // 2 4 6 8 10
    }
    std::cout << std::endl;

    // 过滤对象
    struct Person {
        std::string name;
        int age;
    };

    std::vector<Person> people = {
        {"张三", 25}, {"李四", 17}, {"王五", 30}, {"赵六", 16}
    };

    auto adults = people | std::views::filter([](const Person& p) {
        return p.age >= 18;
    });

    std::cout << "成年人: ";
    for (const auto& p : adults) {
        std::cout << p.name << " ";  // 张三 王五
    }
    std::cout << std::endl;

    return 0;
}
```

#### transform - 转换视图

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>
#include <cmath>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};

    // 数值转换
    auto squares = numbers | std::views::transform([](int n) {
        return n * n;
    });

    std::cout << "平方: ";
    for (int n : squares) {
        std::cout << n << " ";  // 1 4 9 16 25
    }
    std::cout << std::endl;

    // 类型转换
    auto as_doubles = numbers | std::views::transform([](int n) {
        return std::sqrt(static_cast<double>(n));
    });

    std::cout << "平方根: ";
    for (double d : as_doubles) {
        std::cout << d << " ";
    }
    std::cout << std::endl;

    // 对象属性提取
    struct Product {
        std::string name;
        double price;
    };

    std::vector<Product> products = {
        {"苹果", 5.0}, {"香蕉", 3.0}, {"橙子", 4.0}
    };

    auto prices = products | std::views::transform([](const Product& p) {
        return p.price;
    });

    double total = 0;
    for (double price : prices) {
        total += price;
    }
    std::cout << "总价: " << total << std::endl;  // 12.0

    return 0;
}
```

#### take 和 drop - 截取视图

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // take: 取前 N 个元素
    auto first_five = numbers | std::views::take(5);
    std::cout << "前5个: ";
    for (int n : first_five) {
        std::cout << n << " ";  // 1 2 3 4 5
    }
    std::cout << std::endl;

    // drop: 跳过前 N 个元素
    auto after_three = numbers | std::views::drop(3);
    std::cout << "跳过前3个: ";
    for (int n : after_three) {
        std::cout << n << " ";  // 4 5 6 7 8 9 10
    }
    std::cout << std::endl;

    // take_while: 取满足条件的元素（直到条件不满足）
    auto less_than_five = numbers | std::views::take_while([](int n) {
        return n < 5;
    });
    std::cout << "小于5: ";
    for (int n : less_than_five) {
        std::cout << n << " ";  // 1 2 3 4
    }
    std::cout << std::endl;

    // drop_while: 跳过满足条件的元素
    auto from_five = numbers | std::views::drop_while([](int n) {
        return n < 5;
    });
    std::cout << "从5开始: ";
    for (int n : from_five) {
        std::cout << n << " ";  // 5 6 7 8 9 10
    }
    std::cout << std::endl;

    // 组合使用：分页效果
    int page = 2;
    int page_size = 3;
    auto page_data = numbers
        | std::views::drop((page - 1) * page_size)
        | std::views::take(page_size);

    std::cout << "第2页（每页3条）: ";
    for (int n : page_data) {
        std::cout << n << " ";  // 4 5 6
    }
    std::cout << std::endl;

    return 0;
}
```

#### reverse - 反转视图

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};

    // 反转遍历
    auto reversed = numbers | std::views::reverse;
    std::cout << "反转: ";
    for (int n : reversed) {
        std::cout << n << " ";  // 5 4 3 2 1
    }
    std::cout << std::endl;

    // 反转字符串
    std::string str = "Hello, World!";
    auto reversed_str = str | std::views::reverse;
    std::cout << "反转字符串: ";
    for (char c : reversed_str) {
        std::cout << c;  // !dlroW ,olleH
    }
    std::cout << std::endl;

    // 组合：取最后3个元素
    auto last_three = numbers
        | std::views::reverse
        | std::views::take(3)
        | std::views::reverse;

    std::cout << "最后3个: ";
    for (int n : last_three) {
        std::cout << n << " ";  // 3 4 5
    }
    std::cout << std::endl;

    return 0;
}
```

#### join - 展平视图

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>

int main() {
    // 展平嵌套 vector
    std::vector<std::vector<int>> nested = {
        {1, 2, 3},
        {4, 5},
        {6, 7, 8, 9}
    };

    auto flattened = nested | std::views::join;
    std::cout << "展平: ";
    for (int n : flattened) {
        std::cout << n << " ";  // 1 2 3 4 5 6 7 8 9
    }
    std::cout << std::endl;

    // 展平字符串数组
    std::vector<std::string> words = {"Hello", " ", "World", "!"};
    auto joined = words | std::views::join;
    std::cout << "连接字符串: ";
    for (char c : joined) {
        std::cout << c;  // Hello World!
    }
    std::cout << std::endl;

    // 与 transform 组合
    std::vector<std::string> sentences = {"Hello World", "Foo Bar", "C++ Ranges"};
    // 假设我们想获取所有单词的第一个字母
    // 这需要更复杂的处理...

    return 0;
}
```

#### split - 分割视图

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>
#include <string_view>

int main() {
    std::string text = "apple,banana,orange,grape";

    // 按逗号分割
    auto parts = text | std::views::split(',');

    std::cout << "分割结果: " << std::endl;
    for (auto part : parts) {
        // 每个 part 是一个子范围
        std::string_view sv(part.begin(), part.end());
        std::cout << "  - " << sv << std::endl;
    }

    // 按空格分割句子
    std::string sentence = "The quick brown fox jumps";
    auto words = sentence | std::views::split(' ');

    int word_count = 0;
    for (auto word : words) {
        ++word_count;
    }
    std::cout << "单词数: " << word_count << std::endl;  // 5

    // 分割并转换
    std::string numbers_str = "1,2,3,4,5";
    // 注意：split 返回的子范围需要额外处理才能转换为数字

    return 0;
}
```

#### elements, keys, values - 元素视图

```cpp
#include <ranges>
#include <vector>
#include <map>
#include <iostream>
#include <tuple>

int main() {
    // 从 pair 中提取元素
    std::vector<std::pair<std::string, int>> pairs = {
        {"Alice", 25},
        {"Bob", 30},
        {"Charlie", 35}
    };

    // 提取所有键（第一个元素）
    auto names = pairs | std::views::keys;
    std::cout << "名字: ";
    for (const auto& name : names) {
        std::cout << name << " ";  // Alice Bob Charlie
    }
    std::cout << std::endl;

    // 提取所有值（第二个元素）
    auto ages = pairs | std::views::values;
    std::cout << "年龄: ";
    for (int age : ages) {
        std::cout << age << " ";  // 25 30 35
    }
    std::cout << std::endl;

    // 从 map 中提取
    std::map<std::string, double> prices = {
        {"苹果", 5.0},
        {"香蕉", 3.0},
        {"橙子", 4.0}
    };

    std::cout << "商品: ";
    for (const auto& key : prices | std::views::keys) {
        std::cout << key << " ";
    }
    std::cout << std::endl;

    // 从 tuple 中提取指定位置的元素
    std::vector<std::tuple<int, std::string, double>> records = {
        {1, "A", 10.0},
        {2, "B", 20.0},
        {3, "C", 30.0}
    };

    // 提取第一个元素（索引0）
    auto ids = records | std::views::elements<0>;
    std::cout << "IDs: ";
    for (int id : ids) {
        std::cout << id << " ";  // 1 2 3
    }
    std::cout << std::endl;

    // 提取第三个元素（索引2）
    auto values_from_tuple = records | std::views::elements<2>;
    std::cout << "值: ";
    for (double v : values_from_tuple) {
        std::cout << v << " ";  // 10 20 30
    }
    std::cout << std::endl;

    return 0;
}
```

### 范围工厂详解

```cpp
#include <ranges>
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    // iota: 生成连续整数序列
    // 有限序列
    std::cout << "iota(1, 6): ";
    for (int n : std::views::iota(1, 6)) {
        std::cout << n << " ";  // 1 2 3 4 5
    }
    std::cout << std::endl;

    // 无限序列（必须配合 take 使用）
    std::cout << "无限序列取前10: ";
    for (int n : std::views::iota(100) | std::views::take(10)) {
        std::cout << n << " ";  // 100 101 102 ... 109
    }
    std::cout << std::endl;

    // single: 单元素视图
    std::cout << "single(42): ";
    for (int n : std::views::single(42)) {
        std::cout << n << " ";  // 42
    }
    std::cout << std::endl;

    // empty: 空视图
    std::cout << "empty<int> 元素数: ";
    int count = 0;
    for (int n : std::views::empty<int>) {
        ++count;
    }
    std::cout << count << std::endl;  // 0

    // 实际应用：生成等差数列
    auto arithmetic_sequence = std::views::iota(0, 10)
        | std::views::transform([](int n) { return 5 + n * 3; });  // 5, 8, 11, ...

    std::cout << "等差数列(首项5, 公差3): ";
    for (int n : arithmetic_sequence) {
        std::cout << n << " ";  // 5 8 11 14 17 20 23 26 29 32
    }
    std::cout << std::endl;

    // 实际应用：生成斐波那契数列（使用 iota 作为索引）
    std::vector<long long> fib_cache = {0, 1};
    auto fibonacci = std::views::iota(0, 20)
        | std::views::transform([&fib_cache](int n) {
            while (fib_cache.size() <= static_cast<size_t>(n)) {
                size_t sz = fib_cache.size();
                fib_cache.push_back(fib_cache[sz-1] + fib_cache[sz-2]);
            }
            return fib_cache[n];
        });

    std::cout << "斐波那契数列: ";
    for (auto n : fibonacci | std::views::take(15)) {
        std::cout << n << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### 范围算法详解

```cpp
#include <ranges>
#include <vector>
#include <algorithm>
#include <iostream>
#include <string>

int main() {
    // 基本排序
    std::vector<int> numbers = {5, 2, 8, 1, 9, 3, 7};

    // 范围版本的 sort
    std::ranges::sort(numbers);
    std::cout << "排序后: ";
    for (int n : numbers) std::cout << n << " ";
    std::cout << std::endl;

    // 使用自定义比较器
    std::ranges::sort(numbers, std::greater<>{});
    std::cout << "降序: ";
    for (int n : numbers) std::cout << n << " ";
    std::cout << std::endl;

    // 投影（Projection）功能
    struct Person {
        std::string name;
        int age;
        double salary;
    };

    std::vector<Person> people = {
        {"张三", 25, 8000},
        {"李四", 30, 12000},
        {"王五", 22, 6000},
        {"赵六", 35, 15000}
    };

    // 按年龄排序（使用投影）
    std::ranges::sort(people, {}, &Person::age);
    std::cout << "\n按年龄排序:" << std::endl;
    for (const auto& p : people) {
        std::cout << p.name << " (" << p.age << "岁)" << std::endl;
    }

    // 按薪资降序排序
    std::ranges::sort(people, std::greater<>{}, &Person::salary);
    std::cout << "\n按薪资降序:" << std::endl;
    for (const auto& p : people) {
        std::cout << p.name << " (￥" << p.salary << ")" << std::endl;
    }

    // 查找
    auto it = std::ranges::find(people, "李四", &Person::name);
    if (it != people.end()) {
        std::cout << "\n找到: " << it->name << ", 年龄 " << it->age << std::endl;
    }

    // 查找满足条件的元素
    auto young = std::ranges::find_if(people, [](const Person& p) {
        return p.age < 25;
    });
    if (young != people.end()) {
        std::cout << "最年轻的: " << young->name << std::endl;
    }

    // 计数
    auto high_salary_count = std::ranges::count_if(people, [](const Person& p) {
        return p.salary > 10000;
    });
    std::cout << "高薪人数: " << high_salary_count << std::endl;

    // 最大/最小元素
    auto oldest = std::ranges::max_element(people, {}, &Person::age);
    auto youngest = std::ranges::min_element(people, {}, &Person::age);
    std::cout << "年龄最大: " << oldest->name << std::endl;
    std::cout << "年龄最小: " << youngest->name << std::endl;

    // minmax
    auto [min_it, max_it] = std::ranges::minmax_element(people, {}, &Person::salary);
    std::cout << "薪资范围: " << min_it->salary << " - " << max_it->salary << std::endl;

    // all_of, any_of, none_of
    bool all_adult = std::ranges::all_of(people, [](const Person& p) {
        return p.age >= 18;
    });
    std::cout << "全部成年: " << (all_adult ? "是" : "否") << std::endl;

    // 复制
    std::vector<Person> adults;
    std::ranges::copy_if(people, std::back_inserter(adults), [](const Person& p) {
        return p.age >= 25;
    });
    std::cout << "25岁以上人数: " << adults.size() << std::endl;

    return 0;
}
```

### 复杂组合示例

```cpp
#include <ranges>
#include <vector>
#include <algorithm>
#include <iostream>
#include <string>
#include <numeric>

// 实际应用：数据处理管道
struct Transaction {
    int id;
    std::string customer;
    std::string category;
    double amount;
    bool is_refund;
};

int main() {
    std::vector<Transaction> transactions = {
        {1, "Alice", "Electronics", 500.0, false},
        {2, "Bob", "Books", 50.0, false},
        {3, "Alice", "Electronics", 100.0, true},   // 退款
        {4, "Charlie", "Electronics", 300.0, false},
        {5, "Bob", "Electronics", 200.0, false},
        {6, "Alice", "Books", 30.0, false},
        {7, "Charlie", "Books", 25.0, false},
        {8, "Bob", "Electronics", 150.0, true},     // 退款
    };

    // 任务：计算电子产品类别的净销售额（排除退款）
    auto electronics_sales = transactions
        | std::views::filter([](const Transaction& t) {
            return t.category == "Electronics" && !t.is_refund;
        })
        | std::views::transform([](const Transaction& t) {
            return t.amount;
        });

    double total_electronics = 0;
    for (double amount : electronics_sales) {
        total_electronics += amount;
    }
    std::cout << "电子产品销售额: ￥" << total_electronics << std::endl;

    // 任务：找出消费最高的前3名客户（按总消费）
    // 首先按客户分组（手动实现）
    std::map<std::string, double> customer_totals;
    for (const auto& t : transactions) {
        if (!t.is_refund) {
            customer_totals[t.customer] += t.amount;
        } else {
            customer_totals[t.customer] -= t.amount;
        }
    }

    // 转换为 vector 并排序
    std::vector<std::pair<std::string, double>> sorted_customers(
        customer_totals.begin(), customer_totals.end()
    );

    std::ranges::sort(sorted_customers, std::greater<>{},
                      [](const auto& p) { return p.second; });

    std::cout << "\n消费排行榜（前3）:" << std::endl;
    for (const auto& [name, total] : sorted_customers | std::views::take(3)) {
        std::cout << "  " << name << ": ￥" << total << std::endl;
    }

    // 任务：生成交易报告
    std::cout << "\n有效交易列表:" << std::endl;
    auto valid_transactions = transactions
        | std::views::filter([](const Transaction& t) { return !t.is_refund; })
        | std::views::transform([](const Transaction& t) {
            return "ID:" + std::to_string(t.id) + " " +
                   t.customer + " - " + t.category +
                   " ￥" + std::to_string(static_cast<int>(t.amount));
        });

    for (const auto& report : valid_transactions) {
        std::cout << "  " << report << std::endl;
    }

    return 0;
}
```

## 最佳实践

### 优先使用视图而非中间容器

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void best_practice_views() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // 不推荐：创建中间容器
    std::vector<int> evens;
    std::copy_if(numbers.begin(), numbers.end(),
                 std::back_inserter(evens),
                 [](int n) { return n % 2 == 0; });
    std::vector<int> squares;
    std::transform(evens.begin(), evens.end(),
                   std::back_inserter(squares),
                   [](int n) { return n * n; });

    // 推荐：使用视图管道
    auto result = numbers
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; });

    // 视图是惰性的，只在需要时计算
    for (int n : result) {
        std::cout << n << " ";
    }
}
```

### 合理使用范围算法的投影功能

```cpp
#include <ranges>
#include <vector>
#include <algorithm>
#include <string>

struct Employee {
    std::string name;
    std::string department;
    int salary;
};

void best_practice_projection() {
    std::vector<Employee> employees = {
        {"张三", "研发", 15000},
        {"李四", "销售", 12000},
        {"王五", "研发", 18000},
    };

    // 不推荐：lambda 中访问成员
    std::ranges::sort(employees, [](const Employee& a, const Employee& b) {
        return a.salary < b.salary;
    });

    // 推荐：使用投影
    std::ranges::sort(employees, {}, &Employee::salary);

    // 更复杂的投影
    std::ranges::sort(employees, {}, [](const Employee& e) {
        return std::make_tuple(e.department, e.salary);
    });
}
```

### 注意视图的生命周期

```cpp
#include <ranges>
#include <vector>
#include <iostream>

// 危险：返回悬垂视图
auto dangerous_view() {
    std::vector<int> local = {1, 2, 3, 4, 5};
    return local | std::views::filter([](int n) { return n % 2 == 0; });
    // 返回后 local 被销毁，视图悬垂！
}

// 安全：接受外部范围
auto safe_view(std::vector<int>& data) {
    return data | std::views::filter([](int n) { return n % 2 == 0; });
}

// 安全：返回具体容器
std::vector<int> safe_materialized(const std::vector<int>& data) {
    auto view = data | std::views::filter([](int n) { return n % 2 == 0; });
    return std::vector<int>(view.begin(), view.end());
}

void best_practice_lifetime() {
    std::vector<int> data = {1, 2, 3, 4, 5};

    // 安全使用
    auto view = safe_view(data);
    for (int n : view) {
        std::cout << n << " ";
    }
}
```

### 需要多次遍历时物化视图

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <numeric>

void best_practice_materialize() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // 复杂的视图管道
    auto complex_view = numbers
        | std::views::filter([](int n) {
            // 假设这是一个昂贵的操作
            return n % 2 == 0;
        })
        | std::views::transform([](int n) {
            // 假设这也是一个昂贵的操作
            return n * n;
        });

    // 如果需要多次遍历，应该物化
    std::vector<int> materialized(complex_view.begin(), complex_view.end());

    // 现在可以多次高效遍历
    int sum = std::accumulate(materialized.begin(), materialized.end(), 0);
    int count = materialized.size();
    double avg = static_cast<double>(sum) / count;

    std::cout << "总和: " << sum << ", 平均: " << avg << std::endl;
}
```

### 使用 ranges::to (C++23) 转换为容器

```cpp
#include <ranges>
#include <vector>
#include <set>
#include <iostream>

void best_practice_ranges_to() {
    std::vector<int> numbers = {1, 2, 2, 3, 3, 3, 4, 5};

    // C++20：手动转换
    auto view = numbers
        | std::views::filter([](int n) { return n > 2; })
        | std::views::transform([](int n) { return n * 2; });

    std::vector<int> result(view.begin(), view.end());

    // C++23：使用 ranges::to
    // auto result = numbers
    //     | std::views::filter([](int n) { return n > 2; })
    //     | std::views::transform([](int n) { return n * 2; })
    //     | std::ranges::to<std::vector>();

    // C++23：转换为 set（自动去重）
    // auto unique_result = numbers
    //     | std::views::transform([](int n) { return n * 2; })
    //     | std::ranges::to<std::set>();
}
```

## 常见陷阱

### 视图悬垂引用

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void pitfall_dangling() {
    // 错误示例：临时对象
    // auto view = std::vector{1, 2, 3, 4, 5}
    //     | std::views::filter([](int n) { return n > 2; });
    // for (int n : view) { ... }  // 未定义行为！

    // 正确做法
    std::vector<int> data = {1, 2, 3, 4, 5};
    auto view = data | std::views::filter([](int n) { return n > 2; });
    for (int n : view) {
        std::cout << n << " ";
    }
}
```

### 多次遍历的开销

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void pitfall_multiple_iteration() {
    std::vector<int> data = {1, 2, 3, 4, 5};
    int call_count = 0;

    auto view = data | std::views::filter([&call_count](int n) {
        ++call_count;
        return n % 2 == 0;
    });

    // 第一次遍历
    for (int n : view) {
        std::cout << n << " ";
    }
    std::cout << "\n调用次数: " << call_count << std::endl;  // 5

    // 第二次遍历 - filter 再次被调用！
    for (int n : view) {
        std::cout << n << " ";
    }
    std::cout << "\n调用次数: " << call_count << std::endl;  // 10

    // 如果 filter 操作昂贵，应该物化结果
}
```

### 修改底层容器

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void pitfall_modify_underlying() {
    std::vector<int> data = {1, 2, 3, 4, 5};
    auto view = data | std::views::take(3);

    // 危险：修改底层容器可能使视图失效
    data.push_back(6);  // 可能导致重新分配
    data.insert(data.begin(), 0);  // 改变元素位置

    // 使用视图可能产生未定义行为
    // for (int n : view) { ... }  // 危险！

    // 安全做法：先物化，或在修改前使用完视图
}
```

### 混淆 filter 和 take_while

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void pitfall_filter_vs_take_while() {
    std::vector<int> data = {1, 3, 2, 4, 1, 5};

    // filter: 检查所有元素，保留满足条件的
    auto filtered = data | std::views::filter([](int n) { return n < 3; });
    std::cout << "filter (< 3): ";
    for (int n : filtered) {
        std::cout << n << " ";  // 1 2 1
    }
    std::cout << std::endl;

    // take_while: 遇到第一个不满足条件的就停止
    auto taken = data | std::views::take_while([](int n) { return n < 3; });
    std::cout << "take_while (< 3): ";
    for (int n : taken) {
        std::cout << n << " ";  // 1
    }
    std::cout << std::endl;
}
```

### 忽略视图的非拥有语义

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void pitfall_non_owning() {
    auto get_view() -> decltype(auto) {
        std::vector<int> temp = {1, 2, 3, 4, 5};
        // 错误：返回引用临时对象的视图
        // return temp | std::views::all;  // 悬垂！
    }

    // 正确：确保底层数据的生命周期足够长
    std::vector<int> data = {1, 2, 3, 4, 5};
    auto view = data | std::views::all;  // OK，data 仍然存在
}
```

## 性能考量

### 惰性求值的优势

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <chrono>

void performance_lazy_evaluation() {
    std::vector<int> large_data(1'000'000);
    std::iota(large_data.begin(), large_data.end(), 1);

    // 惰性求值：只计算需要的元素
    auto start = std::chrono::high_resolution_clock::now();

    auto first_10_squares = large_data
        | std::views::filter([](int n) { return n % 1000 == 0; })
        | std::views::transform([](int n) { return n * n; })
        | std::views::take(10);

    // 只有在遍历时才真正计算
    long long sum = 0;
    for (auto n : first_10_squares) {
        sum += n;
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);

    std::cout << "惰性求值结果: " << sum << std::endl;
    std::cout << "耗时: " << duration.count() << " 微秒" << std::endl;

    // 对比：传统方式会处理所有元素
}
```

### 避免不必要的中间容器

```cpp
#include <ranges>
#include <vector>
#include <algorithm>
#include <numeric>

void performance_no_intermediate() {
    std::vector<int> data(100000);
    std::iota(data.begin(), data.end(), 1);

    // 传统方式：需要中间容器，O(n) 额外空间
    std::vector<int> temp1, temp2;
    std::copy_if(data.begin(), data.end(), std::back_inserter(temp1),
                 [](int n) { return n % 2 == 0; });
    std::transform(temp1.begin(), temp1.end(), std::back_inserter(temp2),
                   [](int n) { return n * 2; });
    int result1 = std::accumulate(temp2.begin(), temp2.end(), 0);

    // Ranges 方式：无中间容器，O(1) 额外空间
    auto view = data
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * 2; });
    int result2 = 0;
    for (int n : view) {
        result2 += n;
    }

    // 结果相同，但 Ranges 版本内存效率更高
}
```

### 视图组合的开销

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void performance_composition_overhead() {
    std::vector<int> data = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // 每个视图适配器都有一定开销
    // 但通常是常数级别的

    // 深度嵌套的视图
    auto deep_view = data
        | std::views::filter([](int n) { return true; })
        | std::views::filter([](int n) { return true; })
        | std::views::filter([](int n) { return true; })
        | std::views::transform([](int n) { return n; })
        | std::views::transform([](int n) { return n; });

    // 对于简单操作，过多的视图层可能有额外开销
    // 在性能关键路径上，测量并权衡

    // 建议：合并可以合并的操作
    auto optimized_view = data
        | std::views::filter([](int n) {
            return true && true && true;  // 合并条件
        })
        | std::views::transform([](int n) {
            return n;  // 合并转换
        });
}
```

### 选择合适的容器作为底层数据

```cpp
#include <ranges>
#include <vector>
#include <list>
#include <deque>
#include <iostream>

void performance_underlying_container() {
    // vector：连续内存，缓存友好
    std::vector<int> vec(10000);
    auto vec_view = vec | std::views::reverse;  // O(1) 创建视图

    // list：非连续，reverse 视图效率相同
    std::list<int> lst(10000);
    auto lst_view = lst | std::views::reverse;  // O(1) 创建视图

    // 但遍历 vector 通常更快（缓存局部性）

    // 对于 random_access_range，某些操作更高效
    static_assert(std::ranges::random_access_range<std::vector<int>>);
    static_assert(!std::ranges::random_access_range<std::list<int>>);

    // drop 和 take 在 random_access_range 上是 O(1)
    // 在 forward_range 上可能是 O(n)
}
```

## 实战场景

### 场景一：日志分析

```cpp
#include <ranges>
#include <vector>
#include <string>
#include <iostream>
#include <sstream>
#include <chrono>

struct LogEntry {
    std::string timestamp;
    std::string level;      // INFO, WARN, ERROR
    std::string message;
    std::string source;
};

// 解析日志行
LogEntry parse_log(const std::string& line) {
    // 简化解析：格式 "timestamp|level|source|message"
    std::istringstream iss(line);
    LogEntry entry;
    std::getline(iss, entry.timestamp, '|');
    std::getline(iss, entry.level, '|');
    std::getline(iss, entry.source, '|');
    std::getline(iss, entry.message);
    return entry;
}

void log_analysis_example() {
    std::vector<std::string> raw_logs = {
        "2024-01-15 10:00:00|INFO|auth|User login successful",
        "2024-01-15 10:00:01|ERROR|database|Connection timeout",
        "2024-01-15 10:00:02|WARN|api|Rate limit approaching",
        "2024-01-15 10:00:03|ERROR|auth|Invalid token",
        "2024-01-15 10:00:04|INFO|api|Request processed",
        "2024-01-15 10:00:05|ERROR|database|Query failed",
    };

    // 解析并转换为结构化数据
    auto logs = raw_logs
        | std::views::transform(parse_log);

    // 只看错误日志
    auto errors = logs
        | std::views::filter([](const LogEntry& e) {
            return e.level == "ERROR";
        });

    std::cout << "=== 错误日志 ===" << std::endl;
    for (const auto& entry : errors) {
        std::cout << "[" << entry.timestamp << "] "
                  << entry.source << ": " << entry.message << std::endl;
    }

    // 统计各来源的错误数
    std::map<std::string, int> error_counts;
    for (const auto& entry : errors) {
        error_counts[entry.source]++;
    }

    std::cout << "\n=== 错误统计 ===" << std::endl;
    for (const auto& [source, count] : error_counts) {
        std::cout << source << ": " << count << " 个错误" << std::endl;
    }

    // 获取最近 3 条数据库相关日志
    auto db_logs = logs
        | std::views::filter([](const LogEntry& e) {
            return e.source == "database";
        })
        | std::views::take(3);

    std::cout << "\n=== 最近数据库日志 ===" << std::endl;
    for (const auto& entry : db_logs) {
        std::cout << "[" << entry.level << "] " << entry.message << std::endl;
    }
}
```

### 场景二：数据清洗管道

```cpp
#include <ranges>
#include <vector>
#include <string>
#include <iostream>
#include <algorithm>
#include <cctype>

struct RawRecord {
    std::string id;
    std::string name;
    std::string email;
    std::string phone;
};

struct CleanRecord {
    std::string id;
    std::string name;
    std::string email;
    std::string phone;
    bool is_valid;
};

// 清洗函数
std::string trim(const std::string& s) {
    auto start = s.find_first_not_of(" \t\n\r");
    auto end = s.find_last_not_of(" \t\n\r");
    return (start == std::string::npos) ? "" : s.substr(start, end - start + 1);
}

std::string to_lower(const std::string& s) {
    std::string result = s;
    std::transform(result.begin(), result.end(), result.begin(),
                   [](char c) { return std::tolower(c); });
    return result;
}

bool is_valid_email(const std::string& email) {
    return email.find('@') != std::string::npos &&
           email.find('.') != std::string::npos;
}

void data_cleaning_example() {
    std::vector<RawRecord> raw_data = {
        {"001", "  John Doe  ", "john@example.com", "123-456-7890"},
        {"002", "Jane Smith", "invalid-email", "987-654-3210"},
        {"003", "  Bob Wilson ", "bob@test.org", ""},
        {"004", "", "empty@name.com", "111-222-3333"},
        {"005", "Alice Brown", "ALICE@COMPANY.COM", "444-555-6666"},
    };

    // 数据清洗管道
    auto cleaned = raw_data
        | std::views::transform([](const RawRecord& r) {
            CleanRecord clean;
            clean.id = r.id;
            clean.name = trim(r.name);
            clean.email = to_lower(trim(r.email));
            clean.phone = r.phone;
            clean.is_valid = !clean.name.empty() &&
                            is_valid_email(clean.email);
            return clean;
        });

    // 只保留有效记录
    auto valid_records = cleaned
        | std::views::filter([](const CleanRecord& r) {
            return r.is_valid;
        });

    std::cout << "=== 有效记录 ===" << std::endl;
    for (const auto& record : valid_records) {
        std::cout << "ID: " << record.id
                  << ", Name: " << record.name
                  << ", Email: " << record.email << std::endl;
    }

    // 统计无效记录
    auto invalid_records = cleaned
        | std::views::filter([](const CleanRecord& r) {
            return !r.is_valid;
        });

    std::cout << "\n=== 无效记录 ===" << std::endl;
    for (const auto& record : invalid_records) {
        std::cout << "ID: " << record.id
                  << " (Name: '" << record.name
                  << "', Email: '" << record.email << "')" << std::endl;
    }
}
```

### 场景三：配置文件解析

```cpp
#include <ranges>
#include <vector>
#include <string>
#include <map>
#include <iostream>
#include <sstream>

void config_parsing_example() {
    std::vector<std::string> config_lines = {
        "# Database configuration",
        "db.host = localhost",
        "db.port = 5432",
        "db.name = myapp",
        "",
        "# Server configuration",
        "server.host = 0.0.0.0",
        "server.port = 8080",
        "server.workers = 4",
        "# server.debug = true",  // 被注释的配置
    };

    // 过滤掉注释和空行，解析键值对
    auto parse_line = [](const std::string& line) -> std::pair<std::string, std::string> {
        auto pos = line.find('=');
        if (pos == std::string::npos) return {"", ""};

        auto key = line.substr(0, pos);
        auto value = line.substr(pos + 1);

        // 去除空格
        auto trim = [](std::string& s) {
            s.erase(0, s.find_first_not_of(" \t"));
            s.erase(s.find_last_not_of(" \t") + 1);
        };
        trim(key);
        trim(value);

        return {key, value};
    };

    auto config_entries = config_lines
        | std::views::filter([](const std::string& line) {
            // 跳过空行
            if (line.empty()) return false;
            // 跳过注释
            auto first_non_space = line.find_first_not_of(" \t");
            if (first_non_space == std::string::npos) return false;
            return line[first_non_space] != '#';
        })
        | std::views::transform(parse_line)
        | std::views::filter([](const auto& pair) {
            return !pair.first.empty();
        });

    std::map<std::string, std::string> config;
    for (const auto& [key, value] : config_entries) {
        config[key] = value;
    }

    std::cout << "=== 解析的配置 ===" << std::endl;
    for (const auto& [key, value] : config) {
        std::cout << key << " = " << value << std::endl;
    }

    // 获取特定前缀的配置
    std::cout << "\n=== 数据库配置 ===" << std::endl;
    for (const auto& [key, value] : config) {
        if (key.starts_with("db.")) {
            std::cout << key.substr(3) << " = " << value << std::endl;
        }
    }
}
```

### 场景四：CSV 数据处理

```cpp
#include <ranges>
#include <vector>
#include <string>
#include <iostream>
#include <sstream>
#include <numeric>

struct SalesRecord {
    std::string date;
    std::string product;
    std::string region;
    int quantity;
    double unit_price;

    double total() const { return quantity * unit_price; }
};

SalesRecord parse_csv_row(const std::string& row) {
    std::istringstream iss(row);
    SalesRecord record;
    std::string token;

    std::getline(iss, record.date, ',');
    std::getline(iss, record.product, ',');
    std::getline(iss, record.region, ',');
    std::getline(iss, token, ',');
    record.quantity = std::stoi(token);
    std::getline(iss, token, ',');
    record.unit_price = std::stod(token);

    return record;
}

void csv_processing_example() {
    std::vector<std::string> csv_data = {
        "2024-01-01,ProductA,North,10,100.0",
        "2024-01-01,ProductB,South,5,200.0",
        "2024-01-02,ProductA,South,8,100.0",
        "2024-01-02,ProductB,North,12,200.0",
        "2024-01-03,ProductA,North,15,100.0",
        "2024-01-03,ProductC,South,3,500.0",
    };

    // 解析 CSV 数据
    auto records = csv_data
        | std::views::transform(parse_csv_row);

    // 计算总销售额
    double total_sales = 0;
    for (const auto& r : records) {
        total_sales += r.total();
    }
    std::cout << "总销售额: ￥" << total_sales << std::endl;

    // 按地区统计
    std::map<std::string, double> region_sales;
    for (const auto& r : records) {
        region_sales[r.region] += r.total();
    }

    std::cout << "\n=== 地区销售额 ===" << std::endl;
    for (const auto& [region, sales] : region_sales) {
        std::cout << region << ": ￥" << sales << std::endl;
    }

    // 按产品统计数量
    std::map<std::string, int> product_quantity;
    for (const auto& r : records) {
        product_quantity[r.product] += r.quantity;
    }

    std::cout << "\n=== 产品销量 ===" << std::endl;
    for (const auto& [product, qty] : product_quantity) {
        std::cout << product << ": " << qty << " 件" << std::endl;
    }

    // 找出单价最高的记录
    auto max_price_record = std::ranges::max_element(
        csv_data | std::views::transform(parse_csv_row),
        {},
        &SalesRecord::unit_price
    );

    // 注意：上面的代码有问题，因为 transform 返回的是临时对象
    // 正确做法：先物化
    std::vector<SalesRecord> all_records;
    for (const auto& row : csv_data) {
        all_records.push_back(parse_csv_row(row));
    }

    auto max_it = std::ranges::max_element(all_records, {}, &SalesRecord::unit_price);
    std::cout << "\n单价最高的产品: " << max_it->product
              << " (￥" << max_it->unit_price << ")" << std::endl;
}
```

## 面试要点

### 常见面试题

#### Ranges 库相比传统 STL 的优势是什么？

**参考答案**：

1. **更安全**：不需要传递迭代器对，避免了迭代器不匹配的问题
2. **可组合**：通过管道操作符可以优雅地组合多个操作
3. **惰性求值**：视图不会立即计算，只在遍历时才执行
4. **投影支持**：范围算法支持投影，可以直接操作成员
5. **更好的错误信息**：使用概念约束，编译错误更清晰

#### 视图（View）和范围（Range）的区别是什么？

**参考答案**：

- **范围**是一个泛化概念，任何有 begin/end 的对象都是范围
- **视图**是一种特殊的范围，具有以下特性：
  - 非拥有（Non-owning）：不拥有数据
  - 惰性求值：只在遍历时计算
  - O(1) 复制和移动
  - 通常通过视图适配器创建

#### 解释 Ranges 的惰性求值

**参考答案**：

```cpp
auto view = data
    | std::views::filter(predicate)
    | std::views::transform(func);
// 此时没有任何计算发生

for (auto x : view) {
    // 遍历时才按需计算每个元素
}
```

惰性求值的好处：
- 节省内存（无中间容器）
- 可能节省计算（如配合 take 使用）
- 支持无限序列

#### 什么是投影（Projection）？

**参考答案**：

投影是范围算法的一个特性，允许指定操作的目标成员或转换函数：

```cpp
struct Person { std::string name; int age; };
std::vector<Person> people = {...};

// 使用投影按 age 排序
std::ranges::sort(people, {}, &Person::age);

// 使用 lambda 投影
std::ranges::sort(people, {}, [](const Person& p) {
    return p.name.length();
});
```

#### 视图的生命周期需要注意什么？

**参考答案**：

视图不拥有数据，只是底层数据的一个"窗口"。必须确保：

1. 底层数据的生命周期长于视图
2. 不要返回引用局部变量的视图
3. 修改底层容器可能使视图失效
4. 临时对象不能直接用于创建视图

```cpp
// 错误
auto bad = std::vector{1,2,3} | std::views::filter(...);

// 正确
std::vector<int> data = {1,2,3};
auto good = data | std::views::filter(...);
```

### 进阶考察点

1. **范围概念层次结构**：理解 `input_range`、`forward_range`、`bidirectional_range`、`random_access_range`、`contiguous_range` 的关系和能力

2. **视图适配器实现原理**：了解视图如何包装底层范围并实现惰性求值

3. **与 STL 算法的互操作**：知道何时使用范围版本算法，何时需要迭代器

4. **C++23 增强**：了解 `ranges::to`、`zip_view`、`chunk_view` 等新增特性

5. **性能分析**：能够分析视图管道的时间和空间复杂度

## 延伸阅读

### 官方资源

- [C++ Reference - Ranges Library](https://en.cppreference.com/w/cpp/ranges)
- [C++20 Ranges 提案 P0896](https://wg21.link/p0896)
- [C++ 标准草案中的 Ranges 章节](https://eel.is/c++draft/ranges)

### 深入学习

- [Range-v3 库](https://github.com/ericniebler/range-v3) - C++20 Ranges 的原型实现
- [Eric Niebler 的 Ranges 博客系列](https://ericniebler.com/category/ranges/)
- [CppCon 演讲：C++20 Ranges in Practice](https://www.youtube.com/watch?v=d_E-VLyUnzc)
- [Barry Revzin 的 Ranges 博客](https://brevzin.github.io/)

### 相关书籍

- 《C++20 - The Complete Guide》 by Nicolai M. Josuttis
- 《Professional C++, 5th Edition》 - C++20 Ranges 章节
- 《A Tour of C++, 3rd Edition》 by Bjarne Stroustrup

### 实践项目

- 使用 Ranges 重构现有的数据处理代码
- 实现自定义视图适配器
- 构建流式数据处理管道
- 对比 Ranges 和传统 STL 的性能差异

---

C++20 Ranges 库代表了现代 C++ 的发展方向，它让 C++ 的数据处理能力更加强大和优雅。掌握 Ranges 不仅能提高代码质量，还能为理解函数式编程思想打下基础。随着 C++23 和未来版本的发展，Ranges 库将变得更加完善和实用。
