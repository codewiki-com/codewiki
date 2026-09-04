---
title: Alpine.js 轻量级框架
description: 学习Alpine.js为HTML添加交互性
track: javascript
section: patterns-tooling
difficulty: beginner
tags:
  - Alpine.js
  - 轻量级
  - 交互
  - HTML
status: imported
origin: old/src/content/docs/frontend/alpinejs.zh.md
divergence: 0.184
issues: []
legacy:
  category: Frontend
  subcategory: Libraries
  order: 43
  lastUpdated: 2026-01-07
---

Alpine.js 是一个轻量级的 JavaScript 框架，专为在 HTML 中直接添加交互行为而设计。它提供了类似 Vue 或 React 的响应式和声明式渲染能力，但体积更小、学习曲线更平缓，非常适合为现有 HTML 页面添加简单的交互功能。

## 为什么选择 Alpine.js

### 核心优势

- **轻量级**：压缩后仅约 15KB，无需构建步骤
- **声明式语法**：直接在 HTML 中编写交互逻辑
- **响应式**：数据变化自动更新 DOM
- **易学易用**：语法简洁，学习成本低
- **渐进增强**：可以逐步添加到现有项目中

### 适用场景

- 为静态页面添加简单交互
- 下拉菜单、模态框、标签页等 UI 组件
- 表单验证和动态表单
- 不需要完整 SPA 框架的小型项目
- 与后端模板引擎配合使用

## 安装与入门

### CDN 引入

最简单的方式是通过 CDN 引入：

```html
<!DOCTYPE html>
<html>
<head>
    <title>Alpine.js 示例</title>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body>
    <div x-data="{ message: '你好，Alpine.js！' }">
        <p x-text="message"></p>
    </div>
</body>
</html>
```

### NPM 安装

对于使用构建工具的项目：

```bash
npm install alpinejs
```

```javascript
// main.js
import Alpine from 'alpinejs'

window.Alpine = Alpine
Alpine.start()
```

## 核心指令

### x-data：定义组件状态

`x-data` 是 Alpine.js 的核心指令，用于定义组件的响应式数据：

```html
<!-- 基础用法 -->
<div x-data="{ count: 0 }">
    <span x-text="count"></span>
</div>

<!-- 复杂数据 -->
<div x-data="{
    user: { name: '张三', age: 25 },
    items: ['苹果', '香蕉', '橙子'],
    isActive: true
}">
    <p x-text="user.name"></p>
</div>

<!-- 使用方法 -->
<div x-data="{
    count: 0,
    increment() {
        this.count++
    },
    decrement() {
        this.count--
    }
}">
    <button @click="decrement">-</button>
    <span x-text="count"></span>
    <button @click="increment">+</button>
</div>
```

### x-bind：动态绑定属性

使用 `x-bind` 或简写 `:` 动态绑定 HTML 属性：

```html
<div x-data="{ imageUrl: '/images/photo.jpg', altText: '示例图片' }">
    <!-- 完整语法 -->
    <img x-bind:src="imageUrl" x-bind:alt="altText">

    <!-- 简写语法 -->
    <img :src="imageUrl" :alt="altText">
</div>

<!-- 动态 class 绑定 -->
<div x-data="{ isActive: true, hasError: false }">
    <!-- 对象语法 -->
    <div :class="{ 'active': isActive, 'error': hasError }">
        状态指示器
    </div>

    <!-- 三元表达式 -->
    <div :class="isActive ? 'bg-green-500' : 'bg-gray-500'">
        背景色切换
    </div>
</div>

<!-- 动态 style 绑定 -->
<div x-data="{ color: 'red', fontSize: '20px' }">
    <p :style="{ color: color, fontSize: fontSize }">
        动态样式文本
    </p>
</div>
```

### x-on：事件监听

使用 `x-on` 或简写 `@` 监听 DOM 事件：

```html
<div x-data="{ count: 0 }">
    <!-- 完整语法 -->
    <button x-on:click="count++">点击增加</button>

    <!-- 简写语法 -->
    <button @click="count++">点击增加</button>

    <span x-text="count"></span>
</div>

<!-- 事件修饰符 -->
<div x-data>
    <!-- 阻止默认行为 -->
    <form @submit.prevent="handleSubmit()">
        <button type="submit">提交</button>
    </form>

    <!-- 阻止冒泡 -->
    <div @click="alert('外层')">
        <button @click.stop="alert('内层')">点击</button>
    </div>

    <!-- 只触发一次 -->
    <button @click.once="doSomething()">只能点一次</button>

    <!-- 点击外部 -->
    <div x-data="{ open: false }">
        <button @click="open = true">打开菜单</button>
        <div x-show="open" @click.outside="open = false">
            菜单内容（点击外部关闭）
        </div>
    </div>
</div>

<!-- 键盘事件 -->
<div x-data>
    <input @keydown.enter="submitForm()" placeholder="按 Enter 提交">
    <input @keydown.escape="cancel()" placeholder="按 Esc 取消">
    <input @keydown.arrow-down="nextItem()" placeholder="方向键导航">
</div>
```

### x-text 和 x-html：内容渲染

```html
<div x-data="{ message: '纯文本内容', htmlContent: '<strong>粗体文本</strong>' }">
    <!-- 渲染纯文本（自动转义 HTML，推荐使用） -->
    <p x-text="message"></p>

    <!-- 渲染 HTML（注意：仅用于可信内容，存在 XSS 风险） -->
    <!-- 如需渲染用户输入的 HTML，请使用 DOMPurify 等库进行净化 -->
    <div x-html="htmlContent"></div>
</div>
```

### x-show：条件显示

`x-show` 通过切换 CSS `display` 属性来显示或隐藏元素：

```html
<div x-data="{ open: false }">
    <button @click="open = !open">切换显示</button>

    <div x-show="open">
        这个内容可以被切换显示/隐藏
    </div>
</div>

<!-- 配合过渡动画 -->
<div x-data="{ open: false }">
    <button @click="open = !open">切换</button>

    <div
        x-show="open"
        x-transition:enter="transition ease-out duration-300"
        x-transition:enter-start="opacity-0 transform scale-90"
        x-transition:enter-end="opacity-100 transform scale-100"
        x-transition:leave="transition ease-in duration-200"
        x-transition:leave-start="opacity-100 transform scale-100"
        x-transition:leave-end="opacity-0 transform scale-90"
    >
        带动画的内容
    </div>
</div>
```

### x-if：条件渲染

`x-if` 会真正从 DOM 中添加或移除元素：

```html
<div x-data="{ showContent: true }">
    <template x-if="showContent">
        <div>条件渲染的内容</div>
    </template>
</div>

<!-- 注意：x-if 必须用在 <template> 标签上 -->
```

### x-for：列表渲染

```html
<div x-data="{ items: ['苹果', '香蕉', '橙子'] }">
    <ul>
        <template x-for="item in items">
            <li x-text="item"></li>
        </template>
    </ul>
</div>

<!-- 带索引的遍历 -->
<div x-data="{ items: ['苹果', '香蕉', '橙子'] }">
    <ul>
        <template x-for="(item, index) in items" :key="index">
            <li>
                <span x-text="index + 1"></span>.
                <span x-text="item"></span>
            </li>
        </template>
    </ul>
</div>

<!-- 遍历对象数组 -->
<div x-data="{
    users: [
        { id: 1, name: '张三', age: 25 },
        { id: 2, name: '李四', age: 30 },
        { id: 3, name: '王五', age: 28 }
    ]
}">
    <ul>
        <template x-for="user in users" :key="user.id">
            <li>
                <span x-text="user.name"></span> -
                <span x-text="user.age"></span>岁
            </li>
        </template>
    </ul>
</div>

<!-- 数字范围遍历 -->
<div x-data>
    <template x-for="i in 5">
        <span x-text="i"></span>
    </template>
</div>
```

### x-model：双向数据绑定

```html
<div x-data="{ message: '' }">
    <input type="text" x-model="message" placeholder="输入内容">
    <p>你输入的是：<span x-text="message"></span></p>
</div>

<!-- 不同输入类型 -->
<div x-data="{
    text: '',
    checked: false,
    selected: '',
    multiSelect: [],
    radio: ''
}">
    <!-- 文本输入 -->
    <input type="text" x-model="text">

    <!-- 复选框 -->
    <input type="checkbox" x-model="checked">
    <span x-text="checked ? '已选中' : '未选中'"></span>

    <!-- 下拉选择 -->
    <select x-model="selected">
        <option value="">请选择</option>
        <option value="a">选项 A</option>
        <option value="b">选项 B</option>
    </select>

    <!-- 多选 -->
    <select x-model="multiSelect" multiple>
        <option value="a">选项 A</option>
        <option value="b">选项 B</option>
        <option value="c">选项 C</option>
    </select>

    <!-- 单选按钮 -->
    <input type="radio" x-model="radio" value="option1"> 选项 1
    <input type="radio" x-model="radio" value="option2"> 选项 2
</div>

<!-- 修饰符 -->
<div x-data="{ value: '' }">
    <!-- 延迟更新（失去焦点时更新） -->
    <input x-model.lazy="value">

    <!-- 转换为数字 -->
    <input x-model.number="value" type="number">

    <!-- 去除首尾空格 -->
    <input x-model.trim="value">

    <!-- 立即更新（输入时立即更新，而非等待 change 事件） -->
    <input x-model.fill="value">
</div>
```

### x-init：初始化

```html
<div x-data="{ users: [] }" x-init="users = await (await fetch('/api/users')).json()">
    <template x-for="user in users">
        <p x-text="user.name"></p>
    </template>
</div>

<!-- 组件初始化时执行 -->
<div x-data="{ ready: false }" x-init="setTimeout(() => ready = true, 1000)">
    <span x-show="!ready">加载中...</span>
    <span x-show="ready">加载完成！</span>
</div>
```

### x-effect：响应式副作用

```html
<div x-data="{ count: 0 }" x-effect="console.log('count 变为：', count)">
    <button @click="count++">增加</button>
    <span x-text="count"></span>
</div>

<!-- 自动监听依赖变化 -->
<div x-data="{ search: '', results: [] }"
     x-effect="results = filterItems(search)">
    <input x-model="search" placeholder="搜索...">
    <template x-for="result in results">
        <p x-text="result"></p>
    </template>
</div>
```

### x-ref：元素引用

```html
<div x-data>
    <input type="text" x-ref="input">
    <button @click="$refs.input.focus()">聚焦输入框</button>
</div>

<!-- 访问 DOM 元素 -->
<div x-data>
    <div x-ref="container">
        <p>一些内容</p>
    </div>
    <button @click="console.log($refs.container.textContent)">显示内容</button>
</div>
```

### x-cloak：隐藏未编译内容

在 Alpine.js 初始化之前隐藏元素，防止闪烁：

```html
<style>
    [x-cloak] { display: none !important; }
</style>

<div x-data="{ message: '加载完成' }" x-cloak>
    <p x-text="message"></p>
</div>
```

### x-transition：过渡动画

```html
<div x-data="{ open: false }">
    <button @click="open = !open">切换</button>

    <!-- 简化过渡 -->
    <div x-show="open" x-transition>
        淡入淡出效果
    </div>

    <!-- 自定义过渡时间 -->
    <div x-show="open" x-transition.duration.500ms>
        500毫秒过渡
    </div>

    <!-- 详细控制 -->
    <div x-show="open"
         x-transition:enter="transition ease-out duration-300"
         x-transition:enter-start="opacity-0 scale-95"
         x-transition:enter-end="opacity-100 scale-100"
         x-transition:leave="transition ease-in duration-200"
         x-transition:leave-start="opacity-100 scale-100"
         x-transition:leave-end="opacity-0 scale-95">
        详细过渡控制
    </div>
</div>
```

## 魔术属性

### $el：当前元素

```html
<button @click="$el.textContent = '已点击'">点击我</button>

<div x-data @click="console.log($el)">
    点击查看当前元素
</div>
```

### $refs：元素引用集合

```html
<div x-data>
    <input x-ref="username" type="text" placeholder="用户名">
    <input x-ref="password" type="password" placeholder="密码">
    <button @click="
        console.log($refs.username.value);
        console.log($refs.password.value);
    ">
        获取值
    </button>
</div>
```

### $store：全局状态

```html
<script>
document.addEventListener('alpine:init', () => {
    Alpine.store('user', {
        name: '访客',
        isLoggedIn: false,
        login(name) {
            this.name = name
            this.isLoggedIn = true
        },
        logout() {
            this.name = '访客'
            this.isLoggedIn = false
        }
    })
})
</script>

<div x-data>
    <span x-text="$store.user.name"></span>
    <button x-show="!$store.user.isLoggedIn" @click="$store.user.login('张三')">
        登录
    </button>
    <button x-show="$store.user.isLoggedIn" @click="$store.user.logout()">
        登出
    </button>
</div>
```

### $watch：监听数据变化

```html
<div x-data="{ count: 0 }" x-init="$watch('count', (value, oldValue) => {
    console.log('count 从', oldValue, '变为', value)
})">
    <button @click="count++">增加</button>
    <span x-text="count"></span>
</div>

<!-- 深度监听 -->
<div x-data="{ user: { name: '张三' } }" x-init="
    $watch('user', value => console.log(value), { deep: true })
">
    <input x-model="user.name">
</div>
```

### $dispatch：派发自定义事件

```html
<!-- 子组件派发事件 -->
<div x-data @custom-event="alert($event.detail.message)">
    <button x-data @click="$dispatch('custom-event', { message: '来自子组件的消息' })">
        派发事件
    </button>
</div>

<!-- 组件间通信 -->
<div x-data @notify="alert($event.detail)">
    <div x-data>
        <button @click="$dispatch('notify', '通知内容')">发送通知</button>
    </div>
</div>
```

### $nextTick：下一个 DOM 更新周期

```html
<div x-data="{ message: '初始值' }">
    <p x-ref="text" x-text="message"></p>
    <button @click="
        message = '新值';
        $nextTick(() => {
            console.log($refs.text.textContent) // 输出：新值
        })
    ">
        更新
    </button>
</div>
```

### $root：根元素

```html
<div x-data="{ name: '根组件' }">
    <div x-data="{ name: '子组件' }">
        <p x-text="name"></p> <!-- 输出：子组件 -->
        <p x-text="$root.__x.$data.name"></p> <!-- 访问根组件数据 -->
    </div>
</div>
```

### $data：组件数据对象

```html
<div x-data="{ foo: 'bar' }">
    <button @click="console.log($data)">打印数据</button>
</div>
```

### $id：生成唯一 ID

```html
<div x-data>
    <input :id="$id('input')" type="text">
    <label :for="$id('input')">标签</label>
</div>
```

## 全局状态管理（Stores）

### 定义 Store

```javascript
// 在 alpine:init 事件中定义
document.addEventListener('alpine:init', () => {
    // 简单值存储
    Alpine.store('darkMode', false)

    // 对象存储
    Alpine.store('cart', {
        items: [],
        total: 0,

        addItem(item) {
            this.items.push(item)
            this.calculateTotal()
        },

        removeItem(index) {
            this.items.splice(index, 1)
            this.calculateTotal()
        },

        calculateTotal() {
            this.total = this.items.reduce((sum, item) => sum + item.price, 0)
        },

        clear() {
            this.items = []
            this.total = 0
        }
    })

    // 带初始化逻辑的存储
    Alpine.store('settings', {
        theme: 'light',
        language: 'zh-CN',

        init() {
            // 从 localStorage 恢复设置
            const saved = localStorage.getItem('settings')
            if (saved) {
                const data = JSON.parse(saved)
                this.theme = data.theme || 'light'
                this.language = data.language || 'zh-CN'
            }
        },

        save() {
            localStorage.setItem('settings', JSON.stringify({
                theme: this.theme,
                language: this.language
            }))
        }
    })
})
```

### 使用 Store

```html
<!-- 切换深色模式 -->
<button x-data @click="$store.darkMode = !$store.darkMode">
    切换模式
</button>

<div x-data :class="$store.darkMode && 'dark'">
    <p>当前模式：<span x-text="$store.darkMode ? '深色' : '浅色'"></span></p>
</div>

<!-- 购物车示例 -->
<div x-data>
    <h3>购物车 (<span x-text="$store.cart.items.length"></span>)</h3>
    <ul>
        <template x-for="(item, index) in $store.cart.items" :key="index">
            <li>
                <span x-text="item.name"></span> -
                <span x-text="item.price"></span>元
                <button @click="$store.cart.removeItem(index)">删除</button>
            </li>
        </template>
    </ul>
    <p>总计：<span x-text="$store.cart.total"></span>元</p>
</div>

<!-- 添加商品 -->
<div x-data="{ product: { name: '苹果', price: 5 } }">
    <button @click="$store.cart.addItem({...product})">
        添加到购物车
    </button>
</div>
```

## 可复用组件

### Alpine.data() 定义组件

```javascript
document.addEventListener('alpine:init', () => {
    // 下拉菜单组件
    Alpine.data('dropdown', () => ({
        open: false,

        toggle() {
            this.open = !this.open
        },

        close() {
            this.open = false
        },

        trigger: {
            '@click'() {
                this.toggle()
            }
        },

        content: {
            'x-show'() {
                return this.open
            },
            '@click.outside'() {
                this.close()
            }
        }
    }))

    // 计数器组件
    Alpine.data('counter', (initialCount = 0) => ({
        count: initialCount,

        increment() {
            this.count++
        },

        decrement() {
            this.count--
        },

        reset() {
            this.count = initialCount
        }
    }))

    // 模态框组件
    Alpine.data('modal', () => ({
        open: false,

        show() {
            this.open = true
            document.body.style.overflow = 'hidden'
        },

        hide() {
            this.open = false
            document.body.style.overflow = ''
        }
    }))

    // 表单验证组件
    Alpine.data('form', () => ({
        data: {
            email: '',
            password: ''
        },
        errors: {},

        validate() {
            this.errors = {}

            if (!this.data.email) {
                this.errors.email = '邮箱不能为空'
            } else if (!/\S+@\S+\.\S+/.test(this.data.email)) {
                this.errors.email = '邮箱格式不正确'
            }

            if (!this.data.password) {
                this.errors.password = '密码不能为空'
            } else if (this.data.password.length < 6) {
                this.errors.password = '密码至少6位'
            }

            return Object.keys(this.errors).length === 0
        },

        submit() {
            if (this.validate()) {
                console.log('提交表单', this.data)
            }
        }
    }))
})
```

### 使用组件

```html
<!-- 下拉菜单 -->
<div x-data="dropdown">
    <button x-bind="trigger">
        打开菜单
    </button>
    <div x-bind="content">
        <a href="#">选项 1</a>
        <a href="#">选项 2</a>
        <a href="#">选项 3</a>
    </div>
</div>

<!-- 计数器（带初始值） -->
<div x-data="counter(10)">
    <button @click="decrement">-</button>
    <span x-text="count"></span>
    <button @click="increment">+</button>
    <button @click="reset">重置</button>
</div>

<!-- 模态框 -->
<div x-data="modal">
    <button @click="show">打开模态框</button>

    <div x-show="open" x-transition class="modal-overlay" @click.self="hide">
        <div class="modal-content">
            <h2>模态框标题</h2>
            <p>模态框内容...</p>
            <button @click="hide">关闭</button>
        </div>
    </div>
</div>

<!-- 表单验证 -->
<div x-data="form">
    <form @submit.prevent="submit">
        <div>
            <input type="email" x-model="data.email" placeholder="邮箱">
            <span x-show="errors.email" x-text="errors.email" class="error"></span>
        </div>
        <div>
            <input type="password" x-model="data.password" placeholder="密码">
            <span x-show="errors.password" x-text="errors.password" class="error"></span>
        </div>
        <button type="submit">提交</button>
    </form>
</div>
```

## 实用示例

### 搜索过滤列表

```html
<div x-data="{
    search: '',
    items: ['苹果', '香蕉', '橙子', '葡萄', '西瓜', '草莓'],

    get filteredItems() {
        return this.items.filter(item =>
            item.toLowerCase().includes(this.search.toLowerCase())
        )
    }
}">
    <input x-model="search" placeholder="搜索水果...">

    <ul>
        <template x-for="item in filteredItems" :key="item">
            <li x-text="item"></li>
        </template>
    </ul>

    <p x-show="filteredItems.length === 0">没有找到匹配的结果</p>
</div>
```

### 标签页切换

```html
<div x-data="{ activeTab: 'tab1' }">
    <div class="tabs">
        <button
            @click="activeTab = 'tab1'"
            :class="{ 'active': activeTab === 'tab1' }">
            标签 1
        </button>
        <button
            @click="activeTab = 'tab2'"
            :class="{ 'active': activeTab === 'tab2' }">
            标签 2
        </button>
        <button
            @click="activeTab = 'tab3'"
            :class="{ 'active': activeTab === 'tab3' }">
            标签 3
        </button>
    </div>

    <div class="tab-content">
        <div x-show="activeTab === 'tab1'" x-transition>
            <h3>标签 1 内容</h3>
            <p>这是第一个标签页的内容。</p>
        </div>
        <div x-show="activeTab === 'tab2'" x-transition>
            <h3>标签 2 内容</h3>
            <p>这是第二个标签页的内容。</p>
        </div>
        <div x-show="activeTab === 'tab3'" x-transition>
            <h3>标签 3 内容</h3>
            <p>这是第三个标签页的内容。</p>
        </div>
    </div>
</div>
```

### 手风琴组件

```html
<div x-data="{ openItem: null }">
    <div class="accordion">
        <div class="accordion-item">
            <button @click="openItem = openItem === 1 ? null : 1">
                问题 1
                <span x-text="openItem === 1 ? '-' : '+'"></span>
            </button>
            <div x-show="openItem === 1" x-transition>
                <p>这是问题 1 的答案内容。</p>
            </div>
        </div>

        <div class="accordion-item">
            <button @click="openItem = openItem === 2 ? null : 2">
                问题 2
                <span x-text="openItem === 2 ? '-' : '+'"></span>
            </button>
            <div x-show="openItem === 2" x-transition>
                <p>这是问题 2 的答案内容。</p>
            </div>
        </div>

        <div class="accordion-item">
            <button @click="openItem = openItem === 3 ? null : 3">
                问题 3
                <span x-text="openItem === 3 ? '-' : '+'"></span>
            </button>
            <div x-show="openItem === 3" x-transition>
                <p>这是问题 3 的答案内容。</p>
            </div>
        </div>
    </div>
</div>
```

### Todo 应用

```html
<div x-data="{
    todos: [],
    newTodo: '',
    filter: 'all',

    addTodo() {
        if (this.newTodo.trim()) {
            this.todos.push({
                id: Date.now(),
                text: this.newTodo.trim(),
                completed: false
            })
            this.newTodo = ''
        }
    },

    removeTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id)
    },

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id)
        if (todo) {
            todo.completed = !todo.completed
        }
    },

    get filteredTodos() {
        switch (this.filter) {
            case 'active':
                return this.todos.filter(t => !t.completed)
            case 'completed':
                return this.todos.filter(t => t.completed)
            default:
                return this.todos
        }
    },

    get remaining() {
        return this.todos.filter(t => !t.completed).length
    },

    clearCompleted() {
        this.todos = this.todos.filter(t => !t.completed)
    }
}">
    <h2>待办事项</h2>

    <form @submit.prevent="addTodo">
        <input
            x-model="newTodo"
            placeholder="添加新任务..."
            autofocus
        >
        <button type="submit">添加</button>
    </form>

    <ul>
        <template x-for="todo in filteredTodos" :key="todo.id">
            <li :class="{ 'completed': todo.completed }">
                <input
                    type="checkbox"
                    :checked="todo.completed"
                    @change="toggleTodo(todo.id)"
                >
                <span x-text="todo.text"></span>
                <button @click="removeTodo(todo.id)">删除</button>
            </li>
        </template>
    </ul>

    <div class="filters">
        <span x-text="remaining + ' 项未完成'"></span>
        <button @click="filter = 'all'" :class="{ active: filter === 'all' }">全部</button>
        <button @click="filter = 'active'" :class="{ active: filter === 'active' }">未完成</button>
        <button @click="filter = 'completed'" :class="{ active: filter === 'completed' }">已完成</button>
        <button @click="clearCompleted" x-show="todos.some(t => t.completed)">清除已完成</button>
    </div>
</div>
```

### 图片轮播

```html
<div x-data="{
    images: [
        '/images/slide1.jpg',
        '/images/slide2.jpg',
        '/images/slide3.jpg'
    ],
    current: 0,

    next() {
        this.current = (this.current + 1) % this.images.length
    },

    prev() {
        this.current = (this.current - 1 + this.images.length) % this.images.length
    },

    goTo(index) {
        this.current = index
    }
}" x-init="setInterval(() => next(), 5000)">
    <div class="carousel">
        <template x-for="(image, index) in images" :key="index">
            <img
                :src="image"
                x-show="current === index"
                x-transition:enter="transition ease-out duration-300"
                x-transition:enter-start="opacity-0"
                x-transition:enter-end="opacity-100"
            >
        </template>

        <button class="prev" @click="prev">&lt;</button>
        <button class="next" @click="next">&gt;</button>

        <div class="dots">
            <template x-for="(image, index) in images" :key="index">
                <button
                    @click="goTo(index)"
                    :class="{ 'active': current === index }"
                ></button>
            </template>
        </div>
    </div>
</div>
```

### 异步数据加载

```html
<div x-data="{
    posts: [],
    loading: false,
    error: null,
    page: 1,
    hasMore: true,

    async fetchPosts() {
        if (this.loading || !this.hasMore) return

        this.loading = true
        this.error = null

        try {
            const response = await fetch(`/api/posts?page=${this.page}`)
            if (!response.ok) throw new Error('加载失败')

            const data = await response.json()
            this.posts = [...this.posts, ...data.posts]
            this.hasMore = data.hasMore
            this.page++
        } catch (e) {
            this.error = e.message
        } finally {
            this.loading = false
        }
    }
}" x-init="fetchPosts()">
    <div class="posts">
        <template x-for="post in posts" :key="post.id">
            <article>
                <h3 x-text="post.title"></h3>
                <p x-text="post.excerpt"></p>
            </article>
        </template>
    </div>

    <div x-show="loading" class="loading">加载中...</div>
    <div x-show="error" x-text="error" class="error"></div>

    <button
        x-show="hasMore && !loading"
        @click="fetchPosts">
        加载更多
    </button>
</div>
```

## 与其他库集成

### 与 Tailwind CSS 配合

```html
<div x-data="{ open: false }" class="relative">
    <button
        @click="open = !open"
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
    >
        菜单
    </button>

    <div
        x-show="open"
        @click.outside="open = false"
        x-transition:enter="transition ease-out duration-200"
        x-transition:enter-start="opacity-0 translate-y-1"
        x-transition:enter-end="opacity-100 translate-y-0"
        x-transition:leave="transition ease-in duration-150"
        x-transition:leave-start="opacity-100 translate-y-0"
        x-transition:leave-end="opacity-0 translate-y-1"
        class="absolute mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
    >
        <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">选项 1</a>
        <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">选项 2</a>
        <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">选项 3</a>
    </div>
</div>
```

### 与 htmx 配合

```html
<div x-data="{ loading: false }">
    <button
        hx-get="/api/data"
        hx-target="#content"
        @htmx:before-request="loading = true"
        @htmx:after-request="loading = false"
        :disabled="loading"
    >
        <span x-show="!loading">加载数据</span>
        <span x-show="loading">加载中...</span>
    </button>

    <div id="content"></div>
</div>
```

## 最佳实践

### 保持组件简洁

```html
<!-- 好的做法：将逻辑提取到 Alpine.data -->
<script>
Alpine.data('userCard', () => ({
    user: null,
    loading: false,

    async fetchUser(id) {
        this.loading = true
        this.user = await (await fetch(`/api/users/${id}`)).json()
        this.loading = false
    }
}))
</script>

<div x-data="userCard" x-init="fetchUser(1)">
    <!-- 模板保持简洁 -->
</div>
```

### 合理使用 Store

```javascript
// 只将真正需要全局共享的状态放入 store
Alpine.store('auth', {
    user: null,
    token: null,

    async login(credentials) { /* ... */ },
    logout() { /* ... */ }
})

// 组件特定的状态保持在组件内部
Alpine.data('loginForm', () => ({
    email: '',
    password: '',
    error: null
}))
```

### 避免过深嵌套

```html
<!-- 避免 -->
<div x-data="{ a: { b: { c: { d: 'value' } } } }">
    <span x-text="a.b.c.d"></span>
</div>

<!-- 推荐 -->
<div x-data="{ value: 'value' }">
    <span x-text="value"></span>
</div>
```

## 总结

Alpine.js 是一个优秀的轻量级框架，适合在不需要完整 SPA 框架的场景下为 HTML 添加交互性。它的声明式语法简洁直观，学习成本低，与现有项目的集成也非常方便。

核心要点：
- 使用 `x-data` 定义响应式状态
- 使用 `x-bind`/`:` 绑定属性，`x-on`/`@` 监听事件
- 使用 `x-show`/`x-if` 控制显示，`x-for` 循环渲染
- 使用 `x-model` 实现双向绑定
- 使用魔术属性如 `$store`、`$refs`、`$dispatch` 扩展功能
- 使用 `Alpine.data()` 和 `Alpine.store()` 组织代码

Alpine.js 让你能够以最小的学习成本，为网页添加丰富的交互体验。
