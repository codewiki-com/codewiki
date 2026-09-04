---
title: C# 集合框架
description: 全面学习 C# 集合类型，包括 List、Dictionary、HashSet 和并发集合
track: csharp
section: types-linq
difficulty: intermediate
tags:
  - C#
  - 集合
  - 数据结构
  - 泛型
status: imported
origin: old/src/content/docs/csharp/collections.zh.md
divergence: 0.309
issues: []
legacy:
  category: CSharp
  subcategory: 数据结构
  order: 11
  lastUpdated: 2026-01-07
---

集合是任何编程语言中最重要的数据结构之一。C# 提供了丰富的集合类型，从简单的列表到复杂的并发集合，能够满足各种应用场景的需求。本文将全面介绍 C# 集合框架，包括各种集合类型的特性、使用方法和最佳实践。

## 集合接口体系

在深入学习具体的集合类型之前，我们需要了解 C# 集合框架的接口体系。这些接口定义了集合的基本行为，是理解和使用集合的基础。

### IEnumerable 和 IEnumerator

`IEnumerable<T>` 是所有集合类型的基础接口，它定义了遍历集合的能力：

```csharp
// IEnumerable<T> 接口定义
public interface IEnumerable<T> : IEnumerable
{
    IEnumerator<T> GetEnumerator();
}

// IEnumerator<T> 接口定义
public interface IEnumerator<T> : IEnumerator, IDisposable
{
    T Current { get; }
    bool MoveNext();
    void Reset();
}
```

实现 `IEnumerable<T>` 接口后，集合就可以使用 `foreach` 循环：

```csharp
// 自定义可枚举类型
public class NumberRange : IEnumerable<int>
{
    private readonly int _start;
    private readonly int _end;

    public NumberRange(int start, int end)
    {
        _start = start;
        _end = end;
    }

    public IEnumerator<int> GetEnumerator()
    {
        for (int i = _start; i <= _end; i++)
        {
            yield return i;
        }
    }

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

// 使用
var range = new NumberRange(1, 5);
foreach (int num in range)
{
    Console.WriteLine(num); // 输出 1, 2, 3, 4, 5
}
```

### ICollection 接口

`ICollection<T>` 扩展了 `IEnumerable<T>`，添加了集合的基本操作：

```csharp
public interface ICollection<T> : IEnumerable<T>
{
    int Count { get; }
    bool IsReadOnly { get; }
    void Add(T item);
    void Clear();
    bool Contains(T item);
    void CopyTo(T[] array, int arrayIndex);
    bool Remove(T item);
}
```

### IList 接口

`IList<T>` 提供了索引访问能力：

```csharp
public interface IList<T> : ICollection<T>
{
    T this[int index] { get; set; }
    int IndexOf(T item);
    void Insert(int index, T item);
    void RemoveAt(int index);
}
```

### IDictionary 接口

`IDictionary<TKey, TValue>` 定义了键值对集合的行为：

```csharp
public interface IDictionary<TKey, TValue> : ICollection<KeyValuePair<TKey, TValue>>
{
    TValue this[TKey key] { get; set; }
    ICollection<TKey> Keys { get; }
    ICollection<TValue> Values { get; }
    void Add(TKey key, TValue value);
    bool ContainsKey(TKey key);
    bool Remove(TKey key);
    bool TryGetValue(TKey key, out TValue value);
}
```

### ISet 接口

`ISet<T>` 定义了集合（数学概念）的操作：

```csharp
public interface ISet<T> : ICollection<T>
{
    bool Add(T item);
    void ExceptWith(IEnumerable<T> other);
    void IntersectWith(IEnumerable<T> other);
    bool IsProperSubsetOf(IEnumerable<T> other);
    bool IsProperSupersetOf(IEnumerable<T> other);
    bool IsSubsetOf(IEnumerable<T> other);
    bool IsSupersetOf(IEnumerable<T> other);
    bool Overlaps(IEnumerable<T> other);
    bool SetEquals(IEnumerable<T> other);
    void SymmetricExceptWith(IEnumerable<T> other);
    void UnionWith(IEnumerable<T> other);
}
```

## List\<T\> 动态数组

`List<T>` 是最常用的集合类型，它是一个动态大小的数组，提供了高效的随机访问和灵活的增删操作。

### 基本操作

```csharp
// 创建 List
List<string> fruits = new List<string>();
List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };
List<string> cities = new List<string>(100); // 指定初始容量

// 使用集合表达式（C# 12+）
List<int> nums = [1, 2, 3, 4, 5];

// 添加元素
fruits.Add("苹果");
fruits.Add("香蕉");
fruits.AddRange(new[] { "橙子", "葡萄", "西瓜" });

// 插入元素
fruits.Insert(0, "草莓"); // 在索引 0 处插入
fruits.InsertRange(2, new[] { "樱桃", "蓝莓" });

// 访问元素
string first = fruits[0];
string last = fruits[^1]; // C# 8+ 索引语法

// 修改元素
fruits[0] = "芒果";

// 删除元素
fruits.Remove("香蕉"); // 删除第一个匹配的元素
fruits.RemoveAt(0); // 删除指定索引的元素
fruits.RemoveAll(f => f.StartsWith("蓝")); // 删除所有匹配条件的元素
fruits.RemoveRange(0, 2); // 删除指定范围的元素

// 清空列表
fruits.Clear();
```

### 查找和搜索

```csharp
List<int> numbers = new List<int> { 10, 20, 30, 40, 50, 30, 60 };

// 检查元素是否存在
bool hasThirty = numbers.Contains(30); // true

// 查找索引
int index = numbers.IndexOf(30); // 2（第一个 30 的索引）
int lastIndex = numbers.LastIndexOf(30); // 5（最后一个 30 的索引）

// 二分查找（要求列表已排序）
List<int> sorted = new List<int> { 10, 20, 30, 40, 50 };
int binaryIndex = sorted.BinarySearch(30); // 2

// 查找匹配条件的元素
int found = numbers.Find(n => n > 25); // 30（第一个大于 25 的元素）
int foundLast = numbers.FindLast(n => n > 25); // 60（最后一个大于 25 的元素）
List<int> foundAll = numbers.FindAll(n => n > 25); // [30, 40, 50, 30, 60]

// 查找索引
int foundIndex = numbers.FindIndex(n => n > 25); // 2
int foundLastIndex = numbers.FindLastIndex(n => n > 25); // 6

// 检查条件
bool anyGreaterThan100 = numbers.Exists(n => n > 100); // false
bool allPositive = numbers.TrueForAll(n => n > 0); // true
```

### 排序和转换

```csharp
List<int> numbers = new List<int> { 5, 2, 8, 1, 9, 3 };

// 排序
numbers.Sort(); // 升序排序：[1, 2, 3, 5, 8, 9]
numbers.Sort((a, b) => b.CompareTo(a)); // 降序排序：[9, 8, 5, 3, 2, 1]

// 反转
numbers.Reverse(); // [1, 2, 3, 5, 8, 9]

// 转换为数组
int[] array = numbers.ToArray();

// 转换元素类型
List<string> strings = numbers.ConvertAll(n => n.ToString());

// 对象列表排序
List<Person> people = new List<Person>
{
    new Person { Name = "张三", Age = 30 },
    new Person { Name = "李四", Age = 25 },
    new Person { Name = "王五", Age = 35 }
};

// 按年龄排序
people.Sort((p1, p2) => p1.Age.CompareTo(p2.Age));

// 使用 Comparison<T> 委托
Comparison<Person> byName = (p1, p2) => p1.Name.CompareTo(p2.Name);
people.Sort(byName);
```

### 容量管理

```csharp
List<int> numbers = new List<int>();

// 查看容量和计数
Console.WriteLine($"容量: {numbers.Capacity}"); // 0
Console.WriteLine($"计数: {numbers.Count}"); // 0

// 添加元素后容量会自动扩展
for (int i = 0; i < 10; i++)
{
    numbers.Add(i);
    Console.WriteLine($"Count: {numbers.Count}, Capacity: {numbers.Capacity}");
}
// 输出显示容量按 4, 8, 16... 的规律增长

// 预设容量以提高性能
List<int> largeList = new List<int>(10000);

// 调整容量
numbers.Capacity = 100; // 手动设置容量
numbers.TrimExcess(); // 将容量调整为接近实际元素数量
```

### 切片和范围

```csharp
List<int> numbers = new List<int> { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };

// GetRange 方法
List<int> subset = numbers.GetRange(2, 4); // [2, 3, 4, 5]

// 使用 Range 语法（需要先转换为数组或 Span）
int[] array = numbers.ToArray();
int[] slice = array[2..6]; // [2, 3, 4, 5]

// 使用 LINQ
var linqSlice = numbers.Skip(2).Take(4).ToList(); // [2, 3, 4, 5]
```

## Dictionary\<TKey, TValue\> 字典

`Dictionary<TKey, TValue>` 是基于哈希表实现的键值对集合，提供了接近 O(1) 的查找、添加和删除操作。

### 基本操作

```csharp
// 创建字典
Dictionary<string, int> ages = new Dictionary<string, int>();
Dictionary<string, string> capitals = new Dictionary<string, string>
{
    { "中国", "北京" },
    { "日本", "东京" },
    { "韩国", "首尔" }
};

// 使用索引初始化器
Dictionary<string, int> scores = new Dictionary<string, int>
{
    ["语文"] = 90,
    ["数学"] = 95,
    ["英语"] = 88
};

// 添加元素
ages.Add("张三", 30);
ages["李四"] = 25; // 使用索引器添加或更新

// 访问元素
int zhangAge = ages["张三"]; // 如果键不存在会抛出 KeyNotFoundException

// 安全访问
if (ages.TryGetValue("王五", out int wangAge))
{
    Console.WriteLine($"王五的年龄是 {wangAge}");
}
else
{
    Console.WriteLine("王五不在字典中");
}

// 使用 GetValueOrDefault（.NET Core 2.0+）
int unknownAge = ages.GetValueOrDefault("未知", -1); // 返回 -1

// 检查键是否存在
bool hasZhang = ages.ContainsKey("张三"); // true
bool hasValue30 = ages.ContainsValue(30); // true

// 删除元素
ages.Remove("张三");
ages.Remove("不存在的键", out int removedValue); // 安全删除并获取值

// 清空字典
ages.Clear();
```

### 遍历字典

```csharp
Dictionary<string, int> population = new Dictionary<string, int>
{
    ["北京"] = 21540000,
    ["上海"] = 24280000,
    ["广州"] = 18680000,
    ["深圳"] = 17560000
};

// 遍历键值对
foreach (KeyValuePair<string, int> kvp in population)
{
    Console.WriteLine($"{kvp.Key}: {kvp.Value}");
}

// 使用解构（C# 7+）
foreach (var (city, pop) in population)
{
    Console.WriteLine($"{city}: {pop}");
}

// 只遍历键
foreach (string city in population.Keys)
{
    Console.WriteLine(city);
}

// 只遍历值
foreach (int pop in population.Values)
{
    Console.WriteLine(pop);
}
```

### 字典的高级用法

```csharp
// 使用自定义比较器
Dictionary<string, int> caseInsensitive = new Dictionary<string, int>(
    StringComparer.OrdinalIgnoreCase
);
caseInsensitive["Hello"] = 1;
Console.WriteLine(caseInsensitive["hello"]); // 1

// 复合键
var compositeKey = new Dictionary<(string, int), string>
{
    [("张三", 2024)] = "优秀",
    [("李四", 2024)] = "良好"
};
string result = compositeKey[("张三", 2024)]; // "优秀"

// 嵌套字典
var nestedDict = new Dictionary<string, Dictionary<string, int>>
{
    ["学生A"] = new Dictionary<string, int>
    {
        ["语文"] = 90,
        ["数学"] = 85
    },
    ["学生B"] = new Dictionary<string, int>
    {
        ["语文"] = 88,
        ["数学"] = 92
    }
};

int mathScore = nestedDict["学生A"]["数学"]; // 85

// TryAdd（.NET Core 2.0+）
Dictionary<string, int> dict = new Dictionary<string, int>();
bool added = dict.TryAdd("key1", 100); // true，添加成功
bool addedAgain = dict.TryAdd("key1", 200); // false，键已存在
```

### 字典性能考虑

```csharp
// 初始化容量以避免重新哈希
Dictionary<int, string> largeDict = new Dictionary<int, string>(10000);

// 确保键类型正确实现 GetHashCode 和 Equals
public class Person
{
    public string Id { get; set; }
    public string Name { get; set; }

    public override int GetHashCode()
    {
        return Id?.GetHashCode() ?? 0;
    }

    public override bool Equals(object obj)
    {
        return obj is Person other && Id == other.Id;
    }
}

// 或者实现 IEquatable<T>
public class Product : IEquatable<Product>
{
    public string Sku { get; set; }
    public string Name { get; set; }

    public bool Equals(Product other)
    {
        if (other is null) return false;
        return Sku == other.Sku;
    }

    public override bool Equals(object obj) => Equals(obj as Product);

    public override int GetHashCode() => Sku?.GetHashCode() ?? 0;
}
```

## HashSet\<T\> 哈希集合

`HashSet<T>` 是一个不包含重复元素的集合，基于哈希表实现，提供了高效的集合操作。

### 基本操作

```csharp
// 创建 HashSet
HashSet<int> numbers = new HashSet<int>();
HashSet<string> fruits = new HashSet<string> { "苹果", "香蕉", "橙子" };

// 添加元素（返回是否添加成功）
bool added = numbers.Add(1); // true
bool addedAgain = numbers.Add(1); // false，元素已存在

// 批量添加
int[] moreNumbers = { 2, 3, 4, 5 };
foreach (int n in moreNumbers)
{
    numbers.Add(n);
}

// 检查元素是否存在
bool hasFive = numbers.Contains(5); // true

// 删除元素
bool removed = numbers.Remove(3); // true

// 清空集合
numbers.Clear();
```

### 集合运算

```csharp
HashSet<int> setA = new HashSet<int> { 1, 2, 3, 4, 5 };
HashSet<int> setB = new HashSet<int> { 4, 5, 6, 7, 8 };

// 并集（Union）
HashSet<int> union = new HashSet<int>(setA);
union.UnionWith(setB); // {1, 2, 3, 4, 5, 6, 7, 8}

// 交集（Intersection）
HashSet<int> intersection = new HashSet<int>(setA);
intersection.IntersectWith(setB); // {4, 5}

// 差集（Except）
HashSet<int> difference = new HashSet<int>(setA);
difference.ExceptWith(setB); // {1, 2, 3}

// 对称差集（SymmetricExcept）
HashSet<int> symmetricDiff = new HashSet<int>(setA);
symmetricDiff.SymmetricExceptWith(setB); // {1, 2, 3, 6, 7, 8}

// 集合关系判断
HashSet<int> small = new HashSet<int> { 1, 2, 3 };
HashSet<int> large = new HashSet<int> { 1, 2, 3, 4, 5 };

bool isSubset = small.IsSubsetOf(large); // true
bool isSuperset = large.IsSupersetOf(small); // true
bool isProperSubset = small.IsProperSubsetOf(large); // true
bool overlaps = setA.Overlaps(setB); // true
bool equals = setA.SetEquals(new HashSet<int> { 5, 4, 3, 2, 1 }); // true
```

### 去重应用

```csharp
// 列表去重
List<int> listWithDuplicates = new List<int> { 1, 2, 2, 3, 3, 3, 4, 4, 4, 4 };
List<int> distinctList = new HashSet<int>(listWithDuplicates).ToList();
// 或使用 LINQ
List<int> distinctList2 = listWithDuplicates.Distinct().ToList();

// 对象去重（需要正确实现 GetHashCode 和 Equals）
public class Email : IEquatable<Email>
{
    public string Address { get; set; }

    public bool Equals(Email other)
    {
        if (other is null) return false;
        return string.Equals(Address, other.Address, StringComparison.OrdinalIgnoreCase);
    }

    public override bool Equals(object obj) => Equals(obj as Email);

    public override int GetHashCode() =>
        Address?.ToLowerInvariant().GetHashCode() ?? 0;
}

// 使用
HashSet<Email> uniqueEmails = new HashSet<Email>
{
    new Email { Address = "test@example.com" },
    new Email { Address = "TEST@EXAMPLE.COM" }, // 会被视为重复
    new Email { Address = "other@example.com" }
};
Console.WriteLine(uniqueEmails.Count); // 2
```

### 自定义比较器

```csharp
// 使用自定义比较器
HashSet<string> caseInsensitiveSet = new HashSet<string>(
    StringComparer.OrdinalIgnoreCase
);
caseInsensitiveSet.Add("Hello");
caseInsensitiveSet.Add("HELLO"); // 不会添加
caseInsensitiveSet.Add("hello"); // 不会添加
Console.WriteLine(caseInsensitiveSet.Count); // 1

// 自定义 IEqualityComparer
public class PersonByNameComparer : IEqualityComparer<Person>
{
    public bool Equals(Person x, Person y)
    {
        if (ReferenceEquals(x, y)) return true;
        if (x is null || y is null) return false;
        return x.Name == y.Name;
    }

    public int GetHashCode(Person obj)
    {
        return obj?.Name?.GetHashCode() ?? 0;
    }
}

// 使用自定义比较器
HashSet<Person> peopleByName = new HashSet<Person>(new PersonByNameComparer());
```

## Queue\<T\> 队列

`Queue<T>` 实现了先进先出（FIFO）的数据结构，适用于需要按顺序处理元素的场景。

### 基本操作

```csharp
// 创建队列
Queue<string> taskQueue = new Queue<string>();

// 入队
taskQueue.Enqueue("任务1");
taskQueue.Enqueue("任务2");
taskQueue.Enqueue("任务3");

// 出队
string firstTask = taskQueue.Dequeue(); // "任务1"

// 查看队首元素（不移除）
string nextTask = taskQueue.Peek(); // "任务2"

// 尝试出队（安全方式）
if (taskQueue.TryDequeue(out string task))
{
    Console.WriteLine($"处理任务: {task}");
}

// 尝试查看队首
if (taskQueue.TryPeek(out string peekedTask))
{
    Console.WriteLine($"下一个任务: {peekedTask}");
}

// 检查元素是否存在
bool hasTask3 = taskQueue.Contains("任务3");

// 获取队列大小
int count = taskQueue.Count;

// 清空队列
taskQueue.Clear();
```

### 队列应用示例

```csharp
// 消息处理队列
public class MessageProcessor
{
    private readonly Queue<Message> _messageQueue = new Queue<Message>();

    public void EnqueueMessage(Message message)
    {
        _messageQueue.Enqueue(message);
    }

    public void ProcessMessages()
    {
        while (_messageQueue.Count > 0)
        {
            Message message = _messageQueue.Dequeue();
            ProcessMessage(message);
        }
    }

    private void ProcessMessage(Message message)
    {
        Console.WriteLine($"处理消息: {message.Content}");
    }
}

public class Message
{
    public string Content { get; set; }
    public DateTime Timestamp { get; set; }
}

// 广度优先搜索（BFS）
public List<int> BreadthFirstSearch(TreeNode root)
{
    List<int> result = new List<int>();
    if (root == null) return result;

    Queue<TreeNode> queue = new Queue<TreeNode>();
    queue.Enqueue(root);

    while (queue.Count > 0)
    {
        TreeNode node = queue.Dequeue();
        result.Add(node.Value);

        if (node.Left != null) queue.Enqueue(node.Left);
        if (node.Right != null) queue.Enqueue(node.Right);
    }

    return result;
}
```

## Stack\<T\> 栈

`Stack<T>` 实现了后进先出（LIFO）的数据结构，适用于需要反向处理或撤销操作的场景。

### 基本操作

```csharp
// 创建栈
Stack<int> stack = new Stack<int>();

// 压栈
stack.Push(1);
stack.Push(2);
stack.Push(3);

// 出栈
int top = stack.Pop(); // 3

// 查看栈顶元素（不移除）
int peek = stack.Peek(); // 2

// 尝试出栈（安全方式）
if (stack.TryPop(out int value))
{
    Console.WriteLine($"出栈: {value}");
}

// 尝试查看栈顶
if (stack.TryPeek(out int peekedValue))
{
    Console.WriteLine($"栈顶: {peekedValue}");
}

// 检查元素是否存在
bool hasOne = stack.Contains(1);

// 获取栈大小
int count = stack.Count;

// 清空栈
stack.Clear();
```

### 栈应用示例

```csharp
// 撤销/重做功能
public class UndoRedoManager<T>
{
    private readonly Stack<T> _undoStack = new Stack<T>();
    private readonly Stack<T> _redoStack = new Stack<T>();
    private T _currentState;

    public UndoRedoManager(T initialState)
    {
        _currentState = initialState;
    }

    public void Execute(T newState)
    {
        _undoStack.Push(_currentState);
        _currentState = newState;
        _redoStack.Clear(); // 执行新操作时清空重做栈
    }

    public bool CanUndo => _undoStack.Count > 0;
    public bool CanRedo => _redoStack.Count > 0;

    public T Undo()
    {
        if (!CanUndo) throw new InvalidOperationException("没有可撤销的操作");
        _redoStack.Push(_currentState);
        _currentState = _undoStack.Pop();
        return _currentState;
    }

    public T Redo()
    {
        if (!CanRedo) throw new InvalidOperationException("没有可重做的操作");
        _undoStack.Push(_currentState);
        _currentState = _redoStack.Pop();
        return _currentState;
    }

    public T CurrentState => _currentState;
}

// 括号匹配验证
public bool IsValidParentheses(string s)
{
    Stack<char> stack = new Stack<char>();
    Dictionary<char, char> pairs = new Dictionary<char, char>
    {
        { ')', '(' },
        { ']', '[' },
        { '}', '{' }
    };

    foreach (char c in s)
    {
        if (c == '(' || c == '[' || c == '{')
        {
            stack.Push(c);
        }
        else if (pairs.ContainsKey(c))
        {
            if (stack.Count == 0 || stack.Pop() != pairs[c])
            {
                return false;
            }
        }
    }

    return stack.Count == 0;
}

// 表达式求值（后缀表达式）
public int EvaluatePostfix(string[] tokens)
{
    Stack<int> stack = new Stack<int>();

    foreach (string token in tokens)
    {
        if (int.TryParse(token, out int num))
        {
            stack.Push(num);
        }
        else
        {
            int b = stack.Pop();
            int a = stack.Pop();
            int result = token switch
            {
                "+" => a + b,
                "-" => a - b,
                "*" => a * b,
                "/" => a / b,
                _ => throw new ArgumentException($"未知操作符: {token}")
            };
            stack.Push(result);
        }
    }

    return stack.Pop();
}
```

## LinkedList\<T\> 双向链表

`LinkedList<T>` 是一个双向链表实现，适用于频繁在列表中间插入或删除元素的场景。

### 基本操作

```csharp
// 创建链表
LinkedList<string> list = new LinkedList<string>();

// 在末尾添加
list.AddLast("A");
list.AddLast("B");
list.AddLast("C");

// 在开头添加
list.AddFirst("Z");

// 获取节点
LinkedListNode<string> firstNode = list.First;
LinkedListNode<string> lastNode = list.Last;

// 在指定节点前后插入
LinkedListNode<string> nodeB = list.Find("B");
list.AddBefore(nodeB, "A.5");
list.AddAfter(nodeB, "B.5");

// 遍历链表
foreach (string item in list)
{
    Console.WriteLine(item); // Z, A, A.5, B, B.5, C
}

// 反向遍历
LinkedListNode<string> current = list.Last;
while (current != null)
{
    Console.WriteLine(current.Value);
    current = current.Previous;
}

// 删除节点
list.Remove("B");
list.RemoveFirst();
list.RemoveLast();

// 检查元素是否存在
bool hasA = list.Contains("A");

// 清空链表
list.Clear();
```

### 链表节点操作

```csharp
LinkedList<int> numbers = new LinkedList<int>(new[] { 1, 2, 3, 4, 5 });

// 获取节点
LinkedListNode<int> node = numbers.Find(3);

// 节点导航
Console.WriteLine($"值: {node.Value}"); // 3
Console.WriteLine($"前一个: {node.Previous?.Value}"); // 2
Console.WriteLine($"后一个: {node.Next?.Value}"); // 4
Console.WriteLine($"所属链表: {node.List == numbers}"); // true

// 直接操作节点
LinkedListNode<int> newNode = new LinkedListNode<int>(10);
numbers.AddAfter(node, newNode);

// 删除节点
numbers.Remove(node);
```

### 链表应用示例

```csharp
// LRU 缓存实现
public class LRUCache<TKey, TValue>
{
    private readonly int _capacity;
    private readonly Dictionary<TKey, LinkedListNode<(TKey Key, TValue Value)>> _cache;
    private readonly LinkedList<(TKey Key, TValue Value)> _list;

    public LRUCache(int capacity)
    {
        _capacity = capacity;
        _cache = new Dictionary<TKey, LinkedListNode<(TKey, TValue)>>(capacity);
        _list = new LinkedList<(TKey, TValue)>();
    }

    public TValue Get(TKey key)
    {
        if (_cache.TryGetValue(key, out var node))
        {
            // 移动到链表头部（最近使用）
            _list.Remove(node);
            _list.AddFirst(node);
            return node.Value.Value;
        }
        return default;
    }

    public void Put(TKey key, TValue value)
    {
        if (_cache.TryGetValue(key, out var existingNode))
        {
            // 更新现有节点
            _list.Remove(existingNode);
            existingNode.Value = (key, value);
            _list.AddFirst(existingNode);
        }
        else
        {
            // 检查容量
            if (_cache.Count >= _capacity)
            {
                // 删除最久未使用的（链表尾部）
                var lastNode = _list.Last;
                _list.RemoveLast();
                _cache.Remove(lastNode.Value.Key);
            }

            // 添加新节点
            var newNode = new LinkedListNode<(TKey, TValue)>((key, value));
            _list.AddFirst(newNode);
            _cache[key] = newNode;
        }
    }
}
```

## SortedList\<TKey, TValue\> 和 SortedDictionary\<TKey, TValue\>

这两种集合都维护键的排序顺序，但内部实现不同。

### SortedList

```csharp
// SortedList 基于数组实现，按键排序
SortedList<string, int> sortedList = new SortedList<string, int>
{
    { "Charlie", 3 },
    { "Alice", 1 },
    { "Bob", 2 }
};

// 遍历（按键排序）
foreach (var kvp in sortedList)
{
    Console.WriteLine($"{kvp.Key}: {kvp.Value}");
}
// 输出: Alice: 1, Bob: 2, Charlie: 3

// 通过索引访问
string keyAtIndex = sortedList.Keys[0]; // "Alice"
int valueAtIndex = sortedList.Values[0]; // 1

// 获取键或值的索引
int indexOfBob = sortedList.IndexOfKey("Bob"); // 1
int indexOfValue2 = sortedList.IndexOfValue(2); // 1
```

### SortedDictionary

```csharp
// SortedDictionary 基于红黑树实现
SortedDictionary<string, int> sortedDict = new SortedDictionary<string, int>
{
    { "Charlie", 3 },
    { "Alice", 1 },
    { "Bob", 2 }
};

// 遍历（按键排序）
foreach (var kvp in sortedDict)
{
    Console.WriteLine($"{kvp.Key}: {kvp.Value}");
}

// 注意：SortedDictionary 不支持通过索引访问
```

### 性能对比

| 操作 | SortedList | SortedDictionary |
|------|------------|------------------|
| 插入 | O(n) | O(log n) |
| 删除 | O(n) | O(log n) |
| 查找 | O(log n) | O(log n) |
| 索引访问 | O(1) | 不支持 |
| 内存使用 | 较少 | 较多 |

```csharp
// 选择建议：
// - 数据基本有序或很少修改：使用 SortedList
// - 频繁插入/删除：使用 SortedDictionary
// - 需要索引访问：使用 SortedList
```

## SortedSet\<T\> 有序集合

`SortedSet<T>` 是一个保持元素排序的集合，基于红黑树实现。

```csharp
// 创建有序集合
SortedSet<int> sortedSet = new SortedSet<int> { 5, 2, 8, 1, 9, 3 };

// 遍历（自动排序）
foreach (int num in sortedSet)
{
    Console.WriteLine(num); // 1, 2, 3, 5, 8, 9
}

// 获取最小/最大值
int min = sortedSet.Min; // 1
int max = sortedSet.Max; // 9

// 获取视图
SortedSet<int> view = sortedSet.GetViewBetween(2, 8); // {2, 3, 5, 8}

// 反向枚举
foreach (int num in sortedSet.Reverse())
{
    Console.WriteLine(num); // 9, 8, 5, 3, 2, 1
}

// 自定义比较器（降序）
SortedSet<int> descending = new SortedSet<int>(
    Comparer<int>.Create((a, b) => b.CompareTo(a))
);
descending.Add(1);
descending.Add(5);
descending.Add(3);
// 遍历: 5, 3, 1
```

## 并发集合

`System.Collections.Concurrent` 命名空间提供了线程安全的集合类型，适用于多线程环境。

### ConcurrentDictionary

```csharp
using System.Collections.Concurrent;

ConcurrentDictionary<string, int> concurrentDict =
    new ConcurrentDictionary<string, int>();

// 添加或更新
concurrentDict.TryAdd("key1", 1);
concurrentDict.AddOrUpdate("key1", 1, (key, oldValue) => oldValue + 1);

// 获取或添加
int value = concurrentDict.GetOrAdd("key2", 10);
int value2 = concurrentDict.GetOrAdd("key3", key => ComputeValue(key));

// 尝试获取
if (concurrentDict.TryGetValue("key1", out int result))
{
    Console.WriteLine(result);
}

// 尝试删除
if (concurrentDict.TryRemove("key1", out int removed))
{
    Console.WriteLine($"已删除: {removed}");
}

// 原子更新
concurrentDict.AddOrUpdate(
    "counter",
    1, // 如果不存在，添加值 1
    (key, oldValue) => oldValue + 1 // 如果存在，增加 1
);

static int ComputeValue(string key) => key.Length;
```

### ConcurrentQueue 和 ConcurrentStack

```csharp
// 并发队列
ConcurrentQueue<string> concurrentQueue = new ConcurrentQueue<string>();

// 入队
concurrentQueue.Enqueue("item1");
concurrentQueue.Enqueue("item2");

// 尝试出队
if (concurrentQueue.TryDequeue(out string dequeued))
{
    Console.WriteLine($"出队: {dequeued}");
}

// 尝试查看
if (concurrentQueue.TryPeek(out string peeked))
{
    Console.WriteLine($"队首: {peeked}");
}

// 并发栈
ConcurrentStack<int> concurrentStack = new ConcurrentStack<int>();

// 压栈
concurrentStack.Push(1);
concurrentStack.PushRange(new[] { 2, 3, 4 });

// 尝试出栈
if (concurrentStack.TryPop(out int popped))
{
    Console.WriteLine($"出栈: {popped}");
}

// 批量出栈
int[] items = new int[3];
int count = concurrentStack.TryPopRange(items);
```

### ConcurrentBag

`ConcurrentBag<T>` 是一个无序的线程安全集合，适用于生产者-消费者场景。

```csharp
ConcurrentBag<int> bag = new ConcurrentBag<int>();

// 添加元素
bag.Add(1);
bag.Add(2);
bag.Add(3);

// 尝试取出
if (bag.TryTake(out int taken))
{
    Console.WriteLine($"取出: {taken}");
}

// 尝试查看
if (bag.TryPeek(out int peeked))
{
    Console.WriteLine($"查看: {peeked}");
}

// 检查是否为空
bool isEmpty = bag.IsEmpty;

// 生产者-消费者示例
ConcurrentBag<WorkItem> workItems = new ConcurrentBag<WorkItem>();

// 生产者线程
Task producer = Task.Run(() =>
{
    for (int i = 0; i < 100; i++)
    {
        workItems.Add(new WorkItem { Id = i });
    }
});

// 消费者线程
Task consumer = Task.Run(() =>
{
    while (!workItems.IsEmpty || !producer.IsCompleted)
    {
        if (workItems.TryTake(out WorkItem item))
        {
            ProcessWorkItem(item);
        }
    }
});

Task.WaitAll(producer, consumer);

record WorkItem { public int Id { get; init; } }
static void ProcessWorkItem(WorkItem item) => Console.WriteLine($"处理: {item.Id}");
```

### BlockingCollection

`BlockingCollection<T>` 提供了阻塞和限界功能，是生产者-消费者模式的理想选择。

```csharp
using System.Collections.Concurrent;

// 创建有界阻塞集合
BlockingCollection<int> collection = new BlockingCollection<int>(
    boundedCapacity: 10 // 最大容量
);

// 生产者
Task producer = Task.Run(() =>
{
    for (int i = 0; i < 20; i++)
    {
        collection.Add(i); // 如果已满会阻塞
        Console.WriteLine($"生产: {i}");
    }
    collection.CompleteAdding(); // 标记完成
});

// 消费者
Task consumer = Task.Run(() =>
{
    // 使用 GetConsumingEnumerable 自动处理阻塞和完成
    foreach (int item in collection.GetConsumingEnumerable())
    {
        Console.WriteLine($"消费: {item}");
        Thread.Sleep(100); // 模拟处理时间
    }
});

Task.WaitAll(producer, consumer);

// 超时操作
BlockingCollection<string> messages = new BlockingCollection<string>();

// 尝试添加（带超时）
bool added = messages.TryAdd("message", TimeSpan.FromSeconds(5));

// 尝试取出（带超时）
bool taken = messages.TryTake(out string msg, TimeSpan.FromSeconds(5));
```

### ImmutableCollections 不可变集合

`System.Collections.Immutable` 命名空间提供了不可变集合，每次修改都会返回新的集合实例。

```csharp
using System.Collections.Immutable;

// 不可变列表
ImmutableList<int> list = ImmutableList.Create<int>();
ImmutableList<int> list2 = list.Add(1).Add(2).Add(3);

// 原始列表不变
Console.WriteLine(list.Count); // 0
Console.WriteLine(list2.Count); // 3

// 使用 Builder 提高性能
ImmutableList<int>.Builder builder = ImmutableList.CreateBuilder<int>();
for (int i = 0; i < 1000; i++)
{
    builder.Add(i);
}
ImmutableList<int> finalList = builder.ToImmutable();

// 不可变字典
ImmutableDictionary<string, int> dict = ImmutableDictionary<string, int>.Empty;
ImmutableDictionary<string, int> dict2 = dict
    .Add("a", 1)
    .Add("b", 2)
    .SetItem("a", 10); // 更新现有键

// 不可变集合
ImmutableHashSet<int> set = ImmutableHashSet.Create(1, 2, 3);
ImmutableHashSet<int> set2 = set.Add(4).Remove(1);

// 不可变数组
ImmutableArray<int> array = ImmutableArray.Create(1, 2, 3);
ImmutableArray<int> array2 = array.Add(4);

// 不可变排序集合
ImmutableSortedSet<int> sortedSet = ImmutableSortedSet.Create(3, 1, 4, 1, 5);
// 自动去重和排序: {1, 3, 4, 5}

ImmutableSortedDictionary<string, int> sortedDict =
    ImmutableSortedDictionary<string, int>.Empty
        .Add("banana", 2)
        .Add("apple", 1)
        .Add("cherry", 3);
// 按键排序: apple, banana, cherry
```

## 集合性能对比

### 时间复杂度

| 集合类型 | 添加 | 删除 | 查找 | 索引访问 |
|---------|------|------|------|----------|
| List\<T\> | O(1)* | O(n) | O(n) | O(1) |
| LinkedList\<T\> | O(1) | O(1) | O(n) | O(n) |
| Dictionary\<K,V\> | O(1)* | O(1) | O(1) | - |
| HashSet\<T\> | O(1)* | O(1) | O(1) | - |
| SortedList\<K,V\> | O(n) | O(n) | O(log n) | O(1) |
| SortedDictionary\<K,V\> | O(log n) | O(log n) | O(log n) | - |
| SortedSet\<T\> | O(log n) | O(log n) | O(log n) | - |
| Stack\<T\> | O(1)* | O(1) | O(n) | - |
| Queue\<T\> | O(1)* | O(1) | O(n) | - |

*注：平均情况，可能因为扩容而达到 O(n)

### 选择指南

```csharp
// 场景 1：需要随机访问，主要在末尾添加/删除
List<T> list; // 最佳选择

// 场景 2：需要快速查找，不关心顺序
HashSet<T> set; // 检查存在性
Dictionary<K, V> dict; // 键值对查找

// 场景 3：需要保持排序
SortedSet<T> sortedSet; // 唯一元素
SortedDictionary<K, V> sortedDict; // 键值对

// 场景 4：频繁在中间插入/删除
LinkedList<T> linkedList;

// 场景 5：先进先出处理
Queue<T> queue;

// 场景 6：后进先出处理
Stack<T> stack;

// 场景 7：多线程环境
ConcurrentDictionary<K, V> concurrentDict;
ConcurrentQueue<T> concurrentQueue;
ConcurrentBag<T> concurrentBag;

// 场景 8：需要不可变性（函数式编程、线程安全）
ImmutableList<T> immutableList;
ImmutableDictionary<K, V> immutableDict;
```

## 最佳实践

### 选择合适的集合类型

```csharp
// 错误示例：使用 List 进行频繁查找
List<string> list = new List<string>();
// ... 添加大量元素
bool exists = list.Contains("target"); // O(n)

// 正确示例：使用 HashSet 进行频繁查找
HashSet<string> set = new HashSet<string>();
// ... 添加大量元素
bool exists = set.Contains("target"); // O(1)
```

### 预分配容量

```csharp
// 错误示例：不指定初始容量
List<int> list = new List<int>();
for (int i = 0; i < 10000; i++)
{
    list.Add(i); // 多次扩容，性能损失
}

// 正确示例：预分配容量
List<int> list = new List<int>(10000);
for (int i = 0; i < 10000; i++)
{
    list.Add(i); // 无需扩容
}
```

### 使用接口而非具体类型

```csharp
// 推荐：使用接口类型
public void ProcessItems(IEnumerable<int> items)
{
    foreach (int item in items)
    {
        // 处理
    }
}

public void ProcessList(IList<int> items)
{
    for (int i = 0; i < items.Count; i++)
    {
        // 处理
    }
}

public void ProcessDictionary(IDictionary<string, int> dict)
{
    // 处理
}
```

### 避免在遍历时修改集合

```csharp
// 错误示例：遍历时修改
List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };
foreach (int num in numbers)
{
    if (num % 2 == 0)
    {
        numbers.Remove(num); // 抛出 InvalidOperationException
    }
}

// 正确示例 1：使用 RemoveAll
numbers.RemoveAll(n => n % 2 == 0);

// 正确示例 2：反向遍历
for (int i = numbers.Count - 1; i >= 0; i--)
{
    if (numbers[i] % 2 == 0)
    {
        numbers.RemoveAt(i);
    }
}

// 正确示例 3：创建新集合
numbers = numbers.Where(n => n % 2 != 0).ToList();
```

### 正确实现 GetHashCode 和 Equals

```csharp
public class Customer : IEquatable<Customer>
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }

    // 基于业务键实现相等性
    public bool Equals(Customer other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;
        return Id == other.Id;
    }

    public override bool Equals(object obj)
    {
        return Equals(obj as Customer);
    }

    public override int GetHashCode()
    {
        return Id?.GetHashCode() ?? 0;
    }

    // 可选：重载 == 和 != 运算符
    public static bool operator ==(Customer left, Customer right)
    {
        if (left is null) return right is null;
        return left.Equals(right);
    }

    public static bool operator !=(Customer left, Customer right)
    {
        return !(left == right);
    }
}

// 使用记录类型自动生成（C# 9+）
public record Product(string Sku, string Name, decimal Price);
```

### 使用 CollectionsMarshal 进行高性能操作

```csharp
using System.Runtime.InteropServices;

List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

// 获取底层数组的 Span（避免边界检查）
Span<int> span = CollectionsMarshal.AsSpan(numbers);
for (int i = 0; i < span.Length; i++)
{
    span[i] *= 2;
}

// 字典的高性能访问
Dictionary<string, int> dict = new Dictionary<string, int>();

// 获取值的引用（避免两次查找）
ref int valueRef = ref CollectionsMarshal.GetValueRefOrAddDefault(
    dict, "key", out bool exists);

if (!exists)
{
    valueRef = 100; // 直接设置值
}
else
{
    valueRef++; // 直接修改值
}
```

## 总结

C# 集合框架提供了丰富的数据结构，能够满足各种应用场景的需求：

1. **基础集合**：`List<T>`、`Dictionary<TKey, TValue>`、`HashSet<T>` 是最常用的集合类型
2. **特殊用途**：`Queue<T>` 和 `Stack<T>` 用于特定的数据处理模式
3. **有序集合**：`SortedList`、`SortedDictionary`、`SortedSet` 保持元素排序
4. **链表**：`LinkedList<T>` 适用于频繁的中间插入/删除操作
5. **并发集合**：`ConcurrentDictionary`、`ConcurrentQueue` 等提供线程安全
6. **不可变集合**：`ImmutableList`、`ImmutableDictionary` 等支持函数式编程

选择正确的集合类型对于程序的性能至关重要。在选择时，需要考虑：
- 主要操作是什么（添加、删除、查找、遍历）
- 是否需要保持顺序
- 是否需要线程安全
- 内存使用要求
- 是否需要索引访问

掌握这些集合类型的特性和使用方法，将帮助你编写出更高效、更可维护的 C# 代码。
