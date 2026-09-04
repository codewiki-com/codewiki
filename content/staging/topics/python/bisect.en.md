---
title: "Python Bisect Module: Binary Search and Sorted List Operations"
description: Master binary search and efficient sorted list operations using Python's bisect module with practical examples and performance optimizations
track: python
section: stdlib
difficulty: intermediate
tags:
  - bisect
  - binary search
  - algorithms
  - sorted lists
  - performance
status: imported
origin: old/src/content/docs/python/bisect.en.md
divergence: 0.238
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: Python
  subcategory: ""
  order: 45
  lastUpdated: 2026-01-07
---

The `bisect` module is a powerful Python utility that provides efficient algorithms for working with sorted lists. It implements the binary search algorithm, enabling fast insertions and lookups in sorted sequences without the performance overhead of maintaining a sorted data structure from scratch. This module is essential for anyone working with sorted data at scale or competing in technical interviews.

## Concept Explanation

### What is Binary Search?

Binary search is a divide-and-conquer algorithm that efficiently locates a target value in a sorted array by repeatedly dividing the search space in half. Instead of checking every element (linear search with O(n) complexity), binary search eliminates half of the remaining elements with each comparison, achieving O(log n) complexity.

### The Bisect Module

Python's `bisect` module provides two families of functions:
1. **Search functions** - locate insertion points for values
2. **Insertion functions** - directly insert values while maintaining sorted order

The module assumes the input list is already sorted and maintains this invariant through its operations.

### Real-world Analogy

Imagine searching for a name in a physical phone book:
- **Linear search**: Check every name sequentially
- **Binary search**: Open to the middle, determine if you need the first or second half, repeat

The bisect module automates this "open to the middle" strategy algorithmically.

## Core Principles

### Principle 1: Sorted Order Assumption

```python
import bisect

# CORRECT: List must be sorted
sorted_list = [1, 3, 5, 7, 9]
pos = bisect.bisect_left(sorted_list, 5)
print(f"Position: {pos}")  # Output: Position: 2

# WRONG: Unsorted list produces incorrect results
unsorted_list = [9, 1, 7, 3, 5]
pos = bisect.bisect_left(unsorted_list, 5)
print(f"Position: {pos}")  # Output: Position: 3 (INCORRECT!)
```

**Key Insight**: The bisect module does not sort your data. You must ensure the list is sorted before using any bisect function.

### Principle 2: Insertion Points vs. Values

Bisect functions return **insertion points**, not directly the values themselves:

```python
import bisect

numbers = [1, 3, 5, 7, 9]

# bisect_left: insertion point BEFORE any existing equal elements
pos_left = bisect.bisect_left(numbers, 5)
print(f"bisect_left(5) position: {pos_left}")  # Output: 2

# bisect_right: insertion point AFTER any existing equal elements
pos_right = bisect.bisect_right(numbers, 5)
print(f"bisect_right(5) position: {pos_right}")  # Output: 3

# Both return the same position when value is not in list
numbers = [1, 3, 7, 9]
print(bisect.bisect_left(numbers, 5))  # Output: 2
print(bisect.bisect_right(numbers, 5))  # Output: 2
```

### Principle 3: In-Place Modification

The `insort` functions modify the list in-place, maintaining sorted order:

```python
import bisect

numbers = [1, 3, 5, 7, 9]

# Insert 6 while maintaining sorted order
bisect.insort(numbers, 6)
print(numbers)  # Output: [1, 3, 5, 6, 7, 9]

# Inserting a duplicate (right variant)
bisect.insort_right(numbers, 5)
print(numbers)  # Output: [1, 3, 5, 5, 6, 7, 9]
```

## Key Points

### The Four Main Functions

```python
import bisect

data = [1, 3, 5, 7, 9, 9, 9]

# bisect_left(a, x): leftmost insertion point
print(bisect.bisect_left(data, 9))    # Output: 4 (before first 9)

# bisect_right(a, x): rightmost insertion point
# Equivalent to bisect(a, x)
print(bisect.bisect_right(data, 9))   # Output: 7 (after last 9)
print(bisect.bisect(data, 9))         # Output: 7 (same as bisect_right)

# insort_left(a, x): insert at leftmost position
bisect.insort_left(data, 9)
print(data)  # [1, 3, 5, 7, 9, 9, 9, 9]

# insort_right(a, x): insert at rightmost position (default)
# Equivalent to insort(a, x)
data = [1, 3, 5, 7, 9]
bisect.insort_right(data, 5)
print(data)  # [1, 3, 5, 5, 7, 9]
```

### Key Differences: Left vs. Right Variants

| Function | Returns | When value exists | Use case |
|----------|---------|-------------------|----------|
| `bisect_left` | Leftmost position | Before existing equal values | Find first occurrence |
| `bisect_right` / `bisect` | Rightmost position | After existing equal values | Find insertion point (default) |
| `insort_left` | Inserts at left | Before existing equal values | Stable left insertion |
| `insort_right` / `insort` | Inserts at right | After existing equal values | Standard insertion |

### Time Complexity Characteristics

```python
import bisect
import time

# Binary search: O(log n)
def benchmark_bisect():
    large_list = list(range(0, 1000000, 2))  # 500,000 sorted elements

    start = time.time()
    for i in range(10000):
        bisect.bisect_left(large_list, 500000)
    bisect_time = time.time() - start

    # Linear search for comparison: O(n)
    start = time.time()
    for i in range(10000):
        large_list.index(500000)  # Will raise ValueError
    print(f"Bisect time: {bisect_time:.6f}s")
    # Bisect is logarithmic - dramatically faster for large lists

benchmark_bisect()
```

## Code Examples

### Example 1: Finding Elements in a Sorted List

```python
import bisect

def find_element(sorted_list, target):
    """
    Find a target element in a sorted list.
    Returns the element if found, None otherwise.
    """
    pos = bisect.bisect_left(sorted_list, target)
    if pos < len(sorted_list) and sorted_list[pos] == target:
        return sorted_list[pos]
    return None

# Usage
numbers = [1, 3, 5, 7, 9, 11, 13]
print(find_element(numbers, 7))   # Output: 7
print(find_element(numbers, 8))   # Output: None
print(find_element(numbers, 13))  # Output: 13
```

### Example 2: Maintaining a Sorted List of Scores

```python
import bisect

class Scoreboard:
    """Track player scores in sorted order."""

    def __init__(self):
        self.scores = []
        self.players = {}

    def add_score(self, player_name, score):
        """Add a player's score, maintaining sorted order."""
        if player_name in self.players:
            old_score = self.players[player_name]
            self.scores.remove(old_score)

        # Insert score in sorted position
        bisect.insort(self.scores, score)
        self.players[player_name] = score

    def get_rank(self, player_name):
        """Get a player's rank (1-based, higher score = higher rank)."""
        if player_name not in self.players:
            return None

        score = self.players[player_name]
        # Count scores greater than or equal to this score
        pos = bisect.bisect_right(self.scores, score)
        return len(self.scores) - pos + 1

    def get_top_n(self, n):
        """Get top N scores."""
        return sorted(self.scores, reverse=True)[:n]

# Usage
board = Scoreboard()
board.add_score("Alice", 95)
board.add_score("Bob", 87)
board.add_score("Charlie", 92)
board.add_score("David", 88)

print(f"Alice's rank: {board.get_rank('Alice')}")  # Output: 1
print(f"Bob's rank: {board.get_rank('Bob')}")      # Output: 3
print(f"Top 2 scores: {board.get_top_n(2)}")       # Output: [95, 92]
```

### Example 3: Finding Insertion Range for Duplicates

```python
import bisect

def find_all_occurrences(sorted_list, target):
    """
    Find all occurrences of a target value.
    Returns list of indices where target appears.
    """
    left_pos = bisect.bisect_left(sorted_list, target)
    right_pos = bisect.bisect_right(sorted_list, target)

    if left_pos == right_pos:
        return []  # Not found

    return list(range(left_pos, right_pos))

# Usage
data = [1, 2, 2, 2, 3, 4, 4, 5]
print(find_all_occurrences(data, 2))   # Output: [1, 2, 3]
print(find_all_occurrences(data, 4))   # Output: [5, 6]
print(find_all_occurrences(data, 6))   # Output: []
```

### Example 4: Working with Custom Objects (Using Key Parameter)

```python
import bisect
from typing import List, Any

class Student:
    def __init__(self, name: str, score: int):
        self.name = name
        self.score = score

    def __lt__(self, other):
        """Less than comparison for sorting."""
        return self.score < other.score

    def __eq__(self, other):
        """Equality comparison."""
        return self.score == other.score

    def __repr__(self):
        return f"Student({self.name}, {self.score})"

class StudentGradeManager:
    def __init__(self):
        self.students: List[Student] = []

    def add_student(self, name: str, score: int):
        """Add student while maintaining sorted order by score."""
        student = Student(name, score)
        bisect.insort(self.students, student)

    def find_students_above_score(self, min_score: int) -> List[Student]:
        """Find all students with score >= min_score."""
        # Create a dummy student for comparison
        dummy = Student("", min_score)
        pos = bisect.bisect_left(self.students, dummy)
        return self.students[pos:]

    def get_percentile_rank(self, score: int) -> float:
        """Get what percentile a score falls into."""
        dummy = Student("", score)
        pos = bisect.bisect_left(self.students, dummy)
        if len(self.students) == 0:
            return 0.0
        return (pos / len(self.students)) * 100

# Usage
manager = StudentGradeManager()
for name, score in [("Alice", 85), ("Bob", 92), ("Charlie", 78), ("David", 88)]:
    manager.add_student(name, score)

print("Students above 85:", manager.find_students_above_score(85))
print(f"Score 88 percentile: {manager.get_percentile_rank(88):.1f}%")
```

### Example 5: Range Queries - Finding Elements in a Range

```python
import bisect

def find_range(sorted_list, low, high):
    """
    Find all elements in sorted_list within [low, high] range.
    Returns list of elements in the range.
    """
    left_pos = bisect.bisect_left(sorted_list, low)
    right_pos = bisect.bisect_right(sorted_list, high)
    return sorted_list[left_pos:right_pos]

# Usage
numbers = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
print(find_range(numbers, 5, 15))      # Output: [5, 7, 9, 11, 13, 15]
print(find_range(numbers, 8, 12))      # Output: [9, 11]
print(find_range(numbers, 0, 2))       # Output: [1]
print(find_range(numbers, 20, 30))     # Output: []
```

### Example 6: Approximating Values (Without Exact Matches)

```python
import bisect

def find_closest_value(sorted_list, target):
    """
    Find the closest value to target in sorted_list.
    Uses bisect to efficiently narrow down candidates.
    """
    if not sorted_list:
        return None

    pos = bisect.bisect_left(sorted_list, target)

    # Check boundaries
    if pos == 0:
        return sorted_list[0]
    if pos == len(sorted_list):
        return sorted_list[-1]

    # Compare candidates on both sides
    left = sorted_list[pos - 1]
    right = sorted_list[pos]

    return left if abs(left - target) <= abs(right - target) else right

# Usage
numbers = [1, 3, 5, 7, 9, 11, 13]
print(find_closest_value(numbers, 6))   # Output: 5 (or 7, both distance 1)
print(find_closest_value(numbers, 8))   # Output: 9
print(find_closest_value(numbers, 2))   # Output: 1
print(find_closest_value(numbers, 15))  # Output: 13
```

## Best Practices

### Always Ensure Your Data is Sorted

```python
import bisect

# BAD: Using bisect on unsorted data
unsorted = [5, 2, 8, 1, 9]
pos = bisect.bisect_left(unsorted, 8)  # Wrong result!

# GOOD: Sort first, then use bisect
sorted_data = sorted(unsorted)
pos = bisect.bisect_left(sorted_data, 8)  # Correct!

# GOOD: Use the key parameter if data isn't naturally sortable
data = [('b', 2), ('a', 1), ('c', 3)]
sorted_data = sorted(data, key=lambda x: x[0])
pos = bisect.bisect_left(sorted_data, ('b',), key=lambda x: x[0])
```

### Choose Left or Right Variant Carefully

```python
import bisect

# Use bisect_left when you need the FIRST occurrence
scores = [10, 20, 20, 20, 30]
first_20_index = bisect.bisect_left(scores, 20)   # Index 1
print(f"First 20 at index: {first_20_index}")

# Use bisect_right (default) for standard insertion
# This is usually what you want
last_20_index = bisect.bisect_right(scores, 20)   # Index 4
print(f"Insert position after 20s: {last_20_index}")
```

### Prefer insort for In-Place Updates

```python
import bisect

# LESS EFFICIENT: Find position, then insert
data = [1, 3, 5, 7]
pos = bisect.bisect_left(data, 4)
data.insert(pos, 4)  # Extra operation

# MORE EFFICIENT: Use insort directly
data = [1, 3, 5, 7]
bisect.insort(data, 4)  # Single operation, maintains order
```

### Handle Key Functions for Custom Comparisons

```python
import bisect

# For custom objects, define comparison methods
class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    def __lt__(self, other):
        return self.price < other.price

    def __le__(self, other):
        return self.price <= other.price

    def __eq__(self, other):
        return self.price == other.price

    def __repr__(self):
        return f"Product({self.name}, ${self.price})"

# PYTHON 3.10+: Use key parameter for cleaner code
products = [Product("A", 10), Product("B", 30), Product("C", 20)]
products.sort(key=lambda p: p.price)

# Insert using comparison
new_product = Product("D", 15)
bisect.insort(products, new_product)
print(products)  # Products sorted by price
```

### Consider Memory with Large Datasets

```python
import bisect

# For very large sorted datasets, consider alternatives
# Array module for space efficiency
import array

# Regular list for flexibility
large_list = sorted(range(1000000))
pos = bisect.bisect_left(large_list, 500000)  # Still O(log n)

# If insertions are frequent and memory is critical,
# consider other data structures like balanced BSTs
# (not in stdlib, but available via sortedcontainers or blist packages)
```

## Common Pitfalls

### Pitfall 1: Forgetting to Sort Data First

```python
import bisect

# WRONG: Bisect assumes sorted input
data = [5, 2, 8, 1, 9]
result = bisect.bisect_left(data, 2)
print(result)  # Returns 1, but 2 is at index 1 in original (incorrect logic!)

# CORRECT
data = sorted(data)
result = bisect.bisect_left(data, 2)  # Returns 1 (correct)
```

**Why it matters**: Binary search divides the search space based on the assumption that smaller values are on the left. Unsorted data violates this assumption, leading to incorrect results.

### Pitfall 2: Confusing Bisect with Direct Search

```python
import bisect

# WRONG: Assuming bisect finds values
numbers = [1, 3, 5, 7, 9]
pos = bisect.bisect_left(numbers, 6)
print(pos)  # Returns 3, not the value!
print(numbers[pos])  # IndexError or wrong value!

# CORRECT: Check if value exists
pos = bisect.bisect_left(numbers, 6)
if pos < len(numbers) and numbers[pos] == 6:
    print("Found!")
else:
    print("Not found")
```

**Why it matters**: Bisect returns insertion points, not matching elements. You must verify the element exists at the returned position.

### Pitfall 3: Not Handling Duplicates Correctly

```python
import bisect

# WRONG: Deleting duplicates without considering all occurrences
data = [1, 2, 2, 2, 3, 4]
to_remove = 2

# Only removes one instance
pos = bisect.bisect_left(data, to_remove)
data.pop(pos)  # Only removes first 2

# CORRECT: Remove all occurrences
left = bisect.bisect_left(data, to_remove)
right = bisect.bisect_right(data, to_remove)
del data[left:right]
print(data)  # [1, 3, 4]
```

### Pitfall 4: Using bisect_left/right Incorrectly for Comparisons

```python
import bisect

# WRONG: Using position as a match indicator
scores = [10, 20, 30, 40, 50]
target = 25
pos = bisect.bisect_left(scores, target)
# pos == 2, but scores[2] == 30, not 25!
# This doesn't mean 25 is in the list

# CORRECT: Check actual value at position
if pos < len(scores) and scores[pos] == target:
    print("Found")
else:
    print(f"Not found. Would insert at position {pos}")
```

### Pitfall 5: Modifying List While Using Bisect Results

```python
import bisect

# WRONG: List changes after bisect
data = [1, 3, 5, 7, 9]
pos = bisect.bisect_left(data, 4)  # pos = 2
data.pop(1)  # Modify list!
# pos is now invalid
item_at_pos = data[pos]  # Might be wrong

# CORRECT: Use bisect results immediately or re-bisect
data = [1, 3, 5, 7, 9]
bisect.insort(data, 4)  # Atomic operation
# Position handling done internally
```

## Performance Considerations

### Time Complexity Analysis

```python
import bisect
import time

def compare_search_methods():
    """Compare bisect vs linear search performance."""

    sizes = [10_000, 100_000, 1_000_000]

    for size in sizes:
        data = list(range(0, size * 2, 2))  # sorted
        target = size  # middle value

        # Bisect search: O(log n)
        start = time.perf_counter()
        for _ in range(10_000):
            bisect.bisect_left(data, target)
        bisect_time = time.perf_counter() - start

        print(f"Size {size:>7}: bisect took {bisect_time*1000:.3f}ms")

compare_search_methods()
# Output shows bisect scales logarithmically
# Size   10000: bisect took 0.450ms
# Size  100000: bisect took 0.520ms
# Size 1000000: bisect took 0.620ms
```

### Space Complexity

```python
import bisect
import sys

# Bisect is O(1) space for search
# Insort is O(n) space (list resizing during insertion)

data = list(range(1_000_000))
print(f"List size: {sys.getsizeof(data) / 1024 / 1024:.2f} MB")

# Each insort may require list reallocation
# Python uses exponential growth strategy to amortize cost
bisect.insort(data, 500_000)
print(f"After insort: {sys.getsizeof(data) / 1024 / 1024:.2f} MB")
```

### When to Use Alternatives

```python
import bisect
from collections import deque

# Bisect is ideal for:
# - Frequent searches on static sorted data
# - Occasional insertions
# - Small to medium datasets

# Consider alternatives for:
# - Frequent insertions: use sortedcontainers.SortedList (3rd party)
# - Exact key-value storage: use dict or database
# - Range queries only: segment trees or B-trees (specialized structures)

# Example: When insort becomes slow due to many insertions
large_list = list(range(0, 100_000, 2))

# If you do thousands of insorts, collect then rebuild
new_values = [i for i in range(1, 100_000, 2)]
for val in new_values:
    bisect.insort(large_list, val)  # Slow: O(n) per insert

# BETTER: Extend and re-sort if many insertions
large_list.extend(new_values)
large_list.sort()  # O(n log n) once is better than many O(n) insorts
```

## Real-world Scenarios

### Scenario 1: Finding Percentiles in Large Datasets

```python
import bisect
import random

class DataAnalyzer:
    """Analyze percentiles of large datasets efficiently."""

    def __init__(self, data):
        self.sorted_data = sorted(data)

    def find_percentile(self, percentile):
        """Find value at given percentile."""
        if not (0 <= percentile <= 100):
            raise ValueError("Percentile must be 0-100")

        index = int((percentile / 100) * len(self.sorted_data))
        return self.sorted_data[index]

    def count_below(self, value):
        """Count how many values are below given value."""
        pos = bisect.bisect_left(self.sorted_data, value)
        return pos

    def count_in_range(self, low, high):
        """Count values in range [low, high]."""
        left_pos = bisect.bisect_left(self.sorted_data, low)
        right_pos = bisect.bisect_right(self.sorted_data, high)
        return right_pos - left_pos

# Usage: Analyze test scores
scores = [random.randint(0, 100) for _ in range(10_000)]
analyzer = DataAnalyzer(scores)

print(f"25th percentile: {analyzer.find_percentile(25)}")
print(f"50th percentile: {analyzer.find_percentile(50)}")
print(f"75th percentile: {analyzer.find_percentile(75)}")
print(f"Scores in 40-60 range: {analyzer.count_in_range(40, 60)}")
```

### Scenario 2: Scheduling - Finding Available Time Slots

```python
import bisect
from dataclasses import dataclass
from typing import List

@dataclass
class TimeSlot:
    start: int  # minutes since midnight
    end: int

    def __repr__(self):
        return f"{self.start:02d}:{self.start%60:02d}-{self.end:02d}:{self.end%60:02d}"

class Scheduler:
    """Find available time slots in a busy schedule."""

    def __init__(self):
        self.booked: List[TimeSlot] = []

    def add_booking(self, start: int, end: int):
        """Add a booked time slot."""
        slot = TimeSlot(start, end)
        bisect.insort(self.booked, slot, key=lambda s: s.start)

    def find_available_slot(self, duration: int) -> TimeSlot:
        """Find first available slot of given duration (in minutes)."""
        current_time = 0  # Start of business day

        for booked in self.booked:
            # Check if gap before this booking is long enough
            gap = booked.start - current_time
            if gap >= duration:
                return TimeSlot(current_time, current_time + duration)
            current_time = booked.end

        # Check gap after last booking
        return TimeSlot(current_time, current_time + duration)

    def is_available(self, start: int, end: int) -> bool:
        """Check if time slot is available."""
        # Find where this slot would be inserted
        dummy = TimeSlot(start, end)
        pos = bisect.bisect_left(self.booked, dummy, key=lambda s: s.start)

        # Check conflicts
        if pos > 0 and self.booked[pos - 1].end > start:
            return False
        if pos < len(self.booked) and self.booked[pos].start < end:
            return False

        return True

# Usage
scheduler = Scheduler()
scheduler.add_booking(540, 600)   # 9:00-10:00
scheduler.add_booking(660, 720)   # 11:00-12:00
scheduler.add_booking(780, 840)   # 13:00-14:00

print(f"Available 60-min slot: {scheduler.find_available_slot(60)}")
print(f"8:00-9:00 available: {scheduler.is_available(480, 540)}")  # True
print(f"9:30-10:30 available: {scheduler.is_available(570, 630)}")  # False
```

### Scenario 3: Price Tier Lookups

```python
import bisect

class PricingEngine:
    """Determine pricing based on quantity tiers."""

    def __init__(self):
        # Quantities at which pricing changes
        self.quantity_tiers = [1, 10, 50, 100, 500]
        # Corresponding prices per unit
        self.prices = [1.00, 0.90, 0.75, 0.60, 0.50]

    def get_price_per_unit(self, quantity: int) -> float:
        """Get unit price based on quantity."""
        # Find the tier this quantity falls into
        tier_idx = bisect.bisect_right(self.quantity_tiers, quantity) - 1
        tier_idx = max(0, tier_idx)  # Ensure non-negative
        return self.prices[tier_idx]

    def calculate_total_cost(self, quantity: int) -> float:
        """Calculate total cost for quantity."""
        price_per_unit = self.get_price_per_unit(quantity)
        return quantity * price_per_unit

# Usage
engine = PricingEngine()
print(f"Price for 5 units: ${engine.calculate_total_cost(5):.2f}")    # 1.00 each
print(f"Price for 20 units: ${engine.calculate_total_cost(20):.2f}")  # 0.90 each
print(f"Price for 200 units: ${engine.calculate_total_cost(200):.2f}")  # 0.60 each
```

### Scenario 4: Event Log Time Range Queries

```python
import bisect
from dataclasses import dataclass
from datetime import datetime
from typing import List

@dataclass
class LogEntry:
    timestamp: float  # Unix timestamp
    message: str

    def __lt__(self, other):
        return self.timestamp < other.timestamp

class LogAnalyzer:
    """Analyze application logs efficiently."""

    def __init__(self):
        self.logs: List[LogEntry] = []

    def add_log(self, timestamp: float, message: str):
        """Add log entry in chronological order."""
        entry = LogEntry(timestamp, message)
        bisect.insort(self.logs, entry)

    def get_logs_in_timerange(self, start: float, end: float) -> List[LogEntry]:
        """Get all logs within time range."""
        # Find range boundaries using dummy entries
        start_entry = LogEntry(start, "")
        end_entry = LogEntry(end, "")

        start_idx = bisect.bisect_left(self.logs, start_entry)
        end_idx = bisect.bisect_right(self.logs, end_entry)

        return self.logs[start_idx:end_idx]

    def count_errors_since(self, timestamp: float) -> int:
        """Count error logs since given timestamp."""
        start_entry = LogEntry(timestamp, "")
        start_idx = bisect.bisect_left(self.logs, start_entry)

        errors = sum(1 for log in self.logs[start_idx:] if "ERROR" in log.message)
        return errors

# Usage
analyzer = LogAnalyzer()
now = datetime.now().timestamp()

# Simulate logs
for i in range(10):
    analyzer.add_log(now + i * 60, f"INFO: Task {i} completed")
for i in range(3):
    analyzer.add_log(now + (i + 5) * 60, f"ERROR: Task {i} failed")

range_logs = analyzer.get_logs_in_timerange(now + 300, now + 600)
print(f"Logs in 5-10 minute range: {len(range_logs)}")
print(f"Errors since start: {analyzer.count_errors_since(now)}")
```

## Interview Points

### Key Concepts to Explain

**1. How does binary search work?**
```python
# Explain the algorithm
def manual_binary_search(arr, target):
    """Manual implementation showing binary search concept."""
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1  # Search right half
        else:
            right = mid - 1  # Search left half

    return -1  # Not found

# This is what bisect does internally, but optimized
```

**2. Why use bisect instead of writing binary search manually?**
```
- Tested, optimized, and bug-free
- Cleaner, more readable code
- Better performance (implemented in C)
- Guaranteed consistency
- Less room for off-by-one errors
```

**3. Difference between bisect_left and bisect_right:**
```python
# Interview example with duplicates
data = [1, 3, 3, 3, 5]
# bisect_left(data, 3) returns 1  <- before first 3
# bisect_right(data, 3) returns 4 <- after last 3

# Explains: why it matters for finding all occurrences
left = bisect.bisect_left(data, 3)
right = bisect.bisect_right(data, 3)
all_threes = data[left:right]  # [3, 3, 3]
```

**4. Time and Space Complexity:**
```
bisect_left/right: O(log n) time, O(1) space
insort_left/right: O(n) time (list shifting), O(1) space
```

**5. Common Interview Problems:**

```python
# Problem 1: Find insertion position
def searchInsert(nums, target):
    """LeetCode 35"""
    return bisect.bisect_left(nums, target)

# Problem 2: Count occurrences
def countOccurrences(nums, target):
    """Count how many times target appears"""
    left = bisect.bisect_left(nums, target)
    right = bisect.bisect_right(nums, target)
    return right - left

# Problem 3: Find peak element (requires modification)
def findPeakElement(nums):
    """Requires binary search with condition checking"""
    left, right = 0, len(nums) - 1
    while left < right:
        mid = (left + right) // 2
        if nums[mid] < nums[mid + 1]:
            left = mid + 1
        else:
            right = mid
    return left

# Problem 4: Range module (using bisect)
class RangeModule:
    def __init__(self):
        self.ranges = []

    def addRange(self, left: int, right: int):
        """Add a range, merging overlaps."""
        # Complex but bisect helps find insertion point
        pass
```

### Discussion Questions

1. **When would you use bisect over a dictionary for lookups?**
   - Answer: When you need range queries, ordered traversal, or working with sorted sequences

2. **How would you implement finding the smallest element >= target?**
   - Answer: Use `bisect_left` to find insertion point, then check if element exists

3. **Can bisect handle descending order?**
   - Answer: No, you need ascending order, but you can reverse then adjust

4. **What's the trade-off between insort and maintaining a sorted list?**
   - Answer: insort is convenient but O(n), consider collecting changes and re-sorting

## Further Reading

### Official Documentation
- [Python bisect module documentation](https://docs.python.org/3/library/bisect.html)
- [Binary search algorithm Wikipedia](https://en.wikipedia.org/wiki/Binary_search_algorithm)

### Related Modules
- `heapq` - for priority queue operations on sorted data
- `collections.deque` - efficient insertion at both ends
- `sortedcontainers` - third-party library with SortedList for frequent insertions

### Advanced Topics
- **Segment trees** - for range queries and updates
- **B-trees** - for database indexing
- **Balanced BSTs** - AVL trees, Red-Black trees
- **Self-balancing data structures** - maintain sorted order with efficient insertion

### Practice Problems
- LeetCode 35: Search Insert Position
- LeetCode 34: Find First and Last Position of Element in Sorted Array
- LeetCode 153: Find Minimum in Rotated Sorted Array
- LeetCode 378: Kth Smallest Element in a Sorted Matrix
- LeetCode 1351: Count Negative Numbers in Sorted Matrix

### Key Takeaways

1. **Bisect is for binary search on sorted sequences** - Use it for O(log n) lookups and range queries

2. **Know when to use left vs. right variants** - left for first occurrence, right for standard insertion

3. **Always ensure data is sorted first** - Bisect doesn't sort, it assumes sorted input

4. **Use insort for convenience, not efficiency** - It's O(n) due to list shifting

5. **Combine with other techniques** - Bisect often works best with custom key functions and comparisons

6. **Consider alternatives for heavy insertion** - Use SortedList from sortedcontainers for frequent updates

7. **Master binary search fundamentals** - Understanding how bisect works makes you a better programmer
