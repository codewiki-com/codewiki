---
title: Alpine.js Lightweight Framework
description: Learn Alpine.js for adding interactivity to HTML
track: javascript
section: patterns-tooling
difficulty: beginner
tags:
  - Alpine.js
  - lightweight
  - interactivity
  - HTML
status: imported
origin: old/src/content/docs/frontend/alpinejs.en.md
divergence: 0.184
issues: []
legacy:
  category: Frontend
  subcategory: Libraries
  order: 43
  lastUpdated: 2026-01-07
---


## Introduction to Alpine.js

Alpine.js is a rugged, minimal JavaScript framework for composing behavior directly in your markup. It offers a lightweight alternative for adding interactivity to the modern web, providing the reactive and declarative nature of frameworks like Vue or React at a much lower cost. Think of it as "jQuery for the modern web" or "Tailwind for JavaScript."

### Why Choose Alpine.js?

- **Lightweight**: Only ~15KB minified and gzipped
- **No Build Step**: Works directly in HTML without compilation
- **Declarative**: Write behavior directly in your markup
- **Reactive**: Automatic DOM updates when data changes
- **Progressive Enhancement**: Perfect for server-rendered applications
- **Easy Learning Curve**: Familiar syntax for Vue.js developers

### Installation

#### Via CDN (Simplest)

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

#### Via npm

```bash
npm install alpinejs
```

```javascript
import Alpine from 'alpinejs'

window.Alpine = Alpine
Alpine.start()
```

## Core Directives

Alpine.js provides a set of directives that you add to your HTML elements to create interactive behavior.

### x-data: Defining Component State

The `x-data` directive declares a new Alpine component and defines its reactive data.

```html
<div x-data="{ open: false }">
    <button @click="open = !open">Toggle Content</button>

    <div x-show="open">
        Content...
    </div>
</div>
```

#### With Methods

You can include methods within the data object:

```html
<div x-data="{
    open: false,
    toggle() {
        this.open = !this.open
    }
}">
    <button @click="toggle()">Toggle Content</button>

    <div x-show="open">
        Content...
    </div>
</div>
```

#### With Getters (Computed Properties)

Use JavaScript getters to create computed properties:

```html
<div x-data="{
    open: false,
    get isOpen() { return this.open },
    toggle() { this.open = !this.open }
}">
    <button @click="toggle()">Toggle Content</button>

    <div x-show="isOpen">
        Content...
    </div>
</div>
```

### x-bind: Dynamic Attributes

The `x-bind` directive binds an HTML attribute to a JavaScript expression.

```html
<div x-data="{ placeholder: 'Type here...' }">
    <input type="text" x-bind:placeholder="placeholder">
</div>
```

#### Shorthand Syntax

Use `:` as shorthand for `x-bind:`:

```html
<input type="text" :placeholder="placeholder">
<button :disabled="isLoading">Submit</button>
<div :class="{ 'active': isActive, 'hidden': !isVisible }"></div>
```

#### Binding Multiple Attributes

You can bind multiple attributes from an object:

```html
<div x-data="dropdown">
    <button x-bind="trigger">Open Dropdown</button>
    <span x-bind="dialogue">Dropdown Contents</span>
</div>

<script>
    document.addEventListener('alpine:init', () => {
        Alpine.data('dropdown', () => ({
            open: false,

            trigger: {
                ['x-ref']: 'trigger',
                ['@click']() {
                    this.open = true
                },
            },

            dialogue: {
                ['x-show']() {
                    return this.open
                },
                ['@click.outside']() {
                    this.open = false
                },
            },
        }))
    })
</script>
```

### x-on: Event Handling

The `x-on` directive listens for DOM events.

```html
<div x-data="{ count: 0 }">
    <button x-on:click="count++">Increment</button>
    <span x-text="count"></span>
</div>
```

#### Shorthand Syntax

Use `@` as shorthand for `x-on:`:

```html
<button @click="count++">Increment</button>
<input @keyup.enter="submitForm()">
<form @submit.prevent="handleSubmit()">
```

#### Event Modifiers

Alpine supports various event modifiers:

```html
<!-- Prevent default behavior -->
<form @submit.prevent="handleSubmit()">

<!-- Stop propagation -->
<button @click.stop="doSomething()">

<!-- Only trigger once -->
<button @click.once="initialize()">

<!-- Only when target is the element itself -->
<div @click.self="close()">

<!-- Key modifiers -->
<input @keyup.enter="submit()">
<input @keyup.escape="cancel()">

<!-- Mouse modifiers -->
<button @click.left="leftClick()">
<button @click.right="rightClick()">

<!-- Debounce -->
<input @input.debounce.500ms="search()">

<!-- Throttle -->
<div @scroll.throttle.100ms="handleScroll()">

<!-- Outside click -->
<div @click.outside="closeDropdown()">

<!-- Window events -->
<div @resize.window="handleResize()">
```

### x-text and x-html: Content Binding

#### x-text

Sets the text content of an element:

```html
<div x-data="{ message: 'Hello, Alpine!' }">
    <span x-text="message"></span>
</div>
```

#### x-html

Sets the inner HTML content of an element.

> **Security Warning**: The `x-html` directive renders raw HTML. Never use it with untrusted user input as this can lead to XSS (Cross-Site Scripting) vulnerabilities. Always sanitize HTML content using a library like DOMPurify before rendering.

```html
<div x-data="{ content: '<strong>Bold text</strong>' }">
    <div x-html="content"></div>
</div>
```

### x-model: Two-Way Data Binding

The `x-model` directive creates a two-way binding between form inputs and data.

```html
<div x-data="{ message: '' }">
    <input type="text" x-model="message">
    <span x-text="message"></span>
</div>
```

#### With Different Input Types

```html
<div x-data="{ selected: '', checked: false, multiSelect: [] }">
    <!-- Text input -->
    <input type="text" x-model="message">

    <!-- Checkbox -->
    <input type="checkbox" x-model="checked">

    <!-- Radio buttons -->
    <input type="radio" value="one" x-model="selected">
    <input type="radio" value="two" x-model="selected">

    <!-- Select -->
    <select x-model="selected">
        <option value="one">One</option>
        <option value="two">Two</option>
    </select>

    <!-- Multiple select -->
    <select multiple x-model="multiSelect">
        <option value="a">A</option>
        <option value="b">B</option>
    </select>
</div>
```

#### x-model Modifiers

```html
<!-- Lazy: sync on change event instead of input -->
<input x-model.lazy="message">

<!-- Number: cast value to number -->
<input type="number" x-model.number="age">

<!-- Debounce -->
<input x-model.debounce.500ms="search">

<!-- Throttle -->
<input x-model.throttle.500ms="value">
```

### x-show and x-if: Conditional Rendering

#### x-show

Toggles visibility using CSS `display` property:

```html
<div x-data="{ open: false }">
    <button @click="open = !open">Toggle</button>
    <div x-show="open">This content toggles</div>
</div>
```

#### x-if

Completely removes/adds elements from the DOM:

```html
<div x-data="{ open: false }">
    <button @click="open = !open">Toggle</button>

    <template x-if="open">
        <div>This element is conditionally rendered</div>
    </template>
</div>
```

Note: `x-if` must be used on a `<template>` tag.

### x-for: List Rendering

The `x-for` directive iterates over arrays:

```html
<div x-data="{ items: ['Apple', 'Banana', 'Cherry'] }">
    <ul>
        <template x-for="item in items">
            <li x-text="item"></li>
        </template>
    </ul>
</div>
```

#### With Index

```html
<template x-for="(item, index) in items">
    <li>
        <span x-text="index"></span>: <span x-text="item"></span>
    </li>
</template>
```

#### With Keys

For optimal performance, always provide a unique key:

```html
<template x-for="item in items" :key="item.id">
    <li x-text="item.name"></li>
</template>
```

#### Iterating Over Objects

```html
<ul x-data="{ car: { make: 'Jeep', model: 'Grand Cherokee', color: 'Black' } }">
    <template x-for="(value, key) in car">
        <li>
            <span x-text="key"></span>: <span x-text="value"></span>
        </li>
    </template>
</ul>
```

### x-transition: Animations

Alpine provides built-in transition classes:

```html
<div x-data="{ open: false }">
    <button @click="open = !open">Toggle</button>

    <div
        x-show="open"
        x-transition:enter="transition ease-out duration-300"
        x-transition:enter-start="opacity-0 transform scale-90"
        x-transition:enter-end="opacity-100 transform scale-100"
        x-transition:leave="transition ease-in duration-300"
        x-transition:leave-start="opacity-100 transform scale-100"
        x-transition:leave-end="opacity-0 transform scale-90"
    >
        Animated content
    </div>
</div>
```

#### Shorthand Transitions

```html
<!-- Default fade transition -->
<div x-show="open" x-transition>Content</div>

<!-- With modifiers -->
<div x-show="open" x-transition.duration.500ms>Content</div>
<div x-show="open" x-transition.opacity>Fade only</div>
<div x-show="open" x-transition.scale.75>Scale from 75%</div>
```

### x-init: Initialization

The `x-init` directive runs code when a component is initialized:

```html
<div x-data="{ posts: [] }" x-init="posts = await (await fetch('/api/posts')).json()">
    <template x-for="post in posts">
        <h2 x-text="post.title"></h2>
    </template>
</div>
```

### x-effect: Reactive Side Effects

The `x-effect` directive runs code whenever its dependencies change:

```html
<div x-data="{ count: 0 }" x-effect="console.log('Count changed to: ' + count)">
    <button @click="count++">Increment</button>
</div>
```

### x-ref: Element References

The `x-ref` directive allows you to reference DOM elements:

```html
<div x-data>
    <input type="text" x-ref="input">
    <button @click="$refs.input.focus()">Focus Input</button>
</div>
```

### x-cloak: Hiding Until Ready

Prevents flash of uncompiled content:

```html
<style>
    [x-cloak] { display: none !important; }
</style>

<div x-data="{ ready: false }" x-cloak>
    <!-- Content won't flash before Alpine initializes -->
</div>
```

### x-ignore: Skip Alpine Processing

Tells Alpine to skip processing an element and its children:

```html
<div x-data="{ }">
    <div x-ignore>
        <!-- Alpine will not process anything in here -->
        <span x-text="this won't work"></span>
    </div>
</div>
```

## Magic Properties

Alpine provides several magic properties prefixed with `$`.

### $el

References the current DOM element:

```html
<button @click="$el.textContent = 'Clicked!'">Click Me</button>
```

### $refs

Access elements marked with `x-ref`:

```html
<div x-data>
    <input x-ref="input" type="text">
    <button @click="$refs.input.focus()">Focus</button>
</div>
```

### $store

Access global Alpine stores:

```html
<div x-data :class="$store.darkMode.on && 'bg-black'">
    <button @click="$store.darkMode.toggle()">Toggle Dark Mode</button>
</div>
```

### $watch

Watch a property for changes:

```html
<div x-data="{ count: 0 }" x-init="$watch('count', value => console.log(value))">
    <button @click="count++">Increment</button>
</div>
```

### $dispatch

Dispatch custom browser events:

```html
<div @notify="alert($event.detail.message)">
    <button @click="$dispatch('notify', { message: 'Hello World!' })">
        Notify
    </button>
</div>
```

#### Inter-Component Communication

```html
<div
    x-data="{ title: 'Hello' }"
    @set-title.window="title = $event.detail"
>
    <h1 x-text="title"></h1>
</div>

<div x-data>
    <button @click="$dispatch('set-title', 'Hello World!')">
        Update Title
    </button>
</div>
```

### $nextTick

Execute code after Alpine finishes updating the DOM:

```html
<div x-data="{ message: 'Hello' }">
    <button @click="
        message = 'Updated';
        $nextTick(() => console.log($el.innerText));
    ">
        Update
    </button>
    <span x-text="message"></span>
</div>
```

### $root

Access the root element of the component:

```html
<div x-data>
    <button @click="$root.classList.toggle('active')">Toggle</button>
</div>
```

### $data

Access the component's data object:

```html
<div x-data="{ count: 0 }">
    <button @click="console.log($data)">Log Data</button>
</div>
```

### $id

Generate unique IDs for accessibility:

```html
<div x-data>
    <label :for="$id('input')">Name</label>
    <input :id="$id('input')" type="text">
</div>
```

## Global State with Alpine.store

### Defining a Store

```javascript
document.addEventListener('alpine:init', () => {
    Alpine.store('tabs', {
        current: 'first',
        items: ['first', 'second', 'third'],
    })

    Alpine.store('darkMode', {
        on: false,
        toggle() {
            this.on = !this.on
        }
    })
})
```

### Using a Store

```html
<div x-data>
    <!-- Reading store data -->
    <span x-text="$store.tabs.current"></span>

    <!-- Modifying store data -->
    <button @click="$store.tabs.current = 'second'">
        Go to Second
    </button>

    <!-- Using store methods -->
    <button @click="$store.darkMode.toggle()">
        Toggle Dark Mode
    </button>
</div>
```

## Reusable Components with Alpine.data

### Defining Components

```javascript
document.addEventListener('alpine:init', () => {
    Alpine.data('dropdown', () => ({
        open: false,

        toggle() {
            this.open = !this.open
        },

        close() {
            this.open = false
        }
    }))
})
```

### Using Components

```html
<div x-data="dropdown">
    <button @click="toggle()">Open Menu</button>

    <div x-show="open" @click.outside="close()">
        Menu content...
    </div>
</div>
```

### Components with Parameters

```javascript
Alpine.data('counter', (initialCount = 0) => ({
    count: initialCount,

    increment() {
        this.count++
    },

    decrement() {
        this.count--
    }
}))
```

```html
<div x-data="counter(10)">
    <button @click="decrement()">-</button>
    <span x-text="count"></span>
    <button @click="increment()">+</button>
</div>
```

## Practical Examples

### Search Filter

```html
<div
    x-data="{
        search: '',
        items: ['foo', 'bar', 'baz'],
        get filteredItems() {
            return this.items.filter(
                i => i.startsWith(this.search)
            )
        }
    }"
>
    <input x-model="search" placeholder="Search...">

    <ul>
        <template x-for="item in filteredItems" :key="item">
            <li x-text="item"></li>
        </template>
    </ul>
</div>
```

### Modal Dialog

```html
<div x-data="{ showModal: false }">
    <button @click="showModal = true">Open Modal</button>

    <div
        x-show="showModal"
        x-transition.opacity
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        @click.self="showModal = false"
        @keydown.escape.window="showModal = false"
    >
        <div
            x-show="showModal"
            x-transition.scale
            class="bg-white p-6 rounded-lg max-w-md"
        >
            <h2 class="text-xl font-bold mb-4">Modal Title</h2>
            <p>Modal content goes here...</p>
            <button @click="showModal = false" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                Close
            </button>
        </div>
    </div>
</div>
```

### Tabs Component

```html
<div x-data="{ activeTab: 'tab1' }">
    <div class="flex space-x-4 border-b">
        <button
            @click="activeTab = 'tab1'"
            :class="{ 'border-b-2 border-blue-500': activeTab === 'tab1' }"
        >
            Tab 1
        </button>
        <button
            @click="activeTab = 'tab2'"
            :class="{ 'border-b-2 border-blue-500': activeTab === 'tab2' }"
        >
            Tab 2
        </button>
        <button
            @click="activeTab = 'tab3'"
            :class="{ 'border-b-2 border-blue-500': activeTab === 'tab3' }"
        >
            Tab 3
        </button>
    </div>

    <div class="py-4">
        <div x-show="activeTab === 'tab1'">Content for Tab 1</div>
        <div x-show="activeTab === 'tab2'">Content for Tab 2</div>
        <div x-show="activeTab === 'tab3'">Content for Tab 3</div>
    </div>
</div>
```

### Accordion

```html
<div x-data="{ activeIndex: null }">
    <div class="border rounded">
        <template x-for="(item, index) in [
            { title: 'Section 1', content: 'Content for section 1' },
            { title: 'Section 2', content: 'Content for section 2' },
            { title: 'Section 3', content: 'Content for section 3' }
        ]" :key="index">
            <div class="border-b last:border-b-0">
                <button
                    @click="activeIndex = activeIndex === index ? null : index"
                    class="w-full p-4 text-left flex justify-between items-center"
                >
                    <span x-text="item.title"></span>
                    <span x-text="activeIndex === index ? '-' : '+'"></span>
                </button>
                <div
                    x-show="activeIndex === index"
                    x-transition
                    class="p-4 bg-gray-50"
                >
                    <p x-text="item.content"></p>
                </div>
            </div>
        </template>
    </div>
</div>
```

### Form Validation

```html
<div x-data="{
    form: {
        email: '',
        password: ''
    },
    errors: {},

    validate() {
        this.errors = {}

        if (!this.form.email) {
            this.errors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(this.form.email)) {
            this.errors.email = 'Email is invalid'
        }

        if (!this.form.password) {
            this.errors.password = 'Password is required'
        } else if (this.form.password.length < 8) {
            this.errors.password = 'Password must be at least 8 characters'
        }

        return Object.keys(this.errors).length === 0
    },

    submit() {
        if (this.validate()) {
            console.log('Form submitted:', this.form)
        }
    }
}">
    <form @submit.prevent="submit()">
        <div class="mb-4">
            <label for="email">Email</label>
            <input
                id="email"
                type="email"
                x-model="form.email"
                :class="{ 'border-red-500': errors.email }"
                class="w-full border p-2 rounded"
            >
            <p x-show="errors.email" x-text="errors.email" class="text-red-500 text-sm mt-1"></p>
        </div>

        <div class="mb-4">
            <label for="password">Password</label>
            <input
                id="password"
                type="password"
                x-model="form.password"
                :class="{ 'border-red-500': errors.password }"
                class="w-full border p-2 rounded"
            >
            <p x-show="errors.password" x-text="errors.password" class="text-red-500 text-sm mt-1"></p>
        </div>

        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">
            Submit
        </button>
    </form>
</div>
```

### Fetch Data from API

```html
<div
    x-data="{
        posts: [],
        loading: true,
        error: null
    }"
    x-init="
        fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')
            .then(res => res.json())
            .then(data => {
                posts = data
                loading = false
            })
            .catch(err => {
                error = err.message
                loading = false
            })
    "
>
    <div x-show="loading">Loading...</div>
    <div x-show="error" x-text="error" class="text-red-500"></div>

    <ul x-show="!loading && !error">
        <template x-for="post in posts" :key="post.id">
            <li class="mb-4 p-4 border rounded">
                <h3 x-text="post.title" class="font-bold"></h3>
                <p x-text="post.body" class="text-gray-600"></p>
            </li>
        </template>
    </ul>
</div>
```

## Best Practices

### Keep Components Small

Break complex functionality into smaller, focused components:

```html
<!-- Instead of one large component -->
<div x-data="{ /* lots of data */ }">
    <!-- Everything in one place -->
</div>

<!-- Break it down -->
<div x-data="header">...</div>
<div x-data="sidebar">...</div>
<div x-data="content">...</div>
```

### Use Alpine.data for Reusability

```javascript
Alpine.data('toggle', () => ({
    open: false,
    toggle() {
        this.open = !this.open
    }
}))
```

### Use Stores for Shared State

```javascript
Alpine.store('user', {
    name: '',
    isLoggedIn: false,
    login(name) {
        this.name = name
        this.isLoggedIn = true
    }
})
```

### Leverage x-cloak

Always add the x-cloak CSS to prevent flash of unstyled content:

```css
[x-cloak] { display: none !important; }
```

### Use Modifiers Appropriately

```html
<!-- Debounce search inputs -->
<input x-model.debounce.300ms="search">

<!-- Prevent form submission default -->
<form @submit.prevent="handleSubmit()">

<!-- Outside clicks for dropdowns -->
<div @click.outside="open = false">
```

## Conclusion

Alpine.js provides a lightweight yet powerful way to add interactivity to your HTML. Its declarative syntax makes it easy to understand and maintain, while its small footprint keeps your pages fast. Whether you are enhancing server-rendered pages or building small interactive components, Alpine.js offers an excellent balance of simplicity and capability.

Key takeaways:
- Use `x-data` to define component state
- Use `x-bind` (`:`) and `x-on` (`@`) for attribute binding and event handling
- Use `x-model` for two-way data binding
- Use `x-show`/`x-if` for conditional rendering
- Use `x-for` for list rendering
- Use Alpine.store for global state
- Use Alpine.data for reusable components
- Leverage magic properties ($refs, $el, $dispatch, etc.) for advanced functionality
