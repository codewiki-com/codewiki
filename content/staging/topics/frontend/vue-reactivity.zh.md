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
origin: old/src/content/docs/frontend/vue-reactivity.zh.md
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

响应式系统是 Vue.js 框架的核心特性之一。它能够让数据变化自动驱动视图更新，大大简化了前端开发中的状态管理。本文将深入分析 Vue 3 响应式系统的实现原理，帮助开发者更好地理解和使用 Vue 的响应式能力。

## 概念解释

### 什么是响应式？

在 Vue 的上下文中，**响应式**指的是自动响应数据变化并执行相应操作的能力。当数据发生变化时，关联的视图会自动更新，网络请求会自动触发，计算属性会自动重新计算。

Vue 的响应式系统通过**运行时依赖追踪**而非静态代码分析来实现这一点。它使用 Proxy 包装器（Vue 3）或 getter/setter 函数（Vue 2）来拦截属性访问，从而实现依赖收集和变化通知。

### 响应式系统的核心概念

- **依赖追踪（Track）**：当读取响应式数据时，系统会收集当前正在执行的副作用函数
- **触发更新（Trigger）**：当修改响应式数据时，系统会通知所有依赖该数据的副作用函数重新执行
- **副作用函数**：依赖响应式数据且需要在数据变化时重新执行的函数

## Vue 2 与 Vue 3：Proxy 与 Object.defineProperty 对比

### Vue 2 的 Object.defineProperty 方案

Vue 2 使用 `Object.defineProperty` 来实现响应式系统。它通过劫持对象属性的 getter 和 setter 来实现依赖收集和变化通知。

```javascript
// 简化版 Vue 2 响应式实现
function defineReactive(obj, key, val) {
  const dep = new Dep() // 依赖收集器

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      // 依赖收集
      if (Dep.target) {
        dep.depend()
      }
      return val
    },
    set(newVal) {
      if (newVal === val) return
      val = newVal
      // 触发更新
      dep.notify()
    }
  })
}

// 依赖收集器
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

### Vue 2 方案的局限性

1. **无法检测属性的添加和删除**：需要使用 `Vue.set()` 和 `Vue.delete()`
2. **无法检测数组索引的直接修改**：`arr[0] = newValue` 不会触发更新
3. **无法检测数组长度的修改**：`arr.length = 0` 不会触发更新
4. **性能开销**：初始化时需要递归遍历所有属性

```javascript
// Vue 2 的解决方案
Vue.set(obj, 'newProperty', value)  // 添加新属性
Vue.delete(obj, 'property')         // 删除属性

// 数组变异方法被重写
// push, pop, shift, unshift, splice, sort, reverse
```

### Vue 3 的 Proxy 优势

Vue 3 使用 ES6 `Proxy` 来实现响应式系统，相比 `Object.defineProperty` 具有显著优势：

1. **可以拦截更多操作**：属性访问、赋值、删除、枚举等
2. **支持动态属性**：无需预定义，新属性自动具有响应式
3. **支持数组索引和长度修改**：原生支持各种数组操作
4. **惰性代理**：只有被访问的嵌套对象才会被代理，提高性能

### reactive() 的底层原理

```javascript
// 简化版 Vue 3 reactive 实现
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      // 依赖收集
      track(target, key)
      const result = Reflect.get(target, key, receiver)
      // 深度响应式：如果值是对象，递归代理
      if (typeof result === 'object' && result !== null) {
        return reactive(result)
      }
      return result
    },
    set(target, key, value, receiver) {
      const oldValue = target[key]
      const result = Reflect.set(target, key, value, receiver)
      // 只有值真正改变时才触发更新
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

### 依赖收集与触发实现

```javascript
// 全局依赖存储
const targetMap = new WeakMap()
// 当前活跃的副作用函数
let activeEffect = null

// 依赖收集
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

// 触发更新
function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep = depsMap.get(key)
  if (dep) {
    dep.forEach(effect => {
      // 避免无限循环
      if (effect !== activeEffect) {
        effect()
      }
    })
  }
}

// 副作用函数
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

## ref 与 reactive

### 理解 ref

`ref` 用于为原始值创建响应式引用，通过 `.value` 属性访问：

```javascript
import { ref } from 'vue'

// 创建 ref
const count = ref(0)
console.log(count.value) // 0

// 更新值
count.value++
console.log(count.value) // 1

// ref 也可以包装对象
const user = ref({ name: 'John', age: 30 })
user.value.age++ // 深度响应式有效
```

### ref 的内部原理

```javascript
// 简化版 ref 实现
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

### 理解 reactive

`reactive` 创建一个对象的深度响应式代理：

```javascript
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  user: {
    name: 'Vue',
    version: 3
  }
})

// 直接属性访问（无需 .value）
console.log(state.count) // 0
state.count++

// 嵌套对象也是响应式的
state.user.name = 'Vue 3'
```

### ref 与 reactive 对比

| 特性 | ref | reactive |
|---------|-----|----------|
| 支持类型 | 任意类型（包括原始值） | 仅对象 |
| 访问方式 | 需要 `.value` | 直接属性访问 |
| 解构 | 保持响应式 | 丢失响应式 |
| 模板使用 | 自动解包 | 直接使用 |
| 整体替换 | 支持 | 不支持（丢失响应式） |

```javascript
import { ref, reactive } from 'vue'

// ref 适用于原始值
const count = ref(0)
console.log(count.value) // 0
count.value++

// reactive 适用于对象
const state = reactive({
  name: 'Vue',
  version: 3
})
console.log(state.name) // 'Vue'

// ref 包装对象时内部使用 reactive
const objRef = ref({ count: 0 })
objRef.value.count++ // 深度响应式
```

### 何时选择 ref 或 reactive

**使用 ref 的场景：**
- 处理原始值（string、number、boolean）
- 需要替换整个对象
- 从组合式函数返回值
- 使用模板引用

**使用 reactive 的场景：**
- 处理复杂嵌套对象
- 管理表单数据
- 不需要完全替换的状态对象

## computed 与 watch

### computed：缓存的派生状态

`computed` 创建一个缓存的响应式引用，仅在依赖变化时重新计算：

```javascript
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// 只读计算属性
const fullName = computed(() => {
  console.log('Computing full name') // 仅在依赖变化时输出
  return `${firstName.value} ${lastName.value}`
})

console.log(fullName.value) // 'John Doe'
firstName.value = 'Jane'
console.log(fullName.value) // 'Jane Doe'

// 可写计算属性
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

### computed 的内部原理

```javascript
function computed(getter) {
  let value
  let dirty = true // 标记是否需要重新计算

  const effectFn = effect(getter, {
    lazy: true, // 惰性执行
    scheduler() {
      // 当依赖变化时，标记为脏
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

### watch：显式的副作用

`watch` 允许你在响应式数据变化时执行副作用：

```javascript
import { ref, reactive, watch } from 'vue'

const count = ref(0)

// 基本 watch
watch(count, (newValue, oldValue) => {
  console.log(`count 变化了: ${oldValue} -> ${newValue}`)
})

// 监听多个源
const firstName = ref('John')
const lastName = ref('Doe')

watch(
  [firstName, lastName],
  ([newFirst, newLast], [oldFirst, oldLast]) => {
    console.log('姓名变化了:', newFirst, newLast)
  }
)

// 监听 getter 函数
const user = reactive({ name: 'John', age: 30 })

watch(
  () => user.age,
  (newAge, oldAge) => {
    console.log(`年龄从 ${oldAge} 变为 ${newAge}`)
  }
)

// 深度监听响应式对象
watch(
  () => user,
  (newUser) => {
    console.log('用户变化了:', newUser)
  },
  { deep: true }
)
```

### watch 配置选项

```javascript
watch(source, callback, {
  immediate: true,  // 创建时立即执行回调
  deep: true,       // 深度监听嵌套属性
  flush: 'post',    // 回调时机: 'pre' | 'post' | 'sync'
  onTrack(e) {},    // 调试：当依赖被追踪时
  onTrigger(e) {},  // 调试：当回调被触发时
  once: true        // Vue 3.4+：仅执行一次
})
```

## watchEffect

### 自动依赖追踪

`watchEffect` 自动追踪回调中使用的所有响应式依赖：

```javascript
import { ref, watchEffect } from 'vue'

const count = ref(0)
const message = ref('Hello')

// 自动追踪 count 和 message
watchEffect(() => {
  console.log(`Count 是 ${count.value}, message 是 ${message.value}`)
})

// 触发副作用
count.value++ // 输出: "Count 是 1, message 是 Hello"
message.value = 'World' // 输出: "Count 是 1, message 是 World"
```

### 清理函数

`watchEffect` 提供了一个清理机制来使副作用失效：

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
      // 处理结果
    })

  // 清理函数在副作用重新执行或组件卸载前运行
  onCleanup(() => {
    controller.abort()
  })
})
```

### 停止侦听器

`watch` 和 `watchEffect` 都返回一个停止函数：

```javascript
import { watchEffect, ref } from 'vue'

const count = ref(0)

const stop = watchEffect(() => {
  console.log(count.value)
})

// 稍后停止侦听器
stop()

// 变化不再触发副作用
count.value++ // 无输出
```

### watchEffect 与 watch 对比

| 特性 | watchEffect | watch |
|---------|-------------|-------|
| 依赖追踪 | 自动 | 显式 |
| 访问旧值 | 否 | 是 |
| 立即执行 | 是（默认） | 否（可配置） |
| 最适用于 | 自动追踪的副作用 | 显式数据观察 |

## 响应式工具函数

### toRef 和 toRefs

将响应式对象属性转换为 ref，同时保持响应式连接：

```javascript
import { reactive, toRef, toRefs } from 'vue'

const state = reactive({
  foo: 1,
  bar: 2
})

// toRef：转换单个属性
const fooRef = toRef(state, 'foo')
fooRef.value++ // state.foo 也会变化
console.log(state.foo) // 2

// toRefs：转换整个对象
const stateAsRefs = toRefs(state)
// { foo: Ref<number>, bar: Ref<number> }

state.foo++
console.log(stateAsRefs.foo.value) // 3

stateAsRefs.bar.value++
console.log(state.bar) // 3

// 常见用例：组合式函数返回值
function useFeatureX() {
  const state = reactive({
    foo: 1,
    bar: 2
  })

  // 转换为 refs 以支持解构
  return toRefs(state)
}

// 解构保持响应式
const { foo, bar } = useFeatureX()
```

### shallowRef 和 shallowReactive

创建仅追踪顶层属性的浅层响应式代理：

```javascript
import { shallowRef, shallowReactive, triggerRef } from 'vue'

// shallowRef：仅 .value 赋值触发响应式
const state = shallowRef({ count: 1 })

// 不会触发更新
state.value.count = 2

// 会触发更新
state.value = { count: 2 }

// 强制触发更新
state.value.count = 3
triggerRef(state)

// shallowReactive：仅顶层属性是响应式的
const shallow = shallowReactive({
  nested: { count: 1 }
})

// 会触发更新
shallow.nested = { count: 2 }

// 不会触发更新
shallow.nested.count = 3
```

### readonly 和 shallowReadonly

创建只读的响应式代理：

```javascript
import { reactive, readonly, shallowReadonly } from 'vue'

const original = reactive({ count: 0, nested: { value: 1 } })

// 深度只读
const copy = readonly(original)
copy.count++ // 警告！只读属性
copy.nested.value++ // 警告！也是只读的

// 浅层只读
const shallowCopy = shallowReadonly(original)
shallowCopy.count++ // 警告
shallowCopy.nested.value++ // 允许（不受保护）
```

### markRaw 和 toRaw

```javascript
import { reactive, markRaw, toRaw } from 'vue'

// markRaw：标记对象永远不会被转换为代理
const rawObj = markRaw({ foo: 1 })
const state = reactive({ raw: rawObj })
console.log(state.raw === rawObj) // true，未被代理

// toRaw：从响应式代理获取原始对象
const original = { count: 0 }
const proxy = reactive(original)
console.log(toRaw(proxy) === original) // true

// 用例：避免大型不可变数据的开销
const hugeData = markRaw(fetchHugeDataset())
```

### 类型检查工具

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

### unref 和 isRef

```javascript
import { ref, unref, isRef } from 'vue'

const count = ref(0)
const plainValue = 10

// unref：解包 ref 或原样返回值
console.log(unref(count)) // 0
console.log(unref(plainValue)) // 10

// 在接受 ref 和普通值的组合式函数中很有用
function useDouble(value) {
  return computed(() => unref(value) * 2)
}

useDouble(count) // 有效
useDouble(10) // 也有效
```

## Composition API 模式

### 组合式函数

组合式函数是封装和复用有状态逻辑的函数：

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

// 在组件中使用
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

### 数据请求组合式函数

```javascript
// useFetch.js
import { ref, watchEffect, toValue } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)

  watchEffect(async (onCleanup) => {
    // 重置状态
    data.value = null
    error.value = null
    loading.value = true

    const controller = new AbortController()

    onCleanup(() => {
      controller.abort()
    })

    try {
      // toValue() 同时处理 ref 和普通值
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

// 使用
const userId = ref(1)
const { data: user, error, loading } = useFetch(
  () => `/api/users/${userId.value}`
)

// userId 变化时自动重新请求
userId.value = 2
```

### 事件监听组合式函数

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

// 使用
import { ref } from 'vue'
import { useEventListener } from './useEventListener'

export default {
  setup() {
    const buttonRef = ref(null)

    useEventListener(window, 'resize', () => {
      console.log('窗口大小改变了')
    })

    useEventListener(buttonRef, 'click', () => {
      console.log('按钮被点击了')
    })

    return { buttonRef }
  }
}
```

### 本地存储组合式函数

```javascript
// useLocalStorage.js
import { ref, watch } from 'vue'

export function useLocalStorage(key, defaultValue) {
  // 从 localStorage 读取初始值
  const stored = localStorage.getItem(key)
  const data = ref(stored ? JSON.parse(stored) : defaultValue)

  // 变化时同步到 localStorage
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

  // 监听来自其他标签页的 storage 事件
  window.addEventListener('storage', (e) => {
    if (e.key === key) {
      data.value = e.newValue ? JSON.parse(e.newValue) : defaultValue
    }
  })

  return data
}

// 使用
const theme = useLocalStorage('theme', 'light')
theme.value = 'dark' // 自动持久化
```

## 常见陷阱

### 解构丢失响应式

```javascript
const state = reactive({ count: 0 })

// 错误：解构后丢失响应式
let { count } = state
count++ // state.count 不会变化

// 正确：使用 toRefs
const { count } = toRefs(state)
count.value++ // state.count 会变化

// 或使用 computed
const count = computed(() => state.count)
```

### 替换整个 reactive 对象

```javascript
let state = reactive({ count: 0 })

// 错误：丢失响应式
state = reactive({ count: 1 })

// 正确：修改属性
state.count = 1

// 或使用 ref 包装整个对象
const state = ref({ count: 0 })
state.value = { count: 1 } // 保持响应式
```

### 异步回调与过时状态

```javascript
const state = reactive({ count: 0 })

// 注意：异步操作可能访问到过时的值
setTimeout(() => {
  console.log(state.count) // 可能不是最新值
}, 1000)

// 更好：使用 watch 或 watchEffect 响应变化
watchEffect(() => {
  console.log(state.count) // 始终是最新值
})
```

### 数组和集合类型

```javascript
const list = reactive([1, 2, 3])

// Vue 3 支持索引访问
list[0] = 10 // 触发更新

// Map 和 Set 也支持
const map = reactive(new Map())
map.set('key', 'value') // 触发更新

const set = reactive(new Set())
set.add('item') // 触发更新
```

### reactive 与原始值

```javascript
// 错误：reactive 不适用于原始值
const count = reactive(0) // 无错误，但无响应式

// 正确：对原始值使用 ref
const count = ref(0)
count.value++ // 响应式
```

### Ref 解包行为

```javascript
// Ref 在 reactive 对象中自动解包
const count = ref(0)
const state = reactive({ count })

// 在 reactive 内部无需 .value
state.count++ // 直接有效
console.log(state.count) // 1
console.log(count.value) // 1（相同引用）

// 但数组不会自动解包 ref
const arr = reactive([ref(0)])
console.log(arr[0].value) // 需要 .value
```

## 性能优化建议

### 避免使所有内容都响应式

```javascript
// 不必要：不可变数据不需要响应式
const CONSTANTS = reactive({
  API_URL: 'https://api.example.com',
  MAX_ITEMS: 100
})

// 更好：对常量使用普通对象
const CONSTANTS = {
  API_URL: 'https://api.example.com',
  MAX_ITEMS: 100
}
```

### 对大型数据使用 shallowRef

```javascript
// 整体更新的大型数据集
import { shallowRef } from 'vue'

const hugeList = shallowRef([])

async function loadData() {
  const data = await fetchLargeDataset()
  // 替换整个数组而不是追踪每个项
  hugeList.value = data
}
```

### 批量更新

Vue 自动批量处理同步状态变化，但你可以使用 `nextTick` 进行手动控制：

```javascript
import { ref, nextTick } from 'vue'

const count = ref(0)
const message = ref('')

async function updateAll() {
  count.value++
  message.value = 'Updated'

  // 等待 DOM 更新
  await nextTick()
  // DOM 现在已更新
}
```

### 对非响应式数据使用 markRaw

```javascript
import { reactive, markRaw } from 'vue'

// 第三方库实例不应该是响应式的
const state = reactive({
  // markRaw 避免代理开销
  chart: markRaw(new ChartLibrary()),
  editor: markRaw(new RichTextEditor())
})
```

### computed 与 methods 对比

```javascript
// Computed：有缓存，仅在依赖变化时重新计算
const sortedList = computed(() => {
  console.log('排序中...') // 仅在 list 变化时输出
  return [...list.value].sort()
})

// Method：每次访问都重新计算
function getSortedList() {
  console.log('排序中...') // 每次调用都输出
  return [...list.value].sort()
}
```

## 面试重点

### 核心对比：Vue 2 与 Vue 3 响应式

| 方面 | Vue 2 (Object.defineProperty) | Vue 3 (Proxy) |
|--------|------------------------------|---------------|
| 属性拦截 | 仅已定义属性 | 任意属性 |
| 添加属性 | 需要 Vue.set() | 自动 |
| 删除属性 | 需要 Vue.delete() | 自动 |
| 数组索引 | 不支持 | 支持 |
| 数组长度 | 不支持 | 支持 |
| Map/Set/WeakMap | 不支持 | 支持 |
| 性能 | 递归初始化 | 按需惰性代理 |
| 浏览器支持 | IE9+ | 不支持 IE（需要 ES6） |

### 常见面试题

**Q1：为什么 Vue 3 从 Object.defineProperty 切换到 Proxy？**

要点：
1. **更强大的拦截**：Proxy 可以拦截 13 种操作，包括读取、写入、删除和枚举
2. **动态属性支持**：无需预定义；新增/删除属性自动响应式
3. **原生数组支持**：可检测索引修改和长度变化
4. **性能优化**：惰性代理策略意味着只有被访问的嵌套对象才会被代理
5. **更清晰的代码**：无需递归属性遍历

**Q2：Vue 3 的依赖收集是如何工作的？**

答案：Vue 3 使用三层结构（WeakMap -> Map -> Set）来存储依赖：
- 外层 WeakMap：key 是目标对象，value 是一个 Map
- 中层 Map：key 是属性名，value 是一个 Set
- 内层 Set：存储所有依赖该属性的副作用函数

访问响应式数据时，`track` 函数将当前活跃副作用添加到对应 Set。修改数据时，`trigger` 函数遍历 Set 并执行所有副作用。

**Q3：ref 和 reactive 有什么区别？如何选择？**

答案：
- `ref` 可以包装任意类型，通过 `.value` 访问，支持整体替换
- `reactive` 只能包装对象，直接属性访问，不支持整体替换
- `ref` 在模板中自动解包，`reactive` 需要保持对象引用
- 建议：原始值用 `ref`，复杂对象用 `reactive`，组合式函数返回值用 `ref`

**Q4：computed 的缓存机制是如何工作的？**

答案：Computed 内部使用 `dirty` 标志：
1. 初始时 `dirty` 为 true；首次访问执行 getter 并缓存结果
2. 执行后 `dirty` 变为 false；后续访问返回缓存值
3. 依赖变化时，scheduler 将 `dirty` 设为 true；下次访问重新计算

**Q5：watch 和 watchEffect 有什么区别？**

答案：
- `watch` 需要显式源，提供新旧值，默认惰性
- `watchEffect` 自动追踪依赖，无旧值，立即执行
- 需要比较值或监听特定源时使用 `watch`
- 需要自动依赖追踪的副作用时使用 `watchEffect`

**Q6：如何避免响应式陷阱？**

关键实践：
1. 解构 reactive 对象时使用 `toRefs`
2. 不要重新赋值 reactive 对象；改为修改属性
3. 需要替换整个对象时使用 `ref`
4. 大型扁平数据使用 `shallowRef`/`shallowReactive`
5. 第三方库实例使用 `markRaw`

## 延伸阅读

### 官方资源

- [Vue 3 响应式基础](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [深入响应式系统](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [响应式 API 参考](https://vuejs.org/api/reactivity-core.html)

### 源码学习

- [@vue/reactivity](https://github.com/vuejs/core/tree/main/packages/reactivity) - Vue 3 响应式核心包
- [Vue 2 Observer 源码](https://github.com/vuejs/vue/blob/dev/src/core/observer/index.js)

### 相关概念

- [ES6 Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [ES6 Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect)
- [WeakMap 与垃圾回收](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)

### 推荐阅读

- 霍春阳《Vue.js 设计与实现》
- [Vue Mastery - Vue 3 Reactivity](https://www.vuemastery.com/courses/vue-3-reactivity/)
- [Mini Vue 实现](https://github.com/cuixiaorui/mini-vue)

### Code Wiki 相关文章

- TypeScript 泛型 - 类型安全的响应式状态
- JavaScript 事件循环 - 理解异步响应式
- React Hooks - 与 React 状态管理方法对比

---

深入理解 Vue 的响应式系统不仅能够更好地在开发中使用 Vue，还能在遇到问题时更快地调试，编写出更高效、更健壮的代码。响应式系统的设计原则也可以应用到其他场景，是现代前端开发中的基础概念。
