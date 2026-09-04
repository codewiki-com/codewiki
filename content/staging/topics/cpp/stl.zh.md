---
title: C++ STL 标准模板库
description: 掌握 C++ STL：容器、迭代器、算法与函数对象
track: cpp
section: templates-generic
difficulty: intermediate
tags:
  - C++
  - STL
  - 容器
  - 算法
status: imported
origin: old/src/content/docs/cpp/stl.zh.md
divergence: 0.229
issues: []
legacy:
  category: Cpp
  subcategory: STL
  order: 6
  lastUpdated: 2026-01-07
---

C++ 标准模板库（Standard Template Library，STL）是 C++ 标准库的核心部分，提供了一组通用的模板类和函数，极大地提高了代码的复用性和开发效率。STL 主要由容器（Containers）、迭代器（Iterators）、算法（Algorithms）和函数对象（Function Objects）四大部分组成。

## STL 概述

STL 的设计理念是将数据结构和算法分离，通过迭代器作为桥梁连接两者。这种设计使得算法可以作用于不同的容器，而不需要为每种容器重新实现算法。

### STL 的核心组件

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    // 容器：存储数据
    std::vector<int> vec = {5, 2, 8, 1, 9};

    // 迭代器：访问容器元素
    std::vector<int>::iterator it = vec.begin();

    // 算法：对容器中的数据进行操作
    std::sort(vec.begin(), vec.end());

    // 输出结果
    for (int num : vec) {
        std::cout << num << " ";  // 输出: 1 2 5 8 9
    }

    return 0;
}
```

## 顺序容器

顺序容器按照元素添加的顺序存储和访问元素。主要包括 `vector`、`deque`、`list`、`forward_list`、`array` 和 `string`。

### vector - 动态数组

`vector` 是最常用的顺序容器，支持快速随机访问，在尾部插入和删除元素效率高。

```cpp
#include <vector>
#include <iostream>

int main() {
    // 创建 vector
    std::vector<int> vec;

    // 添加元素
    vec.push_back(10);
    vec.push_back(20);
    vec.push_back(30);

    // 访问元素
    std::cout << "第一个元素: " << vec[0] << std::endl;
    std::cout << "第二个元素: " << vec.at(1) << std::endl;

    // 容量信息
    std::cout << "大小: " << vec.size() << std::endl;
    std::cout << "容量: " << vec.capacity() << std::endl;

    // 插入元素
    vec.insert(vec.begin() + 1, 15);  // 在位置1插入15

    // 删除元素
    vec.erase(vec.begin());  // 删除第一个元素
    vec.pop_back();  // 删除最后一个元素

    // 遍历
    for (const auto& num : vec) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    // 清空
    vec.clear();

    return 0;
}
```

### deque - 双端队列

`deque` 支持在头部和尾部高效插入和删除元素。

```cpp
#include <deque>
#include <iostream>

int main() {
    std::deque<int> deq;

    // 在尾部添加
    deq.push_back(10);
    deq.push_back(20);

    // 在头部添加
    deq.push_front(5);
    deq.push_front(1);

    // 访问元素
    std::cout << "第一个元素: " << deq.front() << std::endl;  // 1
    std::cout << "最后一个元素: " << deq.back() << std::endl;  // 20

    // 删除
    deq.pop_front();  // 删除头部
    deq.pop_back();   // 删除尾部

    // 遍历
    for (const auto& num : deq) {
        std::cout << num << " ";  // 5 10
    }
    std::cout << std::endl;

    return 0;
}
```

### list - 双向链表

`list` 支持在任意位置高效插入和删除，但不支持随机访问。

```cpp
#include <list>
#include <iostream>

int main() {
    std::list<int> lst = {1, 2, 3, 4, 5};

    // 添加元素
    lst.push_front(0);
    lst.push_back(6);

    // 插入元素
    auto it = lst.begin();
    std::advance(it, 3);  // 移动到第3个位置
    lst.insert(it, 99);

    // 删除元素
    lst.remove(99);  // 删除所有值为99的元素

    // 反转
    lst.reverse();

    // 排序
    lst.sort();

    // 遍历
    for (const auto& num : lst) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### array - 固定大小数组

`array` 是对原生数组的封装，提供了 STL 容器的接口。

```cpp
#include <array>
#include <iostream>

int main() {
    // 创建固定大小的数组
    std::array<int, 5> arr = {1, 2, 3, 4, 5};

    // 访问元素
    std::cout << "第一个元素: " << arr[0] << std::endl;
    std::cout << "最后一个元素: " << arr.back() << std::endl;

    // 大小
    std::cout << "大小: " << arr.size() << std::endl;

    // 填充
    arr.fill(0);  // 所有元素设为0

    // 遍历
    for (const auto& num : arr) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

## 关联容器

关联容器通过键（key）来存储和访问元素，元素自动按键排序。主要包括 `set`、`multiset`、`map` 和 `multimap`。

### set - 有序集合

`set` 存储唯一的元素，自动按键排序。

```cpp
#include <set>
#include <iostream>

int main() {
    std::set<int> s;

    // 插入元素
    s.insert(30);
    s.insert(10);
    s.insert(20);
    s.insert(10);  // 重复元素不会被插入

    // 查找元素
    auto it = s.find(20);
    if (it != s.end()) {
        std::cout << "找到元素: " << *it << std::endl;
    }

    // 删除元素
    s.erase(10);

    // 元素个数
    std::cout << "元素个数: " << s.size() << std::endl;

    // 遍历（自动排序）
    for (const auto& num : s) {
        std::cout << num << " ";  // 20 30
    }
    std::cout << std::endl;

    // 范围查询
    auto lower = s.lower_bound(15);  // 第一个 >= 15 的元素
    auto upper = s.upper_bound(25);  // 第一个 > 25 的元素

    return 0;
}
```

### multiset - 允许重复的有序集合

```cpp
#include <set>
#include <iostream>

int main() {
    std::multiset<int> ms = {1, 2, 2, 3, 3, 3};

    // 插入重复元素
    ms.insert(2);
    ms.insert(3);

    // 计数
    std::cout << "2 的个数: " << ms.count(2) << std::endl;  // 3
    std::cout << "3 的个数: " << ms.count(3) << std::endl;  // 5

    // 删除所有值为2的元素
    ms.erase(2);

    // 遍历
    for (const auto& num : ms) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### map - 键值对映射

`map` 存储键值对，按键自动排序，每个键唯一。

```cpp
#include <map>
#include <iostream>
#include <string>

int main() {
    std::map<std::string, int> ages;

    // 插入元素
    ages["Alice"] = 25;
    ages["Bob"] = 30;
    ages["Charlie"] = 35;
    ages.insert({"David", 28});
    ages.insert(std::make_pair("Eve", 32));

    // 访问元素
    std::cout << "Alice 的年龄: " << ages["Alice"] << std::endl;

    // 检查键是否存在
    if (ages.find("Bob") != ages.end()) {
        std::cout << "Bob 存在，年龄为: " << ages["Bob"] << std::endl;
    }

    // 使用 at() 安全访问（不存在会抛出异常）
    try {
        std::cout << ages.at("Frank") << std::endl;
    } catch (const std::out_of_range& e) {
        std::cout << "键不存在" << std::endl;
    }

    // 删除元素
    ages.erase("Charlie");

    // 遍历
    for (const auto& pair : ages) {
        std::cout << pair.first << ": " << pair.second << std::endl;
    }

    // 使用结构化绑定（C++17）
    for (const auto& [name, age] : ages) {
        std::cout << name << " 今年 " << age << " 岁" << std::endl;
    }

    return 0;
}
```

### multimap - 允许重复键的映射

```cpp
#include <map>
#include <iostream>
#include <string>

int main() {
    std::multimap<std::string, int> scores;

    // 插入多个相同键的元素
    scores.insert({"Math", 90});
    scores.insert({"Math", 85});
    scores.insert({"English", 88});
    scores.insert({"English", 92});

    // 查找特定键的所有值
    auto range = scores.equal_range("Math");
    std::cout << "Math 的所有分数: ";
    for (auto it = range.first; it != range.second; ++it) {
        std::cout << it->second << " ";
    }
    std::cout << std::endl;

    // 计数
    std::cout << "Math 的成绩个数: " << scores.count("Math") << std::endl;

    return 0;
}
```

## 无序容器

无序容器使用哈希表实现，不对元素排序，但提供了更快的查找速度（平均 O(1)）。主要包括 `unordered_set`、`unordered_multiset`、`unordered_map` 和 `unordered_multimap`。

### unordered_set - 无序集合

```cpp
#include <unordered_set>
#include <iostream>

int main() {
    std::unordered_set<int> us = {5, 2, 8, 1, 9};

    // 插入元素
    us.insert(3);
    us.insert(5);  // 重复元素不会被插入

    // 查找元素（平均 O(1)）
    if (us.find(8) != us.end()) {
        std::cout << "找到元素 8" << std::endl;
    }

    // 删除元素
    us.erase(2);

    // 遍历（无序）
    for (const auto& num : us) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    // 桶信息
    std::cout << "桶数量: " << us.bucket_count() << std::endl;
    std::cout << "负载因子: " << us.load_factor() << std::endl;

    return 0;
}
```

### unordered_map - 无序映射

```cpp
#include <unordered_map>
#include <iostream>
#include <string>

int main() {
    std::unordered_map<std::string, int> word_count;

    // 统计单词频率
    std::string text = "hello world hello cpp world";
    std::string word;

    // 简化示例：手动添加
    word_count["hello"] = 2;
    word_count["world"] = 2;
    word_count["cpp"] = 1;

    // 访问元素
    std::cout << "hello 出现次数: " << word_count["hello"] << std::endl;

    // 查找
    auto it = word_count.find("cpp");
    if (it != word_count.end()) {
        std::cout << it->first << ": " << it->second << std::endl;
    }

    // 遍历
    for (const auto& [word, count] : word_count) {
        std::cout << word << ": " << count << std::endl;
    }

    return 0;
}
```

### 自定义哈希函数

对于自定义类型，需要提供哈希函数和相等比较函数。

```cpp
#include <unordered_set>
#include <iostream>
#include <string>

struct Person {
    std::string name;
    int age;

    bool operator==(const Person& other) const {
        return name == other.name && age == other.age;
    }
};

// 自定义哈希函数
struct PersonHash {
    std::size_t operator()(const Person& p) const {
        return std::hash<std::string>()(p.name) ^ std::hash<int>()(p.age);
    }
};

int main() {
    std::unordered_set<Person, PersonHash> people;

    people.insert({"Alice", 25});
    people.insert({"Bob", 30});

    Person target = {"Alice", 25};
    if (people.find(target) != people.end()) {
        std::cout << "找到 Alice" << std::endl;
    }

    return 0;
}
```

## 迭代器

迭代器是 STL 中连接容器和算法的桥梁，提供了一种统一的方式来遍历容器。

### 迭代器类型

```cpp
#include <vector>
#include <list>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 正向迭代器
    std::vector<int>::iterator it = vec.begin();
    while (it != vec.end()) {
        std::cout << *it << " ";
        ++it;
    }
    std::cout << std::endl;

    // 常量迭代器
    std::vector<int>::const_iterator cit = vec.cbegin();
    // *cit = 10;  // 错误：不能修改

    // 反向迭代器
    std::vector<int>::reverse_iterator rit = vec.rbegin();
    while (rit != vec.rend()) {
        std::cout << *rit << " ";  // 5 4 3 2 1
        ++rit;
    }
    std::cout << std::endl;

    // 常量反向迭代器
    for (auto crit = vec.crbegin(); crit != vec.crend(); ++crit) {
        std::cout << *crit << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### 迭代器操作

```cpp
#include <vector>
#include <iterator>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    auto it = vec.begin();

    // 前进
    std::advance(it, 3);  // it 指向第4个元素
    std::cout << "前进3步: " << *it << std::endl;  // 4

    // 距离
    auto dist = std::distance(vec.begin(), it);
    std::cout << "距离起始位置: " << dist << std::endl;  // 3

    // 下一个
    auto next_it = std::next(it, 2);
    std::cout << "下2个元素: " << *next_it << std::endl;  // 6

    // 上一个
    auto prev_it = std::prev(it, 1);
    std::cout << "上1个元素: " << *prev_it << std::endl;  // 3

    return 0;
}
```

### 插入迭代器

```cpp
#include <vector>
#include <iterator>
#include <algorithm>
#include <iostream>

int main() {
    std::vector<int> source = {1, 2, 3, 4, 5};
    std::vector<int> dest;

    // back_insert_iterator - 尾部插入
    std::copy(source.begin(), source.end(),
              std::back_inserter(dest));

    std::vector<int> dest2;
    // front_insert_iterator - 头部插入（需要支持push_front的容器）

    std::vector<int> dest3 = {10, 20, 30};
    // insert_iterator - 指定位置插入
    std::copy(source.begin(), source.end(),
              std::inserter(dest3, dest3.begin() + 1));

    // 输出 dest3: 10 1 2 3 4 5 20 30
    for (const auto& num : dest3) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### 流迭代器

```cpp
#include <iostream>
#include <iterator>
#include <vector>
#include <algorithm>
#include <sstream>

int main() {
    // istream_iterator - 从流中读取
    std::istringstream iss("1 2 3 4 5");
    std::vector<int> vec(
        std::istream_iterator<int>(iss),
        std::istream_iterator<int>()
    );

    // ostream_iterator - 输出到流
    std::cout << "读取的数据: ";
    std::copy(vec.begin(), vec.end(),
              std::ostream_iterator<int>(std::cout, " "));
    std::cout << std::endl;

    return 0;
}
```

## 算法

STL 提供了大量通用算法，可以作用于不同的容器。

### 非修改算法

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 3, 2, 1};

    // 查找
    auto it = std::find(vec.begin(), vec.end(), 3);
    if (it != vec.end()) {
        std::cout << "找到元素 3，位置: "
                  << std::distance(vec.begin(), it) << std::endl;
    }

    // 查找满足条件的元素
    auto it2 = std::find_if(vec.begin(), vec.end(),
                            [](int x) { return x > 4; });
    if (it2 != vec.end()) {
        std::cout << "第一个大于4的元素: " << *it2 << std::endl;
    }

    // 计数
    int count = std::count(vec.begin(), vec.end(), 2);
    std::cout << "2 的个数: " << count << std::endl;

    // 计数满足条件的元素
    int count_if = std::count_if(vec.begin(), vec.end(),
                                   [](int x) { return x % 2 == 0; });
    std::cout << "偶数的个数: " << count_if << std::endl;

    // 全部满足
    bool all = std::all_of(vec.begin(), vec.end(),
                           [](int x) { return x > 0; });
    std::cout << "所有元素都大于0: " << all << std::endl;

    // 任意一个满足
    bool any = std::any_of(vec.begin(), vec.end(),
                           [](int x) { return x > 4; });
    std::cout << "存在大于4的元素: " << any << std::endl;

    // 没有一个满足
    bool none = std::none_of(vec.begin(), vec.end(),
                             [](int x) { return x < 0; });
    std::cout << "没有小于0的元素: " << none << std::endl;

    return 0;
}
```

### 修改算法

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::vector<int> dest(5);

    // 复制
    std::copy(vec.begin(), vec.end(), dest.begin());

    // 复制满足条件的元素
    std::vector<int> evens;
    std::copy_if(vec.begin(), vec.end(), std::back_inserter(evens),
                 [](int x) { return x % 2 == 0; });

    // 填充
    std::fill(vec.begin(), vec.end(), 0);

    // 生成
    std::vector<int> gen(10);
    int n = 0;
    std::generate(gen.begin(), gen.end(), [&n]() { return n++; });

    // 转换
    std::vector<int> squared(5);
    std::transform(evens.begin(), evens.end(), squared.begin(),
                   [](int x) { return x * x; });

    // 替换
    std::vector<int> rep = {1, 2, 3, 2, 1};
    std::replace(rep.begin(), rep.end(), 2, 99);

    // 删除（逻辑删除，需配合erase）
    rep = {1, 2, 3, 2, 1, 2};
    auto new_end = std::remove(rep.begin(), rep.end(), 2);
    rep.erase(new_end, rep.end());

    // 去重（需要先排序）
    std::vector<int> dup = {1, 1, 2, 2, 3, 3, 3};
    auto unique_end = std::unique(dup.begin(), dup.end());
    dup.erase(unique_end, dup.end());

    std::cout << "去重后: ";
    for (const auto& num : dup) {
        std::cout << num << " ";  // 1 2 3
    }
    std::cout << std::endl;

    return 0;
}
```

### 排序算法

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3, 7};

    // 排序
    std::sort(vec.begin(), vec.end());
    std::cout << "升序: ";
    for (const auto& num : vec) std::cout << num << " ";
    std::cout << std::endl;

    // 降序排序
    std::sort(vec.begin(), vec.end(), std::greater<int>());
    std::cout << "降序: ";
    for (const auto& num : vec) std::cout << num << " ";
    std::cout << std::endl;

    // 自定义比较
    std::vector<std::string> words = {"apple", "a", "banana", "an"};
    std::sort(words.begin(), words.end(),
              [](const std::string& a, const std::string& b) {
                  return a.length() < b.length();
              });

    // 部分排序
    vec = {5, 2, 8, 1, 9, 3, 7};
    std::partial_sort(vec.begin(), vec.begin() + 3, vec.end());
    std::cout << "前3个最小元素: ";
    for (int i = 0; i < 3; ++i) std::cout << vec[i] << " ";
    std::cout << std::endl;

    // nth_element - 找第n大的元素
    vec = {5, 2, 8, 1, 9, 3, 7};
    std::nth_element(vec.begin(), vec.begin() + 3, vec.end());
    std::cout << "第4小的元素: " << vec[3] << std::endl;

    // 稳定排序
    std::stable_sort(vec.begin(), vec.end());

    return 0;
}
```

### 二分查找算法

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9};

    // 二分查找（需要有序）
    bool found = std::binary_search(vec.begin(), vec.end(), 5);
    std::cout << "是否找到5: " << found << std::endl;

    // lower_bound - 第一个 >= 目标值的位置
    auto lower = std::lower_bound(vec.begin(), vec.end(), 5);
    std::cout << "第一个 >= 5 的元素: " << *lower << std::endl;

    // upper_bound - 第一个 > 目标值的位置
    auto upper = std::upper_bound(vec.begin(), vec.end(), 5);
    std::cout << "第一个 > 5 的元素: " << *upper << std::endl;

    // equal_range - 等于目标值的范围
    std::vector<int> dup = {1, 2, 3, 3, 3, 4, 5};
    auto range = std::equal_range(dup.begin(), dup.end(), 3);
    std::cout << "值为3的元素范围: ";
    for (auto it = range.first; it != range.second; ++it) {
        std::cout << *it << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### 数值算法

```cpp
#include <numeric>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 求和
    int sum = std::accumulate(vec.begin(), vec.end(), 0);
    std::cout << "求和: " << sum << std::endl;  // 15

    // 求积
    int product = std::accumulate(vec.begin(), vec.end(), 1,
                                   std::multiplies<int>());
    std::cout << "求积: " << product << std::endl;  // 120

    // 内积
    std::vector<int> vec2 = {1, 2, 3, 4, 5};
    int inner = std::inner_product(vec.begin(), vec.end(),
                                    vec2.begin(), 0);
    std::cout << "内积: " << inner << std::endl;  // 55

    // 部分和
    std::vector<int> partial(5);
    std::partial_sum(vec.begin(), vec.end(), partial.begin());
    std::cout << "部分和: ";
    for (const auto& num : partial) {
        std::cout << num << " ";  // 1 3 6 10 15
    }
    std::cout << std::endl;

    // 相邻差
    std::vector<int> diff(5);
    std::adjacent_difference(vec.begin(), vec.end(), diff.begin());
    std::cout << "相邻差: ";
    for (const auto& num : diff) {
        std::cout << num << " ";  // 1 1 1 1 1
    }
    std::cout << std::endl;

    // iota - 填充递增序列
    std::vector<int> iota_vec(10);
    std::iota(iota_vec.begin(), iota_vec.end(), 1);
    std::cout << "递增序列: ";
    for (const auto& num : iota_vec) {
        std::cout << num << " ";  // 1 2 3 4 5 6 7 8 9 10
    }
    std::cout << std::endl;

    return 0;
}
```

### 堆算法

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3, 7};

    // 创建大顶堆
    std::make_heap(vec.begin(), vec.end());
    std::cout << "堆顶元素: " << vec.front() << std::endl;  // 9

    // 添加元素到堆
    vec.push_back(10);
    std::push_heap(vec.begin(), vec.end());
    std::cout << "新堆顶: " << vec.front() << std::endl;  // 10

    // 删除堆顶元素
    std::pop_heap(vec.begin(), vec.end());
    vec.pop_back();
    std::cout << "删除后堆顶: " << vec.front() << std::endl;  // 9

    // 堆排序
    std::sort_heap(vec.begin(), vec.end());
    std::cout << "排序后: ";
    for (const auto& num : vec) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### 排列算法

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3};

    // 生成所有排列
    std::cout << "所有排列:" << std::endl;
    do {
        for (const auto& num : vec) {
            std::cout << num << " ";
        }
        std::cout << std::endl;
    } while (std::next_permutation(vec.begin(), vec.end()));

    // 上一个排列
    vec = {3, 2, 1};
    std::cout << "\n逆序排列:" << std::endl;
    do {
        for (const auto& num : vec) {
            std::cout << num << " ";
        }
        std::cout << std::endl;
    } while (std::prev_permutation(vec.begin(), vec.end()));

    return 0;
}
```

## 函数对象

函数对象（仿函数）是重载了 `operator()` 的类对象，可以像函数一样调用。

### 标准函数对象

```cpp
#include <functional>
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 算术运算
    std::transform(vec.begin(), vec.end(), vec.begin(),
                   std::negate<int>());  // 取负

    // 比较运算
    std::sort(vec.begin(), vec.end(), std::greater<int>());  // 降序

    // 逻辑运算
    bool result = std::logical_and<bool>()(true, false);

    return 0;
}
```

### 自定义函数对象

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

// 自定义函数对象
class MultiplyBy {
private:
    int factor;
public:
    MultiplyBy(int f) : factor(f) {}

    int operator()(int x) const {
        return x * factor;
    }
};

// 有状态的函数对象
class Counter {
private:
    mutable int count;
public:
    Counter() : count(0) {}

    void operator()(int) const {
        ++count;
    }

    int getCount() const { return count; }
};

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 使用自定义函数对象
    std::transform(vec.begin(), vec.end(), vec.begin(),
                   MultiplyBy(3));

    std::cout << "乘以3: ";
    for (const auto& num : vec) {
        std::cout << num << " ";  // 3 6 9 12 15
    }
    std::cout << std::endl;

    // 有状态的函数对象
    Counter counter;
    counter = std::for_each(vec.begin(), vec.end(), counter);
    std::cout << "元素个数: " << counter.getCount() << std::endl;

    return 0;
}
```

### Lambda 表达式

C++11 引入的 lambda 表达式是定义匿名函数对象的便捷方式。

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 基本 lambda
    std::for_each(vec.begin(), vec.end(),
                  [](int x) { std::cout << x << " "; });
    std::cout << std::endl;

    // 捕获外部变量
    int factor = 2;
    std::transform(vec.begin(), vec.end(), vec.begin(),
                   [factor](int x) { return x * factor; });

    // 值捕获
    int sum = 0;
    std::for_each(vec.begin(), vec.end(),
                  [sum](int x) mutable { sum += x; });

    // 引用捕获
    sum = 0;
    std::for_each(vec.begin(), vec.end(),
                  [&sum](int x) { sum += x; });
    std::cout << "总和: " << sum << std::endl;

    // 捕获所有（值）
    int multiplier = 3;
    std::transform(vec.begin(), vec.end(), vec.begin(),
                   [=](int x) { return x * multiplier; });

    // 捕获所有（引用）
    std::for_each(vec.begin(), vec.end(),
                  [&](int x) { sum += x; });

    // 返回类型推导
    auto divide = [](int a, int b) { return a / b; };

    // 显式返回类型
    auto safe_divide = [](int a, int b) -> double {
        return b != 0 ? static_cast<double>(a) / b : 0.0;
    };

    std::cout << "安全除法: " << safe_divide(10, 3) << std::endl;

    return 0;
}
```

### 函数包装器

```cpp
#include <functional>
#include <iostream>

int add(int a, int b) {
    return a + b;
}

class Calculator {
public:
    int multiply(int a, int b) {
        return a * b;
    }

    static int subtract(int a, int b) {
        return a - b;
    }
};

int main() {
    // 包装普通函数
    std::function<int(int, int)> func1 = add;
    std::cout << "加法: " << func1(3, 4) << std::endl;

    // 包装 lambda
    std::function<int(int, int)> func2 = [](int a, int b) {
        return a * b;
    };
    std::cout << "乘法: " << func2(3, 4) << std::endl;

    // 包装成员函数
    Calculator calc;
    std::function<int(Calculator&, int, int)> func3 = &Calculator::multiply;
    std::cout << "成员函数: " << func3(calc, 3, 4) << std::endl;

    // bind - 绑定参数
    auto add5 = std::bind(add, std::placeholders::_1, 5);
    std::cout << "绑定参数: " << add5(10) << std::endl;  // 15

    // 绑定成员函数
    auto bound_multiply = std::bind(&Calculator::multiply, &calc,
                                     std::placeholders::_1,
                                     std::placeholders::_2);
    std::cout << "绑定成员: " << bound_multiply(3, 4) << std::endl;

    return 0;
}
```

## 最佳实践

### 选择合适的容器

```cpp
#include <vector>
#include <list>
#include <deque>
#include <set>
#include <unordered_map>
#include <iostream>

void container_selection_guide() {
    // 1. 需要随机访问 -> vector
    std::vector<int> vec = {1, 2, 3};
    int x = vec[1];  // O(1) 访问

    // 2. 频繁在两端插入/删除 -> deque
    std::deque<int> deq;
    deq.push_front(1);
    deq.push_back(2);

    // 3. 频繁在中间插入/删除 -> list
    std::list<int> lst = {1, 2, 3};
    auto it = lst.begin();
    ++it;
    lst.insert(it, 99);  // O(1) 插入

    // 4. 需要自动排序且唯一 -> set
    std::set<int> s = {3, 1, 2, 1};  // 自动排序去重

    // 5. 快速查找 -> unordered_map 或 unordered_set
    std::unordered_map<std::string, int> map;
    map["key"] = 100;  // O(1) 平均查找

    std::cout << "容器选择基于使用场景" << std::endl;
}
```

### 避免不必要的拷贝

```cpp
#include <vector>
#include <iostream>
#include <string>

void avoid_copy_demo() {
    std::vector<std::string> words = {"hello", "world", "cpp"};

    // 不好：拷贝元素
    for (std::string word : words) {
        std::cout << word << std::endl;
    }

    // 好：使用常量引用
    for (const std::string& word : words) {
        std::cout << word << std::endl;
    }

    // 更好：使用 auto
    for (const auto& word : words) {
        std::cout << word << std::endl;
    }

    // 移动语义
    std::vector<std::string> dest;
    dest.push_back(std::move(words[0]));  // 移动而非拷贝

    // 就地构造
    dest.emplace_back("new");  // 直接构造，避免临时对象
}
```

### 预分配容器大小

```cpp
#include <vector>
#include <iostream>

void reserve_demo() {
    std::vector<int> vec;

    // 不好：可能多次重新分配
    for (int i = 0; i < 1000; ++i) {
        vec.push_back(i);
    }

    // 好：预分配空间
    std::vector<int> vec2;
    vec2.reserve(1000);  // 预留空间
    for (int i = 0; i < 1000; ++i) {
        vec2.push_back(i);
    }

    // 或者直接指定大小
    std::vector<int> vec3(1000);  // 创建1000个元素
    for (int i = 0; i < 1000; ++i) {
        vec3[i] = i;
    }

    std::cout << "预分配可以提高性能" << std::endl;
}
```

### 使用算法而非手写循环

```cpp
#include <algorithm>
#include <vector>
#include <numeric>
#include <iostream>

void use_algorithms_demo() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 不好：手写循环
    int sum = 0;
    for (size_t i = 0; i < vec.size(); ++i) {
        sum += vec[i];
    }

    // 好：使用算法
    sum = std::accumulate(vec.begin(), vec.end(), 0);

    // 不好：手写查找
    bool found = false;
    for (const auto& num : vec) {
        if (num == 3) {
            found = true;
            break;
        }
    }

    // 好：使用算法
    auto it = std::find(vec.begin(), vec.end(), 3);
    found = (it != vec.end());

    std::cout << "使用 STL 算法更简洁高效" << std::endl;
}
```

### 小心迭代器失效

```cpp
#include <vector>
#include <iostream>

void iterator_invalidation_demo() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // 错误：插入后迭代器失效
    /*
    for (auto it = vec.begin(); it != vec.end(); ++it) {
        if (*it == 3) {
            vec.insert(it, 99);  // 迭代器失效！
        }
    }
    */

    // 正确：使用返回的迭代器
    for (auto it = vec.begin(); it != vec.end(); ++it) {
        if (*it == 3) {
            it = vec.insert(it, 99);  // 使用新迭代器
            ++it;  // 跳过插入的元素
        }
    }

    // 删除时同样要注意
    vec = {1, 2, 3, 4, 5};
    for (auto it = vec.begin(); it != vec.end(); ) {
        if (*it % 2 == 0) {
            it = vec.erase(it);  // erase 返回下一个有效迭代器
        } else {
            ++it;
        }
    }

    std::cout << "始终注意迭代器的有效性" << std::endl;
}
```

### 综合示例：学生成绩管理系统

```cpp
#include <iostream>
#include <vector>
#include <map>
#include <algorithm>
#include <numeric>
#include <string>
#include <iomanip>

struct Student {
    int id;
    std::string name;
    std::vector<int> scores;

    double getAverage() const {
        if (scores.empty()) return 0.0;
        return std::accumulate(scores.begin(), scores.end(), 0.0) / scores.size();
    }
};

class GradeManager {
private:
    std::map<int, Student> students;

public:
    void addStudent(int id, const std::string& name) {
        students[id] = {id, name, {}};
    }

    void addScore(int id, int score) {
        auto it = students.find(id);
        if (it != students.end()) {
            it->second.scores.push_back(score);
        }
    }

    void printTopN(int n) {
        std::vector<Student> sorted_students;
        for (const auto& [id, student] : students) {
            sorted_students.push_back(student);
        }

        // 按平均分降序排序
        std::partial_sort(sorted_students.begin(),
                         sorted_students.begin() + std::min(n, (int)sorted_students.size()),
                         sorted_students.end(),
                         [](const Student& a, const Student& b) {
                             return a.getAverage() > b.getAverage();
                         });

        std::cout << "前 " << n << " 名学生：" << std::endl;
        std::cout << std::fixed << std::setprecision(2);
        for (int i = 0; i < std::min(n, (int)sorted_students.size()); ++i) {
            std::cout << sorted_students[i].name << ": "
                     << sorted_students[i].getAverage() << std::endl;
        }
    }

    double getClassAverage() {
        if (students.empty()) return 0.0;

        double sum = std::accumulate(students.begin(), students.end(), 0.0,
                                      [](double acc, const auto& pair) {
                                          return acc + pair.second.getAverage();
                                      });
        return sum / students.size();
    }
};

int main() {
    GradeManager manager;

    manager.addStudent(1, "张三");
    manager.addStudent(2, "李四");
    manager.addStudent(3, "王五");

    manager.addScore(1, 85);
    manager.addScore(1, 90);
    manager.addScore(1, 88);

    manager.addScore(2, 92);
    manager.addScore(2, 95);
    manager.addScore(2, 89);

    manager.addScore(3, 78);
    manager.addScore(3, 82);
    manager.addScore(3, 80);

    manager.printTopN(3);

    std::cout << "\n班级平均分: " << std::fixed << std::setprecision(2)
              << manager.getClassAverage() << std::endl;

    return 0;
}
```

## 总结

C++ STL 是一个强大而灵活的工具集，掌握 STL 可以显著提高 C++ 编程效率：

1. **容器**：根据使用场景选择合适的容器类型
2. **迭代器**：理解不同迭代器类型及其使用场景
3. **算法**：优先使用 STL 算法而非手写循环
4. **函数对象**：善用 lambda 表达式简化代码
5. **性能优化**：注意容器的预分配、避免不必要的拷贝
6. **迭代器安全**：小心迭代器失效问题

通过熟练掌握 STL，你可以编写出更简洁、更高效、更易维护的 C++ 代码。
