---
title: Signals Reactive Programming
description: Deep dive into Signals - the new reactive primitive revolutionizing frontend frameworks
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - Signals
  - Reactivity
  - SolidJS
  - Preact Signals
  - Angular Signals
  - Vue Reactivity
status: imported
origin: old/src/content/docs/frontend/signals.en.md
divergence: 0.206
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Frontend
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-21
---

Signals represent a paradigm shift in frontend reactivity, offering fine-grained updates without the overhead of virtual DOM diffing. Originally popularized by SolidJS, signals have now been adopted by Angular, Preact, and influenced Svelte's runes system. This article explores the concept, implementation differences, and best practices for working with signals across modern frontend frameworks.

## Concept Explanation

### What Are Signals?

A **signal** is a reactive primitive that holds a value and automatically tracks where that value is read (subscribers) and notifies those locations when the value changes. Unlike traditional state management approaches, signals enable fine-grained reactivity where only the specific parts of the UI that depend on a changed value are updated.

```javascript
// Basic signal concept (pseudo-code)
const count = createSignal(0);

// Reading the signal - this creates a subscription
console.log(count()); // 0

// Writing to the signal - this notifies subscribers
count.set(1);
```

The key insight is that signals are **lazy** and **pull-based** for reads, but **push-based** for notifications. When you read a signal, it tracks the current reactive context as a subscriber. When the signal's value changes, it pushes notifications to all subscribers.

### History and Evolution

The concept of signals has evolved over decades:

| Era | Technology | Approach |
|-----|------------|----------|
| 1990s | Spreadsheets | Cell-based reactive updates |
| 2010 | Knockout.js | Observable-based reactivity |
| 2013 | React | Virtual DOM with explicit state |
| 2016 | MobX | Observable state with automatic tracking |
| 2019 | SolidJS | Fine-grained signals without VDOM |
| 2022 | Preact Signals | Signals for React ecosystem |
| 2023 | Angular Signals | Official signals adoption |
| 2023 | Svelte Runes | Compiler-based signal approach |
| 2024 | TC39 Proposal | Standardization efforts begin |

### Signals vs Traditional Reactivity

#### React useState

React's `useState` triggers a full component re-render when state changes:

```jsx
// React - component re-executes entirely on state change
function Counter() {
  const [count, setCount] = useState(0);

  console.log("Component rendered"); // Logs on every state change

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

#### SolidJS Signals

SolidJS signals enable surgical DOM updates:

```jsx
// SolidJS - component body runs once, only DOM text updates
function Counter() {
  const [count, setCount] = createSignal(0);

  console.log("Component initialized"); // Logs only once

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
    </div>
  );
}
```

#### Vue ref

Vue's `ref` is conceptually similar to signals but integrated with Vue's component model:

```javascript
// Vue - ref with automatic unwrapping in templates
import { ref } from 'vue';

const count = ref(0);
console.log(count.value); // Access via .value in JS
// In templates, auto-unwrapped: {{ count }}
```

### Key Characteristics of Signals

1. **Automatic Dependency Tracking**: Signals know which computations depend on them
2. **Fine-Grained Updates**: Only affected parts of the UI update
3. **Synchronous by Default**: Changes propagate immediately
4. **Glitch-Free**: Consistent state during updates, no intermediate states visible
5. **Memory Efficient**: No virtual DOM tree to maintain

## Core Principles

### Dependency Tracking

Signals automatically track dependencies through a mechanism called **automatic subscription**. When a signal is read within a reactive context (like a computed value or an effect), that context becomes a subscriber.

```javascript
// Dependency graph visualization
const firstName = signal("John");
const lastName = signal("Doe");

// fullName depends on firstName AND lastName
const fullName = computed(() => `${firstName()} ${lastName()}`);

// effect depends on fullName (and transitively on firstName, lastName)
effect(() => {
  console.log(`Name changed to: ${fullName()}`);
});

// Changing firstName triggers: firstName -> fullName -> effect
firstName.set("Jane");
```

The dependency graph is dynamic - dependencies are tracked at runtime based on actual code execution:

```javascript
const showDetails = signal(false);
const name = signal("John");
const details = signal("Developer");

// Dependencies change based on showDetails value
const display = computed(() => {
  if (showDetails()) {
    return `${name()}: ${details()}`; // Depends on name AND details
  }
  return name(); // Only depends on name
});
```

### Fine-Grained Updates

Unlike virtual DOM systems that re-render entire component subtrees, signals enable updates at the most granular level:

```javascript
// Virtual DOM approach (React)
// 1. State changes
// 2. Component function re-executes
// 3. New virtual DOM tree created
// 4. Diff against previous tree
// 5. Patch real DOM

// Signals approach
// 1. Signal changes
// 2. Dependent computations recalculate
// 3. Affected DOM nodes update directly
```

This diagram illustrates the difference:

```
React/Virtual DOM:
State Change -> Re-render Component -> Create VDOM -> Diff -> Patch DOM
     |                                                           |
     +------------------- Full component cycle ------------------+

Signals:
Signal Change -> Notify Subscribers -> Update specific DOM nodes
     |                                            |
     +------ Targeted update path ----------------+
```

### Push vs Pull Model

Signals use a hybrid **push-pull** model:

**Push (Notifications)**:
- When a signal's value changes, it immediately notifies all subscribers
- Notifications propagate through the dependency graph
- Computed values are marked as "dirty" (needing recalculation)

**Pull (Values)**:
- Computed values are lazily evaluated
- They only recalculate when actually read
- Avoids unnecessary computation for unused values

```javascript
const count = signal(0);

// Computed is marked dirty when count changes, but doesn't recalculate yet
const doubled = computed(() => {
  console.log("Calculating doubled");
  return count() * 2;
});

// No calculation yet - doubled hasn't been read
count.set(1);
count.set(2);
count.set(3);

// Now it calculates (only once, with current value 3)
console.log(doubled()); // "Calculating doubled" -> 6
```

### Automatic Subscription

Signals use a global execution context to track which computation is currently running:

```javascript
// Simplified implementation concept
let currentComputation = null;

function signal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  const read = () => {
    // Automatic subscription when read in reactive context
    if (currentComputation) {
      subscribers.add(currentComputation);
    }
    return value;
  };

  const write = (newValue) => {
    value = newValue;
    // Push notifications to all subscribers
    subscribers.forEach(sub => sub.notify());
  };

  return [read, write];
}

function computed(fn) {
  let cachedValue;
  let dirty = true;

  const computation = {
    execute: () => {
      const prevComputation = currentComputation;
      currentComputation = computation;
      try {
        cachedValue = fn();
        dirty = false;
      } finally {
        currentComputation = prevComputation;
      }
    },
    notify: () => {
      dirty = true;
    }
  };

  return () => {
    if (dirty) computation.execute();
    return cachedValue;
  };
}
```

## Core Concepts: Framework Comparison

### SolidJS

SolidJS pioneered the modern signals approach with a React-like JSX syntax:

```jsx
import { createSignal, createMemo, createEffect } from 'solid-js';

function Example() {
  // Primitive signal
  const [count, setCount] = createSignal(0);

  // Derived/computed value
  const doubled = createMemo(() => count() * 2);

  // Side effect
  createEffect(() => {
    console.log(`Count is now ${count()}`);
  });

  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

Key characteristics:
- Signals accessed by calling as functions: `count()`
- Components run once (setup functions)
- JSX compiles to direct DOM operations
- Fine-grained reactivity without virtual DOM

### Preact Signals

Preact Signals brings the signals paradigm to the React/Preact ecosystem:

```jsx
import { signal, computed, effect } from "@preact/signals";

// Signals can be created outside components
const count = signal(0);
const doubled = computed(() => count.value * 2);

function Counter() {
  // Signals accessed via .value property
  return (
    <div>
      <p>Count: {count}</p> {/* Auto-unwrapped in JSX */}
      <p>Doubled: {doubled}</p>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}

// Effect for side effects
effect(() => {
  console.log(`Count changed to ${count.value}`);
});
```

Key characteristics:
- Works with React (via @preact/signals-react) and Preact
- Signals live outside components - truly global state
- `.value` property access
- Auto-unwrapping in JSX (no need for `.value`)

### Angular Signals

Angular 16+ introduced signals as a core part of the framework:

```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <p>Doubled: {{ doubled() }}</p>
      <button (click)="increment()">Increment</button>
    </div>
  `
})
export class CounterComponent {
  // Writable signal
  count = signal(0);

  // Computed signal (read-only, derived)
  doubled = computed(() => this.count() * 2);

  constructor() {
    // Effect for side effects
    effect(() => {
      console.log(`Count is now ${this.count()}`);
    });
  }

  increment() {
    // Update methods
    this.count.update(c => c + 1);
    // Or: this.count.set(this.count() + 1);
  }
}
```

Key characteristics:
- Integrated with Angular's change detection
- Signals are called as functions: `count()`
- `update()` for functional updates, `set()` for direct assignment
- Enables fine-grained change detection (moving away from Zone.js)

### Vue Composition API

Vue's reactivity system shares conceptual similarities with signals:

```vue
<script setup>
import { ref, computed, watchEffect } from 'vue';

// ref is Vue's equivalent of signal
const count = ref(0);

// computed is equivalent to derived/computed signal
const doubled = computed(() => count.value * 2);

// watchEffect is equivalent to effect
watchEffect(() => {
  console.log(`Count is now ${count.value}`);
});

function increment() {
  count.value++;
}
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

Key characteristics:
- `ref` for primitive values, `reactive` for objects
- `.value` access in JavaScript, auto-unwrapped in templates
- Component-level reactivity (vs truly global)
- Integrates with Vue's virtual DOM

### Svelte Runes

Svelte 5 introduced runes as a compiler-based approach to signals:

```svelte
<script>
  // $state is Svelte's signal primitive
  let count = $state(0);

  // $derived is the computed equivalent
  let doubled = $derived(count * 2);

  // $effect for side effects
  $effect(() => {
    console.log(`Count is now ${count}`);
  });

  function increment() {
    count++;
  }
</script>

<div>
  <p>Count: {count}</p>
  <p>Doubled: {doubled}</p>
  <button onclick={increment}>Increment</button>
</div>
```

Key characteristics:
- Compiler transforms `$state`, `$derived`, `$effect` into reactive code
- Direct variable assignment syntax (no `.value` or function calls)
- Signals are component-scoped by default
- Can be made global with `$state` in module context

### Framework Comparison Table

| Feature | SolidJS | Preact Signals | Angular | Vue | Svelte 5 |
|---------|---------|----------------|---------|-----|----------|
| Signal Access | `count()` | `count.value` | `count()` | `count.value` | `count` |
| Update Method | `setCount(v)` | `count.value = v` | `count.set(v)` | `count.value = v` | `count = v` |
| Computed | `createMemo()` | `computed()` | `computed()` | `computed()` | `$derived` |
| Effect | `createEffect()` | `effect()` | `effect()` | `watchEffect()` | `$effect` |
| Global State | Yes | Yes | Yes | Via stores | Module-level |
| Virtual DOM | No | Optional | No | Yes | No |
| Compiler Magic | JSX transform | None | Decorators | SFC compiler | Runes compiler |

## Code Examples

### SolidJS Signals in Depth

```jsx
import {
  createSignal,
  createMemo,
  createEffect,
  createRoot,
  batch,
  untrack,
  on,
  onCleanup
} from 'solid-js';

// Basic signal with initial value
const [count, setCount] = createSignal(0);

// Accessing the value
console.log(count()); // 0

// Setting values
setCount(5); // Direct value
setCount(prev => prev + 1); // Functional update

// Memos (computed values) with caching
const doubled = createMemo(() => {
  console.log("Computing doubled");
  return count() * 2;
});

// Effects for side effects
createEffect(() => {
  console.log(`Count changed to ${count()}`);

  // Cleanup function
  onCleanup(() => {
    console.log("Cleaning up previous effect");
  });
});

// Batching multiple updates
batch(() => {
  setCount(1);
  setCount(2);
  setCount(3);
  // Only one notification at the end
});

// Untracking - read without subscribing
createEffect(() => {
  // This effect only re-runs when count changes
  // but reads otherSignal without subscribing
  console.log(count(), untrack(() => otherSignal()));
});

// Explicit dependency declaration with 'on'
createEffect(on(
  count, // Only track this signal
  (value, prevValue) => {
    console.log(`Count went from ${prevValue} to ${value}`);
  },
  { defer: true } // Don't run immediately
));

// Creating isolated reactive scopes
const dispose = createRoot(dispose => {
  const [localSignal, setLocalSignal] = createSignal(0);

  createEffect(() => {
    console.log(localSignal());
  });

  return dispose;
});

// Later: clean up all reactive computations
dispose();
```

### Preact Signals with React Integration

```jsx
import { signal, computed, effect, batch } from "@preact/signals-react";

// Create global signals (outside components)
const todos = signal([]);
const filter = signal("all");

// Derived state
const filteredTodos = computed(() => {
  const allTodos = todos.value;
  switch (filter.value) {
    case "active":
      return allTodos.filter(t => !t.completed);
    case "completed":
      return allTodos.filter(t => t.completed);
    default:
      return allTodos;
  }
});

const remainingCount = computed(() =>
  todos.value.filter(t => !t.completed).length
);

// Side effect
effect(() => {
  document.title = `${remainingCount.value} todos remaining`;
});

// Actions (plain functions that modify signals)
function addTodo(text) {
  todos.value = [...todos.value, {
    id: Date.now(),
    text,
    completed: false
  }];
}

function toggleTodo(id) {
  todos.value = todos.value.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
}

function clearCompleted() {
  batch(() => {
    todos.value = todos.value.filter(t => !t.completed);
    filter.value = "all";
  });
}

// React component using signals
function TodoApp() {
  const [newTodo, setNewTodo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTodo.trim()) {
      addTodo(newTodo.trim());
      setNewTodo("");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
        />
      </form>

      <div className="filters">
        <button onClick={() => filter.value = "all"}>All</button>
        <button onClick={() => filter.value = "active"}>Active</button>
        <button onClick={() => filter.value = "completed"}>Completed</button>
      </div>

      <ul>
        {/* Signal auto-unwraps - filteredTodos is reactive */}
        {filteredTodos.value.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
          </li>
        ))}
      </ul>

      <footer>
        <span>{remainingCount} items left</span>
        <button onClick={clearCompleted}>Clear Completed</button>
      </footer>
    </div>
  );
}
```

### Angular Signals Comprehensive Example

```typescript
import {
  Component,
  signal,
  computed,
  effect,
  WritableSignal,
  Signal,
  untracked
} from '@angular/core';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-manager',
  standalone: true,
  template: `
    <div class="user-manager">
      <h2>User Manager</h2>

      <div class="stats">
        <p>Total Users: {{ totalUsers() }}</p>
        <p>Selected: {{ selectedUser()?.name || 'None' }}</p>
      </div>

      <div class="filters">
        <input
          [value]="searchTerm()"
          (input)="searchTerm.set($any($event.target).value)"
          placeholder="Search users..."
        />
      </div>

      <ul class="user-list">
        @for (user of filteredUsers(); track user.id) {
          <li
            [class.selected]="selectedUser()?.id === user.id"
            (click)="selectUser(user)"
          >
            {{ user.name }} - {{ user.email }}
          </li>
        }
      </ul>

      @if (selectedUser(); as user) {
        <div class="user-details">
          <h3>Edit User</h3>
          <input
            [value]="user.name"
            (input)="updateUserName($any($event.target).value)"
          />
        </div>
      }
    </div>
  `
})
export class UserManagerComponent {
  // Writable signals
  users: WritableSignal<User[]> = signal([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' }
  ]);

  selectedUserId = signal<number | null>(null);
  searchTerm = signal('');

  // Computed signals (derived state)
  totalUsers: Signal<number> = computed(() => this.users().length);

  selectedUser: Signal<User | undefined> = computed(() => {
    const id = this.selectedUserId();
    return id ? this.users().find(u => u.id === id) : undefined;
  });

  filteredUsers: Signal<User[]> = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.users();

    return this.users().filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });

  constructor() {
    // Effect for logging/debugging
    effect(() => {
      console.log('Selected user changed:', this.selectedUser());
    });

    // Effect with cleanup
    effect((onCleanup) => {
      const term = this.searchTerm();
      console.log('Searching for:', term);

      onCleanup(() => {
        console.log('Cleaning up search effect');
      });
    });
  }

  selectUser(user: User) {
    this.selectedUserId.set(user.id);
  }

  updateUserName(newName: string) {
    const userId = this.selectedUserId();
    if (!userId) return;

    // Update signal immutably
    this.users.update(users =>
      users.map(u => u.id === userId ? { ...u, name: newName } : u)
    );
  }

  addUser(name: string, email: string) {
    const newUser: User = {
      id: Date.now(),
      name,
      email
    };

    this.users.update(users => [...users, newUser]);
  }

  removeUser(id: number) {
    this.users.update(users => users.filter(u => u.id !== id));

    // Clear selection if removed user was selected
    if (this.selectedUserId() === id) {
      this.selectedUserId.set(null);
    }
  }
}
```

### Computed Values and Effects

```javascript
// SolidJS example of computed chain
import { createSignal, createMemo, createEffect } from 'solid-js';

const [firstName, setFirstName] = createSignal("John");
const [lastName, setLastName] = createSignal("Doe");
const [showFullName, setShowFullName] = createSignal(true);

// Computed values form a dependency chain
const fullName = createMemo(() => {
  console.log("Computing fullName");
  return `${firstName()} ${lastName()}`;
});

const displayName = createMemo(() => {
  console.log("Computing displayName");
  // Dynamic dependency - only depends on fullName when showFullName is true
  return showFullName() ? fullName() : firstName();
});

const greeting = createMemo(() => {
  console.log("Computing greeting");
  return `Hello, ${displayName()}!`;
});

// Effect at the end of the chain
createEffect(() => {
  console.log("Effect:", greeting());
});

// Test the dependency chain
setFirstName("Jane");
// Logs: Computing fullName, Computing displayName, Computing greeting, Effect: Hello, Jane Doe!

setShowFullName(false);
// Logs: Computing displayName, Computing greeting, Effect: Hello, Jane!
// Note: fullName doesn't recompute because it's not being used

setLastName("Smith");
// No logs! lastName isn't a dependency when showFullName is false
```

## Best Practices

### State Organization

```javascript
// 1. Group related signals together
const userState = {
  currentUser: signal(null),
  isAuthenticated: computed(() => userState.currentUser.value !== null),
  permissions: signal([]),

  // Actions
  login: (user) => {
    userState.currentUser.value = user;
    userState.permissions.value = user.permissions;
  },
  logout: () => {
    userState.currentUser.value = null;
    userState.permissions.value = [];
  }
};

// 2. Use computed for derived state instead of duplicate signals
// Bad
const items = signal([]);
const itemCount = signal(0); // Manually synced - error prone

// Good
const items = signal([]);
const itemCount = computed(() => items.value.length);

// 3. Keep signals as primitive as possible
// Bad - entire user object as signal
const user = signal({ name: "John", email: "john@example.com", preferences: { theme: "dark" } });

// Good - separate signals for different concerns
const userName = signal("John");
const userEmail = signal("john@example.com");
const userTheme = signal("dark");
```

### Avoiding Over-Derivation

```javascript
// Anti-pattern: Excessive computed chains
const a = signal(1);
const b = computed(() => a.value + 1);
const c = computed(() => b.value + 1);
const d = computed(() => c.value + 1);
const e = computed(() => d.value + 1);
// Each level adds overhead

// Better: Flatten when possible
const a = signal(1);
const e = computed(() => a.value + 4);

// Anti-pattern: Computed for simple property access
const user = signal({ name: "John" });
const userName = computed(() => user.value.name); // Unnecessary

// Better: Access directly where needed
// In template/JSX: user.value.name
```

### Side Effect Management

```javascript
// 1. Use effects only for external synchronization
// Good - syncing with external system
effect(() => {
  localStorage.setItem('theme', theme.value);
});

// Bad - using effect for derived state
effect(() => {
  derivedValue = count.value * 2; // Should be computed instead
});

// 2. Clean up resources in effects
effect((onCleanup) => {
  const ws = new WebSocket(url.value);

  ws.onmessage = (event) => {
    messages.value = [...messages.value, event.data];
  };

  onCleanup(() => {
    ws.close();
  });
});

// 3. Avoid infinite loops
const count = signal(0);

// Bad - effect writes to its own dependency
effect(() => {
  count.value = count.value + 1; // Infinite loop!
});

// Good - use untrack for read-only access
effect(() => {
  const current = untrack(() => count.value);
  console.log(`Count is ${current}`);
});
```

### Debugging Techniques

```javascript
// 1. Add logging effects during development
effect(() => {
  console.log('Signal state:', {
    count: count.value,
    doubled: doubled.value,
    // snapshot of relevant signals
  });
});

// 2. Use browser DevTools
// Many frameworks have DevTools extensions for inspecting signals

// 3. Create debug wrappers
function createDebugSignal(initialValue, name) {
  const [value, setValue] = createSignal(initialValue);

  const debugSetValue = (newValue) => {
    console.log(`[${name}] ${value()} -> ${typeof newValue === 'function' ? newValue(value()) : newValue}`);
    setValue(newValue);
  };

  return [value, debugSetValue];
}

// 4. Track effect execution
let effectId = 0;
function createTrackedEffect(fn) {
  const id = effectId++;
  return effect(() => {
    console.log(`Effect ${id} running`);
    const startTime = performance.now();
    fn();
    console.log(`Effect ${id} completed in ${performance.now() - startTime}ms`);
  });
}
```

## Common Pitfalls

### Closure Traps

```javascript
// Problem: Stale closure capturing initial value
function Timer() {
  const [count, setCount] = createSignal(0);

  // Bug: count() is captured once when the interval is created
  setInterval(() => {
    console.log(count()); // Always logs initial value in some cases
  }, 1000);

  return <button onClick={() => setCount(c => c + 1)}>Increment</button>;
}

// Solution 1: Use effect for reactive intervals
function Timer() {
  const [count, setCount] = createSignal(0);

  createEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);

    onCleanup(() => clearInterval(interval));
  });

  return <div>Count: {count()}</div>;
}

// Solution 2: Access signal inside callback
setInterval(() => {
  console.log(count()); // Read current value each time
  setCount(c => c + 1);
}, 1000);
```

### Overusing Effects

```javascript
// Anti-pattern: Using effects for everything
function UserProfile() {
  const [userId, setUserId] = createSignal(1);
  const [user, setUser] = createSignal(null);
  const [fullName, setFullName] = createSignal("");

  // Bad: Effect chain for data fetching
  createEffect(async () => {
    const data = await fetchUser(userId());
    setUser(data);
  });

  // Bad: Effect for derived state
  createEffect(() => {
    if (user()) {
      setFullName(`${user().firstName} ${user().lastName}`);
    }
  });

  return <div>{fullName()}</div>;
}

// Better approach
function UserProfile() {
  const [userId, setUserId] = createSignal(1);

  // Use resource for async data
  const [user] = createResource(userId, fetchUser);

  // Use computed for derived state
  const fullName = createMemo(() => {
    const u = user();
    return u ? `${u.firstName} ${u.lastName}` : "";
  });

  return <div>{fullName()}</div>;
}
```

### Circular Dependencies

```javascript
// Problem: Signals that depend on each other
const a = signal(1);
const b = computed(() => c.value + 1); // Error: c is not defined yet
const c = computed(() => a.value + b.value);

// This creates circular dependency and will cause infinite loop or errors

// Solution: Restructure to avoid circular references
const a = signal(1);
const b = signal(2);
const c = computed(() => a.value + b.value);
const d = computed(() => c.value + 1);
```

### Memory Leaks

```javascript
// Problem: Effects not cleaned up
function createSubscription(url) {
  const data = signal(null);

  // This effect runs forever, even after component unmounts
  effect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = (e) => data.value = e.data;
    // No cleanup!
  });

  return data;
}

// Solution: Always provide cleanup
function createSubscription(url) {
  const data = signal(null);

  effect((onCleanup) => {
    const ws = new WebSocket(url);
    ws.onmessage = (e) => data.value = e.data;

    onCleanup(() => {
      ws.close();
    });
  });

  return data;
}

// Or use the disposal pattern
function createSubscription(url) {
  const data = signal(null);

  const dispose = createRoot((dispose) => {
    effect(() => {
      const ws = new WebSocket(url);
      ws.onmessage = (e) => data.value = e.data;
      onCleanup(() => ws.close());
    });
    return dispose;
  });

  return { data, dispose };
}
```

## Performance Considerations

### Signals vs Virtual DOM

```
Benchmark: Updating 1 of 1000 list items

Virtual DOM (React):
1. State change triggers re-render
2. Create new VDOM tree (1000 nodes)
3. Diff against old tree
4. Find 1 difference
5. Update 1 DOM node
Time: ~10-20ms (varies with list size)

Signals (SolidJS):
1. Signal change
2. Notify 1 subscriber
3. Update 1 DOM node
Time: ~1-2ms (constant, independent of list size)
```

Memory comparison:

| Approach | Memory for 1000 items |
|----------|----------------------|
| Virtual DOM | ~2MB (VDOM + components) |
| Signals | ~0.5MB (just DOM + signals) |

### Batch Updates

```javascript
import { batch } from 'solid-js';

// Without batching - 3 separate updates, 3 re-renders
function updateMultiple() {
  setFirstName("Jane");  // Triggers update
  setLastName("Doe");    // Triggers update
  setAge(30);            // Triggers update
}

// With batching - 1 combined update
function updateMultipleBatched() {
  batch(() => {
    setFirstName("Jane");
    setLastName("Doe");
    setAge(30);
    // All changes applied together, one update cycle
  });
}

// Note: Many frameworks batch synchronous updates automatically
// Explicit batching is mainly needed for async boundaries
async function asyncUpdate() {
  const data = await fetchData();

  // After await, we're in a new microtask
  // Explicit batch ensures single update
  batch(() => {
    setUsers(data.users);
    setCount(data.count);
    setLastUpdated(Date.now());
  });
}
```

### Lazy Evaluation

```javascript
// Computed values are lazy - they don't calculate until read
const expensiveComputation = computed(() => {
  console.log("Computing...");
  return heavyCalculation(data.value);
});

// No computation yet
data.value = newData; // Just marks computed as dirty

// Now it computes (when actually needed)
if (shouldDisplay) {
  console.log(expensiveComputation.value);
}

// Contrast with React useMemo which computes eagerly
const memoized = useMemo(() => {
  console.log("Computing...");
  return heavyCalculation(data);
}, [data]);
// Computes immediately on render, even if not used
```

### Minimizing Re-computation

```javascript
// Anti-pattern: Reading unnecessary signals
const items = signal(largeArray);
const filter = signal("");
const sortOrder = signal("asc");

const processedItems = computed(() => {
  // Reads all signals, recomputes when ANY changes
  let result = [...items.value];

  if (filter.value) {
    result = result.filter(item => item.includes(filter.value));
  }

  return sortOrder.value === "asc"
    ? result.sort()
    : result.sort().reverse();
});

// Better: Separate concerns
const filteredItems = computed(() => {
  const f = filter.value;
  return f
    ? items.value.filter(item => item.includes(f))
    : items.value;
});

const sortedItems = computed(() => {
  // Only recomputes when filteredItems or sortOrder changes
  // Changing filter only triggers filteredItems, then this
  const sorted = [...filteredItems.value].sort();
  return sortOrder.value === "asc" ? sorted : sorted.reverse();
});
```

## Real-World Scenarios

### Form State Management

```jsx
// SolidJS form with signals
import { createSignal, createMemo, createEffect, batch } from 'solid-js';
import { createStore } from 'solid-js/store';

function RegistrationForm() {
  // Form state as store (for nested updates)
  const [form, setForm] = createStore({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Validation state
  const [touched, setTouched] = createStore({
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [submitError, setSubmitError] = createSignal(null);

  // Validation computed values
  const errors = createMemo(() => {
    const errs = {};

    if (touched.username && form.username.length < 3) {
      errs.username = "Username must be at least 3 characters";
    }

    if (touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Please enter a valid email";
    }

    if (touched.password && form.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }

    if (touched.confirmPassword && form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    return errs;
  });

  const isValid = createMemo(() => {
    return Object.keys(errors()).length === 0 &&
           Object.values(touched).every(Boolean);
  });

  // Handlers
  const handleInput = (field) => (e) => {
    setForm(field, e.target.value);
  };

  const handleBlur = (field) => () => {
    setTouched(field, true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Touch all fields
    batch(() => {
      setTouched("username", true);
      setTouched("email", true);
      setTouched("password", true);
      setTouched("confirmPassword", true);
    });

    if (!isValid()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await registerUser(form);
      // Success handling
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div class="field">
        <label>Username</label>
        <input
          value={form.username}
          onInput={handleInput("username")}
          onBlur={handleBlur("username")}
          classList={{ error: errors().username }}
        />
        <Show when={errors().username}>
          <span class="error">{errors().username}</span>
        </Show>
      </div>

      <div class="field">
        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onInput={handleInput("email")}
          onBlur={handleBlur("email")}
          classList={{ error: errors().email }}
        />
        <Show when={errors().email}>
          <span class="error">{errors().email}</span>
        </Show>
      </div>

      <div class="field">
        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onInput={handleInput("password")}
          onBlur={handleBlur("password")}
          classList={{ error: errors().password }}
        />
        <Show when={errors().password}>
          <span class="error">{errors().password}</span>
        </Show>
      </div>

      <div class="field">
        <label>Confirm Password</label>
        <input
          type="password"
          value={form.confirmPassword}
          onInput={handleInput("confirmPassword")}
          onBlur={handleBlur("confirmPassword")}
          classList={{ error: errors().confirmPassword }}
        />
        <Show when={errors().confirmPassword}>
          <span class="error">{errors().confirmPassword}</span>
        </Show>
      </div>

      <Show when={submitError()}>
        <div class="submit-error">{submitError()}</div>
      </Show>

      <button type="submit" disabled={isSubmitting() || !isValid()}>
        {isSubmitting() ? "Registering..." : "Register"}
      </button>
    </form>
  );
}
```

### Real-Time Data Synchronization

```javascript
// Real-time dashboard with WebSocket
import { createSignal, createEffect, onCleanup, batch } from 'solid-js';

function createRealtimeStore(wsUrl) {
  const [connected, setConnected] = createSignal(false);
  const [data, setData] = createSignal({});
  const [error, setError] = createSignal(null);
  const [lastUpdate, setLastUpdate] = createSignal(null);

  let ws = null;
  let reconnectTimeout = null;

  function connect() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      batch(() => {
        setConnected(true);
        setError(null);
      });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        batch(() => {
          setData(prev => ({ ...prev, ...message }));
          setLastUpdate(Date.now());
        });
      } catch (e) {
        setError("Failed to parse message");
      }
    };

    ws.onerror = () => {
      setError("Connection error");
    };

    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 5 seconds
      reconnectTimeout = setTimeout(connect, 5000);
    };
  }

  function disconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    if (ws) {
      ws.close();
    }
  }

  function send(message) {
    if (ws && connected()) {
      ws.send(JSON.stringify(message));
    }
  }

  // Start connection
  connect();

  return {
    connected,
    data,
    error,
    lastUpdate,
    send,
    reconnect: connect,
    disconnect
  };
}

// Usage in component
function Dashboard() {
  const store = createRealtimeStore("wss://api.example.com/realtime");

  // Cleanup on unmount
  onCleanup(() => {
    store.disconnect();
  });

  // Log connection status changes
  createEffect(() => {
    console.log("Connection status:", store.connected() ? "Connected" : "Disconnected");
  });

  return (
    <div class="dashboard">
      <header>
        <span class={`status ${store.connected() ? "online" : "offline"}`}>
          {store.connected() ? "Live" : "Offline"}
        </span>
        <Show when={store.lastUpdate()}>
          <span>Last update: {new Date(store.lastUpdate()).toLocaleTimeString()}</span>
        </Show>
      </header>

      <Show when={store.error()}>
        <div class="error">{store.error()}</div>
      </Show>

      <div class="metrics">
        <MetricCard title="Users" value={store.data().users} />
        <MetricCard title="Revenue" value={store.data().revenue} />
        <MetricCard title="Orders" value={store.data().orders} />
      </div>
    </div>
  );
}
```

### Complex UI State

```javascript
// Multi-step wizard with complex state
import { createSignal, createMemo, createEffect, batch } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

function createWizardStore() {
  const [store, setStore] = createStore({
    currentStep: 0,
    steps: [
      { id: 'personal', title: 'Personal Info', completed: false },
      { id: 'address', title: 'Address', completed: false },
      { id: 'payment', title: 'Payment', completed: false },
      { id: 'review', title: 'Review', completed: false }
    ],
    data: {
      personal: { firstName: '', lastName: '', email: '' },
      address: { street: '', city: '', zipCode: '', country: '' },
      payment: { cardNumber: '', expiry: '', cvv: '' }
    },
    errors: {}
  });

  // Derived state
  const currentStepInfo = createMemo(() => store.steps[store.currentStep]);
  const isFirstStep = createMemo(() => store.currentStep === 0);
  const isLastStep = createMemo(() => store.currentStep === store.steps.length - 1);
  const completedSteps = createMemo(() => store.steps.filter(s => s.completed).length);
  const progress = createMemo(() => (completedSteps() / store.steps.length) * 100);

  const canProceed = createMemo(() => {
    const step = currentStepInfo();
    const stepData = store.data[step.id];

    if (!stepData) return true; // Review step

    // Check all fields are filled
    return Object.values(stepData).every(v => v.trim() !== '');
  });

  // Actions
  function updateField(section, field, value) {
    setStore('data', section, field, value);
    // Clear error when user types
    setStore('errors', `${section}.${field}`, undefined);
  }

  function validateStep(stepId) {
    const stepData = store.data[stepId];
    if (!stepData) return true;

    const errors = {};

    if (stepId === 'personal') {
      if (!stepData.firstName) errors['personal.firstName'] = 'Required';
      if (!stepData.email?.includes('@')) errors['personal.email'] = 'Invalid email';
    }

    if (stepId === 'payment') {
      if (stepData.cardNumber?.length !== 16) errors['payment.cardNumber'] = 'Invalid card';
    }

    setStore('errors', errors);
    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    const stepId = currentStepInfo().id;

    if (validateStep(stepId)) {
      batch(() => {
        setStore('steps', store.currentStep, 'completed', true);
        setStore('currentStep', s => Math.min(s + 1, store.steps.length - 1));
      });
    }
  }

  function prevStep() {
    setStore('currentStep', s => Math.max(s - 1, 0));
  }

  function goToStep(index) {
    // Can only go to completed steps or current step
    if (index <= completedSteps()) {
      setStore('currentStep', index);
    }
  }

  async function submit() {
    // Final validation
    for (const step of store.steps.slice(0, -1)) {
      if (!validateStep(step.id)) {
        goToStep(store.steps.findIndex(s => s.id === step.id));
        return false;
      }
    }

    // Submit logic
    return await submitWizardData(store.data);
  }

  return {
    store,
    currentStepInfo,
    isFirstStep,
    isLastStep,
    progress,
    canProceed,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    submit
  };
}
```

## Interview Key Points

### Core Concepts

**Q1: What are Signals and how do they differ from traditional state management?**

Signals are reactive primitives that automatically track dependencies and notify subscribers when values change. Key differences from traditional approaches:

1. **vs React useState**: Signals enable fine-grained updates to specific DOM nodes, while useState triggers full component re-renders
2. **vs Redux/Vuex**: Signals are decentralized and can be created anywhere; updates are synchronous and automatic
3. **vs RxJS Observables**: Signals are simpler (no operators), synchronous by default, and automatically manage subscriptions

**Q2: Explain the dependency tracking mechanism in signals.**

When a signal is read within a reactive context (computed or effect):
1. The signal records the current computation as a subscriber
2. When the signal's value changes, it notifies all subscribers
3. Computed values are marked "dirty" and lazily recalculate on next read
4. Effects re-run immediately upon notification

The tracking is automatic through a global execution context that tracks the currently running computation.

**Q3: What is the difference between Push and Pull reactivity?**

- **Push**: When a value changes, notifications are pushed to all dependents immediately. Signals use push for notifications.
- **Pull**: Values are calculated only when requested. Computed values use pull for their actual computation.

Signals combine both: push notifications mark computeds as dirty, but the actual recalculation is pulled (lazy) when the value is accessed.

### Practical Questions

**Q4: When would you use effects vs computed values?**

Use **computed** for:
- Deriving new values from signals
- Transformations that should be cached
- Any pure calculation without side effects

Use **effects** for:
- DOM manipulations
- API calls
- Logging/analytics
- Syncing with external systems (localStorage, WebSocket)

Key principle: If it returns a value, use computed. If it performs an action, use effect.

**Q5: How do you prevent memory leaks with signals?**

1. **Always clean up effects**: Use onCleanup to dispose resources
2. **Use disposal patterns**: createRoot returns dispose function
3. **Avoid global effects**: Scope effects to component lifecycle
4. **Clean up subscriptions**: Disconnect WebSockets, clear intervals

```javascript
createEffect((onCleanup) => {
  const interval = setInterval(update, 1000);
  onCleanup(() => clearInterval(interval));
});
```

**Q6: How do signals achieve better performance than Virtual DOM?**

1. **No diffing**: Signals update DOM directly without tree comparison
2. **Targeted updates**: Only affected DOM nodes update, not entire subtrees
3. **No re-render overhead**: Component functions run once, not on every update
4. **Lower memory**: No virtual DOM tree to maintain
5. **O(1) updates**: Update time is constant regardless of component size

### Advanced Questions

**Q7: Explain the glitch-free guarantee in signals.**

A "glitch" is when observers see inconsistent intermediate states during a batch of updates. Signals prevent glitches by:

1. Batching synchronous updates together
2. Using topological sorting to update computeds in dependency order
3. Ensuring all derived values are consistent before any effects run

**Q8: How would you implement a simple signal system?**

```javascript
let currentComputation = null;

function createSignal(value) {
  const subscribers = new Set();

  const read = () => {
    if (currentComputation) subscribers.add(currentComputation);
    return value;
  };

  const write = (newValue) => {
    value = newValue;
    subscribers.forEach(fn => fn());
  };

  return [read, write];
}

function createEffect(fn) {
  const execute = () => {
    currentComputation = execute;
    fn();
    currentComputation = null;
  };
  execute();
}
```

**Q9: What is the TC39 Signals proposal and what would it standardize?**

The TC39 Signals proposal aims to standardize signals at the JavaScript language level:

1. **Interoperability**: Different frameworks could share signal primitives
2. **Browser optimization**: Native implementation could be faster
3. **Standardized API**: Common interface across ecosystems
4. **Integration**: Better integration with browser APIs and DevTools

## Further Reading

### TC39 Proposal

- [TC39 Signals Proposal](https://github.com/tc39/proposal-signals) - Official standardization proposal
- [Signals Proposal Explainer](https://github.com/tc39/proposal-signals/blob/main/README.md) - Detailed explanation of the proposal

### Framework Documentation

- [SolidJS Documentation](https://www.solidjs.com/docs/latest) - Original modern signals implementation
- [Preact Signals](https://preactjs.com/guide/v10/signals/) - Signals for Preact/React ecosystem
- [Angular Signals](https://angular.io/guide/signals) - Angular's official signals guide
- [Vue Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html) - Vue's signal-like reactivity
- [Svelte Runes](https://svelte.dev/docs/svelte/what-are-runes) - Svelte 5's compiler-based signals

### Technical Articles

- [A Hands-on Introduction to Fine-Grained Reactivity](https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf) - Ryan Carniato (SolidJS creator)
- [Building a Reactive Library from Scratch](https://dev.to/ryansolid/building-a-reactive-library-from-scratch-1i0p) - Deep implementation guide
- [The Evolution of Signals in JavaScript](https://www.builder.io/blog/signals) - Historical context
- [Signals vs Observables](https://www.builder.io/blog/signals-vs-observables) - Comparison guide

### Video Resources

- [Reactivity with Signals](https://www.youtube.com/watch?v=SO8lBVWF2Y8) - Ryan Carniato on signals
- [Why Signals Are Better Than React Hooks](https://www.youtube.com/watch?v=bTpKTGDLQ5Q) - Fireship
- [Angular Signals Deep Dive](https://www.youtube.com/watch?v=oqYQG7QMdzw) - Angular team

### Related Concepts

- [MobX: Simple, Scalable State Management](https://mobx.js.org/) - Similar reactive principles
- [RxJS Documentation](https://rxjs.dev/) - Observable-based reactivity
- [Immer](https://immerjs.github.io/immer/) - Immutable updates (often used with signals)

### Source Code Study

- [SolidJS Reactivity Source](https://github.com/solidjs/solid/tree/main/packages/solid) - Reference implementation
- [@preact/signals-core](https://github.com/preactjs/signals) - Preact's implementation
- [@angular/core signals](https://github.com/angular/angular/tree/main/packages/core/src/signals) - Angular's implementation

---

Signals represent a fundamental shift in how we think about reactivity in frontend development. By understanding the core principles of dependency tracking, fine-grained updates, and the push-pull model, developers can build more performant and maintainable applications. As the TC39 proposal progresses, signals may become a standard part of the JavaScript language, further cementing their importance in the frontend ecosystem.
