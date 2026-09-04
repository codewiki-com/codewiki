---
title: Python heapq Module - Heap Queue Algorithm
description: Master heap queue algorithms, priority queues, and efficient heap-based data structures in Python
track: python
section: stdlib
difficulty: intermediate
tags:
  - heapq
  - heap
  - priority queue
  - data structures
  - algorithms
status: imported
origin: old/src/content/docs/python/heapq.en.md
divergence: 0.208
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: Python
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---

## Concept Explanation

The `heapq` module in Python provides an implementation of the min-heap algorithm, which is a complete binary tree where each parent node is smaller than or equal to its children. This fundamental data structure is essential for efficiently implementing priority queues, scheduling algorithms, and various graph algorithms.

A heap is not a sorted structure like a list, but rather a partially ordered tree-based structure that ensures efficient access to the smallest element in O(1) time and insertion/deletion in O(log n) time.

### Why Use Heaps?

- **Priority Queue**: Efficiently retrieve the highest or lowest priority item
- **Selection Algorithms**: Find the kth smallest/largest element
- **Scheduler**: Process tasks based on priority
- **Graph Algorithms**: Dijkstra's and Prim's algorithms require heaps
- **Memory Efficiency**: Heaps are typically implemented as arrays, requiring less memory than other tree structures

### Heap Properties

In a min-heap:
- Parent node value ≤ children node values
- The smallest element is always at the root (index 0)
- For a node at index `i`:
  - Left child is at index `2*i + 1`
  - Right child is at index `2*i + 2`
  - Parent is at index `(i - 1) // 2`

---

## Core Principles

### Heap Operations

#### Heapify
Transforms a list into a heap in-place using the `heapify()` function. This is more efficient than repeatedly using `heappush()`.

```python
import heapq

numbers = [5, 2, 8, 1, 9, 3]
heapq.heapify(numbers)
print(numbers)  # [1, 2, 3, 5, 9, 8]
```

#### Push and Pop
Add elements to and remove the smallest element from the heap:

```python
h = []
heapq.heappush(h, 5)
heapq.heappush(h, 2)
heapq.heappush(h, 8)

smallest = heapq.heappop(h)  # Returns 2
```

#### Heap Replace
Replace the smallest element with a new value in a single operation:

```python
h = [1, 2, 3]
replaced = heapq.heapreplace(h, 4)  # Returns 1, heap becomes [2, 3, 4]
```

#### Heap Pop and Push
Combines pop and push operations, which is more efficient than doing them separately:

```python
h = [1, 2, 3]
result = heapq.heappushpop(h, 0)  # Returns 0, heap becomes [1, 2, 3]
```

#### N-Largest and N-Smallest
Efficiently find the n largest or smallest elements:

```python
numbers = [5, 2, 8, 1, 9, 3, 7]
three_largest = heapq.nlargest(3, numbers)      # [9, 8, 7]
three_smallest = heapq.nsmallest(3, numbers)    # [1, 2, 3]
```

### Memory Layout

Heaps are typically represented as arrays where the heap property is maintained through array indexing, making them space-efficient and cache-friendly.

```
         1
       /   \
      2     3
     / \   / \
    5   9 8   4
```

Array representation: `[1, 2, 3, 5, 9, 8, 4]`

---

## Key Points

### Min-Heap Only
Python's `heapq` only provides min-heap implementation. For a max-heap, negate values or use custom objects with comparison operators.

```python
# Max-heap using negation
h = []
heapq.heappush(h, -5)
heapq.heappush(h, -2)
print(-heapq.heappop(h))  # 5
```

### Not Fully Sorted
A heap is not fully sorted. While the smallest element is guaranteed at index 0, other elements may not be in sorted order.

```python
import heapq
numbers = [5, 2, 8, 1, 9, 3]
heapq.heapify(numbers)
print(numbers)  # [1, 2, 3, 5, 9, 8] - not fully sorted
```

### Thread Safety
The `heapq` module is not thread-safe. Use locks if accessing from multiple threads.

### Stability with Tuples
When pushing tuples, elements are compared element-by-element. Use a counter for stability:

```python
import heapq
counter = 0
h = []
heapq.heappush(h, (1, counter, 'task1'))
counter += 1
heapq.heappush(h, (1, counter, 'task2'))  # Same priority, different order guaranteed
```

### In-Place Heapification
`heapq.heapify()` modifies the list in-place and is O(n), more efficient than building a heap through individual push operations which would be O(n log n).

---

## Code Examples

### Example 1: Basic Priority Queue

```python
import heapq

class PriorityQueue:
    def __init__(self):
        self.heap = []
        self.counter = 0

    def add_task(self, priority, task):
        """Add a task with given priority"""
        heapq.heappush(self.heap, (priority, self.counter, task))
        self.counter += 1

    def get_next_task(self):
        """Get the task with highest priority (lowest number)"""
        if self.heap:
            return heapq.heappop(self.heap)[2]
        return None

    def size(self):
        return len(self.heap)

# Usage
pq = PriorityQueue()
pq.add_task(3, 'low priority task')
pq.add_task(1, 'high priority task')
pq.add_task(2, 'medium priority task')

print(pq.get_next_task())  # 'high priority task'
print(pq.get_next_task())  # 'medium priority task'
print(pq.get_next_task())  # 'low priority task'
```

### Example 2: Find K-Largest Elements

```python
import heapq

def find_k_largest(numbers, k):
    """Find k largest numbers efficiently"""
    if k >= len(numbers):
        return sorted(numbers, reverse=True)

    # Method 1: Using nlargest (recommended)
    return heapq.nlargest(k, numbers)

    # Method 2: Using a min-heap of size k (for streaming data)
    # h = numbers[:k]
    # heapq.heapify(h)
    # for num in numbers[k:]:
    #     if num > h[0]:
    #         heapq.heapreplace(h, num)
    # return sorted(h, reverse=True)

numbers = [3, 1, 5, 9, 2, 8, 4, 7, 6]
print(find_k_largest(numbers, 3))  # [9, 8, 7]
```

### Example 3: Merge Multiple Sorted Lists

```python
import heapq

def merge_sorted_lists(*lists):
    """Merge multiple sorted lists into a single sorted list"""
    heap = []

    # Add the first element of each list to the heap
    for i, lst in enumerate(lists):
        if lst:
            heapq.heappush(heap, (lst[0], i, 0))

    result = []
    while heap:
        value, list_idx, elem_idx = heapq.heappop(heap)
        result.append(value)

        # Add the next element from the same list
        if elem_idx + 1 < len(lists[list_idx]):
            next_value = lists[list_idx][elem_idx + 1]
            heapq.heappush(heap, (next_value, list_idx, elem_idx + 1))

    return result

# Usage
list1 = [1, 3, 5]
list2 = [2, 4, 6]
list3 = [1, 2, 3]
print(merge_sorted_lists(list1, list2, list3))  # [1, 1, 2, 2, 3, 3, 4, 5, 6]
```

### Example 4: Dijkstra's Shortest Path Algorithm

```python
import heapq
from collections import defaultdict

def dijkstra(graph, start):
    """Find shortest paths from start to all other nodes"""
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    previous = {node: None for node in graph}

    heap = [(0, start)]  # (distance, node)
    visited = set()

    while heap:
        current_distance, current_node = heapq.heappop(heap)

        if current_node in visited:
            continue

        visited.add(current_node)

        # Skip if we've found a better path already
        if current_distance > distances[current_node]:
            continue

        # Check neighbors
        for neighbor, weight in graph[current_node]:
            distance = current_distance + weight

            if distance < distances[neighbor]:
                distances[neighbor] = distance
                previous[neighbor] = current_node
                heapq.heappush(heap, (distance, neighbor))

    return distances, previous

# Example graph
graph = {
    'A': [('B', 4), ('C', 2)],
    'B': [('A', 4), ('D', 5)],
    'C': [('A', 2), ('D', 8), ('E', 10)],
    'D': [('B', 5), ('C', 8), ('E', 2)],
    'E': [('C', 10), ('D', 2)]
}

distances, previous = dijkstra(graph, 'A')
print(distances)  # {'A': 0, 'C': 2, 'B': 4, 'D': 7, 'E': 9}
```

### Example 5: Huffman Coding (Compression Algorithm)

```python
import heapq
from collections import defaultdict, Counter

class Node:
    def __init__(self, char=None, freq=0, left=None, right=None):
        self.char = char
        self.freq = freq
        self.left = left
        self.right = right

    def __lt__(self, other):
        return self.freq < other.freq

def build_huffman_tree(text):
    """Build Huffman coding tree"""
    # Count character frequencies
    freq = Counter(text)

    # Create leaf nodes
    heap = [Node(char=char, freq=count) for char, count in freq.items()]
    heapq.heapify(heap)

    # Build the tree
    while len(heap) > 1:
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        parent = Node(freq=left.freq + right.freq, left=left, right=right)
        heapq.heappush(heap, parent)

    return heap[0]

def build_codes(node, code='', codes=None):
    """Generate Huffman codes from tree"""
    if codes is None:
        codes = {}

    if node is None:
        return codes

    if node.char is not None:
        codes[node.char] = code if code else '0'
        return codes

    build_codes(node.left, code + '0', codes)
    build_codes(node.right, code + '1', codes)

    return codes

# Usage
text = "hello world"
root = build_huffman_tree(text)
codes = build_codes(root)
print(codes)  # {'h': '000', 'e': '001', 'l': '01', ...}
```

### Example 6: Task Scheduler with Deadlines

```python
import heapq
from datetime import datetime, timedelta

class Task:
    def __init__(self, name, priority, deadline):
        self.name = name
        self.priority = priority
        self.deadline = deadline

    def __lt__(self, other):
        # Compare by deadline first, then by priority
        if self.deadline != other.deadline:
            return self.deadline < other.deadline
        return self.priority < other.priority

    def __repr__(self):
        return f"Task({self.name}, deadline={self.deadline})"

def schedule_tasks(tasks):
    """Schedule tasks by deadline"""
    heap = tasks[:]
    heapq.heapify(heap)

    scheduled = []
    while heap:
        task = heapq.heappop(heap)
        scheduled.append(task)

    return scheduled

# Usage
now = datetime.now()
tasks = [
    Task('Email Report', 1, now + timedelta(days=2)),
    Task('Bug Fix', 2, now + timedelta(days=1)),
    Task('Meeting', 3, now + timedelta(hours=2)),
    Task('Code Review', 1, now + timedelta(days=3)),
]

scheduled = schedule_tasks(tasks)
for task in scheduled:
    print(task)
```

---

## Best Practices

### Use heapq.nlargest/nsmallest for Small k

```python
import heapq

numbers = [5, 2, 8, 1, 9, 3]

# Good: for k << len(numbers)
heapq.nlargest(2, numbers)

# Also good: for streaming data where you can't fit all in memory
heap = []
for num in stream:
    if len(heap) < k:
        heapq.heappush(heap, num)
    elif num > heap[0]:
        heapq.heapreplace(heap, num)
```

### Handle Duplicate Priorities Gracefully

```python
import heapq

# Use tuples with a counter to break ties
counter = 0
heap = []
heapq.heappush(heap, (priority, counter, data))
counter += 1
```

### Lazy Deletion Instead of Update

```python
import heapq

class TaskQueue:
    def __init__(self):
        self.heap = []
        self.task_id = 0
        self.removed = set()

    def add_task(self, task, priority):
        heapq.heappush(self.heap, (priority, self.task_id, task))
        self.task_id += 1

    def remove_task(self, task_id):
        self.removed.add(task_id)

    def get_next_task(self):
        while self.heap:
            priority, task_id, task = heapq.heappop(self.heap)
            if task_id not in self.removed:
                return task
        return None
```

### Create Custom Objects with Comparison

```python
import heapq

class Process:
    def __init__(self, name, cpu_burst):
        self.name = name
        self.cpu_burst = cpu_burst

    def __lt__(self, other):
        return self.cpu_burst < other.cpu_burst

    def __repr__(self):
        return f"Process({self.name}, {self.cpu_burst})"

processes = [Process('P1', 10), Process('P2', 5), Process('P3', 8)]
heapq.heapify(processes)
print(heapq.heappop(processes))  # Process(P2, 5)
```

### Use heapq.heapify for Large Initial Data

```python
import heapq
import time

# For large initial data, heapify is faster than repeated heappush
large_list = list(range(100000, 0, -1))

# Method 1: heapify (O(n))
start = time.time()
h1 = large_list.copy()
heapq.heapify(h1)
print(f"heapify: {time.time() - start:.4f}s")

# Method 2: repeated heappush (O(n log n))
start = time.time()
h2 = []
for item in large_list:
    heapq.heappush(h2, item)
print(f"heappush: {time.time() - start:.4f}s")
```

---

## Common Pitfalls

### Forgetting heapq.heapify() on Existing Lists

```python
# WRONG: Treating a list as a heap without heapifying
h = [5, 3, 1, 4, 2]
print(heapq.heappop(h))  # Might not return 1!

# CORRECT
h = [5, 3, 1, 4, 2]
heapq.heapify(h)
print(heapq.heappop(h))  # Returns 1
```

### Expecting a Max-Heap

```python
# WRONG: Expecting max-heap behavior
h = []
heapq.heappush(h, 5)
heapq.heappush(h, 2)
print(heapq.heappop(h))  # Returns 2, not 5!

# CORRECT: Use negation for max-heap
h = []
heapq.heappush(h, -5)
heapq.heappush(h, -2)
print(-heapq.heappop(h))  # Returns 5
```

### Modifying Elements In-Place

```python
# WRONG: Modifying heap elements breaks heap property
h = [(1, 'a'), (2, 'b')]
h[0] = (3, 'c')  # Heap property violated!

# CORRECT: Use heappop and heappush
priority, item = heapq.heappop(h)
heapq.heappush(h, (new_priority, item))
```

### Comparing Incompatible Types

```python
# WRONG: Trying to compare different types
h = []
heapq.heappush(h, (1, 'string'))
heapq.heappush(h, (2, 123))  # Can fail in Python 3

# CORRECT: Ensure comparable types
h = []
heapq.heappush(h, (1, 'string1'))
heapq.heappush(h, (1, 'string2'))
```

### Not Handling Empty Heap

```python
# WRONG: No check for empty heap
h = []
result = heapq.heappop(h)  # Raises IndexError

# CORRECT
h = []
if h:
    result = heapq.heappop(h)
else:
    result = None
```

---

## Performance Considerations

### Time Complexity

| Operation | Time Complexity | Notes |
|-----------|-----------------|-------|
| heappush | O(log n) | Insert and maintain heap property |
| heappop | O(log n) | Remove min and maintain heap property |
| heapify | O(n) | Convert list to heap in-place |
| heapreplace | O(log n) | Pop and push combined |
| heappushpop | O(log n) | Push and pop combined |
| nlargest(k) | O(n log k) | Efficient for k << n |
| nsmallest(k) | O(n log k) | Efficient for k << n |

### Space Complexity

| Operation | Space | Notes |
|-----------|-------|-------|
| All heap operations | O(1) | Except nlargest/nsmallest use O(k) |
| heapify | O(1) | In-place operation |

### Performance Tips

1. **Use heapify() for Initial Construction**: O(n) vs O(n log n)
2. **Use nlargest/nsmallest for k Selection**: More efficient than sorting for k << n
3. **Lazy Deletion for Updates**: Avoid expensive update operations
4. **Batch Operations**: Combine multiple operations when possible

```python
import heapq
import timeit

numbers = list(range(10000, 0, -1))

# nlargest is faster for small k
def using_nlargest():
    return heapq.nlargest(3, numbers)

def using_sort():
    return sorted(numbers, reverse=True)[:3]

print(f"nlargest: {timeit.timeit(using_nlargest, number=1000):.4f}s")
print(f"sort: {timeit.timeit(using_sort, number=1000):.4f}s")
```

---

## Real-world Scenarios

### Load Balancer (Task Distribution)

```python
import heapq

class LoadBalancer:
    def __init__(self, num_servers):
        self.num_servers = num_servers
        self.server_loads = [(0, i) for i in range(num_servers)]
        heapq.heapify(self.server_loads)

    def assign_task(self, task_size):
        """Assign task to server with minimum load"""
        load, server_id = heapq.heappop(self.server_loads)
        new_load = load + task_size
        heapq.heappush(self.server_loads, (new_load, server_id))
        return server_id

    def get_status(self):
        """Get current load of each server"""
        return sorted(self.server_loads)

# Usage
lb = LoadBalancer(3)
print(f"Task 1 -> Server {lb.assign_task(5)}")
print(f"Task 2 -> Server {lb.assign_task(3)}")
print(f"Task 3 -> Server {lb.assign_task(7)}")
print(lb.get_status())  # Balanced across servers
```

### Event-Driven Simulation

```python
import heapq
from dataclasses import dataclass

@dataclass
class Event:
    time: float
    event_type: str
    data: dict

    def __lt__(self, other):
        return self.time < other.time

class EventSimulator:
    def __init__(self):
        self.event_queue = []
        self.current_time = 0

    def schedule_event(self, time, event_type, data):
        heapq.heappush(self.event_queue, Event(time, event_type, data))

    def run(self):
        while self.event_queue:
            event = heapq.heappop(self.event_queue)
            self.current_time = event.time
            self.process_event(event)

    def process_event(self, event):
        print(f"[{event.time:.1f}] {event.event_type}: {event.data}")

# Usage
sim = EventSimulator()
sim.schedule_event(5.0, 'ARRIVAL', {'customer_id': 1})
sim.schedule_event(2.5, 'DEPARTURE', {'customer_id': 2})
sim.schedule_event(3.0, 'ARRIVAL', {'customer_id': 3})
sim.run()
```

### Patient Triage System

```python
import heapq
from enum import Enum

class Severity(Enum):
    CRITICAL = 1
    URGENT = 2
    MODERATE = 3
    MINOR = 4

class Patient:
    def __init__(self, name, severity, arrival_time):
        self.name = name
        self.severity = severity.value
        self.arrival_time = arrival_time

    def __lt__(self, other):
        # Critical patients first, then by arrival time
        if self.severity != other.severity:
            return self.severity < other.severity
        return self.arrival_time < other.arrival_time

    def __repr__(self):
        return f"Patient({self.name}, severity={self.severity})"

class TriageSystem:
    def __init__(self):
        self.queue = []

    def admit_patient(self, name, severity, arrival_time):
        heapq.heappush(self.queue, Patient(name, severity, arrival_time))

    def get_next_patient(self):
        if self.queue:
            return heapq.heappop(self.queue)
        return None

# Usage
triage = TriageSystem()
triage.admit_patient("John", Severity.MINOR, 1)
triage.admit_patient("Jane", Severity.CRITICAL, 2)
triage.admit_patient("Bob", Severity.URGENT, 3)

while True:
    patient = triage.get_next_patient()
    if not patient:
        break
    print(f"Treating: {patient}")
```

### Memory Management (Heap Memory Allocation)

```python
import heapq

class MemoryAllocator:
    def __init__(self, total_memory):
        self.total_memory = total_memory
        self.free_blocks = [(total_memory, 0)]  # (size, start_address)
        self.allocations = {}  # address -> (size, owner)

    def allocate(self, size, owner):
        """Allocate memory block"""
        for i, (free_size, start_addr) in enumerate(self.free_blocks):
            if free_size >= size:
                # Allocate from this block
                self.allocations[start_addr] = (size, owner)
                remaining = free_size - size

                if remaining > 0:
                    self.free_blocks[i] = (remaining, start_addr + size)
                else:
                    del self.free_blocks[i]

                heapq.heapify(self.free_blocks)
                return start_addr

        return None  # Allocation failed

    def deallocate(self, address):
        """Free allocated memory"""
        if address in self.allocations:
            size, _ = self.allocations[address]
            del self.allocations[address]
            heapq.heappush(self.free_blocks, (size, address))

    def get_fragmentation(self):
        """Get memory fragmentation info"""
        return sorted(self.free_blocks)

# Usage
mem = MemoryAllocator(1000)
addr1 = mem.allocate(100, "process1")
addr2 = mem.allocate(200, "process2")
print(f"Allocated at {addr1} and {addr2}")
mem.deallocate(addr1)
print(f"Fragmentation: {mem.get_fragmentation()}")
```

---

## Interview Points

### Common Interview Questions

#### How does a heap differ from a binary search tree?

**Answer**:
- **Heap**: Complete binary tree, heap property (parent ≤ children), good for priority queues
- **BST**: Not necessarily complete, BST property (left < parent < right), good for searching
- **Operations**: Heap gives O(1) min access but O(n) search; BST gives O(log n) search but O(n) min access

#### Can you build a max-heap with Python's heapq?

**Answer**:
Yes, by negating values (for numbers) or using custom comparison operators:

```python
import heapq

# Method 1: Negate numbers
h = []
for x in [3, 1, 4, 1, 5]:
    heapq.heappush(h, -x)

max_val = -heapq.heappop(h)  # 5

# Method 2: Use class with reversed comparison
class MaxHeap:
    def __init__(self, val):
        self.val = val
    def __lt__(self, other):
        return self.val > other.val
```

#### What is the time complexity of heapify()?

**Answer**: O(n), not O(n log n). This is because most nodes are in the lower part of the tree and require fewer comparisons.

#### How would you implement a priority queue with update capability?

**Answer**:
```python
# Use lazy deletion with a "removed" set
class PriorityQueue:
    def __init__(self):
        self.heap = []
        self.task_id = 0
        self.removed = set()

    def add_task(self, task, priority):
        heapq.heappush(self.heap, (priority, self.task_id, task))
        self.task_id += 1

    def remove_task(self, task_id):
        self.removed.add(task_id)

    def get_next(self):
        while self.heap:
            priority, task_id, task = heapq.heappop(self.heap)
            if task_id not in self.removed:
                return task
        return None
```

#### Explain the difference between heappush/heappop and heappushpop/heapreplace

**Answer**:
- `heappush` + `heappop`: Two operations, O(2 log n)
- `heappushpop`: Push then pop, optimized single operation, O(log n), returns popped value
- `heapreplace`: Pop then push, optimized single operation, O(log n), returns popped value

#### How would you find the median of a stream using two heaps?

**Answer**:
```python
import heapq

class MedianFinder:
    def __init__(self):
        self.small = []  # max heap (negate values)
        self.large = []  # min heap

    def addNum(self, num):
        # Add to small if it's smaller than largest in small
        if self.small and num < -self.small[0]:
            heapq.heappush(self.small, -num)
        else:
            heapq.heappush(self.large, num)

        # Balance heaps
        if len(self.small) > len(self.large) + 1:
            val = -heapq.heappop(self.small)
            heapq.heappush(self.large, val)
        elif len(self.large) > len(self.small):
            val = heapq.heappop(self.large)
            heapq.heappush(self.small, -val)

    def findMedian(self):
        if len(self.small) > len(self.large):
            return float(-self.small[0])
        return (-self.small[0] + self.large[0]) / 2.0
```

---

## Further Reading

### Official Documentation

- [Python heapq Documentation](https://docs.python.org/3/library/heapq.html)
- [Python Data Structures](https://docs.python.org/3/tutorial/datastructures.html)

### Related Concepts

- **Priority Queues**: Abstract data type often implemented with heaps
- **Binary Heaps**: Specific implementation using binary trees in array form
- **Fibonacci Heaps**: Advanced heap with better amortized complexity
- **d-ary Heaps**: Heaps with d children per node

### Recommended Books

- *Introduction to Algorithms* by Cormen, Leiserson, Rivest, and Stein - Classic algorithms textbook
- *Data Structures and Algorithm Analysis in Python* by Mark A. Weiss - Practical Python focus
- *Algorithms* by Sedgewick and Wayne - Comprehensive algorithm resource

### Practice Problems

- LeetCode: Heap problems (Top K Elements, Merge K Lists, etc.)
- GeeksforGeeks: Heap data structure tutorials
- HackerRank: Heap and priority queue challenges

### Key Applications to Study

1. **Dijkstra's Algorithm**: Shortest path with heaps
2. **Huffman Coding**: Compression using heaps
3. **Heap Sort**: Sorting algorithm using heaps
4. **Median of Stream**: Two-heap approach
5. **Kth Largest Element**: Heap-based selection
6. **Task Scheduler**: Priority-based scheduling
7. **Online Stock Span**: Heap for range queries

---

## Summary

The `heapq` module is a fundamental tool in Python for implementing efficient priority queues and heap-based algorithms. Key takeaways:

1. **Min-Heap Only**: Use negation or custom comparators for max-heaps
2. **O(log n) Operations**: Very efficient for add/remove smallest
3. **O(1) Access**: Constant time to peek at the minimum element
4. **Practical Applications**: Priority queues, scheduling, graph algorithms
5. **Interview Ready**: Common in coding interviews for optimization problems

Master heaps and you'll be able to solve a wide variety of data structure and algorithm problems efficiently!
