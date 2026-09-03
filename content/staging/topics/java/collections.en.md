---
title: Java Collections Framework
description: "Master Java Collections Framework: List, Set, Queue, Map and implementations"
track: java
section: collections-streams
difficulty: intermediate
tags:
  - Java
  - Collections
  - List
  - Map
status: imported
origin: old/src/content/docs/java/collections.en.md
divergence: 0.293
issues: []
legacy:
  category: Java
  subcategory: Collections Framework
  order: 4
  lastUpdated: 2026-01-07
---

The Java Collections Framework is a unified architecture for representing and manipulating collections of objects. It provides a set of interfaces, implementations, and algorithms that enable efficient storage, retrieval, and manipulation of groups of objects.

## Overview

The Collections Framework consists of:

- **Interfaces**: Abstract data types that represent collections (List, Set, Queue, Map)
- **Implementations**: Concrete implementations of collection interfaces
- **Algorithms**: Methods that perform useful computations on collections (sorting, searching)

### Key Benefits

- **Reduced programming effort**: Reusable data structures and algorithms
- **Increased performance**: High-performance implementations
- **Interoperability**: Collections can be passed and returned from methods uniformly
- **Reduced learning effort**: Consistent API across different collection types

## Collection Hierarchy

```
                    Collection<E>
                          |
          +---------------+---------------+
          |               |               |
       List<E>         Set<E>         Queue<E>
                          |
                    SortedSet<E>
                          |
                   NavigableSet<E>

                    Map<K,V>
                          |
                   SortedMap<K,V>
                          |
                  NavigableMap<K,V>
```

## List Implementations

Lists are ordered collections that allow duplicate elements. Elements can be accessed by their integer index.

### ArrayList

`ArrayList` is a resizable array implementation. It provides fast random access but slower insertions/deletions in the middle.

```java
import java.util.ArrayList;
import java.util.List;

public class ArrayListExample {
    public static void main(String[] args) {
        // Creating an ArrayList
        List<String> fruits = new ArrayList<>();

        // Adding elements
        fruits.add("Apple");
        fruits.add("Banana");
        fruits.add("Cherry");
        fruits.add("Apple"); // Duplicates allowed

        // Accessing elements
        System.out.println("First fruit: " + fruits.get(0)); // Apple

        // Updating elements
        fruits.set(1, "Blueberry");

        // Removing elements
        fruits.remove("Cherry");
        fruits.remove(0); // Remove by index

        // Size and checking
        System.out.println("Size: " + fruits.size());
        System.out.println("Contains Banana: " + fruits.contains("Banana"));

        // Iterating
        for (String fruit : fruits) {
            System.out.println(fruit);
        }
    }
}
```

**Time Complexity**:
- Access: O(1)
- Search: O(n)
- Insertion: O(n) (O(1) amortized at end)
- Deletion: O(n)

### LinkedList

`LinkedList` is a doubly-linked list implementation. It provides fast insertions/deletions but slower random access.

```java
import java.util.LinkedList;
import java.util.List;

public class LinkedListExample {
    public static void main(String[] args) {
        LinkedList<String> tasks = new LinkedList<>();

        // Adding elements
        tasks.add("Task 1");
        tasks.add("Task 2");
        tasks.addFirst("Urgent Task"); // Add at beginning
        tasks.addLast("Low Priority");  // Add at end

        // Queue operations
        tasks.offerFirst("New Urgent");
        tasks.offerLast("Another Task");

        // Removing from ends
        System.out.println("First: " + tasks.pollFirst());
        System.out.println("Last: " + tasks.pollLast());

        // Peek without removing
        System.out.println("Peek first: " + tasks.peekFirst());

        // LinkedList implements both List and Deque interfaces
        System.out.println("All tasks: " + tasks);
    }
}
```

**Time Complexity**:
- Access: O(n)
- Search: O(n)
- Insertion: O(1) at ends, O(n) in middle
- Deletion: O(1) at ends, O(n) in middle

### Vector and Stack

`Vector` is a synchronized version of ArrayList (legacy, use ArrayList with synchronization if needed).
`Stack` extends Vector and provides LIFO operations (consider using `Deque` instead).

```java
import java.util.Stack;

public class StackExample {
    public static void main(String[] args) {
        Stack<Integer> stack = new Stack<>();

        // Push elements
        stack.push(10);
        stack.push(20);
        stack.push(30);

        // Peek top element
        System.out.println("Top: " + stack.peek()); // 30

        // Pop elements
        System.out.println("Popped: " + stack.pop()); // 30
        System.out.println("Popped: " + stack.pop()); // 20

        // Check if empty
        System.out.println("Empty: " + stack.isEmpty()); // false

        // Modern alternative using Deque
        java.util.Deque<Integer> dequeStack = new java.util.ArrayDeque<>();
        dequeStack.push(10);
        dequeStack.push(20);
        System.out.println("Deque pop: " + dequeStack.pop()); // 20
    }
}
```

## Set Implementations

Sets are collections that do not allow duplicate elements. They model the mathematical set abstraction.

### HashSet

`HashSet` uses a hash table for storage. It offers constant-time performance for basic operations but does not maintain order.

```java
import java.util.HashSet;
import java.util.Set;

public class HashSetExample {
    public static void main(String[] args) {
        Set<String> countries = new HashSet<>();

        // Adding elements
        countries.add("USA");
        countries.add("Canada");
        countries.add("Mexico");
        countries.add("USA"); // Duplicate - won't be added

        System.out.println("Size: " + countries.size()); // 3

        // Checking membership
        System.out.println("Contains Canada: " + countries.contains("Canada"));

        // Removing elements
        countries.remove("Mexico");

        // Set operations
        Set<String> european = new HashSet<>();
        european.add("France");
        european.add("Germany");
        european.add("USA");

        // Union
        Set<String> union = new HashSet<>(countries);
        union.addAll(european);
        System.out.println("Union: " + union);

        // Intersection
        Set<String> intersection = new HashSet<>(countries);
        intersection.retainAll(european);
        System.out.println("Intersection: " + intersection);

        // Difference
        Set<String> difference = new HashSet<>(countries);
        difference.removeAll(european);
        System.out.println("Difference: " + difference);
    }
}
```

**Time Complexity**:
- Add: O(1)
- Remove: O(1)
- Contains: O(1)

### LinkedHashSet

`LinkedHashSet` maintains insertion order using a linked list in addition to the hash table.

```java
import java.util.LinkedHashSet;
import java.util.Set;

public class LinkedHashSetExample {
    public static void main(String[] args) {
        Set<String> orderedSet = new LinkedHashSet<>();

        orderedSet.add("First");
        orderedSet.add("Second");
        orderedSet.add("Third");
        orderedSet.add("First"); // Duplicate ignored

        // Maintains insertion order
        for (String item : orderedSet) {
            System.out.println(item); // First, Second, Third
        }
    }
}
```

### TreeSet

`TreeSet` uses a Red-Black tree structure and maintains elements in sorted order.

```java
import java.util.TreeSet;
import java.util.Set;
import java.util.NavigableSet;

public class TreeSetExample {
    public static void main(String[] args) {
        NavigableSet<Integer> numbers = new TreeSet<>();

        // Adding elements
        numbers.add(50);
        numbers.add(20);
        numbers.add(80);
        numbers.add(10);
        numbers.add(30);

        // Elements are sorted
        System.out.println("Sorted: " + numbers); // [10, 20, 30, 50, 80]

        // NavigableSet operations
        System.out.println("First: " + numbers.first()); // 10
        System.out.println("Last: " + numbers.last()); // 80
        System.out.println("Lower than 50: " + numbers.lower(50)); // 30
        System.out.println("Higher than 50: " + numbers.higher(50)); // 80
        System.out.println("Floor of 25: " + numbers.floor(25)); // 20
        System.out.println("Ceiling of 25: " + numbers.ceiling(25)); // 30

        // Subset operations
        System.out.println("HeadSet (< 50): " + numbers.headSet(50)); // [10, 20, 30]
        System.out.println("TailSet (>= 30): " + numbers.tailSet(30)); // [30, 50, 80]
        System.out.println("SubSet [20, 80): " + numbers.subSet(20, 80)); // [20, 30, 50]

        // Custom comparator
        TreeSet<String> reverseSet = new TreeSet<>((a, b) -> b.compareTo(a));
        reverseSet.add("Apple");
        reverseSet.add("Banana");
        reverseSet.add("Cherry");
        System.out.println("Reverse: " + reverseSet); // [Cherry, Banana, Apple]
    }
}
```

**Time Complexity**:
- Add: O(log n)
- Remove: O(log n)
- Contains: O(log n)

## Queue Implementations

Queues typically order elements in FIFO (first-in-first-out) manner, though priority queues order elements by priority.

### LinkedList as Queue

```java
import java.util.Queue;
import java.util.LinkedList;

public class QueueExample {
    public static void main(String[] args) {
        Queue<String> queue = new LinkedList<>();

        // Adding elements
        queue.offer("Customer 1");
        queue.offer("Customer 2");
        queue.offer("Customer 3");

        // Peek at front
        System.out.println("Front: " + queue.peek()); // Customer 1

        // Remove from front
        System.out.println("Serving: " + queue.poll()); // Customer 1
        System.out.println("Serving: " + queue.poll()); // Customer 2

        // Check size
        System.out.println("Remaining: " + queue.size()); // 1
    }
}
```

### PriorityQueue

`PriorityQueue` orders elements based on their natural ordering or a custom comparator.

```java
import java.util.PriorityQueue;
import java.util.Queue;
import java.util.Comparator;

public class PriorityQueueExample {
    public static void main(String[] args) {
        // Min heap (default)
        Queue<Integer> minHeap = new PriorityQueue<>();
        minHeap.offer(30);
        minHeap.offer(10);
        minHeap.offer(50);
        minHeap.offer(20);

        System.out.println("Min heap polling:");
        while (!minHeap.isEmpty()) {
            System.out.print(minHeap.poll() + " "); // 10 20 30 50
        }
        System.out.println();

        // Max heap
        Queue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        maxHeap.offer(30);
        maxHeap.offer(10);
        maxHeap.offer(50);
        maxHeap.offer(20);

        System.out.println("Max heap polling:");
        while (!maxHeap.isEmpty()) {
            System.out.print(maxHeap.poll() + " "); // 50 30 20 10
        }
        System.out.println();

        // Custom objects with priority
        PriorityQueue<Task> taskQueue = new PriorityQueue<>(
            Comparator.comparingInt(Task::getPriority).reversed()
        );

        taskQueue.offer(new Task("Low priority task", 1));
        taskQueue.offer(new Task("High priority task", 5));
        taskQueue.offer(new Task("Medium priority task", 3));

        System.out.println("Tasks by priority:");
        while (!taskQueue.isEmpty()) {
            Task task = taskQueue.poll();
            System.out.println(task.getName() + " (Priority: " + task.getPriority() + ")");
        }
    }

    static class Task {
        private String name;
        private int priority;

        public Task(String name, int priority) {
            this.name = name;
            this.priority = priority;
        }

        public String getName() { return name; }
        public int getPriority() { return priority; }
    }
}
```

### ArrayDeque

`ArrayDeque` (Double-Ended Queue) is a resizable array implementation that can be used as a stack or queue.

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class ArrayDequeExample {
    public static void main(String[] args) {
        Deque<String> deque = new ArrayDeque<>();

        // Add to both ends
        deque.addFirst("First");
        deque.addLast("Last");
        deque.addFirst("New First");
        deque.addLast("New Last");

        System.out.println("Deque: " + deque);
        // [New First, First, Last, New Last]

        // Remove from both ends
        System.out.println("Remove first: " + deque.removeFirst()); // New First
        System.out.println("Remove last: " + deque.removeLast()); // New Last

        // Use as stack
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(1);
        stack.push(2);
        stack.push(3);
        System.out.println("Pop: " + stack.pop()); // 3

        // Use as queue
        Deque<String> queue = new ArrayDeque<>();
        queue.offer("A");
        queue.offer("B");
        queue.offer("C");
        System.out.println("Poll: " + queue.poll()); // A
    }
}
```

## Map Implementations

Maps store key-value pairs and do not allow duplicate keys.

### HashMap

`HashMap` uses a hash table and provides constant-time performance for basic operations.

```java
import java.util.HashMap;
import java.util.Map;

public class HashMapExample {
    public static void main(String[] args) {
        Map<String, Integer> studentGrades = new HashMap<>();

        // Adding entries
        studentGrades.put("Alice", 95);
        studentGrades.put("Bob", 87);
        studentGrades.put("Charlie", 92);
        studentGrades.put("Alice", 98); // Updates existing value

        // Accessing values
        System.out.println("Alice's grade: " + studentGrades.get("Alice")); // 98

        // Check if key exists
        System.out.println("Has Bob: " + studentGrades.containsKey("Bob"));

        // Check if value exists
        System.out.println("Has grade 92: " + studentGrades.containsValue(92));

        // Get with default
        System.out.println("David's grade: " +
            studentGrades.getOrDefault("David", 0)); // 0

        // Remove entry
        studentGrades.remove("Charlie");

        // Iterating over entries
        System.out.println("\nAll grades:");
        for (Map.Entry<String, Integer> entry : studentGrades.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }

        // Iterating over keys
        System.out.println("\nStudents:");
        for (String student : studentGrades.keySet()) {
            System.out.println(student);
        }

        // Iterating over values
        System.out.println("\nGrades:");
        for (Integer grade : studentGrades.values()) {
            System.out.println(grade);
        }

        // Java 8+ operations
        studentGrades.putIfAbsent("David", 85);
        studentGrades.compute("Bob", (k, v) -> v + 5);
        studentGrades.merge("Alice", 100, Integer::max);

        // forEach with lambda
        studentGrades.forEach((name, grade) ->
            System.out.println(name + " scored " + grade));
    }
}
```

**Time Complexity**:
- Get: O(1)
- Put: O(1)
- Remove: O(1)
- Contains: O(1)

### LinkedHashMap

`LinkedHashMap` maintains insertion order (or access order if configured).

```java
import java.util.LinkedHashMap;
import java.util.Map;

public class LinkedHashMapExample {
    public static void main(String[] args) {
        // Insertion order
        Map<String, String> insertionOrder = new LinkedHashMap<>();
        insertionOrder.put("First", "1");
        insertionOrder.put("Second", "2");
        insertionOrder.put("Third", "3");

        System.out.println("Insertion order: " + insertionOrder);

        // Access order (LRU cache)
        Map<String, String> accessOrder = new LinkedHashMap<>(16, 0.75f, true);
        accessOrder.put("A", "1");
        accessOrder.put("B", "2");
        accessOrder.put("C", "3");

        accessOrder.get("A"); // Access A
        accessOrder.get("B"); // Access B

        System.out.println("Access order: " + accessOrder);
        // C is least recently used, then A, then B

        // LRU Cache implementation
        Map<String, String> lruCache = new LinkedHashMap<String, String>(
            16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
                return size() > 3; // Max 3 entries
            }
        };

        lruCache.put("1", "One");
        lruCache.put("2", "Two");
        lruCache.put("3", "Three");
        lruCache.put("4", "Four"); // "1" will be removed

        System.out.println("LRU Cache: " + lruCache);
    }
}
```

### TreeMap

`TreeMap` uses a Red-Black tree and maintains keys in sorted order.

```java
import java.util.TreeMap;
import java.util.NavigableMap;
import java.util.Map;

public class TreeMapExample {
    public static void main(String[] args) {
        NavigableMap<Integer, String> map = new TreeMap<>();

        // Adding entries
        map.put(3, "Three");
        map.put(1, "One");
        map.put(5, "Five");
        map.put(2, "Two");
        map.put(4, "Four");

        // Sorted by keys
        System.out.println("Sorted map: " + map);
        // {1=One, 2=Two, 3=Three, 4=Four, 5=Five}

        // NavigableMap operations
        System.out.println("First entry: " + map.firstEntry()); // 1=One
        System.out.println("Last entry: " + map.lastEntry()); // 5=Five
        System.out.println("Lower key (3): " + map.lowerEntry(3)); // 2=Two
        System.out.println("Higher key (3): " + map.higherEntry(3)); // 4=Four
        System.out.println("Floor entry (3.5): " + map.floorEntry((int)3.5)); // 3=Three
        System.out.println("Ceiling entry (3.5): " + map.ceilingEntry((int)3.5)); // 4=Four

        // Submap operations
        System.out.println("HeadMap (< 3): " + map.headMap(3)); // {1=One, 2=Two}
        System.out.println("TailMap (>= 3): " + map.tailMap(3));
        // {3=Three, 4=Four, 5=Five}
        System.out.println("SubMap [2, 5): " + map.subMap(2, 5));
        // {2=Two, 3=Three, 4=Four}

        // Descending order
        System.out.println("Descending: " + map.descendingMap());

        // Custom comparator
        TreeMap<String, Integer> reverseMap = new TreeMap<>((a, b) -> b.compareTo(a));
        reverseMap.put("Apple", 1);
        reverseMap.put("Banana", 2);
        reverseMap.put("Cherry", 3);
        System.out.println("Reverse: " + reverseMap);
        // {Cherry=3, Banana=2, Apple=1}
    }
}
```

**Time Complexity**:
- Get: O(log n)
- Put: O(log n)
- Remove: O(log n)

### Hashtable and Properties

`Hashtable` is a synchronized legacy class (use `ConcurrentHashMap` instead).
`Properties` extends Hashtable and is used for configuration files.

```java
import java.util.Properties;
import java.io.FileInputStream;
import java.io.FileOutputStream;

public class PropertiesExample {
    public static void main(String[] args) {
        Properties props = new Properties();

        // Setting properties
        props.setProperty("database.url", "jdbc:mysql://localhost:3306/mydb");
        props.setProperty("database.username", "admin");
        props.setProperty("database.password", "secret");

        // Getting properties
        String url = props.getProperty("database.url");
        String timeout = props.getProperty("timeout", "30"); // Default value

        System.out.println("URL: " + url);
        System.out.println("Timeout: " + timeout);

        // Listing all properties
        props.forEach((key, value) ->
            System.out.println(key + " = " + value));

        // Note: In real applications, load/store from files
        // props.load(new FileInputStream("config.properties"));
        // props.store(new FileOutputStream("config.properties"), "Comments");
    }
}
```

## Collections Utility Class

The `Collections` class provides static methods for common operations on collections.

```java
import java.util.*;

public class CollectionsUtilityExample {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>(Arrays.asList(5, 2, 8, 1, 9, 3));

        // Sorting
        Collections.sort(numbers);
        System.out.println("Sorted: " + numbers); // [1, 2, 3, 5, 8, 9]

        // Reverse
        Collections.reverse(numbers);
        System.out.println("Reversed: " + numbers); // [9, 8, 5, 3, 2, 1]

        // Shuffle
        Collections.shuffle(numbers);
        System.out.println("Shuffled: " + numbers);

        // Binary search (requires sorted list)
        Collections.sort(numbers);
        int index = Collections.binarySearch(numbers, 5);
        System.out.println("Index of 5: " + index);

        // Min and Max
        System.out.println("Min: " + Collections.min(numbers));
        System.out.println("Max: " + Collections.max(numbers));

        // Frequency
        numbers.add(5);
        numbers.add(5);
        System.out.println("Frequency of 5: " + Collections.frequency(numbers, 5));

        // Rotate
        List<String> letters = new ArrayList<>(Arrays.asList("A", "B", "C", "D", "E"));
        Collections.rotate(letters, 2);
        System.out.println("Rotated: " + letters); // [D, E, A, B, C]

        // Fill
        List<String> filled = new ArrayList<>(Arrays.asList("X", "Y", "Z"));
        Collections.fill(filled, "A");
        System.out.println("Filled: " + filled); // [A, A, A]

        // Copy
        List<String> source = Arrays.asList("1", "2", "3");
        List<String> dest = new ArrayList<>(Arrays.asList("A", "B", "C"));
        Collections.copy(dest, source);
        System.out.println("Copied: " + dest); // [1, 2, 3]

        // Swap
        Collections.swap(dest, 0, 2);
        System.out.println("Swapped: " + dest); // [3, 2, 1]

        // Replace all
        List<String> words = new ArrayList<>(Arrays.asList("cat", "dog", "cat", "bird"));
        Collections.replaceAll(words, "cat", "kitten");
        System.out.println("Replaced: " + words); // [kitten, dog, kitten, bird]

        // Unmodifiable collections
        List<String> unmodifiable = Collections.unmodifiableList(words);
        // unmodifiable.add("test"); // Throws UnsupportedOperationException

        // Synchronized collections
        List<String> syncList = Collections.synchronizedList(new ArrayList<>());

        // Empty collections
        List<String> emptyList = Collections.emptyList();
        Set<String> emptySet = Collections.emptySet();
        Map<String, String> emptyMap = Collections.emptyMap();

        // Singleton collections
        Set<String> singleton = Collections.singleton("Only");
        System.out.println("Singleton: " + singleton); // [Only]

        // nCopies
        List<String> copies = Collections.nCopies(5, "Copy");
        System.out.println("Copies: " + copies); // [Copy, Copy, Copy, Copy, Copy]

        // Disjoint check
        List<Integer> list1 = Arrays.asList(1, 2, 3);
        List<Integer> list2 = Arrays.asList(4, 5, 6);
        List<Integer> list3 = Arrays.asList(3, 4, 5);
        System.out.println("Disjoint (1,2): " + Collections.disjoint(list1, list2)); // true
        System.out.println("Disjoint (1,3): " + Collections.disjoint(list1, list3)); // false

        // Add all
        List<String> target = new ArrayList<>();
        Collections.addAll(target, "A", "B", "C", "D");
        System.out.println("AddAll: " + target);
    }
}
```

## Iterators

Iterators provide a way to traverse collections and optionally remove elements during iteration.

### Iterator Interface

```java
import java.util.*;

public class IteratorExample {
    public static void main(String[] args) {
        List<String> fruits = new ArrayList<>(
            Arrays.asList("Apple", "Banana", "Cherry", "Date", "Elderberry")
        );

        // Basic Iterator
        Iterator<String> iterator = fruits.iterator();
        while (iterator.hasNext()) {
            String fruit = iterator.next();
            System.out.println(fruit);

            // Remove during iteration
            if (fruit.equals("Cherry")) {
                iterator.remove(); // Safe removal
            }
        }
        System.out.println("After removal: " + fruits);

        // Enhanced for-each loop (uses iterator internally)
        for (String fruit : fruits) {
            System.out.println(fruit);
            // Cannot remove during enhanced for-each
        }

        // Java 8+ forEach with lambda
        fruits.forEach(fruit -> System.out.println(fruit));

        // forEachRemaining
        Iterator<String> iter = fruits.iterator();
        iter.next(); // Skip first
        iter.forEachRemaining(System.out::println);
    }
}
```

### ListIterator Interface

`ListIterator` extends Iterator and allows bidirectional traversal and modification.

```java
import java.util.*;

public class ListIteratorExample {
    public static void main(String[] args) {
        List<String> colors = new ArrayList<>(
            Arrays.asList("Red", "Green", "Blue", "Yellow")
        );

        ListIterator<String> listIter = colors.listIterator();

        // Forward iteration
        System.out.println("Forward:");
        while (listIter.hasNext()) {
            int index = listIter.nextIndex();
            String color = listIter.next();
            System.out.println(index + ": " + color);

            // Modify during iteration
            if (color.equals("Green")) {
                listIter.set("Lime"); // Replace
            }

            // Add during iteration
            if (color.equals("Blue")) {
                listIter.add("Purple"); // Add after current
            }
        }

        System.out.println("\nBackward:");
        // Backward iteration
        while (listIter.hasPrevious()) {
            int index = listIter.previousIndex();
            String color = listIter.previous();
            System.out.println(index + ": " + color);
        }

        System.out.println("\nModified list: " + colors);

        // Start from specific position
        ListIterator<String> iter2 = colors.listIterator(2);
        System.out.println("From index 2: " + iter2.next());
    }
}
```

### Fail-Fast vs Fail-Safe Iterators

```java
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

public class FailFastFailSafeExample {
    public static void main(String[] args) {
        // Fail-Fast Iterator (throws ConcurrentModificationException)
        System.out.println("Fail-Fast Example:");
        List<String> failFastList = new ArrayList<>(Arrays.asList("A", "B", "C"));

        try {
            for (String item : failFastList) {
                System.out.println(item);
                if (item.equals("B")) {
                    failFastList.remove(item); // ConcurrentModificationException
                }
            }
        } catch (ConcurrentModificationException e) {
            System.out.println("ConcurrentModificationException caught!");
        }

        // Fail-Safe Iterator (works on a copy)
        System.out.println("\nFail-Safe Example:");
        List<String> failSafeList = new CopyOnWriteArrayList<>(
            Arrays.asList("A", "B", "C")
        );

        for (String item : failSafeList) {
            System.out.println(item);
            if (item.equals("B")) {
                failSafeList.remove(item); // No exception
            }
        }
        System.out.println("After removal: " + failSafeList);

        // Using Iterator.remove() is safe for fail-fast collections
        System.out.println("\nSafe removal with Iterator:");
        List<String> safeList = new ArrayList<>(Arrays.asList("A", "B", "C"));
        Iterator<String> iter = safeList.iterator();
        while (iter.hasNext()) {
            String item = iter.next();
            System.out.println(item);
            if (item.equals("B")) {
                iter.remove(); // Safe
            }
        }
        System.out.println("After safe removal: " + safeList);

        // ConcurrentHashMap is also fail-safe
        Map<String, Integer> concurrentMap = new ConcurrentHashMap<>();
        concurrentMap.put("A", 1);
        concurrentMap.put("B", 2);
        concurrentMap.put("C", 3);

        for (String key : concurrentMap.keySet()) {
            System.out.println(key);
            if (key.equals("B")) {
                concurrentMap.remove(key); // Safe
            }
        }
        System.out.println("After removal: " + concurrentMap);
    }
}
```

### Spliterator Interface

`Spliterator` (introduced in Java 8) supports parallel iteration over elements.

```java
import java.util.*;
import java.util.stream.StreamSupport;

public class SpliteratorExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // Get spliterator
        Spliterator<Integer> spliterator = numbers.spliterator();

        // Characteristics
        System.out.println("Characteristics: " + spliterator.characteristics());
        System.out.println("Exact size: " + spliterator.getExactSizeIfKnown());

        // Try advance
        spliterator.tryAdvance(n -> System.out.println("First: " + n));

        // For each remaining
        System.out.println("Remaining:");
        spliterator.forEachRemaining(n -> System.out.print(n + " "));
        System.out.println();

        // Try split for parallel processing
        Spliterator<Integer> spliterator2 = numbers.spliterator();
        Spliterator<Integer> split1 = spliterator2.trySplit();

        System.out.println("\nFirst half:");
        if (split1 != null) {
            split1.forEachRemaining(n -> System.out.print(n + " "));
        }

        System.out.println("\nSecond half:");
        spliterator2.forEachRemaining(n -> System.out.print(n + " "));
        System.out.println();

        // Use with streams for parallel processing
        long sum = StreamSupport.stream(numbers.spliterator(), true)
            .parallel()
            .mapToInt(Integer::intValue)
            .sum();
        System.out.println("\nParallel sum: " + sum);
    }
}
```

## Best Practices

### Choose the Right Collection

```java
import java.util.*;

public class CollectionChoiceExample {
    public static void main(String[] args) {
        // Use ArrayList for random access and iteration
        List<String> randomAccess = new ArrayList<>();

        // Use LinkedList for frequent insertions/deletions
        List<String> frequentModifications = new LinkedList<>();

        // Use HashSet for fast lookups without order
        Set<String> uniqueItems = new HashSet<>();

        // Use LinkedHashSet for unique items with insertion order
        Set<String> orderedUnique = new LinkedHashSet<>();

        // Use TreeSet for sorted unique items
        Set<String> sortedUnique = new TreeSet<>();

        // Use HashMap for key-value pairs
        Map<String, Integer> keyValue = new HashMap<>();

        // Use TreeMap for sorted keys
        Map<String, Integer> sortedKeys = new TreeMap<>();

        // Use ArrayDeque for stack/queue operations
        Deque<String> deque = new ArrayDeque<>();

        // Use PriorityQueue for priority-based processing
        Queue<Integer> priorityQueue = new PriorityQueue<>();
    }
}
```

### Use Interfaces for Type Declarations

```java
import java.util.*;

public class InterfaceTypeExample {
    // Good: Flexible implementation
    public void processItems(List<String> items) {
        for (String item : items) {
            System.out.println(item);
        }
    }

    // Bad: Tied to specific implementation
    public void processItemsBad(ArrayList<String> items) {
        for (String item : items) {
            System.out.println(item);
        }
    }

    public static void main(String[] args) {
        InterfaceTypeExample example = new InterfaceTypeExample();

        // Can pass any List implementation
        example.processItems(new ArrayList<>(Arrays.asList("A", "B")));
        example.processItems(new LinkedList<>(Arrays.asList("C", "D")));

        // Prefer interface types
        List<String> list = new ArrayList<>();  // Good
        // ArrayList<String> list2 = new ArrayList<>();  // Avoid

        Set<String> set = new HashSet<>();      // Good
        Map<String, Integer> map = new HashMap<>();  // Good
    }
}
```

### Use Generics for Type Safety

```java
import java.util.*;

public class GenericsExample {
    public static void main(String[] args) {
        // Without generics (avoid)
        List rawList = new ArrayList();
        rawList.add("String");
        rawList.add(123);  // No compile-time error
        // String s = (String) rawList.get(1);  // Runtime ClassCastException

        // With generics (preferred)
        List<String> typedList = new ArrayList<>();
        typedList.add("String");
        // typedList.add(123);  // Compile-time error
        String s = typedList.get(0);  // No cast needed

        // Generic methods
        Integer[] numbers = {1, 2, 3, 4, 5};
        List<Integer> numberList = arrayToList(numbers);
        System.out.println(numberList);
    }

    // Generic method
    public static <T> List<T> arrayToList(T[] array) {
        List<T> list = new ArrayList<>();
        for (T element : array) {
            list.add(element);
        }
        return list;
    }
}
```

### Initialize Collections with Capacity

```java
import java.util.*;

public class CapacityExample {
    public static void main(String[] args) {
        // If you know the size, initialize with capacity
        int expectedSize = 1000;

        List<String> list = new ArrayList<>(expectedSize);
        Set<String> set = new HashSet<>(expectedSize);
        Map<String, Integer> map = new HashMap<>(expectedSize);

        // Default capacity (avoid if size is known)
        List<String> defaultList = new ArrayList<>();  // Capacity 10

        // Load factor for HashMap
        Map<String, String> customMap = new HashMap<>(16, 0.75f);
    }
}
```

### Immutable Collections

```java
import java.util.*;

public class ImmutableExample {
    public static void main(String[] args) {
        // Java 9+ List.of, Set.of, Map.of
        List<String> immutableList = List.of("A", "B", "C");
        Set<Integer> immutableSet = Set.of(1, 2, 3);
        Map<String, Integer> immutableMap = Map.of("A", 1, "B", 2);

        // immutableList.add("D");  // UnsupportedOperationException

        // For more than 10 entries in Map
        Map<String, Integer> largeMap = Map.ofEntries(
            Map.entry("A", 1),
            Map.entry("B", 2),
            Map.entry("C", 3)
        );

        // Collections.unmodifiableXxx (older approach)
        List<String> mutableList = new ArrayList<>(Arrays.asList("X", "Y"));
        List<String> unmodifiable = Collections.unmodifiableList(mutableList);
        // unmodifiable.add("Z");  // UnsupportedOperationException

        // Note: unmodifiable is a view, changes to original affect it
        mutableList.add("Z");
        System.out.println(unmodifiable);  // [X, Y, Z]

        // For true immutability, copy first
        List<String> trulyImmutable = Collections.unmodifiableList(
            new ArrayList<>(mutableList)
        );
    }
}
```

### Null Handling

```java
import java.util.*;

public class NullHandlingExample {
    public static void main(String[] args) {
        // Some collections don't allow null
        // List<String> list = List.of(null);  // NullPointerException

        // ArrayList allows null
        List<String> arrayList = new ArrayList<>();
        arrayList.add(null);
        arrayList.add("A");
        System.out.println(arrayList);  // [null, A]

        // HashMap allows null key and values
        Map<String, String> hashMap = new HashMap<>();
        hashMap.put(null, "null key");
        hashMap.put("key", null);
        System.out.println(hashMap);

        // TreeMap doesn't allow null keys
        // TreeMap<String, String> treeMap = new TreeMap<>();
        // treeMap.put(null, "value");  // NullPointerException

        // HashSet allows null
        Set<String> hashSet = new HashSet<>();
        hashSet.add(null);
        hashSet.add("A");
        System.out.println(hashSet);

        // TreeSet doesn't allow null
        // TreeSet<String> treeSet = new TreeSet<>();
        // treeSet.add(null);  // NullPointerException

        // Use Optional to avoid nulls
        Map<String, String> map = new HashMap<>();
        Optional<String> value = Optional.ofNullable(map.get("key"));
        System.out.println(value.orElse("default"));
    }
}
```

### Concurrent Collections

```java
import java.util.*;
import java.util.concurrent.*;

public class ConcurrentExample {
    public static void main(String[] args) {
        // Thread-safe collections

        // Instead of Collections.synchronizedList
        List<String> syncList = Collections.synchronizedList(new ArrayList<>());

        // Better: CopyOnWriteArrayList (for read-heavy scenarios)
        List<String> cowList = new CopyOnWriteArrayList<>();

        // Instead of Collections.synchronizedMap
        Map<String, Integer> syncMap = Collections.synchronizedMap(new HashMap<>());

        // Better: ConcurrentHashMap
        Map<String, Integer> concurrentMap = new ConcurrentHashMap<>();

        // ConcurrentHashMap provides atomic operations
        concurrentMap.putIfAbsent("key", 1);
        concurrentMap.computeIfAbsent("key2", k -> k.length());
        concurrentMap.merge("key", 1, Integer::sum);

        // BlockingQueue for producer-consumer
        BlockingQueue<String> queue = new LinkedBlockingQueue<>();

        // ConcurrentSkipListMap for sorted concurrent map
        NavigableMap<String, Integer> skipListMap = new ConcurrentSkipListMap<>();

        // ConcurrentSkipListSet for sorted concurrent set
        NavigableSet<String> skipListSet = new ConcurrentSkipListSet<>();
    }
}
```

### Avoid Common Pitfalls

```java
import java.util.*;

public class CommonPitfallsExample {
    public static void main(String[] args) {
        // Pitfall 1: Modifying collection during iteration
        List<String> list1 = new ArrayList<>(Arrays.asList("A", "B", "C"));
        // for (String s : list1) {
        //     if (s.equals("B")) {
        //         list1.remove(s);  // ConcurrentModificationException
        //     }
        // }

        // Solution: Use iterator.remove()
        Iterator<String> iter = list1.iterator();
        while (iter.hasNext()) {
            if (iter.next().equals("B")) {
                iter.remove();
            }
        }

        // Pitfall 2: Using mutable objects as keys
        class MutableKey {
            int value;
            MutableKey(int value) { this.value = value; }

            @Override
            public int hashCode() { return value; }

            @Override
            public boolean equals(Object obj) {
                return obj instanceof MutableKey &&
                       ((MutableKey)obj).value == this.value;
            }
        }

        Map<MutableKey, String> map = new HashMap<>();
        MutableKey key = new MutableKey(1);
        map.put(key, "value");

        key.value = 2;  // Modifying key after insertion
        System.out.println(map.get(key));  // null - can't find it!

        // Pitfall 3: Not overriding equals() and hashCode()
        class Person {
            String name;
            Person(String name) { this.name = name; }
        }

        Set<Person> people = new HashSet<>();
        people.add(new Person("Alice"));
        System.out.println(people.contains(new Person("Alice")));  // false!

        // Pitfall 4: Using == instead of equals()
        List<String> list2 = new ArrayList<>();
        list2.add(new String("test"));
        // System.out.println(list2.get(0) == "test");  // false
        System.out.println(list2.get(0).equals("test"));  // true

        // Pitfall 5: Assuming ordering in HashSet/HashMap
        Set<Integer> hashSet = new HashSet<>(Arrays.asList(1, 2, 3, 4, 5));
        System.out.println(hashSet);  // Order not guaranteed

        // Pitfall 6: Not checking for null before operations
        List<String> nullableList = new ArrayList<>();
        nullableList.add(null);
        // nullableList.get(0).length();  // NullPointerException

        if (nullableList.get(0) != null) {
            System.out.println(nullableList.get(0).length());
        }
    }
}
```

## Summary

The Java Collections Framework provides a powerful and flexible way to work with groups of objects. Key takeaways:

1. **Choose the right collection**: Consider your use case (ordered, unique, key-value, etc.)
2. **Use interfaces**: Declare variables using interface types for flexibility
3. **Leverage generics**: Ensure type safety and avoid casting
4. **Know time complexities**: Choose implementations based on performance needs
5. **Use utility classes**: `Collections` and `Arrays` provide useful operations
6. **Be thread-safe**: Use concurrent collections for multi-threaded scenarios
7. **Avoid common pitfalls**: Don't modify during iteration, properly implement equals/hashCode
8. **Modern Java features**: Use List.of(), Set.of(), Map.of() for immutable collections
9. **Streams API**: Combine collections with Java 8+ Stream API for powerful data processing

The Collections Framework is fundamental to Java programming. Understanding its design, implementations, and best practices will significantly improve your code quality and performance.
