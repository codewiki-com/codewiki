---
title: Lambda表达式
description: C++ Lambda表达式完全指南，捕获列表、闭包与函数式编程
track: cpp
section: modern-cpp
difficulty: intermediate
tags:
  - C++
  - Lambda
  - 闭包
  - 函数式编程
status: imported
origin: old/src/content/docs/cpp/lambdas.zh.md
divergence: 0.301
issues: []
legacy:
  category: Cpp
  subcategory: 现代C++
  order: 8
  lastUpdated: 2026-01-07
---

Lambda表达式是C++11引入的一项重要特性，它允许我们在代码中定义匿名函数对象。Lambda极大地简化了回调函数的编写，使代码更加简洁、可读，并为C++带来了强大的函数式编程能力。

## Lambda基本语法

Lambda表达式的完整语法如下：

```cpp
[捕获列表](参数列表) mutable 异常说明 -> 返回类型 { 函数体 }
```

其中，只有捕获列表和函数体是必需的，其他部分都可以省略。

### 最简单的Lambda

```cpp
#include <iostream>

int main() {
    // 最简单的lambda：无捕获、无参数
    auto hello = []() {
        std::cout << "Hello, Lambda!" << std::endl;
    };

    hello();  // 输出: Hello, Lambda!

    // 可以省略空参数列表
    auto world = [] {
        std::cout << "Hello, World!" << std::endl;
    };

    world();  // 输出: Hello, World!

    return 0;
}
```

### 带参数的Lambda

```cpp
#include <iostream>

int main() {
    // 带参数的lambda
    auto add = [](int a, int b) {
        return a + b;
    };

    std::cout << "5 + 3 = " << add(5, 3) << std::endl;  // 输出: 5 + 3 = 8

    // 显式指定返回类型
    auto divide = [](double a, double b) -> double {
        if (b == 0) {
            return 0.0;  // 避免除零错误
        }
        return a / b;
    };

    std::cout << "10 / 3 = " << divide(10, 3) << std::endl;

    return 0;
}
```

## 捕获列表详解

捕获列表是Lambda最核心的特性，它决定了Lambda如何访问外部作用域中的变量。

### 捕获方式总览

| 捕获方式 | 说明 |
|---------|------|
| `[]` | 不捕获任何变量 |
| `[=]` | 按值捕获所有外部变量 |
| `[&]` | 按引用捕获所有外部变量 |
| `[x]` | 按值捕获变量x |
| `[&x]` | 按引用捕获变量x |
| `[=, &x]` | 默认按值捕获，但x按引用捕获 |
| `[&, x]` | 默认按引用捕获，但x按值捕获 |
| `[this]` | 捕获当前对象的this指针 |
| `[*this]` | 按值捕获当前对象（C++17） |

### 按值捕获

```cpp
#include <iostream>

int main() {
    int x = 10;
    int y = 20;

    // 按值捕获x
    auto captureByValue = [x]() {
        std::cout << "x = " << x << std::endl;
        // x = 100;  // 错误！按值捕获的变量默认是const的
    };

    x = 100;  // 修改原变量
    captureByValue();  // 输出: x = 10（捕获的是创建时的值）

    // 按值捕获所有变量
    auto captureAll = [=]() {
        std::cout << "x = " << x << ", y = " << y << std::endl;
    };

    captureAll();  // 输出: x = 100, y = 20

    return 0;
}
```

### 按引用捕获

```cpp
#include <iostream>

int main() {
    int counter = 0;

    // 按引用捕获counter
    auto increment = [&counter]() {
        ++counter;
        std::cout << "Counter: " << counter << std::endl;
    };

    increment();  // 输出: Counter: 1
    increment();  // 输出: Counter: 2
    increment();  // 输出: Counter: 3

    std::cout << "Final counter: " << counter << std::endl;  // 输出: 3

    return 0;
}
```

### 混合捕获

```cpp
#include <iostream>
#include <string>

int main() {
    int id = 1001;
    std::string name = "张三";
    double salary = 8000.0;

    // 默认按值捕获，但salary按引用捕获
    auto giveRaise = [=, &salary]() {
        std::cout << "员工 " << name << " (ID: " << id << ") ";
        salary *= 1.1;  // 可以修改salary
        std::cout << "加薪后工资: " << salary << std::endl;
        // id = 1002;  // 错误！id是按值捕获的
    };

    giveRaise();  // 输出: 员工 张三 (ID: 1001) 加薪后工资: 8800
    std::cout << "实际工资: " << salary << std::endl;  // 输出: 8800

    return 0;
}
```

### 初始化捕获（C++14）

C++14引入了初始化捕获（也称为广义捕获），允许在捕获时创建新变量：

```cpp
#include <iostream>
#include <memory>
#include <string>

int main() {
    // 初始化捕获：创建新变量
    auto lambda1 = [value = 42]() {
        std::cout << "Value: " << value << std::endl;
    };
    lambda1();  // 输出: Value: 42

    // 移动捕获unique_ptr
    auto ptr = std::make_unique<std::string>("Hello");
    auto lambda2 = [p = std::move(ptr)]() {
        std::cout << *p << std::endl;
    };
    lambda2();  // 输出: Hello
    // ptr现在是nullptr

    // 捕获表达式结果
    int x = 10;
    auto lambda3 = [y = x * 2]() {
        std::cout << "y = " << y << std::endl;
    };
    lambda3();  // 输出: y = 20

    return 0;
}
```

## mutable Lambda

默认情况下，按值捕获的变量在Lambda内部是const的。使用`mutable`关键字可以修改按值捕获的变量副本：

```cpp
#include <iostream>

int main() {
    int count = 0;

    // 普通lambda：无法修改按值捕获的变量
    // auto bad = [count]() { count++; };  // 编译错误

    // mutable lambda：可以修改捕获变量的副本
    auto counter = [count]() mutable {
        return ++count;
    };

    std::cout << counter() << std::endl;  // 输出: 1
    std::cout << counter() << std::endl;  // 输出: 2
    std::cout << counter() << std::endl;  // 输出: 3

    // 原变量未被修改
    std::cout << "Original count: " << count << std::endl;  // 输出: 0

    return 0;
}
```

### mutable的实际应用

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5};

    // 生成累加序列
    int sum = 0;
    std::vector<int> cumulative;

    std::for_each(nums.begin(), nums.end(), [sum, &cumulative](int n) mutable {
        sum += n;
        cumulative.push_back(sum);
    });

    std::cout << "累加序列: ";
    for (int n : cumulative) {
        std::cout << n << " ";  // 输出: 1 3 6 10 15
    }
    std::cout << std::endl;

    return 0;
}
```

## 泛型Lambda（C++14）

C++14允许Lambda参数使用`auto`，从而创建泛型Lambda：

```cpp
#include <iostream>
#include <string>
#include <vector>

int main() {
    // 泛型lambda
    auto print = [](const auto& value) {
        std::cout << value << std::endl;
    };

    print(42);           // 输出: 42
    print(3.14);         // 输出: 3.14
    print("Hello");      // 输出: Hello

    // 泛型加法
    auto add = [](auto a, auto b) {
        return a + b;
    };

    std::cout << add(1, 2) << std::endl;              // 输出: 3
    std::cout << add(1.5, 2.5) << std::endl;          // 输出: 4
    std::cout << add(std::string("Hello, "),
                     std::string("World!")) << std::endl;  // 输出: Hello, World!

    return 0;
}
```

### 泛型Lambda与容器

```cpp
#include <iostream>
#include <vector>
#include <list>
#include <algorithm>

int main() {
    // 通用的打印容器函数
    auto printContainer = [](const auto& container, const std::string& name) {
        std::cout << name << ": ";
        for (const auto& elem : container) {
            std::cout << elem << " ";
        }
        std::cout << std::endl;
    };

    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::list<double> lst = {1.1, 2.2, 3.3};

    printContainer(vec, "Vector");  // 输出: Vector: 1 2 3 4 5
    printContainer(lst, "List");    // 输出: List: 1.1 2.2 3.3

    return 0;
}
```

### 模板Lambda（C++20）

C++20进一步增强了泛型Lambda，允许使用模板语法：

```cpp
#include <iostream>
#include <vector>
#include <concepts>

int main() {
    // C++20模板lambda
    auto sum = []<typename T>(const std::vector<T>& vec) {
        T result{};
        for (const auto& elem : vec) {
            result += elem;
        }
        return result;
    };

    std::vector<int> ints = {1, 2, 3, 4, 5};
    std::vector<double> doubles = {1.1, 2.2, 3.3};

    std::cout << "Sum of ints: " << sum(ints) << std::endl;       // 输出: 15
    std::cout << "Sum of doubles: " << sum(doubles) << std::endl; // 输出: 6.6

    // 带约束的模板lambda
    auto addNumbers = []<typename T>(T a, T b) requires std::integral<T> || std::floating_point<T> {
        return a + b;
    };

    std::cout << addNumbers(10, 20) << std::endl;     // 输出: 30
    std::cout << addNumbers(1.5, 2.5) << std::endl;   // 输出: 4

    return 0;
}
```

## constexpr Lambda（C++17）

C++17允许Lambda在编译期求值：

```cpp
#include <iostream>
#include <array>

int main() {
    // constexpr lambda
    constexpr auto square = [](int x) {
        return x * x;
    };

    // 编译期计算
    constexpr int result = square(5);
    static_assert(result == 25, "5的平方应该是25");

    // 用于编译期数组大小
    std::array<int, square(3)> arr;  // 大小为9的数组
    std::cout << "Array size: " << arr.size() << std::endl;

    // 编译期阶乘计算
    constexpr auto factorial = [](int n) {
        int result = 1;
        for (int i = 2; i <= n; ++i) {
            result *= i;
        }
        return result;
    };

    constexpr int fact5 = factorial(5);
    static_assert(fact5 == 120, "5! 应该是 120");
    std::cout << "5! = " << fact5 << std::endl;

    return 0;
}
```

### constexpr Lambda的高级应用

```cpp
#include <iostream>
#include <array>

// 编译期生成斐波那契数列
constexpr auto makeFibonacci = []<std::size_t N>() {
    std::array<int, N> fib{};
    if constexpr (N > 0) fib[0] = 0;
    if constexpr (N > 1) fib[1] = 1;
    for (std::size_t i = 2; i < N; ++i) {
        fib[i] = fib[i-1] + fib[i-2];
    }
    return fib;
};

int main() {
    constexpr auto fib10 = makeFibonacci.operator()<10>();

    std::cout << "前10个斐波那契数: ";
    for (int n : fib10) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    // 输出: 0 1 1 2 3 5 8 13 21 34

    return 0;
}
```

## Lambda与标准算法

Lambda最常见的用途是与STL算法配合使用：

### 排序与比较

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>

struct Person {
    std::string name;
    int age;
    double salary;
};

int main() {
    std::vector<Person> people = {
        {"张三", 30, 8000},
        {"李四", 25, 12000},
        {"王五", 35, 10000},
        {"赵六", 28, 9000}
    };

    // 按年龄排序
    std::sort(people.begin(), people.end(), [](const Person& a, const Person& b) {
        return a.age < b.age;
    });

    std::cout << "按年龄排序:" << std::endl;
    for (const auto& p : people) {
        std::cout << p.name << " - " << p.age << "岁" << std::endl;
    }

    // 按工资降序排序
    std::sort(people.begin(), people.end(), [](const Person& a, const Person& b) {
        return a.salary > b.salary;
    });

    std::cout << "\n按工资排序（降序）:" << std::endl;
    for (const auto& p : people) {
        std::cout << p.name << " - ¥" << p.salary << std::endl;
    }

    return 0;
}
```

### 查找与过滤

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // 查找第一个大于5的元素
    auto it = std::find_if(numbers.begin(), numbers.end(), [](int n) {
        return n > 5;
    });

    if (it != numbers.end()) {
        std::cout << "第一个大于5的数: " << *it << std::endl;  // 输出: 6
    }

    // 统计偶数个数
    int evenCount = std::count_if(numbers.begin(), numbers.end(), [](int n) {
        return n % 2 == 0;
    });
    std::cout << "偶数个数: " << evenCount << std::endl;  // 输出: 5

    // 检查是否所有元素都为正数
    bool allPositive = std::all_of(numbers.begin(), numbers.end(), [](int n) {
        return n > 0;
    });
    std::cout << "全是正数: " << (allPositive ? "是" : "否") << std::endl;

    // 复制偶数到新容器
    std::vector<int> evens;
    std::copy_if(numbers.begin(), numbers.end(), std::back_inserter(evens), [](int n) {
        return n % 2 == 0;
    });

    std::cout << "偶数: ";
    for (int n : evens) {
        std::cout << n << " ";
    }
    std::cout << std::endl;  // 输出: 2 4 6 8 10

    return 0;
}
```

### 变换与累积

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};

    // 变换：每个元素平方
    std::vector<int> squares(numbers.size());
    std::transform(numbers.begin(), numbers.end(), squares.begin(), [](int n) {
        return n * n;
    });

    std::cout << "平方: ";
    for (int n : squares) {
        std::cout << n << " ";
    }
    std::cout << std::endl;  // 输出: 1 4 9 16 25

    // 累积求和
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0, [](int acc, int n) {
        return acc + n;
    });
    std::cout << "总和: " << sum << std::endl;  // 输出: 15

    // 累积求积
    int product = std::accumulate(numbers.begin(), numbers.end(), 1, [](int acc, int n) {
        return acc * n;
    });
    std::cout << "乘积: " << product << std::endl;  // 输出: 120

    // 自定义累积：找最大值
    int maxVal = std::accumulate(numbers.begin(), numbers.end(), numbers[0],
        [](int current, int n) {
            return n > current ? n : current;
        });
    std::cout << "最大值: " << maxVal << std::endl;  // 输出: 5

    return 0;
}
```

## Lambda与闭包

### 理解闭包

Lambda表达式会生成一个匿名的闭包类型。闭包（Closure）是指一个函数对象，它"捕获"了创建时所在作用域的变量：

```cpp
#include <iostream>
#include <functional>

// 返回一个闭包
std::function<int(int)> makeMultiplier(int factor) {
    // factor被捕获，即使makeMultiplier返回后仍然有效
    return [factor](int x) {
        return x * factor;
    };
}

int main() {
    auto double_it = makeMultiplier(2);
    auto triple_it = makeMultiplier(3);

    std::cout << "5 * 2 = " << double_it(5) << std::endl;  // 输出: 10
    std::cout << "5 * 3 = " << triple_it(5) << std::endl;  // 输出: 15

    return 0;
}
```

### 闭包的生命周期

使用引用捕获时要特别注意变量的生命周期：

```cpp
#include <iostream>
#include <functional>

std::function<int()> createDangerousLambda() {
    int local = 42;
    // 危险！返回后local将被销毁
    return [&local]() {
        return local;  // 未定义行为：访问已销毁的变量
    };
}

std::function<int()> createSafeLambda() {
    int local = 42;
    // 安全：按值捕获
    return [local]() {
        return local;
    };
}

int main() {
    // auto dangerous = createDangerousLambda();
    // std::cout << dangerous() << std::endl;  // 未定义行为！

    auto safe = createSafeLambda();
    std::cout << safe() << std::endl;  // 输出: 42，正常工作

    return 0;
}
```

## 递归Lambda

Lambda默认无法递归调用自身，但可以通过以下方式实现：

### 使用std::function

```cpp
#include <iostream>
#include <functional>

int main() {
    // 方法1：使用std::function
    std::function<int(int)> factorial = [&factorial](int n) -> int {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    };

    std::cout << "5! = " << factorial(5) << std::endl;  // 输出: 120

    // 斐波那契数列
    std::function<int(int)> fib = [&fib](int n) -> int {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    };

    std::cout << "Fib(10) = " << fib(10) << std::endl;  // 输出: 55

    return 0;
}
```

### 使用泛型Lambda（C++14）

```cpp
#include <iostream>

int main() {
    // 方法2：使用泛型lambda自引用
    auto factorial = [](auto&& self, int n) -> int {
        if (n <= 1) return 1;
        return n * self(self, n - 1);
    };

    std::cout << "5! = " << factorial(factorial, 5) << std::endl;  // 输出: 120

    return 0;
}
```

### 使用显式this参数（C++23）

```cpp
#include <iostream>

int main() {
    // C++23: 显式this参数
    auto factorial = [](this auto&& self, int n) -> int {
        if (n <= 1) return 1;
        return n * self(n - 1);
    };

    std::cout << "5! = " << factorial(5) << std::endl;  // 输出: 120

    return 0;
}
```

## 类成员中的Lambda

### 捕获this指针

```cpp
#include <iostream>
#include <functional>
#include <vector>

class Counter {
private:
    int count = 0;
    std::string name;

public:
    Counter(const std::string& n) : name(n) {}

    // 捕获this指针
    auto getIncrementer() {
        return [this]() {
            ++count;
            std::cout << name << ": " << count << std::endl;
        };
    }

    // C++17: 按值捕获*this
    auto getSafeIncrementer() {
        return [*this]() mutable {
            ++count;  // 修改的是副本
            std::cout << name << ": " << count << std::endl;
        };
    }

    int getCount() const { return count; }
};

int main() {
    Counter c("计数器");
    auto inc = c.getIncrementer();

    inc();  // 输出: 计数器: 1
    inc();  // 输出: 计数器: 2

    std::cout << "实际计数: " << c.getCount() << std::endl;  // 输出: 2

    return 0;
}
```

## 高级应用场景

### 回调函数

```cpp
#include <iostream>
#include <functional>
#include <vector>

class EventEmitter {
public:
    using Callback = std::function<void(const std::string&)>;

private:
    std::vector<Callback> listeners;

public:
    void on(Callback callback) {
        listeners.push_back(callback);
    }

    void emit(const std::string& event) {
        for (const auto& listener : listeners) {
            listener(event);
        }
    }
};

int main() {
    EventEmitter emitter;

    // 添加事件监听器
    emitter.on([](const std::string& event) {
        std::cout << "监听器1收到事件: " << event << std::endl;
    });

    int eventCount = 0;
    emitter.on([&eventCount](const std::string& event) {
        ++eventCount;
        std::cout << "监听器2: 已收到 " << eventCount << " 个事件" << std::endl;
    });

    emitter.emit("用户登录");
    emitter.emit("数据更新");

    return 0;
}
```

### 延迟执行

```cpp
#include <iostream>
#include <functional>
#include <vector>
#include <chrono>
#include <thread>

class TaskQueue {
private:
    std::vector<std::function<void()>> tasks;

public:
    void addTask(std::function<void()> task) {
        tasks.push_back(task);
    }

    void executeAll() {
        for (const auto& task : tasks) {
            task();
        }
        tasks.clear();
    }
};

int main() {
    TaskQueue queue;

    // 添加延迟执行的任务
    queue.addTask([] {
        std::cout << "任务1: 初始化系统" << std::endl;
    });

    int data = 42;
    queue.addTask([data] {
        std::cout << "任务2: 处理数据 " << data << std::endl;
    });

    queue.addTask([] {
        std::cout << "任务3: 清理资源" << std::endl;
    });

    std::cout << "开始执行任务队列..." << std::endl;
    queue.executeAll();

    return 0;
}
```

### 策略模式

```cpp
#include <iostream>
#include <functional>
#include <vector>
#include <cmath>

class Calculator {
public:
    using Operation = std::function<double(double, double)>;

private:
    Operation operation;

public:
    void setOperation(Operation op) {
        operation = op;
    }

    double calculate(double a, double b) {
        if (operation) {
            return operation(a, b);
        }
        return 0;
    }
};

int main() {
    Calculator calc;

    // 加法策略
    calc.setOperation([](double a, double b) { return a + b; });
    std::cout << "10 + 5 = " << calc.calculate(10, 5) << std::endl;

    // 乘法策略
    calc.setOperation([](double a, double b) { return a * b; });
    std::cout << "10 * 5 = " << calc.calculate(10, 5) << std::endl;

    // 幂运算策略
    calc.setOperation([](double a, double b) { return std::pow(a, b); });
    std::cout << "10 ^ 5 = " << calc.calculate(10, 5) << std::endl;

    return 0;
}
```

### 函数组合

```cpp
#include <iostream>
#include <functional>
#include <string>

// 函数组合器
template<typename F, typename G>
auto compose(F f, G g) {
    return [f, g](auto x) {
        return f(g(x));
    };
}

int main() {
    auto addOne = [](int x) { return x + 1; };
    auto multiplyTwo = [](int x) { return x * 2; };
    auto square = [](int x) { return x * x; };

    // 组合函数: square(multiplyTwo(addOne(x)))
    auto combined = compose(square, compose(multiplyTwo, addOne));

    // (5 + 1) * 2 = 12, 12^2 = 144
    std::cout << "combined(5) = " << combined(5) << std::endl;  // 输出: 144

    // 字符串处理管道
    auto trim = [](std::string s) {
        s.erase(0, s.find_first_not_of(' '));
        s.erase(s.find_last_not_of(' ') + 1);
        return s;
    };

    auto toUpper = [](std::string s) {
        for (char& c : s) c = std::toupper(c);
        return s;
    };

    auto addBrackets = [](std::string s) {
        return "[" + s + "]";
    };

    auto process = compose(addBrackets, compose(toUpper, trim));
    std::cout << process("  hello world  ") << std::endl;  // 输出: [HELLO WORLD]

    return 0;
}
```

## 性能考虑

### Lambda vs std::function

```cpp
#include <iostream>
#include <functional>
#include <chrono>

// Lambda直接使用（编译器可内联）
template<typename F>
void executeTemplate(F func) {
    func();
}

// std::function（有运行时开销）
void executeFunction(std::function<void()> func) {
    func();
}

int main() {
    constexpr int iterations = 10000000;
    int counter = 0;

    auto lambda = [&counter]() { ++counter; };

    // 测试模板方式
    auto start1 = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        executeTemplate(lambda);
    }
    auto end1 = std::chrono::high_resolution_clock::now();

    counter = 0;

    // 测试std::function方式
    auto start2 = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        executeFunction(lambda);
    }
    auto end2 = std::chrono::high_resolution_clock::now();

    auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(end1 - start1);
    auto duration2 = std::chrono::duration_cast<std::chrono::milliseconds>(end2 - start2);

    std::cout << "模板方式: " << duration1.count() << "ms" << std::endl;
    std::cout << "std::function方式: " << duration2.count() << "ms" << std::endl;

    return 0;
}
```

### 捕获的成本

```cpp
#include <iostream>
#include <string>

int main() {
    // 无捕获：最小开销，可转换为函数指针
    auto noCaptureGlobal = [](int x) { return x * 2; };
    int (*funcPtr)(int) = noCaptureGlobal;  // 可以转换为函数指针

    // 按值捕获：需要存储副本
    std::string longString(1000, 'x');
    auto captureByValue = [longString]() {  // 复制1000字符
        return longString.size();
    };

    // 按引用捕获：只存储指针，但要注意生命周期
    auto captureByRef = [&longString]() {  // 只存储一个指针
        return longString.size();
    };

    std::cout << "Lambda sizes:" << std::endl;
    std::cout << "  无捕获: " << sizeof(noCaptureGlobal) << " bytes" << std::endl;
    std::cout << "  按值捕获string: " << sizeof(captureByValue) << " bytes" << std::endl;
    std::cout << "  按引用捕获: " << sizeof(captureByRef) << " bytes" << std::endl;

    return 0;
}
```

## 最佳实践

### 选择合适的捕获方式

```cpp
// 好：明确指定需要捕获的变量
auto good = [&counter, threshold](int x) {
    if (x > threshold) ++counter;
};

// 避免：捕获所有变量（除非确实需要）
auto avoid = [&](int x) {
    // 不清楚捕获了什么
};
```

### 注意引用捕获的生命周期

```cpp
// 危险：返回捕获局部变量引用的lambda
// auto dangerous() {
//     int x = 10;
//     return [&x]() { return x; };  // x将在函数返回后销毁
// }

// 安全：返回按值捕获的lambda
auto safe() {
    int x = 10;
    return [x]() { return x; };
}
```

### 对于简单操作使用Lambda

```cpp
#include <algorithm>
#include <vector>

std::vector<int> nums = {1, 2, 3, 4, 5};

// 好：简单的一行lambda
std::sort(nums.begin(), nums.end(), [](int a, int b) { return a > b; });

// 对于复杂逻辑，考虑使用命名函数
bool complexComparison(int a, int b) {
    // 复杂的比较逻辑...
    return a > b;
}
std::sort(nums.begin(), nums.end(), complexComparison);
```

### 使用初始化捕获移动资源

```cpp
#include <memory>

auto ptr = std::make_unique<int>(42);
// 使用初始化捕获移动unique_ptr
auto lambda = [p = std::move(ptr)]() {
    return *p;
};
```

## 总结

Lambda表达式是现代C++中不可或缺的特性，它使得编写简洁、表达力强的代码成为可能。关键要点：

1. **语法灵活**：从最简单的`[]{}` 到完整的`[捕获](参数) mutable -> 返回类型 {}`
2. **捕获多样**：支持按值、按引用、混合捕获以及初始化捕获
3. **类型安全**：每个Lambda都有唯一的类型，支持模板参数推导
4. **性能优秀**：编译器可以内联Lambda，无需额外的虚函数调用开销
5. **与STL完美配合**：极大简化了算法的使用

随着C++标准的演进（C++14的泛型Lambda、C++17的constexpr Lambda、C++20的模板Lambda），Lambda表达式变得越来越强大，是每个C++开发者必须掌握的核心技能。
