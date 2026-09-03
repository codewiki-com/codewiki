---
title: C++ STL 算法
description: 全面学习 C++ STL 算法库，包括排序、搜索、变换和数值算法
track: cpp
section: templates-generic
difficulty: intermediate
tags:
  - C++
  - STL
  - 算法
  - 标准库
status: imported
origin: old/src/content/docs/cpp/algorithms.zh.md
divergence: 0.068
issues: []
legacy:
  category: Cpp
  subcategory: STL
  order: 19
  lastUpdated: 2026-01-07
---

C++ 标准模板库（STL）提供了一套功能强大的泛型算法，这些算法独立于容器，通过迭代器与容器交互。算法库定义在 `<algorithm>` 和 `<numeric>` 头文件中，C++20 还引入了 `<ranges>` 提供更现代的算法接口。

## 算法概述

STL 算法的核心设计理念是将算法与数据结构分离，通过迭代器作为桥梁，使算法能够作用于任何满足迭代器要求的容器。

### 算法分类

```cpp
#include <algorithm>
#include <numeric>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3, 7, 4, 6};

    // 非修改序列算法：不改变容器内容
    auto it = std::find(vec.begin(), vec.end(), 8);
    int count = std::count_if(vec.begin(), vec.end(),
                              [](int x) { return x > 5; });

    // 修改序列算法：改变容器内容
    std::sort(vec.begin(), vec.end());
    std::reverse(vec.begin(), vec.end());

    // 数值算法：执行数值计算
    int sum = std::accumulate(vec.begin(), vec.end(), 0);

    std::cout << "找到元素: " << *it << std::endl;
    std::cout << "大于5的元素个数: " << count << std::endl;
    std::cout << "元素总和: " << sum << std::endl;

    return 0;
}
```

### 算法的通用形式

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 基本形式：使用默认行为
    std::sort(vec.begin(), vec.end());

    // 带谓词形式：自定义行为
    std::sort(vec.begin(), vec.end(), std::greater<int>());

    // 带输出迭代器形式：结果写入另一个容器
    std::vector<int> result(5);
    std::transform(vec.begin(), vec.end(), result.begin(),
                   [](int x) { return x * 2; });

    // _if 后缀形式：基于条件操作
    auto it = std::find_if(vec.begin(), vec.end(),
                           [](int x) { return x > 3; });

    // _n 后缀形式：指定操作次数
    std::fill_n(vec.begin(), 3, 0);  // 填充前3个元素

    // _copy 后缀形式：复制而非就地修改
    std::vector<int> dest(5);
    std::reverse_copy(vec.begin(), vec.end(), dest.begin());

    return 0;
}
```

## 排序算法

排序是最常用的算法之一，STL 提供了多种排序算法以满足不同需求。

### std::sort - 快速排序

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <string>

struct Student {
    std::string name;
    int score;
    int age;
};

int main() {
    // 基本整数排序
    std::vector<int> nums = {5, 2, 8, 1, 9, 3, 7};

    // 升序排序（默认）
    std::sort(nums.begin(), nums.end());
    std::cout << "升序: ";
    for (int n : nums) std::cout << n << " ";
    std::cout << std::endl;  // 1 2 3 5 7 8 9

    // 降序排序
    std::sort(nums.begin(), nums.end(), std::greater<int>());
    std::cout << "降序: ";
    for (int n : nums) std::cout << n << " ";
    std::cout << std::endl;  // 9 8 7 5 3 2 1

    // 自定义比较器
    std::vector<Student> students = {
        {"Alice", 85, 20},
        {"Bob", 92, 19},
        {"Charlie", 85, 21},
        {"David", 78, 20}
    };

    // 按分数降序排序
    std::sort(students.begin(), students.end(),
              [](const Student& a, const Student& b) {
                  return a.score > b.score;
              });

    std::cout << "按分数排序: " << std::endl;
    for (const auto& s : students) {
        std::cout << s.name << ": " << s.score << std::endl;
    }

    // 多条件排序：先按分数降序，分数相同按年龄升序
    std::sort(students.begin(), students.end(),
              [](const Student& a, const Student& b) {
                  if (a.score != b.score) return a.score > b.score;
                  return a.age < b.age;
              });

    return 0;
}
```

### std::stable_sort - 稳定排序

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <string>

struct Record {
    int id;
    std::string category;
    int value;
};

int main() {
    std::vector<Record> records = {
        {1, "A", 100},
        {2, "B", 200},
        {3, "A", 150},
        {4, "B", 100},
        {5, "A", 200}
    };

    // stable_sort 保持相等元素的相对顺序
    // 按类别排序，相同类别的元素保持原有顺序
    std::stable_sort(records.begin(), records.end(),
                     [](const Record& a, const Record& b) {
                         return a.category < b.category;
                     });

    std::cout << "稳定排序后:" << std::endl;
    for (const auto& r : records) {
        std::cout << "ID: " << r.id
                  << ", 类别: " << r.category
                  << ", 值: " << r.value << std::endl;
    }

    return 0;
}
```

### std::partial_sort - 部分排序

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {9, 4, 7, 2, 5, 1, 8, 3, 6};

    // 只排序前 3 个最小的元素
    std::partial_sort(vec.begin(), vec.begin() + 3, vec.end());

    std::cout << "前3个最小元素: ";
    for (int i = 0; i < 3; ++i) {
        std::cout << vec[i] << " ";  // 1 2 3
    }
    std::cout << std::endl;

    // 获取前 N 个最大元素
    vec = {9, 4, 7, 2, 5, 1, 8, 3, 6};
    std::partial_sort(vec.begin(), vec.begin() + 3, vec.end(),
                      std::greater<int>());

    std::cout << "前3个最大元素: ";
    for (int i = 0; i < 3; ++i) {
        std::cout << vec[i] << " ";  // 9 8 7
    }
    std::cout << std::endl;

    return 0;
}
```

### std::nth_element - 第 N 个元素

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {9, 4, 7, 2, 5, 1, 8, 3, 6};

    // 找到第 5 小的元素（中位数）
    size_t n = vec.size() / 2;
    std::nth_element(vec.begin(), vec.begin() + n, vec.end());

    std::cout << "中位数: " << vec[n] << std::endl;  // 5

    // nth_element 的特点：
    // 1. 第 n 个位置的元素是正确的
    // 2. 前 n 个元素都 <= 第 n 个元素
    // 3. 后面的元素都 >= 第 n 个元素
    std::cout << "处理后的数组: ";
    for (int x : vec) {
        std::cout << x << " ";
    }
    std::cout << std::endl;

    // 找第 k 大的元素
    vec = {9, 4, 7, 2, 5, 1, 8, 3, 6};
    int k = 3;
    std::nth_element(vec.begin(), vec.begin() + k - 1, vec.end(),
                     std::greater<int>());
    std::cout << "第 " << k << " 大的元素: " << vec[k - 1] << std::endl;  // 7

    return 0;
}
```

### std::is_sorted 和相关函数

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> sorted_vec = {1, 2, 3, 4, 5};
    std::vector<int> unsorted_vec = {1, 3, 2, 4, 5};

    // 检查是否已排序
    std::cout << "sorted_vec 已排序: "
              << std::boolalpha
              << std::is_sorted(sorted_vec.begin(), sorted_vec.end())
              << std::endl;  // true

    std::cout << "unsorted_vec 已排序: "
              << std::is_sorted(unsorted_vec.begin(), unsorted_vec.end())
              << std::endl;  // false

    // 找到第一个破坏排序的位置
    auto it = std::is_sorted_until(unsorted_vec.begin(), unsorted_vec.end());
    if (it != unsorted_vec.end()) {
        std::cout << "第一个破坏排序的元素: " << *it << std::endl;  // 2
    }

    return 0;
}
```

## 搜索算法

### std::find 系列

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 3, 2, 1};

    // find - 查找值
    auto it = std::find(vec.begin(), vec.end(), 3);
    if (it != vec.end()) {
        std::cout << "找到 3，位置: "
                  << std::distance(vec.begin(), it) << std::endl;  // 位置: 2
    }

    // find_if - 查找满足条件的元素
    auto it2 = std::find_if(vec.begin(), vec.end(),
                            [](int x) { return x > 4; });
    if (it2 != vec.end()) {
        std::cout << "第一个大于 4 的元素: " << *it2 << std::endl;  // 5
    }

    // find_if_not - 查找不满足条件的元素
    auto it3 = std::find_if_not(vec.begin(), vec.end(),
                                [](int x) { return x < 3; });
    if (it3 != vec.end()) {
        std::cout << "第一个不小于 3 的元素: " << *it3 << std::endl;  // 3
    }

    return 0;
}
```

### std::binary_search - 二分查找

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    // 注意：二分查找要求序列已排序
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // binary_search - 检查元素是否存在
    bool found = std::binary_search(vec.begin(), vec.end(), 5);
    std::cout << "是否找到 5: " << std::boolalpha << found << std::endl;

    // lower_bound - 第一个 >= 目标值的位置
    auto lower = std::lower_bound(vec.begin(), vec.end(), 5);
    std::cout << "lower_bound(5): " << *lower << std::endl;  // 5

    // upper_bound - 第一个 > 目标值的位置
    auto upper = std::upper_bound(vec.begin(), vec.end(), 5);
    std::cout << "upper_bound(5): " << *upper << std::endl;  // 6

    // equal_range - 同时返回 lower_bound 和 upper_bound
    std::vector<int> dup = {1, 2, 3, 3, 3, 4, 5};
    auto range = std::equal_range(dup.begin(), dup.end(), 3);
    std::cout << "值为 3 的范围: ["
              << std::distance(dup.begin(), range.first) << ", "
              << std::distance(dup.begin(), range.second) << ")"
              << std::endl;  // [2, 5)

    // 统计等于某值的元素个数
    int count = std::distance(range.first, range.second);
    std::cout << "3 的个数: " << count << std::endl;  // 3

    return 0;
}
```

### std::search - 子序列搜索

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <string>
#include <functional>

int main() {
    std::vector<int> haystack = {1, 2, 3, 4, 5, 1, 2, 3};
    std::vector<int> needle = {1, 2, 3};

    // search - 查找子序列
    auto it = std::search(haystack.begin(), haystack.end(),
                          needle.begin(), needle.end());
    if (it != haystack.end()) {
        std::cout << "子序列首次出现位置: "
                  << std::distance(haystack.begin(), it) << std::endl;  // 0
    }

    // find_end - 查找子序列最后出现的位置
    auto it2 = std::find_end(haystack.begin(), haystack.end(),
                             needle.begin(), needle.end());
    if (it2 != haystack.end()) {
        std::cout << "子序列最后出现位置: "
                  << std::distance(haystack.begin(), it2) << std::endl;  // 5
    }

    // search_n - 查找连续 n 个相同元素
    std::vector<int> vec = {1, 2, 2, 2, 3, 4, 4, 5};
    auto it3 = std::search_n(vec.begin(), vec.end(), 3, 2);
    if (it3 != vec.end()) {
        std::cout << "3 个连续的 2 出现在位置: "
                  << std::distance(vec.begin(), it3) << std::endl;  // 1
    }

    // C++17 Boyer-Moore 搜索器
    std::string text = "The quick brown fox jumps over the lazy dog";
    std::string pattern = "fox";

    auto searcher = std::boyer_moore_searcher(pattern.begin(), pattern.end());
    auto result = std::search(text.begin(), text.end(), searcher);
    if (result != text.end()) {
        std::cout << "找到 'fox' 位置: "
                  << std::distance(text.begin(), result) << std::endl;
    }

    return 0;
}
```

### std::count 系列

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <string>

int main() {
    std::vector<int> vec = {1, 2, 3, 2, 1, 2, 3, 4, 2};

    // count - 计数特定值
    int count = std::count(vec.begin(), vec.end(), 2);
    std::cout << "2 的个数: " << count << std::endl;  // 4

    // count_if - 计数满足条件的元素
    int even_count = std::count_if(vec.begin(), vec.end(),
                                   [](int x) { return x % 2 == 0; });
    std::cout << "偶数个数: " << even_count << std::endl;  // 5

    // 统计字符串中字符出现次数
    std::string str = "hello world";
    int l_count = std::count(str.begin(), str.end(), 'l');
    std::cout << "'l' 的个数: " << l_count << std::endl;  // 3

    return 0;
}
```

### std::all_of, std::any_of, std::none_of

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {2, 4, 6, 8, 10};

    // all_of - 所有元素都满足条件
    bool all_even = std::all_of(vec.begin(), vec.end(),
                                [](int x) { return x % 2 == 0; });
    std::cout << "全部是偶数: " << std::boolalpha << all_even << std::endl;  // true

    // any_of - 至少有一个元素满足条件
    bool has_ten = std::any_of(vec.begin(), vec.end(),
                               [](int x) { return x == 10; });
    std::cout << "包含 10: " << has_ten << std::endl;  // true

    // none_of - 没有元素满足条件
    bool no_odd = std::none_of(vec.begin(), vec.end(),
                               [](int x) { return x % 2 != 0; });
    std::cout << "没有奇数: " << no_odd << std::endl;  // true

    // 空范围的特殊情况
    std::vector<int> empty;
    std::cout << "空容器 all_of: " << std::all_of(empty.begin(), empty.end(),
                                                   [](int) { return false; }) << std::endl;  // true
    std::cout << "空容器 any_of: " << std::any_of(empty.begin(), empty.end(),
                                                   [](int) { return true; }) << std::endl;   // false

    return 0;
}
```

## 变换算法

### std::transform - 元素变换

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <string>
#include <cctype>

int main() {
    std::vector<int> src = {1, 2, 3, 4, 5};
    std::vector<int> dest(src.size());

    // 一元变换：对每个元素应用函数
    std::transform(src.begin(), src.end(), dest.begin(),
                   [](int x) { return x * x; });

    std::cout << "平方: ";
    for (int x : dest) std::cout << x << " ";  // 1 4 9 16 25
    std::cout << std::endl;

    // 二元变换：对两个序列的元素进行操作
    std::vector<int> vec1 = {1, 2, 3, 4, 5};
    std::vector<int> vec2 = {10, 20, 30, 40, 50};
    std::vector<int> result(5);

    std::transform(vec1.begin(), vec1.end(), vec2.begin(),
                   result.begin(),
                   [](int a, int b) { return a + b; });

    std::cout << "相加: ";
    for (int x : result) std::cout << x << " ";  // 11 22 33 44 55
    std::cout << std::endl;

    // 就地变换
    std::transform(src.begin(), src.end(), src.begin(),
                   [](int x) { return x * 2; });

    // 字符串大小写转换
    std::string str = "Hello World";
    std::transform(str.begin(), str.end(), str.begin(),
                   [](unsigned char c) { return std::toupper(c); });
    std::cout << "大写: " << str << std::endl;  // HELLO WORLD

    std::transform(str.begin(), str.end(), str.begin(),
                   [](unsigned char c) { return std::tolower(c); });
    std::cout << "小写: " << str << std::endl;  // hello world

    return 0;
}
```

### std::copy 系列

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> src = {1, 2, 3, 4, 5};
    std::vector<int> dest(5);

    // copy - 复制元素
    std::copy(src.begin(), src.end(), dest.begin());

    // copy_n - 复制 n 个元素
    std::vector<int> dest2(3);
    std::copy_n(src.begin(), 3, dest2.begin());

    // copy_if - 条件复制
    std::vector<int> evens;
    std::copy_if(src.begin(), src.end(), std::back_inserter(evens),
                 [](int x) { return x % 2 == 0; });

    std::cout << "偶数: ";
    for (int x : evens) std::cout << x << " ";  // 2 4
    std::cout << std::endl;

    // copy_backward - 从后向前复制
    std::vector<int> vec = {1, 2, 3, 0, 0, 0};
    std::copy_backward(vec.begin(), vec.begin() + 3, vec.end());
    // vec: 1 2 3 1 2 3

    // reverse_copy - 反向复制
    std::vector<int> reversed(src.size());
    std::reverse_copy(src.begin(), src.end(), reversed.begin());

    std::cout << "反向: ";
    for (int x : reversed) std::cout << x << " ";  // 5 4 3 2 1
    std::cout << std::endl;

    return 0;
}
```

### std::replace 系列

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 2, 4, 2, 5};

    // replace - 替换特定值
    std::replace(vec.begin(), vec.end(), 2, 99);
    std::cout << "替换后: ";
    for (int x : vec) std::cout << x << " ";  // 1 99 3 99 4 99 5
    std::cout << std::endl;

    // replace_if - 条件替换
    vec = {1, 2, 3, 4, 5};
    std::replace_if(vec.begin(), vec.end(),
                    [](int x) { return x % 2 == 0; }, 0);
    std::cout << "偶数替换为0: ";
    for (int x : vec) std::cout << x << " ";  // 1 0 3 0 5
    std::cout << std::endl;

    // replace_copy - 复制并替换
    vec = {1, 2, 3, 2, 4};
    std::vector<int> dest(vec.size());
    std::replace_copy(vec.begin(), vec.end(), dest.begin(), 2, 99);
    // vec 不变，dest 中 2 被替换为 99

    return 0;
}
```

### std::remove 和 std::unique

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    // remove - 移除特定值（逻辑删除）
    std::vector<int> vec = {1, 2, 3, 2, 4, 2, 5};

    // remove 不会改变容器大小，只是将不删除的元素移到前面
    auto new_end = std::remove(vec.begin(), vec.end(), 2);

    std::cout << "remove 后（物理删除前）: ";
    for (auto it = vec.begin(); it != new_end; ++it) {
        std::cout << *it << " ";  // 1 3 4 5
    }
    std::cout << std::endl;

    // erase-remove 惯用法：真正删除元素
    vec.erase(new_end, vec.end());

    std::cout << "erase 后: ";
    for (int x : vec) std::cout << x << " ";  // 1 3 4 5
    std::cout << std::endl;

    // C++20 简化写法
    // std::erase(vec, 2);  // 直接删除所有 2

    // remove_if - 条件移除
    vec = {1, 2, 3, 4, 5, 6};
    vec.erase(std::remove_if(vec.begin(), vec.end(),
                             [](int x) { return x % 2 == 0; }),
              vec.end());

    std::cout << "移除偶数: ";
    for (int x : vec) std::cout << x << " ";  // 1 3 5
    std::cout << std::endl;

    // unique - 移除连续重复元素
    std::vector<int> dup = {1, 1, 2, 2, 2, 3, 3, 4, 5, 5};
    auto unique_end = std::unique(dup.begin(), dup.end());
    dup.erase(unique_end, dup.end());

    std::cout << "去重后: ";
    for (int x : dup) std::cout << x << " ";  // 1 2 3 4 5
    std::cout << std::endl;

    // unique 只移除连续重复，要完全去重需先排序
    std::vector<int> unsorted = {3, 1, 2, 1, 3, 2, 1};
    std::sort(unsorted.begin(), unsorted.end());
    unsorted.erase(std::unique(unsorted.begin(), unsorted.end()),
                   unsorted.end());

    std::cout << "排序后去重: ";
    for (int x : unsorted) std::cout << x << " ";  // 1 2 3
    std::cout << std::endl;

    return 0;
}
```

### std::fill 和 std::generate

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <random>

int main() {
    std::vector<int> vec(10);

    // fill - 填充相同值
    std::fill(vec.begin(), vec.end(), 42);
    std::cout << "fill: ";
    for (int x : vec) std::cout << x << " ";  // 42 42 42...
    std::cout << std::endl;

    // fill_n - 填充 n 个元素
    std::fill_n(vec.begin(), 5, 0);  // 前5个元素填充为0

    // generate - 用生成器填充
    int n = 0;
    std::generate(vec.begin(), vec.end(), [&n]() { return n++; });
    std::cout << "generate: ";
    for (int x : vec) std::cout << x << " ";  // 0 1 2 3 4 5 6 7 8 9
    std::cout << std::endl;

    // generate_n - 生成 n 个元素
    std::vector<int> vec2(5);
    std::generate_n(vec2.begin(), 5, [&n]() { return n++; });

    // 生成随机数
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(1, 100);

    std::generate(vec.begin(), vec.end(), [&]() { return dis(gen); });
    std::cout << "随机数: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;

    return 0;
}
```

### std::reverse 和 std::rotate

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    // reverse - 反转序列
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::reverse(vec.begin(), vec.end());
    std::cout << "reverse: ";
    for (int x : vec) std::cout << x << " ";  // 5 4 3 2 1
    std::cout << std::endl;

    // rotate - 旋转序列
    vec = {1, 2, 3, 4, 5};
    // 将 vec[2] 移到开头，即左旋转 2 个位置
    std::rotate(vec.begin(), vec.begin() + 2, vec.end());
    std::cout << "左旋转2: ";
    for (int x : vec) std::cout << x << " ";  // 3 4 5 1 2
    std::cout << std::endl;

    // 右旋转 2 个位置
    vec = {1, 2, 3, 4, 5};
    std::rotate(vec.begin(), vec.end() - 2, vec.end());
    std::cout << "右旋转2: ";
    for (int x : vec) std::cout << x << " ";  // 4 5 1 2 3
    std::cout << std::endl;

    // 使用 rotate 实现元素移动
    vec = {1, 2, 3, 4, 5};
    // 将元素 3（位置2）移到开头
    std::rotate(vec.begin(), vec.begin() + 2, vec.begin() + 3);
    std::cout << "移动元素: ";
    for (int x : vec) std::cout << x << " ";  // 3 1 2 4 5
    std::cout << std::endl;

    return 0;
}
```

## 数值算法

数值算法定义在 `<numeric>` 头文件中。

### std::accumulate - 累积

```cpp
#include <numeric>
#include <vector>
#include <iostream>
#include <string>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 求和
    int sum = std::accumulate(vec.begin(), vec.end(), 0);
    std::cout << "求和: " << sum << std::endl;  // 15

    // 求积
    int product = std::accumulate(vec.begin(), vec.end(), 1,
                                   std::multiplies<int>());
    std::cout << "求积: " << product << std::endl;  // 120

    // 自定义累积操作
    int sum_of_squares = std::accumulate(vec.begin(), vec.end(), 0,
                                          [](int acc, int x) {
                                              return acc + x * x;
                                          });
    std::cout << "平方和: " << sum_of_squares << std::endl;  // 55

    // 字符串连接
    std::vector<std::string> words = {"Hello", " ", "World", "!"};
    std::string sentence = std::accumulate(words.begin(), words.end(),
                                            std::string(""));
    std::cout << "连接: " << sentence << std::endl;  // Hello World!

    // 使用初始值
    sum = std::accumulate(vec.begin(), vec.end(), 100);
    std::cout << "带初始值: " << sum << std::endl;  // 115

    return 0;
}
```

### std::reduce (C++17)

```cpp
#include <numeric>
#include <vector>
#include <iostream>
#include <execution>  // 并行执行策略

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // reduce - 类似 accumulate，但支持并行
    int sum = std::reduce(vec.begin(), vec.end());
    std::cout << "reduce 求和: " << sum << std::endl;  // 15

    // 带初始值的 reduce
    sum = std::reduce(vec.begin(), vec.end(), 100);
    std::cout << "带初始值: " << sum << std::endl;  // 115

    // 自定义操作
    int product = std::reduce(vec.begin(), vec.end(), 1,
                               std::multiplies<int>());
    std::cout << "reduce 求积: " << product << std::endl;  // 120

    // 并行 reduce（需要支持的编译器和库）
    // 注意：操作必须是可交换和可结合的
    /*
    sum = std::reduce(std::execution::par, vec.begin(), vec.end());
    */

    return 0;
}
```

### std::inner_product - 内积

```cpp
#include <numeric>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec1 = {1, 2, 3};
    std::vector<int> vec2 = {4, 5, 6};

    // 内积：1*4 + 2*5 + 3*6 = 32
    int inner = std::inner_product(vec1.begin(), vec1.end(),
                                    vec2.begin(), 0);
    std::cout << "内积: " << inner << std::endl;  // 32

    // 自定义操作
    // 计算 (1+4) * (2+5) * (3+6) = 5 * 7 * 9 = 315
    int result = std::inner_product(vec1.begin(), vec1.end(),
                                     vec2.begin(), 1,
                                     std::multiplies<int>(),  // 累积操作
                                     std::plus<int>());       // 元素操作
    std::cout << "自定义内积: " << result << std::endl;

    // 向量点积的应用
    std::vector<double> a = {1.0, 2.0, 3.0};
    std::vector<double> b = {4.0, 5.0, 6.0};
    double dot_product = std::inner_product(a.begin(), a.end(),
                                             b.begin(), 0.0);
    std::cout << "点积: " << dot_product << std::endl;

    return 0;
}
```

### std::partial_sum - 部分和

```cpp
#include <numeric>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::vector<int> result(vec.size());

    // 部分和：[1, 1+2, 1+2+3, 1+2+3+4, 1+2+3+4+5]
    std::partial_sum(vec.begin(), vec.end(), result.begin());

    std::cout << "部分和: ";
    for (int x : result) std::cout << x << " ";  // 1 3 6 10 15
    std::cout << std::endl;

    // 自定义操作：部分积
    std::partial_sum(vec.begin(), vec.end(), result.begin(),
                     std::multiplies<int>());

    std::cout << "部分积: ";
    for (int x : result) std::cout << x << " ";  // 1 2 6 24 120
    std::cout << std::endl;

    // 前缀和的应用：区间求和
    // sum(i, j) = partial_sum[j] - partial_sum[i-1]
    std::vector<int> prefix = {0};  // 前置一个0便于计算
    std::partial_sum(vec.begin(), vec.end(), std::back_inserter(prefix));

    // 计算区间 [1, 3] 的和（0-indexed）
    int range_sum = prefix[4] - prefix[1];  // = 2+3+4 = 9
    std::cout << "区间 [1,3] 的和: " << range_sum << std::endl;

    return 0;
}
```

### std::adjacent_difference - 相邻差

```cpp
#include <numeric>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 3, 6, 10, 15};
    std::vector<int> diff(vec.size());

    // 相邻差：[a[0], a[1]-a[0], a[2]-a[1], ...]
    std::adjacent_difference(vec.begin(), vec.end(), diff.begin());

    std::cout << "相邻差: ";
    for (int x : diff) std::cout << x << " ";  // 1 2 3 4 5
    std::cout << std::endl;

    // 自定义操作：相邻比值
    std::vector<double> values = {1.0, 2.0, 4.0, 8.0, 16.0};
    std::vector<double> ratios(values.size());

    std::adjacent_difference(values.begin(), values.end(), ratios.begin(),
                              std::divides<double>());

    std::cout << "相邻比值: ";
    for (double x : ratios) std::cout << x << " ";  // 1 2 2 2 2
    std::cout << std::endl;

    // adjacent_difference 和 partial_sum 互为逆操作
    std::vector<int> original = {1, 2, 3, 4, 5};
    std::vector<int> temp(5);
    std::vector<int> restored(5);

    std::partial_sum(original.begin(), original.end(), temp.begin());
    std::adjacent_difference(temp.begin(), temp.end(), restored.begin());
    // restored == original

    return 0;
}
```

### std::iota - 递增序列

```cpp
#include <numeric>
#include <vector>
#include <iostream>
#include <algorithm>

int main() {
    std::vector<int> vec(10);

    // iota - 填充递增序列
    std::iota(vec.begin(), vec.end(), 1);

    std::cout << "iota: ";
    for (int x : vec) std::cout << x << " ";  // 1 2 3 4 5 6 7 8 9 10
    std::cout << std::endl;

    // 生成索引数组
    std::vector<int> indices(vec.size());
    std::iota(indices.begin(), indices.end(), 0);

    // 使用 iota 创建排列
    std::vector<int> data = {30, 10, 50, 20, 40};
    std::vector<int> order(data.size());
    std::iota(order.begin(), order.end(), 0);

    // 按 data 的值对索引排序
    std::sort(order.begin(), order.end(),
              [&data](int a, int b) { return data[a] < data[b]; });

    std::cout << "排序后的索引: ";
    for (int i : order) std::cout << i << " ";  // 1 3 0 4 2
    std::cout << std::endl;

    std::cout << "按索引访问: ";
    for (int i : order) std::cout << data[i] << " ";  // 10 20 30 40 50
    std::cout << std::endl;

    return 0;
}
```

### std::gcd 和 std::lcm (C++17)

```cpp
#include <numeric>
#include <iostream>
#include <vector>

int main() {
    // gcd - 最大公约数
    std::cout << "gcd(12, 18) = " << std::gcd(12, 18) << std::endl;  // 6
    std::cout << "gcd(17, 31) = " << std::gcd(17, 31) << std::endl;  // 1

    // lcm - 最小公倍数
    std::cout << "lcm(12, 18) = " << std::lcm(12, 18) << std::endl;  // 36
    std::cout << "lcm(4, 6) = " << std::lcm(4, 6) << std::endl;      // 12

    // 多个数的 gcd
    std::vector<int> numbers = {24, 36, 48, 60};
    int result = numbers[0];
    for (size_t i = 1; i < numbers.size(); ++i) {
        result = std::gcd(result, numbers[i]);
    }
    std::cout << "多个数的 gcd: " << result << std::endl;  // 12

    // 使用 accumulate 计算多个数的 gcd
    result = std::accumulate(numbers.begin(), numbers.end(), numbers[0],
                              [](int a, int b) { return std::gcd(a, b); });

    return 0;
}
```

## for_each 算法

### std::for_each - 对每个元素执行操作

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 基本用法
    std::for_each(vec.begin(), vec.end(),
                  [](int x) { std::cout << x << " "; });
    std::cout << std::endl;

    // 修改元素
    std::for_each(vec.begin(), vec.end(),
                  [](int& x) { x *= 2; });  // 注意使用引用

    std::cout << "翻倍后: ";
    for (int x : vec) std::cout << x << " ";  // 2 4 6 8 10
    std::cout << std::endl;

    // 使用有状态的函数对象
    class Counter {
    public:
        int count = 0;
        void operator()(int) { ++count; }
    };

    Counter counter;
    counter = std::for_each(vec.begin(), vec.end(), counter);
    std::cout << "元素个数: " << counter.count << std::endl;  // 5

    // 捕获外部变量
    int sum = 0;
    std::for_each(vec.begin(), vec.end(),
                  [&sum](int x) { sum += x; });
    std::cout << "总和: " << sum << std::endl;  // 30

    return 0;
}
```

### std::for_each_n (C++17)

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // 只对前 n 个元素执行操作
    std::for_each_n(vec.begin(), 5,
                    [](int& x) { x *= 2; });

    std::cout << "前5个元素翻倍: ";
    for (int x : vec) std::cout << x << " ";  // 2 4 6 8 10 6 7 8 9 10
    std::cout << std::endl;

    // 返回值是指向第 n+1 个元素的迭代器
    auto it = std::for_each_n(vec.begin(), 3,
                              [](int x) { std::cout << x << " "; });
    std::cout << std::endl;
    std::cout << "后续元素从: " << *it << " 开始" << std::endl;

    return 0;
}
```

## 分区算法

### std::partition - 分区

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // partition - 将满足条件的元素移到前面
    auto partition_point = std::partition(vec.begin(), vec.end(),
                                          [](int x) { return x % 2 == 0; });

    std::cout << "偶数在前: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;

    std::cout << "分区点位置: "
              << std::distance(vec.begin(), partition_point) << std::endl;

    // 偶数部分
    std::cout << "偶数: ";
    for (auto it = vec.begin(); it != partition_point; ++it) {
        std::cout << *it << " ";
    }
    std::cout << std::endl;

    // 奇数部分
    std::cout << "奇数: ";
    for (auto it = partition_point; it != vec.end(); ++it) {
        std::cout << *it << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### std::stable_partition - 稳定分区

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // stable_partition - 保持相对顺序的分区
    std::stable_partition(vec.begin(), vec.end(),
                          [](int x) { return x % 2 == 0; });

    std::cout << "稳定分区: ";
    for (int x : vec) std::cout << x << " ";
    // 偶数保持原有顺序：2 4 6 8 10 1 3 5 7 9
    std::cout << std::endl;

    return 0;
}
```

### std::partition_copy - 分区复制

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    std::vector<int> evens;
    std::vector<int> odds;

    // partition_copy - 将元素复制到两个不同的目标
    std::partition_copy(vec.begin(), vec.end(),
                        std::back_inserter(evens),
                        std::back_inserter(odds),
                        [](int x) { return x % 2 == 0; });

    std::cout << "偶数: ";
    for (int x : evens) std::cout << x << " ";  // 2 4 6 8 10
    std::cout << std::endl;

    std::cout << "奇数: ";
    for (int x : odds) std::cout << x << " ";   // 1 3 5 7 9
    std::cout << std::endl;

    return 0;
}
```

### std::partition_point - 分区点

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    // 已按奇偶分区的序列
    std::vector<int> vec = {2, 4, 6, 8, 1, 3, 5, 7, 9};

    // partition_point - 找到分区点（要求已分区）
    auto pp = std::partition_point(vec.begin(), vec.end(),
                                   [](int x) { return x % 2 == 0; });

    std::cout << "分区点位置: " << std::distance(vec.begin(), pp) << std::endl;
    std::cout << "分区点元素: " << *pp << std::endl;  // 1

    // is_partitioned - 检查是否已分区
    bool partitioned = std::is_partitioned(vec.begin(), vec.end(),
                                           [](int x) { return x % 2 == 0; });
    std::cout << "是否已分区: " << std::boolalpha << partitioned << std::endl;

    return 0;
}
```

## 合并算法

### std::merge - 合并有序序列

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> vec1 = {1, 3, 5, 7, 9};
    std::vector<int> vec2 = {2, 4, 6, 8, 10};
    std::vector<int> result;

    // merge - 合并两个有序序列
    std::merge(vec1.begin(), vec1.end(),
               vec2.begin(), vec2.end(),
               std::back_inserter(result));

    std::cout << "合并结果: ";
    for (int x : result) std::cout << x << " ";
    // 1 2 3 4 5 6 7 8 9 10
    std::cout << std::endl;

    // 带自定义比较器
    std::vector<int> desc1 = {9, 7, 5, 3, 1};
    std::vector<int> desc2 = {10, 8, 6, 4, 2};
    std::vector<int> desc_result;

    std::merge(desc1.begin(), desc1.end(),
               desc2.begin(), desc2.end(),
               std::back_inserter(desc_result),
               std::greater<int>());

    std::cout << "降序合并: ";
    for (int x : desc_result) std::cout << x << " ";
    // 10 9 8 7 6 5 4 3 2 1
    std::cout << std::endl;

    return 0;
}
```

### std::inplace_merge - 就地合并

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    // 一个已分成两个有序部分的序列
    std::vector<int> vec = {1, 3, 5, 7, 9, 2, 4, 6, 8, 10};

    // inplace_merge - 就地合并
    std::inplace_merge(vec.begin(), vec.begin() + 5, vec.end());

    std::cout << "就地合并: ";
    for (int x : vec) std::cout << x << " ";
    // 1 2 3 4 5 6 7 8 9 10
    std::cout << std::endl;

    // 实际应用：归并排序中使用
    auto merge_sort = [](auto& arr, auto begin, auto end, auto& merge_sort_ref) -> void {
        if (end - begin <= 1) return;

        auto mid = begin + (end - begin) / 2;
        merge_sort_ref(arr, begin, mid, merge_sort_ref);
        merge_sort_ref(arr, mid, end, merge_sort_ref);
        std::inplace_merge(begin, mid, end);
    };

    std::vector<int> data = {5, 2, 8, 1, 9, 3, 7, 4, 6};
    merge_sort(data, data.begin(), data.end(), merge_sort);

    std::cout << "归并排序: ";
    for (int x : data) std::cout << x << " ";
    std::cout << std::endl;

    return 0;
}
```

## 集合操作

集合操作要求输入序列已排序。

### std::set_union - 并集

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> set1 = {1, 2, 3, 4, 5};
    std::vector<int> set2 = {3, 4, 5, 6, 7};
    std::vector<int> result;

    // set_union - 计算并集
    std::set_union(set1.begin(), set1.end(),
                   set2.begin(), set2.end(),
                   std::back_inserter(result));

    std::cout << "并集: ";
    for (int x : result) std::cout << x << " ";  // 1 2 3 4 5 6 7
    std::cout << std::endl;

    return 0;
}
```

### std::set_intersection - 交集

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> set1 = {1, 2, 3, 4, 5};
    std::vector<int> set2 = {3, 4, 5, 6, 7};
    std::vector<int> result;

    // set_intersection - 计算交集
    std::set_intersection(set1.begin(), set1.end(),
                          set2.begin(), set2.end(),
                          std::back_inserter(result));

    std::cout << "交集: ";
    for (int x : result) std::cout << x << " ";  // 3 4 5
    std::cout << std::endl;

    return 0;
}
```

### std::set_difference - 差集

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> set1 = {1, 2, 3, 4, 5};
    std::vector<int> set2 = {3, 4, 5, 6, 7};
    std::vector<int> result;

    // set_difference - 计算差集（在 set1 中但不在 set2 中）
    std::set_difference(set1.begin(), set1.end(),
                        set2.begin(), set2.end(),
                        std::back_inserter(result));

    std::cout << "差集 (set1 - set2): ";
    for (int x : result) std::cout << x << " ";  // 1 2
    std::cout << std::endl;

    // 反向差集
    result.clear();
    std::set_difference(set2.begin(), set2.end(),
                        set1.begin(), set1.end(),
                        std::back_inserter(result));

    std::cout << "差集 (set2 - set1): ";
    for (int x : result) std::cout << x << " ";  // 6 7
    std::cout << std::endl;

    return 0;
}
```

### std::set_symmetric_difference - 对称差集

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> set1 = {1, 2, 3, 4, 5};
    std::vector<int> set2 = {3, 4, 5, 6, 7};
    std::vector<int> result;

    // set_symmetric_difference - 对称差集（异或）
    std::set_symmetric_difference(set1.begin(), set1.end(),
                                   set2.begin(), set2.end(),
                                   std::back_inserter(result));

    std::cout << "对称差集: ";
    for (int x : result) std::cout << x << " ";  // 1 2 6 7
    std::cout << std::endl;

    return 0;
}
```

### std::includes - 包含检查

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> set1 = {1, 2, 3, 4, 5, 6, 7};
    std::vector<int> set2 = {2, 4, 6};
    std::vector<int> set3 = {2, 4, 8};

    // includes - 检查 set1 是否包含 set2 的所有元素
    bool contains = std::includes(set1.begin(), set1.end(),
                                  set2.begin(), set2.end());
    std::cout << "set1 包含 set2: " << std::boolalpha << contains << std::endl;  // true

    contains = std::includes(set1.begin(), set1.end(),
                             set3.begin(), set3.end());
    std::cout << "set1 包含 set3: " << contains << std::endl;  // false

    return 0;
}
```

### 综合集合操作示例

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <iterator>
#include <string>
#include <set>

class SetOperations {
public:
    template<typename T>
    static void printSet(const std::string& name, const std::vector<T>& s) {
        std::cout << name << ": { ";
        for (const auto& x : s) std::cout << x << " ";
        std::cout << "}" << std::endl;
    }

    template<typename T>
    static std::vector<T> setUnion(const std::vector<T>& a, const std::vector<T>& b) {
        std::vector<T> result;
        std::set_union(a.begin(), a.end(), b.begin(), b.end(),
                       std::back_inserter(result));
        return result;
    }

    template<typename T>
    static std::vector<T> setIntersection(const std::vector<T>& a, const std::vector<T>& b) {
        std::vector<T> result;
        std::set_intersection(a.begin(), a.end(), b.begin(), b.end(),
                              std::back_inserter(result));
        return result;
    }

    template<typename T>
    static std::vector<T> setDifference(const std::vector<T>& a, const std::vector<T>& b) {
        std::vector<T> result;
        std::set_difference(a.begin(), a.end(), b.begin(), b.end(),
                            std::back_inserter(result));
        return result;
    }
};

int main() {
    std::vector<int> A = {1, 2, 3, 4, 5};
    std::vector<int> B = {3, 4, 5, 6, 7};

    SetOperations::printSet("A", A);
    SetOperations::printSet("B", B);

    auto unionAB = SetOperations::setUnion(A, B);
    SetOperations::printSet("A ∪ B", unionAB);

    auto intersectionAB = SetOperations::setIntersection(A, B);
    SetOperations::printSet("A ∩ B", intersectionAB);

    auto differenceAB = SetOperations::setDifference(A, B);
    SetOperations::printSet("A - B", differenceAB);

    return 0;
}
```

## C++20 Ranges

C++20 引入了 Ranges 库，提供了更现代、更简洁的算法接口。

### 基本 Ranges 用法

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <algorithm>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3, 7, 4, 6};

    // 使用 ranges::sort 代替 std::sort
    std::ranges::sort(vec);

    std::cout << "排序: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;

    // 直接传递容器，无需指定迭代器
    vec = {5, 2, 8, 1, 9, 3, 7, 4, 6};
    std::ranges::sort(vec, std::greater{});  // 降序

    // ranges::find
    auto it = std::ranges::find(vec, 5);
    if (it != vec.end()) {
        std::cout << "找到 5" << std::endl;
    }

    // ranges::count_if
    int count = std::ranges::count_if(vec, [](int x) { return x > 5; });
    std::cout << "大于5的个数: " << count << std::endl;

    return 0;
}
```

### 视图（Views）

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // filter - 过滤
    auto evens = vec | std::views::filter([](int x) { return x % 2 == 0; });

    std::cout << "偶数: ";
    for (int x : evens) std::cout << x << " ";  // 2 4 6 8 10
    std::cout << std::endl;

    // transform - 变换
    auto squared = vec | std::views::transform([](int x) { return x * x; });

    std::cout << "平方: ";
    for (int x : squared) std::cout << x << " ";
    std::cout << std::endl;

    // 链式操作
    auto result = vec
        | std::views::filter([](int x) { return x % 2 == 0; })
        | std::views::transform([](int x) { return x * x; });

    std::cout << "偶数的平方: ";
    for (int x : result) std::cout << x << " ";  // 4 16 36 64 100
    std::cout << std::endl;

    // take - 取前 n 个
    auto first_five = vec | std::views::take(5);
    std::cout << "前5个: ";
    for (int x : first_five) std::cout << x << " ";
    std::cout << std::endl;

    // drop - 跳过前 n 个
    auto after_five = vec | std::views::drop(5);
    std::cout << "跳过前5个: ";
    for (int x : after_five) std::cout << x << " ";
    std::cout << std::endl;

    // reverse - 反转
    auto reversed = vec | std::views::reverse;
    std::cout << "反转: ";
    for (int x : reversed) std::cout << x << " ";
    std::cout << std::endl;

    return 0;
}
```

### 视图工厂

```cpp
#include <ranges>
#include <iostream>
#include <vector>

int main() {
    // iota - 生成递增序列
    for (int i : std::views::iota(1, 11)) {
        std::cout << i << " ";  // 1 2 3 4 5 6 7 8 9 10
    }
    std::cout << std::endl;

    // 无限序列 + take
    for (int i : std::views::iota(1) | std::views::take(10)) {
        std::cout << i << " ";
    }
    std::cout << std::endl;

    // repeat (C++23)
    // for (int i : std::views::repeat(42) | std::views::take(5)) {
    //     std::cout << i << " ";  // 42 42 42 42 42
    // }

    // empty
    auto empty = std::views::empty<int>;
    std::cout << "empty 大小: " << std::ranges::distance(empty) << std::endl;

    // single
    auto single = std::views::single(42);
    for (int x : single) std::cout << x << " ";  // 42
    std::cout << std::endl;

    return 0;
}
```

### Ranges 算法的投影

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>
#include <algorithm>

struct Person {
    std::string name;
    int age;
};

int main() {
    std::vector<Person> people = {
        {"Alice", 30},
        {"Bob", 25},
        {"Charlie", 35},
        {"David", 28}
    };

    // 使用投影按年龄排序
    std::ranges::sort(people, {}, &Person::age);

    std::cout << "按年龄排序:" << std::endl;
    for (const auto& p : people) {
        std::cout << p.name << ": " << p.age << std::endl;
    }

    // 使用投影按姓名排序
    std::ranges::sort(people, {}, &Person::name);

    std::cout << "\n按姓名排序:" << std::endl;
    for (const auto& p : people) {
        std::cout << p.name << ": " << p.age << std::endl;
    }

    // 使用投影查找
    auto it = std::ranges::find(people, "Charlie", &Person::name);
    if (it != people.end()) {
        std::cout << "\n找到 Charlie，年龄: " << it->age << std::endl;
    }

    // 使用投影统计
    int count = std::ranges::count_if(people, [](int age) { return age >= 30; },
                                       &Person::age);
    std::cout << "30岁及以上: " << count << " 人" << std::endl;

    return 0;
}
```

### 综合 Ranges 示例

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>
#include <algorithm>
#include <numeric>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // 复杂的链式操作
    auto pipeline = numbers
        | std::views::filter([](int x) { return x % 2 == 0; })  // 偶数
        | std::views::transform([](int x) { return x * x; })     // 平方
        | std::views::take(3);                                   // 前3个

    std::cout << "偶数平方的前3个: ";
    for (int x : pipeline) std::cout << x << " ";  // 4 16 36
    std::cout << std::endl;

    // 配合算法使用
    auto result = numbers
        | std::views::filter([](int x) { return x > 5; });

    auto [min, max] = std::ranges::minmax(result);
    std::cout << "大于5的最小值: " << min << ", 最大值: " << max << std::endl;

    // 转换为 vector
    auto filtered = numbers
        | std::views::filter([](int x) { return x % 3 == 0; });

    std::vector<int> divisible_by_3(filtered.begin(), filtered.end());
    // 或使用 C++23 的 std::ranges::to
    // auto divisible_by_3 = filtered | std::ranges::to<std::vector>();

    std::cout << "能被3整除的: ";
    for (int x : divisible_by_3) std::cout << x << " ";  // 3 6 9
    std::cout << std::endl;

    // keys 和 values (用于关联容器)
    std::vector<std::pair<std::string, int>> scores = {
        {"Alice", 95}, {"Bob", 87}, {"Charlie", 92}
    };

    std::cout << "所有名字: ";
    for (const auto& name : scores | std::views::keys) {
        std::cout << name << " ";
    }
    std::cout << std::endl;

    std::cout << "所有分数: ";
    for (int score : scores | std::views::values) {
        std::cout << score << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

## 算法复杂度

了解算法的时间复杂度对于选择合适的算法至关重要。

### 常见算法复杂度表

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

/*
算法复杂度参考表：

排序算法：
- std::sort:           O(N log N) 平均，O(N^2) 最坏
- std::stable_sort:    O(N log N) 需要额外空间，O(N log^2 N) 就地
- std::partial_sort:   O(N log K)，K 是要排序的元素数
- std::nth_element:    O(N) 平均
- std::is_sorted:      O(N)

搜索算法：
- std::find:           O(N)
- std::binary_search:  O(log N)，需要已排序
- std::lower_bound:    O(log N)，需要已排序
- std::upper_bound:    O(log N)，需要已排序

集合操作（需要已排序）：
- std::set_union:          O(N + M)
- std::set_intersection:   O(N + M)
- std::set_difference:     O(N + M)
- std::merge:              O(N + M)

其他：
- std::count:           O(N)
- std::accumulate:      O(N)
- std::transform:       O(N)
- std::copy:            O(N)
- std::reverse:         O(N)
- std::unique:          O(N)
- std::remove:          O(N)
- std::partition:       O(N)
*/

void complexity_demo() {
    std::vector<int> vec(1000000);
    std::iota(vec.begin(), vec.end(), 1);
    std::random_shuffle(vec.begin(), vec.end());

    // O(N log N) - 排序
    std::sort(vec.begin(), vec.end());

    // O(log N) - 二分查找
    bool found = std::binary_search(vec.begin(), vec.end(), 500000);

    // O(N) - 线性查找
    auto it = std::find(vec.begin(), vec.end(), 500000);

    std::cout << "对于大数据集，优先选择低复杂度算法" << std::endl;
}

int main() {
    complexity_demo();
    return 0;
}
```

## 最佳实践

### 优先使用 STL 算法

```cpp
#include <algorithm>
#include <numeric>
#include <vector>
#include <iostream>

void prefer_algorithms() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 不推荐：手写循环
    int sum1 = 0;
    for (size_t i = 0; i < vec.size(); ++i) {
        sum1 += vec[i];
    }

    // 推荐：使用算法
    int sum2 = std::accumulate(vec.begin(), vec.end(), 0);

    // 不推荐：手写查找
    bool found1 = false;
    for (int x : vec) {
        if (x == 3) {
            found1 = true;
            break;
        }
    }

    // 推荐：使用算法
    bool found2 = std::find(vec.begin(), vec.end(), 3) != vec.end();

    // 更好：C++20 ranges
    // bool found3 = std::ranges::contains(vec, 3);

    std::cout << "STL 算法更简洁、更高效、更不容易出错" << std::endl;
}

int main() {
    prefer_algorithms();
    return 0;
}
```

### 正确使用迭代器

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

void iterator_safety() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 危险：迭代器失效
    /*
    for (auto it = vec.begin(); it != vec.end(); ++it) {
        if (*it == 3) {
            vec.erase(it);  // 迭代器失效！
        }
    }
    */

    // 安全：使用 erase-remove 惯用法
    vec.erase(std::remove(vec.begin(), vec.end(), 3), vec.end());

    // 安全：正确处理迭代器
    vec = {1, 2, 3, 4, 5};
    for (auto it = vec.begin(); it != vec.end(); ) {
        if (*it == 3) {
            it = vec.erase(it);  // 使用返回的新迭代器
        } else {
            ++it;
        }
    }

    std::cout << "始终注意迭代器的有效性" << std::endl;
}

int main() {
    iterator_safety();
    return 0;
}
```

### 算法与容器的配合

```cpp
#include <algorithm>
#include <vector>
#include <list>
#include <set>
#include <iostream>

void container_algorithm_match() {
    // vector - 支持随机访问迭代器
    std::vector<int> vec = {5, 2, 8, 1, 9};
    std::sort(vec.begin(), vec.end());  // OK

    // list - 只支持双向迭代器
    std::list<int> lst = {5, 2, 8, 1, 9};
    // std::sort(lst.begin(), lst.end());  // 编译错误！
    lst.sort();  // 使用 list 自带的 sort

    // set - 已经有序，不需要排序
    std::set<int> s = {5, 2, 8, 1, 9};
    // 元素自动有序

    // 选择正确的容器可以简化算法使用
    // - 需要频繁查找：使用 set/map 或排序后的 vector
    // - 需要保持顺序：使用 list
    // - 需要随机访问：使用 vector/deque

    std::cout << "根据需求选择合适的容器" << std::endl;
}

int main() {
    container_algorithm_match();
    return 0;
}
```

### 性能优化建议

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <execution>  // C++17 并行算法

void performance_tips() {
    std::vector<int> vec(1000000);
    std::iota(vec.begin(), vec.end(), 0);

    // 1. 预留空间避免多次分配
    std::vector<int> result;
    result.reserve(vec.size());  // 预分配

    // 2. 使用移动语义
    std::vector<std::string> words = {"hello", "world"};
    std::vector<std::string> dest;
    std::move(words.begin(), words.end(), std::back_inserter(dest));

    // 3. 使用并行算法（C++17）
    // std::sort(std::execution::par, vec.begin(), vec.end());

    // 4. 选择合适的算法
    // - 只需要前 K 个最大/小元素：用 partial_sort
    // - 只需要第 K 个元素：用 nth_element
    // - 已排序序列查找：用 binary_search

    // 5. 避免不必要的复制
    std::vector<int> original = {1, 2, 3, 4, 5};
    // 不好：创建副本
    // auto sorted = original;
    // std::sort(sorted.begin(), sorted.end());

    // 好：就地排序或使用 const 引用
    std::sort(original.begin(), original.end());

    std::cout << "性能优化需要根据具体场景选择" << std::endl;
}

int main() {
    performance_tips();
    return 0;
}
```

### 综合示例：数据处理管道

```cpp
#include <algorithm>
#include <numeric>
#include <vector>
#include <iostream>
#include <string>
#include <map>
#include <iomanip>

struct Transaction {
    std::string category;
    double amount;
    bool is_income;
};

class FinancialAnalyzer {
private:
    std::vector<Transaction> transactions;

public:
    void addTransaction(const std::string& category, double amount, bool income) {
        transactions.push_back({category, amount, income});
    }

    double getTotalIncome() const {
        return std::accumulate(transactions.begin(), transactions.end(), 0.0,
            [](double sum, const Transaction& t) {
                return sum + (t.is_income ? t.amount : 0);
            });
    }

    double getTotalExpense() const {
        return std::accumulate(transactions.begin(), transactions.end(), 0.0,
            [](double sum, const Transaction& t) {
                return sum + (t.is_income ? 0 : t.amount);
            });
    }

    std::map<std::string, double> getExpensesByCategory() const {
        std::map<std::string, double> result;
        for (const auto& t : transactions) {
            if (!t.is_income) {
                result[t.category] += t.amount;
            }
        }
        return result;
    }

    std::vector<Transaction> getTopExpenses(int n) const {
        std::vector<Transaction> expenses;
        std::copy_if(transactions.begin(), transactions.end(),
                     std::back_inserter(expenses),
                     [](const Transaction& t) { return !t.is_income; });

        std::partial_sort(expenses.begin(),
                          expenses.begin() + std::min(n, (int)expenses.size()),
                          expenses.end(),
                          [](const Transaction& a, const Transaction& b) {
                              return a.amount > b.amount;
                          });

        if (expenses.size() > static_cast<size_t>(n)) {
            expenses.resize(n);
        }
        return expenses;
    }

    void printSummary() const {
        std::cout << std::fixed << std::setprecision(2);
        std::cout << "=== 财务摘要 ===" << std::endl;
        std::cout << "总收入: ¥" << getTotalIncome() << std::endl;
        std::cout << "总支出: ¥" << getTotalExpense() << std::endl;
        std::cout << "净余额: ¥" << (getTotalIncome() - getTotalExpense()) << std::endl;

        std::cout << "\n按类别支出:" << std::endl;
        for (const auto& [category, amount] : getExpensesByCategory()) {
            std::cout << "  " << category << ": ¥" << amount << std::endl;
        }

        std::cout << "\n前3大支出:" << std::endl;
        for (const auto& t : getTopExpenses(3)) {
            std::cout << "  " << t.category << ": ¥" << t.amount << std::endl;
        }
    }
};

int main() {
    FinancialAnalyzer analyzer;

    // 添加收入
    analyzer.addTransaction("工资", 15000, true);
    analyzer.addTransaction("奖金", 3000, true);

    // 添加支出
    analyzer.addTransaction("房租", 4000, false);
    analyzer.addTransaction("餐饮", 2500, false);
    analyzer.addTransaction("交通", 800, false);
    analyzer.addTransaction("购物", 1500, false);
    analyzer.addTransaction("娱乐", 600, false);
    analyzer.addTransaction("教育", 2000, false);

    analyzer.printSummary();

    return 0;
}
```

## 总结

C++ STL 算法库提供了一套功能强大、高效且经过充分测试的算法集合：

1. **排序算法**：`sort`、`stable_sort`、`partial_sort`、`nth_element` 满足不同排序需求
2. **搜索算法**：`find`、`binary_search`、`lower_bound`、`upper_bound` 提供灵活的查找能力
3. **变换算法**：`transform`、`copy`、`replace`、`remove` 实现元素的转换和过滤
4. **数值算法**：`accumulate`、`inner_product`、`partial_sum`、`iota` 执行数值计算
5. **分区算法**：`partition`、`stable_partition` 实现元素分组
6. **合并算法**：`merge`、`inplace_merge` 合并有序序列
7. **集合操作**：`set_union`、`set_intersection`、`set_difference` 执行集合运算
8. **C++20 Ranges**：提供更现代、更简洁的算法接口和视图组合

选择正确的算法可以显著提高代码的效率和可读性。优先使用 STL 算法而非手写循环，注意算法的复杂度要求和迭代器类型要求，充分利用 C++20 Ranges 带来的便利性。
