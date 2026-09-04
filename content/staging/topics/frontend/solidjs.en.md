---
title: SolidJS Reactive UI Framework
description: Learn SolidJS for building high-performance reactive applications
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - SolidJS
  - reactive
  - performance
  - Signals
status: imported
origin: old/src/content/docs/frontend/solidjs.en.md
divergence: 0.074
issues: []
legacy:
  category: Frontend
  subcategory: Frameworks
  order: 39
  lastUpdated: 2026-01-07
---

SolidJS is a declarative JavaScript library for building user interfaces that combines the simplicity of React's component model with a truly reactive system. Unlike virtual DOM-based frameworks, SolidJS compiles templates to real DOM nodes and updates them with fine-grained reactions, resulting in exceptional runtime performance and minimal memory overhead.

## Part 1: SolidJS vs React Comparison

### Core Philosophy Differences

| Feature | SolidJS | React |
|---------|---------|-------|
| **Reactivity Model** | Fine-grained signals | Virtual DOM diffing |
| **Component Execution** | Runs once | Re-runs on every update |
| **State Updates** | Surgical DOM updates | Full component re-render |
| **Bundle Size** | ~7KB | ~42KB |
| **Learning Curve** | Familiar JSX syntax | Standard JSX |
| **Performance** | Consistently fastest | Good with optimization |

### Code Comparison

Let's implement the same counter component in both frameworks:

**SolidJS Version:**

```jsx
import { createSignal } from 'solid-js';

function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <button onClick={() => setCount(count() + 1)}>
      Clicked {count()} times
    </button>
  );
}
```

**React Version:**

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

The key differences:
1. SolidJS signals are accessed by calling them as functions (`count()`)
2. The SolidJS component body runs only once during initialization
3. In React, the entire component function re-executes on every state change

### Why Components Run Once in SolidJS

This is the fundamental paradigm shift. In SolidJS, components are setup functions:

```jsx
function Counter() {
  const [count, setCount] = createSignal(0);

  // This console.log runs only ONCE when the component mounts
  console.log("Component initialized");

  return (
    <div>
      {/* This expression is reactive and updates automatically */}
      Count: {count()}
    </div>
  );
}
```

In React, the same code would log on every re-render. SolidJS achieves this by compiling JSX expressions into reactive computations that update only when their dependencies change.

### Mental Model Differences

**React's Mental Model:**
- State changes trigger component re-execution
- useMemo and useCallback prevent unnecessary work
- Virtual DOM diffing determines what actually changes

**SolidJS's Mental Model:**
- State changes trigger only the affected DOM updates
- No memoization needed by default
- Direct DOM manipulation based on signal dependencies

## Part 2: Signals and Effects - The Reactivity Core

### Understanding Signals

Signals are the foundation of SolidJS reactivity. A signal is a reactive value container that tracks where it's read and notifies those locations when it changes:

```jsx
import { createSignal } from 'solid-js';

// Create a signal with initial value
const [count, setCount] = createSignal(0);

// Read the value by calling the getter
console.log(count()); // 0

// Update the value using the setter
setCount(5);
console.log(count()); // 5

// Update based on previous value
setCount(prev => prev + 1);
console.log(count()); // 6
```

### Signal Tracking Context

Signals only track dependencies within a reactive context. The JSX return statement creates a reactive context automatically:

```jsx
function Counter() {
  const [count, setCount] = createSignal(0);
  const increment = () => setCount(prev => prev + 1);

  // NOT tracked - only runs once during initialization
  console.log("Count:", count());

  return (
    <div>
      {/* Tracked - will update whenever count() changes */}
      Count: {count()}
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

### Creating Effects with createEffect

Effects are side effects that automatically re-run when their signal dependencies change:

```jsx
import { createSignal, createEffect } from 'solid-js';

function Logger() {
  const [count, setCount] = createSignal(0);

  // This effect tracks count() and re-runs whenever it changes
  createEffect(() => {
    console.log('The count is now:', count());
  });

  return (
    <button onClick={() => setCount(count() + 1)}>
      Increment
    </button>
  );
}
```

### Effect Cleanup

Effects can return a cleanup function that runs before the effect re-executes:

```jsx
import { createSignal, createEffect, onCleanup } from 'solid-js';

function Timer() {
  const [count, setCount] = createSignal(0);
  const [running, setRunning] = createSignal(false);

  createEffect(() => {
    if (running()) {
      const interval = setInterval(() => {
        setCount(c => c + 1);
      }, 1000);

      // Cleanup function - runs when running() changes or component unmounts
      onCleanup(() => clearInterval(interval));
    }
  });

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setRunning(!running())}>
        {running() ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}
```

### Memos for Derived Values

Use `createMemo` to cache computed values that depend on signals:

```jsx
import { createSignal, createMemo } from 'solid-js';

function ExpensiveCalculation() {
  const [count, setCount] = createSignal(0);
  const [multiplier, setMultiplier] = createSignal(2);

  // Only recalculates when count() or multiplier() changes
  const doubled = createMemo(() => {
    console.log('Computing doubled value...');
    return count() * multiplier();
  });

  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
    </div>
  );
}
```

## Part 3: Fine-Grained Reactivity Explained

### What Makes Reactivity "Fine-Grained"?

Fine-grained reactivity means updates are surgical - only the exact DOM nodes that depend on changed values are updated. Compare this to React's coarse-grained approach:

**React (Coarse-Grained):**
```jsx
// When count changes, the entire component re-renders
function List() {
  const [count, setCount] = useState(0);
  const [items] = useState(['a', 'b', 'c']);

  return (
    <div>
      <p>Count: {count}</p>
      {/* This list re-renders even though items didn't change */}
      {items.map(item => <span key={item}>{item}</span>)}
    </div>
  );
}
```

**SolidJS (Fine-Grained):**
```jsx
// When count changes, only the text node inside <p> updates
function List() {
  const [count, setCount] = createSignal(0);
  const [items] = createSignal(['a', 'b', 'c']);

  return (
    <div>
      <p>Count: {count()}</p>
      {/* This list is never touched when count changes */}
      <For each={items()}>{item => <span>{item}</span>}</For>
    </div>
  );
}
```

### The Reactivity Graph

SolidJS builds a dependency graph at runtime:

```jsx
import { createSignal, createMemo, createEffect } from 'solid-js';

const [firstName, setFirstName] = createSignal("John");
const [lastName, setLastName] = createSignal("Doe");

// fullName depends on firstName and lastName
const fullName = createMemo(() => `${firstName()} ${lastName()}`);

// This effect depends on fullName (and transitively on firstName and lastName)
createEffect(() => {
  console.log("Full name changed to:", fullName());
});

// Only the nodes that actually depend on firstName will update
setFirstName("Jane");
```

### Reactive Scope and Ownership

SolidJS uses an ownership model for cleanup. Effects and memos are owned by their parent scope:

```jsx
import { createSignal, createEffect, createRoot } from 'solid-js';

// Create a reactive root (components do this automatically)
const dispose = createRoot(dispose => {
  const [count, setCount] = createSignal(0);

  createEffect(() => {
    console.log("Count:", count());
  });

  // Return the dispose function
  return dispose;
});

// Later, clean up all reactive computations
dispose();
```

### Batching Updates

SolidJS automatically batches synchronous updates:

```jsx
import { createSignal, batch } from 'solid-js';

function Form() {
  const [firstName, setFirstName] = createSignal("");
  const [lastName, setLastName] = createSignal("");

  function resetForm() {
    // Both updates happen in a single batch - only one re-render
    batch(() => {
      setFirstName("");
      setLastName("");
    });
  }

  // Actually, synchronous updates are batched by default
  function alsoResetForm() {
    setFirstName("");
    setLastName("");
    // Still only one re-render!
  }

  return (
    <div>
      <input value={firstName()} onInput={e => setFirstName(e.target.value)} />
      <input value={lastName()} onInput={e => setLastName(e.target.value)} />
      <button onClick={resetForm}>Reset</button>
    </div>
  );
}
```

## Part 4: Building Components

### Basic Component Structure

Components in SolidJS are functions that return JSX:

```jsx
function Greeting(props) {
  return <h1>Hello, {props.name}!</h1>;
}

// Usage
<Greeting name="World" />
```

### Props Handling

Props in SolidJS are reactive and must be accessed carefully to maintain reactivity:

```jsx
function UserCard(props) {
  // WRONG: Destructuring breaks reactivity
  // const { name, age } = props;

  // RIGHT: Access props directly or use splitProps
  return (
    <div>
      <h2>{props.name}</h2>
      <p>Age: {props.age}</p>
    </div>
  );
}
```

### Using splitProps

When you need to separate props, use `splitProps`:

```jsx
import { splitProps } from 'solid-js';

function Button(props) {
  // Split local props from those to pass through
  const [local, others] = splitProps(props, ["children", "variant"]);

  return (
    <button
      class={`btn btn-${local.variant || 'primary'}`}
      {...others}
    >
      {local.children}
    </button>
  );
}

// Usage
<Button variant="secondary" onClick={handleClick} disabled={isLoading()}>
  Click Me
</Button>
```

### Using mergeProps for Defaults

```jsx
import { mergeProps } from 'solid-js';

function Button(props) {
  // Merge with default values
  const merged = mergeProps(
    { variant: 'primary', size: 'medium' },
    props
  );

  return (
    <button class={`btn-${merged.variant} btn-${merged.size}`}>
      {merged.children}
    </button>
  );
}
```

### Children Helper

When working with children, use the `children` helper to resolve them:

```jsx
import { children } from 'solid-js';

function ColoredList(props) {
  // Resolve and memoize children
  const safeChildren = children(() => props.children);

  return (
    <ul style={{ color: props.color }}>
      {safeChildren()}
    </ul>
  );
}
```

### Lifecycle with onMount and onCleanup

```jsx
import { onMount, onCleanup } from 'solid-js';

function DataFetcher(props) {
  const [data, setData] = createSignal(null);

  onMount(async () => {
    // Runs once after component mounts
    const response = await fetch(props.url);
    setData(await response.json());
  });

  onCleanup(() => {
    // Runs when component unmounts
    console.log("Cleaning up...");
  });

  return <div>{JSON.stringify(data())}</div>;
}
```

## Part 5: Control Flow Components

### Conditional Rendering with Show

The `Show` component handles conditional rendering efficiently:

```jsx
import { Show, createSignal } from 'solid-js';

function ConditionalExample() {
  const [loggedIn, setLoggedIn] = createSignal(false);
  const [user, setUser] = createSignal({ name: "Alice" });

  return (
    <div>
      <Show
        when={loggedIn()}
        fallback={<button onClick={() => setLoggedIn(true)}>Log In</button>}
      >
        <p>Welcome back, {user().name}!</p>
        <button onClick={() => setLoggedIn(false)}>Log Out</button>
      </Show>
    </div>
  );
}
```

### Keyed Show for Value Access

When you need access to the truthy value:

```jsx
import { Show, createSignal } from 'solid-js';

function UserProfile() {
  const [user, setUser] = createSignal(null);

  return (
    <Show when={user()} fallback={<p>Loading user...</p>} keyed>
      {(userData) => (
        <div>
          <h2>{userData.name}</h2>
          <p>{userData.email}</p>
        </div>
      )}
    </Show>
  );
}
```

### Switch and Match for Multiple Conditions

```jsx
import { Switch, Match, createSignal } from 'solid-js';

function StatusDisplay() {
  const [status, setStatus] = createSignal('loading');

  return (
    <Switch fallback={<p>Unknown status</p>}>
      <Match when={status() === 'loading'}>
        <p>Loading...</p>
      </Match>
      <Match when={status() === 'success'}>
        <p>Data loaded successfully!</p>
      </Match>
      <Match when={status() === 'error'}>
        <p>An error occurred.</p>
      </Match>
    </Switch>
  );
}
```

### List Rendering with For

The `For` component efficiently renders lists by keying on reference:

```jsx
import { For, createSignal } from 'solid-js';

function TodoList() {
  const [todos, setTodos] = createSignal([
    { id: 1, text: 'Learn SolidJS', done: false },
    { id: 2, text: 'Build an app', done: false },
    { id: 3, text: 'Deploy to production', done: false }
  ]);

  return (
    <ul>
      <For each={todos()} fallback={<li>No todos yet</li>}>
        {(todo, index) => (
          <li>
            {index() + 1}. {todo.text}
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => {
                setTodos(todos().map((t, i) =>
                  i === index() ? { ...t, done: !t.done } : t
                ));
              }}
            />
          </li>
        )}
      </For>
    </ul>
  );
}
```

### Index Component for Primitive Arrays

Use `Index` when the array items are primitives or when the index is stable but values change:

```jsx
import { Index, createSignal } from 'solid-js';

function FormFields() {
  const [inputs, setInputs] = createSignal(['', '', '']);

  return (
    <form>
      <Index each={inputs()}>
        {(value, index) => (
          <input
            type="text"
            value={value()}
            onInput={(e) => {
              const newInputs = [...inputs()];
              newInputs[index] = e.target.value;
              setInputs(newInputs);
            }}
          />
        )}
      </Index>
    </form>
  );
}
```

**For vs Index:**
- `For`: Item reference is stable, index is a signal. Best for object arrays.
- `Index`: Index is stable, item is a signal. Best for primitive arrays.

### Dynamic Component

Render components dynamically based on a value:

```jsx
import { Dynamic, createSignal } from 'solid-js';

const components = {
  home: () => <div>Home Page</div>,
  about: () => <div>About Page</div>,
  contact: () => <div>Contact Page</div>
};

function App() {
  const [currentPage, setCurrentPage] = createSignal('home');

  return (
    <div>
      <nav>
        <button onClick={() => setCurrentPage('home')}>Home</button>
        <button onClick={() => setCurrentPage('about')}>About</button>
        <button onClick={() => setCurrentPage('contact')}>Contact</button>
      </nav>
      <Dynamic component={components[currentPage()]} />
    </div>
  );
}
```

### Portal for Rendering Outside the Component Tree

```jsx
import { Portal, createSignal } from 'solid-js';

function Modal() {
  const [open, setOpen] = createSignal(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Modal</button>
      <Show when={open()}>
        <Portal mount={document.body}>
          <div class="modal-overlay">
            <div class="modal-content">
              <h2>Modal Title</h2>
              <p>Modal content goes here</p>
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </Portal>
      </Show>
    </>
  );
}
```

## Part 6: Stores for Complex State

### Creating Stores

Stores provide reactive state for nested objects:

```jsx
import { createStore } from 'solid-js/store';

function UserManager() {
  const [store, setStore] = createStore({
    user: {
      name: 'Alice',
      profile: {
        email: 'alice@example.com',
        settings: {
          theme: 'dark',
          notifications: true
        }
      }
    },
    posts: []
  });

  return (
    <div>
      {/* Access nested values directly */}
      <p>Name: {store.user.name}</p>
      <p>Theme: {store.user.profile.settings.theme}</p>
    </div>
  );
}
```

### Updating Stores with Path Syntax

```jsx
import { createStore } from 'solid-js/store';

function Settings() {
  const [store, setStore] = createStore({
    user: {
      name: 'Alice',
      preferences: {
        theme: 'light',
        language: 'en'
      }
    }
  });

  return (
    <div>
      <p>Current theme: {store.user.preferences.theme}</p>

      {/* Update using path syntax */}
      <button onClick={() =>
        setStore('user', 'preferences', 'theme', 'dark')
      }>
        Set Dark Theme
      </button>

      {/* Update using function */}
      <button onClick={() =>
        setStore('user', 'preferences', 'theme', prev =>
          prev === 'light' ? 'dark' : 'light'
        )
      }>
        Toggle Theme
      </button>

      {/* Update using object spread */}
      <button onClick={() =>
        setStore('user', 'preferences', { theme: 'dark', language: 'es' })
      }>
        Set Dark + Spanish
      </button>
    </div>
  );
}
```

### Array Operations in Stores

```jsx
import { createStore } from 'solid-js/store';

function TodoApp() {
  const [store, setStore] = createStore({
    todos: [
      { id: 1, text: 'Learn SolidJS', done: false },
      { id: 2, text: 'Build something', done: false }
    ]
  });

  const addTodo = (text) => {
    setStore('todos', todos => [
      ...todos,
      { id: Date.now(), text, done: false }
    ]);
  };

  const toggleTodo = (id) => {
    setStore('todos', todo => todo.id === id, 'done', done => !done);
  };

  const removeTodo = (id) => {
    setStore('todos', todos => todos.filter(t => t.id !== id));
  };

  return (
    <div>
      <For each={store.todos}>
        {(todo) => (
          <div>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ "text-decoration": todo.done ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => removeTodo(todo.id)}>Delete</button>
          </div>
        )}
      </For>
    </div>
  );
}
```

### Using produce for Immer-like Updates

```jsx
import { createStore, produce } from 'solid-js/store';

function ComplexUpdates() {
  const [store, setStore] = createStore({
    users: [
      { id: 1, name: 'Alice', tasks: ['Task 1', 'Task 2'] },
      { id: 2, name: 'Bob', tasks: ['Task 3'] }
    ]
  });

  const addTaskToUser = (userId, task) => {
    setStore(
      produce(state => {
        const user = state.users.find(u => u.id === userId);
        if (user) {
          user.tasks.push(task);
        }
      })
    );
  };

  const updateMultipleFields = () => {
    setStore(
      produce(state => {
        state.users[0].name = 'Alice Updated';
        state.users[0].tasks = [...state.users[0].tasks, 'New Task'];
      })
    );
  };

  return (
    <div>
      <For each={store.users}>
        {(user) => (
          <div>
            <h3>{user.name}</h3>
            <ul>
              <For each={user.tasks}>
                {(task) => <li>{task}</li>}
              </For>
            </ul>
            <button onClick={() => addTaskToUser(user.id, 'New Task')}>
              Add Task
            </button>
          </div>
        )}
      </For>
    </div>
  );
}
```

### Using reconcile for External Data

```jsx
import { createStore, reconcile } from 'solid-js/store';

function DataSync() {
  const [store, setStore] = createStore({
    items: []
  });

  const fetchAndReconcile = async () => {
    const response = await fetch('/api/items');
    const newItems = await response.json();

    // reconcile efficiently diffs and updates only changed items
    setStore('items', reconcile(newItems));
  };

  return (
    <div>
      <button onClick={fetchAndReconcile}>Refresh Data</button>
      <For each={store.items}>
        {(item) => <div>{item.name}</div>}
      </For>
    </div>
  );
}
```

## Part 7: Performance Benefits

### Benchmark Comparisons

SolidJS consistently ranks among the fastest frameworks in JS Framework Benchmark:

| Metric | SolidJS | React | Vue 3 | Svelte |
|--------|---------|-------|-------|--------|
| Create 1000 rows | 43ms | 52ms | 49ms | 45ms |
| Update every 10th row | 14ms | 20ms | 18ms | 16ms |
| Swap rows | 14ms | 21ms | 17ms | 15ms |
| Select row | 2ms | 4ms | 3ms | 3ms |
| Remove row | 15ms | 19ms | 17ms | 16ms |
| Memory usage | Low | High | Medium | Low |

*Note: Actual numbers vary by benchmark version and hardware*

### Why SolidJS is Fast

1. **No Virtual DOM**: Direct DOM manipulation eliminates diffing overhead
2. **Compiled Reactivity**: Dependency tracking is determined at compile time
3. **Granular Updates**: Only affected DOM nodes update, not entire components
4. **No Component Re-execution**: Setup code runs once, not on every update
5. **Minimal Runtime**: Small framework footprint

### Memory Efficiency

```jsx
// SolidJS creates minimal overhead
function LargeList() {
  const [items] = createSignal(Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  })));

  return (
    <For each={items()}>
      {(item) => (
        // Each row is a lightweight reactive scope
        <div>{item.name}</div>
      )}
    </For>
  );
}
```

### No Need for Memoization

Unlike React, SolidJS doesn't require manual memoization:

```jsx
// React requires useMemo/useCallback
function ReactComponent({ items, onSelect }) {
  const sortedItems = useMemo(() =>
    [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  const handleSelect = useCallback((id) => {
    onSelect(id);
  }, [onSelect]);

  return items.map(item => (
    <Item key={item.id} onClick={() => handleSelect(item.id)} />
  ));
}

// SolidJS - no memoization needed
function SolidComponent(props) {
  const sortedItems = createMemo(() =>
    [...props.items].sort((a, b) => a.name.localeCompare(b.name))
  );

  return (
    <For each={sortedItems()}>
      {(item) => (
        <Item onClick={() => props.onSelect(item.id)} />
      )}
    </For>
  );
}
```

### Optimizing Further with untrack

Prevent unnecessary tracking when needed:

```jsx
import { createSignal, createEffect, untrack } from 'solid-js';

function OptimizedEffect() {
  const [count, setCount] = createSignal(0);
  const [logEnabled, setLogEnabled] = createSignal(true);

  createEffect(() => {
    // Only re-run when count changes, not when logEnabled changes
    if (untrack(() => logEnabled())) {
      console.log('Count:', count());
    }
  });

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setLogEnabled(e => !e)}>Toggle Logging</button>
    </div>
  );
}
```

## Part 8: Practical Examples

### Complete Todo Application

```jsx
import { createSignal, createMemo, For, Show } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

function TodoApp() {
  const [store, setStore] = createStore({
    todos: [],
    filter: 'all'
  });

  const [newTodo, setNewTodo] = createSignal('');

  const filteredTodos = createMemo(() => {
    switch (store.filter) {
      case 'active':
        return store.todos.filter(t => !t.completed);
      case 'completed':
        return store.todos.filter(t => t.completed);
      default:
        return store.todos;
    }
  });

  const remainingCount = createMemo(() =>
    store.todos.filter(t => !t.completed).length
  );

  const addTodo = (e) => {
    e.preventDefault();
    const text = newTodo().trim();
    if (text) {
      setStore('todos', todos => [
        ...todos,
        { id: Date.now(), text, completed: false }
      ]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id) => {
    setStore('todos', t => t.id === id, 'completed', c => !c);
  };

  const removeTodo = (id) => {
    setStore('todos', todos => todos.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setStore('todos', todos => todos.filter(t => !t.completed));
  };

  return (
    <div class="todo-app">
      <h1>Todo List</h1>

      <form onSubmit={addTodo}>
        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTodo()}
          onInput={(e) => setNewTodo(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <Show when={store.todos.length > 0}>
        <div class="filters">
          <button
            classList={{ active: store.filter === 'all' }}
            onClick={() => setStore('filter', 'all')}
          >
            All
          </button>
          <button
            classList={{ active: store.filter === 'active' }}
            onClick={() => setStore('filter', 'active')}
          >
            Active
          </button>
          <button
            classList={{ active: store.filter === 'completed' }}
            onClick={() => setStore('filter', 'completed')}
          >
            Completed
          </button>
        </div>

        <ul class="todo-list">
          <For each={filteredTodos()}>
            {(todo) => (
              <li classList={{ completed: todo.completed }}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                <span>{todo.text}</span>
                <button onClick={() => removeTodo(todo.id)}>Delete</button>
              </li>
            )}
          </For>
        </ul>

        <div class="footer">
          <span>{remainingCount()} items left</span>
          <button onClick={clearCompleted}>Clear Completed</button>
        </div>
      </Show>
    </div>
  );
}
```

### Data Fetching with createResource

```jsx
import { createSignal, createResource, Show, Suspense } from 'solid-js';

// Fetcher function
const fetchUser = async (id) => {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error('User not found');
  return response.json();
};

function UserProfile() {
  const [userId, setUserId] = createSignal(1);

  // createResource automatically refetches when userId changes
  const [user, { mutate, refetch }] = createResource(userId, fetchUser);

  return (
    <div>
      <div>
        <button onClick={() => setUserId(u => u - 1)} disabled={userId() <= 1}>
          Previous
        </button>
        <span>User ID: {userId()}</span>
        <button onClick={() => setUserId(u => u + 1)}>Next</button>
        <button onClick={refetch}>Refresh</button>
      </div>

      <Show when={user.loading}>
        <p>Loading...</p>
      </Show>

      <Show when={user.error}>
        <p class="error">Error: {user.error.message}</p>
      </Show>

      <Show when={user()}>
        <div class="user-card">
          <h2>{user().name}</h2>
          <p>{user().email}</p>
        </div>
      </Show>
    </div>
  );
}
```

### Form Handling

```jsx
import { createSignal, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';

function RegistrationForm() {
  const [form, setForm] = createStore({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = createStore({});
  const [touched, setTouched] = createStore({});
  const [submitting, setSubmitting] = createSignal(false);

  const validate = () => {
    const newErrors = {};

    if (form.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, email: true, password: true, confirmPassword: true });

    if (validate()) {
      setSubmitting(true);
      try {
        await fetch('/api/register', {
          method: 'POST',
          body: JSON.stringify(form)
        });
        alert('Registration successful!');
      } catch (err) {
        alert('Registration failed');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleInput = (field) => (e) => {
    setForm(field, e.target.value);
  };

  const handleBlur = (field) => () => {
    setTouched(field, true);
    validate();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div class="field">
        <label>Username</label>
        <input
          type="text"
          value={form.username}
          onInput={handleInput('username')}
          onBlur={handleBlur('username')}
        />
        <Show when={touched.username && errors.username}>
          <span class="error">{errors.username}</span>
        </Show>
      </div>

      <div class="field">
        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onInput={handleInput('email')}
          onBlur={handleBlur('email')}
        />
        <Show when={touched.email && errors.email}>
          <span class="error">{errors.email}</span>
        </Show>
      </div>

      <div class="field">
        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onInput={handleInput('password')}
          onBlur={handleBlur('password')}
        />
        <Show when={touched.password && errors.password}>
          <span class="error">{errors.password}</span>
        </Show>
      </div>

      <div class="field">
        <label>Confirm Password</label>
        <input
          type="password"
          value={form.confirmPassword}
          onInput={handleInput('confirmPassword')}
          onBlur={handleBlur('confirmPassword')}
        />
        <Show when={touched.confirmPassword && errors.confirmPassword}>
          <span class="error">{errors.confirmPassword}</span>
        </Show>
      </div>

      <button type="submit" disabled={submitting()}>
        {submitting() ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

## Part 9: Interview Questions

### Core Concepts

**Q1: What is the fundamental difference between SolidJS and React?**

SolidJS uses fine-grained reactivity with signals, where components run once and only the specific DOM nodes that depend on changed signals update. React uses a virtual DOM where the entire component re-renders on state changes, followed by a diffing algorithm to determine actual DOM updates.

**Q2: Why must you call signals as functions in SolidJS?**

Signals are getter functions that track dependencies when called within a reactive context. By calling `count()` rather than accessing `count`, SolidJS can:
1. Register the current reactive scope as a dependency
2. Return the current value
3. Enable fine-grained updates when the signal changes

**Q3: What is the difference between `createSignal` and `createStore`?**

- `createSignal`: For primitive values or when you replace the entire value. Returns a getter/setter tuple.
- `createStore`: For nested objects where you want to update specific properties without replacing the whole object. Provides path-based updates and maintains reactivity for nested properties.

### Practical Questions

**Q4: When would you use `For` vs `Index` for list rendering?**

- Use `For` when array items are objects and their identity matters (items may be reordered). The item reference stays stable, index is a signal.
- Use `Index` when items are primitives or when the position is more stable than the content. The index stays stable, item is a signal.

**Q5: How do you handle side effects in SolidJS?**

Use `createEffect` for side effects that should run when dependencies change:

```jsx
createEffect(() => {
  // Runs when any signal accessed inside changes
  document.title = `Count: ${count()}`;
});
```

Use `onMount` for one-time setup after the component mounts:

```jsx
onMount(() => {
  // Runs once after mount
  fetchData();
});
```

**Q6: How do you prevent reactivity tracking for a specific access?**

Use `untrack`:

```jsx
createEffect(() => {
  // count() is tracked, config() is not
  if (untrack(() => config().logging)) {
    console.log(count());
  }
});
```

### Advanced Questions

**Q7: How does SolidJS achieve such high performance?**

1. No virtual DOM overhead - updates go directly to the DOM
2. Compile-time analysis determines optimal update paths
3. Fine-grained reactivity means only affected DOM nodes update
4. Components are setup functions that run once
5. No unnecessary re-renders or memoization required

**Q8: Explain the ownership model in SolidJS**

Every reactive computation (effects, memos) is owned by a parent scope. When the parent scope is disposed (component unmounts), all owned computations are automatically cleaned up. This prevents memory leaks and ensures proper resource disposal.

**Q9: How would you share state between components in SolidJS?**

Several approaches:
1. **Props drilling**: Pass signals through component props
2. **Context**: Use `createContext` and `useContext` for deep prop passing
3. **Global signals**: Export signals from a module
4. **Stores**: Use `createStore` for complex shared state

```jsx
// Global store approach
// store.js
export const [appState, setAppState] = createStore({ user: null });

// ComponentA.js
import { appState, setAppState } from './store';

function ComponentA() {
  return <div>{appState.user?.name}</div>;
}
```

## Summary

SolidJS represents a powerful alternative to React and other virtual DOM frameworks, offering:

1. **True Reactivity**: Fine-grained updates without virtual DOM overhead
2. **Familiar Syntax**: JSX-based components with a React-like API
3. **Exceptional Performance**: Consistently among the fastest frameworks in benchmarks
4. **Simple Mental Model**: Components run once, signals handle reactivity
5. **Small Bundle Size**: Minimal runtime footprint

Key takeaways:

- Signals are the foundation of reactivity - call them as functions to access and track values
- Components are setup functions that execute once, not on every update
- Control flow components (`Show`, `For`, `Switch`) provide optimized conditional and list rendering
- Stores handle complex nested state with path-based updates
- No memoization required - fine-grained reactivity handles optimization automatically

SolidJS is an excellent choice for:
- Performance-critical applications
- Developers familiar with React seeking better performance
- Projects where bundle size matters
- Teams wanting a simpler mental model without sacrificing capability

As the web continues to demand more interactive and responsive applications, SolidJS's approach to reactivity positions it as a compelling framework for building high-performance user interfaces.
