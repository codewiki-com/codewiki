---
title: Vue Reactivity System Complete Guide
description: Deep dive into Vue 3 reactivity with Proxy and Composition API
track: frontend
section: vue
difficulty: advanced
tags:
  - Vue
  - Reactivity
  - Proxy
  - Composition API
status: imported
origin: old/src/content/docs/frontend/vue-reactivity.en.md
divergence: 0.207
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Frontend
  subcategory: Vue
  order: 14
  lastUpdated: 2026-01-07
---

The reactivity system is one of the core features of the Vue.js framework. It enables data changes to automatically drive view updates, greatly simplifying state management in frontend development. We analyze the Vue 3 reactivity system implementation in depth, helping developers better understand and utilize Vue's reactive capabilities.

## Concept Explanation

### What is Reactivity?

In the context of Vue, **reactivity** refers to the ability to automatically respond to data changes and execute corresponding operations. When data changes, associated views update automatically, network requests trigger automatically, and computed properties recalculate automatically.

Vue's reactivity system achieves this through **runtime dependency tracking** rather than static code analysis. It uses Proxy wrappers (Vue 3) or getter/setter functions (Vue 2) to intercept property access, enabling dependency collection and change notification.

### Core Concepts of the Reactivity System

- **Dependency Tracking (Track)**: When reactive data is read, the system collects the currently executing effect function
- **Trigger Updates (Trigger)**: When reactive data is modified, the system notifies all effect functions that depend on that data to re-execute
- **Effect Functions**: Functions that depend on reactive data and need to re-execute when data changes

## Vue 2 vs Vue 3: Proxy vs Object.defineProperty

### Vue 2's Object.defineProperty Approach

Vue 2 uses `Object.defineProperty` to implement the reactivity system. It hijacks object property getters and setters to implement dependency collection and change notification.

```javascript
// Simplified Vue 2 reactivity implementation
function defineReactive(obj, key, val) {
  const dep = new Dep() // Dependency collector

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      // Dependency collection
      if (Dep.target) {
        dep.depend()
      }
      return val
    },
    set(newVal) {
      if (newVal === val) return
      val = newVal
      // Trigger updates
      dep.notify()
    }
  })
}

// Dependency collector
class Dep {
  static target = null

  constructor() {
    this.subscribers = new Set()
  }

  depend() {
    if (Dep.target) {
      this.subscribers.add(Dep.target)
    }
  }

  notify() {
    this.subscribers.forEach(sub => sub.update())
  }
}
```

### Limitations of Vue 2's Approach

1. **Cannot detect property additions and deletions**: Requires `Vue.set()` and `Vue.delete()`
2. **Cannot detect direct array index modifications**: `arr[0] = newValue` won't trigger updates
3. **Cannot detect array length modifications**: `arr.length = 0` won't trigger updates
4. **Performance overhead**: Requires recursive traversal of all properties during initialization

```javascript
// Vue 2 workarounds
Vue.set(obj, 'newProperty', value)  // Add new property
Vue.delete(obj, 'property')         // Delete property

// Array mutation methods are overwritten
// push, pop, shift, unshift, splice, sort, reverse
```

### Vue 3's Proxy Advantages

Vue 3 uses ES6 `Proxy` to implement the reactivity system, offering significant advantages over `Object.defineProperty`:

1. **Can intercept more operations**: Property access, assignment, deletion, enumeration, etc.
2. **Supports dynamic properties**: No need to pre-define; new properties are automatically reactive
3. **Supports array index and length modifications**: Natively supports various array operations
4. **Lazy proxy**: Only nested objects that are accessed get proxied, improving performance

### How reactive() Works Under the Hood

```javascript
// Simplified Vue 3 reactive implementation
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      // Dependency collection
      track(target, key)
      const result = Reflect.get(target, key, receiver)
      // Deep reactivity: if value is an object, recursively proxy it
      if (typeof result === 'object' && result !== null) {
        return reactive(result)
      }
      return result
    },
    set(target, key, value, receiver) {
      const oldValue = target[key]
      const result = Reflect.set(target, key, value, receiver)
      // Only trigger updates when value actually changes
      if (oldValue !== value) {
        trigger(target, key)
      }
      return result
    },
    deleteProperty(target, key) {
      const hadKey = Object.prototype.hasOwnProperty.call(target, key)
      const result = Reflect.deleteProperty(target, key)
      if (hadKey && result) {
        trigger(target, key)
      }
      return result
    }
  })
}
```

### Dependency Collection and Trigger Implementation

```javascript
// Global dependency storage
const targetMap = new WeakMap()
// Currently active effect function
let activeEffect = null

// Dependency collection
function track(target, key) {
  if (!activeEffect) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  dep.add(activeEffect)
}

// Trigger updates
function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep = depsMap.get(key)
  if (dep) {
    dep.forEach(effect => {
      // Avoid infinite loops
      if (effect !== activeEffect) {
        effect()
      }
    })
  }
}

// Effect function
function effect(fn) {
  const effectFn = () => {
    activeEffect = effectFn
    fn()
    activeEffect = null
  }
  effectFn()
  return effectFn
}
```

## ref and reactive

### Understanding ref

`ref` is used to create reactive references for primitive values, accessed via the `.value` property:

```javascript
import { ref } from 'vue'

// Creating a ref
const count = ref(0)
console.log(count.value) // 0

// Updating the value
count.value++
console.log(count.value) // 1

// ref can also wrap objects
const user = ref({ name: 'John', age: 30 })
user.value.age++ // Deep reactivity works
```

### How ref Works Internally

```javascript
// Simplified ref implementation
function ref(value) {
  const refObject = {
    get value() {
      track(refObject, 'value')
      return value
    },
    set value(newValue) {
      value = newValue
      trigger(refObject, 'value')
    }
  }
  return refObject
}
```

### Understanding reactive

`reactive` creates a deeply reactive proxy of an object:

```javascript
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  user: {
    name: 'Vue',
    version: 3
  }
})

// Direct property access (no .value needed)
console.log(state.count) // 0
state.count++

// Nested objects are also reactive
state.user.name = 'Vue 3'
```

### ref vs reactive Comparison

| Feature | ref | reactive |
|---------|-----|----------|
| Supported types | Any type (including primitives) | Objects only |
| Access method | Requires `.value` | Direct property access |
| Destructuring | Maintains reactivity | Loses reactivity |
| Template usage | Auto-unwrapped | Direct usage |
| Whole replacement | Supported | Not supported (loses reactivity) |

```javascript
import { ref, reactive } from 'vue'

// ref is suitable for primitives
const count = ref(0)
console.log(count.value) // 0
count.value++

// reactive is suitable for objects
const state = reactive({
  name: 'Vue',
  version: 3
})
console.log(state.name) // 'Vue'

// ref wrapping objects uses reactive internally
const objRef = ref({ count: 0 })
objRef.value.count++ // Deep reactivity
```

### When to Choose ref or reactive

**Use ref when:**
- Working with primitive values (string, number, boolean)
- You need to replace the entire object
- Returning values from composables
- Using template refs

**Use reactive when:**
- Working with complex nested objects
- Managing form data
- State objects that don't need full replacement

## computed and watch

### computed: Cached Derived State

`computed` creates a cached reactive reference that only recalculates when dependencies change:

```javascript
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// Read-only computed
const fullName = computed(() => {
  console.log('Computing full name') // Only logs when dependencies change
  return `${firstName.value} ${lastName.value}`
})

console.log(fullName.value) // 'John Doe'
firstName.value = 'Jane'
console.log(fullName.value) // 'Jane Doe'

// Writable computed
const fullNameWritable = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(newValue) {
    const names = newValue.split(' ')
    firstName.value = names[0]
    lastName.value = names[1] || ''
  }
})

fullNameWritable.value = 'Alice Smith'
console.log(firstName.value) // 'Alice'
console.log(lastName.value) // 'Smith'
```

### How computed Works Internally

```javascript
function computed(getter) {
  let value
  let dirty = true // Flag indicating if recalculation is needed

  const effectFn = effect(getter, {
    lazy: true, // Lazy execution
    scheduler() {
      // When dependencies change, mark as dirty
      dirty = true
      trigger(obj, 'value')
    }
  })

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      track(obj, 'value')
      return value
    }
  }

  return obj
}
```

### watch: Explicit Side Effects

`watch` allows you to perform side effects when reactive data changes:

```javascript
import { ref, reactive, watch } from 'vue'

const count = ref(0)

// Basic watch
watch(count, (newValue, oldValue) => {
  console.log(`count changed: ${oldValue} -> ${newValue}`)
})

// Watching multiple sources
const firstName = ref('John')
const lastName = ref('Doe')

watch(
  [firstName, lastName],
  ([newFirst, newLast], [oldFirst, oldLast]) => {
    console.log('Name changed:', newFirst, newLast)
  }
)

// Watching a getter function
const user = reactive({ name: 'John', age: 30 })

watch(
  () => user.age,
  (newAge, oldAge) => {
    console.log(`Age changed from ${oldAge} to ${newAge}`)
  }
)

// Deep watching reactive objects
watch(
  () => user,
  (newUser) => {
    console.log('User changed:', newUser)
  },
  { deep: true }
)
```

### watch Configuration Options

```javascript
watch(source, callback, {
  immediate: true,  // Execute callback immediately on creation
  deep: true,       // Deep watch nested properties
  flush: 'post',    // Callback timing: 'pre' | 'post' | 'sync'
  onTrack(e) {},    // Debug: when dependency is tracked
  onTrigger(e) {},  // Debug: when callback is triggered
  once: true        // Vue 3.4+: only execute once
})
```

## watchEffect

### Automatic Dependency Tracking

`watchEffect` automatically tracks all reactive dependencies used within its callback:

```javascript
import { ref, watchEffect } from 'vue'

const count = ref(0)
const message = ref('Hello')

// Automatically tracks count and message
watchEffect(() => {
  console.log(`Count is ${count.value}, message is ${message.value}`)
})

// Triggers the effect
count.value++ // Logs: "Count is 1, message is Hello"
message.value = 'World' // Logs: "Count is 1, message is World"
```

### Cleanup Function

`watchEffect` provides a cleanup mechanism for invalidating side effects:

```javascript
import { ref, watchEffect } from 'vue'

const searchQuery = ref('')

watchEffect((onCleanup) => {
  const controller = new AbortController()

  fetch(`/api/search?q=${searchQuery.value}`, {
    signal: controller.signal
  })
    .then(response => response.json())
    .then(data => {
      // Handle results
    })

  // Cleanup function runs before effect re-runs or component unmounts
  onCleanup(() => {
    controller.abort()
  })
})
```

### Stopping a Watcher

Both `watch` and `watchEffect` return a stop function:

```javascript
import { watchEffect, ref } from 'vue'

const count = ref(0)

const stop = watchEffect(() => {
  console.log(count.value)
})

// Later, stop the watcher
stop()

// Changes no longer trigger the effect
count.value++ // No log output
```

### watchEffect vs watch

| Feature | watchEffect | watch |
|---------|-------------|-------|
| Dependency tracking | Automatic | Explicit |
| Access to old value | No | Yes |
| Immediate execution | Yes (default) | No (configurable) |
| Best for | Side effects with auto-tracking | Explicit data observation |

## Reactivity Utilities

### toRef and toRefs

Convert reactive object properties to refs while maintaining the reactive connection:

```javascript
import { reactive, toRef, toRefs } from 'vue'

const state = reactive({
  foo: 1,
  bar: 2
})

// toRef: convert a single property
const fooRef = toRef(state, 'foo')
fooRef.value++ // state.foo also changes
console.log(state.foo) // 2

// toRefs: convert entire object
const stateAsRefs = toRefs(state)
// { foo: Ref<number>, bar: Ref<number> }

state.foo++
console.log(stateAsRefs.foo.value) // 3

stateAsRefs.bar.value++
console.log(state.bar) // 3

// Common use case: composable return values
function useFeatureX() {
  const state = reactive({
    foo: 1,
    bar: 2
  })

  // Convert to refs for destructuring support
  return toRefs(state)
}

// Destructuring maintains reactivity
const { foo, bar } = useFeatureX()
```

### shallowRef and shallowReactive

Create shallow reactive proxies that only track top-level properties:

```javascript
import { shallowRef, shallowReactive, triggerRef } from 'vue'

// shallowRef: only .value assignment triggers reactivity
const state = shallowRef({ count: 1 })

// Won't trigger updates
state.value.count = 2

// Will trigger updates
state.value = { count: 2 }

// Force trigger updates
state.value.count = 3
triggerRef(state)

// shallowReactive: only top-level properties are reactive
const shallow = shallowReactive({
  nested: { count: 1 }
})

// Will trigger updates
shallow.nested = { count: 2 }

// Won't trigger updates
shallow.nested.count = 3
```

### readonly and shallowReadonly

Create read-only reactive proxies:

```javascript
import { reactive, readonly, shallowReadonly } from 'vue'

const original = reactive({ count: 0, nested: { value: 1 } })

// Deep readonly
const copy = readonly(original)
copy.count++ // Warning! Read-only property
copy.nested.value++ // Warning! Also read-only

// Shallow readonly
const shallowCopy = shallowReadonly(original)
shallowCopy.count++ // Warning
shallowCopy.nested.value++ // Allowed (not protected)
```

### markRaw and toRaw

```javascript
import { reactive, markRaw, toRaw } from 'vue'

// markRaw: mark an object to never be converted to a proxy
const rawObj = markRaw({ foo: 1 })
const state = reactive({ raw: rawObj })
console.log(state.raw === rawObj) // true, not proxied

// toRaw: get the original object from a reactive proxy
const original = { count: 0 }
const proxy = reactive(original)
console.log(toRaw(proxy) === original) // true

// Use case: avoid overhead for large immutable data
const hugeData = markRaw(fetchHugeDataset())
```

### Type Check Utilities

```javascript
import { ref, reactive, isRef, isReactive, isProxy, isReadonly } from 'vue'

const refValue = ref(0)
const reactiveValue = reactive({ count: 0 })
const readonlyValue = readonly(reactiveValue)

isRef(refValue) // true
isReactive(reactiveValue) // true
isProxy(reactiveValue) // true
isProxy(refValue) // false
isReadonly(readonlyValue) // true
```

### unref and isRef

```javascript
import { ref, unref, isRef } from 'vue'

const count = ref(0)
const plainValue = 10

// unref: unwrap ref or return value as-is
console.log(unref(count)) // 0
console.log(unref(plainValue)) // 10

// Useful in composables that accept both ref and plain values
function useDouble(value) {
  return computed(() => unref(value) * 2)
}

useDouble(count) // works
useDouble(10) // also works
```

## Composition API Patterns

### Composable Functions

Composables are functions that encapsulate and reuse stateful logic:

```javascript
// useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  const double = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function reset() {
    count.value = initialValue
  }

  return {
    count,
    double,
    increment,
    decrement,
    reset
  }
}

// Usage in component
import { useCounter } from './useCounter'

export default {
  setup() {
    const { count, double, increment, decrement, reset } = useCounter(10)

    return {
      count,
      double,
      increment,
      decrement,
      reset
    }
  }
}
```

### Data Fetching Composable

```javascript
// useFetch.js
import { ref, watchEffect, toValue } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)

  watchEffect(async (onCleanup) => {
    // Reset state
    data.value = null
    error.value = null
    loading.value = true

    const controller = new AbortController()

    onCleanup(() => {
      controller.abort()
    })

    try {
      // toValue() handles both refs and plain values
      const response = await fetch(toValue(url), {
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      data.value = await response.json()
    } catch (e) {
      if (e.name !== 'AbortError') {
        error.value = e
      }
    } finally {
      loading.value = false
    }
  })

  return { data, error, loading }
}

// Usage
const userId = ref(1)
const { data: user, error, loading } = useFetch(
  () => `/api/users/${userId.value}`
)

// Automatically refetches when userId changes
userId.value = 2
```

### Event Listener Composable

```javascript
// useEventListener.js
import { onMounted, onUnmounted, unref } from 'vue'

export function useEventListener(target, event, handler, options) {
  onMounted(() => {
    const el = unref(target)
    el.addEventListener(event, handler, options)
  })

  onUnmounted(() => {
    const el = unref(target)
    el.removeEventListener(event, handler, options)
  })
}

// Usage
import { ref } from 'vue'
import { useEventListener } from './useEventListener'

export default {
  setup() {
    const buttonRef = ref(null)

    useEventListener(window, 'resize', () => {
      console.log('Window resized')
    })

    useEventListener(buttonRef, 'click', () => {
      console.log('Button clicked')
    })

    return { buttonRef }
  }
}
```

### Local Storage Composable

```javascript
// useLocalStorage.js
import { ref, watch } from 'vue'

export function useLocalStorage(key, defaultValue) {
  // Read initial value from localStorage
  const stored = localStorage.getItem(key)
  const data = ref(stored ? JSON.parse(stored) : defaultValue)

  // Sync to localStorage on change
  watch(
    data,
    (newValue) => {
      if (newValue === null || newValue === undefined) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(newValue))
      }
    },
    { deep: true }
  )

  // Listen to storage events from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === key) {
      data.value = e.newValue ? JSON.parse(e.newValue) : defaultValue
    }
  })

  return data
}

// Usage
const theme = useLocalStorage('theme', 'light')
theme.value = 'dark' // Automatically persisted
```

## Common Pitfalls

### Destructuring Loses Reactivity

```javascript
const state = reactive({ count: 0 })

// Wrong: loses reactivity after destructuring
let { count } = state
count++ // state.count doesn't change

// Correct: use toRefs
const { count } = toRefs(state)
count.value++ // state.count changes

// Or use computed
const count = computed(() => state.count)
```

### Replacing Entire reactive Object

```javascript
let state = reactive({ count: 0 })

// Wrong: loses reactivity
state = reactive({ count: 1 })

// Correct: modify properties
state.count = 1

// Or use ref for the whole object
const state = ref({ count: 0 })
state.value = { count: 1 } // Maintains reactivity
```

### Async Callbacks and Stale State

```javascript
const state = reactive({ count: 0 })

// Caution: async operations may access stale values
setTimeout(() => {
  console.log(state.count) // Might not be the latest value
}, 1000)

// Better: use watch or watchEffect to react to changes
watchEffect(() => {
  console.log(state.count) // Always the latest value
})
```

### Array and Collection Types

```javascript
const list = reactive([1, 2, 3])

// Vue 3 supports index access
list[0] = 10 // Triggers updates

// Map and Set are also supported
const map = reactive(new Map())
map.set('key', 'value') // Triggers updates

const set = reactive(new Set())
set.add('item') // Triggers updates
```

### Primitive Values with reactive

```javascript
// Wrong: reactive doesn't work with primitives
const count = reactive(0) // No error, but no reactivity

// Correct: use ref for primitives
const count = ref(0)
count.value++ // Reactive
```

### Ref Unwrapping Behavior

```javascript
// Refs are auto-unwrapped in reactive objects
const count = ref(0)
const state = reactive({ count })

// No need for .value inside reactive
state.count++ // Works directly
console.log(state.count) // 1
console.log(count.value) // 1 (same reference)

// But arrays don't auto-unwrap refs
const arr = reactive([ref(0)])
console.log(arr[0].value) // Need .value
```

## Performance Considerations

### Avoid Making Everything Reactive

```javascript
// Unnecessary: immutable data doesn't need reactivity
const CONSTANTS = reactive({
  API_URL: 'https://api.example.com',
  MAX_ITEMS: 100
})

// Better: use plain objects for constants
const CONSTANTS = {
  API_URL: 'https://api.example.com',
  MAX_ITEMS: 100
}
```

### Use shallowRef for Large Data

```javascript
// Large datasets that update as a whole
import { shallowRef } from 'vue'

const hugeList = shallowRef([])

async function loadData() {
  const data = await fetchLargeDataset()
  // Replace entire array instead of tracking each item
  hugeList.value = data
}
```

### Batch Updates

Vue automatically batches synchronous state changes, but you can use `nextTick` for manual control:

```javascript
import { ref, nextTick } from 'vue'

const count = ref(0)
const message = ref('')

async function updateAll() {
  count.value++
  message.value = 'Updated'

  // Wait for DOM to update
  await nextTick()
  // DOM is now updated
}
```

### Use markRaw for Non-Reactive Data

```javascript
import { reactive, markRaw } from 'vue'

// Third-party library instances shouldn't be reactive
const state = reactive({
  // markRaw prevents proxy overhead
  chart: markRaw(new ChartLibrary()),
  editor: markRaw(new RichTextEditor())
})
```

### Computed vs Methods

```javascript
// Computed: cached, only recalculates when dependencies change
const sortedList = computed(() => {
  console.log('Sorting...') // Only logs when list changes
  return [...list.value].sort()
})

// Method: recalculates on every access
function getSortedList() {
  console.log('Sorting...') // Logs on every call
  return [...list.value].sort()
}
```

## Interview Key Points

### Core Comparison: Vue 2 vs Vue 3 Reactivity

| Aspect | Vue 2 (Object.defineProperty) | Vue 3 (Proxy) |
|--------|------------------------------|---------------|
| Property interception | Only defined properties | Any property |
| Adding properties | Requires Vue.set() | Automatic |
| Deleting properties | Requires Vue.delete() | Automatic |
| Array indices | Not supported | Supported |
| Array length | Not supported | Supported |
| Map/Set/WeakMap | Not supported | Supported |
| Performance | Recursive initialization | Lazy on-demand |
| Browser support | IE9+ | No IE (ES6 required) |

### Common Interview Questions

**Q1: Why did Vue 3 switch from Object.defineProperty to Proxy?**

Key points:
1. **More powerful interception**: Proxy can intercept 13 types of operations including read, write, delete, and enumeration
2. **Dynamic property support**: No pre-definition needed; new/deleted properties are automatically reactive
3. **Native array support**: Index modifications and length changes are detected
4. **Performance optimization**: Lazy proxy strategy means only accessed nested objects get proxied
5. **Cleaner code**: No need for recursive property traversal

**Q2: How does Vue 3's dependency collection work?**

Answer: Vue 3 uses a three-layer structure (WeakMap -> Map -> Set) to store dependencies:
- Outer WeakMap: key is the target object, value is a Map
- Middle Map: key is the property name, value is a Set
- Inner Set: stores all effect functions that depend on that property

When accessing reactive data, the `track` function adds the current active effect to the corresponding Set. When modifying data, the `trigger` function iterates through the Set and executes all effects.

**Q3: What's the difference between ref and reactive? How do you choose?**

Answer:
- `ref` can wrap any type, accessed via `.value`, supports whole replacement
- `reactive` only wraps objects, direct property access, doesn't support whole replacement
- `ref` auto-unwraps in templates, `reactive` requires maintaining object reference
- Recommendation: Use `ref` for primitives, `reactive` for complex objects, `ref` for composable returns

**Q4: How does computed's caching mechanism work?**

Answer: Computed uses a `dirty` flag internally:
1. Initially `dirty` is true; first access executes the getter and caches the result
2. After execution, `dirty` becomes false; subsequent accesses return cached value
3. When dependencies change, the scheduler sets `dirty` to true; next access recalculates

**Q5: What's the difference between watch and watchEffect?**

Answer:
- `watch` requires explicit sources, provides old and new values, lazy by default
- `watchEffect` auto-tracks dependencies, no old value, runs immediately
- Use `watch` when you need to compare values or watch specific sources
- Use `watchEffect` for automatic dependency tracking with side effects

**Q6: How do you avoid reactivity pitfalls?**

Key practices:
1. Use `toRefs` when destructuring reactive objects
2. Don't reassign reactive objects; modify properties instead
3. Use `ref` when you need to replace entire objects
4. Use `shallowRef`/`shallowReactive` for large, flat data
5. Use `markRaw` for third-party library instances

## Further Reading

### Official Resources

- [Vue 3 Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Reactivity API Reference](https://vuejs.org/api/reactivity-core.html)

### Source Code Study

- [@vue/reactivity](https://github.com/vuejs/core/tree/main/packages/reactivity) - Vue 3 reactivity core package
- [Vue 2 Observer Source](https://github.com/vuejs/vue/blob/dev/src/core/observer/index.js)

### Related Concepts

- [ES6 Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [ES6 Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect)
- [WeakMap and Garbage Collection](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)

### Recommended Reading

- "Vue.js Design and Implementation" by HuoChunYang
- [Vue Mastery - Vue 3 Reactivity](https://www.vuemastery.com/courses/vue-3-reactivity/)
- [Mini Vue Implementation](https://github.com/cuixiaorui/mini-vue)

### Related Articles in Code Wiki

- TypeScript Generics - For type-safe reactive state
- JavaScript Event Loop - Understanding async reactivity
- React Hooks - Comparing with React's state management approach

---

Understanding Vue's reactivity system deeply enables better usage of Vue in development and faster debugging when issues arise, leading to more efficient and robust code. The design principles of the reactivity system can also be applied to other scenarios, making it a fundamental concept in modern frontend development.
