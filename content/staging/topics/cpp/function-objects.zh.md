---
title: C++ 函数对象 (Functors)
description: 深入理解C++函数对象：operator()重载、std::function、std::bind、Lambda对比及STL谓词
track: cpp
section: templates-generic
difficulty: intermediate
tags:
  - C++
  - 函数对象
  - 仿函数
  - std::function
  - std::bind
  - Lambda
status: imported
origin: old/src/content/docs/cpp/function-objects.zh.md
divergence: 0.201
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: STL
  order: 7
  lastUpdated: 2026-01-07
---

函数对象（Function Objects），也称为仿函数（Functors），是 C++ 中一个强大而灵活的概念。它是重载了函数调用运算符 `operator()` 的类对象，可以像普通函数一样被调用，但具有更强大的功能：可以携带状态、支持模板化、并且能被编译器内联优化。

## 概念解释

### 什么是函数对象

函数对象是一个类的实例，该类重载了 `operator()` 运算符。这使得对象可以像函数一样使用圆括号语法进行调用。

```cpp
#include <iostream>

// 定义一个函数对象类
class Adder {
private:
    int value;
public:
    Adder(int v) : value(v) {}

    // 重载函数调用运算符
    int operator()(int x) const {
        return x + value;
    }
};

int main() {
    Adder add5(5);           // 创建一个加5的函数对象
    int result = add5(10);   // 像函数一样调用，结果为15
    std::cout << result << std::endl;

    // 也可以直接使用临时对象
    int result2 = Adder(10)(20);  // 结果为30
    std::cout << result2 << std::endl;

    return 0;
}
```

### 函数对象 vs 普通函数

| 特性 | 普通函数 | 函数对象 |
|------|----------|----------|
| 状态 | 无状态（除非使用全局/静态变量） | 可以携带内部状态 |
| 内联优化 | 通过函数指针调用时无法内联 | 编译器容易内联优化 |
| 类型 | 函数指针类型 | 唯一的类类型 |
| 模板参数 | 需要函数指针类型 | 可以作为模板类型参数 |
| 多态性 | 无法实现编译期多态 | 支持编译期多态 |

### 历史背景

函数对象的概念起源于 STL（标准模板库）的设计。Alexander Stepanov 在设计 STL 时，需要一种能够在算法中传递"行为"的机制。普通函数指针虽然可以实现这一目的，但存在以下问题：

1. **无法携带状态**：函数指针只能指向无状态的函数
2. **性能损失**：通过函数指针调用会阻止编译器内联
3. **类型不够灵活**：函数指针类型固定，难以泛化

函数对象完美解决了这些问题，成为 STL 算法的核心组成部分。

## 核心原理

### operator() 的工作机制

当编译器遇到 `obj(args...)` 这样的调用时，会将其转换为 `obj.operator()(args...)`。这意味着函数调用运算符只是一个普通的成员函数，可以被重载、可以有多个版本。

```cpp
#include <iostream>
#include <string>

class Printer {
public:
    // 可以定义多个 operator() 重载
    void operator()(int x) const {
        std::cout << "整数: " << x << std::endl;
    }

    void operator()(double x) const {
        std::cout << "浮点数: " << x << std::endl;
    }

    void operator()(const std::string& s) const {
        std::cout << "字符串: " << s << std::endl;
    }

    // 可以接受任意数量的参数
    void operator()(int a, int b, int c) const {
        std::cout << "三个整数: " << a << ", " << b << ", " << c << std::endl;
    }
};

int main() {
    Printer print;

    print(42);           // 调用 operator()(int)
    print(3.14);         // 调用 operator()(double)
    print("Hello");      // 调用 operator()(const std::string&)
    print(1, 2, 3);      // 调用 operator()(int, int, int)

    return 0;
}
```

### 编译器优化

函数对象的一个重要优势是编译器可以进行内联优化。当使用模板时，编译器知道函数对象的确切类型，可以直接内联其 `operator()` 实现：

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

// 函数对象
struct Square {
    int operator()(int x) const { return x * x; }
};

// 普通函数
int square(int x) { return x * x; }

template<typename Func>
void applyToAll(std::vector<int>& vec, Func f) {
    for (auto& x : vec) {
        x = f(x);  // 编译器可以内联函数对象的调用
    }
}

int main() {
    std::vector<int> vec1 = {1, 2, 3, 4, 5};
    std::vector<int> vec2 = {1, 2, 3, 4, 5};

    // 使用函数对象：编译器可以内联
    applyToAll(vec1, Square());

    // 使用函数指针：可能无法内联
    applyToAll(vec2, square);

    return 0;
}
```

### 状态保持机制

函数对象可以通过成员变量保持状态，这是其相比普通函数的核心优势：

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

// 累加器：保持累加状态
class Accumulator {
private:
    int sum = 0;
    int count = 0;

public:
    void operator()(int x) {
        sum += x;
        ++count;
    }

    int getSum() const { return sum; }
    int getCount() const { return count; }
    double getAverage() const {
        return count > 0 ? static_cast<double>(sum) / count : 0.0;
    }
};

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // for_each 返回最终的函数对象
    Accumulator acc = std::for_each(numbers.begin(), numbers.end(), Accumulator());

    std::cout << "总和: " << acc.getSum() << std::endl;       // 55
    std::cout << "数量: " << acc.getCount() << std::endl;     // 10
    std::cout << "平均: " << acc.getAverage() << std::endl;   // 5.5

    return 0;
}
```

## 核心要点

### STL 中的标准函数对象

STL 在 `<functional>` 头文件中提供了一系列标准函数对象：

```cpp
#include <functional>
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3};

    // 算术运算函数对象
    std::plus<int> add;
    std::minus<int> subtract;
    std::multiplies<int> multiply;
    std::divides<int> divide;
    std::modulus<int> mod;
    std::negate<int> neg;

    std::cout << "加法: " << add(10, 5) << std::endl;       // 15
    std::cout << "减法: " << subtract(10, 5) << std::endl;  // 5
    std::cout << "乘法: " << multiply(10, 5) << std::endl;  // 50
    std::cout << "除法: " << divide(10, 5) << std::endl;    // 2
    std::cout << "取模: " << mod(10, 3) << std::endl;       // 1
    std::cout << "取负: " << neg(10) << std::endl;          // -10

    // 比较运算函数对象
    std::less<int> lt;
    std::greater<int> gt;
    std::less_equal<int> lte;
    std::greater_equal<int> gte;
    std::equal_to<int> eq;
    std::not_equal_to<int> neq;

    std::cout << "小于: " << lt(5, 10) << std::endl;     // 1
    std::cout << "大于: " << gt(5, 10) << std::endl;     // 0

    // 逻辑运算函数对象
    std::logical_and<bool> land;
    std::logical_or<bool> lor;
    std::logical_not<bool> lnot;

    std::cout << "逻辑与: " << land(true, false) << std::endl;  // 0
    std::cout << "逻辑或: " << lor(true, false) << std::endl;   // 1
    std::cout << "逻辑非: " << lnot(true) << std::endl;         // 0

    // 使用标准函数对象进行排序
    std::sort(vec.begin(), vec.end(), std::greater<int>());  // 降序排序

    std::cout << "降序排列: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;  // 9 8 5 3 2 1

    // 使用标准函数对象进行累积
    int product = std::accumulate(vec.begin(), vec.end(), 1, std::multiplies<int>());
    std::cout << "乘积: " << product << std::endl;  // 2160

    return 0;
}
```

### 透明运算符 (C++14)

C++14 引入了透明运算符（Transparent Operators），允许使用 `void` 作为模板参数，避免类型转换：

```cpp
#include <functional>
#include <set>
#include <string>
#include <iostream>

int main() {
    // C++14 透明比较器
    std::set<std::string, std::less<>> strings = {"apple", "banana", "cherry"};

    // 可以直接用 const char* 查找，无需转换为 std::string
    auto it = strings.find("banana");  // 不会创建临时 std::string
    if (it != strings.end()) {
        std::cout << "找到: " << *it << std::endl;
    }

    // 透明算术运算符
    std::plus<> add;  // 可以处理不同类型
    std::cout << add(1, 2.5) << std::endl;  // 3.5

    return 0;
}
```

### 谓词 (Predicates)

谓词是返回布尔值的函数对象，在 STL 算法中广泛使用：

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>

// 一元谓词：接受一个参数
class IsEven {
public:
    bool operator()(int x) const {
        return x % 2 == 0;
    }
};

// 参数化的一元谓词
class GreaterThan {
private:
    int threshold;
public:
    GreaterThan(int t) : threshold(t) {}

    bool operator()(int x) const {
        return x > threshold;
    }
};

// 二元谓词：接受两个参数
class StringLengthCompare {
public:
    bool operator()(const std::string& a, const std::string& b) const {
        return a.length() < b.length();
    }
};

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // 使用一元谓词
    int evenCount = std::count_if(numbers.begin(), numbers.end(), IsEven());
    std::cout << "偶数个数: " << evenCount << std::endl;  // 5

    // 使用参数化谓词
    int greaterThan5 = std::count_if(numbers.begin(), numbers.end(), GreaterThan(5));
    std::cout << "大于5的个数: " << greaterThan5 << std::endl;  // 5

    // 使用谓词进行分区
    std::vector<int> nums = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    std::partition(nums.begin(), nums.end(), IsEven());

    std::cout << "分区后: ";
    for (int x : nums) std::cout << x << " ";
    std::cout << std::endl;  // 偶数在前，奇数在后

    // 使用二元谓词排序
    std::vector<std::string> words = {"a", "bbb", "cc", "dddd", "eeeee"};
    std::sort(words.begin(), words.end(), StringLengthCompare());

    std::cout << "按长度排序: ";
    for (const auto& w : words) std::cout << w << " ";
    std::cout << std::endl;  // a cc bbb dddd eeeee

    return 0;
}
```

### 函数对象适配器

STL 提供了函数对象适配器来组合和修改函数对象的行为：

```cpp
#include <functional>
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // std::not_fn (C++17) - 取反
    auto isOdd = std::not_fn(std::modulus<int>());  // 不被2整除
    // 注意：这个用法需要更复杂的组合，下面用lambda演示

    auto isEven = [](int x) { return x % 2 == 0; };
    auto isNotEven = std::not_fn(isEven);

    int oddCount = std::count_if(numbers.begin(), numbers.end(), isNotEven);
    std::cout << "奇数个数: " << oddCount << std::endl;  // 5

    return 0;
}
```

## 代码示例

### 基础函数对象

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

// 比较器函数对象
template<typename T>
class DescendingOrder {
public:
    bool operator()(const T& a, const T& b) const {
        return a > b;
    }
};

// 变换器函数对象
class CelsiusToFahrenheit {
public:
    double operator()(double celsius) const {
        return celsius * 9.0 / 5.0 + 32.0;
    }
};

// 过滤器函数对象
class InRange {
private:
    int min, max;
public:
    InRange(int mi, int ma) : min(mi), max(ma) {}

    bool operator()(int x) const {
        return x >= min && x <= max;
    }
};

int main() {
    // 使用比较器排序
    std::vector<int> numbers = {5, 2, 8, 1, 9};
    std::sort(numbers.begin(), numbers.end(), DescendingOrder<int>());

    std::cout << "降序: ";
    for (int x : numbers) std::cout << x << " ";
    std::cout << std::endl;  // 9 8 5 2 1

    // 使用变换器转换
    std::vector<double> celsius = {0, 20, 37, 100};
    std::vector<double> fahrenheit(celsius.size());
    std::transform(celsius.begin(), celsius.end(),
                   fahrenheit.begin(), CelsiusToFahrenheit());

    std::cout << "华氏温度: ";
    for (double f : fahrenheit) std::cout << f << " ";
    std::cout << std::endl;  // 32 68 98.6 212

    // 使用过滤器
    numbers = {1, 5, 10, 15, 20, 25, 30};
    std::vector<int> filtered;
    std::copy_if(numbers.begin(), numbers.end(),
                 std::back_inserter(filtered), InRange(10, 25));

    std::cout << "10-25范围内: ";
    for (int x : filtered) std::cout << x << " ";
    std::cout << std::endl;  // 10 15 20 25

    return 0;
}
```

### std::function 详解

`std::function` 是一个通用的函数包装器，可以存储、复制和调用任何可调用目标：

```cpp
#include <functional>
#include <iostream>
#include <vector>
#include <string>

// 普通函数
int add(int a, int b) {
    return a + b;
}

// 函数对象类
class Multiplier {
private:
    int factor;
public:
    Multiplier(int f) : factor(f) {}

    int operator()(int x) const {
        return x * factor;
    }
};

// 类成员函数
class Calculator {
public:
    int subtract(int a, int b) const {
        return a - b;
    }

    static int divide(int a, int b) {
        return a / b;
    }
};

int main() {
    // 1. 包装普通函数
    std::function<int(int, int)> func1 = add;
    std::cout << "普通函数: " << func1(5, 3) << std::endl;  // 8

    // 2. 包装函数对象
    std::function<int(int)> func2 = Multiplier(3);
    std::cout << "函数对象: " << func2(4) << std::endl;  // 12

    // 3. 包装 Lambda
    std::function<int(int, int)> func3 = [](int a, int b) {
        return a * b;
    };
    std::cout << "Lambda: " << func3(4, 5) << std::endl;  // 20

    // 4. 包装成员函数
    Calculator calc;
    std::function<int(const Calculator&, int, int)> func4 = &Calculator::subtract;
    std::cout << "成员函数: " << func4(calc, 10, 3) << std::endl;  // 7

    // 5. 包装静态成员函数
    std::function<int(int, int)> func5 = &Calculator::divide;
    std::cout << "静态成员函数: " << func5(20, 4) << std::endl;  // 5

    // 6. 使用 std::function 作为回调
    std::vector<std::function<int(int, int)>> operations = {
        add,
        [](int a, int b) { return a - b; },
        [](int a, int b) { return a * b; },
        &Calculator::divide
    };

    int a = 12, b = 4;
    std::cout << "\n对 " << a << " 和 " << b << " 执行操作:" << std::endl;
    for (const auto& op : operations) {
        std::cout << op(a, b) << " ";  // 16 8 48 3
    }
    std::cout << std::endl;

    // 7. 检查 std::function 是否为空
    std::function<void()> emptyFunc;
    if (!emptyFunc) {
        std::cout << "函数为空" << std::endl;
    }

    emptyFunc = []() { std::cout << "现在不为空了" << std::endl; };
    if (emptyFunc) {
        emptyFunc();
    }

    return 0;
}
```

### std::bind 详解

`std::bind` 用于绑定函数参数，创建新的可调用对象：

```cpp
#include <functional>
#include <iostream>
#include <string>
#include <algorithm>
#include <vector>

using namespace std::placeholders;  // _1, _2, _3...

int add(int a, int b) {
    return a + b;
}

int subtract(int a, int b) {
    return a - b;
}

void printInfo(const std::string& name, int age, const std::string& city) {
    std::cout << name << ", " << age << "岁, 来自" << city << std::endl;
}

class TextProcessor {
public:
    std::string concat(const std::string& a, const std::string& b) const {
        return a + b;
    }

    bool startsWith(const std::string& text, const std::string& prefix) const {
        return text.find(prefix) == 0;
    }
};

int main() {
    // 1. 绑定部分参数
    auto add5 = std::bind(add, _1, 5);  // 第二个参数固定为5
    std::cout << "10 + 5 = " << add5(10) << std::endl;  // 15

    // 2. 绑定第一个参数
    auto subtractFrom100 = std::bind(subtract, 100, _1);
    std::cout << "100 - 30 = " << subtractFrom100(30) << std::endl;  // 70

    // 3. 重排参数顺序
    auto reverseSubtract = std::bind(subtract, _2, _1);
    std::cout << "逆序相减(5, 10): " << reverseSubtract(5, 10) << std::endl;  // 5

    // 4. 绑定多个参数
    auto printTom = std::bind(printInfo, "Tom", _1, "北京");
    printTom(25);  // Tom, 25岁, 来自北京

    auto printLiInShanghai = std::bind(printInfo, _1, 30, "上海");
    printLiInShanghai("李明");  // 李明, 30岁, 来自上海

    // 5. 绑定成员函数
    TextProcessor processor;

    // 绑定对象和成员函数
    auto concat = std::bind(&TextProcessor::concat, &processor, _1, _2);
    std::cout << concat("Hello, ", "World!") << std::endl;

    // 绑定对象和部分参数
    auto startsWithHello = std::bind(&TextProcessor::startsWith,
                                      &processor, _1, "Hello");
    std::cout << std::boolalpha;
    std::cout << "\"Hello World\" 以 Hello 开头: "
              << startsWithHello("Hello World") << std::endl;  // true
    std::cout << "\"Hi World\" 以 Hello 开头: "
              << startsWithHello("Hi World") << std::endl;      // false

    // 6. 在算法中使用 bind
    std::vector<int> numbers = {1, 5, 10, 15, 20, 25};

    // 统计大于10的元素个数
    int count = std::count_if(numbers.begin(), numbers.end(),
                               std::bind(std::greater<int>(), _1, 10));
    std::cout << "大于10的元素个数: " << count << std::endl;  // 3

    // 7. 嵌套 bind
    // 计算 (a + b) * 2
    auto addThenDouble = std::bind(std::multiplies<int>(),
                                    std::bind(add, _1, _2), 2);
    std::cout << "(3 + 4) * 2 = " << addThenDouble(3, 4) << std::endl;  // 14

    // 8. 引用参数
    int counter = 0;
    auto incrementCounter = std::bind([](int& c) { ++c; }, std::ref(counter));

    incrementCounter();
    incrementCounter();
    incrementCounter();
    std::cout << "计数器: " << counter << std::endl;  // 3

    return 0;
}
```

### Lambda vs 函数对象

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>

// 传统函数对象
class Counter {
private:
    mutable int count = 0;  // mutable 允许在 const 成员函数中修改

public:
    void operator()(int) const {
        ++count;
    }

    int getCount() const { return count; }

    void reset() { count = 0; }
};

class Multiplier {
private:
    int factor;

public:
    explicit Multiplier(int f) : factor(f) {}

    int operator()(int x) const {
        return x * factor;
    }
};

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};

    // ========== 函数对象方式 ==========
    std::cout << "=== 函数对象方式 ===" << std::endl;

    // 使用函数对象计数
    Counter counter;
    counter = std::for_each(numbers.begin(), numbers.end(), counter);
    std::cout << "元素个数: " << counter.getCount() << std::endl;

    // 使用函数对象变换
    std::vector<int> doubled(numbers.size());
    std::transform(numbers.begin(), numbers.end(),
                   doubled.begin(), Multiplier(2));

    std::cout << "翻倍: ";
    for (int x : doubled) std::cout << x << " ";
    std::cout << std::endl;

    // ========== Lambda 方式 ==========
    std::cout << "\n=== Lambda 方式 ===" << std::endl;

    // Lambda 计数
    int lambdaCount = 0;
    std::for_each(numbers.begin(), numbers.end(),
                  [&lambdaCount](int) { ++lambdaCount; });
    std::cout << "元素个数: " << lambdaCount << std::endl;

    // Lambda 变换
    int factor = 2;
    std::vector<int> lambdaDoubled(numbers.size());
    std::transform(numbers.begin(), numbers.end(),
                   lambdaDoubled.begin(),
                   [factor](int x) { return x * factor; });

    std::cout << "翻倍: ";
    for (int x : lambdaDoubled) std::cout << x << " ";
    std::cout << std::endl;

    // ========== 复杂场景对比 ==========
    std::cout << "\n=== 复杂场景 ===" << std::endl;

    // 函数对象可以被复用和测试
    Multiplier tripler(3);

    std::vector<int> tripled(numbers.size());
    std::transform(numbers.begin(), numbers.end(),
                   tripled.begin(), tripler);

    // 同一个对象可以多次使用
    std::transform(tripled.begin(), tripled.end(),
                   tripled.begin(), tripler);  // 再乘以3

    std::cout << "9倍: ";
    for (int x : tripled) std::cout << x << " ";
    std::cout << std::endl;

    // Lambda 需要存储才能复用
    auto multiplier = [](int x, int f) { return x * f; };
    auto times4 = [&multiplier](int x) { return multiplier(x, 4); };

    std::vector<int> quadrupled(numbers.size());
    std::transform(numbers.begin(), numbers.end(),
                   quadrupled.begin(), times4);

    std::cout << "4倍: ";
    for (int x : quadrupled) std::cout << x << " ";
    std::cout << std::endl;

    return 0;
}
```

### STL 算法与谓词

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <numeric>

// 员工结构
struct Employee {
    std::string name;
    int age;
    double salary;
    std::string department;
};

// 各种谓词函数对象
class InDepartment {
private:
    std::string dept;
public:
    InDepartment(const std::string& d) : dept(d) {}

    bool operator()(const Employee& e) const {
        return e.department == dept;
    }
};

class SalaryAbove {
private:
    double threshold;
public:
    SalaryAbove(double t) : threshold(t) {}

    bool operator()(const Employee& e) const {
        return e.salary > threshold;
    }
};

class AgeInRange {
private:
    int minAge, maxAge;
public:
    AgeInRange(int mi, int ma) : minAge(mi), maxAge(ma) {}

    bool operator()(const Employee& e) const {
        return e.age >= minAge && e.age <= maxAge;
    }
};

// 比较器
class CompareBySalary {
public:
    bool operator()(const Employee& a, const Employee& b) const {
        return a.salary > b.salary;  // 降序
    }
};

class CompareByAge {
public:
    bool operator()(const Employee& a, const Employee& b) const {
        return a.age < b.age;  // 升序
    }
};

int main() {
    std::vector<Employee> employees = {
        {"张三", 28, 15000, "研发"},
        {"李四", 35, 25000, "研发"},
        {"王五", 42, 30000, "管理"},
        {"赵六", 25, 12000, "市场"},
        {"钱七", 30, 18000, "研发"},
        {"孙八", 38, 22000, "市场"},
        {"周九", 45, 35000, "管理"},
        {"吴十", 27, 14000, "研发"}
    };

    // 1. 统计研发部员工数量
    int devCount = std::count_if(employees.begin(), employees.end(),
                                  InDepartment("研发"));
    std::cout << "研发部员工数: " << devCount << std::endl;

    // 2. 查找工资超过20000的员工
    std::cout << "\n工资超过20000的员工:" << std::endl;
    std::vector<Employee> highPaid;
    std::copy_if(employees.begin(), employees.end(),
                 std::back_inserter(highPaid), SalaryAbove(20000));

    for (const auto& e : highPaid) {
        std::cout << "  " << e.name << ": " << e.salary << std::endl;
    }

    // 3. 按工资排序
    std::vector<Employee> sorted = employees;
    std::sort(sorted.begin(), sorted.end(), CompareBySalary());

    std::cout << "\n按工资降序排列:" << std::endl;
    for (const auto& e : sorted) {
        std::cout << "  " << e.name << ": " << e.salary << std::endl;
    }

    // 4. 查找25-35岁的员工
    std::cout << "\n25-35岁的员工:" << std::endl;
    for (const auto& e : employees) {
        if (AgeInRange(25, 35)(e)) {
            std::cout << "  " << e.name << ": " << e.age << "岁" << std::endl;
        }
    }

    // 5. 检查是否所有研发部员工工资都超过10000
    std::vector<Employee> devEmployees;
    std::copy_if(employees.begin(), employees.end(),
                 std::back_inserter(devEmployees), InDepartment("研发"));

    bool allAbove10k = std::all_of(devEmployees.begin(), devEmployees.end(),
                                    SalaryAbove(10000));
    std::cout << "\n研发部员工工资都超过10000: "
              << (allAbove10k ? "是" : "否") << std::endl;

    // 6. 计算总工资（使用带状态的函数对象）
    class SalarySum {
    public:
        double operator()(double sum, const Employee& e) const {
            return sum + e.salary;
        }
    };

    double totalSalary = std::accumulate(employees.begin(), employees.end(),
                                          0.0, SalarySum());
    std::cout << "\n总工资: " << totalSalary << std::endl;

    // 7. 分区：将高工资员工放在前面
    std::vector<Employee> partitioned = employees;
    auto partition_point = std::partition(partitioned.begin(), partitioned.end(),
                                           SalaryAbove(18000));

    std::cout << "\n高工资员工 (>18000):" << std::endl;
    for (auto it = partitioned.begin(); it != partition_point; ++it) {
        std::cout << "  " << it->name << ": " << it->salary << std::endl;
    }

    return 0;
}
```

## 最佳实践

### 选择合适的可调用类型

```cpp
#include <functional>
#include <iostream>

// 1. 简单的一次性操作 -> Lambda
void lambdaExample() {
    auto result = [](int x) { return x * 2; }(5);
    std::cout << result << std::endl;
}

// 2. 需要复用的逻辑 -> 函数对象类
class ReuseableOperation {
    int factor;
public:
    ReuseableOperation(int f) : factor(f) {}
    int operator()(int x) const { return x * factor; }
};

// 3. 需要类型擦除（存储不同类型的可调用对象）-> std::function
void storeCallables() {
    std::vector<std::function<int(int)>> operations;
    operations.push_back([](int x) { return x + 1; });
    operations.push_back(ReuseableOperation(2));
    operations.push_back([](int x) { return x * x; });
}

// 4. 需要绑定参数 -> std::bind 或 Lambda
void bindExample() {
    // 优先使用 Lambda（更清晰，性能更好）
    auto add5_lambda = [](int x) { return x + 5; };

    // std::bind 用于复杂的参数重排或成员函数绑定
    auto add5_bind = std::bind(std::plus<int>(), std::placeholders::_1, 5);
}
```

### 保持函数对象的小型化

```cpp
#include <iostream>
#include <string>

// 不好：函数对象过于复杂
class BadFunctor {
    std::string largeData;
    std::vector<int> moreData;
    // ... 大量成员变量

public:
    // 复杂的构造函数
    // 复杂的 operator()
};

// 好：保持函数对象简单
class GoodFunctor {
    int threshold;

public:
    explicit GoodFunctor(int t) : threshold(t) {}

    bool operator()(int x) const {
        return x > threshold;
    }
};

// 如果需要复杂逻辑，考虑存储引用或指针
class ComplexLogicFunctor {
    const std::vector<int>& data;  // 存储引用，避免复制

public:
    explicit ComplexLogicFunctor(const std::vector<int>& d) : data(d) {}

    bool operator()(int x) const {
        // 使用 data 进行复杂判断
        return std::find(data.begin(), data.end(), x) != data.end();
    }
};
```

### 正确使用 const

```cpp
#include <iostream>
#include <algorithm>
#include <vector>

// 好：operator() 声明为 const（当不需要修改状态时）
class GoodConstFunctor {
    int value;
public:
    GoodConstFunctor(int v) : value(v) {}

    int operator()(int x) const {  // const 成员函数
        return x + value;
    }
};

// 需要修改状态时，使用 mutable
class StatefulFunctor {
    mutable int callCount = 0;  // mutable 允许在 const 函数中修改

public:
    void operator()(int x) const {
        ++callCount;
        std::cout << "第 " << callCount << " 次调用，参数: " << x << std::endl;
    }

    int getCallCount() const { return callCount; }
};

int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5};

    StatefulFunctor counter;
    counter = std::for_each(nums.begin(), nums.end(), counter);

    std::cout << "总调用次数: " << counter.getCallCount() << std::endl;

    return 0;
}
```

### 考虑性能影响

```cpp
#include <functional>
#include <iostream>
#include <chrono>
#include <vector>

// 直接使用函数对象（编译器可以内联）
struct DirectFunctor {
    int operator()(int x) const { return x * 2; }
};

// 使用 std::function（有运行时开销）
void comparePerformance() {
    const int iterations = 10000000;
    std::vector<int> data(1000, 1);

    // 方法1：直接使用函数对象（最快）
    auto start1 = std::chrono::high_resolution_clock::now();
    DirectFunctor functor;
    for (int i = 0; i < iterations; ++i) {
        for (auto& x : data) x = functor(x);
    }
    auto end1 = std::chrono::high_resolution_clock::now();

    // 方法2：使用 std::function（有开销）
    std::fill(data.begin(), data.end(), 1);
    auto start2 = std::chrono::high_resolution_clock::now();
    std::function<int(int)> func = [](int x) { return x * 2; };
    for (int i = 0; i < iterations; ++i) {
        for (auto& x : data) x = func(x);
    }
    auto end2 = std::chrono::high_resolution_clock::now();

    auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(end1 - start1);
    auto duration2 = std::chrono::duration_cast<std::chrono::milliseconds>(end2 - start2);

    std::cout << "直接函数对象: " << duration1.count() << "ms" << std::endl;
    std::cout << "std::function: " << duration2.count() << "ms" << std::endl;
}
```

## 常见陷阱

### std::function 的性能开销

```cpp
#include <functional>
#include <iostream>

// 陷阱：不必要地使用 std::function
template<typename F>
void processWithFunction(std::function<int(int)> f, int x) {
    // std::function 有类型擦除开销
    std::cout << f(x) << std::endl;
}

// 改进：使用模板参数
template<typename F>
void processWithTemplate(F&& f, int x) {
    // 编译器可以内联，没有额外开销
    std::cout << f(x) << std::endl;
}

int main() {
    auto lambda = [](int x) { return x * 2; };

    // 有开销
    processWithFunction(lambda, 5);

    // 无开销
    processWithTemplate(lambda, 5);

    return 0;
}
```

### std::bind 的陷阱

```cpp
#include <functional>
#include <iostream>

using namespace std::placeholders;

void print(int a, int b, int c) {
    std::cout << a << ", " << b << ", " << c << std::endl;
}

int main() {
    // 陷阱1：参数默认按值传递
    int x = 10;
    auto bound = std::bind(print, x, _1, _2);
    x = 20;  // 修改 x 不会影响 bound
    bound(2, 3);  // 输出: 10, 2, 3（不是 20）

    // 解决：使用 std::ref
    x = 10;
    auto boundRef = std::bind(print, std::ref(x), _1, _2);
    x = 20;
    boundRef(2, 3);  // 输出: 20, 2, 3

    // 陷阱2：嵌套 bind 可能不按预期工作
    auto nested = std::bind(print, std::bind(std::plus<int>(), 1, 2), _1, _2);
    nested(4, 5);  // 输出: 3, 4, 5

    // 陷阱3：bind 表达式作为参数
    // 使用 std::bind 时，如果参数本身是 bind 表达式，会被调用
    // 需要使用 std::protect（C++20）或 Lambda 包装

    return 0;
}
```

### 捕获悬空引用

```cpp
#include <functional>
#include <iostream>

std::function<int()> createDangerousFunctor() {
    int localVar = 42;
    // 危险：返回捕获局部变量引用的 lambda
    return [&localVar]() { return localVar; };  // localVar 将被销毁
}

std::function<int()> createSafeFunctor() {
    int localVar = 42;
    // 安全：按值捕获
    return [localVar]() { return localVar; };
}

class DangerousFunctor {
    int& ref;
public:
    DangerousFunctor(int& r) : ref(r) {}
    int operator()() const { return ref; }  // 危险：ref 可能悬空
};

class SafeFunctor {
    int value;
public:
    SafeFunctor(int v) : value(v) {}
    int operator()() const { return value; }  // 安全：按值存储
};

int main() {
    // auto dangerous = createDangerousFunctor();
    // std::cout << dangerous() << std::endl;  // 未定义行为

    auto safe = createSafeFunctor();
    std::cout << safe() << std::endl;  // 正常工作

    return 0;
}
```

### 忘记返回值

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

class Accumulator {
    int sum = 0;
public:
    void operator()(int x) { sum += x; }
    int getSum() const { return sum; }
};

int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5};

    // 陷阱：for_each 使用函数对象的副本
    Accumulator acc;
    std::for_each(nums.begin(), nums.end(), acc);
    std::cout << "错误结果: " << acc.getSum() << std::endl;  // 0，因为 acc 没有被修改

    // 正确：使用 for_each 的返回值
    acc = std::for_each(nums.begin(), nums.end(), Accumulator());
    std::cout << "正确结果: " << acc.getSum() << std::endl;  // 15

    // 或者使用引用包装
    Accumulator acc2;
    std::for_each(nums.begin(), nums.end(), std::ref(acc2));
    std::cout << "引用包装: " << acc2.getSum() << std::endl;  // 15

    return 0;
}
```

## 性能考量

### 内联优化

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>
#include <chrono>

// 函数对象：编译器可以内联
struct InlineFunctor {
    int operator()(int x) const { return x * 2; }
};

// 普通函数：通过指针调用时可能无法内联
int regularFunction(int x) { return x * 2; }

int main() {
    std::vector<int> vec(1000000);
    std::iota(vec.begin(), vec.end(), 0);

    // 测试1：函数对象（通常最快）
    auto start1 = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 100; ++i) {
        std::transform(vec.begin(), vec.end(), vec.begin(), InlineFunctor());
    }
    auto end1 = std::chrono::high_resolution_clock::now();

    // 测试2：Lambda（与函数对象相当）
    auto start2 = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 100; ++i) {
        std::transform(vec.begin(), vec.end(), vec.begin(),
                       [](int x) { return x * 2; });
    }
    auto end2 = std::chrono::high_resolution_clock::now();

    // 测试3：函数指针（可能无法内联）
    auto start3 = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 100; ++i) {
        std::transform(vec.begin(), vec.end(), vec.begin(), regularFunction);
    }
    auto end3 = std::chrono::high_resolution_clock::now();

    // 测试4：std::function（有类型擦除开销）
    std::function<int(int)> func = [](int x) { return x * 2; };
    auto start4 = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 100; ++i) {
        std::transform(vec.begin(), vec.end(), vec.begin(), func);
    }
    auto end4 = std::chrono::high_resolution_clock::now();

    auto d1 = std::chrono::duration_cast<std::chrono::milliseconds>(end1 - start1);
    auto d2 = std::chrono::duration_cast<std::chrono::milliseconds>(end2 - start2);
    auto d3 = std::chrono::duration_cast<std::chrono::milliseconds>(end3 - start3);
    auto d4 = std::chrono::duration_cast<std::chrono::milliseconds>(end4 - start4);

    std::cout << "函数对象: " << d1.count() << "ms" << std::endl;
    std::cout << "Lambda: " << d2.count() << "ms" << std::endl;
    std::cout << "函数指针: " << d3.count() << "ms" << std::endl;
    std::cout << "std::function: " << d4.count() << "ms" << std::endl;

    return 0;
}
```

### 内存分配

```cpp
#include <functional>
#include <iostream>
#include <string>

int main() {
    // 小型 Lambda：可能使用小对象优化（SBO）
    std::function<int(int)> small = [](int x) { return x * 2; };

    // 大型 Lambda：可能需要堆分配
    std::string largeCapture(1000, 'x');
    std::function<int(int)> large = [largeCapture](int x) {
        return x + static_cast<int>(largeCapture.size());
    };

    // 建议：对于性能敏感的代码，避免在热路径中创建 std::function

    return 0;
}
```

## 实战场景

### 回调系统

```cpp
#include <functional>
#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>

class EventSystem {
public:
    using Callback = std::function<void(const std::string&)>;

private:
    std::unordered_map<std::string, std::vector<Callback>> listeners;

public:
    // 注册事件监听器
    void on(const std::string& event, Callback callback) {
        listeners[event].push_back(std::move(callback));
    }

    // 触发事件
    void emit(const std::string& event, const std::string& data = "") {
        if (listeners.find(event) != listeners.end()) {
            for (const auto& callback : listeners[event]) {
                callback(data);
            }
        }
    }

    // 清除事件监听器
    void off(const std::string& event) {
        listeners.erase(event);
    }
};

int main() {
    EventSystem events;

    // 注册监听器
    events.on("login", [](const std::string& user) {
        std::cout << "用户 " << user << " 登录了" << std::endl;
    });

    events.on("login", [](const std::string& user) {
        std::cout << "记录登录日志: " << user << std::endl;
    });

    events.on("logout", [](const std::string& user) {
        std::cout << "用户 " << user << " 登出了" << std::endl;
    });

    // 触发事件
    events.emit("login", "张三");
    events.emit("logout", "李四");

    return 0;
}
```

### 策略模式

```cpp
#include <functional>
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

// 使用函数对象实现策略模式
class DataProcessor {
public:
    using FilterStrategy = std::function<bool(int)>;
    using TransformStrategy = std::function<int(int)>;
    using ReduceStrategy = std::function<int(int, int)>;

private:
    std::vector<int> data;
    FilterStrategy filter;
    TransformStrategy transform;
    ReduceStrategy reduce;

public:
    DataProcessor(std::vector<int> d) : data(std::move(d)) {}

    void setFilter(FilterStrategy f) { filter = std::move(f); }
    void setTransform(TransformStrategy t) { transform = std::move(t); }
    void setReduce(ReduceStrategy r) { reduce = std::move(r); }

    int process() {
        std::vector<int> result;

        // 应用过滤策略
        if (filter) {
            std::copy_if(data.begin(), data.end(),
                        std::back_inserter(result), filter);
        } else {
            result = data;
        }

        // 应用变换策略
        if (transform) {
            std::transform(result.begin(), result.end(),
                          result.begin(), transform);
        }

        // 应用归约策略
        if (reduce && !result.empty()) {
            return std::accumulate(result.begin() + 1, result.end(),
                                   result[0], reduce);
        }

        return result.empty() ? 0 : result[0];
    }
};

int main() {
    DataProcessor processor({1, 2, 3, 4, 5, 6, 7, 8, 9, 10});

    // 设置策略：过滤偶数，平方，求和
    processor.setFilter([](int x) { return x % 2 == 0; });
    processor.setTransform([](int x) { return x * x; });
    processor.setReduce([](int a, int b) { return a + b; });

    int result = processor.process();
    std::cout << "结果: " << result << std::endl;  // 4 + 16 + 36 + 64 + 100 = 220

    return 0;
}
```

### 命令模式

```cpp
#include <functional>
#include <iostream>
#include <vector>
#include <stack>
#include <string>

class CommandManager {
public:
    using Command = std::function<void()>;
    using UndoCommand = std::function<void()>;

private:
    std::stack<UndoCommand> undoStack;
    std::stack<Command> redoStack;

public:
    void execute(Command cmd, UndoCommand undo) {
        cmd();
        undoStack.push(undo);
        // 清空重做栈
        while (!redoStack.empty()) redoStack.pop();
    }

    void undo() {
        if (undoStack.empty()) {
            std::cout << "没有可撤销的操作" << std::endl;
            return;
        }

        auto cmd = undoStack.top();
        undoStack.pop();
        cmd();
        // 撤销操作可以重做
    }

    bool canUndo() const { return !undoStack.empty(); }
};

// 文本编辑器示例
class TextEditor {
private:
    std::string text;
    CommandManager& cmdManager;

public:
    TextEditor(CommandManager& cm) : cmdManager(cm) {}

    void append(const std::string& str) {
        std::string oldText = text;

        cmdManager.execute(
            [this, str]() {
                text += str;
                std::cout << "追加文本: \"" << str << "\"" << std::endl;
            },
            [this, oldText]() {
                text = oldText;
                std::cout << "撤销追加" << std::endl;
            }
        );
    }

    void clear() {
        std::string oldText = text;

        cmdManager.execute(
            [this]() {
                text.clear();
                std::cout << "清空文本" << std::endl;
            },
            [this, oldText]() {
                text = oldText;
                std::cout << "撤销清空" << std::endl;
            }
        );
    }

    void print() const {
        std::cout << "当前文本: \"" << text << "\"" << std::endl;
    }
};

int main() {
    CommandManager cmdManager;
    TextEditor editor(cmdManager);

    editor.append("Hello");
    editor.print();

    editor.append(" World");
    editor.print();

    editor.append("!");
    editor.print();

    std::cout << "\n--- 撤销操作 ---" << std::endl;
    cmdManager.undo();
    editor.print();

    cmdManager.undo();
    editor.print();

    return 0;
}
```

### 延迟计算

```cpp
#include <functional>
#include <iostream>
#include <chrono>
#include <thread>
#include <optional>

template<typename T>
class Lazy {
private:
    std::function<T()> computation;
    mutable std::optional<T> cachedValue;

public:
    explicit Lazy(std::function<T()> comp) : computation(std::move(comp)) {}

    const T& get() const {
        if (!cachedValue) {
            cachedValue = computation();
        }
        return *cachedValue;
    }

    void reset() {
        cachedValue.reset();
    }

    bool isComputed() const {
        return cachedValue.has_value();
    }
};

// 模拟耗时计算
int expensiveComputation() {
    std::cout << "执行耗时计算..." << std::endl;
    std::this_thread::sleep_for(std::chrono::seconds(1));
    return 42;
}

int main() {
    std::cout << "创建延迟计算对象" << std::endl;
    Lazy<int> lazyValue(expensiveComputation);

    std::cout << "延迟对象已创建，但计算尚未执行" << std::endl;
    std::cout << "是否已计算: " << lazyValue.isComputed() << std::endl;

    std::cout << "\n第一次访问值:" << std::endl;
    int value1 = lazyValue.get();
    std::cout << "值: " << value1 << std::endl;

    std::cout << "\n第二次访问值（使用缓存）:" << std::endl;
    int value2 = lazyValue.get();
    std::cout << "值: " << value2 << std::endl;

    return 0;
}
```

## 面试要点

### 常见面试问题

1. **什么是函数对象？与普通函数有什么区别？**
   - 函数对象是重载了 `operator()` 的类对象
   - 可以携带状态
   - 编译器可以内联优化
   - 具有唯一的类类型

2. **std::function 的优缺点是什么？**
   - 优点：类型擦除，可以存储任何可调用对象
   - 缺点：有运行时开销，可能涉及堆分配

3. **std::bind 和 Lambda 如何选择？**
   - Lambda 通常更清晰、性能更好
   - std::bind 在需要复杂参数重排时可能更方便
   - 现代 C++ 推荐优先使用 Lambda

4. **谓词是什么？有哪些类型？**
   - 一元谓词：接受一个参数，返回 bool
   - 二元谓词：接受两个参数，返回 bool
   - 用于 STL 算法中的条件判断和比较

5. **如何避免函数对象的常见陷阱？**
   - 注意引用捕获的生命周期
   - 理解 std::function 的开销
   - 正确处理 for_each 的返回值
   - 在需要修改状态时使用 mutable

### 代码示例题

```cpp
// 面试题：实现一个通用的过滤器函数对象
template<typename Predicate>
class Filter {
private:
    Predicate pred;

public:
    Filter(Predicate p) : pred(std::move(p)) {}

    template<typename Container>
    Container operator()(const Container& input) const {
        Container result;
        std::copy_if(input.begin(), input.end(),
                     std::back_inserter(result), pred);
        return result;
    }
};

// 使用示例
int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    Filter evenFilter([](int x) { return x % 2 == 0; });
    auto evens = evenFilter(nums);

    for (int x : evens) std::cout << x << " ";
    std::cout << std::endl;  // 2 4 6 8 10

    return 0;
}
```

## 延伸阅读

### 官方文档
- [C++ Reference - Function Objects](https://en.cppreference.com/w/cpp/utility/functional)
- [C++ Reference - std::function](https://en.cppreference.com/w/cpp/utility/functional/function)
- [C++ Reference - std::bind](https://en.cppreference.com/w/cpp/utility/functional/bind)

### 经典书籍
- 《Effective Modern C++》- Scott Meyers
  - Item 34: Prefer lambdas to std::bind
  - Item 35: Prefer task-based programming to thread-based
- 《C++ Templates: The Complete Guide》- David Vandevoorde
- 《The C++ Standard Library》- Nicolai Josuttis

### 优质文章
- [Functors in C++](https://www.geeksforgeeks.org/functors-in-cpp/)
- [C++ Function Objects and Lambdas](https://www.learncpp.com/cpp-tutorial/introduction-to-lambdas-anonymous-functions/)
- [std::function Performance](https://blog.demofox.org/2015/02/25/avoiding-the-performance-hazzards-of-stdfunction/)
